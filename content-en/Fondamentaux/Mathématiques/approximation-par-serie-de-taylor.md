---
order: 7
---

# Taylor Series Approximation

A **Taylor series** approximates a complicated mathematical function (`sin`, `cos`, `exp`...) with a sum of increasingly precise terms, computable using only additions and multiplications: useful when the native function (`<math.h>`) isn't available, or to understand how it's computed internally.

## The principle: adding increasingly precise terms

The series expansion of `cos(x)` is written:

```text
cos(x) ≈ 1 - x²/2! + x⁴/4! - x⁶/6! + ...
```

Each extra term refines the approximation; the more terms added, the closer the result gets to `cos(x)`'s actual value. In practice, just a few terms (5, for instance) are already enough for a precision that's largely sufficient for visual use (coloring, animation).

## Computing each term from the previous one

Computing a factorial (`6! = 720`) for every term, on every call, would be redundant. Each term is derived from the previous one with a single multiplication, never recomputing a factorial from scratch:

```c
double cosine(double x, int numberOfTerms)
{
    double result = 1.0;
    double term = 1.0;

    for (int i = 1; i <= numberOfTerms; i++) {
        term *= -x * x / ((2 * i - 1) * (2 * i)); // derived from the previous term
        result += term;
    }
    return result;
}
```

> **Note:** `term *= -x * x / ((2*i-1) * (2*i))` moves from one term to the next in a single operation: the sign alternates (`-x*x`), and dividing by `(2i-1)*(2i)` amounts to progressively multiplying the denominator by the two missing factors of the next factorial, without ever recomputing it in full.

> **Best practice:** use the native function (`cos()` from `<math.h>`) whenever it's available: more precise and already optimized. Reimplementing it via a Taylor series is only worthwhile when the standard library is unavailable or disallowed (an exercise's constraint, a minimal embedded environment).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Taylor series approximates a function with a sum of terms; each extra term improves precision, and a limited number of terms is often enough for practical use. |
| **Tools you can use** | Deriving each term from the previous one with a multiplication, rather than recomputing a factorial every time. |
| **Pitfalls to avoid** | Recomputing a full factorial for every term instead of deriving it progressively from the previous one. |
| **Best practices** | Prefer the standard library's native function whenever it's available; reserve a series-based reimplementation for a context that genuinely requires it. |
