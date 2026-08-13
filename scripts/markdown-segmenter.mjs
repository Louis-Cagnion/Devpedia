/**
 * Splits a content/*.md file's body into natural-language segments (to translate) and
 * untouched segments (code, punctuation, markdown syntax), and renames recurring French
 * example identifiers (`nom`, `valeur`, `fichier`...) to their target-language equivalent
 * via scripts/variable-glossary.json.
 *
 * Extracted from what used to be the DeepL translation pipeline (removed once the API
 * subscription lapsed) — this part of it never called DeepL itself, it only prepared text
 * for translation and reassembled it afterward. Still used by apply-variable-glossary.mjs
 * to retrofit glossary renames onto already-translated content, with zero API calls.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Comment markers recognized per fenced-code-block language tag (a language may accept more than one — PHP allows both `//` and `#`). */
const LINE_COMMENT_MARKERS = {
    bash: ["#"], sh: ["#"], shell: ["#"], python: ["#"], py: ["#"], makefile: ["#"], yaml: ["#"], yml: ["#"],
    javascript: ["//"], js: ["//"], php: ["//", "#"], c: ["//"], cpp: ["//"], "c++": ["//"], java: ["//"], dockerfile: ["#"],
    sql: ["--"],
};

/**
 * Block-style comment delimiters recognized per fenced-code-block language tag — as opposed to
 * {@link LINE_COMMENT_MARKERS}' line-prefix style. Only OCaml today: it has no line-comment
 * syntax at all, comments are always `(* ... *)`, possibly spanning several lines.
 */
const BLOCK_COMMENT_MARKERS = {
    ocaml: { open: "(*", close: "*)" },
};

/**
 * @param {string} text
 * @returns {string} `text` lowercased with diacritics removed (e.g. "Âge" -> "age")
 */
function stripAccents(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Keyed by the accent-stripped form of each French entry, since real identifiers in code
// (`age`, `element`, `cle`...) never carry the accents their dictionary spelling would have
// (`âge`, `élément`, `clé`) — most languages don't allow accented characters in identifiers.
const VARIABLE_GLOSSARY = Object.fromEntries(
    Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, "variable-glossary.json"), "utf-8")))
        .map(([word, translations]) => [stripAccents(word), translations])
);

/**
 * @param {string} word a bare identifier token
 * @param {string} targetLang
 * @returns {string|null} its `targetLang` equivalent per the glossary, or null if not listed
 */
function glossaryTranslation(word, targetLang) {
    return VARIABLE_GLOSSARY[stripAccents(word)]?.[targetLang] ?? null;
}

/**
 * Reapplies `original`'s case convention to `translated` — ALL CAPS stays ALL CAPS (e.g. the
 * PHP constant-naming convention `NOM` -> `NAME`), Capitalized stays Capitalized, otherwise
 * `translated` is returned as-is (glossary entries are already lowercase snake_case).
 *
 * @param {string} original
 * @param {string} translated
 * @returns {string}
 */
function matchCase(original, translated) {
    if (original === original.toUpperCase() && original !== original.toLowerCase())
        return translated.toUpperCase();
    if (original[0] === original[0].toUpperCase() && original.slice(1) === original.slice(1).toLowerCase())
        return translated[0].toUpperCase() + translated.slice(1);
    return translated;
}

/**
 * Renames every bare identifier token found in `text` that matches a French variable name in
 * the glossary to its `targetLang` equivalent (e.g. `nom` -> `name`). Used on inline code spans
 * in prose, where any embedded quotes are already never sent to DeepL (ignore_tags on `<code>`),
 * so there's no separate natural-language content to protect from this substitution.
 *
 * @param {string} text
 * @param {string} targetLang
 * @returns {string}
 */
export function localizeIdentifiers(text, targetLang) {
    return text.replace(/[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*/g, word => {
        const translated = glossaryTranslation(word, targetLang);
        return translated ? matchCase(word, translated) : word;
    });
}

/**
 * Applies {@link localizeIdentifiers} to the `literal`-kind parts of a fenced-code-block line
 * already split by {@link extractCodeLineParts} — `translate`-kind parts (natural-language
 * string content headed to DeepL) are left untouched, and interpolated variable references
 * inside a string (e.g. `$nom` in `"Bonjour $nom"`) are `literal`-kind already, so renaming
 * them here keeps them in sync with a same-line identifier declared outside any string.
 *
 * @param {Array<{kind: string, text?: string, xmlText?: string}>} parts
 * @param {string} targetLang
 * @returns {Array<{kind: string, text?: string, xmlText?: string}>}
 */
function localizeCodePartsIdentifiers(parts, targetLang) {
    return parts.map(part => part.kind === "literal" ? { ...part, text: localizeIdentifiers(part.text, targetLang) } : part);
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
function mdInlineToXml(text, targetLang) {
    const codeSpans = [];
    const withoutCode = text.replace(/`([^`]+)`/g, (_, code) => {
        codeSpans.push(localizeIdentifiers(code, targetLang));
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
export function xmlToMdInline(text) {
    const md = text
        .replace(/<code>(.*?)<\/code>/g, "`$1`")
        .replace(/<b>(.*?)<\/b>/g, "**$1**")
        .replace(/<i>(.*?)<\/i>/g, "*$1*")
        .replace(/``([^`]+)``/g, "`$1`");
    return unescapeXml(md);
}

