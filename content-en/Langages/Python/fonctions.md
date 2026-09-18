---
order: 6
---

# Functions

A Python function is declared using `def`. Functions are **first-class objects**: they can be stored in a variable, passed as arguments to another function, or returned by a function, just like any other value.

## Declaring and Calling a Function

```python
def addition(a, b):
    return a + b

result = addition(2, 3)   # 5
```

## Default Settings

```python
def greet(name, message="Hello"):
    return f"{message} {name}"

greet("John")            # "Hello John"
greet("John", "Hi")      # "Hi John"
```

> **Common pitfall: Never use a mutable object (list, dict) as a default value.** The default value is evaluated **only once**, when the function is defined, not on every call:

```python
def add_to_list(item, items=[]):  # WARNING: This list is SHARED across all calls
    items.append(item)
    return items

add_to_list(1)   # [1]
add_to_list(2)   # [1, 2] -> not [2]! The same default list was reused
```

Best practice:

```python
def add_to_list(item, items=None):
    if items is None:
        items = []   # a NEW list, created with each call
    items.append(item)
    return items
```

## `*args` and `**kwargs`: a variable number of arguments

```python
def total(*numbers):          # *args: groups any excess positional arguments into a tuple
    return sum(numbers)

total(1, 2, 3, 4)   # 10

def display_info(**options):  # **kwargs: groups excess named arguments into a dict
    for key, value in options.items():
        print(f"{key} : {value}")

display_info(name="John", age=25)
```

### Unpacking an existing dict in a call

`**` also works the other way around: spreading the keys/values of an ORDINARY dict (not necessarily named `kwargs`, nor collected via `**kwargs`) as named arguments of a call:

```python
def introduce(name, age):
    return f"{name} is {age} years old"

info = {"name": "Alice", "age": 30}
introduce(**info)              # equivalent to introduce(name="Alice", age=30)
```

Careful to distinguish: `**kwargs` in a function **definition** COLLECTS excess named arguments into a dict (seen above); `**my_dict` in a **call** does the opposite, it UNPACKS an existing dict to spread it as arguments.

## Keyword-only arguments

A `*` alone in the signature forces everything that follows to be passed by name, never by position:

```python
def create_user(name, *, email, active=True):
    return {"name": name, "email": email, "active": active}

create_user("John", email="john@example.com")   # OK
create_user("John", "john@example.com")         # TypeError: "email" must be named
```

## Lambda Functions

An anonymous function, limited to a single expression (no explicit `return`, no multi-line block):

```python
double = lambda x: x * 2
double(5)   # 10

# Typical use: as an argument to a function that expects a callback
numbers = [5, 2, 8, 1]
sorted_numbers = sorted(numbers, key=lambda x: -x)  # descending order
```

## Closures and `nonlocal`

A nested function can read the variables of the enclosing function; to **modify** them, `nonlocal` is required:

```python
def counter():
    total = 0

    def increment():
        nonlocal total   # Without this, "total += 1" would create a new LOCAL variable inside increment(), instead of modifying the enclosing one
        total += 1
        return total

    return increment

count = counter()
count()   # 1
count()   # 2 -> "total" was indeed preserved between calls
```

See also the chapter on decorators, which is directly based on this closure mechanism.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Python function is a first-class object (storable, passable as an argument). `*args`/`**kwargs` handle a variable number of arguments; a closure keeps access to its enclosing function's variables. |
| **Tools you can use** | Default parameters, keyword-only arguments (`*`), lambdas, `nonlocal`. |
| **Pitfalls to avoid** | Using a mutable object (list, dict) as a default value: it's shared across every call, not recreated each time. |
| **Best practices** | Use `None` as the default value for a mutable parameter, then create the real object inside the function. |
