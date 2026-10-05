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

## Repair the previous result instead of recomputing everything

A solver repeats the same test hundreds of thousands of times, on data that barely changes from one test to the next. Example: the "all different" constraint is tested with a [bipartite matching](/?c=fondamentaux&s=algorithmes&p=couplage-biparti-et-theoreme-de-hall) after each removal of a possible value. Redoing the matching from scratch starts all the work over although a single edge has disappeared.

The idea is to **keep the previous matching** and only repair what the change broke:

| The removed edge | What we do |
|---|---|
| Was not in the matching | Nothing: the matching remains valid |
| Was in the matching | A single cell loses its value: a single path search to place it again |

```c
// Removes value v from cell c, then repairs the matching instead of redoing it
int after_removal(int c, int v)
{
    dom[c][v] = 0;
    if (owner[v] == c) {         // the removed edge was used by the matching
        owner[v] = -1;
        value_of[c] = -1;
        memset(seen, 0, sizeof seen);
        find(c);                 // a single cell to place again
    }
    for (int k = 0; k < N; k++)  // a cell without a value: no complete matching any more
        if (value_of[k] < 0)
            return 0;
    return 1;
}
```

`value_of[c]` remembers each cell's value (the `find()` of the matching chapter updates it together with `owner`). When the removed value is put back, the cells left without a value try again: without that, the kept matching would stay too small forever.

Measured on 200,000 successive removals, 40 cells, 40 values, each cell accepting 12 % of the values:

| | Recompute everything | Repair |
|---|---|---|
| Cells examined by the searches | 61,566,318 | 832,601 (74 times fewer) |
| Time | about 1 s | a few tens of ms |
| Answers "complete matching?" | 198,112 yes | 198,112 yes, **identical test by test** (0 differences) |

**Same answer, not necessarily the same matching.** Several complete matchings exist: the repaired matching differs from the one a full computation gives in 1,972 cases out of 1,973 compared. The yes/no answer is the same; but if the rest of the program depends on the matching itself (an explanation, an order, a result to reproduce identically from one run to the next), you **fall back on the full computation** to produce that canonical result, and keep the repaired version for all the tests that only need the answer. In the rush01 research solver, this combination cut the total time by 6.2 %.

> **Pitfall:** repairing a state that is no longer valid. The invariant "the current matching is valid for the current data" must be restored after **every** kind of change (removal, putting back, a search backtracking): a forgotten case gives a wrong answer, with no error.
>
> **Best practice:** keep the full computation as a reference in a test, and compare answers test by test (here 0 differences out of 200,000) before measuring time.

## Only Visit the Marked Elements: the Bitmap

When only a small part of the elements has changed and they have been marked (like the "dirty rectangles" above), going through a one-byte-per-element flag array costs one read per element, marked or not. A **bitmap** stores one flag per bit: a 64-bit word holds 64 of them (see [the bitmap filter](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)), and `__builtin_ctzll` directly gives the position of the next bit set to 1 ([built-in functions](/?c=langages&s=c&p=operateurs-binaires)). Empty words cost a single read.

```c
for (uint32_t w = 0; w < N / 64; w++)
    for (uint64_t m = bitmap[w]; m; m &= m - 1)  // bits left in the word
        process(w * 64 + __builtin_ctzll(m));    // index of the lowest bit set to 1
```

`m &= m - 1` clears the lowest bit set to 1: the loop stops when the word is empty, and `__builtin_ctzll` is never called on 0 (its result would be undefined).

Measured on 1 M elements, 200 passes, median of 7 alternating rounds, same sums checked (Intel Core Ultra 5 228V under WSL, gcc 13.3 at `-O2`):

| Share of marked elements | Byte array | Bitmap | Difference |
|---|---|---|---|
| 0.1 % | 84 ms | 2.9 ms | −97 % |
| 1 % | 63 ms | 16 ms | −74 % |
| 10 % | 67 ms | 44 ms | −35 % |
| 50 % | 68 ms | 130 ms | **+91 %** |

