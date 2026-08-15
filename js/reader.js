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
// since it has no subjects to split on -- but sql.md does reuse some of the same bare symbols
// with a different meaning than regex.md (e.g. "*" is "all columns" in SQL, not "zero or more"):
// PAGE_SPECIFIC_CONTEXT below routes it to its own "sql" entry instead of the shared one.
const CONTEXT_OPERATOR_SPEECH = {
    c: {
        "->": "arrow, member access through a pointer",
        // "&" is ambiguous in C: unary "address of" directly against an identifier ("&variable",
        // no space) vs. binary bitwise AND between two operands ("x & MASQUE", spaced -- the
        // site's own convention for infix operators). "& " (with the trailing space) is a longer,
        // higher-priority key that only matches the spaced/infix case, leaving bare "&" for the
        // unspaced/prefix case.
        // Just "bitwise", not "bitwise and": unlike "|"/"^" below, dropping the operation name
        // here doesn't lose real information, since AND is the default/most obvious of the three
        // to a listener, and "bitwise and" reads as needlessly verbose next to "modulo"/"times".
        "& ": "bitwise",
        "&": "address of",
        "|=": "bitwise or equals",
        "&=": "bitwise and equals",
        "^=": "bitwise xor equals",
        "++": "increment",
        // Same spacing trick as "&": "%"/"*" are also ambiguous in C, unrelated to their bitwise
        // usage above. "% " (modulo, infix, spaced -- "n % 2") vs bare "%" (a printf format
        // specifier, prefix, unspaced -- "%d"). "* " (multiplication, infix, spaced -- "n * 2")
        // vs bare "*" (pointer declaration/dereference, prefix, unspaced -- "*ptr", "int *p") --
        // the bare "*" case is left unhandled for now (native TTS default), since it carries two
        // distinct meanings of its own (declaration vs dereference) not resolvable by spacing.
        "% ": "modulo",
        "* ": "times",
        "<<": "left shift",
        ">>": "right shift",
        "~": "bitwise not",
        // Capitalized like the acronym it is: lowercase "xor" gets sounded out as one made-up
        // syllable ("zor") by most TTS voices, the same way the literal word "XOR" already reads
        // correctly in prose (untouched by speakableText) -- matching that capitalization here
        // gets the same correct acronym pronunciation for the operator.
        "^": "bitwise XOR",
        "|": "bitwise or",
    },
    cpp: {
        "->": "arrow, member access through a pointer",
        // Unlike C, every inline "&" on this site's C++ content is a reference (declaration,
        // lambda capture, or parameter), never a bare address-of or bitwise AND -- cf. the
        // survey behind this table.
        "&": "reference",
        "++": "increment",
        "<<": "stream insertion",
        ">>": "stream extraction",
        "~": "bitwise not",
        // Capitalized like the acronym it is: lowercase "xor" gets sounded out as one made-up
        // syllable ("zor") by most TTS voices, the same way the literal word "XOR" already reads
        // correctly in prose (untouched by speakableText) -- matching that capitalization here
        // gets the same correct acronym pronunciation for the operator.
        "^": "bitwise XOR",
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
    // "." kept as a literal period rather than removed: sql.md's own alias.column syntax
    // (e.g. "c.nom") needs *something* between the two identifiers, just not "any character".
    sql: {
        "*": "all columns",
        "$": "variable",
        ".": ".",
    },
};

// Pages whose own meaning for a shared subject/category context's symbols diverges from that
// context's other pages (cf. the DSL comment above) get routed to a same-named entry in
// CONTEXT_OPERATOR_SPEECH by page id instead, checked before curSubject/curCategory.
const PAGE_SPECIFIC_CONTEXT = new Set(["sql"]);

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

// Typographic symbols that appear directly in prose (outside inline code), which the TTS engine
// either skips or reads unpredictably. Unlike CONTEXT_OPERATOR_SPEECH (always English, inline
// code only), these run on the page's own prose text in whichever language it's currently shown
// in -- keyed by that language, falling back to English for a language missing an entry.
// "~" is used interchangeably with "≈" throughout the content as an informal "approximately"
// prefix directly against a number ("~7 min", "~1,8 × 10¹⁹", "~−9,2 × 10¹⁸") -- same word as "≈"
// in every language. Read aloud as the literal word "tilde" otherwise, even stuck to a negative
// number's own "−" sign.
const PROSE_SYMBOL_SPEECH = {
    fr: { "≈": "environ", "~": "environ", "≥": "supérieur ou égal à", "≠": "différent de", "°": "degrés", "×": "fois" },
    en: { "≈": "approximately", "~": "approximately", "≥": "greater than or equal to", "≠": "different from", "°": "degrees", "×": "times" },
    es: { "≈": "aproximadamente", "~": "aproximadamente", "≥": "mayor o igual a", "≠": "diferente de", "°": "grados", "×": "por" },
    br: { "≈": "aproximadamente", "~": "aproximadamente", "≥": "maior ou igual a", "≠": "diferente de", "°": "graus", "×": "vezes" },
};

// "→" means different things depending on the chapter: a numeric/character range ("0 → 255",
// "U+0000 → U+007F") in the two pages below, "leads to"/sequence/mapping everywhere else it's
// used in prose (".zshenv → .zprofile", "str_starts_with(...) → true", "Stage → Job → Step").
// Verified none of the pages using "→" mix both senses (cf. journal-de-bord.md) before choosing a
// single word per page rather than trying to parse each occurrence's surrounding tokens. The
// wording matches how each language's own prose already phrases a range elsewhere in these same
// two chapters ("goes from 0 to 255" / "va de 0 à 255" / "va de 0 a 255").
const ARROW_RANGE_PAGES = new Set(["entiers-et-debordements", "encodage-des-textes"]);
const ARROW_SPEECH = {
    range: { fr: "à", en: "to", es: "a", br: "a" },
    other: { fr: "puis", en: "then", es: "luego", br: "depois" },
};

// Unicode superscript characters (exponents, e.g. "2ⁿ⁻¹", "10¹⁹") are silently skipped by TTS
// engines entirely -- "2ⁿ⁻¹ à 2ⁿ⁻¹ − 1" was heard as "2 à 2 − 1", losing the exponent that's the
// whole point of the sentence. A run of consecutive superscript characters is decoded back to its
// normal-size text (digits/n/i as themselves, "⁻"/"⁺" spelled out per language since a bare
// "-"/"+" wouldn't reliably read as minus/plus either) and prefixed with a localized "to the
// power of".
const SUPERSCRIPT_DIGITS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n", "ⁱ": "i" };
const SUPERSCRIPT_RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱ⁻⁺]+/g;
const POWER_OF_SPEECH = {
    fr: { of: "puissance", "⁻": " moins ", "⁺": " plus " },
    en: { of: "to the power of", "⁻": " minus ", "⁺": " plus " },
    es: { of: "elevado a", "⁻": " menos ", "⁺": " más " },
    br: { of: "elevado a", "⁻": " menos ", "⁺": " mais " },
};

