import { createTag } from "./tags.js";

/* Two mutually exclusive highlight tiers for the "speak" entry currently playing --
   READER_HIGHLIGHT_CLASS marks the whole entry, READER_ACTIVE_WORD_CLASS the one word currently
   spoken, replacing (not layering on) the whole-entry highlight while it's active. */
const READER_HIGHLIGHT_CLASS = "readerActiveParagraph";
const READER_ACTIVE_WORD_CLASS = "readerActiveWord";
let highlightedTarget = null;
let highlightedWords = [];
let activeWordIndex = -1;

/**
 * @brief Switches the base highlight to `entry`, replacing whatever was highlighted before, and
 * clears any active word highlight from the previous entry.
 *
 * @example
 * A table row's entries all share one `tr` as their highlightTarget: `highlightedWords` must
 * still refresh every call, or it stays pinned to whichever cell played first in that row.
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

/** @brief Removes both highlight tiers -- nothing is being spoken once this runs. */
export function clearHighlight() {
    highlightedTarget?.classList.remove(READER_HIGHLIGHT_CLASS);
    highlightedTarget = null;
    setActiveWord(-1);
    highlightedWords = [];
}

/**
 * @brief Moves READER_ACTIVE_WORD_CLASS to `highlightedWords[index]`, if that word exists,
 * exclusively replacing the whole-entry highlight while a word is active.
 *
 * @param {number} index -1 to clear without setting a new word
 */
export function setActiveWord(index) {
    if (index === activeWordIndex) return;
    highlightedWords[activeWordIndex]?.classList.remove(READER_ACTIVE_WORD_CLASS);
    activeWordIndex = index;
    const word = highlightedWords[activeWordIndex];
    word?.classList.add(READER_ACTIVE_WORD_CLASS);
    /* Comes back the moment there's no active word (index -1), the permanent state for a
       words-less entry too (cf. wrapSegmentWords()'s own empty-array case). */
    highlightedTarget?.classList.toggle(READER_HIGHLIGHT_CLASS, !word);
}

/* A "word": any maximal run of non-space characters, matching how wrapSegmentWords() below splits
   DOM text. Exported so reader-clauses.js/reader-table.js count words the same way. */
export const WORD_PATTERN = /\S+/g;

/**
 * @brief Maps a `boundary` event's charIndex to a 0-based word index among WORD_PATTERN's own
 * matches in `text`.
 *
 * @param {string} text the utterance's own (post-speakableText) text
 * @param {number} charIndex a `boundary` event's charIndex into that text, expected to land on
 *   the first character of the word it's announcing
 *
 * @returns {number} the 0-based index of that word among WORD_PATTERN's matches in `text`
 */
export function wordIndexAtChar(text, charIndex) {
    return [...text.slice(0, charIndex).matchAll(WORD_PATTERN)].length;
}

/**
 * @brief Replaces each word of text-node content under `root` with its own
 * `<span class="readerWord">`, recursing into every descendant element.
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
            /* Recurses into `code` too: a folded code span left unwrapped here used to desync
               every later word index from its real span (Louis, 2026-08-16). */
            wrapWordsInPlace(node, out);
        }
    });
}

/**
 * @brief Moves `nodes` into one new `<span class="readerSegment">` in their place, then
 * word-wraps its content in place.
 *
 * @param {ChildNode[]} nodes non-empty, all siblings, still attached to their original parent
 *
 * @returns {{wrapper: HTMLElement, words: HTMLElement[]}} the new wrapper, and the words wrapped
 *   inside it in document order (empty if `nodes` held no actual word)
 */
export function wrapSegmentWords(nodes) {
    /* Inline, not the block-level leaf itself: paints one line-box at a time instead of a
       background spanning the leaf's full width regardless of where the text ends. */
    const wrapper = createTag("span", { class: "readerSegment" });
    nodes[0].parentNode.insertBefore(wrapper, nodes[0]);
    nodes.forEach(node => wrapper.append(node));
    const words = [];
    wrapWordsInPlace(wrapper, words);
    return { wrapper, words };
}

