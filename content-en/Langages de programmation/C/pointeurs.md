---
order: 4
---

# Pointers

A pointer is a variable that does not store a value directly, but rather the** memory** address of another variable. This is the central mechanism that allows C to manipulate memory directly, pass data to functions without copying it, and construct dynamic data structures (linked lists, trees, etc.).

## Registration, Address, and Delisting

```c
int age = 25;
int *ptr = &age;

printf("%d\n", age);   // 25          -> la valeur
printf("%p\n", &age);  // 0x7ffee...  -> l'adresse mémoire de age
printf("%p\n", ptr);   // 0x7ffee...  -> la même adresse, stockée dans ptr
printf("%d\n", *ptr);  // 25          -> la valeur pointée par ptr
```

- `&variable` : "address of" operator; returns the memory address of a variable.
- `*ptr` (in the declaration): indicates that `ptr` is a pointer.
- `*ptr` (outside a declaration): **dereference** operator; accesses the value stored at the address contained in `ptr`.

Editing `*ptr` directly modifies `age`, since both refer to the same memory location:

```c
*ptr = 30;
printf("%d\n", age); // 30
```

## Pointer Arithmetic

Adding 1 to a pointer does not advance it by one byte, but by `sizeof(type)` bytes:

```c
int tab[3] = {10, 20, 30};
int *p = tab;

printf("%d\n", *p);       // 10
printf("%d\n", *(p + 1)); // 20 -> avance de sizeof(int) octets, pas de 1 octet
printf("%d\n", *(p + 2)); // 30
```

> **Note:** An array `tab` behaves like a pointer to its first element. `tab[i]` and `*(tab + i)` are two strictly equivalent ways of writing this in C—which is why `[]` also works on a raw pointer.

## Pointer to pointer

A pointer can itself be pointed to, which is useful for modifying a pointer from within a function (see "passing by address" below):

```c
int age = 25;
int *ptr = &age;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> déréférence deux fois : ptrPtr -> ptr -> age
```

## Passing a Pointer to a Function (Pass-by-Reference)

In C, arguments are passed **by value** (as a copy) by default—so a function cannot modify the caller's original variable, unless it is passed the address of that variable directly:

```c
void incrementer(int *number)
{
    (*number)++; // modifie la valeur à l'adresse pointée, donc la variable d'origine
}

int main(void)
{
    int x = 5;
    incrementer(&x);
    printf("%d\n", x); // 6
}
```

Without the `*`, `incrementer(int number)` would only modify a local copy, with no effect on `x`.

## Function pointers

A function also has a memory address, which can be stored in a pointer—useful for dynamically choosing which function to call (callbacks, dispatch tables):

```c
int addition(int a, int b) { return a + b; }
int soustraction(int a, int b) { return a - b; }

int (*operation)(int, int) = addition;

printf("%d\n", operation(4, 2)); // 6
operation = soustraction;
printf("%d\n", operation(4, 2)); // 2
```

## `NULL` and invalid pointers

An un`NULL` pointer contains a **random** address ("wild pointer")—dereferencing it results in undefined behavior, often a crash (`segmentation fault`). A pointer that has not yet been used must be explicitly  and checked before dereferencing:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr ne pointe vers rien.\n");
}
```

> **Note:** A pointer that points to a `free()` (see the chapter on memory management) is called **a dangling pointer**. Accessing it is a classic bug (*use-after-free*): by chance, the memory may still appear to contain the correct value, until it is reused elsewhere.

## `const` with pointers

Two very distinct uses of "`const`" that are often confused:

```c
const int *p1;  // p1 peut changer d'adresse, mais pas modifier la valeur pointée
int *const p2 = &x; // p2 ne peut plus changer d'adresse, mais peut modifier la valeur pointée
```

| Writing | What Is Protected |
|---|---|
| `const int *p` | The **value pointed to** cannot be modified via `p` |
| `int *const p` | The **pointer itself** cannot be reassigned after initialization |
| `const int *const p` | Neither one nor the other |

## Abstract

| Rating | Meaning |
|---|---|
| `int *ptr` | Declares a pointer to a `int` |
| `&variable` | Memory address of `variable` |
| `*ptr` | Value at the address contained in `ptr` |
| `ptr + 1` | Next address, offset by `sizeof(type)` bytes |
| `NULL` | Pointer that does not point to anything valid |

See also the chapter on memory management (`malloc` / `free`), which draws directly on these concepts.
