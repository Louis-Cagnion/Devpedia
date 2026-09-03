---
order: 10
---

# Elasticsearch: The Document-Oriented Search Database

A relational database (see [Databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) organizes data into tables, rows, and columns, linked by joins. **Elasticsearch** organizes data differently: each record is a complete JSON **document**, stored in an **index** (the equivalent of a table), and the engine is built from the ground up for **full-text search** rather than joins.

| | Relational database (SQL) | Redis | Elasticsearch |
|---|---|---|---|
| Unit of data | A row, in a table with fixed columns | One value per key (see [Redis](/?c=donnees&s=bases-de-donnees&p=redis)) | A JSON document, inside an index |
| Strength | Joins, transactional consistency | In-memory access speed | Full-text search, typo tolerance |
| Queries | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) | Commands per data structure type | Queries written in JSON (*Query DSL*) |

## A document, an index

```json
// Document indexed under the "vehicles" index
{
  "make": "Peugeot",
  "model": "308",
  "year": 2022,
  "description": "Compact sedan, low mileage, up-to-date maintenance"
}
```

Unlike a SQL table, two documents in the same index don't need to have exactly the same fields: Elasticsearch infers each field's type (text, number, date...) the first time it's inserted, and the index it builds for that field depends on the inferred type.

## Querying with the Query DSL

A query isn't a SQL-style string, but a JSON object sent to the server:

```json
// Search for "sedan" in the description, limited to listings under $20,000
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "sedan" } }
      ],
      "filter": [
        { "range": { "price": { "lte": 20000 } } }
      ]
    }
  },
  "from": 0,
  "size": 20
}
```

| Clause | Role |
|---|---|
| `match` | Full-text search, tolerates word variants (accents, plurals depending on the configured language) |
| `filter` | An exact condition (range, equality), without affecting the relevance score |
| `from` / `size` | Pagination: `from` = how many results to skip, `size` = how many to return |

## Fuzzy matching: tolerating typos

A regular `match` can enable **typo tolerance** (*fuzziness*): "peugot" still matches "peugeot", within an edit distance (number of letters to change) set by the parameter.

```json
{ "match": { "model": { "query": "peugot", "fuzziness": "AUTO" } } }
```

> **Pitfall:** enabling fuzzy matching on a field that's supposed to hold an exact value from a facet (a "Brand" dropdown, say, where the user can only pick already-valid values). Fuzzy matching becomes too permissive there: it can surface "Renault" for a "Peugeot" search if the edit distance falls below the threshold, an absurd result for a closed-choice field.
>
> **Best practice:** reserve fuzzy matching for free-text fields actually typed by a human (a description, a natural-language search); on a closed-value field (facet, filter), use an exact match (`term`), never `match` with fuzziness.

## Aggregations: counting and grouping without joins

An **aggregation** computes a statistic over all the documents matching a query, in the very same response as the results themselves:

```json
// How many listings per brand, among the filtered results above
{
  "aggs": {
    "by_brand": {
      "terms": { "field": "make.keyword" }
    }
  }
}
```

This is the equivalent of a SQL `GROUP BY`, but computed directly on the search index rather than through a join between tables.

## Painless: customizing sort order server-side

**Painless** is a small scripting language executed on the Elasticsearch server, used when the default sort (text relevance, or a simple field) isn't enough:

```json
// Sort by a custom score: rating x number of reviews, rather than rating alone
{
  "sort": {
    "_script": {
      "type": "number",
      "script": { "source": "doc['rating'].value * doc['review_count'].value" },
      "order": "desc"
    }
  }
}
```

## Bulk importing: the Bulk API

Inserting one document at a time (one network request per document) becomes very slow on an import of several thousand records. The **Bulk API** groups many operations (insert, update, delete) into a single network call:

```text
One document at a time:   1000 documents -> 1000 network requests
Bulk API (batches of 500): 1000 documents -> 2 network requests
```

> **Pitfall:** keeping document-by-document inserts on a large import "because it already works": the bottleneck is almost never Elasticsearch itself, but the number of network round-trips (see [Reducing round-trips](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)).
>
> **Best practice:** use the Bulk API in batches (a few hundred to a few thousand documents per call depending on their size), rather than one request per document.

---

## 📋 Key Takeaways

| | |
|---|---|
| **Key Points** | Elasticsearch stores JSON documents in indices, built for full-text search rather than joins. Queries are written in JSON (Query DSL); aggregations compute statistics without joins; Painless allows custom server-side sorting. |
| **Available Tools** | `match` (full-text, with optional fuzziness), `filter`/`term` (exact value), `aggs` (aggregations), Painless scripts, Bulk API for mass imports. |
| **Pitfalls to Avoid** | Enabling fuzzy matching on a closed-value field (facet); importing document by document instead of in batches. |
| **Best Practices** | Reserve `match`/fuzziness for free text, `term` for facets; use the Bulk API in batches for any large import. |
