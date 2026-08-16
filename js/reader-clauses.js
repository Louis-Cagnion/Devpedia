import { HAS_SPOKEN_CONTENT } from "./reader-pronunciation.js";

/* A clause boundary: one or more sentence-ending marks (with an optional closing quote/parenthesis
   right after), or a single comma/semicolon/colon -- as long as that comma/semicolon/colon isn't
   sitting between two digits, where it's a decimal separator or a ratio/time-like notation ("1,8",
   "12:30") rather than a pause, and splitting it would read the number back in two disconnected
   pieces. Used both by reader.js's own collectLeafSegments (splitting a leaf's live DOM text nodes)
   and by reader-table.js's splitIntoClauses (splitting a table row's synthesized sentence) -- kept
   here rather than in either of those so neither has to import it from the other, which would make
   them import each other in a cycle.

   Why split this granularly rather than just per sentence: Chrome's speechSynthesis can silently
   cut a long utterance short partway through and skip straight to the next plan entry without ever
   finishing it -- confirmed on 2026-08-16 from a recording Louis made, a ~240-character/40-word
   paragraph (nowhere near the length TTS bug reports usually blame) stopped dead after its first
   sentence and jumped to the next heading. Splitting this small removes the need for a separate
   pause model on top of charsPerSecond too (cf. its own comment in reader.js) -- the gap between
   two separate utterances stands in for the pause a comma or colon would otherwise need modeled
   inside one. */
export const CLAUSE_END_PATTERN = /[.!?…]+[)»"'’”]*|[,;:](?!\d)/g;

/**
 * Splits plain text (not a live DOM node, unlike collectLeafSegments' own clause splitting in
 * reader.js) at every CLAUSE_END_PATTERN match. Used for a table row's own synthesized sentence
 * (cf. reader-table.js's collectTableSegments) rather than Text.splitText(), since there's no
 * original DOM text run to keep matched up with a `words` list here -- a table row's highlight
 * never goes word by word (cf. collectTableSegments' own comment on why), so nothing needs that
 * alignment.
 *
 * @param {string} text
 * @returns {string[]} non-empty, spoken-content-bearing chunks, in order
 */
export function splitIntoClauses(text) {
    const chunks = [];
    let lastIndex = 0;
    CLAUSE_END_PATTERN.lastIndex = 0;
    let match;
    while ((match = CLAUSE_END_PATTERN.exec(text))) {
        chunks.push(text.slice(lastIndex, match.index + match[0].length));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) chunks.push(text.slice(lastIndex));
    return chunks.map(chunk => chunk.trim()).filter(chunk => HAS_SPOKEN_CONTENT.test(chunk));
}
