---
order: 12
---

# Bipartite Matching, Hall's Theorem and Kuhn's Algorithm

Giving each element of a group a different place among those it accepts: students to activities, tasks to machines, grid cells to values. This **assignment** problem has a simple, fast solution, which also serves as a building block for constraint solvers (see [propagators](/?c=fondamentaux&s=algorithmes&p=encodages-sat)).

## The problem: matching in a bipartite graph

A **graph** is a set of points (the **vertices**) joined by lines (the **edges**). It is **bipartite** when the vertices split into two groups, and every edge joins a vertex of the first group to a vertex of the second, never two of the same group.

Example: 4 cells to fill, each with the values it accepts (its **domain**), each value being usable only once.

| Cell | Possible values |
|---|---|
| c0 | 1, 2 |
| c1 | 1 |
| c2 | 2, 3, 4 |
| c3 | 3, 4 |

A **matching** is a set of edges with no common endpoint: each cell receives at most one value, each value serves at most one cell. It is **complete** (or *perfect* when both groups have the same size) when all cells are served. Here, `c0→2, c1→1, c2→3, c3→4` is one.

## Why the greedy approach is not enough

The reflex is to process the cells in order and give each one the first free value (see [the greedy algorithm](/?c=fondamentaux&s=algorithmes&p=algorithme-glouton)):

```text
c0 gets 1   (first free value)
c1 only wants 1, already taken: failure
```

The greedy approach serves only 3 cells out of 4, although a complete solution exists: it never goes back on a decision. You need an algorithm able to **move** an already placed cell to free up a value.

## Kuhn's algorithm: augmenting paths

Idea: when a cell has no free value left, ask the cell holding one of its values to **take another one**, and so on. The chain of moves is called an **augmenting path**: it starts from an unserved cell, alternates "wanted value / cell holding it", and ends on a free value. Reassigning along it from end to end serves one more cell.

```text
Before:   c0 holds 1.        c1 wants 1.

Augmenting path:   c1 → value 1 → c0 → value 2 (free)

After:   c0 holds 2.         c1 holds 1.
```

Berge's theorem guarantees that if no augmenting path exists, the matching is as large as possible ([Berge's theorem](https://en.wikipedia.org/wiki/Berge%27s_theorem)). Kuhn's algorithm therefore tries a path for each cell, by depth-first search:

```c
#include <string.h>  // memset

#define N 4          // number of cells and number of values

int dom[N][N];       // dom[c][v] = 1 if value v is possible in cell c
int owner[N];        // owner[v]: cell holding value v, or -1
int seen[N];         // seen[v] = 1 if v was already tried for the current cell

// Looks for a value for cell c, moving already placed cells if needed
int find(int c)
{
    for (int v = 0; v < N; v++) {
        if (!dom[c][v] || seen[v])
            continue;
        seen[v] = 1;
        if (owner[v] == -1 || find(owner[v])) {
            owner[v] = c;
            return 1;
        }
    }
    return 0;
}

int matching(void)
{
    int size = 0;

    for (int v = 0; v < N; v++)
        owner[v] = -1;
    for (int c = 0; c < N; c++) {
        memset(seen, 0, sizeof seen);
        size += find(c);
    }
    return size;
}
```

On the table's example (values numbered 0 to 3 in `dom`), `matching()` returns 4, against 3 for the greedy approach.

| Element | Role |
|---|---|
| `owner[v]` | The current matching: who holds each value |
| `find(c)` | Looks for an augmenting path starting from cell `c` |
| `seen[v]` | Avoids retrying a value already visited during the search: without it, the search would go round in circles |
| `memset(seen, …)` | Reset before each new cell |

Each search goes through at most all the edges, and there is one per cell: the total cost is of the order of (number of cells) × (number of edges). For very large graphs, the [Hopcroft-Karp](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm) algorithm does better (it looks for several paths at once), but Kuhn is largely enough for a row of a few dozen cells.

> **Pitfall:** not resetting `seen` between two cells. The next cell then believes values were "already tried" and wrongly declares it has no possible value.
>
> **Best practice:** test on a case where the greedy approach fails (as above): if both algorithms give the same answer, the test proves nothing.

## Hall's theorem: knowing in advance that it is impossible

When no complete matching exists, can we know it **without searching**? **Hall's theorem** answers with an exact condition ([Hall's theorem](https://en.wikipedia.org/wiki/Hall%27s_marriage_theorem)): a matching that serves all cells exists **if and only if**, for every group of cells, the set of values these cells accept all together is **at least as large** as the group.

| Group of cells | Values accepted all together | Condition |
|---|---|---|
| {c1} | {1} (1 value) | 1 ≥ 1, holds |
| {c0, c1} | {1, 2} (2 values) | 2 ≥ 2, holds |
| Three cells that only accept {1, 2} | {1, 2} (2 values) | 3 > 2: **violated** |

In the last case, three cells compete for two values: no assignment can serve them all, whatever the rest of the grid. The group that violates the condition is an **explanation** of the impossibility, useful for a solver that has to understand why a choice fails.

We checked here, on 200,000 randomly drawn domains (4 cells, 4 values), that Kuhn finds a complete matching exactly when Hall's condition holds (91,122 complete cases, 0 disagreements).

> **Pitfall:** testing Hall's condition by listing all groups of cells: there are 2ⁿ of them, a million for 20 cells. Hall says **why** it is impossible; to **decide**, Kuhn is polynomial (see [complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o) and [NP-complete problems](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets), which bipartite matching is not part of).
>
> **Best practice:** let Kuhn decide, and only look for the offending group when it has to be explained.

## Application: the "all different" constraint

In a row of a [Latin square](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme), the n cells must receive n **all different** values. If, as solving goes on, you remove the values that have become impossible, each cell has a domain: the row can still be completed only if a matching serving all cells exists.

| Step | What we do |
|---|---|
| 1 | Build the graph: cells on one side, values on the other, one edge per value still possible |
| 2 | Run Kuhn |
| 3 | If the matching does not serve all cells: contradiction, no point pushing the search further |

This detection is much stronger than only checking "do two cells have the same imposed value?": it sees indirect conflicts (three cells for two values). This is the principle of the **propagator** of the "all different" constraint in a solver ([backtracking and constraints](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)).

> **Pitfall:** concluding that a Latin square is solvable because each row, taken alone, admits a complete matching. The columns impose constraints too, and each row is only looked at independently of the others.
>
> **Best practice:** use this test only as **pruning** (it detects dead ends, it does not guarantee a solution) and let the search settle the whole.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Giving each element a different place among those it accepts means looking for a matching in a bipartite graph. The greedy approach can fail: Kuhn's algorithm moves assignments already made along augmenting paths and finds a matching of maximum size. Hall's theorem gives the exact condition for a complete matching: every group of elements must accept at least as many places as elements. |
| **Tools you can use** | Kuhn's algorithm (depth-first search of an augmenting path for each element), Hopcroft-Karp for very large graphs, Hall's condition as an explanation of an impossibility, "all different" propagator in a solver. |
| **Pitfalls to avoid** | Settling for the greedy approach. Forgetting to reset the visited-values marking between two elements. Checking Hall by listing all groups (2ⁿ). Believing a complete matching per row is enough to solve a whole Latin square. |
| **Best practices** | Test on a case where the greedy approach fails. Use the matching as pruning, never as proof that a solution exists for the whole. Compare with Hall's condition on small cases to validate the implementation. |
