import { createTag } from "./tags.js";
import { appState } from "./state.js";
import { t } from "./i18n.js";

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
//
// Only operators verified to mean the same thing in every language/tool taught on the site belong
// here -- e.g. "==" is "equals" whether the page is about JavaScript, PHP, or Bash's `[[ ]]`. Many
// common symbols are NOT safe to put here because the same glyph means something different
// depending on context (`>` is "greater than" in most languages but "redirect, overwrite" in a
// shell; `.`/`*`/`+` are ordinary punctuation/arithmetic almost everywhere but anchors/quantifiers
// in a regex) -- those live in CONTEXT_OPERATOR_SPEECH below instead, keyed by where they're safe.
const GLOBAL_OPERATOR_SPEECH = {
    "==": "equals",
    "===": "strictly equals",
    "!=": "not equals",
    "!==": "strictly not equals",
    "<=": "less than or equal",
    ">=": "greater than or equal",
    "&&": "and",
    "||": "or",
    "??": "nullish coalescing",
    "?.": "optional chaining",
    // A bare "$" before a number (e.g. "$1") gets read by the TTS engine as a currency amount
    // ("one dollar") -- nothing on this site is about money, it's a variable sigil (Bash, Zsh,
    // PHP...) or, in regex, an end-of-line anchor (both overridden by that context's own "$"
    // below). "$(" (command substitution/subexpression) and "$((" (arithmetic expansion) are
    // longer keys matched first in shell contexts, so this fallback only ever fires on an actual
    // variable/anchor "$", never on one that opens a parenthesized construct.
    "$": "variable",
};

// These six always compare two operands: appending "to" after the spoken phrase folds the
// right-hand side into the same clause (e.g. "3 !== 4" -> "3 strictly not equals to 4") instead
// of leaving it trailing on its own right after the phrase.
const COMPARISON_OPERATORS = new Set(["==", "===", "!=", "!==", "<=", ">="]);

// Symbols whose meaning depends on the language/tool being taught, keyed by the page's context --
// its subject id (e.g. "javascript", "bash"), or its category id when the category has no subjects
// (e.g. "git"; cf. appState.curSubject/curCategory). A context's entries are layered on top of
// GLOBAL_OPERATOR_SPEECH (overriding it on a shared key, though none currently collide) rather
// than replacing it, so e.g. "==" still reads correctly on every page regardless of context.
//
// The whole "Domain-specific Languages (DSL)" category (regex.md, sql.md, ...) shares one context
// since it has no subjects to split on -- safe today because only regex.md actually uses these
// bare symbols (cf. the survey that produced this table), but a future DSL chapter reusing e.g.
// "." for something else would need this category split into real subjects first.
const CONTEXT_OPERATOR_SPEECH = {
    c: {
        "->": "arrow, member access through a pointer",
        "&": "address of",
        "<<": "left shift",
        ">>": "right shift",
        "~": "bitwise not",
        "^": "bitwise xor",
        "|": "bitwise or",
    },
    cpp: {
        "->": "arrow, member access through a pointer",
        "&": "address of",
        "<<": "stream insertion",
        ">>": "stream extraction",
        "~": "bitwise not",
        "^": "bitwise xor",
        "::": "scope resolution",
    },
    php: {
        "::": "double colon, static access",
        "->": "arrow, property or method access",
        "@": "at, suppress errors",
        "<?php": "opening tag",
        "?>": "closing tag",
    },
    python: {
        ":=": "walrus operator",
        "@": "at, decorator",
    },
    ocaml: {
        "::": "cons",
        ":=": "assign to reference",
        "+.": "float plus",
    },
    bash: {
        "|": "pipe",
        ">": "redirect, overwrite",
        ">>": "redirect, append",
        "<": "redirect, input",
        "~": "home directory",
        "$?": "exit status",
        "$@": "all arguments",
        "$#": "argument count",
        "$$": "process id",
        "$((": "arithmetic expansion",
        "$(": "command substitution",
    },
    powershell: {
        "|": "pipe",
        ">": "redirect, overwrite",
        ">>": "redirect, append",
        "$(": "subexpression",
    },
    zsh: {
        "|": "pipe",
        ">": "redirect, overwrite",
        ">>": "redirect, append",
        "<": "redirect, input",
        "~": "home directory",
        "$?": "exit status",
        "$@": "all arguments",
        "$#": "argument count",
        "**": "recursive glob",
        "$((": "arithmetic expansion",
        "$(": "command substitution",
    },
    "domain-specific-languages-dsl": {
        "^": "start anchor",
        "$": "end anchor",
        ".": "any character",
        "*": "zero or more",
        "+": "one or more",
        "?": "zero or one",
    },
    css: {
        ">": "direct child combinator",
        "+": "adjacent sibling combinator",
        "~": "general sibling combinator",
        "*": "universal selector",
    },
    "data-science": {
        "@": "matrix multiplication",
        "*": "element-wise multiplication",
    },
    mathematiques: {
        "@": "matrix multiplication",
        "*": "element-wise multiplication",
        "·": "dot product",
    },
    git: {
        "<<<<<<<": "conflict marker, start of your changes",
        "=======": "conflict marker, separator",
        ">>>>>>>": "conflict marker, end of incoming changes",
        "<<": "heredoc redirect",
        "EOF": "E O F",
        "$(": "command substitution",
    },
};

