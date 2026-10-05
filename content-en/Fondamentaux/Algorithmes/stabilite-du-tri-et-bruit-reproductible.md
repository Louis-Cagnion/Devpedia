---
order: 2.5
---

# Sort Stability, Ties and Reproducible Noise (xorshift)

Sorting means putting elements in order. But what happens when **several elements are equal** for the chosen criterion? Their order relative to each other can change from one machine to another, from one library to another, even from one run to another: the result can no longer be reproduced. This chapter shows how to observe it, how to prevent it, and how to build a small **reproducible random noise** that creates plenty of ties to break.

| Notion | Question it answers |
|---|---|
| Tie in a sort | In what order do two elements that the criterion cannot tell apart come out? |
| Stability | Does the sort guarantee that they keep their arrival order? |
| Tiebreak by index | How do we get the same result with **any** sort? |
| xorshift generator | How do we produce "random" numbers that we can replay identically? |

## Ties: what happens to the order?

Eight students are sorted by grade. Several have the same grade: the criterion (the grade) says nothing about the order of **Alice**, **Chloé** and **Emma**, who all have 12.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *name; int grade; } student;

/* Compares two students by grade only: two equal grades are "equal" for the sort. */
static int by_grade(const void *a, const void *b)
{
    const student *x = a, *y = b;
    return (x->grade > y->grade) - (x->grade < y->grade);
}

int main(void)
{
    student class_list[] = {
        {"Alice", 12}, {"Bruno", 15}, {"Chloé", 12}, {"David", 15},
        {"Emma", 12}, {"Farid", 9}, {"Gaëlle", 15}, {"Hugo", 9},
    };
    int n = sizeof class_list / sizeof class_list[0];

    qsort(class_list, n, sizeof class_list[0], by_grade);
    for (int i = 0; i < n; i++)
        printf("%2d  %s\n", class_list[i].grade, class_list[i].name);
    return 0;
}
```

Output:

```
 9  Farid
 9  Hugo
12  Alice
12  Chloé
12  Emma
15  Bruno
15  David
15  Gaëlle
```

Here, the tied students stayed in their original order (Alice before Chloé before Emma). A sort that guarantees this is called **stable** (see [comparison sorting](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) for the definition and the stable algorithms). The important question is: **is it a guarantee, or a stroke of luck?**

| A sort that is... | What we are entitled to expect for two equal elements |
|---|---|
| **stable** | They come out in their original order, always |
| **not stable** | They can come out in any order, and that order can change with the size of the data or the implementation |

## `qsort` promises nothing

`qsort` is the sort function of the standard library of the [C](/?c=langages-de-programmation&s=c&p=c) language (`#include <stdlib.h>`). It receives the array, the number of elements, the size of an element and a **comparison function** (a [function pointer](/?c=langages-de-programmation&s=c&p=pointeurs)) that answers "smaller", "equal" or "greater".

| `qsort` argument | Role |
|---|---|
| `base` | Start of the array to sort |
| `nmemb` | Number of elements |
| `size` | Size of one element in bytes (`sizeof class_list[0]`) |
| `compar` | The comparison function: negative if `a` goes before `b`, 0 if equal, positive otherwise |

