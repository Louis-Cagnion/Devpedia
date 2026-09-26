---
order: 7
---

# Parallelizing a Search: Splitting into Independent Subproblems (EPS)

A [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) search tries the possible choices one by one, going back at each dead end. A modern computer has several **cores** (computing units able to work at the same time, see [Parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)): can we explore several paths at once? **EPS** (*Embarrassingly Parallel Search*, "embarrassing" because it is so easy to parallelize that it is almost awkward) is a simple answer: first split the problem into many small independent problems, then hand them out.

## The Search Tree, Seen as a List of Subproblems

Each backtracking choice opens a branch. Everything under a branch is a **subproblem**: the original problem, with a few variables already fixed.

```
                     (full problem)
              /              |              \
         A = 1            A = 2            A = 3          <- 1st choice: 3 subproblems
        /     \          /     \          /     \
    B = 1   B = 2    B = 1   B = 3    B = 2   B = 3       <- 2nd choice: 6 subproblems
```

Two subproblems at the same level share nothing: searching in `A = 1` says nothing about `A = 2`. They can therefore be given to different **workers** (a worker is a thread or a process that handles a task, see [Threads](/?c=langages&s=c&p=threads)).

## Why You Need Many More Subproblems than Workers

| Approach | What happens |
|---|---|
| Running N threads on the **same** search state | They modify the same memory at the same time: wrong results (see [Shared memory](/?c=langages&s=c&p=threads#shared-memory-an-advantage-and-a-risk)). |
| **One** subproblem per worker | Subproblems are not equally hard: one worker finishes in 1 second and waits, while another struggles for 9 seconds. |
| **30 to 100** subproblems per worker, in a queue | A worker that finishes early immediately takes the next one: the load balances itself. |

Worked example, 4 workers:

| Split | Subproblem durations | Total time |
|---|---|---|
| 4 subproblems | 1 s, 1 s, 1 s, 9 s | 9 s (three workers wait 8 s) |
| 40 subproblems, same total work (12 s) | about 0.3 s each | about 3 s (12 s ÷ 4) |

## The Three Steps of EPS

```
 1. Split                    2. Distribute                 3. Solve
 (a single worker)           (shared queue)                (each on its own)

 root                        [sp1][sp2][sp3]...[sp240]     worker 1: sp1, sp5, sp9...
   -> expand the tree     ->        |    |    |       ->   worker 2: sp2, sp6...
      until 240                     v    v    v            worker 3: sp3, sp7...
      subproblems                 take the next one        (ordinary backtracking)
```

| Step | What you do | Synchronization needed |
|---|---|---|
| 1. Split | Expand the tree from the root up to the target (e.g. 30 × number of workers), applying [constraint propagation](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#shrinking-domains-before-even-trying-constraint-propagation) to each subproblem: those already impossible disappear. | None (a single worker) |
| 2. Distribute | Put the subproblems in a queue; each worker takes the next one when it is free. | Only for "take the next one" (a [mutex](/?c=langages&s=c&p=threads#protecting-shared-data-with-a-mutex)) |
| 3. Solve | Each worker runs a normal sequential backtracking on its subproblem. | None during the search |

If you are looking for **a single** solution, add a shared "solution found" flag: the first worker that succeeds raises it, and the others stop as soon as they see it.

## Choosing Which Subproblem to Split

To reach the target in few steps, always split the subproblem that will produce **the most** new subproblems: the one whose next variable (chosen by [MRV](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#picking-the-right-variable-first-the-mrv-heuristic), the most constrained) has the most possible values.

| Subproblem | Possible values of its MRV variable | Splitting it gives |
|---|---|---|
| sp1 | 2 | +1 subproblem (1 replaced by 2) |
| sp2 | 5 | +4 subproblems: **split this one first** |

## Copying the State: the Condition for "No Synchronization"

Each subproblem must own **its own copy** of all its data: a *deep copy*. A copy that kept a pointer to another subproblem's data (a *shallow copy*) would put two workers back on the same memory.

```c
typedef struct {
    int  n;          // number of variables
    int *values;     // values[i] = value chosen for variable i, or -1
} t_state;

t_state *copy_state(const t_state *src)
{
    t_state *copy = malloc(sizeof(t_state));             // new structure
    copy->n = src->n;                                    // an integer is copied as is
    copy->values = malloc(src->n * sizeof(int));         // NEW array, not the one of src
    memcpy(copy->values, src->values, src->n * sizeof(int)); // copy its content
    return copy;                                         // no pointer shared with src
}
```

Writing `copy->values = src->values;` instead of the two `malloc`/`memcpy` lines would be a shallow copy: both states would then modify the same array.

## When EPS Gains Nothing: a Measured Case

EPS was tried on a *Skyscraper* puzzle solver (backtracking with MRV and propagation, in C, 8 threads), then removed:

| Grid | Sequential | EPS (240 subproblems) |
|---|---|---|
| 10 × 10 | 1.08 s | 13.06 s (12 times slower) |
| 11 × 11 | 14 to 16 s | 82 s to more than 90 s |

| Cause | Explanation |
|---|---|
| Splitting is expensive | Each subproblem created requires a full propagation: 240 propagations before even starting to search, while the sequential search only explored 7 to 50 nodes. |
| The real tree is narrow | MRV and propagation prune so much that almost all the work fits in a few branches. With one subproblem per thread, the time goes back to the sequential one, with no gain: 110% CPU usage on 8 threads, barely more than one busy core. |

The lesson: EPS pays off when the tree is **wide** and subproblems are cheap to create. Before parallelizing, [measure](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) where the time really goes.

Source: *Embarrassingly Parallel Search*, Régin, Rezgui and Malapert, JAIR 2016 ([jair.org/index.php/jair/article/view/11031](https://jair.org/index.php/jair/article/view/11031)).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | EPS splits the search tree into independent subproblems (30 to 100 per worker), puts them in a queue, and lets each worker run an ordinary backtracking without communicating. |
| **Tools you can use** | Constraint propagation while splitting, MRV to choose the subproblem to split, a queue protected by a mutex, a shared flag to stop the other workers. |
| **Pitfalls to avoid** | A single subproblem per worker (unbalanced load); a shallow copy of the state (shared memory); parallelizing a search whose tree is already narrow. |
| **Best practices** | Measure the sequential version before and after; keep splitting cheap; deep-copy the state for each subproblem. |
