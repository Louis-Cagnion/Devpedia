---
order: 12
---

# Matchings, the Hall Test and Régin Filtering

[Hall's theorem](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#hall-s-theorem-when-cells-block-each-other) explains why cells can block each other even though none of them, taken alone, has a problem. This chapter shows **how a program detects it**, then how it goes further: removing from a cell the values it will never be able to take. This is what the Skyscraper solver does on the nearly filled rows and columns of its grid (see the [SAT solvers](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)).

## The "all different" constraint

A row of a [Latin square](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) contains each value exactly once. Each cell has a **domain**: the list of values not yet excluded (see [constraint propagation](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#shrinking-domains-before-even-trying-constraint-propagation)). A rule such as "these cells take values that are all different" is called a **global constraint**: it covers several cells at once.

Simple propagation removes a value only when a cell is **fixed**: cell X1 is 2, so 2 disappears from the other cells. It misses deductions that require reasoning about a group:

| Cell | Domain | Possible deduction |
|---|---|---|
| X1 | 1 or 2 | |
| X2 | 1 or 2 | |
| X3 | 1, 2, 3 or 4 | X1 and X2 share 1 and 2: X3 can be neither 1 nor 2 |

No cell is fixed, so simple propagation sees nothing. Yet X3 is 3 or 4. A piece of code dedicated to this constraint, a [propagator](/?c=fondamentaux&s=algorithmes&p=encodages-sat#propagators-and-lazy-clause-generation), can make this reasoning.

## Drawing the problem: cells on one side, values on the other

A **graph** is a set of points joined by lines. Here there are two families of points: cells on the left, values on the right, and a line between a cell and each value of its domain. A graph whose points split into two families, with no line inside a family, is called **bipartite**.

| Cell | Domain = lines to values |
|---|---|
| A | 1, 2 |
| B | 1, 3 |
| C | 1 |
| D | 3, 4 |

A **matching** is a choice of lines that share no endpoint: each cell has at most one value, each value at most one cell. A **perfect matching** matches **every** cell: it is exactly one way of filling the row with values that are all different.

```
cells :     A    B    C    D
            │    │    │    │
values :    2    3    1    4        a perfect matching
```

| Vocabulary | Meaning |
|---|---|
| Matching | Lines with no shared endpoint |
| Perfect matching | One line for every cell |
| Holder of a value | The cell matched to that value |
| Hall set | A group of k cells whose domains together hold fewer than k values |

## Finding a matching: the augmenting path (Kuhn's algorithm)

Cells are placed one by one. When the wanted value is already taken, we do not give up: we **ask its holder to step aside**, if it can take another value; and that one may in turn ask another... The sequence of these moves is called an **augmenting path**: at the end, one more cell has a value. This method, known as Kuhn's algorithm, derives from the Hungarian method of [Kuhn (1955)](https://doi.org/10.1002/nav.3800020109).

| Step | Cell | What happens | Matching afterwards |
|---|---|---|---|
| 1 | A | Takes 1 | A=1 |
| 2 | B | Wants 1, held by A. A can take 2: A steps aside, B takes 1 | B=1 A=2 |
| 3 | C | Wants 1, held by B. B can take 3: B steps aside, C takes 1 | C=1 A=2 B=3 |
| 4 | D | Wants 3, held by B, which has no free value left (its value 1 is held by C, which has no other choice). Tries 4: free | C=1 A=2 B=3 D=4 |

Each domain is a **bit mask** (bit `v` is 1 if value `v` is possible; see [masks](/?c=langages&s=c&p=operateurs-binaires#masks-the-real-everyday-usefulness)): a `uint64_t` is enough for 64 values, and "take the smallest possible value" is a single instruction (`__builtin_ctzll`, see [walking through the 1 bits](/?c=langages&s=c&p=operateurs-binaires#walking-through-the-1-bits-compiler-built-in-functions)).

The code of this chapter goes into a header file named `matching.h`, which the following examples include.

```c
/* Cell / value matching, Hall test and Régin filtering.
   domain[i]: mask of cell i, bit v is 1 if value v is still possible.
   At most 64 cells and 64 values: a mask fits in a uint64_t. */
#include <stdint.h>

/* Looks for an augmenting path from cell i (Kuhn's algorithm).
   seen: values already tried during this search. */
static inline int augment(int i, const uint64_t *domain, int *holder, uint64_t *seen)
{
    uint64_t m;

    while ((m = domain[i] & ~*seen)) {          /* possible values not tried yet */
        int v = __builtin_ctzll(m);             /* the smallest of them */

        *seen |= 1ull << v;                     /* each value is tried only once */
        if (holder[v] < 0 || augment(holder[v], domain, holder, seen)) {
            holder[v] = i;                      /* i takes v; the previous holder has moved */
            return 1;
        }
    }
    return 0;
}

/* Matches the n cells to values that are all different.
   Returns -1 if everything is matched, otherwise the first cell without a value; *seen
   then holds the values the search reached: the Hall set. */
static inline int find_matching(int n, const uint64_t *domain, int *holder, uint64_t *seen)
{
    for (int v = 0; v < 64; v++)
        holder[v] = -1;
    for (int i = 0; i < n; i++) {
        *seen = 0;
        if (!augment(i, domain, holder, seen))
            return i;
    }
    return -1;
}
```

| Element | Role |
|---|---|
| `domain[i]` | Mask of the values still possible for cell `i` |
| `holder[v]` | The cell that holds value `v`, or -1 if it is free |
| `seen` | The values already tried during **this** search: a value is tried only once, which guarantees the search stops |
| `augment` | **Recursive** function (it calls itself, see [recursive insertion](/?c=langages&s=c&p=arbres-binaires#recursive-insertion)): it asks the holder to step aside |
| `find_matching` | Starts one search per cell; at the first failure, returns that cell and the values `seen` |

The program below replays the example from the previous table, cell by cell:

```c
#include <stdio.h>
#include "matching.h"

/* mask of the given values (from 1 to 5); 0 means "no value" */
static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void print_matching(const int *holder)
{
    for (int v = 0; v < 5; v++)                 /* the values go from 1 to 5 */
        if (holder[v] >= 0)
            printf(" %c=%d", 'A' + holder[v], v + 1);
    printf("\n");
}

static void try_case(const char *title, int n, const uint64_t *domain)
{
    int holder[64];
    uint64_t seen;

    for (int v = 0; v < 64; v++)
        holder[v] = -1;
    printf("%s\n", title);
    for (int i = 0; i < n; i++) {
        seen = 0;
        int ok = augment(i, domain, holder, &seen);         /* one cell at a time */

        printf("  cell %c: %-6s matching:", 'A' + i, ok ? "placed" : "FAILED");
        print_matching(holder);
        if (!ok) {
            printf("  values reached by the search: ");
            for (uint64_t m = seen; m; m &= m - 1)
                printf("%d ", __builtin_ctzll(m) + 1);
            printf("\n  cells that hold them, plus cell %c:", 'A' + i);
            for (uint64_t m = seen; m; m &= m - 1)
                printf(" %c", 'A' + holder[__builtin_ctzll(m)]);
            printf("\n");
            return;
        }
    }
}

int main(void)
{
    /* A: 1 or 2   B: 1 or 3   C: 1 only   D: 3 or 4 */
    uint64_t one[4] = { M(1, 2, 0, 0), M(1, 3, 0, 0), M(1, 0, 0, 0), M(3, 4, 0, 0) };
    /* A, B and C: 2 or 5 only   D: 1, 3 or 4 */
    uint64_t two[4] = { M(2, 5, 0, 0), M(2, 5, 0, 0), M(2, 5, 0, 0), M(1, 3, 4, 0) };

    try_case("A matching exists:", 4, one);
    try_case("No matching:", 4, two);
    return 0;
}
```

The first part of the output reproduces the steps of the table (the second part is explained below):

```
A matching exists:
  cell A: placed matching: A=1
  cell B: placed matching: B=1 A=2
  cell C: placed matching: C=1 A=2 B=3
  cell D: placed matching: C=1 A=2 B=3 D=4
No matching:
  cell A: placed matching: A=2
  cell B: placed matching: B=2 A=5
  cell C: FAILED matching: B=2 A=5
  values reached by the search: 2 5 
  cells that hold them, plus cell C: B A
```

## When no matching exists: the Hall set

In the second attempt of the program, cells A, B and C accept only 2 or 5; cell D accepts 1, 3 or 4. A takes 2, then B takes 2 by sending A to 5; C wants 2 but neither B nor A can step aside. The program then prints:

| Result | Reading |
|---|---|
| Failure at cell C | No augmenting path starts from C |
| Values reached: 2, 5 | The only values the search could try |
| Holders: B, A, plus cell C | Three cells for two values: a **Hall set** |

This is exactly [Hall's theorem](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#hall-s-theorem-when-cells-block-each-other), read backwards: when the search fails, the values it reached and the cells that hold them form a group of k cells whose domains together hold k - 1 values. This group **explains** why no matching exists.

In a solver, this explanation serves as a conflict clause: one cell of the group must take a missing value outside the set, or a value already placed in the row must be freed (see [conflicts and clause learning](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#conflicts-and-clause-learning-cdcl)). This clause is used only to analyze the conflict; it is then thrown away.

## Testing during the search: when and on which rows

The solver runs the test when [unit propagation](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#unit-propagation-levels-and-the-trail) has nothing left to deduce (its **fixed point**), and only on the rows and columns **modified since the last test** that have **only a few free cells left**. Three reasons:

| Reason | Explanation |
|---|---|
| A nearly full row has few free cells | A group of cells blocking each other is easy to spot there, and the test stays short |
| The cost grows with the number of free cells | Régin filtering (below) reads the whole graph of the row: a number of reads proportional to the square of the number of free cells |
| Masks only hold 64 bits | At most 64 free cells per row |

The test does not start from scratch each time: it takes the matching of the last successful test and looks for an augmenting path only for the cells whose pair is no longer valid (see [avoiding redundant recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). A conflict is always recomputed from scratch to produce an explanation that does not depend on the starting matching.

The free-cell threshold is tuned by measurement. On 104 × 104 grids (100 grids, 4 copies of the solver in parallel, see [heavy tails](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#heavy-tails-a-few-catastrophic-instances)):

| Hall test on rows... | Grids over 90 s |
|---|---|
| No test | 9 |
| With at most 16 free cells | 3 |
| With at most 32 free cells | 0 (average 51.5 s, worst grid 68.8 s) |

Higher, the search degrades: at 108 × 108, a threshold of 48 free cells solves no grid out of 14 measurements, a threshold of 64 solves one out of 61 (budget of 1.5 billion propagations per measurement). The cause was not isolated; only measurement is authoritative.

## Going further: Régin filtering

The Hall test answers yes or no: "does a matching exist?". But a matching can exist **while forbidding values**. In the starting example, X1 and X2 share 1 and 2: X3 cannot take them, even though the Hall test sees no problem. **Régin filtering** ([Régin, 1994](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf)) removes from each domain **every value that belongs to no perfect matching**.

The idea: start from a perfect matching (the Hall test found one). For a cell to take a value `k` other than its own, whoever holds `k` must take another one, which in turn displaces someone... until someone takes the cell's **old** value: a cycle of moves.

We represent it with a directed graph (**arrows**, followed in one direction only) on the values: from value `v`, an arrow leaves toward each value of the domain of the cell that holds `v`. In the example, the matching found is X2=1, X1=2, X4=3, X3=4, X5=5:

```
value 5  ──▶  3, 4           (X5 holds 5 and accepts 3, 4, 5)
value 4  ──▶  1, 2, 3, 4     (X3 holds 4)
value 3  ──▶  3, 4           (X4 holds 3)
value 2  ──▶  1, 2           (X1 holds 2)
value 1  ──▶  1, 2           (X2 holds 1)
```

A **strongly connected component** is a group of points such that, from each one, all the others can be reached by following the arrows. Here: {1, 2}, {3, 4} and {5}. The arrows go down from {5} to {3, 4} then to {1, 2}, but never the other way. Régin's rule:

> A value `k` in the domain of cell `i` (other than its matched value `m`) is possible **if and only if** `k` and `m` are in the same strongly connected component: a cycle then exists.

| Candidate | Cell (matched value) | Do we get back to the matched value? | Verdict |
|---|---|---|---|
| 1 or 2 | X3 (4) | 1 and 2 only lead to {1, 2}: never to 4 | Removed |
| 3 | X3 (4) | 3 leads to 4: X3 takes 3, X4 takes 4 | Kept |
| 3 or 4 | X5 (5) | 3 and 4 do not lead to 5 | Removed |
| 4 | X4 (3) | 4 leads to 3 | Kept |

The components are computed in a single traversal of the graph with **[Tarjan's algorithm (1972)](https://doi.org/10.1137/0201010)**, which stacks the visited points and pops a complete group when it closes its loop. With bit masks, the arrows leaving a value fit in a single `uint64_t`.

```c
/* Strongly connected components (Tarjan) of the graph of values: from value v we can
   go to all the possible values of the cell that holds v. */
typedef struct {
    const uint64_t *succ;
    int index[64], low[64], comp[64], stack[64], sp, count;
    uint64_t on_stack;
    int ncomp;
} tarjan;

static inline void visit(tarjan *t, int v)
{
    t->index[v] = t->low[v] = t->count++;
    t->stack[t->sp++] = v;
    t->on_stack |= 1ull << v;
    for (uint64_t m = t->succ[v]; m; m &= m - 1) {
        int w = __builtin_ctzll(m);

        if (t->index[w] < 0) {
            visit(t, w);
            if (t->low[w] < t->low[v])
                t->low[v] = t->low[w];
        } else if ((t->on_stack >> w & 1) && t->index[w] < t->low[v]) {
            t->low[v] = t->index[w];
        }
    }
    if (t->low[v] != t->index[v])
        return;
    int w;                                      /* v is the root of a component */
    do {
        w = t->stack[--t->sp];
        t->on_stack &= ~(1ull << w);
        t->comp[w] = t->ncomp;
    } while (w != v);
    t->ncomp++;
}

/* Régin filtering: removes from each domain the values that belong to no perfect
   matching. Assumes a perfect matching in holder (n cells, n values 0..n-1).
   Returns the number of values removed. */
static inline int filter(int n, uint64_t *domain, const int *holder)
{
    uint64_t succ[64];
    int value_of[64], removed = 0;
    tarjan t = { .succ = succ };

    for (int v = 0; v < n; v++) {
        succ[v] = domain[holder[v]];            /* from v to the values of its cell */
        value_of[holder[v]] = v;                /* the value matched to each cell */
        t.index[v] = -1;
    }
    for (int v = 0; v < n; v++)
        if (t.index[v] < 0)
            visit(&t, v);
    for (int i = 0; i < n; i++)
        for (uint64_t m = domain[i] & ~(1ull << value_of[i]); m; m &= m - 1) {
            int v = __builtin_ctzll(m);

            if (t.comp[v] != t.comp[value_of[i]]) {  /* v never leads back to the value of i */
                domain[i] &= ~(1ull << v);
                removed++;
            }
        }
    return removed;
}
```

```c
#include <stdio.h>
#include "matching.h"

static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void show(const char *title, int n, const uint64_t *domain)
{
    printf("%s\n", title);
    for (int i = 0; i < n; i++) {
        printf("  X%d :", i + 1);
        for (uint64_t m = domain[i]; m; m &= m - 1)
            printf(" %d", __builtin_ctzll(m) + 1);
        printf("\n");
    }
}

int main(void)
{
    uint64_t domain[5] = { M(1, 2, 0, 0), M(1, 2, 0, 0), M(1, 2, 3, 4),
                            M(3, 4, 0, 0), M(3, 4, 5, 0) };
    int holder[64];
    uint64_t seen;

    show("Before:", 5, domain);
    if (find_matching(5, domain, holder, &seen) >= 0) {
        printf("no matching\n");
        return 1;
    }
    printf("A perfect matching exists: the Hall test finds nothing wrong.\n");
    printf("matching found:");
    for (int v = 0; v < 5; v++)
        printf(" X%d=%d", holder[v] + 1, v + 1);
    printf("\n");
    int removed = filter(5, domain, holder);

    show("After Régin filtering:", 5, domain);
    printf("%d values removed\n", removed);
    return 0;
}
```

```
Before:
  X1 : 1 2
  X2 : 1 2
  X3 : 1 2 3 4
  X4 : 3 4
  X5 : 3 4 5
A perfect matching exists: the Hall test finds nothing wrong.
matching found: X2=1 X1=2 X4=3 X3=4 X5=5
After Régin filtering:
  X1 : 1 2
  X2 : 1 2
  X3 : 3 4
  X4 : 3 4
  X5 : 5
4 values removed
```

The Hall test found nothing wrong (a matching exists), and the filtering removes 4 values: 1 and 2 from X3 (shared by X1 and X2), 3 and 4 from X5 (shared by X3 and X4 once X3 is reduced to {3, 4}). Régin's reasoning therefore works **in cascade** without being asked.

## Justifying each removal: explanations

A learning SAT solver must be able to **explain** every value it removes: without a reason, conflict analysis cannot trace back to the cause (see [conflicts and clause learning](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#conflicts-and-clause-learning-cdcl)). The explanation for a removal by Régin filtering is a Hall set: the cells that hold the reachable values have no choice other than those values, which no other cell can therefore take.

First version of the solver: each removal was **learned as a clause**. Result on 64 × 64 grid no. 4, solved in 98 million propagations without filtering:

| | Without filtering | First filtering (learned clauses) | Filtering with stacked explanations |
|---|---|---|---|
| Propagations | 98.4 million | Not solved at 300 million | 102.5 million |
| Time | 7.4 s | | 7.8 s |
| Cost of a propagation | 75 ns | 156 ns | |
| Removals, learned clauses | | 226,000, 58,000 (memory ×19) | |

Each explanation is long (142 literals on average, measured on the corrected version): learning tens of thousands of them blows up memory and slows every propagation. The fix: **stack** each explanation on a separate stack, popped on backtracking like the trail of assignments, never turning it into a clause. The blockage came from the explanation clauses, not from the filtering itself.

## What it gained on the solver

Filtering applies only to rows and columns with at most 16 free cells (the Hall test goes up to 32). On 40 grids of 64 × 64, a single process, a budget of 400 million propagations:

| | Without Régin | With Régin (16 free cells) |
|---|---|---|
| Grids solved | 28 out of 40 | 39 out of 40 |
| Average propagations | 187 million | 97 million |
| Cost of a propagation | 107 ns | 91 ns |

(The averages count a failure as the whole budget.) 11 grids are solved only with filtering, a single one only without it: a gap this clear has about 3 chances in 1,000 of happening by luck. With a threshold of 24 free cells, 17 grids out of 20 are solved (against 20 out of 20 at 16): filtering more rows costs more than it brings.

At 108 × 108, on the 100 grids (4 copies in parallel):

| | Average | Grids over 90 s |
|---|---|---|
| Hall test alone | 56.8 s | 4 |
| With Régin filtering | 49.3 s (worst grid 64.1 s) | 0 |

At 112 × 112, this solver remains out of reach: 59.1 s simulated average over the first 20 grids, and already one overrun.

## Checking the code: brute force

Such subtle reasoning is easy to get wrong: one forgotten line and a useful value disappears with no message at all. The program below compares the code with a reference that tries **every** way of filling the cells (2 to 8 cells, random domains):

```c
#include <stdio.h>
#include <stdlib.h>
#include "matching.h"

/* Reference: tries all the permutations, and notes for each cell
   the values it takes in at least one perfect matching. */
static void permute(int n, int k, int *p, int *used, const uint64_t *dom,
                     uint64_t *possible, long *nb)
{
    if (k == n) {
        (*nb)++;
        for (int i = 0; i < n; i++)
            possible[i] |= 1ull << p[i];
        return;
    }
    for (int v = 0; v < n; v++)
        if (!used[v] && (dom[k] >> v & 1)) {
            used[v] = 1;
            p[k] = v;
            permute(n, k + 1, p, used, dom, possible, nb);
            used[v] = 0;
        }
}

int main(void)
{
    long with_matching = 0, filtered = 0, hall_ok = 0, hall_total = 0, mismatches = 0;

    srand(42);
    for (int round = 0; round < 300000; round++) {
        int n = 2 + rand() % 7;                         /* from 2 to 8 cells */
        uint64_t dom[64], ref[64] = {0}, seen;
        int p[64], used[64] = {0}, holder[64], failed;
        long nb = 0;

        for (int i = 0; i < n; i++) {                   /* random, sparse domains */
            dom[i] = 0;
            for (int v = 0; v < n; v++)
                if (rand() % 100 < 35)
                    dom[i] |= 1ull << v;
        }
        permute(n, 0, p, used, dom, ref, &nb);
        failed = find_matching(n, dom, holder, &seen);
        if ((nb > 0) != (failed < 0))
            mismatches++;                               /* disagreement on existence */
        if (failed >= 0) {                              /* check of the Hall set */
            uint64_t domain_union = dom[failed];
            int ncells = 1;

            for (uint64_t m = seen; m; m &= m - 1) {
                domain_union |= dom[holder[__builtin_ctzll(m)]];
                ncells++;
            }
            hall_total++;
            if (domain_union == seen && ncells == __builtin_popcountll(seen) + 1)
                hall_ok++;
            continue;
        }
        with_matching++;
        filtered += filter(n, dom, holder);
        for (int i = 0; i < n; i++)
            if (dom[i] != ref[i])                       /* removes exactly the useless ones? */
                mismatches++;
    }
    printf("300000 draws: %ld with a perfect matching, %ld without\n",
           with_matching, hall_total);
    printf("values removed by the filter: %ld\n", filtered);
    printf("correct Hall sets: %ld out of %ld\n", hall_ok, hall_total);
    printf("disagreements with brute force: %ld\n", mismatches);
    return mismatches != 0;
}
```

```
300000 draws: 96500 with a perfect matching, 203500 without
values removed by the filter: 391264
correct Hall sets: 203500 out of 203500
disagreements with brute force: 0
```

| Check | Result |
|---|---|
| Does a perfect matching exist? | Same answer as brute force, over the 300,000 draws |
| When none exists, is the Hall set correct? | 203,500 out of 203,500: its cells have exactly the values reached as their combined domains, with one cell more |
| After filtering, is each cell's domain exactly the set of values it takes in at least one perfect matching? | Yes for the 96,500 draws with a matching: the filtering removes only the useless and removes all the useless |

## The pitfalls

| Pitfall | What happens | Remedy |
|---|---|---|
| Filtering without a perfect matching | The result is meaningless: the graph of values assumes every value has a holder | Run the matching search first, filter only if it succeeds |
| Number of cells different from the number of values | The graph is malformed | On a row, the free cells receive the missing values: their numbers are equal, or the conflict is already there |
| Arrows in the wrong direction | Useful values are removed: the result looks plausible but wrong | Check against brute force on small cases, as above |
| More than 64 free cells or 64 values | A `uint64_t` mask is no longer enough | Limit the test to nearly filled rows, or move to wider masks |
| Learning each removal as a clause | Memory explodes, the search blocks (arena ×19 measured) | Stack the explanations separately, pop them on backtracking |
| Filtering every row | The cost exceeds the gain (24 free cells: 17 grids out of 20 solved against 20 out of 20) | Tune the free-cell threshold by measurement |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | Cells that must take values that are all different are modeled as a bipartite graph; a perfect matching is one valid way of filling them. Kuhn's algorithm looks for it by augmenting paths; its failure produces a Hall set that explains the impossibility. Régin filtering goes further: from a perfect matching, it removes every value that belongs to no perfect matching, thanks to the strongly connected components of the graph of values. |
| **Tools you can use** | Bit masks (`uint64_t`, `__builtin_ctzll`) for domains of fewer than 64 values, Tarjan's algorithm for the components, a brute-force reference to validate the code, [Régin's paper](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf) for the proof. |
| **Pitfalls to avoid** | Filtering without a perfect matching, reversing the direction of the arrows, exceeding 64 values with a single mask, learning each removal as a clause, applying the filtering to every row without measuring. |
| **Best practices** | Run the test only on nearly filled rows; reuse the previous matching instead of starting over; stack the explanations separately; validate each algorithm on small cases against an exhaustive enumeration; tune thresholds by measurement. |
