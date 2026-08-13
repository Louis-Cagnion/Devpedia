import { createTag } from "./tags.js";

// Web Speech API only (no cloud TTS, no auto-hosted engine) -- the site is 100% static
// (GitHub Pages), so this is the only option with zero cost and zero infrastructure.
// See devpedia-todo.md for the decisions this module implements.
const SPEECH_SUPPORTED = "speechSynthesis" in window;
const synth = SPEECH_SUPPORTED ? window.speechSynthesis : null;

// Elements read as one spoken unit; everything else (blockquote, ul/ol, table/thead/tbody/tr,
// div.tableWrapper, chart containers...) is a structural container, walked but never itself
// read as a block.
const LEAF_TAGS = new Set(["H2", "H3", "H4", "H5", "H6", "P", "LI", "TH", "TD"]);

// Router-generated UI, not page content -- cf. router.js's createAppendPageNav/createBreadcrumb
// and generateChildList.
const IGNORED_SELECTOR = ".pageNav, .pageBreadcrumb, .childList";

// The reading plan: an ordered list of {kind: "speak", text, lang, group} and
// {kind: "pause", element} entries, rebuilt by buildReadingPlan() on every page render. `group`
// is the leaf element a "speak" entry was split from (cf. collectLeafSegments) -- entries sharing
// the same `group` are one paragraph for replayParagraph()'s purposes.
let plan = [];
let planIndex = 0;
let isPlaying = false;
let isPausedAtCode = false;

// Index in `plan` of the last (or currently playing) "speak" entry, so replayParagraph() knows
// which paragraph to restart even after playback has stopped or paused at a code block. Cleared
// by resetPlayback() since a rebuilt/torn-down plan invalidates it.
let lastSpokenIndex = null;

// Bumped by resetPlayback(). synth.cancel() fires an async "error" event on the utterance it
// just interrupted (same onend/onerror handler below), so without this guard that stale callback
// would advance planIndex and call speakNext() again right after a stop, or after plan has
// already been reassigned to the next page -- resuming playback instead of stopping.
let generation = 0;

// Every createReaderControl() instance (desktop sidebar + mobile floating bar) subscribes here,
// so both stay in sync with the single shared playback state.
const listeners = new Set();

function getStatus() {
    return { hasPlan: plan.length > 0, isPlaying, isPausedAtCode, canReplay: lastSpokenIndex !== null };
}

function notify() {
    const status = getStatus();
    listeners.forEach(listener => listener(status));
}

// A separator like " / " left between two inline `code` spans (e.g. "if / else if") has no
// word to pronounce -- skip flushing it rather than reading the bare punctuation aloud.
const HAS_SPOKEN_CONTENT = /[\p{L}\p{N}]/u;

// Operators spoken character-by-character by the browser's TTS engine are unreliable -- e.g.
// "!==" was heard dropping the "!", and "===" is easy to mishear as "==". Every occurrence is
// replaced with an explicit English phrase instead, whether the whole inline code span is just
// the operator (e.g. `===`) or it's embedded in a longer expression (e.g. `tableau.length === 0`).
// Generic across every language chapter that uses these operators, not just JavaScript.
const OPERATOR_SPEECH = {
    "==": "equals",
    "===": "strictly equals",
    "!=": "not equal",
    "!==": "strictly not equal",
    "<=": "less than or equal",
    ">=": "greater than or equal",
    "&&": "and",
    "||": "or",
    "??": "nullish coalescing",
    "?.": "optional chaining",
};

