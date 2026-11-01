---
order: 4
---

# Single Source of Truth

When the same family of information exists in two different places, the two copies end up (not if one day, but when) diverging. It's not a matter of carefulness: as soon as an update touches one copy without its author knowing the other exists, the inconsistency is already there, silently.

## The most visible case: several parallel structures

```python
FORMAT_LABELS = {
    "csv": "CSV",
    "json": "JSON",
    "xml": "XML",
}
FORMAT_EXPORTERS = {
    "csv": export_csv,
    "json": export_json,
    "xml": export_xml,
}
FORMAT_VALIDATORS = {
    "csv": validate_csv,
    "json": validate_json,
    "xml": validate_xml,
}
```

Three dictionaries, kept in sync manually by convention rather than by construction: adding a format means remembering to update all three. Forgetting one doesn't always produce an immediate error: sometimes just silently incomplete behavior for that format, discovered much later.

Consolidating into a single source fixes the problem by construction:

```python
FORMAT_REGISTRY = {
    "csv": {
        "label": "CSV",
        "exporter": export_csv,
        "validator": validate_csv,
    },
    "json": {
        "label": "JSON",
        "exporter": export_json,
        "validator": validate_json,
    },
    # ...
}
```

Adding a format is now **a single** entry to add, with everything about it in one place: impossible to sync only half of it.

## The less visible case: duplication across files that never reference each other

The same family of information duplicated across several independent files is harder to spot, because nothing in the code visually flags the link between the two: a data file (`shops.csv`) listing identifiers, and a separately generated report that discovered some of those identifiers actually redirect to other entries already present. The data file doesn't "know" what the report discovered: the two drift apart, until a manual audit reconciles them and removes the redundant entries.

This case isn't always fixed by merging structures like the previous example: sometimes the real single source of truth needs to become a process (a script that regenerates the data file from the report, or the other way around) rather than a plain in-memory structure: what matters is that one of the two representations explicitly derives from the other, rather than the two evolving side by side with no link.

## The general principle

Before duplicating a piece of information (a constant, a list of identifiers, a configuration), the question to ask: *if this information changes, how many places need updating, and is there a mechanism guaranteeing they all will be?* If the answer is "you have to remember to", the duplication is a risk, even if it looks harmless at the moment it's introduced.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The same family of information duplicated in two places always ends up diverging: not from a lack of care, but as soon as an update touches one copy without its author knowing the other exists. |
| **Tools you can use** | Consolidating several parallel structures (synced by convention) into a single nested structure (synced by construction). |
| **Pitfalls to avoid** | Duplicating information across several files that never reference each other: the link is visible nowhere in the code. |
| **Best practices** | Before any duplication, ask how many places would need updating if the information changes, and whether a mechanism guarantees they all will be. |
