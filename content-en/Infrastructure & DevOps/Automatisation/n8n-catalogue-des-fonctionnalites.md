---
order: 3
---

# n8n: feature catalog and node types

The previous chapter laid out the generic building blocks of a node (trigger, action) and its configuration. This chapter details the main families of specific nodes n8n offers, beyond a simple connector to an external service.

## Triggers: beyond the webhook

A **trigger** can take several forms, not just an external event:

| Trigger type | Starts the workflow when... |
|---|---|
| **Webhook** | An HTTP request arrives at a URL specific to the workflow |
| **Schedule** | At a regular interval (every hour) or a specific time (every day at 8am) |
| **Manual** | A human clicks "Test workflow" in the editor |
| **From another workflow** | Another n8n workflow explicitly calls it (see below) |

A workflow has only one active trigger at a time (the one that actually started it): several trigger-type nodes can coexist on the same canvas, but each one starts its own independent run.

## Code nodes: stepping out of no-code when needed

The **Code node** runs JavaScript or Python directly inside the workflow, for processing too specific for a preconfigured connector (a complex data transformation, a calculation, custom filtering):

```javascript
// Code node (JavaScript): keep only items whose amount exceeds
// 100, and add a computed field
return $input.all().filter(item => item.json.amount > 100).map(item => {
  item.json.amountWithTax = item.json.amount * 1.2;
  return item;
});
```

> **Pitfall:** using the Code node by developer reflex, even when an existing preconfigured node (filter, edit fields) would do the same thing. A workflow stuffed with code loses no-code's readability advantage for someone who didn't write that code.
>
> **Best practice:** reserve the Code node for processing no preconfigured node covers, and briefly document (a code comment, or an explicit node name) what it does for the next person opening the workflow.

## Conditional nodes: branching the workflow

Already mentioned in the previous chapter, these nodes deserve more detail: the **IF** node evaluates a condition and sends data down one of two branches (true / false); the **Switch** node generalizes the principle to several branches based on a field's value.

```text
IF node: condition = "amount > 1000"

  Input                      "true" output        "false" output
  [amount: 1500]  ------>    [amount: 1500]
  [amount: 50]    --------------------------->     [amount: 50]
```

Each branch then leads to its own sequence of actions (e.g. a specific alert for high amounts), before potentially merging back further down the workflow.

## The error workflow: what to do when a run fails

By default, a failing node stops the workflow it belongs to, with no automatic follow-up action. An **error workflow** is a separate workflow, designated in a main workflow's settings, that triggers specifically when the latter fails: it receives the error details as input (which node, what message) and can alert a team (Slack, email) or attempt a compensating action.

> **Pitfall:** setting up no error workflow on a critical workflow, assuming a failure will be noticed some other way. Without an explicit alert, a silent failure (e.g. a webhook that stops receiving anything because of an upstream error) can go unnoticed for a long time.
>
> **Best practice:** set up an error workflow at least for workflows whose failure has a real impact (data loss, a business action not performed), with an alert that actually reaches a responsible person.

## Calling one workflow from another

The **"Execute Workflow"** node calls another n8n workflow like a sub-function, passing it data and retrieving its result. This mechanism lets you factor out logic shared across several workflows (e.g. a data validation step reused everywhere) instead of duplicating it in each one.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A trigger can be a webhook, a schedule, a manual trigger, or a call from another workflow. The Code node runs JS/Python for cases beyond connectors' reach. IF/Switch nodes branch the workflow based on a condition. An error workflow triggers specifically when the main workflow fails. |
| **Usable tools** | The Code node (JavaScript/Python); the IF and Switch nodes; the "error workflow" setting; the "Execute Workflow" node to call another workflow. |
| **Pitfalls to avoid** | Using the Code node by reflex even when an existing preconfigured node would suffice. Setting up no error workflow on a critical workflow. |
| **Best practices** | Reserve the Code node for cases no existing node covers, documenting it. Set up an error workflow with an alert that actually reaches someone, on any workflow whose failure has a real impact. |
