import { createTag } from "./tags.js";
import { appState } from "./state.js";
import { speakableCode, speakableText, PAGE_SPECIFIC_CONTEXT, HAS_SPOKEN_CONTENT } from "./reader-pronunciation.js";

// Web Speech API only (no cloud TTS, no auto-hosted engine) -- the site is 100% static
// (GitHub Pages), so this is the only option with zero cost and zero infrastructure.
// See devpedia-todo.md for the decisions this module implements. Pronunciation rules (how a
// page's own text gets rewritten into what's actually spoken) live in reader-pronunciation.js
// instead -- a separate reason to change from the reading engine/highlighting/UI below.
export const SPEECH_SUPPORTED = "speechSynthesis" in window;
const synth = SPEECH_SUPPORTED ? window.speechSynthesis : null;

/**
 * Resolves once it's known whether the browser can actually produce speech, not just whether the
 * Web Speech API object exists (cf. SPEECH_SUPPORTED). A browser can have the API but zero usable
 * voices -- confirmed on 2026-08-16 for Brave on Linux, whose anti-fingerprinting protection
 * deliberately empties the list `getVoices()` returns (cf. devpedia-todo.md) -- in which case
 * every speak() call fails silently and the reader control would otherwise sit there looking
 * broken rather than explaining why. Not Brave-specific by design: this reacts to the voice list
 * actually being empty, whatever the reason, so it degrades the same way for any other browser or
 * privacy setting that ends up in the same state, known today or not.
 *
 * getVoices() can genuinely return empty for a brief moment even on a browser that does have
 * voices -- they load asynchronously on some engines -- so a single synchronous call can't tell
 * "temporarily not loaded yet" apart from "genuinely none". Waits for the voiceschanged event
 * (fired once the real list is ready), or a short timeout in case that event never comes, before
 * concluding either way.
 *
 * @returns {Promise<boolean>}
 */
export function hasUsableVoice() {
    if (!SPEECH_SUPPORTED) return Promise.resolve(false);
    if (synth.getVoices().length > 0) return Promise.resolve(true);
    return new Promise(resolve => {
        const timeoutId = setTimeout(finish, 1000);
        function finish() {
            clearTimeout(timeoutId);
            synth.removeEventListener("voiceschanged", finish);
            resolve(synth.getVoices().length > 0);
        }
        synth.addEventListener("voiceschanged", finish);
    });
}

// Elements read as one spoken unit; everything else (blockquote, ul/ol, table/thead/tbody/tr,
// div.tableWrapper, chart containers...) is a structural container, walked but never itself
// read as a block.
const LEAF_TAGS = new Set(["H2", "H3", "H4", "H5", "H6", "P", "LI", "TH", "TD"]);

// Router-generated UI, not page content -- cf. router.js's createAppendPageNav/createBreadcrumb
// and generateChildList.
const IGNORED_SELECTOR = ".pageNav, .pageBreadcrumb, .childList";

// The reading plan: an ordered list of {kind: "speak", text, lang, group, highlightTarget, words}
// and {kind: "pause", element} entries, rebuilt by buildReadingPlan() on every page render.
// `group` is the leaf element a "speak" entry was split from (cf. collectLeafSegments) -- entries
// sharing the same `group` are one paragraph for replayParagraph()'s purposes. `highlightTarget`
// and `words` are also set by collectLeafSegments (cf. wrapSegmentWords()), used by
// setHighlightedEntry()/setActiveWord() to drive the read-aloud highlight.
let plan = [];
let planIndex = 0;
let isPlaying = false;
let isPausedAtCode = false;

// True after pauseReading() (the reader control's own "Pause" button), distinct from
// isPausedAtCode (paused automatically at a `pre` block, waiting for "Continuer") and from the
// fully-stopped state (neither flag set, planIndex reset to 0 by resetPlayback()). `planIndex`
// itself is left untouched while paused, so resumeReading() re-speaks the same clause from its
// own start rather than the whole paragraph -- close enough to "resume exactly where it stopped"
// now that clauses are short (cf. collectLeafSegments' CLAUSE_END_PATTERN), and far simpler than
// tracking a mid-utterance offset through synth.pause()/resume() for what would be a barely
// noticeable difference. Requested by Louis on 2026-08-16.
let isPaused = false;

// Index in `plan` of the last (or currently playing) "speak" entry, so replayParagraph() knows
// which paragraph to restart even after playback has stopped or paused at a code block. Cleared
// by resetPlayback() since a rebuilt/torn-down plan invalidates it.
let lastSpokenIndex = null;

