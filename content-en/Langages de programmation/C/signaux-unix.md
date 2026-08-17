---
order: 18
---

# UNIX Signals

A **signal** is an asynchronous notification sent to a process: unlike a regular function call, it can arrive at **any moment** during execution, interrupting the code currently running to execute a dedicated handler before resuming where the process left off. The operating system uses this mechanism to notify a process of an event (Ctrl-C pressed on the keyboard, a child [process](/?c=langages-de-programmation&s=c&p=processus) terminating), or to let one process notify another.

## Common Signals

| Signal | Usual Trigger | Default Behavior |
|---|---|---|
| `SIGINT` | Ctrl-C on the keyboard | Terminates the process |
| `SIGTERM` | Clean shutdown request (`kill <pid>`) | Terminates the process |
| `SIGKILL` | `kill -9 <pid>` | Terminates the process, **cannot be intercepted** |
| `SIGCHLD` | A child process terminates | Ignored by default |
| `SIGUSR1` / `SIGUSR2` | Sent manually by another process (`kill -SIGUSR1 <pid>`) | Terminates the process (but intended to be redefined) |

> **Note:** `SIGKILL` (and `SIGSTOP`) are the only two signals a process can never intercept or ignore: they guarantee that a process always remains stoppable from the outside, even if it tries to block every other signal.

## Intercepting a Signal with `signal()`

`signal()` replaces a signal's default behavior with a function (a **handler**), automatically called as soon as the signal arrives:

```c
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

volatile sig_atomic_t recu = 0;

void handler(int sig)
{
    recu = 1;   // the handler does almost nothing: see "minimal handler" further below
}

int main(void)
{
    signal(SIGINT, handler);   // Ctrl-C no longer stops the program, calls handler() instead

    while (!recu) {
        pause();   // waits for a signal without consuming CPU
    }

    printf("Signal received, clean shutdown.\n");
    return 0;
}
```

Without `signal(SIGINT, handler)`, a Ctrl-C would have terminated the program immediately (the default behavior of `SIGINT`); with it, the program intercepts the signal and decides for itself what to do.

## Communicating Between Processes with a Signal (IPC)

`SIGUSR1`/`SIGUSR2` have no predefined meaning: a program can use them as a communication mechanism between processes (*IPC*, *Inter-Process Communication*), by establishing its own convention. Example: transmitting one bit at a time, `SIGUSR1` for `0`, `SIGUSR2` for `1`:

```c
// Sender side (knows the receiver's PID)
kill(pid_recepteur, bit ? SIGUSR2 : SIGUSR1);

// Receiver side: one handler for either possible bit
void handler(int sig)
{
    bit_recu = (sig == SIGUSR2) ? 1 : 0;
    // accumulate this bit into a byte being built...
}
```

Each transmitted character then requires 8 signals (one per bit), the receiver reconstructing the byte as it goes. This is slower than a classic [file descriptor](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs), but works without any communication channel set up beforehand, only the recipient's PID is needed.

## Writing a Safe Handler

A handler executes by interrupting the program's normal code, potentially **right in the middle** of another function (including a standard library function): it therefore cannot behave like an ordinary function.

> **Pitfall:** calling a function that is not **async-signal-safe** inside a handler, such as `printf()`. If the signal arrives while the program is already in the middle of a call to `printf()` (its internal buffer being modified), a second call to `printf()` from the handler corrupts that shared internal state, a bug that only appears rarely and non-reproducibly.
>
> **Best practice:** a handler should stay minimal: modify a variable of type `sig_atomic_t` (the only type whose read/write is guaranteed atomic in the face of an interruption) and nothing more. The program reads this variable **outside** the handler, in its main loop, to react to the signal safely.

`volatile sig_atomic_t` combines two guarantees needed here: `sig_atomic_t` ensures the variable is read and written in a single indivisible operation (never half modified); `volatile` prevents the compiler from optimizing its read by wrongly assuming it can only change within the program's normal flow.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A signal interrupts a process at any moment to execute a handler, unlike a regular function call. `SIGUSR1`/`SIGUSR2` have no predefined meaning and can serve as a communication channel between processes. |
| **Tools you can use** | `signal()` to intercept a signal, `kill()` to send one, `volatile sig_atomic_t` to communicate between a handler and the rest of the program. |
| **Pitfalls to avoid** | Calling a function that is not async-signal-safe (such as `printf()`) inside a handler. |
| **Best practices** | Keep a handler minimal (modify a single `sig_atomic_t` variable) and handle the signal in the program's main loop, never inside the handler itself. |
