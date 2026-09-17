---
order: 21
---

# Threads (pthreads)

A **thread** is, like a process, a sequence of instructions executed independently, but unlike [`fork()`](/?c=langages-de-programmation&s=c&p=processus), multiple threads within the same program **share the same memory**. It is lighter to create than a process, but this introduces a new risk: two threads can modify the same data at the same time.

## Create and wait for a thread

The POSIX threads library (`pthread`) provides the basic functions; compilation requires the "`-pthread`" option ([`gcc`](https://gcc.gnu.org) `-pthread main.c -o program`). The **POSIX** standard is introduced in the [Writing and Running a Bash Script](/?c=shells&s=bash&p=scripts-et-shebang) chapter of [Bash](/?c=shells&s=bash&p=bash).

```c
#include <pthread.h>
#include <stdio.h>

void *tache(void *argument)
{
    int *number = (int *)argument;
    printf("Thread: I received %d\n", *number);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int value = 42;

    pthread_create(&thread, NULL, tache, &value); // launches the thread, runs "tache" in parallel
    pthread_join(thread, NULL);                    // waits for this thread to finish

    return 0;
}
```

- `pthread_create()` takes: a pointer to the thread ID to be filled in, attributes (default: `NULL`), the function to be executed, and the argument to be passed to it (a single pointer `void *`, to be cast to the correct type inside the function).
- `pthread_join()` blocks execution until the target thread terminates, equivalent to `wait()` for a process.

## Shared Memory: An Advantage and a Risk

Unlike two processes that originate from a single "`fork()`" (with separate memory), two threads of the same program can see and modify the **same global variables**:

```c
#include <pthread.h>

int counter = 0; // shared by all threads

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        counter++; // DANGER: multiple threads modify the same variable at the same time
    }
    return NULL;
}
```

If two threads execute `incrementer()` in parallel, the final result of `counter` is **unpredictable**: `counter++` is not a single atomic operation at the processor level (it breaks down into read, add, and write), and two threads may read the same value before either of them has had time to write it back; one of the two increments is then silently lost. This phenomenon is called a **race condition**.

## Protecting Shared Data with a Mutex

A **mutex** (*mutual exclusion*) ensures that only one section of code at a time can access shared data: the first thread to reach it **locks** it, and the others wait for it **to unlock** it:

```c
#include <pthread.h>

int counter = 0;
pthread_mutex_t verrou = PTHREAD_MUTEX_INITIALIZER;

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&verrou);
        counter++;                    // only one thread at a time can execute this line
        pthread_mutex_unlock(&verrou);
    }
    return NULL;
}
```

> **Note:** A mutex that is locked and never unlocked (due to forgetting to call `pthread_mutex_unlock()`, or because `return` throws an exception before reaching that point) **permanently** blocks all other threads waiting for that lock, a classic bug called **a deadlock**, where two threads wait for each other, each holding a lock that the other needs.

## Avoiding a Deadlock with a Total Lock Order

The **dining philosophers problem** (posed by Dijkstra) illustrates this risk well: N philosophers around a table share N forks (one between each pair of neighbors) and each need to hold two (left and right) to eat. If they all grab their left fork at the same time, each one waits forever for the right fork held by their neighbor: a generalized deadlock. This is a special case of a more general problem: two threads each need **two** mutexes to proceed, but lock them in a different order.

```text
Thread A:  lock(mutex1) -> waits for mutex2 (held by B)
Thread B:  lock(mutex2) -> waits for mutex1 (held by A)
-> deadlock: neither A nor B can ever proceed
```

The simplest fix: impose a **total order**, arbitrary but identical for every thread, over the whole set of locks to be acquired (for instance, compare the two mutexes' memory addresses and always lock the one with the lower address first):

```c
if (mutex_a < mutex_b) {
    pthread_mutex_lock(mutex_a);
    pthread_mutex_lock(mutex_b);
} else {
    pthread_mutex_lock(mutex_b);
    pthread_mutex_lock(mutex_a);
}
```

It doesn't matter which thread arrives first or in what logical order the two locks are useful to it: every thread in the program follows the same rule (here, lowest address first), so no circular wait cycle can ever form.

> **Best practice:** as soon as a function needs to lock several mutexes at once, define a single ordering rule and stick to it everywhere in the program, rather than locking in whatever order the locks happen to be mentioned locally in the code.

## Threads vs. Processes

| | Process (`fork`) | Thread (`pthread`) |
|---|---|---|
| Memory | Separate (copy) | Shared |
| Creation cost | Higher | Lighter |
| Communication between units | Requires an explicit mechanism (pipe, shared memory, etc.) | Direct (global variables), but requires protection (mutex) |
| Does a crash affect other processes? | No (isolated) | Yes (a thread that crashes can corrupt the entire process) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A thread shares memory with the other threads of the same program (unlike a process spawned by `fork()`), is lighter, but exposes shared data to *race conditions*. |
| **Tools you can use** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`. |
| **Pitfalls to avoid** | Modifying a shared variable without protection (*race condition*); forgetting to unlock a mutex (*deadlock* if another thread waits indefinitely); locking several mutexes in a different order depending on the thread. |
| **Best practices** | Protect any data shared between threads with a mutex, even for an operation that looks simple (`counter++` is not atomic). Always lock several mutexes in the same order (e.g. by memory address) to avoid any deadlock. |
