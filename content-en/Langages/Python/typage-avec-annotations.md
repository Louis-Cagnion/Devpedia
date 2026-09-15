---
order: 11
---

# Typing with Annotations

Python remains **dynamically typed** even with type annotations: unlike [PHP](/?c=langages-de-programmation&s=php&p=php) (see [The most useful functions and methods](/?c=langages-de-programmation&s=php&p=methodes)), where a declared type is checked and enforced **at runtime**, Python annotations are merely **optional** hints that are never checked by the interpreter itself.

## Commenting on Variables and Functions

```python
age: int = 25
name: str = "John"

def addition(a: int, b: int) -> int:
    return a + b

addition("two", "three")   # NO errors on startup: Python runs anyway, without checking the types
```

> **Note:** Unlike PHP, where `function f(int $x): int` raises a `TypeError` if anything other than an integer is passed, Python annotations are purely for human (or external tool) documentation: the interpreter never enforces them.

## Types defined using the `typing` module

```python
from typing import Optional, List, Dict, Union

def find_user(id: int) -> Optional[dict]:         # dict OR None
    if id <= 0:
        return None
    return {"id": id, "name": "Smith"}

def process_grades(grades: List[int]) -> float:   # list of integers
    return sum(grades) / len(grades)

def config() -> Dict[str, Union[str, int]]:       # a `dict` whose values are either `str` or `int`
    return {"name": "app", "version": 2}
```

> **Note:** Starting with Python 3.9+, `list[int]` / `dict[str, int]` (native types directly, in lowercase) replace `List[int]` / `Dict[str, int]` from the `typing` module for these simple cases; `typing` is still required for constructs such as `Optional` / `Union`.

## Modern `X | None` Syntax (Python 3.10+)

Since Python 3.10 ([PEP 604](https://peps.python.org/pep-0604/)), the `|` operator between two types replaces `Optional` / `Union` from the `typing` module, directly on the types themselves, with no extra import:

```python
def find_user(id: int) -> dict | None:   # replaces Optional[dict]
    if id <= 0:
        return None
    return {"id": id, "name": "Smith"}

def config() -> dict[str, str | int]:    # replaces Dict[str, Union[str, int]]
    return {"name": "app", "version": 2}
```

| Old syntax (`typing`) | Modern syntax (3.10+) |
|---|---|
| `Optional[dict]` | `dict \| None` |
| `Union[str, int]` | `str \| int` |
| `Optional[Union[str, int]]` | `str \| int \| None` |

> **Note:** this syntax does not replace all of `typing`: constructs such as `Callable`, `TypeVar` or `Generic` are still needed. It only covers cases previously handled by `Optional` / `Union`.

## Forward References and `TYPE_CHECKING`

A **forward reference** is a type annotation written in quotes, referencing a type not yet defined at that point in the file (a class referencing itself, or an import that would create a cycle):

```python
class Node:
    def __init__(self, value: int, next: "Node | None" = None):
        self.value = value
        self.next = next   # "Node" does not exist yet while its own definition is still being read
```

> **Pitfall:** without the quotes (`next: Node | None`), Python raises an immediate `NameError` while reading the file: a function's annotations are evaluated as soon as it is defined, not just read by an external tool like `mypy`. The quotes turn it into plain text, resolved only when a tool actually needs it.

The `if TYPE_CHECKING:` block serves the same need across two files: importing a type only for the annotation, without causing a circular import when the program starts:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:   # never true at runtime: read only by mypy and editors
    from other_module import OtherClass

def process(obj: "OtherClass") -> None:
    ...
```

| | Regular `import` | `if TYPE_CHECKING:` |
|---|---|---|
| Executed when the program starts | Yes | No |
| Read by `mypy` / the editor | Yes | Yes |
| Risk of circular import | Yes, if the two files import each other | No |

## `mypy` : Ensure that annotations are followed regardless

Since Python never enforces its own annotations, an external tool such as `mypy` analyzes the code **before** execution and flags type inconsistencies, much like a compiler would for a statically typed language:

```bash
pip install mypy
mypy my_script.py
# my_script.py:5: error: Argument 1 to "addition" has an incompatible type "str"; expected "int"
```

## Why Annotate Anyway?

- Documentation that is directly readable within the code, without relying on comments that must be updated manually.
- Improved autocompletion and error detection in the editor ([VS Code](https://code.visualstudio.com), [PyCharm](https://www.jetbrains.com/pycharm/)...), even before launching `mypy` or the program.
- An essential foundation for large-scale Python projects, where the lack of type checking can make refactoring risky without this support.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Python type annotations (`x: int`, `-> str`) are purely documentary: never checked by the interpreter, unlike a statically typed language or even PHP. |
| **Usable tools** | The `typing` module (`Optional`, `Union`, `List`, `TYPE_CHECKING`...), the `X \| None` syntax (3.10+), `mypy` for external checking. |
| **Pitfalls to avoid** | Believing an annotation actually prevents passing a value of the wrong type: nothing prevents it at runtime. Forgetting the quotes on a forward reference (immediate `NameError`). |
| **Best practices** | Systematically annotate any project of significant size, and run `mypy` alongside it to catch inconsistencies before execution. Use `if TYPE_CHECKING:` to avoid a circular import caused by a single type annotation. |
