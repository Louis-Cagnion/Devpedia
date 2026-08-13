---
order: 3
---

# Local vs. cloud trade-off for a vision model

The [The AI stack](/?c=ia&p=stack-ia) chapter details the choice between a hosted API and a self-hosted model for an **LLM**. A [computer vision](/?c=ia&p=architectures-cnn-rnn-transformers) model (a structured OCR, for example) raises the same underlying question, but sometimes with reversed answers: this chapter reuses the same criteria (data exposure, cost, latency), recalculating them for this specific case, without repeating the principle already laid out for LLMs.

## What changes compared to an LLM

| Criterion | LLM (recap) | Vision/OCR model |
|---|---|---|
| Typical model size | Often tens of billions of parameters: self-hosting a competitive model requires a substantial [GPU](/?c=infrastructure&p=cpu-vs-gpu), sometimes several | Often much smaller (a few hundred million parameters for a structured OCR pipeline): runs comfortably on a modest GPU, sometimes even on CPU for a reasonable volume |
| Hosted API billing | Per token, read and generated | Per page or per image processed, a different cost model (no notion of generated text length) |
| Nature of the exposed data | The prompt (text, potentially confidential) | The image sent (an entire scanned document), which can contain far more information than what's actually useful (the whole page, not just the table to read) |
| Latency tolerance | Often interactive (a user waiting for a response) | Often batch processing, in the background, over a set of documents: a few extra seconds per page have little real impact |

These differences shift the balance: the smaller model size makes self-hosting accessible to a team that would never have considered self-hosting an LLM, and a tolerant latency reduces the usual advantage of a hosted API (fast response, no hardware investment).

## Data exposure: the criterion that often decides on its own

Sending a document to a hosted vision API means transmitting the page's **complete image** to a third party, not just the information you're trying to extract from it. For an internal or confidential document (a contract, a proprietary spec sheet), this exposure alone can disqualify a hosted API, regardless of its cost or quality:

> **Pitfall:** evaluating a hosted vision API solely on its price per page and recognition quality, without first checking whether the type of document being processed is allowed to pass through a third party (see the [data governance](/?c=ia&p=gouvernance-des-donnees) principles, applicable here in the same way as for an LLM).
>
> **Best practice:** settle the data exposure question **before** comparing costs: if the nature of the documents being processed forbids it, self-hosting becomes the only valid option, regardless of an otherwise cloud-favorable cost calculation.

## Cost, recalculated for batch processing

A pipeline that routinely processes a large volume of documents (hundreds of PDFs a day, for example) accumulates a per-page cost that grows linearly with volume, never stopping as long as the service runs. A self-hosted model, once the hardware is paid off, processes additional volume at a nearly zero marginal cost:

| | Hosted API | Self-hosted model |
|---|---|---|
| Cost at low volume | Competitive: no hardware investment | Fixed hardware cost to pay off, unfavorable while volume stays low |
| Cost at high, steady volume | Grows indefinitely with volume processed | Becomes profitable: the already-paid-off hardware absorbs growing volume at no significant marginal cost |

> **Pitfall:** projecting a hosted API's cost based on its current volume, without anticipating its growth. A document processing pipeline tends to see its volume increase over time (more documents, more sources), gradually shifting the balance toward self-hosting.
>
> **Best practice:** cost out both options against a medium-term volume projection, not just today's volume, before settling on a choice that will be costly to change once the pipeline is built around it.

## Latency: an advantage that fades in batch processing

A hosted API generally wins on the latency of a single isolated request, a decisive criterion for interactive use. A document pipeline that processes documents in the background, with no user waiting immediately for a result, benefits much less from this advantage: a few extra seconds per page, multiplied across asynchronous processing, have a negligible impact on the real experience.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The hosted-API-vs-self-hosted choice for a vision model reuses the criteria already seen for an LLM, but recalculated: smaller models (self-hosting more accessible), per-page rather than per-token billing, a complete image exposed rather than a text prompt, higher latency tolerance in batch processing. |
| **Tools you can use** | A medium-term volume projection to cost out both options; an upfront classification of the documents processed (see data governance) to settle the exposure question before the cost question. |
| **Pitfalls to avoid** | Comparing options on price alone without checking whether document exposure is acceptable. Costing out a hosted API on current volume without anticipating its growth. |
| **Best practices** | Settle data exposure before cost. Project cost over a medium-term volume. Don't overestimate a hosted API's latency advantage for batch processing. |
