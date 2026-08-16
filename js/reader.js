import { createTag } from "./tags.js";
import { appState } from "./state.js";
import { t } from "./i18n.js";
import { speakableCode, speakableText, PAGE_SPECIFIC_CONTEXT, HAS_SPOKEN_CONTENT } from "./reader-pronunciation.js";

// Web Speech API only (no cloud TTS, no auto-hosted engine) -- the site is 100% static
// (GitHub Pages), so this is the only option with zero cost and zero infrastructure.
// See devpedia-todo.md for the decisions this module implements. Pronunciation rules (how a
// page's own text gets rewritten into what's actually spoken) live in reader-pronunciation.js
// instead -- a separate reason to change from the reading engine/highlighting/UI below.
const SPEECH_SUPPORTED = "speechSynthesis" in window;
const synth = SPEECH_SUPPORTED ? window.speechSynthesis : null;

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

// Index in `plan` of the last (or currently playing) "speak" entry, so replayParagraph() knows
// which paragraph to restart even after playback has stopped or paused at a code block. Cleared
// by resetPlayback() since a rebuilt/torn-down plan invalidates it.
let lastSpokenIndex = null;

// Two-tier highlight for the "speak" entry currently playing: READER_HIGHLIGHT_CLASS marks the
// whole entry (an inline wrapper for buffered text, cf. wrapSegmentWords() -- or the `code`
// element itself for an inline-code entry), the base every platform gets since it doesn't depend
// on `boundary` at all. READER_ACTIVE_WORD_CLASS additionally marks the one word `boundary` last
// reported, layered on top where that event fires with word-level granularity (cf. setActiveWord()
// and its call from speakNext()'s utterance.onboundary).
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
 * @param {number} index -1 to clear without setting a new word
 */
function setActiveWord(index) {
    if (index === activeWordIndex) return;
    highlightedWords[activeWordIndex]?.classList.remove(READER_ACTIVE_WORD_CLASS);
    activeWordIndex = index;
    highlightedWords[activeWordIndex]?.classList.add(READER_ACTIVE_WORD_CLASS);
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
 * per word. Recurses into formatting elements (`strong`, `em`, a link...) to keep their styling
 * and behavior intact, but never descends into `code` -- inline code is highlighted as a whole via
 * its own entry (cf. collectLeafSegments), not word by word.
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
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "CODE") {
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

/**
 * Flushes `buffer` (page-language text accumulated so far) as one plan entry, then appends
 * `leaf`'s inline `code` spans as their own separate en-US entries -- kept apart from the
 * surrounding text rather than concatenated with it, so each is spoken with correct
 * pronunciation without breaking the flow of the sentence around it. Exception: a code span
 * `speakableCode()` leaves completely untouched (a bare variable name, no operator or CLI flag to
 * rewrite -- e.g. "`a` et `a` deviendraient 0") has nothing that actually needs the English voice,
 * so it's folded into the surrounding sentence instead of forcing a voice switch and a pause for
 * something this trivial.
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
    // A static snapshot: wrapSegmentWords() below mutates leaf's children as buffered runs are
    // flushed, which would desync a live NodeList mid-iteration and skip nodes.
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
    // Only when its start isn't shown -- avoids yanking the view on every paragraph when several
    // are already visible together (e.g. a tall screen, short paragraphs).
    if (!isElementStartVisible(entry.group))
        entry.group.scrollIntoView({ behavior: "smooth", block: "start" });
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    const myGeneration = generation;
    // Not every engine fires this at all (e.g. Chrome on Android never does), and among those
    // that do, granularity varies (Chrome desktop word by word, Safari once per sentence) -- cf.
    // devpedia-todo.md. No feature detection needed: wordIndexAtChar() naturally degrades with
    // whatever charIndex the engine actually reports, landing on word 0 and staying there for a
    // sentence-granular engine, never moving at all for one that doesn't fire this at all --
    // either way on top of the READER_HIGHLIGHT_CLASS highlight set above, never replacing it.
    utterance.onboundary = event => {
        if (generation !== myGeneration) return;
        setActiveWord(wordIndexAtChar(entry.text, event.charIndex));
    };
    utterance.onend = utterance.onerror = () => {
        if (generation !== myGeneration) return;
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

function startReading() {
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
 * @param {HTMLElement} element
 * @returns {boolean} whether `element`'s own top edge (not just some part of it) is currently on
 *   screen, below the sticky navbar -- unlike merely being partly on screen, e.g. only its last
 *   line still poking above the navbar, which wouldn't show where it starts
 */
function isElementStartVisible(element) {
    const top = element.getBoundingClientRect().top;
    return top >= getNavbarHeight() && top < window.innerHeight;
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
function startFromVisible() {
    if (!SPEECH_SUPPORTED || !plan.length) return;
    resetPlayback();
    const index = findVisibleEntryIndex();
    plan[index]?.group?.scrollIntoView({ behavior: "smooth", block: "start" });
    planIndex = index;
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
 * Builds one instance of the read-aloud control: a play/stop toggle and a "restart from the
 * beginning" button, both always shown, plus two buttons hidden until they're relevant --
 * "replay this paragraph" (once reading has produced something to go back to) and "continue
 * after the code block" (once reading is paused at one). Call once per place it needs to appear
 * (the desktop right sidebar, the mobile floating bar) -- every instance shares the same
 * underlying playback state and stays in sync with the others.
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
        { class: "returnButton readerRestartButton visible" },
        { textContent: t("readerRestart") }
    );
    const replayButton = createTag(
        "button",
        { class: "returnButton readerReplayButton" },
        { textContent: t("readerReplay") }
    );
    const continueButton = createTag(
        "button",
        { class: "returnButton readerContinueButton" },
        { textContent: t("readerContinue") }
    );
    toggleButton.addEventListener("click", () => {
        if (isPlaying || isPausedAtCode) stopReading();
        else startFromVisible();
    });
    restartButton.addEventListener("click", startReading);
    replayButton.addEventListener("click", replayParagraph);
    continueButton.addEventListener("click", continueAfterCode);
    wrapper.append(toggleButton, restartButton, replayButton, continueButton);

    const applyStatus = status => {
        toggleButton.disabled = !status.hasPlan;
        restartButton.disabled = !status.hasPlan;
        toggleButton.textContent = status.isPlaying || status.isPausedAtCode
            ? t("readerStop")
            : t("readerListen");
        // Replaying only makes sense once reading has produced something to go back to; restarting
        // (readerRestartButton) is available from the start, same as the toggle button, since it
        // doesn't depend on any prior progress.
        const hasProgress = status.isPlaying || status.isPausedAtCode || status.canReplay;
        replayButton.classList.toggle("visible", hasProgress);
        continueButton.classList.toggle("visible", status.isPausedAtCode);
    };
    listeners.add(applyStatus);
    applyStatus(getStatus());

    return wrapper;
}