// Two mutually exclusive highlight tiers for the "speak" entry currently playing --
// READER_HIGHLIGHT_CLASS marks the whole entry (an inline wrapper for buffered text, cf.
// wrapSegmentWords() -- or the `code` element itself for an inline-code entry). READER_ACTIVE_WORD_CLASS
// instead marks the one word currently being spoken, replacing the whole-entry highlight rather
// than layering on top of it. Which word that is comes from the real `boundary` event where it
// fires, corrected on top of a timer-based estimate that runs regardless (cf. scheduleEstimatedWords()
// and setActiveWord()) -- so an entry with nothing to highlight word by word (no `words`, e.g. an
// inline-code entry) is the only case that keeps the whole-entry highlight for its full duration.
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
 * @param {{highlightTarget: HTMLElement, words: HTMLElement[]}} entry
 */
function setHighlightedEntry(entry) {
    if (entry.highlightTarget === highlightedTarget) return;
    highlightedTarget?.classList.remove(READER_HIGHLIGHT_CLASS);
    entry.highlightTarget.classList.add(READER_HIGHLIGHT_CLASS);
    highlightedTarget = entry.highlightTarget;
    setActiveWord(-1);
    highlightedWords = entry.words;
}

/** Removes both highlight tiers -- nothing is being spoken once this runs. */
function clearHighlight() {
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
 * no `words` to highlight at all (cf. collectLeafSegments).
 *
 * @param {number} index -1 to clear without setting a new word
 */
function setActiveWord(index) {
    if (index === activeWordIndex) return;
    highlightedWords[activeWordIndex]?.classList.remove(READER_ACTIVE_WORD_CLASS);
    activeWordIndex = index;
    const word = highlightedWords[activeWordIndex];
    word?.classList.add(READER_ACTIVE_WORD_CLASS);
    highlightedTarget?.classList.toggle(READER_HIGHLIGHT_CLASS, !word);
}

// A "word" for highlighting purposes: any maximal run of non-space characters, trailing
// punctuation included -- matches how wrapSegmentWords() below splits the original DOM text, so
// a word index counted in one lines up with the same index counted in the other.
const WORD_PATTERN = /\S+/g;

/**
 * @param {string} text the utterance's own (post-speakableText) text
 * @param {number} charIndex a `boundary` event's charIndex into that text, expected to land on
 *   the first character of the word it's announcing
 * @returns {number} the 0-based index of that word among WORD_PATTERN's matches in `text`
 */
function wordIndexAtChar(text, charIndex) {
    return [...text.slice(0, charIndex).matchAll(WORD_PATTERN)].length;
}

/**
 * Replaces each word of text-node content under `root` with its own `<span class="readerWord">`
 * (whitespace/punctuation between words left as-is), so setActiveWord() has an element to target
 * per word. Recurses into every element under `root`, formatting elements (`strong`, `em`, a
 * link...) and `code` alike -- a `code` element only ever reaches this function already folded
 * into the surrounding sentence as one of its ordinary words (cf. collectLeafSegments: a `code`
 * span with actual pronunciation to rewrite becomes its own separate entry instead, bypassing
 * wrapSegmentWords()/this function entirely). Skipping `code` here used to leave a folded one with
 * no word span of its own even though entry.text's own word count (cf. scheduleEstimatedWords())
 * still included it -- invisible to the word highlight, and silently shifting every word index
 * after it out of alignment with the real word spans (reported by Louis on 2026-08-16, "le
 * highlight skip les codes inline").
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
 * Moves `nodes` (a run of a leaf's own children collected by collectLeafSegments between two
 * inline `code` spans, or up to the leaf's boundary) into one new `<span class="readerSegment">`
 * in their place, then word-wraps its content in place.
 *
 * Why a wrapper: `nodes`' original parent is the leaf itself, a block element whose own
 * background would span its full width regardless of where the text actually ends on each line
 * (a short last line would still highlight edge-to-edge). `readerSegment` is inline instead, so
 * its background paints one line-box at a time, sized to that line's own text -- same mechanism
 * `pre code`'s own comment above documents, used here for the opposite effect.
 *
 * @param {ChildNode[]} nodes non-empty, all siblings, still attached to their original parent
 * @returns {{wrapper: HTMLElement, words: HTMLElement[]}} the new wrapper, and the words wrapped
 *   inside it in document order (empty if `nodes` turned out to hold no actual word, e.g. a lone
 *   folded-in code span -- cf. collectLeafSegments)
 */
function wrapSegmentWords(nodes) {
    const wrapper = createTag("span", { class: "readerSegment" });
    nodes[0].parentNode.insertBefore(wrapper, nodes[0]);
    nodes.forEach(node => wrapper.append(node));
    const words = [];
    wrapWordsInPlace(wrapper, words);
    return { wrapper, words };
}

// Estimated speaking rate driving the word-by-word highlight's timing (cf. scheduleEstimatedWords()
// below) when the `boundary` event doesn't fire at all -- which turned out to be every browser
// tested while building this feature (cf. devpedia-todo.md), not just the "no boundary" edge case
// (Chrome on Android) it was originally written for. Recalibrated after every utterance from how
// long it actually took to speak (cf. speakNext()'s utterance.onend, CALIBRATION_WEIGHT below), so
// it converges on this session's actual voice/rate within the first couple of entries rather than
// staying a guess. Starts at a plausible default for a "rate: 1" utterance so the very first entry
// (still running on this default, with no calibrated measurement yet to correct it) isn't wildly
// off -- tuned up from an initial 17 by Louis listening on 2026-08-16.
//
// No separate pause modeling needed on top of this (an earlier version had one, per-punctuation --
// removed 2026-08-16): each entry is now one clause at most (cf. collectLeafSegments' own
// CLAUSE_END_PATTERN), split at every comma/semicolon/colon/sentence end rather than reading a
// whole paragraph as a single utterance, so there's no punctuation pause left *inside* an entry to
// account for -- the gap between separate utterances covers it instead. That split also happens to
// be why word-by-word can rely on a single flat rate at all: fitting one constant to a short,
// single-clause entry is far more tractable than to a long paragraph mixing short and long
// sentences with a different number of pauses each (tuning that by ear on 2026-08-16 kept reading
// right on one paragraph and wrong on the next, no matter which constant got picked).
let charsPerSecond = 38;

// How strongly one utterance's measured rate moves charsPerSecond (0 = ignore it, 1 = replace it
// outright). High on purpose: a voice's rate is constant for the whole session once picked, so
// there's little value in a slow crawl toward it the way a genuinely noisy signal would need --
// converging within the first entry or two matters more here than smoothing out noise. Raised
// alongside the default above on 2026-08-16: still general, uniform lag reported after 17 -> 20 ->
// 22 (each confirmed "still slow" by Louis), so convergence needed to be faster too, not just the
// starting point higher -- a few seconds of a wrong guess shouldn't take several paragraphs to
// wash out.
const CALIBRATION_WEIGHT = 0.75;

// How much scheduleEstimatedWords() below speeds up toward the end of a long entry, per word it
// has -- 0.05 means a 3-word entry tops out around 15% faster by its last word (negligible, cf.
// "sans modifier le pace des lignes courtes" below), a 20-word one around 100% faster (twice
// charsPerSecond). Capped so an unusually long entry doesn't run away into an absurd speed.
// Requested by Louis on 2026-08-16 as a general safety margin against charsPerSecond being a bit
// off for the entry currently playing: since there's no way to know *this* entry's real duration
// until it's over (cf. charsPerSecond's own comment on why calibration only ever corrects the
// *next* entry), a long entry that's running behind gets a chance to visibly close some of that
// gap by its own end rather than just handing the whole shortfall to whatever plays after it --
// scaled by length so a short entry, which was never at much risk of drifting far in the first
// place, keeps its pace essentially untouched.
const MAX_ACCELERATION_PER_WORD = 0.05;
const MAX_ACCELERATION_CAP = 1.5;

/**
 * Schedules setActiveWord() calls timed to land roughly when each word of `entry.text` should
 * start being spoken, estimated from `charsPerSecond` -- the only way to get a word-by-word
 * highlight on a browser that never fires `boundary` (cf. charsPerSecond's own comment). Kept
 * running alongside `boundary` rather than instead of it: a real event is always more accurate
 * than this estimate, so utterance.onboundary in speakNext() still calls setActiveWord() directly
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
 * "notamment sur les titres et les tableaux"). The `generation` check alone doesn't catch this --
 * that one only guards a stop/restart, not ordinary entry-to-entry progress within the same
 * playback run.
 *
 * @param {{text: string, words: HTMLElement[], highlightTarget: HTMLElement}} entry
 * @param {number} myGeneration this call's generation, so a stop/restart/skip (which bumps the
 *   module's `generation`) silently drops every timer still pending instead of moving the
 *   highlight on a since-abandoned entry
 */
function scheduleEstimatedWords(entry, myGeneration) {
    if (!entry.words.length) return; // nothing to highlight word by word (cf. collectLeafSegments)
    const totalWords = entry.words.length;
    const maxAcceleration = Math.min(MAX_ACCELERATION_CAP, totalWords * MAX_ACCELERATION_PER_WORD);
    let wordIndex = 0;
    let cumulativeMs = 0;
    let lastCharIndex = 0;
    for (const match of entry.text.matchAll(WORD_PATTERN)) {
        // Rate grows from charsPerSecond at the entry's first word toward charsPerSecond *
        // (1 + maxAcceleration) at its last -- applied to the gap since the previous word rather
        // than to match.index directly, so it's a smooth ramp rather than a jump recomputed from
        // scratch every time.
        const progress = wordIndex / totalWords;
        const effectiveRate = charsPerSecond * (1 + maxAcceleration * progress);
        cumulativeMs += ((match.index - lastCharIndex) / effectiveRate) * 1000;
        lastCharIndex = match.index;
        const index = wordIndex++;
        const delayMs = cumulativeMs;
        setTimeout(() => {
            if (generation === myGeneration && highlightedTarget === entry.highlightTarget) setActiveWord(index);
        }, delayMs);
    }
}

// Bumped by resetPlayback(). synth.cancel() fires an async "error" event on the utterance it
// just interrupted (same onend/onerror handler below), so without this guard that stale callback
// would advance planIndex and call speakNext() again right after a stop, or after plan has
// already been reassigned to the next page -- resuming playback instead of stopping.
let generation = 0;

// Subscribers registered through onStatusChange() below.
const listeners = new Set();

/**
 * @returns {{hasPlan: boolean, isPlaying: boolean, isPaused: boolean, isPausedAtCode: boolean,
 *   canReplay: boolean}} a snapshot of the playback state, for reader-control.js's
 *   createReaderControl() to pick which buttons to show (cf. onStatusChange() below)
 */
export function getReaderStatus() {
    return { hasPlan: plan.length > 0, isPlaying, isPaused, isPausedAtCode, canReplay: lastSpokenIndex !== null };
}

function notify() {
    const status = getReaderStatus();
    listeners.forEach(listener => listener(status));
}

/**
 * Subscribes `listener` to every future playback state change, called once immediately with the
 * current state too so a freshly built control doesn't have to wait for the next change to know
 * what to show. Every createReaderControl() instance (desktop sidebar + mobile floating bar)
 * subscribes here, so both stay in sync with the single shared playback state.
 *
 * @param {(status: ReturnType<typeof getReaderStatus>) => void} listener
 */
export function onStatusChange(listener) {
    listeners.add(listener);
    listener(getReaderStatus());
}

// A clause boundary: one or more sentence-ending marks (with an optional closing quote/parenthesis
// right after), or a single comma/semicolon/colon -- as long as that comma/semicolon/colon isn't
// sitting between two digits, where it's a decimal separator or a ratio/time-like notation ("1,8",
// "12:30") rather than a pause, and splitting it would read the number back in two disconnected
// pieces. collectLeafSegments() below splits on every match, so a paragraph becomes several
// single-clause entries instead of one long one.
//
// Why split this granularly rather than just per sentence: Chrome's speechSynthesis can silently
// cut a long utterance short partway through and skip straight to the next plan entry without ever
// finishing it -- confirmed on 2026-08-16 from a recording Louis made, a ~240-character/40-word
// paragraph (nowhere near the length TTS bug reports usually blame) stopped dead after its first
// sentence and jumped to the next heading. Splitting this small removes the need for a separate
// pause model on top of charsPerSecond too (cf. its own comment) -- the gap between two separate
// utterances stands in for the pause a comma or colon would otherwise need modeled inside one.
const CLAUSE_END_PATTERN = /[.!?…]+[)»"'’”]*|[,;:](?!\d)/g;

/**
 * Flushes `buffer` (page-language text accumulated so far) as one plan entry, then appends
 * `leaf`'s inline `code` spans as their own separate en-US entries -- kept apart from the
 * surrounding text rather than concatenated with it, so each is spoken with correct
 * pronunciation without breaking the flow of the sentence around it. Exception: a code span
 * `speakableCode()` leaves completely untouched (a bare variable name, no operator or CLI flag to
 * rewrite -- e.g. "`a` et `a` deviendraient 0") has nothing that actually needs the English voice,
 * so it's folded into the surrounding sentence instead of forcing a voice switch and a pause for
 * something this trivial. Also splits the page-language text at every CLAUSE_END_PATTERN match, so
 * one leaf can produce several "speak" entries even with no inline code in sight (cf.
 * CLAUSE_END_PATTERN's own comment for why).
 *
 * Also wraps whatever ends up in each entry's own highlight target -- an inline `readerSegment`
 * around the buffered text's original nodes, or the `code` element itself -- so speakNext() has
 * something to switch READER_HIGHLIGHT_CLASS onto, and (for buffered text) a `words` list so it
 * can move READER_ACTIVE_WORD_CLASS as `boundary` reports each one (cf. wrapSegmentWords()).
 *
 * @param {HTMLElement} leaf a single h2-h6/p/li/th/td element
 * @param {string} lang the page's language, e.g. "fr", "en"
 * @param {string} context the page's subject or category id, used to pick the right operator
 *   table for inline code (cf. CONTEXT_OPERATOR_SPEECH)
 * @param {string} pageId the page's own id, used to pick the right prose wording for a symbol
 *   whose meaning varies page to page rather than context to context (cf. ARROW_RANGE_PAGES)
 * @param {Array} entries the plan being built, appended to in place
 */
function collectLeafSegments(leaf, lang, context, pageId, entries) {
    let buffer = "";
    let segmentNodes = [];
    const flushBuffer = () => {
        const text = buffer.trim();
        if (text && HAS_SPOKEN_CONTENT.test(text)) {
            const { wrapper, words } = wrapSegmentWords(segmentNodes);
            entries.push({
                kind: "speak",
                text: speakableText(text, lang, pageId),
                lang,
                group: leaf,
                highlightTarget: wrapper,
                words,
            });
        }
        buffer = "";
        segmentNodes = [];
    };
    // A static snapshot: wrapSegmentWords() below (and this loop's own Text.splitText(), for a
    // text node split at a clause boundary) mutate leaf's children as buffered runs are flushed,
    // which would desync a live NodeList mid-iteration and skip nodes.
    Array.from(leaf.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
            if (!code) return;
            const spoken = speakableCode(code, context);
            if (spoken === code) {
                buffer += ` ${code} `;
                segmentNodes.push(node);
            } else {
                flushBuffer();
                // No word-level highlight for inline code -- it's spoken as a short, separately
                // pronounced phrase (cf. speakableCode()), not worth the DOM churn of wrapping it
                // too; the whole `code` element gets READER_HIGHLIGHT_CLASS instead.
                entries.push({ kind: "speak", text: spoken, lang: "en-US", group: leaf, highlightTarget: node, words: [] });
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            // Split at each clause boundary found, flushing the text/nodes accumulated so far
            // (including the part of `current` up to and including the boundary) as its own entry
            // before moving on to whatever's left. Only text nodes are split this way -- a
            // boundary landing inside a formatting element (`strong`, `em`, a link) doesn't split
            // that element; the two clauses stay merged into one entry, same as if this function
            // didn't split at all. Rare in practice (a sentence essentially never ends mid-bold),
            // and not a regression either way -- merged is exactly today's behavior everywhere else.
            let current = node;
            CLAUSE_END_PATTERN.lastIndex = 0;
            let match;
            while ((match = CLAUSE_END_PATTERN.exec(current.textContent))) {
                const cutAt = match.index + match[0].length;
                if (cutAt >= current.textContent.length) break;
                const rest = current.splitText(cutAt);
                buffer += current.textContent;
                segmentNodes.push(current);
                flushBuffer();
                current = rest;
                CLAUSE_END_PATTERN.lastIndex = 0;
            }
            buffer += current.textContent;
            segmentNodes.push(current);
        } else {
            buffer += node.textContent;
            segmentNodes.push(node);
        }
    });
    flushBuffer();
}

