---
order: 20
---

# System Calls and File Descriptors

A program cannot read a file, create a process, or send data over the network by directly manipulating the hardware: this could be disastrous for the system's stability and security if any program had unrestricted access to it. Instead, it must go through a narrow, controlled gateway: the **system call** (*syscall*). This chapter explains this mechanism and the **file descriptor**, the “handle” that the kernel returns in exchange, both of which are used constantly whenever you interact with files, processes, or pipes (see [Process management](/?c=langages-de-programmation&s=c&p=processus), [Threads](/?c=langages-de-programmation&s=c&p=threads), and [How a shell works](/?c=shells&s=bash&p=architecture-dun-shell)).

## User Space vs. Kernel Space

```text
Program (user space)
      |
      | system call: open(), read(), write(), fork(), pipe()...
      v
Operating system kernel (kernel space)
      |
      v
Hardware (disk, network, physical memory...)
```

A standard C function call (`addition(2, 3)`) executes entirely in **user** space, without ever leaving the program. A system call is different: it explicitly asks the **kernel** to act on the program’s behalf for an operation that the program is not permitted to perform itself. This request involves a controlled change in execution mode (*user mode* → *kernel mode*), verified by the processor: it is this verification that prevents a malicious or buggy program from directly accessing another program’s memory or disk.

> **Note:** A function such as `printf()` is not itself a system call: it is a library function that formats the string in user space and then internally calls the actual system call (`write()`) to send it to standard output.

## Some Common System Calls

| System Call | Role |
|---|---|
| `open()` / `close()` | Open / close a file |
| `read()` / `write()` | Read/write bytes on a descriptor |
| `fork()` / `execve()` / `wait()` | Create a process / replace a program / wait for it to finish (see [Process management](/?c=langages-de-programmation&s=c&p=processus)) |
| `pipe()` | Create a communication pipe between two processes (see [How a shell works](/?c=shells&s=bash&p=architecture-dun-shell)) |
| `dup2()` | Point a descriptor to another resource that is already open |
| `mmap()` / `brk()` | Request memory from the system (used internally by `malloc()`; see [Memory management](/?c=langages-de-programmation&s=c&p=memoire)) |

## Report an error: `errno`

Most system calls signal a failure by returning `-1` (or `NULL` for those that return a pointer), and by setting the global variable `errno` to a code describing the specific cause: the same principle as the historical C functions discussed in the chapter on functions ([PHP](/?c=langages-de-programmation&s=php&p=php)’s `@` follows the same kind of “C-style” error convention):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("missing_file.txt", O_RDONLY);

if (fd == -1) {
    printf("Error: %s\n", strerror(errno)); // translates the errno code into a readable message
}
```

## The file descriptor: a simple entry in a table

A **file descriptor** is neither a pointer nor a path: it is simply an integer, the index of a table maintained by the kernel **for each process**, associating that integer with an actually open resource (file, pipe, network connection, terminal, etc.).

Every process starts with three descriptors that are already open:

| Descriptor | C Constant | Typical Role |
|---|---|---|
| `0` | `STDIN_FILENO` | Standard input |
| `1` | `STDOUT_FILENO` | Standard output |
| `2` | `STDERR_FILENO` | Standard error |

```c
int fd = open("file.txt", O_RDONLY); // returns e.g. 3: the next free slot for THIS process
read(fd, buffer, size);
close(fd);
```

> **Note:** These three numbers (`0` / `1` / `2`) are exactly the "streams" (*stdin/stdout/stderr*) mentioned in the chapter on [Bash](/?c=shells&s=bash&p=bash) redirection: a redirection such as `2>` does nothing more, behind the scenes, than manipulate the process's descriptor number `2`.

## `open()`'s Opening Flags

```c
open(path, O_RDONLY);                            // read only
open(path, O_WRONLY);                            // write only
open(path, O_RDWR);                              // read AND write

open(path, O_WRONLY | O_CREAT, 0644);            // creates the file if it doesn't exist yet
open(path, O_WRONLY | O_CREAT | O_TRUNC, 0644);  // + empties the file if it already existed
open(path, O_WRONLY | O_CREAT | O_APPEND, 0644); // + always writes at the END, without overwriting
```

| Flag | Effect |
|---|---|
| `O_RDONLY`/`O_WRONLY`/`O_RDWR` | Access mode (only one of the three, mutually exclusive) |
| `O_CREAT` | Creates the file if it doesn't exist yet (otherwise `open()` fails on a missing file) |
| `O_TRUNC` | Empties the existing file before writing (otherwise the old content would remain past the write position) |
| `O_APPEND` | Always positions writes at the end of the file, never at the point reached by a previous `write()` |

These flags combine with `|` (bitwise OR, see [Bitwise Operators](/?c=langages-de-programmation&s=c&p=operateurs-binaires)): each occupies a distinct bit of the same integer, so `O_CREAT` and `O_TRUNC` can be requested together without excluding each other.

> **Note:** the last argument (`0644` above) sets the file's **permissions**, but only if `O_CREAT` actually creates it (an already-existing file keeps its current permissions, this argument is then ignored): see [Permissions and Files](/?c=shells&s=bash&p=permissions-et-fichiers) for what this octal mode means.

## `dup2()`: Make a descriptor point to another resource

`dup2(source, target)` makes descriptor number `target` point to the same open resource as `source`, while closing whatever `target` previously pointed to:

```c
int fd = open("output.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO);  // from now on, writing to "stdout" (1) actually writes into "output.txt"
close(fd);                // the original can be closed: the target (1) remains valid, pointing to the same resource
```

This is exactly the mechanism that the chapter on shell architecture uses to implement both redirection (`>`, `<`) and pipes (`|`): in both cases, a standard descriptor (`0`, `1`, `2`) is redirected to a different resource just before the target program is executed.

## Why does `fork()` also duplicate the descriptor table?

When [`fork()`](/?c=langages-de-programmation&s=c&p=processus) creates a child process, the child receives a **copy** of its parent’s descriptor table: the same numbers, pointing to the same open resources. This is precisely what allows a shell to perform a `dup2()` on a pipe descriptor **in the child process**, just before calling `execve()`: the new program inherits this descriptor, which has already been repointed, without knowing anything about the mechanism that set it up.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A system call asks the kernel to act on the program's behalf (files, processes, network): a controlled shift from user space to kernel space. A file descriptor is a simple integer, the index of a per-process table. |
| **Available Tools** | `open`/`close`/`read`/`write`, `open()`'s `O_CREAT`/`O_TRUNC`/`O_APPEND` flags, `dup2`, `errno`/`strerror` to diagnose a failure. |
| **Pitfalls to Avoid** | Confusing a library function (`printf`) with an actual system call (`write`): the former wraps the latter. |
| **Best Practices** | Always check the return value of a system call (`-1` or `NULL`) and consult `errno`/`strerror()` to diagnose a failure. |
