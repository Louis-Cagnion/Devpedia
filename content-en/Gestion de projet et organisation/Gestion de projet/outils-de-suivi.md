---
order: 4
---

# Tracking tools

A prioritized, [estimated](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) needs somewhere to live concretely, visible to the whole team and kept up to date as work progresses. That's the role of a tracking tool, whether digital or entirely physical.

## The ticket: the basic unit

A **ticket** represents an identifiable unit of work: a user story, a bug, a technical task. Each ticket carries a title, a description, a status (to do / in progress / done, or more statuses depending on the team's flow), and usually an assignee.

```text
Ticket #142
Title     : Add a confirmation email after checkout
Status    : In progress
Assignee  : Alice
Points    : 5
```

This vocabulary ("ticket") originally comes from technical support tools (a reported problem = a ticket), later adopted by project management tools to refer to any individually tracked unit of work.

## The epic: grouping related tickets

An **epic** groups several tickets that together contribute to a shared goal too large to be a single ticket: for example, "Checkout flow overhaul" might group the tickets "Add bank transfer payment", "Simplify the address form", "Add a summary before confirmation".

```text
Epic: Checkout flow overhaul
  ├── Ticket #140: Add bank transfer payment
  ├── Ticket #141: Simplify the address form
  └── Ticket #142: Add a summary before confirmation
```

An epic gives an overview ("where does this larger goal stand?") without opening every ticket individually, and helps break down a still-fuzzy goal into tickets small enough to be estimated and developed (see the **S** criterion of the [INVEST](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) checklist).

## The board: visualizing the workflow

A **board** displays tickets as columns representing workflow stages, each ticket moving from column to column as it progresses. It's the direct visual representation of the principle already covered in the chapter on [methodologies](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) (Kanban board: To do / In progress / Done).

```text
┌─────────────┬─────────────┬─────────────┐
│    To do    │ In progress │    Done     │
├─────────────┼─────────────┼─────────────┤
│ Ticket #143 │ Ticket #142 │ Ticket #140 │
│ Ticket #144 │             │ Ticket #141 │
└─────────────┴─────────────┴─────────────┘
```

A board can be entirely **physical** (sticky notes on a wall, still a common practice in some in-person teams) or **digital**, in a dedicated tool.

## The most common digital tools

| Tool | What sets it apart |
|---|---|
| **Jira** | Very configurable (ticket types, custom flows), widespread in large teams; known for a steeper learning curve |
| **Trello** | Simple, centered on the Kanban board, suited to small teams or loosely structured needs |
| **Linear** | Built for speed of use and keyboard-driven workflows, popular in product/dev teams |
| **Azure Boards** | Integrated into the Azure DevOps suite (see the [dedicated chapter](/?c=infrastructure-devops&s=ci-cd&p=azure-devops-plateforme)), handy when the rest of the toolchain (code, CI/CD) is already on that platform |

None of these tools force a methodology: the same tool can display a simple Kanban board or full Scrum sprints, depending on the configuration the team chooses.

> **Pitfall:** choosing a feature-rich tool (Jira, for example) for a small team that only needs a simple board. Configuring and maintaining a tool more complex than actually needed becomes a workload in itself.
>
> **Best practice:** choose a tool suited to the team's size and maturity rather than the most complete one available; a physical board or a simple tool is plenty for a small, early-stage team.

## A board is a reflection, not the reality

A ticket marked "Done" is only really done if the team keeps the board reliably and regularly up to date; a board that no longer reflects the real state of the work loses all its usefulness (nobody can rely on it to know where the project actually stands).

> **Best practice:** update a ticket's status the moment the work actually changes state, not deferred or in a batch at the end of the day, so the board stays a reliable source at any moment.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A ticket is the basic unit of work (title, status, assignee); an epic groups several tickets tied to a shared goal too large for a single ticket. A board visualizes the workflow as columns, physical or digital (Jira, Trello, Linear, Azure Boards). |
| **Usable tools** | A physical board (sticky notes) for a small, in-person team. Jira, Trello, Linear, or Azure Boards for digital tracking, depending on the team's size and needs. |
| **Pitfalls to avoid** | Choosing a feature-rich tool for a small team. Letting a board drift out of sync with the real state of the work. |
| **Best practices** | Choose a tool suited to the team's size and maturity. Update a ticket's status the moment the work actually changes state. |
