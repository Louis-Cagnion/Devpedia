---
order: 2
---

# n8n: getting started with the interface

The chapter on [visual workflow automation](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) lays out the vocabulary shared by these tools (trigger, action, connector). This chapter applies it concretely to the [n8n](https://n8n.io) interface, so you know where to find everything before building a first workflow.

## The canvas: the visual workspace

The **canvas** is n8n's main editor area: a blank space where each **node** appears as a rectangular block, freely positioned with the mouse. A node always represents one of the three building blocks already covered (trigger, action, or a special logic node); its icon and name immediately indicate which service or function it represents.

```text
n8n canvas (simplified view):

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Trigger    │─────▶│   Action 1   │─────▶│   Action 2   │
│  (Webhook)   │      │  (HTTP Req.) │      │   (Slack)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

Adding a node happens through the **+** button (on the canvas or after an existing node), which opens a search panel listing every available connector (over 400 built-in services, plus a generic HTTP node for any service without a dedicated connector).

## Connections: making data flow

A **connection** is the line linking one node's output to the next node's input: it represents both the execution order (the next node runs after the one before it) and the data handoff between them (each node receives as input whatever the previous one produced as output).

> **Pitfall:** assuming a connection only carries a "run now" signal, with no data. In reality, each node receives an array of data items (often as JSON) produced by the previous node, and can use it in its own configuration (e.g. reusing an email address extracted by the previous node).
>
> **Best practice:** before configuring a node, check in the execution panel (below) the exact shape of the data received from the previous node, rather than guessing it.

A node can have several outgoing connections: that's how a **conditional node** (*IF*, *Switch*) branches the workflow based on a criterion, each branch leading to a different set of actions. This kind of node is covered in detail in the next chapter on the feature catalog.

## Configuring a node

Double-clicking a node opens its configuration panel, specific to the service it represents: connection credentials (often managed separately, as reusable **credentials** shared across workflows), fields to fill in (an email recipient, a Slack channel, an HTTP request URL), and mapping the data received from the previous node onto these fields.

```text
Configuring a "Send Email" node:

  Recipient: {{ $json.email }}      <- value taken from the data
  Subject:   "Confirmation"            received from the previous
  Body:      "Hello {{ $json.name }}"  node
```

The `{{ ... }}` syntax inserts an **expression**: instead of a fixed value, the field looks up a dynamic piece of data (here, from the JSON received as the node's input).

## The execution panel: seeing what actually happened

Every workflow run (manual or actually triggered) leaves a viewable trace: the **execution panel** lists, node by node, the data received as input and produced as output, with a color code (green for success, red for an error) that lets you immediately spot where a workflow failed.

| Visible information | Purpose |
|---|---|
| Input/output data for each node | Check that the expected data is actually what was received |
| Success/error status per node | Pinpoint exactly where a workflow stopped |
| Past execution history | Compare a failed run to an earlier successful one |

## Testing manually before activating

A newly created workflow stays **inactive** by default: its real trigger (a webhook, a schedule) only starts once the workflow is explicitly activated. The **"Test workflow"** button runs the workflow immediately, once, without waiting for the real trigger, inserting sample data if needed.

> **Pitfall:** activating a workflow right after building it, without testing it manually first. A misconfigured webhook or an action that actually sends a message can then run under real conditions before being checked, potentially repeatedly if the trigger fires often.
>
> **Best practice:** always run "Test workflow" at least once, check every node in the execution panel, before flipping the activation switch.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | The canvas displays a workflow's nodes linked by connections, which carry both execution order and data. Configuring a node means filling in its fields, sometimes with dynamic expressions (`{{ }}`) drawn from the data received. The execution panel shows each node's input/output detail, success or failure. |
| **Usable tools** | The "+" button to add a node; the execution panel to inspect data; the "Test workflow" button for a manual run. |
| **Pitfalls to avoid** | Assuming a connection carries no data. Activating a workflow without testing it manually first. |
| **Best practices** | Check the shape of received data before configuring a node that uses it. Always test manually before activating. |
