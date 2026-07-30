---
order: 1
---

# Variables and Data Types

Variables are used to store data in memory so that a program can manipulate it. In the C language, each variable has a type that determines:

- The amount of memory allocated.
- The values it may contain.
- The operations that can be performed on it.

Understanding the different types of data is essential for writing efficient programs and gaining a better understanding of memory management.

## 

The `int` type is used to store positive or negative integers.

```c
int age = 25;
int temperature = -5;
```

The size of a `int` depends on the machine's architecture, but it is generally 4 bytes (32 bits).

## Characters (`char`)

The `char` type is used to store a single character.

```c
char letter = 'A';
char digit = '5';
```

A `char` typically occupies 1 byte of memory and contains the ASCII value of the character.

## 

Since the C99 standard, the language has provided the `bool` type through the `stdbool.h` library.

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

A Boolean represents a logical value:

- `true`
- `false`

Before C99, it was common to use integers (`0` for false, non-zero for true).

## Floating-point numbers

C offers several types for representing decimal numbers:

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : simple precision
- `double` : double precision

## Strings

The C language does not have a native "string" type. A string is represented by an array of characters terminated by a `\0`.

```c
char name[] = "Devpedia";
```

In memory of:

```
D e v p e d i a \0
```

A string is therefore simply a sequence of characters stored contiguously.

## Pointers

Pointers are one of the most important features of the C language.

They are used to store the memory address of a variable.

```c
int age = 25;
int *ptr = &age;
```

Here:

- `age` contains a value.
- `ptr` contains the memory address of `age`.

Pointers are used for:

- Manipulate memory directly.
- Passing data to functions.
- Build complex data structures.

## Organizations (`struct`)

Structures allow you to group multiple pieces of data into a single object.

```c
struct User
{
    int id;
    char name[50];
};
```

They are often used to represent complex entities.

## Abstract

The main data types in C are:

| Type | Description |
|--------|-------------|
| `bool` | Boolean value |
| `char` | Font |
| `int` | Integer |
| `float` | Decimal number |
| `double` | High-precision decimal number |
| `char[]` | String |
| `struct` | Custom Data Set |
| `pointer` | Memory address |

It is essential to master these concepts before moving on to more advanced topics such as linked lists, binary trees, threads, and process management—see the chapters dedicated to each of these topics.
