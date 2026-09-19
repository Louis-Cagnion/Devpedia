---
order: 8
---

# Iterators and Generators

A `for` loop works on lists, dictionaries, files, and many other objects, because they all implement the same **iteration protocol**. Understanding this protocol lets you create your own "iterable" objects, and use generators to process large amounts of data without loading everything into memory.

## The iteration protocol

`for element in object:` actually works like this, behind the scenes:

```python
iterator = iter(object)       # calls object.__iter__()
while True:
    try:
        element = next(iterator)  # calls iterator.__next__()
    except StopIteration:
        break
    # ... loop body with "element" ...
```

An object is **iterable** if it implements `__iter__()` (returns an iterator). An **iterator** implements `__next__()` (returns the next element, or raises `StopIteration` when there are none left).

## Creating a custom iterator

```python
class Counter:
    def __init__(self, limit):
        self.limit = limit
        self.current = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.limit:
            raise StopIteration
        self.current += 1
        return self.current

for number in Counter(5):
    print(number)   # 1 2 3 4 5
```

## Generators: an easier way to write an iterator

A function containing `yield` automatically becomes a **generator**: Python implements the entire `__iter__`/`__next__` protocol seen above for it, with no need to write a class.

```python
def counter(limit):
    current = 0
    while current < limit:
        current += 1
        yield current

for number in counter(5):
    print(number)   # 1 2 3 4 5
```

`yield` "pauses" the function and returns a value, **without losing its state**: on the next call to `next()`, execution resumes right after the `yield`, with all local variables intact.

## Why use a generator instead of a list

```python
def squares_list(n):
    # calculates and stores EVERYTHING in memory, all at once
    return [x ** 2 for x in range(n)]

def squares_generator(n):
    for x in range(n):
        yield x ** 2                     # calculates ONE element at a time, on demand
```

For `n = 10_000_000`, `squares_list()` allocates a list of 10 million elements in memory **before** it starts using them. `squares_generator()` only produces one element at a time, consumed then discarded: the memory used stays constant, regardless of the size of `n`.

> **Note:** this "lazy evaluation" has a cost: a generator can only be iterated over **once** (once exhausted, a new `for` loop over it produces nothing more), unlike a list, which can be iterated over freely any number of times.

## Generator expression

Equivalent to a list comprehension, but lazy: replace the square brackets with parentheses:

```python
squares = (x ** 2 for x in range(10))        # generator, nothing has been calculated yet
squares_list = [x ** 2 for x in range(10)]   # list, everything is calculated immediately

sum(x ** 2 for x in range(1000000))    # calculates the sum WITHOUT ever storing the 1M values
```

See also [Functions](/?c=langages-de-programmation&s=python&p=fonctions) (closures) and [NumPy](/?c=data-science&p=numpy), where the immediate-vs-lazy memory distinction becomes central again at scale.

## `next()` with a default value: avoiding `StopIteration`

```python
iterator = iter([1, 2, 3])

next(iterator)              # 1
next(iterator)              # 2
next(iterator)              # 3
next(iterator)              # StopIteration: nothing left to produce

next(iterator, "exhausted")  # "exhausted" -> two-argument form: no exception once exhausted
```

`next(iterable, default)` returns `default` instead of raising `StopIteration` when the iterator has nothing left to produce. Combined with a filtered generator expression, this gives a concise way to retrieve the first element matching a condition, with a fallback value if none does:

```python
numbers = [1, 3, 5, 8, 9]

first_even = next((x for x in numbers if x % 2 == 0), None)
# 8 -> first matching even element

first_negative = next((x for x in numbers if x < 0), None)
# None -> no element matches, the fallback value is returned
```

> **Best practice:** prefer `next((x for x in coll if condition), default)` over a manual `for` loop with `break`, or over `[x for x in coll if condition][0]` (which builds the entire filtered list before keeping only the first element, and raises an `IndexError` if it's empty instead of returning a fallback value).

## Generator vs. thread: one flow at a time

A generator sometimes gives the impression of "doing two things at once" (the calling code, and the generator progressing in the background). That's misleading: unlike a thread (see [Threads (pthread)](/?c=langages-de-programmation&s=c&p=threads)), where two execution flows can genuinely advance in parallel without explicitly coordinating with each other, a generator never does anything "in the background."

`next()` is a function call like any other: it **blocks** the calling code until the generator reaches the next `yield` (or finishes). Only one of the two flows advances at any given moment, never both at the same time:

```python
def tasks():
    print("Starting")
    yield "A"
    print("Resuming after A")
    yield "B"

t = tasks()
print("Before the first next")
# "Starting" is printed HERE, at the moment of the call, not before, not in the background
print(next(t))
print("Before the second next")
print(next(t))     # "Resuming after A" is printed HERE, never in between
```

The print order is **entirely deterministic** and reproducible on every run, unlike two independent threads, whose relative execution order isn't predictable without explicit synchronization (mutex, `pthread_join`...). This is why we talk about a **coroutine** rather than parallelism to describe `yield`: the function "cooperates" with its caller by explicitly handing control back to it at every `yield`, instead of being forcibly interrupted by a scheduler the way a thread would be.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An iterable object implements `__iter__`, an iterator implements `__next__`. A function with `yield` becomes a generator: lazy, constant memory, but only iterable once. |
| **Available Tools** | `iter()`/`next()` (with or without a default value), `yield`, generator expression (`(x for x in ...)`). |
| **Pitfalls to Avoid** | Reusing an already-exhausted generator, expecting it to reproduce its values. Using `next()` with no default value when the iterator running out is a normal case, not an error. |
| **Best Practices** | Prefer a generator over a list as soon as the collection is large and iterated over just once, sequentially. `next((x for x in coll if condition), default)` to retrieve the first element matching a condition, with no loop or intermediate list. |
