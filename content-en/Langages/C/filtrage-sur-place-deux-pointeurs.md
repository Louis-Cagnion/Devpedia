---
order: 30
---

# Filtering a string in place with two pointers

Removing characters from a text (extra spaces, line breaks, anything that is not a letter) looks simple as long as you are allowed to build a second text. This chapter shows how to do it **in place**: in the very memory of the original text, without allocating anything, in a single pass. The technique rests on two pointers, one that reads and one that writes. It brings together three notions that C uses everywhere: the write `*out++ = *p`, the difference between `*p++` and `(*p)++`, and the subtraction of two pointers.

It assumes you already know [pointers](/?c=langages&s=c&p=pointeurs) (a variable that holds the address of another; `*p` reads or writes the cell it points to; `p + 1` designates the next cell, see [pointer arithmetic](/?c=langages&s=c&p=pointeurs#pointer-arithmetic)), [strings](/?c=langages&s=c&p=variables#strings) (an array of `char` ended by the **null character** `'\0'`, of code 0, which marks the end of the text) and [loops](/?c=langages&s=c&p=boucles). A `char` is a small integer that codes a letter, a digit or a sign: `'a'` is 97, and `'a' + 1` is `'b'`.

## The problem: removing characters without a second string

Two filters serve as the common thread of the whole chapter.

| Filter | Rule | Before | After |
|---|---|---|---|
| Extra spaces | A run of spaces becomes a single space | `a   b  c` | `a b c` |
| Cut lines | A backslash `\` followed by a newline disappears | `un \` + newline + `deux` | `un deux` |

The **backslash** `\` and the **newline** (the character that ends a line, written `'\n'` in C) are two characters like any other. In a text written between double quotes in C, the `\` introduces a special character (`\n`, `\0`): to designate a real `\`, you write two of them, `'\\'`.

### First idea: shifting the rest at each removal

As soon as a character must disappear, we move back by one cell everything that follows it. `memmove(destination, source, n)` ([documentation](https://en.cppreference.com/w/c/string/byte/memmove)) copies `n` bytes from one area to another, even if the two areas overlap (which `memcpy` is not allowed to do, see [copying and filling bytes](/?c=langages&s=c&p=memoire#copying-and-filling-bytes-memcpy-and-memset)). `strlen(t)` ([documentation](https://en.cppreference.com/w/c/string/byte/strlen)) counts the characters of `t` up to the `'\0'`. The program also counts the bytes moved, to measure the cost. The elements it uses:

| Element | Role |
|---|---|
| `size_t` | Unsigned integer meant for a size or a length (the one `strlen` returns) |
| `unsigned long` | Unsigned integer, large enough for a total that exceeds a few billion |
| `&moved` | The address of the variable `moved`, so that the function can change it (see [passing a pointer to a function](/?c=langages&s=c&p=pointeurs#passing-a-pointer-to-a-function-pass-by-address)) |
| `%s`, `%zu`, `%lu`, `%c`, `%td` | `printf` placeholders for a string, a `size_t`, an `unsigned long`, a character, a `ptrdiff_t` |
| `[%s]` | The brackets around the text show where it starts and where it ends (useful to see the spaces) |

```c
#include <stdio.h>
#include <string.h>

// Reduces each run of spaces to a single one, by shifting the rest of the text.
// Adds to *moved the number of bytes moved, to measure the cost.
void squeeze_naive(char *s, unsigned long *moved)
{
    size_t i = 0;                       // current position in s

    while (s[i] != '\0') {              // up to the end of the text
        if (s[i] == ' ' && s[i + 1] == ' ') {   // two spaces in a row: one is extra
            size_t rest = strlen(s + i + 1) + 1;   // bytes to shift, '\0' included
            memmove(s + i, s + i + 1, rest);       // moves the whole rest back by one cell
            *moved += rest;             // we note the cost of this shift
        } else {
            i++;                        // nothing to remove here: we move on
        }
    }
}

int main(void)
{
    char          s[] = "a   b  c";     // 3 spaces between a and b, 2 between b and c
    unsigned long moved = 0;            // total of bytes moved

    squeeze_naive(s, &moved);           // filters s in place
    printf("[%s] after %lu bytes moved\n", s, moved);   // [ ] show the edges
    return 0;
}
```

```text
[a b c] after 16 bytes moved
```

The result is correct, but the work is wasted: the three removals moved 7, then 6, then 3 bytes, a total of 16. Each removal copies **everything that remains**: on a text of `n` characters that contains roughly `n` removals, the total grows like `n × n / 2`. This is called a **quadratic** cost, written `O(n²)` (see [Big-O notation and complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): a text ten times longer takes a hundred times more work. The section "Measuring the difference" below puts a number on it.

### Second idea: a single pass with two pointers

Instead of shifting the rest each time, we go through the text **once** and copy, as we go, only what we keep, toward the start of the same array. Nothing to shift, nothing to allocate.

| Approach | Extra memory | Work | Drawback |
|---|---|---|---|
| Copy into a second string | A whole string ([`malloc` then `free`](/?c=langages&s=c&p=memoire#allocating-memory-dynamically)) | One pass | Can fail for lack of memory; must be freed |
| Shift the rest at each removal | None | Quadratic | Becomes slow on a long text |
| **Two pointers, in place** | None | One pass (**linear**: the work grows like `n`) | Modifies the caller's text |

## The principle: one pointer reads, one pointer writes

Two pointers aim at the **same array**, both starting on the first cell:

| Pointer | Usual name | Role | Advances when? |
|---|---|---|---|
| Reading | `p` | Examines each character, from the first to the `'\0'` | At each turn of the loop |
| Writing | `out` | Designates the cell where the next kept character will be written | Only when a character is kept |

One rule keeps the whole thing safe: **`out <= p` at all times**. The two pointers start on the same cell; on each turn, `p` advances by one cell (or more) and `out` by one cell at most. `out` can therefore never catch up with `p` and then overtake it, and every cell we write to has already been read: we never overwrite a character we have not examined yet. The diagram follows the extra-spaces filter on `"a  b"` (the `_` stands for a space, `^` marks the cell aimed at):

```text
Turn 1 : reads 'a'  -> kept, copied to cell 0 (onto itself)
  cell :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :  ^
  out  :  ^

Turn 2 : reads '_', the last written is 'a'  -> kept, copied to cell 1
  cell :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :      ^
  out  :      ^

Turn 3 : reads '_', the last written is '_'  -> ignored, out does not move
  cell :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :          ^
  out  :          ^

Turn 4 : reads 'b'  -> kept, copied to cell 2 (over a space already read)
  cell :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :              ^
  out  :          ^

End : p reads '\0', the loop stops; '\0' still has to be written in cell 3
  cell :  0   1   2   3   4
  s    :  a   _   b   b   \0
  p    :                  ^
  out  :              ^
```

At turn 3, the gap between the two pointers appears: `p` has advanced, `out` has not. From then on, `out` stays one cell behind `p` until the end. The rule `out <= p` holds for filters that write **at most one character per character read** (removing, keeping, or replacing a character with another); a filter that makes the text longer would break it (see "When things go wrong").

## `*out++ = *p` unpacked

This line copies the character read to the writing place, then advances `out`. It combines three operators (symbols that compute something):

| Operator | Name | Effect |
|---|---|---|
| `*` in front of a pointer | Dereferencing | Designates the cell the pointer aims at, to read it or write to it |
| `++` after a variable (`out++`) | **Postfix** increment | Advances the variable by one step **after** providing its previous value |
| `++` before a variable (`++out`) | **Prefix** increment | Advances the variable **before** providing its value |

For a pointer, "one step" means one cell of its type (one `char` cell here, see [pointer arithmetic](/?c=langages&s=c&p=pointeurs#pointer-arithmetic)). The remaining question is which one applies first, `*` or `++`. The answer is the **precedence** of the operators (the order in which the language applies them when they follow each other, see the [official table](https://en.cppreference.com/w/c/language/operator_precedence)): the postfix `++` comes before the `*`. So `*out++` reads as `*(out++)`:

1. `out++` provides the **old** address of `out`, and `out` advances by one cell;
2. the `*` applies to the old address: it is the cell where we write.

In other words, `*out++ = *p;` does exactly what these two lines do:

```c
*out = *p;   // writes at the address that out contained
out++;       // then only advances out
```

| Compact form | Expanded equivalent |
|---|---|
| `*out++ = *p;` | `*out = *p; out++;` |
| `*out++ = *p++;` | `*out = *p; out++; p++;` |
| `c = *p++;` | `c = *p; p++;` |
| `*++out = *p;` | `out++; *out = *p;` (advances **before** writing) |

The same reasoning tells apart four expressions that look alike. The program tries each one on the text `"abc"`; `p - t` is the number of cells by which `p` has moved away from `t` (pointer subtraction is detailed below). The parentheses in `(*p)++` matter: without them, `*p++` would be read `*(p++)`.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char  t[] = "abc";                  // the starting text
    char *p = t;                        // p points to t[0], which holds 'a'
    char  v;                            // the value produced by the expression tried

    v = *p++;                           // reads the cell pointed to, then advances p
    printf("*p++   : value %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // restores the starting text, '\0' included
    p = t;                              // and p back on the first cell
    v = (*p)++;                         // reads the value, then increases it by 1 in t[0]
    printf("(*p)++ : value %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // same restoration
    p = t;
    v = *++p;                           // advances p first, then reads the cell reached
    printf("*++p   : value %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // same restoration
    p = t;
    v = ++*p;                           // increases t[0] by 1, then reads the new value
    printf("++*p   : value %c, p - t = %td, t = %s\n", v, p - t, t);
    return 0;
}
```

```text
*p++   : value a, p - t = 1, t = abc
(*p)++ : value a, p - t = 0, t = bbc
*++p   : value b, p - t = 1, t = abc
++*p   : value b, p - t = 0, t = bbc
```

| Expression | Reads as | Value produced | What changes |
|---|---|---|---|
| `*p++` | `*(p++)` | `a`: the cell aimed at **before** advancing | `p` advances by one cell; the text is intact |
| `(*p)++` | `(*p)++` | `a`: the value **before** the increase | `t[0]` goes from `a` to `b`; `p` does not move |
| `*++p` | `*(++p)` | `b`: the cell reached **after** advancing | `p` advances by one cell; the text is intact |
| `++*p` | `++(*p)` | `b`: the value **after** the increase | `t[0]` goes from `a` to `b`; `p` does not move |

To remember it: the `++` acts on what is **stuck** to it. In `*p++`, it is stuck to `p`, so it is the pointer that advances. In `(*p)++` and `++*p`, it applies to `*p`, so it is the pointed-to value that changes. As for prefix and postfix, the postfix form gives the value from **before**, the prefix form the value from **after**.

> **Pitfall:** writing `*p++;` alone, in the belief that it increases the pointed-to value. This advances `p` and throws away the value read; with `-Wall` (the option that enables the usual warnings of [`gcc`](/?c=langages&s=c&p=compilation), the compiler: the program that translates C into an executable program), the compiler warns: `warning: value computed is not used`. To increase the value, write `(*p)++`.

One last precaution: in `*out++ = *p++`, two different variables are modified (`out` and `p`), which is safe. By contrast, an expression that **modifies** a variable and also **reads** it elsewhere, such as `*out++ = *out`, has **undefined behavior** (the language does not say what happens: anything from a crash to a wrong result that looks right). It does not impose the order in which its parts run (see [evaluation order](/?c=langages&s=c&p=operateur-virgule#pitfall-the-order-in-which-arguments-are-evaluated-is-unspecified)). Rule: a variable modified in an expression is not read anywhere else in that expression.

## First complete filter: removing extra spaces

We apply the chapter's pattern to the space filter. On each turn, we decide whether the character read is kept: every character that is not a space is kept; a space is kept only if the last character written is not a space.

```c
#include <stddef.h>
#include <stdio.h>

// Reduces each run of spaces to a single space, in place.
// Returns the new length of s, not counting the '\0'.
size_t squeeze_spaces(char *s)
{
    const char *p = s;                  // READ pointer: walks the whole string
    char       *out = s;                // WRITE pointer: only follows what we keep

    while (*p != '\0') {                // up to the '\0' that ends the string
        if (*p != ' ' || out == s || out[-1] != ' ')   // character to keep?
            *out++ = *p;                // writes it, then advances out
        p++;                            // reading advances on each turn, kept or not
    }
    *out = '\0';                        // sets the new end of the string
    return (size_t)(out - s);           // number of characters kept
}

int main(void)
{
    char   a[] = "a  b";                // two spaces between a and b
    char   b[] = "  un   deux    trois  ";   // runs of spaces of varied sizes
    size_t n;                           // length returned by squeeze_spaces

    n = squeeze_spaces(a);              // filters a in place
    printf("[%s] length %zu\n", a, n);
    n = squeeze_spaces(b);              // filters b in place
    printf("[%s] length %zu\n", b, n);
    return 0;
}
```

```text
[a b] length 3
[ un deux trois ] length 15
```

The keep condition reads piece by piece. The three tests are joined by `||` ("or"), which stops as soon as one test is true without evaluating the following ones (see [short-circuit evaluation](/?c=langages&s=c&p=boucles#short-circuit-evaluation-of)): that is what makes `out == s` protective.

| Piece | Question asked | Role |
|---|---|---|
| `*p != ' '` | Is the character read not a space? | Any other character is kept |
| `out == s` | Is nothing written yet? | At the start, `out[-1]` would be the cell **before** the array: we do not read it |
| `out[-1] != ' '` | Is the last character written not a space? | Keeps the first space of a run, ignores the following ones |

`out[-1]` is `*(out - 1)`: the cell just **behind** `out`, hence the last character written (see [`[]` is just syntactic sugar](/?c=langages&s=c&p=pointeurs#is-just-syntactic-sugar) in the chapter on pointers). A negative index is legal on a pointer, as long as the cell aimed at belongs to the array.

The reading pointer is declared `const char *p`: it promises never to write. If the code tried `*p = ...`, the compiler would refuse. Only `out` writes. This split of roles avoids mixing up the two pointers.

Note on the edges: spaces at the beginning and at the end do not disappear, they are reduced to one (`"  un ... trois  "` becomes `" un ... trois "`). Removing them entirely is another filter, which needs to know where the string ends.

## The terminator: writing the final `'\0'`

A C string ends at the **first** `'\0'` it meets. After the filter, the text is shorter, but the old `'\0'` stayed further along: without a new terminator, the old end of the text reappears. The following program is the spaces one, with the `*out = '\0'` line removed:

```c
#include <stdio.h>
#include <string.h>

// Same filter as squeeze_spaces, but FORGETS to terminate the string.
void squeeze_no_end(char *s)
{
    const char *p = s;                  // read pointer
    char       *out = s;                // write pointer

    while (*p != '\0') {                // walks the whole string
        if (*p != ' ' || out == s || out[-1] != ' ')   // character to keep?
            *out++ = *p;                // writes it, then advances out
        p++;                            // reading advances on each turn
    }
                                        // forgotten: no *out = '\0' here
}

int main(void)
{
    char s[] = "a  b";                  // 4 characters, plus the '\0' in cell 4

    squeeze_no_end(s);                  // filters s without terminating it
    printf("[%s] length %zu\n", s, strlen(s));   // expected: [a b] length 3
    return 0;
}
```

```text
[a bb] length 4
```

```text
cell :  0   1   2   3   4
before  a   _   _   b   \0
without a   _   b   b   \0      <- the 'b' in cell 3 was left behind: text "a bb"
with    a   _   b   \0  \0      <- *out = '\0' in cell 3: the text stops there
```

No error is reported: everything stays in the array, the program "works" and prints a wrong text. This bug is not detected by the [sanitizers](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) (tools that check the program while it runs); only a test that compares the result with the expected one finds it. The line `*out = '\0';` **always** goes after the loop, before returning.

## Measuring the difference

Let us take both versions on the worst case of the shift: `n` spaces followed by an `x`. (`sizeof arr` gives the size in bytes of the array, see [`sizeof`](/?c=langages&s=c&p=memoire#sizeof); dividing by the size of one cell gives the number of cells.) The `main` below assumes `squeeze_naive` and `squeeze_spaces` are copied above it, as presented earlier.

```c
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// (here: squeeze_naive and squeeze_spaces, copied from the previous sections)

int main(void)
{
    size_t sizes[] = {1000, 10000, 100000};   // lengths of runs of spaces to test
    size_t count = sizeof sizes / sizeof sizes[0];   // number of trials

    for (size_t k = 0; k < count; k++) {   // one trial per length
        size_t n = sizes[k];            // number of spaces in this trial
        char  *a = malloc(n + 2);       // n spaces, an 'x', a '\0'
        char  *b = malloc(n + 2);       // same text, for the two-pointer version
        unsigned long moved = 0;        // bytes moved by the naive version

        if (a == NULL || b == NULL)     // out of memory: we give up
            return 1;
        memset(a, ' ', n);              // n spaces in a row: worst case for the shift
        a[n] = 'x';                     // a visible character after the spaces
        a[n + 1] = '\0';                // end of string
        memcpy(b, a, n + 2);            // identical copy, '\0' included
        squeeze_naive(a, &moved);       // version that shifts
        squeeze_spaces(b);              // two-pointer version
        printf("n = %6zu : naive %11lu bytes moved, ", n, moved);
        printf("two pointers %6zu read, ", n + 1);   // the whole text, read only once
        printf("equal: %s\n", strcmp(a, b) == 0 ? "yes" : "no");   // same result?
        free(a);                        // gives back the memory
        free(b);
    }
    return 0;
}
```

```text
n =   1000 : naive      501498 bytes moved, two pointers   1001 read, equal: yes
n =  10000 : naive    50014998 bytes moved, two pointers  10001 read, equal: yes
n = 100000 : naive  5000149998 bytes moved, two pointers 100001 read, equal: yes
```

The two columns do not count the same things (bytes moved on one side, characters read on the other), but their evolution tells the story: when the text is multiplied by 10, the work of the shift is multiplied by 100, that of the two pointers by 10.

| Length `n` | Shift (bytes moved) | Two pointers (characters read) | Ratio between the two |
|---|---|---|---|
| 1 000 | 501 498 | 1 001 | about 500 |
| 10 000 | 50 014 998 | 10 001 | about 5 000 |
| 100 000 | 5 000 149 998 | 100 001 | about 50 000 |

The ratio is multiplied by 10 on each line: the gap keeps widening as the text gets longer.

## The difference of two pointers: the new length

At the end of `squeeze_spaces`, `out` has advanced by one cell for each character kept since `s`. The number of characters kept is therefore the gap between `out` and `s`, and the **subtraction of two pointers** gives it directly: `out - s`. There is no need to call `strlen`, which would walk the whole text again.

The result has type `ptrdiff_t` ([documentation](https://en.cppreference.com/w/c/types/ptrdiff_t)), defined in `<stddef.h>`: a **signed** integer (the result can be negative if the first pointer comes before the second) meant to hold a gap between pointers. `printf` displays it with `%td`. The gap is counted **in cells of the pointed-to type**, not in bytes, just like adding an integer to a pointer:

```c
#include <stddef.h>
#include <stdio.h>

int main(void)
{
    int       arr[5] = {10, 20, 30, 40, 50};   // 5 integers side by side in memory
    int      *start = &arr[1];          // address of cell 1 (value 20)
    int      *end = &arr[4];            // address of cell 4 (value 50)
    ptrdiff_t cells = end - start;      // gap in CELLS (in int), not in bytes
    ptrdiff_t moved = (char *)end - (char *)start;   // same gap, seen byte by byte

    printf("end - start = %td cells\n", cells);
    printf("in bytes    = %td\n", moved);
    printf("start + cells == end : %d\n", start + cells == end);   // 1 = true
    return 0;
}
```

```text
end - start = 3 cells
in bytes    = 12
start + cells == end : 1
```

Three cells of gap, that is 12 bytes, because an `int` takes 4 of them on this machine. For an array of `char`, one cell is one byte, so the two counts coincide, but the principle stays "in cells". Subtraction is the inverse of addition: `start + (end - start)` gives back `end`. The operations allowed between pointers:

| Operation | Meaning | Allowed? |
|---|---|---|
| `p + n`, `p - n` | Pointer moved forward or back by `n` cells | Yes, without leaving the array (the cell just after the end is allowed, not any further) |
| `p - q` | Number of cells between `q` and `p`, of type `ptrdiff_t` | Yes, if `p` and `q` aim at the **same** array |
| `p < q`, `p <= q` | Which address comes first | Yes, if same array |
| `p + q` | No meaning | No: the compiler refuses (`invalid operands to binary +`) |
| `p - q` on two distinct arrays | Gap with no meaning | No: undefined behavior |

In our filters, `out` and `s` aim at the same array and `out >= s`: the gap is positive, and we convert it without risk to `size_t` with `(size_t)(out - s)`. After a correct filter, `out - s` and `strlen(s)` are equal; if `'\0'` was forgotten, they differ (`out - s` is 3 and `strlen(s)` is 4 in the program of the previous section).

## Looking ahead: joining lines cut by `\`

In a configuration file, a script (a file of commands) or a [`Makefile`](/?c=langages&s=c&p=makefiles), a `\` followed by a newline means "this line continues on the next one". The second filter removes these two characters to join the text back together. It cannot decide by looking at the current character alone: a `\` must be removed **only if the next character is a newline**. So it reads `p[1]`, the cell just after the one `p` points to:

| `*p` | `p[1]` | Action | Why |
|---|---|---|---|
| `\` | `'\n'` | `p += 2`, nothing is written | The pair to remove |
| `\` | other character | Copy the `\` | It is not a continuation |
| `\` | `'\0'` | Copy the `\` | `p[1]` is the end of the string: we read nothing beyond it |
| other thing | not read | Copy the character | `&&` stops before evaluating `p[1]` |

Reading `p[1]` is safe because the loop only runs while `*p != '\0'`: the next cell always exists, and at worst it is the terminator. Reading `p[2]` without having checked `p[1]` would not be: if `p[1]` is the `'\0'`, `p[2]` is already outside the array.

```c
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Removes each "\ then newline" pair from s, in place.
// Returns the new length of s.
size_t join_lines(char *s)
{
    const char *p = s;                  // READ pointer
    char       *out = s;                // WRITE pointer

    while (*p != '\0') {                // up to the end of the string
        if (*p == '\\' && p[1] == '\n')   // '\' followed by a newline?
            p += 2;                     // skips both characters, writes nothing
        else
            *out++ = *p++;              // copies one character, advances both pointers
    }
    *out = '\0';                        // sets the new end of the string
    return (size_t)(out - s);           // new length
}

int main(void)
{
    char a[] = "un \\\ndeux \\\ntrois\n";   // the text holds two "\" + newline pairs
    char b[] = "fin\\";                 // a '\' at the very end, nothing after it
    size_t before = strlen(a);          // length before the filter
    size_t after = join_lines(a);       // length after the filter

    printf("%s", a);                    // the joined text keeps its final newline
    printf("before %zu, after %zu\n", before, after);
    join_lines(b);                      // p[1] is '\0': the '\' is kept
    printf("[%s]\n", b);
    return 0;
}
```

```text
un deux trois
before 18, after 14
[fin\]
```

The text of `a` contains `un \`, a newline, `deux \`, a newline, `trois` and a last newline: 18 characters. Two pairs of two characters disappear, leaving 14. In this filter, `p` sometimes advances by two cells while `out` does not move: the gap between the two pointers grows, which the rule `out <= p` allows. The case of `b` checks the reading at the end of the string: the final `\` is kept, and nothing is read after the `'\0'`.

> **Pitfall:** a file coming from Windows often ends its lines with two characters, `\r` (carriage return) then `\n`. A `\` followed by `\r\n` is then not recognized by this filter. If the text may come from Windows, also test `p[1] == '\r' && p[2] == '\n'`, after first checking that `p[1]` is not the `'\0'`.

## A reusable function: `filter_chars`

When the criterion depends only on the character itself (is it a letter? a digit?), we write the loop **once** and pass the criterion to it as an argument. The criterion is a function, passed through a [function pointer](/?c=langages&s=c&p=pointeurs#function-pointers): `int (*keep)(int)` reads as "`keep` is a pointer to a function that receives an `int` and returns an `int`". The character is passed as an `int`, the convention of the functions of `<ctype.h>` (the standard library header that groups the tests on characters): `isalpha(c)` ([documentation](https://en.cppreference.com/w/c/string/byte/isalpha)) returns a non-zero value if `c` is a letter, `isdigit(c)` if it is a digit from 0 to 9, and 0 otherwise.

The criterion must receive the character's value **unsigned** (from 0 to 255). A `char` can be negative on many machines (this is the case for bytes above 127, which appear in the accents of a [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) text), and passing a negative value to `isalpha` is forbidden by the standard. Hence the conversion `(unsigned char)*p` before the call.

```c
#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Keeps in s the characters for which keep() returns true (non-zero).
// Modifies s in place and returns the new length.
size_t filter_chars(char *s, int (*keep)(int))
{
    const char *p = s;                  // READ pointer
    char       *out = s;                // WRITE pointer

    if (s == NULL || keep == NULL)      // nothing to filter, or no criterion
        return 0;
    while (*p != '\0') {                // walks the whole string
        if (keep((unsigned char)*p))    // the criterion judges the unsigned value
            *out++ = *p;                // kept: writes it, then advances out
        p++;                            // reading advances in every case
    }
    *out = '\0';                        // sets the new end of the string
    return (size_t)(out - s);           // new length
}

// A function of our own: true for a vowel (letters without accents).
int is_vowel(int c)
{
    return c != '\0' && strchr("aeiouyAEIOUY", c) != NULL;   // strchr('\0') would be true
}

int main(void)
{
    char   a[] = "Salut R2-D2, code 42";   // a text mixing letters, digits and signs
    char   b[] = "Salut R2-D2, code 42";   // one copy per filter: each changes its own
    char   c[] = "Salut R2-D2, code 42";
    size_t n;                           // length returned by filter_chars

    n = filter_chars(a, isalpha);       // isalpha: true for a letter
    printf("isalpha     : [%s] (%zu)\n", a, n);
    n = filter_chars(b, isdigit);       // isdigit: true for a digit from 0 to 9
    printf("isdigit     : [%s] (%zu)\n", b, n);
    n = filter_chars(c, is_vowel);      // our own criterion
    printf("is_vowel    : [%s] (%zu)\n", c, n);
    return 0;
}
```

```text
isalpha     : [SalutRDcode] (11)
isdigit     : [2242] (4)
is_vowel    : [auoe] (4)
```

`strchr(t, c)` looks for the character `c` in `t` (see [searching and comparing a string](/?c=langages&s=c&p=variables#searching-and-comparing-a-string-strcmp-strchr-strrchr-strstr)). It considers the final `'\0'` as part of `t`: `strchr("abc", '\0')` does not return `NULL`. In `filter_chars`, `is_vowel` never receives `'\0'`, but the guard `c != '\0'` avoids depending on its caller.

| Call | Criterion | Original text | Result |
|---|---|---|---|
| `filter_chars(a, isalpha)` | Keep the letters | `Salut R2-D2, code 42` | `SalutRDcode` |
| `filter_chars(b, isdigit)` | Keep the digits | `Salut R2-D2, code 42` | `2242` |
| `filter_chars(c, is_vowel)` | Keep the vowels | `Salut R2-D2, code 42` | `auoe` |

`filter_chars` does not replace the loops above, because its criterion sees **only one character at a time**:

| What you need to know to decide | Tool |
|---|---|
| The character alone (letter, digit, vowel) | `filter_chars` with a criterion |
| The last character already written (extra spaces) | A dedicated loop with `out[-1]` |
| The following characters (`\` then newline) | A dedicated loop with `p[1]` |

## When things go wrong: three attempts

### Filtering a string literal

A **string literal** is a text written between double quotes in the code ([documentation](https://en.cppreference.com/w/c/language/string_literal)). The compiler stores it in an area of memory that the program can only read. Two declarations that look alike therefore do not have the same value at all:

| Declaration | What it is | Modifiable? |
|---|---|---|
| `char s[] = "abc";` | An array of 4 `char`, a **copy** of the text | Yes |
| `char *s = "abc";` | A pointer to the literal, read-only | No: writing crashes |
| `const char *s = "abc";` | Same, but the compiler protects it | No: writing is refused at **compile time** |

```c
#include <stdio.h>

int main(void)
{
    char *literal = "abc";              // points to a literal, a read-only area
    char  copy[] = "abc";               // array: a modifiable copy of the text

    copy[0] = 'X';                      // allowed: we write in our own array
    printf("copy : %s\n", copy);
    fflush(stdout);                     // shows the line before a possible crash
    literal[0] = 'X';                   // forbidden: writing in the read-only area
    printf("literal : %s\n", literal);  // never reached
    return 0;
}
```

```text
copy : Xbc
AddressSanitizer:DEADLYSIGNAL
==28957==ERROR: AddressSanitizer: SEGV on unknown address 0x64b4603c5080 ...
==28957==The signal is caused by a WRITE memory access.
```

`fflush(stdout)` forces the immediate display of the text waiting to be written. The first access works, the second crashes the program: the system refuses the write into the protected area (a **segmentation fault**). Without the option `-fsanitize=address`, the result is the same, minus the report: the [shell](/?c=langages&s=bash&p=architecture-dun-shell) reports the segmentation fault and the program ends with status 139 (128 plus 11, the number of the signal of this error). The C language only says that the write has undefined behavior; the crash is what is observed here under Linux. With `const char *`, the same `literal[0] = 'X'` is refused at compilation (`error: assignment of read-only location`): see [`const` with pointers](/?c=langages&s=c&p=pointeurs#const-with-pointers). To filter a fixed text, first copy it into an array (`char s[] = "..."`).

### A write pointer that overtakes the read pointer

A filter that writes **more** characters than it reads makes `out` pass `p`, and it then overwrites characters it has not read yet. Here, each letter must be written twice; the loop is limited to 3 turns so that the attempt ends (without this limit, `p` would never meet the overwritten `'\0'`):

```c
#include <stdio.h>

int main(void)
{
    char  b[16] = "abc";                // 3 letters, then zeros
    char *p;                            // read pointer
    char *out = b;                      // write pointer

    for (p = b; p < b + 3; p++) {       // 3 turns: we read the 3 original letters
        *out++ = *p;                    // writes the letter read...
        *out++ = *p;                    // ...then writes it again: out overtakes p
    }
    printf("[%s]\n", b);                // expected: [aabbcc]
    return 0;
}
```

```text
[aaaaaa]
```

On turn 2, `p` reads cell 1, which turn 1 has already replaced with an `a`: the original `b` and `c` have disappeared before being read. To make a text longer, you need a **separate** destination, large enough (see [allocating memory](/?c=langages&s=c&p=memoire#allocating-memory-dynamically)), not the same array.

### Reading `out[-1]` before writing

Let us remove the `out == s` guard from `squeeze_spaces`, on the text `" a"` (a space then `a`). On the first turn, the test `*p != ' '` is false (it is a space), and the program evaluates `out[-1]`, the cell before the array. Compiled with `-fsanitize=address`, the program stops on:

```text
==29371==ERROR: AddressSanitizer: stack-buffer-underflow on address 0x74f8e130001f ...
READ of size 1 at 0x74f8e130001f thread T0
```

Without a sanitizer, the read outside the array goes unnoticed: the value read is that of a neighboring variable, and the result of the filter depends on chance. See [Sanitizers and Allocation Tests](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation).

## Pitfalls

| Pitfall | Why | Remedy |
|---|---|---|
| Filtering a literal (`char *s = "..."`) | Read-only area: crash on writing | `char s[] = "..."`, or copy first; declare `const char *` so that an error is caught at compilation |
| Forgetting `*out = '\0'` | The old end of the text reappears (`a bb`) | End after the loop, always |
| A filter that writes more than it reads | `out` passes `p` and overwrites unread text | Separate destination of known size |
| Reading `out[-1]` without a guard | Reading before the start of the array | Test `out == s` first, in a `\|\|` |
| Reading `p[1]` or `p[2]` without checking the end | Reading after the `'\0'` | Read `p[1]` only if `*p` is not `'\0'`, and `p[2]` only if `p[1]` is not one either |
| Confusing `*p++` and `(*p)++` | One advances the pointer, the other changes the pointed-to value | Remember that the `++` acts on what is stuck to it |
| Writing `*p++;` alone | `value computed is not used` warning: the value read is thrown away | `(*p)++` to increase the value |
| Modifying the caller's variable without saying so | The caller loses the original text | Document it above the function; copy the text first if it is still needed |
| Passing a negative `char` to `isalpha` | Undefined behavior according to the standard | `(unsigned char)*p` before the call |
| Filtering a UTF-8 text byte by byte | An accented character takes several bytes: removing one breaks the character | Only filter text without accents; otherwise use a treatment designed for [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes#the-consequence-a-character-a-byte) |
| Passing `NULL` | Dereferencing `NULL` crashes | Test `s == NULL` at the start of the function |
| Modifying and reading a variable in the same expression (`*out++ = *out`) | The language does not impose the order: undefined behavior | Split it into two statements |
| Calling `strlen` on each turn | Falls back into a quadratic cost, see [three performance and memory-reading pitfalls](/?c=langages&s=c&p=memoire#three-performance-and-memory-reading-pitfalls) | Compute the length with `out - s` |

## Best practices

| Best practice | Why |
|---|---|
| A read pointer `const char *p` and a write pointer `char *out`, named this way | The compiler forbids writing through the wrong pointer; the code reads at a glance |
| Keep the invariant `out <= p` in mind before writing a filter | A filter that only removes or keeps is safe; beyond that, change method |
| Write `*out = '\0'` right after the loop | The result string is always terminated |
| Return `(size_t)(out - s)` | The caller gets the new length without walking the text again |
| Document above the function that `s` is modified | The caller knows it loses the original text |
| Test `s == NULL` and `keep == NULL` at the start of the function | No crash on a missing input |
| Write the generic loop once (`filter_chars`) for single-character criteria | A single loop to check |
| Try each filter with an empty string, a single character, a text removed entirely, under `-fsanitize=address,undefined` | The edges (start, end, `'\0'`) are where filters go wrong |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | Filtering in place means walking the text with a read pointer `p` and copying what you keep with a write pointer `out`, toward the start of the same array: a single pass, no allocation, linear cost, against a quadratic cost for shifting at each removal. `out <= p` as long as the filter does not write more than it reads. `*out++ = *p` writes, then advances `out` (the postfix `++` comes before the `*`). `*p++` reads, then advances the pointer; `(*p)++` increases the pointed-to value; `*++p` advances, then reads; `++*p` increases, then reads. `*out = '\0'` must be set after the loop. `out - s` is the new length, of type `ptrdiff_t`, counted in cells and not in bytes. A filter that looks ahead reads `p[1]`, without going past the terminator. |
| **Pitfalls to avoid** | Filtering a literal (`char *s = "..."`); forgetting the final `'\0'`; making `out` pass `p`; reading `out[-1]` at the start; reading `p[2]` without having tested `p[1]`; confusing `*p++` and `(*p)++`; modifying the caller's text without documenting it; passing a negative `char` to `isalpha`; filtering UTF-8 byte by byte. |
| **Best practices** | `const char *p` to read, `char *out` to write; `*out = '\0'` right after the loop; returning `(size_t)(out - s)`; `filter_chars(s, criterion)` for single-character criteria, a dedicated loop otherwise; edge tests under `-fsanitize=address,undefined`; documentation: [`memmove`](https://en.cppreference.com/w/c/string/byte/memmove), [operator precedence](https://en.cppreference.com/w/c/language/operator_precedence), [`ptrdiff_t`](https://en.cppreference.com/w/c/types/ptrdiff_t), [`isalpha`](https://en.cppreference.com/w/c/string/byte/isalpha). |
