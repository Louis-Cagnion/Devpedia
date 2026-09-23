---
order: 6
---

# Building with a Structured Decision Model: The Seven-Step Method

The previous chapters detail each building block ([primitives](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), [state and fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles), [confidence](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree), [composite scoring and routing](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition)). This chapter assembles them into an ordered method for designing a complete system.

## The guiding principle: code stays in control

The central idea: **code keeps control of the flow**, and the structured decision model only handles narrow decisions inside that flow. This differs from an autonomous [agent](/?c=ia&s=nlp-llm&p=agents), where the model itself decides the sequence of steps: here, the sequence stays written ahead of time in code, only the content of each individual decision is handed to the model.

## The seven steps

```text
1. Code for the    2. Decompose the   3. Structure the    4. Decompose
   deterministic ->    input state   ->   input state    ->   the questions
                                                                     |
                                                                     v
7. Combine in  <- 6. Ask them all  <- 5. Structure the   <---------+
   code             in parallel       questions
```

| Step | What it does |
|---|---|
| 1. Prefer code for the deterministic | Keep every already-reliable rule in ordinary software; hand the model only the judgment that genuinely needs context |
| 2. Decompose the input state | Pass only the context relevant to the judgment requested, never everything available |
| 3. Structure the input state | Use nested JSON for the state, with explicit backticked paths if the state is nested (e.g. `` `ticket.messages[0].text` ``) |
| 4. Decompose the questions | Break a broad judgment into several atomic, explicit questions rather than one question that hides several decisions: the most important concept of the method |
| 5. Structure the questions | Add structure to instructions and criteria (rather than a plain string) as soon as a directive deserves to be broken down, for example contrastive criteria for a Choice question |
| 6. Ask all the questions in parallel | See [speculative fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#the-speculative-fan-out-pattern) |
| 7. Combine the answers in code | Via a weighted formula (see [composite scoring](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition#composite-scoring-combining-independent-dimensions)) or via confidence-based routing (see [calibrated confidence](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#three-thresholds-three-behaviors)) |

### Step 1: what stays in code, what goes to the model

| Stays in code (deterministic) | Goes to the model (contextual judgment) |
|---|---|
| A fixed business rule ("if the amount exceeds X, block") | Estimating whether a text expresses frustration |
| A calculation, a database lookup | Classifying an intent from a natural-language message |
| The sequence of steps in the program | A decision that depends on nuances of language |

> **Pitfall:** handing the model a rule that could be expressed as a simple condition in code (e.g. comparing two numbers). A structured decision model is neither more reliable nor faster than a direct comparison for this kind of case, and needlessly costs a network call.
>
> **Best practice:** reserve the model only for judgments that genuinely require understanding the content (natural language, contextual nuance), never for a rule already expressible directly in code.

### Steps 2 and 3: decompose the state, structure it

Pass only the context relevant to the judgment requested (step 2), then structure that state as nested JSON with an explicit path (`` `support.tickets[0].message` ``) as soon as it removes ambiguity about exactly what a question is evaluating (step 3).

### Step 4: decompose the questions, the most important concept

"Ask one quick judgment per question" remains the central rule of the whole method: a multi-factor task is broken into several atomic questions, combined afterward in code (step 7), never into a single question that would decide everything at once. A broad question ("is this message spam?") hides several distinct judgments; making them explicit (does it ask for a credential? does it promise an unexpected reward? does it create artificial urgency?) then lets you inspect and weight them separately in code.

## The properties expected of a structured decision model

Once the method is applied, a system built this way inherits properties specific to this family of models:

| Property | What it means |
|---|---|
| Typed | The output always respects the supplied schema, never an invalid format to fix afterward |
| Parallel | Each question is evaluated independently, with no hidden context between them |
| Comparable | Answers are sortable and enable conditions, thresholds, and comparisons directly in code |
| Fast | On the order of 100 ms per request, far below a comparable generative LLM |
| Calibrated | Probabilities reflect a real frequency rather than overconfidence, thanks to dedicated training (the [next chapter](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd) details this training method) |
| Stable | Consistent answers from one run to the next on the same state |

## Integrated example: ticket triage

The workflow that runs through every chapter of this part: a support ticket (structured state and explicit paths, steps 2 and 3) gives rise to seven independent, atomic questions of type Choice/Score/Noul (step 4), asked in a single request (step 6). The code then combines these signals (step 7, e.g. a composite spam score) and routes the final decision based on the category and confidence obtained (step 7 as well), never handing the model the sequencing decision itself (step 1).

## What to remember

| | |
|---|---|
| **To remember** | Building with a structured decision model follows seven ordered steps: keep the deterministic in code, decompose then structure the state, decompose then structure the questions, group them in parallel, combine the answers in code. The result is typed, parallel, comparable, fast, calibrated, and stable. |
| **Usable tools** | A JSON state with explicit paths; atomic, structured Choice/Score/Noul questions; combination and routing code. |
| **Pitfalls to avoid** | Handing the model a rule already expressible as a simple condition in code. Asking a broad question that hides several distinct judgments. |
| **Best practices** | Reserve the model for judgments that require understanding language or context; keep every deterministic rule in ordinary code; break each broad judgment into atomic questions. |
