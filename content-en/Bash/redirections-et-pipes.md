---
order: 8
---

# Redirects and Pipes

By default, every Unix command communicates via three streams: **standard** input (`stdin`, what it reads), **standard output** (`stdout`, what it normally displays), and **standard error** (`stderr`, where error messages are sent). Redirection and pipes allow you to redirect these streams to a file or to another command, rather than to the terminal.

> **Note:** These "streams" are actually numbered **file descriptors** (`0`, `1`, `2`)—see the chapter on system calls and file descriptors (Section C) for an explanation of what actually happens at the operating system level when they are redirected.

## Redirect output to a file

```bash
echo "Bonjour" > file.txt    # Overwrites file.txt (or creates it) with this content
echo "Encore" >> file.txt    # Append to the end of file.txt without overwriting
```

> **Note:** `>` silently overwrites the existing contents of the target file—a common mistake is to use `>` when you meant to use `>>`, resulting in the loss of the previous contents without warning.

## Redirect input from a file

```bash
sort < list.txt   # Reads "liste.txt" as standard input for "sort," rather than waiting for keyboard input
```

## Redirect error output

The streams are numbered as follows: `0` = standard input, `1` = standard output, `2` = error output.

```bash
commande_qui_echoue 2> erreurs.log     # Only the error output goes into errors.log
commande 1> output.log 2> erreurs.log  # separates normal output and errors into two files
commande > tout.log 2>&1               # Redirects stdout to tout.log, THEN redirects stderr to wherever stdout is going
commande &> tout.log                    # Bash shortcut equivalent to "> everything.log 2>&1"
```

> **Note:** The order matters for `2>&1`. `2>&1 > file` does **not** work as expected: at that point, `2` is still redirected to the terminal (the standard output at that time), and only `1` is then sent to `file`. You must write `> file 2>&1`: first redirect `1` to `file`, then have `2` point to the same destination as `1` **at that exact moment**.

## `/dev/null` : Skip an output

A special file that "swallows" everything you write into it, without ever storing anything—useful for deleting a stream you no longer need:

```bash
commande_bruyante > /dev/null 2>&1   # ignores all normal output AND all errors
```

## `|`: Chaining Commands

A pipe connects the standard output of one command to the standard input of the next one:

```bash
ls -l | grep ".txt"          # Keep only the lines containing ".txt"
grep "404" access.log | wc -l   # counts the lines containing "404" in the file
ps aux | sort -k 3 -nr | head -5      # The 5 processes that use the most CPU
```

Each pipe command is executed simultaneously, with the output of one feeding into the input of the next as they proceed—this is not sequential execution with intermediate storage.

## `tee` : Redirect while maintaining the display

`tee` writes its output both to a file **and** to standard output (useful for viewing the result while saving it):

```bash
ls -l | tee resultats.txt   # displays the result on the screen AND saves it to resultats.txt
```

## Summary of Symbols

| Symbol | Effect |
|---|---|
| `>` | Redirects standard output, overwrites the file |
| `>>` | Redirects standard output and appends the following |
| `<` | Redirects standard input from a file |
| `2>` | Redirects error output |
| `&>` | Redirects both standard output and error output to the same destination |
| `\|` | Connects the output of one command to the input of the next |
