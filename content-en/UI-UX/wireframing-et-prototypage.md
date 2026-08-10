---
order: 8
---

# Wireframing and Prototyping

[User research](/?c=ui-ux&p=recherche-utilisateur) tells you *who* uses the product and *what problem* to solve. Before moving to a finished screen (colors, typography, visual polish), an intermediate step checks that the screen's **structure** holds up — **wireframing** — then that the **flow** between screens works — **prototyping**.

## The wireframe: structure, with no visuals

A **wireframe** represents the arrangement of a screen's elements (where the title goes, where the main button goes, where the results list goes) with no style decisions at all — no final color, no chosen font, often just rectangles and placeholder text:

```text
+------------------------------------------+
| [Logo]              [Search...]    [Menu] |
+------------------------------------------+
|                                            |
|  Main title                               |
|  Descriptive subtitle                     |
|                                            |
|  [ Main action button ]                   |
|                                            |
+------------------+------------------------+
|  Filter A         |  Result 1              |
|  Filter B         |  Result 2              |
|  Filter C         |  Result 3              |
+------------------+------------------------+
```

This layout directly applies [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle)'s levers (position, block size) without yet touching the purely visual levers (color, typography) — the idea is to validate the arrangement before investing time in the final dressing, which would need to be redone if the structure changes.

## Fidelity levels

A wireframe (or a prototype) comes in different levels of detail, each suited to a different question:

| Fidelity | What it shows | Cost to change | Suited for checking |
|---|---|---|---|
| Low | Rectangles, placeholder text, rough layout | Very low (paper, or a few minutes in a tool) | The overall structure and logical flow |
| Medium | Real hierarchy, real labels, no final visual style yet | Low to moderate | Detailed content organization, edge cases (long text, empty list) |
| High | Near-final rendering (colors, typography, actual components) | High (every change touches a polished visual) | The detail of micro-interactions, final visual consistency |

> **Pitfall:** presenting a high-fidelity prototype at a stage where only the structure still needs validating. An already-polished render diverts testers' attention toward aesthetics ("I like this blue") rather than what still matters at this stage (does the flow make sense? can information be found?) — and every structural change then costs far more to propagate.
>
> **Best practice:** match the fidelity level to the current question — low fidelity as long as the structure can still change, high fidelity only once it's stabilized.

## The clickable prototype: simulating the flow

A **clickable prototype** links several wireframes or screens together (a click on "View product" leads to the product screen, a click on "Back" returns to the list), so a person can *navigate* the product before a single line of real code exists:

```text
[Results list] --click on a result--> [Product page]
        ^                                      |
        |                                      |
        +---------------click "Back"-----------+
```

This simulated flow makes it possible to reuse exactly the [usability testing](/?c=ui-ux&p=recherche-utilisateur) method — watching a person try to accomplish a task, with no help — but well before development starts, when fixing a flow problem only costs a link to redraw rather than an already-coded feature to redo.

> **Pitfall:** only prototyping the "ideal" path (the one the design team has in mind) and leaving any deviation from it leading to an unplanned screen, or nowhere at all. Someone testing the prototype almost always strays from the intended path at some point — this is exactly what a paper wireframe or a poorly linked prototype fails to reveal before shipping.
>
> **Best practice:** also prototype plausible secondary paths (a search with no results, an input error), not just the scenario that works on the first try.

## The back-and-forth with user research

Wireframing/prototyping and [user research](/?c=ui-ux&p=recherche-utilisateur) aren't two isolated sequential steps, but a repeated loop: a prototype (even low fidelity) serves as the basis for a new usability test, whose findings guide the next version of the wireframe, tested in turn:

```text
Wireframe/prototype -> Usability test -> Findings -> Revised wireframe -> ...
```

Each pass through this loop costs less the longer fidelity has stayed low — one more reason to raise fidelity only once the structure has been stabilized through several passes of this loop.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A wireframe fixes a screen's structure with no visual style; a clickable prototype links several screens to simulate a complete flow. Both exist at different fidelity levels (low/medium/high), each suited to a different question, and work in a loop with user research rather than as an isolated step. |
| **Tools you can use** | Pen and paper or a digital tool for a low-fidelity wireframe; a prototyping tool to link several screens into a clickable flow. |
| **Pitfalls to avoid** | Presenting high fidelity while the structure still needs to change. Only prototyping the ideal path, with no plausible flow exits. |
| **Best practices** | Match fidelity to the current question. Also prototype secondary paths (error, empty result). Loop back with a usability test on every iteration rather than just once at the end of design. |
