---
order: 1
---

# Structured Decision Models: An Alternative to Generative LLMs

A [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) always answers with text: even when asked "urgent or not urgent?", it produces a string of words that then has to be re-read, parsed, and validated (typically against a [JSON schema](/?c=ia&s=nlp-llm&p=agents) describing the expected shape). Nothing guarantees it will match that shape on the first try, or that it won't invent a plausible but false answer, a [hallucination](/?c=ia&s=nlp-llm&p=llm-en-production). A more recent family of models, **structured decision models**, takes a different path: giving up free-text generation to answer only closed questions, with output that always has the expected shape and a numeric probability of being wrong.

## Where the idea comes from: System 1 and System 2

The name comes from psychologist Daniel Kahneman's book, [*Thinking, Fast and Slow*](https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/), which distinguishes two ways humans think:

| | System 1 | System 2 |
|---|---|---|
| Speed | Fast, automatic | Slow, effortful |
| Example | Recognizing a face, judging an emotion | Solving 17 × 24, planning a route |
| What it produces | An immediate answer, little explicit reasoning | Reasoning built step by step |

A generative LLM, which unrolls reasoning token by token (see [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) and chains of reasoning), is closer to System 2. Models known as **"System One"** aim for the opposite: answering fast, without unrolling any textual reasoning, on deliberately narrow questions.

## What a structured decision model answers

Rather than generating a sentence, a model of this kind answers a closed question, asked against a **state** (the data relevant to the decision, e.g. the content of a support ticket), and always returns:
- an answer in a format fixed ahead of time (never free text);
- an associated probability (or distribution of probabilities);
- a confidence score, distinct from that probability.

## Comparison with a classic generative LLM

| | Classic generative LLM | Structured decision model |
|---|---|---|
| Output | Free text, to parse afterward | Typed value fixed ahead of time (option, score, yes/no) |
| Input | A text prompt | A structured state + a closed question |
| Sampling | Token by token, sequential | All answers in one pass (parallel) |
| Can produce invalid format | Yes, requires validation (see [JSON Schema](/?c=ia&s=nlp-llm&p=agents)) | No, output is constrained by construction |
| Reported probability | Absent or unreliable | Calibrated: trained to reflect statistical reality |
| Intended use | Writing, open-ended reasoning, conversation | Classification, scoring, routing, verification |

## A concrete example: Jev

**Jev** is a model of this kind published by the [TypeSafe AI](https://typesafe.ai/blog/introducing-system-one-models-and-jev) lab (named after economist William Stanley Jevons), and serves as the illustration throughout the rest of this part. It answers three forms of closed question, detailed in the [next chapter](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), and claims on this narrow scope a latency of 70 to 500 ms (versus several seconds for a comparable frontier LLM) and a zero format-error rate. These figures come from the vendor and have not been independently verified; what matters for this course is the principle they illustrate, not the benchmark itself.

## What it's for, and what it isn't

| Suited for | Not suited for |
|---|---|
| Classifying a message into a fixed category | Writing a text, an open-ended answer |
| Scoring content on a scale known ahead of time | Explaining reasoning in natural language |
| Routing a request to the right handler | Answering a question whose possible answers aren't known ahead of time |
| Verifying or filtering the output of another model (a guardrail) | Holding a conversation or doing creative generation |
| Extracting a value among already-identified candidates | Generating code, a plan, a document |

> **Pitfall:** believing a structured decision model replaces an LLM. It only does one thing: answer a closed question against a given state. A real system most often combines the two, the LLM for reasoning and generating, the decision model for the narrow chokepoints (classify, score, verify) where guaranteed, fast output matters more than an open-ended answer.
>
> **Best practice:** in an existing LLM-based pipeline, spot the steps that already just pick among options known ahead of time (routing, scoring, validation): these are the natural candidates for a structured decision model, without touching the steps that actually generate text.

## What to remember

| | |
|---|---|
| **To remember** | A structured decision model (the "System One" category, referencing Kahneman's System 1) answers closed questions against a given state, with output always in the right format and a calibrated probability, unlike a generative LLM that produces free text to validate afterward. It complements an LLM, it doesn't replace it. |
| **Usable tools** | Jev (TypeSafe AI) as a public example of this type of model. |
| **Pitfalls to avoid** | Confusing a "structured decision model" with a full replacement for an LLM; asking it for an open-ended task (writing, free reasoning) it isn't designed to handle. |
| **Best practices** | Reserve this type of model for pipeline steps that already just pick among options known ahead of time, combining it with an LLM for the rest. |
