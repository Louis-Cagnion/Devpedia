---
order: 29
---

# Interrupted system call (EINTR)

A **system call** is a request made to the kernel (the core of the operating system) for an operation that the program is not allowed to perform itself: reading a file, waiting for a child process, putting the program to sleep (see [system calls and descriptors](/?c=langages&s=c&p=appels-systeme-et-descripteurs)). Some of these calls are **blocking**: they return control only once what they are waiting for has arrived, which can take seconds, or even forever. What happens if, while waiting, a **signal** arrives (a notification sent to a process by the system or by another process, see [UNIX signals](/?c=langages&s=c&p=signaux-unix))? The call returns, reporting a failure that is not one: `EINTR`. This chapter explains what this means, how to protect yourself from it, and why the functions of `<stdio.h>` do not solve the problem for you.

It assumes you already know signals and their [handler](/?c=langages&s=c&p=signaux-unix) (the function the kernel calls when the signal arrives), [`signal()` and `sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-an-enriched-handler-with-siginfo-t), [`errno`](/?c=langages&s=c&p=appels-systeme-et-descripteurs#report-an-error-errno) (the variable where the call stores the code of its failure) and the [file descriptor](/?c=langages&s=c&p=appels-systeme-et-descripteurs#the-file-descriptor-a-simple-entry-in-a-table) (an integer that designates an open resource: a file, a pipe, a terminal...). All observations were made under Linux with the GNU project's C library (**glibc**, the standard library of the C language shipped with most Linux distributions).

## The setting: a call that waits

Here are some calls that can wait a long time.

| Call | What it waits for |
|---|---|
| `read` | Bytes to read from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), a pipe (defined below) or a network connection |
| `write` | Room in a pipe or a connection whose **buffer** (the waiting memory area) is full |
| `accept` | A client (a program that requests a service) to connect to a server (a program that offers it, see [sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)) |
| `waitpid` | A child process to terminate (see [process management](/?c=langages&s=c&p=processus)) |
| `sem_wait` | A semaphore (a counter that regulates access to a resource) to become positive (see [semaphores](/?c=langages&s=c&p=semaphores)) |
| `nanosleep` | A duration to elapse |
| `poll`, `select` | At least one descriptor to be ready, or a timeout to expire |

A **pipe** is a one-way channel: whatever one process writes at one end, another process reads at the other end. This is what the shell's `|` creates (see [the architecture of a shell](/?c=langages&s=bash&p=architecture-dun-shell)). If a handler is installed for a signal and that signal arrives during the wait, the kernel interrupts the wait, runs the handler, then the call returns with `-1` and `errno` equal to `EINTR` (short for *interrupted*).

```text
Time ----------------------------------------------------------------->

program   :  read() ........ waits ........ [handler] ... read() returns -1
                                   ^                              errno = EINTR
kernel    :                        |
                          the signal arrives (here SIGALRM)
```

Nothing failed: the call simply could not run to completion. The data was not lost, the call just needs to be retried. But everything depends on what the program installed for the signal:

| State of the signal | What happens to the blocked call |
|---|---|
| Default behavior that kills the process (`SIGALRM`, `SIGTERM`...) | The process dies, there is no call left to interrupt |
| Signal ignored (`SIG_IGN`) | Nothing happens, the call keeps waiting |
| Handler installed, without `SA_RESTART` | The call returns with `-1` and `EINTR` |
| Handler installed, with `SA_RESTART` | The kernel restarts the call on its own (for most calls) |

To trigger the interruption without typing anything, the programs of this chapter use `alarm(1)`: the kernel will send the `SIGALRM` signal to the process in 1 second. They are launched with `(sleep 3; echo bonjour) | ./program`: the shell runs `sleep 3` (which waits 3 seconds), then `echo bonjour` writes "bonjour" into a pipe whose other end `./program` reads. The program therefore waits for 3 seconds, and the alarm rings after only one. They also use a few setup functions:

| Element | Role |
|---|---|
| `struct sigaction sa` | Structure describing what we want for a signal (handler, flags...) |
| `memset(&sa, 0, sizeof sa)` | Sets all the bytes of `sa` to zero, so that no random values are inherited |
| `sigemptyset(&sa.sa_mask)` | Prepares an empty list of signals to block during the handler |
| `sigaction(SIGALRM, &sa, NULL)` | Installs this description for `SIGALRM` |
| `alarm(1)` | Asks the kernel to send `SIGALRM` in 1 second ([`alarm`](https://man7.org/linux/man-pages/man2/alarm.2.html)) |
| `ssize_t` | Signed integer for a number of bytes: it can hold `-1` (`size_t` is its unsigned counterpart; `printf` displays them with `%zd` and `%zu`) |
| `strerror(errno)` | Translates the error code `errno` into readable text |

## The trap: taking EINTR for a real error

A program used to testing "`-1` means error" gets it wrong here (`stderr` is the program's error output, descriptor 2):

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void on_alarm(int sig)
{
    (void)sig;                          // we only care that it gets called
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[64];        // memory area that will receive the bytes read
    ssize_t          n;                 // bytes read, or -1 if the call failed

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // installs the handler, without SA_RESTART
    alarm(1);                           // SIGALRM will arrive in 1 second
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // waits on standard input
    if (n == -1) {                      // -1: the call did not succeed
        fprintf(stderr, "read: %s\n", strerror(errno));   // translates errno into text
        return 1;                       // the program wrongly gives up
    }
    printf("read %zd bytes\n", n);      // normal path: bytes arrived
    return 0;
}
```

```text
read: Interrupted system call
```

The program complains and quits, although the pipe was about to receive "bonjour" two seconds later. The classic remedy is a **retry loop**: as long as the call fails because of an interruption, we call it again.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void on_alarm(int sig)
{
    (void)sig;                          // nothing to do: the interruption is enough
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[64];        // memory area that will receive the bytes read
    ssize_t          n;                 // bytes read, or -1 if the call failed
    int              retries = 0;       // number of times read had to be retried

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // installs the handler, without SA_RESTART
    alarm(1);                           // SIGALRM will arrive in 1 second
    do {
        n = read(STDIN_FILENO, buffer, sizeof buffer);   // waits for data
        if (n == -1 && errno == EINTR)  // interrupted by the signal, not a real error
            retries++;                  // we count the interruption
    } while (n == -1 && errno == EINTR);   // and we retry the call
    if (n == -1) {                      // here, it is a real error (closed descriptor...)
        fprintf(stderr, "read: %s\n", strerror(errno));   // translates errno into text
        return 1;                       // justified give-up
    }
    printf("read %zd bytes after %d retry(s)\n", n, retries);   // final result
    return 0;
}
```

```text
read 8 bytes after 1 retry(s)
```

A bare `-1` says nothing: it is `errno` that tells the causes apart. Only `EINTR` is retried.

| Value of `errno` after `-1` | Meaning | Reaction |
|---|---|---|
| `EINTR` | Interrupted by a signal handler | Retry the call |
| `EBADF` | The descriptor is not open | Program bug: fix it |
| `EIO` | Hardware input/output error | Report it and give up |

> **Pitfall:** retrying on any `-1`. A real error (`EBADF`) would then make the loop spin forever, at full speed.

## `SA_RESTART`: asking the kernel to restart

A **flag** is an option represented by one bit of an integer, which is combined with the others using the bitwise OR `|` (see [bitwise operators](/?c=langages&s=c&p=operateurs-binaires)). `sigaction()` accepts the flag `SA_RESTART` in `sa_flags` (from the English word *restart*): it asks the kernel to restart by itself the calls interrupted by this signal. The handler still runs, but the program no longer sees any `EINTR`.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_alarms = 0;   // counter modified by the handler

static void on_alarm(int sig)
{
    (void)sig;                          // we do not use the signal number
    g_alarms++;                         // only action: count the arrivals
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[64];        // memory area that will receive the bytes read
    ssize_t          n;                 // bytes read, or -1 if the call failed

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sa.sa_flags = SA_RESTART;           // asks the kernel to restart read on its own
    sigaction(SIGALRM, &sa, NULL);      // installs the handler
    alarm(1);                           // SIGALRM will arrive in 1 second
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // just once, no loop
    if (n == -1) {                      // no more EINTR here
        fprintf(stderr, "read: %s\n", strerror(errno));   // translates errno into text
        return 1;
    }
    printf("read %zd bytes, handler called %d time(s)\n", n, (int)g_alarms);
    return 0;
}
```

```text
read 8 bytes, handler called 1 time(s)
```

The handler ran once (the counter proves it), and `read` waited for "bonjour" without the program needing a loop. The `volatile sig_atomic_t` type of the counter is explained in [writing a safe handler](/?c=langages&s=c&p=signaux-unix#writing-a-safe-handler).

### `signal()` versus `sigaction()`

Both install a handler, but only `sigaction()` states explicitly what we want (see [`sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-an-enriched-handler-with-siginfo-t)).

| | `signal()` | `sigaction()` |
|---|---|---|
| Restarting calls | Unspecified: depends on the system | Explicit: presence or absence of `SA_RESTART` |
| With glibc (observed) | Automatic restart: `read` is not interrupted | Depends on the requested flag |
| Portability of behavior | Weak: the same code may behave differently elsewhere | Good |
| Preferred choice | Never for a handler that matters | Always |

### The limits of `SA_RESTART`

`SA_RESTART` does not cover every call. The manual page [`signal(7)`](https://man7.org/linux/man-pages/man7/signal.7.html) lists those that always fail with `EINTR`, even with the flag, and those that are restarted. The table below crosses this list with what was observed here by a test program for each call, with a `SIGALRM` handler.

| Call | Without `SA_RESTART` | With `SA_RESTART` | Remark |
|---|---|---|---|
| `read` (pipe, terminal) | `-1`, `EINTR` | Restarted | Most common case |
| `write` (full pipe) | `-1`, `EINTR` | Restarted | See the partial write below |
| `waitpid` | `-1`, `EINTR` | Restarted | Waiting for a child |
| `sem_wait` | `-1`, `EINTR` | Restarted (observed) | May vary from one system to another |
| `nanosleep` | `-1`, `EINTR` | `-1`, `EINTR` | Never restarted |
| `sleep` | Returns the time left | Same | Never restarted |
| `poll`, `select` | `-1`, `EINTR` | `-1`, `EINTR` | Never restarted |
| `close` | See below | See below | Never restarted |

Consequence: even with `SA_RESTART`, the retry loop must be kept for `nanosleep`, `poll` and `select`. For a wait of fixed duration, `nanosleep` takes a second argument that receives the remaining time: we retry with that remainder, not with the original duration (for other ways of waiting, see [time measurement](/?c=langages&s=c&p=mesure-du-temps)).

Another effect to know: with `SA_RESTART`, the program is no longer alerted by `EINTR`. A `SIGINT` handler (Ctrl-C) that raises a stop indicator has no effect as long as the blocked `read` is silently restarted. For a signal to really wake the program, do not set `SA_RESTART`, and test an **indicator** (a variable that stays 0 as long as nothing has happened, and becomes 1 afterwards) on each `EINTR`:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_stop = 0;    // becomes 1 when a stop is requested

static void on_signal(int sig)
{
    (void)sig;                          // we do not use the signal number
    g_stop = 1;                         // only action: raise the indicator
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[64];        // memory area that will receive the bytes read
    ssize_t          n = -1;            // bytes read, or -1

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_signal;          // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // no SA_RESTART: read will be interrupted
    alarm(1);                           // simulates the stop request (here a SIGALRM)
    while (!g_stop) {                   // retry as long as nobody has requested a stop
        n = read(STDIN_FILENO, buffer, sizeof buffer);   // waits for data
        if (n == -1 && errno == EINTR)  // interrupted: go back and test the indicator
            continue;
        break;                          // data, end of input or real error: we leave
    }
    if (g_stop)                         // the interruption became a stop request
        printf("stop requested, exiting cleanly\n");
    else
        printf("read %zd bytes\n", n);
    return 0;
}
```

```text
stop requested, exiting cleanly
```

Here `EINTR` is useful: it is the only way to get out of a `read` that has nothing to read.

## The edge cases that catch you out

### A partial read or write does not return `-1`

If the signal arrives **after** a call has already transferred part of the bytes, it does not return `-1`: it returns the number of bytes already transferred. This is a **partial read** (or **partial write**): fewer bytes than requested, without this being an error. The following program writes 200,000 bytes into a pipe that nobody reads; the capacity of a pipe under Linux is 65,536 bytes by default:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void on_alarm(int sig)
{
    (void)sig;                          // the interruption is the only intended effect
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    static char      big[200000];       // 200,000 bytes: more than the capacity of a pipe
    int              pipe_fds[2];       // pipe_fds[0]: read end, pipe_fds[1]: write end
    ssize_t          n;                 // bytes written, or -1

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // no SA_RESTART: write will be interrupted
    if (pipe(pipe_fds) == -1)           // creates a pipe that nobody reads
        return 1;
    memset(big, 'x', sizeof big);       // fills the area with 'x'
    alarm(1);                           // SIGALRM will arrive when the pipe is full
    n = write(pipe_fds[1], big, sizeof big);   // blocks as soon as the pipe is full
    printf("write of %zu bytes: returns %zd\n", sizeof big, n);
    return 0;
}
```

```text
write of 200000 bytes: returns 65536
```

| What happened before the signal | `write` / `read` returns | `errno` |
|---|---|---|
| No byte transferred | `-1` | `EINTR` |
| Part of the bytes transferred | The number already transferred (less than requested) | Meaningless: do not read it |
| Everything transferred | The amount requested | Meaningless |

The trap: after a partial `read`, retrying with the **same** buffer would overwrite the first bytes. You must advance into the buffer by the number of bytes already received. This is the job of `read_all` below.

### `close()` returns `EINTR`: do not retry

[POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html) (the standard describing the interface of Unix-like systems) specifies that an interrupted `close()` returns `-1` with `EINTR`, and that the state of the descriptor is then **indeterminate**: it may be closed or still open, depending on the system. The Linux manual specifies that the descriptor is already released in that case, and that a second `close()` on that number could close a descriptor opened in the meantime by another [thread](/?c=langages&s=c&p=threads) (an execution thread of the same program). Prudent rule: never retry `close()`.

```c
if (close(fd) == -1) {                  // closing reported a problem
    if (errno != EINTR)                 // EINTR: above all, do not call close again
        fprintf(stderr, "close: %s\n", strerror(errno));   // any other cause: report it
}
```

### `EINTR` exists only if a handler is installed

A signal that is ignored, or left at its default behavior, never produces `EINTR`: the first is discarded by the kernel, the second kills the process (or is ignored, depending on the signal).

The program reads a command-line argument (see [`argc` and `argv`](/?c=langages&s=c&p=argc-et-argv)) to choose between the two cases:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    char    buffer[64];                 // memory area that will receive the bytes read
    ssize_t n;                          // bytes read, or -1 if the call failed

    if (argc > 1 && strcmp(argv[1], "ignore") == 0)   // argument "ignore"
        signal(SIGALRM, SIG_IGN);       // SIG_IGN: the kernel discards the signal
    alarm(1);                           // no argument: the signal's default behavior
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // waits for data
    if (n == -1)                        // no handler: no EINTR
        printf("read: %s\n", strerror(errno));
    else
        printf("read %zd bytes\n", n);
    return 0;
}
```

| Launch (with the same slow pipe as above) | Observed output |
|---|---|
| `./ignore ignore` | `read 8 bytes`: the alarm is discarded, and `read` keeps waiting until the end |
| `./ignore` | No output: the process dies. The exit status is 142: the shell encodes "killed by a signal" as 128 plus the signal number, here 14 for `SIGALRM` |

## `fread` and `fgets`: does the standard library do the work?

`fread` and `fgets` (see [file reading](/?c=langages&s=c&p=lecture-de-fichiers)) belong to `<stdio.h>`, the standard input-output library of C. They read through a `FILE *` (a **stream**, an object that groups together a descriptor and a memory buffer). `fread(buffer, 1, n, stream)` reads up to `n` bytes; on failure or at the end, it returns less than requested, and we query `ferror(stream)` (1 if the stream is in error) and `feof(stream)` (1 if the end of the data is reached). Under the hood, they call `read`. One might think this layer hides the interruption. Test with an `fread` on standard input, a `SIGALRM` handler without `SA_RESTART`, and an alarm that rings during the wait:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void on_alarm(int sig)
{
    (void)sig;                          // we only care that it gets called
}

int main(int argc, char **argv)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[64];        // memory area that will receive the bytes read
    size_t           n;                 // number of elements read by fread

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    if (argc > 1 && strcmp(argv[1], "restart") == 0)   // "restart" enables SA_RESTART
        sa.sa_flags = SA_RESTART;       // the kernel will restart read on its own
    sigaction(SIGALRM, &sa, NULL);      // installs the handler
    alarm(1);                           // SIGALRM will arrive in 1 second
    errno = 0;                          // start from a clean errno so the result is visible
    n = fread(buffer, 1, sizeof buffer, stdin);   // asks for 64 bytes from standard input
    printf("fread=%zu ferror=%d feof=%d errno=%d (%s)\n",
           n,                           // bytes actually returned
           ferror(stdin) != 0,          // 1 if the stream's error flag is set
           feof(stdin) != 0,            // 1 if the end of the stream is reached
           errno,                       // 4 is EINTR on Linux
           strerror(errno));            // the matching text
    return 0;
}
```

```text
$ (sleep 3; echo bonjour) | ./stdio
fread=0 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (printf abc; sleep 3; echo def) | ./stdio
fread=3 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (sleep 3; echo bonjour) | ./stdio restart
fread=8 ferror=0 feof=1 errno=0 (Success)
```

Observation: `fread` **does not retry**. It stops, returns what it already had (0 or 3 bytes), raises the stream's error flag and leaves `errno` at `EINTR` (value 4 on Linux). The same test with `fgets` returns `NULL` with `ferror` at 1 and `errno` at 4. With `SA_RESTART`, everything works, but only because it is the kernel that restarts the underlying `read`, not `fread`.

The C language standard says nothing about `EINTR`, and POSIX allows these functions to fail with `EINTR` ([`fread`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fread.html)). The behavior observed here is therefore not a guarantee: another system could decide otherwise. For a portable program, you must retry yourself. The function `clearerr(stream)` clears the stream's error flag and its end-of-stream flag, which makes it possible to try again:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Like fread, but retries if the underlying system call is interrupted.
size_t read_stream(void *buffer, size_t size, FILE *stream)
{
    char    *bytes = buffer;            // byte-by-byte view of the area to fill
    size_t   total = 0;                 // bytes already received

    while (total < size) {              // while some are missing
        total += fread(bytes + total, 1, size - total, stream);   // reads the rest
        if (total == size || feof(stream))   // done, or end of stream
            break;
        if (ferror(stream) && errno == EINTR)   // interruption, not a real failure
            clearerr(stream);           // clears the error flag, then retries
        else
            break;                      // real error: we stop
    }
    return total;
}

static void on_alarm(int sig)
{
    (void)sig;                          // the interruption is the only intended effect
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    char             buffer[8];         // area that will receive the bytes read
    size_t           n;                 // bytes returned by read_stream

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // no SA_RESTART: read will be interrupted
    alarm(1);                           // SIGALRM will fall during the wait
    n = read_stream(buffer, 7, stdin);  // wants 7 bytes: "abc" arrives before the alarm
    printf("read %zu bytes: %.*s\n", n, (int)n, buffer);
    return 0;
}
```

```text
$ (printf abc; sleep 3; printf defg) | ./read_stream
read 7 bytes: abcdefg
```

Two details matter. First, `clearerr`: without it, the error flag would stay raised and every following call would fail immediately. Then, `errno` must only be read after a failure has been confirmed (`ferror`): a successful call does not reset it, so it can still hold `EINTR` because of an earlier interruption.

## What does each layer do?

| Layer | Reaction to a caught signal | What the program must do |
|---|---|---|
| Raw system call (`read`, `write`) | `-1` and `EINTR` if nothing was transferred, otherwise the number of bytes already transferred | Retry loop, and advance in the buffer |
| Function of `<stdio.h>` (`fread`, `fgets`) | Observed: stops, error flag raised, `errno` at `EINTR` | `clearerr` then retry, or `SA_RESTART` |
| `SA_RESTART` | The kernel restarts the calls that allow it | Keep a loop for `nanosleep`, `poll`, `select` |
| Retry loop | Absorbs `EINTR` | Test the stop indicator on each pass if the signal must wake the program |

## A reusable function: `read_all`

`read_all(fd, buffer, size)` combines the two protections: it retries on `EINTR` and handles partial reads by advancing in the buffer. It stops at `size` bytes, or earlier if the other end closes (`read` then returns `0`). The `main` simulates a slow writer with a few functions already seen in the chapter on [processes](/?c=langages&s=c&p=processus):

| Function | Role here |
|---|---|
| `pipe(pipe_fds)` | Creates a pipe: `pipe_fds[0]` is the read end, `pipe_fds[1]` the write end |
| `fork()` | Duplicates the process; the child receives `0`, the parent receives the child's identifier |
| `sleep(2)` | Puts the process to sleep for 2 seconds |
| `_exit(0)` | Ends the process immediately, without flushing the `printf` buffers |
| `close(pipe_fds[1])` | Closes one end of the pipe: without this, the reader would never see the end of the data |

The scenario: three bytes right away, a 2-second pause during which the alarm rings, then five bytes.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

// Reads exactly size bytes, unless the end of the data arrives first.
// Returns the number of bytes read (0 if none), or -1 on a real error.
ssize_t read_all(int fd, void *buffer, size_t size)
{
    char    *bytes = buffer;            // byte-by-byte view of the area to fill
    size_t   total = 0;                 // bytes already received
    ssize_t  n;                         // result of the last read

    while (total < size) {              // while some are missing
        n = read(fd, bytes + total, size - total);   // reads the rest, not from the start
        if (n == -1 && errno == EINTR)  // interrupted by a signal
            continue;                   // retry without losing anything
        if (n == -1)                    // real error
            return -1;                  // errno gives the cause, the caller decides
        if (n == 0)                     // end of data: the other end closed
            break;                      // return what we have
        total += (size_t)n;             // full or partial read: we advance
    }
    return (ssize_t)total;
}

static void on_alarm(int sig)
{
    (void)sig;                          // the interruption is the only intended effect
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    int              pipe_fds[2];       // pipe_fds[0]: read end, pipe_fds[1]: write end
    char             buffer[9];         // 8 bytes expected + 1 for the '\0'
    ssize_t          n;                 // bytes returned by read_all

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // no SA_RESTART: read will be interrupted
    if (pipe(pipe_fds) == -1)           // creates the pipe
        return 1;
    if (fork() == 0) {                  // the child process plays the slow writer
        if (write(pipe_fds[1], "abc", 3) == -1)   // sends 3 bytes right away
            _exit(1);
        sleep(2);                       // then stays silent for 2 seconds
        if (write(pipe_fds[1], "defgh", 5) == -1)   // sends the last 5 bytes
            _exit(1);
        _exit(0);                       // the child is done
    }
    close(pipe_fds[1]);                 // the parent keeps only the read end
    alarm(1);                           // SIGALRM will fall while the child is silent
    n = read_all(pipe_fds[0], buffer, 8);   // wants 8 bytes: 3, then an interruption, then 5
    if (n == -1)
        return 1;
    buffer[n] = '\0';                   // terminates the string so it can be displayed
    printf("read %zd bytes: %s\n", n, buffer);
    return 0;
}
```

```text
read 8 bytes: abcdefgh
```

The first read returns 3 bytes (partial), the second is interrupted (`EINTR`, retried without loss), and the third returns the last 5 bytes. The symmetric version for writing:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

// Writes exactly size bytes. Returns 0 if everything was sent, -1 on a real error.
int write_all(int fd, const void *buffer, size_t size)
{
    const char *bytes = buffer;         // byte-by-byte view of the area to send
    size_t      total = 0;              // bytes already sent
    ssize_t     n;                      // result of the last write

    while (total < size) {              // while some remain
        n = write(fd, bytes + total, size - total);   // sends the rest
        if (n == -1 && errno == EINTR)  // interrupted by a signal
            continue;                   // retry without losing anything
        if (n == -1)                    // real error
            return -1;                  // errno describes the cause
        total += (size_t)n;             // full or partial write: we advance
    }
    return 0;
}

static void on_alarm(int sig)
{
    (void)sig;                          // the interruption is the only intended effect
}

int main(void)
{
    struct sigaction sa;                // description of the behavior wanted for a signal
    static char      big[200000];       // more than the capacity of a pipe
    static char      received[4096];    // small read buffer for the child
    int              pipe_fds[2];       // pipe_fds[0]: read end, pipe_fds[1]: write end
    long             count = 0;         // bytes counted by the child
    ssize_t          n;                 // bytes read by the child

    memset(&sa, 0, sizeof sa);          // sets all the fields of sa to zero
    sa.sa_handler = on_alarm;           // function to call when the signal arrives
    sigemptyset(&sa.sa_mask);           // blocks no other signal
    sigaction(SIGALRM, &sa, NULL);      // no SA_RESTART: write will be interrupted
    if (pipe(pipe_fds) == -1)
        return 1;
    if (fork() == 0) {                  // the child plays the slow reader
        close(pipe_fds[1]);             // it keeps only the read end
        sleep(2);                       // it reads nothing for 2 seconds
        while ((n = read(pipe_fds[0], received, sizeof received)) > 0)  // drains the pipe
            count += n;                 // counting the bytes received
        printf("the child received %ld bytes\n", count);
        exit(0);                        // exit flushes the printf buffers
    }
    close(pipe_fds[0]);                 // the parent keeps only the write end
    memset(big, 'x', sizeof big);       // fills the area with 'x'
    alarm(1);                           // SIGALRM will fall while the pipe is full
    if (write_all(pipe_fds[1], big, sizeof big) == -1)
        return 1;
    close(pipe_fds[1]);                 // the child will see the end of the data
    wait(NULL);                         // waits for the child to finish
    return 0;
}
```

```text
the child received 200000 bytes
```

All 200,000 bytes arrived, despite a partial write of 65,536 bytes interrupted by the alarm. Here the child ends with `exit(0)` and not `_exit(0)`: `exit` flushes the `printf` buffers, otherwise the sentence would never be displayed when the output is a pipe.

## Pitfalls

| Pitfall | Why | Remedy |
|---|---|---|
| Treating any `-1` as a failure | `EINTR` is not a failure | Test `errno == EINTR` |
| Retrying on any `-1` | A real error would loop forever | Retry only on `EINTR` |
| Believing that `fread` or `fgets` retry | Observed: they stop with `ferror` | `clearerr` then retry, or `SA_RESTART` |
| Forgetting `clearerr` before retrying | The stream's error flag stays raised | Call it as soon as you decide to retry |
| Retrying a partial `read` from the start of the buffer | The bytes already received are overwritten | Advance by `total` bytes |
| Retrying `close()` | Descriptor state indeterminate, risk of closing another thread's descriptor | Never retry |
| Relying on `SA_RESTART` for everything | `nanosleep`, `poll`, `select` always fail | Keep the retry loop |
| Retrying blindly when a signal must stop the program | The program becomes impossible to stop cleanly | Test the stop indicator on each `EINTR` |
| Using `signal()` | Restart behavior varies from one system to another | Use `sigaction()` |
| Reading `errno` without a confirmed failure | A successful call does not reset it | Read it only right after a failure |

## Best practices

| Best practice | Why |
|---|---|
| Write `read_all` and `write_all` once and use them everywhere | A single loop to check, instead of one per call |
| Install your handlers with `sigaction()` and a chosen flag | The behavior is identical on all systems |
| Choose: `SA_RESTART` for a purely informative signal, no flag if the signal must wake the program | The program stays in control of what the interruption causes |
| Test the stop indicator (`volatile sig_atomic_t`) on each `EINTR` | The program can still be stopped |
| For `nanosleep`, retry with the remaining time | The total waiting time is respected |
| Never retry `close()` | No guarantee about the descriptor's state |
| Check the return value of every system call and every `<stdio.h>` function | A silent error is paid for later |
| Test the behavior on your own machine (1-second alarm, slow pipe) | The documents say "may", experience says "does" |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A blocking system call interrupted by a signal whose handler is installed returns `-1` with `errno` equal to `EINTR`: nothing failed, you only need to retry (`do { n = read(...); } while (n == -1 && errno == EINTR);`). `SA_RESTART` asks the kernel to restart some calls, but not `nanosleep`, `poll` or `select`. A read or write already under way returns the number of bytes transferred, not `-1`. `close()` is not retried. `EINTR` exists only if a handler is installed. Observed with glibc: `fread` and `fgets` do not retry, they raise `ferror` and leave `errno` at `EINTR`; the C standard says nothing about it and POSIX allows this failure. |
| **Pitfalls to avoid** | Quitting on `EINTR`; retrying on any `-1`; relying on `fread` to retry; forgetting `clearerr`; retrying a partial `read` from the start of the buffer; retrying `close()`; believing `SA_RESTART` covers everything; making the program impossible to stop by retrying blindly. |
| **Best practices** | `sigaction()` with an explicit flag; `read_all` and `write_all` functions that retry and advance in the buffer; `clearerr` then retry for `<stdio.h>`; stop indicator tested on each `EINTR`; never retry `close()`; documentation: [`read`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/read.html), [`close`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html), [`sigaction`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/sigaction.html), [`nanosleep`](https://man7.org/linux/man-pages/man2/nanosleep.2.html). |
