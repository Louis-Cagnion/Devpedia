---
order: 8
---

# Iterators and Generators

An `for` loop works on lists, dictionaries, files, and many other objects—because they all implement the same **iteration protocol**. Understanding this protocol allows you to create your own “iterable” objects and use generators to process large amounts of data without loading everything into memory.

## The Iteration Protocol

`for element in object:` Here's how it actually works behind the scenes:

```python
iterateur = iter(object)       # calls object.__iter__()
while True:
    try:
        element = next(iterateur)  # calls iterator.__next__()
    except StopIteration:
        break
    # ... loop body with "element" ...
```

An object is **iterable** if it implements `__iter__()` (returns an iterator). An **iterator** implements `__next__()` (returns the next element, or raises `StopIteration` when there are no more elements).

## Create a custom iterator

```python
class Counter:
    def __init__(self, limite):
        self.limite = limite
        self.actuel = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actuel >= self.limite:
            raise StopIteration
        self.actuel += 1
        return self.actuel

for number in Counter(5):
    print(number)   # 1 2 3 4 5
```

## Generators: An Easier Way to Write an Iterator

A function containing `yield` automatically becomes a **generator**: Python implements the entire `__iter__` / `__next__` protocol described above for it, without requiring you to write a class.

```python
def counter(limite):
    actuel = 0
    while actuel < limite:
        actuel += 1
        yield actuel

for number in counter(5):
    print(number)   # 1 2 3 4 5
```

`yield` "pauses" the function and returns a value, **without losing its state**—the next time `next()` is called, execution resumes immediately after `yield`, with all local variables intact.

## Why use a generator instead of a list?

```python
def carres_liste(n):
    return [x ** 2 for x in range(n)]   # calculates and stores EVERYTHING in memory, all at once

def carres_generateur(n):
    for x in range(n):
        yield x ** 2                     # calculates ONLY ONE element at a time, on demand
```

For `n = 10_000_000`, `carres_liste()` allocates a list of 10 million elements in memory **before** beginning to use them. `carres_generateur()` produces only one element at a time, which is consumed and then discarded—the amount of memory used remains constant, regardless of the size of `n`.

> **Note:** This "lazy evaluation" comes at a cost: a generator can **only** be iterated **over once** (once it has been exhausted, a new loop `for` over it will not produce anything), unlike a list, which can be iterated over freely.

## Generating expression

Equivalent to a list comprehension, but lazy—replace the square brackets with parentheses:

```python
carres = (x ** 2 for x in range(10))   # generator; nothing has been calculated yet
liste_carres = [x ** 2 for x in range(10)]  # list—everything is calculated immediately

sum(x ** 2 for x in range(1000000))    # calculates the sum WITHOUT ever storing the 1 million values
```

See also the chapter on closures and on NumPy/pandas, where the distinction between immediate and lazy evaluation becomes central again at large scales.
