---
order: 3
---

# Loops

Python offers `for` and `while`, but the `for` loop works differently from [PHP](/?c=langages-de-programmation&s=php&p=php)/[C](/?c=langages-de-programmation&s=c&p=c)/JS: it always iterates directly over the elements of an iterable, never over a numeric counter that is manipulated manually.

## `for` Loop

```python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)
```

To generate a standard digital counter, `range()` generates a sequence of numbers:

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # from 2 to 10 (excluded), in increments of 2 -> 2, 4, 6, 8
    print(i)
```

### Iterating in Reverse

```python
for fruit in reversed(fruits):            # cherry, banana, apple -> VALUES in reverse
    print(fruit)

for i in range(len(fruits) - 1, -1, -1):  # 2, 1, 0               -> INDICES in decreasing order
    print(fruits[i])
```

`range(len(x) - 1, -1, -1)` (step of -1) generates the indices of a sequence in decreasing order: useful when the index itself is needed, not just the value. If only the value matters, `reversed(x)` is the more readable idiom to prefer.

## `enumerate()` : Get the index AND the value

```python
for index, fruit in enumerate(fruits):
    print(f"{index} : {fruit}")
# 0: apple
# 1: banana
# 2: cherry
```

## `zip()` : Browse multiple collections at the same time

```python
names = ["John", "Mary"]
ages = [25, 30]

for name, age in zip(names, ages):
    print(f"{name} is {age} years old")
```

`zip()` stops as soon as the **shortest** collection is exhausted, even if the others still contain elements.

## `any()` / `all()`: testing a condition across an entire iterable

```python
ages = [16, 20, 15, 30]

any(age >= 18 for age in ages)  # True  -> AT LEAST ONE element satisfies the condition
all(age >= 18 for age in ages)  # False -> it would take EVERY element to satisfy it
```

`any(iterable)` returns `True` as soon as one element is true, without necessarily going through the rest (short-circuit, like `or`); `all(iterable)` returns `True` only if all of them are, and stops at the first false one (like `and`). Both are typically used directly on a [generator expression](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) (without building an intermediate list), which avoids scanning the whole collection if the answer is already known.

> **Pitfall:** on an EMPTY iterable, the results often surprise: `any([])` is `False` (no true element found), `all([])` is `True` (vacuous truth: "all" of the zero elements do satisfy the condition, since none of them contradicts it).

## `max()` / `min()`: Finding the Largest or Smallest

```python
widths = [12, 45, 3, 28]

max(widths)         # 45
min(widths)         # 3
max(12, 45, 3, 28)  # 45 -> also works on separate values, not just an iterable

max([], default=0)  # 0 -> avoids a ValueError if the iterable is empty
```

`max(iterable)`/`min(iterable)` accept either several separate values or a single iterable; without the `default=` parameter, either one raises a `ValueError` on an empty iterable, which matters as soon as the collection can legitimately be empty (e.g. the maximum width of a list of lines that may contain no cell).

## `while` Loop

```python
i = 0

while i < 5:
    print(i)
    i += 1   # Python does not have an i++ or ++i operator: you must write i += 1
```

## `break` and `continue`

As in most languages:

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## The "`else`" clause in a loop (a Python feature)

A loop such as ``for` / `while` can include a block `else`, which is executed only if the loop has completed **normally**, without `break``:

```python
numbers = [1, 3, 5, 7]

for n in numbers:
    if n % 2 == 0:
        print("Even number found")
        break
else:
    print("No even number in the list")  # executed only if no break has occurred
```

> **Note:** This construct often surprises developers coming from other languages (the `else` seems to be related to the `if` above, but it is actually related to the `for`). It avoids a common pattern where you would otherwise need a "flag" variable (set to `found = False`, changed to `True` in the `if`, and tested after the loop).

## No direct access to the index in a `for`

Unlike a C `for` loop (`for (int i = 0; i < size; i++)`), the Python loop never explicitly manipulates an index; `enumerate()` is the idiomatic way to obtain one when necessary, rather than iterating over `range(len(list))` and then manually indexing.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `for` iterates directly over the elements of an iterable (never a manual counter); `range()` generates a sequence of numbers when needed. `enumerate()`/`zip()` cover index and parallel iteration needs. `any()`/`all()` test a condition across an entire iterable. |
| **Tools you can use** | `enumerate()`, `zip()`, `any()`/`all()`, `reversed()` to iterate in reverse, a loop's `else` clause (executed if no `break`). |
| **Pitfalls to avoid** | Iterating over `range(len(list))` and then indexing manually, instead of using `for element in list` or `enumerate()` directly. |
| **Best practices** | Use `enumerate()` as soon as an index is needed alongside the value, rather than managing it manually. |
