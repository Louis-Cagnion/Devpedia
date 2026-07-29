---
order: 3
---

# Loops

Loops allow you to repeat a block of code multiple times. In C, there are three structures: `while`, `do while`, and `for`—there is no native `foreach`; an array is always iterated through using an index or a pointer.

## `while` Loop

The condition is checked **before** each turn:

```
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## `do while` Loop

A variant where the condition is checked **after** each iteration: the block therefore always executes at least once, even if the condition is false from the start:

```
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## `for` Loop

Combines the initialization, the condition, and the increment into a single line—useful whenever the number of iterations is known in advance:

```
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

The three parts are independent and optional (`for (;;)` is a valid infinite loop), but the standard usage is still `for (init; condition; incrément)`.

## Iterate through an array (no "`foreach`")

```
int tableau[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", tableau[i]);
}
```

> **Note:** Unlike PHP or JavaScript, there is no **native way** to determine the size of an array based on the pointer alone—`tableau[5]` "knows" how many elements it contains as long as it is treated as a static array, but this information is lost as soon as it is passed to a function (at which point it behaves like a simple pointer; see the chapter on pointers). The size must therefore be passed separately.

```
void afficher(int *tableau, int taille) // la taille doit être passée explicitement
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", tableau[i]);
    }
}
```

## `break` and `continue`

- `break;` completely stops the enclosing loop.
- `continue;` skips directly to the next iteration without executing the rest of the current loop body.

```
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // arrête la boucle dès que i vaut 5
    }
    if (i % 2 == 0) {
        continue; // ignore les nombres pairs
    }
    printf("%d\n", i);
}
```

## Nested Loops and `break`

`break` It only exits the **nearest** loop that encloses it—to exit multiple nested loops at once, you need a control variable or a "`goto`" (which is rare but sometimes used for this specific case in C):

```
int trouve = 0;

for (int i = 0; i < 10 && !trouve; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            trouve = 1;
            break; // ne sort que de la boucle interne
        }
    }
}
```
