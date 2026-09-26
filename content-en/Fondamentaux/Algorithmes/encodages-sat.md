---
order: 9
---

# Encoding a Problem into SAT

A [SAT solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) only knows true/false variables and clauses. **Encoding** a problem means translating it into that language. There are almost always several correct translations, and the choice changes the solving speed by a factor of 10 or more.

Running example: the **Skyscraper** puzzle. An n × n grid contains buildings of height 1 to n, each height once per row and per column. A clue on the edge of a row says how many buildings are visible from that side: a building hides all the smaller ones behind it.

```
clue 3 ->  1  2  4  3      you see 1, then 2, then 4 (3 is hidden by 4): 3 buildings
```

## Direct Encoding or Order Encoding

| Encoding | Variables for a cell of height 1 to 4 | What a variable states |
|---|---|---|
| **Direct** | `x1, x2, x3, x4` | `x3`: "the cell is exactly 3" |
| **Order** | `y2, y3, y4` | `y3`: "the cell is **at least** 3" |

The order encoding needs "ladder" clauses: if the cell is at least 4, it is at least 3 (`¬y4 ∨ y3`), and so on. Both encodings can coexist, linked by **channeling clauses**: `x3` is true exactly when `y3` is true and `y4` false.

Why it helps here: visibility is a matter of **comparisons** ("is this building taller than all the previous ones?"). With the order encoding, "taller than 3" is a single variable, shared by the four viewing directions instead of being recomputed by each.

| Encoding of visibility | 16 × 16 grid |
|---|---|
| Direct | 0.42 s |
| Order, shared by the 4 directions | 0.03 s (13 times faster) |

## "At Least One" and "At Most One"

In a row, each height appears **at least once** (ALO, *at least one*) and **at most once** (AMO, *at most one*). "At least one" fits in a single clause: `(a ∨ b ∨ c ∨ d)`. "At most one" can be translated in several ways:

```python
from itertools import combinations

def at_most_one_pairs(xs):
    """One clause (¬a ∨ ¬b) for each pair of variables."""
    return [[-a, -b] for a, b in combinations(xs, 2)]  # -a: literal ¬a, as in DIMACS

print(at_most_one_pairs([1, 2, 3]))  # [[-1, -2], [-1, -3], [-2, -3]]
```

| Encoding of "at most one" | Clauses for 100 variables | Propagation |
|---|---|---|
| Pairwise | 4,950 (n(n-1)/2) | Maximal: as soon as one variable becomes true, all the others are forced to false in one step |
| Compact (ladder, counter) | about 300 | Goes through auxiliary variables: several propagation steps |

More compact does not mean faster: on the Skyscraper solver, the compact encoding was **50% slower** than pairs, because each deduction needed more steps. The right answer depends on the problem: you have to measure.

## Counting: the Sequential Counter

"Exactly k visible buildings" is a **cardinality constraint**: exactly k true variables among n. The **sequential counter** (Sinz, 2005) adds auxiliary variables `s[i][j]` = "among the first i variables, at least j are true", like a counter moved forward cell after cell:

```python
def at_most_k_counter(xs, k, next_var):
    """Clauses "at most k true among xs", and the next free variable number."""
    n = len(xs)
    # s[i][j]: at least j+1 true among x1..x(i+1)
    s = [[next_var + i * k + j for j in range(k)] for i in range(n)]
    clauses = []
    for i in range(n):
        # xi true => at least 1 true so far
        clauses.append([-xs[i], s[i][0]])
        if i > 0:
            # the count never goes down
            for j in range(k):
                clauses.append([-s[i - 1][j], s[i][j]])
            # xi true => the count goes up by 1
            for j in range(1, k):
                clauses.append([-xs[i], -s[i - 1][j - 1], s[i][j]])
            # already k true: xi is forbidden
            clauses.append([-xs[i], -s[i - 1][k - 1]])
    return clauses, next_var + n * k
```

Checked by brute force on 5 variables with k = 2: the 21 clauses produced (with 10 auxiliary variables) accept exactly the combinations where at most 2 variables are true. For "exactly k", you add the other direction ("at least k"). A well-known alternative is the **totalizer** (Bailleux and Boufkhad, 2003), which counts through a tree of small counters instead of a chain.

## Adding Redundant Clauses

A **redundant** (or *implied*) clause can already be deduced from the others: it does not change the set of solutions. It still helps the solver, because it hands over a deduction the solver would otherwise have to rediscover through search.

Example: the Skyscraper **edge rules**. With clue k on the edge of a row of n cells, the cell at position d (counting from that edge, d = 1 for the first) is at most n − k + d. Checked on every row of 4 cells with clue 3:

| Cell | Possible heights | Rule: at most 4 − 3 + d |
|---|---|---|
| 1 | 1, 2 | 2 |
| 2 | 1, 2, 3 | 3 |
| 3 | 1 to 4 | 4 |

