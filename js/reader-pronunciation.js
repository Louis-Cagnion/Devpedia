/* Pure text-transformation logic for js/reader.js: given a page's own text (inline code or
   prose), returns the text to actually feed SpeechSynthesisUtterance so it's pronounced
   correctly. No DOM access, no playback state, so this module is reasoned about independently. */

/* A separator like " / " left between two inline `code` spans (e.g. "if / else if") has no
   word to pronounce -- skip flushing it rather than reading the bare punctuation aloud. */
export const HAS_SPOKEN_CONTENT = /[\p{L}\p{N}]/u;

/* Operators spoken character-by-character are unreliable ("!==" dropped the "!"): replaced with
   an explicit English phrase. Only operators meaning the same thing everywhere belong here -- a
   context-dependent glyph (`>`, `.`, `*`...) lives in CONTEXT_OPERATOR_SPEECH below instead. */
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
    /* A bare "$" before a number reads as a currency amount otherwise -- it's a variable sigil
       (Bash, Zsh, PHP) or regex anchor here, both overridden by that context's own "$" below.
       Longer shell keys ("$(", "$((") match first, so this only fires on an actual variable. */
    "$": "variable",
};

/* These six always compare two operands: appending "to" after the spoken phrase folds the
   right-hand side into the same clause (e.g. "3 !== 4" -> "3 strictly not equals to 4") instead
   of leaving it trailing on its own right after the phrase. */
const COMPARISON_OPERATORS = new Set(["==", "===", "!=", "!==", "<=", ">="]);

/* Symbols whose meaning depends on the language/tool being taught, keyed by the page's context
   (its subject id, or category id when there's no subject). Layered on top of
   GLOBAL_OPERATOR_SPEECH rather than replacing it, so "==" still reads right everywhere. */
const CONTEXT_OPERATOR_SPEECH = {
    c: {
        "->": "arrow, member access through a pointer",
        /* "&" is ambiguous in C: unary "address of" unspaced vs. binary bitwise AND spaced ("x &
           MASQUE"). "& " (longer, higher-priority) matches only the spaced case. Just "bitwise":
           AND is the default of the three, "bitwise and" reads as needlessly verbose here. */
        "& ": "bitwise",
        "&": "address of",
        "|=": "bitwise or equals",
        "&=": "bitwise and equals",
        "^=": "bitwise xor equals",
        "++": "increment",
        /* Same spacing trick as "&": "% " is modulo (infix, "n % 2"), bare "%" a printf specifier
           ("%d"). "* " is multiplication ("n * 2"); bare "*" (declaration vs. dereference) is left
           unhandled, its two meanings aren't resolvable by spacing alone. */
        "% ": "modulo",
        "* ": "times",
        "<<": "left shift",
        ">>": "right shift",
        "~": "bitwise not",
        /* Spaced like "& "/"* " above: unspaced "-" is a CLI flag (`-o`, `-lm`), not subtraction. */
        "- ": "minus",
        /* Spaced too: bare "<"/">" open a bracket in real C content here (`<stdarg.h>`), always
           unspaced -- `fabs(a-b) < epsilon` read "<" in French otherwise (Louis, 2026-08-16). */
        " < ": "strictly inferior to",
        " > ": "strictly superior to",
        /* Capitalized like the acronym it is: lowercase "xor" gets sounded out as one made-up
           syllable ("zor") by most TTS voices, same as why "XOR" is capitalized in prose too. */
        "^": "bitwise XOR",
        "|": "bitwise or",
    },
    cpp: {
        "->": "arrow, member access through a pointer",
        /* Unlike C, every inline "&" on this site's C++ content is a reference (declaration,
           lambda capture, or parameter), never a bare address-of or bitwise AND -- cf. the
           survey behind this table. */
        "&": "reference",
        "++": "increment",
        "<<": "stream insertion",
        ">>": "stream extraction",
        "~": "bitwise not",
        /* Capitalized like the acronym it is: lowercase "xor" gets sounded out as one made-up
           syllable ("zor") by most TTS voices, same as why "XOR" is capitalized in prose too. */
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
        /* "b^y" was read "b accent circonflexe y" -- the caret's French name (Louis, 2026-08-16).
           English like the rest of this table, not "puissance" -- that's the separate prose case
           (cf. PROSE_SYMBOL_SPEECH's own "^" entry below). */
        "^": "to the power of",
    },
    /* Same fabs(a-b) < epsilon idiom as "c" above (nombres-flottants.md). "-" is bare (no CLI
       flag here to protect against); " < "/" > " stay spaced -- encodage-des-textes.md cites raw
       HTML (`<meta charset="utf-8">`) unspaced, same as C's own `<stdarg.h>`. */
    "representation-des-donnees": {
        "-": "minus",
        " < ": "strictly inferior to",
        " > ": "strictly superior to",
    },
    git: {
        "<<<<<<<": "conflict marker, start of your changes",
        "=======": "conflict marker, separator",
        ">>>>>>>": "conflict marker, end of incoming changes",
        "<<": "heredoc redirect",
        "EOF": "E O F",
        "$(": "command substitution",
    },
    /* No "." entry here (unlike the DSL context, "any character" in regex): sql.md's own
       "c.nom" syntax needs its "." read as an ordinary filename dot (FILENAME_DOT_PATTERN),
       which an identity entry here used to pre-empt by padding it with spaces first. */
    sql: {
        "*": "all columns",
        "$": "variable",
    },
    /* le-terminal.md cites `>`/`$`/`%` as plain prompt-ending characters, not shell operators
       (before any shell is introduced) -- read by their everyday French names instead, overriding
       GLOBAL_OPERATOR_SPEECH's own "$": "variable" which would otherwise apply here too. */
    "le-terminal": {
        ">": "flèche",
        "$": "dollar",
        "%": "pourcent",
    },
};

