---
order: 1
---

# Basic Commands

This chapter already assumes you know what a [terminal](/?c=bases-de-l-informatique&p=le-terminal) and a [file path](/?c=bases-de-l-informatique&p=arborescence-et-chemins) are — it covers the very first Bash commands used in a terminal, before writing a single script.

## Moving around: `cd` and `pwd`

```bash
pwd            # displays the current folder (Print Working Directory)
cd Documents    # moves into the "Documents" subfolder
cd ..            # moves up one level
cd -              # returns to the previous folder
```

> **Pitfall:** `cd` with no argument doesn't "do nothing" — it takes you straight back to your home folder (`$HOME`), which surprises anyone expecting to stay put.
>
> **Best practice:** check your location with `pwd` after a `cd` with no argument, rather than assuming you stayed in the same place.

## Listing a folder: `ls`

```bash
ls              # lists the current folder's contents
ls -a            # includes hidden files (whose name starts with a dot)
ls -l             # shows details (permissions, size, date) rather than just names
```

| Option | Effect |
|---|---|
| `-a` | Also shows hidden files/folders |
| `-l` | Detailed format (one line per file, with permissions and size) |
| `-la` | Both combined — the order of the letters doesn't matter |

> **Pitfall:** a folder that looks empty or incomplete with a plain `ls` may actually contain hidden files (their name starts with a dot, e.g. `.env`, `.gitignore`) — invisible without `-a`.
>
> **Best practice:** when a folder's contents seem inconsistent with what's expected, rerun `ls` with `-a` before digging further.

## Reading a file's content: `cat`

```bash
cat file.txt   # displays the entire file content in the terminal
```

> **Note:** for a file too long to fit on one screen, see the chapter on text processing (`less`, `head`, `tail`) — `cat` displays everything in one block, with no pagination.

> **Pitfall:** using `cat` on a binary file (an image, an executable) rather than a text file. The terminal tries to display bytes that aren't valid text, which can leave it visually corrupted (strange characters, colors that persist) — with nothing actually broken.
>
> **Best practice:** only use `cat` on files known to be text. If the terminal stays inconsistently displayed after this kind of mistake, the `reset` command (or closing/reopening the terminal) puts it back in a clean state.

## Creating, copying, moving, deleting

These commands are covered together with the permission system, in the next chapter: [Permissions and File Manipulation](/?c=shells&s=bash&p=permissions-et-fichiers).

## Getting help: `man` and `--help`

```bash
man ls           # opens the full manual for the ls command (q to quit)
ls --help         # shorter summary, directly in the terminal
```

### The manual is split into several sections

`man` doesn't just cover terminal commands: it's the manual for the whole system, split into **numbered sections**, each dedicated to a different category of topic.

| Section | Content |
|---|---|
| 1 | User commands (the ones typed in a terminal — `ls`, `cd`, `grep`...) |
| 2 | System calls (functions provided directly by the Linux kernel) |
| 3 | C language library functions (`printf`, `malloc`...) |
| 5 | File formats and conventions (e.g. the structure of `/etc/passwd`) |
| 7 | Miscellaneous: general conventions, protocols |
| 8 | System administration commands (usually reserved for root) |

This becomes concrete as soon as the same name exists in **several** sections at once — `printf` is both a terminal command (section 1) and a C language function (section 3, see the [dedicated C chapter](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)), and these are two completely different manual pages:

```bash
man printf      # with no section given, opens the lowest one found: here, 1 (command)
man 3 printf     # forces opening section 3: the C function, not the command
```

To find out which sections a name exists in before choosing:

```bash
man -f printf    # lists every section where "printf" has a manual page
whatis printf     # equivalent, with a one-line description for each
```

### Pitfall: `man cd` doesn't work as expected

```bash
man cd
# No manual entry for cd
```

`cd` isn't a separate program on disk: it's a **built-in command** (*builtin*), executed directly by Bash itself rather than launched as a separate process (see [Running a Command: Builtin vs. External](/?c=shells&s=bash&p=architecture-dun-shell) for why `cd` has to work this way). `man` looks for a page dedicated to an executable — there isn't one for a builtin. The right command in this case is `help`:

```bash
help cd          # documentation for the cd builtin, provided by Bash itself
man bash          # alternative: every builtin is also documented there, in the "SHELL BUILTIN COMMANDS" section
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `pwd` shows where you are, `cd` changes folder, `ls` lists a folder, `cat` displays a file. Options (`-l`, `-a`) change a command's behavior without changing its name. |
| **Tools you can use** | `man <command>` for full documentation, `<command> --help` for a quick summary, `man -f <name>`/`whatis <name>` to see which sections a name exists in, `help <builtin>` for a built-in command like `cd`. |
| **Pitfalls to avoid** | `cd` with no argument takes you to your home folder (`$HOME`) rather than doing nothing. `man <name>` with no section given opens the first one found — not necessarily the intended one if the name exists elsewhere (e.g. `printf`, both a command **and** a C function). `man <builtin>` (e.g. `man cd`) fails outright: a builtin has no dedicated page, `help` replaces it. |
| **Best practices** | Check your location with `pwd` before a command that acts on a relative path, rather than assuming it. |
