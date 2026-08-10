---
order: 6
---

# Basic Accessibility (UX)

The [Data-* Attributes and Accessibility (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite) chapter covers the *how to code* side of accessibility. This chapter covers the *why* on the design side: decisions to make right from the mockup, before writing a single line of code — fixing them afterward always costs more.

## WCAG conformance levels

[WCAG](/?c=ui-ux&p=couleur-et-contraste), already encountered in the color chapter for its contrast ratios, actually defines three overall conformance levels, covering far more than just contrast:

| Level | What it covers | Typical use |
|---|---|---|
| A | The unavoidable minimum — without it, part of the content is totally unusable for some users | Rarely enough on its own |
| AA | The level generally targeted by default on a project — a good balance between real accessibility and implementation effort | The reference standard for most sites and applications |
| AAA | An enhanced level, hard to reach across an entire site | Reserved for specific contexts (essential services, content explicitly aimed at an audience with disabilities) |

The concrete contrast ratios associated with these levels are detailed in the [Color and Contrast](/?c=ui-ux&p=couleur-et-contraste) chapter.

## Minimum size for clickable and touch areas

A **touch target** is the area a finger or cursor must reach to activate an element — it can be larger than the visual element itself (an icon) without it being visible.

| Reference | Recommended minimum size |
|---|---|
| Apple (Human Interface Guidelines) | 44×44 px |
| Google (Material Design) | 48×48 dp |
| WCAG (criterion 2.5.5, level AAA) | 44×44 px |

> **Pitfall:** buttons or links that are too small or too close together, especially on mobile. The user taps the wrong element — a higher risk for someone with a tremor or motor impairment, but an annoyance for everyone (on a bus, while walking, with large fingers).
>
> **Best practice:** provide a clickable area of at least 44×44px even when the visual element (an icon) is smaller — invisible padding around the icon can enlarge the actually clickable area without changing its appearance.

## Designing keyboard navigation from the mockup stage

**Keyboard navigation** makes it possible to use an entire interface with no mouse: `Tab` to move from one interactive element to the next, `Enter`/`Space` to activate it, `Escape` to close a window. It's essential for users who can't use a mouse, and also speeds up use for anyone.

> **Pitfall:** only thinking about keyboard navigation once coding begins, after the mockup is locked in. The visual order of elements, chosen freely in the mockup, doesn't necessarily match a logical tab order — a fix in code (manually reordering, restructuring the HTML) then becomes necessary after the fact.
>
> **Best practice:** define the logical navigation order right in the mockup (which element gets focus first, then in what order). An order that follows the natural reading direction (top to bottom, left to right) avoids this problem in the vast majority of cases.

## Moving to implementation

The technical implementation of these principles (`tabindex` attributes, ARIA roles, visible focus) is covered in [Data-* Attributes and Accessibility (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | UX accessibility is decided upstream of the code: target WCAG level (A/AA/AAA), sufficiently large clickable areas (44×44px minimum), and a logical keyboard navigation order set right from the mockup. |
| **Tools you can use** | No specific tool — these choices are made at design time (mockup), before technical implementation. |
| **Pitfalls to avoid** | Clickable areas that are too small or too close together, especially on mobile; putting off keyboard navigation until coding time. |
| **Best practices** | Target level AA by default; provide clickable areas of at least 44×44px; define the tab order right in the mockup, aligned with the natural reading direction. |
