---
order: 7
---

# Avoiding Redundant Recomputation

A more general principle hides behind [waiting for a condition rather than a duration](/?c=performance&p=attentes-et-temps-morts): **never recompute a result that nothing could have changed since it was last computed**. Where the previous chapter was about waiting (time passing), this one is about computation (the CPU and memory doing work): the same disciplined laziness, applied to a different kind of cost.

## Memoizing a function's result

The most direct case: an expensive function, called several times with the same arguments, redoing the same work on every call.

```python
def credit_score(customer_id):
    # heavy query: aggregates history, computes a score
    return compute_score(fetch_history(customer_id))

# called 3 times for the same customer within the same process
for order in customer_orders:
    if credit_score(customer_id) < threshold:
        reject(order)
```

Nothing changes `customer_id` or its history between these three calls: the second and third recompute exactly what the first already produced.

```python
_score_cache = {}

def credit_score(customer_id):
    if customer_id not in _score_cache:
        _score_cache[customer_id] = compute_score(fetch_history(customer_id))
    return _score_cache[customer_id]
```

**Memoization** keeps the result for a given input in memory and reuses it as long as nothing can invalidate it. The condition that makes it correct isn't "it's faster", it's "the input hasn't changed": exactly the same invariant as the cookie banner already covered in the previous chapter, applied here to a value rather than a display state.

> Memoization with no invalidation is a bug waiting to happen: if `customer_id`'s history can be modified mid-process (a payment that arrives between two orders), the cache returns a stale answer. Memoizing means first identifying what would make the result obsolete, before deciding to keep it.

## Recomputing only what changed

The same principle applies at the scale of an entire process, not just a function call. If only part of the data has changed since the last pass, reprocessing everything means redoing all the work already validated just to modify one fragment.

```python
# on every run: reprocess all 50,000 lines of the file
for line in whole_file:
    results.append(process(line))
```

```python
# only reprocess what arrived since the last pass
last_timestamp = read_progress_marker()
new_lines = [l for l in whole_file if l.timestamp > last_timestamp]

for line in new_lines:
    results.append(process(line))

write_progress_marker(new_lines[-1].timestamp if new_lines else last_timestamp)
```

The cost of processing becomes proportional to what **changed**, not to the total size of the data: a gain that grows as the volume already processed grows relative to the volume that's actually new.

## The 2D game example: only redraw what moves

A 2D game that manages its own display memory (a pixel or tile array in memory, without delegating to a rendering engine that already optimizes this) illustrates the principle well at the scale of a whole image.

```python
# on every tick: redraw the entire image, even if only one character moved
def draw_frame(screen, scene):
    for x in range(screen.width):
        for y in range(screen.height):
            screen.set_pixel(x, y, scene.color_at(x, y))
```

If a tick only moves one character by a few pixels, the rest of the scenery is pixel-for-pixel identical to the previous frame: recomputing it changes nothing about the result, only the time spent getting it.

```python
# only redraw rectangles marked "dirty" (changed since the last tick)
def draw_frame(screen, scene, changed_zones):
    for zone in changed_zones:
        for x, y in zone.pixels():
            screen.set_pixel(x, y, scene.color_at(x, y))
```

This is the **dirty rectangle** logic: the scene itself flags which zones have changed since the last render, and only those are redrawn. On a scene that's 90% static, this cuts the cost of each frame down to a fraction of a full render, for a visually identical result.

## An example from a scraper: don't reconfirm what's already proven

A classifieds scraper compared two listings to tell whether they described the same vehicle (a duplicate) or two different vehicles. The full check opened each listing's detail page to compare a dozen characteristics (mileage, options, service history): a non-trivial network call and render time.

```python
def are_potentially_duplicates(listing_a, listing_b):
    # everything is already available on the search results cards
    return (
        listing_a.make == listing_b.make
        and listing_a.model == listing_b.model
        and abs(listing_a.price - listing_b.price) < 200
    )

def are_duplicates(listing_a, listing_b):
    if not are_potentially_duplicates(listing_a, listing_b):
        return False    # already settled: different make/model, or price too far apart
    detail_a = open_listing_page(listing_a)
    detail_b = open_listing_page(listing_b)
    return compare_specifications(detail_a, detail_b)
```

As soon as the "light" comparison (the fields already present on the results card) establishes that two listings are different, the question is **already resolved**: opening both detail pages to confirm it would only recompute, at a steep price, a result the cheap data already produced. The expensive check only runs in the ambiguous case, the one where the light data isn't enough to decide.

