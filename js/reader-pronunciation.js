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

/* A French accent anywhere in a code span is an unambiguous signal it's French content (an example
   identifier, not real code syntax) -- used by needsEnglishVoice() below to keep it in the page's
   own voice even though inline code now defaults to English. */
const FRENCH_ACCENT_PATTERN = /[àâäéèêëïîôöùûüÿçœæ]/i;

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

/* Some extensions are said as a whole word or spelled by letter, not left as raw letters -- ".py"
   is "dot pie", ".md" is "dot M-D" (letters, hyphenated per Louis's own standard, 29/08/2026), not
   "dot M D" or "dot md". Matched only right after a literal "." (cf. FILENAME_DOT_PATTERN below);
   this table only respells the letters, the dot itself is still read separately. */
const FILE_EXTENSION_RESPELLING = { py: "pi", md: "M-D", txt: "T-X-T", exe: "exé" };
const FILE_EXTENSION_RESPELLING_PATTERN = new RegExp(`(?<=\\.)(${Object.keys(FILE_EXTENSION_RESPELLING).join("|")})\\b`, "g");

/* "README" read as a mumbled made-up word instead of the English word it is -- respelled with
   French spelling conventions for the same sound ("ride mi"), on Louis's own suggestion
   (29/08/2026). Case-insensitive: same word whether cited as "README" or "readme". */
const FILENAME_RESPELLING = { readme: "ride mi" };
const FILENAME_RESPELLING_PATTERN = new RegExp(`\\b(${Object.keys(FILENAME_RESPELLING).join("|")})\\b`, "gi");

/* Case-sensitive, unlike FILENAME_RESPELLING above: lowercase "cmd" only means the Windows
   executable (`cmd.exe`) -- capitalized "Cmd" is the keyboard modifier key, already spelled
   "Commande" by CODE_KEYWORD_RESPELLING_FR below, which this would otherwise collide with if it
   matched case-insensitively too (Louis, 30/08/2026). */
const FILENAME_RESPELLING_CS = { cmd: "C-M-D" };
const FILENAME_RESPELLING_CS_PATTERN = new RegExp(`\\b(${Object.keys(FILENAME_RESPELLING_CS).join("|")})\\b`, "g");

/* A "." with no space right after it (`texte.txt`, `~/.bashrc`) gets dropped/mumbled otherwise
   (Louis, 2026-08-16). Kept out of englishRewrite(): which word this reads as depends only on the
   page's own language, not on whether the surrounding code needs the English voice. */
const FILENAME_DOT_PATTERN = /\.(?!\s)/g;
const FILENAME_DOT_SPEECH = { fr: "point", en: "dot", es: "punto", br: "ponto" };

/* Bare keyboard-key names read with English sounds instead of French ones -- unlike
 * KEYWORD_RESPELLING above, these respellings are themselves French, so they must never flip
 * needsEnglishVoice() (which only looks at englishRewrite()'s own output): applied as its own
 * step after it instead. One line per key as Louis flags it by ear. */
const CODE_KEYWORD_RESPELLING_FR = { Cmd: "Commande", Alt: "halte" };
const CODE_KEYWORD_RESPELLING_FR_PATTERN = new RegExp(`\\b(${Object.keys(CODE_KEYWORD_RESPELLING_FR).join("|")})\\b`, "g");

/* Symbols cited bare (a whole code span with nothing else in it) with a page-specific French
 * meaning instead of their usual operator one -- e.g. le-terminal.md's own `>`/`$`/`%`, prompt-
 * ending characters before any shell is introduced, read by their everyday French name rather than
 * a shell operator (which GLOBAL_OPERATOR_SPEECH still gives "$" elsewhere). Checked ahead of
 * englishRewrite() entirely, same reasoning as CODE_KEYWORD_RESPELLING_FR above: its French output
 * must never be mistaken for one of that function's own (inherently English) rewrites. */
const CODE_CONTEXT_SYMBOL_RESPELLING_FR = {
    "le-terminal": { ">": "flèche", "$": "dollar", "%": "pourcent" },
};

