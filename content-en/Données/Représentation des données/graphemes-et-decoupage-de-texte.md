---
order: 9
---

# Graphemes, Code Points and UTF-16 Units: Splitting a Text Without Breaking It (11/10/2026)

How many "characters" does `"👨‍👩‍👧"` contain? A reader sees a single drawing (a family), while [JavaScript](/?c=langages&s=javascript&p=javascript) counts **8**. This gap breaks character counters, truncated texts, reversals and cursors. An **emoji** is a small drawing (a face, a flag, a hand...) that is written like a letter. This chapter explains the three ways to count a text and how to split it without breaking an emoji. It complements [text encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), which explains how a character is stored in memory or on disk: here, we deal with splitting what we see.

It assumes you already know [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [strings](/?c=langages&s=javascript&p=strings) (a **string** is a text, a sequence of characters), [arrays](/?c=langages&s=javascript&p=tableaux) (an ordered list where each value has an **index**, its position, which starts at 0), [loops](/?c=langages&s=javascript&p=boucles) (including `for...of`), [functions](/?c=langages&s=javascript&p=fonctions) (including arrow functions `=>`), [conditions](/?c=langages&s=javascript&p=conditions) and [objects](/?c=langages&s=javascript&p=objets). The examples run with [Node.js](https://nodejs.org), a program that runs [JavaScript](/?c=langages&s=javascript&p=javascript) outside a browser, launched from [a terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), or in the console of a browser (the software that displays web pages). `console.log(x)` displays the value `x`. The results were checked with Node.js 22.22.3 (Unicode 17.0).

## Three ways to count a "character"

The word "character" means three different things depending on who is speaking. A **bit** is 0 or 1 (see [integers and bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)), and a **byte** groups eight of them.

| Level | Term | Definition | Who uses it |
|---|---|---|---|
| What the eye sees | **grapheme** (*grapheme cluster*) | The unit perceived as a single character: a letter with its accents, a complete emoji | The user, the cursor (the blinking caret), input limits |
| What Unicode numbers | **code point** (*code point*) | The `U+XXXX` number of an element of the [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) catalog. A grapheme contains one or more | `for...of`, `codePointAt`, the catalog itself |
| What JavaScript stores | **UTF-16 code unit** (*code unit*) | A block of 16 bits (2 bytes) of the [UTF-16](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) encoding. A code point occupies one or two | `length`, `[i]`, `slice`, `charAt` |
| What the disk stores | **byte** | A group of 8 bits. In [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), a code point occupies from 1 to 4 | Files and data exchanges |

Here is the family `"👨‍👩‍👧"` at the first three levels (the numbers are written in **hexadecimal**, or base 16: the digits 0 to 9 then `a` to `f`, where `a` is 10 and `f` is 15):

```text
grapheme         1 single drawing: 👨‍👩‍👧
                      |
code points      U+1F468    U+200D    U+1F469    U+200D    U+1F467     (5)
                   |          |         |          |         |
UTF-16 units     D83D DC68   200D    D83D DC69    200D    D83D DC67    (8)
```

`U+200D` is the **zero-width joiner** (ZWJ): an invisible character that says "stick what precedes to what follows". The three figures then merge into a single drawing, if the font allows it (see [the honest limits](#the-honest-limits)). Here are the nine examples of the chapter, measured with the tools seen below:

| Text | Code points | `length` (UTF-16 units) | `[...s].length` (code points) | Graphemes | UTF-8 bytes |
|---|---|---|---|---|---|
| `"a"` | `U+0061` | 1 | 1 | 1 | 1 |
| `"é"` in one form (U+00E9) | `U+00E9` | 1 | 1 | 1 | 2 |
| `"é"` in two forms (e + combining accent) | `U+0065` `U+0301` | 2 | 2 | 1 | 3 |
| `"😀"` | `U+1F600` | 2 | 1 | 1 | 4 |
| `"👍🏽"` (emoji + skin tone modifier) | `U+1F44D` `U+1F3FD` | 4 | 2 | 1 | 8 |
| `"👨‍👩‍👧"` (three emojis joined by ZWJs) | `U+1F468` `U+200D` `U+1F469` `U+200D` `U+1F467` | 8 | 5 | 1 | 18 |
| `"🇫🇷"` (two regional indicator letters) | `U+1F1EB` `U+1F1F7` | 4 | 2 | 1 | 8 |
| `"한"` as a composed syllable | `U+D55C` | 1 | 1 | 1 | 3 |
| `"한"` as three jamos | `U+1112` `U+1161` `U+11AB` | 3 | 3 | 1 | 9 |

The **skin tone modifier** `U+1F3FD` changes the skin color of the emoji that precedes it. The **regional indicator letters** are 26 characters from `U+1F1E6` (A) to `U+1F1FF` (Z): two in a row form a flag (F then R gives 🇫🇷). The **jamos** are the letters of the Korean alphabet (consonants and vowels), which combine into syllables: `한` also exists as a single code point. The **combining accent** `U+0301` is added to the letter before it, see [text encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). The two `"é"` look identical, but their numbers are not.

## UTF-16 units: what `length` and `slice` count

JavaScript stores a text in UTF-16. A code point up to `U+FFFF` fits in one unit. Beyond that (most emojis), two are needed, called a **surrogate pair**: a "high" unit followed by a "low" one.

| Unit | Range (hexadecimal) | Role |
|---|---|---|
| Standalone | `0000` to `D7FF` and `E000` to `FFFF` | A code point on its own |
| High | `D800` to `DBFF` | First half of a pair |
| Low | `DC00` to `DFFF` | Second half of a pair |

All these operations work in units: [`length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) (the number of units), `text[i]` and [`charAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) (the unit at index `i`), [`charCodeAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) (its number), [`slice`](/?c=langages&s=javascript&p=strings) (a portion between two indices).

```javascript
const smiley = "😀";
// length counts UTF-16 units: this smiley takes up two of them
console.log(smiley.length);   // -> 2
// charCodeAt(i) returns the number of the unit at index i
console.log(smiley.charCodeAt(0));   // -> 55357
console.log(smiley.charCodeAt(1));   // -> 56832
// toString(16) writes this number in hexadecimal: a high half (d83d) then a low half (de00)
console.log(smiley.charCodeAt(0).toString(16));   // -> d83d
console.log(smiley.charCodeAt(1).toString(16));   // -> de00
// charAt(0) and smiley[0] are the same unit, one half of a pair
console.log(smiley.charAt(0) === smiley[0]);   // -> true
// isWellFormed() tests for the absence of an isolated half of a pair
console.log(smiley.charAt(0).isWellFormed());   // -> false
```

[`toString(16)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) writes a number in base 16, and [`isWellFormed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) is `false` if the text contains a half of a pair without the other. Cutting a text between these two halves produces exactly this case:

```javascript
const hello = "Salut 😀";
// slice(0, 7) keeps the units at indices 0 to 6: "Salut" and the high half of the smiley
const cut = hello.slice(0, 7);
console.log(cut);   // -> Salut �
console.log(cut.length);   // -> 7
console.log(cut.isWellFormed());   // -> false
// TextEncoder converts a text to UTF-8 bytes
// 6 bytes for "Salut" and the space, 3 for the half pair, replaced by U+FFFD
console.log(new TextEncoder().encode(cut).length);   // -> 9
// encodeURIComponent prepares a text for a web address (URL) and refuses the half pair
try {
    encodeURIComponent(cut);
} catch (error) {
    console.log(error.name);   // -> URIError
}
```

The cut text is no longer valid text. Depending on the tool, the isolated half is **silently replaced** by the replacement character `U+FFFD` (�, 3 bytes in UTF-8: `EF BF BD`, hence the 9 bytes, see [mojibake](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) or **refused with an error** (`URIError`). In the block, `try` runs code and `catch` catches the error if it throws one (see [error handling](/?c=langages&s=javascript&p=gestion-des-erreurs)). [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) and [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) are standard JavaScript tools; URLs are explained in [the chapter on HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

## Code points: one step finer

To go through a text code point by code point, JavaScript offers:

| Tool | What it does | On `"a😀é"` |
|---|---|---|
| [`codePointAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt) | The code point that starts at index `i` (in units) | `codePointAt(1)` gives `128512` |
| [`String.fromCodePoint(n)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) | The text of a code point | `fromCodePoint(0x1F600)` gives `"😀"` |
| `for (const c of text)` | A loop that yields one code point at a time | 3 iterations |
| `[...text]` | The `...` operator (*spread*, [seen with arrays](/?c=langages&s=javascript&p=tableaux)) unrolls the text into an array of code points | 3 elements |
| [`Array.from(text)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) | Same result, accepts a transform function as second argument | 3 elements |
| `text.split("")` | Cuts into units (to avoid) | 4 elements |

A string is an **iterable**: a value that `for...of` or `...` goes through element by element, thanks to an **iterator**, the object that yields these elements one by one. A string's iterator yields code points, not units.

```javascript
const mix = "a😀é";
// length counts the units: a (1) + smiley (2) + é (1)
console.log(mix.length);   // -> 4
// codePointAt(1) reads the code point that starts at index 1: the whole smiley
console.log(mix.codePointAt(1));   // -> 128512
console.log(mix.codePointAt(1).toString(16));   // -> 1f600
// index 2 falls in the middle of the pair: we only read the low half
console.log(mix.codePointAt(2));   // -> 56832
// 0x1F600 is a number written in hexadecimal in the code
console.log(String.fromCodePoint(0x1F600));   // -> 😀
// the spread and Array.from count code points
console.log([...mix]);   // -> [ 'a', '😀', 'é' ]
console.log(Array.from(mix).length);   // -> 3
// split("") cuts into units: the pair of the smiley is broken
console.log(mix.split(""));   // -> [ 'a', '\ud83d', '\ude00', 'é' ]
```

```javascript
// for...of yields one code point per turn, with its length in units
for (const element of mix) {
    console.log(element, element.length);
}
```

```text
a 1
😀 2
é 1
```

Code points are not enough, however: `"👍🏽"` counts 2 and `"👨‍👩‍👧"` counts 5, even though they display as a single drawing. Cutting between two code points separates an emoji from its modifier or its ZWJ (example further below).

## Graphemes with `Intl.Segmenter`

[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) is the set of standard JavaScript functions that depend on the language (dates, numbers, sorting of texts...), at the heart of [internationalization](/?c=ui-ux&p=internationalisation-i18n-et-rtl). Its tool [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) splits a text according to the rules of Unicode ([UAX #29](https://unicode.org/reports/tr29/), annex no. 29 of the standard, devoted to splitting text). It has been available in recent browsers since April 2024 ("Baseline 2024" according to [MDN](https://developer.mozilla.org/), the reference documentation of the web) and in Node.js 22.

| Element | Role |
|---|---|
| `new Intl.Segmenter(language, options)` | Creates a segmenter (`new` creates an object from a template, see [classes](/?c=langages&s=javascript&p=poo)). `language` is a code such as `"fr"`; `options` is an [object](/?c=langages&s=javascript&p=objets) |
| `{ granularity: "grapheme" }` | Splits into graphemes (default value) |
| `{ granularity: "word" }` / `{ granularity: "sentence" }` | Splits into words / sentences: mostly useful for languages written without spaces (Japanese, Chinese, Thai); for words, `isWordLike` tells a word apart from punctuation |
| `segmenter.segment(text)` | Returns an iterable of pieces |
| A piece | An object `{ segment, index, input }`: the text of the piece, its starting index (in UTF-16 units), the whole text |
| `.containing(index)` | The piece that contains this index, `undefined` (the value that means "nothing") if the index is outside the text |

The following block defines the segmenter and three functions reused by all the blocks in the rest of the chapter. Each function has a description comment: `@param` gives the form of the argument, `@returns` that of the result (`string[]` means "array of strings").

```javascript
// A single segmenter, created once and reused: language "fr", one piece per grapheme
const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });

/**
 * @brief Splits a text into graphemes.
 *
 * @param {string} text
 *
 * @returns {string[]} one element per grapheme
 */
function graphemes(text) {
    // Array.from(iterable, function) applies the function to each piece
    return Array.from(segmenter.segment(text), (piece) => piece.segment);
}

/**
 * @brief Counts the graphemes of a text.
 *
 * @param {string} text
 *
 * @returns {number}
 */
function countGraphemes(text) {
    return Array.from(segmenter.segment(text)).length;
}

/**
 * @brief Measures a text in UTF-16 units, code points, graphemes and UTF-8 bytes.
 *
 * @param {string} text
 *
 * @returns {{units: number, codePoints: number, graphemes: number, bytes: number}}
 */
function measure(text) {
    return {
        units: text.length,
        codePoints: [...text].length,
        graphemes: countGraphemes(text),
        bytes: new TextEncoder().encode(text).length,
    };
}

const example = "Hé👍🏽🇫🇷";
// each grapheme is an element: the skin tone and the flag are not split
console.log(graphemes(example));   // -> [ 'H', 'é', '👍🏽', '🇫🇷' ]
// a complete piece, with its starting index (H = 1 unit, é = 1 unit)
const segments = Array.from(segmenter.segment(example));
console.log(segments[2]);   // -> { segment: '👍🏽', index: 2, input: 'Hé👍🏽🇫🇷' }
console.log(measure("a"));   // -> { units: 1, codePoints: 1, graphemes: 1, bytes: 1 }
console.log(measure("😀"));   // -> { units: 2, codePoints: 1, graphemes: 1, bytes: 4 }
const family = "👨‍👩‍👧";
console.log(measure(family));   // -> { units: 8, codePoints: 5, graphemes: 1, bytes: 18 }
console.log(measure("🇫🇷"));   // -> { units: 4, codePoints: 2, graphemes: 1, bytes: 8 }
```

## Truncating to N graphemes

Truncating "to 20 characters" is the most common use. The following function cuts on a grapheme boundary, so never in the middle of an emoji or an accented letter:

```javascript
/**
 * @brief Truncates a text to max graphemes and adds "…" if it was cut.
 *
 * @param {string} text
 * @param {number} max integer greater than or equal to 0
 *
 * @returns {string}
 */
function truncate(text, max) {
    const pieces = graphemes(text);
    if (pieces.length <= max) {
        return text;
    }
    return pieces.slice(0, max).join("") + "…";
}

const announcement = "Bravo 👨‍👩‍👧 et 🇫🇷 !";
console.log(announcement.length);   // -> 24
console.log([...announcement].length);   // -> 19
console.log(countGraphemes(announcement));   // -> 14
// at 7 units, the man's pair is cut in two
console.log(announcement.slice(0, 7));   // -> Bravo �
// at 7 code points, the man stays but the family is broken
console.log([...announcement].slice(0, 7).join(""));   // -> Bravo 👨
// at 7 graphemes, the family is intact
console.log(truncate(announcement, 7));   // -> Bravo 👨‍👩‍👧…
console.log(truncate(announcement, 8));   // -> Bravo 👨‍👩‍👧 …
// a text short enough is returned as it is
console.log(truncate(announcement, 14) === announcement);   // -> true
```

| Method (limit 7) | Result | Problem |
|---|---|---|
| `announcement.slice(0, 7)` | `"Bravo �"` | Isolated half of a pair |
| `[...announcement].slice(0, 7).join("")` | `"Bravo 👨"` | Family reduced to one man (with 8, a stray ZWJ remains) |
| `truncate(announcement, 7)` | `"Bravo 👨‍👩‍👧…"` | None |

`truncate` adds "…" after `max` graphemes: the rendered text can therefore count `max + 1`.

## Normalization: two "é" that are not equal

The "é" exists in two spellings: the single code point `U+00E9`, or `e` followed by the combining accent `U+0301`. They look the same on screen, but the text is not the same. **Normalization** converts a text to a canonical form, so that two equivalent spellings become identical. In code, `\u00E9` writes the code point `U+00E9` (four hexadecimal digits) and `\u{1F600}` those that exceed `U+FFFF`.

| Form | Effect | When to use it |
|---|---|---|
| `"NFC"` | Recomposes: a single code point when possible | Comparing and storing (the most common form) |
| `"NFD"` | Decomposes: base letter + combining accents | Separating the accents from a letter |
| `"NFKC"` / `"NFKD"` | Like the previous ones, and they also unify presentation variants (the ligature `ﬁ`, two letters drawn as one sign, becomes `fi`) | Tolerant search |

[`normalize(form)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) applies these forms, which [text encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) details; the standard is [UAX #15](https://unicode.org/reports/tr15/).

```javascript
// \u00E9: the code point U+00E9; e\u0301: e followed by the combining acute accent U+0301
const uniqueE = "\u00E9";
const combinedE = "e\u0301";
console.log(uniqueE, combinedE);   // -> é é
// === compares the two texts unit by unit: they differ
console.log(uniqueE === combinedE);   // -> false
console.log(uniqueE.length, combinedE.length);   // -> 1 2
// for the eye and for Intl.Segmenter, it is a single grapheme in both cases
console.log(countGraphemes(uniqueE), countGraphemes(combinedE));   // -> 1 1
// after normalization to the same form, the two texts are equal
console.log(combinedE.normalize("NFC") === uniqueE);   // -> true
console.log(uniqueE.normalize("NFD") === combinedE);   // -> true
```

To compare two texts typed by humans, normalize both in the same form before `===`:

```javascript
/**
 * @brief Tells whether two texts are spelled the same way, whatever their composition.
 *
 * @param {string} textA
 * @param {string} textB
 *
 * @returns {boolean}
 */
function sameText(textA, textB) {
    return textA.normalize("NFC") === textB.normalize("NFC");
}

console.log(sameText(uniqueE, combinedE));   // -> true
// Korean jamos recompose into a syllable with NFC
console.log("\u1112\u1161\u11AB".normalize("NFC") === "\uD55C");   // -> true
// NFC does not always give a single code point: q + tilde (˜) has no composed form
console.log("q\u0303".normalize("NFC").length);   // -> 2
// NFC keeps the ligature ﬁ, NFKC replaces it with fi
console.log("\uFB01".normalize("NFKC"));   // -> fi
// localeCompare compares according to the language and judges these two texts equivalent (0)
console.log(uniqueE.localeCompare(combinedE));   // -> 0
```

[`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) compares two texts according to the rules of a language (useful for sorting), and returns a negative or positive number depending on the order, or 0 if they are equivalent. Normalization is also used to remove accents:

```javascript
// NFD separates the accents, \p{M} designates the "marks" (combining accents)
const phrase = "Éléphant à l'été";
console.log(phrase.normalize("NFD").replace(/\p{M}/gu, ""));   // -> Elephant a l'ete
```

`replace` and [regexes](/?c=langages&s=javascript&p=regex) (including the `g` flag, "everywhere", and the `u` flag, which enables Unicode mode) are covered in their own chapters; [`\p{M}`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) is a Unicode character class. Normalization does not merge emoji sequences: `"👍🏽"` remains two code points.

## Practical cases: the bad code, the good code

| Need | Bad code | Problem | Good code |
|---|---|---|---|
| Input limit | `text.length <= 10` | Counts units: a family weighs 8 | `countGraphemes(text) <= 10` |
| Reverse | `text.split("").reverse().join("")` | Broken pairs, accents in front of their letter | `graphemes(text).reverse().join("")` |
| Initial capital | `text[0].toUpperCase() + text.slice(1)` | Fails if the first letter spans two units | Capitalize the first grapheme |
| Backspace | `text.slice(0, -1)` | Leaves half an emoji | Remove the last grapheme |
| Cursor | `position + 1` | The cursor falls in the middle of a grapheme | Advance to the end of the grapheme |

### Limiting the length of a field

The [HTML](/?c=langages&s=html&p=html) `maxlength` attribute of a [form](/?c=langages&s=html&p=formulaires) field measures in UTF-16 units ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength)): three families in a row weigh 24 units. The UAX #29 specification states that a grapheme limit is a "perceived" limit, not a data size: it advises combining it with a byte limit (for example 300 graphemes and 3000 UTF-8 bytes) to bound storage.

```javascript
const message = "Salut 👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧";
const LIMIT = 10;
console.log(message.length);   // -> 30
console.log(countGraphemes(message));   // -> 9
// the unit limit wrongly rejects this message
console.log(message.length <= LIMIT);   // -> false
console.log(countGraphemes(message) <= LIMIT);   // -> true

/**
 * @brief Checks both limits: graphemes (perceived) and UTF-8 bytes (storage).
 *
 * @param {string} text
 * @param {number} maxGraphemes
 * @param {number} maxBytes
 *
 * @returns {boolean}
 */
function respectsLimits(text, maxGraphemes, maxBytes) {
    const bytes = new TextEncoder().encode(text).length;
    return countGraphemes(text) <= maxGraphemes && bytes <= maxBytes;
}

console.log(respectsLimits(message, 10, 100));   // -> true
console.log(respectsLimits(message, 10, 40));   // -> false
```

The message weighs 6 bytes for "Salut" and the space, plus 3 times 18 for the families, i.e. 60 bytes: the second limit (40) rejects it.

### Reversing a string

```javascript
const word = "Noe\u0301 🇫🇷👍🏽";
// split("") + reverse: the halves of pairs rejoin in any order
console.log(word.split("").reverse().join(""));   // -> �🁍🗷🇫� ́eoN
// [...word] + reverse: the modifier goes before the emoji, the flag becomes 🇷🇫
console.log([...word].reverse().join(""));   // -> 🏽👍🇷🇫 ́eoN
// graphemes + reverse: each grapheme keeps its integrity
console.log(graphemes(word).reverse().join(""));   // -> 👍🏽🇫🇷 éoN
```

`reverse()` reverses the order of an array in place and `join("")` glues its elements back together (see [arrays](/?c=langages&s=javascript&p=tableaux)). Reversing a text also has a limit: in Arabic or Hebrew, which are written from right to left, the display order is not the storage order (see [internationalization](/?c=ui-ux&p=internationalisation-i18n-et-rtl)).

### Capitalizing the first letter

Combining accents come after the letter, so `text[0]` is often enough. The defect appears for a letter outside `U+FFFF` (such as `U+10428`, a lowercase letter of the Deseret alphabet), whose `text[0]` is only one half of a pair that `toUpperCase` leaves untouched. [`toLocaleUpperCase(language)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) also takes the language into account (in Turkish, `i` gives `İ`, with a dot).

```javascript
/**
 * @brief Capitalizes the first letter, taking the whole first grapheme.
 *
 * @param {string} text
 * @param {string} language language code, for example "fr"
 *
 * @returns {string}
 */
function initialCapital(text, language) {
    if (text === "") {
        return text;
    }
    const first = graphemes(text)[0];
    return first.toLocaleUpperCase(language) + text.slice(first.length);
}

/**
 * @brief Naive version: uppercases the first unit only.
 *
 * @param {string} text
 *
 * @returns {string}
 */
function naiveInitialCapital(text) {
    return text[0].toUpperCase() + text.slice(1);
}

const deseret = "\u{10428}x";
// the naive version leaves U+10428 unchanged
console.log(naiveInitialCapital(deseret).codePointAt(0).toString(16));   // -> 10428
// the grapheme version obtains the capital U+10400
console.log(initialCapital(deseret, "fr").codePointAt(0).toString(16));   // -> 10400
// "tr" stands for Turkish: the i becomes an İ with a dot
console.log(initialCapital("ilyes", "tr"));   // -> İlyes
console.log(initialCapital("ilyes", "fr"));   // -> Ilyes
```

The length can also change: `"ß".toUpperCase()` gives `"SS"`, two letters.

### Backspace and cursor

A standard input field manages its cursor on its own; these functions are used when you manage the text and the position yourself (a home-made editor). The **cursor position** is an index in units, placed between two units.

```javascript
const answer = "Oui 👍🏽";
// slice(0, -1) removes the last unit: a piece of the skin tone modifier remains
console.log(answer.slice(0, -1).isWellFormed());   // -> false

/**
 * @brief Removes the last grapheme (the "backspace" key).
 *
 * @param {string} text
 *
 * @returns {string}
 */
function removeLast(text) {
    const pieces = graphemes(text);
    pieces.pop();
    return pieces.join("");
}

// "Oui" and its space remain: the thumb and its skin tone leave together
console.log(removeLast(answer) === "Oui ");   // -> true

/**
 * @brief Returns the position after the grapheme that contains position.
 *
 * @param {string} text
 * @param {number} position index in units, from 0 to text.length
 *
 * @returns {number}
 */
function advanceCursor(text, position) {
    const piece = segmenter.segment(text).containing(position);
    if (piece === undefined) {
        return position;
    }
    return piece.index + piece.segment.length;
}

/**
 * @brief Returns the start position of the grapheme that precedes position.
 *
 * @param {string} text
 * @param {number} position index in units, from 0 to text.length
 *
 * @returns {number}
 */
function retreatCursor(text, position) {
    if (position <= 0) {
        return 0;
    }
    return segmenter.segment(text).containing(position - 1).index;
}

const line = "a👍🏽b";
console.log(line.length);   // -> 6
// from 1 (before the thumb), the cursor jumps to 5 (after the 4 units of the thumb)
console.log(advanceCursor(line, 1));   // -> 5
console.log(advanceCursor(line, 6));   // -> 6
console.log(retreatCursor(line, 5));   // -> 1
console.log(retreatCursor(line, 0));   // -> 0
```

`pop()` removes the last element of an array.

## The honest limits

Counting graphemes is the best approximation of the "perceived character" that we know how to compute, not a truth.

| Limit | Detail |
|---|---|
| The definition evolves | Each version of Unicode can change the rules. In UAX #29, rule GB9c (the consonant groups of Indic scripts) is absent from the revision for [Unicode 15.0](https://www.unicode.org/reports/tr29/tr29-41.html) (2022), present and modified in the one for [Unicode 15.1](https://www.unicode.org/reports/tr29/tr29-43.html) (2023), then modified again for [Unicode 18.0](https://www.unicode.org/reports/tr29/tr29-49.html) (2026) |
| The result depends on the environment | Node.js 22.22.3 embeds Unicode 17.0 (value read in `process.versions.unicode`). A browser or another version of Node.js may count differently. Example below |
| A width is not a number of graphemes | In a fixed-width font (like that of a terminal), each Latin letter occupies the same width, but ideographs and many emojis are classified "wide" (East Asian Width property, [UAX #11](https://unicode.org/reports/tr11/)) and generally take up double. Aligning columns requires the displayed width, not the number of graphemes |
| The font decides the drawing | A **font** is the file that contains the drawing (**glyph**) of each character. If it lacks the one for a sequence, the system may display the separate components (👨 👩 👧 instead of 👨‍👩‍👧). The segmenter does not look at the font: the number of graphemes does not change |
| Language and context matter | UAX #29 specifies that a perceived character may vary according to language, writing style or context, and that the algorithm is an approximation without language metadata |
| A grapheme has no maximum size | There is no limit to the size of a grapheme: a grapheme limit bounds neither units nor bytes |

```javascript
const conjunct = "\u0915\u094D\u0937";
// three code points (क, a virama and ष) form a single grapheme here
console.log(conjunct.length, [...conjunct].length);   // -> 3 3
console.log(countGraphemes(conjunct));   // -> 1
```

This group of consonants from the Devanagari script (used for Hindi) is written with three code points: the consonant क, a **virama** (a sign that removes the vowel of the consonant before it), then the consonant ष. They form a single grapheme with Unicode 17.0, thanks to rule GB9c, which is absent from the revision for Unicode 15.0. Another tool, or an older version, may therefore count differently.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Believing that `length` counts characters | It counts UTF-16 units: `"😀".length` is 2 and `"👨‍👩‍👧".length` is 8 |
| `slice`, `split("")`, `charAt` in the middle of a text | They cut between two units: isolated half of a pair, � or an error (`URIError`) further on |
| Cutting at code points (`[...text].slice`) | Separates an emoji from its modifier, its ZWJ or the second letter of a flag |
| Comparing two texts with `===` without normalizing | Two "é" identical on screen may be different |
| Reversing with `split("").reverse()` | Breaks pairs, places accents in front of their letter |
| Using `maxlength` as a character limit | It counts in UTF-16 units |
| Calling `new Intl.Segmenter` without checking it | Absent from old environments: the call throws an error |
| Believing that a number of graphemes bounds the size | A grapheme can weigh many bytes (18 for the family) and its size is not bounded |

## Best practices

| Best practice | Why |
|---|---|
| Count and cut with `Intl.Segmenter` when the result is shown to the user | The grapheme is the unit they perceive |
| Use `length` for an internal size calculation (index in `slice`, memory) | It is JavaScript's real unit, read without any splitting |
| Create the segmenter once and reuse it | No need to rebuild it on each call |
| Combine a grapheme limit and a byte limit | Bounds both display and storage |
| Normalize to NFC before comparing or storing | Two spellings of the same text become equal |
| Check `typeof Intl.Segmenter === "function"` if the target is old (`typeof x` gives the type of `x` as text) | Avoids an error in an environment without this tool |
| Call `isWellFormed()` on a text received from outside | Detects a half pair before it breaks a process |
| Test with emojis, combining accents, a flag and Korean | Simple cases hide almost all the defects |

## Key Takeaways

| | |
|---|---|
| **To remember** | A "character" is counted at three levels: the grapheme (what the eye sees), the code point (what Unicode numbers), the UTF-16 unit (what `length` and `slice` count). `"👨‍👩‍👧"` is 1 grapheme, 5 code points, 8 units and 18 UTF-8 bytes. `Intl.Segmenter` splits into graphemes, `normalize("NFC")` makes two spellings of the same text comparable. The result depends on the Unicode version, and the displayed width is not the number of graphemes. |
| **Pitfalls to avoid** | `length`, `slice` and `split("")` in the middle of a text; cutting at code points; comparing without normalizing; reversing with `split("").reverse()`; `maxlength` taken for a character count; `Intl.Segmenter` unchecked; confusing a grapheme limit with a byte limit. |
| **Best practices** | Count and cut in graphemes for what the user sees, in units for internal calculations; create a single segmenter; normalize to NFC before comparing; double the grapheme limit with a byte limit; test with emojis, combining accents, flags and Korean. |
