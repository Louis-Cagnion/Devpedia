# The regex

## What is a regex?

A **regex** (regular* *expression) is a mini-language that describes a pattern of characters. This pattern is used to search for, validate, or extract portions of text that match a given structure.

It's not a programming language: no variables, no loops, no functions. A regex needs to be interpreted by a **regex engine**—which is built into the language you're using (JavaScript, Python, etc.)—using methods such as `.test()` or `.match()`.

## The Basics of Syntax

### Literal characters

A regular character in a regex matches exactly itself:

```regex
chat
```

This regex matches the character sequence "`chat`" anywhere in the text.

### Character classes

| Symbol | Meaning                          |
|---------|-----------------------------------------|
| `.`     | Any character (except a line break) |
| `\d`    | A digit (0–9)                        |
| `\D`    | Anything but a number                    |
| `\w`    | A letter, a number, or `_`            |
| `\W`    | Anything but a letter/number/ `_`         |
| `\s`    | A space (space, tab, line break) |
| `\S`    | Anything but a space                     |
| `[abc]` | Any one of the following`a`, `b`, or `c`  |
| `[^abc]`| A single character that is neither `a`, `b`, nor `c` |
| `[a-z]` | Just one character between `a` and `z`       |

### Quantifiers

| Symbol  | Meaning                         |
|----------|----------------------------------------|
| `*`      | 0 or more times                    |
| `+`      | 1 or more times                    |
| `?`      | 0 or 1 time (makes it optional)           |
| `{n}`    | Exactly n times                      |
| `{n,}`   | at least n times, with no upper limit           |
| `{n,m}`  | Between n and m times                      |

### Anchors

| Symbol | Meaning                  |
|---------|----------------------------------|
| `^`     | Start of line/string        |
| `$`     | End of line/string          |

### The Groups

```regex
(abc)
```

A capturing group: it isolates a portion of the pattern so that the matched content can **be** **retrieved** (`match[1]`, `match[2]`...), and allows a quantifier to be applied to multiple characters at once.

```regex
(?:abc)
```

A non-scoring group: groups teams together without creating a recoverable entry in the match result.

### Assertions (lookahead / lookbehind)

They check what characters are around a position **without consuming** those characters in the match.

| Symbol    | Meaning                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Must be followed by `abc`                    |
| `(?!abc)`  | Must not be followed by `abc`              |
| `(?<=abc)` | Must be preceded by `abc`                  |
| `(?<!abc)` | Must not be preceded by `abc`            |

## Flags (global options)

In JavaScript, flags are placed after the last `/` in the regex:

```javascript
/motif/flags
```

| Flag | Effect                                       |
|------|----------------------------------------------|
| `g`  | **Global** search (all occurrences, not just the first one) |
| `i`  | Case-insensitive |
| `m`  | Multi-line mode (`^` and `$` apply to each line) |

## A complete example, built step by step

Objective: Identify a line that contains **only** a Markdown link, such as `[texte](url)`.

### Step 1 — Literal Brackets

In regex, `[`, and `]` are **special** characters (they are used to define a character class, such as `[abc]` as seen above). To match a **literal** square bracket (the actual `[` character in the text), you must escape it with a backslash:

```regex
\[
```

```regex
\]
```

`\[` matches the character `[`, and `\]` matches the character `]` — nothing else.

### Step 2 — the text inside the square brackets

Between the two square brackets, we want to allow **any character except** a closing square bracket (otherwise**,** the regex might stop too early or match multiple links at once). We use a **negative** character class:

```regex
[^\]]
```

- The "`[ ]`" here refer to the actual character class syntax (not literal, unlike in Step 1).
- `^` In the first position **within** a class, "anything but" is implied—so "`[^\]]`" means "any character except `]`."
- Add `*` to repeat this "0 or more times" (text of any length, or even empty):

```regex
[^\]]*
```

We also want **to retrieve** this text later (to see what's inside the square brackets) → so we wrap it in a capture group using `( )`:

```regex
([^\]]*)
```

### Step 3 — Assemble the hooks and the assembly

```regex
\[([^\]]*)\]
```

This results in: a literal "`[`," followed by the captured text, followed by a literal "`]`." It matches, for example, `[texte]`, `[]` (empty text), `[mon super lien]`...

### Step 4 — The same logic applies to parentheses

Same principle, but for `(url)`:

- `\(` and `\)` → escaped literal parentheses (which are also special in regex and are normally used for groups).
- Inside, we want the content of the URL: any character except a space (`\s`) and except a closing parenthesis (`)`)—otherwise, the regex might accidentally include text after the link.

```regex
[^\s)]+
```

Here, we use `+` (at least once) rather than `*`, because an empty URL doesn't make sense.

We also capture this group:

```regex
\(([^\s)]+)\)
```

### Step 5 — Insist that it be the entire line

For now, the regex could match a link **in the middle** of a longer sentence. If you want it to match only when **the entire line** is exactly that link (nothing before, nothing after), add the anchors shown above:

```regex
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → The line must start exactly here
- `$` → The line must end exactly here

### Final Result

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Track Listing:

- `^` → Line break required
- `\[` → a literal "`[`"
- `([^\]]*)` → Group 1: the link text (anything except `]`)
- `\]` → a literal "`]`"
- `\(` → a literal "`(`"
- `([^\s)]+)` → Group 2: the URL (anything except spaces and `)`)
- `\)` → a literal "`)`"
- `$` → Line break required

With `"[mon lien](https://exemple.com)".match(regex)`, you get `match[1] = "mon lien"` and `match[2] = "https://exemple.com"`.

## Further Reading

- [MDN — Regular Expressions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com) — interactive regex tester with real-time explanations
