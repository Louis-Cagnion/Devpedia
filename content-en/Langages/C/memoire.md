---
order: 9
---

# Memory Management

Unlike languages such as [PHP](/?c=langages-de-programmation&s=php&p=php) or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), which automatically manage memory using a garbage collector, C places the full responsibility for allocating and freeing the memory required by the program on the developer. This is what enables high performance and fine-grained control over resources, at the cost of requiring constant vigilance.

## Stack and Heap

A C program has two main memory areas for its data:

| | Stack | Heap |
|---|---|---|
| Management | Automatic (local variables) | Manual (`malloc` / `free`) |
| Lifespan | The duration of the current block/function | Until an explicit `free()` |
| Size | Limited, set at program startup | Limited by available RAM/swap |
| Speed | Very fast (simply moving a pointer) | Slower (searching for a free location) |

```c
void exemple(void)
{
    int x = 5;            // sur la stack, libéré automatiquement à la fin de la fonction
    int *p = malloc(sizeof(int)); // sur le heap, reste alloué jusqu'à free(p)
    *p = 5;
    free(p);
}
```

## Variable-Length Arrays (VLA)

A VLA (Variable-Length Array, [C99](https://en.wikipedia.org/wiki/C99)) is an array declared like an ordinary local variable (`int tab[n];`), but whose size `n` is an expression only known at runtime, not a compile-time constant. Unlike `malloc()` (see below), it stays on the stack: no `free()` needed, its memory is released automatically at the end of the block that contains it.

```c
void example(int n)
{
    int tab[n]; // size decided at call time, not at compilation

    for (int i = 0; i < n; i++)
        tab[i] = i;
} // tab disappears here, like any local variable -- no free() needed
```

### Pitfall 1: parameter order

When a VLA is a function parameter, its size (`n`) must be declared **before** it in the parameter list:

```c
void build(int n, int tab[n]); // correct: n already exists when tab is declared
void build(int tab[n], int n); // compile error: n is unknown at this point
```

The compiler reads parameters left to right: by the time it needs to compute `tab`'s size, `n` must already have been seen.

### Pitfall 2: `T (*)[n]` is not `T **`

A two-dimensional VLA passed as a parameter, like `uint16_t mask[n][n]`, does **not** convert to a plain pointer to a pointer (`uint16_t **`). It converts to a pointer to an array of `n` elements: `uint16_t (*)[n]`.

| | `T (*)[n]` (VLA parameter) | `T **` (array of pointers) |
|---|---|---|
| Memory | One contiguous block of `n * n` elements | `n` separate blocks, each allocated independently |
| Declaration | `void f(int n, T tab[n][n])` | `void f(T **tab)` |
| Access `tab[i][j]` | Offset computed within the single block | Dereference `tab[i]`, then access within its own block |

Mixing up the two types gives an explicit compile error (`conflicting types`, or `makes pointer from integer without a cast`): the compiler refuses to pass a `T **` where a `T (*)[n]` is expected, and vice versa.

### Other limitations to know

| Limitation | Detail |
|---|---|
| No failure check | Unlike `malloc()` (see below), an oversized VLA doesn't return `NULL`: it causes a stack overflow, undefined behavior, without warning |
| Fixed size after declaration | Unlike `realloc()` (see below), a VLA can't be resized once declared |
| Availability | Made optional by [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)): a strictly conforming compiler may refuse to support them (check the `__STDC_NO_VLA__` macro) |

See also [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs); understanding that chapter is a prerequisite for this one.

## Allocating Memory Dynamically

`malloc()` allocates a block of raw memory on the heap, the size of which is expressed in bytes:

```c
int *tab = malloc(5 * sizeof(int)); // réserve la place pour 5 entiers

if (tab == NULL) {
    // malloc a échoué (mémoire insuffisante) -> tab vaut NULL, à toujours vérifier
    return;
}

for (int i = 0; i < 5; i++) {
    tab[i] = i * 10;
}
```

> **Note:** `malloc()` **does not** **reset** the allocated memory; it may contain any residual values ("garbage"). `calloc(number, taille)` does the same thing as `malloc(number * taille)`, but also sets all bytes to zero.

```c
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Resizing a block: `realloc()`

```c
int *tab = malloc(3 * sizeof(int));
// ... on a besoin de plus de place ...
int *nouveauTab = realloc(tab, 6 * sizeof(int));

if (nouveauTab == NULL) {
    // realloc a échoué : l'ancien bloc "tab" est toujours valide, ne pas le perdre
    free(tab);
    return;
}
tab = nouveauTab; // le bloc a pu être déplacé ailleurs en mémoire
```

`realloc()` preserves the existing content (truncated if the new size is smaller), but may move the block in memory if necessary: that's why we never reassign `tab` directly before verifying that `realloc()` did not return `NULL`.

## Free Up Memory: `free()`

Each successful `malloc()` / `calloc()` / `realloc()` must correspond to exactly one `free()`, when the block is no longer needed:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## Many Small Objects: Arena Allocation

Calling `malloc()` for each of millions of small objects is costly: each call takes time, and the objects end up scattered in memory. An **arena** stores all these objects **one after another in a single large array**, grown by doubling with `realloc()`, and each object is designated by its **position** in that array.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    int    *data;                            // a single large array for everything
    size_t  size;                            // cells used
    size_t  capacity;                        // cells reserved
} t_arena;

// Stores n integers one after another in the arena; returns their position, or (size_t)-1
size_t arena_add(t_arena *a, const int *values, size_t n)
{
    size_t capacity = a->capacity ? a->capacity : 1024;
    while (a->size + n > capacity)
        capacity *= 2;                       // doubling: few reallocs overall
    if (capacity != a->capacity) {
        int *grown = realloc(a->data, capacity * sizeof(int));
        if (!grown)
            return (size_t)-1;               // failure: the arena stays intact
        a->data = grown;
        a->capacity = capacity;
    }
    memcpy(a->data + a->size, values, n * sizeof(int));
    a->size += n;
    return a->size - n;                      // a position, not a pointer
}
```

| | One `malloc()` per object | Arena |
|---|---|---|
| Number of allocations | One per object | A handful (the array doubles in size) |
| Location in memory | Scattered | Contiguous: the processor reads neighboring objects in one go |
| Freeing | One `free()` per object | A single `free()` for everything |
| Removing an object | `free()` | Leaves a hole: you must **compact** yourself (shift everything) |

> **Pitfall:** keep a **position**, not a pointer, because `realloc()` can move the whole array elsewhere in memory: a pointer to the old location would become invalid (see [Resizing a block](#resizing-a-block-realloc)), whereas a position stays correct.

## The Four Classic Memory Bugs

| Bug | Cause | Consequence |
|---|---|---|
| **Memory leak** | A block of *memory* `malloc` is never `free()` | The amount of memory used by the program increases but never decreases |
| **Use-after-free** | The program dereferences a pointer after it has been "`free()`" | Undefined behavior: corrupted data, crash, or worse, it silently "works" |
| **Double free** | `free()` called twice on the same pointer | Memory manager corruption, often resulting in a delayed crash that is difficult to trace |
| **Buffer overflow** | Writing beyond the size actually allocated for a buffer | Corruption of adjacent memory, and an open door to arbitrary code execution (see below) |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free: undefined behavior
```

> **Note:** These bugs do not always cause an immediate, visible crash, which is what makes them difficult to detect. A tool like [**Valgrind**](https://valgrind.org) (`valgrind ./my_program`) runs the program and reports memory leaks and invalid accesses in detail, along with the line of code responsible.

## Buffer overflow: a bug with security consequences

Unlike the three previous bugs (which corrupt the program's own memory, with no outside intent), a buffer overflow is often **the result of input controlled by an attacker**: which historically makes it one of the most exploited security flaws in C/[C++](/?c=langages-de-programmation&s=cpp&p=cpp).

```c
char buffer[16];
strcpy(buffer, user_input); // NO check at all on the size of user_input
```

If `user_input` exceeds 16 bytes, `strcpy()` keeps writing past `buffer`'s bounds, into the memory that immediately follows on the stack, which may hold other local variables, or the current function's **return address** (the spot the program must resume at after the `return`). An attacker who precisely controls the written content can, in the worst case, overwrite this return address with one of their choosing, hijacking the program's execution flow toward code they control (*stack smashing*).

> **Note:** this is the same principle as an [SQL injection](/?c=langages-de-programmation&s=php&p=securite) or a [Bash command injection](/?c=shells&s=bash&p=variables): uncontrolled input that alters the **structure** of what will run, instead of staying passive data.

### Protecting against it

```c
strcpy(buffer, input);                       // dangerous: no limit at all
strncpy(buffer, input, sizeof(buffer) - 1);  // bounded to the buffer's actual size
// strncpy doesn't guarantee termination if the source is too long
buffer[sizeof(buffer) - 1] = '\0';

// bounded reading right from input, rather than fixing it up afterward
fgets(buffer, sizeof(buffer), stdin);
```

| Risky function | Bounded alternative |
|---|---|
| `strcpy()` | `strncpy()` (watch out for termination, see above) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (truncates rather than overflowing) |
| `gets()` | `fgets()` (`gets()` was in fact removed from the C standard as of [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisely for this reason) |

> **Note:** bounding the size only solves half the problem: you also need to check that the truncated data stays coherent for the rest of the program (a filename cut halfway by `strncpy` remains a syntactically valid filename, just an incorrect one). The right reflex is to always know, at every write, the destination buffer's actual size; never assume an input will respect an expected size without checking it.

### The BSD `strlcpy`/`strlcat` Family

Originally from BSD (not standard C, but available on macOS/\*BSD, and easy to reimplement yourself, as the `libft` library does with `ft_strlcpy`/`ft_strlcat`), these functions fix `strncpy`/`strcat`'s weak spot: detecting truncation.

```c
// ALWAYS null-terminates, unlike strncpy
size_t needed = strlcpy(buffer, input, sizeof(buffer));

if (needed >= sizeof(buffer))
{
    // input was truncated: needed is the size the full copy would have taken
}
```

`strlcpy()`/`strlcat()` always return the size the source (or concatenated) string would need if the buffer had been big enough, never the number of bytes actually written: comparing this value to `sizeof(buffer)` detects a truncation, which `strncpy()`/`strcat()` don't let you do directly.

## `sizeof`

`sizeof` is not a function but an operator evaluated at compile time: it returns the size in bytes of a type or variable, which is essential for correctly calculating the amount of memory to allocate:

```c
sizeof(int);       // generally 4
sizeof(char);      // always 1, by definition of the C standard
sizeof(int) * 10;  // size needed for 10 integers -> pass this to malloc()
```

See also [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs); understanding that chapter is a prerequisite for this one.

## Copying and Filling Bytes: `memcpy()` and `memset()`

These two functions from `<string.h>` work on **raw bytes**, without knowing the type of the data:

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    int arr[5];
    memset(arr, 0, sizeof arr);              // sets the 20 bytes to 0: 5 integers at 0
    int copy[5];
    memcpy(copy, arr, sizeof arr);           // copies the 20 bytes of arr into copy
    memset(arr, 1, sizeof arr);              // pitfall: each BYTE is 1
    printf("%d\n", arr[0]);                  // 16843009 (0x01010101), not 1

    float f = 1.0f;
    uint32_t bits;
    memcpy(&bits, &f, sizeof bits);          // reads the 4 bytes of the float as they are
    printf("%08X\n", bits);                  // 3F800000: how 1.0 is encoded in memory
    return 0;
}
```

| Function | Role | Pitfall |
|---|---|---|
| `memset(p, v, n)` | Sets each of the n bytes to the value `v` | `v` fills **bytes**, not integers: only 0 (and -1) give the same value in an `int` |
| `memcpy(dst, src, n)` | Copies n bytes from `src` to `dst` | Overlapping areas: undefined behavior, use `memmove()` |

The last use, reading the bits of a `float` as an integer (*type punning*), has a tempting but **forbidden** version: `*(uint32_t *)&f`. Accessing an object through a pointer of another type breaks C's **strict aliasing** rule (undefined behavior, which the optimizer can exploit). `memcpy()` is the safe way, and the compiler replaces it with a simple 4-byte move.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | C leaves the developer with full responsibility for dynamic memory (the heap): `malloc`/`calloc`/`realloc` to allocate, `free` to release; the stack (local variables, VLAs included) is managed automatically. |
| **Tools you can use** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, VLAs (`int tab[n]`) for a dynamically-sized array with no `free()`, Valgrind to detect leaks and invalid accesses; `memcpy`/`memset` to copy or fill bytes; an arena for very many small objects. |
| **Pitfalls to avoid** | Memory leak (never calling `free`), use-after-free, double free, buffer overflow, stack overflow on an oversized VLA (no detection possible, unlike `malloc`), mixing up `T (*)[n]` (VLA parameter) with `T **`. |
| **Best practices** | Always check that a `malloc`/`realloc` didn't return `NULL`; set a pointer to `NULL` right after its `free()`; prefer `fgets`/`strncpy`/`snprintf` over unbounded functions (`gets`/`strcpy`/`sprintf`); `strlcpy`/`strlcat` to detect truncation via their return value. |
