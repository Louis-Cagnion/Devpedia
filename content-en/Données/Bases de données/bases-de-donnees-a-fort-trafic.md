---
order: 8
---

# High-traffic databases: never block the user on a costly recalculation

A query that responds in milliseconds on a small table can become a bottleneck once data and traffic multiply: if every page visit re-runs that same costly query live, the user's response time depends directly on how slow it is. This chapter covers the techniques that avoid this blocking, already introduced by the general principle of [never recalculating a result nothing could have changed since](/?c=performance&p=eviter-le-recalcul-redondant), applied here specifically to a high-traffic database.

## A concrete case: a multi-minute query behind a simple filter

A page displays a list of filter options (available regions, product categories...), computed by a query that scans an entire table of several million rows, with no date filter. On a small dataset, this query responds in under a second; once the table grows large, the same query can take several **minutes**. If it runs on every page load, every user waits those minutes live for information that rarely changes anyway.

> **Pitfall:** recalculating a costly value on every user request simply because the query is correct and produces the right result. A correct query can still be a bad idea if its cost is disproportionate to how fresh its result actually needs to be.
>
> **Best practice:** before optimizing the query itself (indexes, SQL rewrite), first ask whether the result really needs recalculating on every visit, or whether it can be cached.

## Cache and stale-while-revalidate

The most direct technique: compute the result once, store it, then serve that cached value instead of re-running the computation on every request.

```text
Without cache:                        With cache + 6h TTL:

User request                          User request
  -> full recalculation (minutes)       -> cache read (milliseconds)
  -> response                           -> immediate response
                                       Every 6h: recalculation in the background
```

**TTL** (*Time To Live*) sets how long a cached value stays considered valid before being recalculated. The TTL choice depends on how often the data actually changes: filter options that rarely evolve can tolerate a TTL of several hours, a value that changes every minute needs a much shorter one.

**Stale-while-revalidate** goes further than a simple cache: once the TTL expires, the stale value is still served immediately to the user, while a background task recalculates the new value for subsequent requests.

| | Simple cache (strict TTL) | Stale-while-revalidate |
|---|---|---|
| On TTL expiry | The next request waits for the full recalculation | The next request receives the old value immediately |
| Perceived freshness | Always up to date at the cost of periodic slowdowns | Occasionally slightly stale, never slow |

> **Best practice:** use stale-while-revalidate when a slightly stale value (from a few minutes to a few hours depending on the case) remains acceptable to the user, which is true of most data that doesn't represent a real-time financial or security state.

## Read replicas

A **read replica** is a copy of the database, continuously synced from the primary database, dedicated exclusively to read queries. Writes keep going to the primary database; reads, often far more numerous, are spread across one or more replicas:

```text
Writes  ->  Primary database
                    |
                    | continuous sync
                    v
Reads   ->  Replica 1, Replica 2, Replica 3...
```

This keeps a costly read from slowing down writes (and vice versa), and lets you add more replicas as read volume grows, without touching the primary database.

> **Pitfall:** reading immediately after a write from a replica that hasn't yet received the latest sync (*replication lag*): the user may then not see the data they just saved themselves.
>
> **Best practice:** read from the primary database right after a write that must be immediately visible to the same user, and reserve replicas for reads that can tolerate a slight delay.

## Queues and asynchronous processing

For a heavy write or recalculation (generating a report, resizing an image, sending a batch of emails), making the user wait until processing finishes blocks their request for no good reason. A **queue** decouples the request from its processing: the user's request drops a task into the queue and gets an immediate response, while a separate process (a *worker*) processes queued tasks at its own pace.

```text
User request -> drops a task into the queue -> immediate response
                                    |
                                    v
                        Worker processes the task in the background
                                    |
                                    v
                        User notified once done (or checks the status)
```

## Pagination and streaming instead of a full result

Loading an entire large result at once (tens of thousands of rows) consumes memory and transfer time proportional to that volume, even if the user only looks at a fraction of it. Two techniques avoid that cost:

| Technique | Principle |
|---|---|
| **Pagination** | Split the result into fixed-size pages, load only one at a time |
| **Streaming** | Send the result as it's produced, rather than waiting for it to be complete before starting to transmit it |

## Connection pooling

Opening a connection to a database has a non-trivial cost (authentication, establishing the network link). A **connection pool** maintains a set of already-open, ready-to-use connections, reused from one request to the next instead of being recreated every time.

> **Pitfall:** opening a new connection on every request under high traffic. The opening cost, negligible in isolation, becomes significant once multiplied by a large number of simultaneous requests, and can even exhaust the maximum number of connections the database accepts.
>
> **Best practice:** configure a connection pool sized to the actual traffic, rather than letting every request manage its own connection.

## Sharding and partitioning

**Partitioning** splits a large table into several smaller segments based on a criterion (a date range, a geographic zone...), while keeping it on the same database server. **Sharding** goes further: it spreads those segments across physically different servers, allowing capacity beyond a single machine.

```text
Partitioning (1 server):               Sharding (several servers):

Table                                   Server A: shard 1 (customers A-M)
  - Partition 2024                      Server B: shard 2 (customers N-Z)
  - Partition 2025
  - Partition 2026
```

These two techniques are only worth it once the previous approaches (cache, replicas, queues) are no longer enough: they add real complexity (a query that spans several partitions or several shards becomes harder to write and optimize).

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A correct query can still be a bad idea if it's recalculated live on every visit while its result rarely changes. Cache/stale-while-revalidate, read replicas, queues, pagination/streaming, connection pooling, and sharding are complementary answers to this problem, not competing ones. |
| **Usable tools** | A cache with TTL and stale-while-revalidate for data that tolerates slight staleness. A queue for heavy processing that shouldn't block the user's request. A connection pool sized to actual traffic. |
| **Pitfalls to avoid** | Recalculating costly data on every request out of habit. Reading a replica right after a write that must be immediately visible. Opening a new connection on every request under high traffic. |
| **Best practices** | Cache any costly result whose perfect freshness isn't essential. Reserve sharding/partitioning for cases where cache, replicas, and queues are no longer enough. |
