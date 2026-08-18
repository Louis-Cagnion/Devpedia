---
order: 2
---

# Comparison Sorting

Sorting a list of values is one of the most studied problems in algorithm design: many strategies exist, with very different [complexities](/?c=algorithmes&p=complexite-et-notation-big-o). A **comparison sort** has only one basic operation available to decide order: comparing two elements (`a < b ?`), never accessing their numeric value directly (unlike other families of sorting algorithms, outside the scope of this chapter, which exploit the structure of the values themselves).

## Insertion sort

**Insertion sort** builds the sorted part of the array element by element: at each step, it takes the next element and inserts it in its correct place among those already sorted, the way you'd sort playing cards one by one in your hand.

```c
void insertionSort(int array[], int size)
{
    for (int i = 1; i < size; i++) {
        int value = array[i];
        int j = i - 1;

        while (j >= 0 && array[j] > value) {
            array[j + 1] = array[j]; // shift the element to the right
            j--;
        }
        array[j + 1] = value; // insert at the right spot
    }
}
```

This sort is **O(n²)** in the worst case (array sorted in reverse: every insertion shifts everything before it), but only **O(n)** if the array is already nearly sorted: an advantage exploited by more advanced hybrid algorithms.

## Merge sort

**Merge sort** applies the *divide and conquer* principle: it splits the array into two halves, recursively sorts each half, then **merges** the two sorted halves into a single sorted list.

```text
[8, 3, 5, 1, 9, 2]
        |
   split in two
        |
  [8, 3, 5]      [1, 9, 2]
    |                |
   sort              sort
    |                |
  [3, 5, 8]      [1, 2, 9]
        \            /
         \          /
           merge
              |
      [1, 2, 3, 5, 8, 9]
```

Merging two already-sorted lists is **O(n)**: it's enough to compare the two lists' first remaining elements and take the smaller one, advancing step by step. Combined with the split into halves (`log n` levels of division), the full merge sort costs **O(n log n)**, regardless of the array's initial state: unlike insertion sort, its worst case isn't degraded.

> **Note:** this trade-off between the two algorithms (insertion is fast on nearly-sorted data, merge is stable at O(n log n) in every case) is directly exploited by hybrid sorts like **merge-insertion sort**, which merges small already-sorted groups using an optimized insertion search.

## Comparing sorting algorithms

| Algorithm | Worst case | Average case | Extra memory | Stable? |
|---|---|---|---|---|
| Bubble sort | O(n²) | O(n²) | O(1) | Yes |
| Selection sort | O(n²) | O(n²) | O(1) | No |
| Insertion sort | O(n²) | O(n²) | O(1) | Yes |
| Merge sort | O(n log n) | O(n log n) | O(n) | Yes |
| Quicksort | O(n²) | O(n log n) | O(log n) | No |

A sort is called **stable** when two elements considered equal by the comparison keep their original relative order after sorting (important if, for instance, you sort a list already sorted by name, this time by age: two people of the same age must stay in their alphabetical order).

> **Pitfall:** believing a comparison sort can go below **O(n log n)** in the general case: this is a proven theoretical limit (it's impossible to do better while only comparing pairs of elements), not a matter of implementation optimization.
>
> **Best practice:** use the sort already provided by the language/standard library (usually an already-optimized hybrid sort) rather than writing one by hand, unless there's a specific constraint (limited memory, a cap on the number of allowed operations, a particular data structure).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A comparison sort only decides order by comparing pairs of elements. Insertion sort is simple but O(n²); merge sort guarantees O(n log n) in every case at the cost of extra memory. |
| **Tools you can use** | The comparison table of sorting algorithms (complexity, memory, stability) to pick the right one for the context. |
| **Pitfalls to avoid** | Hoping to go below O(n log n) with a pure comparison sort: it's a theoretical limit, not an implementation flaw. |
| **Best practices** | Prefer the sort already provided by the language, and only reimplement one by hand when a specific constraint justifies it. |
