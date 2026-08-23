---
order: 11
---

# Typing with Annotations

Python remains **dynamically typed** even with type annotations: unlike [PHP](/?c=langages-de-programmation&s=php&p=php) (see the chapter on typed functions in PHP), where a declared type is checked and enforced **at runtime**, Python annotations are merely **optional** hints that are never checked by the interpreter itself.

## Commenting on Variables and Functions

```python
age: int = 25
name: str = "Jean"

def addition(a: int, b: int) -> int:
    return a + b

addition("deux", "trois")   # NO errors on startup: Python runs anyway, without checking the types
```

> **Note:** Unlike PHP, where `function f(int $x): int` raises a `TypeError` if anything other than an integer is passed, Python annotations are purely for human (or external tool) documentation: the interpreter never enforces them.

## Types defined using the `typing` module

```python
from typing import Optional, List, Dict, Union

def trouver_utilisateur(id: int) -> Optional[dict]:   # dict OR None
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def traiter_notes(notes: List[int]) -> float:          # list of integers
    return sum(notes) / len(notes)

def config() -> Dict[str, Union[str, int]]:            # a `dict` whose values are either `str` or `int`
    return {"nom": "app", "version": 2}
```

> **Note:** Starting with Python 3.9+, `list[int]` / `dict[str, int]` (native types directly, in lowercase) replace `List[int]` / `Dict[str, int]` from the `typing` module for these simple cases; `typing` is still required for constructs such as `Optional` / `Union`.

## `mypy` : Ensure that annotations are followed regardless

Since Python never enforces its own annotations, an external tool such as `mypy` analyzes the code **before** execution and flags type inconsistencies, much like a compiler would for a statically typed language:

```bash
pip install mypy
mypy mon_script.py
# my_script.py:5: error: Argument 1 to "addition" has an incompatible type "str"; expected "int"
```

## Why Annotate Anyway?

- Documentation that is directly readable within the code, without relying on comments that must be updated manually.
- Improved autocompletion and error detection in the editor ([VS Code](https://code.visualstudio.com), [PyCharm](https://www.jetbrains.com/pycharm/)...), even before launching `mypy` or the program.
- An essential foundation for large-scale Python projects, where the lack of type checking can make refactoring risky without this support.
