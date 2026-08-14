---
order: 8
---

# Makefiles

A **Makefile** automates the compilation of a multi-file C project: rather than manually retyping each [`gcc`](https://gcc.gnu.org) command (see the chapter on compilation), you define the build rules once, and the tool `make` executes them, recompiling only what has actually changed since the last time.

## Anatomy of a Rule

```makefile
target: dependances
	commande
```

```makefile
program: main.o calculs.o
	gcc main.o calculs.o -o program
```

"To build `program`, I need `main.o` and `calculs.o`; if either of these is newer than `program` (or if `program` doesn't exist yet), run the command." The command line **must** be indented with a tab, never spaces, one of the most common mistakes with Makefiles.

## Chaining Rules

```makefile
program: main.o calculs.o
	gcc main.o calculs.o -o program

main.o: main.c calculs.h
	gcc -c main.c -o main.o

calculs.o: calculs.c calculs.h
	gcc -c calculs.c -o calculs.o
```

By simply typing `make`, the tool builds the **first rule in the file** (`program`) and recursively resolves its dependencies: to obtain `main.o`, it looks at the rule `main.o: ...`, and so on. If `calculs.c` hasn't changed since the last build, `make` does not rebuild `calculs.o`: only the modified part of the project is rebuilt.

## Variables

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

program: main.o calculs.o
	$(CC) main.o calculs.o -o program

main.o: main.c calculs.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` and `$(CFLAGS)` are Makefile variables: changing the compiler or warning options then requires only a single change, at the top of the file.

| Current "`gcc`" option | Role |
|---|---|
| `-Wall -Wextra` | Enables most useful compiler warnings |
| `-g` | Adds debugging information (required for `gdb` /Valgrind) |
| `-o name` | Name the output file |

## Phony Targets (`.PHONY`)

A target like `clean` does not correspond to any actual file to be produced: it is simply used to execute a utility command (in this case, to delete the compiled files):

```makefile
.PHONY: clean

clean:
	rm -f *.o program
```

`.PHONY` tells `make` that `clean` is not a filename: without this line, if a file named `clean` happened to exist in the folder, `make clean` might consider it "up to date" and not run anything.

> **Note:** Passing a target as an argument (`make clean`, `make program`) creates **that** specific target rather than the first one in the file.
