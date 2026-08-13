---
order: 24
---

# OCR pipeline deployment and monitoring

The previous chapters cover recognition itself (model, evaluation, correction). This one covers what changes once that pipeline is deployed continuously, on a real stream of documents rather than a fixed test set: the same questions as an [LLM in production](/?c=ia&p=llm-en-production), sometimes with different answers.

## Cost, latency, data exposure: already covered, not repeated here

The trade-off between a hosted API and a self-hosted model for an OCR pipeline (cost per page, exposing the full image to a third party, latency tolerance in batch processing) is already detailed in [Local vs. cloud trade-off for a vision model](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): this chapter doesn't repeat it, it assumes that choice already made.

## Silent version drift, the OCR version

The same risk already seen for an LLM (see [LLM Monitoring and Operations](/?c=ia&p=gestion-dun-llm)) applies to a third-party OCR: the provider can silently update their model, changing recognition behavior on identical documents, with no line of the pipeline having changed.

> **Pitfall:** only detecting this drift after it has produced visible downstream errors (a misextracted amount on a real invoice, for instance), rather than monitoring it directly.
>
> **Best practice:** regularly replay the annotated test set (see the [OCR evaluation golden set](/?c=ia&p=evaluer-un-ocr)) against the production pipeline, at a regular interval and at every announced provider-side change, to detect version drift before it affects real documents.

## Monitoring CER/WER continuously, not just at training time

CER/WER (see the [dedicated chapter](/?c=ia&p=evaluer-un-ocr)) isn't meant to be measured only once before going to production: tracked over time on the golden set, it detects degradation before it silently accumulates:

```text
CER on the golden set, measured weekly:

Week 1: 2.1%
Week 2: 2.3%
Week 3: 2.0%
Week 4: 6.8%   <- sudden spike: alert (provider change? new document format?)
```

> **Pitfall:** tracking only an aggregated global CER/WER across all processed documents, without breaking it down by document type or field. A degradation affecting only one document type (a given supplier's new invoice format, for instance) can stay hidden inside a stable global average, exactly the same pitfall already flagged in the evaluation chapter for a global score.
>
> **Best practice:** break down tracking by document type and by field, not just a global average, to spot localized degradation before it spreads.

## Routing uncertain cases to human review

The [confidence score](/?c=ia&p=detection-de-mise-en-page) already seen for layout detection has an equivalent for text recognition itself: most OCR engines return, alongside the text, a confidence score per recognized word or character.

```text
Processed document
      │
      ▼
Document's average confidence score
      │
      ├── above the threshold ──> automatic processing, no intervention
      │
      └── below the threshold ──> queued for human review
```

> **Pitfall:** treating every document below a certain confidence threshold as a blocking error with no alternative, or conversely accepting it as-is with no verification at all so as not to slow down the pipeline.
>
> **Best practice:** provide a human review queue for documents below the confidence threshold, rather than a binary choice between blocking and blindly accepting: the pipeline stays largely automated, with human review only handling genuinely uncertain cases.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Cost, latency, and data exposure are already covered in the local/cloud trade-off; this chapter adds what's specific to continuous operation: silent version drift of a third-party OCR, tracking CER/WER over time (broken down by document type and field), and routing low-confidence documents to human review rather than blind processing. |
| **Tools you can use** | A golden set regularly replayed in production. A CER/WER tracking dashboard over time, broken down by document type. A human review queue for documents below a confidence threshold. |
| **Pitfalls to avoid** | Detecting version drift only after visible downstream errors. Tracking only a global CER/WER with no breakdown. Handling low-confidence documents in a purely binary way (block or blindly accept). |
| **Best practices** | Replay the golden set at a regular interval and at every provider change. Break down tracking by document type and field. Route low-confidence documents to human review. |
