#!/usr/bin/env node
/**
 * Translate every content/*.md file into a target language, via the DeepL API.
 *
 * Run with: node scripts/translate-content.mjs <lang-code>
 * e.g.:     node scripts/translate-content.mjs en
 *
 * - Only natural-language text is sent to DeepL: headings, paragraphs, list items,
 *   blockquotes, and comments inside fenced code blocks. Code itself is never touched.
 * - Inline `code`, **bold** and *italic* spans are converted to <code>/<b>/<i> tags before
 *   translation (DeepL's `tag_handling: xml` + `ignore_tags: code` keeps `<code>` content
 *   byte-for-byte untouched, while still translating the surrounding sentence correctly).
 * - Output mirrors content/ under content-<lang>/, and structure/struct.json is rebuilt
 *   for that language as structure/struct-<lang>.json.
 * - A per-language manifest (content-<lang>/.translation-cache.json) maps each source file
 *   to a hash of its content; unchanged files are skipped on re-runs, to save API quota.
 *
 * Requires a DEEPL_API_KEY in a local .env file (untracked — see .gitignore).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildStruct, writeStruct } from "./generate-struct.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
// TRANSLATE_SOURCE_DIR lets a dry run point at a small throwaway folder instead of content/,
// to sanity-check the script (and API quota usage) on a couple of files before a full run.
const SOURCE_CONTENT_DIR = process.env.TRANSLATE_SOURCE_DIR
    ? path.resolve(process.env.TRANSLATE_SOURCE_DIR)
    : path.join(ROOT, "content");

const lang = process.argv[2];
const langLabel = process.argv[3] ?? lang?.toUpperCase();
if (!lang) {
    console.error("Usage: node scripts/translate-content.mjs <lang-code> [\"Display name\"]  (e.g. en \"English\")");
    process.exit(1);
}

const TARGET_CONTENT_DIR = path.join(ROOT, `content-${lang}`);
const CACHE_PATH = path.join(TARGET_CONTENT_DIR, ".translation-cache.json");
const STRUCT_OUTPUT_PATH = path.join(ROOT, "structure", `struct-${lang}.json`);
const LANGUAGES_MANIFEST_PATH = path.join(ROOT, "structure", "languages.json");

/** Comment markers recognized per fenced-code-block language tag. */
const LINE_COMMENT_MARKERS = {
    bash: "#", sh: "#", shell: "#", python: "#", py: "#",
    javascript: "//", js: "//", php: "//", c: "//", cpp: "//", "c++": "//", java: "//",
};

function readEnvFile() {
    const envPath = path.join(ROOT, ".env");
    if (!fs.existsSync(envPath))
        return {};
    const env = {};
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            return;
        const sepIndex = trimmed.indexOf("=");
        if (sepIndex === -1)
            return;
        env[trimmed.slice(0, sepIndex).trim()] = trimmed.slice(sepIndex + 1).trim();
    });
    return env;
}

const env = { ...readEnvFile(), ...process.env };
const DEEPL_API_KEY = env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
    console.error("Missing DEEPL_API_KEY. Create a .env file at the project root with:\nDEEPL_API_KEY=your_key_here");
    process.exit(1);
}
// DeepL free-tier keys end in ":fx" and use a different host than paid keys.
const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

/**
 * Translate a batch of plain-text/XML strings in one API call.
 *
 * @param {string[]} texts
 * @returns {Promise<string[]>}
 */