/**
 * Applies identifier localization to `parts`' literal pieces, then decides how the segment
 * should be emitted: as `code-parts` (reconstructed from `parts`) if anything needs DeepL
 * translation or the identifier renaming actually changed something, otherwise as `raw` — the
 * original `line` verbatim, byte-for-byte, for every line that needs no rewriting at all.
 *
 * @param {Array<{kind: string, text?: string, xmlText?: string}>} parts
 * @param {string} line the original, unmodified source line `parts` was derived from
 * @param {string} targetLang
 * @param {boolean} applyGlossary whether identifier renaming is safe here — false for a fenced
 *   block whose language has no registered comment marker (untagged, or e.g. html/css/sql/json),
 *   since without a reliable way to split code from a trailing comment, a glossary word could
 *   land inside natural-language comment prose instead of an actual identifier and corrupt it
 *   (e.g. renaming "chaîne" to "string" inside the French comment "chaîne le premier au second")
 * @returns {{type: string, line?: string, parts?: Array}}
 */
function finalizeCodeParts(parts, line, targetLang, applyGlossary) {
    if (!applyGlossary)
        return parts.some(p => p.kind === "translate") ? { type: "code-parts", parts } : { type: "raw", line };
    const literalTextBefore = parts.filter(p => p.kind === "literal").map(p => p.text).join("");
    const localizedParts = localizeCodePartsIdentifiers(parts, targetLang);
    const literalTextAfter = localizedParts.filter(p => p.kind === "literal").map(p => p.text).join("");
    return localizedParts.some(p => p.kind === "translate") || literalTextAfter !== literalTextBefore
        ? { type: "code-parts", parts: localizedParts }
        : { type: "raw", line };
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
 * @param {string} targetLang
 * @returns {Array<{type: string, line?: string, prefix?: string, xmlText?: string}>}
 */
export function segmentBody(body, targetLang) {
    const segments = [];
    let inCodeBlock = false;
    let commentMarkers = null;
    let blockMarkers = null;
    // Tracks a block comment (e.g. OCaml's `(* ... *)`) opened on an earlier line and not yet
    // closed — the block-comment equivalent of `inTemplateLiteral` below.
    let inBlockComment = false;
    let codeLang = null;
    // Tracks a JS template literal (`...`) opened on an earlier line and not yet closed —
    // e.g. `` const s = ` `` followed by prose lines and a closing `` ` `` on its own line.
    let inTemplateLiteral = false;

    body.split("\n").forEach(line => {
        const fenceMatch = line.match(codeFenceRegex);
        if (fenceMatch) {
            inCodeBlock = !inCodeBlock;
            codeLang = inCodeBlock ? fenceMatch[1].toLowerCase() : null;
            commentMarkers = inCodeBlock ? LINE_COMMENT_MARKERS[codeLang] ?? null : null;
            blockMarkers = inCodeBlock ? BLOCK_COMMENT_MARKERS[codeLang] ?? null : null;
            inBlockComment = false;
            inTemplateLiteral = false;
            segments.push({ type: "raw", line });
            return;
        }
        if (inCodeBlock) {
            if (blockMarkers) {
                const { parts, stillInComment } = splitByBlockComment(line, blockMarkers, inBlockComment, codeLang);
                inBlockComment = stillInComment;
                segments.push(finalizeCodeParts(parts, line, targetLang, true));
                return;
            }
            if (inTemplateLiteral) {
                const closeIndex = line.indexOf("`");
                if (closeIndex === -1) {
                    // still inside the template literal: the whole line is its content
                    segments.push(/[a-zA-ZÀ-ÿ]/.test(line)
                        ? { type: "code-parts", parts: [{ kind: "translate", xmlText: escapeXml(line) }] }
                        : { type: "raw", line });
                    return;
                }
                inTemplateLiteral = false;
                const before = line.slice(0, closeIndex);
                const after = line.slice(closeIndex + 1);
                const parts = [];
                if (before)
                    parts.push(/[a-zA-ZÀ-ÿ]/.test(before)
                        ? { kind: "translate", xmlText: escapeXml(before) }
                        : { kind: "literal", text: before });
                parts.push({ kind: "literal", text: "`" });
                if (after)
                    parts.push(...extractCodeLineParts(after, codeLang));
                segments.push(finalizeCodeParts(parts, line, targetLang, commentMarkers !== null));
                return;
            }

            let codePart = line;
            let commentXml = null;
            for (const marker of commentMarkers ?? []) {
                if (line.trimStart().startsWith(marker + "!"))
                    continue;
                const markerIndex = findCommentMarker(line, marker);
                if (markerIndex === -1)
                    continue;
                const commentText = line.slice(markerIndex + marker.length).trimStart();
                if (commentText) {
                    codePart = line.slice(0, markerIndex + marker.length);
                    commentXml = escapeXml(commentText);
                    break;
                }
            }

            let parts;
            const isJs = ["js", "javascript", "ts", "typescript"].includes((codeLang ?? "").toLowerCase());
            const backtickCount = (codePart.match(/`/g) ?? []).length;
            if (isJs && backtickCount % 2 === 1) {
                // an odd number of backticks means the last one opens a template literal
                // that isn't closed on this same line — it continues on the next line(s).
                const openIndex = codePart.lastIndexOf("`");
                parts = extractCodeLineParts(codePart.slice(0, openIndex), codeLang);
                parts.push({ kind: "literal", text: "`" });
                const rest = codePart.slice(openIndex + 1);
                if (rest)
                    parts.push(/[a-zA-ZÀ-ÿ]/.test(rest)
                        ? { kind: "translate", xmlText: escapeXml(rest) }
                        : { kind: "literal", text: rest });
                inTemplateLiteral = true;
            } else {
                parts = extractCodeLineParts(codePart, codeLang);
            }

            if (commentXml !== null) {
                parts.push({ kind: "literal", text: " " });
                parts.push({ kind: "translate", xmlText: commentXml });
            }
            segments.push(finalizeCodeParts(parts, line, targetLang, commentMarkers !== null));
            return;
        }
        if (line.trim() === "") {
            segments.push({ type: "raw", line });
            return;
        }
        for (const regex of [headingRegex, quoteRegex, listRegex]) {
            const match = line.match(regex);
            if (match) {
                segments.push({ type: "translate", prefix: match[1], xmlText: mdInlineToXml(match[2], targetLang) });
                return;
            }
        }
        segments.push({ type: "translate", prefix: "", xmlText: mdInlineToXml(line, targetLang) });
    });
    return segments;
}

/**
 * Splits a code-block line for a block-comment language (only OCaml today, see
 * {@link BLOCK_COMMENT_MARKERS}) into alternating code/comment parts, tracking whether a
 * comment opened on this line (or an earlier one) is still open at its end — a block comment
 * can span multiple lines, mirroring how `inTemplateLiteral` tracks a multi-line JS template
 * literal above. Comments are not nested here, unlike OCaml itself (the first `close` marker
 * always ends the comment): none of this project's own OCaml snippets nest a comment inside
 * another, so the extra bookkeeping isn't needed today.
 *
 * @param {string} line
 * @param {{open: string, close: string}} markers
 * @param {boolean} startInComment whether a comment opened on an earlier line is still open
 * @param {string} codeLang
 * @returns {{parts: Array<{kind: string, text?: string, xmlText?: string}>, stillInComment: boolean}}
 */
function splitByBlockComment(line, markers, startInComment, codeLang) {
    const parts = [];
    let inComment = startInComment;
    let cursor = 0;

    while (cursor < line.length) {
        if (inComment) {
            const closeIndex = line.indexOf(markers.close, cursor);
            const text = closeIndex === -1 ? line.slice(cursor) : line.slice(cursor, closeIndex);
            if (/[a-zA-ZÀ-ÿ]/.test(text))
                parts.push({ kind: "translate", xmlText: escapeXml(text) });
            else if (text)
                parts.push({ kind: "literal", text });
            if (closeIndex === -1)
                break;
            parts.push({ kind: "literal", text: markers.close });
            cursor = closeIndex + markers.close.length;
            inComment = false;
        } else {
            const openIndex = line.indexOf(markers.open, cursor);
            const codeText = openIndex === -1 ? line.slice(cursor) : line.slice(cursor, openIndex);
            if (codeText)
                parts.push(...extractCodeLineParts(codeText, codeLang));
            if (openIndex === -1)
                break;
            parts.push({ kind: "literal", text: markers.open });
            cursor = openIndex + markers.open.length;
            inComment = true;
        }
    }
    return { parts, stillInComment: inComment };
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

// Group 1: optional 0-2 letter prefix (f/F for Python f-strings, r/b/rb combos).
// Group 2: quote character (', ", or ` for JS template literals).
// Group 3: string content.
const stringLiteralRegex = /([a-zA-Z]{0,2})(["'`])((?:\\.|(?!\2).)*)\2/g;

/**
 * Returns the regex matching interpolation expressions for a given fenced-code-block
 * language and quote style, or null if that combination doesn't support interpolation
 * (e.g. PHP single-quoted strings, JS strings using ' or ", Python strings with no f-prefix).
 */
function getInterpolationRegex(codeLang, quoteChar, prefix) {
    const lang = (codeLang ?? "").toLowerCase();
    if (["js", "javascript", "ts", "typescript"].includes(lang) && quoteChar === "`")
        return /\$\{[^}]*\}/g;
    if (lang === "php" && quoteChar === '"')
        return /\{\$[^}]*\}|\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]*\]|->[A-Za-z_][A-Za-z0-9_]*)*/g;
    if (["python", "py"].includes(lang) && /f/i.test(prefix ?? ""))
        return /\{[^{}]*\}/g;
    // Bash/shell double-quoted strings interpolate $var, ${var} and $(command) — single-quoted
    // strings don't interpolate at all, so they're excluded (quoteChar === '"' only).
    if (["bash", "sh", "shell"].includes(lang) && quoteChar === '"')
        return /\$\{[^}]*\}|\$\([^)]*\)|\$[A-Za-z_][A-Za-z0-9_]*/g;
    return null;
}

