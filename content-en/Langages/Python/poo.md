---
order: 10
---

# Object-Oriented Programming

Python is an end-to-end object-oriented language: even a `int` or `str` is actually an object, an instance of a class. The syntax for custom classes resembles that of [PHP](/?c=langages-de-programmation&s=php&p=php), with one immediate difference: `self` (the equivalent of `$this`) is an **explicit** parameter of every method; it is never implicit.

## Declare a Class

```python
class Vehicule:
    def __init__(self, brand, model):
        self.brand = brand   # self.xxx: equivalent to $this->xxx in PHP
        self.model = model

    def description(self):
        return f"{self.brand} {self.model}"

v = Vehicule("Peugeot", "308")
print(v.description())   # "Peugeot 308"
```

> **Note:** `self` must be explicitly specified as **the first parameter** of each instance method; Python automatically sets it to the current instance at the time of the call (e.g., `v.description()` is equivalent to `Vehicule.description(v)`), but omitting it from the signature results in an error.

## Class Attributes vs. Instance Attributes

```python
class Counter:
    total_crees = 0   # CLASS attribute: shared by all instances

    def __init__(self):
        Counter.total_crees += 1
        self.id = Counter.total_crees   # INSTANCE attribute: specific to each object

c1 = Counter()
c2 = Counter()
print(Counter.total_crees)   # 2 -> shared
print(c1.id, c2.id)             # 1 2 -> unique to each person
```

## Reading an attribute by its name: `getattr()`

```python
u = Vehicule("Peugeot", "308")

u.brand                          # "Peugeot" -> the attribute name must be known when writing the code
getattr(u, "brand")               # "Peugeot" -> the same, but the name comes from a STRING, resolved at runtime
getattr(u, "color", None)         # None      -> fallback value if the attribute doesn't exist (like dict.get())
```

`getattr(object, name, default)` lets you apply the same treatment to a LIST of attribute names, computed at runtime (e.g. a loop variable), without writing an `if`/`elif` per attribute:

```python
for field in ["brand", "model"]:
    print(f"{field}: {getattr(u, field)}")
```

`setattr(object, name, value)` (writes an attribute by its name) and `hasattr(object, name)` (tests its existence, `True`/`False`) follow the same principle.

## The Legacy

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def parler(self):
        return "..."

class Chien(Animal):
    def parler(self):
        return f"{self.name} aboie"

class Chat(Animal):
    def parler(self):
        return f"{self.name} miaule"

animaux = [Chien("Rex"), Chat("Félix")]
for animal in animaux:
    print(animal.parler())
```

`super()` allows you to explicitly call the parent class's method, for example, to extend it rather than replace it entirely:

```python
class ChienDeGarde(Chien):
    def parler(self):
        return super().parler() + " bruyamment"
```

## Special methods (*dunder methods*)

Methods with names enclosed in double underscores, which are automatically called by Python in certain contexts:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # called by repr(obj) and displayed in the console/debugger
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # called by `print(obj)` and `str(obj)`
        return f"({self.x}, {self.y})"

    def __eq__(self, autre):       # called by "=="
        return self.x == autre.x and self.y == autre.y

    def __add__(self, autre):      # called by "+"
        return Point(self.x + autre.x, self.y + autre.y)

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)      # (4, 6) -> thanks to __add__
print(p1 == Point(1, 2))  # True -> thanks to __eq__
```

| Special Method | Triggered by |
|---|---|
| `__init__` | `NomClasse(...)` (manufacturer) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Console/debugger output, `repr(obj)` |
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

When `left + right` is evaluated, Python first tries `left.__add__(right)`. If that method doesn't exist or returns **`NotImplemented`** (a special value, not to be confused with the `NotImplementedError` exception), Python then tries the right-hand object's **reflected** method: `right.__radd__(left)`. Every special method has its reflected counterpart (`__radd__`, `__rsub__`, `__rtruediv__`...): this is the mechanism that lets `pathlib.Path` (see [Manipulating Files and Folders](/?c=langages-de-programmation&s=python&p=manipuler-des-fichiers-et-dossiers)) define `__rtruediv__`, so that `"folder" / path` works even with a plain string on the left.

## `@property` : a computed attribute accessed without parentheses

```python
class Cercle:
    def __init__(self, rayon):
        self.rayon = rayon

    @property
    def surface(self):
        return 3.14159 * self.rayon ** 2

c = Cercle(5)
print(c.surface)   # 78.53975 -> accessed as an attribute, NOT as c.surface()
```

`@property` Converts a method into a read-only attribute that is recalculated on each access, useful for exposing a derived value without requiring the caller to know that it is actually a calculation.
