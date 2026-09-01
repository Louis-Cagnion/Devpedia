---
order: 16
---

# The `datetime` Module

A computer internally measures time as a plain number of elapsed seconds (see `time.time()` below); the standard module **`datetime`** dresses it up as a readable object (year, month, day, hour...), handy for displaying, comparing, or formatting it as a string.

## `datetime.now()`: the current date and time

```python
from datetime import datetime

now = datetime.now()
print(now)  # 2026-09-01 14:32:07.123456 -> a datetime object, not a plain string

now.year, now.month, now.day      # (2026, 9, 1)
now.hour, now.minute, now.second  # (14, 32, 7)

datetime(2026, 1, 1)  # builds a precise date rather than "now"
```

## Formatting as a string: `.strftime()`

```python
now.strftime("%Y-%m-%d_%H%M%S")  # "2026-09-01_143207" -> compact format, usable in a file name
now.strftime("%d/%m/%Y")         # "01/09/2026"        -> common European format
```

| Code | Means |
|---|---|
| `%Y` | 4-digit year |
| `%m` | Month (01-12) |
| `%d` | Day of month (01-31) |
| `%H` | Hour (00-23) |
| `%M` | Minute (00-59) |
| `%S` | Second (00-59) |

## Parsing a string into a date: `.strptime()`

```python
datetime.strptime("2026-09-01_143207", "%Y-%m-%d_%H%M%S")  # INVERSE operation of strftime, same code table
```

> **Pitfall:** the format given to `strptime()` must match the received string EXACTLY (same separators, same order); a format that doesn't match raises a `ValueError`, not an approximate result.

## `datetime.now()` vs `time.time()`

```python
import time

time.time()      # 1798819927.123456 -> RAW number of seconds since January 1, 1970 (Unix epoch)
datetime.now()   # 2026-09-01 14:32:07.123456 -> object with year/month/day... already broken down
```

`time.time()` is suited for measuring a DURATION (difference between two calls); `datetime` is suited as soon as you need to display, compare, or break down a readable date/time. See also [`sorted()` on strings](/?c=langages-de-programmation&s=python&p=listes-et-tuples) for sorting timestamps written in `%Y-%m-%d...` format without going through `datetime` at all.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `datetime.now()` gives the current date/time as a broken-down object (year, month, day...). `.strftime()` formats it as a string from codes (`%Y`, `%m`...), `.strptime()` does the reverse. |
| **Tools you can use** | `datetime.now()`, `datetime(year, month, day)`, `.strftime(format)`, `.strptime(string, format)`, `time.time()` for a plain duration. |
| **Pitfalls to avoid** | A `strptime()` format that doesn't exactly match the received string raises a `ValueError`, with no approximate result. |
| **Best practices** | Use `datetime` for anything that must be displayed/compared as a date; reserve `time.time()` for measuring a raw duration. |
