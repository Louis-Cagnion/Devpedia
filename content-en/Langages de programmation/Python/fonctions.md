---
order: 6
---

# Functions

A Python function is declared using `def`. Functions are **first-class objects**: they can be stored in a variable, passed as arguments to another function, or returned by a function—just like any other value.

## Declaring and Calling a Function

```python
def addition(a, b):
    return a + b

result = addition(2, 3)   # 5
```

## Default Settings

```python
def saluer(name, message="Bonjour"):
    return f"{message} {name}"

saluer("Jean")               # "Hello, Jean"
saluer("Jean", "Salut")       # "Hi, Jean"
```

> **Common pitfall: Never use a mutable object (list, dict) as a default value.** The default value is evaluated **only once**, when the function is defined—not on every call:

```python
def ajouter_a_liste(element, list=[]):  # WARNING: This list is SHARED across all calls
    list.append(element)
    return list

ajouter_a_liste(1)   # [1]
ajouter_a_liste(2)   # [1, 2] -> not [2]! The same default list was reused
```

Best practice:

```python
def ajouter_a_liste(element, list=None):
    if list is None:
        list = []   # a NEW list, created with each call
    list.append(element)
    return list
```

## `*args` and `**kwargs`: a variable number of arguments

```python
def somme(*numbers):          # *args: groups any excess positional arguments into a tuple
    return sum(numbers)

somme(1, 2, 3, 4)   # 10

def afficher_infos(**options):  # **kwargs: groups excess named arguments into a dict**
    for key, value in options.items():
        print(f"{key} : {value}")

afficher_infos(name="Jean", age=25)
```

## Keyword-only arguments

A `*` alone in the signature forces everything that follows to be passed by name, never by position:

```python
def creer_utilisateur(name, *, email, actif=True):
    return {"nom": name, "email": email, "actif": actif}

creer_utilisateur("Jean", email="jean@exemple.com")   # OK
creer_utilisateur("Jean", "jean@exemple.com")           # TypeError: "email" must be named
```

## Lambda Functions

An anonymous function, limited to a single expression (no explicit `return`, no multi-line block):

```python
double = lambda x: x * 2
double(5)   # 10

# Typical use: as an argument to a function that expects a callback
numbers = [5, 2, 8, 1]
nombres_tries = sorted(numbers, key=lambda x: -x)  # descending order
```

## Closures and `nonlocal`

A nested function can read the variables of the enclosing function—to **modify** them, `nonlocal` is required:

```python
def counter():
    total = 0

    def incrementer():
        nonlocal total   # Without this, "total += 1" would create a new LOCAL variable to be incremented()
        total += 1
        return total

    return incrementer

compter = counter()
compter()   # 1
compter()   # 2 -> "total" was indeed preserved between calls
```

See also the chapter on decorators, which is directly based on this closure mechanism.
