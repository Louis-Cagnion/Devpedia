---
order: 8
---

# A Managed Runtime's Heap

The C chapter on [memory management](/?c=langages-de-programmation&s=c&p=memoire) distinguishes the stack (automatic) from the heap (manual, `malloc`/`free`). A managed runtime — the [JVM](https://docs.oracle.com/en/java/) (Java/[Elasticsearch](https://www.elastic.co/elasticsearch)/[Kafka](https://kafka.apache.org)...), the .NET [CLR](https://learn.microsoft.com/en-us/dotnet/standard/clr), Node.js's [V8](https://v8.dev) engine — also has a heap, but with a different meaning: it's **the entire memory area reserved for dynamically allocated objects**, managed automatically by a garbage collector rather than through explicit calls. The developer neither allocates nor frees it themselves; they only set its size.

## A size that's often auto-detected, not always well suited

Absent explicit guidance, most managed runtimes pick a default heap size based on the RAM available on the machine — a heuristic designed for a dedicated server running at full load, not for occasional local use. Elasticsearch's JVM, for instance, defaults to targeting up to 50% of the system's RAM: on a 32 GB machine, that reserves 16 GB at startup, which actual usage (a local instance, little data) doesn't justify.

Two concrete effects of a heap oversized relative to actual need:

- **Less RAM for the OS's disk cache.** An engine like Elasticsearch (built on [Lucene](https://lucene.apache.org)) relies heavily on the system's file cache for read performance — a heap that hogs half the RAM leaves that much less room for this cache, and can push the system toward swapping.
- **A garbage collector slower to warm up.** The larger the heap, the more work the first garbage collection cycles have to do to establish their internal statistics — an effect felt mostly at startup, before cruising speed kicks in.

## Setting the size explicitly

Most managed runtimes expose an explicit setting for heap size (`-Xmx`/`-Xms` for the JVM, for instance) — capping this size to what actual usage requires, rather than letting the default heuristic reserve a fraction of all available RAM, avoids both effects above. This is what a script like `start-elasticsearch.ps1` does by imposing 1 GB by default (`-HeapSize` to adjust) instead of the auto-detected 16 GB: plenty for local use, and a noticeably faster startup.

> **Note:** unlike the C heap, where too small a size causes an immediate, visible allocation failure (`malloc` returns `NULL`), a managed heap that's too small instead shows up as more frequent garbage collection cycles, or even an `OutOfMemoryError` if even the memory that can be freed isn't enough — a gradual degradation rather than a clean failure.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A managed runtime (JVM, CLR, V8) reserves a heap sized automatically based on available RAM, not on actual need — often oversized for local use. |
| **Tools you can use** | Explicit heap size settings (`-Xmx`/`-Xms` for the JVM). |
| **Pitfalls to avoid** | Letting the default heuristic reserve a large fraction of RAM on a development machine — less disk cache, a garbage collector slower to warm up. |
| **Best practices** | Explicitly cap heap size to what actual usage requires, rather than keeping the auto-detected value. |