/**
 * Recursively walks `root`, appending a "speak" entry per leaf (h2-h6/p/li/th/td, split around
 * any inline code) and a "pause" entry per `pre` block, in document order.
 *
 * @param {HTMLElement} root
 * @param {string} lang
 * @param {string} context see {@link collectLeafSegments}
 * @param {string} pageId see {@link collectLeafSegments}
 * @param {Array} entries the plan being built, appended to in place
 */
function collectSegments(root, lang, context, pageId, entries) {
    Array.from(root.children).forEach(element => {
        if (element.matches(IGNORED_SELECTOR)) return;
        if (element.tagName === "PRE") {
            entries.push({ kind: "pause", element });
        } else if (LEAF_TAGS.has(element.tagName)) {
            collectLeafSegments(element, lang, context, pageId, entries);
        } else {
            collectSegments(element, lang, context, pageId, entries);
        }
    });
}

// Bumps `generation` and cancels whatever utterance is in flight, without touching `planIndex` --
// shared by resetPlayback() (which does rewind) and replayParagraph() (which seeks elsewhere).
function cancelCurrentUtterance() {
    generation++;
    if (SPEECH_SUPPORTED) synth.cancel();
}

function resetPlayback() {
    cancelCurrentUtterance();
    planIndex = 0;
    isPlaying = false;
    isPaused = false;
    isPausedAtCode = false;
    lastSpokenIndex = null;
    clearHighlight();
}

