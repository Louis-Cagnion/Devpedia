---
order: 2
---

# Conditions

Conditional statements allow you to execute a block of code depending on whether an expression is true or false. In C, you can use `if`, `else`, `else if`, the ternary operator, and `switch`.

## `if`'s Condition

In C, any **non-zero** value is considered true; only the value `0` is false: there was no native Boolean type prior to [C99](https://en.wikipedia.org/wiki/C99) ([`stdbool.h`](/?c=langages-de-programmation&s=c&p=variables)):

```c
int age = 18;

if (age >= 18) {
    printf("Vous êtes majeur.\n");
}
```

## `if` / `else` / `else if`

```c
int note = 12;

if (note >= 16) {
    printf("Mention Très Bien\n");
} else if (note >= 14) {
    printf("Mention Bien\n");
} else if (note >= 10) {
    printf("Admis\n");
} else {
    printf("Recalé\n");
}
```

> **Note:** Unlike [PHP](/?c=langages-de-programmation&s=php&p=php), there is no alternative syntax using `:` or `endif` in C: curly braces `{ }` are the only available notation (optional only if the block contains a single statement, but omitting them is strongly discouraged: a common source of bugs if a line is accidentally added without the curly braces).

## The ternary operator

```c
int age = 20;
const char *statut = (age >= 18) ? "majeur" : "mineur";

printf("%s\n", statut);
```

## The `switch`

Useful for comparing a single variable to multiple integer or enumerated values:

```c
int jour = 3;

switch (jour) {
    case 1:
        printf("Lundi\n");
        break;
    case 2:
        printf("Mardi\n");
        break;
    case 3:
        printf("Mercredi\n");
        break;
    default:
        printf("Autre jour\n");
        break;
}
```

> **Note:** Don't forget to include `break;` at the end of each `case`; otherwise, execution will continue into the next `case` (*fall-through*), even if its condition does not match. This behavior is sometimes intentionally used to group together several identical cases:

```c
switch (jour) {
    case 6:
    case 7:
        printf("Week-end\n"); // no break between 6 and 7: both cases share this code
        break;
    default:
        printf("Jour de semaine\n");
        break;
}
```

> **Limitations of the "`switch`" in C:** Unlike some languages, a "`switch`" in C only works on integer types (or equivalent types: `char`, `enum`): it is not possible to perform a "`switch`" directly on a character string.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `if`/`else`/`else if` execute a block based on a condition; any non-zero value is true in C. `switch` compares a single integer variable to multiple values. |
| **Tools you can use** | The ternary operator `? :` for a short conditional assignment. |
| **Pitfalls to avoid** | Forgetting `break;` in a `case`: execution continues into the next `case` (*fall-through*), even without matching its condition. |
| **Best practices** | Always use curly braces around an `if` block, even for a single statement: this avoids a bug if a line is later added without the braces. |
