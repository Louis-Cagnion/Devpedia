---
order: 2
---

# Conditions

Conditional statements allow you to execute a block of code depending on whether an expression is true or false. In C, you can use `if`, `else`, `else if`, the ternary operator, and `switch`.

## `if`'s Condition

In C, any **non-zero** value is considered true; only the value `0` is false—there was no native Boolean type prior to C99 (`stdbool.h`, see the chapter on variables):

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

> **Note:** Unlike PHP, there is no alternative syntax using `:` or `endif` in C—curly braces `{ }` are the only available notation (optional only if the block contains a single statement, but omitting them is strongly discouraged: a common source of bugs if a line is accidentally added without the curly braces).

## The ternary operator

```c
int age = 20;
const char *statut = (age >= 18) ? "majeur" : "mineur";

printf("%s\n", statut);
```

## 

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

> **Note:** Don't forget to include `break;` at the end of each `case`—otherwise, execution will continue into the next `case` (*fall-through*), even if its condition does not match. This behavior is sometimes intentionally used to group together several identical cases:

```c
switch (jour) {
    case 6:
    case 7:
        printf("Week-end\n"); // pas de break entre 6 et 7 : les deux cas partagent ce code
        break;
    default:
        printf("Jour de semaine\n");
        break;
}
```

> **Limitations of the "`switch`" in C:** Unlike some languages, a "`switch`" in C only works on integer types (or equivalent types: `char`, `enum`)—it is not possible to perform a "`switch`" directly on a character string.
