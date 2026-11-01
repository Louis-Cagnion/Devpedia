---
order: 5
---

# Checking Dependency Direction Before Centralizing

Centralizing shared configuration in a single place is generally a good idea (see [Single Source of Truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), but the chosen location isn't neutral: if that new spot sits "higher" in the dependency graph than some of its future users, centralizing creates a **circular import** instead of simplifying anything.

## A concrete example

A report export program organized in layers: a low-level `writer.py` module (open a file, write, close) with no knowledge of specific formats, and a higher-level `formats/` folder that imports `writer.py` to implement the export of each format:

```text
formats/csv.py   --imports-->  writer.py
formats/json.py  --imports-->  writer.py
```

Some settings (buffer sizes and encodings specific to a format) seemed, at first glance, to logically belong in a centralized format registry (`FORMAT_REGISTRY`, located in `formats/__init__.py`). But `writer.py` itself needs to read these settings to work, and `writer.py` is imported BY `formats/`, not the other way around. Moving them would create:

```text
writer.py  --would import-->  formats/__init__.py  --imports-->  writer.py
```

A cycle: `writer.py` would import a module that, transitively, already imports it. Depending on the language, this produces either a load-time error or a partially initialized import (often worse: the bug only shows up in certain execution orders). The solution chosen: keep these format-specific settings in `writer.py` itself, at the cost of a small exception to the "everything about a format goes in the registry" rule, documented in a comment so the next person doesn't try to "fix" what's actually a structural constraint.

## The question to ask before centralizing

*Who imports whom, today?* If the new centralized location would need to be imported by a module that sits **below**, in the dependency graph, the module where the information to centralize currently lives, moving it reverses the direction of an existing dependency, and a cycle appears as soon as a low-level module needs, even indirectly, information living in a high-level module that depends on it.

> **Practical rule of thumb:** in a layered architecture (low level ↔ high level), information should only flow one way: from the low layers up to the high layers that use them. A centralization that seems "logical" from a domain point of view (grouping everything about a format) can still violate this direction if the information is used by a layer lower than the intended destination.

## This isn't a reason to never centralize

This principle doesn't say to avoid centralizing; [single source of truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) remains desirable. It says to check the dependency graph **before** moving anything, and to accept that a piece of information stays in a module that looks "less logical" when the only alternative is a cycle: the tidiness of the organization matters less than the absence of a cycle.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Centralizing information in a module "higher" than some of its current users creates a circular import, not a simplification: the direction of existing dependencies takes priority over tidy domain organization. |
| **Tools you can use** | Asking "who imports whom, today?" before any move of shared configuration. |
| **Pitfalls to avoid** | Moving information to a "logical" location without checking that its current users aren't lower in the dependency graph. |
| **Best practices** | Accept that a piece of information stays in a module that looks "less logical" when the only alternative is a cycle, documented in a comment to prevent an unwelcome future "fix". |
