---
order: 15
---

# Manipulating Files and Folders with `pathlib`

[Error handling](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) already opens a file with `open("data.txt")`, a plain path written as a string. The standard module **`pathlib`** represents a path as a genuine object, manipulable and portable across operating systems, without ever concatenating strings by hand.

## `pathlib.Path`: representing a path as an object

```python
from pathlib import Path

# "/" builds the path, PORTABLE (\ on Windows, / elsewhere)
folder = Path("reports") / "2026" / "august.txt"
print(folder)                                     # reports/2026/august.txt

folder.exists()   # True/False -> does the file/folder actually exist on disk?
folder.is_file()  # True/False
folder.is_dir()   # True/False
```

> **Note:** the `/` operator is overloaded here (see [Reflected methods](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` builds a NEW path by adding a segment, never touching the original path.

> **Equivalence:** a `Path` object also exposes `.open()` as a METHOD, strictly equivalent to the native `open()` function (same arguments: mode, `encoding`...): `folder.open("a", encoding="utf-8")` avoids going back through `open(str(folder), "a", encoding="utf-8")` once you already have a `Path` at hand.

## Creating a folder: `.mkdir()`

```python
folder = Path("reports") / "2026"

# FileNotFoundError if "reports" doesn't exist yet (the parent)
folder.mkdir()
# also creates missing parents -> no more FileNotFoundError
folder.mkdir(parents=True)
# FileExistsError if the folder already exists (without parents=True)
folder.mkdir(exist_ok=True)
# both combined: NEVER complains, creates whatever is missing
folder.mkdir(parents=True, exist_ok=True)
```

`parents=True, exist_ok=True` is the idiomatic "create the folder if needed" pattern: it replaces an explicit `if not folder.exists(): folder.mkdir()` with a single line that never crashes, whether the folder already exists or not. Common usage: creating a file's parent folder right before opening it for writing.

```python
file_path = Path("reports") / "2026" / "august.txt"

# creates "reports/2026" before writing the file
file_path.parent.mkdir(parents=True, exist_ok=True)
with file_path.open("w", encoding="utf-8") as f:
    f.write("done")
```

> **Pitfall:** forgetting `exist_ok=True` crashes a script rerun on a folder already created on the first pass (`FileExistsError`), a frequent case for an output folder recreated on every run.

## Reading/writing a whole file in one line: `.write_text()`/`.read_text()`

```python
file_path.write_text("done", encoding="utf-8")
# equivalent to:
with file_path.open("w", encoding="utf-8") as f:
    f.write("done")

content = file_path.read_text(encoding="utf-8")
# equivalent to:
with file_path.open(encoding="utf-8") as f:
    content = f.read()
```

`write_text()`/`read_text()` open, write (or read) the entire content, then close the file, all in a single call, with no explicit `with` block: handy for a whole file processed at once, not line by line or as a stream.

> **Pitfall:** using `write_text()`/`read_text()` on a large file, or one meant to be processed line by line (see below): these methods load the entire content into memory at once, whereas a classic `with` block lets you iterate over lines without ever loading everything at the same time.

## Breaking down a path: `.name`, `.stem`, `.suffix`

```python
report = Path("report.txt")

report.name    # "report.txt" -> full file name
report.stem    # "report"     -> name WITHOUT the extension
report.suffix  # ".txt"       -> the extension, with the dot

# Path("draft.txt")  -> replaces the whole name
report.with_name("draft.txt")
# Path("report.csv") -> replaces just the extension
report.with_suffix(".csv")
# Path("report.peugeot.txt")  -> inserts a word in the middle
report.with_name(f"{report.stem}.peugeot{report.suffix}")
```

> **Pitfall:** `.with_name()` replaces the LAST segment of the path (the file name), unlike `/` which ADDS a new one: `Path("a/b") / "c"` gives `a/b/c`, `Path("a/b").with_name("c")` gives `a/c`.

## Deleting a File: `.unlink()`

```python
file_path.unlink()                 # FileNotFoundError if the file no longer exists
file_path.unlink(missing_ok=True)  # never complains, even if the file is already gone
```

`.unlink()` deletes a FILE, never a folder (see `.rmdir()`/`shutil.rmtree()` below for that). `missing_ok=True` avoids a `FileNotFoundError` if the file has already been deleted: the same "idempotent, never complains if the target state is already reached" logic as `exist_ok=True` on `.mkdir()`.

## Removing a non-empty folder: `shutil.rmtree()`

```python
# OSError if the folder isn't empty -> pathlib deliberately refuses to delete content
folder.rmdir()

import shutil
# removes the folder AND all its content, recursively
shutil.rmtree(folder)
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
        print(row)  # ["John", "Smith", "25"] -> a plain LIST, by position
```

```python
with open("contacts.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=",")  # uses the first row as headers
    for row in reader:
        # {"first_name": "John", "last_name": "Smith", "age": "25"} -> a DICT, by column name
        print(row)
        print(row["first_name"])   # "John" -> access by name, more readable than by index
```

`csv.reader` returns each row as a positional list; `csv.DictReader` turns each row into a dictionary based on the header row (see [hashability and dict keys](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), more readable and more robust to a column reordering. `delimiter=";"` (common in France) replaces the default comma. On writing, `csv.writer`/`csv.DictWriter` follow the same reverse logic.

> **Note:** `newline=""` in `open()` is recommended by the `csv` module's documentation: without it, line breaks in the middle of a quoted value can be misinterpreted depending on the operating system.

## Reading and writing JSON

A CSV structures data in a table (rows/columns); the standard module [`json`](https://docs.python.org/3/library/json.html) structures tree-shaped data (nested dicts and lists) as text, readable by any language, not just Python.

```python
import json

user = {"name": "Léa", "notes": [15, 12, 18]}   # a plain Python dict

# '{"name": "Léa", "notes": [15, 12, 18]}' -> JSON text
text = json.dumps(user, ensure_ascii=False)
# Python object, decoded back from the text (== user)
obj = json.loads(text)
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
    # ADDS a line, without touching the rest of the file
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")
```

```python
with open("states.jsonl", encoding="utf-8") as f:
    for line in f:
        entry = json.loads(line)   # each line decodes independently of the others
        print(entry["id"])
```

### Only reading what was added since the last read: `.seek()`/`.tell()`

A log file grows while another process keeps feeding it. Rereading it entirely at regular intervals just to extract the new lines wastes time on a file that keeps growing; remembering the position already read lets you reread only what has been written since.

```python
position = 0

def read_new_lines(path):
    global position
    with open(path, encoding="utf-8") as f:
        f.seek(position)              # resumes where the previous read stopped
        new_lines = f.readlines()
        position = f.tell()           # remembers the position reached, for the next call
    return new_lines
```

`.tell()` returns the read cursor's current position (in bytes from the start of the file); `.seek(position)` moves the cursor there before reading. By remembering `position` between calls, each pass rereads only the bytes written since the previous one, never the whole file.

> **Note:** this is the underlying mechanism behind `tail -f` in [Bash](/?c=shells&s=bash&p=redirections-et-pipes) or `Get-Content -Wait` in [PowerShell](/?c=shells&s=powershell&p=powershell): these commands follow a growing file themselves by only rereading its added content, never from the start.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `pathlib.Path` represents a path as a manipulable object (`/` to build, `.stem`/`.suffix`/`.with_name()` to break it down, `.open()` equivalent to `open()`, `.mkdir()` to create a folder). `shutil.rmtree()` removes a non-empty folder, which `Path.rmdir()` refuses. `csv.DictReader` reads a CSV into dicts named by header, `csv.reader` into positional lists. `json.dumps`/`loads` convert a Python object and JSON text both ways; the JSON Lines format (one line = one object) lets you add entries without rewriting the whole file. `.seek()`/`.tell()` let you reread only what a growing file received since the last read. |
| **Tools you can use** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`/`.mkdir()`/`.unlink()`, `.write_text()`/`.read_text()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`, `.seek()`/`.tell()`. |
| **Pitfalls to avoid** | `.with_name()` replaces the last segment of the path where `/` adds a new one. `.mkdir()` without `exist_ok=True` crashes if the folder already exists. `.write_text()`/`.read_text()` on a large file that should be processed line by line. `shutil.rmtree(ignore_errors=True)` makes a failure silent. Forgetting `newline=""` with `csv` can break multi-line quoted values. Forgetting `ensure_ascii=False` makes accented characters unreadable in the produced JSON (without breaking `json.loads()`). Rereading an entire log file on every pass instead of remembering the position already read. |
| **Best practices** | Use `folder.mkdir(parents=True, exist_ok=True)` (or `file_path.parent.mkdir(...)`) instead of an `if not folder.exists(): ...` before writing a file. Check `folder.exists()` after a `rmtree(ignore_errors=True)` rather than assuming success. Prefer `DictReader`/`DictWriter` over index access as soon as a CSV has headers. Use JSON Lines for a state file that grows over execution, a classic JSON file for a fixed object. Remember the position (`.tell()`) after each read of a growing file, to move the cursor back there (`.seek()`) on the next pass. |
