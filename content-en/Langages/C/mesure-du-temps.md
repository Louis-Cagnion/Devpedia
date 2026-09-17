---
order: 27
---

# Measuring Time and Waiting Precisely

A program that needs to timestamp an event or wait for a precise duration can't just rely on a simple loop counter: execution speed depends on the processor and its load. Two standard tools address this: `gettimeofday()` to read the current time, `usleep()` to pause.

## Reading the current time: `gettimeofday()`

```c
#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);

long milliseconds = tv.tv_sec * 1000 + tv.tv_usec / 1000;
```

`gettimeofday()` fills a `timeval` structure with two fields: `tv_sec` (seconds elapsed since a fixed reference, the Unix *epoch* of January 1st, 1970) and `tv_usec` (extra microseconds, between 0 and 999999). Combining both into a single millisecond value (`tv_sec * 1000 + tv_usec / 1000`) then simplifies any comparison or subtraction between two points in time.

## Pausing: `usleep()` and its imprecision

`usleep(microseconds)` pauses the current thread or process, but its actual precision depends on the system's scheduler: the pause can last slightly **longer** than requested (never less), since the scheduler only guarantees a minimum, not an exact duration.

> **Pitfall:** chaining successive `usleep()` calls believing this gives precise timing. Each individual call can overshoot slightly, and these small overshoots accumulate across repeated calls.
>
> **Best practice:** for genuinely precise waiting, compare the actually elapsed time (via `gettimeofday()`) against the desired duration, inside a loop that calls `usleep()` again in small increments until the exact duration is reached:

```c
void preciseWait(long durationMs)
{
    long start = currentTimeMs(); // gettimeofday(), see above

    while (currentTimeMs() - start < durationMs) {
        usleep(1000); // re-checks every millisecond rather than one long usleep()
    }
}
```

This **busy-wait** pattern recomputes the actually elapsed time on every iteration rather than trusting a single `usleep()` for the whole duration: the slight imprecision of each individual `usleep(1000)` is corrected by the loop itself, which only stops once the desired time has actually been reached.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `gettimeofday()` reads the current time (seconds + microseconds since the Unix epoch); `usleep()` pauses, but its actual duration can slightly exceed the requested value. |
| **Tools you can use** | Combining `tv_sec`/`tv_usec` into a single millisecond value to timestamp or compare points in time. |
| **Pitfalls to avoid** | Trusting a single long `usleep()` for precise timing: its imprecision accumulates. |
| **Best practices** | Loop over small `usleep()` calls, rechecking the actually elapsed time against the desired duration, for precise waiting despite each `usleep()`'s individual imprecision. |
