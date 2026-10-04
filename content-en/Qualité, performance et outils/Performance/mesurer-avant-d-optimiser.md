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

### Pitfall: time credited to the wrong function

With optimization (`-O2`), the compiler can **inline** a function into its caller (it copies its body in place of the call) or create a **specialized copy** of it under another name. `gprof` then credits its time to another function. Test program:

```c
#include <stdio.h>

#ifdef NO_INLINING
# define INLINABLE __attribute__((noinline))         /* forbids inlining */
#else
# define INLINABLE
#endif

static INLINABLE double slow_sum(long n)
{
    double s = 0;

    for (long i = 1; i <= n; i++)
        s += 1.0 / (double)i;                        /* the real work is here */
    return s;
}

int main(void)
{
    double total = 0;

    for (int k = 0; k < 20; k++)
        total += slow_sum(20000000);                 /* 20 calls to the slow function */
    printf("%.3f\n", total);
    return 0;
}
```

| Build (`cc -O2 -pg`) | What `gprof -b -p` shows | What really happened |
|---|---|---|
| As is | 100% of the time in `main` | `slow_sum` was inlined into `main`: it no longer exists as a function |
| With `-DNO_INLINING` | 100% in `frame_dummy`, a single call | GCC created a copy `slow_sum.constprop.0` (with the constant argument baked in), which `gprof` does not show: it credits the function placed just before it in memory, a program startup routine. And the call, which has no side effects, is made only once instead of 20 times |

