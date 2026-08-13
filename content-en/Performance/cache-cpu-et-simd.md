---
order: 6
---

# CPU Cache and Vectorization (SIMD)

The previous chapters deal with time lost waiting on **another component** (network, disk, remote service). For pure computation — adding numbers, transforming an array — the same [fixed cost / marginal cost](/?c=performance&p=limiter-les-aller-retours) distinction exists, but what dominates the marginal cost is no longer network latency: it's how the processor accesses memory.

## The cache hierarchy

A processor never reads RAM directly on every access: several levels of memory, progressively smaller and faster, sit between it and RAM.

| Level | Typical size | Relative latency |
|---|---|---|
| Registers | A few dozen bytes | ~1 cycle |
| L1 cache | 32-64 KB | ~4 cycles |
| L2 cache | 256 KB-1 MB | ~15 cycles |
| L3 cache | A few MB (shared across cores) | ~40 cycles |
| RAM | Several GB | ~200 cycles |

A **register** is a storage location built into the processor itself (not in memory): it's where it places the values it operates on directly. A **cycle** is a tick of the processor's internal clock — the finest unit of time it can act on; all the latencies above are expressed in number of cycles rather than seconds, because that number stays stable from one machine to another, unlike the actual duration of a cycle (which depends on the processor's clock speed).

These numbers are orders of magnitude (they vary by architecture), but what matters is the ratio between them: a RAM access easily costs 50 times more than an L1 access. A program that makes repeated round trips to RAM instead of reusing what's already in cache can be dozens of times slower, for the exact same number of operations.

## Cache lines: contiguous memory is "free"

The processor never loads a single byte: it always loads a fixed-size block, the **cache line** (64 bytes on most current architectures), even if only one byte of that block is requested.

Direct consequence: reading **contiguous** data (an array traversed in order) benefits from lines already loaded by previous accesses — most reads cost almost nothing. Reading **scattered** data (a linked list, objects spread across the heap) triggers a fresh line load on every access, reusing nothing.

> This is the same unit (the byte as an address, the block as the transfer granularity) seen in [Memory Layout](/?c=representation-des-donnees&p=organisation-en-memoire) — alignment and padding directly affect how many cache lines a structure occupies.

## Fixed cost vs. marginal cost, applied to computation

Calling a vectorized function (`array.sum()`, `array * 2`) has, like a network call, a **fixed cost**: choosing which low-level routine to run, allocating the result array — independent of the number of elements `n`. The **marginal cost** (the cost per element) then depends on two things: the memory locality seen above, and the processor's ability to process several elements per instruction rather than just one.

This second point is called **SIMD** (*Single Instruction, Multiple Data*): a processor instruction that applies the same operation to several contiguous values at once (e.g. adding 8 integers in a single instruction, rather than 8 separate instructions). SIMD can only be exploited if the data is **contiguous and of uniform size** — exactly what a typed array guarantees, and never what a collection of scattered objects guarantees.

## Why a NumPy array is fast and a Python list isn't

A Python list is an array of **pointers** to objects, potentially scattered anywhere on the heap and of different sizes. A `for` loop over a Python list must, on every iteration: follow a pointer (a memory access potentially outside cache), check the type of the pointed-to object, then call the right routine — all driven by the interpreter, instruction by instruction.

A [NumPy array](/?c=data-science&p=numpy) (`ndarray`) is a single **contiguous** block of memory, holding the values themselves (not pointers), all of the same type and size. A vectorized operation (`a + b`) delegates to a **compiled** loop that walks this block sequentially: cache lines are reused to the maximum, and the processor can use SIMD instructions on several elements at once. Same number of arithmetic operations, but a much lower marginal cost per element.

## The `dtype=object` pitfall: contiguous doesn't mean uniform

A NumPy array created with heterogeneous types (e.g. a mix of integers and strings) falls back to `dtype=object`: the array is still a **contiguous** block... of pointers to Python objects potentially scattered around, of different types. Every access becomes a pointer chase followed by a per-element type check again — the marginal cost explodes and becomes comparable to a Python list's, despite the array itself being contiguous.

Memory contiguity is necessary to benefit from cache and SIMD, but **not sufficient**: elements also need to be of uniform size and type, so the processor can process them as a block without re-checking each one individually.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A RAM access costs ~50× more than an L1 cache access. Contiguous, uniformly typed data (a typed array) benefits from cache and SIMD; scattered data (a linked list, spread-out objects) reloads a cache line on every access. |
| **Tools you can use** | A contiguous typed array (NumPy `ndarray`) rather than a collection of scattered objects for intensive computation. |
| **Pitfalls to avoid** | A NumPy array in `dtype=object` — stays contiguous in appearance, but loses all the cache/SIMD benefit (pointers to scattered objects). |
| **Best practices** | Prefer a typed, contiguous array as soon as the volume of computation justifies the effort; traverse data in the order it's laid out in memory. |
