---
order: 4
---

# Greedy Algorithms

A **greedy algorithm** solves a problem step by step, choosing at each step the locally best option, never going back and never guaranteeing a globally optimal result.

## Example: Making Change

Making 67 cents with the fewest coins possible, using coins of 50, 20, 10, 5, 2, and 1 cent: at each step, take the largest coin that doesn't exceed the remaining amount.

```text
Remaining: 67
  -> 50 (remaining 17)
  -> 10 (remaining 7)
  -> 5  (remaining 2)
  -> 2  (remaining 0)
Result: 4 coins (50 + 10 + 5 + 2)
```

With this coin system (1, 2, 5, 10, 20, 50), this greedy choice always gives the minimal number of coins. That isn't guaranteed with just any coin system: see the pitfall below.

## A Greedy Choice Isn't Always Optimal

> **Pitfall:** believing a greedy algorithm always gives the best possible solution. With coins of 1, 3, and 4 cents, making 6 cents greedily takes one 4-coin plus two 1-coins (3 coins), while two 3-coins would suffice (2 coins): the locally optimal choice at the first step (take the largest coin) leads here to a globally worse result.
>
> **Best practice:** a greedy algorithm should be proven correct (or empirically checked against the actual coin system used) before being adopted; when in doubt, **dynamic programming** (which explores several choices at each step and keeps the best one afterward, beyond the scope of this chapter) guarantees an optimal result where greedy doesn't.

## Other Classic Examples

| Problem | Greedy choice |
|---|---|
| Making change | Always take the largest possible coin |
| Dijkstra's algorithm (shortest path) | Always extend toward the closest unvisited vertex |
| Huffman coding (compression) | Always merge the two least frequent symbols |

A greedy algorithm is generally fast and simple to implement (a single pass, no backtracking); as opposed to an algorithm that explores several possibilities before choosing ([dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming), [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)), which is more costly but guarantees optimality in cases where greedy fails.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A greedy algorithm chooses, at each step, the locally best option, with no going back and no guarantee of a globally optimal result. |
| **Tools you can use** | Making change, Dijkstra, Huffman as classic examples of greedy algorithms. |
| **Pitfalls to avoid** | Assuming a greedy choice is always optimal: it entirely depends on the problem (see the 1/3/4-coin counterexample). |
| **Best practices** | Verify (or prove) that a greedy algorithm is correct for the actual problem before adopting it; otherwise, prefer dynamic programming. |
