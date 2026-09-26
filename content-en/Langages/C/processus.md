---
order: 18
---

# Process Management

A **process** is an instance of a running program, with its own memory space, isolated from that of other processes. In C, the POSIX standard library (`unistd.h`, `sys/wait.h`) allows you to create new processes, launch other programs, and wait for them to finish. The **POSIX** standard is introduced in the [Writing and Running a Bash Script](/?c=shells&s=bash&p=scripts-et-shebang) chapter of [Bash](/?c=shells&s=bash&p=bash).

> **Note:** `fork()`, `execve()` (used by `execlp()` and other functions in the `exec` family), and `wait()` / `waitpid()` are **system calls**: see the chapter on system calls and file descriptors for what this means in practice (switching to kernel mode, error handling via `errno`).

## `fork()` : duplicate the current process

`fork()` creates a nearly identical copy of the calling process. After the call, **two** processes exist, and both continue execution immediately after the `fork()`: the only difference is the return value:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Error: fork failed\n");
    } else if (pid == 0) {
        printf("I am the child, my PID is %d\n", getpid());
    } else {
        printf("I am the parent, my child's PID is %d\n", pid);
    }

    return 0;
}
```

| Return Value | In which process? | Meaning |
|---|---|---|
| `< 0` | Parent only | The `fork()` failed; no child was created |
| `0` | The child | Always receives `0` |
| `> 0` | The parent | Receives the PID (*process ID*) of the newly created child process |

> **Note:** `pid_t` is the type used for process identifiers. `getpid()` returns the PID of the current process, and `getppid()` returns the PID of its parent.

## Replace the currently running program: the `exec` family

`fork()` duplicates the current process but does not change the program being executed. To launch **another** program in the child process, you use a function from the `exec` family (e.g., `execve`, `execlp`): it completely replaces the code of the current process with that of a new program:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // replaces the child process with the "ls" program
        printf("This line never executes if execlp succeeds\n");
    }

    return 0;
}
```

> **Note:** If `execlp()` succeeds, it never "returns": the child process's code is completely overwritten, so the next line is only reached if `execlp()` itself fails.

## Waiting for a Child to Finish: `wait()` / `waitpid()`

Without synchronization, the parent continues to run independently of the child. `wait()` blocks the parent until one of its children finishes:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Child: I'm working...\n");
        return 42; // the child's exit code
    } else {
        int statut;
        wait(&statut); // the parent waits here for the child to finish

        if (WIFEXITED(statut)) {
            printf("The child terminated with code %d\n", WEXITSTATUS(statut));
        }
    }
}
```

- `wait(&statut)` fills `statut` with information about how the child terminated.
- `WIFEXITED(statut)` checks to see if the child process has terminated normally (via `return` / `exit()`, not via a signal).
- `WEXITSTATUS(statut)` extracts the child's actual exit code.

`waitpid(pid, &statut, 0)` does the same thing as `wait()`, but allows you to wait for a **specific** child (useful when a process has multiple children).

> **Note:** A child process that has terminated but has never been "reclaimed" by a parent's `wait()` remains a **zombie process** in the system's process table until its parent calls `wait()` (or terminates itself).

See also [Threads](/?c=langages-de-programmation&s=c&p=threads), a lighter-weight alternative to `fork()` when tasks need to share the same memory.

## When the Parent Dies Before Its Children: Orphan Processes

An **orphan process** is a child whose parent terminated before it. Unlike a zombie, it **keeps running**: the system gives it a new parent (the system's first process, `init`, or a service process designated for this, such as `systemd`), which will reclaim it when it ends. Killing a program therefore does **not** kill the children it created with `fork()`.

Real case: a measurement script stopped, after 90 s, a program that computed with 4 children; the 4 children were still running 30 minutes later, keeping the processor busy and skewing every following measurement.

| Side | Means | Effect |
|---|---|---|
| Child | [`prctl(PR_SET_PDEATHSIG, SIGKILL)`](https://man7.org/linux/man-pages/man2/prctl.2.html), Linux only | The kernel sends the `SIGKILL` [signal](/?c=langages&s=c&p=signaux-unix) to the child as soon as its parent dies |
| Launcher | Start the program in its own **process group** (`setsid()`, see [a shell's job control](/?c=langages&s=bash&p=architecture-dun-shell#job-control-ctrl-z-fg-bg)), then kill the whole group: `kill(-group, SIGKILL)` | The program and all its descendants receive the signal; in Python, see [the `subprocess` time budget](/?c=langages&s=python&p=sous-processus-et-flux-standard#running-several-programs-in-parallel-with-a-time-budget) |

Two children, one protected by `PR_SET_PDEATHSIG`, the other not; the parent exits after one second without waiting for them. Output of `./orphans; sleep 3` (the `sleep` gives the children time to write):

```c
#include <signal.h>
#include <stdio.h>
#include <sys/prctl.h>
#include <unistd.h>

static void child(int protected, pid_t parent)
{
    if (protected) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);            /* killed when the parent dies */
        if (getppid() != parent)                     /* parent dead before the call? */
            _exit(0);
    }
    sleep(2);                                        /* the parent dies meanwhile */
    printf("%s child: still alive, parent %s\n",
           protected ? "protected" : "unprotected",
           getppid() == parent ? "unchanged" : "replaced");
    fflush(stdout);                                  /* _exit does not flush buffers */
    _exit(0);
}

int main(void)
{
    pid_t parent = getpid();

    for (int protected = 0; protected <= 1; protected++)
        if (fork() == 0)
            child(protected, parent);                /* the child never comes back here */
    sleep(1);
    printf("parent: exiting without waiting for my children\n");
    return 0;
}
```

```
parent: exiting without waiting for my children
unprotected child: still alive, parent replaced
```

The protected child was killed when the parent died and writes nothing; the other one keeps running, attached to a new parent. The `getppid() != parent` test covers the case where the parent dies between `fork()` and `prctl()`: the child would otherwise never be notified.

> **Pitfall:** a program that relaunches itself with `execv("/proc/self/exe", ...)` (the special path of its own executable, see [the `exec` family](/?c=langages&s=c&p=processus#replace-the-currently-running-program-the-exec-family)) then shows up under the name `exe` in `ps` or `pgrep`. Real case: an orphan renamed this way was first mistaken for one of the user's applications. Relaunch through the real path, obtained with `readlink("/proc/self/exe", ...)`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `fork()` duplicates the current process (two processes continue after the call); `exec*()` replaces the current process's program; `wait()`/`waitpid()` wait for a child to terminate. A child whose parent dies becomes an orphan and keeps running. |
| **Tools you can use** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`; `prctl(PR_SET_PDEATHSIG, SIGKILL)`, `setsid()` and `kill(-group, SIGKILL)` against orphans. |
| **Pitfalls to avoid** | Never skip calling `wait()` on a terminated child: it stays "zombie" in the process table until the parent reclaims it or terminates itself; believing that killing a program also kills its children. |
| **Best practices** | Always check the return value of `fork()` (`< 0` = failure) before branching into the parent/child case. |
