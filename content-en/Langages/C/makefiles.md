---
order: 12
---

# Makefiles

A **Makefile** automates the compilation of a multi-file C project: rather than manually retyping each [`gcc`](https://gcc.gnu.org) command (see [The Compilation Process](/?c=langages-de-programmation&s=c&p=compilation)), you define the build rules once, and the tool `make` executes them, recompiling only what has actually changed since the last time.

## Anatomy of a Rule

```makefile
target: dependencies
	command
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

## Writing the recipe on the same line: `;`

A recipe always follows the `target: dependencies` line, indented with a tab, as seen above. A `;` after the dependency list lets you write a short recipe directly on that same line, without moving to the next one:

```makefile
clean: ; rm -f *.o
```

Strictly equivalent to:

```makefile
clean:
	rm -f *.o
```

> **Pitfall:** confusing this Makefile `;` with a regular shell `;` (which chains two commands). Here, it only separates the dependency list from the recipe itself: nothing to do with chaining commands.

## Including a library's headers: `-I`

```makefile
program: main.o
	$(CC) main.o -I includes -I libft/includes -o program
```

`-I` adds a folder to the list where the compiler looks for a `#include "..."` or `#include <...>` file (see [Headers](/?c=langages&s=c&p=headers)): essential as soon as a project keeps its `.h` files somewhere other than the current folder, or depends on a third-party library.

> **Pitfall:** pointing `-I` at the wrong folder level (e.g. `-I includes` when the files actually live in `includes/subfolder`). The compiler then fails with a "file not found" message, even though the file does exist somewhere in the project.

## Looking up a library's compilation flags: `pkg-config`

Linking against an external library (e.g. [GLFW](https://www.glfw.org) to open an OpenGL window) often requires several `-I` and `-l` (library name for the linker) flags that vary from one machine and distribution to another. `pkg-config` avoids guessing them by hand: every library installs a small `.pc` file describing its own flags, and `pkg-config` reads them on demand.

```bash
pkg-config --cflags glfw3        # -I/usr/include             (compilation flags)
pkg-config --cflags --libs glfw3 # adds -lglfw -lm ...         (+ linker flags)
```

In a Makefile, `$(shell ...)` runs a shell command and replaces the call with its output, which lets you inject `pkg-config`'s result directly:

```makefile
GLFW_FLAGS = $(shell pkg-config --cflags --libs glfw3)

program: main.o
	$(CC) main.o $(GLFW_FLAGS) -o program
```

> **Pitfall:** the name passed to `pkg-config` (`glfw3` here) is not always identical to the name of the system package that installs it (e.g. `libglfw3-dev` on Debian/Ubuntu). `pkg-config --list-all` lists every `.pc` module actually available on the machine when that exact name isn't known in advance.

## Silent mode: `@` and `MAKEFLAGS`

By default, `make` prints each command before running it. A `@` prefix on a line suppresses that printing, for **that single line**:

```makefile
compile:
	@echo "Compiling..."
	@gcc main.c -o program
```

Without `@`, `make` would first print the line `gcc main.c -o program` as-is, on top of the `Compiling...` message produced by its execution.

To apply this behavior to the **whole** file without prefixing every line individually, `MAKEFLAGS += -s` at the very top of the file has the same effect, but globally:

```makefile
MAKEFLAGS += -s

compile:
	echo "Compiling..."   # already silent thanks to MAKEFLAGS; the @ is redundant here
	gcc main.c -o program
```

> **Note:** the two mechanisms overlap without conflicting. `MAKEFLAGS += -s` avoids forgetting an `@` on a new line added later; `@` line by line instead lets you keep certain lines deliberately visible (an error message you want to see even in silent mode, for example). Combining both, as a cautious project might, is redundant but harmless.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Makefile describes rules (`target: dependencies` + command) that `make` executes, rebuilding only what has actually changed. A short recipe can also sit on the target's own line, after a `;`. |
| **Tools you can use** | Variables (`CC`, `CFLAGS`), phony targets (`.PHONY`), `-I` for headers, `pkg-config` for a library's flags, `@`/`MAKEFLAGS += -s` for silent mode. |
| **Pitfalls to avoid** | Indenting a command with spaces instead of a tab; pointing `-I` at the wrong folder level; confusing a library's `pkg-config` name with its system package name. |
| **Best practices** | Declare `.PHONY` for any target that doesn't produce an actual file (`clean`, `test`...), to avoid a conflict with a file of the same name; go through `pkg-config` rather than guessing `-I`/`-l` by hand for a third-party library. |
