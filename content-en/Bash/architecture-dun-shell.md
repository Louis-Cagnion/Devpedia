---
order: 12
---

# How a Shell Works (Internal Architecture)

Everything Bash does on the surface (variables, loops, pipes, redirection) is based on a mechanism that is fairly simple to describe: a loop that reads a line, parses it, interprets it, and then launches processes using the standard system calls described in the chapter on process management in C (`fork`, `execve`, `wait`). This chapter describes this mechanism with the goal of understanding—or even recreating—a minimal shell.

> **Prerequisites:** This chapter assumes you are familiar with **system calls** and **file descriptors** (`STDIN_FILENO`, `dup2()`...)—see the dedicated chapter in the C section if these concepts are not yet clear.

## The Main Loop (REPL)

An interactive shell is essentially an infinite loop:

```
tant que vrai :
    afficher le prompt
    lire une ligne de commande
    découper la ligne en mots (tokenisation)
    appliquer les expansions (variables, jokers, substitutions...)
    exécuter la commande résultante
    attendre sa fin si elle est au premier plan
```

*Read-Eval-Print Loop* (REPL): read, evaluate, (implicitly) display the result via the command's standard output, loop.

## The exact order of the expansions

A typed command is not executed as-is: Bash performs several expansion steps, in a fixed and non-negotiable order, before executing anything:

1. **Brace expansion** (`{1,2,3}` → `1 2 3`)
2. **Tilde expansion** (`~` → `/home/utilisateur`)
3. **Parameter/variable expansion, command substitution, and arithmetic** (`$var`, `$(commande)`, `$((1+1))`), evaluated from left to right
4. **Word*** ***splitting**: The result of the previous expansions is split **into words** based on spaces, unless it was enclosed in double quotation marks
5. **Path expansion** (*globbing*: `*.txt` → actual list of files)
6. **Removal of quotation marks** (the quotation marks themselves are never passed to the final command)

> **Note:** It is this specific order that explains why `"$var"` (with quotation marks) prevents word splitting (step 4), whereas `$var` on its own is vulnerable to it—the quotation marks are only removed in the very last step, after the content they were protecting has (or has not) already been split into words.

## Running a Command: Built-in vs. External

Once the line has been split and expanded, the shell must distinguish between two cases:

### Internal Commands (*Built-ins*)

`cd`, `export`, `echo` (often), `read`, `exit`... are executed **directly by the shell process itself**, without launching a new process. This is a necessity, not a stylistic choice: `cd` must change the **shell’s** current directory, not that of a short-lived subprocess that would disappear immediately after changing its directory.

### External Commands

For a program such as `ls` or `grep`, the shell replicates exactly the mechanism described in the chapter on process management in C:

```
pid_t pid = fork();

if (pid == 0) {
    // processus enfant : remplace son image mémoire par le programme demandé
    execve("/bin/ls", arguments, environnement);
    _exit(127); // atteint uniquement si execve a échoué (commande introuvable, par exemple)
} else {
    // processus parent (le shell lui-même) : attend la fin de l'enfant
    int statut;
    waitpid(pid, &statut, 0);
}
```

## How the shell determines which executable to run

If the command entered contains a `/` (e.g., `./script.sh`, `/bin/ls`), the shell uses it directly. Otherwise, it iterates through each directory listed in `$PATH` (see the chapter on environment variables), in order, and stops at the **first** executable file found with that name—this is a simple `access(chemin, X_OK)` test repeated on each candidate.

## Implement a pipe (`cmd1 | cmd2`)

A pipe relies on the `pipe()` system call, which creates two connected file descriptors (one for reading, one for writing), combined with `fork()` and `dup2()`:

```
int fds[2];
pipe(fds); // fds[0] = extrémité de lecture, fds[1] = extrémité d'écriture

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // la sortie standard de cmd1 devient l'écriture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // l'entrée standard de cmd2 devient la lecture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(source, cible)` makes the descriptor `cible` (e.g., `STDOUT_FILENO`, which resolves to `1`) point to the same resource as `source` — it is precisely this mechanism, applied to a pipe descriptor rather than a file, that connects the output of one command to the input of the next.

## Implement a redirect (`>`, `<`)

The same logic applies as for a pipe, but the "source" is a file opened with `open()` rather than a pipe:

```
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // tout ce qu'écrit le programme sur stdout part maintenant dans sortie.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponds to `>` (overwrites the file), `O_APPEND` to `>>` (appends to the end) — see the chapter on redirects for the behavior observed from the user's perspective.

## Job Monitoring: `&`, `Ctrl+Z`, `fg` / `bg`

Each pipeline that is started forms a **process group**—a `setpgid()` that allows the shell and the terminal to treat all processes in the same pipeline as a single unit (e.g., sending a signal to all of them at the same time), rather than having to target each PID individually. The terminal grants keyboard control to only **one** group at a time (`tcsetpgrp()`), namely the one in the foreground. `Ctrl+Z` sends the signal `SIGTSTP` to this group (suspends it without terminating it); `fg` / `bg` (see the chapter on process management) respectively return control of the terminal or return `SIGCONT` to resume execution in the background.

## Build Your Own Mini-Shell

In summary, a minimal shell written in C requires: a read loop, a parser that handles quotes and operators (`|`, `>`, `<`, `&&`), expansion logic in the correct order, `fork` / `execve` / `waitpid` for external commands, directly called C functions for built-ins, and `pipe()` / `dup2()` / `open()` for pipes and redirection. This is literally the entire architecture—the rest (autocompletion, history, syntax highlighting, etc.) is just added convenience on top of it.
