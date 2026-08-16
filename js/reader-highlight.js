import { createTag } from "./tags.js";

/* Two mutually exclusive highlight tiers for the "speak" entry currently playing --
   READER_HIGHLIGHT_CLASS marks the whole entry (an inline wrapper for buffered text, cf.
   wrapSegmentWords() -- or the `code` element itself for an inline-code entry). READER_ACTIVE_WORD_CLASS
   instead marks the one word currently being spoken, replacing the whole-entry highlight rather
   than layering on top of it. Which word that is comes from the real `boundary` event where it
   fires, corrected on top of a timer-based estimate that runs regardless (cf. scheduleEstimatedWords()
   and setActiveWord()) -- so an entry with nothing to highlight word by word (no `words`, e.g. an
   inline-code entry) is the only case that keeps the whole-entry highlight for its full duration. */
const READER_HIGHLIGHT_CLASS = "readerActiveParagraph";
const READER_ACTIVE_WORD_CLASS = "readerActiveWord";
let highlightedTarget = null;
let highlightedWords = [];
let activeWordIndex = -1;

/**
 * Switches the base highlight to `entry`, replacing whatever was highlighted before, and drops
 * any active word highlight from the previous entry -- a new entry starting to play means
 * `boundary` (if it fires at all for it) hasn't reported a word yet.
 *
 * `highlightedWords` is refreshed on every call, even when `highlightTarget` is the very same
 * element as before (only the CSS class churn is skipped then, to avoid a pointless remove+add) --
 * a table row's own entries all share one `tr` as their highlightTarget (cf. reader-table.js's
 * collectTableSegments), so skipping the refresh there too would leave `highlightedWords` stuck on
 * whichever cell's entry happened to play first in that row, silently pinning the word highlight to
 * that cell's own words for the rest of the row regardless of which cell is actually being spoken
 * (reported by Louis on 2026-08-16: highlight stuck on the first cell of a table's first row).
 *
 * @param {{highlightTarget: HTMLElement, words: HTMLElement[]}} entry
 */
export function setHighlightedEntry(entry) {
    if (entry.highlightTarget !== highlightedTarget) {
        highlightedTarget?.classList.remove(READER_HIGHLIGHT_CLASS);
        entry.highlightTarget.classList.add(READER_HIGHLIGHT_CLASS);
        highlightedTarget = entry.highlightTarget;
    }
    setActiveWord(-1);
    highlightedWords = entry.words;
}

/** Removes both highlight tiers -- nothing is being spoken once this runs. */
export function clearHighlight() {
    highlightedTarget?.classList.remove(READER_HIGHLIGHT_CLASS);
    highlightedTarget = null;
    setActiveWord(-1);
    highlightedWords = [];
}

/**
 * Moves READER_ACTIVE_WORD_CLASS to `highlightedWords[index]`, if that word exists -- `index`
 * comes from an approximate mapping (cf. wordIndexAtChar()) between `boundary`'s charIndex into
 * the spoken (post-speakableText) text and the original DOM words wrapped by
 * wrapSegmentWords(), so it's clamped implicitly by the array lookup rather than asserted exact.
 *
 * The two highlight tiers are exclusive, not stacked: as soon as a word actually gets
 * highlighted, READER_HIGHLIGHT_CLASS drops off `highlightedTarget` so only the word shows --
 * layering "this whole paragraph" under "this exact word" read as redundant. It comes back the
 * moment there's no active word again (index -1: a new entry starting, cf. setHighlightedEntry,
 * or playback stopping, cf. clearHighlight), which is also the permanent state for an entry with
 * no `words` to highlight at all (cf. reader.js's collectLeafSegments).
 *
 * @param {number} index -1 to clear without setting a new word
 */
export function setActiveWord(index) {
    if (index === activeWordIndex) return;
    highlightedWords[activeWordIndex]?.classList.remove(READER_ACTIVE_WORD_CLASS);
    activeWordIndex = index;
    const word = highlightedWords[activeWordIndex];
    word?.classList.add(READER_ACTIVE_WORD_CLASS);
    highlightedTarget?.classList.toggle(READER_HIGHLIGHT_CLASS, !word);
}

/* A "word" for highlighting purposes: any maximal run of non-space characters, trailing
   punctuation included -- matches how wrapSegmentWords() below splits the original DOM text, so
   a word index counted in one lines up with the same index counted in the other. Exported so
   reader-clauses.js/reader-table.js can count words the same way when slicing a table row's own
   `words` array alongside its synthesized sentence (cf. reader-table.js's collectTableSegments). */
export const WORD_PATTERN = /\S+/g;

/**
 * @param {string} text the utterance's own (post-speakableText) text
 * @param {number} charIndex a `boundary` event's charIndex into that text, expected to land on
 *   the first character of the word it's announcing
 * @returns {number} the 0-based index of that word among WORD_PATTERN's matches in `text`
 */
