---
order: 14
---

# Process Management

A **process** is an instance of a running program, with its own memory space, isolated from that of other processes. In C, the POSIX standard library (`unistd.h`, `sys/wait.h`) allows you to create new processes, launch other programs, and wait for them to finish.

> **Note:** `fork()`, `execve()` (used by `execlp()` and other functions in the `exec` family), and `wait()` / `waitpid()` are **system calls**—see the chapter on system calls and file descriptors for what this means in practice (switching to kernel mode, error handling via `errno`).

## `fork()` : duplicate the current process

`fork()` creates a nearly identical copy of the calling process. After the call, **two** processes exist, and both continue execution immediately after the `fork()`—the only difference is the return value:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Erreur : fork a échoué\n");
    } else if (pid == 0) {
        printf("Je suis l'enfant, mon PID est %d\n", getpid());
    } else {
        printf("Je suis le parent, le PID de mon enfant est %d\n", pid);
    }

    return 0;
}
```

| Return Value | In which process? | Meaning |
|---|---|---|
| `< 0` | Parent only | The `fork()` failed; no child was created |
| `0` | The Child | Always Receives `0` |
| `> 0` | The parent | Receives the PID (*process ID*) of the newly created child process |

> **Note:** `pid_t` is the type used for process identifiers. `getpid()` returns the PID of the current process, and `getppid()` returns the PID of its parent.

## Replace the currently running program: the `exec` family

`fork()` duplicates the current process but does not change the program being executed. To launch **another** program in the child process, you use a function from the `exec` family (e.g., `execve`, `execlp`)—it completely replaces the code of the current process with that of a new program:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // remplace le processus enfant par le programme "ls"
        printf("Cette ligne ne s'exécute jamais si execlp réussit\n");
    }

    return 0;
}
```

> **Note:** If `execlp()` succeeds, it never "returns"—the child process's code is completely overwritten, so the next line is only reached if `execlp()` itself fails.

## Waiting for the Birth of a Child: `wait()` / `waitpid()`

Without synchronization, the parent continues to run independently of the child. `wait()` blocks the parent until one of its children finishes:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Enfant : je travaille...\n");
        return 42; // code de sortie de l'enfant
    } else {
        int statut;
        wait(&statut); // le parent attend ici que l'enfant se termine

        if (WIFEXITED(statut)) {
            printf("L'enfant s'est terminé avec le code %d\n", WEXITSTATUS(statut));
        }
    }
}
```

- `wait(&statut)` Fill out `statut` with information about how the child turned out.
- `WIFEXITED(statut)` checks to see if the child process has terminated normally (via `return` / `exit()`, not via a signal).
- `WEXITSTATUS(statut)` extracts the child's actual exit code.

`waitpid(pid, &statut, 0)` Does the same thing as `wait()`, but allows you to wait for a **specific** child (useful when a process has multiple children).

> **Note:** A child process that has terminated but has never been "reclaimed" by a parent's `wait()` remains a **zombie process** in the system's process table until its parent calls `wait()` (or terminates itself).

See also the chapter on threads, a lighter-weight alternative to `fork()` when tasks need to share the same memory.
