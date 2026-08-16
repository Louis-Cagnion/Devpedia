import { speakableCode, speakableText, needsEnglishVoice } from "./reader-pronunciation.js";
import { splitIntoClauses } from "./reader-clauses.js";

/**
 * @param {string} text an ambient (page-language) run
 * @returns {{text: string, lang: null}}
 */
function ambientPart(text) {
    return { text, lang: null };
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
 * @param {HTMLElement} cell a `td`/`th`
 * @param {string} context see {@link needsEnglishVoice}
 * @returns {{text: string, lang: (string|null)}[]} runs in document order; `lang` is "en-US" for a
 *   code span needsEnglishVoice() flags, null for ordinary page-language text (including a folded
 *   code span with nothing to justify switching voice)
 */
function cellSpokenParts(cell, context) {
    const parts = [];
    let buffer = "";
    const flushBuffer = () => {
        const text = buffer.trim();
        if (text) parts.push(ambientPart(text));
        buffer = "";
    };
    cell.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
            if (!code) return;
            if (needsEnglishVoice(code, context)) {
                flushBuffer();
                parts.push({ text: speakableCode(code, context), lang: "en-US" });
            } else {
                // Still run through speakableCode() even though nothing here needs the English
                // voice -- unlike reader.js's own collectLeafSegments, a table row has no
                // word-by-word DOM highlight to keep aligned with this text (cf. collectTableSegments'
                // own comment: `words` is always empty here), so there's no risk in also applying
                // its underscore cleanup to a folded, page-language identifier like `nom_dossier`.
                buffer += ` ${speakableCode(code, context)} `;
            }
        } else {
            buffer += node.textContent;
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
 * @param {{text: string, lang: (string|null)}[][]} partsGroups
 * @param {string} separator
 * @returns {{text: string, lang: (string|null)}[]}
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
 * parts merge into one run, so clause splitting (cf. splitIntoClauses() in reader-clauses.js) sees
 * their combined text exactly as if they'd never been split apart to make room for an English run
 * in between (e.g. a connector word right before or after one). An English run never merges with a
 * neighbour, even another English one: it's spoken as its own entry, unsplit, the same as a
 * rewritten code span in prose (cf. reader.js's collectLeafSegments).
 *
 * @param {{text: string, lang: (string|null)}[]} parts
 * @returns {{text: string, lang: (string|null)}[]} one entry per run, in order
 */
function mergeAdjacentRuns(parts) {
    const runs = [];
    parts.forEach(part => {
        const last = runs[runs.length - 1];
        if (part.lang === null && last?.lang === null) last.text += part.text;
        else runs.push({ ...part });
    });
    return runs;
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
 * No word-level highlight for any of these -- unlike prose, a row's sentence here is synthesized
 * (titles and connector words like "pour" folded in) rather than a straight read of some
 * contiguous run of DOM text, so there's no single original text run left to wrap into `words` the
 * way reader.js's wrapSegmentWords() does for a paragraph. The whole `tr` gets the whole-entry
 * highlight instead, the same as an inline-code entry with nothing to highlight word by word (cf.
 * reader.js's collectLeafSegments) -- true of every entry a row produces here, whichever language
 * it ends up spoken in (cf. cellSpokenParts()'s own comment).
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
        const cellParts = [...tr.children].map(cell => cellSpokenParts(cell, context));
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

        // Each merged run becomes one or more plan entries: an ambient run still splits into
        // several short clause entries (same as prose, cf. splitIntoClauses()), while an English
        // run is spoken whole, unsplit -- see mergeAdjacentRuns()'s own comment for why.
        mergeAdjacentRuns(sentenceParts).forEach(run => {
            const chunks = run.lang === null ? splitIntoClauses(run.text) : [run.text];
            chunks.forEach(chunk => {
                entries.push({
                    kind: "speak",
                    text: run.lang === null ? speakableText(chunk, lang, pageId) : chunk,
                    lang: run.lang ?? lang,
                    group: tr,
                    highlightTarget: tr,
                    words: [],
                });
            });
        });
    });
}
