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

> **Note:** Once enabled, `pip install` and `python` point to the executables **in the virtual environment**, not those installed globally on the system: this is what ensures isolation. The `.venv/` folder must never be versioned with Git (see [The .gitignore file](/?c=git&p=gitignore)): it is fully regenerated from `requirements.txt`.

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
