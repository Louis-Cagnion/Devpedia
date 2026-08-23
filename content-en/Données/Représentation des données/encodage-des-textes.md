---
order: 3
---

# Text Encoding (ASCII, Unicode, UTF-8)

A computer doesn't store letters, only numbers. An **encoding** is the convention that maps each character to a number, then that number to a sequence of bytes. When two programs don't agree on the convention, you get the infamous `Ã©` instead of `é`.

## ASCII: 128 characters, 7 bits

**ASCII** (*American Standard Code for Information Interchange*), standardized in 1963, maps a number from 0 to 127 to English-language characters. It therefore fits in 7 bits, stored in a byte.

| Character | Code |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| space | 32 |

Two properties of this table are used constantly:

```c
// Going from lowercase to uppercase: a gap of 32, i.e. one bit
char uppercase = lowercase - 32;

// Converting a digit character to its numeric value
int value = digit_char - '0';    // '7' - '0' = 55 - 48 = 7
```

This is why, in [C](/?c=langages-de-programmation&s=c&p=c), a `char` **is** an integer: `'A'` and `65` are the same value. See the [Variables and Data Types](/?c=langages-de-programmation&s=c&p=variables) chapter.

Codes 0 to 31 aren't printable characters but **control characters**, a legacy of teleprinters: `\n` (10, line feed), `\t` (9, tab), `\0` (0, string terminator in C).

## The problem: 128 characters aren't enough

