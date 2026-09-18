---
order: 26
---

# POSIX Semaphores

A **semaphore** is a protected counter, shared between threads or between processes, that limits how many simultaneous accesses a resource can have. Unlike a [mutex](/?c=langages-de-programmation&s=c&p=threads) (a binary lock, limited to a single process/its own threads), a semaphore counts from 0 to N and can be shared between separate processes.

## `sem_wait()`/`sem_post()`: decrementing and incrementing

- `sem_wait()` decrements the counter; if the counter is already at 0, it **blocks** until another thread/process releases it.
- `sem_post()` increments the counter, potentially waking up a waiting thread/process.

```c
#include <semaphore.h>

sem_t semaphore;

sem_init(&semaphore, 0, 3); // initial count of 3 (0 = shared between threads of the same process)

sem_wait(&semaphore); // decrements; blocks if already at 0
// ... section that must not exceed 3 simultaneous accesses ...
sem_post(&semaphore); // increments, wakes up a possible waiting thread
```

## A named semaphore, shared between processes (`sem_open`)

Unlike `sem_init()` (limited to a single process), `sem_open()` creates or opens a **named** semaphore, visible to any process that reopens the same name:

```c
#include <semaphore.h>
#include <fcntl.h>

sem_t *forks = sem_open("/forks", O_CREAT, 0644, 5); // 5 forks available

sem_wait(forks); // takes a fork (blocks if all 5 are already taken)
// ... use the shared resource ...
sem_post(forks); // gives the fork back

sem_close(forks);     // releases the descriptor local to this process
sem_unlink("/forks"); // destroys the named object from the system (only once, at program end)
```

| Function | Role |
|---|---|
| `sem_open()` | Creates or opens a named semaphore, shared between processes |
| `sem_wait()` | Decrements the counter, blocks if already at 0 |
| `sem_post()` | Increments the counter, wakes up a waiting thread/process |
| `sem_close()` | Releases the descriptor local to this process (the named semaphore persists) |
| `sem_unlink()` | Permanently destroys the named object from the system |

> **Pitfall:** calling `sem_unlink()` from every process that uses the semaphore. A named semaphore must be destroyed only once (typically by the last process to stop, or a dedicated process), otherwise a still-running process ends up using a name that no longer exists.
>
> **Best practice:** use a counted semaphore (`sem_open` with an initial value > 1) to represent a limited resource pool (e.g. 5 forks shared between several processes); a semaphore initialized to 1 acts as a mutual-exclusion lock between processes, equivalent to a mutex but usable across separate processes (where a classic `pthread` mutex isn't).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A semaphore is a protected counter (0 to N) that limits how many simultaneous accesses a resource can have, usable between threads (`sem_init`) or between separate processes via a shared name (`sem_open`). |
| **Tools you can use** | `sem_wait()`/`sem_post()` to decrement/increment; `sem_open()`/`sem_close()`/`sem_unlink()` for a named semaphore shared between processes. |
| **Pitfalls to avoid** | Calling `sem_unlink()` from several processes, when the named object must be destroyed only once. |
| **Best practices** | A counted semaphore for a limited resource pool; a semaphore at 1 as a mutual-exclusion lock between processes. |
