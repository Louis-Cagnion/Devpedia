---
order: 1
---

# Roles in a Development Team

A company project rarely involves only one type of person: each of the questions "what to build," "how to build it," and "when to deliver it" belongs to a different role, and mixing up these roles is a frequent source of gridlock.

## Who does what

| Role | Answers the question | Responsibility |
|---|---|---|
| **Product Owner (PO)** | What to build? | Prioritizes the [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) (the list of needs to address), represents the business or customer need |
| **Project Manager** | When to deliver it? | Schedule, budget, deadlines, coordination between teams |
| **Tech Lead** | How to build it? | Technical reference, arbitrates architecture choices |
| **Developer** | - | Designs and writes the code |
| **QA / Tester** | Does it actually work? | Verifies behavior before going to production |
| **Scrum Master / Agile Coach** | - | Facilitates the process, removes blockers, with no hierarchical authority over the team |

> **Analogy:** building a house also separates the person who decides what the house should let you do (the future occupant, like the PO), the person who plans the schedule and budget of the work (the project manager), and the person who decides how the structure stays standing (the architect, like the Tech Lead). Mixing up these three roles leads to decisions being made by whoever doesn't have the information to make them.

## Who has the final say in a disagreement

Each role has the final say in its own domain: the PO prioritizes the "what" (a feature can wait), the Tech Lead arbitrates the "how" (one technical approach over another), the project manager manages the "when" (a deadline can be negotiated or moved).

> **Pitfall:** leaving "who decides what" vague until a disagreement breaks out. Discovering in the middle of a conflict that no one knows who has the final say lengthens the resolution of the disagreement itself.
>
> **Best practice:** clarify explicitly, as soon as the team forms, who settles business, technical, and scheduling decisions, rather than leaving that question open until the first disagreement.

## The Scrum Master is not a boss

> **Pitfall:** confusing the Scrum Master with a manager who assigns tasks or evaluates performance. Their role is to facilitate the process (run the rituals, remove blockers), not to command the team: they generally have no hierarchical authority over it.
>
> **Best practice:** go to the Scrum Master to unblock a process obstacle (a meeting that serves no purpose, a dependency that's dragging on), not to get a decision that belongs to the PO or the Tech Lead.

## QA and developer: complementary checks, not redundant ones

> **Pitfall:** a developer who ships without ever involving QA, thinking "it compiles and the unit tests pass, so it works." Automated tests verify what they were written to verify; QA (or broader testing) also covers real usage scenarios the developer didn't think to test themselves.
>
> **Best practice:** treat automated validation and QA validation as two complementary safety nets, not two versions of the same one.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Product Owner (what), project manager (when), Tech Lead (how), developer (builds), QA (verifies), Scrum Master (facilitates): distinct roles that answer different questions on the same project. |
| **Available Tools** | No specific tool: clarity comes from explicitly defining who decides what. |
| **Pitfalls to Avoid** | Leaving "who decides what" vague until the first disagreement. Confusing the Scrum Master with a boss. Skipping QA validation and relying solely on automated tests. |
| **Best Practices** | Clarify from the start who has the final say on business, technical, and scheduling decisions. Treat automated tests and QA validation as complementary. |
