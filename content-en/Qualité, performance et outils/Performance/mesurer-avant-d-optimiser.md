---
order: 1
---

# Measure Before Optimizing

The most cost-effective rule in performance work is also the most ignored: **never optimize without measuring first**. Intuition about "what's slow" is reliably wrong, because you tend to look at the code that seems complicated rather than the code that actually costs the most.

## The typical case

On a browser automation program that was too slow, my hypotheses were: page loads, then pagination, then data extraction. Profiling showed this:

| Step | Time | Share |
|---|---|---|
| Waiting for a cookie banner | 12.8s | **50%** |
| Fixed waits after pagination | ~7.5s | 30% |
| Page loads + extraction | ~5s | 20% |

Half the time was spent watching for a banner **that never appeared**: consent had already been recorded in the browser profile. None of my three hypotheses was the real culprit, and the actual culprit wasn't even on my list.

## Profile by phase, not line by line

A classic profiler ([`cProfile`](https://docs.python.org/3/library/profile.html) in [Python](/?c=langages-de-programmation&s=python&p=python), a browser's Performance tab) gives time per function. That's useful for computation, much less so when the program spends its time **waiting**: everything shows up under a handful of waiting functions, with no indication of *why* it's waiting.

In this case, instrumenting the logical phases yourself is more informative. The principle: wrap the key functions to accumulate their time, without touching the code being measured.

```python
import time

timings = []

def time_it(module, name):
    """Replaces module.name with a version that records its execution time."""
    original = getattr(module, name)

    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = original(*args, **kwargs)
        timings.append((name, time.perf_counter() - start))
        return result

    setattr(module, name, wrapper)

time_it(my_module, "wait_for_content")
time_it(my_module, "close_banner")
```

Aggregating by name afterward gives both the number of calls **and** the cumulative time for each. The call count is often the decisive piece of information: a 0.3s function called 40 times costs more than a 2s function called once.

> Remember to also display the **unaccounted** time (total measured minus the sum of the phases). If it's high, your instrumentation is missing the bulk of it, and your conclusions will be off.

## Measure afterward too

An unremeasured optimization is just a belief. Two checks are worth making systematic:

- **the time actually dropped**: sometimes an "obviously faster" change changes nothing, because it wasn't on the **critical path** (the sequence of dependent steps that alone determines total duration; speeding up a step outside that sequence shortens nothing, since the program waits for the steps that *are* part of it regardless);
- **the result is identical**: the check that gets forgotten, and the most important one. An optimization that silently breaks the output is far worse than a slow program.

In the case above, comparing the output byte by byte before and after each step revealed an extraction that had become incomplete: a bug no stopwatch would have caught.

## The single-measurement pitfall

A single reading tells you nothing: network, cache, and machine load make results vary by tens of percent. Take several measurements and check whether the gap between two configurations exceeds their natural variation. Otherwise, you're measuring noise.

## Native Profilers on Linux: `gprof` and `perf`

A **profiler** shows in which functions a program spends its time. Two classic tools for a compiled program (in C for example):

| Tool | How to use it | Limit |
|---|---|---|
| `gprof` | Compile with `-pg`, run the program (it writes `gmon.out`), then `gprof -b -p program gmon.out` | Wrong with optimization: calls that the compiler moves or merges vanish from the profile |
| `perf` | `perf record ./program` then `perf report`, without recompiling (it samples using the processor's counters) | Refused to a regular user if `/proc/sys/kernel/perf_event_paranoid` is 3 or 4 (Ubuntu's default) |

`gprof` output for a program that calls a `slow` function 200 times and a ten times shorter `fast` function 200 times (compiled without optimization):

```
  %   cumulative   self              self     total
 time   seconds   seconds    calls  ms/call  ms/call  name
 88.89      0.56     0.56      200     2.80     2.80  slow
 11.11      0.63     0.07      200     0.35     0.35  fast
```

The same program compiled with `-O1` gives an empty profile ("no time accumulated") and a single call to `slow`: the compiler moved the call out of the loop. When `perf` is blocked, `valgrind --tool=callgrind` works without special rights (see [Valgrind](/?c=langages&s=c&p=memoire)), at the cost of a much slower run (it simulates every instruction).

## Comparing on Work Counters, Not Only on Time

Two identical runs of the same program can differ by **±15%** on a laptop (processor frequency, temperature). A 5% gain measured with a stopwatch is then invisible in the noise. When the program can count its **work** (nodes explored, conflicts, propagations), these counters are **deterministic**: identical from one run to the next.

| What you observe | What it means |
|---|---|
| Identical counters, shorter time | The change speeds up the same work: a pure speed gain |
| Lower counters | The change reduces the work itself (better search) |
| Different counters, time within the noise | Nothing conclusive: measure on more instances |

## More Threads, Slower: Memory-Bound Programs

A program can be limited by **computation** (*CPU-bound*) or by **memory accesses** (*memory-bound*, see [The CPU cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)). In the second case, threads compete for the same memory bandwidth: adding more can **slow down** the whole. Measured on a puzzle solver: 577 ms with one thread, 893 ms with 8 threads (see also [Parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

Two other lessons from the same project:

| Finding | Detail |
|---|---|
| Running several different searches in parallel and keeping the first one that succeeds (a **portfolio**) | Very effective against catastrophic instances (see [Heavy tails](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#heavy-tails-a-few-catastrophic-instances)), useless if memory is already the bottleneck |
| Validating on instances from another source | A gain measured on a single family of data may not generalize (see [Latin squares and uniform sampling](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme)) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Never optimize without measuring first: intuition about "what's slow" generally targets code that looks complicated, not code that actually costs the most. |
| **Tools you can use** | A classic profiler (per function: `gprof`, `perf`, `valgrind --tool=callgrind`), manual per-phase instrumentation when the program spends its time waiting; deterministic work counters to compare two versions. |
| **Pitfalls to avoid** | Trusting a single measurement: noise (network, cache, machine load) can exceed the actual effect of an optimization. |
| **Best practices** | Always remeasure after an optimization (both time AND result accuracy); take several measurements to tell a real gain from noise. |
