import { appState } from "./state.js";
import {
    speakableCode,
    speakableText,
    needsEnglishVoice,
    PAGE_SPECIFIC_CONTEXT,
    HAS_SPOKEN_CONTENT,
} from "./reader-pronunciation.js";
import { CLAUSE_END_PATTERN } from "./reader-clauses.js";
import { collectTableSegments } from "./reader-table.js";
import {
    setHighlightedEntry,
    clearHighlight,
    setActiveWord,
    wordIndexAtChar,
    wrapSegmentWords,
    calibrateRate,
    scheduleEstimatedWords,
} from "./reader-highlight.js";

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

// Elements read as one spoken unit; everything else (blockquote, ul/ol, div.tableWrapper, chart
// containers...) is a structural container, walked but never itself read as a block. `table`
// itself is handled separately by collectSegments (cf. collectTableSegments) rather than being
// walked generically down to its `th`/`td` -- reading each cell in isolation, with no idea which
// row or column it belonged to, was the exact complaint that started the table audit in
// devpedia-todo.md.
const LEAF_TAGS = new Set(["H2", "H3", "H4", "H5", "H6", "P", "LI"]);

// Router-generated UI, not page content -- cf. router.js's createAppendPageNav/createBreadcrumb
// and generateChildList.
const IGNORED_SELECTOR = ".pageNav, .pageNavBottom, .pageBreadcrumb, .childList";

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

// CLAUSE_END_PATTERN itself (used directly in the while loop below) lives in reader-clauses.js
// instead, shared with reader-table.js's own clause splitting -- a paragraph becomes several
// single-clause entries instead of one long one, same reasoning as that file's own comment on it.

/**
 * Flushes `buffer` (page-language text accumulated so far) as one plan entry, then appends
 * `leaf`'s inline `code` spans as their own separate en-US entries -- kept apart from the
 * surrounding text rather than concatenated with it, so each is spoken with correct
 * pronunciation without breaking the flow of the sentence around it. Exception: a code span
 * needsEnglishVoice() says doesn't need the English voice at all (a bare variable name, no
 * operator/flag/keyword to justify it -- e.g. "`a` et `a` deviendraient 0") is folded into the
 * surrounding sentence instead, rather than forcing a voice switch and a pause for something this
 * trivial. Also splits the page-language text at every CLAUSE_END_PATTERN match, so one leaf can
 * produce several "speak" entries even with no inline code in sight (cf. CLAUSE_END_PATTERN's own
 * comment for why).
 *
 * Also wraps whatever ends up in each entry's own highlight target -- an inline `readerSegment`
 * around the buffered text's original nodes, or the `code` element itself -- so speakNext() has
 * something to switch READER_HIGHLIGHT_CLASS onto, and (for buffered text) a `words` list so it
 * can move READER_ACTIVE_WORD_CLASS as `boundary` reports each one (cf. wrapSegmentWords()).
 *
 * @param {HTMLElement} leaf a single h2-h6/p/li element
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
            const spoken = speakableCode(code, context, lang);
            if (!needsEnglishVoice(code, context)) {
                // Buffers the raw `code`, not `spoken`, even though the two can differ (e.g.
                // speakableCode()'s own underscore cleanup) -- `node` is about to be word-wrapped
                // in place by wrapSegmentWords() below, splitting its own unchanged DOM text on the
                // same WORD_PATTERN used to count entry.text's words (cf. reader-highlight.js); if
                // this buffer used the cleaned-up text instead, the two word counts could disagree
                // (an underscore isn't whitespace, so it doesn't split a DOM word the way a space
                // in `spoken` would) and desync the word highlight, the exact bug already fixed
                // once for inline code (cf. wrapWordsInPlace's own comment). Table cells don't have
                // this constraint (cf. reader-table.js's own cellSpokenParts), so they do use the
                // cleaned-up text here.
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
 * Recursively walks `root`, appending a "speak" entry per leaf (h2-h6/p/li, split around any
 * inline code), a set of entries per `table` (cf. reader-table.js's collectTableSegments), and a
 * "pause" entry per `pre` block, in document order.
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
        } else if (element.tagName === "TABLE") {
            collectTableSegments(element, lang, context, pageId, entries);
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
    if (!isElementFullyVisible(entry.highlightTarget))
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
    // startup delay is a bigger fraction of a short entry's total duration (with calibrateRate()'s
    // own weighting trusting each measurement this much, one skewed entry was enough to drag the
    // whole estimate down, reported by Louis on 2026-08-16). The word-by-word schedule itself, though, is
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
    scheduleEstimatedWords(entry, () => generation === myGeneration);
    utterance.onend = utterance.onerror = () => {
        if (generation !== myGeneration) return;
        // Recalibrates the word-timing estimate from how long this utterance actually took (cf.
        // reader-highlight.js's calibrateRate()), so it converges on this session's real
        // voice/rate. Skipped if onstart never fired at all (no reliable elapsed time to measure)
        // or below some floor: a browser that can't actually produce speech (e.g. Brave on Linux
        // with zero system TTS voices, cf. devpedia-todo.md) fires onerror within a millisecond or
        // two of being asked to speak, and averaging that in as "this entry's text took ~0ms to
        // say" would drag the estimate toward an absurdly high rate for every entry after it.
        const elapsedSeconds = startedAt === null ? 0 : (Date.now() - startedAt) / 1000;
        if (entry.words.length && elapsedSeconds > 0.1) calibrateRate(entry.text.length / elapsedSeconds);
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
 * @returns {boolean} whether `element` is entirely on screen -- both its top AND bottom edge,
 *   below the sticky navbar and above the bottom floating reader bar on narrow layouts. Checking
 *   only the top edge (as an earlier version of this did) missed a multi-line entry whose top was
 *   visible but whose last line or two were still cut off under the floating bar -- a short entry
 *   rarely reaches that height, but a clause that wraps to two or three lines on a narrow screen
 *   can (reported by Louis on 2026-08-16: the read line's last lines weren't brought fully into
 *   view when cut off by the floating bar).
 */
function isElementFullyVisible(element) {
    const { top, bottom } = element.getBoundingClientRect();
    return top >= getNavbarHeight() && bottom <= window.innerHeight - getFloatingBarHeight();
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
