---
order: 7
---

# RLHF, RLVR, RLCD: Training a Model for Something Other Than Good Writing

The [methodology](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) and calibrated properties seen so far don't fall out of ordinary training: they come from a deliberate choice, made *after* the model's base training, about what to optimize for. This chapter presents three approaches to that training phase, called **post-training** (it happens after the main training detailed in [Training and gradient descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).

## The common principle: adjusting a model from a feedback signal

The three approaches below rely on **reinforcement learning**: rather than learning to reproduce an exact example (like classic supervised training), the model produces an output, receives a **feedback signal** (a reward) that judges that output, and adjusts its parameters to get better rewards next time. It's the same principle used to train an animal with treats: no explicit instruction on the exact motion to make, only a "good" or "bad" signal after the fact, repeated until the desired behavior emerges. What distinguishes RLHF, RLVR, and RLCD is **where this reward signal comes from**.

| Approach | Where the reward comes from | Optimizes for |
|---|---|---|
| **RLHF** (*Reinforcement Learning from Human Feedback*) | Humans who compare answers and say which they prefer | Answers appreciated by humans (chatbots, conversational assistants) |
| **RLVR** (*Reinforcement Learning with Verifiable Rewards*) | An automatic verifier (e.g. a passing unit test, a calculation with a known result) | Correct reasoning on tasks with a verifiable answer (mathematics, code) |
| **RLCD** (*Reinforcement Learning for Calibrated Decisions*) | The gap between the stated probability and the actual frequency of the correct outcome | Reliable probabilities rather than generated text |

## RLHF: optimizing for human preference

**RLHF** is the most widespread approach for today's conversational [LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm): human evaluators compare pairs of answers to the same prompt and indicate which they prefer, and this signal is then used to train the model to produce that kind of answer more often.

## RLVR: optimizing for a verifiable outcome

**RLVR** replaces human judgment with automatic, objective verification: a unit test passes or fails, a calculation result is right or wrong. This approach produces reasoning models that perform well on tasks with a verifiable answer (mathematics, testable code generation), at the cost of slower, more expensive inference (the model "thinks" longer before answering).

## RLCD: optimizing for a reliable probability, not for text

**RLCD**, the approach used to train [structured decision models](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm), seeks neither to please a human nor to produce textual reasoning: the reward measures whether the **probability stated by the model matches the actual frequency** of the correct outcome across many similar cases (this is the very definition of the [calibrated confidence](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree) seen in the previous chapter). A model trained with RLCD never writes an open-ended answer: it doesn't even have that capability, since nothing in its training pushes it toward one.

## A risk specific to RLHF: distribution narrowing

The vendor's documentation illustrates a risk of RLHF with an analogy borrowed from another family of generative models (generative adversarial networks, or GANs, detailed in the [original research paper](https://arxiv.org/abs/1406.2661) if the topic is worth pursuing further): **mode collapse**, when a generator starts producing the same output repeatedly rather than covering the full range of possible diversity. Excessive RLHF training can produce a similar effect: by optimizing heavily for what a human prefers, the model narrows the range of its possible answers around what "pleases", at the expense of diversity and, potentially, of reliability on cases that diverge from what was judged preferable.

> **Pitfall:** assuming that a model optimized with RLHF (and therefore judged "good" by humans in conversation) is automatically reliable for automated machine-to-machine decisions. The vendor's documentation sums up the distinction: *"Human preference and machine trustworthiness are different optimization targets."* A model trained to please isn't trained to be accurate or predictable.
>
> **Best practice:** match the training method to the actual intended use: RLHF for a conversational interface where perceived human quality matters, RLVR for verifiable reasoning, RLCD for structured decisions consumed directly by code, without routing back through human judgment each time.

## Machine interface or conversational interface

This distinction reflects a broader design choice: a classic LLM targets a **conversational interface** (narrative fluency, tone suited to a human) whereas a structured decision model targets a **machine interface** (predictability, output directly usable by code, with most interactions actually being machine-to-machine rather than a dialogue with a human).

## What to remember

| | |
|---|---|
| **To remember** | RLHF, RLVR, and RLCD are three ways of training a model after its base training, differing in the source of the reward signal: human preference (RLHF), an automatic verifier (RLVR), or the gap between stated probability and actual frequency (RLCD). Excessive RLHF can narrow the diversity of answers (mode collapse), and optimizing for human preference doesn't optimize for machine reliability. |
| **Usable tools** | No tool to handle directly; this distinction guides model choice based on the intended use (conversation, verifiable reasoning, automated decision). |
| **Pitfalls to avoid** | Assuming a model trained with RLHF, judged "good" by humans, is reliable for automated machine-to-machine decisions. |
| **Best practices** | Choose the training method (and therefore the model) based on the actually intended interface: conversational (RLHF), verifiable reasoning (RLVR), or structured decision consumed by code (RLCD). |