export function wordIndexAtChar(text, charIndex) {
    return [...text.slice(0, charIndex).matchAll(WORD_PATTERN)].length;
}

/**
 * Replaces each word of text-node content under `root` with its own `<span class="readerWord">`
 * (whitespace/punctuation between words left as-is), so setActiveWord() has an element to target
 * per word. Recurses into every element under `root`, formatting elements (`strong`, `em`, a
 * link...) and `code` alike -- a `code` element only ever reaches this function already folded
 * into the surrounding sentence as one of its ordinary words (cf. reader.js's collectLeafSegments:
 * a `code` span with actual pronunciation to rewrite becomes its own separate entry instead,
 * bypassing wrapSegmentWords()/this function entirely). Skipping `code` here used to leave a
 * folded one with no word span of its own even though entry.text's own word count (cf.
 * scheduleEstimatedWords()) still included it -- invisible to the word highlight, and silently
 * shifting every word index after it out of alignment with the real word spans (reported by Louis
 * on 2026-08-16, "le highlight skip les codes inline").
 *
 * @param {HTMLElement} root
 * @param {HTMLElement[]} out appended to in document order
 */
function wrapWordsInPlace(root, out) {
    Array.from(root.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const matches = [...text.matchAll(WORD_PATTERN)];
            if (!matches.length) return;
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            matches.forEach(match => {
                const [word] = match;
                if (match.index > lastIndex) frag.append(text.slice(lastIndex, match.index));
                const span = createTag("span", { class: "readerWord" }, { textContent: word });
                frag.append(span);
                out.push(span);
                lastIndex = match.index + word.length;
            });
            if (lastIndex < text.length) frag.append(text.slice(lastIndex));
            node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapWordsInPlace(node, out);
        }
    });
}

/**
 * Moves `nodes` (a run of a leaf's own children collected by reader.js's collectLeafSegments
 * between two inline `code` spans, or up to the leaf's boundary) into one new
 * `<span class="readerSegment">` in their place, then word-wraps its content in place.
 *
 * Why a wrapper: `nodes`' original parent is the leaf itself, a block element whose own
 * background would span its full width regardless of where the text actually ends on each line
 * (a short last line would still highlight edge-to-edge). `readerSegment` is inline instead, so
 * its background paints one line-box at a time, sized to that line's own text -- same mechanism
 * `pre code`'s own comment in base.css documents, used here for the opposite effect.
 *
 * @param {ChildNode[]} nodes non-empty, all siblings, still attached to their original parent
 * @returns {{wrapper: HTMLElement, words: HTMLElement[]}} the new wrapper, and the words wrapped
 *   inside it in document order (empty if `nodes` turned out to hold no actual word, e.g. a lone
 *   folded-in code span -- cf. reader.js's collectLeafSegments)
 */
export function wrapSegmentWords(nodes) {
    const wrapper = createTag("span", { class: "readerSegment" });
    nodes[0].parentNode.insertBefore(wrapper, nodes[0]);
    nodes.forEach(node => wrapper.append(node));
    const words = [];
    wrapWordsInPlace(wrapper, words);
    return { wrapper, words };
}

/* Estimated speaking rate driving the word-by-word highlight's timing (cf. scheduleEstimatedWords()
   below) when the `boundary` event doesn't fire at all -- which turned out to be every browser
   tested while building this feature (cf. devpedia-todo.md), not just the "no boundary" edge case
   (Chrome on Android) it was originally written for. Recalibrated after every utterance from how
   long it actually took to speak (cf. reader.js's speakNext()/calibrateRate() below), so it
   converges on this session's actual voice/rate within the first couple of entries rather than
   staying a guess. Starts at a plausible default for a "rate: 1" utterance so the very first entry
   (still running on this default, with no calibrated measurement yet to correct it) isn't wildly
   off -- tuned up from an initial 17 by Louis listening on 2026-08-16.

   No separate pause modeling needed on top of this (an earlier version had one, per-punctuation --
   removed 2026-08-16): each entry is now one clause at most (cf. reader-clauses.js's
   CLAUSE_END_PATTERN), split at every comma/semicolon/colon/sentence end rather than reading a
   whole paragraph as a single utterance, so there's no punctuation pause left *inside* an entry to
   account for -- the gap between separate utterances covers it instead. That split also happens to
   be why word-by-word can rely on a single flat rate at all: fitting one constant to a short,
   single-clause entry is far more tractable than to a long paragraph mixing short and long
   sentences with a different number of pauses each (tuning that by ear on 2026-08-16 kept reading
   right on one paragraph and wrong on the next, no matter which constant got picked). */
let charsPerSecond = 38;

/* How strongly one utterance's measured rate moves charsPerSecond (0 = ignore it, 1 = replace it
   outright). High on purpose: a voice's rate is constant for the whole session once picked, so
   there's little value in a slow crawl toward it the way a genuinely noisy signal would need --
   converging within the first entry or two matters more here than smoothing out noise. Raised
   alongside the default above on 2026-08-16: still general, uniform lag reported after 17 -> 20 ->
   22 (each confirmed "still slow" by Louis), so convergence needed to be faster too, not just the
   starting point higher -- a few seconds of a wrong guess shouldn't take several paragraphs to
   wash out. */
