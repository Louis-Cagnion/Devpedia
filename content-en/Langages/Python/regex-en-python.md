---
order: 18
---

# Regex in Python: the `re` module

Unlike [JavaScript](/?c=langages&s=javascript&p=regex), Python has no literal syntax for regexes (no `/pattern/`): the `re` module from the standard library provides all the needed functions and methods. The pattern syntax itself (character classes, quantifiers, groups, anchors) is exactly the same as seen in [Regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) -- this chapter covers only the Python API: how to compile a pattern, run it, and retrieve its result.

## Compiling a pattern: `re.compile()`

```python
import re

pattern = re.compile(r"\d{4}-\d{2}-\d{2}")   # precompiles the pattern, reusable
```

> **Note:** the `r"..."` prefix (raw string) prevents Python from interpreting `\d` as an invalid escape sequence: essential as soon as a pattern contains a backslash.

`re.compile(pattern)` turns a string into a `Pattern` object, reusable for several searches without reinterpreting the pattern each time -- more efficient than a direct call like `re.match(pattern, text)` if the same pattern is used repeatedly.

## Searching for a match

| Method | Looks for | Returns |
|---|---|---|
| `pattern.match(text)` | A match only at the START of the string | A `Match`, or `None` |
| `pattern.search(text)` | The first match anywhere in the string | A `Match`, or `None` |
| `pattern.fullmatch(text)` | A match against the ENTIRE string | A `Match`, or `None` |
| `pattern.findall(text)` | All matches | A list of strings (or tuples if several groups) |
| `pattern.finditer(text)` | All matches | An iterator of `Match` objects |

```python
pattern = re.compile(r"\d{4}-\d{2}-\d{2}")

pattern.match("2024-06-15 is a date")      # matches: starts with the pattern
pattern.match("The 2024-06-15 is a date")  # None -> does NOT start with the pattern

pattern.search("The 2024-06-15 is a date")  # matches, anywhere in the string
```

> **Pitfall:** confusing `match()` (start of the string only) and `search()` (anywhere). A regex that finds nothing with `match()` can very well match with `search()`, simply because the match isn't at the very start of the string.
>
> **Best practice:** use `search()` by default whenever the match can be anywhere in the text; reserve `match()` for when it must start the string.

## The `Match` object

```python
result = pattern.search("The 2024-06-15 is a date")

result.group(0)   # "2024-06-15" -> the full match
result[0]         # equivalent, shorthand notation
result.start()    # 4 -> start index in the string
result.end()      # 14 -> end index
```

`result.group(0)` (or `result[0]`) always returns the full match, whether the pattern contains groups or not. If no match is found, `search()`/`match()` return `None`: calling `.group()` on that raises an `AttributeError` ("NoneType has no attribute group").

> **Pitfall:** calling `.group()` without first checking that the result isn't `None`. Always test the result before using it:
>
> ```python
> result = pattern.search(text)
> if result:
>     print(result.group(0))
> ```

## Capturing groups

```python
pattern = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
result = pattern.search("2024-06-15")

result.group(1)   # "2024" (year)
result.group(2)   # "06" (month)
result.group(3)   # "15" (day)
result.groups()   # ("2024", "06", "15") -> all groups in a tuple
```

## Named groups: `(?P<name>...)`

Beyond two or three groups, keeping track by position (`group(1)`, `group(2)`...) quickly becomes hard to read and fragile: inserting a new group in the middle of the pattern shifts the numbering of every group that follows. A **named group** attaches a label to the group, independent of its position:

```python
pattern = re.compile(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})")
result = pattern.search("2024-06-15")

result.group("year")   # "2024"
result["year"]         # equivalent, shorthand notation
result.groupdict()     # {"year": "2024", "month": "06", "day": "15"}
```

> **Best practice:** name groups as soon as a pattern has several -- `result["year"]` stays correct even if a group is added or removed elsewhere in the pattern, unlike `result.group(2)`, whose number depends on position.

## Replacing with `re.sub()`

```python
text = "The 2024-06-15 is a date"

re.sub(r"\d{4}-\d{2}-\d{2}", "DD/MM/YYYY", text)
# "The DD/MM/YYYY is a date"

# reuse a captured group in the replacement, with \1, \2...
re.sub(r"(\d{4})-(\d{2})-(\d{2})", r"\3/\2/\1", text)
# "The 15/06/2024 is a date"
```

See also [Regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) for the general pattern syntax (character classes, quantifiers, anchors, assertions), shared across all languages.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Python has no regex literal syntax: the `re` module provides `compile()`, `match()`/`search()`/`findall()`/`finditer()`, and a `Match` object to retrieve the result. Named groups (`(?P<name>...)`) make access to captured groups independent of their position. |
| **Tools you can use** | `re.compile()`, `pattern.match()`/`search()`/`fullmatch()`/`findall()`/`finditer()`, `match.group()`/`groups()`/`groupdict()`, `re.sub()`. |
| **Pitfalls to avoid** | Confusing `match()` (start of string only) and `search()` (anywhere). Calling `.group()` on a `None` result without checking it first. |
| **Best practices** | Precompile a pattern reused several times with `re.compile()`. Name groups as soon as a pattern has several. Always check that a search result isn't `None` before calling `.group()`. |
