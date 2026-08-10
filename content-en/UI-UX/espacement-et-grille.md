---
order: 4
---

# Spacing and Grid (Layout)

Spacing was already introduced as a [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle) lever: more space around an element isolates it and makes it noticed. This chapter treats spacing as a complete system — a coherent grid and scale — rather than a one-off setting.

## Negative space: an active tool, not a void to fill

**Negative space** (*white space*) is the empty space around and between a screen's elements. It's not a shortfall to fix by filling every available pixel — it's a tool that lets content breathe and reduces reading effort.

> **Analogy:** silence in music. The pauses between notes are as much a part of the piece as the notes themselves — without them, everything blends into continuous noise.

> **Pitfall:** "horror vacui" — filling every available space with content or decoration, on the assumption that empty space is wasted space. Result: visual overload (already seen in [chapter 1](/?c=ui-ux&p=hierarchie-visuelle)) and more tiring reading.
>
> **Best practice:** treat empty space as a design element in its own right, decided on the same footing as color or typography — not as leftover space to fill.

## The grid system: columns, gutters, margins

A **grid** structures a page into zones aligned with one another, rather than placing each element by eye:

| Term | Definition | Role |
|---|---|---|
| Column | A vertical band content aligns within | Structures the page into zones consistent with one another |
| Gutter | The empty space between two columns | Visually separates content from neighboring columns |
| Margin | The empty space between content and the screen's edge | Keeps content from "sticking" to the edges |

```text
┌──margin──┬────col A────┬gut┬────col B────┬gut┬────col C────┬──margin──┐
│          │   Block 1    │   │   Block 2    │   │   Block 3    │          │
└──────────┴──────────────┴───┴──────────────┴───┴──────────────┴──────────┘
```

The most widespread convention on the web is a 12-column grid: 12 divides by 2, 3, 4, and 6, which makes it possible to compose varied layouts (two equal blocks, three equal blocks, one third + two thirds...) without changing grids.

> **Pitfall:** aligning elements "by eye" rather than on an explicit grid. The resulting few-pixel offsets are invisible in isolation, but give the whole page an impression of inconsistency.
>
> **Best practice:** define the grid (number of columns, gutter width) before placing a single element, then systematically align on it.

## A coherent spacing scale

Rather than inventing a spacing value case by case (5px here, 13px there, 22px elsewhere), a fixed scale in multiples of a base unit (4px or 8px) covers every need:

| Multiple | Value (8px base) | Typical use |
|---|---|---|
| ×1 | 8px | Between very close elements (an icon and its text) |
| ×2 | 16px | Between related elements (a form's fields) |
| ×3 | 24px | Between subsections |
| ×4 | 32px | Between large page blocks |
| ×6 | 48px | Between major sections |

> **Pitfall:** choosing each spacing value case by case ("15px looks fine here"). Each value seems correct in isolation, but their accumulation across the whole project never forms a coherent whole.
>
> **Best practice:** define this scale once, at the start of the project, then draw from it exclusively — never a value invented on the spot.

## Vertical rhythm

**Vertical rhythm** is a constant, predictable spacing between content blocks stacked vertically — headings, paragraphs, sections.

```text
Title
                    ← always the same space after a title (×3, 24px)
Paragraph of text...
                    ← always the same space between two paragraphs (×2, 16px)
Paragraph of text...
```

> **Pitfall:** vertical spacing that varies with no reason from one block to another (24px here, 30px there). The page feels "disjointed", even if each block looks correct in isolation.
>
> **Best practice:** assign a fixed, reused spacing to each type of transition (heading → paragraph, paragraph → paragraph, section → section), drawn from the scale defined above.

> **Current trend (2026):** a return to predictable, recognizable layouts, in the same vein as the return to clarity already observed for [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle) — rather than experimental grids.

## Moving to implementation

A grid and a vertical rhythm are concretely built with [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) or [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), and must adapt to screen size via [responsive design](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Negative space is an active tool, not a void to fill. A grid (columns, gutters, margins) aligns elements with one another, and a fixed spacing scale (multiples of 4 or 8px) guarantees a coherent vertical rhythm. |
| **Tools you can use** | No specific tool — the grid and scale are defined at design time, then implemented in CSS (Flexbox, Grid). |
| **Pitfalls to avoid** | Filling every available space out of horror vacui; aligning elements by eye rather than on a grid; inventing a spacing value case by case. |
| **Best practices** | Define the grid and spacing scale before placing a single element; always reuse the same spacing values for a given type of transition. |
