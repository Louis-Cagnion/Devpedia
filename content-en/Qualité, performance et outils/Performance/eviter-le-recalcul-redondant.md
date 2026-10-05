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

## Reusing the previous result: incremental computation with an identical result

[Recomputing only what changed](#recomputing-only-what-changed) deals with **data** that arrives in small pieces. The same principle applies to an **algorithm** called millions of times on an input that has barely moved between two calls: instead of starting from scratch, it starts from the **previous result**.

Example from the Skyscraper solver. Its Hall test looks, for a nearly filled row, for a [matching between the free cells and the missing values](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#finding-a-matching-the-augmenting-path-kuhn-s-algorithm). Between two tests of the same row, only a few values have been removed: almost all the pairs of the previous matching are still valid. The function below keeps them and starts an augmenting-path search only for the cells left without a value. It uses the `matching.h` file from the chapter on [matchings](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin).

```c
#include <stdio.h>
#include <stdlib.h>
#include "matching.h"

static long searches, values_visited;           /* work counters */

/* Matches the cells starting from holder: the pairs that are still valid are kept,
   only the cells left without a value look for an augmenting path. */
static int match_from(int n, const uint64_t *domain, int *holder, uint64_t *fail_set)
{
    uint64_t kept = 0;                          /* cells whose pair is kept */
    uint64_t seen;

    for (int v = 0; v < 64; v++) {
        int i = holder[v];

        if (i >= 0 && (domain[i] >> v & 1) && !(kept >> i & 1))
            kept |= 1ull << i;                  /* pair still valid */
        else
            holder[v] = -1;                     /* stale pair: the value is freed */
    }
    for (int i = 0; i < n; i++) {
        if (kept >> i & 1)
            continue;
        seen = 0;
        searches++;
        int ok = augment(i, domain, holder, &seen);

        values_visited += __builtin_popcountll(seen);
        if (!ok) {
            *fail_set = seen;                   /* the Hall set of this failure */
            return i;
        }
    }
    return -1;
}

int main(void)
{
    enum { N = 32, EPISODES = 2000 };
    long steps = 0, mismatches = 0, work[2][2] = {{0}};
    long conflicts = 0, other_cell = 0, other_set = 0;

    srand(7);
    for (int ep = 0; ep < EPISODES; ep++) {
        uint64_t dom[N];
        int prev[64], fresh[64];
        uint64_t hall_a, hall_b, ignored;

        for (int i = 0; i < N; i++) {           /* random domains, 10% of the values */
            dom[i] = 1ull << i;                 /* value i is possible at the start */
            for (int v = 0; v < N; v++)
                if (rand() % 100 < 10)
                    dom[i] |= 1ull << v;
        }
        for (int v = 0; v < 64; v++)
            prev[v] = -1;
        match_from(N, dom, prev, &ignored);     /* starting matching */
        for (int step = 0; step < 1000; step++) {  /* one cell loses a value at each step */
            int i = rand() % N, v = rand() % N;
            long r0, w0;
            int a, b;

            if (!(dom[i] >> v & 1) || (dom[i] & (dom[i] - 1)) == 0)
                continue;                       /* value absent, or the cell's last one */
            dom[i] &= ~(1ull << v);
            steps++;
            for (int k = 0; k < 64; k++)
                fresh[k] = -1;                  /* A: full computation, reusing nothing */
            r0 = searches; w0 = values_visited;
            a = match_from(N, dom, fresh, &hall_a);
            work[0][0] += searches - r0; work[0][1] += values_visited - w0;
            r0 = searches; w0 = values_visited;
            b = match_from(N, dom, prev, &hall_b);       /* B: previous matching reused */
            work[1][0] += searches - r0; work[1][1] += values_visited - w0;
            if ((a < 0) != (b < 0))
                mismatches++;                   /* same verdict expected from both */
            if (b >= 0) {                       /* conflict: the episode stops */
                conflicts++;
                other_cell += a != b;           /* the cell left without a value differs */
                other_set += hall_a != hall_b;
                break;
            }
        }
    }
    printf("%ld value removals, %ld verdict mismatches\n", steps, mismatches);
    printf("full computation: %ld searches, %ld values visited\n",
           work[0][0], work[0][1]);
    printf("matching reused: %ld searches, %ld values visited\n",
           work[1][0], work[1][1]);
    printf("%ld conflicts: %ld with another cell, no value,\n", conflicts, other_cell);
    printf("%ld with another set of values reached\n", other_set);
    return mismatches != 0;
}
```

The program removes values one by one from random domains, and each time redoes the computation in two ways: **A** from scratch, **B** reusing the previous matching.

```
49549 value removals, 0 verdict mismatches
full computation: 1581056 searches, 9423329 values visited
matching reused: 12710 searches, 207078 values visited
2000 conflicts: 1725 with another cell, no value,
0 with another set of values reached
```

| Counter (49,549 value removals) | Full computation (A) | Matching reused (B) |
|---|---|---|
| Augmenting-path searches started | 1,581,056 | 12,710 |
| Values visited during these searches | 9,423,329 | 207,078 |
| Verdict mismatches (a matching exists or not) | 0 | 0 |

Reuse makes 124 times fewer searches, for exactly the same answers. Three precautions make this safe:

| Precaution | Why | In the example |
|---|---|---|
| The starting point must still be valid | A stale pair would distort the result | Pairs whose value was removed are deleted before starting again |
| The verdict must be the same from any starting point | Otherwise the optimization changes the answer | Kuhn's algorithm is exact from any valid matching: 0 mismatches over 49,549 cases |
| What depends on the starting point must not leak | An explanation or an output that changes alters the rest of the program | On a conflict, fall back to the full computation (see below) |

The last point shows in the last line of the output. Out of the 2,000 conflicts, **1,725** leave a different cell without a value depending on the starting point, even though the set of values reached is the same in all 2,000. Yet the [conflict explanation](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#when-no-matching-exists-the-hall-set) is built from that cell and from the holders of the values reached: it therefore depends on the starting matching. The solver then redoes the original full computation, **only when there is a conflict**: the explanation is that of the version without reuse, the search follows exactly the same path, and the counters (decisions, conflicts, propagations) stay identical over the 49 checks of the protocol. An optimization with an identical search can be measured cleanly: only the time changes (see [comparing on work counters](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparing-on-work-counters-not-only-on-time)).

> A counter divided by 124 does not give a program 124 times faster. The Hall test accounted for **7.4%** of the search time (cycle-counter profile, 104 × 104 grid: 4.7% for building the graph, 2.5% for the matching): the maximum possible gain was therefore about 7%. Measured: **6.2%** (33.9 s against 31.8 s at 96 × 96). Profiling first tells how far it is worth going.

## Only revisiting what is marked: walking through a bitmap

The [bitmap filter](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#bitmap-filter) avoids reading an element when a bit says there is nothing in it. The same bitmap is also used to **enumerate** only the elements that have something, without visiting the others.

Example from the same solver: at each cleanup of the learned clauses, the deleted clauses must be removed from every watch list. The solver has 13.6 million lists (one per literal), almost all empty. One bit per list says whether it may contain something. The program below compares a scan of all the lists with a scan of the 1 bits only: `bits &= bits - 1` clears the lowest bit of the word, `__builtin_ctzll` gives the position of the bit to process (see [walking through the 1 bits](/?c=langages&s=c&p=operateurs-binaires#walking-through-the-1-bits-compiler-built-in-functions)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 13600000u                 /* number of lists, like the solver's literals */

typedef struct {
    int *d;                         /* the entries of the list */
    int n, cap;
    char spare[16];                 /* room for a second list: 32 bytes per header */
} list;

static list *lists;
static uint64_t *mark;              /* bit i: list i may be non-empty */
static long reads;                  /* work counter: list headers read */

/* Counts the "dead" entries (odd ones), standing for deleted clauses */
static long count_all(void)
{
    long dead = 0;

    for (unsigned i = 0; i < N; i++) {              /* all the lists, empty ones included */
        reads++;
        for (int k = 0; k < lists[i].n; k++)
            dead += lists[i].d[k] & 1;
    }
    return dead;
}

static long count_marked(void)
{
    long dead = 0;

    for (unsigned word = 0; word < N / 64 + 1; word++)
        for (uint64_t bits = mark[word]; bits; bits &= bits - 1) {      /* bits set to 1 */
            unsigned i = word * 64 + __builtin_ctzll(bits);

            reads++;
            for (int k = 0; k < lists[i].n; k++)
                dead += lists[i].d[k] & 1;
        }
    return dead;
}

static double now(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned per_mille = argc > 1 ? (unsigned)atoi(argv[1]) : 90;     /* non-empty lists */
    int *pool = malloc(sizeof(int) * N * 3);
    uint64_t state = 88172645463325252ull;
    long expected, found = 0, taken = 0, forgotten = 0, reads_marked = 0;
    double best[2] = { 1e9, 1e9 };

    lists = calloc(N, sizeof(list));
    mark = calloc(N / 64 + 1, sizeof(uint64_t));
    if (!pool || !lists || !mark)
        return 1;
    for (unsigned i = 0; i < N; i++) {
        state ^= state << 13;                       /* xorshift: a pseudo-random draw */
        state ^= state >> 7;
        state ^= state << 17;
        if (state % 1000 < per_mille) {             /* non-empty list, with 1 to 3 entries */
            lists[i].n = 1 + (int)(state / 1000 % 3);
            lists[i].d = pool + taken;
            for (int k = 0; k < lists[i].n; k++)
                pool[taken++] = (int)(state >> (8 * k + 8));
            mark[i / 64] |= 1ull << (i % 64);       /* invariant: non-empty implies marked */
        }
    }
    expected = count_all();
    for (int round = 0; round < 5; round++) {       /* 5 alternating rounds, the best counts */
        double t0 = now();
        double elapsed;

        found = count_all();
        elapsed = now() - t0;
        best[0] = elapsed < best[0] ? elapsed : best[0];
        t0 = now();
        reads = 0;
        found = count_marked();
        elapsed = now() - t0;
        best[1] = elapsed < best[1] ? elapsed : best[1];
        reads_marked = reads;
    }
    printf("%.1f %% of lists are non-empty\n", per_mille / 10.0);
    printf("all the lists:    %5.1f ms, %ld headers read\n", best[0] * 1e3, (long)N);
    printf("marked lists:     %5.1f ms, %ld headers read, same result: %s\n",
           best[1] * 1e3, reads_marked, found == expected ? "yes" : "NO");
    for (unsigned i = 0; i < N; i += 1000)          /* bug: forgets 1 mark in 1000 */
        if (lists[i].n && (mark[i / 64] >> (i % 64) & 1)) {
            mark[i / 64] &= ~(1ull << (i % 64));
            forgotten++;
        }
    printf("with %ld forgotten marks: %ld dead entries instead of %ld\n",
           forgotten, count_marked(), expected);
    return 0;
}
```

```
1.0 % of lists are non-empty
all the lists:     14.2 ms, 13600000 headers read
marked lists:       3.7 ms, 135940 headers read, same result: yes
with 129 forgotten marks: 135683 dead entries instead of 135817
```

The same measurement for several proportions of non-empty lists (best of 5 alternating rounds, machine at rest):

| Non-empty lists | All the lists | Marked lists | Ratio |
|---|---|---|---|
| 0.1% | 7.6 ms | 0.6 ms | ×13 |
| 1% | 14.2 ms | 3.8 ms | ×3.7 |
| 9% | 22.4 ms | 25.1 ms | ×0.9 |
| 30% | 44.2 ms | 31.4 ms | ×1.4 |

The gain is not guaranteed: it depends on the proportion of elements that have work to do. At 9%, going from one marked list to the next is a random access in a 435 MB array, as costly as reading all the lists in one sweep; a continuous read is partly helped by the processor's prefetching (probable explanation, not isolated here). In the solver, the bitmap is thus used in two places: propagation skips empty lists (91% of propagations meet one: 2.0 s against 1.58 s at 48 × 48, same counters), and the purge visits only marked lists (33.9 s against 35.1 s at 96 × 96, 3.3% less, identical search).

> **Pitfall:** the bitmap is a **contract**. A 0 bit must guarantee that the element is empty; a 1 bit guarantees nothing (it is reset to 0 later). Forgetting to mark an element produces no error: the last line of the output shows that 129 forgotten marks make 134 of the 135,817 dead entries go missing, with no message at all. Check any optimization of this kind by comparing with the full scan on small cases.

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
| Repeated computation on an input that changes little | Starts from scratch on every call | Reuses the previous result, falling back to the full computation if the result must stay identical |
| Loop over millions of elements, almost none with work to do | Visits every element | Visits only the elements marked in a bitmap |

In the first four cases, the gain doesn't come from a computation made faster, but from a computation **that never happened**, because nothing could have changed its result. In the last two, the computation does happen, but it only covers what changed (the previous result reused) or what is marked (the bitmap).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Never recompute a result that nothing could have changed since it was last computed: memoization, incremental reprocessing, or dirty rectangles all apply the same idea at different scales. A file cache adds two techniques: atomic writes (never a half-written read) and stale-while-revalidate (answer fast, recompute behind the scenes). When the computation is unavoidable (nothing to cache), progressive HTTP streaming is the only way left to improve perceived wait time. Two variants for heavy computations: reusing the previous result (incremental computation, falling back to the full computation when the result must stay identical) and visiting only the elements marked in a bitmap. |
| **Tools you can use** | An in-memory cache per input (memoization), a progress marker to only reprocess what's new, a "light" comparison before an expensive check, `rename()`/`os.replace()` for an atomic write, an anti-concurrency lock for a background recomputation, `flush()`/`ob_end_flush()` for progressive HTTP streaming. A work counter to check that two versions give the same verdicts, `__builtin_ctzll` to walk through the 1 bits. |
| **Pitfalls to avoid** | Memoizing without identifying what would invalidate the result: a cache that's never invalidated becomes a source of stale data. Writing directly to a cache file read by other processes. Applying stale-while-revalidate without an anti-concurrency lock. Streaming an HTTP response without checking that no intermediate proxy puts its own buffer back in place. Reusing a stale starting point; letting what depends on the starting point leak; forgetting a mark in a bitmap (no error, lost results). |
| **Best practices** | Always define the invalidation condition before memoizing; distinguish avoidable recomputation (this principle) from a deliberate protective pause (to keep); write a cache file through a renamed temporary file; only make the user wait on the very first call with no cache; stream the HTTP response as soon as a long, unavoidable computation produces results progressively. Profile first: the function's share of the total time bounds the gain; check that an incremental or filtered version gives the same answers as the full computation. |
