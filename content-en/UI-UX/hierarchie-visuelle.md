---
order: 1
---

# Visual Hierarchy

Faced with a screen, no one reads in the order of the source code: the eye spontaneously jumps to certain elements before others. **Visual hierarchy** is the technique that decides this order instead of leaving it to chance.

**Visual hierarchy**: organizing a screen's elements so the eye goes to what matters most first, then to the rest in an intended order.

> **Analogy:** a newspaper's front page. The main headline is huge, the subheading smaller, the body text smaller still. No one needs to be told what to read first: size alone signals it.

**Why it matters:** without hierarchy, every element carries the same visual weight. The user then has to read everything to find the information they're looking for: on a site or app, this wasted time translates directly into abandonment.

## The levers of hierarchy

An element stands out from the others through a combination of these levers:

| Lever | Effect | Example |
|---|---|---|
| Size | Bigger = perceived as more important | An `h1` heading larger than body text |
| Weight | Thicker (bold) = draws the eye | A **bold** keyword in a paragraph |
| Color | A color that clashes with the rest grabs attention | A colored action button amid a grayscale page |
| Contrast | A crisp element on an opposing background stands out | Dark text on a light background, or the reverse |
| Spacing | More empty space around an element = it's isolated, so noticed | A title surrounded by margin rather than crammed against the following text |
| Position | An element placed at the top or left (Western reading order) is seen first | The logo and main menu at the top of a page |

```text
<h1>Main title</h1>            → big, bold: read first
<p>Introductory text.</p>      → normal size: read next
<small>Legal notice</small>    → small, discreet: read last, if needed
```

These levers combine: a title that's big AND bold AND isolated by space stands out far more than a title with only one of these three traits.

## One focal point per screen: primary, secondary, tertiary

On a given screen, every element falls into one of these three roles:

| Role | Role on screen | Example |
|---|---|---|
| Primary | The one element the user must see first | The "Sign up" button on a landing page |
| Secondary | What supports or explains the primary element | The subheading describing the offer |
| Tertiary | The detail consulted only if needed | Legal notices, a "learn more" link |

> **Pitfall:** wanting to highlight everything at once: a huge title, several colored buttons, bold text everywhere. Result: nothing stands out anymore, the screen becomes visual mush where the eye no longer knows where to go (*visual overload*).
>
> **Best practice:** choose a single primary element per screen before designing anything else. Everything else is then arranged below it, never at its level.

## Reading patterns: F-pattern and Z-pattern

Eye-tracking studies show the eye follows recurring paths depending on the type of page.

**F-pattern**: for a text-dense page (article, search results, product list):

```text
█████████████████████████    ← 1st line: scanned in full
████████████
█
████████████████             ← 2nd line: scanned, shorter
████
█                             ← then the eye mostly descends
█                                along the left margin,
█                                reading little of the rest of each line
```

The user reads the first lines in full, then just scans the start of the following lines going down. Practical consequence: put the most important information in the first words of each heading or paragraph.

**Z-pattern**: for a simple, low-density page (homepage, landing page):

```text
[Logo]──────────────────────►[Menu / Login]
                                            ╱
                                 ╱
                     ╱
           ╱
  ╱
[Key argument]──────────────►[Action button]
```

The eye starts at the top left, sweeps to the right, comes back down diagonally, then sweeps right one last time: where the main action button naturally sits (the primary point defined above).

> **Pitfall:** applying a Z-pattern to a text-dense page (or the reverse). The reading pattern depends on content density, not aesthetic preference: a poor choice pushes the user to read in the order the designer intended, not the one that comes naturally to them.

> **Current trend (2026):** after several years of highly experimental layouts, the trend is returning toward readable, predictable hierarchies, closer to these classic patterns than to a surprising composition: visual novelty is losing ground to speed of comprehension.

## Moving to implementation

This chapter deliberately stays independent of any language: the levers above (size, spacing, position...) concretely translate into CSS via [The Box Model](/?c=langages-de-balisage&s=css&p=box-model) (spacing, dimensions) and [Positioning](/?c=langages-de-balisage&s=css&p=positionnement) (placing elements on screen).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Visual hierarchy organizes a screen so the eye goes to what matters first. It's achieved through levers (size, weight, color, contrast, spacing, position) and relies on a single primary element per screen. |
| **Tools you can use** | No specific tool: hierarchy is decided at design time (sketch, mockup) then translated into code (CSS, mainly). |
| **Pitfalls to avoid** | Highlighting several elements at once (visual overload, nothing stands out anymore); applying a reading pattern (F or Z) that doesn't match the content's actual density. |
| **Best practices** | Choose a single primary element per screen before ranking the rest; combine several levers (size + spacing + position) rather than just one to reinforce an important element. |
