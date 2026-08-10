---
order: 3
---

# Cutting Round Trips

When two components communicate (your code and a database, your code and a browser, a client and a server), every exchange has a **fixed cost** independent of the amount of data carried: serialization, crossing a process boundary, network latency. This cost is small — a few milliseconds — and that's exactly what makes it dangerous: it becomes huge through multiplication.

## The pattern to recognize

The symptom is always the same: a loop that, on every iteration, asks the other component for something again.

```python
# 3 round trips per listing
for i in range(number_of_cards):
    card = page.element(i)                # 1
    link = card.attribute("href")         # 2
    text = card.text()                    # 3
```

Over 100 elements, that's 300 exchanges. At 30 ms per round trip, that's 9 seconds — for work that requires no computation at all.

## Bringing everything back at once

The fix is to move the loop **to the side where the data lives**, and make only a single exchange:

```python
# 1 round trip, regardless of the number of listings
cards = page.evaluate("""() => Array.from(document.querySelectorAll('article')).map(card => ({
    href: card.querySelector('a')?.getAttribute('href'),
    text: card.innerText,
}))""")

for card in cards:                        # local processing, free
    analyze(card["href"], card["text"])
```

The gain is **proportional to volume**: negligible on 10 elements, decisive on 1000. This optimization is often justified less by the immediate gain than by the fact that it removes a slope: the program stops slowing down linearly as the data grows.

## It's the same problem as N+1 in a database

This pattern has a name in the database world: the **N+1 problem**. One query to fetch a list, then one query per element:

```php
$customers = $db->query("SELECT id, name FROM customers")->fetchAll();
foreach ($customers as $customer) {
    // 1 SQL query per customer: there's the "+N"
    $orders = $db->query("SELECT * FROM orders WHERE customer_id = {$customer['id']}");
}
```

The fix is structurally identical — a single exchange that brings back everything:

```sql
SELECT c.id, c.name, o.*
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```

See the [SQL](/?c=domain-specific-languages-dsl&p=sql) section for joins, and PHP's [Connections](/?c=langages-de-programmation&s=php&p=connexions) chapter for `PDO`.

> Along the way, writing one query per element by concatenating a variable into the SQL string stacks two problems: slowness **and** SQL injection. Prepared statements fix the second, the join fixes the first.

## The same reasoning elsewhere

The pattern shows up anywhere there's a boundary to cross:

- **HTTP API**: prefer an endpoint that accepts a list of IDs rather than calling the single-item endpoint *n* times;
- **File system**: read a file all at once rather than character by character (that's the role of buffers, see [System Calls and File Descriptors](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) in C);
- **DOM**: accumulate changes then apply them, rather than modifying the document inside a loop — every write can trigger a layout recalculation.

## Knowing when not to do it

Bringing everything back at once has a limit: **memory**. A query that pulls back a million rows at once can saturate the process's memory, whereas the naive loop, while slow, held up. Between the two extremes sits **batch** processing: a thousand elements per exchange rather than one or a million.

```python
for batch in split_into_batches(ids, size=1000):
    results = service.fetch_many(batch)
```

The right question isn't therefore "a single exchange or *n*?" but "what's the largest batch I can process safely?".

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Every exchange between two components (network, database, DOM) has a fixed cost independent of volume — a loop that asks for something again on every iteration ("N+1") multiplies that fixed cost by the number of elements. |
| **Tools you can use** | Bringing all the data back in a single exchange (SQL join, batched evaluation on the page side), batch processing for very large volumes. |
| **Pitfalls to avoid** | One query per element inside a loop (N+1 problem); bringing back a volume so large it saturates the process's memory. |
| **Best practices** | Move the loop to the side where the data lives rather than making repeated round trips; split into reasonably sized batches between "a single exchange" and "one per element". |
