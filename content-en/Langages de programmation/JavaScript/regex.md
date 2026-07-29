---
order: 8
---

# Regular Expressions

A regex (regular expression) is a pattern used to search for, validate, or replace portions of text in a string.

It can be written in two different ways:
```javascript
    // literal, the most common
    const re1 = /hello/;

    // using the RegExp constructor, which is useful when the pattern is dynamic
    const re2 = new RegExp('hello');
```

### Flags

Flags are placed after the last slash and modify the behavior of the regex.

**`g`** (global) searches for all occurrences in the string, not just the first one.
```javascript
    const re1 = /hello/g;
```

**`i`** (case-insensitive) ignores case, so it does not distinguish between uppercase and lowercase letters.
```javascript
    const re2 = /hello/i;
```

**`m`** (multiline) enables multiline mode, which changes the behavior of `^` and `$`: they now correspond to the beginning and end of each line, rather than just the beginning and end of the entire string.
```javascript
    const re3 = /hello/m;
```

You can combine multiple flags.
```javascript
    const re4 = /hello/gi;
```

### Regex Prototypes

Prototypes are functions built into the RegExp object by default, allowing you to perform certain actions with the regex.

```javascript
    const re = /wor(l)d/;
    const str = 'hello world';
```

**`test`** Checks whether the string matches the regex, and simply returns `true` or `false`.
```javascript
    re.test(str); // true
```

**`exec`** Returns an array containing the details of the first match found, or `null` if no match is found. In this array, index 0 contains the complete match, and the subsequent indices contain the captured groups (enclosed in parentheses in the regex).
```javascript
    re.exec(str); // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Prototypes of strings using regular expressions

Some prototypes of the `string` object accept a regular expression as a parameter to perform more advanced searches or replacements.

```javascript
    const str = 'hello world';
```

**`match`** Returns the first result that matches the regex (or `null` if none). If the regex uses the `g` flag, it returns an array containing all matches instead, but without the details of the captured groups.
```javascript
    str.match(/o/g); // ['o', 'o']
```

**`matchAll`** Works like `match` with the `g` flag, but requires this flag. It returns an iterator that provides access to the details of each match, including captured groups.
```javascript
    const str = "Jean:25 Marie:30";
    const resultat = [...str.matchAll(/(\w+):(\d+)/g)];

    console.log(resultat);
    /*  
    [
        [
            "Jean:25",           // complete correspondence
            "Jean",              // Group 1
            "25",                // Group 2
            index: 0,
            input: "Jean:25 Marie:30",
            groups: undefined
        ],
        [
            "Marie:30",
            "Marie",
            "30",
            index: 8,
            input: "Jean:25 Marie:30",
            groups: undefined
        ]
    ]
    */
```

**`search`** Returns the index of the first match of the regex in the string, or `-1` if no match is found.
```javascript
    str.search(/world/); // 6
```

**`replace`** and **`replaceAll`** return a copy of the string with one part replaced by another: `replace` replaces only the first occurrence that matches the regex (unless the `g` flag is set), while `replaceAll` requires this flag to replace all occurrences.
```javascript
    str.replace(/o/g, '0'); // 'hell0 w0rld'
    str.replaceAll(/o/g, '0'); // Requires the g flag; otherwise, an error occurs
```

**`split`** Splits the string into an array of substrings, using the regex as a separator.
```javascript
    str.split(/\s/); // ['hello', 'world']
```

### Capture Groups

Parentheses in a regex allow you to capture a specific part of the match. These captured parts can then be retrieved using `exec` or `match`.

```javascript
    const re = /(\d{4})-(\d{2})-(\d{2})/;
    const date = '2024-06-15';

    const result = date.match(re);
    result[1]; // '2024' (year)
    result[2]; // '06' (month)
    result[3]; // '15' (day)
```

You can also name the groups to make them easier to read, and access them by name using the `groups` property.
```javascript
    const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
    const resultNamed = reNamed.exec(date);
    resultNamed.groups.annee; // '2024'
```
