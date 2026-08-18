---
order: 9
---

# Libraries

A **library** is a collection of precompiled functions that can be reused by any program without recompiling the source code: this is how, for example, the C standard library works (`printf`, `malloc`...). There are two ways to link a library to a program: statically or dynamically.

## Static Library (`.a`)

The library code is **copied directly** into the final executable during the [linking process](/?c=langages-de-programmation&s=c&p=compilation).

```text
// 1. compile each source file into .o
gcc -c calculs.c -o calculs.o

// 2. combine the .o file(s) into a static archive
ar rcs libcalculs.a calculs.o

// 3. link the program to this library
gcc main.c -L. -lcalculs -o program
```

- `ar` (*archive*) combines one or more files `.o` into a single archive `.a`.
- `-L.` tells [`gcc`](https://gcc.gnu.org) to also search for libraries in the current directory.
- `-lcalculs` asks to link `libcalculs.a` (the prefix `lib` and the suffix `.a` are implied).

| Advantage | Disadvantage |
|---|---|
| Standalone executable; no external dependencies to install | Larger executable size |
| There's no risk that a different version of the library will break the program later | Updating the library requires recompiling the program |

## Dynamic Library (`.so` on Linux, `.dll` on Windows)

The library code remains in a **separate** file, which is loaded into memory when the program starts (or even while it is running). Multiple programs can then share a single copy of the library in memory.

```text
gcc -shared -fPIC calculs.c -o libcalculs.so
gcc main.c -L. -lcalculs -o program

// at startup, the system must know where to find libcalculs.so:
LD_LIBRARY_PATH=. ./program
```

- `-fPIC` (*Position-Independent Code*) generates code that can run regardless of the memory address where it is loaded, a requirement for a shared library, which is loaded at a different location depending on the program.
- Without `LD_LIBRARY_PATH` (or an installation in a standard system directory such as `/usr/lib`), the system does not know where to look for `libcalculs.so` at startup, and the program refuses to start.

| Advantage | Disadvantage |
|---|---|
| Smaller executable | External dependency: the library must be present on the machine running the program |
| A library shared by multiple programs saves memory | An incompatible update to the library can break a program without recompilation |

## Static vs. Dynamic

| | Static (`.a`) | Dynamic (`.so`) |
|---|---|---|
| Copied into the executable? | Yes | No (loaded separately) |
| When is it linked? | At compile time | At program startup (or during program execution) |
| Library update | Requires recompiling the program | The program benefits from the update without recompilation |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A static library (`.a`) is copied into the executable at compile time; a dynamic library (`.so`/`.dll`) stays separate, is loaded at startup, and can be shared between programs. |
| **Tools you can use** | `ar` (static archive), `gcc -shared -fPIC` (dynamic library), `-L`/`-l` to link. |
| **Pitfalls to avoid** | Forgetting `LD_LIBRARY_PATH` (or a system-wide install): the program refuses to start, unable to find the dynamic library. |
| **Best practices** | Choose static for a standalone executable with no dependency to manage, dynamic to save memory/size when several programs share the same library. |
