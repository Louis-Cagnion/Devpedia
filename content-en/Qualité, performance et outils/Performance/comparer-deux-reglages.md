---
order: 11
---

# Comparing Two Settings: Pairing, the Sign Test and Multiple Comparisons

"Is this setting better than the other one?" The question looks simple, but a stopwatch or a counter only answers for **one case**: one grid, one seed, one run. This chapter shows how to conclude honestly from several cases, with the real measurements of the research on the [Skyscraper solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): comparing each case with itself, measuring the gap with the sign test, not being fooled by a large number of comparisons, and not judging a setting on the cases that were used to choose it.

Vocabulary: a **setting** is a way of launching the program (an option, a threshold); a **grid** is a test case; a **seed** is the number that initializes the solver's randomness: two seeds give two different paths through the same grid.

## Why an average is not enough

| Source of variation | Measured order of magnitude |
|---|---|
| Same program, same grid, two timings | ±15% of time |
| Two alternating measurement rounds of the same binary | Up to 3.6% gap |
| Same grid, two seeds | Solved in one case, stuck in the other |
| Propagation counter, same program and same seed | Identical on every run |

Two consequences:

| Rule | Why |
|---|---|
| Compare on **work counters** (propagations, conflicts) rather than on time | A counter does not move from one run to the next (see [comparing on work counters](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparing-on-work-counters-not-only-on-time) and [measuring in alternating rounds](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#measuring-in-alternating-rounds)) |
| Do not trust an average that contains failures | An unsolved grid counts for the whole budget (400 million propagations): the average depends on the chosen budget, not only on the solver. At 64 × 64, 187 million propagations on average without Régin filtering and 97 million with it, but 12 grids out of 40 count for 400 million in the first case |

## Pairing: each grid against itself

Comparing the averages of two settings mixes two things: the difference between the settings and the difference between the grids. **Pairing** removes the second: each grid is run with both settings and the **pair** of results is compared. For a "solved or not" result, each grid falls into one of four boxes:

| | Solved with B | Not solved with B |
|---|---|---|
| **Solved with A** | Concordant: says nothing about the direction of the gap | **Discordant**: A wins |
| **Not solved with A** | **Discordant**: B wins | Concordant: says nothing |

Only the **discordant** grids inform the comparison.

## The sign test

If the two settings were equivalent, each discordant grid would go one way or the other like a coin toss (see [probabilities](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). The **sign test** computes the probability of getting, by chance alone, a gap at least as clear as the one observed: this is the **p-value**. It does not say "B is better with such a probability": it only says how **surprising** the data would be if A and B were equivalent.

Real data: 40 grids of 64 × 64, without then with Régin filtering (see [Régin filtering](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin)):

```python
from math import comb

# One letter per grid (64 x 64, same 40 grids): 1 = solved, 0 = not solved
without_regin = "1111111110111110101010010011011111010011"
with_regin = "1111111111111111111111111111111111111101"


def sign_test(pro, con):
    """Probability of a gap at least this clear, if the two settings were equivalent."""
    n = pro + con                           # only the discordant grids count
    k = max(pro, con)
    one_sided = sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n
    return one_sided, min(1.0, 2 * one_sided)


def compare(start, end):
    """Compares the two settings on grids start to end (excluded)."""
    a, b = without_regin[start:end], with_regin[start:end]
    both = sum(x == "1" and y == "1" for x, y in zip(a, b))
    pro = sum(x == "0" and y == "1" for x, y in zip(a, b))       # only with Régin
    con = sum(x == "1" and y == "0" for x, y in zip(a, b))       # only without
    neither = len(a) - both - pro - con
    one_sided, two_sided = sign_test(pro, con)
    print(f"grids {start + 1:2}-{end:2}: both {both:2}, only with {pro:2}, "
          f"only without {con}, neither {neither}; "
          f"p = {one_sided:.4f} (one-sided), {two_sided:.4f} (two-sided)")


compare(0, 40)
compare(0, 20)
compare(20, 40)
```

```
grids  1-40: both 27, only with 12, only without 1, neither 0; p = 0.0017 (one-sided), 0.0034 (two-sided)
grids  1-20: both 16, only with  4, only without 0, neither 0; p = 0.0625 (one-sided), 0.1250 (two-sided)
grids 21-40: both 11, only with  8, only without 1, neither 0; p = 0.0195 (one-sided), 0.0391 (two-sided)
```

| Reading | Value |
|---|---|
| 40 grids: 12 won by Régin, 1 lost | `p = 0.0034` (two-sided): very unlikely by chance |
| Grids 1 to 20 alone: 4 against 0 | `p = 0.125`: too few grids to conclude |
| Grids 21 to 40 alone: 8 against 1 | `p = 0.039`: under 5%, but far from 0.0034 |

Two clarifications:

| Clarification | Explanation |
|---|---|
| **One-sided or two-sided** | The one-sided test expects a gap in one direction only (Régin better); the two-sided one accepts both directions. With no reason to predict the direction before measuring, the two-sided one (twice as large) is the prudent choice |
| **The 40 grids mix two roles** | The Régin threshold that was kept (`REGINK=16`) had been chosen by looking at grids 1 to 20 among several settings. To judge honestly, grids the choice has not seen are needed: 8 against 1 on grids 21 to 40, that is `p = 0.039`, a result more fragile than the `0.0034` of the 40 pooled grids |

## Several comparisons at once

A 5% threshold means: once in twenty, a "significant" gap appears **by chance**. With a single comparison this is acceptable; with seven settings compared to the same reference, there is a much greater chance that at least one looks significant without being so. The **Bonferroni correction** then requires from each comparison a threshold divided by the number of comparisons (here `0.05 / 7 = 0.0071`).

```python
from math import comb

reference = "1111111110111110101010010011011111010011"   # 40 grids, without Régin

# Seven variants of the same mechanism, compared with the same reference (1 = grid solved)
variants = {
    "REGIN=1, all lines (grids 1-20)":  ("11111110110111111111", 0),
    "REGINMAX=96 (grids 1-20)":                 ("11011111111111111111", 0),
    "REGINMAX=128 (grids 1-20)":                ("11110011111111111001", 0),
    "REGINMAX=192 (grids 1-20)":                ("11111110111101101111", 0),
    "REGINK=24 (grids 1-20)":                   ("11101111111111111001", 0),
    "REGINK=16 (grids 1-20)":                   ("11111111111111111111", 0),
    "REGINK=12 (grids 21-40)":                  ("11011110111111111111", 20),
}


def p_two_sided(pro, con):
    n, k = pro + con, max(pro, con)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n)


threshold = 0.05 / len(variants)                             # Bonferroni correction
print(f"threshold per comparison: {threshold:.4f}")
for name, (outcome, start) in variants.items():
    ref = reference[start:start + 20]                        # same grids
    pro = sum(r == "0" and v == "1" for r, v in zip(ref, outcome))
    con = sum(r == "1" and v == "0" for r, v in zip(ref, outcome))
    p = p_two_sided(pro, con)
    flag = "< 0.05" if p < 0.05 else ""
    print(f"{name:44} {pro} against {con}   p = {p:.3f}   {flag}")

# And if the seven variants were all equivalent to the reference?
import random

random.seed(5)
campaigns, alerts_5, alerts_bonferroni = 2000, 0, 0
for _ in range(campaigns):
    ps = []
    for _ in range(len(variants)):
        pro = con = 0
        for _ in range(20):                                  # 20 grids, same chance
            a, b = random.random() < 0.7, random.random() < 0.7
            pro += b and not a
            con += a and not b
        ps.append(p_two_sided(pro, con))
    alerts_5 += min(ps) < 0.05                               # one "significant" variant
    alerts_bonferroni += min(ps) < threshold
print(f"false alarms: {alerts_5 / campaigns:.1%} of campaigns at 0.05, "
      f"{alerts_bonferroni / campaigns:.1%} with the {threshold:.4f} threshold")
```

```
threshold per comparison: 0.0071
REGIN=1, all lines (grids 1-20)              4 against 2   p = 0.688   
REGINMAX=96 (grids 1-20)                     4 against 1   p = 0.375   
REGINMAX=128 (grids 1-20)                    3 against 3   p = 1.000   
REGINMAX=192 (grids 1-20)                    3 against 2   p = 1.000   
REGINK=24 (grids 1-20)                       3 against 2   p = 1.000   
REGINK=16 (grids 1-20)                       4 against 0   p = 0.125   
REGINK=12 (grids 21-40)                      7 against 1   p = 0.070   
false alarms: 13.9% of campaigns at 0.05, 1.2% with the 0.0071 threshold
```

| Observation | Reading |
|---|---|
| None of the seven real variants reaches 5% on 20 grids | No difference **proven**: this is not the same as "no difference". `REGINK=16` wins 4 grids and loses none, which is too little at 20 grids; with 40 grids, the effect is clear |
| If the seven variants were equivalent, a campaign would produce at least one false alarm at 5% in 13.9% of cases | The nominal 5% threshold no longer holds when several settings are tested (the sign test is prudent, so the excess is smaller than the 30% of the naive computation) |
| With the Bonferroni threshold, 1.2% of false alarms | The correction brings the risk under 5%, at the price of spotting fewer modest effects |

The vivification of learned clauses (see [the chapter on solvers](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)) gave 17 grids won against 8 lost (`p` close to 0.05) among 4 comparisons made: with a threshold of `0.05 / 4 = 0.0125`, this is not significant, and the result was not confirmed at 108 × 108.

## Selection bias: choosing and judging on the same grids

When many settings are tried on the same grids and the best one is kept, **the best one is partly the luckiest**. On new grids, it falls back toward the average. Simulation: 162 settings that are **all equivalent** (4 grids out of 100 exceed the time limit for each), measured on the same 100 grids; the best one is kept then re-measured on 100 fresh grids:

```python
import random

random.seed(3)
P_TIMEOUT = 0.04            # all settings are equivalent: 4 grids out of 100 time out


def timeouts(n=100):
    """Number of grids that time out among n randomly drawn grids."""
    return sum(random.random() < P_TIMEOUT for _ in range(n))


apparent, real = 0, 0
for _ in range(1000):                                        # 1000 selection campaigns
    runs = [timeouts() for _ in range(162)]                  # 162 settings, same 100 grids
    apparent += min(runs)                                    # keep the best
    real += timeouts()                                       # re-measured on 100 fresh grids
print(f"best setting chosen: {apparent / 1000:.2f} timeouts on the grids of the choice")
print(f"the same setting, on new grids: {real / 1000:.2f} timeouts")
```

```
best setting chosen: 0.06 timeouts on the grids of the choice
the same setting, on new grids: 3.96 timeouts
```

The best setting looks almost perfect on the grids that selected it, and falls back exactly to the level of all the others on fresh grids. Two real cases from the research:

| Case | Finding |
|---|---|
| A setting chosen on the 8 grids where the reference failed (`RANDFREQ=300`) | 8 grids out of 8 solved, but 8 timeouts out of 100 grids against 4 for the reference (see [the evaluation trap](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#the-evaluation-trap-selection-bias-and-regression-to-the-mean)) |
| The best of 162 portfolios ranked on the same 100 grids | About 4 timeouts expected on new grids, not 1 |

Remedy: decide on grids **set aside from the start** (a confirmation set), and fix the threshold before looking.

## Simulating a portfolio from copies measured alone

A [portfolio](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#portfolios-of-independent-trajectories-the-p-k-law) launches 4 copies of the solver in parallel and keeps the first one to finish. Since each copy is deterministic, measuring each one **alone** is enough: the portfolio time is that of the copy with the fewest propagations, multiplied by the cost of one propagation (63.6 ns measured with 4 processes), plus 0.4 s of startup. Hundreds of combinations can then be compared without rerunning them:

```python
NS_PER_PROPAGATION = 63.6e-9      # measured cost of one propagation with 4 processes
STARTUP = 0.4                     # encoding and launch, in seconds
CAP = 90                          # a grid beyond that counts as 90 s

# Propagations of each copy run alone (None: not solved), 108 x 108 grids
runs = {
    "grid 1":  ([1160198340, 1079061713, 965580745, 1121869261],
                  [1161081253, 1080793391, None, 1128429894]),
    "grid 2":  ([935030775, 873949674, None, 1030612002],
                  [935461446, 870245776, None, 1029000510]),
    "grid 36": ([None, None, None, None], [None, None, None, 855762975]),
    "grid 44": ([None, None, None, None], [1164445761, 918386044, 880153114, 900765717]),
    "grid 45": ([None, None, None, None], [930976402, 978540372, 826546571, None]),
}


def portfolio_time(copies):
    """The first process to finish wins: the fewest propagations, times their cost."""
    solved = [p for p in copies if p is not None]
    if not solved:
        return CAP
    return min(CAP, min(solved) * NS_PER_PROPAGATION + STARTUP)


print(f"{'grid':12} {'without Régin':>12} {'with Régin':>12}")
for name, (reference, regin) in runs.items():
    t_ref, t_regin = portfolio_time(reference), portfolio_time(regin)
    print(f"{name:12} {t_ref:11.1f} s {t_regin:11.1f} s")
```

```
grid         without Régin   with Régin
grid 1              61.8 s        69.1 s
grid 2              56.0 s        55.7 s
grid 36             90.0 s        54.8 s
grid 44             90.0 s        56.4 s
grid 45             90.0 s        53.0 s
```

Grid 1 is a useful reminder: Régin is **slower** there (69.1 s against 61.8 s), because the search trajectory is different. No single grid settles anything. On the 100 real grids at 108 × 108, the simulation gives 56.6 s and 4 timeouts without Régin against 53.0 s and no timeout with it, Régin being faster on 73 grids against 27 (sign test on these 100 grids: `p` below 0.00001). It finds exactly the real timeouts (grids 36, 44, 45 and 86 at 108 × 108; 31, 42 and 76 at 104 × 104); the real measurement gives 49.3 s: the simulation is slightly pessimistic.

## Checking a uniform draw: the χ² test

The test grids must represent the problem, not only the generator that produces them. For [Latin squares](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme#the-jacobson-matthews-chain), the Jacobson and Matthews generator must draw each square with the same probability. The **χ² test** (chi-square) compares the number of times each square came out with what would be expected from a uniform draw. Below, a random draw among 576 possibilities (the 576 Latin squares of 4 × 4) replaces the generator, once uniform and once biased:

```python
import random

CELLS = 576                       # the 576 Latin squares of 4 x 4
DRAWS = 57600                     # 100 draws expected per square
random.seed(2)


def chi2(draws):
    """Sum of (observed - expected)^2 / expected over the 576 cells of the counting table."""
    counts = [0] * CELLS
    for t in draws:
        counts[t] += 1
    expected = len(draws) / CELLS
    return sum((c - expected) ** 2 / expected for c in counts)


uniform = [random.randrange(CELLS) for _ in range(DRAWS)]
# a biased draw: the first 100 squares come out a little more often
biased = [random.randrange(CELLS) if random.random() < 0.9 else random.randrange(100)
          for _ in range(DRAWS)]
print(f"uniform draw: chi2 = {chi2(uniform):.0f}")
print(f"biased draw:  chi2 = {chi2(biased):.0f}")
spread = (2 * (CELLS - 1)) ** 0.5
print(f"expected if uniform: {CELLS - 1} with a spread of about {spread:.0f}")
```

```
uniform draw: chi2 = 556
biased draw:  chi2 = 3466
expected if uniform: 575 with a spread of about 34
```

| Result | Reading |
|---|---|
| χ² = 556 for 576 possible squares | Close to 575 (the number of degrees of freedom), within one spread (about 34): compatible with a uniform draw |
| χ² = 3466 for a biased draw | Far above: the bias is detected |

Real measurement on the research generator: all 576 squares of 4 × 4 appear and χ² = 557 for 575 ± 34 expected. The test does not **prove** uniformity: it simply detected nothing. It is complemented by a check on the problem itself: at 104 × 104, the simulated reference portfolio gives 47.3 s on 20 uniform grids against 50.4 s on the 100 official grids, with no timeout; at 72 × 72, 6.2 s against 6.5 s. The solver is not tuned on the official generator alone.

## The pitfalls

| Pitfall | What happens | Remedy |
|---|---|---|
| Comparing averages on different grids | The difference between grids hides (or creates) the one between settings | Pair: same grids, same seeds |
| Counting failures as the budget in an average | The average depends on the budget, not only on the solver | Compare the numbers of solved grids and the counters on the grids solved by both |
| Concluding from a `p` above 0.05 that there is no difference | Too few grids: a real effect goes unnoticed (`REGINK=16` at 20 grids) | Add fresh grids, without touching the threshold along the way |
| Testing several settings at the same 5% threshold | False alarms (13.9% with 7 settings) | Correct the threshold (Bonferroni) or announce the number of comparisons made |
| Keeping the best setting and judging it on the same grids | The result is optimistic (0.06 against 3.96 timeouts in the simulation) | A confirmation set set aside from the start |
| Judging a single grid | A setting that is better on average can lose on some grids (grid 1) | Look at the 100 grids and the sign test |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | To compare two settings: same grids for both (pairing), work counters rather than time, the sign test on the discordant grids. The p-value measures how surprising the gap would be if the settings were equivalent. Several comparisons raise the false alarms; choosing then judging on the same grids is optimistic. |
| **Tools you can use** | The sign test (`math.comb`), the Bonferroni correction, a set of confirmation grids, simulating a portfolio from copies measured alone, the χ² test to check a uniform draw. |
| **Pitfalls to avoid** | Comparing averages, counting failures as the budget, reading a high `p` as proof of equivalence, multiplying comparisons without correcting the threshold, judging on the grids of the choice. |
| **Best practices** | Decide the number of grids and the threshold before measuring. Set fresh grids aside to confirm. Announce all the comparisons made. Check the result on several sources of grids. |