> Not to be confused with a **network latency** optimization. What's being avoided here is redundant CPU/logic work (recomputing an already-known answer), not an I/O delay. Deliberate pauses between requests (rate limiting, courtesy toward a remote server) or waiting for an interface animation don't fall under this principle: they remain necessary even when no recomputation is at stake, and removing them risks getting blocked, not just being slow. This is exactly the distinction drawn at the end of [Waiting Without Wasting Time](/?c=performance&p=attentes-et-temps-morts): a protective delay isn't waste to eliminate.

## Atomic writes: never a half-written read

An in-memory memoized cache (previous section) disappears when the process stops; a **file-based cache** survives a restart, but introduces a new risk: a concurrent reader can open the cache file **while it's still being written**.

```python
# Risk: a concurrent reader may read this file half-written
with open("cache.json", "w") as f:
    json.dump(result, f)   # if the process is interrupted here, the file is corrupted
```

```python
# Atomic write: write to a temporary file, then rename it
import os

tmp_path = "cache.json.tmp"
with open(tmp_path, "w") as f:
    json.dump(result, f)
os.replace(tmp_path, "cache.json")   # rename(): atomic at the filesystem level
```

`os.replace()` (like `rename()` in most languages) is **atomic** at the filesystem level: at any instant, `cache.json` points either to the complete old version or the complete new version, never to an intermediate state. No concurrent reader can ever see a half-written file, unlike a direct write interrupted mid-way.

> **Pitfall:** writing directly to the final cache file, assuming an interruption (crash, power cut) is rare enough to ignore. A corrupted cache file can then crash every subsequent reader, long after the initial incident.
>
> **Best practice:** always write to a temporary file then rename it to the final name, for any file read by another process while it might be rewritten.

## Stale-while-revalidate: answer right away, recompute behind the scenes

The memoization seen above has a flaw at scale: if the cache is empty or stale, the request that triggers the recomputation **waits** for it before answering. The **stale-while-revalidate** pattern (borrowed from the HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate) header) changes this rule: answer **immediately** with the cached value, even if stale, and only recompute in the background.

```text
Classic cache (blocking):           Stale-while-revalidate:

request -> cache stale?             request -> cache stale?
              |  yes                              |  yes
              v                                    v
        recompute (wait)                    answer with the stale value
              |                              AND trigger a background recompute
              v                                    |
           answer                            (the next call gets the
                                              fresh value)
```

```python
recompute_lock = threading.Lock()

def cached_value(key):
    entry = cache.get(key)
    if entry is None:
        return recompute_and_store(key)   # very first call: no choice but to wait

    if entry.is_stale() and recompute_lock.acquire(blocking=False):
        threading.Thread(target=lambda: recompute_and_store(key, recompute_lock)).start()

    return entry.value   # answers immediately, stale or not
```

The anti-concurrency lock (`recompute_lock`) prevents an expensive recomputation from being triggered N times in parallel while it's already running for the same key: only the very first thread to acquire it actually triggers the recomputation, the others keep serving the stale value in the meantime.

> **Pitfall:** applying stale-while-revalidate without an anti-concurrency lock, on a key subject to many simultaneous requests: every request that detects a stale cache triggers its own expensive recomputation, which can cancel out the whole benefit (or even make load worse than a classic blocking cache).
>
> **Best practice:** never make a stale cache block the user for a simple refresh; reserve waiting for the very first call, with no cached value at all.

## Summary

| Situation | Without the principle | With the principle |
|---|---|---|
| Pure function called several times with the same input | Recomputes on every call | Memoizes the result, invalidates if the input changes |
| Periodic processing over largely stable data | Reprocesses everything on every pass | Only reprocesses what changed since the progress marker |
| Rendering a game frame | Redraws the entire screen on every tick | Only redraws zones marked as changed |
| Comparing two records | Systematically opens the expensive detail | Stops as soon as light data has already decided |

In all four cases, the gain doesn't come from a computation made faster, but from a computation **that never happened**, because nothing could have changed its result.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Never recompute a result that nothing could have changed since it was last computed: memoization, incremental reprocessing, or dirty rectangles all apply the same idea at different scales. A file cache adds two techniques: atomic writes (never a half-written read) and stale-while-revalidate (answer fast, recompute behind the scenes). |
| **Tools you can use** | An in-memory cache per input (memoization), a progress marker to only reprocess what's new, a "light" comparison before an expensive check, `rename()`/`os.replace()` for an atomic write, an anti-concurrency lock for a background recomputation. |
| **Pitfalls to avoid** | Memoizing without identifying what would invalidate the result: a cache that's never invalidated becomes a source of stale data. Writing directly to a cache file read by other processes. Applying stale-while-revalidate without an anti-concurrency lock. |
| **Best practices** | Always define the invalidation condition before memoizing; distinguish avoidable recomputation (this principle) from a deliberate protective pause (to keep); write a cache file through a renamed temporary file; only make the user wait on the very first call with no cache. |
