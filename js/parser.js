import { createTag } from "./tags.js";
import { renderChartBlock } from "./charts.js";
import { splitFrontmatter } from "./frontmatter.js";
import { slugify } from "./text.js";

/**
 * @brief Strips a file's optional `---`-fenced frontmatter and returns its markdown body.
 *
 * @param {string} rawContent
 *
 * @returns {string}
 */
export function parseMdContent(rawContent) {
    return splitFrontmatter(rawContent).body;
}

/**
 * @brief Pulls a backslash-escaped punctuation character out of `line` before `transform` runs,
 * so it can never be mistaken for a markdown delimiter, then puts back the bare literal character.
 *
 * @param {string} line
 * @param {(withoutEscapes: string) => string} transform
 *
 * @returns {string}
 */
function withProtectedEscapes(line, transform) {
    const escaped = [];
    const withoutEscapes = line.replace(/\\([\\`*_{}\[\]()#+\-.!>|])/g, (_, char) => {
        escaped.push(char);
        return "\x01" + (escaped.length - 1) + "\x01";
    });
    return transform(withoutEscapes).replace(/\x01(\d+)\x01/g, (_, i) => escaped[Number(i)]);
}

/**
 * @brief Pulls `code` spans out of `line` before `transform` runs on the rest, so a literal `*`
 * inside a code span can never be mistaken for an emphasis marker, then reinserts each span
 * (wrapped by `wrapCode`) at its original position. Delimiters can be one or two backticks,
 * the longer form letting a code span contain a literal backtick.
 *
 * @param {string} line
 * @param {(withoutCode: string) => string} transform
 * @param {(code: string) => string} wrapCode
 *
 * @returns {string}
 */
function withProtectedCodeSpans(line, transform, wrapCode) {
    const spans = [];
    const withoutCode = line.replace(/(`{1,2})([\s\S]+?)\1/g, (_, fence, code) => {
        spans.push(code.trim());
        return "\0" + (spans.length - 1) + "\0";
    });
    return transform(withoutCode).replace(/\0(\d+)\0/g, (_, i) => wrapCode(spans[Number(i)]));
}

/**
 * @brief Escapes the characters that would otherwise be parsed as HTML markup when a string
 * is inserted via `innerHTML`: needed for inline code spans, whose content (e.g. a literal
 * `<table>` shown as an example) must render as visible text, not real markup.
 *
 * @param {string} text
 *
 * @returns {string}
 */
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * @brief Renders `[label](url)` as a real `<a>`. An internal cross-chapter link (`/?c=...`, cf.
 * README) gets `class="contentLink"` so router.js can intercept its clicks and navigate through
 * the SPA instead of reloading the page; anything else is treated as an external link and opens
 * in a new tab, `rel="noopener noreferrer"` guarding against tabnabbing (cf. HTML liens-et-images.md).
 *
 * @param {string} text
 *
 * @returns {string}
 */
function renderLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
        url.startsWith("/")
            ? `<a class="contentLink" href="${url}">${label}</a>`
            : `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
    );
}

function mdToHtmlFormatting(line) {
    return withProtectedEscapes(line, withoutEscapes =>
        withProtectedCodeSpans(
            withoutEscapes,
            text => renderLinks(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>"),
            code => `<code>${escapeHtml(code)}</code>`
        )
    );
}

/**
 * @brief Strips markdown emphasis/code markers from `line`, returned as plain text.
 *
 * @param {string} line
 *
 * @returns {string}
 */
function stripMdFormatting(line) {
    return withProtectedEscapes(line, withoutEscapes =>
        withProtectedCodeSpans(
            withoutEscapes,
            text => text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1"),
            code => code
        )
    );
}

const codeFenceRegex = /^```([\w-]*)/;

/**
 * @brief Checks whether `line` is a ``` code fence marker.
 *
 * @param {string} line
 *
 * @returns {boolean}
 */
function isCodeFence(line) {
    return codeFenceRegex.test(line);
}

const headingRegex = /^(#{1,5})\s+(.*)/;

/**
 * @brief Builds a kebab-case anchor id from `text`.
 *
 * @param {string} text
 *
 * @returns {string}
 */
function slugifyHeading(text) {
    return slugify(text.replace(/<[^>]+>/g, ""));
}

/**
 * @brief Builds a slug for `text` unique among `usedIds` (adds it to the set).
 *
 * @param {string} text
 * @param {Set<string>} usedIds
 *
 * @returns {string}
 */
function uniqueHeadingId(text, usedIds) {
    const base = slugifyHeading(text) || "section";
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
        id = `${base}-${suffix}`;
        suffix++;
    }
    usedIds.add(id);
    return id;
}

const quoteRegex = /^>\s?(.*)/;

/**
 * @brief Splits a single markdown table row (e.g. `| a | b |`) into its cells, trimmed,
 * without the leading/trailing pipe.
 *
 * @param {string} line
 *
 * @returns {Array<string>}
 */
function splitTableRow(line) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    /* A `\|` (e.g. inside a code span like `` `\|` `` to render a literal pipe character)
       is an escaped separator, not a column boundary: mdToHtmlFormatting unescapes it later. */
    const cells = [];
    let cell = "";
    for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === "\\" && trimmed[i + 1] === "|") {
            cell += "\\|";
            i++;
        } else if (trimmed[i] === "|") {
            cells.push(cell.trim());
            cell = "";
        } else {
            cell += trimmed[i];
        }
    }
    cells.push(cell.trim());
    return cells;
}

