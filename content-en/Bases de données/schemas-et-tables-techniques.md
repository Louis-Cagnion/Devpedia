---
order: 4
---

# Schemas and Technical Tables

The previous chapters ([star schema](/?c=bases-de-donnees&p=modeles-en-etoile), [bridge table](/?c=bases-de-donnees&p=table-pont)) cover the tables that carry the analysis itself: facts, dimensions, associations. A real database also contains tables that serve no analysis at all but keep the pipeline that feeds them running, and a namespace that organizes them: the **schema**.

## The schema: a namespace for tables

A SQL **schema** is a namespace inside a database: every table belongs to one, and its full name is written `schema.table` (for example `dim.product` rather than just `product`). Two tables with the same name can coexist without conflict if they're in different schemas, and a schema mainly serves to signal a table's role at a glance in a database that contains hundreds of them.

```sql
CREATE SCHEMA dim;
CREATE SCHEMA fact;

CREATE TABLE dim.product (
    product_id  INT PRIMARY KEY,
    name        VARCHAR(100)
);

CREATE TABLE fact.sales (
    sale_id     INT PRIMARY KEY,
    product_id  INT
);
```

## dbo: the default schema

On [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), **dbo** (*database owner*) is the schema created by default: any table created without specifying a schema lands there automatically. A database that has never created another schema ends up with all its tables in `dbo`, regardless of their role (fact, dimension, technical).

> **Pitfall:** leaving every table in `dbo` by default, without ever creating other schemas. In a database with several hundred tables, nothing then distinguishes a fact table from a technical table just by reading its full name; you have to open each table to understand its role.
>
> **Best practice:** create schemas named by role (`dim`, `fact`, `stg` for staging, `admin` for technical tables) as soon as a database grows past a handful of tables, and use `dbo` only for what deliberately belongs to no specific category.

## Technical tables: they run the pipeline, not the analysis

A **technical table** (often placed in an `admin` or `meta` schema) contains neither facts nor dimensions: it stores information about how the pipeline itself operates. The most common example is the **load tracking table** (*watermark table*), which keeps track of how far the last load went so only new rows get reprocessed next time.

```sql
CREATE TABLE admin.load_tracking (
    source_name  VARCHAR(50) PRIMARY KEY,
    last_load    DATETIME
);
```

```sql
-- only reads what has arrived since the last successful load, instead of re-reading everything
SELECT *
FROM source_sales
WHERE modification_date > (
    SELECT last_load FROM admin.load_tracking WHERE source_name = 'sales'
);

-- then, once the load has completed successfully, the marker is moved forward
UPDATE admin.load_tracking
SET last_load = NOW()
WHERE source_name = 'sales';
```

> **Pitfall:** re-reading an entire source on every run of the pipeline instead of tracking what's already been processed. On a source that grows every day, processing time increases without bound, while most of the work just redoes what was already correct the day before.
>
> **Best practice:** one load tracking table per source, updated only after a successful load (never before, otherwise a run that fails partway through leads the pipeline to believe unprocessed data was processed).

## Pitfall: mixing technical tables and analysis tables

As with bronze and silver in the [medallion architecture](/?c=bases-de-donnees&p=architecture-medaillon), nothing technically prevents a reporting tool from reading a technical table directly.

> **Pitfall:** connecting a dashboard to `admin.load_tracking` or a staging table because the information is already there. These tables change shape according to the pipeline's own needs, with no regard for an external consumer that latched onto them.
>
> **Best practice:** keep technical tables in a dedicated schema (`admin`, `stg`, `meta`), separate from the `dim`/`fact` schemas meant for analysis, so a newcomer knows immediately, from the schema name alone, what they're allowed to query.

## Overview

| Schema | Role | Example | Who queries it |
|---|---|---|---|
| `dim` | Dimensions | `dim.product` | Dashboards, analysts |
| `fact` | Facts | `fact.sales` | Dashboards, analysts |
| `stg` | Data in transit (staging) | Raw copy before cleaning | The pipeline itself |
| `admin` | Pipeline operation | Load tracking, error log | The people who maintain the pipeline |
| `dbo` | Default (SQL Server), or general uncategorized use | Depends on the database | Variable |

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A SQL schema is a namespace that organizes tables by role (`dim`, `fact`, `stg`, `admin`); `dbo` is SQL Server's default schema, not to be left receiving every table indiscriminately. Technical tables (load tracking, error log) run the pipeline but aren't used for analysis. |
| **Available Tools** | `CREATE SCHEMA` to organize tables by role; a load tracking table (`admin.load_tracking`) to reprocess only new data on each run. |
| **Pitfalls to Avoid** | Leaving everything in `dbo` with no role distinction; re-reading an entire source on every pipeline run; connecting a dashboard directly to a technical table. |
| **Best Practices** | Create schemas named by role as soon as a database grows; update the load tracking table only after a successful load; keep technical tables in a dedicated schema, separate from analysis. |
