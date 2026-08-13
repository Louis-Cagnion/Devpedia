---
order: 12
---

# Dataclasses

An [ordinary](/?c=langages-de-programmation&s=python&p=poo) class whose role is limited to grouping a few values (a point, a record, the result of a calculation) still forces you to write `__init__`, often `__repr__` and `__eq__`, by hand, for a purely mechanical result: copying each parameter into `self`, displaying the values, comparing field by field. The `@dataclass` decorator (`dataclasses` module, built in since Python 3.7) generates this code automatically from the fields' [type annotations](/?c=langages-de-programmation&s=python&p=typage-avec-annotations).

## Before/after: the same `Point` as in the OOP chapter

```python
# Classic version (see Object-Oriented Programming)
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
```

```python
# Dataclass version: equivalent, without writing __init__/__repr__/__eq__ by hand
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p1 = Point(1, 2)
p2 = Point(1, 2)

print(p1)        # Point(x=1, y=2)  -> __repr__ generated automatically
print(p1 == p2)  # True             -> __eq__ generated automatically, field-by-field comparison
```

Each line `x: int` declares both a field **and** its type: `@dataclass` reads these annotations to automatically build `__init__(self, x, y)`, in the order the fields are declared.

| Generated automatically | Role |
|---|---|
| `__init__` | One parameter per declared field, in order |
| `__repr__` | Readable display: `ClassName(field1=value1, field2=value2...)` |
| `__eq__` | Compares two instances field by field |

> **Note:** `@dataclass` does **not** generate `__lt__`/`__gt__` (order comparison, for sorting instances) by default: add `@dataclass(order=True)` if instances need to be sortable against each other (the comparison order then follows the fields', left to right).

## `frozen=True`: immutable instances

A very common use case: representing the frozen result of a calculation or an extraction (a record read from a file, a result row), which has no reason to change once created. `frozen=True` forbids any modification after construction:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class TextBlock:
    page: int
    text: str

block = TextBlock(page=1, text="Hello")
block.text = "Modified"   # FrozenInstanceError: cannot modify a field after creation
```

A `frozen=True` dataclass also becomes **hashable** (usable as a `dict` key or a `set` element) as soon as all its fields are themselves hashable, unlike an ordinary dataclass (mutable, and therefore not hashable by default): a direct consequence of the same principle behind why [a tuple is hashable but a list isn't](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles).

> **Pitfall:** `frozen=True` protects the fields themselves against reassignment, but not the **contents** of a mutable field. A `frozen` field that holds a list remains an ordinary list: its reference can't change, but its contents can.

```python
@dataclass(frozen=True)
class Group:
    members: list

g = Group(members=["Alice"])
g.members = ["Bob"]      # FrozenInstanceError: the field itself is protected
g.members.append("Bob")  # works with no error: the LIST itself is still mutable
```

> **Best practice:** for genuinely complete immutability, use types that are themselves immutable for the fields (a [tuple](/?c=langages-de-programmation&s=python&p=listes-et-tuples) rather than a list), not just `frozen=True` on the enclosing class.

## Default values: `field(default_factory=...)`

A dataclass is still subject to the same [mutable default value pitfall](/?c=langages-de-programmation&s=python&p=fonctions) as an ordinary function: `@dataclass` actually catches it right at class definition and refuses to start, rather than letting a silent bug slip in:

```python
from dataclasses import dataclass, field

@dataclass
class Cart:
    items: list = []   # ValueError raised at class definition: mutable list forbidden as a direct default

@dataclass
class Cart:
    items: list = field(default_factory=list)   # correct: a NEW list for each instance

c1 = Cart()
c2 = Cart()
c1.items.append("apple")
print(c2.items)   # [] -> properly independent from c1, unlike the function pitfall
```

`field(default_factory=function)` calls `function()` (here `list`, so `list()`) for each new instance rather than once at class definition: this is what prevents unintended sharing.

## When a dataclass is enough, when a classic class is needed

| | Dataclass | Classic class |
|---|---|---|
| Main role | Group data, with little to no logic of its own | Encapsulate rich behavior, invariants to enforce |
| `__init__`/`__repr__`/`__eq__` | Generated automatically | Written by hand (or explicitly customized) |
| Adding a method | Always possible, a dataclass remains an ordinary class | Normal use case |

A dataclass remains a full-fledged Python class: nothing prevents adding methods, `@property`, or having it inherit from another class, exactly as with a classically declared class.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `@dataclass` generates `__init__`/`__repr__`/`__eq__` from a class's annotated fields, avoiding this repetitive code for a class that just groups data together. `frozen=True` makes instances immutable (and hashable). |
| **Tools you can use** | `@dataclass`, `@dataclass(frozen=True)`, `@dataclass(order=True)` for sorting, `field(default_factory=...)` for a mutable default value. |
| **Pitfalls to avoid** | Thinking `frozen=True` also protects the contents of a mutable field (a list stays modifiable). Giving a list/dict directly as a field's default value. |
| **Best practices** | Use a type that's itself immutable (tuple) for genuinely complete freezing. Always go through `field(default_factory=...)` for a mutable default value. Reserve dataclasses for classes that mostly carry data. |
