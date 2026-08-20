---
order: 21
---

# Formatted Reading: `scanf` and `sscanf`

The chapter on [variadic functions](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) covers `printf`: converting typed values into a formatted string. `scanf` (and its variant `sscanf`) performs the **opposite** operation: extracting typed values from a string, following a given format.

## `sscanf`: Extracting Values from a String

```c
#include <stdio.h>

int jour, mois, annee;
int trouves = sscanf("25/12/2026", "%d/%d/%d", &jour, &mois, &annee);

// trouves is 3: jour=25, mois=12, annee=2026
```

`sscanf` reads the source string by comparing it against the given format: each `%d`/`%s`/`%f`... consumes the corresponding part of the string and writes the converted value to the provided address (hence the `&` before each variable, as with any output pointer in C). Format characters that are **not** a specifier (the `/` here) must appear **exactly as they are** in the source string for parsing to continue.

| Specifier | Expected type | Example source string |
|---|---|---|
| `%d` | `int` | `"42"` |
| `%f` | `float` | `"3.14"` |
| `%c` | `char` (a single character) | `"a"` |
| `%s` | String (`char*`), stops at the first space | `"bonjour"` |

## The Return Value: The Number of Fields Actually Read

`sscanf` returns the **number of successful conversions**, not a simple binary success/failure: essential information, because parsing can stop partway through the format without producing any visible error:

```c
int jour, mois, annee;
int trouves = sscanf("25-12", "%d/%d/%d", &jour, &mois, &annee);

// trouves is 0: the expected first "/" does not match the actual "-",
// parsing stops before even reading "jour" -> jour remains UNINITIALIZED
```

> **Pitfall:** ignoring the return value of `sscanf` and directly using the variables that were supposed to be filled. If the format does not fully match the source string, some variables are **never written**: reading them afterward reads an uninitialized value, undefined behavior that may work "by luck" in testing and fail silently elsewhere.
>
> **Best practice:** always compare the return value of `sscanf` to the expected number of fields before using the filled variables, exactly as you would check the return code of any system call (see [the chapter on system calls](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)).

## `%s` Without a Limit: A Buffer Overflow Risk

Unlike `%d`/`%f`, which always write a fixed size, `%s` copies a string of **variable length** into the provided buffer, without ever checking its size:

```c
char nom[16];
sscanf(entree_utilisateur, "%s", nom);   // if entree_utilisateur is longer than 15 characters: buffer overflow
```

> **Pitfall:** the same class of vulnerability already encountered with `printf`'s format strings (see the chapter on [variadic functions](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)): unchecked input that exceeds the buffer size writes outside the memory allocated for it.
>
> **Best practice:** always bound `%s` with an explicit maximum width, `%15s` for a 16-byte buffer (15 characters plus the final `\0`), never a bare `%s` on input whose size isn't guaranteed.

## Reimplementing `sscanf`: A Classic Exercise

Writing your own simplified version of `sscanf` (often named `ft_sscanf` in exercises that require it) is a common exercise for understanding this mechanism from the inside: the function itself must be [variadic](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) (it receives a variable number of output pointers, guided like `printf` by the `%` in the format string), and must walk through the source string and the format string simultaneously, character by character, advancing in one of them only when a format specifier matches.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `sscanf` extracts typed values from a string according to a format, the opposite operation of `printf`. Its return value indicates the number of fields actually read, not a simple success/failure. |
| **Tools you can use** | `sscanf(source, format, ...)`, an explicit maximum width (`%15s`) to bound a string read. |
| **Pitfalls to avoid** | Using a variable without checking that `sscanf` actually filled it. Reading a string with `%s` with no size limit on unchecked input. |
| **Best practices** | Always compare the return value of `sscanf` to the expected number of fields. Always bound `%s` with an explicit maximum width. |
