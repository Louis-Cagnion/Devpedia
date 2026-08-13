---
order: 7
---

# User Research

The previous chapters (visual hierarchy, color, typography...) assume you already know what the user needs to accomplish on a screen. **User research** is the step that comes before: understanding who actually uses the product, what they're trying to do, and where they run into difficulty, before drawing anything at all. Without this step, a designer designs for an imagined user, not the one who will actually use the product.

> **Why it matters:** a perfectly hierarchized, well-contrasted, accessible screen is still a failure if it solves a problem no one has. User research reduces this risk by confronting design ideas with real people, as early as possible: correcting a wrong direction costs far less before coding the interface than after.

## Personas: representing a typical user

A **persona** is a fictional profile, but built from real data (interviews, observations, usage statistics), representing a group of users who share the same goals and frustrations with the product:

| Field | Example |
|---|---|
| Name and role | Sophie, 34, accounting manager at a small business |
| Main goal | Close out the month's books with no errors, as fast as possible |
| Current frustration | Has to re-enter the same data into two different tools |
| Technical level | Comfortable with spreadsheets, uncomfortable with a tool she finds "too technical" |

A product rarely targets a single persona: 2 to 4 distinct personas generally cover the bulk of real-world usage, each steering different design decisions (a less tech-savvy persona pushes toward a more guided interface, for instance).

> **Pitfall:** building a persona from assumptions ("I think our users are fairly young and comfortable with technology") rather than real data. An imaginary persona reinforces the design team's biases instead of correcting them: it gives the illusion of a solid foundation without being one.
>
> **Best practice:** build each persona from real interviews or usage data (see the next section), and update it if new data contradicts it, rather than locking it in once and for all.

## User interviews: gathering information at the source

A **user interview** means questioning a representative person to understand their context, goals, and difficulties, not to ask them to rate an idea already designed (that's the role of [usability testing](#usability-testing-observing-rather-than-asking), below). How questions are phrased strongly affects the quality of the answers obtained:

| | Leading question | Open question |
|---|---|---|
| Example | "You don't like having to re-enter your data, do you?" | "Tell me about the last time you closed out the month's books." |
| Effect | Suggests the expected answer; the person tends to agree out of politeness (*social desirability bias*) | Lets the person describe their own experience, with no imposed direction |

> **Pitfall:** asking questions that already suggest the desired answer, or that concern a hypothetical future opinion ("would you use a feature that did X?"). People interviewed systematically overestimate their future use of an imagined feature: what they actually do today is a far more reliable indicator than what they think they'd do.
>
> **Best practice:** ask open questions about past, concrete behaviors ("tell me about the last time you...") rather than about opinions or future intentions.

## The empathy map: synthesizing several interviews

An **empathy map** organizes what's been learned about a user or persona into four quadrants, to bring out the tensions between what they say and what they actually feel:

```text
+---------------------------+---------------------------+
| WHAT THEY SAY              | WHAT THEY THINK           |
| "The current tool works   | Afraid of wasting time    |
|  fine, we manage"         | if we switch tools        |
+---------------------------+---------------------------+
| WHAT THEY DO                | WHAT THEY FEEL            |
| Re-enters the same          | Silent frustration,       |
| data into 2 tools           | never voiced aloud        |
+---------------------------+---------------------------+
```

The gap between the "say" quadrant and the other three is often the most useful discovery: here, the person verbally downplays a problem she actually experiences and expresses concretely (see also the [leading-question pitfall](#user-interviews-gathering-information-at-the-source) above, which produces exactly this kind of gap if what's said isn't cross-checked against observation).

## Usability testing: observing rather than asking

**Usability testing** means watching a real person try to accomplish a specific task on the product (existing, or a prototype, see the future chapter on prototyping), without helping them or explaining how: their hesitations and mistakes reveal the real friction points, often different from what the design team had anticipated.

```text
Given task     : "Find how to export this report as a PDF."
Observation    : the person searches the "File" menu for 45
                 seconds before spotting the export icon, isolated
                 in the sidebar with no text or tooltip.
Conclusion     : the export exists and works, but its position isn't
                 where the user naturally looks for it.
```

This kind of finding ties directly back to [recognition rather than recall](/?c=ui-ux&p=heuristiques-de-nielsen), one of Nielsen's ten heuristics: usability testing is one of the concrete ways to check whether an interface actually respects it, rather than assuming it does.

> **Pitfall:** stepping in during the test to explain where to click, or rephrasing the task if the person seems stuck. This masks exactly the problem the test is meant to reveal: a person using the product alone in real conditions will have no one to feed them the answer.
>
> **Best practice:** stay silent while the person tries, note precisely where and why they hesitate, and only ask questions once the task is finished (whether successful or not).

## Which method, at what point

| Method | Answers the question | Point in the project |
|---|---|---|
| User interview | Who are the users, what are their goals and frustrations? | Upstream, before designing anything |
| Persona | How to summarize and share these profiles with the whole team? | After a round of interviews, to synthesize |
| Empathy map | What tensions exist between a user's stated and actual experience? | Right after interviews, during synthesis |
| Usability test | Does this interface (or prototype) actually work for a given task? | Once there's something to test, even just a mockup |

## Key takeaways

| | |
|---|---|
| **Key takeaways** | User research precedes design: interviews to understand real users, personas to synthesize typical profiles, empathy maps to surface tensions between said/thought/done/felt, usability tests to check that an interface actually works for a given task. |
| **Tools you can use** | An open-question interview guide; a persona template (name, goal, frustration, technical level); a 4-quadrant empathy map template; a specific task to observe for a usability test. |
| **Pitfalls to avoid** | Building a persona on assumptions rather than real data. Asking leading questions or ones about hypothetical future intentions. Stepping in during a usability test instead of observing silently. |
| **Best practices** | Build personas from real interviews or usage data. Ask open questions about past, concrete behaviors. Observe a usability test in silence, question only afterward. |
