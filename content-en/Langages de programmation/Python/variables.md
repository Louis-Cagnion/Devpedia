---
order: 1
---

# Basic Variables and Types

Python is **dynamically typed**: a variable does not have a type declared in advance; it simply takes on the type of the value assigned to it—and can freely change types during the course of the program (unlike PHP or C, where the type of a typed property or variable remains fixed once declared).

## Declare a variable

```python
age = 25            # int
prix = 9.99          # float
nom = "Devpedia"      # str
actif = True          # bool
rien = None           # equivalent to null/NULL

age = "vingt-cinq"    # Perfectly valid: `age` becomes a `str` without declaring anything
```

> **Note:** Unlike PHP (`$variable`), Python does not use any special symbol to denote a variable—just a name, in lowercase with underscores by convention (`nom_utilisateur`, not `nomUtilisateur`).

## Check the type of a variable

```python
type(age)             # <class 'int'>
isinstance(age, int)   # True -> preferred over type() == int for conditional checks
```

## Operators

```python
a, b = 5, 3   # multiple assignments on a single line

a + b    # 8
a - b    # 2
a * b    # 15
a / b     # 1.6666... -> real division, always a float
a // b    # 1 -> integer division (floor division)
a % b     # 2 -> modulo
a ** b    # 125 -> power

a == b    # False
a != b    # True
a and b   # AND logical (not '&&')
a or b    # Logical OR (not '||')
not a     # Logical "NOT" (not '!')
```

> **Note:** Python uses the keywords `and` / `or` / `not` rather than the symbols `&&` / `||` / `!` found in PHP, JavaScript, or C.

## F-strings: Inserting Variables into Text

```python
nom = "Jean"
age = 25

print(f"{nom} a {age} ans")           # Jean is 25 years old
print(f"Dans 10 ans : {age + 10} ans") # a real expression, not just a variable
```

F-strings (with the prefix `f` before the quotation marks) are the recommended modern method, replacing `"{} a {} ans".format(nom, age)` or concatenation with `+`.

## Immutability of Strings

Just like in PHP, a Python string is **immutable**: any "modification" actually creates a new string; it never modifies the original one in memory.

```python
texte = "bonjour"
texte.upper()      # returns "HELLO", DOES NOT MODIFY the text
print(texte)        # always "hello"

texte = texte.upper()  # You need to reassign it to "save" the change
```

## Summary of Basic Types

| Type | Example | PHP Equivalent |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texte"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

See also the chapters on lists/tuples and dictionaries/sets for composite data structures.
