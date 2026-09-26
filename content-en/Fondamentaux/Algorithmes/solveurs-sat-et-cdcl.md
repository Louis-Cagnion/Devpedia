---
order: 8
---

# SAT Solvers and the CDCL Algorithm

A **SAT solver** is a generic program that answers a single question: "can each variable be given a true/false value so that all these rules are respected?". You translate your problem into it (puzzle, schedule, circuit verification...: see [Encoding a Problem into SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)), then let the solver search. It builds on [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes), but **learns from every failure**: that is the **CDCL** algorithm.

Example measured on a *Skyscraper* puzzle solver: backtracking with propagation topped out at 11 × 11 grids, while a CDCL solver written for the occasion solves 32 × 32 grids in under a second.

## The SAT Problem: True/False Variables and Clauses

| Term | Definition | Example |
|---|---|---|
| Boolean variable | An unknown that is **true** or **false** | `a`: "cell 1 contains a 3" |
| Literal | A variable or its negation (`¬`, "not") | `a`, `¬a` |
| Clause | Several literals joined by **OR**: at least one must be true | `(¬a ∨ b)`: "if `a` is true, then `b` is too" |
| Formula in **CNF** (*Conjunctive Normal Form*) | Several clauses joined by **AND**: all must be true | `(¬a ∨ b) ∧ (¬b ∨ ¬c)` |

The symbol `∨` reads "or", `∧` reads "and". A clause like `(¬a ∨ b)` expresses an "if... then" rule: it is only false if `a` is true and `b` false.

The SAT problem is **NP-complete**: no known algorithm solves it quickly in every case (see [NP-Complete Problems](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets)). In practice, though, modern solvers handle formulas with millions of clauses, because real problems are highly structured.

## The DIMACS Format: the Common Language of Solvers

All solvers read the same text format, **DIMACS**. Variables are numbered from 1, a negative number is a negation, and each clause ends with `0`:

```
c a=1 b=2 c=3 d=4 x=5 y=6     <- "c" line: comment
p cnf 6 5                     <- header: 6 variables, 5 clauses
-1 2 0                        <- (¬a ∨ b)
-1 3 0                        <- (¬a ∨ c)
-2 -3 4 0                     <- (¬b ∨ ¬c ∨ d)
-2 -4 0                       <- (¬b ∨ ¬d)
-5 6 0                        <- (¬x ∨ y)
```

