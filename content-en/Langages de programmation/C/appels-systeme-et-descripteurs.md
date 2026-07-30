---
order: 15
---

# System Calls and File Descriptors

A program cannot read a file, create a process, or send data over the network by directly manipulating the hardware—this could be disastrous for the system's stability and security if any program had unrestricted access to it. Instead, it must go through a narrow, controlled gateway: the** system** call (*syscall*). This chapter explains this mechanism and the **file descriptor**—the “handle” that the kernel returns in exchange—both of which are used constantly whenever you interact with files, processes, or pipes (see the chapters on process management, threads, and shell architecture).

## User Space vs. Kernel Space

```
Programme (espace utilisateur)
      |
      | appel système : open(), read(), write(), fork(), pipe()...
      v
Noyau du système d'exploitation (espace noyau)
      |
      v
Matériel (disque, réseau, mémoire physique...)
```

A standard C function call (`addition(2, 3)`) executes entirely in **user** space, without ever leaving the program. A system call is different: it explicitly asks the **kernel** to act on the program’s behalf for an operation that the program is not permitted to perform itself. This request involves a controlled change in execution mode (*user mode* → *kernel mode*), verified by the processor—it is this verification that prevents a malicious or buggy program from directly accessing another program’s memory or disk.

> **Note:** A function such as `printf()` is not itself a system call—it is a library function that formats the string in user space and then internally calls the actual system call (`write()`) to send it to standard output.

## Some Common System Calls

| System Call | Role |
|---|---|
| `open()` / `close()` | Open / Close a File |
| `read()` / `write()` | Read/write bytes to a handle |
| `fork()` / `execve()` / `wait()` | Create a process / replace a program / wait for it to finish (see the chapter on process management) |
| `pipe()` | Create a communication pipe between two processes (see the chapter on shell architecture) |
| `dup2()` | Pointing a descriptor to another resource that is already open |
| `mmap()` / `brk()` | Request memory from the system (used internally by `malloc()`; see the chapter on memory management) |

## Report an error: `errno`

Most system calls signal a failure by returning `-1` (or `NULL` for those that return a pointer), and by setting the global variable `errno` to a code describing the specific cause—the same principle as the historical C functions discussed in the chapter on functions (PHP’s `@` follows the same kind of “C-style” error convention):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("fichier_inexistant.txt", O_RDONLY);

if (fd == -1) {
    printf("Erreur : %s\n", strerror(errno)); // traduit le code errno en message lisible
}
```

## The file descriptor: a simple entry in a table

A **file*** ***descriptor** is neither a pointer nor a path: it is simply an integer—the index of a table maintained by the kernel **for each process**, associating that integer with an actually open resource (file, pipe, network connection, terminal, etc.).

Every process starts with three descriptors that are already open:

| Descriptor | C Constant | Typical Role |
|---|---|---|
| `0` | `STDIN_FILENO` | Standard entry |
| `1` | `STDOUT_FILENO` | Standard Output |
| `2` | `STDERR_FILENO` | Error Output |

```c
int fd = open("fichier.txt", O_RDONLY); // renvoie par ex. 3 : le prochain emplacement libre de CE processus
read(fd, tampon, taille);
close(fd);
```

> **Note:** These three numbers (`0` / `1` / `2`) are exactly the "streams" (*stdin/stdout/stderr*) mentioned in the chapter on Bash redirection—a redirection such as `2>` does nothing more, behind the scenes, than manipulate the process's descriptor number `2`.

## `dup2()` : Make a descriptor point to another resource

`dup2(source, target)` Makes descriptor number `target` point to the same open resource as `source`, while closing whatever `target` previously pointed to:

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // désormais, écrire sur "stdout" (1) écrit en réalité dans "sortie.txt"
close(fd); // l'original peut être fermé : la cible (1) reste valide, pointant vers la même ressource
```

This is exactly the mechanism that the chapter on shell architecture uses to implement both redirection (`>`, `<`) and pipes (`|`)—in both cases, a standard descriptor (`0`, `1`, `2`) is redirected to a different resource just before the target program is executed.

## Why does `fork()` also duplicate the descriptor table?

When `fork()` (see the chapter on process management) creates a child process, the child receives a **copy** of its parent’s descriptor table—the same numbers, pointing to the same open resources. This is precisely what allows a shell to perform a `dup2()` on a pipe descriptor **in the child process**, just before calling `execve()`: the new program inherits this descriptor, which has already been repointed, without knowing anything about the mechanism that set it up.
