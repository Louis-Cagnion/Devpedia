---
order: 9
---

# STL: Iterators, Algorithms, and Lambdas

An **iterator** is an abstraction that allows you to iterate over any STL container (see the dedicated chapter) in the same way, whether it is a `vector` (contiguous array) or a `list` (linked list): the iteration code remains the same, even if the underlying structure is radically different.

## The Principle of the Iterator

```cpp
std::vector<int> numbers = {1, 2, 3};

std::vector<int>::iterator it = numbers.begin();
while (it != numbers.end()) {
    std::cout << *it << " ";   // "*it" dereferences the iterator, just like a pointer (see the relevant chapter, under the C section)
    ++it;
}
```

- `begin()` Returns an iterator pointing to the first element.
- `end()` returns an iterator "just after" the last element (never directly dereferenced, only compared).
- `*it` Dereference the current iterator; `++it` moves to the next one, a syntax intentionally similar to that of a raw pointer.

## The Modern for-each Loop (C++11+)

```cpp
for (int n : numbers) {
    std::cout << n << " ";
}
```

This syntax relies on **exactly** the same iterator mechanism behind the scenes; it is a syntactic shortcut that works for any type that exposes `begin()` or `end()`.

## Standard Algorithms (`<algorithm>`)

Rather than manually writing a loop for each common operation, the STL provides generic algorithms that operate on **pairs of iterators** (start, end), and are therefore applicable to any container:

```cpp
#include <algorithm>

std::vector<int> numbers = {5, 3, 1, 4, 2};

std::sort(numbers.begin(), numbers.end());               // sort in place -> {1, 2, 3, 4, 5}

auto it = std::find(numbers.begin(), numbers.end(), 3);    // iterator pointing to the value 3
bool trouve = (it != numbers.end());

int somme = std::accumulate(numbers.begin(), numbers.end(), 0);  // 15 -> requires <numeric>

std::for_each(numbers.begin(), numbers.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## Lambdas (C++11+)

A **lambda** is an anonymous function written directly where it is used, the same concept as JavaScript closures or [Python](/?c=langages-de-programmation&s=python&p=python) lambdas (see the relevant chapters):

```cpp
auto carre = [](int x) { return x * x; };
std::cout << carre(5);   // 25
```

```cpp
int seuil = 3;
auto estAuDessusDuSeuil = [seuil](int x) { return x > seuil; };   // "threshold" capture by value

int compte = std::count_if(numbers.begin(), numbers.end(), estAuDessusDuSeuil);
```

- `[]` : capture list, which external variables the lambda can use, and how (`[seuil]` by value, `[&seuil]` by reference, `[&]` all by reference, `[=]` all by value).
- `()` : parameters, just like a standard function.
- `{}` : body of the lambda.

## Common Algorithms

| Function | Role |
|---|---|
| `std::sort` | Sorts a range of elements |
| `std::find` | Find the first occurrence of a value |
| `std::count` / `std::count_if` | Counts occurrences (with or without a condition) |
| `std::for_each` | Applies a function to each element |
| `std::transform` | Generates a new array by applying a function to each element (equivalent to `map` in Python/JS) |
| `std::accumulate` | Reduces a range to a single value (equivalent to `reduce`) |

> **Note:** Using these algorithms instead of manual loops makes the intent explicit (a `std::sort` says “I’m sorting,” whereas a loop with a hand-written sorting algorithm requires the reader to infer it), a direct gain in readability, in addition to avoiding the need to reimplement (and potentially misimplement) logic that is already standardized and optimized.
