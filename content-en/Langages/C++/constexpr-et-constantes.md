---
order: 12
---

# `constexpr` and Constants in C++ (28/10/2026)

A program handles values that never change: the size of a tile in a game (64 pixels, a **pixel** being a dot on the screen), the maximum number of lives, the value of pi. A **constant** is such a value, bound to a name and which no longer changes, as opposed to a [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), whose value can change. C++ offers three tools to create one: `#define`, `const` and [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr). They are used almost the same way and differ by **the moment when the value is known**, by their **type** and by their **scope** (the zone of the code where the name exists). This chapter compares them on a common thread: the size of a tile, `TILE_SIZE = 64`, stored in a game class (a *tile* is a square of the game board).

| Topic | Question it answers | Section |
|---|---|---|
| The problem | Why name a value rather than write it everywhere? | [A constant](#a-constant-giving-a-name-to-a-value) |
| Two moments | What are compilation, execution, a constant expression? | [Compilation and execution](#compilation-and-execution-two-moments) |
| The three tools | What does each one do, and what risk does it carry? | [`#define`](#define-a-text-replacement), [`const`](#const-a-value-fixed-at-initialization), [`constexpr`](#constexpr-a-value-known-at-compile-time) |
| Comparison | Which one to choose depending on the need? | [The comparison table](#comparing-define-const-and-constexpr) |
| In a class | Where to store `TILE_SIZE`, and how to read it from outside? | [The scope](#the-scope-of-a-constant), [the `static constexpr` member](#the-static-constexpr-member-of-a-class) |
| By standard | What does C++17 change? What can `constexpr` compute? | [Before and since C++17](#before-and-since-c-17-the-definition-outside-the-class), [functions and `static_assert`](#what-constexpr-can-compute-functions-and-static-assert) |

The chapter assumes you already know [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) and their types, [classes and objects](/?c=langages&s=cpp&p=classes-et-objets) (including `public` and `private`) and [namespaces](/?c=langages&s=cpp&p=espaces-de-noms). For the preprocessor and the `-D` option, it relies on [the compilation process](/?c=langages&s=c&p=compilation), written for C but valid as is in C++. Values that depend on the language version are cited by **standard** (or **norm**: an official version of the language, C++11, C++14, C++17, C++20). All examples were compiled with `g++`, the C++ compiler of GCC (*GNU Compiler Collection*, a suite of free compilers), from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal):

```bash
# -std=c++17: selects the standard; -Wall -Wextra -pedantic: display the warnings
# -o program: name of the produced file; ./program: runs this file
g++ -std=c++17 -Wall -Wextra -pedantic file.cpp -o program
./program
```

## A constant: giving a name to a value

A **literal** is a value written directly in the code: `64`, `3.14`, `'a'`, `"text"`, `true`. In the following program, `int` is the **type** "whole number" (see [the variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)) and `#include <iostream>` inserts the header that provides `std::cout` (see [header files](/?c=langages&s=c&p=headers) and [namespaces](/?c=langages&s=cpp&p=espaces-de-noms) for the `std::` prefix). The `<<` operator sends a value to `std::cout`, and `"\n"` is a line break.

```cpp
#include <iostream>   // std::cout: displays text in the terminal

int main()   // entry point: the program starts here
{
    int width = 10 * 64;        // 10 tiles wide: is 64 the size of a tile?
    int height = 8 * 64;        // 8 tiles high: the same 64, written again
    int startTile3 = 3 * 64;    // pixel where tile 3 starts: 64 again
    std::cout << width << " x " << height << ", tile 3 at x = " << startTile3 << "\n";
    return 0;   // 0: the program ended normally
}
```

```text
640 x 512, tile 3 at x = 192
```

The literal `64` appears three times without a name: it is a **magic number**, whose meaning the reader must guess. Changing the tiles to 48 pixels forces you to find each `64` without confusing those that mean something else. Giving the value a name solves both problems: the meaning is written, and the change is made in one single place. Here are the three possible ways to write it, side by side:

```cpp
#include <iostream>   // std::cout: displays text in the terminal

#define TILE_MACRO 64                // macro: the preprocessor will replace this name with 64
const int TILE_CONST = 64;           // const: int variable, read-only
constexpr int TILE_CONSTEXPR = 64;   // constexpr: int constant known at compile time

int main()
{
    // the three names are used the same way and display the same value
    std::cout << TILE_MACRO << " " << TILE_CONST << " " << TILE_CONSTEXPR << "\n";
    return 0;
}
```

```text
64 64 64
```

| Form | What it is |
|---|---|
| `#define TILE_MACRO 64` | A **macro**: a text that the preprocessor will replace before compilation |
| `const int TILE_CONST = 64;` | A **variable** that we forbid ourselves to modify |
| `constexpr int TILE_CONSTEXPR = 64;` | A **constant** whose value the compiler knows |

## Compilation and execution: two moments

A C++ program lives at two distinct moments, detailed in [the compilation process](/?c=langages&s=c&p=compilation):

```text
 file .cpp --[ compilation: g++ ]--> program --[ execution: ./program ]--> result
 (your text)   the compiler reads    (a file)   the program runs;
               the code; it sees                 it reads the keyboard, files,
               no input                          the network...
```

| Moment | Definition | What is known there |
|---|---|---|
| **Compilation** | The **compiler** translates the text of the code into a program that the computer can run | What is written in the code: literals, constants, calculations on these values |
| **Execution** | The program runs | In addition: what the user types, the contents of a file, the time |

An **expression** is a calculation written in the code (`8 * 8`, `x + 1`). A **constant expression** is an expression that the compiler can calculate on its own, without running the program, because it depends only on values known at compile time. The following table cites `readSize()`, a **function** (a named block of code that we call to get a result) that reads a number from the keyboard; it is used in several examples of the chapter.

| Expression | Constant? | Why |
|---|---|---|
| `64` | yes | a literal |
| `8 * 8` | yes | a calculation on literals |
| `TILE_SIZE * 10` (with `TILE_SIZE` defined as 64) | yes | a calculation on a known constant |
| `readSize()` (function that reads the keyboard) | no | the result depends on what the user types |

Some places in the language **require** a constant expression: the size of an **array** (a row of contiguous cells of the same type, for example 80 integers: `cells[0]` designates the first one, `cells[1]` the next one), the value written between angle brackets in a [template](/?c=langages&s=cpp&p=templates), such as the 80 in `std::array<int, 80>`, and the condition of a [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert) (a check made at compile time, seen further below). The three tools of the chapter are first judged on this requirement.

## `#define`: a text replacement

The **preprocessor** is the first step of compilation: a program that reads the code before the compiler and processes every line starting with `#` (see [the preprocessor](/?c=langages&s=c&p=compilation#1-the-preprocessor)). The line `#define NAME text` creates a **macro**: wherever `NAME` appears afterwards, the preprocessor replaces it with `text`, like the "search and replace" function of a text editor.

```cpp
#include <iostream>   // std::cout: displays text in the terminal

#define TILE_SIZE 64                    // the preprocessor will replace TILE_SIZE with 64
#define WINDOW_WIDTH (TILE_SIZE * 10)   // a macro name can contain another one

int main()
{
    std::cout << WINDOW_WIDTH << "\n";   // becomes: std::cout << (64 * 10) << "\n";
    return 0;
}
```

```text
640
```

The preprocessor can be asked to stop after its work and display the result. The file above is called here `macro.cpp`:

```bash
# -E: stops after the preprocessor; -P: adds no line markers
# |: sends the output of g++ to the next command
# tail -n 5: keeps the last 5 lines
g++ -std=c++17 -E -P macro.cpp | tail -n 5
```

```text
int main()
{
    std::cout << (64 * 10) << "\n";
    return 0;
}
```

`WINDOW_WIDTH` and `TILE_SIZE` have disappeared: the compiler only sees `(64 * 10)`. Three consequences follow.

### No type

The compiler only sees the replaced text: the type of a macro is simply that of this text (`64` is an integer, `0.5` a floating-point number), never a type chosen. With `constexpr`, the type is written:

```cpp
#include <iostream>   // std::cout

#define RATIO_MACRO 0.5                  // no type written: 0.5 is a double
constexpr float RATIO_CONSTEXPR = 0.5;   // the type is written: float

int main()
{
    // sizeof gives the size in bytes (a byte: the unit of memory measurement)
    std::cout << sizeof(RATIO_MACRO) << " " << sizeof(RATIO_CONSTEXPR) << "\n";
    return 0;
}
```

```text
8 4
```

`sizeof` gives the size of a value in bytes. `float` and `double` are two types of floating-point numbers; the `double`, which is more precise, takes 8 bytes. The literal `0.5` is a `double`, whereas the constant declared `float` only takes 4 bytes.

### No scope

A macro exists from its `#define` line to the end of the file, wherever it was written: in a function, in a class, in a namespace. File `macro_scope.cpp`:

```cpp
#include <iostream>   // std::cout

void draw()
{
#define MARGIN 8   // defined here, in the middle of a function...
    std::cout << "draw: " << MARGIN << "\n";
}

void move()
{
    std::cout << "move: " << MARGIN << "\n";   // ...but visible here: no scope
}

int main()
{
    draw();   // calls the first function
    move();   // calls the second
    return 0;
}
```

```text
draw: 8
move: 8
```

### Collisions depending on include order

Two header files from different [libraries](/?c=langages&s=c&p=bibliotheques) can define a macro with the same name. File `lib_a.h`, with its **include guard** (the `#ifndef`, "if not defined", closed by `#endif`, which prevents inserting a file twice, see [header files](/?c=langages&s=c&p=headers)):

```cpp
#ifndef LIB_A_H      // include guard: this file is inserted only once per program
#define LIB_A_H
#define WIDTH 10     // library A is 10 tiles wide
#endif
```

File `lib_b.h`:

```cpp
#ifndef LIB_B_H
#define LIB_B_H
#define WIDTH 20     // library B is 20 tiles wide: same name, other value
#endif
```

Two programs differ only by the order of their `#include`. The first one, `main_ab.cpp`:

```cpp
#include <iostream>   // std::cout
#include "lib_a.h"    // "...": a project file, searched next to this file
#include "lib_b.h"    // included second: its definition of WIDTH comes last

int main()
{
    std::cout << "WIDTH = " << WIDTH << "\n";   // the last definition wins
    return 0;
}
```

```text
lib_b.h:3: warning: "WIDTH" redefined
lib_a.h:3: note: this is the location of the previous definition
WIDTH = 20
```

The second one, `main_ba.cpp`, is identical, but its two `#include "lib_..."` lines are reversed: `lib_b.h` first, `lib_a.h` then.

```text
lib_a.h:3: warning: "WIDTH" redefined
lib_b.h:3: note: this is the location of the previous definition
WIDTH = 10
```

The last definition wins, and only a warning reports it: the program compiles and runs. Changing the order of two `#include`, sometimes done by a formatting tool, therefore changes the value used. Constants placed in a [namespace](/?c=langages&s=cpp&p=espaces-de-noms) avoid the problem: `LibA::WIDTH` and `LibB::WIDTH` are two different names.

```cpp
#ifndef NS_A_H
#define NS_A_H
namespace LibA {
    constexpr int WIDTH = 10;   // LibA::WIDTH: 10 tiles wide
}
#endif
```

```cpp
#ifndef NS_B_H
#define NS_B_H
namespace LibB {
    constexpr int WIDTH = 20;   // LibB::WIDTH: 20 tiles wide
}
#endif
```

```cpp
#include <iostream>   // std::cout
#include "ns_a.h"     // the include order no longer matters
#include "ns_b.h"

int main()
{
    // each name carries the prefix of its namespace: no collision
    std::cout << LibA::WIDTH << " " << LibB::WIDTH << "\n";
    return 0;
}
```

```text
10 20
```

### What `#define` does better

A macro is **visible everywhere** (no scope) and can be **set from the command line** with the compiler's `-D` option: `-DNAME=value` acts like a line `#define NAME value` placed at the start of the file (see [the case of constants adjustable with `-D`](/?c=langages&s=c&p=compilation#checking-at-compile-time-static-assert)). A project uses it to set a limit without touching the code; the `#ifndef` ("if not defined") provides the default value. The file below is called here `tile_size.cpp`:

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE     // if the command line did not define TILE_SIZE (-D option)...
#define TILE_SIZE 64  // ...we take this default value
#endif

int main()
{
    std::cout << "Tile: " << TILE_SIZE << " pixels\n";   // displays the retained value
    return 0;
}
```

```bash
# &&: runs the next command only if the previous one succeeded
# without -D: the default value of #define applies
g++ -std=c++17 tile_size.cpp -o tile_size && ./tile_size
# -DTILE_SIZE=32: the compiler defines the macro before reading the file
g++ -std=c++17 -DTILE_SIZE=32 tile_size.cpp -o tile_size && ./tile_size
```

```text
Tile: 64 pixels
Tile: 32 pixels
```

| Advantage of `#define` | Why `const` and `constexpr` do not have it |
|---|---|
| Visible throughout the file, without prefix | Their name follows the scope rules of the language |
| Settable with `-D` without changing the code | Their value is written in the code |
| Usable in `#if` (condition evaluated by the preprocessor) | The preprocessor does not know the constants of the language (see the pitfalls) |

## `const`: a value fixed at initialization

`const` (from "constant") in front of a variable forbids modifying it after its **initialization**, that is to say the first value it receives, when it is created (giving a value with `=` is called an **assignment**). Nothing requires this value to be known at compile time: it can come from the keyboard or from a file, and therefore exist only at run time.

```cpp
#include <iostream>   // std::cin reads the keyboard, std::cout writes to the screen

int readSize()   // function that returns an int read from the keyboard
{
    int value = 0;        // the variable that will receive the number typed
    std::cin >> value;    // waits for the user to type a number, then press Enter
    return value;         // returns this number to the caller of the function
}

int main()
{
    const int tileSize = readSize();   // const: fixed here, during execution
    std::cout << "Tile size: " << tileSize << "\n";
    return 0;
}
```

```text
Tile size: 48
```

(The program waits for a number: we type `48`, then Enter. Reading a file instead of the keyboard would give the same result: the value is known only at run time.) The variable `tileSize` is indeed constant, since no line can modify it afterwards, but the compiler ignores its value.

### Special case: an integer `const` initialized by a literal

When an integer-type `const` is initialized by a constant expression, the compiler knows its value and accepts it as a constant:

```cpp
#include <array>      // std::array
#include <iostream>   // std::cout

const int WIDTH = 4;   // const initialized by a literal: value known to the compiler

int main()
{
    int cells[WIDTH] = {};             // accepted: WIDTH is 4 already at compile time
    std::array<int, WIDTH> others{};   // accepted too
    cells[WIDTH - 1] = 9;              // the last cell receives 9
    std::cout << others.size() << " " << cells[3] << "\n";
    return 0;
}
```

```text
4 9
```

This historical rule is limited: it only applies to integer types. With a `double`, the compiler refuses:

```cpp
const double RATIO = 2.0;   // const, not an integer, initialized by a literal

// > : "greater than"; the condition must be a constant expression
static_assert(RATIO > 1.0, "RATIO must be greater than 1");

int main()
{
    return 0;
}
```

```text
const_double.cpp:4:21: error: non-constant condition for static assertion
const_double.cpp:4:15: error: the value of ‘RATIO’ is not usable in a constant expression
const_double.cpp:1:14: note: ‘RATIO’ was not declared ‘constexpr’
```

### A `const` initialized at run time: unusable as a size

The main pitfall of `const`: it **looks** like a constant, but nothing guarantees its value at compile time. With `std::array` (a fixed-size array, written between angle brackets), the error is clear:

```cpp
#include <array>      // std::array: array whose size is written between angle brackets <>
#include <iostream>   // std::cin, std::cout

int readSize()   // reads an integer from the keyboard (see the previous example)
{
    int value = 0;
    std::cin >> value;
    return value;
}

int main()
{
    const int size = readSize();   // const, but its value exists only at run time
    // {}: all the cells are 0 at the start
    std::array<int, size> cells{};       // ERROR: size unknown at compile time
    std::cout << cells.size() << "\n";   // size(): the number of cells
    return 0;
}
```

```text
array_const.cpp:15:25: error: the value of ‘size’ is not usable in a constant expression
array_const.cpp:13:15: note: ‘size’ was not initialized with a constant expression
```

With a "C-style" array, GCC accepts the code through an extension (a **variable-length array**, whose size is read at run time) and only warns:

```cpp
#include <iostream>   // std::cin, std::cout

int readSize()   // reads an integer from the keyboard
{
    int value = 0;
    std::cin >> value;
    return value;
}

int main()
{
    const int size = readSize();   // const: value known only at run time
    int cells[size];               // C array: GCC accepts it, the C++ standard does not
    cells[0] = 7;                  // the first cell receives 7
    std::cout << "Cells: " << size << ", first: " << cells[0] << "\n";
    return 0;
}
```

```text
array_vla.cpp:13:9: warning: ISO C++ forbids variable length array ‘cells’ [-Wvla]
Cells: 5, first: 7
```

(with the input `5`). The program works, but standard C++ does not have these arrays: with the `-pedantic-errors` option, the warning becomes `error: ISO C++ forbids variable length array ‘cells’ [-Wvla]`, and other compilers may refuse the code: the same program risks being valid with one and wrong with another.

## `constexpr`: a value known at compile time

`constexpr` (from *constant expression*) declares a **typed** constant whose value **must** be known at compile time. The compiler computes it, and refuses the program if it cannot. `constexpr` exists since C++11 and implies `const`: the constant is not modified afterwards.

```cpp
#include <array>      // std::array: array whose size is written between angle brackets <>
#include <iostream>   // std::cout

constexpr int WIDTH = 10;                    // 10 tiles wide
constexpr int HEIGHT = 8;                    // 8 tiles high
constexpr int CELL_COUNT = WIDTH * HEIGHT;   // computed at compile time: 80

int main()
{
    int cells[CELL_COUNT] = {};             // C array of 80 integers, all initialized to 0
    std::array<int, CELL_COUNT> others{};   // std::array of 80 integers: the size is accepted
    cells[CELL_COUNT - 1] = 5;              // the last cell receives 5
    std::cout << CELL_COUNT << " " << others.size() << " " << cells[79] << "\n";
    return 0;
}
```

```text
80 80 5
```

`CELL_COUNT` is computed by the compiler (10 x 8), then accepted as an array size, which the `const` read from the keyboard did not get. If the value depends on execution, the compiler says so immediately:

```cpp
#include <iostream>   // std::cin, std::cout

int readSize()   // reads an integer from the keyboard
{
    int value = 0;
    std::cin >> value;
    return value;
}

int main()
{
    constexpr int size = readSize();   // ERROR: the value depends on the keyboard
    std::cout << size << "\n";
    return 0;
}
```

```text
constexpr_input.cpp:12:34: error: call to non-‘constexpr’ function ‘int readSize()’
constexpr_input.cpp:3:5: note: ‘int readSize()’ declared here
```

The error comes at compile time, before anyone runs the program: that is the whole point. The following table summarizes what separates `const` from `constexpr`:

|  | `const` | `constexpr` |
|---|---|---|
| Guarantees that the value no longer changes | yes | yes |
| Guarantees that the value is known at compile time | no | yes, otherwise an error |
| Initialization by keyboard input or a file | allowed | refused |
| Array size, template argument, `static_assert` | only for an integer initialized by a literal | always, for any permitted type |
| Applies to | any variable | a variable, a function (see below) |

## Comparing `#define`, `const` and `constexpr`

| Criterion | `#define` | `const` | `constexpr` |
|---|---|---|---|
| Nature | Text replaced by the preprocessor | Read-only variable | Constant computed at compile time |
| Type | None: that of the replaced text | Yes | Yes |
| Scope | None: from the `#define` line to the end of the file | Yes: block, class, namespace | Yes: block, class, namespace |
| Moment of the value | Before compilation (text) | Initialization, sometimes at run time | Compilation, mandatory |
| Array size | Yes | Only if the value is known (integer initialized by a literal) | Yes |
| Setting with `-D` | Yes | No | No (except by reading a macro) |
| Usable in `#if` | Yes | No | No |
| Error message | Cites the replaced text | Cites the name | Cites the name |
| Debugging | The name disappears before compilation | The name is kept | The name is kept |

### Error messages

Modifying the constant by mistake gives two kinds of messages. With the macro:

```cpp
#define TILE_SIZE 64   // macro

int main()
{
    TILE_SIZE = 32;   // ERROR: we try to modify the constant
    return 0;
}
```

```text
modify_macro.cpp:1:19: error: lvalue required as left operand of assignment
modify_macro.cpp:5:5: note: in expansion of macro ‘TILE_SIZE’
```

The compiler talks about a value on the left of the assignment (`64 = 32` makes no sense): it replaced the name with the number. If the first line becomes `const int TILE_SIZE = 64;` (file `modify_const.cpp`) or `constexpr int TILE_SIZE = 64;` (file `modify_constexpr.cpp`), the message is the same in both cases and names the constant:

```text
modify_const.cpp:5:15: error: assignment of read-only variable ‘TILE_SIZE’
```

### Debugging

A **debugger** is a tool that runs a program step by step and displays its variables (see [the bug](/?c=fondamentaux&s=bases-de-l-informatique&p=le-bug)). It only reads what the compiler left in the program. File `debugging.cpp`:

```cpp
#define TILE_MACRO 64   // macro: disappears before the actual compilation

constexpr int TILE_CONSTEXPR = 64;   // constant: keeps its name in the compiled program

int main()
{
    // %: remainder of a division; 128 % 7 is 2; return hands this number to the system
    return (TILE_MACRO + TILE_CONSTEXPR) % 7;
}
```

```bash
# -g: the compiler adds to the program the names that a debugger reads
# (DWARF: the standard format in which these names are stored)
# objdump: displays the content of a compiled program
# grep -c: counts the lines that cite a word
g++ -std=c++17 -g debugging.cpp -o debugging
objdump --dwarf=info debugging | grep -c TILE_CONSTEXPR
objdump --dwarf=info debugging | grep -c TILE_MACRO
# -g3: also adds the macros, readable with --dwarf=macro
g++ -std=c++17 -g3 debugging.cpp -o debugging3
objdump --dwarf=macro debugging3 | grep -c TILE_MACRO
```

```text
1
0
1
```

With `-g`, the constant keeps its name (1 line) and the macro appears nowhere (0). Only the `-g3` option keeps the macros. Without it, the debugger displays `64` where the code said `TILE_MACRO`.

## The scope of a constant

The **scope** of a name is the zone of the code where it exists. A `const` or `constexpr` constant follows the scope rules of any variable, which allows three constants to bear the same name without interfering:

| Where is it declared? | Scope | How to read it from outside |
|---|---|---|
| In a function | From its declaration to the closing brace of the function | Impossible: it no longer exists afterwards |
| In a namespace | Everywhere, with the prefix and the `::` operator ("belonging to") | `Config::WIDTH` |
| In a class, with `static` | In the class; outside it if it is `public` | `Grid::WIDTH` |
| `#define` | From the `#define` line to the end of the file, without prefix | `WIDTH` (no control) |

```cpp
#include <iostream>   // std::cout

namespace Config {              // a namespace groups names under a prefix
    constexpr int WIDTH = 10;   // written Config::WIDTH, from anywhere
}

class Grid {
public:
    static constexpr int WIDTH = 5;   // written Grid::WIDTH, from anywhere (public)
};

void draw()
{
    constexpr int WIDTH = 3;   // visible in draw(), up to the closing brace
    std::cout << WIDTH << " " << Config::WIDTH << " " << Grid::WIDTH << "\n";
}

int main()
{
    draw();   // displays the three WIDTH: none interferes with the others
    return 0;
}
```

```text
3 10 5
```

In `draw`, the name `WIDTH` alone designates the local constant (3); the other two are written with their prefix. Outside its function, a local constant no longer exists:

```cpp
#include <iostream>   // std::cout

void draw()
{
    constexpr int MARGIN = 8;   // visible in draw() only
    std::cout << "draw: " << MARGIN << "\n";
}

int main()
{
    draw();
    std::cout << "main: " << MARGIN << "\n";   // ERROR: MARGIN does not exist here
    return 0;
}
```

```text
local_scope.cpp:12:30: error: ‘MARGIN’ was not declared in this scope
```

A macro, on the contrary, would have been visible in `main` (see the example `macro_scope.cpp` above, where `MARGIN` leaves its function). A narrow scope is an advantage: a local constant name cannot collide with another name of the program.

## The `static constexpr` member of a class

A **static member** (declared `static`) of a class does not belong to each object but to the class: there is only one copy, shared (see [static members](/?c=langages&s=cpp&p=classes-et-objets#static-members-and-methods)). A class constant has no reason to be copied into each `Game` object: we declare it `static constexpr`. Here is the common thread, a game class whose tile size is a member:

```cpp
#include <array>      // std::array: fixed-size array, written between angle brackets <>
#include <iostream>   // std::cout

class Game {
public:   // what follows can be used from outside the class
    static constexpr int TILE_SIZE = 64;    // size of a tile in pixels
    static constexpr int GRID_WIDTH = 10;   // number of tiles across
    static constexpr int GRID_HEIGHT = 8;   // number of tiles down

    // pixel position of the given column; const: does not modify the object
    int pixelX(int column) const { return column * TILE_SIZE; }
    // static_cast<int> converts to int the number of cells returned by size()
    int cellCount() const { return static_cast<int>(cells.size()); }

private:   // what follows can only be used inside the class
    // the size is a constant expression: the three constants are multiplied
    std::array<int, GRID_WIDTH * GRID_HEIGHT> cells{};
};

int main()
{
    Game game;   // a Game object
    std::cout << "Tile: " << Game::TILE_SIZE << " pixels\n";   // Class::NAME, no object
    std::cout << "Column 3: x = " << game.pixelX(3) << "\n";
    std::cout << "Window: " << Game::GRID_WIDTH * Game::TILE_SIZE << " x "
              << Game::GRID_HEIGHT * Game::TILE_SIZE << "\n";
    std::cout << "Cells: " << game.cellCount() << "\n";
    return 0;
}
```

```text
Tile: 64 pixels
Column 3: x = 192
Window: 640 x 512
Cells: 80
```

Key points:

- `Game::TILE_SIZE` is read with `Class::NAME` (the `::` operator means "belonging to"): no object is needed, since the constant belongs to the class.
- The three constants serve to compute the size of `cells`: the product `GRID_WIDTH * GRID_HEIGHT` is a constant expression, accepted between the angle brackets of `std::array` (see [templates](/?c=langages&s=cpp&p=templates)).
- `static_cast<int>` converts a number from one type to another (see [casts in C++](/?c=langages&s=cpp&p=cast-cpp)), and `const` after `pixelX(int column)` promises that the method (a function of the class) does not modify the object.

Access from outside the class depends on the section where the constant is declared:

| Declaration | In the functions of `Game` | Outside the class (`Game::NAME`) |
|---|---|---|
| `public` section | yes | yes |
| `private` section | yes | no: compilation error |
| `protected` section | yes | no, but derived classes have access to it |

```cpp
#include <iostream>   // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // public: readable from outside

private:
    static constexpr int MAX_LIVES = 3;    // private: reserved for the functions of Game
};

int main()
{
    std::cout << Game::TILE_SIZE << "\n";   // accepted
    std::cout << Game::MAX_LIVES << "\n";   // ERROR: MAX_LIVES is private
    return 0;
}
```

```text
private.cpp:14:24: error: ‘constexpr const int Game::MAX_LIVES’ is private within this context
private.cpp:8:26: note: declared private here
```

A constant useful only to the class is placed in `private`: it does not become an interface that would have to be maintained.

### Before and since C++17: the definition outside the class

A constant used as a simple **value** (`TILE_SIZE * 2`, `std::cout << TILE_SIZE`) does not need to exist in memory: the compiler copies 64. As soon as we ask for its **address** (the location of the value in memory, obtained by passing by [reference](/?c=langages&s=cpp&p=references) or with the `&` symbol), it must exist at one precise point of the memory. A **declaration** only announces a name and its type; a **definition** additionally reserves this location, once for the whole program. An **argument** is the value supplied to a function when it is called: `std::min` receives its two arguments by reference, therefore by their address:

```cpp
#include <algorithm>   // std::min: returns the smaller of two values
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // size of a tile in pixels
};

int main()
{
    int requested = 100;   // size requested by the user
    // std::min receives its arguments by reference: it uses the address of TILE_SIZE
    int size = std::min(requested, Game::TILE_SIZE);
    std::cout << "Retained size: " << size << "\n";
    return 0;
}
```

| Standard | In the class, `static constexpr int TILE_SIZE = 64;` is | The line `constexpr int Game::TILE_SIZE;` outside the class is |
|---|---|---|
| C++11 and C++14 | A declaration only | **Required** if the address is requested, in a single `.cpp` file |
| C++17 and later | A declaration and a definition (the constant is implicitly `inline`: a definition that may appear in several files, the program keeping only one copy) | Unnecessary; still accepted, but the standard declares it deprecated |

In C++17, the program displays:

```text
Retained size: 64
```

In C++11 and C++14, the compilation succeeds but the **linking** (the last step, which joins the pieces of the program, see [linking errors](/?c=langages&s=c&p=compilation#compilation-errors-vs-linking-errors)) fails (`ld` is the program that performs this step):

```text
min_address.cpp:(.text+0x29): undefined reference to `Game::TILE_SIZE'
collect2: error: ld returned 1 exit status
```

The fix adds the definition after the class:

```cpp
#include <algorithm>   // std::min
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // declaration in the class
};

// definition outside the class: reserves the address of TILE_SIZE (in ONE .cpp file only)
constexpr int Game::TILE_SIZE;

int main()
{
    int requested = 100;   // size requested by the user
    int size = std::min(requested, Game::TILE_SIZE);   // caps at 64
    std::cout << "Retained size: " << size << "\n";
    return 0;
}
```

```text
Retained size: 64
```

This program gives the same result in C++11, C++14 and C++17. Two details of this pitfall:

- With the [optimization](/?c=langages&s=c&p=compilation#optimization-levels-o0-to-o3-os) option `-O2` (which asks the compiler to rewrite the code to make it faster), the address use is replaced by the value 64 and the error disappears (observed with the example code in C++11): a program can therefore pass in an optimized version and fail in the normal version.
- The definition line belongs to **a single** `.cpp` file. Placed in a header included by two files, it gives in C++14 `multiple definition of ‘Game::TILE_SIZE’`; in C++17 it is no longer a problem, since the constant is `inline`.

## What `constexpr` can compute: functions and `static_assert`

Declared `constexpr`, a function can be called at compile time when all its arguments (the values supplied at the call) are known; with an argument known only at run time, it runs like an ordinary function. What it can contain depends on the standard:

| Standard | Content allowed in a `constexpr` function |
|---|---|
| C++11 | A single statement (an instruction ended by `;`): `return`; **recursion** (a function that calls itself) and the ternary operator `test ? a : b` replace variables and loops |
| C++14 | Local variables, [`for` and `while` loops](/?c=langages&s=c&p=boucles), several statements |
| C++20 | The word `consteval` forces the calculation at compile time (see below) |

```cpp
#include <iostream>   // std::cin, std::cout

constexpr int square(int x) { return x * x; }   // a single return: valid since C++11

// recursion: the function calls itself; <= : "less than or equal to"
// "test ? a : b" is a if test is true, otherwise b
constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }

constexpr int AREA = square(8);                             // computed at compile time: 64
static_assert(square(8) == 64, "square(8) must equal 64");  // == : equality test
int values[factorial(3)];                                   // size 3 x 2 x 1 = 6

int main()
{
    int n = 0;       // value chosen at run time
    std::cin >> n;   // read from the keyboard
    // square(n) runs like an ordinary function: n is unknown at compile time
    std::cout << AREA << " " << factorial(5) << " " << square(n) << " "
              << values[0] << "\n";
    return 0;
}
```

```text
64 120 49 0
```

(with the input `7`). `factorial(5)` equals 5 x 4 x 3 x 2 x 1, that is 120. The same function `square` serves at compile time (`AREA`, `static_assert`) and at run time (`square(n)`), while `factorial(3)` sets the size of the array. With a loop, the same idea is written more simply, but only since C++14:

```cpp
#include <iostream>   // std::cout

constexpr int sum(int n)   // adds the integers from 1 to n
{
    int total = 0;                 // local variable: allowed since C++14
    for (int i = 1; i <= n; ++i)   // loop: allowed since C++14; ++i adds 1 to i
        total += i;                // +=: adds i to total
    return total;                  // 1 + 2 + ... + n
}

constexpr int TOTAL = sum(10);   // computed at compile time: 55

int main()
{
    std::cout << TOTAL << "\n";
    return 0;
}
```

```text
55
```

In C++11, the same function is refused:

```text
sum.cpp:9:1: error: body of ‘constexpr’ function [...] not a return-statement
```

### `static_assert`: checking at compile time

[`static_assert(condition, "message")`](https://en.cppreference.com/w/cpp/language/static_assert) stops the compilation with the message if the condition is false. The condition must be a constant expression. This turns an assumption of the code ("the tile is a multiple of 8") into a rule that the compiler checks:

```cpp
constexpr int TILE_SIZE = 60;   // size of a tile in pixels

// the condition is false: the compilation stops with this message
static_assert(TILE_SIZE % 8 == 0, "TILE_SIZE must be a multiple of 8");

int main()
{
    return 0;
}
```

```text
assertion.cpp:4:29: error: static assertion failed: TILE_SIZE must be a multiple of 8
assertion.cpp:4:29: note: the comparison reduces to ‘(4 == 0)’
```

(60 % 8 equals 4, the remainder of the division of 60 by 8.) Since C++17, the message can be omitted: `static_assert(TILE_SIZE > 0);`. In C++11, GCC accepts it but warns (`warning: ‘static_assert’ without a message only available with ‘-std=c++17’`).

### `consteval` (C++20)

A `constexpr` function can still run at run time. A `consteval` function (see [the documentation](https://en.cppreference.com/w/cpp/language/consteval)) never can: every call must be a constant expression. With `consteval int square(int x) { return x * x; }` and an `n` read from the keyboard, compiled with `-std=c++20`, the call `square(8)` passes and `square(n)` is refused:

```text
consteval.cpp:9:43: error: the value of ‘n’ is not usable in a constant expression
```

## The limits of `constexpr`

`constexpr` applies only to what is computed without running the program:

| What we would like | Possible? | Detail |
|---|---|---|
| An integer, a floating-point number, a boolean (true or false), a character (`'a'`) | yes | `constexpr double PI = 3.14159265358979;` |
| A constant text | yes | A [pointer](/?c=langages&s=c&p=pointeurs) (the address of a value in memory) to a text written in the code: `constexpr const char *` |
| A value read from the keyboard, from a file or from the network | no | The value exists only at run time (see the error above) |
| A `constexpr` variable of type `std::string` | no (tested in C++11 and C++17) | The type is not "literal" (see below) |
| A `constexpr` function that calls a non-`constexpr` function | refused if its value is required at compile time | `std::cin >> value` in the body triggers the warning `-Winvalid-constexpr` in C++17 and an error in C++11 |

```cpp
#include <iostream>   // std::cout

constexpr double PI = 3.14159265358979;      // a floating-point number (double)
constexpr const char *TITLE = "Tile game";   // pointer to a text written in the code
constexpr bool MODE_DEBUG = true;            // a boolean: true or false

int main()
{
    std::cout << TITLE << ": " << PI << " " << MODE_DEBUG << "\n";
    return 0;
}
```

```text
Tile game: 3.14159 1
```

(a boolean displays `1` for true, `0` for false.) For `std::string`, the message names the type:

```cpp
#include <iostream>   // std::cout
#include <string>     // std::string: text type of the standard library

constexpr std::string TITLE = "Tile game";   // ERROR: std::string is not constexpr

int main()
{
    std::cout << TITLE << "\n";
    return 0;
}
```

```text
text.cpp:4:23: error: the type ‘const std::string’ [...] ‘TITLE’ is not literal
[...] has a non-trivial destructor
```

(`[...]` marks the omitted words of the message.) A **literal type** is a type that the compiler can create during compilation: numbers, booleans, characters, pointers and simple classes. `std::string` manages memory reserved at run time (see [memory management](/?c=langages&s=cpp&p=gestion-memoire-raii)), which a [destructor](/?c=langages&s=cpp&p=classes-et-objets) frees at the end of its life: it is not literal. For a constant text, we write `constexpr const char *`.

## Organizing a project's constants

Shared constants go in a header, in a namespace. A `constexpr` constant of a namespace exists in **one copy per `.cpp` file** that includes the header (each file has its copy, without conflict at link time). Since C++17, `inline constexpr` gives a single copy, shared by the whole program:

```cpp
#ifndef CONSTANTS_H
#define CONSTANTS_H
namespace Config {
    constexpr int TILE_SIZE = 64;           // one copy per .cpp file
    inline constexpr int TILE_INLINE = 64;  // a single copy for the whole program (C++17)
}
// defined in another .cpp file: they return the address seen from that file
const int *addressOfTile();
const int *addressOfTileInline();
#endif
```

In a program of two `.cpp` files including this header (one defines the two functions, the other calls them), the address of `TILE_SIZE` seen by each is different in C++14 as in C++17; that of `TILE_INLINE` is the same in C++17 (observed result). For a simple number read by value, the difference does not matter at all: it is only noticeable if the address is requested.

To keep the `-D` setting of `#define` with the type and scope of `constexpr`, we combine the two: the macro serves only as an entry point, read once.

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE_PX     // the macro only serves as an entry point for -D...
#define TILE_SIZE_PX 64  // ...with a default value
#endif

constexpr int TILE_SIZE = TILE_SIZE_PX;   // the rest of the code uses this typed constant
// static_assert: stops the compilation if the condition is false
static_assert(TILE_SIZE > 0, "the size of a tile must be positive");

int main()
{
    std::cout << "Tile: " << TILE_SIZE << " pixels\n";
    return 0;
}
```

This file is called here `setting.cpp`:

```bash
g++ -std=c++17 setting.cpp -o setting && ./setting
g++ -std=c++17 -DTILE_SIZE_PX=32 setting.cpp -o setting && ./setting
g++ -std=c++17 -DTILE_SIZE_PX=0 setting.cpp -o setting
```

```text
Tile: 64 pixels
Tile: 32 pixels
setting.cpp:9:25: error: static assertion failed: the size of a tile must be positive
setting.cpp:9:25: note: the comparison reduces to ‘(0 > 0)’
```

The same program also compiles in C++11. The rest of the code uses only `TILE_SIZE`: an absurd value passed with `-D` is stopped at compile time by `static_assert`.

## Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Using a `const` initialized at run time as an array size | `the value of ‘size’ is not usable in a constant expression`; or, with a "C-style" array, a `-Wvla` warning only under GCC | Declare the size `constexpr`; if the size is truly unknown at compile time, use `std::vector` (see [containers](/?c=langages&s=cpp&p=stl-conteneurs)) |
| Believing a `constexpr` function is always computed at compile time | `square(n)` with `n` read from the keyboard runs at run time, without error | Assign the result to a `constexpr` variable, or use `consteval` (C++20) |
| Macro with a **parameter** (a name in parentheses, replaced by the text supplied at the call) without parentheses | `SQUARE_WRONG(1 + 2)` gives 5 and not 9 | Put parentheses around each parameter and the result, or use a `constexpr` function |
| Constant `#define` without parentheses | `5120 / WIDTH_WRONG` gives 800 and not 8 | Add parentheses: `#define WIDTH_RIGHT (64 * 10)` |
| Semicolon at the end of a `#define` | `#define TILE_SIZE 64;` then `int cells[TILE_SIZE];` gives `expected ‘]’ before ‘;’ token` | No semicolon in a macro |
| Collision of macros with the same name | The last definition encountered wins; only `warning: "WIDTH" redefined` reports it | Constants in a namespace; read the compiler warnings |
| Macro defined in a function | It stays active after the function (example `macro_scope.cpp`) | A local `constexpr`, which disappears with the function |
| `#if` on a C++ constant | `TILE_SIZE` equals 0 in the `#if`: the chosen branch is false, without any error | Keep a macro for the `#if`; elsewhere, `if` or `static_assert` |
| `static constexpr` used by address in C++11 or C++14 | `undefined reference to ‘Game::TILE_SIZE’` | Add `constexpr int Game::TILE_SIZE;` in a `.cpp` file |
| `static const double` in a class | `‘constexpr’ needed for in-class initialization of static data member ‘const double Game::RATIO’ of non-integral type` | Write `static constexpr double RATIO = 0.5;` |
| Forgetting `static` in front of a `constexpr` member | `non-static data member ‘TILE_SIZE’ declared ‘constexpr’` | Write `static constexpr int TILE_SIZE = 64;` |
| `constexpr` on a `std::string` | `the type ‘const std::string’ ... is not literal` | `constexpr const char *` for a constant text |

The `#if` pitfall is checked on this program (the constant is indeed 64, the `#if` thinks it equals 0):

```cpp
#include <iostream>   // std::cout

constexpr int TILE_SIZE = 64;   // a C++ constant, not a macro

// #if tests a condition before compilation; it only knows macros
#if TILE_SIZE > 32              // TILE_SIZE is not a macro: it equals 0 here
const char *size = "large";     // chosen if TILE_SIZE > 32
#else
const char *size = "small";     // chosen otherwise
#endif

int main()
{
    std::cout << "Tile " << size << " (" << TILE_SIZE << " pixels)\n";
    return 0;
}
```

```text
Tile small (64 pixels)
```

The option `-Wundef` warns about it: `warning: "TILE_SIZE" is not defined, evaluates to 0 [-Wundef]`.

The parentheses pitfall is checked on this program:

```cpp
#include <iostream>   // std::cout

#define SQUARE_WRONG(x) x * x             // parameter without parentheses
#define SQUARE_RIGHT(x) ((x) * (x))       // parameter and result in parentheses
#define WIDTH_WRONG 64 * 10               // constant without parentheses
#define WIDTH_RIGHT (64 * 10)             // constant in parentheses
constexpr int square(int x) { return x * x; }   // function: x is computed first

int main()
{
    // SQUARE_WRONG(1 + 2) becomes 1 + 2 * 1 + 2, that is 1 + 2 + 2 = 5
    std::cout << SQUARE_WRONG(1 + 2) << " " << SQUARE_RIGHT(1 + 2) << " "
              << square(1 + 2) << "\n";
    // 5120 / WIDTH_WRONG becomes 5120 / 64 * 10, that is 80 * 10 = 800
    std::cout << 5120 / WIDTH_WRONG << " " << 5120 / WIDTH_RIGHT << "\n";
    return 0;
}
```

```text
5 9 9
800 8
```

## Best practices

| Best practice | Why |
|---|---|
| `constexpr` by default for a value known at compile time | The compiler checks the promise; the type and the scope are respected |
| `const` only for a value computed at run time | It says "fixed here, never modified", without claiming compile-time calculation |
| `#define` reserved for needs that only the preprocessor covers: `-D` setting, `#if` condition, include guard | Everywhere else, the macro has no type, no scope, and no name in the debugger |
| A class constant as `static constexpr`, placed in `private` if it only serves the class | A single copy for all objects; no extra public interface |
| A global constant in a namespace (`Config::TILE_SIZE`) | No collision, origin visible when reading |
| A named constant rather than a magic number | The meaning is written; the change is made in one single place |
| `static_assert` for any assumption about a constant | An absurd value stops the compilation, not the game |
| Write macros in uppercase, fully parenthesize them | A macro is recognized when reading; the order of operations stays the one wanted |
| Compile with `-std=c++17` (or later) and `-Wall -Wextra -pedantic` | From C++17 on, no out-of-class definition to write; the warnings report redefined macros and variable-length arrays |

To go further, on cppreference: [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr), [`const`](https://en.cppreference.com/w/cpp/language/cv), [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert), [static members](https://en.cppreference.com/w/cpp/language/static), [the `inline` specifier](https://en.cppreference.com/w/cpp/language/inline), [`consteval`](https://en.cppreference.com/w/cpp/language/consteval), [`std::array`](https://en.cppreference.com/w/cpp/container/array) and [macros](https://en.cppreference.com/w/cpp/preprocessor/replace).

## Key Takeaways

| Takeaway | Detail |
|---|---|
| A constant names a fixed value | It replaces a magic number: the meaning is written, the change is made in one place |
| Two moments | Compilation translates the code; execution runs the program. A constant expression is computed at compile time |
| `#define` | Text replacement by the preprocessor: no type, no scope, prone to collisions; visible everywhere, settable with `-D`, usable in `#if` |
| `const` | Variable that is no longer modified after its initialization; the value can come from execution (keyboard, file); unusable as an array size in that case |
| `constexpr` | Typed constant whose value is known at compile time; otherwise an error; usable as an array size, template argument and in `static_assert` |
| Scope | Function (local), namespace (`Config::NAME`), class (`Class::NAME`); a macro has none |
| `static constexpr` member | One copy shared by the class; `Game::TILE_SIZE` outside the class if `public`, error if `private` |
| Standard | Before C++17, an address requested requires `constexpr int Game::TILE_SIZE;` outside the class; since C++17, the member is `inline`. `constexpr` functions: a single `return` in C++11, loops since C++14; `consteval` in C++20 |
| Limits | Only what is computed without running the program: no input, no file, no constexpr `std::string` |
| Do not confuse | `const` (never modified) and `constexpr` (known at compile time); `#define` (text) and constant (typed value) |