function decodeSuperscript(run, lang) {
    const signs = POWER_OF_SPEECH[lang] ?? POWER_OF_SPEECH.en;
    return [...run].map(ch => SUPERSCRIPT_DIGITS[ch] ?? signs[ch] ?? ch).join("");
}

// Purely decorative in every "## 📋 Summary"-style heading (confirmed by survey: this is the
// only emoji ever used in prose -- an emoji used as actual teaching content, like the one in the
// text encoding chapter's own example, always sits inside an inline `code` span instead, so it
// goes through speakableCode(), never this function, and is left untouched). Read aloud, most TTS
// voices announce its name ("clipboard emoji") rather than skipping it silently.
const DECORATIVE_EMOJI = "📋";

function speakableText(text, lang, pageId) {
    const arrowWord = ARROW_SPEECH[ARROW_RANGE_PAGES.has(pageId) ? "range" : "other"][lang] ?? ARROW_SPEECH.other.en;
    const powerOfWord = (POWER_OF_SPEECH[lang] ?? POWER_OF_SPEECH.en).of;
    let result = text
        .replaceAll("→", ` ${arrowWord} `)
        .replaceAll(DECORATIVE_EMOJI, "")
        .replace(SUPERSCRIPT_RUN, run => ` ${powerOfWord} ${decodeSuperscript(run, lang)} `);
    const symbols = PROSE_SYMBOL_SPEECH[lang] ?? PROSE_SYMBOL_SPEECH.en;
    for (const [symbol, phrase] of Object.entries(symbols)) {
        result = result.replaceAll(symbol, ` ${phrase} `);
    }
    return result.replace(/\s+/g, " ").trim();
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
    const flushBuffer = () => {
        const text = buffer.trim();
        if (text && HAS_SPOKEN_CONTENT.test(text))
            entries.push({ kind: "speak", text: speakableText(text, lang, pageId), lang, group: leaf });
        buffer = "";
    };
    leaf.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "CODE") {
            const code = node.textContent.trim();
            if (!code) return;
            const spoken = speakableCode(code, context);
            if (spoken === code) {
                buffer += ` ${code} `;
            } else {
                flushBuffer();
                entries.push({ kind: "speak", text: spoken, lang: "en-US", group: leaf });
            }
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
