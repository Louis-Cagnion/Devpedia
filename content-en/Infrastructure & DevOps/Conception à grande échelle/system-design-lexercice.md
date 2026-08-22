---
order: 1
---

# "System design" as a kind of exercise

"Design Uber." "Design LeetCode." This type of prompt, very common in technical interviews, doesn't ask you to write code: it asks you to reason about the major building blocks that would make up the product, how they communicate, and why that choice rather than another at the targeted scale. This is a different exercise from the one covered by [Code quality and architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=qualite-et-architecture-du-code): that one is about the quality of code already written, "system design" is about choices made **before** writing a single line of code, at a level where only components (client, server, database...) and their exchanges are drawn, as boxes connected by arrows.

## The typical structure of a system design exercise

| Step | Question it answers |
|---|---|
| 1. Frame the need and the scale | How many users, how many requests per second, what ratio of reads to writes? |
| 2. Draw the overall architecture | Which components (client, servers, databases, cache...) and how they communicate, without detailing them yet |
| 3. Go deeper on 1 or 2 critical components | What's the hardest part of the system, and how do you solve it precisely? |
| 4. Discuss the trade-offs | What does this choice sacrifice (cost, complexity, data consistency) in exchange for what it provides? |

> **Pitfall:** looking for "the" right answer to a system design exercise. There isn't just one: the right answer depends entirely on the assumptions made in step 1 (the targeted scale radically changes which architecture is relevant). Two different answers can both be correct, if each one clearly assumes a different scale.
>
> **Best practice:** always state your starting assumptions explicitly (number of users, requests per second) before proposing an architecture, rather than drawing boxes directly without ever specifying what scale they're designed for.

## Example: "Design Uber"

Applying the 4 steps to a simplified need (locating drivers, matching them with a rider):

```text
Rider                              Driver
   |  requests a ride                  |  sends their position
   v                                   v
   Matching server            <----- Position updated continuously
   |
   |  looks up the closest drivers
   v
   Position database (geospatial index)
```

Two points deserve a deeper look (step 3):

- **Continuously updating a driver's position**: a classic request/response connection would force the phone to keep asking "is there anything new?" over and over; a [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) connection avoids this waste by keeping a link open, through which the server pushes each update as soon as it happens.
- **Finding the drivers closest to a rider**: a classic [index](/?c=donnees&s=bases-de-donnees&p=les-index) speeds up a search by equality or by range on a column, but "the points closest to a coordinate" is a different question. A **geospatial index** (for example a [geohash](https://en.wikipedia.org/wiki/Geohash) or a quadtree-type structure) answers this specific type of search, by splitting up the geographic space into zones so that only a small number of plausible candidates need to be compared, rather than every known position.

## Example: "Design LeetCode"

Same method, applied to a platform that runs code submitted by its users:

```text
User submits code
   |
   v
Submission queue  <-- same principle as "Queues and
   |                    asynchronous processing" (high traffic)
   v
Worker: runs the code in an isolated environment
   |
   v
Result stored, user notified
```

The trickiest point here (step 3): **running code provided by a stranger without endangering the rest of the platform**. The answer relies on a principle already seen elsewhere on Devpedia: isolate the execution in a sandboxed environment, such as a disposable [Docker container](/?c=infrastructure-devops&s=docker&p=concepts-de-base), destroyed after each run, with no access to the rest of the system. The queue that absorbs submission spikes follows exactly the same principle already detailed in [High-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic): decoupling the request from its processing rather than making the user wait.

## Once the architecture is set: how to split it into services

Once the major building blocks are identified (steps 1-2), a choice remains open: group them into a single program, or split them into several independent [microservices](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices). That choice belongs to its own dedicated chapter: system design identifies **which** components are needed and how they fit together, not necessarily **how** to split them into separate programs.

## 📋 Summary

| | |
|---|---|
| **To remember** | System design reasons about a system's major building blocks (components, exchanges, scale) before writing code, in 4 steps: frame the scale, draw the overall architecture, go deeper on critical points, discuss the trade-offs. |
| **Usable tools** | WebSocket for a continuous stream of updates; a geospatial index for a proximity search; a queue to absorb spikes in demand; an isolated container to run untrusted code. |
| **Pitfalls to avoid** | Looking for "the" right architecture without ever specifying the targeted scale. |
| **Best practices** | Always state your scale assumptions before proposing an architecture. |
