---
order: 5
---

# SAFe and Scrumban: the hybrid cases

The chapter on [methodologies](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) presented Scrum and Kanban as two distinct approaches, each suited to a different kind of work. Two common needs, though, don't fit neatly into either box: coordinating Scrum at scale, across several teams, and managing a flow that mixes planned work with unplanned emergencies. This chapter covers the most common answers to these two needs.

## The scaling problem

Scrum works well for a single team, but a complex product often involves several teams working on the same product, with dependencies between them (one team waiting on an API another team is building, for example). Scrum alone defines nothing to coordinate this case: each team could run its own sprints, with no synchronization between them at all.

## SAFe: synchronizing several Scrum teams

**SAFe** (*Scaled Agile Framework*) is a framework that extends agile principles to several teams working together on the same product. Its central mechanism: synchronizing every team's sprints onto a shared cadence, called a **Program Increment** (PI), usually 8 to 12 weeks grouping several sprints.

```text
Program Increment (10 weeks, 5 two-week sprints):

Team A: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Team B: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Team C: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
        └── all start and end at the same time ──┘

PI Planning (before the PI): every team meets to identify
dependencies between them before starting
```

**PI Planning**, a meeting bringing together every team before a Program Increment starts, exists precisely to spot these dependencies ahead of time ("team A needs team B to ship this feature before its own sprint 3"), rather than discovering them along the way.

> **Pitfall:** adopting SAFe for a single team, or for a product with no real dependency between teams. SAFe adds a layer of coordination (extra roles, larger-scale meetings) that brings nothing without a genuine need to synchronize several teams together.
>
> **Best practice:** reserve SAFe (or an equivalent scaling framework) for cases where several teams genuinely work on the same product with real dependencies between them; a single team stays better served by Scrum or Kanban alone.

## Scrumban: a continuous flow with Scrum checkpoints

**Scrumban** combines Kanban's continuous flow (no fixed sprints, a work-in-progress limit) with a few checkpoints borrowed from Scrum (a regular planning meeting, a periodic retrospective), without forcing a strict breakdown into sprints.

```text
Pure Kanban:           continuous flow, work-in-progress limit,
                        no imposed time checkpoint

Scrumban:               continuous flow (like Kanban), + a
                        planning session and a retrospective at
                        a regular interval (borrowed from Scrum)

Pure Scrum:             fixed sprints, the full Scrum ritual set
```

This mix particularly suits a team whose work combines planned items (features scheduled ahead of time) and unplanned ones (support, urgent incidents): Kanban's continuous flow naturally absorbs the unplanned, while Scrum's occasional checkpoints keep a regular rhythm of collective reflection.

> **Pitfall:** believing Scrumban is a "lightweight" version of Scrum to apply by default without thinking. Scrumban answers a specific need (mixed planned/unplanned flow); applying it to fully plannable work brings nothing over classic Scrum, the same reasoning already covered in the methodologies chapter (choose based on the nature of the work, not out of habit).
>
> **Best practice:** choose Scrumban specifically when the work genuinely mixes planned and unplanned items; otherwise, pure Scrum (fully plannable) or pure Kanban (fully irregular flow) stay simpler and sufficient.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | SAFe synchronizes several Scrum teams onto a shared cadence (Program Increment), with PI Planning to spot dependencies ahead of time. Scrumban combines Kanban's continuous flow with checkpoints borrowed from Scrum, suited to work mixing planned and unplanned items. |
| **Usable tools** | The Program Increment and PI Planning to coordinate several teams (SAFe). A regular planning session and retrospective on a Kanban flow (Scrumban). |
| **Pitfalls to avoid** | Adopting SAFe with no real need to coordinate several dependent teams. Applying Scrumban by default to fully plannable work. |
| **Best practices** | Reserve SAFe for cases with several teams and real dependencies. Choose Scrumban only for a flow that genuinely mixes planned and unplanned work. |