/**
 * @brief Checks whether `line` (the line right after a table header row) is a valid
 * markdown table separator (e.g. `|---|:--:|`).
 *
 * @param {string} line
 *
 * @returns {boolean}
 */
function isTableSeparatorRow(line) {
    if (!line.includes("|") && !line.includes("-"))
        return false;
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every(cell => /^:?-+:?$/.test(cell));
}

/**
 * @brief Derives the CSS text-align implied by a separator cell's colons (e.g. `:--:`),
 * or null for the default.
 *
 * @param {string} cell
 *
 * @returns {string|null}
 */
function tableColumnAlign(cell) {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
}

function createTableFromLines(headerLine, separatorLine, bodyLines, homeDiv, fileName) {
    const aligns = splitTableRow(separatorLine).map(tableColumnAlign);
    const table = createTag("table", {class: `${fileName}Table`});

    const headRow = createTag("tr");
    splitTableRow(headerLine).forEach((cell, i) => {
        const th = createTag("th", aligns[i] ? {style: `text-align:${aligns[i]}`} : {}, {innerHTML: mdToHtmlFormatting(cell)});
        headRow.append(th);
    });
    const thead = createTag("thead");
    thead.append(headRow);
    table.append(thead);

    const tbody = createTag("tbody");
    bodyLines.forEach(bodyLine => {
        const tr = createTag("tr");
        splitTableRow(bodyLine).forEach((cell, i) => {
            const td = createTag("td", aligns[i] ? {style: `text-align:${aligns[i]}`} : {}, {innerHTML: mdToHtmlFormatting(cell)});
            tr.append(td);
        });
        tbody.append(tr);
    });
    table.append(tbody);

    const wrapper = createTag("div", {class: "tableWrapper"});
    wrapper.append(table);
    homeDiv.append(wrapper);
}

/**
 * @brief Renders a markdown body into `homeDiv`. Its first line must be a `# ` heading,
 * used as the page's title (`h2`); further `##`-`######` headings render as `h3`-`h6`,
 * each given an anchor id.
 *
 * @param {HTMLElement} homeDiv
 * @param {string} fileName
 * @param {string} text
 *
 * @returns {Array<{level: number, id: string, text: string}>} the page's `h3`-`h6` headings, in order
 */
