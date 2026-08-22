---
order: 1
---

# LLM Monitoring and Operations

Monitoring a classic service comes down to watching an [HTTP status code](/?c=infrastructure&p=api-et-http): `200`, all good, `500`, it crashed. A call to an LLM almost always answers `200`: the question is never *"did it respond?"* but *"is the answer good, and did it cost what it should have?"*. This difference is what makes monitoring an LLM-based system structurally different from classic application monitoring.

## What needs to be logged

A production system must keep, for every call, enough to reconstruct and audit what happened:

| Data | Why |
|---|---|
| Full prompt sent (system + history + question) | Reproducing unexpected behavior requires knowing exactly what the model received |
| Response produced | Without it, no after-the-fact evaluation is possible |
| Number of input and output tokens | This is the basis of cost (see [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production)) and an anomaly indicator (a prompt that balloons in size for no reason often signals an upstream bug) |
| Latency | Catches a service degradation before a user complains about it |
| Model identifier and version | See below: this version changes more often than you'd think |

> **Pitfall:** logging the prompt and response with no precautions. They may contain personal or sensitive data depending on what the user wrote: keeping them as-is reproduces exactly the problem [data governance](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) tries to avoid.
>
> **Best practice:** encrypt these logs at rest and apply a limited retention period to them, at a minimum; see the [retention policy](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) detailed elsewhere.

## Silent version drift

An LLM provider regularly evolves its model, sometimes under the same commercial name (a minor update, a safety adjustment, a change in default behavior). A system that calls "model X" without pinning a specific version can therefore see its behavior change overnight, with not a single line of its own code having moved: the hardest bug to diagnose is the one with no associated commit.

> **Pitfall:** calling "model X" with no specific version pinned, assuming its behavior will stay stable over time.
>
> **Best practice:** pin an explicit version rather than "whatever is latest", and only migrate to a new version after testing it against a set of known cases (see below), the same safeguard as for any external dependency.

## Evaluating an output that's never identical twice

An LLM's non-determinism (see [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production)) makes a classic "the output must be exactly this string" test useless. Two approaches combine in practice:

**A reference case set (*golden set*).** A list of representative prompts whose expected answer (or the criteria a good answer must meet) is known, replayed on every change: to the prompt, the model, or the version. This is the equivalent of a regression test suite, adapted to an approximate rather than exact output.

**A second LLM as evaluator (*LLM-as-judge*).** The judge receives the question, the produced answer, and sometimes a reference answer, then scores the answer against explicit criteria (accuracy, tone, length). This makes it possible to evaluate thousands of cases without systematic human review, reserving the human eye for cases the judge flags as doubtful.

> **Pitfall:** treating an LLM-as-judge's verdict as infallible. The judge inherits the same limits as an ordinary LLM (see [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production)), including the ability to be wrong with the same confidence as a correct judgment.
>
> **Best practice:** reserve human evaluation for cases the judge flags as doubtful, and periodically check a sample of the verdicts it rated "good", not just the ones it flags itself as uncertain.

## The semantic cache: avoiding recomputing an already-known answer

A classic cache maps a response to an **exact key**: the same key returns the same response, a slightly different key (a rephrasing) misses the cache and triggers a new call, even if the question asked was effectively the same. A **semantic cache** solves this by comparing questions by **meaning similarity** rather than text equality, using the same embedding-based search technique as [RAG](/?c=ia&s=nlp-llm&p=rag):

```text
Question 1: "What's the price of the Pro subscription?"
             -> LLM call, response cached along with its embedding

Question 2: "How much does the Pro plan cost?"
             -> embedding close to question 1 (similarity > threshold)
             -> cached response returned, NO LLM call
```

| | Classic cache | Semantic cache |
|---|---|---|
| Matching | Exact key (identical string) | Embedding similarity above a threshold |
| Misses a rephrasing? | Yes, systematically | No, as long as the meaning stays close |
| Cost avoided | Only the exact question already asked | Any question semantically close to one already asked |

> **Pitfall:** an overly permissive similarity threshold matches two questions with genuinely different meanings ("cancel my order" and "cancel my subscription" can be close in embedding space), returning a cached response that doesn't answer the actual question, with the same confidence as a correct answer.
>
> **Best practice:** set the similarity threshold conservatively (even if it means missing a few valid rephrasings), and invalidate cache entries when the underlying information changes, the same staleness problem as any classic cache.

An [LLM gateway](/?c=ia&s=production-et-gouvernance&p=stack-ia) typically centralizes this cache across every application that uses it, rather than each one reimplementing its own.

## Operational safeguards

> **Pitfall:** a traffic spike (legitimate, or a poorly bounded agent loop, see the [Agents](/?c=ia&s=nlp-llm&p=agents) chapter) can blow up a bill within minutes with no "error" alert ever triggering, since every individual call succeeds.
>
> **Best practice:** set up a rate and cost limiter, and a cost dashboard by feature, customer, or user, not a luxury, this is what avoids discovering the bill at the end of the month.

> **Pitfall:** if the main model becomes unavailable or too slow, returning an error straight to the user instead of degrading the service.
>
> **Best practice:** plan a fallback to a simpler model in case of unavailability or excessive slowness: degrade the service rather than interrupt it.

Input and output filtering (detecting a malicious instruction attempt, see [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), and filtering an output before it reaches the user) rounds out these safeguards.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Monitoring an LLM is about the quality and cost of the answer, not a simple status code. Logging prompt, response, tokens, latency, and model version makes it possible to reconstruct an incident. A golden set and an LLM-as-judge replace a classic test in the face of non-determinism. A semantic cache avoids recomputing a response for a rephrased but equivalent question. |
| **Tools you can use** | A cost dashboard by feature/customer. A golden set replayed on every change. A rate and cost limiter, a fallback to a simpler model. A semantic cache, often centralized at an LLM gateway. |
| **Pitfalls to avoid** | Logging prompt/response with no encryption or limited retention. Calling a model with no version pinned. Treating an LLM-as-judge as infallible. Letting a traffic spike or outage degrade the bill or service with no safeguard. An overly permissive semantic cache similarity threshold. |
| **Best practices** | Encrypt logs and limit their retention. Pin an explicit model version. Periodically check a sample of an LLM-as-judge's verdicts. Set up a cost limiter and automatic fallback. Set the semantic cache similarity threshold conservatively. |
