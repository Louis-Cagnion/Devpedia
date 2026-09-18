---
order: 4
---

# Strings

A string is a sequence of characters, used to represent text. In JavaScript, it can be written 3 different ways:

```javascript
// single quotes
const str1 = 'Hello world';

// double quotes: strictly equivalent to single quotes
const str2 = "Hello world";

// backticks (template literals): the only ones that allow interpolation and multi-line text
const name = 'John';
const str3 = `Hello ${name}!`;   // 'Hello John!' -> ${...} inserts a variable directly

const str4 = `Line 1
Line 2`;                          // line breaks in the source code are kept as-is
```

### String prototypes

Prototypes are functions built into the string object by default, letting you perform certain actions on the string. A string is **immutable** in JavaScript: none of these methods modify it, each always returns a new value.

| Method | Effect |
|---|---|
| `includes(substring)` | Tests whether a substring is present (`true`/`false`) |
| `length` | Property (not a method): number of characters |
| `slice(start, end)` | Extracts a portion (`end` excluded) |
| `toUpperCase()` / `toLowerCase()` | Copies entirely in uppercase / lowercase |
| `trim()` | Copies without unneeded spaces at the start and end |
| `replace(a, b)` / `replaceAll(a, b)` | Replaces the first occurrence / every occurrence |
| `split(separator)` | Splits into an array of substrings |
| `indexOf(substring)` | Index of the first occurrence, `-1` if absent |
| `startsWith(x)` / `endsWith(x)` | Tests whether the string starts / ends with `x` |
| `repeat(n)` | Repeats the string `n` times |
| `concat(other)` | Joins several strings |

```javascript
const str = 'hello world';

str.includes('hello');       // true
str.slice(0, 5);             // 'hello'
str.toUpperCase();           // 'HELLO WORLD'
str.trim();                  // copy with no extra spaces
str.replace('hello', 'hi');  // 'hi world', a single occurrence
str.replaceAll('o', '0');    // 'hell0 w0rld', every occurrence
str.split(' ');              // ['hello', 'world']
str.startsWith('hello');     // true
str.repeat(2);                // 'hello worldhello world'
```

> **Pitfall:** all these methods return a **new** string, without ever modifying the original. `str.toUpperCase();` alone changes nothing about `str`; you have to reassign it: `str = str.toUpperCase();`.
>
> **Best practice:** always reassign (or directly use) a string method's result, never assume it modified the original variable.

### Regexes

[Regexes](/?c=langages&s=javascript&p=regex) can be used to search for or collect information within strings.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A string is declared with single quotes, double quotes, or backticks (*template literals*, for interpolation and multi-line text). It's immutable: every method returns a new string. |
| **Tools you can use** | `includes`, `slice`, `toUpperCase`/`toLowerCase`, `trim`, `replace`/`replaceAll`, `split`, `indexOf`, `startsWith`/`endsWith`. |
| **Pitfalls to avoid** | Calling a transformation method (`toUpperCase`, `trim`...) without reassigning the result, thinking the original string changed. |
| **Best practices** | Use backticks for any string that interpolates a variable or spans multiple lines, rather than concatenation with `+`. |
