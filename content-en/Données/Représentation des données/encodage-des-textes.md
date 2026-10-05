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

## A BOM in a File Read by a Program: Two Silent Failures

A C program that [reads a text file line by line](/?c=langages&s=c&p=lecture-de-fichiers) (with `fgets`) assumes two things: that a character fits in a byte, and that the text starts with its first visible character. A [BOM](#the-bom) breaks one or the other, **without producing any error**. Each encoding has its own, written with its own bytes:

| Encoding | BOM bytes | Note |
|---|---|---|
| UTF-8 | `EF BB BF` | Optional; 3 bytes at the start, then the text |
| UTF-16 little-endian | `FF FE` | The low-order byte of each unit first (see [memory layout](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)) |
| UTF-16 big-endian | `FE FF` | The high-order byte first |
| UTF-32 little-endian | `FF FE 00 00` | Starts like UTF-16 little-endian |
| UTF-32 big-endian | `00 00 FE FF` | |

Six files holding the same two lines (`title My text` and `size 12`) in the different encodings, with the [`file`](https://man7.org/linux/man-pages/man1/file.1.html) command to identify them and [`iconv`](https://man7.org/linux/man-pages/man1/iconv.1.html) to convert from one encoding to another:

```bash
printf 'title My text\nsize 12\n' > utf8.txt                          # UTF-8 without BOM
printf '\xef\xbb\xbftitle My text\nsize 12\n' > utf8bom.txt           # UTF-8 with BOM
iconv -f UTF-8 -t UTF-16LE utf8.txt > body16.bin                         # UTF-16 little-endian, without BOM
printf '\xff\xfe' | cat - body16.bin > utf16.txt                         # we put the FF FE BOM in front
iconv -f UTF-8 -t UTF-16BE utf8.txt > body16be.bin
printf '\xfe\xff' | cat - body16be.bin > utf16be.txt
iconv -f UTF-8 -t UTF-32LE utf8.txt > body32le.bin
printf '\xff\xfe\x00\x00' | cat - body32le.bin > utf32le.txt
iconv -f UTF-8 -t UTF-32BE utf8.txt > body32be.bin
printf '\x00\x00\xfe\xff' | cat - body32be.bin > utf32be.txt
iconv -f UTF-16 -t UTF-8 utf16.txt > utf16_converted.txt                   # back to UTF-8: the BOM disappears
file utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_converted.txt
```

```
utf8.txt:            ASCII text
utf8bom.txt:         Unicode text, UTF-8 (with BOM) text
utf16.txt:           Unicode text, UTF-16, little-endian text
utf16be.txt:         Unicode text, UTF-16, big-endian text
utf32le.txt:         Unicode text, UTF-32, little-endian
utf32be.txt:         Unicode text, UTF-32, big-endian
utf16_converted.txt: ASCII text
```

The bytes of `utf8bom.txt` (three extra bytes) and of `utf16.txt` (each letter followed by a `00` byte), with [`xxd`](https://manpages.debian.org/xxd), which displays a file in hexadecimal:

```bash
xxd utf8bom.txt | head -1
xxd utf16.txt | head -2
```

```
00000000: efbb bf74 6974 6c65 204d 7920 7465 7874  ...title My text
00000000: fffe 7400 6900 7400 6c00 6500 2000 4d00  ..t.i.t.l.e. .M.
00000010: 7900 2000 7400 6500 7800 7400 0a00 7300  y. .t.e.x.t...s.
```

### A naive reader and a reader that looks at the start of the file

The program reads **directives** (a line `word value`: here `title` followed by a text, `size` followed by a number). The naive reader compares each line with the expected word and **silently ignores** any unknown line; the safe reader first reads the first four bytes (`skip_bom`), skips a UTF-8 BOM, explicitly refuses UTF-16 or UTF-32, and reports unknown lines.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Reads a file of "title text" and "size number" directives, ignoring the BOM. */
static void	parse_naive(const char *path)
{
	FILE	*f = fopen(path, "r");
	char	line[128], title[64] = "(missing)";
	int		size = -1, ignored = 0;

	if (!f)
		return ;
	while (fgets(line, sizeof line, f))
	{
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			ignored++;                              /* unknown directive: ignored silently */
	}
	fclose(f);
	printf("naive %-12s : title=%s, size=%d, ignored lines=%d\n", path, title, size, ignored);
}

/* Reads the first 4 bytes: skips a UTF-8 BOM, refuses UTF-16 and UTF-32. Returns 0 or -1. */
static int	skip_bom(FILE *f, const char *path)
{
	unsigned char	b[4] = {0};
	size_t			n = fread(b, 1, 4, f);

	if (n >= 4 && b[0] == 0xFF && b[1] == 0xFE && b[2] == 0 && b[3] == 0)
		return (fprintf(stderr, "%s : UTF-32 (BOM FF FE 00 00) not supported\n", path), -1);
	if (n >= 4 && b[0] == 0 && b[1] == 0 && b[2] == 0xFE && b[3] == 0xFF)
		return (fprintf(stderr, "%s : UTF-32 (BOM 00 00 FE FF) not supported\n", path), -1);
	if (n >= 2 && b[0] == 0xFF && b[1] == 0xFE)
		return (fprintf(stderr, "%s : UTF-16 (BOM FF FE) not supported\n", path), -1);
	if (n >= 2 && b[0] == 0xFE && b[1] == 0xFF)
		return (fprintf(stderr, "%s : UTF-16 (BOM FE FF) not supported\n", path), -1);
	if (n >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF)
		return (fseek(f, 3, SEEK_SET), 0);          /* UTF-8 BOM: resume right after it */
	return (fseek(f, 0, SEEK_SET), 0);              /* no BOM: resume at the start */
}

/* Same reading, but the BOM is handled and an unknown directive is reported. */
static void	parse_safe(const char *path)
{
	FILE	*f = fopen(path, "rb");
	char	line[128], title[64] = "(missing)";
	int		size = -1, line_no = 0, unknown = 0;

	if (!f || skip_bom(f, path) != 0)
		return ((void)(f && fclose(f)));
	while (fgets(line, sizeof line, f))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			unknown += fprintf(stderr, "%s:%d : unknown directive\n", path, line_no) > 0;
	}
	fclose(f);
	printf("safe  %-12s : title=%s, size=%d, unknown directives=%d\n", path, title, size, unknown);
}

int	main(int argc, char **argv)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* messages and results in order */
	for (int i = 1; i < argc; i++)
		parse_naive(argv[i]);
	for (int i = 1; i < argc; i++)
		parse_safe(argv[i]);
	return (0);
}
```

```bash
gcc -Wall -Wextra -g -fsanitize=address,undefined directives.c -o directives
./directives utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_converted.txt
```

```
naive utf8.txt     : title=My text, size=12, ignored lines=0
naive utf8bom.txt  : title=(missing), size=12, ignored lines=1
naive utf16.txt    : title=(missing), size=-1, ignored lines=3
naive utf16be.txt  : title=(missing), size=-1, ignored lines=2
naive utf32le.txt  : title=(missing), size=-1, ignored lines=3
naive utf32be.txt  : title=(missing), size=-1, ignored lines=2
naive utf16_converted.txt : title=My text, size=12, ignored lines=0
safe  utf8.txt     : title=My text, size=12, unknown directives=0
safe  utf8bom.txt  : title=My text, size=12, unknown directives=0
utf16.txt : UTF-16 (BOM FF FE) not supported
utf16be.txt : UTF-16 (BOM FE FF) not supported
utf32le.txt : UTF-32 (BOM FF FE 00 00) not supported
utf32be.txt : UTF-32 (BOM 00 00 FE FF) not supported
safe  utf16_converted.txt : title=My text, size=12, unknown directives=0
```

**First case: the UTF-8 BOM glued to the first directive.** The file `utf8bom.txt` looks like `utf8.txt` on screen, but its first line starts with the bytes `EF BB BF`: it is `\xEF\xBB\xBFtitle My text`, which is not `title `; the naive reader puts it among the unknown lines, **the first directive vanishes** and nothing says so (`title=(missing)`, one ignored line). The rest of the file is read normally, which makes the defect hard to trace back to its cause.

**Second case: UTF-16 and NUL bytes.** A character string in C ends with a byte of value 0, the **NUL** (`'\0'`); `strlen` and most text functions stop at the first one. In UTF-16 (and UTF-32), an ASCII letter is followed by one or three NUL bytes: `t` is written `74 00`. Measured on the first line of `utf16.txt`:

```c
#include <stdio.h>
#include <string.h>

int	main(void)
{
	FILE	*f = fopen("utf16.txt", "rb");
	char	line[128];
	long	start = ftell(f);                       /* position before the read */

	fgets(line, sizeof line, f);                    /* reads up to the first 0x0A byte */
	printf("bytes read: %ld, strlen: %zu\n", ftell(f) - start, strlen(line));
	printf("first bytes: %02x %02x %02x %02x\n", (unsigned char)line[0],
		(unsigned char)line[1], (unsigned char)line[2], (unsigned char)line[3]);
	fclose(f);
	return (0);
}
```

```
bytes read: 29, strlen: 3
first bytes: ff fe 74 00
```

`fgets` read 29 bytes (up to the first `0A` byte, a line feed: in UTF-16 it is written `0A 00`, so its `00` opens the next line), but `strlen` sees only 3: `FF`, `FE`, `74`, then the NUL stops everything. Each line is seen as a single character preceded by the BOM: **no directive matches**, the naive reader fills nothing (`title=(missing), size=-1`, 3 ignored lines) and reports nothing.

The safe reader does not try to guess: it reads the BOM, and **explicitly refuses** the encoding (`utf16.txt : UTF-16 (BOM FF FE) not supported`), giving the byte that betrayed it. The conversion is done elsewhere, with `iconv -f UTF-16 -t UTF-8`: the converted file is read normally (`utf16_converted.txt`).

| File | Naive reader | Safe reader |
|---|---|---|
| UTF-8 without BOM | correct | correct |
| UTF-8 with BOM | **title lost**, no error | correct (BOM skipped) |
| UTF-16 (LE or BE) | **everything ignored**, no error | named refusal |
| UTF-32 (LE or BE) | **everything ignored**, no error | named refusal |
| UTF-16 converted to UTF-8 | correct | correct |

> **Pitfall:** an editor that saves "as UTF-8" sometimes adds a BOM, which `cat` or a plain `diff` do not show. A file that looks identical on screen may start with three invisible bytes. The `file` command (or `xxd | head -1`) reveals it.
>
> **Pitfall:** testing the UTF-32 little-endian BOM (`FF FE 00 00`) **after** the UTF-16 one (`FF FE`): both start with the same bytes, the shorter would always win. In `skip_bom`, the four-byte test comes first.
>
> **Best practice:** read the first bytes before parsing a text file that comes from outside, skip a UTF-8 BOM, explicitly refuse the other encodings (with the BOM found in the message), and report an unknown directive rather than ignoring it silently.

## Stripping accents from text: Unicode normalization (NFKD)

Comparing or searching text while ignoring accents (grouping "café" and "cafe" as the same entry, for instance) requires separating each accented letter from its accent. The standard `unicodedata` module provides this decomposition without reinventing a lookup table:

```python
import unicodedata

def strip_accents(text):
    decomposed = unicodedata.normalize("NFKD", text)   # "é" -> "e" + combining acute accent
    return "".join(c for c in decomposed if not unicodedata.combining(c))

strip_accents("café")   # "cafe"
```

`unicodedata.normalize("NFKD", ...)` decomposes each accented character into its base letter followed by a separate **combining character** (the accent itself, its own code point); `unicodedata.combining(c)` returns true for these combining characters, which can then simply be filtered out.

NFKD is one of the 4 standard Unicode normalization forms:

| Form | Effect |
|---|---|
| NFC | Recomposes: shortest form, one code point per visible character when possible |
| NFD | Decomposes: base letter + separate combining accents |
| NFKC | Like NFC, also unifying presentation variants (e.g. ligature `ﬁ` → `fi`) |
| NFKD | Like NFD, with the same unification as NFKC |

> **Pitfall:** two visually identical texts can be composed differently in memory (`é` as a single code point `U+00E9`, or as two, `U+0065` + `U+0301`) and thus fail an `==` comparison even though they display the same way. Normalizing both texts into the same form before comparing them avoids this pitfall.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An encoding maps each character to a number (Unicode: the catalog) then to bytes (UTF-8: the format). UTF-8 is ASCII-compatible and encodes a character in 1 to 4 bytes, so a character isn't necessarily a byte. Unicode normalization (NFC/NFD/NFKC/NFKD) recomposes or decomposes an accented character, notably to compare or search text while ignoring accents. |
| **Tools you can use** | `<meta charset="utf-8">`, `utf8mb4` for MySQL, a dedicated library for counting graphemes, `unicodedata.normalize()`/`unicodedata.combining()` to normalize text or strip its accents. |
| **Pitfalls to avoid** | Reading a UTF-8 file with the wrong encoding declared (mojibake, `Ã©`); splitting a string at an exact byte offset without accounting for multi-byte characters; comparing two visually identical texts composed differently in memory without normalizing them first; parsing a file that starts with a BOM without handling it (directive lost in UTF-8, all the text ignored in UTF-16). |
| **Best practices** | Declare the right encoding at every layer (file, HTTP, database) rather than "fixing" characters that are already corrupted. Normalize two texts into the same Unicode form before comparing or searching them. Read the first bytes of a file that comes from outside to spot a BOM, and report an unsupported encoding instead of ignoring it. |
