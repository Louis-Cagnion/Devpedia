---
order: 9
---

# RAG: Augmenting an LLM with External Data

An LLM only knows what it saw during training, up to a cutoff date (see [LLM in Production](/?c=ia&p=llm-en-production)) — it has no knowledge of your internal documents, your knowledge base, or anything that happened after that date. **RAG** (*Retrieval-Augmented Generation*) addresses this problem by fetching, at the moment of the question, the relevant documents and injecting them into the prompt before asking for the answer.

## Why not just retrain the model?

Retraining or fine-tuning a model on its own data is an alternative, but with a cost and delay that RAG avoids:

| | Fine-tuning | RAG |
|---|---|---|
| Updating a piece of data | Requires new training | Modifying the source document is enough |
| Cost | High (compute, time) | Cost of a search + a longer prompt |
| Traceability of the answer | Diffuse (buried in the model's weights) | Explicit: the documents used are identifiable |
| Suited to | Changing the model's *style* or behavior | Giving it access to changing or private *facts* |

RAG and fine-tuning aren't mutually exclusive: a model can be fine-tuned to make better use of retrieved documents, while still being fed via RAG for factual content.

## The four-step pipeline

```text
1. Chunking      : each source document is split into fragments
2. Indexing      : each fragment is converted into an embedding (see
                   NLP and LLM) and stored in a vector database
3. Retrieval     : the question asked is also converted into an embedding,
                   then compared against all indexed fragments
4. Generation    : the closest fragments are pasted into the
                   prompt, and the LLM answers based on them
```

The comparison in step 3 is done with a similarity measure between vectors — most often, exactly the [dot product between normalized vectors](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (the cosine of the angle between them): two fragments whose embeddings are close are, in principle, talking about similar topics — this is exactly the embedding property detailed in [NLP and LLM](/?c=ia&p=nlp-et-llm).

> **Pitfall:** switching embedding models without reindexing the entire existing document set. Embeddings produced by two different models don't share the same vector space (see comparing embeddings in [NLP and LLM](/?c=ia&p=nlp-et-llm)) — mixing old and new embeddings in the same search produces no valid comparison at all, even if the computation runs with no visible error.
>
> **Best practice:** reindex the entire document base as soon as an embedding model changes, never a partial mix of two different models.

## Chunking: a choice with a cost on both sides

Fragment size is never neutral:

- **Too small**, a fragment loses its surrounding context (a sentence isolated from its paragraph can become ambiguous or misleading once retrieved on its own).
- **Too large**, a fragment dilutes its relevance: in a multi-page document, only a portion actually answers the question, but the whole fragment gets injected into the prompt — at a cost (see [LLM in Production](/?c=ia&p=llm-en-production)) and at the risk of drowning the useful information in irrelevant text.

A common compromise keeps an overlap between consecutive fragments (the last words of one fragment repeated at the start of the next), so that information straddling two fragments is never entirely lost.

> **Pitfall:** picking a default fragment size, copied from another project, without testing it on your own documents. The optimal size depends heavily on the type of document (short articles, long manuals...) and the nature of the questions asked.
>
> **Best practice:** test several fragment sizes (and overlaps) on representative questions before settling on one, rather than picking one arbitrarily once and for all.

## The limit of RAG: bad retrieval doesn't show

RAG doesn't make the LLM more honest, it surrounds it with better data — if the search step fails to find the right fragment (a poorly phrased question, an embedding that doesn't capture the right nuance, information missing from the base), the model still answers, with the same hallucination risks as without RAG (see [LLM in Production](/?c=ia&p=llm-en-production)), with no alert flagging that the context provided was insufficient or off-topic.

> **Pitfall:** assuming a RAG system's answer is reliable simply because it looks well-sourced. Bad retrieval (an irrelevant fragment) produces an answer just as confident as good retrieval — nothing on the surface distinguishes the two cases.
>
> **Best practice:** monitor the quality of retrieval itself (were the fragments retrieved actually relevant?), not just the quality of the final answer — see [LLM Monitoring and Operations](/?c=ia&p=gestion-dun-llm).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | RAG searches for relevant documents at the moment of the question and injects them into the prompt, rather than retraining the model. The search compares embeddings by similarity (normalized dot product). Bad retrieval produces an answer just as confident as good retrieval, with no surface-level difference. |
| **Tools you can use** | A vector database to store and search embeddings; a consistent embedding model across the entire document base. |
| **Pitfalls to avoid** | Mixing embeddings from different models. Picking a fragment size without testing it. Trusting a RAG answer without checking retrieval quality. |
| **Best practices** | Fully reindex the base after any embedding model change. Test several fragment sizes on representative cases. Monitor retrieval quality in addition to the final answer. |
