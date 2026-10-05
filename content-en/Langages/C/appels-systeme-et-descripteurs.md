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
    // translates the errno code into a readable message
    printf("Error: %s\n", strerror(errno));
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
// + always writes at the END, without overwriting
open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
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
// from now on, writing to "stdout" (1) actually writes into "output.txt"
dup2(fd, STDOUT_FILENO);
// the original can be closed: the target (1) remains valid, pointing to the same resource
close(fd);
```

This is exactly the mechanism that the chapter on shell architecture uses to implement both redirection (`>`, `<`) and pipes (`|`): in both cases, a standard descriptor (`0`, `1`, `2`) is redirected to a different resource just before the target program is executed.

## Why does `fork()` also duplicate the descriptor table?

When [`fork()`](/?c=langages-de-programmation&s=c&p=processus) creates a child process, the child receives a **copy** of its parent’s descriptor table: the same numbers, pointing to the same open resources. This is precisely what allows a shell to perform a `dup2()` on a pipe descriptor **in the child process**, just before calling `execve()`: the new program inherits this descriptor, which has already been repointed, without knowing anything about the mechanism that set it up.

## Special files: when `open()` does not land on an ordinary file

On Unix (Linux, macOS), `open()` accepts anything that has a path, not only data files stored on disk (**ordinary** files). The type of what was actually opened is read with `fstat()`, which fills a `struct stat` describing the descriptor (type, size, permissions):

| Type | Test on `info.st_mode` | Example | Behavior of `read()` |
|---|---|---|---|
| Ordinary file | `S_ISREG` | `notes.txt` | Reads the content, then `0` at the end |
| Directory | `S_ISDIR` | `/tmp` | Fails (`EISDIR`) |
| “Character” device | `S_ISCHR` | `/dev/zero`: supplies null bytes **endlessly** | Never returns `0`: the read never ends |
| Named pipe (FIFO) | `S_ISFIFO` | `canal` created by `mkfifo` | Waits for another process to write |

### The named pipe (FIFO)

An anonymous [pipe](/?c=shells&s=bash&p=architecture-dun-shell) (the shell's `|`, or `pipe()` above) has no name: it exists only for the processes that inherited it through `fork()`. A **named pipe** (or **FIFO**, for *First In, First Out*: the order of a [queue](/?c=fondamentaux&s=algorithmes&p=pile-et-file)) is the same mechanism with a name in the file tree, so two unrelated programs can use it. Bytes written on one side come out in the same order on the other, without ever being stored on disk.

```bash
mkfifo canal              # creates the named pipe "canal" (the C function of the same name does the same)
ls -l canal               # the first character is "p" (pipe): prw-r--r-- ...
echo "bonjour" > canal &  # writer started in the background (&): it waits for a reader to show up
cat canal                 # reader: prints "bonjour"; both sides unblock
```

> **Note:** a FIFO cannot be created on any disk. Under WSL (Linux inside Windows), the `/mnt/c` folder fails; use a folder of the Linux system, such as `/tmp`.

### The trap: opening blocks

By default, `open()` on a FIFO is **blocking**: the kernel pauses the program until an event happens (see [blocking and non-blocking I/O](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Opening for reading waits for a writer to open the other end, and vice versa. A program that thinks it is receiving an ordinary file therefore stays frozen with no message at all if it is handed a FIFO. Same effect with `/dev/zero`: reading “until the end of the file” never stops and fills the memory.

| What is passed to the program | Plain `open()` | Result |
|---|---|---|
| `notes.txt` | Returns immediately | Normal read |
| `canal` (FIFO with no writer) | **Blocks forever** | Frozen program |
| `/dev/zero` | Returns immediately | The read never ends, memory saturated |
| `/tmp` (directory) | Returns immediately | `read()` fails later, far from the real cause |

### The remedy: open without blocking, check the type, then switch to `FILE *`

The `O_NONBLOCK` option asks `open()` to return immediately instead of waiting. The type is then checked with `fstat()`, and `fdopen()` converts the validated descriptor into a `FILE *`, the object used by the [file reading](/?c=langages-de-programmation&s=c&p=lecture-de-fichiers) functions (`fgets`, `fread`...):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

FILE *open_regular_file(const char *path)
{
    struct stat info;                                  // receives type, size, permissions
    int         fd;
    FILE       *file;

    fd = open(path, O_RDONLY | O_NONBLOCK);            // never blocks, even on a FIFO
    if (fd == -1) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));   // the real cause
        return (NULL);
    }
    if (fstat(fd, &info) == -1) {                      // queries the already open descriptor
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
        return (NULL);
    }
    if (!S_ISREG(info.st_mode)) {                      // FIFO, /dev/zero, directory: refused
        fprintf(stderr, "%s : not an ordinary file\n", path);
        close(fd);                                   // release the descriptor on every failure
        return (NULL);
    }
    file = fdopen(fd, "r");                            // the FILE * now owns fd
    if (file == NULL) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
    }
    return (file);                                     // close with fclose(), not close()
}
```

