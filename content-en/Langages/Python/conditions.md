---
order: 2
---

# Conditions

Python uses `if` / `elif` / `else`, without any curly braces: it is the **indentation** itself that delimits code blocks, unlike [PHP](/?c=langages-de-programmation&s=php&p=php), C, or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript).

## `if` / `elif` / `else`

```python
age = 20

if age >= 18:
    print("Vous êtes majeur.")
elif age >= 13:
    print("Vous êtes adolescent.")
else:
    print("Vous êtes enfant.")
```

> **Note:** `elif` (a contraction of "else if") is the only keyword used to chain conditions; `else if` (as two separate words) does not exist in Python. Consistent indentation is **required**: an incorrectly indented block causes a `IndentationError`, not just a warning.

## "Truthy" and "falsy" values

Apart from `True` and `False`, Python automatically treats certain values as false in a Boolean context (`if`, `while`...):

```python
if []:        # False -> an empty list is "falsy"
if "":         # False -> an empty string is "falsy"
if 0:          # False -> zero is "falsy"
if None:       # False
if [1, 2]:    # True -> a non-empty list is "truthy"
```

| Value | Truthy / Falsy |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (empty string) | Falsy |
| `[]`, `{}`, `set()` (empty collections) | Falsy |
| `None` | Falsy |
| Everything Else | Truthy |

```python
utilisateurs = []

if utilisateurs:                # preferred over "if len(users) > 0:"
    print("Il y a des utilisateurs")
else:
    print("Aucun utilisateur")
```

## The ternary operator

```python
age = 20
statut = "majeur" if age >= 18 else "mineur"
```

Unlike PHP/C/JS (`condition ? valeur_si_vrai : valeur_si_faux`), Python places the condition **in the middle**: `valeur_si_vrai if condition else valeur_si_faux`.

## The "morse" operator (`:=`), since Python 3.8

Allows you to assign a variable **and** use it in the same expression, particularly in a condition:

```python
# Without the Morse operator: the "result" line is calculated twice
if calculer_resultat() > 10:
    print(calculer_resultat())

# with the Morse operator: calculated only once, AND usable thereafter
if (result := calculer_resultat()) > 10:
    print(result)
```

## No standard `switch` (prior to Python 3.10)

For a long time, Python did not offer a direct equivalent to `switch`; a `elif` string or a mapping dictionary served as an alternative:

```python
def jour_semaine(jour):
    correspondance = {
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
    }
    return correspondance.get(jour, "Jour inconnu")
```

Starting with Python 3.10, `match` / `case` offers a dedicated syntax that is closer to a `switch`:

```python
match jour:
    case 1:
        print("Lundi")
    case 2:
        print("Mardi")
    case _:            # '_' : equivalent to the "default" in a switch statement
        print("Autre jour")
```