// One compiled { table, pattern } per context, built lazily and cached -- collectLeafSegments()
// runs once per paragraph, so rebuilding a page's operator regex on every call would be wasteful.
const operatorTableCache = new Map();

function getOperatorTable(context) {
    if (!operatorTableCache.has(context)) {
        const table = { ...GLOBAL_OPERATOR_SPEECH, ...(CONTEXT_OPERATOR_SPEECH[context] ?? {}) };
        // Longest keys first, so e.g. "!==" matches before "!=" can claim its first two characters.
        const pattern = new RegExp(
            Object.keys(table)
                .sort((a, b) => b.length - a.length)
                .map(op => op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("|"),
            "g"
        );
        operatorTableCache.set(context, { table, pattern });
    }
    return operatorTableCache.get(context);
}

// A CLI flag's leading dash(es) ("-e", "--verbose") get the same silent-or-mumbled treatment from
// the TTS engine as the operators above. Unlike those, a flag prefix means the same thing (an
// option, not a subtraction) in every language/tool that uses the convention -- Bash, Zsh,
// PowerShell, git, Docker, Python's argparse... -- so this runs unconditionally, not per context.
// Matched by structure (a dash run at a word boundary, right before a letter) rather than a fixed
// list of known flags, so it covers any flag without needing to be kept in sync with content.
const CLI_FLAG_PATTERN = /(^|\s)(--?)(?=[A-Za-z])/g;

function speakableCode(text, context) {
    const { table, pattern } = getOperatorTable(context);
    return text
        .replace(pattern, op => COMPARISON_OPERATORS.has(op) ? ` ${table[op]} to ` : ` ${table[op]} `)
        .replace(CLI_FLAG_PATTERN, (_, before, dashes) => `${before}${dashes === "--" ? "dash dash " : "dash "}`)
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Flushes `buffer` (page-language text accumulated so far) as one plan entry, then appends
 * `leaf`'s inline `code` spans as their own separate en-US entries -- kept apart from the
 * surrounding text rather than concatenated with it, so each is spoken with correct
 * pronunciation without breaking the flow of the sentence around it.
 *
 * @param {HTMLElement} leaf a single h2-h6/p/li/th/td element
 * @param {string} lang the page's language, e.g. "fr", "en"
 * @param {string} context the page's subject or category id, used to pick the right operator
 *   table for inline code (cf. CONTEXT_OPERATOR_SPEECH)
 * @param {Array} entries the plan being built, appended to in place
 */
function collectLeafSegments(leaf, lang, context, entries) {
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
            if (code) entries.push({ kind: "speak", text: speakableCode(code, context), lang: "en-US", group: leaf });
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
 * @param {string} context see {@link collectLeafSegments}
 * @param {Array} entries the plan being built, appended to in place
 */
function collectSegments(root, lang, context, entries) {
    Array.from(root.children).forEach(element => {
        if (element.matches(IGNORED_SELECTOR)) return;
        if (element.tagName === "PRE") {
            entries.push({ kind: "pause", element });
        } else if (LEAF_TAGS.has(element.tagName)) {
            collectLeafSegments(element, lang, context, entries);
        } else {
            collectSegments(element, lang, context, entries);
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
    const context = appState.curSubject ?? appState.curCategory;
    collectSegments(pageDiv, document.documentElement.lang || "fr", context, entries);
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
        entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
        notify();
        return;
    }
    isPlaying = true;
    isPausedAtCode = false;
    lastSpokenIndex = planIndex;
    notify();
    // Only when its start isn't shown -- avoids yanking the view on every paragraph when several
    // are already visible together (e.g. a tall screen, short paragraphs).
    if (!isElementStartVisible(entry.group))
        entry.group.scrollIntoView({ behavior: "smooth", block: "start" });
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    const myGeneration = generation;
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
