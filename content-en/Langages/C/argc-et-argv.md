---
order: 6
---

# Command-line arguments (`argc`, `argv`)

`main` can take two optional parameters that give access to the arguments passed to the program when it's launched from the terminal, in addition to the `int main(void)` form already seen.

## The full signature of `main`

```c
int main(int argc, char *argv[])
{
    // ...
}
```

- `argc` (*argument count*): the number of arguments received, always at least `1`.
- `argv` (*argument vector*): an array of strings, one entry per argument.

## Printing every argument received

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}
```

Run as `./program hello 42`, this program prints:

```text
argv[0] = ./program
argv[1] = hello
argv[2] = 42
```

`argc` is then `3`: the program's own name counts as an argument in its own right.

## `argv[0]`: the program's name, not the first useful argument

`argv[0]` always holds the path used to launch the program (not necessarily just its name), never the first argument supplied by the user: that one is `argv[1]`.

## The `argv[argc]` sentinel

The C standard guarantees that `argv[argc]` is always `NULL`: that lets you walk `argv` without knowing `argc` ahead of time (`while (argv[i] != NULL)`), but nothing guarantees what lies **beyond** `argv[argc]`.

> **Pitfall:** reading `argv[i]` without first checking that `i < argc`. A user who runs the program without supplying the expected argument then triggers an out-of-bounds access: one of the most common bugs among people just starting out with `argc`/`argv`.

```c
if (argc < 2) {
    fprintf(stderr, "Usage: %s <argument>\n", argv[0]);
    return 1;
}
printf("Argument received: %s\n", argv[1]);   // only reached if argc >= 2
```

## Converting an argument to a number

An argument always arrives as a string, even if it looks like a number on the command line: `atoi()`/`strtol()` (see [Converting a String to a Number](/?c=langages-de-programmation&s=c&p=variables#converting-a-string-to-a-number-atof-atoi), already covered in *Variables*) explicitly convert it to an integer.

```c
int limit = atoi(argv[1]);   // "42" (string) -> 42 (int)
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `int main(int argc, char *argv[])` gives access to the command-line arguments: `argc` their count (always ≥ 1), `argv` the matching array of strings. `argv[0]` is the program's name, not the first useful argument. |
| **Tools you can use** | `argc`, `argv[i]`, the `argv[argc] == NULL` sentinel, `atoi()`/`strtol()` to convert an argument to a number. |
| **Pitfalls to avoid** | Reading `argv[i]` without checking `i < argc` first: out-of-bounds access if the user doesn't supply the expected argument. Confusing `argv[0]` (the program's name) with the first real argument (`argv[1]`). |
| **Best practices** | Always check `argc` before accessing a given `argv[i]`, and print a clear usage message (via `argv[0]`) when `argc` doesn't match what's expected. |
