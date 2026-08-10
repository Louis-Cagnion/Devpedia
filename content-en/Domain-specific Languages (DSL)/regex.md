# Regular expressions

## What is a regex?

A **regex** (regular* *expression) is a mini-language that describes a pattern of characters. This pattern is used to search for, validate, or extract portions of text that match a given structure.


It is not a programming language: no variables, no loops, no functions. A regex needs to be interpreted by a **regex engine**, which is built into the language you’re using (JavaScript, Python, etc.), via methods such as `.test()` or `.match()`.


## The Basics of Syntax

### Literal characters

A regular character in a regex matches exactly itself:


```text
chat
```

This regex matches the character sequence "`chat`" anywhere in the text.


### Character classes

| Symbol | Meaning                          |

|---------|-----------------------------------------|

| `.`     | Any character (except line break) |

| `\d`    | A digit (0–9)                        |

| `\D`    | Anything but a number                    |

| `\w`    | A letter, a number, or `_`            |

| `\W`    | Anything except a letter, number, or `_`         |

| `\s`    | A whitespace character (space, tab, line break) |

| `\S`    | Anything but a space                     |

| `[abc]` | Any one of the following characters`a``b`, or `c`  |

| `[^abc]`| A single character that is neither `a`, `b`, nor `c` |

| `[a-z]` | Just one character difference between `a` and `z`       |


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


### Groups

```text
(abc)
```

A capturing group: it isolates a portion of the pattern so that the matched content can **be** **retrieved** (`match[1]`, `match[2]`...), and allows a quantifier to be applied to multiple characters at once.


```text
(?:abc)
```

A non-scoring group: groups teams together without creating a recoverable entry in the match result.


### Assertions (lookahead / lookbehind)

They check what characters are surrounding a given position **without consuming** those characters in the match.


| Symbol    | Meaning                              |

|------------|----------------------------------------------|

| `(?=abc)`  | Must be followed by `abc`                    |

| `(?!abc)`  | Must not be followed by `abc`              |

| `(?<=abc)` | Must be preceded by `abc`                  |

| `(?<!abc)` | Must not be preceded by `abc`            |


## Flags (global options)

Flags are placed after the last `/` in a JavaScript regex:


```javascript
/motif/flags
```

| Flag | Effect                                       |

|------|----------------------------------------------|

| `g`  | **Global** search (all occurrences, not just the first one) |

| `i`  | Case-insensitive (upper/lowercase) |

| `m`  | Multiline mode (`^` and `$` apply to each line) |


## A complete example, built step by step

Objective: Identify a line that contains **only** a Markdown link, such as `[text](url)`.


### Step 1 — Literal Brackets

In regex, `[` and `]` are **special** characters (they are used to define a character class, such as `[abc]` as seen above). To match a **literal** bracket (the actual `[` character in the text), you must escape it with a backslash:


```text
\[
```

```text
\]
```

`\[` matches the character `[`, and `\]` matches the character `]` — nothing else.


### Step 2 — the text inside the square brackets

Between the two square brackets, we want to allow **any character except** a closing square bracket (otherwise**,** the regex might stop too early or match multiple links at once). We use a **negative** character class:


```text
[^\]]
```

- The "`[ ]`" here refer to the actual character class syntax (not literal, unlike in Step 1).
- `^` When used first **within** a class, it means "anything except"—so `[^\]]` means "any character except `]`".
- Add `*` to repeat this "zero or more times" (text of any length, or even empty):

```text
[^\]]*
```

We also want **to retrieve** this text later (to find out what's inside the square brackets) → so we wrap it in a capture group using `( )`:


```text
([^\]]*)
```

### Step 3 — Assemble the brackets and the assembly

```text
\[([^\]]*)\]
```

This results in: a literal `[`, followed by the captured text, followed by a literal `]`. It matches, for example, `[text]`, `[]` (empty text), `[mon super lien]`...


### Step 4 — the same logic for parentheses

Same concept, but for `(url)`:


- `\(` and `\)` → escaped literal parentheses (which are also special in regex and are normally used for groups).
- We want the content of the URL: any character except a space (`\s`) and except a closing parenthesis (`)`)—otherwise, the regex might accidentally include text after the link.

```text
[^\s)]+
```

Here, we use `+` (at least once) rather than `*`, because an empty URL doesn't make sense.


This group is also included:


```text
\(([^\s)]+)\)
```

### Step 5 — require that it be the entire line

Right now, the regex could match a link **in the middle** of a longer sentence. If you want it to match only when **the entire line** is exactly that link (nothing before, nothing after), add the anchors shown above:


```text
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → The line must start exactly here
- `$` → The line must end exactly here

### Final result

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Summary of sections:


- `^` → Line break required
- `\[` → a literal "`[`"
- `([^\]]*)` → Group 1: the link text (anything except `]`)
- `\]` → a literal "`]`"
- `\(` → a literal "`(`"
- `([^\s)]+)` → Group 2: the URL (anything except spaces and `)`)
- `\)` → a literal "`)`"
- `$` → Line break required

With `"[mon lien](https://exemple.com)".match(regex)`, you get `match[1] = "mon lien"` and `match[2] = "https://exemple.com"`.


> **Pitfall:** A regex that’s too permissive (for example, forgetting to anchor it with `^` / `$`) can match much more than intended—an email validation pattern without anchoring would accept “anything containing an @” in the middle of a longer string, not just a complete email address.
>
> **Best practice:** Test a regex on deliberately tricky edge cases (empty strings, special characters, text longer than expected) before using it in production—a tool like regex101.com lets you do this interactively.

## Learn More

- [MDN (*Mozilla Developer Network*, the web's reference documentation) — Regular Expressions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com) — interactive regex tester with real-time explanations

---


## 📋 Summary

| | |

|---|---|

| **Key Takeaway** | A regex describes a character pattern used to search for, validate, or extract text—it is interpreted by a regex engine built into the host language, not a standalone programming language. |

| **Available tools** | Character classes (`\d`, `\w`, `\s`), quantifiers (`*`, `+`, `?`, `{n,m}`), capture groups, flags (`g`, `i`, `m`). |

| **Pitfalls to Avoid** | Forgetting to anchor a `^` ( / `$`), which must match the entire string, not just a portion of it. |

| **Best Practices** | Build a complex regex step by step, testing each addition; verify its behavior in edge cases before using it in production. |
