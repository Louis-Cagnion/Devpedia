---
order: 11
---

# The Compilation Process

Unlike [PHP](/?c=langages-de-programmation&s=php&p=php) or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), which are interpreted directly at runtime, a C program must be **compiled into machine code** before it can be run. This compilation process occurs in four distinct stages, which are generally hidden behind a single command ([`gcc`](https://gcc.gnu.org) `main.c -o program`), but it is helpful to understand them separately in order to troubleshoot certain errors.

## The Four Steps

```text
main.c --[1. preprocessor]--> main.i --[2. compilation]--> main.s --[3. assembly]--> main.o --[4. linking]--> program
```

### 1. The Preprocessor

Processes everything that begins with `#` **before** the compiler sees the code: replaces `#include` with the actual contents of the included file, replaces the macros `#define`, and resolves `#ifdef` / `#ifndef`. The result is a single, "flattened" source file with no `#` directives remaining.

```bash
gcc -E main.c -o main.i
```

### 2. The Compilation Itself

Translates the source code (C) into **assembly language**, a language that is still human-readable but very close to the processor's instructions.

```bash
gcc -S main.i -o main.s
```

### 3. Assembly

Translates the assembly language into **binary machine code**, which is compiled into an `.o`. This file already contains executable instructions, but is not yet a complete program: calls to external functions (such as `printf`) have not yet been resolved.

```bash
gcc -c main.s -o main.o
```

### 4. *Linking*

Compiles one or more `.o` files together and resolves references to functions defined elsewhere (in other `.o` files, or in [libraries](/?c=langages-de-programmation&s=c&p=bibliotheques)) to produce a complete final executable.

```bash
gcc main.o -o program
```

## Why Separate Compilation and Linking?

A project with multiple source files can compile each `.c` into `.o` independently, and then link only the files that have changed: faster than a full recompilation every time a change is made. This is exactly what a [**Makefile**](/?c=langages-de-programmation&s=c&p=makefiles) automates:

```bash
gcc -c fichier1.c -o fichier1.o
gcc -c fichier2.c -o fichier2.o
gcc fichier1.o fichier2.o -o program
```

## Optimization Levels (`-O0` to `-O3`, `-Os`)

Once the program compiles, `gcc`/[Clang](https://clang.llvm.org) can rewrite the machine code produced at step 2 to make it faster, without changing its observable behavior. This is controlled with the `-O` option:

| Level | Effect |
|---|---|
| `-O0` | No optimization (default behavior): fast compilation, machine code that follows the source step by step -- the easiest to follow in a debugger |
| `-O1` | Basic optimizations, modest gain, compilation still fast |
| `-O2` | Recommended level for production: inlining, dead code elimination, loop unrolling (see below), without blowing up binary size |
| `-O3` | Pushes `-O2` further (aggressive vectorization, wider inlining): gain sometimes marginal depending on the program, bigger binary, longer compilation |
| `-Os` | Optimizes for binary size rather than speed (useful in embedded environments, limited disk space) |

Three common techniques explain the gain:

- **Inlining**: a small function's body is copied directly at each call site, avoiding the cost of an actual function call (context save, jump, return).
- **Dead code elimination**: any computation whose result is never used is stripped from the final binary.
- **Loop unrolling**: a loop's body is duplicated several times to reduce the number of loop iterations (and thus condition checks), at the cost of a bigger binary.

```bash
gcc -O2 main.c -o programme
```

> **Pitfall:** inlining can surface a warning invisible at `-O0`. Example: a function that returns `-1` on error, whose result is later used to compute a size passed to `malloc()`. At `-O0`, the compiler sees two separate functions and can't connect the two values. Once inlined by `-O2`, it sees the whole computation at once and can detect that `malloc()` would receive a negative size (hence gigantic once converted to `size_t`) -- flagged by `-Walloc-size-larger-than=` (included in `-Wall -Wextra`, see [Makefiles](/?c=langages-de-programmation&s=c&p=makefiles)), which becomes a hard error if `-Werror` is active. Code with no warning at `-O0` can therefore fail to compile at `-O2`: always test compilation at the optimization level actually used in production, not just `-O0`.

## Targeting the Processor (`-march=native`) and Compiling with Threads (`-pthread`)

By default, the compiler produces a program that runs on **every** processor of the same family, including the oldest: it forbids itself recent instructions. `-march=native` allows it to use every instruction of the processor **of the machine that compiles**.

```bash
gcc -O2 -march=native -c count.c    # count.c: return __builtin_popcount(x);
```

| Compilation | Code produced for `__builtin_popcount(x)` (checked with `objdump -d`) |
|---|---|
| `gcc -O2` | A call to a helper function that counts the bits in several steps |
| `gcc -O2 -march=native` | A single processor instruction, `popcnt` |

> **Pitfall:** a program compiled with `-march=native` can stop with the error `Illegal instruction` on a machine with an older processor. Keep it for programs that run on the machine where they are compiled (computation, measurements), never for a distributed executable.

For a program that uses [threads](/?c=langages&s=c&p=threads), pass `-pthread` **at compilation and at linking**:

```bash
gcc -Wall -pthread -o program program.c
```

| Option | Effect |
|---|---|
| `-pthread` | Defines the settings threads need (the `_REENTRANT` macro) **and** adds the thread library at linking |
| `-lpthread` | Only adds the library, without the compilation settings |

Since version 2.34 of Linux's C library (glibc), the thread functions are part of the C library itself: a program often links even without any option. `-pthread` remains the portable way to compile, also valid on older systems.

## Compilation Errors vs. Linking Errors

Knowing at which stage an error occurs helps diagnose it:

| Typical message | Affected step | Common cause |
|---|---|---|
| `error: expected ';' before...` | Compilation | Syntax error in the source code |
| `fatal error: xxx.h: No such file or directory` | Preprocessor | [Header file](/?c=langages-de-programmation&s=c&p=headers) not found |
| `undefined reference to 'ma_fonction'` | Linking | Function declared but never defined/linked (`.o` file or missing library) |

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A C program goes through 4 steps before execution: preprocessor → compilation (assembly) → assembly (machine code, `.o`) → linking (final executable). The optimization level (`-O0` to `-O3`, `-Os`) is set at the compilation step. |
| **Available Tools** | `gcc -E`/`-S`/`-c` to observe each step separately; `-O0` to `-O3`/`-Os` to set the optimization level; `-march=native` for the machine's processor; `-pthread` for a threaded program. |
| **Pitfalls to Avoid** | Confusing a compilation error (syntax) with a linking error (`undefined reference`, function never linked): the message indicates the affected step. A warning invisible at `-O0` (hidden by two non-inlined functions) can appear, or even block compilation with `-Werror`, as early as `-O2`. |
| **Best Practices** | Compile each `.c` file into `.o` separately on a multi-file project, so only what changed needs relinking rather than recompiling everything. Test compilation at the optimization level actually used in production, not just `-O0`. |
