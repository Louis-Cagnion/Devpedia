---
order: 11
---

# Recipes: Verifying, Filtering, and Improving Reliability

Last series of recipes: measuring a structured decision model's stability, using it as a safety filter, and employing it for search or function-calling tasks usually handed to a generative LLM.

## Self-consistency: measuring the stability of an answer

The [self-consistency](/?c=ia&s=nlp-llm&p=reduire-la-variance-des-reponses#self-consistency-voting-on-the-conclusion-of-several-reasoning-chains) of a generative LLM votes on the conclusion of several reasoning chains. For a structured decision model, the equivalent consists of repeating the same question several times (15 times in the vendor's tests) and measuring the standard deviation of the probabilities obtained:

| Question type | Measured result |
|---|---|
| Noul, repeated 15 times | Average standard deviation of 0.0102 (very stable), versus generative LLMs that vary even at temperature 0 |
| Choice, repeated 15 times | 99.2% agreement between repetitions with an uncertainty band (top probability < 0.60 returned as "uncertain"), versus 90.8% without that band |

Rather than forcing a binary decision at 0.5 for a Noul, an **uncertainty band** absorbs edge cases:

```python
if probability < 0.30:
    decision = "no"
elif probability > 0.70:
    decision = "yes"
else:
    decision = "uncertain"   # escalate to human, probability stays visible
```

## Re-ranking: reordering an already shortlisted list

A fast (keyword) search first produces a short list of candidates; **re-ranking** then reorders this list by judging each candidate individually against the query, via a Noul question repeated over each query/candidate pair. On 40 tested legal queries, this step raised top-1 accuracy from 5% to 18%, and top-10 accuracy from 38% to 62%.

## Line-by-line semantic search

To locate the answer to a question within a document of several hundred lines, each line receives an identifier (`L001`, `L002`...), then two questions run in a single request: a Choice ranks the lines by relevance, a Noul checks in parallel whether the document contains an answer at all. This second question distinguishes a bad match (the document doesn't answer) from an answer that was simply misranked.

## Function calling: turning a natural-language request into a typed call

A natural-language request ("plot the rolling correlation between NVDA and SPY over the past month") converts into a typed function call, where each parameter accepts only a closed set of values:

```text
"plot the rolling correlation between nvda and spy for the past month"
   -> rolling_correlation(symbol='NVDA', benchmark='SPY', window='1mo')
      confidence: 0.91
```

The reported confidence is that of the chain's **least certain** judgment (not an average or a product of probabilities): a single misidentified parameter is enough to lower the whole call's confidence.

## Citation verification: detecting a fabricated source

To verify that a citation produced by an LLM genuinely exists in a source document:

```text
1. Normalized text search (spaces, quotation marks) for the citation in
   the source -> absent = "fabricated" verdict immediately, no need for the model
2. If found, a Choice question judges the relationship between citation
   and claim: supports / contradicts / doesn't address
```

| Verdict | Meaning |
|---|---|
| Verified | The source supports the claim |
| Contradicted | The source contradicts the claim |
| Unsupported | The source doesn't address the subject |
| Fabricated | The citation doesn't exist in the source |

## Guardrails: a safety layer independent of the main model

Rather than placing safety rules in an LLM's system instructions (which can be bypassed) or having them checked by a second LLM (expensive, also bypassable), a single structured-decision request evaluates each incoming and outgoing message, with one Noul per risk (instruction bypass, help with an illegal activity, distress...) and an overall severity Score:

```text
pass          <- every risk stays below its threshold
review        <- at least one risk is close to its threshold, without exceeding it
block         <- one risk exceeds the blocking threshold
route_to_support <- a distress pattern is detected
```

The thresholds remain defined and adjustable by the application, rather than inherited from a model's default behavior.

## Feature discovery: turning free text into numeric columns

A classic machine learning model (e.g. CatBoost) needs a table of numbers, not free text. An automated loop proposes questions about the text (intensity of a trait, presence of a fact), converts them into columns via calibrated probabilities, trains the model, then uses its error to propose new questions. On 2,000 tested reviews, prediction error (RMSE) dropped from 2.47 (raw text) to 1.77 after five iterations of this loop, with none of the 38 final questions written by hand.

> **Pitfall common to these seven recipes:** treating a single run as definitively reliable, without ever measuring its stability (self-consistency), without an independent safety filter (guardrails), or without checking that a cited source genuinely exists (citation check).
>
> **Common best practice:** add a dedicated verification step (repetition and standard-deviation measurement, upstream/downstream guardrail, text search before judgment) rather than trusting a single raw answer, especially for anything touching safety or factual accuracy.

## What to remember

| | |
|---|---|
| **To remember** | Seven reliability recipes: measuring stability through repetition (self-consistency), reordering a list through individual judgment (re-ranking), locating an answer line by line, converting a request into a typed function call, verifying that a citation genuinely exists, filtering incoming/outgoing messages through independent guardrails, turning free text into numeric columns usable by a classic model. |
| **Usable tools** | Repetitions and standard deviation for self-consistency; Noul/Choice questions for re-ranking, search, function calling, citations, guardrails; a propose/measure loop for feature discovery. |
| **Pitfalls to avoid** | Trusting a single run with no stability check or independent guardrail. |
| **Best practices** | Systematically add a dedicated verification step before trusting an answer, especially for safety and factual accuracy. |
