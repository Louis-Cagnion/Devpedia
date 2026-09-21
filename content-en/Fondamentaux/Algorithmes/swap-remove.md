---
order: 5
---

# Swap-Remove: Removing an Element in O(1)

Removing an element in the middle of an array is normally expensive: every following element must shift one slot left to fill the gap, an **O(n)** operation ([complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). *Swap-remove* (or *swap-and-pop*) avoids this shift, at the cost of losing the elements' order -- acceptable as soon as that order doesn't need to be preserved.

## The problem: the classic shift

```c
// removes the element at index i, shifting everything after it -- O(n)
void remove_with_shift(int arr[], int *size, int i)
{
    for (int j = i; j < *size - 1; j++)
        arr[j] = arr[j + 1];   // every element moves back one slot
    (*size)--;
}
```

On a 1000-element array, removing the first one moves the other 999: expensive if the operation repeats often.

## The technique: swap with the last, then remove

Instead of shifting, swap the element to remove with the **last active element** in the array, then reduce the size counter:

```c
// removes the element at index i by swapping it with the last one -- O(1)
void swap_remove(int arr[], int *size, int i)
{
    arr[i] = arr[*size - 1];   // the last element takes the removed one's spot
    (*size)--;                  // the last one is no longer counted as active
}
```

```text
Before (removing index 1, value B):
[A][B][C][D]        size = 4
    ^ to remove

After swap_remove(arr, &size, 1):
[A][D][C] [B]        size = 3
             ^ B is still physically in memory, but no longer counted
```

Only one element moves, regardless of the array's size: **O(1)**, independent of the removed position.

> **Pitfall:** this technique only works if the order of the remaining elements doesn't need to be preserved. On an array where order matters (e.g. a leaderboard, a chronological history), swap-remove would silently break that order -- stick with the classic shift in that case.

## Undoing a removal without copying

Since the removed element stays physically present past the new counter (`arr[*size]` up to the old `*size`, never overwritten as long as no other `swap_remove` happens), undoing the last removal simply means restoring the old counter -- no data copy needed:

```c
int old_size = size;
swap_remove(arr, &size, i);
// ... later, to undo:
size = old_size;   // arr[i] is valid again as-is, nothing to copy back
```

This property makes swap-remove particularly well suited to an algorithm that tries then undoes candidates in a loop, like [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Swap-remove removes an element from an unordered array in O(1), by swapping it with the last active element then decrementing the size counter, at the cost of losing the elements' order. |
| **Tools you can use** | No dedicated tool: a technique to apply directly on an array/size counter. |
| **Pitfalls to avoid** | Using it on an array where the elements' order must be preserved (leaderboard, history). |
| **Best practices** | Take advantage of the removed element staying physically in memory to undo a removal without copying, just by restoring the old counter. |
