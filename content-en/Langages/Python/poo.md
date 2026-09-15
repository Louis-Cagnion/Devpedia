---
order: 10
---

# Object-Oriented Programming

Python is an object-oriented language end to end: even an `int` or a `str` is actually an object, an instance of a class. The syntax for custom classes resembles [PHP](/?c=langages&s=php&p=php)'s, with one immediate difference: `self` (the equivalent of `$this`) is an **explicit** parameter of every method, never implicit.

## Declaring a class

```python
class Vehicle:
    def __init__(self, brand, model):
        self.brand = brand   # self.xxx: equivalent to $this->xxx in PHP
        self.model = model

    def description(self):
        return f"{self.brand} {self.model}"

v = Vehicle("Peugeot", "308")
print(v.description())   # "Peugeot 308"
```

> **Note:** `self` must be explicitly written as the **first parameter** of every instance method: Python fills it in automatically with the current instance at call time (`v.description()` is equivalent to `Vehicle.description(v)`), but omitting it from the signature causes an error.

## Class attributes vs. instance attributes

```python
class Counter:
    total_created = 0   # CLASS attribute: shared by every instance

    def __init__(self):
        Counter.total_created += 1
        self.id = Counter.total_created   # INSTANCE attribute: specific to each object

c1 = Counter()
c2 = Counter()
print(Counter.total_created)   # 2 -> shared
print(c1.id, c2.id)            # 1 2 -> specific to each one
```

## Reading an attribute by its name: `getattr()`

```python
u = Vehicle("Peugeot", "308")

u.brand                        # "Peugeot" -> the attribute name must be known when writing the code
getattr(u, "brand")            # "Peugeot" -> the same, but the name comes from a STRING, resolved at runtime
getattr(u, "color", None)      # None      -> fallback value if the attribute doesn't exist (like dict.get())
```

`getattr(object, name, default)` lets you apply the same treatment to a LIST of attribute names, computed at runtime (e.g. a loop variable), without writing an `if`/`elif` per attribute:

```python
for field in ["brand", "model"]:
    print(f"{field}: {getattr(u, field)}")
```

`setattr(object, name, value)` (writes an attribute by its name) and `hasattr(object, name)` (tests its existence, `True`/`False`) follow the same principle.

## Inheritance

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return f"{self.name} barks"

class Cat(Animal):
    def speak(self):
        return f"{self.name} meows"

animals = [Dog("Rex"), Cat("Felix")]
for animal in animals:
    print(animal.speak())
```

`super()` lets you explicitly call the parent class's method, for example to extend it rather than replace it entirely:

```python
class GuardDog(Dog):
    def speak(self):
        return super().speak() + " loudly"
```

## Special methods (*dunder methods*)

Methods whose name is wrapped in double underscores, automatically called by Python in certain contexts:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # called by repr(obj) and console/debugger display
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # called by print(obj) and str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, other):       # called by "=="
        return self.x == other.x and self.y == other.y

    def __add__(self, other):      # called by "+"
        return Point(self.x + other.x, self.y + other.y)

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)            # (4, 6) -> thanks to __add__
print(p1 == Point(1, 2))  # True -> thanks to __eq__
```

| Special method | Triggered by |
|---|---|
| `__init__` | `ClassName(...)` (constructor) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Console/debugger display, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[key]` |

### Reflected methods (`__radd__`...) and `NotImplemented`

```python
class Distance:
    def __init__(self, meters):
        self.meters = meters

    def __add__(self, other):     # called when Distance is the LEFT operand: d + 5
        if isinstance(other, (int, float)):
            return Distance(self.meters + other)
        return NotImplemented     # "I don't know how to handle this type" -> Python tries another method

    def __radd__(self, other):    # called when Distance is the RIGHT operand: 5 + d
        return self.__add__(other)

d = Distance(100)
d + 5  # Distance(105) -> via __add__
5 + d  # Distance(105) -> via __radd__, because int.__add__(5, d) fails and returns NotImplemented
```

When `left + right` is evaluated, Python first tries `left.__add__(right)`. If that method doesn't exist or returns **`NotImplemented`** (a special value, not to be confused with the `NotImplementedError` exception), Python then tries the right-hand object's **reflected** method: `right.__radd__(left)`. Every special method has its reflected counterpart (`__radd__`, `__rsub__`, `__rtruediv__`...): this mechanism is, for example, what lets `pathlib.Path` (see [Working with files and folders](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)) define `__rtruediv__`, so that `"folder" / path` works even with a plain string on the left.

## `@property`: a computed attribute, accessed without parentheses

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        return 3.14159 * self.radius ** 2

c = Circle(5)
print(c.area)   # 78.53975 -> accessed as an attribute, NOT as c.area()
```

`@property` turns a method into a read-only attribute, recomputed on every access, useful for exposing a derived value without requiring the caller to know it's actually a computation.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | In Python, everything is an object. `self` is an explicit parameter of every method. Special methods (`__init__`, `__str__`, `__eq__`...) define how an object reacts to native operations (`+`, `==`, `print`...). |
| **Tools you can use** | `super()` to call the parent method, `@property` for a computed attribute, class attributes vs. instance attributes. |
| **Pitfalls to avoid** | Forgetting `self` as an instance method's first parameter: causes an error when called. |
| **Best practices** | Define `__repr__` on any class meant to be displayed for debugging, for a readable representation rather than the default memory address. |
