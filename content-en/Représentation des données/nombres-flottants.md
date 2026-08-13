---
order: 2
---

# Floating-Point Numbers (IEEE 754)

This is probably the most confusing behavior in programming, and the one most often blamed on the wrong culprit:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

This result is identical in JavaScript, [Python](/?c=langages-de-programmation&s=python&p=python), [C](/?c=langages-de-programmation&s=c&p=c), [PHP](/?c=langages-de-programmation&s=php&p=php), [Java](https://docs.oracle.com/en/java/), and [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). So it's **not** a flaw in any one language: it's a consequence of how the processor encodes decimal numbers, described by the **IEEE 754** standard, which all these languages use because the hardware requires it.

## Why an approximation?

In base 10, some fractions have no finite decimal representation: `1/3 = 0.333...` — you have to stop somewhere, so you write an approximation.

The same phenomenon exists in base 2, but **with different numbers**. A number has a finite binary representation only if its denominator is a power of 2:

| Number | In binary | Exact? |
|---|---|---|
| `0.5` (= 1/2) | `0.1` | yes |
| `0.25` (= 1/4) | `0.01` | yes |
| `0.75` (= 3/4) | `0.11` | yes |
| `0.1` (= 1/10) | `0.0001100110011...` | **no**, infinitely repeating |

`0.1` is perfectly simple in decimal and infinite in binary. The machine therefore has to truncate it: what's actually stored is the closest float to `0.1`, not `0.1`. Adding two approximated values compounds the gaps, and the result of `0.1 + 0.2` lands on a float very slightly above the one representing `0.3`.

> What's displayed isn't a display error: `0.30000000000000004` **is** the stored value, expressed in decimal.

## How a float is encoded

A float is stored in three parts, like scientific notation in binary (± mantissa × 2^exponent):

```text
[ sign: 1 bit ][ exponent ][ mantissa ]
```

| Type | Total | Sign | Exponent | Mantissa | Reliable decimal digits |
|---|---|---|---|---|---|
| `float` (single precision) | 32 bits | 1 | 8 | 23 | ~7 |
| `double` (double precision) | 64 bits | 1 | 11 | 52 | ~15-16 |

- the **sign** indicates positive or negative;
- the **exponent** gives the order of magnitude — it's what lets both `10⁻³⁰⁰` and `10³⁰⁰` be represented;
- the **mantissa** carries the significant digits, and it's what **limits precision**.

This trade-off is the heart of the matter: a float sacrifices precision to cover a huge range of values with few bits. Since the number of mantissa bits is fixed, precision is **relative**: the larger a number is, the bigger the gap between two consecutive floats.

```text
1.0  and the next float  : gap of about 2.2e-16
1e9  and the next float  : gap of about 1.2e-7
1e16 and the next float  : gap of about 2.0
```

From 2⁵³ onward (about 9 × 10¹⁵), the gap exceeds 1: neighboring integers become **indistinguishable**, because the 52-bit mantissa is no longer enough to tell them apart.

## The practical consequence: never test for equality

Since two mathematically equivalent computations can produce different floats, `==` on floats is almost always a latent bug. You compare the **gap** against an acceptable margin of error, called epsilon:

```text
if absolute_value(a - b) < epsilon  ->  consider a and b equal
```

In C:

```c
#include <math.h>

double epsilon = 0.0001;
if (fabs(a - b) < epsilon) { /* considered equal */ }
```

In Python:

```python
import math
math.isclose(0.1 + 0.2, 0.3)     # True -> handles the tolerance for you
```

In JavaScript:

```js
Math.abs(a - b) < 0.0001;
```

**Which epsilon to choose?** It depends on the domain, not the language. For prices to the cent, `0.001` is enough. Don't systematically use the "machine epsilon" (the smallest representable gap around 1, `2.22e-16` in double precision): it's correct for values close to 1, but **too strict** for large values, where the natural gap between two floats already far exceeds it.

## The case of money: don't use floats

For monetary amounts, the right answer isn't to adjust epsilon but to **change representation**: count in cents, using integers.

```text
price_in_cents = 1999      // $19.99
total = price_in_cents * 3 // 5997, exact
```

This is also why databases distinguish `DECIMAL` (exact, base 10) from `FLOAT` (approximate): an amount is stored as `DECIMAL`. See the [SQL](/?c=domain-specific-languages-dsl&p=sql) chapter.

## Special values

The standard reserves certain bit combinations for special values, present in every language:

- **infinities**: produced by an overflow or a division by zero (`1.0 / 0.0`);
- **NaN** (*Not a Number*): the result of an invalid operation (`0.0 / 0.0`, the square root of a negative number).

`NaN` has a deliberately surprising property: **it's equal to nothing, not even itself**. `NaN == NaN` is false. This is consistent — two invalid results have no reason to be "the same number" — but it means a dedicated function is required to detect it (`isnan()` in C, `math.isnan()` in Python, `Number.isNaN()` in JavaScript).

## What each language adds on top

The foundation is common; languages only differ in the packaging:

| Language | Specifics |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | Explicit `float` / `double` / `long double`, `fabs()`, `isnan()` |
| JavaScript | A single `number` type (always a double), `BigInt` for large integers — see [Numbers](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, natively arbitrary-size integers, `math.isclose()`, the `decimal` module |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Above all, remember that these differences change nothing about the fundamentals: the hardware decides, and it decides the same way for everyone.

## Summary

| Key point | Why |
|---|---|
| `0.1 + 0.2 != 0.3` in every language | Binary encoding, not a language bug |
| Never compare two floats with `==` | Two equivalent computations give different bits |
| Compare via an epsilon suited to the domain | Precision is relative to the order of magnitude |
| Monetary amounts as integers or `DECIMAL` | No approximation is tolerable for money |
| Exact integers up to 2⁵³ in double precision | The mantissa is 52 bits |
| `NaN != NaN` | An invalid value equals nothing, including itself |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A float (IEEE 754 standard) stores an approximation, not an exact value — `0.1 + 0.2 != 0.3` in every language, with no exception. Precision is relative: the larger a number is, the bigger the gap between two consecutive floats. |
| **Tools you can use** | Epsilon-based comparison (`math.isclose`, `fabs(a-b) < epsilon`), `DECIMAL` types for exact amounts. |
| **Pitfalls to avoid** | Comparing two floats with `==`; storing a monetary amount as a float rather than as integers (cents) or `DECIMAL`. |
| **Best practices** | Choose an epsilon suited to the order of magnitude being handled, never the default machine epsilon for large values. |
