---
order: 6
---

# CPU Cache and Vectorization (SIMD)

The previous chapters deal with time lost waiting on **another component** (network, disk, remote service). For pure computation (adding numbers, transforming an array), the same [fixed cost / marginal cost](/?c=performance&p=limiter-les-aller-retours) distinction exists, but what dominates the marginal cost is no longer network latency: it's how the processor accesses memory.

## The cache hierarchy

A processor never reads RAM directly on every access: several levels of memory, progressively smaller and faster, sit between it and RAM.

| Level | Typical size | Relative latency |
|---|---|---|
| Registers | A few dozen bytes | ~1 cycle |
| L1 cache | 32-64 KB | ~4 cycles |
| L2 cache | 256 KB-1 MB | ~15 cycles |
| L3 cache | A few MB (shared across cores) | ~40 cycles |
| RAM | Several GB | ~200 cycles |

A **register** is a storage location built into the processor itself (not in memory): it's where it places the values it operates on directly. A **cycle** is a tick of the processor's internal clock, the finest unit of time it can act on; all the latencies above are expressed in number of cycles rather than seconds, because that number stays stable from one machine to another, unlike the actual duration of a cycle (which depends on the processor's clock speed).

These numbers are orders of magnitude (they vary by architecture), but what matters is the ratio between them: a RAM access easily costs 50 times more than an L1 access. A program that makes repeated round trips to RAM instead of reusing what's already in cache can be dozens of times slower, for the exact same number of operations.

## Cache lines: contiguous memory is "free"

The processor never loads a single byte: it always loads a fixed-size block, the **cache line** (64 bytes on most current architectures), even if only one byte of that block is requested.

Direct consequence: reading **contiguous** data (an array traversed in order) benefits from lines already loaded by previous accesses: most reads cost almost nothing. Reading **scattered** data (a linked list, objects spread across the heap) triggers a fresh line load on every access, reusing nothing.

> This is the same unit (the byte as an address, the block as the transfer granularity) seen in [Memory Layout](/?c=representation-des-donnees&p=organisation-en-memoire): alignment and padding directly affect how many cache lines a structure occupies.

## Fixed cost vs. marginal cost, applied to computation

Calling a vectorized function (`array.sum()`, `array * 2`) has, like a network call, a **fixed cost**: choosing which low-level routine to run, allocating the result array; independent of the number of elements `n`. The **marginal cost** (the cost per element) then depends on two things: the memory locality seen above, and the processor's ability to process several elements per instruction rather than just one.

This second point is called **SIMD** (*Single Instruction, Multiple Data*): a processor instruction that applies the same operation to several contiguous values at once (e.g. adding 8 integers in a single instruction, rather than 8 separate instructions). SIMD can only be exploited if the data is **contiguous and of uniform size**: exactly what a typed array guarantees, and never what a collection of scattered objects guarantees.

## Why a NumPy array is fast and a [Python](/?c=langages-de-programmation&s=python&p=python) list isn't

A Python list is an array of **pointers** to objects, potentially scattered anywhere on the heap and of different sizes. A `for` loop over a Python list must, on every iteration: follow a pointer (a memory access potentially outside cache), check the type of the pointed-to object, then call the right routine: all driven by the interpreter, instruction by instruction.

A [NumPy array](/?c=data-science&p=numpy) (`ndarray`) is a single **contiguous** block of memory, holding the values themselves (not pointers), all of the same type and size. A vectorized operation (`a + b`) delegates to a **compiled** loop that walks this block sequentially: cache lines are reused to the maximum, and the processor can use SIMD instructions on several elements at once. Same number of arithmetic operations, but a much lower marginal cost per element.

## The `dtype=object` pitfall: contiguous doesn't mean uniform

A NumPy array created with heterogeneous types (e.g. a mix of integers and strings) falls back to `dtype=object`: the array is still a **contiguous** block... of pointers to Python objects potentially scattered around, of different types. Every access becomes a pointer chase followed by a per-element type check again: the marginal cost explodes and becomes comparable to a Python list's, despite the array itself being contiguous.

Memory contiguity is necessary to benefit from cache and SIMD, but **not sufficient**: elements also need to be of uniform size and type, so the processor can process them as a block without re-checking each one individually.

## Counting Random Memory Accesses, Not Instructions

The number of instructions executed is a poor predictor of real time: as the cache hierarchy above shows, what costs is the number of **random** memory accesses (the ones that miss cache), not the number of operations.

On a SAT solver (see [SAT Solvers and the CDCL Algorithm](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)):

| Optimization | Effect on instructions | Effect on time |
|---|---|---|
| Circular search for the replacement literal ([Gent 2013](https://www.jair.org/index.php/jair/article/view/10839)) | Divides the number of scanned literals by 2.5 | No change |
| Removing one random memory access per propagation | Barely changes the instruction count | -21% |

The first optimization reduces the work measured in instructions, but that work was already in cache: fewer instructions for the same number of already-cheap memory accesses changes nothing. The second removes an access that missed cache on every propagation: one fewer random access outweighs thousands fewer instructions that were already cheap.

> This connects to [Comparing on Work Counters, Not Only on Time](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparing-on-work-counters-not-only-on-time): the counter that predicts a memory-bound speedup is not the instruction count, but the number of out-of-cache memory accesses.

## Array of Structures vs Structure of Arrays (AoS/SoA)

When an algorithm reads and writes two fields of the same piece of data together at every step (for example the reason and decision level of a variable in a SAT solver), storing them in two separate arrays (**Structure of Arrays**, SoA) costs two cache lines per access: one per array. Storing them side by side in a single structure, itself stored in a single array (**Array of Structures**, AoS), makes them fit in a single cache line if the structure is small enough.

| Layout | What sits close in memory | Cache lines touched per access |
|---|---|---|
| Structure of Arrays (SoA) | All `reason[i]` together, all `level[i]` together, separately | 2 |
| Array of Structures (AoS) | `reason[i]` and `level[i]` side by side for each i | 1 |

On this solver, grouping a variable's reason and level into a single structure gave -7%. The rule isn't "AoS is always better than SoA": Structure of Arrays stays preferable whenever an algorithm walks a single field at a time across many elements (the typical vectorized-computation case seen earlier in this chapter). The rule is "store together what is read and written together".

> See also [AoS and SoA (Wikipedia)](https://en.wikipedia.org/wiki/AoS_and_SoA) and [Memory Layout](/?c=representation-des-donnees&p=organisation-en-memoire) for a structure's alignment and padding.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A RAM access costs ~50× more than an L1 cache access. Contiguous, uniformly typed data (a typed array) benefits from cache and SIMD; scattered data (a linked list, spread-out objects) reloads a cache line on every access. The number of random memory accesses predicts time far better than the number of instructions. |
| **Tools you can use** | A contiguous typed array (NumPy `ndarray`) rather than a collection of scattered objects for intensive computation. |
| **Pitfalls to avoid** | A NumPy array in `dtype=object`: stays contiguous in appearance, but loses all the cache/SIMD benefit (pointers to scattered objects). |
| **Best practices** | Prefer a typed, contiguous array as soon as the volume of computation justifies the effort; traverse data in the order it's laid out in memory; store together (AoS) fields read and written together, separate (SoA) fields walked one at a time across many elements. |
