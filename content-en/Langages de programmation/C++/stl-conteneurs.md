---
order: 8
---

# STL — Containers

The **STL** (*Standard Template Library*) provides ready-to-use generic data structures (see the chapter on templates)—rather than having to manually reimplement a linked list or a hash table (see the relevant chapters, C section), virtually all modern C++ projects rely on these standard containers.

## `std::vector` : the dynamic table

```cpp
#include <vector>

std::vector<int> numbers = {1, 2, 3};

numbers.push_back(4);        // add at the end
numbers[0];                     // direct access via index, like a C array
numbers.size();                  // number of items
numbers.pop_back();                // removes the last element

for (int n : numbers) {              // simple loop, like a for-each loop
    std::cout << n << " ";
}
```

> **Note:** `std::vector` is, internally, a contiguous array in memory (see the chapter on pointers and memory, section C) that automatically resizes (often by doubling its capacity) when it is full—the same principle as a [Python list](/?c=langages-de-programmation&s=python&p=listes-et-tuples) or a Java [`ArrayList`](https://docs.oracle.com/en/java/), but without the indirection layer of a garbage-collected language.

## `std::list` : the doubly linked list

```cpp
#include <list>

std::list<int> list = {1, 2, 3};
list.push_front(0);   // Insertion at the beginning in constant time -> std::vector would be O(n) here
```

Unlike `std::vector`, inserting in the middle or at the beginning of a `std::list` does not require any reordering of the other elements (see the chapter on linked lists, section C)—at the cost of making index-based access impossible in constant time (there is no `list[2]`; you must iterate through the list).

## `std::map` : The Organized Dictionary

```cpp
#include <map>

std::map<std::string, int> ages;
ages["Jean"] = 25;
ages["Marie"] = 30;

ages["Jean"];                       // 25
ages.find("Ali") != ages.end();       // checks for the existence of a key (there is no direct "in" operator in C++)

for (const auto &[name, age] : ages) {   // Process: Pairs are ALWAYS sorted by key
    std::cout << name << " : " << age << "\n";
}
```

> **Note:** `std::map` is internally a balanced tree (often a [red-black tree](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), a variant of the binary search tree discussed in the dedicated chapter, section C)—so the keys are always traversed **in sorted order**, unlike a [PHP associative array](/?c=langages-de-programmation&s=php&p=variables) or a [Python `dict`](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) (which are in insertion order). `std::unordered_map` offers the equivalent based on a hash table (see the dedicated chapter, section C), which is faster on average but does not guarantee any specific order.

## `std::set` : unique, ordered values

```cpp
#include <set>

std::set<int> values = {3, 1, 2, 1};   // {1, 2, 3} -> automatically sorted AND deduplicated

values.insert(4);
values.count(2);   // 1 if present, 0 otherwise (a set never contains duplicates)
```

`std::unordered_set` is the hash table-based equivalent—faster on average, but with no guaranteed order.

## Choosing the Right Container

| Need | Container |
|---|---|
| Quick access via index, added to the end of the collection | `std::vector` |
| Frequent insertions/deletions in the middle or beginning of a collection | `std::list` |
| Key-value pair → value, sorted order required | `std::map` |
| Key-value association, order-insensitive, speed-priority | `std::unordered_map` |
| Unique values, sorted | `std::set` |
| Unique values, order does not matter, speed is a priority | `std::unordered_set` |

See also the chapter on STL iterators and algorithms, which allow you to manipulate any of these containers in a consistent manner.
