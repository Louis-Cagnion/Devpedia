---
order: 16
---

# Threads (pthreads)

A **thread** is, like a process, a sequence of instructions executed independently—but unli`fork()`s (see the chapter on processes), multiple threads within the same program **share the same memory**. It is lighter to create than a process, but this introduces a new risk: two threads can modify the same data at the same time.

## Create and wait for a thread

The POSIX threads library (`pthread`) provides the basic functions; compilation requires the "`-pthread`" option (`gcc -pthread main.c -o program`).

```c
#include <pthread.h>
#include <stdio.h>

void *tache(void *argument)
{
    int *number = (int *)argument;
    printf("Thread : je reçois %d\n", *number);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int value = 42;

    pthread_create(&thread, NULL, tache, &value); // lance le thread, exécute "tache" en parallèle
    pthread_join(thread, NULL);                    // attend que ce thread se termine

    return 0;
}
```

- `pthread_create()` Takes: a pointer to the thread ID to be filled in, attributes (default: `NULL`), the function to be executed, and the argument to be passed to it (a single pointer `void *`, to be cast to the correct type inside the function).
- `pthread_join()` blocks execution until the target thread terminates — equivalent to `wait()` for a process.

## Shared Memory: An Advantage and a Risk

Unlike two processes that originate from a single "`fork()`" (with separate memory), two threads of the same program can see and modify the **same global variables**:

```c
#include <pthread.h>

int counter = 0; // partagé par tous les threads

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        counter++; // DANGER : plusieurs threads modifient la même variable en même temps
    }
    return NULL;
}
```

If two threads execute `incrementer()` in parallel, the final result of `counter` is **unpredictable**: `counter++` is not a single atomic operation at the processor level (it breaks down into read, add, and write), and two threads may read the same value before either of them has had time to write it back—one of the two increments is then silently lost. This phenomenon is called a **race condition**.

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
        counter++;                    // une seule thread à la fois peut exécuter cette ligne
        pthread_mutex_unlock(&verrou);
    }
    return NULL;
}
```

> **Note:** A mutex that is locked and never unlocked (due to forgetting to call `pthread_mutex_unlock()`, or because `return` throws an exception before reaching that point) **permanently** blocks all other threads waiting for that lock—a classic bug called **a deadlock**, where two threads wait for each other, each holding a lock that the other needs.

## Threads vs. Processes

| | `fork` | `pthread` |
|---|---|---|
| Memory | Separate (copy) | Shared |
| Production Cost | Higher | Lighter |
| Communication between units | Requires an explicit mechanism (pipe, shared memory, etc.) | Direct (global variables), but requires protection (mutex) |
| Does a crash affect other processes? | No — isolated | Yes — a thread that crashes can corrupt the entire process |
