import { HAS_SPOKEN_CONTENT } from "./reader-pronunciation.js";
import { WORD_PATTERN } from "./reader-highlight.js";

/* A clause boundary: sentence-ending marks, or a comma/semicolon/colon not between two digits
   (a decimal/ratio, not a pause). Split this granularly, not per sentence, since Chrome's
   speechSynthesis can silently cut a long utterance short partway through (Louis, 2026-08-16). */
export const CLAUSE_END_PATTERN = /[.!?…]+[)»"'’”]*|[,;:](?!\d)/g;

/**
 * Splits plain text (not a live DOM node, unlike collectLeafSegments' own clause splitting in
 * reader.js) at every CLAUSE_END_PATTERN match. Used for a table row's own synthesized sentence
 * (cf. reader-table.js's collectTableSegments) rather than Text.splitText(), since there's no
 * single original DOM text run left for the whole sentence -- it's assembled from several cells'
 * own text plus synthesized connector words (cf. reader-table.js's joinPartsGroups).
 *
 * `words` is expected aligned with `text` the same way an entry's own `words` is aligned with its
 * `entry.text` elsewhere (cf. reader-highlight.js's WORD_PATTERN): one element per word `text`
 * contains, in order. Each returned chunk gets whichever of `words` belongs to it -- matched up by
 * re-finding `text`'s own WORD_PATTERN matches ONCE and keeping each one with whichever chunk range
 * its own start position falls in, rather than recounting words separately on each chunk's own
 * slice. The two only ever disagree right at a cut a clause-ending mark shares with an immediately
 * following connector's own punctuation (e.g. a row's own "?" bumping straight into the ", " a
 * table row's synthesized sentence glues on next, cf. reader-table.js's joinPartsGroups) -- there,
 * WORD_PATTERN fuses "?," into one word since neither side has a space, but CLAUSE_END_PATTERN
 * still cuts between them, so recounting a chunk's own slice in isolation would count that shared
 * word once on each side of the cut, one too many overall, and drift every word after it by one
 * position (caught live on 2026-08-16 testing table word-by-word highlight).
 *
 * A word can also start exactly on a clause-ending character that gets its own tiny range with
 * nothing else in it (a code span like `` `!motif` `` puts a bare "!" -- itself a sentence-ending
 * mark -- right at the start of a fused "!motif" word): that range gets filtered out below for
 * having no real spoken content, so the word landing inside it can't just be dropped along with
 * it -- doing so silently shifts every real word in the NEXT surviving chunk one position too
 * early, since that chunk's own word count no longer matches how many of `words` it actually
 * receives (caught live on 2026-08-16 testing table word-by-word highlight, alongside the
 * off-by-one above). Carried forward instead, prepended to whichever chunk survives next.
 *
 * The same fused word can also land astride two SURVIVING chunks instead (`` `!motif` `` preceded
 * by real prose: the "!" ends up alone in one chunk, "motif" starts the next, with nothing between
 * them for the cut to discard) -- there, the word itself is already fully spent on the first chunk
 * it started in, leaving the second chunk structurally one word short of its own token count with
 * no leftover word to give it. Detected by comparing each surviving chunk's own WORD_PATTERN count
 * against what it actually received (carried-forward plus start-owned); any shortfall gets padded
 * with `null` placeholders, the same fallback an ordinary connector word already uses.
 *
 * @param {string} text
 * @param {Array} words same length as `text`'s own WORD_PATTERN match count
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
            const localWordCount = (chunkText.match(WORD_PATTERN) ?? []).length;
            const shortfall = localWordCount - (carriedWords.length + ownWords.length);
            const fillers = shortfall > 0 ? Array(shortfall).fill(null) : [];
            chunks.push({ text: chunkText, words: [...carriedWords, ...fillers, ...ownWords] });
            carriedWords = [];
        } else {
            carriedWords = [...carriedWords, ...ownWords];
        }
    });
    return chunks;
}
