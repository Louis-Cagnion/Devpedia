---
order: 2
---

# Choosing the model and the effort level of Claude

> **Values verified on October 11, 2026.** Models, effort levels and prices change: check the official documentation of [Anthropic](https://www.anthropic.com), the company that develops Claude, on the [models page](https://docs.claude.com/en/docs/about-claude/models) and on the [pricing page](https://www.anthropic.com/pricing).

**Claude** is a family of [LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm) (large language models, programs that produce text). Two settings determine both the result and the bill: the **model** (which program answers) and the **effort** (how much work it does before answering). A poor choice costs money in both directions: too weak, the task fails; too strong, you pay for [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (the word fragments the model reads and writes, and that are billed) for nothing. This chapter gives the benchmarks to choose, then shows where to set each setting in [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) and in the [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (the way to send requests to a service from a program).

## Two distinct settings

| Setting | Question | What it changes |
|---|---|---|
| Model | Which program answers? | The price per token, the reasoning capacity, the response delay (latency, see [LLM in production](/?c=ia&s=nlp-llm&p=llm-en-production)) |
| Effort | How much work does it put into this answer? | The number of tokens produced, hence the cost and the delay; low effort also means fewer tool calls (actions such as reading a file, see [agents](/?c=ia&s=nlp-llm&p=agents)), less preamble (introductory text before acting) and shorter confirmations |

The two combine and are chosen together, as the decision tree below shows.

## Current models

Each model has an **API identifier**: the exact string to provide when a program calls the service through the API. Prices are in dollars per million tokens (M). The **input** refers to the tokens sent to the model (the [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), that is the instruction and the documents provided), the **output** to those it produces (the response), which cost more.

| Model | API identifier | Input ($/M) | Output ($/M) | Default effort | When to choose it |
|---|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0.10 | 0.50 | medium | Simple, high-volume tasks (classifying, extracting, chatting), subagents: the cheapest |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2.00 | 10.00 | high | Middle tier: when Haiku fails on a real sample (a few tasks representative of your own work) and the extra cost of Opus is not justified |
| Claude Opus 5.5 | `claude-opus-5-5` | 4.00 | 20.00 | medium | When Sonnet fails on a real sample; its reasoning cannot be turned off, so effort is its only depth setting |
| Claude Fable 5.1 | `claude-fable-5-1` | 10.00 | 50.00 | high | The most expensive: only when Opus fails at an appropriate effort |

Two details:

- Haiku 5.5 is billed at the price above for prompts up to 100,000 tokens; beyond that, $0.50 for input and $2.50 for output.
- All four models have a context window of 1 million tokens: the maximum amount of text (prompt and response included) they process at once (see [the context window](/?c=ia&s=nlp-llm&p=llm-en-production)).

The "When to choose it" column applies a simple rule: take the cheapest model that succeeds on a real sample of your own tasks, and move up one step only if a measurement requires it.

## Effort levels

All four models accept the same five levels, from the most economical to the most expensive. The official guideline is given for each one, along with an example task.

| Level | Official guideline | Concrete example |
|---|---|---|
| `low` | Subagents, simple tasks, chat, classification | Sorting a customer support message into one of three categories (billing, bug, other); a [subagent](/?c=ia&s=nlp-llm&p=agents) (secondary agent launched by another agent for a subtask) that searches for the file where a function is located |
| `medium` | Economy tier and starting point for agentic code (an agent that reads, edits and tests code) | Modifying a function whose expected behavior is precisely described, then running the tests |
| `high` | Good quality/token trade-off; minimum for work where quality depends directly on the subtlety of reasoning | Reviewing code (rereading changes to find errors) in a payment module |
| `xhigh` | Recommended for most code and agent uses, especially long ones | Adding a feature that touches about ten files, in several chained steps |
| `max` | When correctness matters more than cost, only if a measurement shows a margin at the lower level | An intermittent anomaly (one that appears only from time to time), whose cause remains unknown after a full attempt at `xhigh` |

## Cost: judging by completed task

The cost of a call is: input tokens × input price + output tokens × output price. Worked example based on the models table, for a task of 100,000 input tokens and 20,000 output tokens (excluding the effect of effort, which varies the output):

| Model | Input (0.1 M) | Output (0.02 M) | Total |
|---|---|---|---|
| Haiku 5.5 | $0.01 | $0.01 | $0.02 |
| Sonnet 5.5 | $0.20 | $0.20 | $0.40 |
| Opus 5.5 | $0.40 | $0.40 | $0.80 |
| Fable 5.1 | $1.00 | $1.00 | $2.00 |

Raising the effort increases the output, and therefore the bill. But the right indicator is not the price of a request: it is the cost per **completed task**. A cheaper request that forces more turns (successive exchanges with the model) does not cost less in total. Tracking is done as for any [LLM cost](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

The `max` level therefore follows a strict rule: it is justified only for a frontier problem (with no known solution), **after a failure observed at `xhigh`**. Never by default, never as a precaution.

## What a higher effort does not guarantee

| Limit | Explanation |
|---|---|
| Diminishing returns | Each step costs more tokens and time, for a smaller and smaller quality gain, sometimes none at all on a task already succeeded at the lower level |
| Overthinking | On a simple task, a high effort spends tokens examining what does not need examining |
| No guaranteed truth | High effort does not eliminate [hallucinations](/?c=ia&s=nlp-llm&p=llm-en-production) (invented claims, stated with confidence): the result must always be verified |
| No replacement for a good instruction | A vague request stays vague at `max`: [prompt writing](/?c=ia&s=nlp-llm&p=prompt-engineering) comes first |

## Decision tree

```text
Task to entrust to Claude
        │
        ▼
1. MODEL: start with the cheapest (Haiku 5.5), test it on a real sample
        │
        ├─ succeeds ──────────────────────────► keep it
        └─ fails ─────────────────────────────► Sonnet 5.5, then Opus 5.5, then Fable 5.1
        │
        ▼
2. EFFORT: start from the model's default, raise it only if the task
   concretely justifies it (strong ambiguity, high stakes, observed failure)
        │
        ├─ simple, subagent, classification ──► low
        ├─ well-specified code ───────────────► medium
        ├─ review, sensitive work ────────────► high
        ├─ long code or agent work ───────────► xhigh
        └─ observed failure at xhigh, problem
           with no known solution ────────────► max
        │
        ▼
3. Measure the cost per completed task: insufficient? Move up one step and measure again
```

## Requesting a level in Claude Code and the API

[Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) is the AI assistant that you drive from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). A **session** there is an ongoing conversation. The choice is made in three places:

| Where | Setting | Scope |
|---|---|---|
| Claude Code session | Commands `/model` and `/effort` | The current session, and new sessions (setting saved as the default) |
| Agent definition | `model:` and `effort:` lines in the file header | Every time this [agent](/?c=ia&s=nlp-llm&p=agents) is launched |
| API | `output_config` field with `effort` | The request sent |

### In the session

```text
/model sonnet
```

A command starting with `/` is typed into the Claude Code conversation. `/model <name>` changes the model of the session and saves it as the default for new sessions.

```text
/effort medium
```

`/effort <level>` sets the effort. Observed response: "Set effort level to medium (saved as your default for new sessions): Balanced approach with standard implementation and testing". The level therefore stays applied to the following sessions: reset it to its usual value after a one-off need.

### In an agent definition

An agent definition is a file in the `~/.claude/agents/` folder (the `~` stands for the user's home folder, see [paths and directory tree](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), named `<name>.md`. Its **header** (*frontmatter*) is a block of settings enclosed by two `---` lines, in [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) format (lines of the form `key: value`). Excerpt from the real file `builder-sonnet-medium.md` (shortened and translated description; the `tools` and `color` lines, unrelated to the subject, are omitted):

```yaml
---
# Start of the header
name: builder-sonnet-medium
# Name under which the agent is called
description: Carries out ONE subtask of a validated plan (sonnet, effort medium: daily work).
# The agent's role in one sentence
model: sonnet
# Agent's model: a short name is accepted here
effort: medium
# Agent's effort level: low, medium, high, xhigh or max
---
# End of the header: the text that follows in the file contains the agent's instructions
```

The file `builder-haiku.md` has `model: haiku` but no `effort:` line: the file therefore sets no effort. Its description says « sans effort » (without effort), which here means "no setting applied", not "Haiku does not handle effort": Haiku 5.5 accepts all five levels.

### On the API side

A request is a [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) message (a text-based data exchange format) sent to the service. Effort is set in the `output_config` field:

```text
// Partial content of the request: the other fields (the messages, in particular) are omitted
{
    // API identifier of the model (see the models table)
    "model": "claude-sonnet-5-5",
    // Output settings; "effort" takes one of the five levels
    "output_config": { "effort": "medium" }
}
```

## Pitfalls

| Pitfall | Why it's a problem |
|---|---|
| Choosing `max` by default or as a precaution | Maximum cost for a gain that is most often nil: it is reserved for a failure observed at `xhigh` |
| Raising the effort before measuring | Without a measurement on a real sample, you cannot know whether the lower level was enough |
| Judging cost per request | A cheaper request that needs more turns costs as much or more per completed task |
| Comparing two models at different effort | Defaults differ (Sonnet 5.5 at `high`, Opus 5.5 at `medium`): the comparison no longer measures the model alone |
| Forgetting that a setting is saved | `/model` and `/effort` persist for new sessions: a high level left in place makes every next session cost more |
| Believing that Haiku handles no effort | True for the older Haiku 4.5, false for the current generation: Haiku 5.5 accepts `low` to `max` |
| Relying on effort to compensate for a vague instruction | It deepens reasoning, it does not guess intent: clarify the prompt first |
| Relying on values from memory | Models, levels and prices change: reread the official documentation before deciding |

## Best practices

| Best practice | Why |
|---|---|
| Start with the cheapest model and its default effort | It is the most economical starting point; you move up only if the task justifies it |
| Raise the effort for a concrete reason: strong ambiguity, high stakes or an observed failure | Each step has a cost; a specific reason avoids paying for it unnecessarily |
| Reserve `max` for an observed failure at `xhigh` on a problem with no known solution | The only case where the extra margin may be worth its price |
| Measure on a real sample before raising a default | A measurement takes precedence over intuition (see [measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Set the level in the header of each agent | Each role keeps its model and its effort, for example `low` for a research subagent |
| Monitor the cost per completed task | The only indicator that counts the extra turns |

## Key Takeaways

| | |
|---|---|
| **Key Points** | Two settings: the model (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, from cheapest to most expensive) and the effort (`low`, `medium`, `high`, `xhigh`, `max`). Start from the default and move up only for a concrete reason. `max` is reserved for a failure observed at `xhigh`. In Claude Code: `/model`, `/effort`, the `model:` and `effort:` lines of an agent; on the API side: `output_config`. |
| **Pitfalls to Avoid** | `max` by default, raising the effort without measuring, judging cost per request, comparing at different effort, forgetting that a setting is saved, believing Haiku 5.5 does not handle effort, expecting effort to fix a vague instruction. |
| **Best Practices** | Cheapest first, measure on a real sample, set the level in the agent header, judge the cost per completed task, check the official documentation. |