/**
 * Drops every "pause" entry that immediately follows another one -- several `pre` blocks in a
 * row with no text between them (a common thing, e.g. a "before/after" pair) would otherwise
 * need one "Continuer" click per block before reading picks the text back up. One pause for the
 * whole run is enough; it lands on (and scrolls to) the first block, same as before.
 *
 * @param {Array} entries
 * @returns {Array}
 */
function collapseConsecutivePauses(entries) {
    return entries.filter((entry, i) => entry.kind !== "pause" || entries[i - 1]?.kind !== "pause");
}

/**
 * Rebuilds the reading plan from the page currently in `pageDiv`, and stops whatever was
 * being read before (its plan referenced elements about to leave the DOM). Call once per page
 * render, after its content has been generated.
 *
 * @param {HTMLElement} pageDiv
 */
export function buildReadingPlan(pageDiv) {
    resetPlayback();
    const entries = [];
    const context = PAGE_SPECIFIC_CONTEXT.has(appState.curPageId)
        ? appState.curPageId
        : (appState.curSubject ?? appState.curCategory);
    collectSegments(pageDiv, document.documentElement.lang || "fr", context, appState.curPageId, entries);
    plan = collapseConsecutivePauses(entries);
    notify();
}

/**
 * Stops any reading in progress and rewinds to the start of the current plan, without
 * discarding it -- the reader control can start over on the same page. Also the right thing to
 * call right before a page is torn down (its plan's `pre` elements are about to be removed).
 */
