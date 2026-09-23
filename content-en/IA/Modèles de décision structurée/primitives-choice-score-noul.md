---
order: 2
---

# The Three Question Primitives: Choice, Score, and Noul

The [previous chapter](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm) explains that a structured decision model never answers with free text: it answers a **closed question**, asked against a **state** (the content to evaluate, a message, a document...). Concretely, this closed question always takes one of three forms, called **primitives**:

| Primitive | The question it asks | What it returns |
|---|---|---|
| **Choice** | "Which of these options?" | The chosen option, a probability per option, a confidence |
| **Score** | "At what level, on this scale?" | A position on the scale, a probability per level, a confidence |
| **Noul** | "Is this statement true?" | A single probability, between 0 and 1 |

Each question carries an identifier, a type (`choice`, `score`, or `noul`), and instructions. Several questions can be asked in a single request against the same state: each is evaluated **independently**, without seeing the others' answers.

## Choice: picking among unordered options

**Choice** selects a category from a set known ahead of time, with no hierarchy between options (unlike Score, see below). Example: routing a support ticket to the right team.

```json
{
  "department": {
    "type": "choice",
    "instructions": "Which team should handle this ticket?",
    "criteria": {
      "returns": "Exchanges, missing or damaged items",
      "shipping": "Delivery status, delays, lost packages",
      "billing": "Billing, invoices, payment issues"
    }
  }
}
```

The answer contains three elements:

```json
{
  "choice": "returns",
  "confidence": 1.0,
  "probabilities": { "returns": 1.0, "shipping": 0.0, "billing": 0.0 }
}
```

`probabilities` always sums to 1 (it's a distribution); `choice` is the option that received the highest probability; `confidence` (between 0 and 1) measures how much that probability dominates the others.

| Pitfall | Best practice |
|---|---|
| Proposing options that overlap (e.g. "returns" and "exchanges" as two distinct options when the same case falls under both) | Write mutually exclusive criteria, with descriptions that explicitly list what an option covers (and what it excludes) |
| Providing no option for an out-of-scope case | Always add an "other" option, so as never to force a choice that fits nothing |

A request accepts up to 255 options per Choice question.

## Score: rating on an ordered scale

**Score** positions an evaluation on a continuum, when the levels have a natural order (severity, satisfaction, skill). Levels are numbered from `0` to their position in the list:

```json
{
  "bug_severity": {
    "type": "score",
    "instructions": "What is the severity of the issue?",
    "criteria": [
      "No functional impact",
      "Degraded functionality but a workaround exists",
      "Complete blocker"
    ]
  }
}
```

The answer returns a **weighted** position, not necessarily an integer:

```json
{
  "score": 1.43,
  "confidence": 0.35,
  "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 },
  "legend": { "0": "No impact", "1": "Workaround exists", "2": "Complete blocker" }
}
```

`score` is calculated as an average weighted by each level's probability:

```python
# score = sum, over each level, of (level_number x level_probability)
levels        = [0, 1, 2]
probabilities = [0.0, 0.57, 0.43]
score = sum(level * proba for level, proba in zip(levels, probabilities))
# -> 0*0.0 + 1*0.57 + 2*0.43 = 1.43
```

A Score scale accepts between 2 and 10 levels.

| Pitfall | Best practice |
|---|---|
| Describing abstract degrees ("moderately severe") rather than concrete situations | Describe what's observable ("broken feature with a workaround"), easier to evaluate consistently |
| Evaluating several dimensions in a single question ("fast AND experienced") | One dimension per Score question; combine several scores in code afterward (weighted average, thresholds) |

A low confidence usually signals overlap between neighboring levels, or a question that mixes several dimensions.

## Noul: verifying a binary statement

**Noul** answers a yes/no question, or judges the truth of a statement, with a single probability:

```json
{
  "requests_human": {
    "type": "noul",
    "instructions": "Is the customer asking to speak to a human?"
  }
}
```

```json
{ "noul": 0.92 }
```

A value close to 1 means yes with near-certainty, close to 0 means no with near-certainty, close to 0.5 means uncertainty. There's no separate `confidence` field: the probability itself carries both the answer and the degree of certainty.

In code, this probability is thresholded rather than treated as a raw boolean:

```python
YES_THRESHOLD = 0.8
NO_THRESHOLD = 0.2

probability = answer["noul"]
if probability > YES_THRESHOLD:
    decision = "yes"
elif probability < NO_THRESHOLD:
    decision = "no"
else:
    decision = "uncertain"   # escalate to a human
```

| Pitfall | Best practice |
|---|---|
| Combining two conditions in a single statement ("the customer is angry AND asking for a refund") | One statement per Noul; ask two distinct Nouls if two conditions genuinely need checking |
| Treating the probability as a strict boolean (`> 0.5`) with no uncertainty zone | Adapt both thresholds to the cost of an error: a wider threshold for a reversible action, a narrower one for a high-stakes action |

## Comparing the three primitives

| | Choice | Score | Noul |
|---|---|---|---|
| Nature of possible answers | Unordered categories | Ordered levels | True/false |
| Number of options | Up to 255 | 2 to 10 | Always 2 (implicit) |
| Returned answer | A category + distribution | A weighted position + distribution | A single probability |
| Separate confidence field | Yes | Yes | No (the probability stands in for it) |
| Example use | Routing, classifying | Rating a severity, a quality | Verifying a statement, filtering |

## Structuring criteria in JSON rather than free text

The `instructions` and `criteria` fields of all three primitives accept either a simple string or a [JSON](/?c=infrastructure&p=json) structure (object or array). Structuring becomes useful in two cases: a multi-part question (keys name each part, which a sentence doesn't do as clearly) and already-structured data to reuse as-is (a schema, a taxonomy), rather than transcribing it into prose.

```json
{
  "type": "noul",
  "instructions": "Does this comment mention an already-reported issue?",
  "criteria": {
    "true": "Mentions a specific prior attempt, ticket, or report",
    "false": "No trace of a prior contact or report"
  }
}
```

This structured form (detailed `true`/`false`, or `what`/`examples` for a Choice option or a Score level) disambiguates edge cases, where a single criterion sentence would stay vague about the exact boundary between two possible answers.

## What to remember

| | |
|---|---|
| **To remember** | A structured decision model only knows three forms of question: Choice (choosing an unordered category), Score (positioning on an ordered scale), and Noul (judging a true/false statement). Each question returns a typed answer accompanied by a probability, never free text to interpret. |
| **Usable tools** | The three Choice/Score/Noul primitives, expressed as JSON (request) and interpreted in code (thresholds, weighted averages, routing). |
| **Pitfalls to avoid** | Overlapping Choice options, with no "other" option. Score levels described in abstract degrees, or a Score question that mixes several dimensions. A Noul that combines two conditions, or is treated as a strict boolean with no uncertainty zone. |
| **Best practices** | Mutually exclusive criteria plus an "other" option for Choice. Score levels described by observable situations, one dimension per question. Noul thresholds adapted to the cost of an error. Criteria structured in JSON to disambiguate edge cases. |
