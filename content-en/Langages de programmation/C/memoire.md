---
order: 5
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

```
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

```
int *tab = malloc(5 * sizeof(int)); // réserve la place pour 5 entiers

if (tab == NULL) {
    // malloc a échoué (mémoire insuffisante) -> tab vaut NULL, à toujours vérifier
    return;
}

for (int i = 0; i < 5; i++) {
    tab[i] = i * 10;
}
```

> **Note:** `malloc()` **does not** **reset** the allocated memory; it may contain any residual values ("garbage"). `calloc(nombre, taille)` does the same thing as `malloc(nombre * taille)`, but also sets all bytes to zero.

```
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Resizing a block: `realloc()`

```
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

`realloc()` preserves the existing content (truncated if the new size is smaller), but may move the block in memory if necessary—that's why we never reassign `tab` directly before verifying that `realloc()` did not return `NULL`.

## Free Up Memory: `free()`

Each successful `malloc()` / `calloc()` / `realloc()` must correspond to exactly one `free()`, when the block is no longer needed:

```
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## The Three Classic Memory Bugs

| Bug | Cause | Consequence |
|---|---|---|
| **Memory*** ***leak** | A block of *memory* `malloc` is never `free()` | The amount of memory used by the program increases but never decreases |
| **Use-after-free** | The program dereferences a pointer after it has been "`free()`" | Undefined behavior: corrupted data, crash, or worse, it silently "works" |
| **Double free** | `free()` called twice on the same pointer | Memory manager corruption, often resulting in a delayed crash that is difficult to trace |

```
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Note:** These bugs do not always cause an immediate, visible crash—which is what makes them difficult to detect. A tool like **Valgrind** (`valgrind ./mon_programme`) runs the program and reports memory leaks and invalid accesses in detail, along with the line of code responsible.

## `sizeof`

`sizeof` is not a function but an operator evaluated at compile time: it returns the size in bytes of a type or variable, which is essential for correctly calculating the amount of memory to allocate:

```
sizeof(int);      // généralement 4
sizeof(char);      // toujours 1, par définition du standard C
sizeof(int) * 10;  // taille nécessaire pour 10 entiers -> à passer à malloc()
```

See also the chapter on pointers; understanding that chapter is a prerequisite for this one.
