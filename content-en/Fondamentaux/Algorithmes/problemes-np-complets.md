---
order: 11
---

# NP-Complete Problems: Why an "Exponential" Problem Still Gets Solved

Some problems have **no known fast algorithm** that works in every case: they are called **NP-complete**. Yet programs solve huge **instances** of them every day (an instance is one specific copy of the problem: a given grid, a given formula). This chapter explains what "NP-complete" means, what this label really promises, and why it does not prevent solving in practice.

Running example, measured on a solver for the *Skyscraper* puzzle (an n × n grid of building heights, see [Counting Permutations](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations)): a 72 × 72 grid has a number of possible fillings that takes **7,473 digits** to write, and yet a [CDCL solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) solves it in about **2 million decisions**, that is, free choices made by the solver (median over 100 grids: 13 seconds).

## Checking is easy, finding is hard

| Question | Work needed for an n × n grid |
|---|---|
| **Check**: does this filled grid follow the rules? | Read each cell a fixed number of times: `O(n²)` (see [Big-O notation](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) |
| **Find**: which grid follows the rules? | No known method guarantees a reasonable time in every case |

Checking that a grid is a [Latin square](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) (each value exactly once per row and per column), in [Python](/?c=langages&s=python&p=python):

```python
def is_latin_square(grid):
    n = len(grid)                                    # size: n rows of n cells
    expected = set(range(1, n + 1))                  # the set {1, 2, ..., n}
    for row in grid:                                 # each row...
        if set(row) != expected:                     # ...must contain 1..n once
            return False                             # a single error is enough to reject
    for c in range(n):                               # each column...
        column = {grid[r][c] for r in range(n)}      # ...gathers its n values
        if column != expected:
            return False
    return True                                      # 2 × n × n cells read: O(n²)


print(is_latin_square([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 2, 1]]))
print(is_latin_square([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 1, 2]]))
```

```
True
False
```

The second grid is rejected: its last row puts 1 and 2 in columns 3 and 4, where row 3 already put them. Even for a 1,000 × 1,000 grid, this check stays instantaneous. Finding the grid is another story.

## The P and NP classes

An algorithm is **polynomial** if its cost is at most `O(nᵏ)` for some fixed number `k` (`O(n)`, `O(n²)`, `O(n³)`...): it stays usable as `n` grows. By contrast, an **exponential** cost such as `O(2ⁿ)` or a [factorial](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations#the-factorial-the-number-of-possible-orders) one such as `O(n!)` quickly becomes impossible.

| Class | Definition | Examples |
|---|---|---|
| **P** | Problems we know how to **solve** in polynomial time | [Sorting an array](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), searching for an element |
| **NP** | Problems where a proposed solution can be **checked** in polynomial time | All of P, plus SAT, Sudoku, Skyscraper |

The name NP stands for "nondeterministic polynomial": a problem in NP would be solved in polynomial time by a theoretical machine that always guessed the right choice at each step. A real machine still has to **search** for that right choice.

Every problem in P is in NP (if you can solve quickly, you can check quickly). The reverse question, **P = NP?** (can everything that is quick to check also be solved quickly?), is still unanswered: it is one of the Clay Institute's seven [Millennium Prize Problems](https://www.claymath.org/millennium/p-vs-np/), worth one million dollars. Most researchers believe that P ≠ NP.

## NP-complete: the hardest problems in NP

A **reduction** transforms any instance of a problem A into an instance of a problem B, in polynomial time, so that B's answer gives A's answer. Solving B then lets you solve A: B is "at least as hard" as A.

An example already seen on this site: [encoding a Skyscraper into SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat) is a reduction from Skyscraper to SAT. A SAT solver can therefore solve Skyscrapers.

| Term | Definition | Examples |
|---|---|---|
| **NP-hard** | At least as hard as **every** problem in NP (every problem in NP reduces to it) | Finding the shortest tour of the [travelling salesman](https://en.wikipedia.org/wiki/Travelling_salesman_problem) (proving that no tour is shorter: nobody knows how to check that quickly) |
| **NP-complete** | NP-hard **and** in NP | SAT, completing a Latin square, Skyscraper |

```
+------------------------------ NP --------------------------------+
|  +--------- P ---------+     +-------- NP-complete ----------+   |
|  | sorting an array    |     | SAT, Skyscraper,              |   |
|  | searching an element|     | completing a Latin square     |   |
|  +---------------------+     +-------------------------------+   |
+------------------------------------------------------------------+
  (diagram valid if P ≠ NP; NP-hard problems include the
   NP-complete ones and other problems, outside NP)
```

| Result | Reference |
|---|---|
| SAT is the first problem proven NP-complete | Cook, [*The Complexity of Theorem-Proving Procedures*](https://doi.org/10.1145/800157.805047) (1971) |
| 21 classic problems (graph coloring, knapsack...) are NP-complete, through reductions from SAT | Karp, [*Reducibility Among Combinatorial Problems*](https://doi.org/10.1007/978-1-4684-2001-2_9) (1972) |
| Completing a partially filled Latin square is NP-complete | Colbourn, [*The Complexity of Completing Partial Latin Squares*](https://doi.org/10.1016/0166-218X(84)90075-1) (1984) |
| Skyscraper (also called *Building puzzle*) is NP-complete | Iwamoto and Matsui, [*Computational Complexity of Building Puzzles*](https://doi.org/10.1587/transfun.E99.A.1145) (2016) |

Practical consequence: if someone found a polynomial algorithm for **a single** NP-complete problem, every problem in NP would become polynomial, through reductions.

## What "NP-complete" does not say: worst case and typical case

NP-complete talks about the **worst case** (see the note on the worst case in [Big-O notation](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): there are instances on which no known algorithm avoids an explosion of computing time. It says nothing about the instances you actually meet.

| "NP-complete" says | "NP-complete" does not say |
|---|---|
| No known algorithm is fast on **all** instances; if P ≠ NP, none ever will be | That real instances are hard |
| Every known method has instances on which its running time explodes | That the search must go through the whole space of possibilities |

Size of the raw space of a Skyscraper, filling each row with any permutation (`n!` choices per row, hence `(n!)ⁿ` grids):

```python
import math

for n in (4, 9, 16, 72):
    digits = n * math.log10(math.factorial(n))      # log10((n!)^n) = n × log10(n!)
    print(n, math.floor(digits) + 1)                # number of digits of (n!)^n
```

| n | `(n!)ⁿ` grids | Comment |
|---|---|---|
| 4 | 331,776 | Can be enumerated in a fraction of a second |
| 9 | about 1.1 × 10⁵⁰ (51 digits) | At a billion grids per second: about 3 × 10³³ years |
| 16 | about 1.3 × 10²¹³ (214 digits) | |
| 72 | about 4.6 × 10⁷⁴⁷² (7,473 digits) | Solved in about 2 million decisions |

The number of digits is computed with the base-10 [logarithm](/?c=fondamentaux&s=mathematiques&p=le-logarithme), without ever computing the number itself. The gap between 10⁷⁴⁷² and 2 million comes from the fact that each decision wipes out whole families of grids at once:

| Mechanism | What it eliminates |
|---|---|
| [Constraint propagation](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#shrinking-domains-before-even-trying-constraint-propagation) | Every value that became impossible after a decision, without trying it |
| [CDCL learned clauses](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) | Every future branch that would reproduce the cause of a failure already met |

## Phase transitions: where the hard instances hide

To study "typical" difficulty, we draw [SAT formulas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#the-sat-problem-true-false-variables-and-clauses) at random: **random 3-SAT formulas**, where each clause contains 3 randomly chosen variables, each negated or not at random. The only setting is the number of clauses per variable.

Experiment with 40 variables and 40 formulas per setting, solved by a simple [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) over the clauses ([DPLL](https://doi.org/10.1145/368273.368557), the ancestor of CDCL, without learning):

```python
import random


def dpll(clauses, assignment, counter):
    counter[0] += 1                                   # one node of the search tree
    remaining = []                                    # clauses not satisfied yet
    for clause in clauses:
        if any(assignment.get(abs(lit)) == (lit > 0) for lit in clause):
            continue                                  # one true literal: clause satisfied
        free = [lit for lit in clause if abs(lit) not in assignment]
        if not free:
            return False                              # all its literals false: dead end
        remaining.append(free)                        # keep only the free literals
    if not remaining:
        return True                                   # nothing left to satisfy: solution
    v = abs(min(remaining, key=len)[0])               # variable of the shortest clause
    for value in (True, False):                       # try true, then false
        assignment[v] = value
        if dpll(remaining, assignment, counter):
            return True
        del assignment[v]                             # backtrack
    return False


rng = random.Random(1)                                # fixed seed: reproducible results
n = 40                                                # 40 variables
for ratio in (2, 3, 4, 4.3, 5, 6, 8):
    sat = nodes = 0
    for _ in range(40):                               # 40 formulas drawn per ratio
        formula = []
        for _ in range(round(ratio * n)):             # ratio × n clauses of 3 literals
            variables = rng.sample(range(1, n + 1), 3)        # 3 distinct variables
            formula.append([v * rng.choice((1, -1)) for v in variables])  # random signs
        counter = [0]
        sat += dpll(formula, {}, counter)
        nodes += counter[0]
    print(f"{ratio:>3} clauses per variable: {sat * 100 // 40:3d} % satisfiable, "
          f"{nodes // 40:4d} nodes on average")
```

```
  2 clauses per variable: 100 % satisfiable,   46 nodes on average
  3 clauses per variable: 100 % satisfiable,  126 nodes on average
  4 clauses per variable:  82 % satisfiable,  898 nodes on average
4.3 clauses per variable:  65 % satisfiable,  920 nodes on average
  5 clauses per variable:   7 % satisfiable,  948 nodes on average
  6 clauses per variable:   0 % satisfiable,  621 nodes on average
  8 clauses per variable:   0 % satisfiable,  296 nodes on average
```

| Zone | Formulas | Difficulty |
|---|---|---|
| Few clauses per variable | Almost always many solutions: one of them is found quickly | Easy |
| **Transition** | About one chance in two of having a solution | **Hard**: neither an obvious solution nor a quick contradiction |
| Many clauses per variable | Almost never a solution, and the contradiction shows up quickly | Easy to refute |

This "easy, hard, easy" profile is called a **phase transition**, by analogy with water freezing at a precise temperature. For large 3-SAT formulas, the threshold is around 4.3 clauses per variable; with only 40 variables as here, it is blurred and the difficulty peak spreads from 4 to 5.

| Problem | Measured difficulty threshold | Reference |
|---|---|---|
| Several NP-complete problems (graph coloring, Hamiltonian cycles...) | Difficulty peak at the point where the probability of having a solution drops from 1 to 0 | Cheeseman, Kanefsky and Taylor, [*Where the Really Hard Problems Are*](https://www.ijcai.org/Proceedings/91-1/Papers/052.pdf) (1991) |
| Random 3-SAT | Around 4.3 clauses per variable | Mitchell, Selman and Levesque, [*Hard and Easy Distributions of SAT Problems*](https://cdn.aaai.org/AAAI/1992/AAAI92-071.pdf) (1992) |
| Completing a Latin square | Around 42% of cells already filled, whatever the size | Gomes and Selman, [*Problem Structure in the Presence of Perturbations*](https://cdn.aaai.org/AAAI/1997/AAAI97-035.pdf) (1997) |

> **Pitfall:** evaluating a solver only on instances drawn far from the threshold (all easy) or only at the threshold (all hard) gives a false picture of its performance. Vary the source of test instances, as with [Latin squares](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme).

## Hall's theorem: when cells block each other

A **cell** with no possible value left is an easy contradiction to spot. More treacherous: several cells that each still have possible values, but **not enough between them**. Example on a row where three empty cells, because of their columns, only accept these values:

| Cell | Values still possible |
|---|---|
| A | 2 or 5 |
| B | 2 or 5 |
| C | 2 or 5 |

Each cell, taken alone, has a choice. But three cells must receive three **different** values, and they only have two to share: it is impossible.

**Hall's marriage theorem** ([P. Hall, 1935](https://doi.org/10.1112/jlms/s1-10.37.26)) says exactly when such an assignment exists: each cell can be given a value from its list, with no two cells receiving the same one, **if and only if** every group of k cells has, between them, at least k different values. The name comes from the original version: forming couples where everyone accepts their partner, with no two people sharing the same one.

This theorem gives a reassuring result about Latin squares ([M. Hall, 1945](https://projecteuclid.org/journals/bulletin-of-the-american-mathematical-society/volume-51/issue-6.P1/An-existence-theorem-for-latin-squares/bams/1183506980.full)): if k **complete** rows are already filled without repetition, the whole square can **always** be completed. The danger comes from **scattered** filled cells. A 4 × 4 grid found by exhaustive search (5 filled cells):

```
        col 1  col 2  col 3  col 4
row 1     2      1      .      .
row 2     .      .      .      4
row 3     1      3      .      .
row 4     .      .      .      .
```

| Step | Reasoning |
|---|---|
| 1 | Row 1 still has to place 3 and 4 in columns 3 and 4. Column 4 already has a 4: so 4 goes in column 3. |
| 2 | Row 3 still has to place 2 and 4 in columns 3 and 4. Same reason: 4 goes in column 3. |
| 3 | Column 3 would receive two 4s: no solution. |

Yet every empty cell has at least one possible value, and every row and every column, taken **alone**, can be completed (checked by a program). The contradiction only appears when two rows and two columns are combined.

This is the blockage observed on the Skyscraper solver: some runs reach 99.8% of variables fixed, then stay stuck for more than a minute on 56 cells scattered across 7 rows. Adding to the solver a Hall test on nearly full rows and columns (at most 16 free cells) detects these dead ends earlier: measured on 104 × 104 grids over the same 18 runs (9 grids, 2 randomness settings each), 15 finish within the set budget with this test, against 8 without.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | NP gathers the problems whose solutions can be checked quickly; NP-complete problems are the hardest in NP (SAT, Latin square, Skyscraper). NP-complete describes the worst case: real instances are often solved thanks to propagation and learning, and hard random instances concentrate near a phase transition. |
| **Tools you can use** | Reduction to SAT, then a SAT solver; the logarithm to estimate the size of a search space; Hall's theorem to detect that a group of cells does not have enough values to share. |
| **Pitfalls to avoid** | Concluding "NP-complete, so impossible in practice"; judging a solver on instances that are all easy or all at the threshold; only checking contradictions cell by cell. |
| **Best practices** | Check a solution with a separate, simple, polynomial program; measure on instances from varied sources; look for contradictions between groups of cells, not only on an isolated cell. |
