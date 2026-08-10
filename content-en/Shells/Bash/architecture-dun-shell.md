---
order: 13
---

# How a Shell Works (Internal Architecture)

Everything Bash does on the surface (variables, loops, pipes, redirections) rests on a mechanism simple enough to describe: a loop that reads a line, splits it, interprets it, then launches processes via the standard system calls from C's process management chapter (`fork`, `execve`, `wait`). This chapter describes that mechanism, with the goal of understanding — or even rebuilding — a minimal shell.

> **Prerequisite:** this chapter assumes you know what a **system call** and a **file descriptor** (`STDIN_FILENO`, `dup2()`...) are — see the dedicated chapter in the C section if these concepts aren't clear yet.

## The main loop (REPL)

An interactive shell is fundamentally an infinite loop:

```text
while true:
    display the prompt
    read a command line
    split the line into words (tokenization)
    apply expansions (variables, globs, substitutions...)
    run the resulting command
    wait for it to finish if it's in the foreground
```

*Read-Eval-Print Loop* (REPL): read, evaluate, (implicitly) print the result via the command's standard output, loop.

## The precise order of expansions

A typed line is **not** run as-is: Bash applies several expansion passes, in a fixed, non-negotiable order, before launching anything:

1. **Brace expansion** (`{1,2,3}` → `1 2 3`)
2. **Tilde expansion** (`~` → `/home/user`)
3. **Parameter/variable expansion, command substitution, and arithmetic** (`$var`, `$(command)`, `$((1+1))`), evaluated left to right
4. **Word splitting**: the result of the previous expansions is split again on spaces, unless it was inside double quotes
5. **Pathname expansion** (*globbing*: `*.txt` → the actual list of matching files)
6. **Quote removal** (the quote characters themselves are never passed on to the final command)

> **Note:** it's this precise order that explains why `"$var"` (with quotes) protects against word splitting (step 4) while `$var` alone is exposed to it — the quotes are only removed at the very last step, after splitting has already happened (or not) on the content they were protecting.

## Subshells: fork() with no execve()

In the external-command example below, the child produced by `fork()` calls `execve()`: it immediately replaces its memory image with another program and stops being a shell. A **subshell** is the other case: a child that **stays** a shell and keeps interpreting commands, never calling `execve()`. Bash automatically creates one for:

- a command in parentheses: `(cd /tmp && ls)`
- each stage of a pipeline (see the next section)
- a command substitution: `result=$(command)`
- a background command: `command &`

A subshell inherits a **copy** of the parent shell's variables at the moment it starts — but it's a one-way copy, just like exporting an [environment variable](/?c=shells&s=bash&p=variables-denvironnement): any change it makes (`cd`, a variable...) disappears with it when it ends, never reaching the parent.

```bash
cd /tmp
(cd /var && pwd)   # displays /var, inside the subshell
pwd                # still displays /tmp: the subshell's cd didn't survive
```

## Running a command: builtin vs. external

Once the line is split and expanded, the shell has to distinguish two cases:

### Built-in commands (*builtins*)

`cd`, `export`, `echo` (often), `read`, `exit`... are run **directly by the shell process itself**, with no new process launched. This is a necessity, not a style choice: `cd` has to change **the shell's** current directory, not that of a short-lived subprocess that would vanish immediately along with its directory change.

### External commands

For a program like `ls` or `grep`, the shell reproduces exactly the mechanism from C's process management chapter:

```c
pid_t pid = fork();

if (pid == 0) {
    // child process: replaces its memory image with the requested program
    execve("/bin/ls", arguments, environment);
    _exit(127); // reached only if execve failed (command not found, for instance)
} else {
    // parent process (the shell itself): waits for the child to finish
    int status;
    waitpid(pid, &status, 0);
}
```

## How the kernel recognizes an executable script (the shebang)

