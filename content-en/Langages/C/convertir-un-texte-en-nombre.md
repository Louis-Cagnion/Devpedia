---
order: 28
---

# Converting Text to a Number Without the `atoi` Trap

A number that comes from outside (an argument on [the command line](/?c=langages-de-programmation&s=c&p=argc-et-argv), a file, user input) always arrives as **text**: it has to be converted. `atoi()` and `atof()`, presented in [Converting a String to a Number](/?c=langages-de-programmation&s=c&p=variables#converting-a-string-to-a-number-atof-atoi), do the job but detect no error. This chapter shows how to validate the conversion with `strtol()` and `strtod()`.

## What `atoi()` lets through

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    printf("%d\n", atoi("abc"));          // 0: invalid text, no signal
    printf("%d\n", atoi("12abc"));        // 12: the extra text is ignored
    printf("%d\n", atoi("4294967297"));   // 1: too large for an int, no signal
    return 0;
}
```

| Input | `atoi()` returns | What should happen |
|---|---|---|
| `"abc"` | `0` | Rejection: this is not a number. |
| `"12abc"` | `12` | Rejection: text follows the number. |
| `"4294967297"` | `1` | Rejection: the value overflows (2^32 + 1 wraps to `1` on 32 bits). |
| `"0"` | `0` | Accepted. Impossible to tell apart from `"abc"`. |

## `strtol()`: returning the number **and** where reading stopped

```c
long strtol(const char *text, char **rest, int base);
double strtod(const char *text, char **rest);
```

| Parameter or return | Content |
|---|---|
| `text` | The text to convert. |
| `rest` | Address of a pointer the function fills in: it designates the **first character not read**. |
| `base` | `10` for decimal, `16` for hexadecimal, `0` to detect `0x…` and `0…`. |
| Return | The value read (`0` if nothing could be read). |

```
text  ->  "12abc"
           ^ ^
           | rest (first character not read: 'a')
           text
```

The `rest` pointer allows three checks that `atoi()` never gives:

| Check | Test |
|---|---|
| No digit read | `rest == text` |
| Extra text after the number | `*rest != '\0'` |
| Empty text | `*text == '\0'` (covered by the first test) |

## Overflows: `errno` and `ERANGE`

When the value does not fit in a `long`, `strtol()` returns `LONG_MAX` or `LONG_MIN` and sets [`errno`](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#report-an-error-errno) to `ERANGE`. Since successful functions never reset `errno`, you **reset it to zero yourself before the call**, otherwise an old error would be mistaken for the new one.

## A complete conversion function

```c
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* Converts text to an integer in [min, max]. Returns 0 if valid, -1 otherwise. */
int parse_long(const char *text, long min, long max, long *result)
{
    char *rest;
    long value;

    errno = 0;                                     // reset before the call
    value = strtol(text, &rest, 10);
    if (rest == text)                              // no digit read (empty text included)
        return (fprintf(stderr, "\"%s\": no digit\n", text), -1);
    if (*rest != '\0')                             // text remains after the number
        return (fprintf(stderr, "\"%s\": extra text \"%s\"\n", text, rest), -1);
    if (errno == ERANGE)                           // does not fit in a long
        return (fprintf(stderr, "\"%s\": outside the range of a long\n", text), -1);
    if (value < min || value > max)                // outside the program's domain
        return (fprintf(stderr, "\"%s\": outside [%ld, %ld]\n", text, min, max), -1);
    *result = value;
    return (0);
}
```

Each failure cause has **its own message** that names the faulty text: the user knows what to fix.

Result on a few inputs, for a range from 0 to 100:

| Input | Result |
|---|---|
| `"42"` | `42` |
| `"abc"` | `no digit` |
| `"12abc"` | `extra text "abc"` |
| `"4294967297"` | `outside [0, 100]` (fits in a 64-bit `long`, but not in the domain) |
| `"99999999999999999999"` | `outside the range of a long` |
| `""` | `no digit` |
| `"-3"` | `outside [0, 100]` |

## Decimal numbers: `strtod()`, `NaN` and `inf`

`strtod()` follows the same pattern, with two more traps.

```c
/* Converts text to a finite double in [min, max]. Returns 0 if valid, -1 otherwise. */
int parse_double(const char *text, double min, double max, double *result)
{
    char *rest;
    double value;

    errno = 0;
    value = strtod(text, &rest);
    if (rest == text)
        return (fprintf(stderr, "\"%s\": no number\n", text), -1);
    if (*rest != '\0')
        return (fprintf(stderr, "\"%s\": extra text \"%s\"\n", text, rest), -1);
    if (errno == ERANGE || !isfinite(value))       // 1e999 -> inf; "nan" and "inf" are accepted
        return (fprintf(stderr, "\"%s\": non-finite value or out of range\n", text), -1);
    if (value < min || value > max)
        return (fprintf(stderr, "\"%s\": outside [%g, %g]\n", text, min, max), -1);
    *result = value;
    return (0);
}
```

| Trap | Explanation |
|---|---|
| `"nan"` and `"inf"` | `strtod()` accepts them as valid numbers. A `NaN` then passes **every comparison without error** (`NaN < 0` and `NaN > 1` are both false), so the range test does not see it: `isfinite()` (`<math.h>`) is essential. |
| `"1e999"` | Overflows to `inf`: `errno` is `ERANGE`. |
| `"0,5"` | With the program's default locale (`"C"`), the comma is not a decimal separator: `strtod()` reads `0` and `rest` points to `",5"`, which the `*rest != '\0'` test catches. |
| Value for a `float` | A finite `double` can exceed a `float` (`1e39`): bound it to the real range of the destination type. |

## Bounding each value to its domain

The type does not say what the program accepts. A transparency goes from `0` to `1`, a number of threads from `1` to a few dozen, an array size cannot be negative: the `[min, max]` range passed to the function checks it right at the conversion, with a dedicated message, rather than letting an absurd value spread through the program.

Other behaviors to know:

| Behavior | Consequence |
|---|---|
| `strtol()` skips whitespace **at the start** (`"  7"` gives `7`) | Accepted. To reject it, test `isspace(*text)` before the call. |
| `strtol()` accepts a `+` or `-` sign | `"-3"` is valid: only the range rejects it. |
| Base `0` | `"010"` is `8` (octal) and `"0x1F"` is `31`: avoid it for user input. |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `atoi()`/`atof()` return `0` on invalid text, ignore extra text and overflow without warning. `strtol()`/`strtod()` give a `rest` pointer to the first character not read, and set `errno` to `ERANGE` on overflow. |
| **Tools you can use** | `strtol()`, `strtod()` (`<stdlib.h>`), `errno` and `ERANGE` (`<errno.h>`), `isfinite()` (`<math.h>`). |
| **Pitfalls to avoid** | Forgetting `errno = 0` before the call. Not testing `rest == text` (empty text or no digit) nor `*rest != '\0'` (extra text). Accepting `NaN` and `inf`: they pass every range test. Converting externally supplied data with `atoi()`. |
| **Best practices** | Isolate the conversion in a single function that returns a status and takes the domain's range as parameters. One error message per cause, naming the faulty text. Reject the value rather than silently fix it. |
