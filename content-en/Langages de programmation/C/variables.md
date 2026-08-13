---
order: 1
---

# Variables and Data Types

As a reminder, [a variable is a labeled box that holds a value](/?c=bases-de-l-informatique&p=la-variable). In the C language, each variable also has a type that determines:

- The amount of memory allocated.
- The values it may contain.
- The operations that can be performed on it.

Understanding the different types of data is essential for writing efficient programs and gaining a better understanding of memory management.

## Integers (`int`)

The `int` type is used to store positive or negative integers.

```c
int age = 25;
int temperature = -5;
```

The size of an `int` depends on the machine's architecture, but it is generally 4 bytes (32 bits).

## Characters (`char`)

The `char` type is used to store a single character.

```c
char letter = 'A';
char digit = '5';
```

A `char` typically occupies 1 byte of memory and contains the ASCII value of the character.

> **Pitfall:** confusing `'A'` (single quotes) with `"A"` (double quotes). The first is a single `char` (the ASCII value 65); the second is a **string** of two bytes, `'A'` followed by the null character `'\0'` (see the dedicated section below). Writing `char letter = "A";` is a type error, not just a style difference.
>
> **Best practice:** reserve single quotes for a single character, double quotes for a string, even a one-character one.
>
> **Note:** the C standard doesn't specify whether a "bare" `char` (with no explicit `signed`/`unsigned`) is signed or unsigned: that choice depends on the compiler and the architecture. Code that stores something other than text in a `char` (a small numeric value, for example) should specify `signed char` or `unsigned char` rather than assuming either behavior.

## Booleans (`bool`)

Since the [C99](https://en.wikipedia.org/wiki/C99) standard, the language provides the `bool` type via the `stdbool.h` library.

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

A boolean represents a logical value:

- `true`
- `false`

Before C99, it was common to use integers (`0` for false, a non-zero value for true).

> **Pitfall:** assuming a `bool` faithfully stores any integer assigned to it. `bool b = 5;` does not store `5`: any non-zero value is reduced to `1` (`true`) on assignment. Comparing `b == 5` afterward is therefore false, a result that surprises anyone expecting to get the original value back.
>
> **Best practice:** never reuse a `bool` as if it could still hold its original numeric value; stick to `true`/`false` once a variable is declared `bool`.

> **Note:** older C code (pre-C99, or code that doesn't include `stdbool.h`) still uses a plain `int` to represent a boolean. Reading such code requires keeping the same convention in mind: `0` is false, any other value is true, including negative values.

## Floating-point numbers

C offers several types for representing decimal numbers:

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float`: single precision (32 bits)
- `double`: double precision (64 bits)

These types store an **approximation**, not an exact value: `0.1 + 0.2` does not equal exactly `0.3`. This behavior isn't specific to C: it comes from the IEEE 754 standard imposed by the processor, and shows up identically in [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), or [PHP](/?c=langages-de-programmation&s=php&p=php) (see the [Floating-Point Numbers](/?c=representation-des-donnees&p=nombres-flottants) chapter for an explanation of the encoding).

> **Pitfall:** comparing two floats with `==`, expecting `0.1 + 0.2 == 0.3` to be true. Because of the approximation, this test silently fails most of the time: no error, just an unexpected result.
>
> **Best practice:** compare two floats by their difference (`fabs(a - b) < epsilon`, a chosen tolerance), never by strict equality; see the [correct way to compare them](/?c=representation-des-donnees&p=nombres-flottants) for details.

Similarly, the range of integer values and their behavior on overflow follow from the number of bits allocated: see [Integers, Bits, and Overflow](/?c=representation-des-donnees&p=entiers-et-debordements).

## Strings

The C language does not have a native "string" type. A string is represented by an array of characters terminated by the null character (`\0`).

```c
char name[] = "Devpedia";
```

In memory:

```text
D e v p e d i a \0
```

A string is therefore simply a sequence of characters stored contiguously.

> **Pitfall:** confusing `sizeof(name)` with the actual length of the text. Here, `sizeof(name)` equals `9` (8 characters plus the `\0`), computed at **compile time** from the size of the array. But as soon as this same array is passed to a function, it behaves like a plain pointer (see the [equivalent pitfall with arrays](/?c=langages-de-programmation&s=c&p=boucles)): `sizeof` then returns the size of a pointer (often `8`), not that of the string.
>
> **Best practice:** use `sizeof` only on an array still declared as such in the current scope; use `strlen()` (which walks the string up to the `\0`) to get its actual length in any other context, especially inside a function that receives it as a parameter.

See also [Memory Management](/?c=langages-de-programmation&s=c&p=memoire) for the functions to prefer (`strncpy`, `snprintf`...) to never write past a string's actually allocated size.

## Pointers

Pointers are one of the most important features of the C language.

They're used to store the memory address of a variable.

```c
int age = 25;
int *ptr = &age;
```

Here:

- `age` holds a value.
- `ptr` holds the memory address of `age`.

Pointers are used to:

- Manipulate memory directly.
- Pass data to functions.
- Build complex data structures.

This is only a glimpse: see the dedicated [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) chapter for pointer arithmetic, passing by address, and the pitfalls involved (uninitialized pointer, untested `NULL`...).

## Structures (`struct`)

Structures let you group several pieces of data into a single object.

```c
struct User
{
    int id;
    char name[50];
};
```

They're often used to represent complex entities.

> **Pitfall:** comparing two structures with `==`. C doesn't allow this for a `struct` (compilation error), and even a byte-by-byte comparison (`memcmp`) can get it wrong: the compiler often inserts invisible padding bytes between fields to satisfy each type's memory alignment, and their content isn't guaranteed to be identical between two instances that are otherwise equal.
>
> **Best practice:** compare a structure field by field explicitly (`a.id == b.id && strcmp(a.name, b.name) == 0`), never by overall equality or by `memcmp` on the whole structure.

## Summary

The main data types in C are:

| Type | Description |
|--------|-------------|
| `bool` | Logical value |
| `char` | Character |
| `int` | Integer |
| `float` | Decimal number |
| `double` | High-precision decimal number |
| `char[]` | String |
| `struct` | Custom set of data |
| `pointer` | Memory address |

Mastering these types is essential before moving on to more advanced concepts such as linked lists, binary trees, threads, or process management (see the chapters dedicated to each of these topics).

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Every C variable has a fixed type that determines its size in memory, its possible values, and the operations allowed on it: `int`, `char`, `bool` (C99), `float`/`double`, array of `char` (string), `struct`, pointer. |
| **Available Tools** | `stdbool.h` for a real boolean type; `sizeof` for a type's size at compile time; `strlen()` for a string's actual length at runtime. |
| **Pitfalls to Avoid** | Confusing `'A'` with `"A"`. Assigning a `bool` a value it won't return unchanged. Comparing two floats with `==`. Confusing `sizeof` on an array with `sizeof` on the pointer it decays into once passed to a function. Comparing two `struct`s with `==` or `memcmp` (padding bytes). |
| **Best Practices** | Choose the narrowest type that genuinely covers the expected values, rather than defaulting to `int`/`double` every time. Compare floats by difference, strings with `strcmp`, structures field by field. |
