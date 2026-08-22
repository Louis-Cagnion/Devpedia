---
order: 4
---

# Strings

A string is a sequence of characters used to represent text. In JavaScript, it can be written in three different ways:
```javascript
    // single quotes
    const st1 = 'Hello world';

    // double quotes
    const str2 = "Hello world";

    // backticks, which are useful for writing across multiple lines or inserting variables (template literals)
    const str3 = `
    Ce format
    permet d'écrire
    une string sur
    plusieurs lignes
    `;
```

### Thong Prototypes

Prototypes are functions built into the string object by default, allowing you to perform certain actions on the string. A string is immutable: these functions never modify it; they always return a new value.

```javascript
    const str = 'hello world';
```

**`includes`** Checks whether the string contains a given substring, and returns either `true` or `false`.
```javascript
    str.includes('hello'); // true
```

**`length`** is not a function but a property: it returns the number of characters in the string.
```javascript
    str.length; // 11
```

**`slice`** Returns a portion of the string between a start index (inclusive) and an end index (exclusive).
```javascript
    str.slice(0, 5); // 'hello'
```

**`toUpperCase`** and `**`toLowerCase`**` return a copy of the string in all uppercase or all lowercase.
```javascript
    str.toUpperCase(); // 'HELLO WORLD'
    str.toLowerCase(); // 'hello world'
```

**`trim`** Returns a copy of the string without the unnecessary spaces at the beginning and end.
```javascript
    str.trim();
```

**`replace`** and **`replaceAll`** return a copy of the string with one part replaced by another: `replace` replaces only the first occurrence, while `replaceAll` replaces all occurrences.
```javascript
    str.replace('hello', 'hi'); // 'hi world'
    str.replaceAll('o', '0'); // 'hell0 w0rld'
```

**`split`** Splits the string into an array of substrings, using a separator specified as a parameter.
```javascript
    str.split(' '); // ['hello', 'world']
```

**`indexOf`** Searches for a substring in the string and returns the index of its first occurrence. If it does not exist, it returns `-1`.
```javascript
    str.indexOf('world'); // 6
```

**`startsWith`** and `**`endsWith`**` check whether the string begins or ends with a given value, and return `true` or `false`.
```javascript
    str.startsWith('hello'); // true
    str.endsWith('world'); // true
```

**`repeat`** Returns a new string by repeating the original string a certain number of times.
```javascript
    str.repeat(2); // 'hello worldhello world'
```

**`concat`** concatenates several strings and returns the result, without modifying the original strings.
```javascript
    str.concat(' !'); // 'Hello, world!'
```

### Regular Expressions

You can use regular expressions to search for or extract information from strings (see regular expressions).