Result checked with a small `main` that calls this function on each command-line argument (an ordinary file, a FIFO, `/dev/zero`, a directory and a missing path):

```text
reg.txt : opened
canal : not an ordinary file
/dev/zero : not an ordinary file
. : not an ordinary file
absent : No such file or directory
```

Two details matter. First, `fstat()` is called on the **descriptor** and not `stat()` on the path: between the two calls, someone could replace the file with a FIFO, whereas the descriptor still designates what was really opened. Second, each failure cause has its own message (missing file, wrong type, `fdopen()` failure), so the user knows what to fix.

## Finding the location of your own executable

A program shipped with files of its own (for example the [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), the small programs of a graphics application, stored in a `shaders/` folder next to the executable) must find them wherever it is launched from. Writing `fopen("shaders/basic.vert", "r")` only works if the program is launched **from its own folder**, because a path without a leading `/` is relative to the **current directory** (the folder the terminal is in at launch time, see [`cd` in the architecture of a shell](/?c=shells&s=bash&p=architecture-dun-shell)), not to the executable.

```text
~/project/
├── scop              <- the executable
└── shaders/basic.vert

cd ~/project && ./scop     ->  "shaders/basic.vert" found
cd ~ && project/scop       ->  "shaders/basic.vert" looked up in ~/shaders: not found
```

### Why `argv[0]` is not enough

[`argv[0]`](/?c=langages-de-programmation&s=c&p=argc-et-argv) contains the name **as the user typed it**, not a verified path:

| Launch | `argv[0]` | Problem |
|---|---|---|
| `./scop` | `./scop` | Relative to the current directory, usable as long as it does not change |
| `scop` (found through the [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) variable) | `scop` | No folder in the value: impossible to know where it is |
| `link` (symbolic link to `scop`) | `link` | Designates the link, not the real folder of the executable |
| Launched by `execve()` with an arbitrary `argv[0]` | anything | The calling program chooses this value freely |

### The Linux solution: `/proc/self/exe`

On Linux, `/proc` is a **virtual** folder: none of its files is on the disk, the kernel builds them when read to describe the running processes. `/proc/self` always designates the process that opens it, and `/proc/self/exe` is a **symbolic link** (a special file that only contains a path to another file, like a shortcut) that the kernel points to the real executable of the process, already cleaned of any `./`, `..` and other links. The `readlink()` system call reads the path stored in a symbolic link:

```c
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Writes the executable's folder into dir. Returns 0, or -1 (message already printed).
int get_exe_dir(char *dir, size_t size)
{
    ssize_t len;                                           // signed integer: a byte count, or -1
    char   *slash;

    len = readlink("/proc/self/exe", dir, size - 1);      // copies the path, without a final '\0'
    if (len == -1) {
        fprintf(stderr, "/proc/self/exe: %s\n", strerror(errno));   // /proc missing?
        return (-1);
    }
    if ((size_t)len == size - 1) {                         // buffer full: path possibly cut
        fprintf(stderr, "executable path too long for %zu bytes\n", size);
        return (-1);
    }
    dir[len] = '\0';                                       // readlink() never terminates the string
    slash = strrchr(dir, '/');                             // last '/': separates folder and name
    if (slash == dir)                                      // executable at the root: "/scop"
        slash++;                                           // keep the "/" itself
    *slash = '\0';                                         // cuts off the file name
    return (0);
}
```

