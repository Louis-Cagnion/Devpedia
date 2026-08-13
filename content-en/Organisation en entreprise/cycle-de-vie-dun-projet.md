---
order: 3
---

# The Project Lifecycle

A project always goes through the same broad stages, from the initial idea to real-world use, whether the team works in [waterfall or Agile](/?c=organisation-en-entreprise&p=methodologies-agile-scrum-kanban).

## The stages

```text
Requirements gathering -> Specification -> Development -> Testing -> Deployment -> Maintenance
```

- **Requirements gathering**: understanding what the customer or the business wants, often vague at first ("make it easier to track orders") before being refined.
- **Specification**: formalizing that need into actionable tickets or user stories (see [Documentation and Team Communication](/?c=organisation-en-entreprise&p=documentation-et-communication-equipe)).
- **Development**: writing the code that meets the specification.
- **Testing**: verifying that the resulting behavior actually matches the need, not just that the code runs without error.
- **Deployment**: putting the version into production, often automated by a [CI/CD pipeline](/?c=ci-cd&p=pipeline-cicd).
- **Maintenance**: fixing bugs discovered in real-world use, evolving the product; generally the longest phase of the whole lifecycle.

## Waterfall vs. Agile: once, or in a loop

In waterfall, these stages run once, in order, across the whole project. In Agile (Scrum or Kanban), they repeat with every increment: each sprint (or each task, in Kanban) goes through its own mini-specification, development, testing, and deployment.

> **Pitfall:** underestimating maintenance by treating it as an unexpected event once the project is "delivered." A product that's actually used generates bugs discovered in real-world use and ongoing requests for changes: that's not an anomaly, it's the normal, expected continuation of the lifecycle.
>
> **Best practice:** budget maintenance time from the initial planning stage (a share of team capacity reserved on an ongoing basis, for example), rather than discovering it as a surprise after going to production.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A project always goes through requirements gathering, specification, development, testing, deployment, and maintenance, once in waterfall or in a loop on every increment in Agile. |
| **Available Tools** | A CI/CD pipeline to automate deployment; tickets/user stories to formalize the specification. |
| **Pitfalls to Avoid** | Treating maintenance as an unexpected event after going to production rather than as a normal phase of the lifecycle. |
| **Best Practices** | Budget maintenance time from the initial planning stage. |
