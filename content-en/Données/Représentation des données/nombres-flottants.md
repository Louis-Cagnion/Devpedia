---
order: 2
---

# Floating-Point Numbers (IEEE 754)

This is probably the most confusing behavior in programming, and the one most often blamed on the wrong culprit:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

This result is identical in [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), [Python](/?c=langages-de-programmation&s=python&p=python), [C](/?c=langages-de-programmation&s=c&p=c), [PHP](/?c=langages-de-programmation&s=php&p=php), [Java](https://docs.oracle.com/en/java/), and [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). So it's **not** a flaw in any one language: it's a consequence of how the processor encodes decimal numbers, described by the **IEEE 754** standard, which all these languages use because the hardware requires it.

## Why an approximation?

In base 10, some fractions have no finite decimal representation: `1/3 = 0.333...`; you have to stop somewhere, so you write an approximation.

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
- the **exponent** gives the order of magnitude: it's what lets both `10⁻³⁰⁰` and `10³⁰⁰` be represented;
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

## Absorption and cancellation: when a calculation loses its digits

The gap between two consecutive floats grows with the value (see above). An exact result that falls between two floats is **rounded** to the nearest one: adding a small number to a large one can therefore change **nothing**, this is **absorption**.

| Type | First integer that no longer exists | Adding 1 is always lost from |
|---|---|---|
| `float` | 2²⁴ + 1 = 16,777,217 | 2²⁵ = 33,554,432 |
| `double` | 2⁵³ + 1 = 9,007,199,254,740,993 | 2⁵⁴ = 18,014,398,509,481,984 |

Results measured in C (`float`, 32 bits):

```c
float big = 16777216.0f;      /* 2^24 */
big + 1.0f == big;            /* true: 16,777,217 does not exist, rounded to 16,777,216 */
big + 2.0f == big;            /* false: 16,777,218 exists */

float sum = 16777216.0f;
for (int i = 0; i < 1000; i++)
	sum += 1.0f;              /* every +1 is lost: sum is still 16,777,216, not 16,778,216 */
```

The remedy is to **add the small values together first**: 1000 additions of `1.0f` give exactly 1000, then `16777216.0f + 1000.0f` is 16,778,216 (an even number, representable at this scale). Switching to `double` only pushes the threshold back.

**Cancellation** is the opposite trap: subtracting two large, close numbers destroys the reliable digits. Here the error is already made at the conversion; the subtraction makes it visible:

```c
float distance = 100000000.0f;    /* 10^8 */
float radius = 99999999.0f;       /* stored as 100,000,000: the gap between two floats is 8 at this size */
float near = distance - radius;   /* 0.0 instead of 1.0 */
```

A `near` equal to 0 where the downstream calculation requires a strictly positive number (division, projection plane) produces an infinite or absurd result, with no error message. Check the result of a subtraction whose two terms are close, or compute in `double`.

**Compare with a relative margin.** An absolute constant (`0.0001`) depends on the unit of the values: too large for objects of 0.001, too small for values around 10⁸ (where the natural gap is 8). So we compare against a fraction of the larger of the two values:

```c
/* True if a and b differ by at most the fraction rel of the larger of the two (absolute value). */
static int close_enough(double a, double b, double rel)
{
	return fabs(a - b) <= rel * fmax(fabs(a), fabs(b));   /* fabs: absolute value; fmax: the larger of the two */
}
```

To compare against exactly 0, this formula does not work (the margin becomes zero): add an absolute floor chosen according to the unit of the domain.

**`NaN` and infinity go through comparisons without any error.** A comparison with `NaN` is always false (see [special values](#special-values)), and infinity is greater than everything:

| Expression | `NaN` | `+inf` (positive infinity) |
|---|---|---|
| `x < 0` | false | false |
| `x > 10` | false | true |
| `x > 0` | false | true |
| `x == x` | false | true |

The usual "refuse if out of range" check therefore lets `NaN` through (both conditions are false). Write the check **in the accepting direction**: accept only what is finite and within range.

```c
/* True if x is a finite number in [min, max]; false for NaN, +inf and -inf. */
static int in_range(double x, double min, double max)
{
	return isfinite(x) && x >= min && x <= max;   /* isfinite: false for NaN and for infinity */
}
```

`inf - inf` gives `NaN`: a single infinite value then produces `NaN` throughout the rest of the calculation.

> **Pitfall:** none of these cases produces an error or a crash: the calculation carries on with a wrong value. Check numeric inputs as soon as they arrive (`isfinite`, domain range) rather than assuming sane values.

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

`NaN` has a deliberately surprising property: **it's equal to nothing, not even itself**. `NaN == NaN` is false. This is consistent (two invalid results have no reason to be "the same number"), but it means a dedicated function is required to detect it (`isnan()` in C, `math.isnan()` in Python, `Number.isNaN()` in JavaScript).

## An alternative: fixed-point representation

Rather than sacrificing precision to cover a huge range of values (as a float does), **fixed-point representation** stores a decimal number as an ordinary integer, whose last bits conventionally represent the fractional part:

```text
With 8 fractional bits:
  actual value = stored_integer / 2^8

  stored_integer = 2560  ->  2560 / 256 = 10.0
  stored_integer = 2688  ->  2688 / 256 = 10.5
```

Converting a plain integer to fixed-point amounts to multiplying it by `2^fractional_bits` (`10 * 256 = 2560`); converting back (to an integer or a float) amounts to dividing by that same value.

| | Float (IEEE 754) | Fixed-point |
|---|---|---|
| Storage | Sign + exponent + mantissa | An ordinary integer |
| Precision | Relative (depends on magnitude) | Fixed and constant (always the same number of decimals) |
| Computation | Requires a floating-point unit (FPU) | Plain integer operations, faster and deterministic |
| Typical use | Scientific computing, very wide value range | Embedded without an FPU, retro video games, audio/DSP |

> **Best practice:** fixed-point guarantees a strictly identical result on every machine (unlike a float, whose rounding can vary slightly across compilers or processors): useful whenever a computation must stay bit-for-bit reproducible, for instance in a multiplayer game where every client must get exactly the same result.

This is the technique behind the **Q** number format, still used today by some digital signal processors (DSPs) that have no floating-point unit on board.

## What each language adds on top

The foundation is common; languages only differ in the packaging:

| Language | Specifics |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | Explicit `float` / `double` / `long double`, `fabs()`, `isnan()` |
| JavaScript | A single `number` type (always a double), `BigInt` for large integers, see [Numbers](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, natively arbitrary-size integers, `math.isclose()`, the `decimal` module |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Above all, remember that these differences change nothing about the fundamentals: the hardware decides, and it decides the same way for everyone.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A float (IEEE 754 standard) stores an approximation, not an exact value: `0.1 + 0.2 != 0.3` in every language, with no exception. Precision is relative: the larger a number is, the bigger the gap between two consecutive floats. Integers stay exact up to 2⁵³ in double precision (52 mantissa bits); beyond that, neighboring integers become indistinguishable; in `float`, from 2²⁴. A small number added to a large one can be absorbed, and a subtraction of large, close numbers can give 0. |
| **Tools you can use** | Epsilon-based comparison (`math.isclose`, `fabs(a-b) < epsilon`), `DECIMAL` types for exact amounts. Fixed-point for a bit-for-bit reproducible result with no FPU. |
| **Pitfalls to avoid** | Comparing two floats with `==` (including `NaN`, which equals nothing, not even itself); storing a monetary amount as a float rather than as integers (cents) or `DECIMAL`. Checking an input with "refuse if out of range": `NaN` gets through, and infinity passes an `x > 0` test. Adding small terms one by one to a large total. |
| **Best practices** | Choose an epsilon suited to the order of magnitude being handled, never the default machine epsilon for large values. Compare with a relative margin rather than an absolute constant. Add small values together before adding them to the large total. Accept an input only if `isfinite(x)` and within the domain range. |
