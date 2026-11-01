---
order: 3
---

# Avoiding Repetition: Indexed Structures Rather Than Duplicated Code

A classic sign of code that's going to become painful to maintain: the same statement, repeated once per element of a set, with only one or two values changing from one repetition to the next.

## The symptom

```python
parser.add_argument("--profile-dir", default=str(Path.home() / ".rapport_profil"))
parser.add_argument("--verbose", action="store_true")
parser.add_argument("--format", choices=["csv", "json", "xml", "html"])
parser.add_argument("--output", default="reports/report.txt")
# ... a dozen others, each on its own call
```

Each line looks similar, but adding an option, removing one, or changing a behavior common to all of them (validating a type, for instance) requires repeating the same change at every spot, and it's easy to miss one.

## The solution: a data structure, walked by generic code

The principle: describe each element only once, in a data structure (list, dictionary), then write a **single** loop or function that walks it and applies the same processing to each one.

```python
CLI_ARGUMENTS = [
    {"flag": "--profile-dir", "default": str(Path.home() / ".rapport_profil")},
    {"flag": "--verbose", "action": "store_true"},
    {"flag": "--format", "choices": ["csv", "json", "xml", "html"]},
    {"flag": "--output", "default": "reports/report.txt"},
]

for arg in CLI_ARGUMENTS:
    flag = arg.pop("flag")
    parser.add_argument(flag, **arg)
```

Adding an option becomes an entry in a list, not a new line of code written to match the same pattern as the previous ones. A common behavior (validation, a computed default value, a transformation) changes in one place (the loop) instead of being repeated in every call.

## A subtler case: dispatch

The same idea applies when the repetition is over a condition rather than a function call:

```python
# Before: one branch per case, to keep in sync with the list of formats
if format_name == "csv":
    exporter = export_csv
elif format_name == "json":
    exporter = export_json
elif format_name == "xml":
    exporter = export_xml
elif format_name == "html":
    exporter = export_html

# After: a dictionary acts as a dispatch table
FORMAT_EXPORTERS = {
    "csv": export_csv,
    "json": export_json,
    "xml": export_xml,
    "html": export_html,
}
exporter = FORMAT_EXPORTERS[format_name]
```

The dictionary plays exactly the same role as the `if`/`elif` chain, but adding a format amounts to adding an entry, without touching the logic that picks the right exporter.

## Where to stop

This generalization has a cost: a data structure too abstract for two or three cases that won't grow complicates reading with no real benefit (see the [KISS](https://en.wikipedia.org/wiki/KISS_principle)/[YAGNI](https://martinfowler.com/bliki/Yagni.html) principle). The rule of thumb: as soon as you write the **third** repetition of the same pattern, that's the right time to replace it with an indexed structure; before that, it's often not yet worth it.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The same statement repeated for each element of a set (CLI options, an `if`/`elif` per case) should rely on an indexed structure (list, dictionary) walked by generic code: adding an element becomes modifying data, not adding code. |
| **Tools you can use** | A list of dictionaries walked in a loop, a dispatch dictionary instead of an `if`/`elif` chain. |
| **Pitfalls to avoid** | Generalizing on the first or second occurrence: a structure too abstract for a case that won't grow complicates reading with no real benefit. |
| **Best practices** | Wait for the third repetition of the same pattern before replacing it with an indexed structure. |