export function stopReading() {
    resetPlayback();
    notify();
}

/**
 * Pauses reading in place: cancels whatever's being spoken right now but leaves `planIndex` (and
 * the highlight already showing) untouched, so resumeReading() picks the same clause back up from
 * its own start rather than the whole paragraph or the whole page. What the reader control's
 * "Pause" button calls while playing.
 */
export function pauseReading() {
    cancelCurrentUtterance();
    isPlaying = false;
    isPaused = true;
    notify();
}

/**
 * Resumes reading after pauseReading() -- re-speaks the clause `planIndex` still points at, from
 * its own start. What the reader control's "Reprendre" button calls.
 */
export function resumeReading() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    isPaused = false;
    speakNext();
}

function speakNext() {
    if (planIndex >= plan.length) {
        isPlaying = false;
        isPausedAtCode = false;
        notify();
        return;
    }
    const entry = plan[planIndex];
    if (entry.kind === "pause") {
        isPlaying = false;
        isPausedAtCode = true;
        clearHighlight();
        entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
        notify();
        return;
    }
    isPlaying = true;
    isPausedAtCode = false;
    lastSpokenIndex = planIndex;
    setHighlightedEntry(entry);
    notify();
    // Checked (and scrolled) against the entry's own highlightTarget -- the one clause/segment
    // actually being read right now -- rather than entry.group, the whole containing leaf. A long
    // paragraph reads as several clause entries sharing one group (cf. collectLeafSegments'
    // CLAUSE_END_PATTERN split), so checking only the leaf's own start left every clause after the
    // first one free to scroll off the bottom of the screen without ever re-triggering a scroll,
    // as long as the paragraph itself had been visible when it started (reported by Louis on
    // 2026-08-16: reading kept going past the visible bottom of the page with nothing on screen to
    // follow along with). Only when it isn't shown at all -- avoids yanking the view on every
    // clause when several are already visible together (e.g. a tall screen, short paragraphs).
    if (!isElementStartVisible(entry.highlightTarget))
        entry.highlightTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    const myGeneration = generation;
    // `boundary` is the accurate source when it fires, so it always wins over the timer-based
    // estimate below -- but every browser tested while building this feature failed to fire it at
    // all (cf. devpedia-todo.md), so the estimate is the schedule that actually runs in practice,
    // not just a fallback for an edge case.
    utterance.onboundary = event => {
        if (generation !== myGeneration) return;
        setActiveWord(wordIndexAtChar(entry.text, event.charIndex));
    };
    // Two different anchors on purpose. Calibration (cf. utterance.onend below) is anchored on
    // onstart (speech actually beginning) rather than on when speak() was called -- the two can be
    // a couple hundred ms apart (engine queueing/startup), which would otherwise get counted as
    // part of the text's own speaking time and inflate short entries the most, since a fixed
    // startup delay is a bigger fraction of a short entry's total duration (with CALIBRATION_WEIGHT
    // trusting each measurement this much, one skewed entry was enough to drag the whole estimate
    // down, reported by Louis on 2026-08-16). The word-by-word schedule itself, though, is
    // deliberately anchored on the call to speak() below instead, straight away rather than waiting
    // for onstart -- its first word already lands at 0ms (cf. scheduleEstimatedWords()), so waiting
    // for onstart would only have delayed it by that same queueing gap, showing the whole-entry
    // highlight alone for longer than necessary before the word-level one takes over (reported by
    // Louis on 2026-08-16, "le highlight de la section complète avant que ça switch sur du mot à
    // mot").
    let startedAt = null;
    utterance.onstart = () => {
        if (generation !== myGeneration) return;
        startedAt = Date.now();
    };
    scheduleEstimatedWords(entry, myGeneration);
    utterance.onend = utterance.onerror = () => {
        if (generation !== myGeneration) return;
        // Recalibrates charsPerSecond from how long this utterance actually took, so the estimate
        // converges on this session's real voice/rate. Skipped if onstart never fired at all (no
        // reliable elapsed time to measure) or below some floor: a browser that can't actually
        // produce speech (e.g. Brave on Linux with zero system TTS voices, cf. devpedia-todo.md)
        // fires onerror within a millisecond or two of being asked to speak, and averaging that in
        // as "this entry's text took ~0ms to say" would drag the estimate toward an absurdly high
        // rate for every entry after it.
        const elapsedSeconds = startedAt === null ? 0 : (Date.now() - startedAt) / 1000;
        if (entry.words.length && elapsedSeconds > 0.1) {
            const measuredRate = entry.text.length / elapsedSeconds;
            charsPerSecond = charsPerSecond * (1 - CALIBRATION_WEIGHT) + measuredRate * CALIBRATION_WEIGHT;
        }
        planIndex++;
        // Deferred rather than called directly: some engines fire onend/onerror synchronously
        // for very short utterances (single-word entries, e.g. "variable 0"), and a page with
        // many of those in a row -- speakNext() -> synth.speak() -> onend -> speakNext() -> ...
        // -- can nest deep enough within one call stack to overflow it. setTimeout starts each
        // call on a fresh stack instead.
        setTimeout(speakNext, 0);
    };
    synth.speak(utterance);
}

