---
order: 3
---

# Loops

Loops allow you to repeat a block of code multiple times. In C, there are three structures: `while`, `do while`, and `for`: there is no native `foreach`; an array is always iterated through using an index or a pointer.

## `while` Loop

The condition is checked **before** each turn:

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## `do while` Loop

A variant where the condition is checked **after** each iteration: the block therefore always executes at least once, even if the condition is false from the start:

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## `for` Loop

Combines the initialization, the condition, and the increment into a single line, useful whenever the number of iterations is known in advance:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

The three parts are independent and optional (`for (;;)` is a valid infinite loop), but the standard usage is still `for (init; condition; incrément)`.

## Iterate through an array (no "`foreach`")

```c
int array[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", array[i]);
}
```

> **Note:** Unlike [PHP](/?c=langages-de-programmation&s=php&p=php) or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), there is no **native way** to determine the size of an array based on the pointer alone: `array[5]` "knows" how many elements it contains as long as it is treated as a static array, but this information is lost as soon as it is passed to a function (at which point it behaves like a simple pointer; see [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs)). The size must therefore be passed separately.

```c
void afficher(int *array, int taille) // the size must be passed explicitly
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", array[i]);
    }
}
```

## `break` and `continue`

- `break;` completely stops the enclosing loop.
- `continue;` skips directly to the next iteration without executing the rest of the current loop body.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // stops the loop as soon as i equals 5
    }
    if (i % 2 == 0) {
        continue; // skips even numbers
    }
    printf("%d\n", i);
}
```

## Nested Loops and `break`

`break` only exits the **nearest** loop that encloses it: to exit multiple nested loops at once, you need a control variable or a `goto` (which is rare but sometimes used for this specific case in C):

```c
int trouve = 0;

for (int i = 0; i < 10 && !trouve; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            trouve = 1;
            break; // only exits the inner loop
        }
    }
}
```

## Short-Circuit Evaluation of `&&`/`||`

`&&` and `||` only evaluate their second operand if necessary (**short-circuit evaluation**), exactly as in [Python](/?c=langages-de-programmation&s=python&p=conditions): `a && b` only evaluates `b` if `a` is true (non-zero); `a || b` only evaluates `b` if `a` is false (`0`).

Classic use case: avoiding an invalid pointer dereference.

```c
if (ptr != NULL && ptr->valeur > 0) {
    ...
}
```

If `ptr` is `NULL`, `ptr->valeur` is never evaluated: `&&` stops as soon as the first operand is false.

> **Difference from Python:** in C, `&&`/`||` always return `0` or `1` (an `int`), never one of their two operands. `age > 0 && age` therefore doesn't return `age` the way the Python equivalent would -- only the short-circuit property (not evaluating the second operand when unnecessary) is usable in C, never the return value as a "fallback value".

### Combining Conditional Dispatch and Failure Detection

A more advanced use: chaining several `&&`/`||` to test a case AND call the matching function, in a single expression, provided each called function returns `1` on success and `0` on failure:

```c
!strcmp(type, "v")  && add_vector(mesh, values)
|| !strcmp(type, "vt") && add_texcoord(mesh, values)
|| !strcmp(type, "f")  && add_face(mesh, values);
```

Reads like an `if`/`else if` chain: `&&` has higher precedence than `||`, so each line forms an independent `(test && call)` pair. As soon as one pair is true (the test matches AND the call succeeds), `||` stops there; otherwise it moves on to the next pair.

> **Pitfall:** this style assumes every called function follows the "`1` = success, `0` = failure" convention. A function that follows the opposite convention (`0` = success, common for system calls like `close()`) silently breaks the chain: a real success evaluated as `0` is interpreted as a failure, and `||` wrongly moves on to the next branch.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `while` checks before, `do while` checks after (at least one execution), `for` combines initialization/condition/increment. No native `foreach`: an array is iterated through by index. `&&`/`||` short-circuit their second operand, but always return `0`/`1`, never an operand as in Python. |
| **Tools you can use** | `break` (stops the loop), `continue` (skips to the next iteration). Chain `&&`/`||` to combine a test and a conditional call in a single expression. |
| **Pitfalls to avoid** | `break` only exits the nearest loop: a control variable is needed to exit multiple nested loops. A `&&`/`||` chain assumes every called function returns `1` on success; a function that returns `0` on success (opposite convention) silently breaks it. |
| **Best practices** | Always pass an array's size explicitly to a function that iterates through it, rather than assuming it can be deduced. Reserve `&&`/`||` chaining for functions that follow the "1 = success" convention; use an explicit `if` otherwise. |
