---
order: 3
---

# Documentation and Team Communication

A growing team can no longer settle everything out loud: work then gets coordinated in writing, through tickets and shared documentation. Poorly written, these two tools slow the team down instead of helping it.

## Writing an actionable ticket or user story

A **user story** formalizes a need using a simple format:

```text
As a [role],
I want [action],
so that [benefit].

Acceptance criteria:
- [verifiable condition that indicates this is done]
```

```text
As a customer,
I want to receive a confirmation email after my order,
so that I know it was successfully recorded.

Acceptance criteria:
- The email is sent within 2 minutes of the order.
- It contains the order number and the total amount.
```

> **Pitfall:** writing a vague ticket ("fix the login bug"), with no reproduction steps or completion criteria. No one knows precisely what has to be true for the ticket to be considered done, which leads to back-and-forth to clarify what could have been specified from the start.
>
> **Best practice:** write a ticket that someone else could pick up without asking a question (context, reproduction steps if it's a bug, explicit acceptance criteria).

## Reporting a blocker

> **Pitfall:** reporting a blocker as "it's not working," with no detail. The person asked for help then has to reconstruct the context themselves before they can even help, which delays resolving the blocker itself.
>
> **Best practice:** specify exactly what's blocked, since when, and what's already been tried (see the [debugging approach](/?c=bases-de-l-informatique&p=le-bug) for structuring this diagnosis): the person asked for help can then pick up directly where the blocker is.

## Common tools

| Need | Typical tools |
|---|---|
| Ticket and work tracking | [Jira](https://www.atlassian.com/software/jira), [Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) |
| Shared documentation | [Confluence](https://www.atlassian.com/software/confluence), [Notion](https://www.notion.so) |
| Informal communication, quick questions | [Slack](https://slack.com), [Microsoft Teams](https://www.microsoft.com/microsoft-teams) |

> **Pitfall:** letting important information circulate only in an instant-messaging conversation (Slack, Teams), which quickly gets buried in the flow and becomes impossible to find a few weeks later.
>
> **Best practice:** reserve instant messaging for quick exchanges, and record any information meant to last (an architecture decision, a procedure) in the shared documentation, where it stays easy to find.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An actionable ticket or user story specifies the role, the action, the expected benefit, and verifiable acceptance criteria. A blocker is reported with what's blocked, since when, and what's already been tried. |
| **Available Tools** | Jira/[Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) for tickets, Confluence/Notion for lasting documentation, Slack/Teams for quick exchanges. |
| **Pitfalls to Avoid** | Writing a vague ticket with no completion criteria. Reporting a blocker with no actionable detail. Letting lasting information live only in an instant-messaging conversation. |
| **Best Practices** | Write a ticket a third party could pick up without asking a question. Detail a blocker enough to allow direct help. Record any lasting information in the shared documentation. |