Each rule becomes **unit clauses** (a single literal, for example "cell 1 is not 3"), true before any search. Measured on the Skyscraper solver: 2.4 times faster (13 × 13 grid: 0.30 → 0.13 s). Another redundant fact added at no cost: the tallest building among the first i cells of a row is at least i, since they all have different heights.

## Naming a Subformula: Definitional Auxiliary Variables

A constraint like "cell i is visible" unfolds into a long formula (it depends on every cell that comes before it). Copying it out every time it is used would make the encoding explode in size. The **[Tseitin transformation](https://doi.org/10.1007/978-3-642-81955-1_28)** (1968) avoids this: a new variable is invented to **name** the subformula, with clauses that force it to equal whatever it names. These variables did not exist in the problem statement: they are **definitional**, added only to shorten the encoding.

```python
from itertools import product


def tseitin_and_clauses(p, a, b):
    """Clauses forcing p <-> (a and b); -x means "not x"."""
    return [[-p, a], [-p, b], [p, -a, -b]]          # p ⇒ a, p ⇒ b, (a and b) ⇒ p


def satisfied(clause, values):
    """True if at least one literal of the clause is true."""
    return any(values[abs(lit)] == (lit > 0) for lit in clause)


matches = 0
for a, b, p in product((False, True), repeat=3):    # the 8 possible combinations
    values = {1: a, 2: b, 3: p}                       # variables: a = 1, b = 2, p = 3
    clauses_ok = all(satisfied(c, values) for c in tseitin_and_clauses(3, 1, 2))
    matches += clauses_ok == (p == (a and b))         # agrees with the definition of p?
print(f"{matches}/8 combinations agree")
```

```
8/8 combinations agree
```

The 3 clauses accept exactly the combinations where p equals "a and b": p really is a name for this subformula. In the Skyscraper solver, two subformulas are named this way: "tallest height seen among the first i cells of a row" and "cell i is visible". Without these two families of auxiliary variables, each visibility constraint would go back to being a formula whose size is proportional to the number of cells before it, instead of a handful of clauses tied to a shared variable: on a 72 × 72 grid, these definitional variables make up 68% of the encoding's total variables.

## Implicit Clauses: Recovered by Computation Rather than Stored

Some clause families have a **regular structure**: their literals follow from an index (cell number, height, position in the row) through a simple formula. Storing them one by one wastes memory on information that could be recomputed. An **implicit clause** is therefore never written into an array: it is rebuilt at the moment the solver needs it, by computing indices.

This complicates one specific point: when the solver deduces that a variable is true, it must remember **why** (the clause that forced it), in order to reconstruct that reasoning later during conflict analysis. If the clause is not stored, this reason must also be encoded compactly: on 32 bits, a few high-order bits name the **family** of clause involved, and the remaining bits carry the number of an **anchor variable**, from which the whole clause can be recomputed.

| Approach | What is stored | Memory (72 × 72 grid) | Speed (48 × 48 grid) |
|---|---|---|---|
| Enumerated clauses | Every literal of every regular clause | 674 MB | baseline |
| Implicit clauses (family + anchor) | A 32-bit code per reason, clause recomputed | 263 MB | 1.5 times faster |

## Propagators and Lazy Clause Generation

A **propagator** is dedicated code for a global constraint (for example "all these variables take different values"): instead of translating the constraint into clauses ahead of time, the solver directly runs the algorithm that knows how to derive consequences from it. The propagator only produces an **explanation clause** (why some variable was forced) when [conflict analysis](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) actually needs one: translation into clauses therefore happens on demand rather than all at once upfront, hence the name **[lazy clause generation](https://doi.org/10.1007/s10601-008-9064-x)** (Ohrimenko, Stuckey and Codish, 2009). The implicit clauses from the previous section are a simple form of this, hand-written for a single constraint; lazy clause generation generalizes the idea to any global constraint through a propagator. This is the principle behind hybrid solvers that combine SAT and constraint programming, such as [Chuffed](https://github.com/chuffed/chuffed) or [OR-Tools](https://github.com/google/or-tools)'s CP-SAT solver.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The same problem can be encoded in several correct ways, with speed gaps of a factor of 10 or more. The order encoding ("at least v") suits comparisons; "at most one" and counting each have several encodings. An auxiliary variable can name a subformula (Tseitin); a regularly structured clause can stay implicit (recovered by computation); a propagator can defer translation into clauses until an explanation is requested (lazy clause generation). |
| **Tools you can use** | Direct and order encodings, channeling clauses; pairwise or compact "at most one"; sequential counter and totalizer for cardinalities; redundant clauses (unit ones when possible); definitional auxiliary variables; implicit clauses (reason encoded as family + anchor); propagators and lazy clause generation. |
| **Pitfalls to avoid** | Picking the most compact encoding without measuring (slower propagation); recomputing in each constraint information that a shared variable could carry; storing a regularly structured clause instead of recomputing it. |
| **Best practices** | Check an encoding by brute force on small sizes; add easy deductions as unit clauses; compare encodings on many instances; reserve implicit clauses and propagators for genuinely regular families, measured before and after. |
