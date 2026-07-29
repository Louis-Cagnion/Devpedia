---
order: 7
---

# The Compilation Process

Unlike PHP or JavaScript, which are interpreted directly at runtime, a C program must be **compiled into machine code** before it can be run. This compilation process occurs in four distinct stages, which are generally hidden behind a single command (`gcc main.c -o programme`), but it is helpful to understand them separately in order to troubleshoot certain errors.

## The Four Steps

```
main.c --[1. préprocesseur]--> main.i --[2. compilation]--> main.s --[3. assemblage]--> main.o --[4. édition de liens]--> programme
```

### 1. The Preprocessor

Processes everything that begins with `#` **before** the compiler sees the code: replaces `#include` with the actual contents of the included file, replaces the macros `#define`, and resolves `#ifdef` / `#ifndef`. The result is a single, "flattened" source file with no `#` directives remaining.

```
gcc -E main.c -o main.i
```

### 2. The Compilation Itself

Translates the source code (C) into **assembly language**, a language that is still human-readable but very close to the processor's instructions.

```
gcc -S main.i -o main.s
```

### 3. Assembly

Translates the assembly language into **binary machine code**, which is compiled into an `.o`. This file already contains executable instructions, but is not yet a complete program: calls to external functions (such as `printf`) have not yet been resolved.

```
gcc -c main.s -o main.o
```

### 4. *Linking*

Compiles one or more `.o` files together and resolves references to functions defined elsewhere (in other `.o` files or in libraries; see the relevant chapter) to produce a complete final executable.

```
gcc main.o -o programme
```

## Why Separate Compilation and Linking?

A project with multiple source files can compile each `.c` into `.o` independently, and then link only the files that have changed—which is faster than a full recompilation every time a change is made. This is exactly what a **Makefile** automates (see the dedicated chapter):

```
gcc -c fichier1.c -o fichier1.o
gcc -c fichier2.c -o fichier2.o
gcc fichier1.o fichier2.o -o programme
```

## Compilation Errors vs. Linking Errors

Knowing at which stage an error occurs helps diagnose it:

| Typical message | Affected step | Common cause |
|---|---|---|
| `error: expected ';' before...` | Compilation | Syntax error in the source code |
| `fatal error: xxx.h: No such file or directory` | Preprocessor | Header file not found (see the chapter on headers) |
| `undefined reference to 'ma_fonction'` | Edit links | Function declared but never defined/linked (`.o` file or missing library) |