/** What the reader control's "Lire depuis le début" button calls. */
export function startReading() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    speakNext();
}

/**
 * @returns {number} the sticky navbar's height in pixels, so viewport-visibility checks can
 *   exclude the area it covers at the top of the screen
 */
function getNavbarHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")) || 0;
}

/**
 * @returns {number} the read-aloud floating bar's own height in pixels if it's currently a fixed
 *   overlay pinned to the bottom of the screen (narrow/mobile layout, cf. .readerFloatingBar in
 *   responsive.css) -- 0 on a wide layout, where the reader control sits in the right sidebar
 *   instead and never covers any of the readable content.
 */
function getFloatingBarHeight() {
    const bar = document.querySelector(".readerFloatingBar");
    if (!bar || getComputedStyle(bar).position !== "fixed") return 0;
    return bar.getBoundingClientRect().height;
}

/**
 * @param {HTMLElement} element
 * @returns {boolean} whether `element`'s own top edge (not just some part of it) is currently on
 *   screen, below the sticky navbar and above the bottom floating reader bar on narrow layouts --
 *   unlike merely being partly on screen, e.g. only its last line still poking above the navbar
 *   (or its first line already hidden under the floating bar), which wouldn't show where it
 *   starts. Missing the floating bar here used to read a line sitting right above it as "visible"
 *   even though it's actually covered, so the page never auto-scrolled to bring it back into view
 *   (reported by Louis on 2026-08-16).
 */
