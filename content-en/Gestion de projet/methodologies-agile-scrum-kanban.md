---
order: 1
---

# Methodologies: Agile, Scrum, Kanban

Once a [team's roles](/?c=organisation-en-entreprise&p=roles-equipe-developpement) are set, the work still needs to be organized concretely over time. Several methodologies answer this question, each with different trade-offs.

## The waterfall cycle: plan everything before starting

The **waterfall cycle** runs complete phases one after another: the entire specification, then the entire development, then the entire testing, then deployment.

```text
Specification -> Development -> Testing -> Deployment
   (100%)            (100%)      (100%)      (100%)
```

> **Pitfall:** discovering a misunderstood requirement during testing, right at the end of the project. Since the entire development was already built on that basis, fixing it means redoing a large part of the work already done.
>
> **Best practice:** deliver in small increments rather than in a single block, to detect a misunderstood requirement after a few days of work, not after several months: this is exactly the principle that Agile generalizes.

## Agile: deliver small and often

**Agile** breaks work into short increments, each delivering something usable, to catch problems early rather than at the end of a long cycle. Scrum and Kanban are two concrete ways of structuring this idea.

## Scrum: fixed-length sprints

**Scrum** organizes work into **sprints**: fixed-length periods (often two weeks), each ending with a deliverable increment. Four rituals punctuate each sprint:

| Ritual | When | Goal |
|---|---|---|
| **Sprint planning** | Start of sprint | Choose what will be done during this sprint |
| **Daily standup** | Every day | Synchronize the team in a few minutes (done yesterday, planned today, blockers) |
| **Sprint review** | End of sprint | Show what was delivered, gather feedback |
| **Retrospective** | End of sprint | Adjust how the team works for the next sprint |

## Kanban: a continuous flow, no sprints

**Kanban** has no fixed period: work moves forward in a continuous flow on a board with columns (To Do / In Progress / Done), with a **work-in-progress limit** (*WIP limit*): a maximum number of tasks allowed at the same time in a given column.

```text
To Do            In Progress (max 2)  Done
---------        -----------------    --------
Task C           Task A               Task X
Task D           Task B               Task Y
Task E
```

> **Pitfall:** letting everyone start a new task as soon as they have a free moment, with no work-in-progress limit. Ten tasks started and none finished don't move forward any faster than a single task at a time: they block each other (waiting on feedback, cross dependencies) without any of them actually reaching completion.
>
> **Best practice:** set a work-in-progress limit per column, and stick to it even when someone finds themselves without a task: finish what's already started before starting something new.

## Comparison

| | Waterfall | Scrum | Kanban |
|---|---|---|---|
| Planning | Entirely upfront | Per sprint | Continuous, task by task |
| Delivery pace | Once, at the end of the project | Regular (end of each sprint) | Continuous, as it flows |
| Suited to | A need that's already fully known and stable | A product with regular, plannable releases | An irregular stream of requests (support, maintenance) |

> **Pitfall:** adopting the Scrum vocabulary (sprint, daily) without the rituals that give it meaning, simply renaming meetings that already existed. Vocabulary alone changes nothing about how the work actually gets done.
>
> **Best practice:** choose a methodology based on the nature of the work (Scrum for regular, plannable releases, Kanban for an irregular flow), not as a trend, and actually apply its rituals rather than keeping only their names.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The waterfall cycle plans everything in advance; Agile delivers in small increments to catch problems earlier. Scrum structures these increments into sprints with fixed rituals; Kanban organizes a continuous flow capped by a work-in-progress limit. |
| **Available Tools** | A Kanban board (To Do / In Progress / Done columns); the four Scrum rituals (planning, daily, review, retrospective). |
| **Pitfalls to Avoid** | Discovering a misunderstood requirement at the very end of a waterfall cycle. Letting work in progress pile up with no limit. Adopting Agile vocabulary without its actual rituals. |
| **Best Practices** | Deliver in small increments to catch problems early. Set and enforce a work-in-progress limit. Choose the methodology based on the nature of the work, not on a trend. |
