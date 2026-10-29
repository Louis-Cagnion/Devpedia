---
order: 31
---

# Driving fields by their offset (offsetof) and the compound literal

A **structure** (`struct`) groups several values under a single name; each value takes a named slot in it, a **field** (see [structures](/?c=langages&s=c&p=variables#structures-struct)). This chapter answers two questions that come up as soon as you fill a structure from a settings file. How do you avoid a long chain of `if`, one branch per field? By storing, in an **array** (a sequence of slots of the same type), the description of each field, including its **byte position** in the structure: that is the role of `offsetof`. And how do you build a structure on the spot, without an intermediate variable, to pass it to a function? With the **compound literal** of C99 (the 1999 revision of the C language), `(Type){values}`.

It assumes you already know [pointers](/?c=langages&s=c&p=pointeurs) (the address of a value in memory and the dereferencing `*`), [loops](/?c=langages&s=c&p=boucles) and [conditions](/?c=langages&s=c&p=conditions). The **byte** (8 bits) is the unit of memory: each byte has its own address (see [how data is organized in memory](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). All programs were compiled with `gcc -std=c11 -Wall -Wextra` under Linux (see [the compilation process](/?c=langages&s=c&p=compilation)), then run; those that use the compound literal were also run with `-std=c99`, with the same result.

## The problem: storing "name value" lines in a structure

A program reads a settings file. Each line is a **directive**: a name, a space, a value (`speed 2.5`). The program must store each value in the right field of a `Settings` structure, keeping it between a minimum and a maximum bound. The most direct version is a chain of `if`:

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    float speed;                        // movement speed, from 0 to 10
    float gravity;                      // gravity strength, from 0 to 20
    int   size;                         // size in cells, from 1 to 50
} Settings;

// Stores the value v in the field that bears the given name. Returns 0, or -1 if unknown.
static int apply(Settings *r, const char *name, double v)
{
    if (strcmp(name, "speed") == 0) {           // first field
        if (v < 0.0) v = 0.0;                   // lower bound copied here
        if (v > 10.0) v = 10.0;                 // upper bound copied here
        r->speed = (float)v;                    // write into the field
    } else if (strcmp(name, "gravity") == 0) {  // second field: everything starts again
        if (v < 0.0) v = 0.0;
        if (v > 20.0) v = 20.0;
        r->gravity = (float)v;
    } else if (strcmp(name, "size") == 0) {     // third field: once more
        if (v < 1.0) v = 1.0;
        if (v > 50.0) v = 50.0;
        r->size = (int)v;
    } else {
        return -1;                              // no field bears this name
    }
    return 0;
}

int main(void)
{
    const char *lines[] = {"speed 2.5", "gravity 99", "size 12", "color 3"};
    Settings    r = {0};                // all the fields at zero
    char        name[32];               // the name read from the line
    double      v;                      // the value read from the line

    for (size_t i = 0; i < 4; i++) {            // one pass per line
        if (sscanf(lines[i], "%31s %lf", name, &v) != 2)   // extracts "name value"
            continue;                   // malformed line: we ignore it
        if (apply(&r, name, v) == -1)           // unknown field?
            printf("unknown directive: %s\n", name);
    }
    printf("speed=%g gravity=%g size=%d\n", r.speed, r.gravity, r.size);
    return 0;
}
```

```text
unknown directive: color
speed=2.5 gravity=20 size=12
```

The program works: `gravity 99` was brought back to the bound 20, and `color` is reported as unknown. A few elements used:

| Element | Role |
|---|---|
| `static` (in front of a function) | The function is visible only in this file |
| `const` (in `const char *name`) | Promises that the pointed value will not be modified |
| `const char *lines[] = {...}` | An array of texts; a text is a sequence of `char` (see [strings](/?c=langages&s=c&p=variables#strings)) |
| `typedef struct {...} Settings;` | Gives the short name `Settings` to this structure type, so you do not write `struct` at each use ([`typedef`](https://en.cppreference.com/w/c/language/typedef)) |
| `r->speed` | The `speed` field of the structure whose address is `r`; equivalent to `(*r).speed` |
| `strcmp(a, b) == 0` | True when the two texts are identical (see [comparing a string](/?c=langages&s=c&p=variables#searching-and-comparing-a-string-strcmp-strchr-strrchr-strstr)) |
| `sscanf(line, "%31s %lf", name, &v)` | Extracts a word (at most 31 characters) then a number of type `double`; returns the number of values read (see [`sscanf`](/?c=langages&s=c&p=lecture-formatee-scanf)) |
| `Settings r = {0};` | Initializes the structure: the first field is 0 and the unnamed fields are also zero |
| `(float)v` | Converts the `double` to `float` before writing (two floating-point number types, the `double` being the most precise: see [floating-point numbers](/?c=langages&s=c&p=variables#floating-point-numbers)) |
| `%g`, `%d` | In `printf`: a decimal number without useless zeros, an integer |
| `size_t` | Unsigned integer made to count sizes and positions; `printf` displays it with `%zu` |

Its drawbacks appear as soon as there are more than three fields:

| Drawback | Consequence |
|---|---|
| One more branch per field | Twenty fields give twenty nearly identical branches |
| The bounds are copied into each branch | Changing a bounding rule means touching every branch |
| Easy to forget | A field added to the structure without a matching branch is silently ignored |
| The data is mixed with the code | Impossible to reuse the list of directives (to display a help text, for example) |

The remedy: separate the **data** (which directives exist, with which bounds) from the **code** (a single function that knows how to apply any directive). The data goes into an array, and so that the function knows where to write, the array must record the position of the field in the structure.

## `offsetof`: the position of a field in its structure

The **offset** of a field is the number of bytes between the start of the structure and the start of that field. The first field is at 0. The macro `offsetof(type, field)`, defined in the header `<stddef.h>` (see [headers](/?c=langages&s=c&p=headers)), computes it and returns it as a `size_t` ([`offsetof`](https://en.cppreference.com/w/c/types/offsetof)). A **macro** is a piece of code that the preprocessor replaces before compilation (see [the preprocessor](/?c=langages&s=c&p=compilation#1-the-preprocessor)).

One might think that the offset of a field is the sum of the sizes of the preceding fields. That is false as soon as the compiler inserts **padding**: lost bytes, placed between two fields so that each value starts at an address that is a multiple of its size (see [padding](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#padding-in-structures) and [alignment](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#alignment)). This program shows the real offsets of a test structure:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    char   active;                      // 1 byte
    float  speed;                       // 4 bytes
    char   level;                       // 1 byte
    double mass;                        // 8 bytes
} Demo;

int main(void)
{
    printf("active : offset %zu\n", offsetof(Demo, active));   // start of the structure
    printf("speed  : offset %zu\n", offsetof(Demo, speed));    // after padding
    printf("level  : offset %zu\n", offsetof(Demo, level));    // right after speed
    printf("mass   : offset %zu\n", offsetof(Demo, mass));     // after padding
    printf("total size : %zu bytes\n", sizeof(Demo));          // sum of the fields: 14
    return 0;
}
```

```text
active : offset 0
speed  : offset 4
level  : offset 8
mass   : offset 16
total size : 24 bytes
```

The four fields weigh 1 + 4 + 1 + 8 = 14 bytes, and the structure takes up 24 ([`sizeof`](/?c=langages&s=c&p=memoire#sizeof) gives the size in bytes of a type). Here is the memory of this structure, one byte per column:

```text
byte    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
        a  .  .  .  v  v  v  v  n  .  .  .  .  .  .  .  m  m  m  m  m  m  m  m
        ^           ^           ^                       ^
        offset 0    offset 4    offset 8                offset 16

a = active   v = speed   n = level   m = mass   . = padding (lost bytes)
```

| Field | Size | Offset expected by addition | Real offset (`offsetof`) | Why the gap |
|---|---|---|---|---|
| `active` | 1 | 0 | 0 | First field |
| `speed` | 4 | 1 | 4 | A `float` starts at a multiple of 4: 3 bytes lost |
| `level` | 1 | 5 | 8 | It follows `speed`, which ends at byte 7 |
| `mass` | 8 | 6 | 16 | A `double` starts at a multiple of 8: 7 bytes lost |

This difference is exactly the reason for `offsetof`: only the compiler knows where it placed each field, and here it says so. The result is a **constant** known at compile time, so it can be used in an array initialized outside any function. It holds for **any** variable of the same structure type: an offset does not depend on a particular instance.

## The directive table and the single function

Each directive becomes a line `{name, offset, min, max}` of an array. All the logic then fits in a single function: look up the line by its name, bound the value, write into the field. To start, the table contains only the two `float` fields; `size`, of type `int`, arrives in the next section.

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float speed;                        // movement speed
    float gravity;                      // gravity strength
    int   size;                         // size in cells (covered later)
} Settings;

typedef struct {
    const char *name;                   // name of the directive in the file
    size_t      offset;                 // position of the field in Settings, in bytes
    double      min;                    // smallest accepted value
    double      max;                    // largest accepted value
} Directive;

static const Directive g_table[] = {
    {"speed", offsetof(Settings, speed), 0.0, 10.0},    // one line per field
    {"gravity", offsetof(Settings, gravity), 0.0, 20.0},
};
#define DIRECTIVE_COUNT (sizeof g_table / sizeof g_table[0])     // number of lines

// Applies a "name value" line. Returns 0 if it was applied, -1 otherwise.
static int apply_line(Settings *r, const char *line)
{
    char   name[32];                    // the name read
    double v;                           // the value read

    if (sscanf(line, "%31s %lf", name, &v) != 2 || !isfinite(v))   // form and value
        return -1;
    for (size_t i = 0; i < DIRECTIVE_COUNT; i++) {      // looks for the line in the table
        if (strcmp(name, g_table[i].name) != 0)         // not this one
            continue;
        if (v < g_table[i].min) v = g_table[i].min;     // lower bound
        if (v > g_table[i].max) v = g_table[i].max;     // upper bound
        *(float *)((char *)r + g_table[i].offset) = (float)v;   // writes into the field
        return 0;
    }
    return -1;                          // no line bears this name
}

int main(void)
{
    const char *lines[] = {"speed 2.5", "gravity 99", "color 3", "speed nan"};
    Settings    r = {0};                // all the fields at zero

    for (size_t i = 0; i < 4; i++)      // one pass per line
        if (apply_line(&r, lines[i]) == -1)
            printf("line rejected: %s\n", lines[i]);
    printf("speed=%g gravity=%g\n", r.speed, r.gravity);
    return 0;
}
```

```text
line rejected: color 3
line rejected: speed nan
speed=2.5 gravity=20
```

| Element | Role |
|---|---|
| `static const Directive g_table[]` | Fixed array, never modified (`const`), visible only in this file (`static`) |
| `{"speed", offsetof(...), 0.0, 10.0}` | One line: the name, the offset of the field, then the two bounds |
| `sizeof g_table / sizeof g_table[0]` | Bytes of the whole array divided by bytes of one line: the number of lines, which follows every addition automatically |
| `continue;` | Goes directly to the next pass of the loop (see [`break` and `continue`](/?c=langages&s=c&p=boucles#break-and-continue)) |
| `... != 2 \|\| !isfinite(v)` | `\|\|` means "or"; `!` inverts a condition: we reject the line if it is malformed or if the value is not finite |
| `isfinite(v)` | False for `NaN` ("not a number") and infinity, from `<math.h>`: they would pass the bounds without error (see [`NaN` and `inf`](/?c=langages&s=c&p=convertir-un-texte-en-nombre#decimal-numbers-strtod-nan-and-inf)) |
| The two `if` on `v` | Bring the value back into `[min, max]` (see [bounding each value](/?c=langages&s=c&p=convertir-un-texte-en-nombre#bounding-each-value-to-its-domain)) |

### Breaking down the write into the field

The important line is `*(float *)((char *)r + g_table[i].offset) = (float)v;`. It is read from the inside out:

| Step | Expression | Type | What happens |
|---|---|---|---|
| 1 | `r` | `Settings *` | The address of the start of the structure |
| 2 | `(char *)r` | `char *` | A **cast**: an explicit conversion from one type to another, written `(type)value`. The same address, but seen as that of a `char`, which weighs 1 byte |
| 3 | `(char *)r + g_table[i].offset` | `char *` | Advances by `offset` bytes: the address of the targeted field |
| 4 | `(float *)(...)` | `float *` | A second cast: same address, but we declare that a `float` is there |
| 5 | `*(...)` | `float` | The dereferencing: the field itself, ready to receive a value |
| 6 | `= (float)v` | | The `double` read is converted to `float`, then written into the field's 4 bytes |

The `(char *)` of step 2 is essential. On a pointer, the addition counts in **elements** and not in bytes: `r + 8` would advance by 8 times the size of `Settings` (see [pointer arithmetic](/?c=langages&s=c&p=pointeurs#pointer-arithmetic)), far outside the structure. With a `char *`, each unit is exactly 1 byte, and the byte offset given by `offsetof` lands exactly.

```text
r (Settings *)       r + 4 bytes
     |                    |
     v                    v
     +--------------------+--------------------+--------------------+
     |  speed (4 bytes)   |  gravity (4 bytes) |  size (4 bytes)    |
     +--------------------+--------------------+--------------------+
     0                    4                    8                    12

(char *)r + 4  -->  address of gravity  -->  (float *) then *  -->  write
```

In C++, this kind of pointer conversion is written `reinterpret_cast`, precisely to make it visible (see [casts in C++](/?c=langages&s=cpp&p=cast-cpp)): C has only the `(type)value` syntax for everything.

The offset, not the address of the field, is what the table stores, because the table exists before any structure: it is written once, and the same line serves for any instance of `Settings`, whether it is on the stack (the memory of local variables) or in an array. Adding a field amounts to **adding a single line** to the table: the function does not change. The kinship with the dispatch table of PHP is direct (see [the dispatch table of routing](/?c=langages&s=php&p=routage#the-front-controller-and-the-dispatch-table)): a sequence of comparisons is replaced by an array lookup. The C variant for calling a function rather than writing into a field relies on [function pointers](/?c=langages&s=c&p=pointeurs#function-pointers) and on [dispatch by type tag](/?c=langages&s=c&p=generiques-par-etiquette-de-type#dispatching-without-a-chain-of-if-else-if).

## The limits and pitfalls of writing by offset

### Several field types: a `type` column

The cast `(float *)` assumes that **all** the targeted fields are `float`s. As soon as a field is an `int`, the function must know which one to write: the table gains a `type` column. An **enumeration** (`enum`) is a list of names to which the compiler assigns the integers 0, 1, 2... ([`enum`](https://en.cppreference.com/w/c/language/enum)); here it serves as a tag.

```c
typedef enum {                          // the field types the table can write
    TYPE_FLOAT,                         // the field is a float
    TYPE_INT                            // the field is an int
} Type;

typedef struct {
    const char *name;                   // name of the directive in the file
    Type        type;                   // type of the targeted field
    size_t      offset;                 // position of the field in Settings, in bytes
    double      min;                    // smallest accepted value
    double      max;                    // largest accepted value
} Directive;

static const Directive g_table[] = {
    {"speed", TYPE_FLOAT, offsetof(Settings, speed), 0.0, 10.0},
    {"gravity", TYPE_FLOAT, offsetof(Settings, gravity), 0.0, 20.0},
    {"size",  TYPE_INT,   offsetof(Settings, size),  1.0, 50.0},   // the line added
};

// Writes v into the field described by d, with the right type.
static void write_field(Settings *r, const Directive *d, double v)
{
    char *byte = (char *)r + d->offset;         // address of the field, counted in bytes

    switch (d->type) {                  // the type decides how to write
    case TYPE_FLOAT:
        *(float *)byte = (float)v;      // 4 bytes, encoded as a floating-point number
        break;
    case TYPE_INT:
        *(int *)byte = (int)v;          // 4 bytes, encoded as an integer
        break;
    }
}
```

`apply_line` barely changes: instead of writing into the field, it calls `write_field(r, &g_table[i], v)`. The `switch` chooses among cases according to a value (see [the `switch`](/?c=langages&s=c&p=conditions#the-switch)). The complete program of the last section brings all these pieces together.

### Alignment: why the formula works

The address `(char *)r + offset` is correctly aligned for the type of the field **because** `offset` comes from `offsetof`, which takes padding into account. An offset computed by hand (4 + 4 to reach `size`) would fail as soon as a field is preceded by a smaller or larger type: in the test structure of the previous section, the sum gave 1 for `speed`, the real value being 4. A misaligned access is forbidden on some processors and slower on others.

### Writing a type of the wrong size

The compiler does not check that the cast matches the field. Writing a `double` (8 bytes) at the address of a `float` (4 bytes) overflows into the neighboring field:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float speed;                        // bytes 0 to 3
    float gravity;                      // bytes 4 to 7
    int   size;                         // bytes 8 to 11
} Settings;

int main(void)
{
    Settings r = {5.0f, 9.8f, 12};      // three starting values

    // deliberate error: a double (8 bytes) written into a 4-byte field
    *(double *)((char *)&r + offsetof(Settings, speed)) = 1.0;
    printf("speed=%g gravity=%g size=%d\n", r.speed, r.gravity, r.size);
    return 0;
}
```

```text
speed=0 gravity=1.875 size=12
```

The 8 bytes of the `double` `1.0` overwrote **both** `speed` and `gravity`. The displayed values (0 then 1.875) are those of a test x86 processor, which stores the bytes of a number starting with the least significant one (see [byte order](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#byte-order-endianness)); on another machine they would change. The language promises nothing here: it is **undefined behavior**, a case where the C language standard guarantees no result (neither a crash nor a precise value).

### Losing the type check

A normal write, `s.size = 2.5f`, goes through the compiler, which knows the type of the field: it converts and, with the option `-Wconversion`, warns about the loss. With the offset, it no longer knows anything:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float speed;                        // field of type float
    int   size;                         // field of type int
} R;

int main(void)
{
    R r = {0, 0};                       // two fields at zero
    R s = {0, 0};                       // a second structure, for comparison

    s.size = 2.5f;                      // normal write: the compiler converts
    *(float *)((char *)&r + offsetof(R, size)) = 2.5f;   // write by offset
    printf("normal : size=%d\n", s.size);
    printf("by offset : size=%d\n", r.size);
    return 0;
}
```

```text
normal : size=2
by offset : size=1075838976
```

The second write compiles without the slightest warning: the 4 bytes of the `float` 2.5 were stored as they are, in a field later read as an integer, hence 1,075,838,976. That is the price of the table-driven approach: the safety that an `if` per field gives (each branch is checked) is replaced by the discipline of a correct `type` column.

| Approach | Compiler check | Adding a field |
|---|---|---|
| Chain of `if` or `switch` on the name | Complete: every assignment is typed | A whole branch |
| Table `{name, offset, min, max}` | None on the type written | One line |

### Bit-fields and other structures

A **bit-field** is a field whose width is fixed in bits (`unsigned level : 3;`) to group several small values in the same byte (see [bitwise operators](/?c=langages&s=c&p=operateurs-binaires) for bit manipulations, and [bit-fields](https://en.cppreference.com/w/c/language/bit_field)). It has no byte address of its own, so `offsetof` does not apply to it. The compiler says so:

```text
error: attempt to take address of bit-field structure member ‘level’
```

Finally, the table is tied to the structure type for which its offsets were computed. Applied to another type, it still compiles and writes to positions unrelated to what was intended.

## The C99 compound literal: a value built in place

A **literal** is a value written as it is in the code: `42`, `3.5`, `'a'`, `"abc"`. Numbers and characters are enough for simple types, but no notation produces a structure in one go. To pass the point (4, 6) to a function (as an **argument**: the value given to the function when it is called, see [passing to a function](/?c=langages&s=c&p=pointeurs#passing-a-pointer-to-a-function-pass-by-address)), you had to declare a variable, fill it, then pass it. The **compound literal** builds this value at the place where it is needed: `(Type){values}` ([compound literal](https://en.cppreference.com/w/c/language/compound_literal)). The `(Type)` part looks like a cast, but the braces that follow make it a constructed value.

| Way to build the point (4, 6) | Notation | Named variable |
|---|---|---|
| Declaration with initialization | `Point p = {4, 6};` | Yes, `p` |
| Field-by-field assignment | `p.x = 4; p.y = 6;` | Yes, `p` |
| Compound literal | `(Point){4, 6}` | No |

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscissa
    int y;                              // ordinate
} Point;

static double distance2(Point a, Point b)
{
    int dx = b.x - a.x;                 // horizontal difference
    int dy = b.y - a.y;                 // vertical difference
    return (double)(dx * dx + dy * dy); // square of the distance
}

static int sum(const int *t, int n)
{
    int total = 0;                      // running total
    for (int i = 0; i < n; i++)         // walks through n integers
        total += t[i];
    return total;
}

static void move(Point *p)
{
    p->x += 10;                         // modifies the point received by address
}

int main(void)
{
    Point p = {1, 2};                   // the classic way: a named variable

    printf("%.0f\n", distance2(p, (Point){4, 6}));              // a point without a name
    printf("%.0f\n", distance2((Point){0, 0}, (Point){.y = 3, .x = 4}));
    printf("%d\n", sum((int[]){1, 2, 3, 4}, 4));                // an array without a name
    printf("%d\n", sum((int[5]){1, 2}, 5));                     // 5 cells, 3 set to zero
    move(&(Point){7, 7});               // address of a literal: we can write it
    char *word = (char[]){"abc"};       // modifiable char array (copy of "abc")
    word[0] = 'X';                      // allowed: this is not a string literal
    printf("%s\n", word);
    return 0;
}
```

```text
25
25
10
3
Xbc
```

| Form | Example | What we get |
|---|---|---|
| Structure, values in field order | `(Point){4, 6}` | `x` is 4, `y` is 6 |
| Structure, **designated initializers** | `(Point){.y = 3, .x = 4}` | `.field = value` names the targeted field: the order is free and an unnamed field is zero ([initialization](https://en.cppreference.com/w/c/language/struct_initialization)) |
| Array, size deduced | `(int[]){1, 2, 3, 4}` | 4 cells |
| Array, size fixed | `(int[5]){1, 2}` | 5 cells, the last three zero |
| Designated array | `(int[]){[2] = 7}` | 3 cells: `{0, 0, 7}` |
| Modifiable text | `(char[]){"abc"}` | 4 cells (`a`, `b`, `c` and the final `\0`), copied and modifiable |

The values `25` and `25` are the squares of the distances from (1, 2) to (4, 6) and from (0, 0) to (4, 3): in both cases a difference of 3 and 4 (or 4 and 3), that is 9 + 16.

### Lifetime: until the end of the block

The **lifetime** of a value is the period during which it exists in memory. A **block** is the text between an opening brace `{` and its closing `}` (body of a function, of a loop...). A compound literal written in a block behaves like a local variable of that block:

| Where the literal is written | Its life |
|---|---|
| In a function or a block | Until the closing brace of the enclosing block |
| In the body of a loop | Recreated on each iteration |
| Outside any function | The whole program (the values must then be constants) |

```c
typedef struct { int x; int y; } Point;

static Point *const g_origin = &(Point){0, 0};   // global: lives for the whole program
static const int   *g_firsts = (const int[]){2, 3, 5, 7};   // same here

void example(void)
{
    int *p;                             // a pointer, declared in the function's block
    {                                   // an inner block
        p = (int[]){1, 2, 3};           // the array lives until the next }
    }                                   // here the array no longer exists
}                                       // and p would point to a dead zone
```

The consequence: **never keep or return the address of a local compound literal**. Returning it by value, on the other hand, is harmless, since it is a copy.

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscissa
    int y;                              // ordinate
} Point;

static Point *g_ptr;                    // global pointer, to keep an address

static void store(void)
{
    g_ptr = &(Point){3, 4};             // the address of a local literal is kept
}

int main(void)
{
    store();                            // the function ends: its literal no longer exists
    printf("%d\n", g_ptr->x);           // reading a dead zone
    return 0;
}
```

Compiled with `-Wall -Wextra -Werror` only, this program is refused by GCC: `error: storing the address of local variable ‘({anonymous})’ in ‘g_ptr’ [-Werror=dangling-pointer=]`. Compiled with `-fsanitize=address,undefined` added, it gets past compilation, and the execution stops on `ERROR: AddressSanitizer: stack-use-after-return`. These messages are those of the test machine; another compiler may stay silent at compilation, but the error still exists.

### Modifiable, unlike a string literal

The text `"abc"` written in the code is often stored in a read-only memory area: writing into it is undefined behavior, most often a crash. A compound literal `(char[]){"abc"}` is on the contrary a **copy** in an ordinary array: it can be modified (the program above did it: `Xbc`). To forbid it, add `const`: `(const Point){4, 6}`.

### A little C++

The compound literal is a feature of C, not of standard C++: a C++ compiler refuses it or, like GCC, accepts it as an extension while warning with `-pedantic`: `ISO C++ forbids compound-literals`. In C++, one writes `Point{4, 6}` or uses a constructor (see [classes and objects](/?c=langages&s=cpp&p=classes-et-objets)). A file meant for both languages therefore avoids the compound literal.

## An example that combines both

The two notions complement each other: the table fills the structure, and a compound literal provides its default values. These are returned by a function that gives back the structure by value; the fields that a settings file does not mention thus keep a reasonable value instead of zero. The program brings together the table of the previous section (with the type) and the compound literal:

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float speed;                        // movement speed
    float gravity;                      // gravity strength
    int   size;                         // size in cells
} Settings;

typedef enum { TYPE_FLOAT, TYPE_INT } Type;   // field types the table can write

typedef struct {
    const char *name;                   // name of the directive in the file
    Type        type;                   // type of the targeted field
    size_t      offset;                 // position of the field in Settings, in bytes
    double      min;                    // smallest accepted value
    double      max;                    // largest accepted value
} Directive;

static const Directive g_table[] = {
    {"speed", TYPE_FLOAT, offsetof(Settings, speed), 0.0, 10.0},
    {"gravity", TYPE_FLOAT, offsetof(Settings, gravity), 0.0, 20.0},
    {"size",  TYPE_INT,   offsetof(Settings, size),  1.0, 50.0},
};
#define DIRECTIVE_COUNT (sizeof g_table / sizeof g_table[0])     // number of lines

// The starting values, built on the spot and returned by value (a copy).
static Settings default_settings(void)
{
    return (Settings){.speed = 1.0f, .gravity = 9.8f, .size = 4};
}

static void write_field(Settings *r, const Directive *d, double v)
{
    char *byte = (char *)r + d->offset;         // address of the field, counted in bytes

    if (d->type == TYPE_FLOAT)          // float field
        *(float *)byte = (float)v;
    else                                // int field
        *(int *)byte = (int)v;
}

static int apply_line(Settings *r, const char *line)
{
    char   name[32];                    // the name read
    double v;                           // the value read

    if (sscanf(line, "%31s %lf", name, &v) != 2 || !isfinite(v))   // form and value
        return -1;
    for (size_t i = 0; i < DIRECTIVE_COUNT; i++) {      // looks for the line in the table
        if (strcmp(name, g_table[i].name) != 0)         // not this one
            continue;
        if (v < g_table[i].min) v = g_table[i].min;     // lower bound
        if (v > g_table[i].max) v = g_table[i].max;     // upper bound
        write_field(r, &g_table[i], v);                 // typed write
        return 0;
    }
    return -1;                          // no line bears this name
}

static void show(const char *title, const Settings *r)
{
    printf("%-8s speed=%g gravity=%g size=%d\n",
           title, r->speed, r->gravity, r->size);
}

int main(void)
{
    const char *lines[] = {"speed 2.5", "size 120", "gravity -3", "color 3"};
    Settings    r = default_settings();     // start from the default values

    show("init", &r);
    for (size_t i = 0; i < 4; i++)      // one pass per line of the file
        if (apply_line(&r, lines[i]) == -1)
            printf("line rejected: %s\n", lines[i]);
    show("read", &r);
    show("partial", &(Settings){.size = 8});     // only size is given
    return 0;
}
```

```text
init     speed=1 gravity=9.8 size=4
line rejected: color 3
read     speed=2.5 gravity=0 size=50
partial  speed=0 gravity=0 size=8
```

| Element | Role |
|---|---|
| `(Settings){.speed = 1.0f, .gravity = 9.8f, .size = 4}` | Builds the structure of default values, named fields: the order of the declaration does not matter |
| `return (Settings){...};` | Returns a copy of the structure: safe, unlike the address of a local literal |
| `show("partial", &(Settings){.size = 8})` | Passes the address of an unnamed structure; the unnamed fields are zero, hence `speed=0 gravity=0` |
| `const Settings *r` | Says that `show` will not modify the structure received |
| `%-8s` | Writes a left-aligned text over 8 characters, so that the columns line up |

| Line in the file | What the table does | Result |
|---|---|---|
| `speed 2.5` | Value within `[0, 10]` | `speed` goes from 1 to 2.5 |
| `size 120` | Exceeds the bound 50 | `size` is 50, written as an `int` |
| `gravity -3` | Below the bound 0 | `gravity` is 0 |
| `color 3` | No line with this name | Rejected, the structure does not change |

Adding a setting (a `color`, a `volume`) requires a field in `Settings`, a value in `default_settings` and a line in `g_table`: no function to modify.

## Pitfalls

| Pitfall | Why | Remedy |
|---|---|---|
| Writing `r + offset` without `(char *)` | The addition counts in whole structures, not bytes | Always `(char *)r + offset` |
| A cast that does not match the field's type | Wrong size or wrong encoding, with no error or warning | A `type` column and one cast per type |
| Writing a `double` into a `float` field | Overflows into the neighboring field (undefined behavior) | Convert the value with `(float)v` before writing |
| Computing the offset by adding sizes | Padding shifts the fields | `offsetof` only |
| `offsetof` on a bit-field | It has no byte address: compilation error | An ordinary field, or a dedicated access function |
| A table applied to another structure | The offsets no longer match, with no error | One table per structure type, named accordingly |
| Letting `NaN` through | It passes every bounds test | Test `isfinite` before bounding |
| Keeping the address of a local compound literal | It disappears at the end of the block | Return the structure by value or copy it into a long-lived variable |
| Modifying a string literal `"abc"` | Read-only area: undefined behavior | Copy into an array: `char t[] = "abc";` or `(char[]){"abc"}` |
| Compound literal values in field order | A moved or added field changes the meaning without error | Designated initializers `.field = value` |
| Using the compound literal in code shared with C++ | Non-standard in C++ | Keep this code for C, or write `Point{4, 6}` on the C++ side |

## Best practices

| Best practice | Why |
|---|---|
| Separate the data (the table) from the code (the single function) | Adding a setting touches only one line |
| Count the lines with `sizeof g_table / sizeof g_table[0]` | The count follows every addition automatically |
| Declare the table `static const` | It can be modified neither by mistake nor from another file |
| Compute each offset with `offsetof`, never by hand | The compiler knows the padding |
| Keep a `type` column as soon as the fields differ | Each write gets the cast that suits it |
| Bound the values and test the `sscanf` result before writing | An absurd value or a malformed line is not inserted |
| Compile with `-Wall -Wextra` and run a test with `-fsanitize=address,undefined` | Writes outside a field and dead addresses are detected on the first try |
| Give the default values with a compound literal and named fields | Forgotten fields are zero, and the order of the fields stays free |
| Return a compound literal by value, never by address | A copy survives the function |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | `offsetof(type, field)` (from `<stddef.h>`) gives the offset in bytes of a field in its structure, padding included; it is stored in a table `{name, offset, min, max}`, and a single function writes into the field with `*(float *)((char *)r + offset) = value`. The `(char *)` makes the count in bytes; the second cast says what type is there. One more field = one more line. The compound literal `(Type){values}` (C99) builds a structure or an array in place, modifiable, valid until the end of the block; the designated initializers `.field = value` name the fields. Documentation: [`offsetof`](https://en.cppreference.com/w/c/types/offsetof), [compound literal](https://en.cppreference.com/w/c/language/compound_literal). |
| **Pitfalls to avoid** | Forgetting `(char *)`; a cast that does not match the field's type (no compiler check); writing a `double` into a `float`; computing an offset by hand; `offsetof` on a bit-field; a table applied to the wrong structure; letting `NaN` through; keeping the address of a local compound literal; modifying a string literal; relying on the compound literal in C++. |
| **Best practices** | `static const` table separate from the code; `offsetof` for each offset; a `type` column as soon as the fields differ; bounds applied in one place only; default values as a compound literal with designated initializers; compound literal returned by value, never by address. |
