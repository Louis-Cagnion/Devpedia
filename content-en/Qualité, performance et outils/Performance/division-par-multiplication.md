---
order: 10
---

# Replacing a Division with a Multiplication

In a program that does a lot of computing, one operation costs more than the others: **division**. This chapter shows how a division by a fixed number can be replaced by a multiplication that gives **exactly** the same result, why it works, within what limits, and above all how much it really gains: the answer is a lesson in [measuring before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

## What a division does, and why it is expensive

An **integer division** finds how many times one number fits into another: that is the **quotient**. What is left over is the **remainder**.

| Calculation | Quotient | Remainder | In C |
|---|---|---|---|
| 1,000,000 ÷ 108 | 9,259 | 28 | `1000000 / 108` and `1000000 % 108` |
| 17 ÷ 5 | 3 | 2 | `17 / 5` and `17 % 5` |

A processor runs **instructions** (add, multiply, divide...), and each one takes a number of **cycles**: a cycle is one tick of the processor's internal clock (see [the cycle counter](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#timing-a-part-of-a-loop-the-cycle-counter)). The orders of magnitude, which vary with the processor model:

| Operation on integers | Typical cost |
|---|---|
| Addition, subtraction | about 1 cycle |
| Multiplication | about 3 cycles |
| Division | ten cycles or more |

Multiplication is fast because a dedicated circuit computes the whole result in one pass. Division looks more like the one you learned at school: the circuit goes forward in successive steps. It is therefore the operation to avoid in a loop that runs millions of times.

## The idea: multiply by the inverse

Dividing by 4 means multiplying by 0.25. Dividing by 8 means multiplying by 0.125. Dividing by `q` means multiplying by `1/q`, called the **inverse** of `q`.

The problem: integers have no decimal point, and `1/7` is `0.142857142857...`, which never stops. The trick is to work in **fixed point**: keep a fixed number of decimals, round **up**, and shift the decimal point by writing the result as an integer.

Example in base 10, to divide by 7 with 6 decimals: the inverse rounded up is `0.142858`, which is the integer `142,858` if we multiply by a million. We multiply `d` by `142,858`, then **throw away the last 6 digits** (which amounts to dividing by a million):

| d | d × 142,858 | throw away 6 digits | d ÷ 7 (true quotient) |
|---|---|---|---|
| 6 | 857,148 | 0 | 0 |
| 7 | 1,000,006 | 1 | 1 |
| 1,000 | 142,858,000 | 142 | 142 |
| 999,999 | 142,857,857,142 | 142,857 | 142,857 |

The computer counts in base 2, not base 10: we replace the million with `2^32` (about 4.3 billion) and "throw away the last 6 digits" with "throw away the last 32 bits", that is a [right shift](/?c=langages&s=c&p=operateurs-binaires#shifts) of 32 positions (`>> 32`).

```
inverse(q) = 2^32 / q, rounded up
d / q      = (d × inverse(q)) >> 32
```

## The code

```c
#include <stdint.h>
#include <stdio.h>

/* the fixed-point inverse of q: 2^32 / q rounded up.
   Compute it ONCE per divisor. */
static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }

/* d / q without a division: multiply by the inverse,
   then throw away the 32 low-order bits */
static unsigned divide(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned n = 108;                       /* a divisor known only at run time */
    uint64_t inv = inverse(n);              /* the only real division, paid once */
    unsigned d = 1000000;
    unsigned quotient = divide(d, inv);     /* d / n, by multiplication */
    unsigned remainder = d - quotient * n;  /* d % n, without a division either */

    printf("inverse(%u) = %llu\n", n, (unsigned long long)inv);
    printf("%u / %u = %u, remainder %u\n", d, n, quotient, remainder);
    printf("check: %u / %u = %u, remainder %u\n", d, n, d / n, d % n);
    return 0;
}
```

Output:

```
inverse(108) = 39768216
1000000 / 108 = 9259, remainder 28
check: 1000000 / 108 = 9259, remainder 28
```

| Element of the code | Role |
|---|---|
| `uint64_t` | Unsigned 64-bit integer. The product `d × inverse` exceeds 32 bits: it needs a wider place (see [overflow](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements#overflow)). |
| `1ull << 32` | The number `2^32`, written as an `unsigned long long` (suffix `ull`) so it fits in memory. |
| `+ q - 1` | To round an integer quotient **up**: `(a + q - 1) / q` is the smallest integer greater than or equal to `a / q`. |
| `>> 32` | Throws away the 32 low-order bits: the equivalent of "throwing away the last 6 digits". Allowed here because the value is 64 bits wide: shifting a 32-bit integer by 32 positions is undefined behavior (see [shifts](/?c=langages&s=c&p=operateurs-binaires#shifts)). |
| `d - quotient * n` | The remainder, without a second division: `d % n` is deduced from the quotient. |

The computation of the inverse itself contains a real division, but it is done **only once** per divisor. Every following division is just a multiplication and a shift. The trick therefore only pays off if the **same divisor** is used a large number of times.

## Why it is exact

The inverse was rounded up: it is slightly too big. Let `e` be this excess, in units of `1/2^32`:

```
e = q × inverse(q) - 2^32          with 0 <= e < q
```

Then `d × inverse(q) / 2^32 = d/q + d×e / (q × 2^32)`: the computation gives the true quotient plus a small positive error, `d×e / (q × 2^32)`. This error does not change the result as long as it stays **below `1/q`**:

| Step | Reasoning |
|---|---|
| 1 | `d / q` is written `k + r/q`: `k` is the quotient, `r` the remainder, and `r` is at most `q - 1`. |
| 2 | The part after the decimal point is therefore at most `(q - 1)/q = 1 - 1/q`. |
| 3 | Adding an error strictly below `1/q` cannot reach `k + 1`: the integer part stays `k`. |
| 4 | The error is below `1/q` when `d × e < 2^32`. |
| 5 | With `q <= 128`, `e < 128 = 2^7`; with `d < 2^25`, `d × e < 2^25 × 2^7 = 2^32`. |

The method is therefore exact for every divisor up to 128 and every dividend below `2^25` (33,554,432). A proof is reassuring, but a one-bit mistake goes unnoticed: we also check by **brute force**, comparing with the real division for each of the 128 × 2^25 possible pairs:

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned divide(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned long long checked = 0, wrong = 0;

    for (unsigned q = 1; q <= 128; q++) {               /* divisors of the guaranteed zone */
        uint64_t inv = inverse(q);
        for (unsigned d = 0; d < (1u << 25); d++) {     /* dividends of the guaranteed zone */
            checked++;
            if (divide(d, inv) != d / q)                /* checked against the real division */
                wrong++;
        }
    }
    printf("%llu divisions checked, %llu wrong\n", checked, wrong);
    return 0;
}
```

```
4294967296 divisions checked, 0 wrong
```

## Beyond the guaranteed zone, the result is wrong without warning

When `d × e` reaches `2^32`, the error exceeds `1/q` and the quotient can be **one too many**, with no message at all:

```c
#include <stdint.h>
#include <stdio.h>

int main(void)
{
    unsigned q = 127;
    uint64_t inv = ((1ull << 32) + q - 1) / q;
    uint64_t e = q * inv - (1ull << 32);        /* rounding error: 0 <= e < q */
    unsigned d = 0;

    while ((unsigned)(d * inv >> 32) == d / q)  /* look for the first wrong dividend */
        d++;
    printf("q = %u, e = %llu\n", q, (unsigned long long)e);
    printf("first wrong d: %u (2^25 = %u, 2^32 / e = %llu)\n",
           d, 1u << 25, (1ull << 32) / e);
    printf("true quotient: %u, computed quotient: %u\n", d / q, (unsigned)(d * inv >> 32));
    return 0;
}
```

```
q = 127, e = 111
first wrong d: 38693470 (2^25 = 33554432, 2^32 / e = 38693399)
true quotient: 304672, computed quotient: 304673
```

The first wrong dividend is just above `2^32 / e`, as the proof predicts. It depends on the divisor:

| Divisor `q` | Error `e` | `2^32 / e` | First wrong `d` |
|---|---|---|---|
| 3 | 2 | 2,147,483,648 | 2,147,483,648 |
| 10 | 4 | 1,073,741,824 | 1,073,741,829 |
| 127 | 111 | 38,693,399 | 38,693,470 |
| 129 | 113 | 38,008,560 | 38,008,688 |
| 128 | 0 | (no error) | none (power of 2: the inverse is exact) |

The bound "`q <= 128` and `d < 2^25`" is therefore **sufficient**, not the only possible one: a small divisor such as 3 stays exact beyond two billion. For a larger zone, a finer version of the algorithm is needed, with an extra shift: this is what compilers and the [libdivide](https://libdivide.com/) library do, following the paper by [Granlund and Montgomery (1994)](https://doi.org/10.1145/178243.178249).

## The compiler already does it when it knows the divisor

When the divisor is a constant written in the code, the [compiler](/?c=langages&s=c&p=compilation) applies this transformation on its own:

```c
unsigned div_constant(unsigned d) { return d / 108; }
unsigned div_variable(unsigned d, unsigned n) { return d / n; }
```

The machine code produced by `gcc -O2` (the compiler's [optimization levels](/?c=langages&s=c&p=compilation#optimization-levels-o0-to-o3-os)), displayed with `objdump -d` ([example of use](/?c=langages&s=c&p=compilation#multiple-files-and-inlining-translation-unit-static-inline-flto)), without the alignment lines and `endbr64`:

```
div_constant:                        div_variable:
  mov    eax,edi                       mov    eax,edi
  shr    eax,0x2                       xor    edx,edx
  imul   rax,rax,0x4bda12f7            div    esi          <- the real division
  shr    rax,0x23
  ret                                  ret
```

For `d / 108`, the compiler picked a magic constant itself (`0x4bda12f7`): a multiplication and shifts, no `div` instruction. It does so even without optimization (`-O0`). For `d / n`, it can do nothing: the value of `n` only exists at run time (read from the command line, from a file...), so it keeps `div`.

| Divisor | Who replaces the division? |
|---|---|
| Constant known at compile time | The compiler, automatically |
| Fixed at startup, reused millions of times | You (this technique), or a library |
| Different for every division | Nobody: computing the inverse costs a division, nothing is gained |

## How much it gains: a lesson in measuring

To measure, the following program times (with [`clock_gettime`](/?c=langages&s=c&p=mesure-du-temps#measuring-a-duration-clock-gettime-clock-monotonic)) two situations. In the **dependent chain**, each division needs the result of the previous one: it cannot start before. In the **independent** divisions, the processor can advance several at the same time. The divisor is read from the command line: the compiler cannot know it.

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned divide(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

#define N 400000000u                /* number of iterations */
#define MASK ((1u << 25) - 1)       /* keeps d under 2^25, where the inverse is exact */

/* dependent chain: each division waits for the result of the previous one */
static unsigned chain_div(unsigned n)
{
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (d / n + i * 2654435761u) & MASK;
    return d;
}

static unsigned chain_mul(unsigned n)
{
    uint64_t inv = inverse(n);
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (divide(d, inv) + i * 2654435761u) & MASK;
    return d;
}

/* independent divisions: the processor can advance several at once */
static unsigned indep_div(unsigned n)
{
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += ((i * 2654435761u) & MASK) / n;
    return s;
}

static unsigned indep_mul(unsigned n)
{
    uint64_t inv = inverse(n);
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += divide((i * 2654435761u) & MASK, inv);
    return s;
}

static double now(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned n = argc > 1 ? (unsigned)atoi(argv[1]) : 108;     /* unknown at compile time */
    unsigned (*f[4])(unsigned) = { chain_div, chain_mul, indep_div, indep_mul };
    const char *name[4] = { "chain       d / n  ", "chain       inverse",
                            "independent d / n  ", "independent inverse" };
    double best[4] = { 1e9, 1e9, 1e9, 1e9 };
    unsigned res[4];

    for (int round = 0; round < 5; round++)    /* 5 alternating rounds, keep the best */
        for (int k = 0; k < 4; k++) {
            double t0 = now();
            double elapsed;

            res[k] = f[k](n);
            elapsed = now() - t0;
            if (elapsed < best[k])
                best[k] = elapsed;
        }
    for (int k = 0; k < 4; k++)
        printf("%s : %5.2f ns per division\n", name[k], best[k] / N * 1e9);
    printf("identical results: %s\n",
           res[0] == res[1] && res[2] == res[3] ? "yes" : "NO");
    return 0;
}
```

```
chain       d / n   :  2.66 ns per division
chain       inverse :  1.28 ns per division
independent d / n   :  1.30 ns per division
independent inverse :  0.38 ns per division
identical results: yes
```

| Situation | Division `/` | Precomputed inverse | Gain |
|---|---|---|---|
| Dependent chain | 2.66 ns | 1.28 ns | about ×2 |
| Independent divisions | 1.3 ns | 0.38 ns | about ×3.4 |

In this small program, division is the only work: the gain is at its maximum. In a real program, things are different. In the [Skyscraper solver](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), which finds the row and column of a cell from its number (divisions by the grid size `n`), the replacement was checked like this: both versions do **exactly the same search** (same work counters, see [checking that two versions do the same work](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#checking-that-two-versions-do-the-same-work-before-timing-them)), then were timed over two [alternating rounds](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#measuring-in-alternating-rounds). Result at `n = 96`: **0.5% of time saved**.

Why so little, when division is 2 to 3 times slower in isolation?

| Reason | Explanation |
|---|---|
| The processor hides the latency | While a division runs, it already moves other instructions forward: the waiting time is largely covered by other work. |
| Division is a small share of the time | The solver spends most of its time reading memory, not dividing (see [the processor cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#the-cache-hierarchy)). |
| A micro-test is a maximum | It isolates the measured operation: it gives the upper bound of the gain, never the real gain. |

> A ×3 gain in a micro-test and 0.5% in the full program do not contradict each other: they do not measure the same thing. Before optimizing an operation, time **the whole program**; otherwise you spend time writing subtler code for a result the stopwatch can barely tell from noise.

## The pitfalls

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }

int main(void)
{
    unsigned q = 108, d = 1000000;
    unsigned inv32 = (unsigned)inverse(q);      /* inverse copied into 32 bits */
    unsigned inv_of_1 = (unsigned)inverse(1);   /* equals 2^32: 33 bits needed */

    printf("d / q                       = %u\n", d / q);
    printf("product computed on 64 bits = %u\n", (unsigned)(d * inverse(q) >> 32));
    printf("product computed on 32 bits = %u\n", (unsigned)((uint64_t)(d * inv32) >> 32));
    printf("5 / 1 with a 32-bit inverse = %u\n",
           (unsigned)((uint64_t)(5 * inv_of_1) >> 32));
    return 0;
}
```

```
d / q                       = 9259
product computed on 64 bits = 9259
product computed on 32 bits = 0
5 / 1 with a 32-bit inverse = 0
```

| Pitfall | What happens | Remedy |
|---|---|---|
| Product computed on 32 bits | The excess beyond 32 bits is lost, then the 32-bit shift leaves only 0: the result is wrong with no error or warning | Keep the inverse in a `uint64_t`: the multiplication is then done on 64 bits |
| Inverse of 1 | `2^32` does not fit in 32 bits: copied into an `unsigned`, it is 0 | Same remedy: the inverse stays on 64 bits |
| `d` or `q` outside the guaranteed zone | Quotient one too big, with no message | Bound `d` and `q` when creating the inverse, or check the zone by brute force as above |
| Negative numbers | Division in C rounds toward zero (`-7 / 2` gives `-3`), the trick only covers unsigned integers | Apply the technique only to `unsigned` values |
| Zero divisor | `inverse(0)` divides by zero and stops the program | Refuse `q == 0` before computing the inverse |
| Floating-point inverse (`1.0 / q`) | `49 × (1.0 / 49)` is `0.9999999999999999`: truncation gives 0 instead of 1 | Stay in integers, with an inverse rounded up |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | Dividing by `q` means multiplying by the inverse `2^32 / q` rounded up, then throwing away the 32 low-order bits. It is exact as long as `d × e < 2^32` (where `e < q` is the rounding error): for `q <= 128`, every `d < 2^25`. Computing the inverse costs one division, paid only once. |
| **Tools you can use** | The compiler (constant divisor: automatic), `objdump -d` to check that a `div` instruction has disappeared, the [libdivide](https://libdivide.com/) library for a wider zone, a brute-force loop to check a zone, `clock_gettime` to time. |
| **Pitfalls to avoid** | A product computed on 32 bits, a `d` or `q` outside the zone (wrong result with no message), negative numbers, a zero divisor, a floating-point inverse, a divisor that changes at every call (nothing is gained), and drawing conclusions from a micro-test without timing the whole program. |
| **Best practices** | Let the compiler do it when the divisor is known at compile time; write it by hand only for a divisor fixed at run time and reused millions of times; prove or check the exactness zone; compare both versions on the same work before timing; time the complete program. |