/**
 * Splits string content into literal runs (interpolation expressions, kept as-is) and
 * text runs (surrounding natural language, to be translated).
 */
function splitInterpolatedContent(content, interpRegex) {
    if (!interpRegex)
        return [{ kind: "text", text: content }];
    const parts = [];
    let lastIndex = 0;
    let match;
    interpRegex.lastIndex = 0;
    while ((match = interpRegex.exec(content)) !== null) {
        if (match.index > lastIndex)
            parts.push({ kind: "text", text: content.slice(lastIndex, match.index) });
        parts.push({ kind: "literal", text: match[0] });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length)
        parts.push({ kind: "text", text: content.slice(lastIndex) });
    return parts;
}

/**
 * Splits a line of code into literal pieces (kept as-is) and translatable pieces (the
 * natural-language runs inside quoted strings). Strings with no letters (IDs, format
 * specifiers, codes) are left untouched. Interpolation expressions inside JS template
 * literals (`${x}`), PHP double-quoted strings ($x, {$x}), and Python f-strings ({x})
 * are detected via getInterpolationRegex and excluded from translation.
 */
function extractCodeLineParts(line, codeLang) {
    const parts = [];
    let lastIndex = 0;
    let match;
    stringLiteralRegex.lastIndex = 0;
    while ((match = stringLiteralRegex.exec(line)) !== null) {
        const [full, prefix, quote, content] = match;
        const start = match.index;
        if (start > lastIndex)
            parts.push({ kind: "literal", text: line.slice(lastIndex, start) });

        const interpRegex = getInterpolationRegex(codeLang, quote, prefix);
        const subParts = splitInterpolatedContent(content, interpRegex);
        const hasTranslatableText = subParts.some(p => p.kind === "text" && /[a-zA-ZÀ-ÿ]/.test(p.text));

        if (!hasTranslatableText) {
            parts.push({ kind: "literal", text: full });
        } else {
            parts.push({ kind: "literal", text: prefix + quote });
            subParts.forEach(p => {
                if (p.kind === "literal" || p.text.trim() === "" || !/[a-zA-ZÀ-ÿ]/.test(p.text))
                    parts.push({ kind: "literal", text: p.text });
                else
                    parts.push({ kind: "translate", xmlText: escapeXml(p.text) });
            });
            parts.push({ kind: "literal", text: quote });
        }
        lastIndex = start + full.length;
    }
    if (lastIndex < line.length)
        parts.push({ kind: "literal", text: line.slice(lastIndex) });
    return parts;
}

/**
 * @param {string} filePath
 * @returns {{frontmatter: string, body: string}}
 */
export function readFrontmatterAndBody(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.startsWith("---"))
        return { frontmatter: "", body: raw.trim() };
    const parts = raw.split("---");
    return { frontmatter: `---${parts[1]}---\n\n`, body: parts.slice(2).join("---").trim() };
}

export function listMarkdownFilesRecursive(dir) {
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
