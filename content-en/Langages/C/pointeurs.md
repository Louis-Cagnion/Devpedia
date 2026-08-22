---
order: 4
---

# Pointers

A pointer is a variable that does not store a value directly, but rather the **memory address** of another variable. This is the central mechanism that allows C to manipulate memory directly, pass data to functions without copying it, and construct dynamic data structures (linked lists, trees...).

## Declaration, address, and dereferencing

```c
int age = 25;
int *ptr = &age;

printf("%d\n", age);   // 25          -> the value
printf("%p\n", &age);  // 0x7ffee...  -> the memory address of age
printf("%p\n", ptr);   // 0x7ffee...  -> the same address, stored in ptr
printf("%d\n", *ptr);  // 25          -> the value pointed to by ptr
```

- `&variable`: "address of" operator, returns the memory address of a variable.
- `*ptr` (in a declaration): indicates that `ptr` is a pointer.
- `*ptr` (outside a declaration): **dereference** operator, accesses the value stored at the address contained in `ptr`.

Modifying `*ptr` directly modifies `age`, since both refer to the same memory location:

```c
*ptr = 30;
printf("%d\n", age); // 30
```

## Pointer arithmetic

Adding 1 to a pointer does not advance it by one byte, but by `sizeof(type)` bytes:

```c
int tab[3] = {10, 20, 30};
int *p = tab;

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20 -> advances by sizeof(int) bytes, not 1 byte
printf("%d\n", *(p + 2));  // 30
```

> **Note:** an array `tab` behaves like a pointer to its first element. `tab[i]` and `*(tab + i)` are two strictly equivalent ways of writing this in C: that's why array indexing (`[]`) also works on a raw pointer.

### `[]` is just syntactic sugar

The equivalence above runs deeper than a simple writing convenience: the `[]` operator has **no notion whatsoever**, in C, of "array" or "index". The compiler always translates it mechanically into:

```text
a[b]  ≡  *(a + b)
```

Since addition is commutative (`tab + 2` and `2 + tab` designate the same address), this produces a surprising but perfectly legal consequence:

```c
int tab[5] = {1, 2, 3, 4, 5};

printf("%d\n", tab[2]);      // 3
printf("%d\n", *(tab + 2));  // 3
printf("%d\n", 2[tab]);      // 3 as well!
```

> `2[tab]` is useless in practice and only belongs in trick interview questions. Understanding *why* it compiles is useful, though: it drives home the fact that, in C, indexing an array **is** pointer arithmetic, and nothing else.

## Pointer to pointer

A pointer can itself be pointed to, which is useful for modifying a pointer from within a function (see pass-by-address below):

```c
int age = 25;
int *ptr = &age;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> dereferences twice: ptrPtr -> ptr -> age
```

## Passing a pointer to a function (pass-by-address)

In C, arguments are passed **by value** (as a copy) by default: a function therefore cannot modify the caller's original variable, unless it is passed the address of that variable directly:

```c
void increment(int *number)
{
    (*number)++; // modifies the value at the pointed-to address, hence the original variable
}

int main(void)
{
    int x = 5;
    increment(&x);
    printf("%d\n", x); // 6
}
```

Without the `*`, `increment(int number)` would only modify a local copy, with no effect on `x`.

## Function pointers

A function also has a memory address, which can be stored in a pointer, useful for dynamically choosing which function to call (callbacks, dispatch tables):

```c
int addition(int a, int b) { return a + b; }
int subtraction(int a, int b) { return a - b; }

int (*operation)(int, int) = addition;

printf("%d\n", operation(4, 2)); // 6
operation = subtraction;
printf("%d\n", operation(4, 2)); // 2
```

## `NULL` and invalid pointers

An uninitialized pointer contains a **random** address ("wild pointer"): dereferencing it results in undefined behavior, often a crash (`segmentation fault`). A pointer that isn't used yet must be explicitly set to `NULL`, and tested before dereferencing:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr does not point to anything.\n");
}
```

> **Note:** a pointer that pointed to a memory region that has been freed (`free()`, see [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)) is called a **dangling pointer**. Dereferencing it is a classic bug (*use-after-free*): the memory may still seem to hold the right value by coincidence, until it's reused elsewhere.

## Comparing pointers: address or value?

With a pointer, there are two distinct things you can compare, and confusing the two is a frequent source of bugs:

```c
int a = 5;  // stored at address 0x1000
int b = 5;  // stored at address 0x2000
int *p1 = &a;
int *p2 = &b;

p1 == p2    // false: the addresses are different
*p1 == *p2  // true: the pointed-to values are identical
```

- `p1 == p2` compares the **addresses**: "do these two pointers refer to the same memory location?"
- `*p1 == *p2` compares the **pointed-to values**: "is the content the same?"

Two pointers can therefore perfectly well hold the same value without being equal, and vice versa.

> This distinction (comparison by **reference** or by **value**) isn't specific to C, it shows up in most languages. In Python, `is` compares identity (the equivalent of `p1 == p2`) and `==` compares value (the equivalent of `*p1 == *p2`); see the Python [Variables](/?c=langages-de-programmation&s=python&p=variables) chapter. Comparing strings in C illustrates the same pitfall: `str1 == str2` compares two addresses, not two pieces of text; you need `strcmp()`.

## `const` with pointers

Two very distinct uses of `const`, often confused:

```c
const int *p1;       // p1 can change address, but cannot modify the pointed-to value
int *const p2 = &x;  // p2 can no longer change address, but can modify the pointed-to value
```

| Notation | What is protected |
|---|---|
| `const int *p` | The **pointed-to value** cannot be modified via `p` |
| `int *const p` | The **pointer itself** can no longer be reassigned after initialization |
| `const int *const p` | Neither one |

## Summary

| Notation | Meaning |
|---|---|
| `int *ptr` | Declares a pointer to an `int` |
| `&variable` | Memory address of `variable` |
| `*ptr` | Value at the address contained in `ptr` |
| `ptr + 1` | Next address, offset by `sizeof(type)` bytes |
| `NULL` | Pointer that does not point to anything valid |

See also [Memory Management](/?c=langages-de-programmation&s=c&p=memoire) (`malloc`/`free`), which builds directly on these notions.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A pointer stores the memory address of a variable. `&` retrieves an address, `*` dereferences (accesses the pointed-to value). Indexing an array (`tab[i]`) is strictly equivalent to `*(tab + i)`. |
| **Available Tools** | Pointers to pointers, function pointers, `const` to protect the pointed-to value and/or the pointer itself. |
| **Pitfalls to Avoid** | Dereferencing an uninitialized or `NULL` pointer; confusing address comparison (`p1 == p2`) with pointed-to value comparison (`*p1 == *p2`); using a pointer after its `free()` (dangling pointer). |
| **Best Practices** | Initialize every unused pointer to `NULL` and test it before dereferencing; pass a variable's address to a function only when it genuinely needs to modify it. |