export async function translateBatch(texts, attempt = 1) {
    if (!texts.length)
        return [];
    const body = new URLSearchParams();
    body.append("target_lang", lang.toUpperCase());
    body.append("source_lang", "FR");
    body.append("tag_handling", "xml");
    body.append("ignore_tags", "code");
    // Disambiguates French technical homonyms (e.g. "tableaux" = arrays vs. paintings,
    // "conditions" = conditionals vs. terms, "décorateurs" = decorators vs. interior designers)
    body.append("context", "Documentation technique de programmation informatique, destinée à des développeurs.");
    texts.forEach(text => body.append("text", text));

    const response = await fetch(DEEPL_URL, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` },
        body
    });
    if (response.status === 429 && attempt <= 5) {
        const delayMs = attempt * 3000;
        console.log(`  … rate-limited, retrying in ${delayMs / 1000}s (attempt ${attempt}/5)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return translateBatch(texts, attempt + 1);
    }
    if (!response.ok)
        throw new Error(`DeepL API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.translations.map(t => t.text);
}

/** Escapes the 3 characters that would otherwise break DeepL's XML tag-handling parser. */
function escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unescapeXml(text) {
    return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/**
 * Converts `code`, **bold**, *italic* markdown spans to <code>/<b>/<i> tags for the API call,
 * escaping any bare `<`/`>`/`&` (e.g. a redirection example like `` `< fichier.txt` ``) so the
 * result is well-formed XML. Code spans are pulled out before the bold/italic passes run (via
 * a null-char placeholder, which can't collide with real text) so a literal `*` inside one,
 * e.g. `` `*` ``, can never be mistaken for an emphasis marker.
 */
function mdInlineToXml(text) {
    const codeSpans = [];
    const withoutCode = text.replace(/`([^`]+)`/g, (_, code) => {
        codeSpans.push(code);
        return "\0" + (codeSpans.length - 1) + "\0";
    });
    const withEmphasis = escapeXml(withoutCode)
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>");
    return withEmphasis.replace(/\0(\d+)\0/g, (_, i) => `<code>${escapeXml(codeSpans[Number(i)])}</code>`);
}

/**
 * Converts <code>/<b>/<i> tags back to `code`, **bold**, *italic*, and un-escapes entities.
 * DeepL occasionally echoes an ignored <code> tag's content back wrapped in its own extra
 * pair of backticks — the trailing replace collapses any resulting double-backtick span
 * (`` ``for`` ``) down to a single one.
 */
function xmlToMdInline(text) {
    const md = text
        .replace(/<code>(.*?)<\/code>/g, "`$1`")
        .replace(/<b>(.*?)<\/b>/g, "**$1**")
        .replace(/<i>(.*?)<\/i>/g, "*$1*")
        .replace(/``([^`]+)``/g, "`$1`");
    return unescapeXml(md);
}

const headingRegex = /^(#{1,6}\s+)(.*)/;
const listRegex = /^(\s*(?:[*-]\s+|\d+\)\s+))(.*)/;
const quoteRegex = /^(>\s?)(.*)/;
const codeFenceRegex = /^```(\w*)/;

/**
 * Split a file's body into a list of segments: `{type: "raw", line}` for anything left
 * untouched, or `{type: "translate", prefix, xmlText}` for a piece of text to send to DeepL.
 *
 * @param {string} body
 * @returns {Array<{type: string, line?: string, prefix?: string, xmlText?: string}>}
 */
function segmentBody(body) {
    const segments = [];
    let inCodeBlock = false;
    let commentMarker = null;

    body.split("\n").forEach(line => {
        const fenceMatch = line.match(codeFenceRegex);
        if (fenceMatch) {
            inCodeBlock = !inCodeBlock;
            commentMarker = inCodeBlock ? LINE_COMMENT_MARKERS[fenceMatch[1].toLowerCase()] ?? null : null;
            segments.push({ type: "raw", line });
            return;
        }
        if (inCodeBlock) {
            if (commentMarker && !line.trimStart().startsWith(commentMarker + "!")) {
                const markerIndex = findCommentMarker(line, commentMarker);
                if (markerIndex !== -1) {
                    const prefix = line.slice(0, markerIndex + commentMarker.length) + " ";
                    const commentText = line.slice(markerIndex + commentMarker.length).trimStart();
                    if (commentText) {
                        segments.push({ type: "translate", prefix, xmlText: escapeXml(commentText) });
                        return;
                    }
                }
            }
            segments.push({ type: "raw", line });
            return;
        }
        if (line.trim() === "") {
            segments.push({ type: "raw", line });
            return;
        }
        for (const regex of [headingRegex, quoteRegex, listRegex]) {
            const match = line.match(regex);
            if (match) {
                segments.push({ type: "translate", prefix: match[1], xmlText: mdInlineToXml(match[2]) });
                return;
            }
        }
        segments.push({ type: "translate", prefix: "", xmlText: mdInlineToXml(line) });
    });
    return segments;
}

/**
 * Finds where a line comment starts, ignoring markers that appear inside a quoted string
 * (approximated by requiring an even number of quote characters before the marker).
 *
 * @param {string} line
 * @param {string} marker
 * @returns {number} index of the marker, or -1 if none found outside a string
 */
function findCommentMarker(line, marker) {
    let index = line.indexOf(marker);
    while (index !== -1) {
        const before = line.slice(0, index);
        const singleQuotes = (before.match(/'/g) ?? []).length;
        const doubleQuotes = (before.match(/"/g) ?? []).length;
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0)
            return index;
        index = line.indexOf(marker, index + 1);
    }
    return -1;
}

/**
 * @param {string} filePath
 * @returns {{frontmatter: string, body: string}}
 */
function readFrontmatterAndBody(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.startsWith("---"))
        return { frontmatter: "", body: raw.trim() };
    const parts = raw.split("---");
    return { frontmatter: `---${parts[1]}---\n\n`, body: parts.slice(2).join("---").trim() };
}

function listMarkdownFilesRecursive(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory())
            files = files.concat(listMarkdownFilesRecursive(fullPath));
        else if (entry.name.endsWith(".md"))
            files.push(fullPath);
    }
    return files;
}

function hashContent(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

async function translateFile(filePath, cache) {
    const relativePath = path.relative(SOURCE_CONTENT_DIR, filePath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const hash = hashContent(raw);
    if (cache[relativePath] === hash) {
        console.log(`  = ${relativePath} (unchanged, skipped)`);
        return;
    }

    const { frontmatter, body } = readFrontmatterAndBody(filePath);
    const segments = segmentBody(body);
    const toTranslate = segments.filter(s => s.type === "translate");
    const translated = await translateBatch(toTranslate.map(s => s.xmlText));

    let translationIndex = 0;
    const outputLines = segments.map(segment => {
        if (segment.type === "raw")
            return segment.line;
        const translatedText = xmlToMdInline(translated[translationIndex++]);
        return segment.prefix + translatedText;
    });

    const outputPath = path.join(TARGET_CONTENT_DIR, relativePath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, frontmatter + outputLines.join("\n") + "\n", "utf-8");
    cache[relativePath] = hash;
    console.log(`  ✓ ${relativePath}`);
}

/**
 * Collects every category/subject `label` in the struct tree (the `folder` field, used
 * for file paths, is left untouched), translates them all in one batch, and writes the
 * translations back in place.
 *
 * @param {{categories: Array}} struct
 */
async function translateStructLabels(struct) {
    const nodes = [];
    struct.categories.forEach(category => {
        if (category.id !== "acceuil")
            nodes.push(category);
        (category.subjects ?? []).forEach(subject => nodes.push(subject));
    });
    const translated = await translateBatch(nodes.map(node => node.label));
    nodes.forEach((node, i) => { node.label = translated[i]; });
}

/**
 * Registers this language in structure/languages.json (read by the front-end's language
 * switcher), adding it if new or updating its display name if it already exists.
 */
function updateLanguagesManifest() {
    const languages = fs.existsSync(LANGUAGES_MANIFEST_PATH)
        ? JSON.parse(fs.readFileSync(LANGUAGES_MANIFEST_PATH, "utf-8"))
        : [];
    const existing = languages.find(l => l.code === lang);
    if (existing)
        existing.label = langLabel;
    else
        languages.push({ code: lang, label: langLabel });
    fs.writeFileSync(LANGUAGES_MANIFEST_PATH, JSON.stringify(languages, null, 2) + "\n", "utf-8");
}

async function main() {
    const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) : {};
    const files = listMarkdownFilesRecursive(SOURCE_CONTENT_DIR);
    console.log(`Translating ${files.length} file(s) to "${lang}"...`);
    for (const filePath of files) {
        await translateFile(filePath, cache);
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    const struct = buildStruct(TARGET_CONTENT_DIR);
    await translateStructLabels(struct);
    writeStruct(struct, STRUCT_OUTPUT_PATH);
    updateLanguagesManifest();
    console.log(`Done. Translated content in content-${lang}/, structure in structure/struct-${lang}.json`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
