import { appState } from "./state.js";
import {
    speakableCode,
    speakableText,
    needsEnglishVoice,
    PAGE_SPECIFIC_CONTEXT,
    HAS_SPOKEN_CONTENT,
    DECORATIVE_EMOJI,
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

/* Web Speech API only (no cloud TTS, no auto-hosted engine): the site is 100% static
   (GitHub Pages), so this is the only option with zero cost and zero infrastructure.
   Pronunciation rewriting lives in reader-pronunciation.js instead, a separate reason to change. */
export const SPEECH_SUPPORTED = "speechSynthesis" in window;
const synth = SPEECH_SUPPORTED ? window.speechSynthesis : null;

/**
 * @brief Resolves once it's known whether the browser can actually produce speech, not just
 * whether the Web Speech API object exists (a browser can have the API but zero usable voices,
 * e.g. Brave on Linux). Waits for the voiceschanged event, or a short timeout, since getVoices()
 * can genuinely return empty for a brief moment even where voices do exist.
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

/* Elements read as one spoken unit; other elements are structural containers, walked but never
   read as a block. `table` is handled separately (cf. collectTableSegments), not walked down to
   its `th`/`td` -- reading each cell in isolation was the exact complaint behind the table audit. */
const LEAF_TAGS = new Set(["H2", "H3", "H4", "H5", "H6", "P", "LI"]);

/* Router-generated UI, not page content -- cf. router.js's createAppendPageNav/createBreadcrumb
   and generateChildList. */
const IGNORED_SELECTOR = ".pageNav, .pageNavBottom, .pageBreadcrumb, .childList";

/* The reading plan: an ordered list of {kind: "speak", text, lang, group, highlightTarget, words}
   and {kind: "pause", element} entries, rebuilt by buildReadingPlan() on every page render.
   `group` ties entries sharing one paragraph together for replayParagraph()'s purposes. */
let plan = [];
let planIndex = 0;
let isPlaying = false;
let isPausedAtCode = false;

/* True after pauseReading(), distinct from isPausedAtCode (paused at a `pre` block) and the
   fully-stopped state. `planIndex` stays untouched while paused, so resumeReading() re-speaks the
   same (short) clause from its own start rather than tracking a mid-utterance offset. */
let isPaused = false;

/* Index in `plan` of the last (or currently playing) "speak" entry, so replayParagraph() knows
   which paragraph to restart even after playback has stopped or paused at a code block. Cleared
   by resetPlayback() since a rebuilt/torn-down plan invalidates it. */
let lastSpokenIndex = null;

/* Bumped by resetPlayback(). synth.cancel() fires an async "error" event on the interrupted
   utterance, so without this guard that stale callback would advance planIndex and resume
   playback right after a stop, instead of the callback recognizing it's stale and doing nothing. */
let generation = 0;

// Subscribers registered through onStatusChange() below.
const listeners = new Set();

/**
 * @brief Returns a snapshot of the current playback state.
 *
 * @returns {{hasPlan: boolean, isPlaying: boolean, isPaused: boolean, isPausedAtCode: boolean,
 *   canReplay: boolean}}
 */
export function getReaderStatus() {
    return { hasPlan: plan.length > 0, isPlaying, isPaused, isPausedAtCode, canReplay: lastSpokenIndex !== null };
}

function notify() {
    const status = getReaderStatus();
    listeners.forEach(listener => listener(status));
}

/**
 * @brief Subscribes `listener` to every future playback state change, calling it once
 * immediately with the current state too.
 *
 * @param {(status: ReturnType<typeof getReaderStatus>) => void} listener
 */
export function onStatusChange(listener) {
    listeners.add(listener);
    listener(getReaderStatus());
}

/* CLAUSE_END_PATTERN itself (used directly in the while loop below) lives in reader-clauses.js
   instead, shared with reader-table.js's own clause splitting -- a paragraph becomes several
   single-clause entries instead of one long one, same reasoning as that file's own comment on it. */

/**
 * @brief Flushes `buffer` as one or more "speak" plan entries (split at clause boundaries), then
 * appends `leaf`'s own inline `code` spans as separate en-US entries -- unless a span needs no
 * English voice at all, in which case it's folded into the surrounding sentence instead. Also
 * wraps each entry's own highlight target and `words` list for word-level highlighting.
 *
 * @param {HTMLElement} leaf a single h2-h6/p/li element
 * @param {string} lang the page's language, e.g. "fr", "en"
 * @param {string} context the page's subject or category id
 * @param {string} pageId the page's own id
 * @param {Array} entries the plan being built, appended to in place
 */
function collectLeafSegments(leaf, lang, context, pageId, entries) {
    /* Not restricted to a heading level: markdown rendering shifts "##" to H2 or H3 depending on
       outline depth, so the recap heading isn't reliably one tag across chapters. */
    const isRecapHeading = leaf.textContent.trimStart().startsWith(DECORATIVE_EMOJI);
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
                // The recap heading always highlights as one block, never word by word.
                words: isRecapHeading ? [] : words,
            });
        }
        buffer = "";
        segmentNodes = [];
    };
    /* A static snapshot: wrapSegmentWords()/this loop's own Text.splitText() mutate leaf's
       children as buffered runs flush, desyncing a live NodeList mid-iteration otherwise. */
    Array.from(leaf.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
            if (!code) return;
            const spoken = speakableCode(code, context, lang);
            if (!needsEnglishVoice(code, context)) {
                // Raw `code`, not `spoken`: keeps this node's own word count aligned for wrapSegmentWords().
                buffer += ` ${code} `;
                segmentNodes.push(node);
            } else {
                flushBuffer();
                entries.push({ kind: "speak", text: spoken, lang: "en-US", group: leaf, highlightTarget: node, words: [] });
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
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
 * @brief Recursively walks `root`, appending a "speak" entry per leaf, a set of entries per
 * `table`, and a "pause" entry per `pre` block, in document order.
 *
 * @param {HTMLElement} root
 * @param {string} lang the page's language code
 * @param {string} context the page's subject or category id
 * @param {string} pageId the page's own id
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

/**
 * @brief Bumps `generation` and cancels whatever utterance is in flight, without touching
 * `planIndex`. Shared by resetPlayback() (which does rewind) and replayParagraph() (which seeks
 * elsewhere).
 */
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
 * @brief Drops every "pause" entry that immediately follows another one -- several `pre` blocks
 * in a row would otherwise need one "Continuer" click each before reading resumes.
 *
 * @param {Array} entries
 *
 * @returns {Array}
 */
function collapseConsecutivePauses(entries) {
    return entries.filter((entry, i) => entry.kind !== "pause" || entries[i - 1]?.kind !== "pause");
}

/**
 * @brief Rebuilds the reading plan from the page currently in `pageDiv`, stopping whatever was
 * being read before. Call once per page render, after its content has been generated.
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

/** @brief Stops any reading in progress and rewinds to the start of the current plan, without discarding it. */
export function stopReading() {
    resetPlayback();
    notify();
}

/** @brief Pauses reading in place: cancels the current utterance but leaves `planIndex` untouched, so resumeReading() re-speaks the same clause. */
export function pauseReading() {
    cancelCurrentUtterance();
    isPlaying = false;
    isPaused = true;
    notify();
}

/** @brief Resumes reading after pauseReading(), re-speaking the clause `planIndex` still points at. */
export function resumeReading() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    isPaused = false;
    speakNext();
}

/**
 * @brief Speaks plan[planIndex] and advances -- the core playback loop, called whenever playback
 * resumes after a stop, pause, code block, or the previous utterance finishing.
 */
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
    /* Checked against the entry's own highlightTarget, not the whole leaf: a long paragraph's
       later clauses need their own scroll trigger too. */
    if (!isElementFullyVisible(entry.highlightTarget))
        entry.highlightTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    const myGeneration = generation;
    utterance.onboundary = event => {
        if (generation !== myGeneration) return;
        setActiveWord(wordIndexAtChar(entry.text, event.charIndex));
    };
    let startedAt = null;
    // Anchored on onstart, not on speak(): the queueing gap would otherwise inflate short entries.
    utterance.onstart = () => {
        if (generation !== myGeneration) return;
        startedAt = Date.now();
    };
    scheduleEstimatedWords(entry, () => generation === myGeneration);
    utterance.onend = utterance.onerror = () => {
        if (generation !== myGeneration) return;
        const elapsedSeconds = startedAt === null ? 0 : (Date.now() - startedAt) / 1000;
        if (entry.words.length && elapsedSeconds > 0.1) calibrateRate(entry.text.length / elapsedSeconds);
        planIndex++;
        setTimeout(speakNext, 0); // deferred: some engines fire onend synchronously
    };
    synth.speak(utterance);
}

