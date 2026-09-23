---
order: 5
---

# Composing Decisions: Composite Scoring and Intent Routing

A structured decision model never answers anything but narrow, atomic questions ([Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Composing a richer behavior (a final decision, a routing) is the **calling code's** job, not the model's. Four patterns come up most often for this composition:

| Pattern | Principle | Where it's covered |
|---|---|---|
| Speculative fan-out | Ask all plausible questions at once, filter in code | [State and parallel questions](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#the-speculative-fan-out-pattern) |
| Confidence routing | Act, confirm, or escalate based on the confidence level | [Calibrated confidence](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#three-thresholds-three-behaviors) |
| **Composite scoring** | Combine several independent scores into a single decision | This chapter |
| **Intent routing** | Classify a request then direct it to the right handler | This chapter |

## Composite scoring: combining independent dimensions

**Composite scoring** breaks a complex judgment into separate dimensions, scores each independently (one Score question per dimension, asked in a single request thanks to [fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#the-speculative-fan-out-pattern)), then combines them via a weighted formula fully controlled by the code.

```text
1. Ask one Score question per dimension (in parallel, same request)
2. Normalize each score between 0 and 1 (divide by the maximum level)
3. Combine via a weighted sum, with fixed weights in code
```

Example: evaluating a resume along several axes, with weights that change depending on the position.

```python
# Each score is normalized between 0 and 1 before being weighted
def score_candidate(answers, weights: dict[str, float]) -> float:
    total = 0.0
    for dimension, dimension_weight in weights.items():
        raw_score    = answers[dimension].score                # e.g. 3 on a 0-4 scale
        max_level    = len(answers[dimension].legend) - 1      # 4
        normalized_score = raw_score / max_level
        total += dimension_weight * normalized_score
    return total

# A manager role weights "leadership" more than a senior IC role
weights_senior_ic = {"python_depth": 0.5, "leadership": 0.1, "system_design": 0.4}
weights_manager    = {"python_depth": 0.2, "leadership": 0.5, "system_design": 0.3}
```

This approach preserves each dimension's granularity (you can inspect why a candidate gets a given overall score) while allowing priorities to be adjusted quickly (change the weights) without rebuilding the whole evaluation system.

> **Pitfall:** scoring an overall impression directly ("good candidate" in a single Score question), which mixes several dimensions without letting you later adjust their relative importance separately.
>
> **Best practice:** one Score question per genuinely independent dimension, combined in code with explicit, adjustable weights, without touching the questions themselves.

## Intent routing: classify before processing

**Intent routing** places a structured decision model upstream of several possible processes, to direct each request to the right handler without always going through the most expensive process (an LLM, a human).

```text
Customer message
     |
     v
Structured decision model (2 questions in parallel: Choice + Score)
     |
     v
Answers + confidence
     |
     +-- intent confidence < 0.5 -------------------> Human agent
     +-- intent = "order_status" ---------------------> Deterministic lookup (no LLM)
     +-- intent = "product_question" ------------------> Specialized product LLM
     +-- intent = "complaint" + complexity > 1 --------> Human agent
     +-- intent = "complaint" + complexity <= 1 -------> Resolution LLM
```

```python
answer = client.system_one(
    state=customer_message,
    questions={
        "intent":     Choice(instructions="Category of the request?", criteria=CATEGORIES),
        "complexity": Score(instructions="Complexity of the request?", criteria=COMPLEXITY_LEVELS),
    },
)

if answer.answers["intent"].confidence < 0.5:
    route_to("human_agent")
elif answer.answers["intent"].choice == "order_status":
    route_to("deterministic_lookup")
elif answer.answers["intent"].choice == "complaint" and answer.answers["complexity"].score > 1:
    route_to("human_agent")
else:
    route_to("specialized_llm")
```

The main gain is economic: expensive resources (a reasoning LLM, a human) are only used for cases that genuinely warrant it, with the rest handled by deterministic logic or a lighter model.

> **Pitfall:** routing solely on the chosen intent, without accounting for its associated confidence: a misclassified but confidently-treated intent can send a request to the wrong handler with no signal to reveal it.
>
> **Best practice:** always check the intent's confidence before routing on it (see [confidence routing](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#three-thresholds-three-behaviors)), and combine intent with other signals (here, complexity) rather than routing on a single isolated criterion.

## What to remember

| | |
|---|---|
| **To remember** | Composing a rich decision from atomic questions remains the code's job, not the model's. Composite scoring combines several independent scores via a weighted formula; intent routing classifies a request then directs it to the cheapest handler that fits, subject to sufficient confidence. |
| **Usable tools** | Several Score questions in parallel, a weighting formula in code, a Choice question to classify an intent before routing. |
| **Pitfalls to avoid** | A single Score question that mixes several dimensions. Routing on an intent without checking its confidence. |
| **Best practices** | One dimension per Score question, explicit and adjustable weights in code. Check confidence before routing, combine several signals rather than just one. |
