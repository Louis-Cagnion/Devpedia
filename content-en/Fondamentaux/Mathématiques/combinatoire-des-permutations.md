---
order: 8
---

# Counting Permutations: Factorial, Binomial Coefficient and Stirling Numbers

**Combinatorics** is the art of **counting without listing everything**. In programming, it predicts the size of a problem before running it: how many cases will an algorithm examine, how much memory must be reserved? (see [Complexity and Big-O Notation](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

Running example: a row of the **Skyscraper** puzzle, which contains buildings of height 1 to n, each height once; a clue on the edge says how many buildings are visible from that side, a building hiding all the smaller ones behind it.

## The Factorial: the Number of Possible Orders

A **permutation** is a way of arranging n distinct elements in an order. Their number is the **factorial** of n, written `n!`: n choices for the first place, n − 1 for the second, and so on.

```
n! = n × (n − 1) × ... × 2 × 1          example: 4! = 4 × 3 × 2 × 1 = 24
```

| n | n! |
|---|---|
| 4 | 24 |
| 10 | 3,628,800 |
| 11 | 39,916,800 |
| 13 | 6,227,020,800 |

The factorial grows even faster than an exponential. Consequence measured on a Skyscraper solver that stored, for each row, every permutation compatible with its clues: on a 12 × 12 grid, generation already produced 660 million candidates (5.3 GB of memory) before even searching.

## The Binomial Coefficient: Choosing k Elements Among n

The **binomial coefficient** `C(n, k)` counts the ways to choose k elements among n, regardless of order. For example, choosing 2 toppings among 4: `C(4, 2) = 6`.

```
C(n, k) = n! / (k! × (n − k)!)
```

Computing the three factorials would quickly exceed the capacity of an integer (`21!` no longer fits in 64 bits). So it is computed step by step, multiplying then dividing:

```python
def binomial(n, k):
    r = 1
    for i in range(1, k + 1):
        r = r * (n - k + i) // i  # always an exact division: r × (n-k+i) is divisible by i
    return r

print(binomial(4, 2))    # 6
print(binomial(60, 30))  # 118264581564861424, without ever computing 60!
```

The division is always exact because after step i, `r` equals `C(n − k + i, i)`, an integer. Checked for every `n` up to 60.

## The Records of a Permutation

A **record** is an element larger than all those before it, reading from left to right. In Skyscraper, the records are exactly the buildings **visible** from the left:

```
permutation: 1  2  4  3
records    : 1  2  4        (3 is smaller than 4, placed before it)  -> 3 records, 3 visible buildings
```

## Stirling Numbers of the First Kind

How many permutations of n elements have exactly k records? This number is called the (unsigned) **Stirling number of the first kind**, written `c(n, k)`.

| n \ k | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | 1 | | | | |
| 2 | 1 | 1 | | | |
| 3 | 2 | 3 | 1 | | |
| 4 | 6 | 11 | 6 | 1 | |
| 5 | 24 | 50 | 35 | 10 | 1 |

Each row sums to `n!` (24 + 50 + 35 + 10 + 1 = 120 = 5!). The table is filled row by row thanks to a **recurrence**, by looking at where the smallest element (the 1) is:

| Position of the 1 | Is it a record? | Number of permutations |
|---|---|---|
| In first place | Yes (nothing before it), and it hides nothing since it is the smallest: the n − 1 others must provide the k − 1 remaining records | `c(n − 1, k − 1)` |
| In one of the n − 1 other places | No (a larger one precedes it), and it still hides nothing: the others must provide the k records | `(n − 1) × c(n − 1, k)` |

```python
def stirling1(n):
    """Table c[i][j]: number of permutations of i elements with j records."""
    c = [[0] * (n + 1) for _ in range(n + 1)]
    c[0][0] = 1                                          # the empty permutation: 0 records
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            c[i][j] = c[i - 1][j - 1] + (i - 1) * c[i - 1][j]
    return c

print(stirling1(5)[5])  # [0, 24, 50, 35, 10, 1]
```

## Seeing from Both Sides at Once

A Skyscraper row often has a clue on the left (a visible buildings) **and** on the right (b visible). The tallest building, n, is visible from both sides. The number of permutations respecting both clues is:

```
C(a + b − 2, a − 1) × c(n − 1, a + b − 2)
```

Example: n = 5, a = 2, b = 2 gives `C(2, 1) × c(4, 2) = 2 × 11 = 22`, which listing the 120 permutations confirms. Formula checked by enumeration for every size up to 7.

Concrete use: knowing this number **before** generating the candidates of a row makes it possible to reserve exactly the right amount of memory at once, instead of growing an array as you go.

## Choosing a Construction Order That Checks Early

To generate the permutations respecting a clue, the order in which values are placed matters:

| Placement order | When do you know whether a building is visible? |
|---|---|
| Cells from left to right | Visibility from the left: immediately. From the right: only once the row is complete. |
| Values from the **largest to the smallest** | From both sides, as soon as it is placed: every building already placed is taller, so it is visible from a side if none of them is on that side; and the values placed afterwards, smaller, can never hide it. |

With the second order, a partial permutation that already exceeds a clue (left **or** right) is abandoned immediately, together with all its continuations. Measured on the Skyscraper solver's generator: 5 to 6 times faster than filling from left to right.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `n!` counts the orders of n elements and explodes very quickly; `C(n, k)` counts the choices of k among n; `c(n, k)`, the Stirling number of the first kind, counts the permutations with k records (k visible buildings). |
| **Tools you can use** | Incremental computation of the binomial coefficient; recurrence `c(n, k) = c(n − 1, k − 1) + (n − 1) × c(n − 1, k)`; two-clue formula `C(a + b − 2, a − 1) × c(n − 1, a + b − 2)`. |
| **Pitfalls to avoid** | Computing `C(n, k)` through three factorials (overflow); materializing every permutation of a problem without having counted how many there are. |
| **Best practices** | Count before generating, to estimate the cost and reserve the exact memory; choose a construction order that makes constraints checkable as early as possible; check a formula by enumeration on small sizes. |