/** @brief Restarts reading from the beginning of the plan. Called by the "Lire depuis le début" button. */
export function startReading() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    speakNext();
}

/** @brief Returns the sticky navbar's own height in pixels. */
function getNavbarHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")) || 0;
}

/** @brief Returns the mobile floating reader bar's height in pixels, 0 if not currently a fixed overlay. */
function getFloatingBarHeight() {
    const bar = document.querySelector(".readerFloatingBar");
    if (!bar || getComputedStyle(bar).position !== "fixed") return 0;
    return bar.getBoundingClientRect().height;
}

/**
 * @brief Reports whether `element` is entirely on screen: both its top and bottom edge, below
 * the sticky navbar and above the floating reader bar.
 *
 * @param {HTMLElement} element
 *
 * @returns {boolean}
 */
function isElementFullyVisible(element) {
    const { top, bottom } = element.getBoundingClientRect();
    return top >= getNavbarHeight() && bottom <= window.innerHeight - getFloatingBarHeight();
}

/**
 * @brief Returns the index of the first "speak" entry whose paragraph hasn't fully scrolled past
 * the top of the viewport yet, or 0 if nothing qualifies.
 */
function findVisibleEntryIndex() {
    const navbarHeight = getNavbarHeight();
    for (let i = 0; i < plan.length; i++) {
        const entry = plan[i];
        if (entry.kind === "speak" && entry.group.getBoundingClientRect().bottom > navbarHeight) return i;
    }
    return 0;
}

