---
order: 9
---

# Overlapping Latency with a Round-Robin Pool

When a program has to process many items that each involve a network wait (loading a page, calling an API, reading a remote file), the total time almost never depends on computation: it depends on the number of network round trips and how they're chained together.

## The problem with processing one item at a time

The simplest version fully processes each item before moving to the next:

```python
results = []
for item in items:
    page = fetch(item)          # network wait: e.g. 800 ms
    results.append(extract(page))
```

If each wait takes 800 ms and there are 1000 items, the program runs for about 13 minutes, even though the computation itself (`extract`) only takes a few milliseconds. The CPU spends most of its time doing nothing, waiting for a response.

## Launching everything at once: fast, but dangerous

Conversely, starting all 1000 waits at the same time would spread the entire network time over a single collective wait, at the cost of 1000 simultaneous requests to the same service. Many web services deliberately slow down or block a client that sends that many requests at once, and a database or server can simply collapse under the load.

## A compromise: a pool bounded to N slots

The solution used in practice is a **pipeline**: always keep at most **N** waits in flight (N chosen, for example 5 or 10), never more, never less as long as work remains. Concretely, N slots numbered 0 to N-1 share the work in turn, in a **round-robin**:

```python
N = 5
slots = [None] * N
results = []

for i, item in enumerate(items):
    if slots[i % N] is not None:
        results.append(extract(slots[i % N]))   # finishes round (i - N)
    slots[i % N] = fetch(item)                   # starts round i, without waiting

for i in range(len(items) - N, len(items)):
    results.append(extract(slots[i % N]))        # drains the last N slots
```

At round `i`, `fetch(item)` starts **before** `extract(...)` for round `i - N` has finished running: processing one item happens while the next one's network wait is already progressing. Neither round waits on the other, and never more than N waits are in flight at once.

| Approach | Waits in flight | Total time for 1000 items at 800 ms |
|---|---|---|
| One at a time (sequential) | 1 | ≈ 13 minutes |
| All at once | 1000 | Fastest in theory, but a strong risk of being blocked by the remote service |
| Pool bounded to N=5 | 5 | ≈ 2.7 minutes, never exceeding 5 simultaneous requests |

> **Best practice:** choose N based on what the target service actually tolerates (documentation, a known quota, or cautious trial and error), never at random: too large an N reproduces the "all at once" problem.

## The special case of 2 slots: double buffering

With N = 2, this pattern has a classic name: **double buffering**, used for example in graphics rendering to prepare the next frame while the previous one is still displayed. The principle stays exactly the same: two slots that alternate between "being prepared" and "in use", so neither ever blocks on the other.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Processing items one at a time wastes all the network wait time; launching everything at once overloads the remote service. A pool bounded to N slots overlaps the next round's wait with the current round's processing, never exceeding N simultaneous requests. |
| **Tools you can use** | An array of N slots indexed round-robin (`i % N`), which starts round `i`'s work before retrieving round `i - N`'s result. |
| **Pitfalls to avoid** | An N chosen at random, too large for what the remote service tolerates. Forgetting to drain the last N slots after the main loop. |
| **Best practices** | Choose N from a known or documented limit of the remote service. Recognize the N=2 case as double buffering, a pattern already widespread elsewhere (graphics rendering). |
