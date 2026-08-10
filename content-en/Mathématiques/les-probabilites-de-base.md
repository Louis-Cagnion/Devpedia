---
order: 4
---

# Basic Probability

This chapter introduces probability, a concept used further on to describe what a model predicts: not a single, certain answer, but several possible answers, each with its own chance of happening.

## What is a probability?

A **probability** measures how likely an event is to happen — a number between 0 (impossible) and 1 (certain).

| Value | Meaning | Example |
|---|---|---|
| 0 | Impossible | Rolling a 7 on a 6-sided die |
| 0.5 | Equally likely to happen or not | Getting heads on a fair coin flip |
| 1 | Certain | Rolling a number less than 10 on a 6-sided die |

> **Analogy:** a gauge graduated from 0 to 1, like a fuel gauge, but measuring confidence that an event will happen rather than a quantity of fuel.

This is written `P(event) = value`. For a fair 6-sided die (each face equally likely to come up): `P(rolling a 3) = 1/6 ≈ 0.167`.

## A probability distribution: several outcomes, one total

When an event has several possible outcomes, each gets its own probability — the set of these probabilities is called a **probability distribution**:

```text
Fair 6-sided die:

P(1) = 0.167
P(2) = 0.167
P(3) = 0.167
P(4) = 0.167
P(5) = 0.167
P(6) = 0.167
        -----
Total = 1.000
```

No matter how the probabilities are split across the possible outcomes, they always add up to exactly **1** — one of the listed outcomes is bound to happen, there's nothing outside this list.

> **Pitfall:** a distribution computed by a program that doesn't sum to exactly 1 (imprecise rounding, a possible outcome forgotten in the computation) isn't a valid probability distribution.
>
> **Best practice:** after computing a probability distribution, check that its values do sum to 1 (or very close, accounting for rounding) before using it further in a computation.

## A distribution isn't necessarily balanced

Nothing requires every outcome to have the same probability as the others — a fair 6-sided die is a special case, not the general rule:

```text
Weather heavily favoring rain:

P(rain)  = 0.80
P(sun)   = 0.15
P(snow)  = 0.05
             -----
Total      = 1.00
```

The most likely outcome (rain, here) isn't the only possible one — just the one with the highest probability. This distinction will come back up unchanged later on: a model that predicts "probably X" always leaves open the possibility of a different outcome, with a lower but non-zero probability.

> **Pitfall:** confusing "the most likely outcome" with "the only possible outcome" — a probability of 0.80 still means a 20% chance of something else, not a certainty.
>
> **Best practice:** reason about the whole distribution rather than just its most likely outcome, whenever less likely outcomes carry significant consequences if they happen anyway.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A probability is a number between 0 (impossible) and 1 (certain). A probability distribution lists the probability of each possible outcome; these probabilities always sum to 1. The most likely outcome isn't the only possible one. |
| **Tools you can use** | No specific tool — the notation `P(event) = value` is enough to reason on paper. |
| **Pitfalls to avoid** | A distribution that doesn't sum to exactly 1 (computation error). Confusing "most likely" with "certain". |
| **Best practices** | Check that a computed distribution does sum to 1 before using it. Reason about the whole distribution, not just its most likely outcome, when rare outcomes carry significant consequences. |
