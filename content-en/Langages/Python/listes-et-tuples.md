---
order: 4
---

# Lists and Tuples

Python distinguishes between two ordered collection structures: the **list**, which is mutable, and the **tuple**, which is immutable. Both can freely mix elements of different types.

## Lists

```python
fruits = ["apple", "banana", "cherry"]

fruits[0]      # "apple"
fruits[-1]     # "cherry" -> negative index: counts from the end
fruits[0:2]    # ["apple", "banana"] -> slicing: elements from index 0 (inclusive) to 2 (exclusive)
fruits[::-1]   # ["cherry", "banana", "apple"] -> reverses the list (step by step, starting from -1)

fruits.append("kiwi")       # add at the end
fruits.insert(0, "mango")   # insert at a specific index
fruits.remove("banana")     # removes the first occurrence of this value
fruits.pop()                # removes AND returns the last element
len(fruits)                 # number of items
"apple" in fruits           # True/False -> checks for the presence of a value
```

> **Note:** Unlike a [C](/?c=langages-de-programmation&s=c&p=c) array (fixed size, single type), a Python list is a heterogeneous **dynamic** array: it grows automatically, and each element can be of a different type, at the cost of additional memory per element (each element is actually a reference to a Python object, not a contiguous raw value as in C).

### Repeating a List with the `*` Operator

`[x] * n` builds a new list of size `n`, each slot holding `x`:

```python
zeros = [0] * 5           # [0, 0, 0, 0, 0] -> handy preallocation for a size known ahead of time
letters = ["a", "b"] * 3  # ["a", "b", "a", "b", "a", "b"] -> repeats the whole SEQUENCE, not each element
```

> **Pitfall:** `[[]] * n` does NOT create `n` independent lists, but `n` references to **the same** empty list: modifying one modifies all `n` at once.

```python
grid = [[]] * 3
grid[0].append("x")
print(grid)   # [['x'], ['x'], ['x']] -> the 3 sub-lists ARE the same object, not copies
```

> **Best practice:** use a list comprehension (see further down) to get `n` truly distinct objects: `[[] for _ in range(3)]` creates a brand-new empty list on each iteration, unlike `[[]] * 3`, which copies the same reference `n` times.

### `.append()` vs `.extend()`

```python
fruits.append("kiwi")             # already seen: adds A SINGLE element (even if it's a list, nested as-is)
fruits.extend(["kiwi", "mango"])  # adds EACH element of the given iterable, one by one, at the end

fruits.append(["a", "b"])  # [..., ["a", "b"]] -> ONE element, nested
fruits.extend(["a", "b"])  # [..., "a", "b"]   -> TWO elements, flattened
```

> **Pitfall:** confusing the two methods on a nested list: `.append(x)` always adds `x` as-is as a single element, never its unpacked content.

## Slicing in Detail

```python
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

numbers[2:5]  # [2, 3, 4] -> from index 2 (inclusive) to 5 (exclusive)
numbers[:3]   # [0, 1, 2] -> from the beginning
numbers[7:]   # [7, 8, 9] -> until the end
numbers[::2]  # [0, 2, 4, 6, 8] -> every other element
```

## Tuples: Immutable Lists

```python
coordinates = (48.8566, 2.3522)

coordinates[0]      # 48.8566
coordinates[0] = 0  # TypeError: a tuple cannot be modified after it has been created
```

A tuple is typically used to represent a fixed record (a pair of coordinates, an RGB point, etc.) rather than a collection that is intended to change over time.

### *Unpacking*

```python
latitude, longitude = coordinates
print(latitude)   # 48.8566

a, b, c = 1, 2, 3  # also works without explicit parentheses: an implicit tuple
a, b = b, a        # swap values, no temporary variable
```

## `sorted()`: sorting without modifying the original

```python
grades = [12, 5, 18, 9]

sorted(grades)  # [5, 9, 12, 18] -> NEW sorted list, grades stays unchanged
grades.sort()   # sorts IN PLACE, returns nothing (None), grades is modified
```

`sorted(iterable)` also works on strings: the sort is then **lexicographic** (character by character, like a dictionary), which also sorts fixed-length dates (`YYYY-MM-DD...`) chronologically, with no need to parse them:

```python
runs = ["2026-08-14_101530", "2026-08-06_090000", "2026-08-14_090000"]
sorted(runs)  # ["2026-08-06_090000", "2026-08-14_090000", "2026-08-14_101530"] -> chronological order, "for free"
```

> **Pitfall:** this lexicographic sort only works if all compared elements have the same length (e.g. always `YYYY-MM-DD`): `"9"` ranks AFTER `"10"` in a lexicographic sort (`"9" > "1"` character by character), unlike a numeric sort.

## List Comprehensions

A **list comprehension** creates a new list in a single expression, which is more concise and often faster than a traditional `for` loop with `.append()`:

```python
squares = [x ** 2 for x in range(5)]
# equivalent to:
squares = []
for x in range(5):
    squares.append(x ** 2)
```

With a filtering condition:

```python
pairs = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Note:** This approach remains readable for a simple, single-line transformation, but beyond that (multiple nested conditions, complex logic), a standard `for` loop is still easier to read and debug.

See also [Dictionaries and Sets](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) for the equivalent of comprehensions on these structures, and [Iterators and Generators](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) for the generator expression (a lazy variant of a list comprehension).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A list is mutable, a tuple is immutable: both ordered and heterogeneous. Slicing (`[start:stop:step]`) extracts a portion; a comprehension builds a list in a single expression. |
| **Tools you can use** | `append`/`insert`/`remove`/`pop`, the `*` operator to preallocate (`[0] * n`), slicing, unpacking, list comprehensions. |
| **Pitfalls to avoid** | Trying to modify a tuple after creation (`TypeError`): use a list if the content needs to change. `[[]] * n`, which repeats the same reference instead of creating `n` distinct lists. |
| **Best practices** | Use a tuple for a fixed record, a list for a collection meant to change; prefer `[[] for _ in range(n)]` over `[[]] * n` for independent sub-lists; reserve comprehensions for a simple transformation, a `for` loop beyond that. |
