---
order: 15
---

# Manipulating Files and Folders with `pathlib`

[Error handling](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) already opens a file with `open("data.txt")`, a plain path written as a string. The standard module **`pathlib`** represents a path as a genuine object, manipulable and portable across operating systems, without ever concatenating strings by hand.

## `pathlib.Path`: representing a path as an object

```python
from pathlib import Path

folder = Path("reports") / "2026" / "august.txt"  # "/" builds the path, PORTABLE (\ on Windows, / elsewhere)
print(folder)                                     # reports/2026/august.txt

folder.exists()   # True/False -> does the file/folder actually exist on disk?
folder.is_file()  # True/False
folder.is_dir()   # True/False
```

> **Note:** the `/` operator is overloaded here (see [Reflected methods](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` builds a NEW path by adding a segment, never touching the original path.

> **Equivalence:** a `Path` object also exposes `.open()` as a METHOD, strictly equivalent to the native `open()` function (same arguments: mode, `encoding`...): `folder.open("a", encoding="utf-8")` avoids going back through `open(str(folder), "a", encoding="utf-8")` once you already have a `Path` at hand.

## Breaking down a path: `.name`, `.stem`, `.suffix`

```python
report = Path("report.txt")

report.name    # "report.txt" -> full file name
report.stem    # "report"     -> name WITHOUT the extension
report.suffix  # ".txt"       -> the extension, with the dot

report.with_name("draft.txt")                             # Path("draft.txt") -> replaces the whole name
report.with_suffix(".csv")                                 # Path("report.csv") -> replaces just the extension
report.with_name(f"{report.stem}.peugeot{report.suffix}")   # Path("report.peugeot.txt") -> inserts a word in the middle
```

> **Pitfall:** `.with_name()` replaces the LAST segment of the path (the file name), unlike `/` which ADDS a new one: `Path("a/b") / "c"` gives `a/b/c`, `Path("a/b").with_name("c")` gives `a/c`.

## Removing a non-empty folder: `shutil.rmtree()`

```python
folder.rmdir()  # OSError if the folder isn't empty -> pathlib deliberately refuses to delete content

import shutil
shutil.rmtree(folder)                      # removes the folder AND all its content, recursively
shutil.rmtree(folder, ignore_errors=True)  # any error (locked file...) is ignored, silently
```

`shutil` ("shell utilities", standard module) provides higher-level file operations than `pathlib`. `shutil.rmtree()` is equivalent to `rm -rf` in [Bash](/?c=shells&s=bash&p=redirections-et-pipes) or `Remove-Item -Recurse` in [PowerShell](/?c=shells&s=powershell&p=powershell); `shutil.copy()`/`shutil.move()` cover copying and moving.

> **Pitfall:** `ignore_errors=True` makes a deletion failure completely silent: the folder can remain in place with no exception signaling it. Only use it if the caller then rechecks (e.g. `folder.exists()`) rather than assuming the deletion succeeded.

## Reading and writing a CSV file

```python
import csv

with open("contacts.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter=",")
    for row in reader:
        print(row)  # ["Jean", "Dupont", "25"] -> a plain LIST, by position
```

```python
with open("contacts.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=",")  # uses the first row as headers
    for row in reader:
        print(row)             # {"prenom": "Jean", "nom": "Dupont", "age": "25"} -> a DICT, by column name
        print(row["prenom"])   # "Jean" -> access by name, more readable than by index
```

`csv.reader` returns each row as a positional list; `csv.DictReader` turns each row into a dictionary based on the header row (see [hashability and dict keys](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), more readable and more robust to a column reordering. `delimiter=";"` (common in France) replaces the default comma. On writing, `csv.writer`/`csv.DictWriter` follow the same reverse logic.

> **Note:** `newline=""` in `open()` is recommended by the `csv` module's documentation: without it, line breaks in the middle of a quoted value can be misinterpreted depending on the operating system.

## Reading and writing JSON

A CSV structures data in a table (rows/columns); the standard module [`json`](https://docs.python.org/3/library/json.html) structures tree-shaped data (nested dicts and lists) as text, readable by any language, not just Python.

```python
import json

user = {"nom": "Léa", "notes": [15, 12, 18]}   # a plain Python dict

text = json.dumps(user, ensure_ascii=False)    # '{"nom": "Léa", "notes": [15, 12, 18]}' -> JSON text
obj = json.loads(text)                         # Python object, decoded back from the text (== user)
```

| Function | Input | Output |
|---|---|---|
| `json.dumps(obj)` | Python object (dict, list...) | JSON text (`str`) |
| `json.loads(text)` | JSON text (`str`) | Python object |
| `json.dump(obj, file)` | Python object + an already-open file | nothing: writes directly into `file` |
| `json.load(file)` | an already-open file | Python object, read directly |

> **Note:** without `ensure_ascii=False` (the default behavior), an accented character like "é" is escaped into an unreadable `\uXXXX` Unicode notation in the produced JSON text (`XXXX` being its hexadecimal code). `ensure_ascii=False` keeps it as-is; `json.loads()` decodes both forms identically.

### The "JSON Lines" format: adding entries without rewriting the whole file

A classic JSON file holds a single root object or array: adding an entry forces reading the whole file, modifying it in memory, then rewriting it entirely. The **JSON Lines** format (`.jsonl` extension) works around this: each LINE of the file is a complete, independent JSON object, handy for a file that grows over the course of a program's execution (e.g. tracking a task's progress).

```python
with open("states.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")   # ADDS a line, without touching the rest of the file
```

```python
with open("states.jsonl", encoding="utf-8") as f:
    for line in f:
        entry = json.loads(line)   # each line decodes independently of the others
        print(entry["id"])
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `pathlib.Path` represents a path as a manipulable object (`/` to build, `.stem`/`.suffix`/`.with_name()` to break it down, `.open()` equivalent to `open()`). `shutil.rmtree()` removes a non-empty folder, which `Path.rmdir()` refuses. `csv.DictReader` reads a CSV into dicts named by header, `csv.reader` into positional lists. `json.dumps`/`loads` convert a Python object and JSON text both ways; the JSON Lines format (one line = one object) lets you add entries without rewriting the whole file. |
| **Tools you can use** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`. |
| **Pitfalls to avoid** | `.with_name()` replaces the last segment of the path where `/` adds a new one. `shutil.rmtree(ignore_errors=True)` makes a failure silent. Forgetting `newline=""` with `csv` can break multi-line quoted values. Forgetting `ensure_ascii=False` makes accented characters unreadable in the produced JSON (without breaking `json.loads()`). |
| **Best practices** | Check `folder.exists()` after a `rmtree(ignore_errors=True)` rather than assuming success. Prefer `DictReader`/`DictWriter` over index access as soon as a CSV has headers. Use JSON Lines for a state file that grows over execution, a classic JSON file for a fixed object. |