When `execve()` receives a file's path, the kernel reads its very first bytes to know how to launch it. If they equal `#!` (the [shebang](/?c=shells&s=bash&p=scripts-et-shebang)), the kernel doesn't try to run the file as machine code: it re-invokes `execve()` itself, this time on the interpreter named after `#!`, passing it the original script's path as its first argument.

```text
./script.sh
      │
      ▼
execve("./script.sh", ...)
      │
      ▼
The kernel reads the file's first 2 bytes: "#!"
      │
      ▼
Re-invokes: execve("/bin/bash", ["/bin/bash", "./script.sh", ...], ...)
```

This is why a script with no execute permission (`chmod +x`, see [Permissions and File Manipulation](/?c=shells&s=bash&p=permissions-et-fichiers)) can't be launched directly (`./script.sh` fails), but stays runnable by invoking the interpreter explicitly (`bash script.sh`): in this second case, it's `bash` itself (already executable) that's launched by `execve()` — it's `bash`, not the kernel, that then opens the script as a plain text file to read line by line.

## How the shell finds which executable to run

If the typed command contains a `/` (e.g. `./script.sh`, `/bin/ls`), the shell uses it directly. Otherwise, it walks each folder listed in [`$PATH`](/?c=shells&s=bash&p=variables-denvironnement), in order, and stops at the **first** executable file found with that name — a simple `access(path, X_OK)` check repeated on each candidate.

## Implementing a pipe (`cmd1 | cmd2`)

A pipe relies on the `pipe()` system call, which creates two connected file descriptors (one read end, one write end), combined with `fork()` and `dup2()`:

```c
int fds[2];
pipe(fds); // fds[0] = read end, fds[1] = write end

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // cmd1's standard output becomes the pipe's write end
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // cmd2's standard input becomes the pipe's read end
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(source, target)` makes the `target` descriptor (e.g. `STDOUT_FILENO`, which equals `1`) point to the same resource as `source` — it's exactly this mechanism, applied to a pipe's descriptor rather than a file, that links one command's output to the next one's input.

## Implementing a redirection (`>`, `<`)

Same logic as for a pipe, but the "source" is a file opened with `open()` rather than a pipe:

```c
int fd = open("output.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // everything the program writes to stdout now goes into output.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponds to `>` (overwrites the file), `O_APPEND` to `>>` (appends to the end) — see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes) for the behavior observed on the user's side.

## Job control: `&`, `Ctrl+Z`, `fg`/`bg`

Every pipeline launched forms a **process group** — a shared identifier (`setpgid()`) that lets the shell and the terminal treat every process in the same pipeline as a single unit (e.g. sending a signal to all of them at once), rather than having to target each PID individually. The terminal only gives keyboard control to **one** group at a time (`tcsetpgrp()`), the one in the foreground. `Ctrl+Z` sends the `SIGTSTP` signal to that group (suspends it without ending it), `fg`/`bg` (see [Process Management](/?c=shells&s=bash&p=gestion-des-processus)) respectively give back terminal control or send `SIGCONT` to resume execution in the background.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A shell is a REPL loop: read a line, apply expansions in a fixed order, execute (internally for a builtin, or `fork`/`execve`/`wait` for an external command). |
| **Tools you can use** | `fork()`/`execve()`/`waitpid()`, `pipe()`/`dup2()` for pipes and redirections, the shebang so a script is recognized as executable. |
| **Pitfalls to avoid** | Mixing up the order of expansions — it's what explains why `"$var"` protects against word splitting while `$var` alone is exposed to it. |
| **Best practices** | Build your own mini-shell to check your understanding: read loop, parser, expansions, `fork`/`execve`/`waitpid`, `pipe`/`dup2`/`open`. |

## Building your own mini-shell

In summary, a minimal shell in C needs: a read loop, a parser that respects quotes and operators (`|`, `>`, `<`, `&&`), the expansion logic in the right order, `fork`/`execve`/`waitpid` for external commands, directly-called C functions for builtins, and `pipe()`/`dup2()`/`open()` for pipes and redirections. That's literally the whole architecture — the rest (completion, history, coloring...) is just comfort added on top.