Neither `é`, `ñ`, `京`, nor `😀` fit into ASCII. Every region therefore created its own extension using the 8th bit (codes 128–255): [`ISO-8859-1`](https://en.wikipedia.org/wiki/ISO/IEC_8859-1) (Latin-1) for Western Europe, `ISO-8859-5` for Cyrillic, [`Windows-1252`](https://en.wikipedia.org/wiki/Windows-1252)...

Hence the structural problem: **the same byte meant different characters depending on the table used**, and nothing in the file indicated which one. A French text read with a Cyrillic table came out as gibberish.

## Unicode: separating the character from its storage

Unicode solves the problem by splitting two questions that had been conflated:

1. **Which character?** Every character gets a unique, permanent number, called a **code point**, written `U+XXXX`. `é` is `U+00E9`, `京` is `U+4EAC`, `😀` is `U+1F600`. There are more than 150,000 of them.
2. **How to store it as bytes?** That's the role of a **transformation format**: UTF-8, UTF-16, or UTF-32.

Unicode is therefore not an encoding: it's a catalog. UTF-8 is an encoding of that catalog.

## UTF-8: variable length

UTF-8 encodes a code point using **1 to 4 bytes**, depending on its value:

| Code point range | Bytes | Content |
|---|---|---|
| `U+0000` → `U+007F` | 1 | identical to ASCII |
| `U+0080` → `U+07FF` | 2 | accented Latin, Greek, Cyrillic, Arabic, Hebrew |
| `U+0800` → `U+FFFF` | 3 | Chinese, Japanese, Korean |
| `U+10000` → `U+10FFFF` | 4 | emoji, rare scripts |

Its decisive quality is **backward compatibility with ASCII**: an ASCII file is already a valid UTF-8 file, with no conversion needed. This is what allowed it to become universally adopted: it now accounts for over 98% of the web.

```text
"A"  -> 1 byte  : 41
"é"  -> 2 bytes : C3 A9
"京" -> 3 bytes : E4 BA AC
"😀" -> 4 bytes : F0 9F 98 80
```

The encoding is designed to be **self-describing**: the high-order bits of the first byte announce the length of the sequence, and every following byte starts with `10`. This makes it possible to resynchronize mid-stream, and a continuation byte is never mistaken for the start of a character.

## The consequence: a character ≠ a byte

This is the most common practical pitfall. In UTF-8, the length in bytes no longer matches the number of characters:

```python
text = "café"
len(text)                    # 4 -> Python counts characters
len(text.encode("utf-8"))    # 5 -> the "é" takes 2 bytes
```

In C, where a string is an array of bytes, `strlen("café")` returns **5**. Splitting such a string at an exact byte offset can cut a character in half and produce invalid data.

Worse, "a character" is itself ambiguous: some visible signs are made up of **several** code points (a letter plus a combining accent, a flag emoji, an emoji with a skin-tone modifier). The unit a human perceives is called a **grapheme**, and counting graphemes requires a dedicated library.

## Mojibake: diagnosing broken characters

When text encoded in UTF-8 is read as Latin-1, each byte is interpreted separately:

```text
"é" in UTF-8    = bytes C3 A9
read as Latin-1 : C3 -> "Ã"   A9 -> "©"
result          : "Ã©"
```

This symptom is very recognizable and helps trace back to the cause:

| Symptom | Likely diagnosis |
|---|---|
| `Ã©`, `Ã¨`, `Ã ` | UTF-8 read as Latin-1 |
| `?` or `�` | Character missing from the target encoding, replaced |
| Correct accents except in a spreadsheet | Missing separator or BOM on open |

The fix is never to "replace the characters" but to **declare the right encoding** at the point of reading. Every layer must be consistent: the [HTML](/?c=langages-de-balisage&s=html&p=html) tag (`<meta charset="utf-8">`, see the [Document Structure](/?c=langages-de-balisage&s=html&p=structure-dun-document) chapter), [the HTTP header](/?c=infrastructure&p=api-et-http), the source files' encoding, and the database's character set (`utf8mb4` for [MySQL](https://dev.mysql.com/doc/): plain `utf8` there is a false friend limited to 3 bytes, which rejects emoji).

## The BOM

The **BOM** (*Byte Order Mark*, `U+FEFF`) is an optional marker at the start of a file signaling its encoding. It's essential in UTF-16 to indicate byte order, but **useless in UTF-8**, where the order is fixed.

It nonetheless remains common on Windows, where some tools (including [Excel](https://www.microsoft.com/microsoft-365/excel)) use it to recognize a UTF-8 file. Hence a classic trade-off: a CSV meant for Excel needs the BOM to display accents correctly, whereas a [PHP](/?c=langages-de-programmation&s=php&p=php) source file with a BOM causes content to be sent prematurely and breaks HTTP headers.

## UTF-16 and UTF-32

- **UTF-16**: 2 or 4 bytes per character. Used internally by Java, C#, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), and Windows. Characters outside the basic plane (emoji) occupy two 16-bit units there, called a *surrogate pair*, which is why, in JavaScript, `"😀".length` returns **2**.
- **UTF-32**: 4 bytes per character, fixed size. Simple to index, but wastes a lot of space; rarely used for storage.

## Summary

| Concept | Key point |
|---|---|
| ASCII | 128 characters, 7 bits, the foundation for everything else |
| Unicode | A catalog of code points, **not** an encoding |
| UTF-8 | 1 to 4 bytes, ASCII-compatible, the web's de facto standard |
| Character ≠ byte | `strlen` in C counts bytes, not letters |
| Mojibake `Ã©` | UTF-8 read as Latin-1: fix the declaration, not the text |
| BOM | Useless in UTF-8, but expected by Excel, harmful at the start of a PHP source file |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An encoding maps each character to a number (Unicode: the catalog) then to bytes (UTF-8: the format). UTF-8 is ASCII-compatible and encodes a character in 1 to 4 bytes, so a character isn't necessarily a byte. |
| **Tools you can use** | `<meta charset="utf-8">`, `utf8mb4` for MySQL, a dedicated library for counting graphemes. |
| **Pitfalls to avoid** | Reading a UTF-8 file with the wrong encoding declared (mojibake, `Ã©`); splitting a string at an exact byte offset without accounting for multi-byte characters. |
| **Best practices** | Declare the right encoding at every layer (file, HTTP, database) rather than "fixing" characters that are already corrupted. |
