---
order: 15
---

# Bitwise Operators

Bitwise operators work directly on the binary representation of integers, bit by bit. In C, they're used every day without a second thought: flags passed to system calls, file permissions, and even simple computation optimizations all rely on them.

## The six operators

| Operator | Name | Effect on each bit |
|---|---|---|
| `&` | AND | 1 if **both** bits are 1 |
| `\|` | OR | 1 if **at least one** bit is 1 |
| `^` | XOR (exclusive OR) | 1 if the bits are **different** |
| `~` | NOT | inverts each bit |
| `<<` | left shift | shifts the bits to the left |
| `>>` | right shift | shifts the bits to the right |

```c
unsigned char a = 12;   // 0000 1100
unsigned char b = 10;   // 0000 1010

a & b    // 0000 1000 = 8   -> bits present in both
a | b    // 0000 1110 = 14  -> bits present in either
a ^ b    // 0000 0110 = 6   -> bits present in only one of the two
~a       // 1111 0011 = 243 (on an unsigned char)
```

> Don't confuse `&` with `&&`, or `|` with `||`. The doubled versions are the **logical** operators: they work on true/false values and return 0 or 1. `1 & 2` equals `0` (no shared bit), whereas `1 && 2` equals `1` (both values are true). This mix-up is a source of silent bugs.

## Shifts

Shifting left by `n` positions amounts to **multiplying by 2ⁿ**, shifting right to **dividing by 2ⁿ** (integer division):

```c
unsigned char x = 5;    // 0000 0101

x << 1   // 0000 1010 = 10   (5 * 2)
x << 3   // 0010 1000 = 40   (5 * 8)
x >> 1   // 0000 0010 = 2    (5 / 2, rounded down)
```

Bits that fall outside the type's width are **lost** — this isn't an error, there's no warning at all:

```c
unsigned char y = 200;  // 1100 1000
y << 1                  // 1001 0000 = 144, not 400: a bit fell off
```

**Two pitfalls to know:**

- Shifting by a number greater than or equal to the type's width is **undefined behavior** (`x << 32` on a 32-bit `int`): the result isn't guaranteed, even if it "seems to work".
- `>>` on a **negative signed** integer is implementation-defined (the sign bit may or may not be propagated). To manipulate bits, systematically use **unsigned** types (`unsigned int`, `uint32_t`).

## Masks: the real everyday usefulness

A **mask** is a value used to target specific bits. The four basic operations:

```c
#define FLAG_READ   (1u << 0)   // 0000 0001
#define FLAG_WRITE  (1u << 1)   // 0000 0010
#define FLAG_APPEND (1u << 2)   // 0000 0100

unsigned int options = 0;

options |= FLAG_READ;                 // SET     a bit
options |= FLAG_WRITE;

if (options & FLAG_WRITE) { ... }     // TEST    a bit

options &= ~FLAG_WRITE;               // CLEAR   a bit
options ^= FLAG_APPEND;               // TOGGLE  a bit
```

This is exactly the mechanism behind system calls: `open("f.txt", O_WRONLY | O_CREAT)` combines flags with `|`, and the function then tests them with `&`. See the [System Calls and File Descriptors](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) chapter.

Unix file permissions follow the same logic in base 8: `0644` encodes three groups of three bits (read/write/execute for the owner, the group, others). See also Bash's [Permissions and Files](/?c=shells&s=bash&p=permissions-et-fichiers) chapter.

**Why flags rather than separate booleans?** A single `unsigned int` stores 32 independent options, passes as a single argument, and is tested in one processor instruction.

## Common idioms

```c
// Parity: the low-order bit is 1 for an odd number
if (n & 1) { /* n is odd */ }

// Power of 2: only one bit is set, so n & (n-1) == 0
int is_power_of_two(unsigned int n) {
    return n != 0 && (n & (n - 1)) == 0;
}

// Counting set bits (Kernighan's algorithm)
int count_bits(unsigned int n) {
    int total = 0;
    while (n) {
        n &= n - 1;      // clears the rightmost set bit
        total++;
    }
    return total;
}

// Swapping two integers with no temporary variable (curiosity, not for real use)
a ^= b; b ^= a; a ^= b;
```

The first two are genuinely useful in practice. The last one illustrates a property of XOR (`x ^ x == 0`, `x ^ 0 == x`) but should be avoided in real code: it's unreadable, slower than a temporary variable on a modern processor, and **wrong if both variables are the same one** (`a` and `a` would both end up 0).

## `n & 1` rather than `n % 2`?

Historically, `n & 1` was faster than `n % 2`, and `n << 1` faster than `n * 2`. **This is no longer a valid argument**: any modern compiler makes these substitutions itself when they're correct.

So write whatever expresses your intent: `n % 2 == 0` if you're talking about parity, `n & MASK` if you're talking about bits. Readability improves and performance stays identical.

> Watch out anyway: `n % 2` and `n & 1` are **not** equivalent for a negative `n` in C (`-3 % 2` equals `-1`). One more reason to reserve bitwise operations for unsigned types.

## Summary

| Goal | Syntax |
|---|---|
| Set a bit | `x \|= MASK` |
| Clear a bit | `x &= ~MASK` |
| Toggle a bit | `x ^= MASK` |
| Test a bit | `if (x & MASK)` |
| Create a mask for bit *n* | `1u << n` |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Bitwise operators (`&`, `\|`, `^`, `~`, `<<`, `>>`) work bit by bit — used for flags, permissions, and masks. Don't confuse them with `&&`/`\|\|` (logical). |
| **Tools you can use** | Masks (`\|=` sets, `&= ~` clears, `^=` toggles, `&` tests a bit). |
| **Pitfalls to avoid** | Shifting by a number of bits ≥ the type's width (undefined behavior); using `>>` on a negative signed value (implementation-defined). |
| **Best practices** | Reserve bitwise operations for unsigned types; write `n % 2`/`n * 2` rather than `n & 1`/`n << 1` for readability — a modern compiler already optimizes the equivalence. |
