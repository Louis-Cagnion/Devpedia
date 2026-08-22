---
order: 4
---

# Reducing Response Variance: Self-Consistency, Majority Voting, and Ensembling

The [LLM in production](/?c=ia&s=nlp-llm&p=llm-en-production#temperature-controlling-generation-randomness) chapter shows that temperature narrows or flattens an LLM's random draw, but never guarantees that a single call will produce the right answer: a low temperature limits randomness, it doesn't remove it, and a multi-step reasoning chain can always start down the wrong path from the very first token. Another family of techniques attacks the problem differently: instead of changing *how* a single generation draws its answer, it generates **several independent responses** and combines them to get a result more reliable than a single attempt.

## Majority Voting: Asking Several Times, Keeping the Most Frequent Answer

**Majority voting** sends the same prompt *N* times with a non-zero temperature (at temperature 0, the *N* responses would almost always be identical, see the note on imperfect determinism in [LLM in production](/?c=ia&s=nlp-llm&p=llm-en-production#temperature-controlling-generation-randomness)), then keeps whichever response comes up most often among the *N*:

```python
from collections import Counter

def majority_vote(prompt, n=5, temperature=0.7):
    responses = [
        client.chat.completions.create(
            model="...",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        ).choices[0].message.content
        for _ in range(n)
    ]
    most_common, vote_count = Counter(responses).most_common(1)[0]
    return most_common, vote_count / n  # chosen answer + confidence score
```

The `vote_count / n` ratio serves as a confidence score: 5 identical responses out of 5 inspire more confidence than 3 out of 5, even though majority voting keeps the winning answer in both cases.

| Suited to | Not suited to |
|---|---|
| Discrete, verifiable answers: classification, extracting a field, multiple choice, a calculation delegated to a tool | Open-ended generation: writing, summarizing, creative brainstorming |
| Several valid phrasings of the same answer rarely exist | Two different pieces of writing don't "vote" for each other: there's no majority to extract |

> **Pitfall:** comparing free-text responses for a vote without normalizing them first (e.g., "Paris" and "paris." counted as two different answers because of casing or punctuation). The vote then artificially underestimates the true majority.
>
> **Best practice:** normalize each response (lowercase, punctuation stripped, unified format) before comparing them, especially when the answer is supposed to be an exact value rather than free text.

## Self-Consistency: Voting on the Conclusion of Several Reasoning Chains

**Self-consistency** applies the same voting principle, but to the final result of several independent [chain-of-thought reasoning runs](/?c=ia&s=nlp-llm&p=prompt-engineering#step-by-step-reasoning-chain-of-thought) rather than to a directly produced answer. Each run can take a different reasoning path (an intermediate calculation phrased differently, a different order of steps), but if most of the paths converge on the same conclusion, that conclusion is markedly more reliable than a single reasoning chain, however detailed:

```text
Question: "A train leaves at 2:12pm at 80km/h, another at 2:27pm at 100km/h
on the same track. At what time does the second one catch up to the first?"

5 independent chain-of-thought runs (temperature > 0):

Run 1 -> calculation path A -> conclusion: 3:39pm
Run 2 -> calculation path B -> conclusion: 3:39pm
Run 3 -> calculation path A -> conclusion: 3:39pm
Run 4 -> calculation path C -> conclusion: 3:42pm   (rounding error)
Run 5 -> calculation path A -> conclusion: 3:39pm

Voting on the CONCLUSION (not the path): 3:39pm wins (4 votes out of 5)
```

The technique comes from a dedicated research paper: [*Self-Consistency Improves Chain of Thought Reasoning in Language Models*](https://arxiv.org/abs/2203.11171) (Wang et al., 2022), which shows measurable reliability gains on calculation and logical reasoning tasks compared to a single chain-of-thought run.

> **Pitfall:** applying self-consistency to a task that doesn't already benefit from chain-of-thought (a direct extraction, a simple classification): the extra cost (several full reasoning chains to generate, not just several short answers) then adds nothing that a simple majority vote wouldn't have already given for much less.
>
> **Best practice:** reserve self-consistency for tasks that already benefit from chain-of-thought (multi-step calculation, logic, breaking down a problem), and plain majority voting for everything else.

## Ensembling: Combining Different Models or Configurations

Rather than resampling the same model with the same prompt, **ensembling** combines the responses of several different models (for example two different providers) or several variants of the same prompt (a rephrasing, different few-shot examples), then aggregates them by vote or through a "judge" model tasked with comparing the responses and picking the best one or synthesizing a new one.

| Technique | What varies across the *N* attempts | What stays the same |
|---|---|---|
| Majority voting | The random draw (temperature) | The model, the prompt |
| Self-consistency | The random draw, the reasoning path | The model, the prompt |
| Ensembling | The model and/or the prompt itself | Nothing is necessarily fixed |

Ensembling helps more when the errors of the different attempts are genuinely independent: models from different providers, trained on different data with different architectural choices, don't share the same blind spots, so their respective errors are less likely to overlap. It's the same principle as an ensemble of classic models in machine learning (several independent predictors that vote), carried over to LLMs.

> **Pitfall:** doing ensembling with several instances of the same underlying model (just slightly reworded prompts, for example), expecting the same gain as with genuinely different models. If the attempts share the same underlying bias, their errors overlap too, and ensembling loses most of its value.
>
> **Best practice:** favor genuinely independent sources of error (different providers or architectures) over superficial variations of the same model, when the stakes justify the cost of ensembling.

## The Cost, Latency, and Reliability Trade-off

These three techniques share the same trade-off: the reliability gained is paid for in calls multiplied by *N*, never for free (see also [cost as a design constraint](/?c=ia&s=nlp-llm&p=llm-en-production) for a single call).

| | Cost (number of calls) | Latency if sequential | Reliability gain |
|---|---|---|---|
| A single attempt | 1× | Baseline | None |
| Majority voting | *N*× | *N*× | Moderate, on discrete answers |
| Self-consistency | *N*× (full reasoning chains) | *N*× | High, on reasoning tasks |
| Ensembling | *N*× (often pricier: different models) | *N*× | High, if errors are independent |

The *N* calls can run in parallel (concurrent API requests) to limit the impact on perceived latency, but the compute cost itself remains multiplied by *N* even when the wait time isn't.

> **Pitfall:** multiplying samples by reflex on a task where latency is critical (a real-time conversational chatbot) without having measured the actual reliability gain it brings. The extra cost is systematic, the benefit isn't always.
>
> **Best practice:** reserve these techniques for decisions where a mistake genuinely costs more than *N* extra calls (a critical calculation, high-stakes classification, a pivotal step in an [agent](/?c=ia&s=nlp-llm&p=agents)), not as a systematic reflex on every request.

## Key Takeaways

| | |
|---|---|
| **Key Takeaway** | Lowering the temperature reduces the randomness of a single call but doesn't remove it. Majority voting, self-consistency (voting on the conclusion of several chain-of-thought runs), and ensembling (different models or prompts) all generate several independent responses and combine them to get a result more reliable than a single attempt. |
| **Available Tools** | Several parallel API calls with non-zero temperature, an occurrence counter for voting, a "judge" model to aggregate ensembling responses. |
| **Pitfalls to Avoid** | Comparing non-normalized text responses for a vote. Applying self-consistency to a task that doesn't need chain-of-thought. Ensembling with variants too close to the same model. Multiplying samples without measuring the actual reliability gain. |
| **Best Practices** | Normalize responses before voting. Reserve self-consistency for multi-step reasoning tasks. Favor genuinely independent models for ensembling. Reserve these techniques for decisions where the stakes justify the cost multiplied by *N*. |
