---
order: 16
---

# The AI Stack: The Layers of a Production Application

Each previous chapter covers one mechanism: [training a neural network](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [giving a model tools](/?c=ia&s=nlp-llm&p=agents), [augmenting it with external data](/?c=ia&s=nlp-llm&p=rag), [monitoring it in production](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)... This chapter adds none of that: it shows how these pieces actually stack up in an application, and names the concrete tool categories that exist at each layer, vocabulary no other chapter covers, because it's not about how a mechanism works but about the landscape of tools that implement it.

**AI stack**: the set of layers, each with a distinct role, that must come together to turn a language model into a usable application, from raw compute up to what the end user sees.

## The layers, bottom to top

```text
Application       -> chatbot, command-line assistant...
      |               (see Building a Chatbot, The Agent-Based
      |                AI Assistant in the Terminal)
Orchestration     -> chaining prompts, agent loop
      |               (see Agents)
Observability     -> logs, costs, response evaluation
      |               (see LLM Monitoring and Operations)
Data              -> vector database, source documents (RAG)
      |               (see RAG)
Model             -> hosted API OR self-hosted model
      |
Compute / cloud   -> GPU, on-demand rental
                      (see CPU vs. GPU, What Is the Cloud)
```

Each layer relies on the one below it, and a problem in a lower layer (insufficient GPU, a model API outage) ripples up through every layer above it, even if their own code has no flaw.

| Layer | Role | Already covered elsewhere |
|---|---|---|
| Compute / cloud | Provide raw compute power | [CPU vs. GPU](/?c=infrastructure&p=cpu-vs-gpu), [The Cloud](/?c=infrastructure&p=le-cloud) |
| Model | Produce an answer from a prompt | [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production) |
| Data | Give the model information it doesn't have in memory | [RAG](/?c=ia&s=nlp-llm&p=rag) |
| Orchestration | Decide what to call, in what order | [Agents](/?c=ia&s=nlp-llm&p=agents) |
| Observability | Know what happened, how much it cost | [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Application | Expose all of this to an end user | [Building a Chatbot](/?c=ia&s=applications-llm&p=chatbot), [The Agent-Based AI Assistant in the Terminal](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) |

The following sections detail the three layers for which only the *mechanism* (not the *tool landscape*) has been covered elsewhere.

## The model layer: hosted API or self-hosted model

Using an LLM means choosing between two radically different ways of accessing one:

| | Hosted API | Self-hosted model |
|---|---|---|
| Principle | A provider hosts the model, you call it via [API](/?c=infrastructure&p=api-et-http) | You run an open-weight model yourself, on your own hardware (or rented [cloud](/?c=infrastructure&p=le-cloud)) |
| Cost | Pay-as-you-go (per token), no hardware investment | Fixed cost (GPUs owned or rented continuously), only profitable at high volume |
| Data control | Data passes through a third party (see [data governance](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) | Data never leaves the company's infrastructure |
| Maintenance | The provider's responsibility | The company's responsibility (updates, scaling, availability) |
| Available quality | Access to the highest-performing models on the market | Limited to what the available hardware can run |

> **Pitfall:** choosing self-hosting purely to save on cost per token, without counting the fixed hardware cost or the engineering time needed to match the reliability of a managed service: the equation only becomes favorable at a sufficient volume of use.
>
> **Best practice:** cost out both options against the actual expected volume of use (not a hypothetical one), and reassess this choice if that volume changes significantly: the switch is never final.

## The data layer: the vector database

The [RAG](/?c=ia&s=nlp-llm&p=rag) chapter explains the mechanism (chunking, indexing, similarity search) without naming a specific tool. In practice, the indexing step relies on one of these two families:

| | Dedicated vector database | Extension of an existing database |
|---|---|---|
| Principle | A system designed solely to store and search embeddings (Pinecone, Weaviate, Milvus...) | An extension added to a database already in place (e.g. `pgvector` for PostgreSQL) |
| Advantage | Optimized for large-scale similarity search | No new infrastructure to operate if the existing database is big enough |
| Disadvantage | An extra system to operate and secure | Less performant than a dedicated database beyond a certain volume |

The choice follows the same logic as elsewhere in architecture: an extension is enough as long as the document volume stays modest; a dedicated database is justified once similarity search itself becomes a bottleneck.

## The orchestration layer: writing the loop yourself, or relying on a framework

The [Agents](/?c=ia&s=nlp-llm&p=agents) chapter describes the reasoning/action loop and multi-agent coordination patterns in general, without saying how they're concretely implemented. Two approaches:

| | Writing the loop yourself | Orchestration framework |
|---|---|---|
| Principle | Directly code the calls to the model, to tools, and the loop that chains them | Rely on a library (LangChain, LlamaIndex...) that already provides these building blocks |
| Advantage | Full control, no external dependency, simpler to debug line by line | Common interface to several model providers, conversation memory and chaining already solved |
| Disadvantage | Every building block (retries, memory management, tool format) has to be rewritten | An extra abstraction layer to understand, sometimes heavier than the actual need |

> **Pitfall:** adopting a full orchestration framework for a need that boils down to a single tool call, the same mistake as over-engineering any other system before actually needing to.
>
> **Best practice:** start with the simplest loop that meets the actual need, and only introduce a framework once coordination (several tools, several agents, fine-grained memory management) exceeds what hand-written code can reasonably maintain.

## The cross-cutting pitfall: hidden coupling between layers

Each layer looks independent: until a change in one breaks another's behavior with no visible error. The example already seen in [RAG](/?c=ia&s=nlp-llm&p=rag): switching embedding models (model layer) silently invalidates an existing vector database (data layer), since the two models don't share the same vector space.

> **Pitfall:** modifying one layer in isolation and only testing that layer, assuming the others have no reason to be affected.
>
> **Best practice:** after any component change at a layer (model, vector database, orchestration framework), rerun an end-to-end integration test, not just an isolated test of the modified layer.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | An AI application is assembled from distinct layers (compute, model, data, orchestration, observability, application), each covered mechanically elsewhere on this site. Hosted API vs. self-hosted, dedicated vector database vs. extension, and a hand-coded loop vs. an orchestration framework are architecture decisions specific to each layer. |
| **Tools you can use** | A hosted model API to get started with no infrastructure. An extension like `pgvector` for a modest document volume, a dedicated vector database beyond that. An orchestration framework once coordination gets too complex for hand-written code. |
| **Pitfalls to avoid** | Choosing self-hosting on cost per token alone without counting the fixed cost. Adopting a full framework for a trivial need. Modifying a layer without retesting end-to-end integration. |
| **Best practices** | Cost out both hosting options against the actual expected volume. Start with the simplest loop before introducing a framework. Rerun an end-to-end integration test after any component change. |
