---
order: 3
---

# Typography

Text size and weight were already introduced as [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle) levers. This chapter goes further: which fonts to choose, and how to pair them without hurting readability.

## Font families

Every font belongs to one of these three families:

| Family | Visual characteristic | Connotation | Typical use | Examples |
|---|---|---|---|---|
| Serif | Small strokes at the ends of letters | Trust, tradition | Print, long-form text | Georgia, Times New Roman, Merriweather |
| Sans-serif | Clean lines, no decoration | Modern, minimal | On-screen interfaces (most sites) | Helvetica, Arial, Inter, Roboto |
| Monospace | Every character takes up exactly the same width | Technical, precise | Code, tabular data | Courier New, Fira Code, Consolas |

> **Why it matters:** a poorly chosen font sends a signal that contradicts the message. A handwritten-style font on a banking site, for instance, contradicts the seriousness expected of the content, even if the text remains perfectly readable.

## Typographic hierarchy: a scale, not random sizes

The sizes and weights used across a site should follow a scale defined in advance, not be chosen case by case:

| Element | Indicative size | Weight |
|---|---|---|
| Main title (`h1`) | 32-48px | Bold (700) |
| Subheading (`h2`) | 24-32px | Semi-bold (600) |
| Section heading (`h3`) | 18-24px | Semi-bold (600) |
| Body text | 16px | Normal (400) |
| Secondary text | 14px | Normal (400) |

> **Pitfall:** using more than 2-3 different fonts on the same project. Every extra font adds visual noise and dilutes [hierarchy](/?c=ui-ux&p=hierarchie-visuelle) instead of reinforcing it.
>
> **Best practice:** limit yourself to 2-3 fonts per project: typically one for headings, one for body text, and possibly a monospace one reserved for code or data.

## Readability: line length, line height, letter spacing

Three settings determine whether a text reads comfortably or tires the eye:

| Setting | Recommended value | Effect if poorly set |
|---|---|---|
| Line length | ~50-75 characters | Too long: the eye loses its place returning to the next line. Too short: reading is chopped up by too-frequent line breaks |
| Line height | 1.4 to 1.6 times the text size | Too tight: lines visually overlap. Too loose: the text loses cohesion, feels disjointed |
| Letter spacing | The font's default value, except in special cases | Tight spacing on an all-caps heading reduces readability; spacing it out slightly helps instead |

```text
❌ Too long (full-width page, over 100 characters per line): the eye has to
   travel too far to find the start of the next line.

✅ Correct (~65 characters per line): the eye easily finds the start
   of the next line, reading stays smooth across the whole text.
```

## Pairing: combining two fonts

**Pairing** means choosing one font for headings and another for body text:

| Headings | Body text | Why it works |
|---|---|---|
| Playfair Display (serif) | Inter (sans-serif) | Marked contrast between the two: each stays identifiable in its role |
| Montserrat (sans-serif, bold) | Open Sans (sans-serif, normal) | Same general style, distinguished by weight rather than letterform |

> **Pitfall:** pairing two fonts that look almost, but not quite, identical. The result looks like a mistake (the wrong font applied by accident) rather than a deliberate choice.
>
> **Best practice:** aim for a clear contrast between the two fonts (clearly different styles), or otherwise stay within the same family and play with weight, never an ambiguous in-between.

> **Current trend (2026):** bold, oversized typography, sometimes deliberately "messy", used as a central element of visual identity rather than mere text dressing.

## Moving to implementation

Like a color palette, a size scale and a font list are declared in CSS as reusable values: see [CSS Variables and the Cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Every font belongs to a family (serif, sans-serif, monospace) carrying a connotation. A coherent size/weight scale and careful readability (line length, line height) take priority over the aesthetic choice of the fonts themselves. |
| **Tools you can use** | No specific tool: font choice and scale are decided at design time, then declared in CSS. |
| **Pitfalls to avoid** | Using more than 2-3 fonts on the same project; pairing two visually too-similar fonts with no deliberate intent. |
| **Best practices** | Limit the project to 2-3 fonts maximum; aim for a clear contrast between heading font and body font (or stay within the same family and play with weight). |
