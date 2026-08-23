---
order: 12
---

# Modules, pip, and virtual environments

A Python project rarely stays in a single file for very long: this chapter covers how to organize code into multiple files (modules), install external libraries (`pip`), and isolate dependencies from one project to another (virtual environments).

## Import a module

```python
# calculations.py file
def addition(a, b):
    return a + b
```

```python
# main.py file
import calculs

print(calculs.addition(2, 3))   # 5, accessed via the module name

from calculs import addition     # imports the function directly, without a prefix
print(addition(2, 3))

import calculs as c               # renames the imported module
print(c.addition(2, 3))
```

## `if __name__ == "__main__":`

Every Python file has a special variable `__name__`: its value is `"__main__"` only if the file is **executed directly**, and the name of the module if it is **imported** from another file.

```python
# calculations.py
def addition(a, b):
    return a + b

if __name__ == "__main__":
    print("Quick test:", addition(2, 3))   # runs ONLY if you run "python calculs.py" directly
```

> **Note:** This safeguard allows a file to serve both as a reusable module (imported without executing anything unexpected) and as a standalone script (that can be tested directly), without these two uses interfering with each other.

## `pip`: Install external libraries

```bash
pip install requests          # installs a library
pip install requests==2.31.0  # installs a specific version
pip uninstall requests        # uninstalls
pip list                      # lists the installed libraries
```

## `requirements.txt`: Freeze a project's dependencies

```text
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # generates this file from the current environment
pip install -r requirements.txt  # reinstalls the exact same versions elsewhere
```

## Virtual Environments

Without isolation, `pip install` installs libraries **globally** on the machine: so two projects that require different versions of the same library will conflict. A **virtual environment** creates an isolated, project-specific Python installation:

```bash
python -m venv .venv          # creates a virtual environment in the .venv folder

source .venv/bin/activate  # activates the environment (Linux/macOS)
.venv\Scripts\activate     # activates the environment (Windows)

pip install requests       # installs ONLY in this environment, not globally

deactivate                 # exits the virtual environment
```

> **Note:** Once enabled, `pip install` and `python` point to the executables **in the virtual environment**, not those installed globally on the system: this is what ensures isolation. The `.venv/` folder must never be versioned with [Git](/?c=git&p=git) (see [The .gitignore file](/?c=git&p=gitignore)): it is fully regenerated from `requirements.txt`.

## Organizing a Project into a Package

```text
mon_projet/
├── mon_package/
│   ├── __init__.py     # makes the folder importable as a package
│   ├── calculs.py
│   └── utils.py
└── main.py
```

```python
from mon_package import calculs
from mon_package.utils import une_fonction
```

A simple `__init__.py` file (even an empty one) is all it takes to turn a folder into an importable **package**, grouping multiple modules under a single namespace.

> **Note:** Since Python 3.3, `__init__.py` is no longer required for a folder to be importable: without it, Python treats it as a **namespace package** ([PEP 420](https://peps.python.org/pep-0420/)). The difference is visible in practice: on a classic package (with `__init__.py`), `mon_package.__file__` points to that file; on a namespace package, `__file__` is `None` and `__path__` becomes a special object rather than a plain list. A folder without `__init__.py` therefore remains importable, but doesn't behave exactly like a classic package for any code that inspects these attributes.

## `pyproject.toml`: Modern packaging

`requirements.txt` freezes versions, but doesn't describe the project itself (its name, how to install it, its metadata): `pyproject.toml` centralizes this description in a standard format, recognized by modern packaging tools (`setuptools`, `poetry`...):

```toml
[project]
name = "mon-projet"
version = "0.1.0"
dependencies = ["requests==2.31.0"]

[tool.setuptools.packages.find]
where = ["."]
```

`[tool.setuptools.packages.find]` automatically detects classic packages (with `__init__.py`); a project relying on namespace packages must use `find_namespace_packages` instead, otherwise folders without `__init__.py` are silently ignored during installation.

```bash
pip install -e .   # "editable" install
```

An **editable** install (`pip install -e .`) installs the project without copying its files into the virtual environment: it instead creates a `.pth` file that points to the source folder. Modifying the source code takes effect immediately, with no reinstallation needed, which makes this command essential during active development of a library.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `import` loads a module; `if __name__ == "__main__":` distinguishes direct execution from import. `pip` installs libraries, a virtual environment isolates a project's dependencies. `pyproject.toml` describes the project itself, beyond just the versions frozen by `requirements.txt`. |
| **Tools you can use** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` for a classic package, `pyproject.toml` and `pip install -e .` for modern packaging. |
| **Pitfalls to avoid** | Installing libraries globally rather than in a virtual environment: version conflicts between projects. Forgetting `find_namespace_packages` for a project without `__init__.py`, which causes those folders to be silently ignored during installation. |
| **Best practices** | Always work in a virtual environment per project; version `requirements.txt`, never `.venv/`. Use `pip install -e .` during active development of a library. |
