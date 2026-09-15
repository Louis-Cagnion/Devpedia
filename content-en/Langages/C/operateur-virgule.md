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
| **Key takeaways** | The comma operator (`expr1, expr2`) evaluates both expressions in order and keeps only the value of the second. The same `,` character also separates a call's arguments or a declaration's variables: two distinct roles, never the comma operator in those cases. |
| **Tools you can use** | `expr1, expr2` to combine two statements into a single expression, typically `i++, j--` in a `for` loop. |
| **Pitfalls to avoid** | Confusing the comma operator with the comma that separates arguments (`printf(a, b)`) or declarations (`int a, b;`): these are two different syntactic uses of the same character. |
| **Best practices** | Reserve the comma operator for multi-variable `for` loops; prefer two separate statements everywhere else, for readability. |
