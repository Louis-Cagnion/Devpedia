---
order: 4
---

# Parallelism: Finding the Real Constraint

Parallelism is the most misused optimization, because it always looks applicable: "I have 8 cores, let's launch 8 workers." In practice, a program never goes faster than its **most constrained resource**, and adding workers beyond that limit degrades performance instead of improving it.

## Identifying what's limiting

Before parallelizing, you need to know what you're waiting on:

| The program is waiting on… | Is parallelism useful? |
|---|---|
| The processor (computation, compression, rendering) | Up to the number of cores, not beyond |
| A disk | Little: the read head or the queue saturates quickly |
| The network / a remote service | Yes, **if** the targets are independent |
| A lock, a single database | No: the bottleneck is shared, you're just crowding it |

The "network" case is the most favorable, because the program spends its time doing nothing while waiting for responses. But it carries a decisive condition: **the targets must be independent**.

## Two independent targets: parallelism is free

On a program that queried two separate services one after the other, each with its own rate limit, handling them in two processes (one per service) cuts the total time in half **without adding a single call** to the load either one sees. This is a gain with no trade-off: you simply stop sitting idle in front of service A while doing nothing with service B.

## Several workers on the same target: the gain is a transfer

By contrast, launching two workers against the **same** service doubles the rate of requests it receives. Parallelism doesn't work around a rate limit: it **concentrates** it. And if that limit exists (a quota, anti-abuse protection), you don't gain time, you buy a risk of being blocked.

This point is counter-intuitive: the workers do start from the same place: the same machine, often the same public IP address. From the remote service's point of view, this isn't "several clients", it's **one client being twice as insistent**.

## Why it becomes counter-productive

Beyond the constraint, each additional worker degrades the others:

- **Memory and CPU**: several browsers or interpreters compete for the machine. Pages render more slowly, so each worker individually becomes slower.
- **A perverse effect with adaptive waits**: if waits are calibrated to actual response time (see [Waiting Without Wasting Time](/?c=performance&p=attentes-et-temps-morts)), slower rendering **mechanically lengthens** every wait. The per-worker gain collapses while the load keeps increasing.
- **Fixed startup cost**: launching a process, an interpreter, a browser costs a few seconds. On a small volume of work, this cost cancels out the benefit; this is exactly what I observed: on 4 units of work, the parallel version was *slower* than the sequential one; the gain only showed up past a few dozen.

Hence a typical progression:

| Workers | Time | Load per target | Verdict |
|---|---|---|---|
| 1 | 33 min | 1× | baseline |
| 2 (1 per target) | 17 min | 1× | free gain |
| 4 (2 per target) | 8 min | **2×** | risk bought |
| 6 (3 per target) | ~7 min | **3×** | counter-productive |

The move from 4 to 6 illustrates the point: the time barely drops anymore but the load keeps growing linearly: a symptom of **contention** (several workers competing for the same limited resource, here the machine itself: CPU, memory), which cancels out the expected benefit of parallelism.

## Practical constraints to anticipate

Parallelism surfaces problems that didn't exist in sequential mode:

- **Exclusive resources**: some tools lock their working files (a browser profile, for instance). Each worker needs its own.
- **Concurrent writes**: two processes writing to the same output file interleave and corrupt it. Having each worker write to its own file, then merging, is simpler and more robust than a shared lock.
- **Silent errors**: a worker that fails doesn't make the main program fail. You need to explicitly check return codes **and** that the merged result is complete. Without this check, an empty report looks like a success.

```python
failures = [name for name, proc in workers if proc.wait() != 0]
results = merge(workers)

if not results:
    raise SystemExit("No results collected: nothing was produced.")
if len(results) < expected:
    warn(f"{len(results)} results out of {expected} expected")
```

## An often better alternative: spreading work over time

When the constraint is a quota, the solution isn't always to go faster. Splitting the work into batches spread across the day exposes far less than one big run all at once, for the same result, and requires no parallelization at all. If latency doesn't matter (an overnight job, a periodic report), it's the safest choice.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A program never goes faster than its most constrained resource. Parallelizing across independent targets is a free gain; parallelizing on the same target concentrates the load rather than spreading it out. |
| **Tools you can use** | One worker per independent target, explicit checking of return codes and the volume of results obtained. |
| **Pitfalls to avoid** | Adding workers beyond the real constraint (degrades performance); assuming a silently failing worker will make the main program fail. |
| **Best practices** | Identify the limiting resource before parallelizing; spread work over time rather than parallelizing when the constraint is a quota and latency doesn't matter much. |
