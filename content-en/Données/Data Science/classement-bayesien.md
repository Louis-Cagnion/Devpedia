---
order: 11
---

# Bayesian Ranking: Fixing a Naive Average

Ranking items (customer reviews, restaurants, movies) by their plain **average** seems natural, but it wrongly favors small samples: a listing rated 5/5 by a single customer beats, in a pure-average ranking, a listing rated 4.8/5 by 500 customers. **Bayesian ranking** (popularized by IMDB for its movie rankings) fixes this bias.

## The problem: a perfect average isn't always reliable

| Listing | Average rating | Number of reviews | Reliable? |
|---|---|---|---|
| A | 5.0 / 5 | 2 | Not very reliable: two reviews prove almost nothing |
| B | 4.8 / 5 | 500 | Very reliable: a stable average over a large sample |

A simple average would rank A above B, even though B is clearly the more trustworthy result.

## The formula

```
adjusted_rating = (R x v + m x C) / (v + m)
```

| Variable | Meaning |
|---|---|
| `R` | The item's raw average (e.g. 5.0 for listing A) |
| `v` | The item's number of reviews (e.g. 2 for listing A) |
| `C` | The overall reference average, computed across all listings |
| `m` | Confidence threshold: the number of reviews above which `R` is really trusted over `C` |

## Interpretation: gradual smoothing, not a hard cutoff

```python
def adjusted_rating(R, v, C, m):
    return (R * v + m * C) / (v + m)

# Listing A: 5.0 over 2 reviews, against an overall average of 4.2, confidence threshold m=50
adjusted_rating(R=5.0, v=2,   C=4.2, m=50)   # ~4.23: very close to the overall reference
adjusted_rating(R=4.8, v=500, C=4.2, m=50)   # ~4.71: very close to the raw average
```

- When `v` is **large** compared to `m` (listing B): the formula tends toward the raw average `R`, the review volume is enough to trust it.
- When `v` is **small** compared to `m` (listing A): the formula tends toward the overall reference `C`, the sample is too small to trust on its own.

```text
v = 0        small v          v = m           large v          v -> infinity
  |             |                |                |                 |
  C ────────────┼────────────────┼────────────────┼─────────────────R
             close to C      halfway there    close to R         equal to R
```

No hard cutoff ("fewer than `m` reviews = listing ignored"): the transition between `C` and `R` is continuous, proportional to the number of reviews already collected.

> **Pitfall:** picking `m` arbitrarily small so a high-volume listing "wins" faster. A too-low `m` reintroduces the original problem: a listing with 3 perfect reviews becomes competitive again against a listing with 500 very good ones.
>
> **Best practice:** set `m` to a value representative of how many reviews, in the domain at hand, it actually takes for an average to start being considered reliable (often estimated empirically from the real distribution of review counts per listing).

---

## 📋 Key Takeaways

| | |
|---|---|
| **Key Points** | A raw average wrongly favors small samples. Bayesian ranking weighs each item's average by its review volume, pulling it toward an overall reference average while that volume stays low. |
| **Available Tools** | The `(R·v + m·C) / (v + m)` formula, with `m` calibrated empirically on the real review-count distribution. |
| **Pitfalls to Avoid** | Ranking by raw average without accounting for review volume; picking a too-low `m`, which cancels out the intended correction. |
| **Best Practices** | Calibrate `m` on real data rather than arbitrarily; check that the resulting ranking places high-volume, well-rated items ahead of items whose volume is too low to be trustworthy. |