Answer of the [kissat](https://github.com/arminbiere/kissat) solver on this file:

```
s SATISFIABLE                 <- a solution exists
v -1 -2 -3 -4 -5 -6 0         <- the solution: every variable false
```

The program's exit code is `10` if a solution exists, `20` otherwise (`s UNSATISFIABLE`), which makes it usable from a script.

## Unit Propagation, Levels and the Trail

When all the literals of a clause are false except one, that last one is **forced** to true: this is **unit propagation**. Each free choice (a *decision*) opens a new **level**. The **trail** records each assignment, its level and its **reason** (the clause that forced it).

On the formula above, the solver first decides `x = true`, then `a = true`:

| Level | Assignment | Reason |
|---|---|---|
| 1 | `x = true` | decision |
| 1 | `y = true` | `(¬x ∨ y)`: `¬x` is false, so `y` is forced |
| 2 | `a = true` | decision |
| 2 | `b = true` | `(¬a ∨ b)` |
| 2 | `c = true` | `(¬a ∨ c)` |
| 2 | `d = true` | `(¬b ∨ ¬c ∨ d)`: `¬b` and `¬c` are false |
| 2 | **conflict** | `(¬b ∨ ¬d)`: `¬b` and `¬d` are both false |

## Conflicts and Clause Learning (CDCL)

A plain backtracking would go back to the previous level and try `a = false`. **CDCL** (*Conflict-Driven Clause Learning*) first looks for **why** the conflict happened, by walking back through the reasons in the trail. At each step, the current clause is combined with the reason of one of its variables (this combination is called a *resolution*):

| Step | Current clause | Replaced using the reason of... |
|---|---|---|
| Start | `(¬b ∨ ¬d)` (the conflicting clause) | |
| 1 | `(¬b ∨ ¬c)` | `d`, forced by `(¬b ∨ ¬c ∨ d)` |
| 2 | `(¬b ∨ ¬a)` | `c`, forced by `(¬a ∨ c)` |
| 3 | `(¬a)` | `b`, forced by `(¬a ∨ b)` |

You stop as soon as **a single** literal from the conflict level remains: this is the **first unique implication point** (*1UIP*). The resulting clause, `(¬a)`, is **learned**: added to the formula, it says "`a` can never be true".

The solver then goes back to the highest level remaining in the learned clause, here level 0: it also undoes the decision `x = true`, which had nothing to do with the conflict. This is **non-chronological backtracking** (*backjumping*). Then `(¬a)` immediately forces `a = false`.

| | Backtracking | CDCL |
|---|---|---|
| After a failure | Tries the next value at the previous level | Learns a clause, then jumps to the useful level |
| Memory of failures | None: the same dead end can be revisited elsewhere | Each learned clause prunes every branch where the same cause would occur again |
| Going back | One level at a time | Straight to the right level, skipping unrelated decisions |

Real solvers then **minimize** the learned clause, removing literals already implied by the others (a technique introduced by MiniSat).

## Two Watched Literals: Propagating Without Rereading Everything

With millions of clauses, rereading every clause at every assignment would be far too slow. Each clause **watches only two** of its literals (*two watched literals*):

```
Clause (¬b ∨ ¬c ∨ d ∨ e)      watched: ¬b and ¬c
  b becomes true (¬b false)  -> look for another non-false literal to watch: d
  c becomes true (¬c false)  -> look for a replacement: e
  d becomes false            -> no replacement left: e is forced to true
```

As long as neither watched literal is false, the clause can neither force anything nor be in conflict: it is not looked at. And when going back, there is **nothing to undo**: literals that become free again remain good candidates to watch.

## Choosing the Variable: VSIDS and Phase Saving

| Mechanism | Principle | Why |
|---|---|---|
| **VSIDS** (*Variable State Independent Decaying Sum*) | Each variable has an **activity**, increased when it takes part in a conflict, which then "wears off" over time. The solver always decides on the most active one. | Focuses the search on the hard part of the problem, the one producing conflicts right now. |
| Decay through the increment | Instead of decreasing all activities at each conflict, the value added to later ones is **increased** (×1.05 per conflict), and everything is rescaled before exceeding the capacity of a floating-point number. | Same effect, at a constant cost per conflict. |
| Binary heap | A structure that gives the most active variable in logarithmic time. | Avoids scanning every variable at each decision. |
| **Phase saving** | A variable takes back the last value it had before being undone. | After going back, the solver quickly rebuilds the parts that were already consistent. |

## Restarting and Forgetting: Luby and LBD

A **restart** undoes every decision and starts again from level 0, **keeping** the learned clauses and the activities. It avoids staying stuck for a long time in a bad region of the tree.

| Strategy | When to restart | Measured on the Skyscraper solver |
|---|---|---|
| **Luby sequence** | After 1, 1, 2, 1, 1, 2, 4, 1, 1, 2... times a unit of conflicts (here 300) | Kept |
| Glucose | When the recent quality of learned clauses drops | 2 times slower |
| No restart | Never | Every 56 × 56 grid tested exceeds 90 s |

Learned clauses pile up: half of them are regularly deleted, keeping the best according to their **LBD** (*Literal Block Distance*): the number of different levels among their literals. A clause with LBD 2 links only two decisions: it will be useful often.

## Heavy Tails: a Few Catastrophic Instances

Among grids of the same size, most are solved quickly, but a few take 100 times longer: their solving time follows a **heavy-tailed** distribution. Measured on the Skyscraper solver with 72 × 72 grids, over 100 grids:

| Version | Median time | Grids over 90 s |
|---|---|---|
| A single solver | 13.4 s | 7 |
| 4 copies of the solver started in parallel, each with a different share of randomness; the first one to find wins | 9.3 s | 0 |

Restarts and controlled randomness are precisely what gets the search out of these bad trajectories.

### Randomness Moves the Tail, It Does Not Shrink It

A random decision means picking a random variable instead of the most active one, with a small fixed probability (MiniSat's `random_var_freq` parameter, [MiniSat](http://minisat.se/)). Measured on the Skyscraper solver on a 72 × 72 grid, over 100 grids:

| Configuration | Grids over 90 s |
|---|---|
| No randomization | 4 |
| With 3% random decisions | 8, but not the same 4 grids |

The 4 grids that got stuck without randomization now get solved, but 8 other ones get stuck instead: the same grid passes or stalls depending on the random draw. The heavy tail comes from the search trajectory, not from the instance's intrinsic difficulty; adding randomness moves it, it does not shrink it.

### The Evaluation Trap: Selection Bias and Regression to the Mean

Testing a new heuristic only on the grids that stalled the reference configuration favors it mechanically: those grids were picked precisely for their bad luck with the reference, and a different configuration has statistically less reason to suffer the same bad luck. This trap has a name in statistics: [regression to the mean](https://en.wikipedia.org/wiki/Regression_toward_the_mean) (a sample picked for an extreme result moves back toward the average when measured again, even with no real change).

| Test set | Measured result |
|---|---|
| 8 hard grids, picked among those that stalled the reference | All solved: the variant looks excellent |
| 100 grids, the full set | Twice as many timeouts over 90 s as before |

Good practice: always revalidate a heuristic on the full set of instances, never only on the subset that motivated the change.

### Diversifying Without Destroying What Was Learned

Two ways of diversifying break what the solver has learned: adding noise to VSIDS activities on every restart, or going back to the initial phases instead of keeping phase saving (see above). Both make even the easy grids stall, though they needed no diversification at all. Diversification should touch a few one-off decisions (like `random_var_freq`), never what the solver has already learned (activities, clauses, phases).

### Portfolios of Independent Trajectories: the p^k Law

Another remedy: run several trajectories in parallel with different seeds, and keep the result of the first process to finish (process portfolio, [Gomes, Selman & Kautz, *Boosting Combinatorial Search Through Randomization*, AAAI 1998](https://www.cs.cornell.edu/selman/papers/pdf/98.aaai.boost.pdf), originally measured on completing Latin squares). If each run stalls independently with probability *p*, *k* runs all stall together with probability *p^k*: the risk drops very fast as the number of processes grows. With p = 7/100 (measured here):

```python
# p: probability that ONE run exceeds 90 s (measured: 7 grids out of 100)
p = 7 / 100
for k in range(1, 5):
    # probability that all k processes exceed 90 s (independent)
    print(f"k={k} processes: p^k = {p ** k:.6f}")
```

```
k=1 processes: p^k = 0.070000
k=2 processes: p^k = 0.004900
k=3 processes: p^k = 0.000343
k=4 processes: p^k = 0.000024
```

Measured on a 72 × 72 grid over 100 grids: 4 processes ([`fork`](/?c=langages&s=c&p=processus), the first process's result read through a [pipe](/?c=langages&s=c&p=appels-systeme-et-descripteurs), and `poll`, which waits on several pipes at once) go from 7 timeouts over 90 s to none, with a 9.6 s average and a 16.8 s worst case. Compare this to a single process that periodically resets itself completely, which removes only 3 out of 7: a single trajectory stays a single trajectory no matter how many restarts it gets, while truly independent processes follow the *p^k* law.

### Heterogeneous Portfolios and Diminishing Returns

Diversifying the decision heuristics too, not just the random seeds, strengthens the portfolio further. Measured on a 96 × 96 grid, over 4 processes:

| Portfolio | Average time (5 grids, 96 × 96) |
|---|---|
| 4 × VSIDS | 67 s |
| 1 × VSIDS + 3 × VMTF (*Variable Move-To-Front*: the variables from the last conflict move to the front of a list, instead of an activity score like VSIDS; [Ryan 2004](https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/2725/b35038871.pdf)) | 32 s |

The VMTF processes win very consistently, between 25,000 and 30,000 conflicts. Thanks to this heterogeneous portfolio, the one-minute frontier moves from the 72 × 72 grid (with still 4% of stalls) to about 100 × 100.

Past 4 to 6 processes, the gains slow down and then reverse: the shared memory bandwidth between processes ends up costing more than the added diversity brings (8 processes slower than 6). Sharing learned clauses between processes (ManySAT, [Hamadi, Jabbour & Sais, 2009](http://www.cril.univ-artois.fr/~jabbour/manysat.htm)) only helps if the learned clauses are short: here, a full solve learns only 2 to 7 unit clauses and 11 to 34 binary clauses (56 × 56 grid); the other learned clauses are long, not worth sharing.

## Reference Solvers

| Solver | Contribution | Link |
|---|---|---|
| MiniSat (Eén and Sörensson, 2003) | Short, clear implementation of everything in this chapter, the reference for learning | [minisat.se](http://minisat.se/) |
| Glucose (Audemard and Simon, 2009) | LBD measure and the matching restarts | [github.com/audemard/glucose](https://github.com/audemard/glucose) |
| kissat (Armin Biere) | Among the best in current SAT competitions | [github.com/arminbiere/kissat](https://github.com/arminbiere/kissat) |

Measured on the puzzle's encoding (48 × 48 grid, 8 million clauses): kissat's default configuration exceeds the budget, because its preliminary simplifications cost more than they bring on this large but easy problem; with the `--plain` option, which disables them, it solves in 2.2 s.

Sources: Marques-Silva and Sakallah, *GRASP* (1996); Moskewicz et al., *Chaff* (2001); Eén and Sörensson, *An Extensible SAT-solver* (MiniSat, 2003); Audemard and Simon, *Predicting Learnt Clauses Quality in Modern SAT Solvers* (Glucose, 2009); *Handbook of Satisfiability*, 2nd edition (2021).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A SAT solver looks for true/false values that satisfy a CNF formula (OR clauses joined by AND). CDCL adds to backtracking the analysis of each conflict: a learned clause and a direct jump back to the useful level. |
| **Tools you can use** | DIMACS format; MiniSat, Glucose, kissat solvers; unit propagation with two watched literals; VSIDS and phase saving; Luby restarts; sorting learned clauses by LBD. |
| **Pitfalls to avoid** | Removing restarts (stuck instances); keeping every learned clause (memory and propagation slowed down); assuming a solver's default settings suit every problem. |
| **Best practices** | Start with an existing solver on a DIMACS file before writing your own; measure on many instances, not a single one, because of heavy tails. |
