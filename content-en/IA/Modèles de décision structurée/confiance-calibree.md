---
order: 4
---

# Calibrated Confidence: Act, Hesitate, or Escalate

Choice and Score answers ([previous chapter](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)) carry a `confidence` field distinct from the answer itself. This chapter explains what this number measures, and how code should use it to decide between acting automatically or escalating to a human.

## What confidence measures

Confidence is derived from the **shape of the probability distribution** returned by a Choice or Score question: a distribution concentrated on a single answer signals high confidence, a distribution spread across several answers signals low confidence.

```text
Concentrated distribution (high confidence)    Spread distribution (low confidence)
returns:    0.95  #################            returns:    0.40  ########
shipping:   0.03  #                             shipping:   0.35  #######
billing:    0.02  #                             billing:    0.25  #####
```

For a three-option question, the vendor's documentation gives an approximate formula:

```python
# approximate confidence for 3 options, from the highest probability
top_probability = 0.95
confidence = (3 * top_probability - 1) / 2
# -> (3*0.95 - 1) / 2 = 0.925
```

A perfectly flat distribution (every option tied) gives a confidence close to 0; a distribution that concentrates all its weight on a single option gives a confidence close to 1.

For a **Noul** question, there is no separate `confidence` field: the returned probability plays both roles at once (the answer AND its degree of certainty), as seen in the [chapter on primitives](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#noul-verifying-a-binary-statement).

## Three thresholds, three behaviors

In practice, confidence translates in code into three decision zones, each tied to a different behavior:

| Zone | Behavior |
|---|---|
| High confidence | Act automatically, no human intervention |
| Medium confidence | Proceed with caution (e.g. ask the user to confirm before acting) |
| Low confidence | Escalate to a human rather than risk an automatic decision |

These thresholds are never universal: they depend on the **risk tied to the action**. A destructive or irreversible operation demands a higher threshold than a simple read.

```python
def decide(choice_answer, is_low_risk_action: bool):
    if is_low_risk_action:
        direct_action_threshold = 0.60
    else:
        direct_action_threshold = 0.85

    if choice_answer.confidence >= direct_action_threshold:
        return "execute"
    if choice_answer.confidence >= 0.40:
        return "ask_confirmation"
    return "escalate_to_human"
```

## Example: a voice banking interface

The same action (a transfer) can have different thresholds depending on its amount or status:

| Action | Stakes | Required confidence threshold |
|---|---|---|
| Check a balance | Low (read-only) | 0.60 is enough to answer directly |
| Already-approved transfer, small amount | Moderate | 0.85 to execute automatically |
| Transfer, moderate confidence | High if wrong | Ask for confirmation before executing |

> **Pitfall:** setting a single threshold for every action in a system, without distinguishing a simple lookup from an irreversible action.
>
> **Best practice:** calibrate thresholds per action according to its actual risk, starting with conservative (more demanding) thresholds and then adjusting them based on results observed in production, rather than guessing a definitive value from the start.

## What to remember

| | |
|---|---|
| **To remember** | Confidence derives from the shape of the probability distribution (concentrated = confident, spread out = uncertain) for Choice and Score; for Noul, the probability alone stands in for it. Three decision zones (act, confirm, escalate) apply according to thresholds that depend on the action's risk, not a universal value. |
| **Usable tools** | The `confidence` field of Choice/Score answers; thresholds coded per action. |
| **Pitfalls to avoid** | A single threshold applied to every action, ignoring their respective risk. |
| **Best practices** | Higher thresholds for irreversible or high-stakes actions. Start with conservative thresholds, then adjust them based on results observed in production. |