/** @brief Starts reading from whichever paragraph is currently at the top of the screen. */
export function startFromVisible() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    const index = findVisibleEntryIndex();
    plan[index]?.group?.scrollIntoView({ behavior: "smooth", block: "start" });
    planIndex = index;
    speakNext();
}

/** @brief Resumes reading past a paused code block. Called by the "Continuer" button. */
export function continueAfterCode() {
    if (!isPausedAtCode) return;
    planIndex++;
    speakNext();
}

/** @brief Re-speaks the paragraph `lastSpokenIndex` belongs to, from its first segment. Called by the "Relire le paragraphe" button. */
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
 * @brief Returns the plan index of the adjacent paragraph's first "speak" entry.
 *
 * @param {number} fromIndex a plan index to search from, typically `planIndex`
 * @param {1|-1} direction 1 for the next paragraph, -1 for the previous one
 *
 * @returns {number|null} null if there isn't one in that direction
 */
function adjacentParagraphIndex(fromIndex, direction) {
    const currentEntry = plan[fromIndex];
    if (!currentEntry) return null;
    const currentGroup = currentEntry.kind === "speak" ? currentEntry.group : currentEntry.element;
    let i = fromIndex;
    /* Steps past whatever's left of the current paragraph, or (if paused at a code block) that
       block itself. */
    while (plan[i] && (plan[i].kind === "speak" ? plan[i].group : plan[i].element) === currentGroup) i += direction;
    // A "pause" entry (a code block) in between isn't a paragraph to land on -- skip it too.
    while (plan[i] && plan[i].kind !== "speak") i += direction;
    if (!plan[i]) return null;
    if (direction > 0) return i;
    /* Walking backward, `i` is the *last* entry of the previous paragraph -- keep going back to
       find where that paragraph actually starts. */
    const targetGroup = plan[i].group;
    while (plan[i - 1] && plan[i - 1].kind === "speak" && plan[i - 1].group === targetGroup) i--;
    return i;
}

/**
 * @brief Cancels whatever's playing and jumps straight to `index`, speaking from there.
 *
 * @param {number} index
 */
function jumpToParagraph(index) {
    cancelCurrentUtterance();
    planIndex = index;
    isPaused = false;
    speakNext();
}

/** @brief Jumps to the next paragraph. Called by the "paragraphe suivant" button. */
export function nextParagraph() {
    const target = adjacentParagraphIndex(planIndex, 1);
    if (target !== null) jumpToParagraph(target);
}

/** @brief Jumps to the previous paragraph. Called by the "paragraphe précédent" button. */
export function previousParagraph() {
    const target = adjacentParagraphIndex(planIndex, -1);
    if (target !== null) jumpToParagraph(target);
}

/** @brief Dispatches the reader control's single dynamic primary button to whichever action matches the current playback state. */
export function triggerPrimaryAction() {
    if (isPausedAtCode) continueAfterCode();
    else if (isPlaying) pauseReading();
    else if (isPaused) resumeReading();
}

/* createReaderControl() -- the reader control's own UI/button wiring -- lives in
   reader-control.js instead, a separate reason to change from the playback engine above. */
