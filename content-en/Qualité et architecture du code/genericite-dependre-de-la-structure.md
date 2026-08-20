---
order: 6
---

# Genericity: Depending on Structure Rather Than Fixed Values

Code that works today can still be fragile if it depends on values specific to one particular case (an exact identifier, a site name, a value that only exists in the current dataset) rather than on the general **shape** of the data it receives. The symptom doesn't show up right away: the code breaks silently, or has to be modified by hand, as soon as the data changes or comes from a different source.

## The symptom

```python
def report_groups_for(site):
    if site == "leboncoin":
        return ["leboncoin"]
    elif site == "lacentrale":
        return ["lacentrale-espacevo"]
    elif site == "espacevo":
        return ["lacentrale-espacevo"]
    elif site == "vivacar":
        return ["vivacar"]
    elif site == "zoomcar":
        return ["zoomcar"]
```

This function depends on no structure at all: it hardcodes knowledge that already exists elsewhere in the code (which site belongs to which report group). Adding a site means remembering to come update this list, in addition to any other similar list elsewhere: a [single source of truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) problem addressed here at the root, by deriving behavior from the structure of the data rather than from values cited one by one.

## The generic version

If the information "which report group for which site" already lives in a centralized registry (see the chapter on [single source of truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), the function no longer needs to know any site by name:

```python
def report_groups_for(site):
    return [SITE_REGISTRY[site]["report_group"]]
```

A new site no longer requires any change to `report_groups_for`: adding its entry to the registry is enough, because the function reads the registry's **structure** rather than reacting to values it already knows in advance.

## Recognizing the signal

The warning sign is an `if`/`elif`/`switch` where each branch tests a specific value (an identifier, a name) that already exists, in some form, in data or a structure accessible elsewhere in the program. If that structure already exists, duplicating it as conditional branches is a sign it should be consulted directly instead. If it doesn't exist yet, that's often a sign it should be created.

## The limit: don't generalize a case that will stay unique

This principle doesn't justify building a generic structure for a case that, by nature, will only ever have a single value: processing genuinely specific to one single site doesn't need a generalized configuration mechanism, that would be over-engineering ([YAGNI](https://martinfowler.com/bliki/Yagni.html)). Genericity is justified when the number of cases is likely to vary; it becomes an unnecessary cost when it structurally never will.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Code that tests specific values (`if site == "leboncoin"`) rather than reading the structure of data already available breaks silently as soon as the data changes or comes from elsewhere. |
| **Tools you can use** | Deriving behavior from an already-centralized registry, rather than duplicating its knowledge as conditional branches. |
| **Pitfalls to avoid** | An `if`/`elif` where each branch tests a value already present in a structure accessible elsewhere: a sign it should be consulted directly. |
| **Best practices** | Make the code depend on the shape of the data rather than on specific values, as soon as the number of cases is likely to vary. |
