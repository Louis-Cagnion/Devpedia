---
order: 1
---

# Hooks: automating an LLM agent at precise points in its lifecycle

An [agent-based assistant](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) runs, turn after turn, on a [tool/reasoning loop](/?c=ia&s=nlp-llm&p=agents): it receives a request, decides whether or not to call a tool, receives a result, and starts again. This loop is executed by a program (the application or command-line tool that hosts the agent), not by the model itself: this program is the **harness**. A **hook** is a piece of code that the harness itself executes at a precise point in this loop, without ever going through the model: it always runs, whether the model thinks of it or not. This chapter explains this mechanism as a general LLM configuration pattern, using a command-line agent as a concrete illustration (Claude Code serves as an example, but the principle appears, under other names, in most agent-based tools).

## The problem: a prompt instruction is never guaranteed

Asking the model to do something systematically ("always re-read the file before modifying it", "warn me before any deletion") remains a simple request addressed to a probabilistic system (see the [limits of an LLM in production](/?c=ia&s=nlp-llm&p=llm-en-production)): nothing forces its execution.

| | Prompt instruction | Hook |
|---|---|---|
| Who executes it | The model, if it chooses to follow it | The harness, outside the model |
| Execution guarantee | None: can be forgotten, bypassed, diluted by a long context | Systematic: the code runs every time the anchor point occurs |
| Can be ignored via manipulated data (*[prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)*) | Yes | No: it never goes through the model's reasoning |

## The principle: a trigger, an action, outside the model's control

The mechanism reuses the idea of a [trigger that starts an action](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) (a received email triggers a workflow) or an [`addEventListener` on a web page](/?c=langages&s=javascript&p=dom-et-evenements) (a click triggers a function): an event occurs, a function runs in response. Here, the event is no longer a user action or an email, but a precise point in the agent's lifecycle.

```text
Agent lifecycle event
        │
        ▼
   ┌─────────┐
   │  Hook   │  ← code written by the developer, not by the model
   └─────────┘
        │
        ▼
Decision: pass through / block / modify / add context
```

## Typical anchor points of an agent

The exact names vary from tool to tool, but the same moments recur everywhere:

| Anchor point (generic name) | Triggered | Example use |
|---|---|---|
| Session start | On launching or resuming a conversation | Load a project context, check an external state |
| Before a tool call | Just before the agent executes an action (command, file write...) | Block a dangerous command, ask for confirmation |
| After a tool call | Just after the result of an action | Automatically format a file that was just modified |
| Before sending to the model | Just before the prompt is sent to the model | Inject up-to-date information (date, state of a system) |
| End of turn / session | When the agent stops or finishes a response | Log, notify, save a summary |

## Anatomy of a hook: input, decision, output

A hook receives structured data ([JSON](/?c=infrastructure-devops&s=infrastructure&p=json)) describing the event, and responds in the same way: it is this response that drives what happens next.

```text
// Input received by the hook (example: before a tool call)
{ "tool_name": "delete_file", "tool_input": { "path": "config/prod.yaml" } }

// Possible hook output: blocks the action and explains why
{ "decision": "block", "reason": "Deleting a config file without explicit confirmation" }
```

| Possible decision | Effect |
|---|---|
| Pass through | The agent continues normally, nothing changes |
| Block | The action never happens, the agent receives the reason for the refusal |
| Modify | The action's input is rewritten before execution |
| Add context | Information is injected into what the model sees, without going through an agent action |

## Pitfalls

| Pitfall | Why it's a problem |
|---|---|
| Slow, synchronous hook | Every occurrence of the anchor point waits for the hook to finish: a poorly written hook slows down the entire agent |
| Silent failure | A hook that crashes without reporting an error gives the impression that the automation took place, when nothing actually happened |
| Executing untrusted data | A hook that builds a command from data coming from outside (file, web page, tool result) opens the same flaw as a [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection): the data can drive the hook itself |
| Confusing hook guarantee with prompt instruction | Believing that writing a rule in the system prompt offers the same reliability as a hook, when only the latter is actually always executed |

## Best practices

| Best practice | Why |
|---|---|
| Set a short maximum delay (*timeout*) | Prevents a stuck hook from freezing the entire agent |
| Fail loudly, never silently | A hook error must be visible, like any [error that gets logged](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Limit the hook to the strict minimum | The less a hook does, the smaller the [attack surface](/?c=ia&s=nlp-llm&p=prompt-injection) it offers in case of manipulated data, and the fewer different ways it has to fail |
| Test the hook in isolation before wiring it up | Check its behavior with a simulated input, without depending on a real agent turn to trigger it |

## Key Takeaways

| | |
|---|---|
| **Key Points** | A hook is code executed by the harness, not by the model, at a precise point in an agent's lifecycle: it always runs, unlike a prompt instruction. |
| **Pitfalls to Avoid** | Slow and blocking hook, silent failure, executing untrusted data, confusing hook guarantee with a simple instruction. |
| **Best Practices** | Short timeout, visible failure, minimal scope, isolated testing before integration. |
