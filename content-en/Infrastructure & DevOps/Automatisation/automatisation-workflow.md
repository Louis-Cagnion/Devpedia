---
order: 1
---

# Automation with Visual Workflows

Consuming an [API](/?c=infrastructure&p=api-et-http) requires writing code: a request, a response, processing the result. **Visual workflow automation** platforms (n8n, Zapier, Make) offer another approach to the same need (connecting services together): assembling blocks on a screen instead of writing lines of code.

> **Analogy:** an assembly line. An event triggers the line (a part arrives), then each station performs an action on that part before passing it to the next one. A visual workflow works the same way: an event triggers a sequence of actions, without a worker (here, a developer) having to write the code for each station.

## Trigger, actions, connectors

A workflow is always organized around the same three building blocks:

| Block | Role | Example |
|---|---|---|
| **Trigger** | The event that starts the workflow | A new email received, a form filled in, every hour (scheduled) |
| **Action** | A step performed after the trigger fires | Creating a row in a spreadsheet, sending a message, calling an API |
| **Connector** | The preconfigured block that knows how to talk to a specific service | A Gmail connector, a Slack connector, a generic HTTP connector |

```text
Trigger                    Action 1                    Action 2

New email     ------->  Extract the PDF   ------->  Create a task
received with             attachment                  in a tracking
PDF                                                    tool
```

Internally, a connector remains an [HTTP](/?c=infrastructure&p=api-et-http) call to the service's API: the platform simply hides the request behind a graphical interface, with authentication and data format already preconfigured.

> **Pitfall:** thinking that a visual workflow removes the need to understand what it actually does. A misconfigured connector (wrong field mapped, trigger too broad) fails silently or triggers an action in a loop, exactly like poorly written code.
>
> **Best practice:** test a workflow with a manual trigger before activating it on a real trigger, and monitor its runs (most platforms keep a history per run, with the detail of each step).

## SaaS or self-hosted: who hosts the workflow

The two differ in who runs the platform, the same question as for any [cloud service](/?c=infrastructure&p=le-cloud):

| | SaaS (Zapier, Make) | Self-hosted (n8n in self-hosted mode) |
|---|---|---|
| Hosting | At the provider | On a server chosen by the user |
| Getting started | Immediate, no installation | Requires installing and maintaining the platform |
| Data passing through the workflow | Passes through the provider's servers | Stays on the user's infrastructure |
| Cost | Subscription, often based on the number of runs | Cost of the server, no limit on runs |

[n8n](https://n8n.io) offers both modes (SaaS or self-hosted); [Zapier](https://zapier.com) and [Make](https://www.make.com) remain SaaS-only.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A visual workflow chains a trigger and a sequence of actions linked by connectors, without writing the code for the underlying API calls. |
| **Tools you can use** | n8n (SaaS or self-hosted), Zapier, Make. |
| **Pitfalls to avoid** | Activating a workflow on a real trigger without having tested it manually beforehand. |
| **Best practices** | Test with a manual trigger before activating. Monitor the run history to spot silent failures. |
