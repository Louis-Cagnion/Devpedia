---
order: 10
---

# Variadic Functions (va_list)

A **variadic** function accepts a variable number of arguments—`printf("%d %s\n", 42, "texte")` is the best-known example: `printf` accepts 1, 2, or 10 arguments, depending on the format provided. In C, this mechanism is made possible by the macros in `<stdarg.h>`.

## Declare a variadic function

A variadic function always has at least one fixed parameter, followed by`...`:

```
#include <stdarg.h>

int somme(int nombre, ...)
{
    va_list arguments;
    va_start(arguments, nombre); // "nombre" est le dernier paramètre fixe, juste avant les "..."

    int total = 0;
    for (int i = 0; i < nombre; i++) {
        total += va_arg(arguments, int); // récupère l'argument suivant, en le traitant comme un int
    }

    va_end(arguments);
    return total;
}

somme(3, 10, 20, 30); // 60 -> nombre = 3, les 3 arguments suivants sont additionnés
```

## `<stdarg.h>`'s Macros

| Macro | Role |
|---|---|
| `va_list` | Type representing the list of variable arguments |
| `va_start(liste, dernierParamFixe)` | Initializes the list based on the last known fixed parameter |
| `va_arg(liste, type)` | Retrieves the following argument, assuming it is from the specified `type` |
| `va_end(liste)` | Cleanly terminates the use of the list |

> **Note:** There is no way for the compiler to verify that the `type` passed to `va_arg()` actually matches the type of the argument provided by the caller—this is entirely the developer’s responsibility. Passing the wrong type (e.g., reading a `int` when a `double` was provided) results in undefined behavior that is not detected at compile time.

## How does `printf` know the number of arguments?

`printf` has no **built-in way** of knowing how many variable arguments were provided: the format string itself serves as a guide, by counting the number of `%` it contains.

```
printf("%d %d %d\n", 1, 2, 3); // la chaîne annonce 3 valeurs -> printf lit 3 arguments variadiques
```

> **Note:** This is why an incorrect number of `%` compared to the actual arguments (or vice versa) does not cause **a compilation error**—only undefined behavior at runtime (reading data that is not actual arguments). This is a classic source of security vulnerabilities (“format string vulnerabilities”) when a format string comes directly from unchecked user input.

## One limitation: the number of arguments must be specified in another way

Unlike `printf` (which is guided by the format string), the example `somme()` above must explicitly receive the number of arguments as its first parameter (`nombre`) — `va_list` alone does not allow you to know "how many arguments are left"; you always need an external means of communicating this (a counter, a sentinel value such as `NULL` as the last argument, or a format string).
