---
order: 9
---

# Redis: The In-Memory Key-Value Store

A traditional database (see [Databases](/?c=bases-de-donnees)) writes its data to disk: it survives a restart, but every read or write has to go through that disk, which is slower than RAM (random-access memory). **Redis** is a **key-value store** (each piece of data is associated with a unique key, like in a dictionary) that keeps everything **in RAM** by default: access times drop to microseconds instead of milliseconds, at the cost of losing data if the process stops without any particular precaution (see persistence below).

```text
Traditional relational database:  Application --> query --> Disk --> response
                                   (every access goes through disk)

Redis:                            Application --> query --> RAM --> response
                                   (disk only comes in as an option, to avoid losing everything)
```

## The supported data structures

Unlike a simple cache that would only associate a string with a key, Redis understands several forms of values, each suited to a specific need:

| Structure | What it holds | Example use |
|---|---|---|
| **String** | A string or a number | View counter, session token |
| **List** | An ordered sequence of values | Queue of tasks to process |
| **Hash** | A set of named fields, like a mini-object | A user profile's properties |
| **Set** | A set of unique values, with no order | The tags attached to an article |
| **Sorted set** | A set of unique values, ranked by score | A leaderboard (score, playtime) |

## Typical use cases

### Application caching

The most common case: avoiding a costly computation or query by keeping its result within reach for a limited time, a principle already introduced in [High-Traffic Databases](/?c=bases-de-donnees&p=bases-de-donnees-a-fort-trafic).

```text
1. The application receives a request
2. It first checks Redis with the corresponding key
   -> Present (cache hit)  : immediate response, disk never touched
   -> Absent  (cache miss) : query sent to the relational database,
                               then the result written to Redis for next time
```

This pattern, where the cache is only checked and filled on demand, has a name: the ***cache-aside*** pattern.

### Session storage, queues, pub/sub

- **Session storage**: a logged-in user's information (identifier, permissions) is read on every request; keeping it in RAM rather than in a relational database avoids a disk query on every page.
- **Lightweight queue**: a `List` acts as a buffer between a service that produces tasks and another that processes them, without depending on a heavier dedicated queue system.
- **Pub/sub** (*publish/subscribe*): a service publishes a message on a named channel, and every service subscribed to that channel receives it immediately, with no direct link between them.

## TTL: a key that self-destructs

A **TTL** (*Time To Live*) is an optional lifespan attached to a key: once it elapses, Redis deletes the key on its own. This is what makes Redis well suited to caching: instead of having to manually delete data that has become stale, you give it an expiration date as soon as it's created.

## Persistence: RDB and AOF

Redis remains, first and foremost, an in-memory tool, but it offers two optional mechanisms to survive a restart:

| Mechanism | Principle | Trade-off |
|---|---|---|
| **RDB** (*Redis Database*) | A full snapshot of memory, written to disk at regular intervals | Fast to restore, but loses any writes made since the last snapshot |
| **AOF** (*Append Only File*) | Every write is also logged to disk, in the order it arrives | Loses much less data in the event of a crash, but the file is larger and restoring it is slower |

> **Pitfall:** using Redis with neither RDB nor AOF to store data you can't afford to lose (e.g. a shopping cart that hasn't been checked out yet). Without persistence enabled, a simple process restart wipes everything.

## Scaling up: replication and Redis Cluster

As with a relational database, two mechanisms let you go beyond a single server's capacity: **replication** (one or more read-only copies of a primary server, to spread out reads and survive its loss) and **Redis Cluster**, which splits the keys themselves across several servers (sharding), to exceed the RAM of a single machine.

## Redis is not a relational database

Redis doesn't replace a database like the ones covered in [Databases](/?c=bases-de-donnees): no joins between multiple structures, no complex queries like [SQL](/?c=domain-specific-languages-dsl&p=sql), and a storage capacity limited by available RAM rather than by disk space. It complements an existing database for access that needs to be immediate; it doesn't replace it for data that needs to remain exhaustive and durable.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Redis is a key-value store that keeps its data in RAM by default, for very fast access. It supports several structures (string, list, hash, set, sorted set), a TTL for automatic expiration, and optional persistence (RDB, AOF). |
| **Tools you can use** | RDB/AOF for persistence; replication and Redis Cluster for scaling up. |
| **Pitfalls to avoid** | Storing critical data without persistence enabled; expecting Redis to provide relational database capabilities (joins, complex queries). |
| **Best practices** | Reserve Redis for caching, sessions, or scenarios needing minimal latency; always set a TTL on cached data to avoid it silently becoming stale. |