`nm -n program` (the program's symbols sorted by address) shows the real culprit, right after it:

```
0000000000001240 t frame_dummy
0000000000001250 t slow_sum.constprop.0
```

The call graph (`gprof -q`) fixes nothing: it reuses the same names. `valgrind --tool=callgrind` does name the copy (99.7% of instructions in `slow_sum.constprop.0`). Seen on a SAT solver: `gprof` credited 11% of the time to `now()`, a small clock-reading function, when it actually belonged to `cancel_until`.

## Where the Program Misses the Cache: `cachegrind`

A profiler tells you **where** the time goes, not **why**. When memory is the culprit (see [The cache hierarchy](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#the-cache-hierarchy)), [`cachegrind`](https://valgrind.org/docs/manual/cg-manual.html), a Valgrind tool, runs the program on a **simulated** processor and counts, per function and per line, the data reads and the **cache misses** (a piece of data absent from the cache, which has to be fetched from further away).

Test program: the same array traversed in two different orders.

```c
#include <stdio.h>
#include <stdlib.h>
#define N 4096                                   /* array of 4096 x 4096 ints: 64 MB */

/* noinline: keeps two separate functions in the profile (see the pitfall above) */
__attribute__((noinline)) static long sum_rows(const int *t)
{
    long s = 0;

    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            s += t[i * N + j];                   /* neighbouring cells in memory */
    return s;
}

__attribute__((noinline)) static long sum_columns(const int *t)
{
    long s = 0;

    for (int j = 0; j < N; j++)
        for (int i = 0; i < N; i++)
            s += t[i * N + j];                   /* jump of N ints at each access */
    return s;
}

int main(void)
{
    int *t = malloc(sizeof(int) * N * N);

    for (long k = 0; k < (long)N * N; k++)
        t[k] = 1;
    printf("%ld %ld\n", sum_rows(t), sum_columns(t));
    free(t);
    return 0;
}
```

```bash
gcc -O2 -g traversal.c -o traversal                      # -g: line numbers in the report
valgrind --tool=cachegrind --cache-sim=yes ./traversal   # writes cachegrind.out.<number>
cg_annotate cachegrind.out.<number>                      # report per function, then per line
```

| Function | Reads (`Dr`) | L1 cache misses (`D1mr`) | Last-level misses, fetched from RAM (`DLmr`) | Real time, without Valgrind |
|---|---|---|---|---|
| `sum_rows` | 4.2 M | 1.0 M | 1.0 M | 3.8 ms |
| `sum_columns` | 16.8 M | 16.8 M | 16.8 M | 105 ms |

`sum_rows` reads 4 ints per instruction (the compiler grouped the reads) and only misses the cache once per 64-byte [cache line](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#cache-lines-contiguous-memory-is-free), i.e. 16 ints. `sum_columns` jumps 16 KB at each read: every read misses the cache, and the function is 28 times slower for the same computation.

| Pitfall | What happens | Remedy |
|---|---|---|
| Forgetting `--cache-sim=yes` | Since Valgrind 3.21, cache simulation is off by default: the report only counts instructions (`Ir`), which don't show the gap (84 M for `sum_columns` against 46 M, for a time 28 times longer) | Always pass `--cache-sim=yes` |
| Sources modified after the profile | `cg_annotate` rereads the current sources: it warns (`Annotations may not be correct`) but still shows the counts, shifted by as many lines as were added or removed | Redo the profile after any change |
| Cache simulated for a single program, without the processor's prefetching | Sharing of the L3 cache between programs running at the same time doesn't show; the real processor guesses and loads in-order reads in advance, which the simulation ignores: `sum_rows`'s misses cost far less there than their number suggests | Treat the counts as an order of magnitude, confirmed by a real measurement |

Lived on the SAT solver: `cachegrind` showed that 61% of the write cache misses came from a single array (each variable's level and reason, rewritten at every assignment), a lead that no per-function profile gave. Yet prefetching this array ahead of time gained nothing (+0.4% and +1.0% over two measurements): the processor already absorbs these write misses in its write buffer, and a cache miss only costs something if it makes the processor wait.

## Timing a Part of a Loop: the Cycle Counter

`clock_gettime` ([Measuring a duration](/?c=langages&s=c&p=mesure-du-temps#measuring-a-duration-clock-gettime-clock-monotonic)) times a whole operation well. To know the **share** of a few lines run millions of times, a lighter measurement is needed: the processor's **Time Stamp Counter** (TSC), which advances at a fixed frequency and is read in a single instruction, `rdtsc`, available in C as [`__rdtsc()`](https://gcc.gnu.org/onlinedocs/gcc/x86-Built-in-Functions.html).

```c
#include <stdio.h>
#include <stdlib.h>
#include <x86intrin.h>                           /* __rdtsc, _mm_lfence (x86 only) */
#define N (1 << 24)                              /* 16 M ints: 64 MB, more than the cache */

#ifdef FENCE
/* waits for the previous instructions to finish before reading the counter */
# define CYCLES() (_mm_lfence(), __rdtsc())
#else
# define CYCLES() __rdtsc()
#endif

int main(int argc, char **argv)
{
    int empty = argc > 1 && argv[1][0] == 'e';    /* ./portion empty: part B without work */
    int *t = malloc(sizeof(int) * N);
    unsigned long long in_b = 0, x = 1;
    long s = 0;

    for (int k = 0; k < N; k++)
        t[k] = k;
    unsigned long long start = CYCLES();
    for (int k = 0; k < N; k++) {
        s += t[k];                               /* part A: in-order read */
        unsigned long long t0 = CYCLES();
        if (!empty) {
            x = x * 6364136223846793005ULL + 1;  /* part B: a randomly drawn cell */
            s += t[x >> 40];
        }
        in_b += CYCLES() - t0;
    }
    unsigned long long total = CYCLES() - start;
    printf("sum %ld: share of B %.0f %%, %.0f cycles per pass through B\n",
           s, 100.0 * in_b / total, (double)in_b / N);
    free(t);
    return 0;
}
```

```bash
gcc -O2 portion.c -o portion                  # plain counter read
gcc -O2 -DFENCE portion.c -o portion_f        # a fence before each read
./portion ; ./portion empty ; ./portion_f ; ./portion_f empty
```

| Counter read | Real part B | Empty part B |
|---|---|---|
| `__rdtsc()` alone | 22% of the time, 26 cycles per pass | 50%, 25 cycles |
| `_mm_lfence()` then `__rdtsc()` | 87%, 318 cycles | 49%, 46 cycles |

Without a fence, part B seems to cost nothing more than an empty part. The processor indeed runs instructions **out of order**: it starts the next ones without waiting for the previous ones to finish, and `rdtsc` reads the counter before part B's RAM read has completed. That cost is paid **after** the measurement, in part A. `_mm_lfence()`, a **fence**, waits for the previous instructions to finish: part B then costs 318 − 46 ≈ 270 cycles, the order of magnitude of a RAM access given by [the cache hierarchy](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#the-cache-hierarchy).

| Pitfall | Remedy |
|---|---|
| Reading the counter without a fence: work started inside the measured part is paid after it | `_mm_lfence()` before each counter read |
| The measurement itself has a cost (25 to 46 cycles per pass here): a very short part looks more expensive than it is | Also measure an empty part, and subtract its cost |
| The counter advances at a fixed frequency, not at the real pace of the core, which varies with load and temperature | Reason in shares of a total measured the same way, not in absolute cycles |
| `__rdtsc()` only exists on x86 processors (Intel, AMD) | `clock_gettime(CLOCK_MONOTONIC)` on other processors |

Lived on the SAT solver: this instrumentation put a test added to the search at about 7% of the time, i.e. the maximum gain a faster version of this test could bring; the rewritten version gained 6.2%.

## Comparing on Work Counters, Not Only on Time

Two identical runs of the same program can differ by **±15%** on a laptop (processor frequency, temperature). A 5% gain measured with a stopwatch is then invisible in the noise. When the program can count its **work** (nodes explored, conflicts, propagations), these counters are **deterministic**: identical from one run to the next.

| What you observe | What it means |
|---|---|
| Identical counters, shorter time | The change speeds up the same work: a pure speed gain |
| Lower counters | The change reduces the work itself (better search) |
| Different counters, time within the noise | Nothing conclusive: measure on more instances |

## Checking That Two Versions Do the Same Work, Before Timing Them

An optimization with **identical work** (rewriting code so it runs faster, without changing anything it computes) is checked **before** any time measurement. If the two versions don't do exactly the same work, the time gap mixes speed and work, and may hide a bug (see [Measure afterward too](#measure-afterward-too)).

| Step | What it checks |
|---|---|
| 1. Same results and same counters, on many varied inputs | The change doesn't modify the work |
| 2. Only then, the time measurement (in alternating rounds, next section) | The same work goes faster |

To automate step 1, the program writes what is deterministic (result, counters) to standard output, and what varies from one run to the next (time) to [standard error](/?c=langages&s=bash&p=redirections-et-pipes#redirecting-standard-error). A script then compares the two versions input by input:

```bash
ok=0; total=0
for size in 8 16 24 32 40; do
    for seed in 1 2 3; do                                  # seed: fixes the randomness
        ./old "$size" "$seed" > a.txt 2> /dev/null         # result and counters only
        ./new "$size" "$seed" > b.txt 2> /dev/null
        total=$((total + 1))
        if cmp -s a.txt b.txt; then                        # cmp -s: exit code 0 if identical
            ok=$((ok + 1))
        else
            echo "difference: size $size, seed $seed"
        fi
    done
done
echo "$ok/$total identical"
```

[`cmp`](https://man7.org/linux/man-pages/man1/cmp.1.html) compares two files byte by byte; `-s` makes it silent, only its [exit code](/?c=langages&s=bash&p=scripts-et-shebang#exit-codes-exit) counts. `$((...))` does [arithmetic](/?c=langages&s=bash&p=variables#arithmetic) in Bash.

Lived on the SAT solver: every speed optimization first passes 49 checks of this kind (8 settings in a single process on grids from 8 to 40 cells per side, plus the parallel mode and a self-test), and time measurement only starts at 49 out of 49.

## Measuring in Alternating Rounds

Even with identical work, time still has to be measured, and the machine **drifts** during the measurement: temperature, processor frequency, another program started in the meantime. Measuring all runs of A, then all runs of B, attributes that drift to the difference between A and B (see also [The single-measurement pitfall](#the-single-measurement-pitfall)).

| Order of measurements | If the machine slows down along the way |
|---|---|
| A, A, A, then B, B, B | B looks slower than A, through no fault of its own |
| A, B, then A, B (alternating rounds) | The drift affects A and B equally, and the gap between two rounds of the same version shows the noise |

Real example on the SAT solver: 3 grids, mean time per grid, a reference version and three variants whose counters had already been checked identical (previous section), machine at rest (no compilation or other computation during the measurement).

| Version | Round 1 | Round 2 | Gap to the reference of the same round |
|---|---|---|---|
| Reference | 33.8 s | 32.6 s | (comparison baseline) |
| Variant a | 33.0 s | 31.4 s | −2.4% then −3.9% |
| Variant b2 | 33.5 s | 32.1 s | −1.1% then −1.6% |
| Variant b1 | 33.0 s | 32.7 s | −2.6% then +0.2% |

| Observation | Conclusion |
|---|---|
| The reference gains 3.6% between its two rounds, without any change | Comparing variant a of round 2 with the reference of round 1 would give −7.3%, twice its real gain |
| a and b2 gain in both rounds | Gains kept |
| b1 changes sign from one round to the next | Nothing conclusive: the gap is within the noise |

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
| **Key takeaways** | Never optimize without measuring first: intuition about "what's slow" generally targets code that looks complicated, not code that actually costs the most. Two versions are compared first on their results and counters, then only on time, in alternating rounds. |
| **Tools you can use** | A classic profiler (per function: `gprof`, `perf`, `valgrind --tool=callgrind`), manual per-phase instrumentation when the program spends its time waiting; deterministic work counters to compare two versions; `cachegrind` (`--cache-sim=yes`) for cache misses; `__rdtsc()` preceded by `_mm_lfence()` for the share of a part of a loop; `cmp -s` to compare two outputs. |
| **Pitfalls to avoid** | Trusting a single measurement: noise (network, cache, machine load) can exceed the actual effect of an optimization; trusting an unexpected function name in a `gprof` profile of an optimized program (check with `nm -n` or callgrind); `cachegrind` without `--cache-sim=yes`, or on sources modified since the profile; reading the cycle counter without a fence; measuring A then B in a block on a drifting machine. |
| **Best practices** | Always remeasure after an optimization (both time AND result accuracy); take several measurements to tell a real gain from noise; check that two versions do the same work before timing them; measure in alternating rounds, with the machine at rest. |
