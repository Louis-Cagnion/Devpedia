---
order: 3
---

# The Bridge Table

In the [star schema](/?c=bases-de-donnees&p=modeles-en-etoile), each row of the fact table points to a single row of each dimension: a sale has one product, one customer, one date. But some relationships aren't that simple: a single sale might have benefited from several promotions at once. A single `promotion_id` column in `sales_fact` can only hold one value, so this case doesn't fit the model as-is.

## The problem: a "many-to-many" relationship

A sale can stack several promotions, and a single promotion applies to several different sales: this is a **many-to-many** relationship, the opposite of the usual one-to-many relationship between a dimension and the fact table (a product can appear in several sales, but each sale has only one product).

```text
Usual relationship (one-to-many):
product_dim  1 ---- N  sales_fact     (one product, several sales; one sale, a single product)

Relationship to resolve (many-to-many):
sales_fact  N ---- N  promotion_dim   (one sale, several promotions; one promotion, several sales)
```

## The bridge table: one row per association

The **bridge table** resolves this case by inserting an intermediate table between the fact table and the dimension involved. Each row of the bridge table associates a fact identifier with a dimension identifier; a sale with two promotions simply produces two rows in the bridge table, one per promotion.

```sql
CREATE TABLE sales_fact (
    sale_id     INT PRIMARY KEY,
    product_id  INT,
    amount      DECIMAL(10, 2)
);

CREATE TABLE promotion_dim (
    promotion_id  INT PRIMARY KEY,
    label         VARCHAR(100),
    percentage    DECIMAL(4, 2)
);

CREATE TABLE sales_promotions_bridge (
    sale_id       INT,   -- foreign key → sales_fact
    promotion_id  INT    -- foreign key → promotion_dim
);
```

```text
Sale 1 ($100) benefited from promotions 10 and 20:

sales_promotions_bridge
sale_id | promotion_id
--------|-------------
1       | 10
1       | 20
```

## The classic pitfall: double counting

A naive `JOIN` between `sales_fact` and `sales_promotions_bridge` produces one row per association, not one row per sale. A $100 sale with two promotions appears twice in the result: summing it directly doubles the amount.

```sql
-- pitfall: this query counts sale 1 twice (once per promotion), so $200 instead of $100
SELECT SUM(f.amount)
FROM sales_fact f
JOIN sales_promotions_bridge p ON p.sale_id = f.sale_id;
```

> **Pitfall:** directly summing a column from the fact table after a `JOIN` on a bridge table. The number of rows explodes (one per association), and any sum or average computed on it is skewed by this duplication.
>
> **Best practice:** either count distinct sales (`SUM(DISTINCT ...)` or a subquery that aggregates first), or split the amount across promotions using an explicit weighting column in the bridge table (e.g. `weight` at 0.5 for each of two promotions, so the weights sum to 1 per sale).

```sql
CREATE TABLE sales_promotions_bridge (
    sale_id       INT,
    promotion_id  INT,
    weight        DECIMAL(4, 2)   -- share of the amount attributed to this promotion (sums to 1 per sale)
);

-- with weighting, the sum becomes correct again: $100 split into $50 + $50, not $100 + $100
SELECT SUM(f.amount * p.weight)
FROM sales_fact f
JOIN sales_promotions_bridge p ON p.sale_id = f.sale_id;
```

## Overview

| | Regular dimension | Bridge table |
|---|---|---|
| Relationship with the fact table | One-to-many | Many-to-many |
| A row represents | A value of the analysis axis | An association between a fact and a dimension value |
| Risk on `JOIN` | None (a fact row stays a fact row) | Fact row duplication (one per association) |
| Aggregation | Direct `SUM`/`AVG`, no risk | Requires weighting or distinct counting |

## Recognizing when you need a bridge table

> **Pitfall:** adding a second foreign key column (`promotion_id_1`, `promotion_id_2`) to the fact table to handle "up to two promotions." This arbitrary limit breaks as soon as a sale has three, and every added column complicates all the queries that now have to check several columns instead of one.
>
> **Best practice:** as soon as a dimension can have several valid values for the same fact (promotions, tags, multiple categories), go through a bridge table rather than repeated columns. The number of possible associations per fact then becomes unlimited, without changing the schema.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The bridge table resolves a many-to-many relationship between the fact table and a dimension, by storing one row per association rather than a direct foreign key. |
| **Available Tools** | `JOIN` to the bridge table; a weighting column (`weight`) to split a measure across several associations without duplicating it. |
| **Pitfalls to Avoid** | Summing a measure from the fact table after a `JOIN` on a bridge table with no weighting (double counting); multiplying foreign key columns to simulate a many-to-many relationship. |
| **Best Practices** | Use a bridge table as soon as a fact can have several values for the same dimension; include a weighting column when a measure needs to be split across associations. |
