import { speakableCode, speakableText, needsEnglishVoice } from "./reader-pronunciation.js";
import { splitIntoClauses } from "./reader-clauses.js";
import { wrapSegmentWords, WORD_PATTERN } from "./reader-highlight.js";

/**
 * @param {string} text plain text with no DOM node behind it -- a synthesized label or connector
 *   word (" : ", ", ", " pour Titre"...) that a table row's sentence needs but no cell literally
 *   contains. Returns one `null` per word `text` counts as (same WORD_PATTERN reader-highlight.js
 *   itself uses), so a `words` array built by concatenating these with real DOM word spans (cf.
 *   cellSpokenParts() below) stays index-aligned with entry.text's own word count even though this
 *   particular stretch has nothing to highlight -- setActiveWord() already tolerates a `null` in
 *   `words` (falls back to the whole-row highlight for that word, cf. reader-highlight.js).
 * @returns {null[]}
 */
function wordsForPlainText(text) {
    return Array((text.match(WORD_PATTERN) ?? []).length).fill(null);
}

/**
 * @param {string} text an ambient (page-language) run
 * @returns {{text: string, lang: null, words: null[]}}
 */
function ambientPart(text) {
    return { text, lang: null, words: wordsForPlainText(text) };
}

/**
 * Concatenates `parts`' own `text` into one string, and rebuilds a `words` array to go with it by
 * re-tokenizing that concatenation rather than trusting the sum of each part's own word count -- a
 * part with nothing padding its edges can end up directly against the next part's own leading
 * punctuation (a cell value "sans mise en forme" butting straight against the next cell's ", "
 * connector, or one child node ending in "(" immediately followed by a link's own text with no
 * space between them), both counted as separate words in isolation but read back as one fused
 * token ("forme," / "(Richter") once actually concatenated -- silently shifting every word after it
 * by one position, exactly the kind of off-by-one this whole feature exists to avoid (caught live
 * on 2026-08-16 testing the first version of table word-by-word: highlighted words drifted onto the
 * wrong cell a few words into a row, and again a few words into a single multi-node cell).
 *
 * Reconciles this by tracking each of `parts`' own words at its own absolute character offset in
 * the final string, then assigning each of THAT string's own WORD_PATTERN matches whichever
 * tracked word starts inside it -- the fused-token case above naturally collapses two tracked words
 * into the one final match that swallowed them both, keeping a real DOM word over a synthesized
 * `null` placeholder if the fusion happened to merge one of each. Used both across a single cell's
 * own child nodes (cf. cellSpokenParts() below) and across a whole row's cells and connector words
 * (cf. mergeAdjacentRuns()) -- the same risk at two different granularities.
 *
 * @param {{text: string, words: Array}[]} parts
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
    const words = [...text.matchAll(WORD_PATTERN)].map(match => {
        const covering = markers.filter(m => m.start >= match.index && m.start < match.index + match[0].length);
        return covering.find(m => m.word)?.word ?? null;
    });
    return { text, words };
}

/**
 * Splits a `td`/`th`'s own content into a sequence of language-tagged runs instead of one flat
 * string -- a cell's inline `code` span already tells us, structurally, exactly which part of its
 * text is a real language/tool identifier that needs the English voice (cf. needsEnglishVoice() in
 * reader-pronunciation.js) and which part is ordinary page-language prose (a connector word, or a
 * bare identifier with nothing to justify switching voice, e.g. a teaching-example variable name
 * like `nom_dossier`). Reuses that existing backtick boundary rather than inventing a separate
 * detection step, suggested by Louis on 2026-08-16 while listening live to a table read entirely
 * in French despite containing real English keywords (`setopt`, `AUTO_CD`...).
 *
 * Each run also carries its own `words`: for ordinary page-language text, real DOM word spans (cf.
 * wrapSegmentWords(), the same mechanism reader.js's collectLeafSegments uses for a paragraph),
 * one child node at a time (a link inside a cell is its own node, wrapped on its own) reconciled
 * back together with concatWithWords() at flush time rather than trusted to concatenate cleanly on
 * their own. A folded code span (nothing to rewrite, spoken through speakableCode() like the rest)
 * has no DOM word to point at, so it contributes `null` placeholders instead (cf.
 * wordsForPlainText()) -- same tolerance already built into setActiveWord().
 *
 * @param {HTMLElement} cell a `td`/`th`
 * @param {string} lang the page's own language, threaded through to speakableCode() only to pick
 *   the right word for a filename's "." (cf. FILENAME_DOT_SPEECH in reader-pronunciation.js)
 * @param {string} context see {@link needsEnglishVoice}
 * @returns {{text: string, lang: (string|null), words: Array}[]} runs in document order; `lang` is
 *   "en-US" for a code span needsEnglishVoice() flags (no word-level highlight, `words` is `[]`,
 *   same as an inline-code entry in prose, cf. reader.js's collectLeafSegments), null for ordinary
 *   page-language text (including a folded code span with nothing to justify switching voice)
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
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
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
 * Interleaves `partsGroups` (one run-sequence per cell or cell-phrase) with an ambient `separator`
 * between each -- the run-sequence equivalent of `Array.prototype.join()` for plain strings, used
 * by collectTableSegments() below to glue cells' own parts together with the connector text
 * ("`, `", "` pour `"...) a row's synthesized sentence needs between them.
 *
 * @param {{text: string, lang: (string|null), words: Array}[][]} partsGroups
 * @param {string} separator
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
 * Regroups `parts` into maximal runs of the same language -- consecutive ambient (page-language)
 * parts merge into one run (cf. concatWithWords() above), so clause splitting (cf.
 * splitIntoClauses() in reader-clauses.js) sees their combined text exactly as if they'd never been
 * split apart to make room for an English run in between (e.g. a connector word right before or
 * after one). An English run never merges with a neighbour, even another English one: it's spoken
 * as its own entry, unsplit, the same as a rewritten code span in prose (cf. reader.js's
 * collectLeafSegments).
 *
 * @param {{text: string, lang: (string|null), words: Array}[]} parts
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
 * Reads a `table`'s data rows with row/column context instead of each `th`/`td` in isolation --
 * the original complaint behind the whole table audit in devpedia-todo.md. The header row is
 * never read on its own (its wording is folded into each data row's own sentence instead), and
 * which of three shapes to fold it in as is detected from the header alone, audited on 2026-08-16
 * to actually cover the content site-wide rather than just the one example table a first version
 * of this was designed around:
 *
 * - Every header cell blank: a "recap card" -- a bold label in the first cell, a full sentence in
 *   the rest, no real columns at all (`| **À retenir** | Zsh regroupe... |`). Read as
 *   "label : the rest, joined".
 * - Only the first header cell blank: a comparison matrix -- the first cell of each row is an
 *   unlabeled criterion, the rest are values for the labeled columns being compared (headers like
 *   `["", "CPU", "GPU"]`). Read as "criterion : value1 pour title1, value2 pour title2...".
 * - Every header cell filled in: an ordinary data table. Read as "title1 : value1, title2 :
 *   value2...", title always before value regardless of how long a cell's own text is -- tried
 *   suffixing the title for short cells only, decided against it (2026-08-16) since it needed two
 *   rules instead of one for a difference listeners never really noticed either way.
 *
 * Word-level highlight follows each cell's own actual words (cf. cellSpokenParts()), but not the
 * connector words the row's own sentence synthesizes around them ("Titre :", ", ", " pour Titre2"),
 * which have no DOM word of their own to point at -- those keep the whole-row highlight instead
 * (`tr` stays this function's `highlightTarget` throughout, never a per-word wrapper), the same
 * fallback an inline-code entry already gets in prose (cf. reader.js's collectLeafSegments).
 *

 * @param {HTMLElement} table
 * @param {string} lang
 * @param {string} context see {@link cellSpokenParts}
 * @param {string} pageId the page's own id, used to pick the right prose wording for a symbol
 *   whose meaning varies page to page rather than context to context (cf. ARROW_RANGE_PAGES in
 *   reader-pronunciation.js)
 * @param {Array} entries the plan being built (cf. reader.js's buildReadingPlan), appended to in
 *   place
 */
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
            const valuePhrases = rest.map((valueParts, i) => [...valueParts, ambientPart(` pour ${headerTexts[i + 1]}`)]);
            sentenceParts = [...criterion, ambientPart(" : "), ...joinPartsGroups(valuePhrases, ", ")];
        } else {
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
