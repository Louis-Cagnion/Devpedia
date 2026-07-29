import { createTag } from "./tags.js";

let openList = false
let openQuote = false
let inCodeBlock = false

/**
 * Strip a file's optional `---`-fenced frontmatter (used for build-time metadata
 * like `order`, irrelevant to rendering) and return its markdown body.
 *
 * @param {string} rawContent
 * @returns {string}
 */
export function parseMdContent(rawContent) {
    const body = rawContent.startsWith("---") ? rawContent.split("---").slice(2).join("---") : rawContent;
    return body.trim();
}

function mdToHtmlFormatting(line) {
    line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    line = line.replace(/\*(.*?)\*/g, "<em>$1</em>")
    line = line.replace(/`([^`]+)`/g, "<code>$1</code>")
    return line;
}

/**
 * @param {string} line
 * @returns {string} the line with markdown emphasis/code markers removed, as plain text
 */
function stripMdFormatting(line) {
    line = line.replace(/\*\*(.*?)\*\*/g, "$1")
    line = line.replace(/\*(.*?)\*/g, "$1")
    line = line.replace(/`([^`]+)`/g, "$1")
    return line;
}

const codeFenceRegex = /^```(\w*)/;

/**
 * @param {string} line
 * @returns {boolean} whether this line is a ``` code fence marker
 */
function isCodeFence(line) {
    return codeFenceRegex.test(line);
}

const headingRegex = /^(#{1,5})\s+(.*)/;

/**
 * @param {string} text
 * @returns {string} a kebab-case anchor id
 */
function slugifyHeading(text) {
    return text
        .toLowerCase()
        .replace(/<[^>]+>/g, "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * @param {string} text
 * @param {Set<string>} usedIds
 * @returns {string} a slug unique among `usedIds` (adds it to the set)
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

function createListFromText(line, homeDiv, fileName, listDiv, listRegex) {
    if (!openList) {
        openList = true;
        const type = /^\d+\) /.test(line) ? 'ol' : 'ul';
        listDiv = createTag(type, {class: `content-list ${fileName}${type}`});
        homeDiv.append(listDiv);
    }
    line = line.replace(listRegex, "")
    listDiv.append(createTag("li", {}, {innerHTML: line}))
    return listDiv;
}

const quoteRegex = /^>\s?(.*)/;

function createQuoteFromText(line, homeDiv, fileName, quoteDiv) {
    if (!openQuote) {
        openQuote = true;
        quoteDiv = createTag('blockquote', {class: `${fileName}Blockquote`});
        homeDiv.append(quoteDiv);
    }
    quoteDiv.append(createTag('p', {}, {innerHTML: line.match(quoteRegex)[1]}));
    return quoteDiv;
}

/**
 * Render a markdown body into `homeDiv`. Its first line must be a `# ` heading,
 * used as the page's title (`h2`); further `##`-`######` headings render as `h3`-`h6`,
 * each given an anchor id.
 *
 * @param {HTMLElement} homeDiv
 * @param {string} fileName
 * @param {string} text
 * @returns {Array<{level: number, id: string, text: string}>} the page's `h3`-`h6` headings, in order
 */
export function parseAppendText(homeDiv, fileName, text) {
    const lines = text.split("\n").filter(line => line.trim() !== "");

    const listRegex = /^(\* |- |\d+\) )/;
    let listDiv = null;
    let quoteDiv = null;
    let codeDiv = null;
    const usedIds = new Set();
    const outline = [];

    lines.forEach(line => {
        if (isCodeFence(line)) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                const language = line.match(codeFenceRegex)[1];
                const pre = createTag("pre", {class: `${fileName}Pre`});
                codeDiv = createTag("code", language ? {class: `language-${language}`} : {});
                pre.append(codeDiv);
                homeDiv.append(pre);
            } else {
                inCodeBlock = false;
                window.hljs.highlightElement(codeDiv);
                codeDiv = null;
            }
            return;
        }
        if (inCodeBlock) {
            codeDiv.append(document.createTextNode(line + "\n"));
            return;
        }
        const headingMatch = line.match(headingRegex);
        if (headingMatch) {
            openList = false;
            openQuote = false;
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
            line = mdToHtmlFormatting(line);
            if (quoteRegex.test(line)) {
                openList = false;
                quoteDiv = createQuoteFromText(line, homeDiv, fileName, quoteDiv);
            } else if (listRegex.test(line)) {
                openQuote = false;
                listDiv = createListFromText(line, homeDiv, fileName, listDiv, listRegex);
            } else {
                openList = false;
                openQuote = false;
                homeDiv.append(createTag('p', {class: `${fileName}P`}, {innerHTML: line}));
            }
        }
    })

    return outline;
}