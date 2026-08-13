#!/usr/bin/env node
/**
 * Retrofits scripts/variable-glossary.json identifier renaming onto ALREADY translated
 * content-<lang>/*.md files, in place — with zero DeepL API calls.
 *
 * Reuses segmentBody() from markdown-segmenter.mjs, which already renames glossary identifiers
 * as it splits each line into "raw" (untouched) vs "translate" (natural-language) pieces. The
 * only difference from an actual translation run: instead of sending "translate" pieces off for
 * translation, this script feeds them straight back through xmlToMdInline() unchanged — since
 * the file's own text is already correctly translated, there's nothing left to translate.
 *
 * Run with: node scripts/apply-variable-glossary.mjs <lang-code>
 * e.g.:     node scripts/apply-variable-glossary.mjs en
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { segmentBody, xmlToMdInline, readFrontmatterAndBody, listMarkdownFilesRecursive } from "./markdown-segmenter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const lang = process.argv[2];
if (!lang) {
    console.error("Usage: node scripts/apply-variable-glossary.mjs <lang-code>  (e.g. en)");
    process.exit(1);
}

const TARGET_CONTENT_DIR = path.join(ROOT, `content-${lang}`);
if (!fs.existsSync(TARGET_CONTENT_DIR)) {
    console.error(`No such directory: ${TARGET_CONTENT_DIR}`);
    process.exit(1);
}

function rewriteFile(filePath) {
    const relativePath = path.relative(TARGET_CONTENT_DIR, filePath);
    const originalRaw = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = readFrontmatterAndBody(filePath);
    const segments = segmentBody(body, lang);

    const outputLines = segments.map(segment => {
        if (segment.type === "raw")
            return segment.line;
        if (segment.type === "code-parts")
            return segment.parts.map(p => p.kind === "literal" ? p.text : xmlToMdInline(p.xmlText)).join("");
        return segment.prefix + xmlToMdInline(segment.xmlText);
    });

    const newRaw = frontmatter + outputLines.join("\n") + "\n";
    if (newRaw === originalRaw)
        return false;
    fs.writeFileSync(filePath, newRaw, "utf-8");
    console.log(`  ✓ ${relativePath}`);
    return true;
}

const files = listMarkdownFilesRecursive(TARGET_CONTENT_DIR);
console.log(`Applying variable glossary to ${files.length} file(s) in content-${lang}/ (no API calls)...`);
const changed = files.filter(rewriteFile).length;
console.log(`Done. ${changed} file(s) updated, ${files.length - changed} already up to date.`);
