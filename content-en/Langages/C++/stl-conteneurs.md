---
order: 8
---

# STL: Containers

The **STL** (*Standard Template Library*) provides ready-to-use generic data structures (see [Templates](/?c=langages-de-programmation&s=cpp&p=templates)), rather than having to manually reimplement a [linked list](/?c=langages-de-programmation&s=c&p=listes-chainees) or a [hash table](/?c=langages-de-programmation&s=c&p=tables-de-hachage); virtually all modern C++ projects rely on these standard containers.

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

> **Note:** `std::vector` is, internally, a contiguous array in memory (see [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) and [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)) that automatically resizes (often by doubling its capacity) when it is full, the same principle as a [Python list](/?c=langages-de-programmation&s=python&p=listes-et-tuples) or a Java [`ArrayList`](https://docs.oracle.com/en/java/), but without the indirection layer of a garbage-collected language.

## `std::list` : the doubly linked list

```cpp
#include <list>

std::list<int> list = {1, 2, 3};
list.push_front(0);   // Insertion at the beginning in constant time -> std::vector would be O(n) here
```

Unlike `std::vector`, inserting in the middle or at the beginning of a `std::list` does not require any reordering of the other elements (see [Linked Lists](/?c=langages-de-programmation&s=c&p=listes-chainees)), at the cost of making index-based access impossible in constant time (there is no `list[2]`; you must iterate through the list).

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

> **Note:** `std::map` is internally a balanced tree (often a [red-black tree](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), a variant of the [binary search tree](/?c=langages-de-programmation&s=c&p=arbres-binaires)), so the keys are always traversed **in sorted order**, unlike a [PHP associative array](/?c=langages-de-programmation&s=php&p=variables) or a [Python `dict`](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) (which are in insertion order). `std::unordered_map` offers the equivalent based on a [hash table](/?c=langages-de-programmation&s=c&p=tables-de-hachage), which is faster on average but does not guarantee any specific order.

## Finding the Closest Key: `lower_bound`

`std::map` keeps its keys sorted (seen above): `lower_bound(key)` directly leverages that ordering to find, in O(log n), the first element whose key is **not less than** the one searched for, without ever scanning the whole container:

```cpp
std::map<int, std::string> rates = {{10, "A"}, {20, "B"}, {30, "C"}};

auto it = rates.lower_bound(20);   // finds exactly 20: it->second == "B"
auto it2 = rates.lower_bound(25);  // no 25: returns the first element >= 25, so 30
```

If the exact key doesn't exist, `lower_bound` therefore returns the first strictly greater key. To find the last key strictly **less than** a value (useful, for instance, to map a date to the closest valid data point before it), decrement the returned iterator:

```cpp
auto it = rates.lower_bound(25);
if (it != rates.begin()) {
    --it;   // it now points to 20, the last key strictly less than 25
}
```

> **Pitfall:** decrementing the iterator without first checking that it isn't already `begin()`: moving before the first element is undefined behavior.
>
> **Best practice:** `lower_bound`/its counterpart `upper_bound` (first strictly greater key) avoid a manual linear scan whenever you need to find the closest key in a sorted container, far more direct than a `for` loop with comparisons.

## `std::set` : unique, ordered values

```cpp
#include <set>

std::set<int> values = {3, 1, 2, 1};   // {1, 2, 3} -> automatically sorted AND deduplicated

values.insert(4);
values.count(2);   // 1 if present, 0 otherwise (a set never contains duplicates)
```

`std::unordered_set` is the hash table-based equivalent, faster on average, but with no guaranteed order.

## `std::stack`: a Container Adapter

Unlike `std::vector`/`std::map`, which are full-fledged containers, `std::stack` is a **container adapter**: it doesn't store anything itself, but wraps another container (`std::deque` by default) while only exposing LIFO operations (see [Stack and Queue](/?c=fondamentaux&s=algorithmes&p=pile-et-file)):

```cpp
#include <stack>

std::stack<int> stack;
stack.push(1);
stack.push(2);
stack.top();    // 2: the top, without removing it
stack.pop();    // removes the top (returns NOTHING, unlike many other languages)
```

Deliberately missing iterators (no `begin()`/`end()`): iterating over a stack any other way than through its top normally doesn't make sense.

> **Best practice:** publicly inherit from `std::stack<T>` to add your own `begin()`/`end()`, delegating directly to the underlying container (accessible through the protected `c` member), if a genuine need justifies iterating over a stack anyway:

```cpp
template <typename T>
class IterableStack : public std::stack<T> {
public:
    auto begin() { return this->c.begin(); }
    auto end() { return this->c.end(); }
};
```

`this->c` (the underlying container, `std::deque` by default) is normally inaccessible from outside `std::stack`: this technique takes advantage of it directly from a child class, which inherits the same `protected` access.

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

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The STL provides ready-to-use generic containers: `vector` (dynamic array), `list` (doubly linked list), `map`/`set` (sorted), `unordered_map`/`unordered_set` (hash table, faster but unsorted). `std::stack` is an adapter, not a full-fledged container. |
| **Tools you can use** | `push_back`/`push_front`, `size`, `find`, for-each traversal. `lower_bound`/`upper_bound` to find the closest key in a sorted `map`. |
| **Pitfalls to avoid** | Choosing `vector` for frequent front insertions (`O(n)` cost, `list` would be constant time). Decrementing a `lower_bound` iterator without checking it isn't already `begin()`. |
| **Best practices** | Choose the container based on the dominant operation (index access, frequent insertion, sorted association...) rather than out of habit. |
