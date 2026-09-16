---
order: 2
---

# Conditions

Python uses `if` / `elif` / `else`, without any curly braces: it is the **indentation** itself that delimits code blocks, unlike [PHP](/?c=langages-de-programmation&s=php&p=php), C, or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript).

## `if` / `elif` / `else`

```python
age = 20

if age >= 18:
    print("You are an adult.")
elif age >= 13:
    print("You are a teenager.")
else:
    print("You are a child.")
```

> **Note:** `elif` (a contraction of "else if") is the only keyword used to chain conditions; `else if` (as two separate words) does not exist in Python. Consistent indentation is **required**: an incorrectly indented block causes a `IndentationError`, not just a warning.

## "Truthy" and "falsy" values

Apart from `True` and `False`, Python automatically treats certain values as false in a Boolean context (`if`, `while`...):

```python
if []:      # False -> an empty list is "falsy"
if "":      # False -> an empty string is "falsy"
if 0:       # False -> zero is "falsy"
if None:    # False
if [1, 2]:  # True -> a non-empty list is "truthy"
```

| Value | Truthy / Falsy |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (empty string) | Falsy |
| `[]`, `{}`, `set()` (empty collections) | Falsy |
| `None` | Falsy |
| Everything Else | Truthy |

```python
users = []

if users:                # preferred over "if len(users) > 0:"
    print("There are users")
else:
    print("No users")
```

## `and`/`or` return a value, not just a boolean

```python
status = "active"
result = status and "found"    # "found" -> status is truthy, and returns its SECOND operand
result = "" and "found"        # ""      -> "" is falsy, and stops and returns its FIRST operand

nickname = ""
display_name = nickname or "Anonymous"  # "Anonymous" -> or returns the first truthy operand encountered
```

`and`/`or` never recompute a `True`/`False`: they return one of their two operands, without evaluating the other beyond what's necessary (**short-circuit evaluation**). `a and b` returns `a` if `a` is falsy (without even evaluating `b`), otherwise `b`; `a or b` returns `a` if `a` is truthy, otherwise `b`. This idiom allows a conditional call (`connected and disconnect()`, only calls `disconnect()` if `connected` is true) or a fallback value (`name = nickname or "Anonymous"`).

> **Pitfall:** this shortcut remains hard to read for a plain conditional test; reserve it for an expression (assignment, argument) needing a fallback value or a short conditional call, keep an explicit `if` everywhere else.

## The ternary operator

```python
age = 20
status = "adult" if age >= 18 else "minor"
```

Unlike PHP/C/JS (`condition ? true_value : false_value`), Python places the condition **in the middle**: `true_value if condition else false_value`.

## The "morse" operator (`:=`), since Python 3.8

Allows you to assign a variable **and** use it in the same expression, particularly in a condition:

```python
# Without the Morse operator: the "result" line is calculated twice
if calculate_result() > 10:
    print(calculate_result())

# with the Morse operator: calculated only once, AND usable thereafter
if (result := calculate_result()) > 10:
    print(result)
```

## No standard `switch` (prior to Python 3.10)

For a long time, Python did not offer a direct equivalent to `switch`; a `elif` string or a mapping dictionary served as an alternative:

```python
def day_of_week(day):
    mapping = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
    }
    return mapping.get(day, "Unknown day")
```

Starting with Python 3.10, `match` / `case` offers a dedicated syntax that is closer to a `switch`:

```python
match day:
    case 1:
        print("Monday")
    case 2:
        print("Tuesday")
    case _:            # '_' : equivalent to the "default" in a switch statement
        print("Other day")
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `if`/`elif`/`else` structures control flow, no curly braces: indentation delimits blocks. Certain values (`0`, `""`, `[]`, `None`) are "falsy" without being `False`. `and`/`or` return one of their operands, not just a boolean. |
| **Tools you can use** | Ternary operator (`x if cond else y`), walrus operator (`:=`), `match`/`case` (Python 3.10+). |
| **Pitfalls to avoid** | Inconsistent indentation: causes an `IndentationError`, not just a warning. |
| **Best practices** | Test `if collection:` directly instead of `if len(collection) > 0:`, relying on truthy/falsy behavior. |
