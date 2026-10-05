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

## Multiple Files and Inlining: Translation Unit, `static inline`, `-flto`

A **translation unit** is a `.c` file as step 2 sees it: its own code, plus everything its `#include`s copied into it at step 1. The compiler handles **one unit at a time**: it never sees the contents of the project's other `.c` files.

Direct consequence for [inlining](#optimization-levels-o0-to-o3-os): the compiler can only copy a function's body if it sees it. A function defined in another `.c` remains a real call, even at `-O3`.

```c
/* square.h */
int square(int x);                    // declaration only: the body is elsewhere

/* square.c */
#include "square.h"
int square(int x) { return x * x; }   // the definition, in another unit

/* main.c */
#include <stdio.h>
#include "square.h"
int main(void) {
    long sum = 0;
    for (int i = 0; i < 1000; i++)
        sum += square(i);             // main.c only sees the declaration
    printf("%ld\n", sum);             // prints 332833500
    return 0;
}
```

Three ways to get inlining despite the split into files, checked with [`objdump -d`](https://sourceware.org/binutils/docs/binutils/objdump.html) on the final executable:

| How it is compiled | `call square` in `main`? | Principle |
|---|---|---|
| `square.c` and `main.c` compiled separately (`-O2`) | Yes | Each unit is optimized alone: the call remains |
| `static inline int square(int x) { return x * x; }` written in `square.h` | No | The body is copied into every unit that includes the [header](/?c=langages&s=c&p=headers) |
| `-flto` at compilation **and** at linking | No | *Link-Time Optimization*: the `.o` files keep an intermediate form of the code, and linking optimizes the whole program at once |
| `-flto` forgotten for `main.c` only | Yes | A unit compiled without `-flto` only contains machine code: nothing left to re-optimize |

```bash
gcc -O2 -flto -c main.c -o main.o       # -flto when compiling EACH file
gcc -O2 -flto -c square.c -o square.o
gcc -O2 -flto main.o square.o -o prog   # ... and when linking
```

| Method | Advantage | Drawback |
|---|---|---|
| Everything in a single `.c` | No option to remember | Long file, hard to read |
| `static inline` in a header | Works with any compilation | Only for small functions; one copy per unit that uses it |
| `-flto` | Inlining across all files, without changing the code | Slower linking; forgetting it on a single file goes unnoticed |

> **Pitfall:** an ordinary function (without `static`) defined in a header included by two `.c` files causes the `multiple definition of 'square'` error at linking: each unit contains a public copy. And `inline` alone, without `static`, follows subtle rules in C (you also need a non-`inline` definition in exactly one `.c`): `static inline` is the safe form.

**What it changes in practice.** The [SAT solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) of the project these measurements come from went from a single 1,424-line file to 7 `.c` files. The functions called at every computation step (hundreds of millions of times per grid) all stayed in the same unit, or became `static inline` in the headers. Result: no slowdown (even 2.7% faster), and `-flto` brought nothing more (+0.9% compared with the single file, and even 3.8% slower than the split alone). Splitting a program therefore costs nothing, provided what calls itself very often stays together: [measure](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) before and after the split.

## Profile-Guided Optimization (PGO)

At compile time, `gcc` does not know which branches of an `if` will be taken most often: it guesses. **Profile-Guided Optimization** (PGO) replaces that guess with real counts, measured on a trial run, to lay out the code better: the frequent paths in one piece, the rare paths set aside.

```text
branch.c --[gcc -fprofile-generate]--> branch (instrumented, counts its passes)
branch   --[training run]--> branch.gcda (the profile: the counts)
branch.c + branch.gcda --[gcc -fprofile-use]--> branch (optimized from the counts)
```

```c
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    int n = argc > 1 ? atoi(argv[1]) : 1000, small = 0, large = 0;
    for (int i = 0; i < n; i++) {
        if (i % 100 == 0) large++;    // rare branch: once in 100
        else small++;                 // frequent branch
    }
    printf("%d small, %d large\n", small, large);
    return 0;
}
```

```bash
gcc -O2 -fprofile-generate branch.c -o branch   # 1. instrumented version
./branch 1000000                                # 2. training: writes branch.gcda on exit
gcc -O2 -fprofile-use branch.c -o branch        # 3. recompilation from the profile
```

The options are described in the [GCC documentation](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html). On the SAT solver mentioned above, PGO gained 3.4%, with exactly the same work done (same computation counters): a modest gain, but free once automated in a [Makefile](/?c=langages&s=c&p=makefiles).

| Pitfall | What happens | Remedy |
|---|---|---|
| Different output name between steps 1 and 3 (`-o branch_instr`, then `-o branch`) | The profile is named `branch_instr-branch.gcda`, step 3 looks for `branch.gcda`: a mere **warning** `profile count data file not found`, and the program is compiled **without** PGO | Same output name (or same `.o` files) at both steps, and check that this warning is absent |
| Sources modified after training | `coverage-mismatch` error: the profile no longer matches the code | Redo the three steps after every change |
| Program ended by `_exit()`, killed by a signal, or child process leaving through `_exit()` | No `.gcda` written: the profile is saved by the normal exit ([`exit()` or `return` in `main`](/?c=langages&s=c&p=exit-et-codes-de-retour)), which `_exit()` bypasses | Train on a run that ends normally (in the solver: as a single process, without the parallel mode's [child processes](/?c=langages&s=c&p=processus)) |
| Training on the same data as the speed measurement | The program is optimized for the test itself: overestimated gain | Train on inputs other than those used for measuring |

## The Stack Canary (`-fstack-protector`)

A [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire#the-buffer-overflow-writing-past-the-reserved-space) on the stack can overwrite the address the function must return to. The **canary** is a secret value that the compiler places between the local arrays and that address, then checks just before returning: if it changed, the program stops immediately (the name comes from the canaries miners carried to detect gas before it was too late).

```c
#include <stdio.h>
__attribute__((noinline)) static void copy(const char *text) {
    char buffer[8];                   // 8 bytes reserved on the stack
    for (int i = 0; text[i]; i++)     // copy without checking the length
        buffer[i] = text[i];
    printf("copied: %.8s\n", buffer);
}
int main(int argc, char **argv) {
    copy(argc > 1 ? argv[1] : "short");
    return 0;
}
```

With a 40-character argument (the buffer only holds 8):

| Compilation | Output | Exit code |
|---|---|---|
| `gcc -O2` (default of Ubuntu's GCC: `-fstack-protector-strong`) | `copied: AAAAAAAA` then `*** stack smashing detected ***: terminated` | 134: deliberate stop ([signal](/?c=langages&s=c&p=signaux-unix#common-signals) `SIGABRT`, 128 + 6) |
| `gcc -O2 -fno-stack-protector` | `copied: AAAAAAAA` then a crash | 139: segmentation fault (`SIGSEGV`, 128 + 11), later and less clearly |

The cost: a few instructions in every function that has a local array (`objdump -d` shows the read of the secret value, `mov %fs:0x28`, its comparison on return, and the call to `__stack_chk_fail`). On the SAT solver, `-fno-stack-protector` gained about 1%.

> **Pitfall:** with `strcpy()` instead of the loop, the message becomes `*** buffer overflow detected ***`, even with `-fno-stack-protector`. That is **another** Ubuntu protection, [`_FORTIFY_SOURCE`](https://man7.org/linux/man-pages/man7/feature_test_macros.7.html), which at `-O2` replaces the well-known copy functions with checked versions. Removing the canary therefore does not remove every protection, and a hand-written copy is covered by the canary alone.

| Situation | Canary |
|---|---|
| Program that reads outside data (received files, network, user input) | Keep it, always |
| Computation program whose inputs are already validated, where every percent counts | Removing it is acceptable, **after** measuring the gain |

## Checking at compile time: `_Static_assert`

An ordinary check (`if`, `assert`) runs **while the program runs**: an inconsistent value is discovered late, sometimes never. `_Static_assert(condition, "message");` (C11) checks a condition **during compilation**: if it is false, compilation stops with the message and no program is produced. It costs nothing at run time, since it generates no code.

| Tool | Checks | Condition about | If the condition is false |
|---|---|---|---|
| `if` + error message | at run time | any values | message, failure path planned by the program |
| `assert(c)` (`<assert.h>`) | at run time, removed by the `-DNDEBUG` option (explained below) | any values | abrupt program stop |
| `_Static_assert(c, "m")` | at compile time | **constants** only | compilation refused |

The condition must be an **integer constant expression**: computable by the compiler without running the program (written numbers, `sizeof`, `#define` constants).

**Typical case: constants overridable with `-D`.** The `gcc` option `-DNAME=value` defines a macro as if the file began with `#define NAME value`. A project uses it to tune limits without touching the code; an `#ifndef` ("if not defined") provides the default value. Nothing then guarantees that the supplied values stay consistent with each other:

```c
#ifndef ZOOM_MIN                  /* if the command line did not define it... */
# define ZOOM_MIN 1               /* ...default value */
#endif
#ifndef ZOOM_MAX
# define ZOOM_MAX 10
#endif

_Static_assert(ZOOM_MIN < ZOOM_MAX, "ZOOM_MIN must be lower than ZOOM_MAX");
```

```text
$ gcc -std=c11 -DZOOM_MIN=20 main.c
main.c:10:1: error: static assertion failed: "ZOOM_MIN must be lower than ZOOM_MAX"
```

Without this check, nothing signals the mistake: a `clamp` (bounding a value between a minimum and a maximum) written `fminf(fmaxf(x, ZOOM_MIN), ZOOM_MAX)` with a minimum of 20 and a maximum of 10 **always returns 10**, whatever `x` is (measured with `x = 5`). The message names the faulty constant and the expected relation.

`_Static_assert` is also used to check an assumption about the machine, for example `_Static_assert(sizeof(int) >= 4, "int too small");`, so that a program compiled on an unexpected platform fails at compile time rather than at run time. In C11, `static_assert` (without the leading underscore) also exists, through `#include <assert.h>`; since C23 (`-std=c2x` on `gcc` 13), it is a keyword and the message is optional.

**Floating-point constants: a warning to silence in that spot only.** A `float` comparison (`NEAR_PLANE < FAR_PLANE`) is not an *integer* constant expression: `gcc` accepts it, but the `-Wpedantic` option ("pedantic": warn about anything the C standard does not strictly allow) reports it:

```text
warning: expression in static assertion is not an integer constant expression [-Wpedantic]
```

A `#pragma` directive is an instruction given to the compiler (like `#pragma once`, see [Header files](/?c=langages-de-programmation&s=c&p=headers)). Three `#pragma GCC diagnostic` lines limit the silence to the assertion:

```c
#pragma GCC diagnostic push                       /* saves the warnings state */
#pragma GCC diagnostic ignored "-Wpedantic"       /* turns this one off from here */
_Static_assert(NEAR_PLANE > 0.0f && NEAR_PLANE < FAR_PLANE, "inconsistent near/far planes");
#pragma GCC diagnostic pop                        /* restores: the rest of the file stays checked */
```

`push` and `pop` frame the silence: turning off `-Wpedantic` for the whole file would hide real problems elsewhere. These directives are recognized by `gcc` and `clang` (not by Microsoft's compiler, which has its own syntax).

> **Pitfall:** `_Static_assert` cannot test a value read at run time (function argument, variable, user input): for those, an `if` with an error message is still needed.

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
| **Key Points** | A C program goes through 4 steps before execution: preprocessor → compilation (assembly) → assembly (machine code, `.o`) → linking (final executable). The optimization level (`-O0` to `-O3`, `-Os`) is set at the compilation step. The compiler only sees one translation unit at a time: without `static inline` or `-flto`, a function from another `.c` is never inlined. PGO optimizes from a trial run; the stack canary stops a program whose local buffer overflowed. `_Static_assert(condition, "message")` checks a constant condition at compile time, at no run-time cost. |
| **Available Tools** | `gcc -E`/`-S`/`-c` to observe each step separately; `-O0` to `-O3`/`-Os` to set the optimization level; `-march=native` for the machine's processor; `-pthread` for a threaded program; `static inline` and `-flto` for inlining across files; `-fprofile-generate`/`-fprofile-use` for PGO; `objdump -d` to check the generated code. `_Static_assert` (C11); `-DNAME=value` to tune a constant; `#pragma GCC diagnostic push`/`ignored`/`pop` to turn off a warning over a few lines. |
| **Pitfalls to Avoid** | Confusing a compilation error (syntax) with a linking error (`undefined reference`, function never linked): the message indicates the affected step. A warning invisible at `-O0` (hidden by two non-inlined functions) can appear, or even block compilation with `-Werror`, as early as `-O2`. Forgetting `-flto` on a single file, or changing the output name between the two PGO steps: the optimization disappears without any error. Removing the canary from a program that reads outside data. Leaving constants overridable with `-D` without checking their consistency (a `clamp` whose minimum exceeds its maximum always returns the maximum), turning off `-Wpedantic` for a whole file, testing with `_Static_assert` a value known only at run time. |
| **Best Practices** | Compile each `.c` file into `.o` separately on a multi-file project, so only what changed needs relinking rather than recompiling everything. Test compilation at the optimization level actually used in production, not just `-O0`. Keep functions called very often in the same unit (or `static inline`), and measure before and after any split or option change. Check at compile time, with a message that names the faulty constant, the consistency of constants with each other and the assumptions about the machine; limit a `#pragma GCC diagnostic ignored` with `push` and `pop`. |
