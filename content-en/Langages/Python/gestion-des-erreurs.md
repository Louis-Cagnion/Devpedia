---
order: 7
---

# Error Handling

Python signals an error by raising an **exception**, which interrupts the program's normal execution unless it is caught by a block `try` / `except`, a mechanism similar to modern [PHP](/?c=langages-de-programmation&s=php&p=php) exceptions (`throw` / `catch`).

## `try` / `except`

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
```

## Catching Multiple Types of Exceptions

```python
try:
    number = int(input("Enter a number: "))
    result = 10 / number
except ValueError:
    print("That is not a valid number")
except ZeroDivisionError:
    print("Cannot divide by zero")
except Exception as error:   # "catch everything else" -> place this LAST
    print(f"Unexpected error: {error}")
```

> **Note:** Intercepting `Exception` too broadly (or worse, a bare, untyped `except:`) hides programming errors that should instead cause the program to crash so they can be corrected: this should be reserved for cases where a failure is truly expected and is already handled immediately afterward.

## `else` and `finally`

```python
try:
    file = open("data.txt")
except FileNotFoundError:
    print("File not found")
else:
    print("File opened successfully")    # executed ONLY if no exception has occurred
    file.close()
finally:
    print("Attempt finished")            # executed IN ALL CASES, whether there is an exception or not
```

`finally` is typically used to release a resource (close a file, a connection, etc.) regardless of whether an error occurred.

## The modes of `open()`

`open(path)` (seen above) opens in **read** mode by default. A second argument specifies the opening mode:

| Mode | Means | If the file already exists |
|---|---|---|
| `"r"` | Read (default) | Reads its content |
| `"w"` | Write | **OVERWRITES** all existing content |
| `"a"` | Append | Writes to the END, without erasing anything |
| `"x"` | Exclusive creation | Fails with `FileExistsError` |

```python
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("New line\n")   # added at the end, previous content stays intact
```

> **Pitfall:** confusing `"w"` and `"a"` silently loses a file's existing content (`"w"` overwrites it upon opening, even before writing anything). Reserve `"w"` for a file you deliberately want to replace.

> **Note:** a file opened with `"a"` meant to stay open for a program's whole lifetime (e.g. a log file) usually skips `with`, since the resource must NOT be released after a single block: `with` remains preferable in every other case.

## Throwing Your Own Exceptions

```python
def calculate_age(birth_year):
    if birth_year > 2026:
        raise ValueError("Birth year cannot be in the future")
    return 2026 - birth_year
```

## Create a custom exception

```python
class InsufficientBalanceError(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientBalanceError(f"Balance of {balance}€ insufficient to withdraw {amount}€")
    return balance - amount

try:
    withdraw(100, 150)
except InsufficientBalanceError as error:
    print(error)
```

A custom exception inherits from `Exception` (or a more specific subclass), which allows it to be distinguished from others in a targeted `except`, rather than relying on a generic error message.

## Chaining an Exception with `raise ... from`

When a function catches a technical exception and raises a different, more meaningful one for the caller (a "business" error), `raise ... from` keeps a trace of the original cause:

```python
class ConfigurationError(Exception):
    pass

def load_configuration(path):
    try:
        with open(path) as file:
            return file.read()
    except FileNotFoundError as error:
        raise ConfigurationError(f"Configuration not found: {path}") from error

try:
    load_configuration("config.ini")
except ConfigurationError as error:
    print(error)              # business message, readable by the caller
    print(error.__cause__)    # original FileNotFoundError, still accessible
```

The caller can catch only `ConfigurationError` (without knowing about `FileNotFoundError`), while still keeping, via `__cause__`, the full technical exception for debugging.

| Form | What is kept | Message shown in the traceback |
|---|---|---|
| `raise New(...)` (no `from`, inside an `except`) | Implicit chaining (`__context__`) | "During handling of the above exception, another exception occurred" |
| `raise New(...) from error` | Explicit chaining (`__cause__`) | "The above exception was the direct cause of the following exception" |
| `raise New(...) from None` | Nothing: the original cause is erased | No trace of the original exception |

> **Pitfall:** `raise ... from None` removes the original exception from the traceback, including in logs. Reserve it for cases where the technical detail truly adds nothing for the caller; when in doubt, keep `from error` rather than cutting the trace.

## `with` Context Manager

`with` ensures that a resource is properly released, **even if an exception occurs**; a file opened with `with` always closes automatically when the block ends:

```python
with open("data.txt") as file:
    content = file.read()
# file.close() is called automatically here, regardless of whether everything went well or not
```

> **Note:** This relies on the special methods `__enter__` and `__exit__` (see [Object-Oriented Programming](/?c=langages-de-programmation&s=python&p=poo)): any custom class can define these two methods to be used with `with` (e.g., to manage opening and closing a network or database connection).

---

## 📋 Summary

| | |
|---|---|
| **To remember** | `try`/`except`/`else`/`finally` structures error handling. `with` guarantees a resource is released even if an exception occurs, via `__enter__`/`__exit__`. |
| **Usable tools** | Custom exceptions (inherit from `Exception`), `with`, `raise`. |
| **Pitfalls to avoid** | Catching `Exception` (or a bare `except:`) too broadly: hides programming errors that should instead crash the program so they can be fixed. |
| **Best practices** | Catch the most precise exception type possible; use `with` for any resource that must be closed/released; chain with `raise ... from error` to turn a technical error into a business error without losing the original cause. |
