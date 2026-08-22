---
order: 5
---

# Data Warehouse vs. Data Lake

The [Star Schema](/?c=bases-de-donnees&p=modeles-en-etoile) chapter mentions the **data warehouse** without detailing what sets it apart from a plain database: it's a database dedicated to analysis, with a schema imposed before anything is even written to it. The **data lake** answers the same need to accumulate history, but by reversing that principle: you store first, and decide on the structure later.

## Schema imposed at write time, or decided at read time

A data warehouse requires a schema defined before any loading: every table has typed columns decided in advance (`CREATE TABLE sales_fact (amount DECIMAL(10, 2), ...)`), and a row that doesn't match that schema is rejected at write time. This is **schema-on-write**: the structure is decided upstream, the check happens on the way in.

A data lake accepts any file as it is: a CSV, a JSON, an image, a raw log file, with no schema required at the moment it's dropped in. The structure is only decided when some process comes to read those files and applies an interpretation to them. This is **schema-on-read**: the check is postponed to read time, never imposed at write time.

```text
Data warehouse (schema-on-write):
  source file --> checked against the schema --> rejected or inserted into a typed table

Data lake (schema-on-read):
  source file --> stored as-is, with no check --> structure decided at read time
```

## Overview

| | Data warehouse | Data lake |
|---|---|---|
| Schema | Imposed at write time (schema-on-write) | Decided at read time (schema-on-read) |
| Formats accepted | Structured tables only | Any file (CSV, JSON, image, log...) |
| Storage cost | Higher (structure, indexes) | Lower (raw files) |
| Typical use | Stable reporting, business dashboards | Exploration, large volumes of raw data, use cases not yet defined |
| Time to availability | Slower (the structure must be defined first) | Immediate (the file is already there, as-is) |

## The pitfall: confusing "accepts anything" with "no need for rigor"

> **Pitfall:** treating the data lake as a space with no rules at all, where files are dropped in without ever being organized or documented. After a few months, no one knows anymore what each file contains, or whether it's still current: this is called a **data swamp**, a data lake made unusable by disorderly accumulation.
>
> **Best practice:** organize the data lake with the same landmarks as the [medallion architecture](/?c=bases-de-donnees&p=architecture-medaillon) (bronze/silver/gold), even if no schema is imposed at write time: a folder or naming convention by source and by date, and documentation of what each zone contains.

## The pitfall: believing you have to choose one or the other

> **Pitfall:** thinking a company must choose between warehouse and data lake once and for all. The two answer different needs (stable, reliable reporting vs. exploring varied raw data), which often coexist within the same organization.
>
> **Best practice:** use a data lake to absorb raw data of any kind at lower cost, and a data warehouse (or the gold layer of a medallion architecture built on top of that lake) for what needs to be reliable and fast to query for a business report. Some recent tools (**lakehouses**) combine both: the economical storage of a data lake, with schema guarantees close to those of a warehouse.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A data warehouse imposes a schema before writing (schema-on-write) and only stores structured tables; a data lake accepts any file as-is and only decides its structure at read time (schema-on-read). |
| **Available Tools** | `CREATE TABLE` with a typed schema for a warehouse; file storage organized by convention (bronze/silver/gold) for a data lake. |
| **Pitfalls to Avoid** | Letting a data lake turn into a data swamp through disorderly accumulation; believing you have to choose between the two rather than letting them coexist as needed. |
| **Best Practices** | Organize a data lake around clear zones even with no imposed schema; reserve the warehouse (or the gold layer) for reliable reporting needs; consider a lakehouse when both needs overlap heavily. |