/**
 * @brief Rewrites inline-code text into a form a TTS engine pronounces correctly: operators,
 * CLI flags, rc-files, keywords, file extensions, filename dots, identifier underscores, and
 * (fr only) bare keyboard-key names and page-specific symbols.
 *
 * @param {string} text raw inline-code text
 * @param {string} context the page's subject id, or its category id when there's no subject
 *   (e.g. "c", "bash")
 * @param {string} lang the page's own language code (e.g. "fr", "en")
 *
 * @returns {string} the text as it should actually be spoken
 */
export function speakableCode(text, context, lang) {
    if (lang === "fr" && CODE_CONTEXT_SYMBOL_RESPELLING_FR[context]?.[text] !== undefined)
        return CODE_CONTEXT_SYMBOL_RESPELLING_FR[context][text];
    let result = englishRewrite(text, context)
        .replace(FILENAME_RESPELLING_PATTERN, name => FILENAME_RESPELLING[name.toLowerCase()])
        .replace(FILE_EXTENSION_RESPELLING_PATTERN, ext => FILE_EXTENSION_RESPELLING[ext])
        .replace(FILENAME_DOT_PATTERN, ` ${FILENAME_DOT_SPEECH[lang] ?? FILENAME_DOT_SPEECH.fr} `)
        .replace(IDENTIFIER_UNDERSCORE_PATTERN, " ");
    if (lang === "fr") {
        result = result.replace(FILENAME_RESPELLING_CS_PATTERN, name => FILENAME_RESPELLING_CS[name]);
        result = result.replace(CODE_KEYWORD_RESPELLING_FR_PATTERN, name => CODE_KEYWORD_RESPELLING_FR[name]);
    }
    return result.replace(/\s+/g, " ").trim();
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
    "Spotlight",
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
    if (CODE_CONTEXT_SYMBOL_RESPELLING_FR[context]?.[code] !== undefined) return false;
    if (englishRewrite(code, context) !== code) return true;
    if (KEYWORD_SPEECH.has(code)) return true;
    CODE_KEYWORD_RESPELLING_FR_PATTERN.lastIndex = 0;
    if (CODE_KEYWORD_RESPELLING_FR_PATTERN.test(code)) return false;
    FILENAME_RESPELLING_PATTERN.lastIndex = 0;
    if (FILENAME_RESPELLING_PATTERN.test(code)) return false;
    FILENAME_RESPELLING_CS_PATTERN.lastIndex = 0;
    if (FILENAME_RESPELLING_CS_PATTERN.test(code)) return false;
    FILE_EXTENSION_RESPELLING_PATTERN.lastIndex = 0;
    if (FILE_EXTENSION_RESPELLING_PATTERN.test(code)) return false;
    if (FRENCH_ACCENT_PATTERN.test(code)) return false;
    /* Inline code defaults to the English voice now: real code syntax, even cited in a French
       tutorial, reads in English unless something above forces it to stay French (Louis,
       30/08/2026). An unaccented French example identifier (`nom_dossier`) has no signal here to
       catch it -- flag any one heard in the wrong voice and it joins one of the tables above. */
    /* A span with no letter/digit at all (bare punctuation like a lambda capture "[]"/"{}"/"[=]")
       has nothing any voice can pronounce -- forcing it into its own English entry sent Piper an
       unspeakable string and crashed the whole batch (empty synthesis output, "stl-algorithmes-
       et-iterateurs.md", 01/09/2026). Left in the page's own voice instead, folding harmlessly
       into the surrounding sentence like before the English-default flip above. */
    if (!HAS_SPOKEN_CONTENT.test(code)) return false;
    return true;
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
/* Simple French-voice word respellings, one line per word as Louis flags it by ear: a word (most
   often English/foreign, occasionally a French one the voice itself swallows) the TTS engine
   mangles or blends into a mumble, respelled to force the right sound. Safe as a plain
   PROSE_SYMBOL_SPEECH substring entry (cf. WORD_BOUNDARY_RESPELLING_FR below for a respelling that
   isn't). A lowercase variant is added only where the site actually cites the word lowercase
   somewhere. */
const WORD_RESPELLING_FR = {
    "Devpédia": "Dévpédia",
    "graphique": "graphik", "Graphique": "Graphik", // final "-que" trails off into a faint mumble otherwise
    "cf.": "C F", // read "confère" instead of two letters otherwise
    "Ctrl": "contrôle",
    "Shells": "shell", "shells": "shell", // invariable loan-word here, not an English plural
    "PowerShell": "Powe-eur-shell", "powershell": "powe-eur-shell",
    "Git": "Gui tte", "git": "gui tte", // soft g, silent t otherwise
    "Zsh": "Z-S-H", "zsh": "z-s-h",
    "Blockchain": "Block cheine", "blockchain": "block cheine",
    "macOS": "mac O-S",
    "User": "Useur", "user": "useur",
};

/* French-voice respellings that would collide with themselves or with real prose elsewhere if
   applied as a plain PROSE_SYMBOL_SPEECH substring entry -- matched by whole word (regex) instead.
   Order matters: a longer phrase must come before a shorter one it starts with (Command-Line before
   Command), same reasoning CLAUSE_END_PATTERN needs the longest match first. */
const WORD_BOUNDARY_RESPELLING_FR = [
    // "prompt" loses its final "t" sound like the French word "prompt" (quick) does; collides with
    // "prompts"/"prompting" elsewhere in AI content as a plain substring.
    [/\bprompt\b/gi, "prompte"],
    // "déréférencement" chokes on its "éré" cluster; a silent hyphen breaks the two syllables apart.
    [/\bdéréférenc/gi, "dé-référenc"],
    // "Commande..." itself starts with "Command" again, which a plain "Command" substring entry
    // would re-match on its own output ("Command-Line" came out "Commande e-la-ine").
    [/\bCommand-Line\b/g, "Commande-la-ine"],
    [/\bcommand-line\b/g, "commande-la-ine"],
    [/\bCommand\b/g, "Commande"],
    [/\bcommand\b/g, "commande"],
];

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
        ...WORD_RESPELLING_FR,
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
   letter with a plain space (comma tried and reverted, cf. journal-de-bord.md). "UI/UX" alone kept
   blending ("usi/utix"): a hyphen forces the break here, same trick as "dé-référenc" below. */
const ACRONYM_PATTERN = /\b[A-Z]{2,}(?:\/[A-Z]{2,})*\b/g;
const ACRONYM_EXCLUDED_WORDS_FR = new Set(["ET", "OU", "NON", "SI", "MAIS", "DONC", "OR", "NI", "CAR"]);
/* Acronyms still wrong with the plain-space default: hyphenated instead (same trick as
   "dé-référenc" below), added here one at a time as Louis flags each one by ear. */
const ACRONYM_OVERRIDES_FR = {
    "UI/UX": "U-I, U-X",
    SQL: "S-Q-L",
    GUI: "G-U-I",
    CLI: "C-L-I",
};
function spellOutSingleAcronym(word) {
    return ACRONYM_EXCLUDED_WORDS_FR.has(word) ? word : word.split("").join(" ");
}
function spellOutAcronymsFr(text) {
    return text.replace(ACRONYM_PATTERN, match =>
        ACRONYM_OVERRIDES_FR[match] ?? match.split("/").map(spellOutSingleAcronym).join(", "));
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
        for (const [pattern, replacement] of WORD_BOUNDARY_RESPELLING_FR) result = result.replace(pattern, replacement);
        result = spellOutAcronymsFr(result);
    }
    const symbols = PROSE_SYMBOL_SPEECH[lang] ?? PROSE_SYMBOL_SPEECH.en;
    for (const [symbol, phrase] of Object.entries(symbols)) {
        result = result.replaceAll(symbol, ` ${phrase} `);
    }
    return result.replace(/\s+/g, " ").trim();
}
