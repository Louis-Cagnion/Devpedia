---
order: 4
---

# The comma operator

The comma operator evaluates **two expressions in order**, and keeps only the value of the **second** one: the first is only there for its side effect (a change it makes in passing, like incrementing a variable), its own value is discarded.

```c
int a = (1, 2);   // evaluates 1 (discarded), then 2: a is 2
```

## Use case: several variables in a `for` loop

The comma operator shows up most often in a [`for`](/?c=langages-de-programmation&s=c&p=boucles) loop, to advance **two** variables on every iteration instead of just one:

```c
for (int i = 0, j = 10; i < j; i++, j--) {
    printf("i = %d, j = %d\n", i, j);
}
```

- `i = 0, j = 10` initializes both variables one after the other.
- `i++, j--` increments `i` AND decrements `j` on every iteration, packed into a single one of the `for` loop's three parts.

Without the comma operator, only a single expression can occupy each of the `for` loop's three parts: there's no way to write two statements separated by a semicolon directly in there.

## Pitfall: not to be confused with the comma-as-separator

The same `,` character plays a completely different role in two other very common contexts, which have **nothing to do** with the comma operator:

| Context | Role of the comma | Example |
|---|---|---|
| Comma operator | Evaluates both sides, keeps the value of the second | `(x++, y++)` |
| Argument separator | Separates a function call's arguments | `printf("%d %d", a, b)` |
| Declaration separator | Separates several variables declared together | `int a, b, c;` |

> **Pitfall:** in `printf(a, b)`, the comma just separates two arguments: `b` isn't "the value that's kept" the way the comma operator would keep it, both values are passed to the function separately. The compiler tells the two uses apart by their **position** (inside a call's parentheses, or in a declaration, versus in the middle of an expression) rather than by a different symbol.

## Pitfall: the order in which arguments are evaluated is unspecified

Unlike the comma operator, which guarantees "left side first, then the right one", the comma that separates a call's arguments **guarantees no order at all**: the C language lets the compiler evaluate the arguments in whatever order suits it (the order is said to be **unspecified**). No error or warning is reported, and the result can change from one compiler or option to another.

```c
#include <stdio.h>

static int add_ten(int *n)
{
    *n += 10;       // changes the caller's variable (side effect)
    return *n;      // returns the new value
}

int main(void)
{
    int x = 1;

    // x is read and x is modified in the same call: the order decides the result
    printf("%d %d\n", add_ten(&x), x);
    return 0;
}
```

| Order chosen by the compiler | Output |
|---|---|
| Left to right: `add_ten(&x)` first, then reading `x` | `11 11` |
| Right to left: reading `x` first, then `add_ten(&x)` | `11 1` |

With gcc on x86-64, this program prints `11 1` (right to left), at both `-O0` and `-O2`, but another compiler is free to print `11 11`. A test that passes on the development machine therefore proves nothing about the others.

The general rule: a variable must never be **modified** and **read** (or modified twice) in the same expression unless the language imposes an order between the two. The places where the order is guaranteed are called **sequence points**: the comma operator is one, and so are `&&`, `||`, `?:` and the end of a statement terminated by `;`.

| Code | Status | Why |
|---|---|---|
| `f(g(&x), x)` | Unspecified order | Arguments have no order between them |
| `t[i++] = i;` | **Undefined behavior** | `i` is modified and read with no sequence point between the two: the program may do anything (gcc warns with `-Wall`) |
| `(a = f(), b = g())` | Guaranteed order | The comma operator imposes left then right |

> **Best practice:** compute into a variable first, then pass the variable. One statement per side effect makes the order explicit and the result identical everywhere.

```c
int result = add_ten(&x);            // 1st statement: the side effect
printf("%d %d\n", result, x);        // 2nd statement: x is already modified, always "11 11"
```

## The `return printf(...), NULL;` idiom

```c
char *find_or_print_error(char *key)
{
    char *result = search(key);
    if (result != NULL) {
        return result;
    }
    return printf("Error: key not found\n"), NULL;
}
```

`printf(...)` runs for its side effect (printing the message), then the comma operator discards its return value and replaces it with `NULL`: the function therefore always returns `NULL` in this case, whatever `printf()` itself returned. A single expression does both the printing and the `return`, with no intermediate variable.

> **Best practice:** this idiom stays rare and reads worse than a two-line version (`printf(...); return NULL;`). Reserve the comma operator for the multi-variable `for` loop, where it's idiomatic and widely recognized; avoid it elsewhere, for the sake of readability.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The comma operator (`expr1, expr2`) evaluates both expressions in order and keeps only the value of the second. The same `,` character also separates a call's arguments or a declaration's variables: two distinct roles, never the comma operator in those cases. Only the comma operator guarantees an order: a call's arguments are evaluated in an unspecified order. |
| **Tools you can use** | `expr1, expr2` to combine two statements into a single expression, typically `i++, j--` in a `for` loop. |
| **Pitfalls to avoid** | Confusing the comma operator with the comma that separates arguments (`printf(a, b)`) or declarations (`int a, b;`): these are two different syntactic uses of the same character. Reading and modifying the same variable among one call's arguments (`f(g(&x), x)`): the result depends on the compiler. |
| **Best practices** | Reserve the comma operator for multi-variable `for` loops; prefer two separate statements everywhere else, for readability. Compute into a variable before the call whenever an argument has a side effect. |
