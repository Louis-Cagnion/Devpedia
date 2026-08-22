---
order: 1
---

# Big-O Notation and Complexity

Two algorithms can solve the exact same problem with radically different performance depending on how much data they process. **Algorithmic complexity** measures how an algorithm's running time (or memory usage) **grows** as the size of its input grows, independently of the machine it runs on or the language it's written in.

## Why not just measure time in seconds?

Timing an algorithm gives a result that depends on the processor, the machine's load at the time of the test, the language used... That number can't reliably compare two algorithms, nor predict what happens with 10 times more data. Complexity answers a different, more useful question: "if I multiply the input size by 10, does the running time get multiplied by 10? By 100? Does it stay the same?"

## Big-O notation: describing a trend, not a precise number

**Big-O notation** (written `O(...)`) describes how an algorithm's cost evolves as a function of the size `n` of its input, in the worst case, once constant details are ignored (a `2×` factor or one extra fixed operation doesn't change the category).

```c
void printFirst(int array[], int size)
{
    printf("%d\n", array[0]); // always exactly 1 operation, regardless of "size"
}
```

```c
void printAll(int array[], int size)
{
    for (int i = 0; i < size; i++) {
        printf("%d\n", array[i]); // 1 operation per element -> "size" operations total
    }
}
```

The first example is **O(1)** (constant time: always a single operation). The second is **O(n)** (linear time: the number of operations grows exactly like `n`, the number of elements).

## The most common complexity classes

| Notation | Name | Example operation | For n = 1,000,000 |
|---|---|---|---|
| `O(1)` | Constant | Accessing `array[i]` by index | 1 operation |
| `O(log n)` | Logarithmic | Searching a balanced [binary search tree](/?c=langages-de-programmation&s=c&p=arbres-binaires) | ~20 operations |
| `O(n)` | Linear | Going through every element once | 1,000,000 operations |
| `O(n log n)` | Quasi-linear | A [merge sort](/?c=algorithmes&p=tri-par-comparaison) | ~20,000,000 operations |
| `O(n²)` | Quadratic | Comparing every element to every other one (nested double loop) | 1,000,000,000,000 operations |
| `O(2ⁿ)` | Exponential | Testing every possible combination of a set | Astronomical, already for n = 40 |

```text
Time
  ^                                         O(2^n)
  |                                    ,
  |                               ,   O(n^2)
  |                          ,·''
  |                    ,·''       O(n log n)
  |              ,·''''
  |        ,·'''            O(n)
  |   ,·''''
  |,·'  ________________ O(log n) / O(1)
  +----------------------------------------> n (input size)
```

> **Note:** by default, Big-O describes the **worst case** (e.g. searching for an element that isn't in an unsorted array forces a full scan). It's sometimes broken down into best case, average case, and worst case, but Big-O alone, with no qualifier, always refers to the worst case.

## Time complexity vs. memory complexity

The same notation applies to the **memory** an algorithm uses, not just its running time: an algorithm can be fast (`O(n)` in time) but memory-hungry (`O(n)` of extra allocated space), or the other way around. Both need to be evaluated separately: a common trade-off in algorithm design is exchanging extra memory for shorter running time, or vice versa.

> **Pitfall:** overlooking a hidden `O(n²)` inside a loop that calls a function which is itself `O(n)` (e.g. searching for an element by scanning, inside a loop that already goes through every element): the real cost isn't the sum of the two complexities, but their product.
>
> **Best practice:** before optimizing an algorithm at the hardware level (see [Performance](/?c=performance)), check its complexity first: replacing an `O(n²)` with an `O(n log n)` often wins far more than a low-level tweak on an algorithm whose complexity stays bad.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Big-O notation describes how an algorithm's cost evolves with the size of its input, in the worst case, independently of the machine used. |
| **Tools you can use** | The table of complexity classes (`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(2ⁿ)`) to quickly classify an algorithm. |
| **Pitfalls to avoid** | Confusing the sum and the product of nested operations' complexities; only measuring in seconds without accounting for the large-scale trend. |
| **Best practices** | Evaluate time complexity AND memory complexity separately; fix bad complexity before optimizing at the hardware level. |
