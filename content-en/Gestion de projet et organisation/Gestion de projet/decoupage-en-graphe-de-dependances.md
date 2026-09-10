---
order: 7
---

# Breaking Down a Project into a Dependency Graph

Once a [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) is filled with tasks, one question remains open before even [estimating](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) them: in what order should they be done? A task can't always start whenever you like: it sometimes depends on the result of another one.

## The dependency graph (DAG)

A **directed acyclic graph** (*DAG*) models these dependencies: each task is a node, and an arrow connects a task to the one that must be finished before it can start. This is exactly the structure a tool like `make` builds from a Makefile, to know which files to compile before which others, and which ones can be compiled in parallel.

Sorting this graph to derive a valid execution order is called a **topological sort**: an order where every task appears after all the ones it depends on.

## Not all tasks belong on a single line

The most common mistake when building this graph by hand is picturing a single linear list ("first A, then B, then C...") when in reality some tasks have no dependency on each other at all.

```text
Single-line model (often wrong):
A -> B -> C -> D

Graph model (often closer to reality):
A -> C -> D
B -> C
(A and B are independent, can be done in parallel;
 they only converge at C)
```

Two tasks with no dependency on each other can be carried out in any order, or even in parallel if several people are working on them: wrongly treating them as sequential artificially inflates the project's perceived duration and hides work that could actually be done in parallel.

To identify these branches, the question to ask for each task is: *"what must already exist or be finished before I can even start this one?"*, rather than *"what do I prefer to do first?"* (a question of preference, not of real dependency).

> **Pitfall:** confusing a real dependency (task B needs the result produced by A in order to work) with a mere order of preference (doing A before B "because it seems more logical"). Only the former justifies blocking B until A is finished.
>
> **Good practice:** explicitly identify convergence points, the tasks that need the result of several independent branches at once. These are what show where branches carried out in parallel need to come back together.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A directed acyclic graph (DAG) models the real dependencies between tasks; a topological sort derives a valid execution order from it. Several independent tasks form parallel branches that only converge at a shared task later on. |
| **Usable tools** | The DAG and topological sort, the same structure `make` uses to schedule a build. |
| **Pitfalls to avoid** | Modeling the whole project as a single sequential line when some tasks are actually independent. Confusing a real dependency with a mere order of preference. |
| **Good practices** | For each task, ask what must genuinely be finished before it can start. Explicitly identify convergence points between parallel branches. |
