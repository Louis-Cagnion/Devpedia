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

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The same problem can be encoded in several correct ways, with speed gaps of a factor of 10 or more. The order encoding ("at least v") suits comparisons; "at most one" and counting each have several encodings. |
| **Tools you can use** | Direct and order encodings, channeling clauses; pairwise or compact "at most one"; sequential counter and totalizer for cardinalities; redundant clauses (unit ones when possible). |
| **Pitfalls to avoid** | Picking the most compact encoding without measuring (slower propagation); recomputing in each constraint information that a shared variable could carry. |
| **Best practices** | Check an encoding by brute force on small sizes; add easy deductions as unit clauses; compare encodings on many instances. |
