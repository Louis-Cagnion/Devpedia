---
order: 1
---

# Integers, Bits, and Overflow

An integer isn't stored "as is": it occupies a **fixed** number of bits, decided when it's declared. All the mechanics of integers follow from this constraint: maximum values, negative numbers, and overflow.

## How many values in *n* bits?

With *n* bits, you get **2ⁿ** distinct combinations, so 2ⁿ representable values:

| Bits | Combinations | Unsigned | Signed |
|---|---|---|---|
| 8 | 256 | 0 → 255 | −128 → 127 |
| 16 | 65,536 | 0 → 65,535 | −32,768 → 32,767 |
| 32 | ~4.3 billion | 0 → 4,294,967,295 | −2,147,483,648 → 2,147,483,647 |
| 64 | ~1.8 × 10¹⁹ | 0 → ~1.8 × 10¹⁹ | ~−9.2 × 10¹⁸ → ~9.2 × 10¹⁸ |

The number of values doesn't change based on whether it's signed or not: it's the **range** that shifts. An unsigned `char` goes from 0 to 255, a signed one from −128 to 127: 256 values either way.

**The calculation to remember:** for *n* bits, the maximum unsigned value is `2ⁿ − 1` (the `− 1` because zero occupies one combination). Signed, the range is `−2ⁿ⁻¹` to `2ⁿ⁻¹ − 1`.

## The weight of a bit

Each bit contributes to the total value based on its position, an increasing power of 2 from right to left (its **weight**):

```text
bit :    1    0    1    1    0    0    1    0
weight: 128   64   32   16   8    4    2    1
         ^                                  ^
    high-order bit               low-order bit
```

The **low-order bit** (the rightmost one) is the one worth 1 (2⁰); the **high-order bit** (the leftmost one) is the one that weighs the most in the final value, 2ⁿ⁻¹ for *n* bits. This distinction comes up in two common contexts: the high-order bit serves as the sign indicator in two's complement (see below), and the low-order bit alone is enough to test a number's parity (`n & 1`, see the [Bitwise Operators](/?c=langages-de-programmation&s=c&p=operateurs-binaires) chapter).

## Negative numbers: two's complement

How do you store a sign when all you have is 0 and 1? The naive idea would be to reserve one bit for the sign. That's what floats do, but not integers, because it would cause two problems: two representations of zero (`+0` and `−0`), and an addition that would have to handle signs separately.

The universally adopted solution is **two's complement**: to get `−x`, invert every bit of `x` then add 1.

```text
 5 (in 8 bits)   = 0000 0101
 inversion       = 1111 1010
 + 1             = 1111 1011  =  -5
```

The decisive benefit: **addition works with no special case**. The processor adds the bits without knowing or caring about the sign.

```text
   5  = 0000 0101
+ -5  = 1111 1011
-----------------
   0  = 0000 0000   (the bit that overflows is simply lost)
```

The high-order bit then acts as a sign indicator: `0` for positive, `1` for negative. This is also what explains the range's **asymmetry** (`−128` to `127`): since zero sits on the positive side, that leaves one extra combination for negatives.

## Overflow

What happens when a result no longer fits in the number of bits allocated? The extra bits are **lost**, and the value "wraps around".

```c
unsigned char x = 255;   // 1111 1111, the maximum
x = x + 1;               // 0000 0000 -> 0!
```

This is called *wraparound*: you go back to the start, like an odometer. For a **signed** integer, the effect is more surprising:

```c
signed char y = 127;     // 0111 1111, the maximum
y = y + 1;               // 1000 0000 -> -128!
```

Adding 1 to the largest positive number gives the smallest negative one.

> **Major C/C++ pitfall:** overflow of a **signed** integer is **undefined behavior**, not guaranteed wraparound. The compiler is allowed to assume it never happens and optimize accordingly: a check like `if (x + 1 < x)` can simply be removed. **Unsigned** overflow, by contrast, is defined by the standard and does wrap around. For counting, comparing, or masking bits, prefer unsigned types.

## Why this actually matters

Integer overflows aren't an academic curiosity:

- The **Year 2038 problem**: Unix systems count seconds since 1970 in a signed 32-bit integer. It will overflow on January 19, 2038, returning a date in 1901.
- Many **security flaws** come from a size computation that overflows: if `size + 1` wraps to 0, a 0-byte allocation is followed by a write of several thousand bytes: that's a buffer overflow. See C's [Memory Management](/?c=langages-de-programmation&s=c&p=memoire) chapter.
- The **first Ariane 5** was destroyed in 1996 because of a conversion from a 64-bit float to a 16-bit integer that overflowed.

