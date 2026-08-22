---
order: 2
---

# Autoscaling and load balancing

[High-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) details how to absorb heavy traffic **on the database side** (cache, replicas, sharding). This chapter covers the other half of the problem: how to absorb that traffic **on the application server side**, the servers that run the application's own code.

## The problem: a single server has limited capacity

An application server can only handle a finite number of simultaneous requests, limited by its computing power and memory. Two ways to increase that capacity:

| | Vertical scaling | Horizontal scaling |
|---|---|---|
| Principle | A more powerful machine (more CPU, more memory) | Several identical machines in parallel |
| Ceiling | Limited by the biggest machine available on the market | Nearly unlimited (just add another machine) |
| Cost of a failure | That single machine going down stops the whole service | Losing one machine among several doesn't stop the service |

Horizontal scaling is preferred as soon as significant traffic is expected, precisely because it has no fixed ceiling and tolerates a machine failing.

## The load balancer

Once several identical servers are available, each incoming request must be routed to one of them: that's the role of the **load balancer**, placed between users and servers.

```text
                    ┌──► Server 1
Users ──► Load balancer ──► Server 2
                    └──► Server 3
```

| Load-balancing strategy | Principle |
|---|---|
| *Round-robin* | Distributes requests to servers in turn, in order |
| *Least connections* | Sends the request to the server currently handling the fewest ongoing requests |

The load balancer also monitors each server's health (a **health check**, a test request sent periodically): a server that stops responding is automatically removed from rotation, with no human intervention, until it becomes available again.

> **Pitfall:** spreading a single user's requests across different servers while assuming each server keeps that user's information (their session) in memory. The [JWT and tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) chapter already covers this problem and its solution in detail: don't depend on a specific server's memory, precisely so that any server behind the load balancer can handle any request indifferently.

## Autoscaling: automatically adjusting the number of servers

Provisioning enough servers up front to absorb the highest imaginable traffic spike wastes money the rest of the time, when those servers sit largely underused. **Autoscaling** (automatic scaling) resolves this trade-off: the number of active servers adjusts automatically to actual load, measured continuously (CPU usage, number of pending requests...).

```text
Load measured continuously
   |
   ├─ crosses a threshold (e.g., CPU > 70% for 5 min)  -> adds a server
   |
   └─ drops back below a low threshold                 -> removes a server
```

A sudden traffic spike (a viral ad, a surge of orders) thus triggers the automatic addition of extra servers, then their removal once the spike subsides, without a human having to constantly monitor traffic or guess its intensity in advance.

> **Pitfall:** believing autoscaling reacts instantly. Starting a new server (allocating the machine, deploying the application to it, starting it up) takes time, from a few seconds to several minutes depending on the case: a spike sudden enough to double traffic in a few seconds can saturate existing servers before the new ones have finished starting up.
>
> **Best practice:** keep some spare capacity available at all times (never run existing servers at 100% of their capacity right before triggering the addition of a new one), and plan for graceful degradation (responding more slowly, disabling a secondary feature) rather than a complete outage if a spike outpaces scaling anyway.

## 📋 Summary

| | |
|---|---|
| **To remember** | Horizontal scaling (several identical servers) rather than vertical (one bigger machine) makes it possible to absorb significant traffic with no fixed ceiling. A load balancer distributes requests across these servers and automatically removes any that stop responding. Autoscaling adjusts their number to actual load, measured continuously. |
| **Usable tools** | A load balancer with built-in health checks; an autoscaling service provided by most [cloud providers](/?c=infrastructure-devops&s=infrastructure&p=le-cloud). |
| **Pitfalls to avoid** | Spreading a user's requests across servers that depend on their own local memory. Expecting autoscaling to react instantly to a sudden spike. |
| **Best practices** | Keep permanent spare capacity. Plan for graceful degradation rather than a complete outage in case of a spike that outpaces scaling. |
