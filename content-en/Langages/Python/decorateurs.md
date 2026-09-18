---
order: 9
---

# Decorators

A **decorator** wraps a function inside another one, to add behavior to it (timing, logging, permission checks...) without modifying its code; this mechanism relies directly on first-class functions and closures (see [Functions](/?c=langages&s=python&p=fonctions)).

## The principle, without the syntactic sugar

```python
def my_decorator(function):
    def wrapper(*args, **kwargs):
        print("Before the call")
        result = function(*args, **kwargs)
        print("After the call")
        return result
    return wrapper

def say_hello(name):
    print(f"Hello {name}")

say_hello = my_decorator(say_hello)   # replaces the function with its wrapped version
say_hello("John")
# Before the call
# Hello John
# After the call
```

## The `@` syntax

`@my_decorator` above a function is simply shorthand for `function = my_decorator(function)`:

```python
@my_decorator
def say_hello(name):
    print(f"Hello {name}")

say_hello("John")   # exactly the same result as the previous example
```

## Practical example: timing a function

```python
import time

def time_it(function):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = function(*args, **kwargs)
        duration = time.time() - start
        print(f"{function.__name__} took {duration:.4f}s")
        return result
    return wrapper

@time_it
def long_computation():
    total = sum(x ** 2 for x in range(1000000))
    return total

long_computation()   # long_computation took 0.0834s
```

## Preserving metadata with `functools.wraps`

Without precaution, the decorated function "loses" its original name and docstring, replaced by the wrapper function's:

```python
print(long_computation.__name__)   # "wrapper" -> not very useful for debugging
```

```python
from functools import wraps

def time_it(function):
    @wraps(function)   # preserves __name__, __doc__... of the original function
    def wrapper(*args, **kwargs):
        # ... same logic as before ...
        return function(*args, **kwargs)
    return wrapper

@time_it   # re-decorated with this new version of time_it
def long_computation():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(long_computation.__name__)   # "long_computation" -> fixed
```

> **Note:** redefining `time_it` doesn't retroactively change a function already decorated by its old version: `long_computation` has to be re-decorated here for `@wraps` to actually apply.

## A decorator with its own arguments

To parameterize a decorator (e.g. `@repeat(3)` rather than `@repeat`), one extra level of nesting is needed:

```python
def repeat(number_of_times):
    def decorator(function):
        def wrapper(*args, **kwargs):
            for _ in range(number_of_times):
                result = function(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet():
    print("Hello!")

greet()   # displays "Hello!" three times
```

`repeat(3)` first returns `decorator` (a function that takes a function), which is then applied to `greet`, hence the three levels of nested functions.

## Common decorators from the standard library

| Decorator | Role |
|---|---|
| `@property` | Turns a method into a computed attribute (see [Object-oriented programming](/?c=langages&s=python&p=poo)) |
| `@staticmethod` | A method that needs neither `self` nor the class |
| `@classmethod` | A method that receives the class itself (`cls`) rather than an instance |
| `@functools.lru_cache` | Automatically caches a function's result for arguments already seen |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A decorator (`@name`) wraps a function to add behavior without modifying its code: `@decorator def f()` is equivalent to `f = decorator(f)`. |
| **Tools you can use** | `functools.wraps` (preserves metadata), `@property`/`@staticmethod`/`@classmethod`, `@functools.lru_cache`. |
| **Pitfalls to avoid** | Forgetting `@wraps`: the decorated function loses its original `__name__`/`__doc__`, which complicates debugging. |
| **Best practices** | Always use `@wraps(function)` in a custom decorator's wrapper function. |