The **buffer** is the memory area reserved to receive the result, here the `dir` array, whose size in bytes is given by `size` (see [the doubling buffer](/?c=langages-de-programmation&s=c&p=memoire)). The function is used to build the path of a file shipped with the program:

```c
char dir[4096];                                            // 4096: maximum path length on Linux
char path[4200];                                           // large enough for dir + "/shaders/basic.vert"

if (get_exe_dir(dir, sizeof dir) == -1)                    // sizeof dir: size of the array, 4096 bytes
    return (1);
// snprintf() writes into path and stops at sizeof path bytes, so it never overflows
snprintf(path, sizeof path, "%s/shaders/basic.vert", dir);
```

Result checked on Linux with a small `main` that prints `argv[0]` and the folder found, launched four ways:

```text
(launched from /)       /tmp/exetest/where  ->  folder = /tmp/exetest
(through link /tmp/lien) argv[0] = /tmp/lien ->  folder = /tmp/exetest
(through PATH)          argv[0] = where     ->  folder = /tmp/exetest
(without /proc)         /proc/self/exe : No such file or directory
```

Only the last case fails, with a message naming the real cause: we know what to fix instead of seeing `fopen()` fail later on an invented path.

### The pitfalls

| Pitfall | Why | Remedy |
|---|---|---|
| Forgetting the `'\0'` after `readlink()` | It copies the path characters without terminating the string: the rest of the buffer is read as text | Set `dir[len] = '\0'` yourself |
| Passing `sizeof dir` to `readlink()` instead of `sizeof dir - 1` | No room is left for the `'\0'` | Reserve one byte |
| Path longer than the buffer | `readlink()` **truncates silently** and returns the buffer size | Reject a result that fills the whole buffer |
| Executable deleted while running | Linux appends ` (deleted)` to the end of the path read | Rare; check that the file exists before using it |
| `/proc` missing (minimal system, some containers or isolated environments) | The link does not exist | Explicit message, or a path given by the user (environment variable, option) |
| System other than Linux | `/proc/self/exe` is specific to Linux | See the table below |

| System | Way to find your own executable |
|---|---|
| Linux | `readlink("/proc/self/exe", ...)` |
| macOS | `_NSGetExecutablePath()` (declared in `<mach-o/dyld.h>`) |
| Windows | `GetModuleFileNameA()` |
| FreeBSD | `sysctl` with `KERN_PROC_PATHNAME` |

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A system call asks the kernel to act on the program's behalf (files, processes, network): a controlled shift from user space to kernel space. A file descriptor is a simple integer, the index of a per-process table. A path is not always an ordinary file: FIFOs, devices and directories can be opened too. To find files shipped with the program, start from the real location of the executable (`/proc/self/exe` on Linux), never from the current directory or `argv[0]`. |
| **Available Tools** | `open`/`close`/`read`/`write`, `open()`'s `O_CREAT`/`O_TRUNC`/`O_APPEND`/`O_NONBLOCK` flags, `dup2`, `errno`/`strerror` to diagnose a failure, `mkfifo`, `fstat` + `S_ISREG`, `fdopen`, `readlink`. |
| **Pitfalls to Avoid** | Confusing a library function (`printf`) with an actual system call (`write`): the former wraps the latter. Opening a user-supplied path unchecked: a FIFO freezes the program, `/dev/zero` saturates the memory. Using the result of `readlink()` without setting the final `'\0'`. |
| **Best Practices** | Always check the return value of a system call (`-1` or `NULL`) and consult `errno`/`strerror()` to diagnose a failure. Open with `O_NONBLOCK`, check with `fstat()` + `S_ISREG()`, then `fdopen()`. |
