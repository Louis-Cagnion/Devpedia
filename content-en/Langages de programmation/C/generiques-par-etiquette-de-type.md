---
order: 5
---

# Generics in C: dispatch by type tag

C has no native generics mechanism like [templates](/?c=langages-de-programmation&s=cpp&p=templates) in C++: no compiler that generates a specialized version of a function for each type used. Writing a function that accepts "any type" therefore requires a manual technique, built directly on [pointers](/?c=langages-de-programmation&s=c&p=pointeurs): the generic pointer `void*`, paired with a **type tag** that states, at runtime, what it actually points to.

## The problem: `void*` doesn't know what it points to

A `void*` can store the address of any data, but it loses all information about the **type** of that data: it can't be dereferenced directly, and no pointer arithmetic can be done on it (the compiler doesn't know `sizeof(type)`).

```c
void display(void *data) {
    printf("%d\n", *(int *)data);  // assumes data points to an int: dangerous
}
```

This function works as long as it's only called with an `int*`, but nothing prevents it from being called with a `float*` or a string: the `(int *)` cast would silently lie to the compiler, with no error or warning, until undefined behavior strikes at runtime.

## The technique: pairing the `void*` with a type tag

The solution is to never let a `void*` travel alone, but always paired with data that identifies its actual type, most often a string or an enum value:

```c
typedef struct {
    void *data;
    char *type;   // "int", "float", "string"...
} Value;

void display(Value v) {
    if (strcmp(v.type, "int") == 0) {
        printf("%d\n", *(int *)v.data);
    } else if (strcmp(v.type, "float") == 0) {
        printf("%f\n", *(float *)v.data);
    } else if (strcmp(v.type, "string") == 0) {
        printf("%s\n", (char *)v.data);
    }
}
```

The cast is no longer a guess: it is **conditioned** by the tag, checked before it's used. The function knows, at runtime, what it actually has in hand.

> **Pitfall:** comparing tags with `==` instead of `strcmp()` when they're strings. `v.type == "int"` compares two addresses, not two pieces of text (see the same remark in the [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) chapter): depending on how the string literal was allocated, the comparison can fail even though the text is identical.

## Dispatching without a chain of `if`/`else if`

A chain of comparisons quickly turns into code that has to be grown by hand for every new type: exactly the kind of repetition an [indexed structure](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) helps avoid, here in the form of a **dispatch table** mapping each tag to a [function pointer](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void displayInt(void *d)    { printf("%d\n", *(int *)d); }
void displayFloat(void *d)  { printf("%f\n", *(float *)d); }
void displayString(void *d) { printf("%s\n", (char *)d); }

typedef struct {
    char *type;
    void (*function)(void *);
} Dispatch;

Dispatch table[] = {
    {"int", displayInt},
    {"float", displayFloat},
    {"string", displayString},
};

void display(Value v) {
    for (int i = 0; i < 3; i++) {
        if (strcmp(table[i].type, v.type) == 0) {
            table[i].function(v.data);
            return;
        }
    }
}
```

Adding a type only means adding a line to `table`, never touching `display()` itself.

## What this solves, and what it doesn't

| | `void*` + tag (C) | Templates (C++) |
|---|---|---|
| Type checking | At runtime, by the code itself | At compile time, by the compiler |
| Runtime cost | Tag comparison + indirection on every call | None (specialized code generated per type) |
| Wrong type | Silent bug if the tag lies or is forgotten | Compile error |
| What's actually generalized | The code that manipulates the data | The code **and** the type guarantee |

See [Templates](/?c=langages-de-programmation&s=cpp&p=templates): the same intent (write once, use with any type) resolved at a completely different point in the program's lifecycle. Since C offers no compile-time checking for this kind of code, the responsibility for keeping `data` and `type` consistent rests entirely on the programmer, with no safety net.

> **Best practice:** centralize the construction of a `Value` (never assign `data`/`type` separately by hand in several places) into a single function per type (`valueFromInt()`, `valueFromFloat()`...), so that a tag inconsistent with its data can't appear anywhere but at this single entry point.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | C has no compile-time-checked generics: `void*` lets data of any type travel around, but loses its type. A tag (string or enum) carried alongside the `void*` restores this information at runtime, a prerequisite for the cast before dereferencing. |
| **Available Tools** | A dispatch table (tag -> function pointer) to avoid a chain of `if`/`else if` that grows with every new type. |
| **Pitfalls to Avoid** | Comparing string type tags with `==` instead of `strcmp()`. Trusting a cast without having checked the tag beforehand. |
| **Best Practices** | Centralize the construction of the data/tag pair into a dedicated function per type, so that no inconsistency can appear anywhere else. |