// Longest keys first, so e.g. "!==" matches before "!=" can claim its first two characters.
const OPERATOR_PATTERN = new RegExp(
    Object.keys(OPERATOR_SPEECH)
        .sort((a, b) => b.length - a.length)
        .map(op => op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
    "g"
);

function speakableCode(text) {
    return text.replace(OPERATOR_PATTERN, op => ` ${OPERATOR_SPEECH[op]} `).replace(/\s+/g, " ").trim();
}

/**
 * Flushes `buffer` (page-language text accumulated so far) as one plan entry, then appends
 * `leaf`'s inline `code` spans as their own separate en-US entries -- kept apart from the
 * surrounding text rather than concatenated with it, so each is spoken with correct
 * pronunciation without breaking the flow of the sentence around it.
 *
 * @param {HTMLElement} leaf a single h2-h6/p/li/th/td element
 * @param {string} lang the page's language, e.g. "fr", "en"
 * @param {Array} entries the plan being built, appended to in place
 */
function collectLeafSegments(leaf, lang, entries) {
    let buffer = "";
    const flushBuffer = () => {
        const text = buffer.trim();
        if (text && HAS_SPOKEN_CONTENT.test(text)) entries.push({ kind: "speak", text, lang, group: leaf });
        buffer = "";
    };
    leaf.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            flushBuffer();
            const code = node.textContent.trim();
            if (code) entries.push({ kind: "speak", text: speakableCode(code), lang: "en-US", group: leaf });
        } else {
            buffer += node.textContent;
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
 * @param {Array} entries the plan being built, appended to in place
 */
function collectSegments(root, lang, entries) {
    Array.from(root.children).forEach(element => {
        if (element.matches(IGNORED_SELECTOR)) return;
        if (element.tagName === "PRE") {
            entries.push({ kind: "pause", element });
        } else if (LEAF_TAGS.has(element.tagName)) {
            collectLeafSegments(element, lang, entries);
        } else {
            collectSegments(element, lang, entries);
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
    isPausedAtCode = false;
    lastSpokenIndex = null;
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
    collectSegments(pageDiv, document.documentElement.lang || "fr", entries);
    plan = entries;
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
        entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
        notify();
        return;
    }
    isPlaying = true;
    isPausedAtCode = false;
    lastSpokenIndex = planIndex;
    notify();
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    const myGeneration = generation;
    utterance.onend = utterance.onerror = () => {
        if (generation !== myGeneration) return;
        planIndex++;
        speakNext();
    };
    synth.speak(utterance);
}

function startReading() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    speakNext();
}

function continueAfterCode() {
    if (!isPausedAtCode) return;
    planIndex++;
    speakNext();
}

/**
 * Re-speaks the paragraph `lastSpokenIndex` belongs to, from its first segment -- lets the
 * listener catch a sentence they missed without rewinding the whole page or waiting for it to
 * come back around. Works while playing (interrupts the current utterance), paused at a code
 * block (replays the paragraph just before it), or stopped (replays the last one heard).
 */
function replayParagraph() {
    if (lastSpokenIndex === null) return;
    const group = plan[lastSpokenIndex].group;
    let start = lastSpokenIndex;
    while (start > 0 && plan[start - 1].kind === "speak" && plan[start - 1].group === group) start--;
    cancelCurrentUtterance();
    planIndex = start;
    speakNext();
}

/**
 * Builds one instance of the read-aloud control: a play/stop toggle, always shown, plus three
 * buttons hidden until they're relevant -- "restart from the beginning" and "replay this
 * paragraph" (once reading has produced something to go back to), and "continue after the code
 * block" (once reading is paused at one). Call once per place it needs to appear (the desktop
 * right sidebar, the mobile floating bar) -- every instance shares the same underlying playback
 * state and stays in sync with the others.
 *
 * @returns {HTMLElement|null} null if the browser has no Web Speech API, so callers show nothing
 *   rather than a control that can never work
 */
export function createReaderControl() {
    if (!SPEECH_SUPPORTED) return null;

    const wrapper = createTag("div", { class: "readerControl" });
    const toggleButton = createTag("button", { class: "returnButton readerToggleButton" });
    const restartButton = createTag(
        "button",
        { class: "returnButton readerRestartButton" },
        { textContent: "⏮ Recommencer depuis le début" }
    );
    const replayButton = createTag(
        "button",
        { class: "returnButton readerReplayButton" },
        { textContent: "🔁 Relire le paragraphe" }
    );
    const continueButton = createTag(
        "button",
        { class: "returnButton readerContinueButton" },
        { textContent: "▶ Continuer après le bloc de code" }
    );
    toggleButton.addEventListener("click", () => {
        if (isPlaying || isPausedAtCode) stopReading();
        else startReading();
    });
    restartButton.addEventListener("click", startReading);
    replayButton.addEventListener("click", replayParagraph);
    continueButton.addEventListener("click", continueAfterCode);
    wrapper.append(toggleButton, restartButton, replayButton, continueButton);

    const applyStatus = status => {
        toggleButton.disabled = !status.hasPlan;
        toggleButton.textContent = status.isPlaying || status.isPausedAtCode
            ? "⏹ Arrêter la lecture"
            : "🔊 Écouter cette page";
        // Restarting/replaying only make sense once reading has produced something to go back to.
        const hasProgress = status.isPlaying || status.isPausedAtCode || status.canReplay;
        restartButton.classList.toggle("visible", hasProgress);
        replayButton.classList.toggle("visible", hasProgress);
        continueButton.classList.toggle("visible", status.isPausedAtCode);
    };
    listeners.add(applyStatus);
    applyStatus(getStatus());

    return wrapper;
}
