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

The SAT problem is **NP-complete**: no known algorithm solves it quickly in every case (see [Complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). In practice, though, modern solvers handle formulas with millions of clauses, because real problems are highly structured.

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
| No restart | Never | Every seed tested on 56 × 56 grids exceeds 90 s |

Learned clauses pile up: half of them are regularly deleted, keeping the best according to their **LBD** (*Literal Block Distance*): the number of different levels among their literals. A clause with LBD 2 links only two decisions: it will be useful often.

## Heavy Tails: a Few Catastrophic Instances

Among grids of the same size, most are solved quickly, but a few take 100 times longer: their solving time follows a **heavy-tailed** distribution. Measured on the Skyscraper solver with 72 × 72 grids, over 100 grids:

| Version | Median time | Grids over 90 s |
|---|---|---|
| A single solver | 13.4 s | 7 |
| 4 copies of the solver started in parallel, each with a different share of randomness; the first one to find wins | 9.3 s | 0 |

Restarts and controlled randomness are precisely what gets the search out of these bad trajectories.

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
