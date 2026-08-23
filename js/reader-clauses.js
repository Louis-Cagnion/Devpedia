import { HAS_SPOKEN_CONTENT } from "./reader-pronunciation.js";
import { WORD_PATTERN } from "./reader-highlight.js";

/* A clause boundary: sentence-ending marks, a comma/semicolon/colon not between two digits
   (a decimal/ratio, not a pause), or a parenthesis -- without one, a parenthetical read at the
   same pace as the surrounding sentence didn't sound like an aside (Louis, 23/08/2026). Split
   this granularly, not per sentence, since Chrome's speechSynthesis can silently cut a long
   utterance short partway through (Louis, 2026-08-16). */
export const CLAUSE_END_PATTERN = /[.!?…]+[)»"'’”]*|[,;:](?!\d)|[()]/g;

/**
 * @brief Splits synthesized text into clauses at CLAUSE_END_PATTERN, carrying each clause's own
 * slice of `words` along with it.
 *
 * @example
 * splitIntoClauses("Titre : valeur,", [null, null, span])
 * -> [{text: "Titre :", words: [null, null]}, {text: "valeur,", words: [span]}]
 *
 * @param {string} text
 * @param {Array} words one entry per `text`'s own WORD_PATTERN match, in order
 *
 * @returns {{text: string, words: Array}[]} non-empty, spoken-content-bearing chunks, in order
 */
export function splitIntoClauses(text, words) {
    const ranges = [];
    let lastIndex = 0;
    CLAUSE_END_PATTERN.lastIndex = 0;
    let match;
    while ((match = CLAUSE_END_PATTERN.exec(text))) {
        ranges.push([lastIndex, match.index + match[0].length]);
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) ranges.push([lastIndex, text.length]);

    const positionedWords = [...text.matchAll(WORD_PATTERN)].map((m, i) => ({ start: m.index, word: words[i] }));
    const chunks = [];
    let carriedWords = [];
    ranges.forEach(([start, end]) => {
        const chunkText = text.slice(start, end).trim();
        const ownWords = positionedWords.filter(w => w.start >= start && w.start < end).map(w => w.word);
        if (HAS_SPOKEN_CONTENT.test(chunkText)) {
            /* A word fused across two surviving chunks (e.g. "!motif" split by its own leading
               "!") leaves this chunk one word short of its own count -- pad with null. */
            const localWordCount = (chunkText.match(WORD_PATTERN) ?? []).length;
            const shortfall = localWordCount - (carriedWords.length + ownWords.length);
            const fillers = shortfall > 0 ? Array(shortfall).fill(null) : [];
            chunks.push({ text: chunkText, words: [...carriedWords, ...fillers, ...ownWords] });
            carriedWords = [];
        } else {
            // A discarded chunk's own words aren't lost -- carried to whichever chunk survives next.
            carriedWords = [...carriedWords, ...ownWords];
        }
    });
    return chunks;
}