The C standard is explicit: if two elements are equal for `compar`, **their order in the result is unspecified** (see the manual page [`qsort(3)`](https://man7.org/linux/man-pages/man3/qsort.3.html)). Nothing forces the implementation to be stable.

The following program sorts 1,200,000 **indices** (0, 1, 2, ...) by a key that has only 1,000 possible values: there are ties everywhere. It then counts, among neighbors with the same key, how many are out of order (the index goes backwards). It also computes a **fingerprint** ([FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)), a number computed from the whole result: two different orders almost surely give two different fingerprints. Compiled with `gcc -Wall -Wextra -O2` (see [compilation](/?c=langages-de-programmation&s=c&p=compilation)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>

static const int *g_key;      /* the key of each element: g_key[i] */
static int g_tiebreak;        /* 1: break ties between equals by their index */

/* Compares two INDICES i and j by their key; on a tie, the index decides if requested. */
static int by_key(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;

    if (g_key[i] != g_key[j])
        return g_key[i] < g_key[j] ? -1 : 1;
    if (g_tiebreak)
        return (i > j) - (i < j);
    return 0;
}

/* Size of the process's address space, in bytes (1st field of /proc/self/statm, in pages). */
static size_t memory_size(void)
{
    unsigned long pages = 0;
    FILE *f = fopen("/proc/self/statm", "r");

    if (f) {
        if (fscanf(f, "%lu", &pages) != 1)
            pages = 0;
        fclose(f);
    }
    return pages * 4096;
}

int main(int argc, char **argv)
{
    if (argc < 3) {
        fprintf(stderr, "usage: %s n tiebreak [margin]\n", argv[0]);
        return 1;
    }
    int n = atoi(argv[1]);
    g_tiebreak = atoi(argv[2]);
    size_t margin = argc > 3 ? strtoull(argv[3], NULL, 10) : 0;
    int *key = malloc(sizeof(int) * n), *ord = malloc(sizeof(int) * n);
    uint64_t x = 88172645463325252ull;    /* state of a pseudo-random generator (see below) */

    for (int i = 0; i < n; i++) {
        x ^= x << 13; x ^= x >> 7; x ^= x << 17;
        key[i] = x % 1000;                /* many elements, only 1000 keys: ties everywhere */
        ord[i] = i;                       /* ord = the indices 0, 1, 2... that we will sort by their key */
    }
    g_key = key;
    if (margin) {                         /* caps the memory: allows only `margin` more bytes */
        struct rlimit rl = { memory_size() + margin, memory_size() + margin };
        setrlimit(RLIMIT_AS, &rl);
    }
    qsort(ord, n, sizeof(int), by_key);

    long disorder = 0;
    uint64_t fingerprint = 1469598103934665603ull;
    for (int i = 0; i + 1 < n; i++)       /* two neighbors with the same key whose index goes backwards: disorder */
        if (key[ord[i]] == key[ord[i + 1]] && ord[i] > ord[i + 1])
            disorder++;
    for (int i = 0; i < n; i++) {         /* fingerprint (FNV-1a) of the resulting order, to compare two runs */
        fingerprint ^= (uint64_t)ord[i];
        fingerprint *= 1099511628211ull;
    }
    printf("tiebreak=%d margin=%-8zu: %7ld equals out of order, fingerprint %016llx\n",
           g_tiebreak, margin, disorder, (unsigned long long)fingerprint);
    return 0;
}
```

The third argument uses `setrlimit(RLIMIT_AS, ...)` ([manual page](https://man7.org/linux/man-pages/man2/setrlimit.2.html)): it caps the memory the program can still request. The runs, on Ubuntu 24.04 with glibc 2.39:

```
$ ./stability 200 0
$ ./stability 1200000 0
$ ./stability 1200000 0 5000000
$ ./stability 1200000 0 4000000
$ ./stability 1200000 1
$ ./stability 1200000 1 4000000
```

```
tiebreak=0 margin=0       :       0 equals out of order, fingerprint a3b5c48d1a634d39
tiebreak=0 margin=0       :       0 equals out of order, fingerprint 361e06153f2ad04f
tiebreak=0 margin=5000000 :       0 equals out of order, fingerprint 361e06153f2ad04f
tiebreak=0 margin=4000000 :  712247 equals out of order, fingerprint dd7fa0798a809adf
tiebreak=1 margin=0       :       0 equals out of order, fingerprint 361e06153f2ad04f
tiebreak=1 margin=4000000 :       0 equals out of order, fingerprint 361e06153f2ad04f
```

| Run | Result | What it shows |
|---|---|---|
| 200 elements, no tiebreak | 0 out of order | On a small input, `qsort` seems stable |
| 1,200,000 elements, free memory | 0 out of order | On a large input too: glibc 2.39 uses a merge sort here |
| memory capped at 5 MB more | 0 out of order, same fingerprint | There is enough room left for the buffer |
| memory capped at 4 MB more | **712,247 equals out of order**, different fingerprint | The **same program**, the same data: a different order |
| with tiebreak (last argument `1`) | 0 out of order, **same fingerprint** in both cases | The order no longer depends on memory |

Why? Observed with `strace` (which lists the calls to the operating system): during the sort, `qsort` reserves a buffer of **4,800,512 bytes**, the size of the array (1,200,000 integers of 4 bytes), which it frees right after. A merge sort needs this working space. When the available memory is smaller than the array, the request fails and `qsort` falls back to another sort, with no buffer, which is **not stable** (this is what the 712,247 out-of-order line measures). The result therefore depends on the machine's memory, not only on your data.

## Breaking ties by the original index

The countermeasure does not depend on any implementation: **make the elements all different**. We sort indices (or elements that carry their original number), and when two keys are equal, the comparator settles it with the index:

```c
static int by_key(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;     /* the two indices being compared */

    if (g_key[i] != g_key[j])                         /* different keys: the key decides */
        return g_key[i] < g_key[j] ? -1 : 1;
    return (i > j) - (i < j);                         /* equal keys: the original index decides */
}
```

| Code element | Role |
|---|---|
| `const void *a` | `qsort` does not know the type of the elements: the comparator receives untyped addresses and must convert them (`(const int *)a`) |
| `(i > j) - (i < j)` | Returns -1, 0 or 1 without a subtraction: writing `i - j` could overflow for large numbers |
| `g_key` | The `qsort` comparator has no extra parameter: the key is read from a global array (with several [threads](/?c=langages-de-programmation&s=c&p=threads), each thread needs its own variable) |

After this change, two elements are **never equal** for the comparator: there is no longer any case where the implementation gets to choose. The result is the same for all sorts, stable or not, and for all runs (as the last two lines of the table above show). It costs almost nothing: one more test when the keys are equal.

| | Stable because the implementation is | Stable because we built it so |
|---|---|---|
| Guarantee | None from the C standard | Yes, by construction |
| Depends on | The library, its version, the free memory | Nothing |
| Condition | None | Having an original number to compare (an index, an arrival counter) |

## A real case: a solver's starting queue

A [SAT solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) that solves a 108 × 108 grid handles about **1.2 million variables**. At the start, it ranks them in a queue ([VMTF](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): it tries the variables in the order of this queue). So that each copy of the solver explores differently, we add a small **noise** to each variable: a tiny random number that perturbs the ranking. This noise has only 1,000 possible values for 1.2 million variables: about **1,200 variables share each value**, so each value is a tie among 1,200 elements.

Without a tiebreak, the order of these ties is whatever `qsort` happens to produce: the starting queue, and therefore the whole search that follows, can change if the machine or the memory changes. With a tiebreak by increasing index, the same seed gives **the same** queue every time, and two versions of the program can compare their counters line by line. The research prototype only compares the scores and benefits from the stability of the machine's glibc; a rewrite must add the tiebreak by index rather than rely on it.

## Reproducible noise: xorshift

A **pseudo-random generator** is a formula that, from a starting number (the **seed**), produces a sequence of numbers that *look like* randomness but is **entirely determined**: the same seed gives exactly the same sequence. This is exactly what we need for a noise that we want to be able to **replay** (find a result again, compare two versions). The **state** of the generator is the number it keeps in memory between two draws.

**xorshift64** ([Marsaglia, 2003](https://www.jstatsoft.org/article/view/v008i14)) is a very short version: three bit shifts and three "exclusive or" operations ([bitwise operators](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

```c
#include <stdint.h>
#include <stdio.h>

/* One step of xorshift64: mixes the 64 bits of the state with three shifts and three XORs,
   stores the result as the new state and returns it. */
static uint64_t xorshift64(uint64_t *state)
{
    uint64_t x = *state;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *state = x;
}

int main(void)
{
    uint64_t a = 42, b = 42, zero = 0, one = 1, two = 2;

    printf("same seed (42), two generators:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&a), (unsigned long long)xorshift64(&b));

    printf("seed 0:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu\n", (unsigned long long)xorshift64(&zero));

    printf("neighboring seeds 1 and 2, first draw:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&one), (unsigned long long)xorshift64(&two));

    one = 0x9E3779B97F4A7C15ull * 1;      /* the seed is first multiplied by a large constant */
    two = 0x9E3779B97F4A7C15ull * 2;
    printf("same seeds multiplied by 0x9E3779B97F4A7C15:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&one), (unsigned long long)xorshift64(&two));
    return 0;
}
```

Output:

```
same seed (42), two generators:
           45454805674           45454805674
  11532217803599905471  11532217803599905471
  10021416941527320954  10021416941527320954
seed 0:
                     0
                     0
                     0
neighboring seeds 1 and 2, first draw:
            1082269761            2164539522
same seeds multiplied by 0x9E3779B97F4A7C15:
  15860402102123842989  13274060130538134362
```

| Code element | Role |
|---|---|
| `uint64_t` | 64-bit unsigned integer: the state has 2^64 possible values |
| `x ^= x << 13` | Shifts the bits of `x` 13 positions to the left, then mixes with the old `x` by exclusive OR (`^`) |
| `return *state = x` | The new state **is** the returned value |
| `0x9E3779B97F4A7C15` | Large constant (the integer part of 2^64 divided by the golden ratio) that spreads neighboring seeds apart |

What the output shows:

| Observation | Consequence |
|---|---|
| Two generators with the same seed give the same sequence | The noise is **reproducible**: one seed per process, and every run can be replayed |
| Seed 0 gives 0, 0, 0... | Zero is a **stuck** state: shifts of zero are zero. Never start from 0 |
| Seeds 1 and 2 give 1,082,269,761 then 2,164,539,522 | The first draw of seed 2 is **exactly double** that of seed 1: two neighboring seeds give linked beginnings, not independent ones |
| After multiplying by the constant | The first draws no longer have any visible relation to each other |

Hence the line in the solver's version: `x = 0x9E3779B97F4A7C15 * seed`, then draws. The multiplication turns 1, 2, 3... into states far apart from each other.

### From the 64-bit number to noise from 0 to 999

The following program draws 1,200,000 noises `x % 1000` (the **remainder** of the division by 1,000, a number from 0 to 999) and checks that the 1,000 values come out about equally often, with the **χ² test** described in [Comparing two settings](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages): for 1,000 values, an honest result is about 999, give or take 45.

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t xorshift64(uint64_t *state)
{
    uint64_t x = *state;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *state = x;
}

int main(void)
{
    enum { N = 1200000, VALUES = 1000 };
    static int count[VALUES];             /* count[v]: how many variables received the noise v */

    for (uint64_t seed = 1; seed <= 3; seed++) {
        uint64_t state = 0x9E3779B97F4A7C15ull * seed;
        double expected = (double)N / VALUES, chi2 = 0;
        int distinct = 0, largest = 0;

        memset(count, 0, sizeof count);
        for (int i = 0; i < N; i++)
            count[xorshift64(&state) % VALUES]++;      /* the noise: a number from 0 to 999 */
        for (int v = 0; v < VALUES; v++) {
            distinct += count[v] > 0;
            if (count[v] > largest)
                largest = count[v];
            chi2 += (count[v] - expected) * (count[v] - expected) / expected;
        }
        printf("seed %llu: %d distinct values, largest group %d, chi2 = %.1f\n",
               (unsigned long long)seed, distinct, largest, chi2);
    }
    printf("2^64 mod 1000 = %llu\n", (unsigned long long)((UINT64_MAX % VALUES + 1) % VALUES));
    return 0;
}
```

Output:

```
seed 1: 1000 distinct values, largest group 1304, chi2 = 942.1
seed 2: 1000 distinct values, largest group 1323, chi2 = 1044.4
seed 3: 1000 distinct values, largest group 1319, chi2 = 1052.4
2^64 mod 1000 = 616
```

| Measure | Value | Reading |
|---|---|---|
| Distinct values | 1,000 out of 1,000 | All the values come out |
| Largest group | 1,304 to 1,323, for an average of 1,200 | This is indeed the order of magnitude of **1,200 ties per value** |
| χ² | 942 to 1,052 (expected 999 ± 45) | The deviations are those of chance: the remainder of the division by 1,000 is uniform in practice |
| 2^64 mod 1000 | 616 | These 616 values come out once more than the others out of about 1.8 × 10^16 possible draws: a bias of the order of 10^-16, with no effect |

> **Limitation:** xorshift is **not** made for security (the returned value is the state itself: a single known draw lets you predict all the following ones) nor for demanding statistical simulations. For a noise that perturbs a ranking or diversifies copies of a program, it is more than enough. The C library's `rand()` would also make a noise, but the standard does not fix its algorithm: the sequence for a given seed can change from one library to another.

## The pitfalls

| Pitfall | What happens | Remedy |
|---|---|---|
| Relying on the stability of `qsort` | Works as long as memory is sufficient (glibc 2.39), then the order of equals changes with no error or message | Break ties by the original index in the comparator |
| Testing stability on a small input | 200 elements seem stable: the test says nothing about the case of 1.2 million | Test at the real size, and with capped memory |
| Comparator `return a - b` | Overflows for large numbers: wrong order with no message | `(a > b) - (a < b)` |
| Seed 0 with xorshift | The sequence stays 0 forever | Multiply the seed by an odd constant and reject 0 |
| Neighboring seeds left unmixed | Linked beginnings of sequences (double of each other) | Multiply the seed by `0x9E3779B97F4A7C15` |
| Using xorshift for a secret | One known draw gives all the following ones | A cryptographic generator ([`getrandom`](https://man7.org/linux/man-pages/man2/getrandom.2.html)) |
| Trusting a noise without testing it | A badly chosen generator or `% n` can unbalance the values | Check uniformity with a χ² test |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | A sort is **stable** if it keeps the arrival order of equal elements. `qsort` does not guarantee it (C standard): glibc 2.39 uses a merge sort as long as a buffer the size of the array is available, then switches to an unstable sort (712,247 equals out of order on 1.2 million elements with capped memory). A comparator that breaks ties by the original index gives the same result with every sort. xorshift64 (three shifts, three XORs) produces a noise that is reproducible per seed. |
| **Tools you can use** | `qsort` with a comparator that breaks ties by index, a fingerprint (FNV-1a) to compare two orders, `setrlimit(RLIMIT_AS)` to test under limited memory, `strace` to observe the `qsort` buffer, xorshift64 with the seed multiplied by `0x9E3779B97F4A7C15`, the χ² test to check uniformity. |
| **Pitfalls to avoid** | Trusting the observed stability of a `qsort`, testing it on a small input, a comparator based on subtraction, seed 0, neighboring seeds left unmixed, xorshift for a secret. |
| **Best practices** | Never let the result depend on how a sort treats ties: break them explicitly. One seed per run, printed or fixed, so that it can be replayed. Check at the real size. |
