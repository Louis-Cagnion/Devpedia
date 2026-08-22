---
order: 2
---

# The backlog and user stories

Once a [methodology has been chosen](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban), a practical question remains: how do you describe the work to be done so the whole team understands it the same way, and so it can be prioritized over time? The **backlog** and **user stories** answer this question, at the core of agile methodologies like Scrum.

## The backlog: a prioritized list, never frozen

The **backlog** is the list of all remaining work on a product: new features, bug fixes, technical improvements. Unlike a classic requirements document, it's never frozen: items get added, removed, or reprioritized continuously as the product and its needs evolve.

| Trait | What it implies |
|---|---|
| **Prioritized** | The most important or urgent items sit at the top, less clear or lower-priority ones at the bottom |
| **Alive** | Continuously revised (often during a dedicated ritual, *backlog refinement*), never written once and for all |
| **Variable granularity** | Items near the top are detailed and ready to be developed; items at the bottom stay deliberately vague until they're about to be picked up |

> **Pitfall:** fully detailing every backlog item as soon as it's created, including ones that won't be worked on for months. A need detailed too early has a good chance of having changed by the time it's actually developed, making that writing effort wasted.
>
> **Best practice:** only flesh out a backlog item in detail right before it's picked up, keeping distant items deliberately rough.

## The user story: describing a need from the user's point of view

A **user story** is a short, structured way to describe a backlog item, centered on the need of the person who'll use the feature rather than the technical details of its implementation. The most common format:

```text
As a [role],
I want [action or need],
so that [sought benefit].

Example:
As a customer of an online shop,
I want to receive a confirmation email after my order,
so that I know it was received.
```

This format forces you to always tie a feature to a concrete benefit for someone: a story that can't be phrased this way is often a technical solution disguised as a need ("as a developer, I want to migrate the database"), rather than a real user need.

> **Pitfall:** writing user stories from the technical team's point of view rather than the person who'll actually use the product. A purely technical task (migration, refactoring) isn't a user story: it's handled differently (a technical task in the backlog, without forcing the "as a" format onto it).
>
> **Best practice:** if a story can't be naturally phrased from a real user's point of view with a clear benefit, it's probably not a user story.

## Acceptance criteria: defining "done"

A user story alone doesn't say when it's actually finished. **Acceptance criteria** list the precise, checkable conditions that must be met to consider the story done:

```text
User story: "As a customer, I want to receive a confirmation
email after my order, so that I know it was received."

Acceptance criteria:
- The email is sent within 5 minutes of the order
- The email contains the order number and total amount
- If sending fails, the order isn't blocked because of it
```

These criteria also serve as the basis for the [tests](/?c=tests&p=vocabulaire-qa-istqb) that will check the feature works as intended once built.

## INVEST: six qualities of a good user story

**INVEST** is a mnemonic acronym summarizing the qualities expected of a well-formed user story:

| Letter | Quality | Meaning |
|---|---|---|
| **I** | Independent | Can be developed without waiting for another story to finish first |
| **N** | Negotiable | Describes a need, not an imposed solution: implementation details remain open for discussion |
| **V** | Valuable | Brings a clearly identifiable value to the user or the business |
| **E** | Estimable | Clear enough that the team can estimate the effort it requires |
| **S** | Small | Small enough to be developed in a few days, not several weeks |
| **T** | Testable | Its acceptance criteria allow objectively checking whether it's done |

A story too big or too vague to meet these criteria is generally split into several smaller stories, each delivering its own independent value.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | The backlog is a prioritized, living list of all remaining work. A user story describes a need from the user's point of view ("as a... I want... so that..."), completed by checkable acceptance criteria. INVEST summarizes the qualities of a good story. |
| **Usable tools** | The "as a / I want / so that" format for writing a story. The INVEST checklist for evaluating its quality. |
| **Pitfalls to avoid** | Fully detailing distant backlog items too early. Writing stories from the technical team's point of view instead of the user's. |
| **Best practices** | Only flesh out an item in detail right before it's picked up. Check that a story is naturally phrased from a real user's point of view. |
