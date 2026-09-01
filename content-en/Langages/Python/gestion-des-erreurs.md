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
    print("Impossible de diviser par zéro")
```

## Catching Multiple Types of Exceptions

```python
try:
    number = int(input("Entrez un nombre : "))
    result = 10 / number
except ValueError:
    print("Ce n'est pas un nombre valide")
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
except Exception as error:   # "catch everything else" -> place this LAST
    print(f"Erreur inattendue : {error}")
```

> **Note:** Intercepting `Exception` too broadly (or worse, a bare, untyped `except:`) hides programming errors that should instead cause the program to crash so they can be corrected: this should be reserved for cases where a failure is truly expected and is already handled immediately afterward.

## `else` and `finally`

```python
try:
    file = open("donnees.txt")
except FileNotFoundError:
    print("Fichier introuvable")
else:
    print("Fichier ouvert avec succès")   # executed ONLY if no exception has occurred
    file.close()
finally:
    print("Tentative terminée")            # executed IN ALL CASES, whether there is an exception or not
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
def calculer_age(annee_naissance):
    if annee_naissance > 2026:
        raise ValueError("L'année de naissance ne peut pas être dans le futur")
    return 2026 - annee_naissance
```

## Create a custom exception

```python
class SoldeInsuffisantError(Exception):
    pass

def retirer(balance, montant):
    if montant > balance:
        raise SoldeInsuffisantError(f"Solde de {balance}€ insuffisant pour retirer {montant}€")
    return balance - montant

try:
    retirer(100, 150)
except SoldeInsuffisantError as error:
    print(error)
```

A custom exception inherits from `Exception` (or a more specific subclass), which allows it to be distinguished from others in a targeted `except`, rather than relying on a generic error message.

## `with` Context Manager

`with` ensures that a resource is properly released, **even if an exception occurs**; a file opened with `with` always closes automatically when the block ends:

```python
with open("donnees.txt") as file:
    content = file.read()
# file.close() is called automatically here, regardless of whether everything went well or not
```

> **Note:** This relies on the special methods `__enter__` and `__exit__` (see the chapter on object-oriented programming): any custom class can define these two methods to be used with `with` (e.g., to manage opening and closing a network or database connection).