const CALIBRATION_WEIGHT = 0.75;

/* How much scheduleEstimatedWords() below speeds up toward the end of a long entry, per word it
   has -- 0.05 means a 3-word entry tops out around 15% faster by its last word (negligible, cf.
   "sans modifier le pace des lignes courtes" below), a 20-word one around 100% faster (twice
   charsPerSecond). Capped so an unusually long entry doesn't run away into an absurd speed.
   Requested by Louis on 2026-08-16 as a general safety margin against charsPerSecond being a bit
   off for the entry currently playing: since there's no way to know *this* entry's real duration
   until it's over (cf. charsPerSecond's own comment on why calibration only ever corrects the
   *next* entry), a long entry that's running behind gets a chance to visibly close some of that
   gap by its own end rather than just handing the whole shortfall to whatever plays after it --
   scaled by length so a short entry, which was never at much risk of drifting far in the first
   place, keeps its pace essentially untouched. */
const MAX_ACCELERATION_PER_WORD = 0.05;
const MAX_ACCELERATION_CAP = 1.5;

/**
 * Recalibrates charsPerSecond from how long an utterance actually took to speak (cf. reader.js's
 * speakNext(), utterance.onend), so the word-timing estimate converges on this session's real
 * voice/rate rather than staying a guess. Kept private to this module (unlike a plain exported
 * `charsPerSecond` binding) so scheduleEstimatedWords() below is the only thing that ever reads
 * the raw value, and every write goes through the same weighted-average rule.
 *
 * @param {number} measuredRate characters per second this utterance actually spoke at
 */
export function calibrateRate(measuredRate) {
    charsPerSecond = charsPerSecond * (1 - CALIBRATION_WEIGHT) + measuredRate * CALIBRATION_WEIGHT;
}

/**
 * Schedules setActiveWord() calls timed to land roughly when each word of `entry.text` should
 * start being spoken, estimated from `charsPerSecond` -- the only way to get a word-by-word
 * highlight on a browser that never fires `boundary` (cf. charsPerSecond's own comment). Kept
 * running alongside `boundary` rather than instead of it: a real event is always more accurate
 * than this estimate, so reader.js's utterance.onboundary still calls setActiveWord() directly
 * on top of whatever this schedule produces, correcting it wherever the browser actually reports.
 *
 * The pace itself isn't flat: it ramps up word over word (cf. MAX_ACCELERATION_PER_WORD) rather
 * than staying at a constant charsPerSecond the whole way through.
 *
 * A short entry (a heading, a table cell) can finish being spoken -- and hand the highlight to the
 * entry after it -- before every one of its own words' timers has fired. Without the
 * `highlightedTarget` check below, such a late timer would call setActiveWord() using an index
 * that means nothing for whatever entry is *now* playing, flipping the highlight between the
 * paragraph and word tiers seemingly at random on short entries (reported by Louis on 2026-08-16,
 * "notamment sur les titres et les tableaux"). `isStillCurrent` alone doesn't catch this -- that
 * one only guards a stop/restart, not ordinary entry-to-entry progress within the same playback
 * run.
 *
 * @param {{text: string, words: HTMLElement[], highlightTarget: HTMLElement}} entry
 * @param {() => boolean} isStillCurrent reports whether this call's playback generation is still
 *   the active one (cf. reader.js's own `generation` counter), so a stop/restart/skip silently
 *   drops every timer still pending instead of moving the highlight on a since-abandoned entry --
 *   a plain generation number isn't passed directly since it would already be stale by the time a
 *   timer fires; this closure reads reader.js's live counter instead
 */
export function scheduleEstimatedWords(entry, isStillCurrent) {
    if (!entry.words.length) return; // nothing to highlight word by word (cf. reader.js's collectLeafSegments)
    const totalWords = entry.words.length;
    const maxAcceleration = Math.min(MAX_ACCELERATION_CAP, totalWords * MAX_ACCELERATION_PER_WORD);
    let wordIndex = 0;
    let cumulativeMs = 0;
    let lastCharIndex = 0;
    for (const match of entry.text.matchAll(WORD_PATTERN)) {
        /* Rate ramps applied per-gap since the previous word, not from match.index directly, for
           a smooth curve rather than a jump recomputed from scratch each time. */
        const progress = wordIndex / totalWords;
        const effectiveRate = charsPerSecond * (1 + maxAcceleration * progress);
        cumulativeMs += ((match.index - lastCharIndex) / effectiveRate) * 1000;
        lastCharIndex = match.index;
        const index = wordIndex++;
        const delayMs = cumulativeMs;
        setTimeout(() => {
            if (isStillCurrent() && highlightedTarget === entry.highlightTarget) setActiveWord(index);
        }, delayMs);
    }
}
