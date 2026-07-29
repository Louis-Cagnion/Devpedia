---
order: 10
---

# Object-Oriented Programming

Python is an end-to-end object-oriented language—even a `int` or `str` is actually an object, an instance of a class. The syntax for custom classes resembles that of PHP, with one immediate difference: `self` (the equivalent of `$this`) is an **explicit** parameter of every method; it is never implicit.

## Declare a Class

```python
class Vehicule:
    def __init__(self, marque, modele):
        self.marque = marque   # self.xxx: equivalent to $this->xxx in PHP
        self.modele = modele

    def description(self):
        return f"{self.marque} {self.modele}"

v = Vehicule("Peugeot", "308")
print(v.description())   # "Peugeot 308"
```

> **Note:** `self` must be explicitly specified as **the first parameter** of each instance method—Python automatically sets it to the current instance at the time of the call (e.g., `v.description()` is equivalent to `Vehicule.description(v)`), but omitting it from the signature results in an error.

## Class Attributes vs. Instance Attributes

```python
class Compteur:
    total_crees = 0   # CLASS attribute: shared by all instances

    def __init__(self):
        Compteur.total_crees += 1
        self.id = Compteur.total_crees   # INSTANCE attribute: specific to each object

c1 = Compteur()
c2 = Compteur()
print(Compteur.total_crees)   # 2 -> shared
print(c1.id, c2.id)             # 1 2 -> unique to each person
```

## The Legacy

```python
class Animal:
    def __init__(self, nom):
        self.nom = nom

    def parler(self):
        return "..."

class Chien(Animal):
    def parler(self):
        return f"{self.nom} aboie"

class Chat(Animal):
    def parler(self):
        return f"{self.nom} miaule"

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
| `__getitem__` | `obj[cle]` |

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

`@property` Converts a method into a read-only attribute that is recalculated on each access—useful for exposing a derived value without requiring the caller to know that it is actually a calculation.
