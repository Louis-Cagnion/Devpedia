---
order: 3
---

# Estimation

Once the [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) is filled with prioritized user stories, one question remains open: how long will each one take? **Estimation** answers that question, with different methods depending on what's actually being measured.

## Two ways to estimate, two different problems

| Approach | What it measures | Problem it raises |
|---|---|---|
| **Time estimation** | A precise duration ("3 days") | A time estimate is often taken as a firm commitment, when it's only a forecast |
| **Complexity point estimation** | A relative size compared to other already-estimated tasks | Doesn't directly convert to a date, needs an extra step (velocity, see below) |

Time estimation runs into a well-documented human bias: systematically underestimating how long a task takes, especially for new or poorly understood work (the [planning fallacy](https://en.wikipedia.org/wiki/Planning_fallacy)). Complexity points partly sidestep this bias by avoiding the need to give a precise date.

## Complexity points: comparing rather than measuring

A **complexity point** (*story point*) has no fixed time unit: it represents a relative size, obtained by comparing a user story to others already estimated in the past.

```text
Story already estimated at 3 points: "add a simple search field"

New story to estimate: "add a category filter with several
combinable criteria"

-> more complex than the reference story (3 points), but not
   hugely more -> estimated at 5 points
```

The scale used most often follows the Fibonacci sequence (1, 2, 3, 5, 8, 13...), with deliberately growing gaps: forcing a choice between 5 and 8 rather than between 5 and 6 avoids wasting time on an illusory precision the team can't guarantee anyway.

> **Pitfall:** mentally converting complexity points into days as soon as they're assigned ("3 points = 1 day"). This informal conversion reintroduces exactly the problem points were meant to avoid: a disguised duration commitment.
>
> **Best practice:** keep complexity points as a purely relative measure, and only convert them into a duration via the team's velocity (see below), never through a fixed conversion rule decided in advance.

## Planning poker: estimating collectively

**Planning poker** is a collective estimation method, designed to prevent a single person (often the most experienced, or the most comfortable speaking up) from swaying the whole group:

```text
1. The story to estimate is presented to the team
2. Each person secretly picks a card (1, 2, 3, 5, 8...)
   representing their estimate
3. All cards are revealed at the same time
4. If estimates diverge sharply, the people at the extremes
   explain their reasoning, then a new round happens
5. Repeat until converging on a shared estimate
```

> **Pitfall:** revealing estimates one at a time rather than simultaneously. The first person to announce a number unconsciously anchors the following estimates around their value, defeating the whole point of the secret vote.
>
> **Best practice:** always reveal the cards at the same time, and treat a sharp disagreement as a useful signal (the story might hide a complexity or ambiguity not everyone spotted), not a problem to resolve as fast as possible.

## Velocity: converting points into a calendar

A team's **velocity** is the number of complexity points it manages to process on average per sprint (or per fixed period), measured after the fact over several past iterations.

```text
Sprint 1: 18 points processed
Sprint 2: 22 points processed
Sprint 3: 20 points processed

-> average velocity ≈ 20 points per sprint

Remaining backlog: 100 points
-> forecast: about 5 sprints to work through it
```

It's this velocity, specific to each team and measured over time, that lets complexity points be translated into a calendar forecast, without ever having had to ask for a precise duration on an individual story.

> **Pitfall:** comparing the velocity of two different teams, or using it as an individual performance measure. Two teams don't assign points the same way; comparing their velocities amounts to comparing different units despite an identical-looking number.
>
> **Best practice:** use velocity only to forecast the same team's pace over time, never to compare teams against each other.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Time estimation runs into the systematic underestimation bias; complexity points measure a relative size rather than a duration. Planning poker has each person estimate secretly before revealing simultaneously, to avoid anchoring bias. Velocity (measured after the fact) converts points into a calendar forecast. |
| **Usable tools** | A Fibonacci-like scale (1, 2, 3, 5, 8, 13...) for complexity points. Planning poker for a collective estimate. Recent sprints' average velocity to forecast a calendar. |
| **Pitfalls to avoid** | Mentally converting points into days as soon as they're assigned. Revealing planning poker cards one at a time. Comparing the velocity of two different teams. |
| **Best practices** | Keep points as a purely relative measure. Reveal cards simultaneously and treat sharp disagreement as a useful signal. Only use velocity to forecast the same team's pace over time. |