The gain depends on the **density** of the marks: at half marked, the bitmap is almost twice as slow, because each mark costs more than a byte read sequentially. In the rush01 research solver, this traversal only gained 2 % of the total time: only the real program tells what the optimization is worth (see [Measure Before Optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)).

> **Pitfall:** adopting the bitmap because it is more compact or faster in the sparse case, without measuring the real density of the program's marks.
>
> **Best practice:** measure the share of marked elements in the real program before choosing; the bitmap is worth it for rare marks.

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

## Progressive HTTP streaming: when the computation is unavoidable

All the previous techniques avoid an avoidable recomputation. This one applies to the opposite case: a computation that is genuinely **unavoidable** (importing a large file, calling a slow external service) and that no cache can shorten. The only remaining lever is how the user perceives the wait.

By default, a PHP server keeps everything a script writes with `echo` in memory, and only sends it to the browser once the script finishes (or its buffer fills up): the user sees a blank page until the end, even though the script may have already produced a useful result long before.

```php
<?php
ini_set('output_buffering', 'off');   // turns off output buffering
ini_set('implicit_flush', true);      // forces immediate sending after each echo
while (ob_get_level() > 0) {
    ob_end_flush();                   // also flushes any buffer already opened by PHP itself
}

foreach ($rowsToImport as $row) {
    importRow($row);
    echo "Row imported: {$row->id}<br>\n";
    flush();                          // sends this echo to the browser right away
}
```

Every `echo` followed by `flush()` is sent to the browser immediately, without waiting for the script to finish: the user sees a console filling up in real time, like terminal logs, instead of a blank page followed by a single final result.

> **Note:** this mechanism is the opposite of [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm): there, the connection closes right away and the work keeps going hidden behind it; here, the connection stays open for the whole computation, which is exactly what allows sending each piece of the result as it becomes available.

> **Pitfall:** this streaming breaks as soon as an intermediate server (proxy, load balancer, Nginx in `fastcgi_buffering` mode) puts its own buffer back in place: check the whole network chain's configuration, not just PHP's.

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
| **Key takeaways** | Never recompute a result that nothing could have changed since it was last computed: memoization, incremental reprocessing, or dirty rectangles all apply the same idea at different scales. A file cache adds two techniques: atomic writes (never a half-written read) and stale-while-revalidate (answer fast, recompute behind the scenes). When the computation is unavoidable (nothing to cache), progressive HTTP streaming is the only way left to improve perceived wait time. Repairing the previous result (a kept matching, a single cell to place again) gives the same answer as the full computation for a fraction of the work; a bitmap only visits the marked elements, but only if marks are rare. |
| **Tools you can use** | An in-memory cache per input (memoization), a progress marker to only reprocess what's new, a "light" comparison before an expensive check, `rename()`/`os.replace()` for an atomic write, an anti-concurrency lock for a background recomputation, `flush()`/`ob_end_flush()` for progressive HTTP streaming. |
| **Pitfalls to avoid** | Memoizing without identifying what would invalidate the result: a cache that's never invalidated becomes a source of stale data. Writing directly to a cache file read by other processes. Applying stale-while-revalidate without an anti-concurrency lock. Streaming an HTTP response without checking that no intermediate proxy puts its own buffer back in place. Repairing a state whose invariant is not restored after every kind of change. Believing the repaired result is identical to the full computation's canonical result. Adopting a bitmap without measuring the density of the marks (at half marked: +91 %). |
| **Best practices** | Always define the invalidation condition before memoizing; distinguish avoidable recomputation (this principle) from a deliberate protective pause (to keep); write a cache file through a renamed temporary file; only make the user wait on the very first call with no cache; stream the HTTP response as soon as a long, unavoidable computation produces results progressively. Compare the repaired result with the full computation test by test, and fall back on the full computation when the exact result matters; measure the real density of the marks before choosing a bitmap. |