/* Pages whose own meaning for a shared subject/category context's symbols diverges from that
   context's other pages (cf. the DSL comment above) get routed to a same-named entry in
   CONTEXT_OPERATOR_SPEECH by page id instead, checked before curSubject/curCategory. */
export const PAGE_SPECIFIC_CONTEXT = new Set(["sql", "le-terminal"]);

/* One compiled { table, pattern } per context, built lazily and cached -- collectLeafSegments()
   runs once per paragraph, so rebuilding a page's operator regex on every call would be wasteful. */
const operatorTableCache = new Map();

function getOperatorTable(context) {
    if (!operatorTableCache.has(context)) {
        const table = { ...GLOBAL_OPERATOR_SPEECH, ...(CONTEXT_OPERATOR_SPEECH[context] ?? {}) };
        /* Longest keys first, so e.g. "!==" matches before "!=" can claim its first two characters. */
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

/* A CLI flag's leading dash(es) get the silent-or-mumbled TTS treatment: means the same thing (an
   option) in every tool that uses the convention, so this runs unconditionally, not per context.
   Matched by structure (a dash run before a letter), not a fixed list, so it covers any flag. */
const CLI_FLAG_PATTERN = /(^|\s)(--?)(?=[A-Za-z])/g;

/* `fabs(a-b) < epsilon` was read "fat a b plus petit que epsilon" -- mumbled name, dropped
   parens/minus, French "<" (Louis, 2026-08-16). "FABS" capitalized like GUI/CLI/EOF; the closing
   ")" is dropped entirely rather than left for the engine to skip on its own. */
const FABS_CALL_PATTERN = /fabs\(([^)]*)\)/g;

/* "-"/"--" cited bare (not attached to a flag letter) falls outside CLI_FLAG_PATTERN's own
   lookahead, so it went unread (Louis, 2026-08-16). Same words, reached by a different route. */
const BARE_DASH_PATTERN = /^--?$/;
const BARE_DASH_SPEECH = { "-": "dash", "--": "dash dash" };

/* snake_case/CONSTANT_CASE identifiers read their underscore as a word ("AUTO_CD" -> "auto
   souligné C D") -- pure noise, replaced with a space so each part reads as its own word
   (Louis, 2026-08-16, listening to a table of Zsh option names). */
const IDENTIFIER_UNDERSCORE_PATTERN = /_/g;

/* Unix "rc" dotfiles (".bashrc") read as one mangled word otherwise -- a small table rather than
   a generic "ends in rc" regex (would also catch "src"). Unconditional like CLI_FLAG_PATTERN: one
   shell's rc file gets cited from another's chapter. Captures the leading "." as "dot" too. */
const RC_FILE_SPEECH = { bashrc: "bash R C", zshrc: "zsh R C" };
const RC_FILE_PATTERN = new RegExp(`(\\.)?\\b(${Object.keys(RC_FILE_SPEECH).join("|")})\\b`, "g");

/* Some bare KEYWORD_SPEECH keywords are mis-read as a mumbled blob otherwise -- "shopt" heard as
   one word instead of "S H opt" ("sh" alone read as the "hush" sound, Louis, 2026-08-16). Kept
   separate from KEYWORD_SPEECH since most keywords there need no respelling at all. */
const KEYWORD_RESPELLING = { shopt: "S H opt" };
const KEYWORD_RESPELLING_PATTERN = new RegExp(`\\b(${Object.keys(KEYWORD_RESPELLING).join("|")})\\b`, "g");

/**
 * @brief Applies the operator/flag/rc-file rewrites, which all produce an inherently English
 * replacement (a spelled-out word like "equals" or "dash", or a name like "bash R C"). Whenever
 * one of them actually changes the text, that's a reliable signal the result needs the English
 * voice (cf. needsEnglishVoice() below). Kept as its own step, separate from speakableCode()'s
 * final underscore cleanup, since that cleanup applies just as much to a French teaching-example
 * identifier (`nom_dossier`) as to a real English one (`AUTO_CD`) and so implies nothing about
 * which language the result belongs in.
 *
 * @param {string} text
 * @param {string} context
 *
 * @returns {string}
 */
function englishRewrite(text, context) {
    if (BARE_DASH_PATTERN.test(text)) return BARE_DASH_SPEECH[text];
    const { table, pattern } = getOperatorTable(context);
    return text
        .replace(FABS_CALL_PATTERN, (_, args) => `FABS of ${args}`)
        .replace(pattern, op => COMPARISON_OPERATORS.has(op) ? ` ${table[op]} to ` : ` ${table[op]} `)
        .replace(CLI_FLAG_PATTERN, (_, before, dashes) => `${before}${dashes === "--" ? "dash dash " : "dash "}`)
        .replace(RC_FILE_PATTERN, (_, dot, name) => `${dot ? "dot " : ""}${RC_FILE_SPEECH[name]}`)
        .replace(KEYWORD_RESPELLING_PATTERN, name => KEYWORD_RESPELLING[name]);
}

/* Some extensions are said as a whole word, not spelled out -- ".py" is "dot pie", not "dot P Y".
   Matched only right after a literal "." (cf. FILENAME_DOT_PATTERN below); this table only
   respells the letters, the dot itself is still read separately. */
const FILE_EXTENSION_RESPELLING = { py: "pi" };
const FILE_EXTENSION_RESPELLING_PATTERN = new RegExp(`(?<=\\.)(${Object.keys(FILE_EXTENSION_RESPELLING).join("|")})\\b`, "g");

/* A "." with no space right after it (`texte.txt`, `~/.bashrc`) gets dropped/mumbled otherwise
   (Louis, 2026-08-16). Kept out of englishRewrite(): which word this reads as depends only on the
   page's own language, not on whether the surrounding code needs the English voice. */
const FILENAME_DOT_PATTERN = /\.(?!\s)/g;
const FILENAME_DOT_SPEECH = { fr: "point", en: "dot", es: "punto", br: "ponto" };

/**
 * @brief Rewrites inline-code text into a form a TTS engine pronounces correctly: operators,
 * CLI flags, rc-files, keywords, file extensions, filename dots, and identifier underscores.
 *
 * @param {string} text raw inline-code text
 * @param {string} context the page's subject id, or its category id when there's no subject
 *   (e.g. "c", "bash")
 * @param {string} lang the page's own language code (e.g. "fr", "en")
 *
 * @returns {string} the text as it should actually be spoken
 */
export function speakableCode(text, context, lang) {
    return englishRewrite(text, context)
        .replace(FILE_EXTENSION_RESPELLING_PATTERN, ext => FILE_EXTENSION_RESPELLING[ext])
        .replace(FILENAME_DOT_PATTERN, ` ${FILENAME_DOT_SPEECH[lang] ?? FILENAME_DOT_SPEECH.fr} `)
        .replace(IDENTIFIER_UNDERSCORE_PATTERN, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* Bare command/builtin names always English regardless of page language -- a curated set, not a
   shape rule (`MAJUSCULES_AVEC_UNDERSCORES` is a real French placeholder elsewhere). Unconditional:
   Bash's own `shopt` gets cited from Zsh's own chapter too (Louis, 2026-08-16). */
const KEYWORD_SPEECH = new Set([
    "setopt",
    "unsetopt",
    "shopt",
    "AUTO_CD",
    "CORRECT",
    "EXTENDED_GLOB",
    "HIST_IGNORE_DUPS",
    "NO_CASE_GLOB",
    "SHARE_HISTORY",
    "Graphical User Interface",
    "Command-Line Interface",
    /* The SQL column type, read as a French word ("décimal") instead of the English one by a
       French voice otherwise (nombres-flottants.md's own recap row, reported by Louis on
       2026-08-16 alongside the fabs() fix above). */
    "DECIMAL",
]);

/**
 * @brief Determines whether inline-code text needs to be spoken in the English voice.
 *
 * @example
 * needsEnglishVoice("===", "javascript") -> true (an operator rewrite changes the text)
 * needsEnglishVoice("shopt", "zsh") -> true (a known bare keyword, even unchanged)
 * needsEnglishVoice("nom_dossier", "c") -> false (no rewrite, not a known keyword)
 *
 * @param {string} code raw inline-code text, not yet run through speakableCode()
 * @param {string} context the page's subject id, or its category id when there's no subject
 *
 * @returns {boolean} true if `code` needs the English voice
 */
export function needsEnglishVoice(code, context) {
    if (englishRewrite(code, context) !== code) return true;
    return KEYWORD_SPEECH.has(code);
}

/* Typographic symbols in prose, which TTS skips or reads unpredictably. Keyed by language. "~"
   prefixes a number and reads "tilde"; "≈" sits between two values and needs "environ égal à",
   not just "environ" (dropped the "equal to" half, so the two no longer share one word). */
/* "C#" always reads "C sharp", never the French name of "#" -- outside any code span in every
   mention on the site (cited in passing, never its own chapter). */
const CSHARP_SPEECH = "C sharp";
/* "OCaml" read as one word by a French voice lands on "au calme" ("at ease") -- the inserted
   space forces the syllables apart (Louis, 2026-08-16). Matters more than C#: its own subject. */
const OCAML_SPEECH = "O Caml";
/* "Devpédia" is read "Deuvpédia" -- the plain "e" in "Dev" comes out as a schwa (Louis,
   2026-08-16). Respelled for speech only; fr content only, other languages write it unaccented. */
const DEVPEDIA_SPEECH_FR = "Dévpédia";
/* "PowerShell" blended into "powshell" -- forced apart into its two real words, same fix family
   as OCaml above (Louis, 29/08/2026). */
const POWERSHELL_SPEECH = "Power Shell";
/* "Git" read "gi" (soft g, silent t). Tried "Guite" (came out "yite"), then spelled by letter
   like an acronym (rejected: not how it's said out loud) -- splitting it into two words forces
   the syllable break "Guite" alone didn't get (Louis, 29/08/2026, still not confirmed by ear). */
const GIT_SPEECH_FR = "Gui te";
const ZSH_SPEECH_FR = "Z S H";
/* "cf." read as "confère" instead of two letters; "Ctrl" read as raw letters instead of
   "contrôle"; "shells" given an English plural "z" sound despite being an invariable loan-word
   here. All Louis, 2026-08-16 ("prompt" -- same report -- is handled separately below). */
const CF_SPEECH_FR = "C F";
const CTRL_SPEECH_FR = "contrôle";
const SHELL_SPEECH_FR = "shell";
/* "prompt" loses its final "t" sound like the French word "prompt" (quick) does -- a silent
   trailing "e" forces it through. Matched by whole word rather than through PROSE_SYMBOL_SPEECH's
   plain substring replace: it collides with "prompts"/"prompting" used elsewhere in AI content. */
const PROMPT_WORD_PATTERN = /\bprompt\b/gi;
const PROMPT_SPEECH_FR = "prompte";
/* "déréférencement" is read "dé" then the second "é" spelled out letter by letter -- confirmed
   live (2026-08-16) the text handed to the engine is already correct, so this is the voice itself
   choking on the "éré" cluster. A silent hyphen after "dé" breaks the two syllables apart. */
const DEREFERENCE_PATTERN = /\bdéréférenc/gi;
const DEREFERENCE_SPEECH_FR = "dé-référenc";

/* Unicode superscripts ("2ⁿ⁻¹") are silently skipped by TTS engines -- decoded back to normal-size
   text and prefixed with a localized "to the power of". Declared before PROSE_SYMBOL_SPEECH so its
   own "^" entry below can reuse this same `of` wording instead of a second hand-written copy. */
const SUPERSCRIPT_DIGITS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n", "ⁱ": "i" };
const SUPERSCRIPT_RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱ⁻⁺]+/g;
const POWER_OF_SPEECH = {
    fr: { of: "puissance", "⁻": " moins ", "⁺": " plus " },
    en: { of: "to the power of", "⁻": " minus ", "⁺": " plus " },
    es: { of: "elevado a", "⁻": " menos ", "⁺": " más " },
    br: { of: "elevado a", "⁻": " menos ", "⁺": " mais " },
};

/* "^" in prose (cf. CONTEXT_OPERATOR_SPEECH.mathematiques for the code-span case) was read as
   the caret's own French name instead of an exponent, e.g. "mantisse × 2^exposant" (Louis,
   2026-08-16). Reuses the superscript's own "to the power of" wording -- same concept, ASCII. */
const PROSE_SYMBOL_SPEECH = {
    fr: {
        "≈": "environ égal à",
        "~": "environ",
        "≥": "supérieur ou égal à",
        "≠": "différent de",
        "°": "degrés",
        "×": "fois",
        "↔": "relié à",
        "±": "plus ou moins",
        "…": "",
        "^": POWER_OF_SPEECH.fr.of,
        "C#": CSHARP_SPEECH,
        "OCaml": OCAML_SPEECH,
        "Devpédia": DEVPEDIA_SPEECH_FR,
        "cf.": CF_SPEECH_FR,
        "Ctrl": CTRL_SPEECH_FR,
        "Shells": SHELL_SPEECH_FR,
        "shells": SHELL_SPEECH_FR,
        "PowerShell": POWERSHELL_SPEECH,
        "powershell": POWERSHELL_SPEECH,
        "Git": GIT_SPEECH_FR,
        "git": GIT_SPEECH_FR,
        "Zsh": ZSH_SPEECH_FR,
        "zsh": ZSH_SPEECH_FR,
    },
    en: { "≈": "approximately equal to", "~": "approximately", "≥": "greater than or equal to", "≠": "different from", "°": "degrees", "×": "times", "↔": "linked to", "±": "plus or minus", "…": "", "^": POWER_OF_SPEECH.en.of, "C#": CSHARP_SPEECH, "OCaml": OCAML_SPEECH },
    es: { "≈": "aproximadamente igual a", "~": "aproximadamente", "≥": "mayor o igual a", "≠": "diferente de", "°": "grados", "×": "por", "↔": "vinculado a", "±": "más o menos", "…": "", "^": POWER_OF_SPEECH.es.of, "C#": CSHARP_SPEECH, "OCaml": OCAML_SPEECH },
    br: { "≈": "aproximadamente igual a", "~": "aproximadamente", "≥": "maior ou igual a", "≠": "diferente de", "°": "graus", "×": "vezes", "↔": "ligado a", "±": "mais ou menos", "…": "", "^": POWER_OF_SPEECH.br.of, "C#": CSHARP_SPEECH, "OCaml": OCAML_SPEECH },
};

/* "→" means a numeric/character range ("0 → 255") on the two pages below, "leads to"/sequence
   everywhere else ("str_starts_with(...) → true"). Verified none of these pages mix both senses,
   so one word per page rather than parsing each occurrence's own surrounding tokens. */
const ARROW_RANGE_PAGES = new Set(["entiers-et-debordements", "encodage-des-textes"]);
const ARROW_SPEECH = {
    range: { fr: "à", en: "to", es: "a", br: "a" },
    other: { fr: "puis", en: "then", es: "luego", br: "depois" },
};

/* Any standalone ALL-CAPS token, or several joined by "/" (CI/CD, TCP/UDP...), is spelled out by
   letter. A comma between every letter, tried for a 2-letter pair still blending ("UI" -> "usi"),
   broke longer ones like HTML/CSS instead (Louis, 29/08/2026) -- reverted to a plain space. */
const ACRONYM_PATTERN = /\b[A-Z]{2,}(?:\/[A-Z]{2,})*\b/g;
const ACRONYM_EXCLUDED_WORDS_FR = new Set(["ET", "OU", "NON", "SI", "MAIS", "DONC", "OR", "NI", "CAR"]);
function spellOutSingleAcronym(word) {
    return ACRONYM_EXCLUDED_WORDS_FR.has(word) ? word : word.split("").join(" ");
}
function spellOutAcronymsFr(text) {
    return text.replace(ACRONYM_PATTERN, match => match.split("/").map(spellOutSingleAcronym).join(", "));
}

function decodeSuperscript(run, lang) {
    const signs = POWER_OF_SPEECH[lang] ?? POWER_OF_SPEECH.en;
    return [...run].map(ch => SUPERSCRIPT_DIGITS[ch] ?? signs[ch] ?? ch).join("");
}

/* Purely decorative in every "## 📋 Summary" heading (the only prose emoji -- one used as real
   content always sits inside a `code` span instead). Most TTS voices announce its name otherwise.
   Exported so reader.js's collectLeafSegments can recognize this heading structurally too. */
export const DECORATIVE_EMOJI = "📋";

/**
 * @brief Rewrites page-language prose text into a form a TTS engine pronounces correctly:
 * arrows, the recap emoji, superscripts, "prompt"/"déréférencement"/ALL-CAPS acronyms (fr), and
 * prose symbols.
 *
 * @param {string} text raw prose text
 * @param {string} lang the page's own language code (e.g. "fr", "en")
 * @param {string} pageId the page's own id
 *
 * @returns {string} the text as it should actually be spoken
 */
export function speakableText(text, lang, pageId) {
    const arrowWord = ARROW_SPEECH[ARROW_RANGE_PAGES.has(pageId) ? "range" : "other"][lang] ?? ARROW_SPEECH.other.en;
    const powerOfWord = (POWER_OF_SPEECH[lang] ?? POWER_OF_SPEECH.en).of;
    let result = text
        .replaceAll("→", ` ${arrowWord} `)
        .replaceAll(DECORATIVE_EMOJI, "")
        .replace(SUPERSCRIPT_RUN, run => ` ${powerOfWord} ${decodeSuperscript(run, lang)} `);
    if (lang === "fr") {
        result = result.replace(PROMPT_WORD_PATTERN, ` ${PROMPT_SPEECH_FR} `);
        result = result.replace(DEREFERENCE_PATTERN, DEREFERENCE_SPEECH_FR);
        result = spellOutAcronymsFr(result);
    }
    const symbols = PROSE_SYMBOL_SPEECH[lang] ?? PROSE_SYMBOL_SPEECH.en;
    for (const [symbol, phrase] of Object.entries(symbols)) {
        result = result.replaceAll(symbol, ` ${phrase} `);
    }
    return result.replace(/\s+/g, " ").trim();
}
