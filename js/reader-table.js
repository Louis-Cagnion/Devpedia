import { speakableCode, speakableText, needsEnglishVoice } from "./reader-pronunciation.js";
import { splitIntoClauses } from "./reader-clauses.js";
import { wrapSegmentWords, WORD_PATTERN, codeSpanIn } from "./reader-highlight.js";

/**
 * @brief Returns one `null` placeholder per word in `text`, for a synthesized label or connector
 * with no real DOM word to highlight.
 *
 * @param {string} text plain text with no DOM node behind it (a label or connector, e.g. " : ")
 *
 * @returns {null[]} one `null` per word `text` contains
 */
function wordsForPlainText(text) {
    return Array((text.match(WORD_PATTERN) ?? []).length).fill(null);
}

/**
 * @brief Wraps a synthesized ambient run as a `{text, lang, words}` part.
 *
 * @param {string} text an ambient (page-language) run
 *
 * @returns {{text: string, lang: null, words: null[]}}
 */
function ambientPart(text) {
    return { text, lang: null, words: wordsForPlainText(text) };
}

/**
 * @brief Concatenates `parts`' own text into one string, and rebuilds a `words` array aligned to
 * the concatenation's own tokenization rather than the sum of each part's own word count.
 *
 * @example
 * concatWithWords([{text: "sans mise en forme", words: [w1, w2, w3, w4]}, {text: ", ", words: [null]}])
 * -> {text: "sans mise en forme, ", words: [w1, w2, w3, w4, null]}
 *
 * @param {{text: string, words: Array}[]} parts
 *
 * @returns {{text: string, words: Array}}
 */
function concatWithWords(parts) {
    const markers = [];
    let text = "";
    parts.forEach(part => {
        const offset = text.length;
        let localIndex = 0;
        for (const match of part.text.matchAll(WORD_PATTERN)) {
            markers.push({ start: offset + match.index, word: part.words[localIndex++] });
        }
        text += part.text;
    });
    /* A word fused with the next part's leading punctuation (no space between them) collapses
       two tracked words into one final match -- keep a real DOM word over a null placeholder. */
    const words = [...text.matchAll(WORD_PATTERN)].map(match => {
        const covering = markers.filter(m => m.start >= match.index && m.start < match.index + match[0].length);
        return covering.find(m => m.word)?.word ?? null;
    });
    return { text, words };
}

/**
 * @brief Splits a `td`/`th`'s own content into language-tagged runs, one per inline `code` span
 * boundary, each carrying its own `words` for word-level highlighting.
 *
 * @param {HTMLElement} cell a `td`/`th`
 * @param {string} lang the page's own language code
 * @param {string} context the page's subject id, or its category id when there's no subject
 *
 * @returns {{text: string, lang: (string|null), words: Array}[]} runs in document order; `lang`
 *   is "en-US" for a code span needing the English voice (`words` then empty), null otherwise
 */
function cellSpokenParts(cell, lang, context) {
    const parts = [];
    let bufferParts = [];
    const flushBuffer = () => {
        if (!bufferParts.length) return;
        const { text, words } = concatWithWords(bufferParts);
        const trimmedText = text.trim();
        if (trimmedText) parts.push({ text: trimmedText, lang: null, words });
        bufferParts = [];
    };
    /* Snapshot before iterating: wrapSegmentWords() below mutates cell's own children as each text
       node flushes, desyncing a live NodeList mid-iteration otherwise (same reasoning as reader.js's
       own collectLeafSegments). */
    Array.from(cell.childNodes).forEach(node => {
        const codeNode = codeSpanIn(node);
        if (codeNode) {
            const code = codeNode.textContent.trim();
            if (!code) return;
            const spoken = speakableCode(code, context, lang);
            if (needsEnglishVoice(code, context)) {
                flushBuffer();
                parts.push({ text: spoken, lang: "en-US", words: [] });
            } else {
                bufferParts.push({ text: ` ${spoken} `, words: wordsForPlainText(spoken) });
            }
        } else if (node.textContent.trim()) {
            bufferParts.push({ text: node.textContent, words: wrapSegmentWords([node]).words });
        } else {
            bufferParts.push({ text: node.textContent, words: [] });
        }
    });
    flushBuffer();
    return parts;
}

