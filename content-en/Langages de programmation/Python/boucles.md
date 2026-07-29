---
order: 3
---

# Loops

Python offers `for` and `while`, but the `for` loop works differently from PHP/C/JS: it always iterates directly over the elements of an iterable, never over a numeric counter that is manipulated manually.

## `for` Loop

```python
fruits = ["pomme", "banane", "cerise"]

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
noms = ["Jean", "Marie"]
ages = [25, 30]

for nom, age in zip(noms, ages):
    print(f"{nom} a {age} ans")
```

`zip()` stops as soon as the **shortest** collection is exhausted, even if the others still contain elements.

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

## The "`else`" clause in a loop—a Python feature

A loop such as ``for` / `while` can include a block `else`, which is executed only if the loop has completed **normally**, without `break``:

```python
nombres = [1, 3, 5, 7]

for n in nombres:
    if n % 2 == 0:
        print("Nombre pair trouvé")
        break
else:
    print("Aucun nombre pair dans la liste")  # executed only if no break has occurred
```

> **Note:** This construct often surprises developers coming from other languages (the `else` seems to be related to the `if` above, but it is actually related to the `for`). It avoids a common pattern where you would otherwise need a "flag" variable (set to `trouve = False`, changed to `True` in the `if`, and tested after the loop).

## No direct access to the index in a `for`

Unlike a C `for` loop (`for (int i = 0; i < taille; i++)`), the Python loop never explicitly manipulates an index—`enumerate()` is the idiomatic way to obtain one when necessary, rather than iterating over `range(len(liste))` and then manually indexing.
