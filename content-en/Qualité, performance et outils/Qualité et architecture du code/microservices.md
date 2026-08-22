---
order: 2
---

# Microservices: Splitting an Application into Independent Services

[Single responsibility and low coupling](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) applies to a function or a file; **microservices** architecture applies the same idea at the scale of an entire application: instead of a single program handling every business domain, several independent **services**, each responsible for a single domain, communicating with each other over the network rather than by sharing memory or a database.

## From monolith to separate services

A **monolith** groups all application code (catalog, cart, payment, notifications...) into a single program, deployed as a single unit:

```text
Monolith:                            Microservices:

+----------------------+             +-----------+   +-----------+
|  Catalog             |             |  Catalog  |   |   Cart    |
|  Cart                |             +-----------+   +-----------+
|  Payment             |                   |               |
|  Notifications       |             +-----------+   +---------------+
+----------------------+             | Payment   |   | Notifications |
   (a single deployment)              +-----------+   +---------------+
                                        (one deployment per service, linked over the network)
```

Each service can be written in a different language, deployed and scaled independently of the others, and modified without redeploying the entire application: exactly the same intent as a [single responsibility](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) at the file level, moved up to the deployment level.

## Each service owns its own data

A service should never read from or write directly to another service's database: it goes through the [API](/?c=infrastructure&p=api-et-http) that other service exposes, never through direct access to its storage.

> **Pitfall:** letting several services access the same shared database directly "to keep things simple." This recreates, at a larger scale, exactly the coupling already caused by a file that shares a [constant between two independent mechanisms](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage): a schema change in one service silently breaks another service that was reading that table directly, with no API call making that visible on reading the code.
>
> **Best practice:** each service owns its own database (or its own isolated schema), not directly accessible to the others; any data another service needs goes through an explicit [API](/?c=infrastructure&p=api-et-http).

## Communicating between services: synchronous or asynchronous

| | Synchronous call (HTTP/API) | Asynchronous message (message queue) |
|---|---|---|
| Principle | The calling service waits for the response before continuing | The service drops a message and continues without waiting for it to be processed |
| Availability coupling | An unavailable payment service makes the order fail immediately | The message waits in the queue until the payment service is available again |
| Simplicity | Easier to follow and debug (one call, one response) | Eventual consistency to handle explicitly |

See [WebSocket](/?c=infrastructure&p=websocket-et-temps-reel) for a third form of communication, relevant when a service needs to keep notifying a client continuously rather than another service just once.

## The main benefit: independent scaling

In a monolith, a high load on a single feature (payment during a sales spike, for example) forces the **entire** application to be scaled up, including the parts that don't need it. With separate services, only the affected service is scaled, without touching the others.

## The distributed monolith trap

Splitting code into several services isn't enough to get the benefits of microservices if coupling between them stays tight:

> **Pitfall:** applying the real [single responsibility](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) test ("if I modify this, is it for the same reason as that?") only to how files are split, never to how services are split. Services that must systematically be deployed together, or where an API contract change in one immediately forces changes in all the others, are just a **distributed monolith**: all the operational complexity of microservices, none of their independence benefits.
>
> **Best practice:** split services along the same boundaries as a well-drawn single responsibility (genuinely independent business domains), never for technical convenience (one service per file type, for example), and regularly check that two services can actually be deployed one without the other.

## The cost: complexity doesn't disappear, it moves

Microservices aren't free: the complexity a monolith handles in memory (a function call, a single database transaction) now has to be handled over the network (latency, possible partial failure, no more single transaction covering several services). Observing what's happening (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) for an example of this kind of supervision, applied to an LLM rather than to microservices) becomes essential as soon as several services interact: an error can now come from any one of them, or from the communication between them.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Microservices apply single responsibility at the deployment scale: one service per business domain, its own database, communication through an API rather than direct access to another service's data. The main benefit is scaling one specific service independently, without scaling up the whole application. |
| **Tools you can use** | A synchronous call (HTTP/API) when an immediate response is needed; an asynchronous message queue to decouple the availability of two services. |
| **Pitfalls to avoid** | Sharing a database between several services. Splitting into services without reducing the coupling between them (distributed monolith). |
| **Best practices** | Give each service its own storage, never shared. Split along genuinely independent business-domain boundaries, and regularly check that a service can be deployed without the others. |
