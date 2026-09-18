---
order: 14
---

# Variadic Functions (va_list)

A **variadic** function accepts a variable number of arguments; `printf("%d %s\n", 42, "text")` is the best-known example: `printf` accepts 1, 2, or 10 arguments, depending on the format provided. In C, this mechanism is made possible by the macros in `<stdarg.h>`.

## Declare a variadic function

A variadic function always has at least one fixed parameter, followed by `...`:

```c
#include <stdarg.h>

int somme(int number, ...)
{
    va_list arguments;
    va_start(arguments, number); // "number" is the last fixed parameter, right before "..."

    int total = 0;
    for (int i = 0; i < number; i++) {
        total += va_arg(arguments, int); // retrieves the next argument, treating it as an int
    }

    va_end(arguments);
    return total;
}

somme(3, 10, 20, 30); // 60 -> number = 3, the next 3 arguments are added together
```

## `<stdarg.h>`'s Macros

| Macro | Role |
|---|---|
| `va_list` | Type representing the list of variable arguments |
| `va_start(list, dernierParamFixe)` | Initializes the list based on the last known fixed parameter |
| `va_arg(list, type)` | Retrieves the following argument, assuming it is from the specified `type` |
| `va_end(list)` | Cleanly terminates the use of the list |

> **Note:** There is no way for the compiler to verify that the `type` passed to `va_arg()` actually matches the type of the argument provided by the caller: this is entirely the developer’s responsibility. Passing the wrong type (e.g., reading a `int` when a `double` was provided) results in undefined behavior that is not detected at compile time.

## How does `printf` know the number of arguments?

`printf` has no **built-in way** of knowing how many variable arguments were provided: the format string itself serves as a guide, by counting the number of `%` it contains.

```c
printf("%d %d %d\n", 1, 2, 3); // the string announces 3 values -> printf reads 3 variadic arguments
```

> **Note:** This is why an incorrect number of `%` compared to the actual arguments (or vice versa) does not cause **a compilation error**: only undefined behavior at runtime (reading data that is not actual arguments). This is a classic source of security vulnerabilities (“format string vulnerabilities”) when a format string comes directly from unchecked user input.

## The `printf` Format Mini-Language

Every `%` introduces a precise syntax that must be reparsed character by character, far richer than a single conversion letter:

```text
%[flags][width][.precision]conversion
```

```c
printf("%-10d|\n", 42);     // "42        |" -> '-': LEFT-justified (default: right)
printf("%010d\n", 42);      // "0000000042"  -> '0': pads with zeros instead of spaces
printf("%#x\n", 255);       // "0xff"        -> '#': alternate form (0x/0X prefix for x/X)
printf("%+d\n", 42);        // "+42"         -> '+': forces the sign to be shown, even when positive

printf("%10d\n", 42);       // "        42" -> MINIMUM width: padded with spaces if needed
printf("%.3d\n", 5);        // "005"        -> precision on an integer: minimum number of digits

printf("%*d\n", 10, 42);    // equivalent to "%10d" -> '*': the width is read from the arguments, not hardcoded
```

| Element | Role |
|---|---|
| Flags (`-`, `0`, `#`, `+`, space) | Change alignment, padding or presentation, combinable with each other |
| Width (number or `*`) | Minimum number of characters displayed (padded with spaces or zeros) |
| Precision (`.` followed by a number) | Minimum number of digits for an integer, maximum length for a string (`%s`) |
| Conversion (`d`/`i`/`u`/`x`/`X`/`s`/`c`/`p`/`%`) | The type of value to display |

> **Note:** this mini-language explains why reimplementing `printf` (as in the `ft_printf` project) requires a genuine little parser: after each `%` encountered, it must recognize, in order, any flags present, an optional width, an optional precision, then the conversion letter that closes the sequence -- every one of these elements is optional except the final conversion.

## One limitation: the number of arguments must be specified in another way

Unlike `printf` (which is guided by the format string), the example `somme()` above must explicitly receive the number of arguments as its first parameter (`number`): `va_list` alone does not allow you to know "how many arguments are left"; you always need an external means of communicating this (a counter, a sentinel value such as `NULL` as the last argument, or a format string).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A variadic function (`...`) accepts a variable number of arguments, read via the `<stdarg.h>` macros (`va_list`, `va_start`, `va_arg`, `va_end`). The number of arguments must always be communicated by some external means. |
| **Tools you can use** | `va_list`, `va_start`, `va_arg`, `va_end`; `printf` format syntax `%[flags][width][.precision]conversion`. |
| **Pitfalls to avoid** | Passing `va_arg()` a type different from the one actually provided by the caller: undefined behavior, not detected at compile time. |
| **Best practices** | Never build a format string from unchecked user input: a classic source of a "format string vulnerability". |
