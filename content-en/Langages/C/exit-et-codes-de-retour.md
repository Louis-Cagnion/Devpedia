---
order: 5
---

# `exit()` and return codes

A C program always terminates with a **return code**: an integer that tells the calling process (often the shell) whether the program ran successfully. This code was already glimpsed in [Process management](/?c=langages-de-programmation&s=c&p=processus): `WEXITSTATUS(status)` extracts it after a `wait()`.

## `return` in `main`: the most common case

```c
int main(void)
{
    // ... processing ...
    return 0;   // the program terminates here, return code 0
}
```

In `main` (and only in `main`), `return value;` terminates the entire program and sets its return code to `value`: this isn't just an ordinary function return like anywhere else in the code.

## `exit(code)`: terminating from anywhere

```c
#include <stdlib.h>

void check_configuration(Config *config)
{
    if (config == NULL) {
        fprintf(stderr, "Error: missing configuration\n");
        exit(1);   // terminates the program immediately, even outside main
    }
}
```

`exit(code)` terminates the program **immediately**, no matter which function it's called from: no need to bubble an error up through a chain of `return`s all the way to `main` to stop the program.

| | `return` in `main` | `exit(code)` |
|---|---|---|
| Where to call it | Only in `main` | Any function |
| Effect | Terminates `main`, and thus the program | Terminates the program directly |
| Return code | The returned value | `code` |

## The convention: 0 = success, non-zero = error

```c
#include <stdlib.h>

exit(EXIT_SUCCESS);   // equivalent to exit(0)
exit(EXIT_FAILURE);   // equivalent to exit(1)
```

`EXIT_SUCCESS` and `EXIT_FAILURE` (defined in `<stdlib.h>`) are `0` and `1` respectively: using them instead of raw numbers makes the intent explicit when reading the code, without changing the behavior.

This return code can then be checked from the shell that launched the program via [`$?`](/?c=shells&s=bash&p=scripts-et-shebang#exit-codes-exit): `0` signals success, any other value signals some kind of failure (the exact meaning of non-zero values is up to each program).

> **Pitfall:** forgetting to return a non-zero code on error (`return 0;`, or no explicit `return` at all, which counts as `0` by convention when `main` reaches its normal end). A script that chains commands with `&&` or checks `$?` will then believe the program succeeded, even though it actually failed.

## `atexit()`: freeing everything on every exit path

A program that calls `exit()` deep inside a chain of functions skips the `free()` that `main` would have done at the end: the memory is not given back cleanly, and a leak detector (see [Memory](/?c=langages-de-programmation&s=c&p=memoire)) reports it. `atexit(function)` solves this: it **registers** a function that the program calls by itself when it terminates, wherever the exit starts from.

```c
#include <stdlib.h>

static char *g_buffer;   // global: the registered function receives no argument

static void cleanup(void)
{
    free(g_buffer);
}

int main(void)
{
    g_buffer = malloc(100);
    atexit(cleanup);     // cleanup will be called at the end, by return or by exit()
    // ...
    return 0;
}
```

Measured result with two registered functions (`cleanup` first, then `log_end`), depending on how the program ends:

| How it ends | Registered functions called? | Return code |
|---|---|---|
| `return 0;` in `main` | Yes, in reverse order: `log_end` then `cleanup` | `0` |
| `exit(EXIT_FAILURE);` called deep inside several functions | Yes, same reverse order | `1` |
| `_exit(EXIT_FAILURE);` (`<unistd.h>`) | **No**, nothing is called | `1` |

- **Reverse order**: the last function registered runs first, like a stack; a resource registered last (which depends on the earlier ones) is therefore released before them.
- **Limit**: the standard guarantees at least 32 registrable functions; `atexit()` returns a non-zero value if the registration fails.

> **Pitfall:** `_exit()`, `abort()` and a fatal signal (see [Unix signals](/?c=langages-de-programmation&s=c&p=signaux-unix)) end the program without calling the registered functions. In a process created by `fork()`, a child that must stop after an error uses `_exit()` so as not to replay the parent's cleanups (write buffers flushed twice, temporary files deleted too early).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `return value;` in `main` terminates the program and sets its return code. `exit(code)` does the same from any function. By convention, `0` signals success, any other value a failure. `atexit(function)` registers a cleanup called on exit, in the reverse order of registration. |
| **Tools you can use** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`), `atexit()`. |
| **Pitfalls to avoid** | Returning `0` by default without checking that nothing went wrong: a script that checks `$?` will then believe in a success that never happened. Relying on `atexit()` after `_exit()`, `abort()` or a fatal signal: nothing is called. |
| **Best practices** | Use `EXIT_SUCCESS`/`EXIT_FAILURE` instead of raw `0`/`1` to make the intent explicit; always return a non-zero code as soon as an error keeps the program from doing what was expected of it; register the cleanup with `atexit()` instead of repeating the `free()` calls before every `exit()`. |
