// Pure text-transformation logic for js/reader.js: given a page's own text (inline code or
// prose), returns the text to actually feed SpeechSynthesisUtterance so it's pronounced
// correctly -- no DOM access, no playback state, so this module can be reasoned about (and
// tested) independently of the reading engine that calls into it. See devpedia-todo.md for the
// decisions this module implements.

// A separator like " / " left between two inline `code` spans (e.g. "if / else if") has no
// word to pronounce -- skip flushing it rather than reading the bare punctuation aloud.
export const HAS_SPOKEN_CONTENT = /[\p{L}\p{N}]/u;

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
export const PAGE_SPECIFIC_CONTEXT = new Set(["sql"]);

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

export function speakableCode(text, context) {
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
// "C#" is the language name, never translated, always pronounced "C sharp" -- read as "C
// croisillons" (the French name of "#") otherwise, since it's outside any inline code span in
// every mention on the site (only ever cited in passing, never taught as its own chapter).
const CSHARP_SPEECH = "C sharp";
const PROSE_SYMBOL_SPEECH = {
    fr: { "≈": "environ", "~": "environ", "≥": "supérieur ou égal à", "≠": "différent de", "°": "degrés", "×": "fois", "C#": CSHARP_SPEECH },
    en: { "≈": "approximately", "~": "approximately", "≥": "greater than or equal to", "≠": "different from", "°": "degrees", "×": "times", "C#": CSHARP_SPEECH },
    es: { "≈": "aproximadamente", "~": "aproximadamente", "≥": "mayor o igual a", "≠": "diferente de", "°": "grados", "×": "por", "C#": CSHARP_SPEECH },
    br: { "≈": "aproximadamente", "~": "aproximadamente", "≥": "maior ou igual a", "≠": "diferente de", "°": "graus", "×": "vezes", "C#": CSHARP_SPEECH },
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

export function speakableText(text, lang, pageId) {
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
