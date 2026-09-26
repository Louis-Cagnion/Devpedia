---
order: 6
---

# Backtracking and Constraint Satisfaction (CSP)

A [CSP](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (*Constraint Satisfaction Problem*) consists of finding a value for each **variable** of a problem, among a set of possible values (its **domain**), without violating any **constraint** between them. [Sudoku](https://en.wikipedia.org/wiki/Sudoku), the [N-Queens problem](https://en.wikipedia.org/wiki/Eight_queens_puzzle) (placing N queens on an N×N board so that none can capture another), and graph coloring (coloring each node so that no two neighboring nodes share the same color) are all CSPs.

## Retrying instead of backing off at random: backtracking

**Backtracking** explores possible solutions one variable at a time: it tries a value, **recurses** into the next variable (the function calls itself on a smaller sub-problem; see merge sort in [Comparison Sorting](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) for another example of recursion), and if no value works for the next variable, it **undoes** the current attempt to try the next one -- hence the name "backtracking".

Example on N-Queens, placing one queen per column:

```c
int columns[N]; // columns[i] = row where the queen of column i sits

int is_valid(int column, int row)
{
    for (int c = 0; c < column; c++)
    {
        if (columns[c] == row)                     // same row as an already placed queen
            return 0;
        if (abs(columns[c] - row) == column - c)    // same diagonal
            return 0;
    }
    return 1;
}

int solve(int column)
{
    if (column == N)
        return 1; // every column is placed: solution found

    for (int row = 0; row < N; row++)
    {
        if (is_valid(column, row))
        {
            columns[column] = row;    // attempt
            if (solve(column + 1))
                return 1;
            // failure further down: nothing to undo here, the slot gets overwritten next loop
        }
    }
    return 0; // no row works: backtrack to the previous call
}
```

`solve` tries every row for the current column; if a row leads to a dead end further down (`solve(column + 1)` returns `0`), the loop simply moves to the next row -- that's the entire backtracking mechanism, no dedicated data structure needed. On an unsorted array used to represent a variable's remaining candidates, [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove) lets you undo a removed candidate with no copy at all.

## Picking the right variable first: the MRV heuristic

In which order should variables be handled? The column in the example above, but nothing forces that order. The **MRV** heuristic (*Minimum Remaining Values*) picks the variable with the **fewest** remaining possible values first:

| Variable | Remaining possible values | MRV order |
|---|---|---|
| A | 4 values | 3rd |
| B | 1 value | 1st |
| C | 2 values | 2nd |

Handling `B` first fails (or succeeds) immediately if its only possible value is already invalid, instead of discovering that after uselessly exploring `A` and `C` first. A variable with a single possible value that fails prunes an entire branch of the search on the very first step: guessing on the most constrained variable first makes bad branches fail as early as possible.

## Shrinking domains before even trying: constraint propagation

Backtracking alone tries then undoes. **Constraint propagation** goes further: before (or during) the search, it directly shrinks the remaining possible values of unassigned variables, based on those already fixed, until no further reduction is possible (a **fixed point**).

```text
Constraint: column A ≠ column B (already fixed to 3)

Before propagation: A can be {1, 2, 3, 4}
After propagation: A can be {1, 2, 4}       (3 removed, conflicts with B)
```

If this reduction empties a variable's domain completely (no value remains possible), the current branch is mathematically impossible -- there's no point trying anything, it's abandoned immediately (*fail-fast*, failing as early as possible rather than discovering it after several useless search steps). This reduction-to-fixed-point technique, combined with this contradiction detection, has a name in CSP literature: [**AC-3**](https://en.wikipedia.org/wiki/AC-3_algorithm) (*Arc Consistency 3*).

| | Backtracking alone | + Constraint propagation (AC-3) |
|---|---|---|
| Failure detection | After trying an invalid value | Before even trying, if a domain is emptied |
| Cost | Less work per step | More work per step, but whole branches avoided |
| Typical use | Small problems, few cross-constraints | Sudoku, scheduling, heavily cross-constrained problems |

> **Best practice:** combine all three -- propagation to eliminate impossible branches early, MRV to guess first on the variable most likely to fail fast, backtracking to explore the rest -- rather than relying on a single mechanism.

> **Note:** to go further, see [Parallelizing a Search: Splitting into Independent Subproblems](/?c=fondamentaux&s=algorithmes&p=recherche-parallele-par-sous-problemes) (exploring several branches at the same time on several cores) and [SAT Solvers and the CDCL Algorithm](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) (learning from each failure instead of only going back).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A CSP looks for one value per variable without violating any constraint. Backtracking tries a value, recurses, and undoes it if it fails further down. MRV picks the most constrained variable first. Constraint propagation (AC-3) shrinks domains and detects a contradiction before even trying. |
| **Tools you can use** | Recursion for exploration; swap-remove to undo a removed candidate with no copy. |
| **Pitfalls to avoid** | Exploring variables in an arbitrary order instead of with MRV, which discovers failures later than necessary. |
| **Best practices** | Combine backtracking, MRV, and constraint propagation instead of a single isolated mechanism; prune a branch as soon as a contradiction is detectable (fail-fast), without exploring further. |