function isElementStartVisible(element) {
    const top = element.getBoundingClientRect().top;
    return top >= getNavbarHeight() && top < window.innerHeight - getFloatingBarHeight();
}

/**
 * Index of the first "speak" entry whose paragraph hasn't fully scrolled past the top of the
 * viewport yet (below the sticky navbar) -- i.e. the topmost paragraph currently on screen.
 * Falls back to 0 (page top) if nothing qualifies, e.g. before any scrolling has happened.
 */
function findVisibleEntryIndex() {
    const navbarHeight = getNavbarHeight();
    for (let i = 0; i < plan.length; i++) {
        const entry = plan[i];
        if (entry.kind === "speak" && entry.group.getBoundingClientRect().bottom > navbarHeight) return i;
    }
    return 0;
}

/**
 * Starts reading from whichever paragraph is currently at the top of the screen rather than
 * always from the top of the page -- resuming lower in a long chapter shouldn't require sitting
 * through everything already read. What the main play/stop toggle calls to start.
 *
 * Scrolls that paragraph's start into view first, the same way the "pause at a code block" flow
 * does (cf. speakNext()) but toward the top rather than centered -- if it was only partly
 * visible (cut off above the navbar), reading should still begin at its very first word, so the
 * view moves up to show that word rather than starting mid-scroll.
 */
