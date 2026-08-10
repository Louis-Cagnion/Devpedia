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

A classic profiler (`cProfile` in Python, a browser's Performance tab) gives time per function. That's useful for computation, much less so when the program spends its time **waiting**: everything shows up under a handful of waiting functions, with no indication of *why* it's waiting.

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

- **the time actually dropped** — sometimes an "obviously faster" change changes nothing, because it wasn't on the **critical path** (the sequence of dependent steps that alone determines total duration; speeding up a step outside that sequence shortens nothing, since the program waits for the steps that *are* part of it regardless);
- **the result is identical** — the check that gets forgotten, and the most important one. An optimization that silently breaks the output is far worse than a slow program.

In the case above, comparing the output byte by byte before and after each step revealed an extraction that had become incomplete — a bug no stopwatch would have caught.

## The single-measurement pitfall

A single reading tells you nothing: network, cache, and machine load make results vary by tens of percent. Take several measurements and check whether the gap between two configurations exceeds their natural variation. Otherwise, you're measuring noise.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Never optimize without measuring first — intuition about "what's slow" generally targets code that looks complicated, not code that actually costs the most. |
| **Tools you can use** | A classic profiler (per function), manual per-phase instrumentation when the program spends its time waiting. |
| **Pitfalls to avoid** | Trusting a single measurement — noise (network, cache, machine load) can exceed the actual effect of an optimization. |
| **Best practices** | Always remeasure after an optimization (both time AND result accuracy); take several measurements to tell a real gain from noise. |
