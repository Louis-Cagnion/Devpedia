---
order: 9
---

# Decorators

A **decorator** wraps one function inside another to add behavior (timing, logging, permission checks, etc.) without modifying its code: this mechanism relies directly on first-class functions and closures (see the chapter on functions).

## The principle, without the syntactic sugar

```python
def mon_decorateur(fonction):
    def enveloppe(*args, **kwargs):
        print("Avant l'appel")
        result = fonction(*args, **kwargs)
        print("Après l'appel")
        return result
    return enveloppe

def dire_bonjour(name):
    print(f"Bonjour {name}")

dire_bonjour = mon_decorateur(dire_bonjour)   # replaces the function with its wrapped version
dire_bonjour("Jean")
# Before the call
# Hello, Jean
# After the call
```

## The syntax`@`

`@mon_decorateur` "above a function" is simply a shorthand for "`fonction = mon_decorateur(fonction)`":

```python
@mon_decorateur
def dire_bonjour(name):
    print(f"Bonjour {name}")

dire_bonjour("Jean")   # exactly the same result as in the previous example
```

## Practical example: timing a function

```python
import time

def chronometrer(fonction):
    def enveloppe(*args, **kwargs):
        debut = time.time()
        result = fonction(*args, **kwargs)
        duree = time.time() - debut
        print(f"{fonction.__name__} a pris {duree:.4f}s")
        return result
    return enveloppe

@chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

calcul_long()   # calcul_long took 0.0834 seconds
```

## Preserving Metadata with `functools.wraps`

Without taking precautions, the decorated function "loses" its original name and documentation, which are replaced by those of the wrapper function:

```python
print(calcul_long.__name__)   # "envelope" -> not very useful for debugging
```

```python
from functools import wraps

def chronometrer(fonction):
    @wraps(fonction)   # preserves __name__, __doc__... from the original function
    def enveloppe(*args, **kwargs):
        # ... the same logic as before ...
        return fonction(*args, **kwargs)
    return enveloppe

@chronometrer   # redecorated with this new version of Chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(calcul_long.__name__)   # "calcul_long" -> corrected
```

> **Note:** Redefining `chronometrer` does not retroactively change a function that has already been decorated with its old version: `calcul_long` must be redecorated here for `@wraps` to actually take effect.

## An interior designer with his own ideas

To configure a decorator (e.g., `@repeter(3)` instead of `@repeter`), an additional level of nesting is required:

```python
def repeter(nombre_de_fois):
    def decorateur(fonction):
        def enveloppe(*args, **kwargs):
            for _ in range(nombre_de_fois):
                result = fonction(*args, **kwargs)
            return result
        return enveloppe
    return decorateur

@repeter(3)
def saluer():
    print("Bonjour !")

saluer()   # displays "Hello!" three times
```

`repeter(3)` First returns `decorateur` (a function that takes a function), which is then applied to `saluer`, hence the three levels of nested functions.

## Common decorators in the standard library

| Interior Designer | Role |
|---|---|
| `@property` | Converts a method into a calculated property (see the chapter on OOP) |
| `@staticmethod` | A method that requires neither `self` nor the class |
| `@classmethod` | A method that takes the class itself (`cls`) rather than an instance |
| `@functools.lru_cache` | Automatically caches the result of a function for arguments that have already been encountered |