export function startFromVisible() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    const index = findVisibleEntryIndex();
    plan[index]?.group?.scrollIntoView({ behavior: "smooth", block: "start" });
    planIndex = index;
    speakNext();
}

/** What the reader control's "Continuer" button calls (cf. triggerPrimaryAction() below). */
export function continueAfterCode() {
    if (!isPausedAtCode) return;
    planIndex++;
    speakNext();
}

/**
 * Re-speaks the paragraph `lastSpokenIndex` belongs to, from its first segment -- lets the
 * listener catch a sentence they missed without rewinding the whole page or waiting for it to
 * come back around. Works while playing (interrupts the current utterance), paused at a code
 * block (replays the paragraph just before it), or stopped (replays the last one heard). What the
 * reader control's "Relire le paragraphe" button calls.
 */
export function replayParagraph() {
    if (lastSpokenIndex === null) return;
    const group = plan[lastSpokenIndex].group;
    let start = lastSpokenIndex;
    while (start > 0 && plan[start - 1].kind === "speak" && plan[start - 1].group === group) start--;
    cancelCurrentUtterance();
    planIndex = start;
    speakNext();
}

/**
 * @param {number} fromIndex a plan index to search from, typically `planIndex`
 * @param {1|-1} direction 1 to look for the next paragraph, -1 for the previous one
 * @returns {number|null} the plan index of the adjacent paragraph's first "speak" entry, or null
 *   if there isn't one in that direction (already at the first/last paragraph)
 */
function adjacentParagraphIndex(fromIndex, direction) {
    const currentEntry = plan[fromIndex];
    if (!currentEntry) return null;
    const currentGroup = currentEntry.kind === "speak" ? currentEntry.group : currentEntry.element;
    let i = fromIndex;
    // Step past whatever's left of the current paragraph -- or, if paused at a code block right
    // now, past that block itself.
    while (plan[i] && (plan[i].kind === "speak" ? plan[i].group : plan[i].element) === currentGroup) i += direction;
    // A "pause" entry (a code block) in between isn't a paragraph to land on for this purpose --
    // skip over it too, in either direction.
    while (plan[i] && plan[i].kind !== "speak") i += direction;
    if (!plan[i]) return null;
    if (direction > 0) return i;
    // Walking backward, `i` is the *last* entry of the previous paragraph rather than its first --
    // keep going back to find where that paragraph actually starts.
    const targetGroup = plan[i].group;
    while (plan[i - 1] && plan[i - 1].kind === "speak" && plan[i - 1].group === targetGroup) i--;
    return i;
}

/**
 * Cancels whatever's playing and jumps straight to `index`, speaking from there -- shared by
 * nextParagraph()/previousParagraph().
 *
 * @param {number} index
 */
function jumpToParagraph(index) {
    cancelCurrentUtterance();
    planIndex = index;
    isPaused = false;
    speakNext();
}

/** What the reader control's "paragraphe suivant" button calls. */
export function nextParagraph() {
    const target = adjacentParagraphIndex(planIndex, 1);
    if (target !== null) jumpToParagraph(target);
}

/** What the reader control's "paragraphe précédent" button calls. */
export function previousParagraph() {
    const target = adjacentParagraphIndex(planIndex, -1);
    if (target !== null) jumpToParagraph(target);
}

/**
 * What the reader control's single dynamic primary button calls, regardless of which of the
 * three in-progress states (cf. isPausedAtCode/isPlaying/isPaused) it's currently showing a label
 * for -- keeps that branching here rather than in reader-control.js, which only needs to know
 * which label to show (cf. its own applyStatus()), not reader.js's internal state names.
 */
export function triggerPrimaryAction() {
    if (isPausedAtCode) continueAfterCode();
    else if (isPlaying) pauseReading();
    else if (isPaused) resumeReading();
}

// createReaderControl() -- the reader control's own UI/button wiring -- lives in
// reader-control.js instead, a separate reason to change from the playback engine above.