export function parseAppendText(homeDiv, fileName, text) {
    /* Blank lines are noise between blocks, but significant inside a fenced code block
       (they're part of the code): so fence state must gate the filter, not run after it. */
    let inFence = false;
    const lines = text.split("\n").filter(line => {
        if (isCodeFence(line)) {
            inFence = !inFence;
            return true;
        }
        return inFence || line.trim() !== "";
    });

    const listRegex = /^(\* |- |\d+\) )/;
    let listDiv = null;
    let quoteDiv = null;
    let codeDiv = null;
    /* Consecutive chart blocks share one full-width row instead of each taking the full width on
       its own line; reset to null by every other block kind below, so unrelated charts don't group. */
    let lastChartRow = null;
    const usedIds = new Set();
    const outline = [];
    /* Local to this call, not module-level: a previous call's leftover open quote/list would
       otherwise leak into the next page rendered (e.g. a null-deref if its own first line is a quote). */
    let openList = false;
    let openQuote = false;
    let inCodeBlock = false;
    let codeLanguage = null;

    function createListFromText(line, listDiv) {
        if (!openList) {
            openList = true;
            const type = /^\d+\) /.test(line) ? 'ol' : 'ul';
            listDiv = createTag(type, {class: `content-list ${fileName}${type}`});
            homeDiv.append(listDiv);
        }
        line = line.replace(listRegex, "");
        listDiv.append(createTag("li", {}, {innerHTML: line}));
        return listDiv;
    }

    function createQuoteFromText(line, quoteDiv) {
        if (!openQuote) {
            openQuote = true;
            quoteDiv = createTag('blockquote', {class: `${fileName}Blockquote`});
            homeDiv.append(quoteDiv);
        }
        quoteDiv.append(createTag('p', {}, {innerHTML: line.match(quoteRegex)[1]}));
        return quoteDiv;
    }

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (isCodeFence(line)) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                /* Ends whatever quote/list was open before the fence, like a table/heading does
                   below; otherwise a quote resuming after it would append into the stale one. */
                openList = false;
                openQuote = false;
                lastChartRow = null;
                codeLanguage = line.match(codeFenceRegex)[1];
                const pre = createTag("pre", {class: `${fileName}Pre`});
                codeDiv = createTag("code", codeLanguage ? {class: `language-${codeLanguage}`} : {});
                pre.append(codeDiv);
                homeDiv.append(pre);
            } else {
                inCodeBlock = false;
                const chart = renderChartBlock(codeLanguage, codeDiv.textContent);
                if (chart) {
                    if (lastChartRow) {
                        codeDiv.parentElement.remove();
                    } else {
                        lastChartRow = createTag("div", {class: "chartRow"});
                        codeDiv.parentElement.replaceWith(lastChartRow);
                    }
                    lastChartRow.append(chart);
                } else {
                    lastChartRow = null;
                    /* Only highlight when a language was given: without a `language-*` class,
                       hljs auto-detects, guessing a near-random language on ASCII diagram blocks. */
                    if (codeDiv.className) {
                        window.hljs.highlightElement(codeDiv);
                    }
                }
                codeDiv = null;
            }
            i++;
            continue;
        }
        if (inCodeBlock) {
            codeDiv.append(document.createTextNode(line + "\n"));
            i++;
            continue;
        }
        if (line.trim() === "---") {
            openList = false;
            openQuote = false;
            lastChartRow = null;
            homeDiv.append(createTag("hr", {class: `${fileName}Hr`}));
            i++;
            continue;
        }
        if (line.includes("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
            openList = false;
            openQuote = false;
            lastChartRow = null;
            const bodyLines = [];
            let j = i + 2;
            while (j < lines.length && lines[j].includes("|") && !isCodeFence(lines[j])) {
                bodyLines.push(lines[j]);
                j++;
            }
            createTableFromLines(line, lines[i + 1], bodyLines, homeDiv, fileName);
            i = j;
            continue;
        }
        const headingMatch = line.match(headingRegex);
        if (headingMatch) {
            openList = false;
            openQuote = false;
            lastChartRow = null;
            const level = Math.min(headingMatch[1].length + 1, 6);
            const rawText = headingMatch[2];
            const headingText = mdToHtmlFormatting(rawText);
            const isPageTitle = level === 2;
            const className = isPageTitle ? `pageTitle ${fileName}Title` : `${fileName}H${level}`;
            const id = uniqueHeadingId(headingText, usedIds);
            homeDiv.append(createTag(`h${level}`, {class: className, id}, {innerHTML: headingText}));
            if (!isPageTitle)
                outline.push({level, id, text: stripMdFormatting(rawText)});
        } else {
            const formatted = mdToHtmlFormatting(line);
            if (quoteRegex.test(formatted)) {
                openList = false;
                lastChartRow = null;
                quoteDiv = createQuoteFromText(formatted, quoteDiv);
            } else if (listRegex.test(formatted)) {
                openQuote = false;
                lastChartRow = null;
                listDiv = createListFromText(formatted, listDiv);
            } else {
                openList = false;
                openQuote = false;
                lastChartRow = null;
                homeDiv.append(createTag('p', {class: `${fileName}P`}, {innerHTML: formatted}));
            }
        }
        i++;
    }

    return outline;
}
