---
order: 12
---

# Makefiles

A **Makefile** automates the compilation of a multi-file C project: rather than manually retyping each [`gcc`](https://gcc.gnu.org) command (see [The Compilation Process](/?c=langages-de-programmation&s=c&p=compilation)), you define the build rules once, and the tool [`make`](https://www.gnu.org/software/make/manual/make.html) executes them, recompiling only what has actually changed since the last time.

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
| `-g` | Adds debugging information (required for [`gdb`](https://sourceware.org/gdb/) and [Valgrind](/?c=langages&s=c&p=memoire#the-four-classic-memory-bugs)) |
| `-o name` | Name the output file |
| `-O2` | Enables the [optimization level](/?c=langages-de-programmation&s=c&p=compilation) recommended for production |

> **Pitfall:** `-O2`/`-O3` in `CFLAGS` can surface a warning absent at `-O0` (see [Optimization Levels](/?c=langages-de-programmation&s=c&p=compilation)): test `make` with the `CFLAGS` actually used in production, not just a debug configuration (`-O0 -g`).

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
main.o: main.c
	$(CC) $(CFLAGS) -I includes -I libft/includes -c main.c -o main.o
```

`-I` adds a folder to the list where the compiler looks for a `#include "..."` or `#include <...>` file (see [Headers](/?c=langages&s=c&p=headers)). It is therefore used when compiling a `.c` (`-c`), never at linking, which no longer reads any header: essential as soon as a project keeps its `.h` files somewhere other than the current folder, or depends on a third-party library.

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

## One Rule for Every File: `%`, `$@`, `$<`, `$^`

Writing one rule per `.c` file (as in [Chaining Rules](#chaining-rules)) quickly gets long. A **pattern rule** replaces them all: the `%` stands for "any name", the same on both sides of the rule.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# the list of sources, written only once
SRCS = main.c calculs.c
# the same list, each .c replaced by .o: main.o calculs.o
OBJS = $(SRCS:%.c=%.o)

# $@ is program, $^ is main.o calculs.o
program: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

# applies to every .o: main.o from main.c, calculs.o from calculs.c
%.o: %.c calculs.h
	$(CC) $(CFLAGS) -c $< -o $@
```

`$@`, `$<` and `$^` are **automatic variables**: `make` fills them in itself, rule by rule, when it runs the command.

| Variable | Contains | For `main.o` in the rule `%.o: %.c calculs.h` |
|---|---|---|
| `$@` | The target being built | `main.o` |
| `$<` | The **first** dependency | `main.c` |
| `$^` | **All** dependencies, without duplicates | `main.c calculs.h` |

`$(SRCS:%.c=%.o)` is a **substitution reference**: it copies the `SRCS` list, replacing in each word the pattern on the left of the `=` with the one on the right.

```text
$ make
gcc -Wall -Wextra -O2 -c main.c -o main.o
gcc -Wall -Wextra -O2 -c calculs.c -o calculs.o
gcc -Wall -Wextra -O2 -o program main.o calculs.o
```

> **Pitfall:** `$^` instead of `$<` in the `%.o` rule also passes `calculs.h` to `gcc` (`gcc -c main.c calculs.h -o main.o`), which refuses: `cannot specify '-o' with '-c', '-S' or '-E' with multiple files`. To compile a `.c`, always use `$<`.

## Changing Options Recompiles Nothing

A Makefile variable can be overridden at launch, for that run only: `make CFLAGS="-O0 -g"` builds with those options, without editing the file. But `make` decides what to rebuild by comparing **modification dates** only: compilation options play no part in that decision.

```bash
make                    # compiles main.o, calculs.o and program with -O2
make CFLAGS="-O0 -g"    # make: 'program' is up to date.  (nothing is recompiled)
```

| Situation | Result |
|---|---|
| `make CFLAGS="-O0 -g"` right after `make` | Nothing changes: the program stays at `-O2`, without debugging information |
| A single `.c` modified between the two runs | A **mixed** program: that file compiled with the new options, the others with the old ones |

| Remedy | Principle | Cost |
|---|---|---|
| `make clean` before every change of options | No `.o` left: everything is recompiled | Full recompilation at every change; forgetting it goes unnoticed |
| One object folder per set of options | Each set of options has its own `.o` files: going back to options already used recompiles nothing | One more folder per set of options tried |

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# obj/ followed by a number computed from the text of CFLAGS
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculs.c
# obj/<number>/main.o obj/<number>/calculs.o
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)

# FORCE: linking is redone on every run (see below)
program: $(OBJS) FORCE
	$(CC) $(CFLAGS) -o $@ $(OBJS)

# mkdir -p creates the folder if it is missing, without error if it already exists
$(OBJDIR)/%.o: %.c calculs.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

# removes the object folders of every set of options at once
clean:
	rm -rf obj program

FORCE:
.PHONY: clean FORCE
```

The folder name comes from a [shell](/?c=langages&s=bash&p=bash) command, run by `$(shell ...)` (see [`pkg-config`](#looking-up-a-library-s-compilation-flags-pkg-config)), whose three steps are connected by [pipes](/?c=langages&s=bash&p=redirections-et-pipes#pipes-chaining-commands):

| Step | Role | Output for `-Wall -Wextra -O2` |
|---|---|---|
| [`printf '%s' '...'`](https://man7.org/linux/man-pages/man1/printf.1.html) | Writes the text of the options, without a newline | `-Wall -Wextra -O2` |
| [`cksum`](https://man7.org/linux/man-pages/man1/cksum.1.html) | Computes a **checksum**: a number that summarizes the text (like a [hash function](/?c=langages&s=c&p=tables-de-hachage#the-hash-function)), different as soon as one character changes | `364582449 17` (the checksum, then the number of bytes) |
| [`cut -d' ' -f1`](/?c=langages&s=bash&p=traitement-de-texte#cut-extracting-columns-simply) | Keeps the first field | `364582449` |

**Why [linking](/?c=langages&s=c&p=compilation#4-linking) is always redone.** A target that depends on `FORCE` (a target with no dependency and no command, matching no file) is rebuilt on every run. Without it:

| Step | Command | What happens without `FORCE` |
|---|---|---|
| 1 | `make` | `obj/364582449/*.o` compiled, `program` linked at `-O2` |
| 2 | `make CFLAGS="-O0 -g"` | `obj/1873556349/*.o` compiled, `program` linked at `-O0`, hence newer than `obj/364582449/*.o` |
| 3 | `make` | `program` is newer than `obj/364582449/*.o`: "up to date", it stays at `-O0` |

With `FORCE`, step 3 links the objects of `obj/364582449/` again, recompiling nothing: linking only takes a moment.

> **Pitfall:** `$^` instead of `$(OBJS)` in the link command also contains `FORCE`: the linker then looks for a file with that name and stops (`cannot find FORCE: No such file or directory`).

> **Pitfall:** a comment written at the end of a variable line (`OBJDIR = obj/...   # objects`) leaves the spaces before it in the value: `$(OBJDIR)/%.o` becomes `obj/364582449   /%.o`, i.e. two separate targets. `make` then stops on `mixed implicit and normal rules` and `No rule to make target '%.c'`, messages that don't point at the comment. Write variable comments on their own line, above.

## Chaining the Three PGO Steps in One Target

[Profile-guided optimization](/?c=langages&s=c&p=compilation#profile-guided-optimization-pgo) (PGO) compiles the program three times in a row: instrumented version, training run, optimized version. A Makefile target can chain all three, by running `make` again on an ordinary compilation target (`link`) with other options.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
NAME = program
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculs.c
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)
# folder of the profiles (.gcda files)
PGO_DIR = pgo
# training inputs, different from those of the speed measurements
PGO_INPUTS = sample1.txt sample2.txt

# default target: the three steps, redone only if a source or the Makefile changes
$(NAME): $(SRCS) calculs.h Makefile
	rm -rf $(PGO_DIR) obj/pgo
	$(MAKE) link NAME=instrumented OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-generate=$(PGO_DIR)"
	for f in $(PGO_INPUTS); do ./instrumented $$f > /dev/null || exit 1; done
	rm -f instrumented obj/pgo/*.o
	$(MAKE) link NAME=$(NAME) OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-use=$(PGO_DIR)"

# direct compilation, without PGO (trials, debugging), always linked as with FORCE
link: $(OBJS)
	$(CC) $(CFLAGS) -o $(NAME) $(OBJS)

$(OBJDIR)/%.o: %.c calculs.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf obj $(PGO_DIR) instrumented $(NAME)

.PHONY: link clean
```

| Detail | Why |
|---|---|
| [`$(MAKE)`](https://www.gnu.org/software/make/manual/html_node/MAKE-Variable.html) rather than `make` | Runs exactly the same `make` program again, flagging it as a recursive call: its options (`-j`, `-n`...) are passed on correctly to the sub-`make` |
| `NAME=... OBJDIR=... CFLAGS=...` after `link` | Override, for that call only, the values written in the Makefile (previous section) |
| Same `OBJDIR=obj/pgo` at steps 1 and 3 | Each `.o`'s profile is named after that `.o`: with another folder at step 3, the profile isn't found, which `gcc` only reports as a [warning](/?c=langages&s=c&p=compilation#profile-guided-optimization-pgo) |
| `rm -f ... obj/pgo/*.o` before step 3 | The instrumented `.o` files are newer than the sources: without this `rm`, `make` recompiles nothing, links the step 1 objects without the library that records the counts, and fails (`undefined reference to '__gcov_merge_add'`) |
| `\` at the end of a line | Each command line runs in its own shell; `\` joins two lines into a single command |
| `$$f` | In a command, `$` belongs to `make`; `$$` passes a `$` on to the shell, for the variable of the [`for` loop](/?c=langages&s=bash&p=boucles#the-for-loop-walking-a-list) |
| `\|\| exit 1` | Stops everything at the first training run that fails: without it, the loop only returns the [exit code](/?c=langages&s=bash&p=scripts-et-shebang#exit-codes-exit) of its last iteration, and an earlier failure would go unnoticed |
| Dependencies `$(SRCS) calculs.h Makefile` | The three steps are only redone if the code or the Makefile changes |

## Knowing Whether a Rebuild Is Due: `make -q`

With `-q` (*question*), `make` runs no command: it only answers through its [exit code](/?c=langages&s=bash&p=scripts-et-shebang#exit-codes-exit).

| Option | Runs the commands? | What it gives |
|---|---|---|
| `make -n` | No | Shows the commands that would be run |
| `make -q` | No | Exit code `0` if everything is up to date, `1` if a rebuild is due, `2` on error |

Useful in a script, to warn before a long rebuild (the three PGO steps take about 24 seconds on the SAT solver mentioned in [compilation](/?c=langages&s=c&p=compilation#profile-guided-optimization-pgo)):

```bash
if ! make -q; then                     # 1 or 2: there is something to do
    echo "Rebuilding (about 24 s)..."  # warns before the wait
fi
make -s || exit 1                      # builds if needed, silently
```

> **Pitfall:** a `.PHONY` target, or one that depends on `FORCE`, is never "up to date": `make -q link` always answers `1`. Ask the question about a target that is a real file, built only when its dependencies change (here `program`, the PGO target).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Makefile describes rules (`target: dependencies` + command) that `make` executes, rebuilding only what has actually changed. A short recipe can also sit on the target's own line, after a `;`. `make` only compares dates: changing the compilation options recompiles nothing. |
| **Tools you can use** | Variables (`CC`, `CFLAGS`), phony targets (`.PHONY`), `-I` for headers, `pkg-config` for a library's flags, `@`/`MAKEFLAGS += -s` for silent mode.; pattern rules (`%`, `$@`, `$<`, `$^`); `make VARIABLE=value`; `$(MAKE)` to chain steps (PGO); `make -n` and `make -q`. |
| **Pitfalls to avoid** | Indenting a command with spaces instead of a tab; pointing `-I` at the wrong folder level; confusing a library's `pkg-config` name with its system package name.; `$^` to compile a `.c`; a comment at the end of a variable line; believing a new `CFLAGS` was applied. |
| **Best practices** | Declare `.PHONY` for any target that doesn't produce an actual file (`clean`, `test`...), to avoid a conflict with a file of the same name; go through `pkg-config` rather than guessing `-I`/`-l` by hand for a third-party library.; one object folder per set of options, with linking always redone; `\|\| exit 1` in a command loop. |
