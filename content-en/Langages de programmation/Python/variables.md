---
order: 1
---

# Basic Variables and Types

Python is **dynamically typed**: a variable does not have a type declared in advance; it simply takes on the type of the value assigned to it—and can freely change types during the course of the program (unlike PHP or C, where the type of a typed property or variable remains fixed once declared).

## Declare a variable

```python
age = 25            # int
price = 9.99          # float
name = "Devpedia"      # str
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

## `==` vs `is`: value or object?

These two operators are often confused, even though they ask two different questions:

| Operator | Compares | Question asked |
|---|---|---|
| `==` | the **value** | "is their content identical?" |
| `is` | the **identity** | "is it the same object in memory?" |

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

a == b  # True  -> same content
a is b  # False -> two distinct lists in memory
a is c  # True  -> c and a refer to the same object
```

This is exactly the distinction between comparison by **value** and comparison by **reference** you find in C with pointers: `*p1 == *p2` (the pointed-to values) versus `p1 == p2` (the addresses). See the C [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) chapter.

### Why `is None` and not `== None`

To test whether a variable is `None`, the Python convention is `is None`:

```python
if value is None:  # recommended
if value == None:  # to avoid
```

Two reasons:

- `None` is a **singleton**: only one instance of it exists in the whole program. Testing identity is therefore correct by construction, and slightly faster.
- `==` can be **overridden** by a class via `__eq__`. An object can therefore perfectly well answer `True` to `== None` while not actually being `None`, which makes the test unreliable.

This is what explains the `None` sentinel pattern used for mutable default arguments (see the [Functions](/?c=langages-de-programmation&s=python&p=fonctions) chapter).

> The same reasoning applies to `True`/`False`, which are also singletons. In practice you rarely write `is True`: you test `if condition:` directly.

## F-strings: Inserting Variables into Text

```python
name = "Jean"
age = 25

print(f"{name} a {age} ans")           # Jean is 25 years old
print(f"Dans 10 ans : {age + 10} ans") # a real expression, not just a variable
```

F-strings (with the prefix `f` before the quotation marks) are the recommended modern method, replacing `"{} a {} ans".format(name, age)` or concatenation with `+`.

## Immutability of Strings

Just like in PHP, a Python string is **immutable**: any "modification" actually creates a new string; it never modifies the original one in memory.

```python
text = "bonjour"
text.upper()      # returns "HELLO", DOES NOT MODIFY the text
print(text)        # always "hello"

text = text.upper()  # You need to reassign it to "save" the change
```

## Summary of Basic Types

| Type | Example | PHP Equivalent |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"text"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

See also the chapters on lists/tuples and dictionaries/sets for composite data structures.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Python is dynamically typed: a variable takes on the type of its value, with no prior declaration, and can change type. `==` compares value, `is` compares identity (the same object in memory). |
| **Tools you can use** | `type()`/`isinstance()`, f-strings for interpolation, `is None` to test for a missing value. |
| **Pitfalls to avoid** | Confusing `==` and `is`: two objects with identical content aren't necessarily the same object in memory. |
| **Best practices** | Use `is None` rather than `== None`; prefer f-strings over concatenation to insert a variable into text. |
