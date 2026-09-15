---
order: 10
---

# Header files (.h)

A header file (`.h`) contains **declarations**: it states, “This function/variable/structure exists, and here is its signature,” without providing its implementation. It allows multiple files `.c` to share the same definitions without duplicating them, and serves as a contract between a file that provides a feature and the files that use it.

## Statement vs. Definition

```c
// calculs.h, declaration: "this function exists, here is its signature"
int addition(int a, int b);
```

```c
// calculs.c, definition: the actual body of the function
#include "calculs.h"

int addition(int a, int b)
{
    return a + b;
}
```

```c
// main.c, usage, via the header
#include "calculs.h"

int main(void)
{
    printf("%d\n", addition(2, 3));
}
```

`main.c` only needs to know the **signature** of `addition()` (via `#include "calculs.h"`) to call it: the actual body is provided at [link time](/?c=langages-de-programmation&s=c&p=compilation), from the object file compiled from `calculs.c`.

## `#include <...>` vs `#include "..."`

```c
#include <stdio.h>   // angle brackets: searches the system directories (standard library)
#include "calculs.h" // quotes: searches the project's current directory first
```

## Include guards

The same header can be included indirectly multiple times (e.g., `a.h` includes `commun.h`, and `b.h` also includes `commun.h`, and `main.c` includes `a.h` and `b.h`): without protection, its declarations would be duplicated and cause a compilation error ("redefinition"). An **include guard** prevents a header from being processed more than once by the preprocessor:

```c
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- First inclusion: `CALCULS_H` is not yet defined → all content is included, and `CALCULS_H` is defined.
- Next include (same file, in a different include chain): `CALCULS_H` is already defined → the preprocessor skips directly to `#endif`; the content is not duplicated.

A shorter alternative, supported by virtually all modern compilers although not guaranteed by the C standard:

```c
#pragma once

int addition(int a, int b);
```

> **Note:** A header file must contain only **declarations** (function prototypes, `struct`, `typedef`, constants), never the body of a non-`static` or non-`inline` function; otherwise, every `.c` file that includes it would get its own copy of the definition, causing a "multiple definition" error during linking.

## How `#include` and `-I` actually combine

The preprocessor never "guesses" where an included file lives: for `#include "glad/glad.h"`, it **literally** concatenates each folder passed via [`-I`](/?c=langages&s=c&p=makefiles) with the path written after `#include`, and tests each result until it finds a file that exists:

```text
-I includes  +  #include "glad/glad.h"
   ↓
includes/glad/glad.h   <- path actually tested on disk
```

> **Pitfall:** pointing `-I` at the folder that directly contains `glad.h` (e.g. `-I includes/glad`) rather than its parent (`-I includes`), while the code writes `#include "glad/glad.h"`. The concatenation then gives `includes/glad/glad/glad.h`, which doesn't exist: the compiler fails with "file not found", for a path that looks correct at a glance if you only think in terms of "where the file is", without reconstructing the exact concatenation.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A header (`.h`) contains declarations, not definitions: it lets several `.c` files share the same signatures without duplicating them. The preprocessor resolves `#include "..."` by literally concatenating each `-I` folder with the written path. |
| **Tools you can use** | `#include <...>` (system library) vs `#include "..."` (project file); include guards (`#ifndef`/`#define`/`#endif` or `#pragma once`). |
| **Pitfalls to avoid** | Putting a function's body in a header: causes a "multiple definition" error as soon as several files include it. Pointing `-I` at the wrong folder level, which breaks the concatenation with the `#include` path. |
| **Best practices** | Always protect a header with an include guard, to support multiple indirect inclusions without error. |
