---
order: 6
---

# Memory Management

Unlike languages such as PHP or JavaScript, which automatically manage memory using a garbage collector, C places the full responsibility for allocating and freeing the memory required by the program on the developer. This is what enables high performance and fine-grained control over resources, at the cost of requiring constant vigilance.

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

## The Three Classic Memory Bugs

| Bug | Cause | Consequence |
|---|---|---|
| **Memory leak** | A block of *memory* `malloc` is never `free()` | The amount of memory used by the program increases but never decreases |
| **Use-after-free** | The program dereferences a pointer after it has been "`free()`" | Undefined behavior: corrupted data, crash, or worse, it silently "works" |
| **Double free** | `free()` called twice on the same pointer | Memory manager corruption, often resulting in a delayed crash that is difficult to trace |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Note:** These bugs do not always cause an immediate, visible crash, which is what makes them difficult to detect. A tool like [**Valgrind**](https://valgrind.org) (`valgrind ./my_program`) runs the program and reports memory leaks and invalid accesses in detail, along with the line of code responsible.

## Buffer overflow: a bug with security consequences

Unlike the three previous bugs (which corrupt the program's own memory, with no outside intent), a buffer overflow is often **the result of input controlled by an attacker**: which historically makes it one of the most exploited security flaws in C/C++.

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
buffer[sizeof(buffer) - 1] = '\0';           // strncpy doesn't guarantee termination if the source is too long

fgets(buffer, sizeof(buffer), stdin);        // bounded reading right from input, rather than fixing it up afterward
```

| Risky function | Bounded alternative |
|---|---|
| `strcpy()` | `strncpy()` (watch out for termination, see above) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (truncates rather than overflowing) |
| `gets()` | `fgets()` (`gets()` was in fact removed from the C standard as of [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisely for this reason) |

> **Note:** bounding the size only solves half the problem: you also need to check that the truncated data stays coherent for the rest of the program (a filename cut halfway by `strncpy` remains a syntactically valid filename, just an incorrect one). The right reflex is to always know, at every write, the destination buffer's actual size; never assume an input will respect an expected size without checking it.

## `sizeof`

`sizeof` is not a function but an operator evaluated at compile time: it returns the size in bytes of a type or variable, which is essential for correctly calculating the amount of memory to allocate:

```c
sizeof(int);       // generally 4
sizeof(char);      // always 1, by definition of the C standard
sizeof(int) * 10;  // size needed for 10 integers -> pass this to malloc()
```

See also the chapter on pointers; understanding that chapter is a prerequisite for this one.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | C leaves the developer with full responsibility for dynamic memory (the heap): `malloc`/`calloc`/`realloc` to allocate, `free` to release; the stack (local variables) is managed automatically. |
| **Tools you can use** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, Valgrind to detect leaks and invalid accesses. |
| **Pitfalls to avoid** | Memory leak (never calling `free`), use-after-free, double free, buffer overflow, the latter of which can be exploited as a security flaw. |
| **Best practices** | Always check that a `malloc`/`realloc` didn't return `NULL`; set a pointer to `NULL` right after its `free()`; prefer `fgets`/`strncpy`/`snprintf` over unbounded functions (`gets`/`strcpy`/`sprintf`). |
