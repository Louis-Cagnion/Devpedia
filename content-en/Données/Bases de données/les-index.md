---
order: 6
---

# Indexes

The OLTP/OLAP table in the [Star Schema](/?c=bases-de-donnees&p=modeles-en-etoile) chapter mentions reads that scan millions of rows. Without help, a database can only find the rows that satisfy a condition by examining them one by one: this is exactly what an **index** avoids.

## The problem: searching an unsorted table

Without an index, `WHERE product_id = 42` forces the database to read every row of the table, one by one, until it has found all the matching rows. This is a **full scan**: the search time increases with the number of rows in the table, even if only one matches the condition.

```text
Table without an index: 1,000,000 rows read to find the 3 rows where product_id = 42
```

## The index: a structure for finding without reading everything

An **index** is a separate structure that maps a column value to the exact location of the rows carrying it, a bit like the alphabetical index at the back of a book that gives you a word's page number directly instead of making you search page by page. Once an index is created on `product_id`, the database can jump straight to the relevant rows without reading the others.

```sql
CREATE INDEX idx_sales_fact_product ON sales_fact (product_id);
```

```text
Table with an index on product_id: the database consults the index, finds the location
of the 3 rows where product_id = 42 directly, without reading the other 999,997.
```

## The trade-off: faster reads, slower writes

An index isn't free: on every insert, update, or delete of a row, the database also has to update every index defined on that table, on top of writing the row itself. The more indexes a table has, the more expensive every write becomes.

| | Without an index | With an index |
|---|---|---|
| Reading (`WHERE`, `JOIN`) | Full scan, slow on a large table | Direct access, fast |
| Writing (`INSERT`/`UPDATE`/`DELETE`) | Fast (nothing extra to maintain) | Slower (the index has to be updated too) |
| Disk space | Minimal | An index takes up extra space |

This trade-off ties back to the OLTP/OLAP table in the star schema chapter: an OLTP database, which writes constantly, keeps its indexes to the strict minimum; an OLAP warehouse, which reads far more than it writes, can afford to add more of them.

## Pitfall: not indexing a fact table's foreign keys

> **Pitfall:** creating a fact table with its foreign keys to each dimension (`product_id`, `customer_id`, `date_id`), without placing an index on those columns. Every `JOIN` to a dimension (see [Star Schema](/?c=bases-de-donnees&p=modeles-en-etoile)) then ends up fully scanning the fact table, exactly the case the index is supposed to prevent.
>
> **Best practice:** systematically index a fact table's foreign key columns, since they serve as the entry point for nearly every analytical query that touches it.

## Pitfall: indexing without discernment

> **Pitfall:** placing an index on every column "just in case," or on a column with very few distinct values (a boolean `active` true/false, for example). In that last case, the index barely reduces the number of rows to examine (half the table is `true`), while it still costs something on every write.
>
> **Best practice:** index the columns actually used in a `WHERE`, a `JOIN`, or an `ORDER BY`, and favor those with many distinct values (an identifier, a date) over a simple true/false flag.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An index is a separate structure that lets you find rows without scanning the whole table, at the cost of slower writes and extra disk space on every insert, update, or delete. |
| **Available Tools** | `CREATE INDEX index_name ON table (column)` to speed up reads filtered or joined on that column. |
| **Pitfalls to Avoid** | A fact table with no index on its foreign keys (every `JOIN` scans everything); an index placed on a column with very few distinct values or "just in case" with no real use. |
| **Best Practices** | Systematically index a fact table's foreign keys; reserve indexes for columns that are actually filtered, joined, or sorted, with enough distinct values for the index to really narrow the search. |
