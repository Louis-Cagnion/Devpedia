---
order: 1
---

# The Star Schema

The [SQL](/?c=domain-specific-languages-dsl&p=sql) chapter treats every table as an isolated spreadsheet. As soon as you want to analyze a complete history (years of sales, for example), you deliberately organize several tables around each other following a precise schema: the **star schema**, the most common layout in a data warehouse.

## OLTP vs. OLAP: two uses, two organizations

A typical application database (the one that records an order when a customer clicks "Buy") is optimized for fast, frequent writes, one row at a time: this is **OLTP** (*Online Transaction Processing*). A data warehouse is optimized for the opposite: few writes, but reads that scan millions of rows at once ("total sales by region over the last three years"): this is **OLAP** (*Online Analytical Processing*). The star schema is a layout designed for OLAP.

| | OLTP (application) | OLAP (data warehouse) |
|---|---|---|
| Typical operation | Insert an order | Aggregate three years of sales |
| Volume per query | A handful of rows | Millions of rows |
| Priority | Fast writes, no duplicates | Fast reads, even at the cost of duplication |

## The fact table: what you measure

The **fact table** contains the measurable events: one row per sale, for example, with numeric columns (amount, quantity) and foreign keys to each analysis axis.

```sql
CREATE TABLE sales_fact (
    product_id   INT,   -- foreign key → product_dim
    customer_id  INT,   -- foreign key → customer_dim
    date_id      INT,   -- foreign key → date_dim
    amount       DECIMAL(10, 2),
    quantity     INT
);
```

## The dimension table: which angle you're looking from

A **dimension table** describes one of the axes you want to view the facts through: the product sold, the customer, the date. It carries the descriptive columns (name, category, city...) used to filter or group.

```sql
CREATE TABLE product_dim (
    product_id  INT PRIMARY KEY,
    name        VARCHAR(100),
    category    VARCHAR(50)
);
```

## Why "star": the layout

One fact table at the center, one dimension table on each branch: laid out flat, the shape resembles a star.

```text
                date_dim
                    |
customer_dim ---- sales_fact ---- product_dim
                    |
               store_dim
```

An analytical query ("total sales by product category, in 2025") now only needs a `JOIN` (see [SQL](/?c=domain-specific-languages-dsl&p=sql)) between the fact table and each relevant dimension, never a long chain of joins across dozens of tables:

```sql
SELECT p.category, SUM(f.amount) AS total
FROM sales_fact f
JOIN product_dim p ON p.product_id = f.product_id
JOIN date_dim d ON d.date_id = f.date_id
WHERE d.year = 2025
GROUP BY p.category;
```

## The trade-off: deliberate denormalization

An OLTP database avoids repeating the same information across multiple rows (**normalization**): each fact is written exactly once, to avoid inconsistencies if it needs correcting. A dimension makes the opposite choice: it **denormalizes** on purpose, for example repeating the product's category on every row of `product_dim` rather than storing it in a separate `category_dim` table.

| | Normalized (OLTP) | Denormalized (dimension) |
|---|---|---|
| Duplication | Minimal | Accepted |
| Writing | Fast, no possible inconsistency | Slower to correct (several rows to update) |
| Reading | Requires several `JOIN`s | A single `JOIN` is enough |

> **Pitfall:** judging a denormalized dimension as "poorly designed" using OLTP instincts (looking for duplication). The duplication there is a deliberate choice: the data warehouse is rewritten in batches (once a night, for example), not row by row like an application, so the inconsistency that normalization avoids doesn't carry the same cost.
>
> **Best practice:** judge a table by the use it serves (frequent single-row writes vs. massive reads), not by a universal design rule.

## Surrogate key rather than natural key

A **natural key** is an identifier that already exists in the real world (a product reference, a social security number). A **surrogate key** is an integer generated solely to serve as a key, with no meaning outside the database (the `product_id` from the examples above).

> **Pitfall:** using a natural key as a dimension key. If the source system ever changes that reference (renumbering a product catalog, merging two customer identifiers), every fact row pointing to it ends up orphaned.
>
> **Best practice:** generate a surrogate key specific to the warehouse for each dimension, and keep the natural key only as one descriptive column among others. It stays stable even if the source system changes its own identifiers.

## A variant worth knowing: the snowflake schema

The **snowflake schema** pushes normalization one step further, inside the dimensions themselves: `product_dim` points to a separate `category_dim` table instead of repeating the category on every row.

| | Star | Snowflake |
|---|---|---|
| Dimensions | Denormalized (a single table per axis) | Normalized (dimension split into sub-tables) |
| Disk space | More duplication | Less duplication |
| Query | One `JOIN` per dimension | One more `JOIN` per sub-dimension |

> **Best practice:** start with the star schema by default (simpler to query); only move to snowflake if the disk space or maintenance of a very large dimension concretely justifies it, not out of a general principle of normalization.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The star schema organizes a data warehouse around a fact table (the measures) connected to dimension tables (the analysis axes), the opposite of a normalized OLTP database. |
| **Available Tools** | `JOIN` and `GROUP BY` in SQL to query a fact table along one or more dimensions. |
| **Pitfalls to Avoid** | Judging a denormalized dimension with OLTP instincts; using a natural key (which may change) as a dimension key. |
| **Best Practices** | Generate a surrogate key specific to the warehouse for each dimension; keep the star schema by default, only move to snowflake if a concrete need justifies it. |