/**
 * @brief Interleaves `partsGroups` with an ambient `separator` between each group -- the
 * run-sequence equivalent of `Array.prototype.join()`.
 *
 * @param {{text: string, lang: (string|null), words: Array}[][]} partsGroups
 * @param {string} separator
 *
 * @returns {{text: string, lang: (string|null), words: Array}[]}
 */
function joinPartsGroups(partsGroups, separator) {
    const result = [];
    partsGroups.forEach((parts, i) => {
        if (i > 0) result.push(ambientPart(separator));
        result.push(...parts);
    });
    return result;
}

/**
 * @brief Regroups `parts` into maximal runs of the same language: consecutive ambient parts
 * merge into one run, an English run always stays its own, unsplit.
 *
 * @param {{text: string, lang: (string|null), words: Array}[]} parts
 *
 * @returns {{text: string, lang: (string|null), words: Array}[]} one entry per run, in order
 */
function mergeAdjacentRuns(parts) {
    const runs = [];
    parts.forEach(part => {
        const last = runs[runs.length - 1];
        if (part.lang === null && last?.lang === null) last.sourceParts.push(part);
        else runs.push({ lang: part.lang, sourceParts: [part] });
    });
    return runs.map(run => ({ lang: run.lang, ...concatWithWords(run.sourceParts) }));
}

/**
 * @brief Reads a `table`'s data rows with row/column context, folding the header into each row's
 * own synthesized sentence instead of reading it separately. Word-level highlight follows each
 * cell's own actual words; connector words the sentence synthesizes have none, so they keep the
 * whole-row highlight instead.
 *
 * @example
 * Recap card (every header cell blank): "label : the rest, joined"
 * Comparison (only the first header cell blank): "criterion : value1 pour title1, ..."
 * Ordinary table (every header cell filled): "title1 : value1, title2 : value2..."
 *
 * @param {HTMLElement} table
 * @param {string} lang the page's own language code
 * @param {string} context the page's subject id, or its category id when there's no subject
 * @param {string} pageId the page's own id
 * @param {Array} entries the plan being built, appended to in place
 */
/* Connector word for a comparison table's "value for header" phrasing -- was hardcoded to
   French, so an English/Spanish/Portuguese page read it as a stray French word mid-sentence. */
const FOR_HEADER_SPEECH = { fr: "pour", en: "for", es: "para", br: "para" };

export function collectTableSegments(table, lang, context, pageId, entries) {
    const headerTexts = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());
    const isRecapCard = headerTexts.every(text => !text);
    const isComparison = !isRecapCard && !headerTexts[0];

    table.querySelectorAll("tbody tr").forEach(tr => {
        const cellParts = [...tr.children].map(cell => cellSpokenParts(cell, lang, context));
        let sentenceParts;
        if (isRecapCard) {
            const [label, ...rest] = cellParts;
            sentenceParts = [...label, ambientPart(" : "), ...joinPartsGroups(rest, ", ")];
        } else if (isComparison) {
            const [criterion, ...rest] = cellParts;
            const forWord = FOR_HEADER_SPEECH[lang] ?? FOR_HEADER_SPEECH.fr;
            const valuePhrases = rest.map((valueParts, i) => [...valueParts, ambientPart(` ${forWord} ${headerTexts[i + 1]}`)]);
            sentenceParts = [...criterion, ambientPart(" : "), ...joinPartsGroups(valuePhrases, ", ")];
        } else {
            /* Title always before value regardless of cell length -- suffixing short cells instead
               was tried and dropped (2026-08-16), listeners never really noticed a difference. */
            const cellPhrases = cellParts.map((valueParts, i) => [ambientPart(`${headerTexts[i] ?? ""} : `), ...valueParts]);
            sentenceParts = joinPartsGroups(cellPhrases, ", ");
        }

        /* An ambient run still splits into clause entries, each keeping its own slice of the run's
           words (cf. splitIntoClauses()); an English run is spoken whole, unsplit, with whatever
           words it already has (cf. mergeAdjacentRuns()'s own comment). */
        mergeAdjacentRuns(sentenceParts).forEach(run => {
            const chunks = run.lang === null ? splitIntoClauses(run.text, run.words) : [{ text: run.text, words: run.words }];
            chunks.forEach(({ text: chunkText, words: chunkWords }) => {
                entries.push({
                    kind: "speak",
                    text: run.lang === null ? speakableText(chunkText, lang, pageId) : chunkText,
                    lang: run.lang ?? lang,
                    group: tr,
                    highlightTarget: tr,
                    words: chunkWords,
                });
            });
        });
    });
}
