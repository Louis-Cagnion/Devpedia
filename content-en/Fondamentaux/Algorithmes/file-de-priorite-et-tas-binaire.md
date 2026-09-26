---
order: 10
---

# The Priority Queue and the Binary Heap

A [queue](/?c=fondamentaux&s=algorithmes&p=pile-et-file) serves elements in their order of arrival. A **priority queue** always serves **the highest-priority one** first, like a hospital emergency room: the most serious patient goes first, whatever their arrival time.

| Operation | Unsorted array | Sorted array | Binary heap |
|---|---|---|---|
| Add an element | O(1) | O(n) (shift to insert it in place) | O(log n) |
| Remove the highest-priority one | O(n) (scan everything) | O(1) | O(log n) |

The **binary heap** does both operations in O(log n) (see [Complexity and Big-O Notation](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): with a million elements, about twenty steps instead of a million.

## The Binary Heap: a Tree Stored in an Array

A heap is a tree where each parent has **at least the priority of its children**. The highest-priority element is therefore always at the root. The tree is stored level by level in a plain array, without pointers:

```
            [0] 90                  array: 90  70  80  20  50  60
          /        \                cell :  0   1   2   3   4   5
      [1] 70      [2] 80
      /    \       /                parent of cell i   : (i - 1) / 2
  [3] 20  [4] 50  [5] 60            children of cell i : 2i + 1 and 2i + 2
```

| Operation | How |
|---|---|
| Add | Put the element at the end of the array, then make it **rise** by swapping it with its parent as long as it has a higher priority |
| Remove the highest-priority one | Take the root, put the last element in its place, then make it **sink** by swapping it with its highest-priority child as long as needed |

Each rise or sink covers at most the height of the tree, that is log₂(n) steps.

## The Indexed Heap: Changing the Priority of an Element Already Stored

Some algorithms raise the priority of an element **already in the heap**: for example the VSIDS heuristic of [SAT solvers](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), which increases a variable's activity at each conflict. You then need to know **where** that element is in the array, without searching cell by cell. An **indexed heap** keeps a table `pos[x]`: the cell where element x is, updated at every move.

```c
double priority[N];                          // priority[x]: priority of element x
int    heap[N];                              // the elements, stored as a heap
int    pos[N];                               // pos[x]: cell of x in heap, or -1
int    size = 0;

static void put(int i, int x) { heap[i] = x; pos[x] = i; }

// Makes the element of cell i rise as long as it has a higher priority than its parent
static void rise(int i)
{
    int x = heap[i];
    while (i > 0 && priority[x] > priority[heap[(i - 1) / 2]]) {
        put(i, heap[(i - 1) / 2]);           // the parent moves down one level
        i = (i - 1) / 2;
    }
    put(i, x);
}

// Makes the element of cell i sink as long as a child has a higher priority
static void sink(int i)
{
    int x = heap[i];
    for (;;) {
        int c = 2 * i + 1;                   // left child
        if (c >= size)
            break;
        if (c + 1 < size && priority[heap[c + 1]] > priority[heap[c]])
            c++;                             // the higher-priority of the two children
        if (priority[heap[c]] <= priority[x])
            break;
        put(i, heap[c]);                     // the child moves up one level
        i = c;
    }
    put(i, x);
}

void insert(int x) { put(size, x); size++; rise(size - 1); }

int extract_max(void)
{
    int x = heap[0];
    pos[x] = -1;                             // x is no longer in the heap
    size--;
    if (size > 0) {
        put(0, heap[size]);                  // the last one takes the root's place
        sink(0);
    }
    return x;
}

void increase(int x, double delta)           // the priority of x increases
{
    priority[x] += delta;
    if (pos[x] >= 0)
        rise(pos[x]);                        // thanks to pos: no search in the heap
}
```

Instead of swapping two cells at each step, `rise` and `sink` shift the elements they meet and only place `x` once, in its final cell: half as many writes. Code checked over 200,000 random operations (additions, increases, removals), comparing each removal with a cell-by-cell search for the maximum: no difference.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A priority queue always serves the highest-priority element first. The binary heap implements it in a plain array: parent of cell i at (i − 1) / 2, children at 2i + 1 and 2i + 2, addition and removal in O(log n). |
| **Tools you can use** | Rising and sinking in the heap; a position table `pos[x]` (indexed heap) to raise the priority of an element already stored. |
| **Pitfalls to avoid** | Forgetting to update `pos` at every move (always go through a single function like `put`); searching for an element cell by cell in the heap, which cancels the whole gain. |
| **Best practices** | Check a heap against a naive version over many random operations; shift rather than swap during a rise or a sink. |
