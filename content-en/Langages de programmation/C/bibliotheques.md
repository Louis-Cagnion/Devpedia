---
order: 9
---

# Libraries

A **library** is a collection of precompiled functions that can be reused by any program without recompiling the source code: this is how, for example, the C standard library works (`printf`, `malloc`...). There are two ways to link a library to a program: statically or dynamically.

## Static Library (`.a`)

The library code is **copied directly** into the final executable during the linking process (see the chapter on compilation).

```bash
// 1. compiler chaque fichier source en .o
gcc -c calculs.c -o calculs.o

// 2. regrouper le(s) .o dans une archive statique
ar rcs libcalculs.a calculs.o

// 3. lier le programme à cette bibliothèque
gcc main.c -L. -lcalculs -o program
```

- `ar` (*archive*) combines one or more files `.o` into a single archive `.a`.
- `-L.` Tells [`gcc`](https://gcc.gnu.org) to also search for libraries in the current directory.
- `-lcalculs` Request to link to `libcalculs.a` (the prefix `lib` and the suffix `.a` are implied).

| Advantage | Disadvantage |
|---|---|
| Standalone executable; no external dependencies to install | Larger executable size |
| There's no risk that a different version of the library will break the program later | Updating the library requires recompiling the program |

## Dynamic library (`.so` on Linux, `.dll` on Windows)

The library code remains in a **separate** file, which is loaded into memory when the program starts (or even while it is running). Multiple programs can then share a single copy of the library in memory.

```bash
gcc -shared -fPIC calculs.c -o libcalculs.so
gcc main.c -L. -lcalculs -o program

// au lancement, le système doit savoir où trouver libcalculs.so :
LD_LIBRARY_PATH=. ./program
```

- `-fPIC` (*Position-Independent Code*) generates code that can run regardless of the memory address where it is loaded, a requirement for a shared library, which is loaded at a different location depending on the program.
- Without `LD_LIBRARY_PATH` (or an installation in a standard system directory such as `/usr/lib`), the system does not know where to look for `libcalculs.so` at startup, and the program refuses to start.

| Advantage | Disadvantage |
|---|---|
| Smaller executable | External dependency: the library must be present on the machine running the program |
| A library shared by multiple programs saves memory | An incompatible update to the library can break a program without recompilation |

## Abstract

| | Static (`.a`) | Dynamic (`.so`) |
|---|---|---|
| Copied into the executable? | Yes | No (loaded separately) |
| When is it linked? | At compile time | At program startup (or during program execution) |
| Library update | Requires recompiling the program | The program benefits from the update without recompilation |
