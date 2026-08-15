---
order: 7
---

# LLMs in Production: Use Cases and Limits

Using an LLM from a chat interface and integrating it into a product are two different exercises. In the first case, a clumsy answer is fixed by rephrasing the question. In the second, that same answer goes out unsupervised to a user or a downstream system: which completely changes what needs to be checked before choosing this technology for a given task.

## When an LLM is the right tool

An LLM excels at tasks where the input and output are **language**: understanding free-form text, rephrasing it, extracting information from it, translating it, classifying it, generating new text from instructions. This is precisely the objective it was trained on (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

| Use case | Suited? | Why |
|---|---|---|
| Extracting information from unstructured text (e.g. an email) | Yes | It's natural language understanding |
| Summarizing a long document | Yes | Same reason, with a length/fidelity trade-off |
| Classifying a support ticket by category | Yes, often overkill | A classic model (logistic regression on embeddings) does just as well, cheaper, faster |
| Computing sales tax or a due date | No | An LLM predicts the most plausible token, not the exact result of a computation (see below) |
| Deciding on an irreversible action alone (sending a wire transfer) | No, not without a human safeguard | Non-deterministic answer, never 100% guaranteed |

> **Note:** for exact computation, the right architecture isn't to prompt the LLM better, it's to give it a tool (a Python function, a SQL query) that it calls and whose result it relays (see the [Agents](/?c=ia&s=nlp-llm&p=agents) chapter). The LLM remains excellent at understanding *that* sales tax needs computing and *with which numbers*, but should never be the calculator itself.

## Structural limits to know before you design

These limits aren't bugs that a better version of the model will one day fix: they follow directly from what an LLM is (see its training principle in the [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) chapter).

**Hallucinations.** An LLM doesn't "know" anything the way a database would: it generates the statistically most plausible text given what came before. Nothing in its training pushes it to say *"I don't know"* rather than invent a plausible answer: a citation, a legal reference, a library function that doesn't exist. This is the most dangerous limit in production, because a hallucination is written with the same confidence as a correct answer.

> **Pitfall:** trusting a confidently generated answer without checking it, especially on a verifiable fact (a citation, a law number, a library function). A confident tone is never a reliable indicator of accuracy.
>
> **Best practice:** systematically verify, through an independent source or a tool (see [Agents](/?c=ia&s=nlp-llm&p=agents)), any verifiable factual claim produced by an LLM before treating it as reliable, even more so if the error has a real cost.

**The context window.** An LLM doesn't read arbitrarily long text: it's bounded to a maximum number of tokens (the prompt and its own response included). Beyond that, either the request fails, or the start of the context is silently truncated, depending on the implementation. A 500-page document can't be pasted as-is into a prompt: this is one of the problems [RAG](/?c=ia&s=nlp-llm&p=rag) solves.

> **Pitfall:** exceeding the context window without realizing it: depending on the implementation, the start of the prompt can be silently truncated, with no explicit warning. The model then answers based on a partial context, with nothing flagging it.
>
> **Best practice:** measure the actual size of the prompt in tokens (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) before sending, and explicitly handle an overflow (summarizing, RAG) rather than letting the implementation truncate silently.

**Non-determinism.** The same prompt, sent twice, can produce two different answers: at each token, the model doesn't automatically pick the most probable one, it **draws** from the plausible tokens according to the probability distribution it just computed (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), a draw controlled by a parameter called **temperature**, detailed just below. A direct consequence: an automated test that compares an LLM output to an exact string is inherently fragile (see the [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) chapter for evaluating an output differently).

## Temperature: controlling generation randomness

Temperature doesn't change the probabilities the model computes for the next token: it changes how that draw then uses them, tightening or flattening the gap between the most probable token and the others:

```text
Raw distribution computed by the model for "The cat is sleeping on the ___":
  "couch": 45%   "rug": 20%   "bed": 15%   "roof": 5%   ...

Low temperature (e.g. 0.2) -> tightens the gap, "couch" becomes near-certain
  "couch": ~90%   "rug": ~7%   "bed": ~2%   "roof": ~0.1%   ...

High temperature (e.g. 1.5) -> flattens the gap, alternatives become competitive again
  "couch": ~30%   "rug": ~25%   "bed": ~20%   "roof": ~12%   ...
```

```python
response = client.chat.completions.create(
    model="...",
    messages=[...],
    temperature=0.2,  # tightens the draw: stable answers, little variation from call to call
)
```

| Temperature | Effect on the draw | Typical use case |
|---|---|---|
| 0 | (almost) always the most probable token | Information extraction, classification, factual task |
| 0.2 – 0.5 | Stable answers, little variation from call to call | Customer support, documentation, code generation |
| 0.7 – 1.0 (default value for most APIs) | Good trade-off between consistency and variety | General writing, conversation |
| 1.2 and above | A lot of variety, at the cost of consistency | Brainstorming, creative generation |

> **Note:** a temperature of 0 reduces randomness to its minimum, but doesn't guarantee perfect determinism in every case. On infrastructure that processes many requests in parallel (the case for most providers in production), the order in which floating-point computations run can vary slightly from one call to the next, occasionally producing a different result despite a zero temperature.

> **Pitfall:** using a high temperature by default because "it makes the answers more interesting", including on a factual task (extraction, classification, computation relayed to a tool, see above): this is one of the cases where the added randomness contributes nothing and only increases the risk of an inconsistent or hallucinated answer.
>
> **Best practice:** choose the temperature based on the task rather than copying a default value everywhere: low for anything that must stay reliable and reproducible, higher only when variety in the output is itself what's wanted (see also *"Temperature by use case"* in [Building a Chatbot](/?c=ia&s=applications-llm&p=chatbot)).

**Knowledge frozen at a date.** An LLM only knows what existed in its training data, up to a cutoff date. It has no knowledge of any later event, and can't guess it: at best it can flag this if it was trained to, or hallucinate an answer otherwise. RAG and agents (real-time web search) are the two ways around this limit.

> **Pitfall:** asking about a recent event without checking the cutoff date of the model being used: a confident answer on a topic after that date is almost always a hallucination rather than genuine knowledge.
>
> **Best practice:** check the model's cutoff date before asking it a news-sensitive question, and fall back on RAG or an agent capable of searching for up-to-date information if needed.

**No action on the real world.** An LLM only produces text. Sending an email, writing to a database, calling an API: none of this is possible without a system around it that interprets its output and acts on its behalf: that's the role of agents.

## Cost, a design constraint in its own right

Unlike a classic service where the marginal cost of a request is close to zero, every LLM call has a **real, variable cost**, proportional to the number of tokens read (the prompt, often billed cheaper) and generated (the response, more expensive since it's computed token by token, see the attention mechanism). A prompt that carries a long conversation history or an entire document multiplies this cost on every turn.

Latency follows the same logic: a bigger model generally responds more slowly, and a long answer takes more time than a short one: a model can't "think silently" and then display the result all at once, it produces its answer token by token.

The resulting trade-off is a recurring theme in designing a production system:

| | Smaller/faster model | Bigger model |
|---|---|---|
| Cost per request | Lower | Higher |
| Latency | Lower | Higher |
| Reasoning capability | Limited on complex tasks | Better |
| Typical use case | Classification, simple extraction, first-pass filter | Multi-step reasoning, fine writing |

A common architecture has both coexist: a small model filters or routes the bulk of simple requests, and only the ones that truly need it are sent to the more expensive model.

> **Pitfall:** ignoring cost until the end-of-month bill. Unlike a classic service where the marginal cost of a request is negligible, every LLM call has a measurable, cumulative cost, invisible until some tracking is put in place.
>
> **Best practice:** set up cost tracking by feature or by user from the design stage (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), rather than discovering it after the fact.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | An LLM excels at language tasks, not at exact computation or autonomous action on the real world. Its structural limits (hallucinations, bounded context window, non-determinism, knowledge frozen at a date) follow from its very principle, not from bugs a better version will fix. Every call has a real cost and latency. |
| **Tools you can use** | The temperature parameter to control generation randomness. A tokenizer to measure the actual size of a prompt. A smaller model as a first-pass filter to reduce average cost. |
| **Pitfalls to avoid** | Trusting a confident answer without checking it. Silently exceeding the context window. Asking the model about an event after its cutoff date. Ignoring cost until the bill arrives. |
| **Best practices** | Verify any verifiable factual claim produced by the model. Measure prompt size in actual tokens. Check the cutoff date before a news-sensitive question. Set up cost tracking from the design stage. |
