import { speakableCode, speakableText } from "./reader-pronunciation.js";
import { splitIntoClauses } from "./reader-clauses.js";

/**
 * @param {HTMLElement} cell a `td`/`th`
 * @param {string} context the page's subject or category id, used to pick the right operator
 *   table for inline code (cf. CONTEXT_OPERATOR_SPEECH in reader-pronunciation.js)
 * @returns {string} `cell`'s own text, with any inline `code` span pronounced through
 *   speakableCode() first (cf. reader.js's collectLeafSegments, which does the same for prose) --
 *   without this, a cell like `` `!==` `` would read as "not equals" everywhere else on the site
 *   but as the bare characters here, since a plain `.textContent` doesn't know the difference
 */
function cellSpokenText(cell, context) {
    let text = "";
    cell.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
            if (code) text += ` ${speakableCode(code, context)} `;
        } else {
            text += node.textContent;
        }
    });
    return text.replace(/\s+/g, " ").trim();
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
 * reader.js's collectLeafSegments).
 *
 * @param {HTMLElement} table
 * @param {string} lang
 * @param {string} context see {@link cellSpokenText}
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
        const cells = [...tr.children].map(cell => cellSpokenText(cell, context));
        let sentence;
        if (isRecapCard) {
            const [label, ...rest] = cells;
            sentence = `${label} : ${rest.join(", ")}`;
        } else if (isComparison) {
            const [criterion, ...rest] = cells;
            const parts = rest.map((value, i) => `${value} pour ${headerTexts[i + 1]}`);
            sentence = `${criterion} : ${parts.join(", ")}`;
        } else {
            sentence = cells.map((value, i) => `${headerTexts[i] ?? ""} : ${value}`).join(", ");
        }
        splitIntoClauses(sentence).forEach(chunk => {
            entries.push({
                kind: "speak",
                text: speakableText(chunk, lang, pageId),
                lang,
                group: tr,
                highlightTarget: tr,
                words: [],
            });
        });
    });
}
