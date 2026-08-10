---
order: 3
---

# The Logarithm

This chapter introduces the logarithm, a concept used further on to measure how good or bad a prediction is in a machine learning model.

## The inverse of a power

Raising a number to a power (`b^y`) means multiplying `b` by itself `y` times: `10^3 = 10 × 10 × 10 = 1000`. The **logarithm** asks the reverse question: to what power must a given base be raised to get a given number?

```text
10^2 = 100    ->  log10(100) = 2   ("10 must be raised to the power 2 to get 100")
10^3 = 1000   ->  log10(1000) = 3
10^0 = 1       ->  log10(1) = 0
```

> **Analogy:** folding a sheet of paper in half, repeating the operation. After 1 fold, 2 layers; after 2 folds, 4; after 3, 8. `log2(8) = 3` answers exactly the question "how many times do you need to fold the sheet to get 8 layers?".

## Common bases

| Base | Notation | Answers | Typical field of use |
|---|---|---|---|
| 10 | `log10(x)` or `log(x)` | How many times to multiply by 10? | Orders of magnitude, scales (Richter, decibels) |
| 2 | `log2(x)` | How many times to double? | Computer science (searching a tree, algorithm complexity) |
| *e* (≈ 2.718) | `ln(x)` | No question as intuitive as the two above — this base is chosen because it simplifies many mathematical computations | Most formulas used in statistics and machine learning |

> **Pitfall:** confusing bases. `log2(8) = 3` but `log10(8) ≈ 0.9` — the result depends entirely on the chosen base, two logarithms of different bases are never directly comparable without conversion.
>
> **Best practice:** always check which base a function or formula uses before interpreting its result (`log` in Python, for instance, refers to the **natural** logarithm — base *e* — not base 10, contrary to what the name might suggest).

## The shape of its curve: very slow for large x, very fast near 0

The graph below places each point `(x, log10(x))` at its actual position, on a **linear** x-axis (each horizontal gap represents the same gap in `x`, unlike the table further down):

```plot-fonction
fn: x => log(x)
domaine: 0.05, 12
label: log10(x)
```

Between `x = 0.1` and `x = 1` (a tiny portion of this linear axis), the curve already climbs from -1 to 0: a change of 1 unit. Between `x = 1` and `x = 10` (nine times wider), it only climbs from 0 to 1: the **same** change of 1 unit, but spread over a much larger distance. The visual result is this asymmetric shape: a steep climb on the left (near 0), then a gradual flattening as `x` grows.

This compression near 0 continues without limit: the closer `x` gets to 0, the more `log10(x)` plunges toward large negative numbers, over an increasingly narrow range of `x` (see the table below). A formula that applies `-log(x)` to a number close to 0 inherits this same compression: the result explodes over a tiny interval, one way to heavily penalize a result that's nearly zero.

| x | log10(x) |
|---|---|
| 0.001 | -3 |
| 0.01 | -2 |
| 0.1 | -1 |
| 1 | 0 |
| 10 | 1 |
| 100 | 2 |
| 1,000 | 3 |

## Pitfall: the logarithm isn't defined everywhere

`log(0)` isn't defined — the value decreases without limit as `x` gets closer to 0, never reaching a finite result. The logarithm of a negative number isn't defined either (within the real numbers).

> **Pitfall:** applying a logarithm to a value that can be exactly 0 (a probability, for instance) causes an error or an infinite value in a program, not an unusual but valid result.
>
> **Best practice:** in a computation that applies a logarithm to a probability, adding a tiny value before the computation (`log(p + 0.0000001)`, for instance) avoids this edge case, rather than letting the computation fail or return an infinite value.

## Useful property: turning multiplication into addition

```text
log(a × b) = log(a) + log(b)
```

This property makes it possible to replace a multiplication with an addition, generally simpler to compute and less prone to producing a number that becomes too small or too large to represent correctly in memory (see [floating-point numbers](/?c=representation-des-donnees&p=nombres-flottants)) — especially useful when a great many small numbers need to be multiplied together.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | The logarithm answers "to what power must this base be raised to get this number?" — the inverse of a power. It grows very slowly for large values, and drops toward negative infinity near 0. |
| **Tools you can use** | `log10()`, `log2()`, `log()` (natural, base *e*) in most languages — systematically check which one is being used. |
| **Pitfalls to avoid** | Confusing two logarithms of different bases. Applying a logarithm to a value that can be 0 or negative. |
| **Best practices** | Check the base used by a function before interpreting its result. Add a small value before a `log()` applied to a probability, to avoid `log(0)`. |
