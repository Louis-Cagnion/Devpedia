---
order: 7
---

# Error Handling

Python signals an error by raising an **exception**, which interrupts the program's normal execution unless it is caught by a block `try` / `except` — a mechanism similar to modern PHP exceptions (`throw` / `catch`).

## `try` / `except`

```python
try:
    resultat = 10 / 0
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
```

## Catching Multiple Types of Exceptions

```python
try:
    nombre = int(input("Entrez un nombre : "))
    resultat = 10 / nombre
except ValueError:
    print("Ce n'est pas un nombre valide")
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
except Exception as erreur:   # "catch everything else" -> place this LAST
    print(f"Erreur inattendue : {erreur}")
```

> **Note:** Intercepting `Exception` too broadly (or worse, a bare, untyped `except:`) hides programming errors that should instead cause the program to crash so they can be corrected—this should be reserved for cases where a failure is truly expected and is already handled immediately afterward.

## `else` and `finally`

```python
try:
    fichier = open("donnees.txt")
except FileNotFoundError:
    print("Fichier introuvable")
else:
    print("Fichier ouvert avec succès")   # executed ONLY if no exception has occurred
    fichier.close()
finally:
    print("Tentative terminée")            # executed IN ALL CASES, whether there is an exception or not
```

`finally` is typically used to release a resource (close a file, a connection, etc.) regardless of whether an error occurred.

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

def retirer(solde, montant):
    if montant > solde:
        raise SoldeInsuffisantError(f"Solde de {solde}€ insuffisant pour retirer {montant}€")
    return solde - montant

try:
    retirer(100, 150)
except SoldeInsuffisantError as erreur:
    print(erreur)
```

A custom exception inherits from `Exception` (or a more specific subclass), which allows it to be distinguished from others in a targeted `except`, rather than relying on a generic error message.

## `with` Context Manager

`with` ensures that a resource is properly released, **even if an exception occurs**—a file opened with `with` always closes automatically when the block ends:

```python
with open("donnees.txt") as fichier:
    contenu = fichier.read()
# file.close() is called automatically here, regardless of whether everything went well or not
```

> **Note:** This relies on the special methods `__enter__` and `__exit__` (see the chapter on object-oriented programming)—any custom class can define these two methods to be used with `with` (e.g., to manage opening and closing a network or database connection).
