---
order: 2
---

# Avoiding Repetition: Indexed Structures Rather Than Duplicated Code

A classic sign of code that's going to become painful to maintain: the same statement, repeated once per element of a set, with only one or two values changing from one repetition to the next.

## The symptom

```python
parser.add_argument("--profile-dir", default=str(Path.home() / ".scraper_profile"))
parser.add_argument("--headless", action="store_true")
parser.add_argument("--site", choices=["leboncoin", "lacentrale", "vivacar", "zoomcar"])
parser.add_argument("--output", default="reports/report.txt")
# ... a dozen others, each on its own call
```

Each line looks similar, but adding an option, removing one, or changing a behavior common to all of them (validating a type, for instance) requires repeating the same change at every spot — and it's easy to miss one.

## The solution: a data structure, walked by generic code

The principle: describe each element only once, in a data structure (list, dictionary), then write a **single** loop or function that walks it and applies the same processing to each one.

```python
CLI_ARGUMENTS = [
    {"flag": "--profile-dir", "default": str(Path.home() / ".scraper_profile")},
    {"flag": "--headless", "action": "store_true"},
    {"flag": "--site", "choices": ["leboncoin", "lacentrale", "vivacar", "zoomcar"]},
    {"flag": "--output", "default": "reports/report.txt"},
]

for arg in CLI_ARGUMENTS:
    flag = arg.pop("flag")
    parser.add_argument(flag, **arg)
```

Adding an option becomes an entry in a list, not a new line of code written to match the same pattern as the previous ones. A common behavior (validation, a computed default value, a transformation) changes in one place — the loop — instead of being repeated in every call.

## A subtler case: dispatch

The same idea applies when the repetition is over a condition rather than a function call:

```python
# Before: one branch per case, to keep in sync with the list of sites
if site == "leboncoin":
    scraper = scrape_leboncoin
elif site == "lacentrale":
    scraper = scrape_lacentrale
elif site == "vivacar":
    scraper = scrape_vivacar
elif site == "zoomcar":
    scraper = scrape_zoomcar

# After: a dictionary acts as a dispatch table
SITE_SCRAPERS = {
    "leboncoin": scrape_leboncoin,
    "lacentrale": scrape_lacentrale,
    "vivacar": scrape_vivacar,
    "zoomcar": scrape_zoomcar,
}
scraper = SITE_SCRAPERS[site]
```

The dictionary plays exactly the same role as the `if`/`elif` chain, but adding a site amounts to adding an entry, without touching the logic that picks the right scraper.

## Where to stop

This generalization has a cost: a data structure too abstract for two or three cases that won't grow complicates reading with no real benefit (see the [KISS](https://en.wikipedia.org/wiki/KISS_principle)/[YAGNI](https://martinfowler.com/bliki/Yagni.html) principle). The rule of thumb: as soon as you write the **third** repetition of the same pattern, that's the right time to replace it with an indexed structure — before that, it's often not yet worth it.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The same statement repeated for each element of a set (CLI options, an `if`/`elif` per case) should rely on an indexed structure (list, dictionary) walked by generic code — adding an element becomes modifying data, not adding code. |
| **Tools you can use** | A list of dictionaries walked in a loop, a dispatch dictionary instead of an `if`/`elif` chain. |
| **Pitfalls to avoid** | Generalizing on the first or second occurrence — a structure too abstract for a case that won't grow complicates reading with no real benefit. |
| **Best practices** | Wait for the third repetition of the same pattern before replacing it with an indexed structure. |
