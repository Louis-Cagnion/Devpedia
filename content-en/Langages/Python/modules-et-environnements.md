---
order: 13
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
import calculations

print(calculations.addition(2, 3))   # 5, accessed via the module name

from calculations import addition     # imports the function directly, without a prefix
print(addition(2, 3))

import calculations as c               # renames the imported module
print(c.addition(2, 3))
```

## `if __name__ == "__main__":`

Every Python file has a special variable `__name__`: its value is `"__main__"` only if the file is **executed directly**, and the name of the module if it is **imported** from another file.

```python
# calculations.py
def addition(a, b):
    return a + b

if __name__ == "__main__":
    # runs ONLY if you run "python calculations.py" directly
    print("Quick test:", addition(2, 3))
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

## `os.environ`: the process's environment variables

> **Note:** not to be confused with the virtual environment seen just above: a virtual environment isolates installed **libraries**, whereas `os.environ` gives access to the system's **environment variables** (key/value pairs defined outside Python, e.g. `PATH`, a secret API key...) -- two distinct notions that only share the word "environment".

`os.environ` behaves like a [dictionary](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles): reading, writing, and deleting follow exactly the same rules.

```python
import os

os.environ["CONFIG_PATH"]                     # raises a KeyError if the variable doesn't exist
os.environ.get("CONFIG_PATH")                 # None if absent, no error
os.environ.get("CONFIG_PATH", "/etc/config")  # default value if absent

os.environ["NEW_VAR"] = "value"  # creates or modifies a variable
os.environ.pop("NEW_VAR", None)  # removes it with no error if already absent (unlike del)
```

> **Pitfall:** modifying `os.environ` only changes the current Python process, and child processes launched **afterward** (via [subprocess](/?c=langages-de-programmation&s=python&p=sous-processus-et-flux-standard)), which inherit a copy of the environment at the time they're created -- never the shell that launched the script, nor the rest of the system. Closing the script and reopening a terminal will therefore never show a variable added via `os.environ[...] = ...`.

## Organizing a Project into a Package

```text
my_project/
├── my_package/
│   ├── __init__.py     # makes the folder importable as a package
│   ├── calculations.py
│   └── utils.py
└── main.py
```

```python
from my_package import calculations
from my_package.utils import a_function
```

A simple `__init__.py` file (even an empty one) is all it takes to turn a folder into an importable **package**, grouping multiple modules under a single namespace.

> **Note:** Since Python 3.3, `__init__.py` is no longer required for a folder to be importable: without it, Python treats it as a **namespace package** ([PEP 420](https://peps.python.org/pep-0420/)). The difference is visible in practice: on a classic package (with `__init__.py`), `my_package.__file__` points to that file; on a namespace package, `__file__` is `None` and `__path__` becomes a special object rather than a plain list. A folder without `__init__.py` therefore remains importable, but doesn't behave exactly like a classic package for any code that inspects these attributes.

## `pyproject.toml`: Modern packaging

`requirements.txt` freezes versions, but doesn't describe the project itself (its name, how to install it, its metadata): `pyproject.toml` centralizes this description in a standard format, recognized by modern packaging tools (`setuptools`, `poetry`...):

```toml
[project]
name = "my-project"
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

## "Portable" Python (*embeddable*) and the `._pth` file

A classic Python installation automatically adds the launched script's folder to `sys.path` (the list of folders where `import` looks for a module). The **embeddable Python** distribution (a minimal ZIP distribution from [python.org](https://docs.python.org/3/using/windows.html#the-embeddable-package), requiring no administrator rights, used for example to ship a tool without depending on a system install) works differently:

```text
python-3.12.0-embed-amd64/
├── python.exe
├── python312.zip     # the standard library, compressed
├── python312._pth    # the FROZEN list of sys.path folders
└── my_script.py
```

```text
# python312._pth
python312.zip
.
#import site          # commented out: site-packages disabled, lighter install
```

The `._pth` file **freezes** `sys.path` entirely to this list: unlike a classic install, the launched script's folder is NOT added to it automatically.

```python
# my_script.py, located in the same folder
import sys
sys.path.insert(0, ".")  # without this, a sibling package not listed in ._pth stays unfindable

import my_package
```

> **Pitfall:** a project that runs fine with a classic Python install can fail with `ModuleNotFoundError` once deployed on an embeddable Python, for lack of this manual `sys.path.insert(0, ...)` before importing any sibling package.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `import` loads a module; `if __name__ == "__main__":` distinguishes direct execution from import. `pip` installs libraries, a virtual environment isolates a project's dependencies -- not to be confused with `os.environ`, which gives access to the system's environment variables. `pyproject.toml` describes the project itself, beyond just the versions frozen by `requirements.txt`. |
| **Tools you can use** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `os.environ` (reading/writing/deleting like a dict), `__init__.py` for a classic package, `pyproject.toml` and `pip install -e .` for modern packaging. |
| **Pitfalls to avoid** | Installing libraries globally rather than in a virtual environment: version conflicts between projects. Forgetting `find_namespace_packages` for a project without `__init__.py`, which causes those folders to be silently ignored during installation. Believing that modifying `os.environ` affects the parent shell or the system: it only affects the current process and its future children. |
| **Best practices** | Always work in a virtual environment per project; version `requirements.txt`, never `.venv/`. Use `pip install -e .` during active development of a library. |