/* Estimated speaking rate driving word-by-word timing when `boundary` never fires (every browser
   tested, cf. devpedia-todo.md). Recalibrated after every utterance (cf. calibrateRate() below);
   this default is just the starting guess before the first real measurement corrects it. */
let charsPerSecond = 38;

/* How strongly one utterance's measured rate moves charsPerSecond (0 = ignore, 1 = replace
   outright). High on purpose: a voice's rate is constant for the session, so converging fast
   matters more here than smoothing out noise (Louis, 2026-08-16, still slow after 17 -> 20 -> 22). */
const CALIBRATION_WEIGHT = 0.75;

/* How much scheduleEstimatedWords() below speeds up toward the end of a long entry, per word --
   capped so an unusually long entry can't run away. Lets a long entry running behind visibly close
   some of the gap by its own end, scaled so a short entry stays essentially untouched. */
const MAX_ACCELERATION_PER_WORD = 0.05;
const MAX_ACCELERATION_CAP = 1.5;

/**
 * @brief Recalibrates charsPerSecond from how long an utterance actually took to speak, so the
 * word-timing estimate converges on this session's real voice/rate.
 *
 * @param {number} measuredRate characters per second this utterance actually spoke at
 */
export function calibrateRate(measuredRate) {
    charsPerSecond = charsPerSecond * (1 - CALIBRATION_WEIGHT) + measuredRate * CALIBRATION_WEIGHT;
}

/**
 * @brief Schedules setActiveWord() calls timed to land roughly when each of `entry.words` should
 * start being spoken. Estimated from `charsPerSecond` by default -- runs alongside the real
 * `boundary` event rather than instead of it, which always wins when it fires (speechSynthesis
 * path). Given `knownDurationMs`, uses that exact clip length instead of the estimate and skips the
 * acceleration ramp entirely, since there's nothing left to guess (pre-generated audio path,
 * cf. speakNextViaAudio() in reader.js): the real duration is already an exact fit, start to end.
 *
 * @param {{text: string, words: HTMLElement[], highlightTarget: HTMLElement}} entry
 * @param {() => boolean} isStillCurrent reports whether this call's playback generation is still
 *   the active one
 * @param {number|null} [knownDurationMs] this entry's real spoken duration, if already known
 */
export function scheduleEstimatedWords(entry, isStillCurrent, knownDurationMs = null) {
    if (!entry.words.length) return; // nothing to highlight word by word
    const totalWords = entry.words.length;
    /* `entry.text` (what's actually spoken) can have a different word count than `entry.words`
       (the DOM spans actually highlighted) whenever speakableText() rewrites a symbol into
       several spoken words or the reverse (an arrow, a superscript, "%"...). Distributing time by
       each DOM word's own character length -- instead of re-tokenizing entry.text and assuming
       its Nth match lines up with entry.words[N] -- keeps every scheduled index inside
       entry.words' own bounds no matter how the two diverge (Louis, 2026-08-22: the highlight
       used to jump backward mid-sentence once that assumption broke). */
    const rate = knownDurationMs ? entry.text.length / (knownDurationMs / 1000) : charsPerSecond;
    const maxAcceleration = knownDurationMs ? 0 : Math.min(MAX_ACCELERATION_CAP, totalWords * MAX_ACCELERATION_PER_WORD);
    let cumulativeMs = 0;
    entry.words.forEach((word, index) => {
        const progress = index / totalWords;
        const effectiveRate = rate * (1 + maxAcceleration * progress);
        const delayMs = cumulativeMs;
        setTimeout(() => {
            /* A short entry can hand the highlight to the next one before all its own timers
               fire -- without this check, a late timer would move the highlight on the wrong entry. */
            if (isStillCurrent() && highlightedTarget === entry.highlightTarget) setActiveWord(index);
        }, delayMs);
        // +1 for the space following the word, matching the gap the old char-index math counted.
        cumulativeMs += ((word.textContent.length + 1) / effectiveRate) * 1000;
    });
}
