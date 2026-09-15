---
order: 9
---

# Regex

A regex (regular expression) is a pattern used to search for, validate, or replace portions of text in a string.

It can be written in 2 different ways:

```javascript
// literal, the most common
const re1 = /hello/;

// with the RegExp constructor, useful when the pattern is dynamic
const re2 = new RegExp('hello');
```

### Flags

Flags are placed after the last slash and modify the behavior of the regex; several can be combined (`/hello/gi`):

| Flag | Name | Effect |
|---|---|---|
| `g` | *global* | Searches for **all** occurrences in the string, not just the first one |
| `i` | *insensitive* | Ignores case: doesn't distinguish uppercase and lowercase |
| `m` | *multiline* | `^`/`$` match the start/end of **each line**, not just of the whole string |

### Regex prototypes

Prototypes are functions built into the RegExp object by default, letting you perform certain actions with the regex:

| Method | Returns |
|---|---|
| `regex.test(str)` | `true`/`false` depending on whether the string matches the regex |
| `regex.exec(str)` | Details of the first match (or `null`): index 0 = full match, subsequent indices = captured groups |

```javascript
const re = /wor(l)d/;
const str = 'hello world';

re.test(str);  // true
re.exec(str);  // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### String prototypes using regexes

Some prototypes of the string object accept a regex as a parameter to perform more advanced searches or replacements:

| Method | Returns |
|---|---|
| `str.match(regex)` | First match (or `null`); with the `g` flag, all matches but without group details |
| `str.matchAll(regex)` | Iterator over all matches, with their groups; `g` flag **required** |
| `str.search(regex)` | Index of the first match, `-1` if absent |
| `str.replace(regex, x)` | Replaces the first occurrence (or all, with the `g` flag) |
| `str.replaceAll(regex, x)` | Replaces all occurrences; `g` flag **required**, otherwise an error |
| `str.split(regex)` | Splits into an array of substrings, using the regex as a separator |

```javascript
const str = 'hello world';

str.match(/o/g);         // ['o', 'o']
str.search(/world/);     // 6
str.replace(/o/g, '0');  // 'hell0 w0rld'
str.split(/\s/);         // ['hello', 'world']
```

`matchAll` gives access to the details of each match (groups included), whereas `match` with `g` only returns the raw matches:

```javascript
const str2 = "John:25 Mary:30";
const result = [...str2.matchAll(/(\w+):(\d+)/g)];

console.log(result);
/*
[
    ["John:25", "John", "25", index: 0, input: "John:25 Mary:30", groups: undefined],
    ["Mary:30", "Mary", "30", index: 8, input: "John:25 Mary:30", groups: undefined]
]
-> for each match: the full string, then each captured group (\w+ and \d+)
*/
```

### Capture groups

Parentheses in a regex let you capture a specific part of the match. These captured parts can then be retrieved via `exec` or `match`:

```javascript
const re = /(\d{4})-(\d{2})-(\d{2})/;
const date = '2024-06-15';

const result = date.match(re);
result[1];  // '2024' (year)
result[2];  // '06' (month)
result[3];  // '15' (day)
```

Groups can also be named to make them more readable, and accessed by name via the `groups` property:

```javascript
const reNamed = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const resultNamed = reNamed.exec(date);
resultNamed.groups.year; // '2024'
```

> **Pitfall:** a literal regex with the `g` flag, reused several times with `.test()` or `.exec()`, keeps internal state (`lastIndex`) between calls: a second `.test()` on the same regex can return `false` even though the text matches, simply because the search resumes after the position of the previous match. Creating a new regex (or resetting `lastIndex = 0`) avoids this pitfall.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A regex describes a search/validation/replacement pattern in a string. `test()` returns a boolean, `exec()`/`match()`/`matchAll()` give access to the match's details (including captured groups). |
| **Tools you can use** | Flags `g`/`i`/`m`, named groups (`(?<name>...)`), `replace`/`replaceAll`/`split` on a string with a regex. |
| **Pitfalls to avoid** | Reusing a `g` regex with `.test()`/`.exec()` in a loop without accounting for its internal state (`lastIndex`). |
| **Best practices** | Name capture groups as soon as a regex has several, for access that's more readable than by numeric index. |
