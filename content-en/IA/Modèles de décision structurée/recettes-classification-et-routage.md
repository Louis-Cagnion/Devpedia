---
order: 10
---

# Recipes: Classifying and Routing at Scale

Second series of recipes applying the [methodology](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one): classifying content among many possible categories, and deciding when to trust that classification.

## Hierarchical classification: descending a category tree

Classifying content in a deep taxonomy (categories that subdivide into subcategories, across several levels) asks one Choice question **per level**, over only the child options of the node already reached, rather than a single flat question over hundreds of leaves:

| Strategy | Principle | Risk |
|---|---|---|
| Greedy | Keep only the best child at each level | An early mistake is irreversible, nothing lower down corrects it |
| Beam search | Keep several plausible paths in parallel, pick the one with the best overall score at the end | Evidence found deeper down can repair an ambiguous early decision |

Across four taxonomies tested by the vendor (patents, products, scientific subjects, code files), beam search correctly classified 4 out of 4 cases, versus 2 out of 4 for the greedy strategy.

## RAG classification: filtering before generating

In a [RAG](/?c=ia&s=nlp-llm&p=rag) pipeline (retrieving documents before generation), each retrieved passage can be judged by four questions before being passed to the generating LLM:

```python
def router(answers: dict) -> str:
    if answers["contains_injection"] > 0.70:
        return "exclude"                       # attempt to manipulate the model
    if answers["contradicts_the_query"] > 0.70:
        return "conflicting_evidence"          # to present separately, not merged
    if answers["is_relevant"] < 0.45:
        return "exclude"
    if answers["contains_the_answer"] > 0.55:
        return "include"
    return "exclude"
```

This filtering intercepts both [prompt injections](/?c=ia&s=nlp-llm&p=prompt-injection) hidden in a retrieved document and factual contradictions, before they reach the generating LLM.

## Confidence-based classification: adjusting granularity to certainty

Rather than forcing a precise answer even when the model hesitates, this recipe **moves up one level** in the hierarchy when confidence is insufficient, instead of rejecting the classification or forcing it incorrectly:

| Confidence | Reported granularity |
|---|---|
| ≥ 0.9 | The precise group (e.g. an exact industry sub-sector) |
| < 0.9 | The broader category that contains it (e.g. the industry division) |

On a test with 75 industry groups, this approach maintained 90% accuracy on the confident cases, versus only 40% when forcing a precise classification on the uncertain cases, and 70% when simply moving up one level instead of forcing.

## Skill suggestion: choosing among hundreds of options

An agent with many skills or extensions can't describe them all in detail in its context without degrading performance. The recipe proceeds in two requests:

```text
Request 1: one Choice question evaluates ALL skills (short descriptions),
           keeps the 3 best candidates
Request 2: one Noul question per candidate, with its FULL description,
           confirms or rejects each individually
```

Across 488 tested requests, this double-check more than halved the rate of wrong skill loading (from 16.8% to 7.3%) and needless loading (from 9.8% to 4.0%).

## Entity alignment: the same thing, or just something close?

To link two entries from different sources that might describe the same object (two product sheets, two knowledge-graph entities), a Score question evaluates the degree of match on a three-level spectrum (different / close / identical), supplemented by Noul questions on precise criteria (same name, same origin...).

| Result | Action |
|---|---|
| Different products | Leave the entities separate |
| Possibly identical | Send to a human curator |
| Same product | Merge the entries |

> **Pitfall:** merging two entities incorrectly. The vendor's documentation stresses this: merging incorrectly costs more than missing a match, since every fact attached to either entity then becomes attributed to the merged entity.
>
> **Best practice:** reserve automatic merging for very high-confidence cases, and systematically route the gray zone (a possible but uncertain match) to human review rather than defaulting to one outcome or the other.

## What to remember

| | |
|---|---|
| **To remember** | Classifying at scale is done one Choice question at a time (per taxonomy level, or per preselected candidate), never with a single flat question over hundreds of options. The confidence obtained guides the granularity of the answer (moving up one level rather than forcing) and the decision to merge two entities or not. |
| **Usable tools** | Choice per taxonomy level (greedy or beam search); Noul filtering questions for RAG; double Choice-then-Noul verification for selecting among many options; Score + Noul for entity alignment. |
| **Pitfalls to avoid** | Forcing a precise classification despite insufficient confidence. Merging two entities based on a merely possible match. |
| **Best practices** | Move up one granularity level rather than forcing an uncertain answer. Route the gray zone to a human rather than defaulting to one outcome. |