## By language

| Language | Behavior |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp) | Fixed size chosen explicitly. Signed overflow = undefined behavior |
| [Java](https://docs.oracle.com/en/java/), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/) | Fixed size, defined wraparound for all integers |
| **[Python](/?c=langages-de-programmation&s=python&p=python)** | **Arbitrary-size** integers: they grow as long as memory allows, no overflow |
| JavaScript | No real integer type: everything is a float, so exact only up to 2⁵³ (see [Floating-Point Numbers](/?c=representation-des-donnees&p=nombres-flottants)). `BigInt` to go beyond |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | Native integer; on overflow, automatic conversion to `float` (so precision is lost) |

Python illustrates the trade-off well: never overflowing is convenient, but every integer is a heavier, slower object than a machine integer. This is one of the reasons computing libraries like NumPy use fixed-size types (`int32`, `int64`). See the [NumPy](/?c=data-science&p=numpy) chapter.

## When a fixed size isn't enough: arbitrary-precision arithmetic on strings

No native integer, however wide (64 bits, or even wider), is enough for some computations: cryptography on large prime numbers, computing thousands of digits of π, the factorial of a large number... A common technique for going past this limit, regardless of the language and its native integer type, is to represent the number not as a fixed-size binary value anymore, but as a **string of characters** (or an array), one element per digit:

```text
"123" -> ['1', '2', '3']   (each digit stays a character, not a binary value)
```

Multiplication then reproduces, digit by digit, the method learned by hand at school (long multiplication):

```text
    1 2 3
  x   4 5
  -------
    6 1 5    (123 x 5)
+ 4 9 2 .    (123 x 4, shifted one place)
  -------
  5 5 3 5
```

Each digit of the second number multiplies every digit of the first, with a **carry** propagated as in a long addition, the result of each line shifted one place (a power of 10) before being summed with the previous lines.

> **Pitfall:** propagating each carry immediately into the next digit, the way you would by hand on a single line. A robust implementation instead stores each digit-by-digit product in a large enough intermediate array (`size1 + size2` digits), then propagates the carries in a single final pass over that array: simpler to get right than an on-the-fly propagation, where a digit already written might need to be changed several times in a row.

The cost is clear compared to a native multiplication: multiplying *n* by *m* digits takes on the order of *n* × *m* digit-by-digit multiplications (versus a single machine instruction for a native integer), to be reserved for cases where the number's size genuinely exceeds what a native type can hold. This is exactly the mechanism behind Python's arbitrary-precision integers seen above, using a base far larger than 10 internally to limit the number of operations.

## Manipulating bits directly

The corollary of this binary representation is that you can act on the bits themselves: masks, shifts, flags. That's the subject of C's [Bitwise Operators](/?c=langages-de-programmation&s=c&p=operateurs-binaires) chapter.

## Summary

| Key point | |
|---|---|
| *n* bits | 2ⁿ values; unsigned max = 2ⁿ − 1 |
| Negatives | Two's complement: invert the bits, add 1 |
| Asymmetric signed range | Zero is counted on the positive side |
| Overflow | The extra bits are lost, the value wraps around |
| In C, signed overflow | **Undefined** behavior: use unsigned |
| Arbitrary precision | Represent the number as a string of digits and multiply by hand, to go past any native size |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An integer occupies a fixed number of bits, decided at declaration: *n* bits give 2ⁿ possible values. Negatives are encoded in two's complement; overflow makes the value "wrap around" (or triggers undefined behavior in C for a signed one). When no native size is enough, a string of digits multiplied by hand goes around the limit. |
| **Tools you can use** | Unsigned types for counting/comparing/masking bits with no risk of UB; the fixed-size types (`int32`, `int64`) of computing libraries; arbitrary-precision arithmetic on a string to go past any native size. |
| **Pitfalls to avoid** | Relying on signed integer overflow in C/C++: undefined behavior, not guaranteed wraparound. Propagating the carries of a long multiplication on the fly instead of through an intermediate array. |
| **Best practices** | Prefer unsigned types for any bit manipulation; check that a size computation can't overflow before a memory allocation. |
