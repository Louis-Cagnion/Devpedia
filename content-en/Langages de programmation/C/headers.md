---
order: 6
---

# Header files (.h)

A header file (`.h`) contains **declarations**—it states, “This function/variable/structure exists, and here is its signature,” without providing its implementation. It allows multiple files `.c` to share the same definitions without duplicating them, and serves as a contract between a file that provides a feature and the files that use it.

## Statement vs. Definition

```
// calculs.h — déclaration : "cette fonction existe, voici sa signature"
int addition(int a, int b);
```

```
// calculs.c — définition : le vrai corps de la fonction
#include "calculs.h"

int addition(int a, int b)
{
    return a + b;
}
```

```
// main.c — utilisation, via le header
#include "calculs.h"

int main(void)
{
    printf("%d\n", addition(2, 3));
}
```

`main.c` You only need to know the **signature** of `addition()` (via `#include "calculs.h"`) to call it—the actual body is provided at link time (see the chapter on compilation), from the object file compiled from `calculs.c`.

## `#include <...>` vs`#include "..."`

```
#include <stdio.h>   // chevrons : cherche dans les répertoires système (bibliothèque standard)
#include "calculs.h" // guillemets : cherche d'abord dans le répertoire courant du projet
```

## Include guards

The same header can be included indirectly multiple times (e.g., `a.h` includes `commun.h`, and `b.h` also includes `commun.h`, and `main.c` includes `a.h` and `b.h`) — without protection, its declarations would be duplicated and cause a compilation error ("redefinition"). An **include guard** prevents a header from being processed more than once by the preprocessor:

```
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- First inclusion: `CALCULS_H` is not yet defined → all content is included, and `CALCULS_H` is defined.
- Next include (same file, in a different include chain): `CALCULS_H` is already defined → the preprocessor skips directly to `#endif`; the content is not duplicated.

A shorter alternative, supported by virtually all modern compilers although not guaranteed by the C standard:

```
#pragma once

int addition(int a, int b);
```

> **Note:** A header file must contain only **declarations** (function prototypes, `struct`, `typedef`, constants), never the body of a non-`static` or non-`inline` function—otherwise, every `.c` file that includes it would get its own copy of the definition, causing a "multiple definition" error during linking.
