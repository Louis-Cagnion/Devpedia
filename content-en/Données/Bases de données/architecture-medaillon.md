---
order: 2
---

# The Medallion Architecture

The [Star Schema](/?c=bases-de-donnees&p=modeles-en-etoile) chapter assumes the data is already clean: every row of `sales_fact` has a `product_id` that really exists in `product_dim`, no value is duplicated, no field is empty by mistake. In practice, raw data arriving from a website, a sensor, or an export from another piece of software is rarely in that state. The **medallion architecture** organizes the path from "raw data" to "data ready for analysis" into three stages named after Olympic medals: **bronze**, **silver**, and **gold**.

## The problem: transforming without starting over every time

Without intermediate stages, a typical pipeline reads the source, cleans it, aggregates it, and writes the final result all in one go. If a cleaning rule was wrong, or if a new analysis needs the data at a less transformed stage, everything has to be re-read from the source and redone from scratch. The medallion architecture keeps a copy at each stage, so only the work actually affected by a fix needs to be redone.

```text
Source (website, sensor, export...)
        |
        v
   [ BRONZE ]  raw copy, as received
        |
        v
   [ SILVER ]  cleaned, deduplicated, a stable schema
        |
        v
   [  GOLD  ]  aggregated, organized for a specific analysis
        |
        v
Dashboard / report
```

## Bronze: the raw copy

The **bronze** layer is a faithful copy of what was received from the source, with no transformation at all: the same column names as the original export, the same values (errors included), and nothing is ever deleted or corrected there. It acts as a safety net: if a cleaning rule applied later turns out to be wrong, you can always start over from bronze rather than requesting the data from the source again (which may have changed, or may no longer be available).

```text
Raw export received from the website (one row per click, as produced by the server):

id;product;qty;date
1;Keyboard;2;2025-03-01
2;;1;2025-03-01           -> empty product: error left as-is
2;Mouse;1;2025-03-01      -> duplicate id 2: left as-is
```

> **Pitfall:** correcting or filtering data as soon as it arrives in bronze. Once the error or duplicate is removed, the information "here's exactly what the source sent at this moment" is lost, and an analysis that would need to know that (tracing the origin of an export bug, for example) no longer has anything to examine.
>
> **Best practice:** write bronze as append-only: every new arrival is added, never replacing or modifying what already exists.

## Silver: cleaned and reliable

The **silver** layer applies the cleaning rules: duplicate rows removed, empty fields discarded or filled in according to an explicit rule, column types corrected (a date stored as text becomes a real date), column names harmonized if several different sources feed the same table. The result has a stable schema that other processes can rely on without surprises.

```sql
-- from the bronze layer above
INSERT INTO silver_sales (sale_id, product, quantity, sale_date)
SELECT id, product, qty, CAST(date AS DATE)
FROM bronze_sales
WHERE product IS NOT NULL AND product != ''   -- discards rows with no product
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY id ORDER BY date DESC
) = 1;                                        -- keeps only one row per duplicated id
```

> **Pitfall:** guessing a cleaning rule instead of documenting it explicitly. If "row with no product discarded" is written nowhere, the next person who picks up the pipeline has no way to know whether the absence of those rows in silver is intentional or a bug.
>
> **Best practice:** make every cleaning rule traceable (a comment in the transformation code, or a separate table that logs discarded rows and why), so you can answer "why did this row disappear?" months later.

## Gold: ready for a specific analysis

The **gold** layer aggregates and models the silver data for a specific business use: total sales by region, monthly churn rate, etc. This is typically where you find the [star schema](/?c=bases-de-donnees&p=modeles-en-etoile): a fact table and its dimensions, ready to be queried directly by a dashboard, with no need to know the cleaning steps that came before.

```sql
-- "gold" table: sales aggregated by product and by month, from silver
INSERT INTO gold_monthly_sales (product, month, total_quantity, total_amount)
SELECT product, DATE_TRUNC('month', sale_date), SUM(quantity), SUM(quantity * price)
FROM silver_sales
JOIN silver_products USING (product)
GROUP BY product, DATE_TRUNC('month', sale_date);
```

> **Pitfall:** creating one gold table per dashboard instead of per shared business need, which multiplies near-identical tables (one for every new report) and forces every small fix to be redone everywhere.
>
> **Best practice:** design each gold table for a reusable business need (e.g. "sales by month", usable by several dashboards), not for one specific screen.

## Overview

| | Bronze | Silver | Gold |
|---|---|---|---|
| Content | Raw copy, as received | Cleaned, deduplicated, typed | Aggregated, business-oriented |
| Schema | The source's own (can vary) | Stable and harmonized | Stable, designed for analysis |
| Modifiable? | Never (append-only) | Rewritten if the cleaning rule changes | Rewritten if the business need changes |
| Who queries it | The pipeline itself | Other pipelines, rarely a human | Dashboards, reports, analysts |

## A common mistake: letting a dashboard read bronze or silver

Nothing technically prevents a reporting tool from connecting directly to bronze or silver instead of gold.

> **Pitfall:** connecting a dashboard to silver (or bronze) because "the data I need is already there." The dashboard then ends up redoing the business aggregation itself, duplicated in every tool that does the same, and a business rule fix has to be applied everywhere instead of in one place.
>
> **Best practice:** keep gold as the single entry point for anything consuming the data outside the pipeline itself; if a business need is missing, create or extend a gold table rather than working around it through silver.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The medallion architecture splits a data pipeline into three successive copies: bronze (raw, untouched), silver (cleaned, stable schema), gold (aggregated for a specific business need, often modeled as a [star schema](/?c=bases-de-donnees&p=modeles-en-etoile)). |
| **Available Tools** | Transformation [SQL](/?c=domain-specific-languages-dsl&p=sql) queries (`INSERT ... SELECT`, deduplication via `ROW_NUMBER()`, aggregation via `GROUP BY`) to move a table from one layer to the next. |
| **Pitfalls to Avoid** | Correcting or filtering as early as bronze; applying an undocumented cleaning rule; creating one gold table per dashboard; connecting a reporting tool directly to bronze or silver. |
| **Best Practices** | Bronze as append-only; traceable cleaning rules; gold tables designed for a reusable business need; gold as the single entry point for consumers outside the pipeline. |
