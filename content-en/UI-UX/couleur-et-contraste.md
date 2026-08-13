---
order: 2
---

# Color and Contrast

Color is one of the levers of [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle): it draws the eye and distinguishes elements from one another. It deserves its own chapter because it follows its own rules: of harmony, readability, and accessibility.

## The color wheel and harmonies

The **color wheel** arranges colors in a circle, in the order they blend into one another:

```roue-chromatique
label: The color wheel
```

Their relative position on this circle determines combinations ("harmonies") that work visually:

| Harmony | How to spot it on the wheel | Example | Visual effect |
|---|---|---|---|
| Complementary | Two colors opposite each other | Red / Green | Strong, dynamic contrast; can tire the eye if overused |
| Analogous | Several neighboring colors | Yellow / Green / Blue | Soft and cohesive, little contrast |
| Triadic | Three evenly spaced colors | Red / Yellow / Blue | Vivid and balanced, harder to dose |

The same geometric principle, independent of exact color names (their exact position on the wheel varies depending on the color model used):

```roue-chromatique
hues: 30, 210
label: Complementary (opposite)
```

```roue-chromatique
hues: 90, 120, 150
label: Analogous (neighboring)
```

```roue-chromatique
hues: 30, 150, 270
label: Triadic (120 degrees apart)
```

> **Pitfall:** choosing a harmony (triadic, for instance) then using its colors in equal parts. The result loses all [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle) and becomes garish: none of the three stands out as the most important.
>
> **Best practice:** distribute colors along a dominant/secondary/accent proportion; a common rule is **60-30-10**: 60% a neutral dominant color, 30% a secondary color, 10% an accent color reserved for elements that truly need to stand out (an action button, for instance).

## Contrast: readability above all (WCAG)

**WCAG** (*Web Content Accessibility Guidelines*) is a reference set of rules for web accessibility. It defines a minimum **contrast ratio** between text and its background, measured automatically by a tool (not calculated by hand):

| Level | Minimum ratio | Applies to |
|---|---|---|
| AA | 4.5 : 1 | Normal text (the generally recommended minimum level) |
| AA (large text) | 3 : 1 | Headings and large text (≥ 18 pt, or 14 pt bold) |
| AAA | 7 : 1 | Enhanced level, recommended for a visually impaired audience |

> **Pitfall:** light gray text on a white background, chosen "because it looks softer". Visually subtle, but often below the 4.5:1 ratio: unreadable for a portion of users (low vision, a screen in bright sunlight, a poorly calibrated screen...).
>
> **Best practice:** check the actual ratio with a dedicated tool (the contrast checker built into browser dev tools, or an online checker) rather than by eye.

## Never encode information through color alone

```text
❌ Bad: in a form, a field in error is bordered in red, a valid field in green:
   that's the ONLY difference between the two.

✅ Good: the field in error is bordered in red, AND displays a ⚠ icon, AND a text message
   ("Invalid email format"): three cues, two of which don't depend on color perception.
```

> **Pitfall:** distinguishing two states by color alone (red/green in particular). About 8% of men (a lower proportion among women) have some form of color blindness and don't perceive this difference.

> **Best practice:** systematically back up any color-coded information with a second cue that doesn't depend on it: icon, text, position, shape, or pattern.

## Cultural meaning of colors

A color doesn't evoke the same thing everywhere, to be weighed against the actual target audience, especially for an international product:

| Color | Common association (Western culture) | Different elsewhere |
|---|---|---|
| Red | Danger, urgency | A color of luck and celebration in China |
| White | Purity, weddings | A color of mourning in several East Asian cultures |
| Green | Nature, approval, money (US culture) | Much weaker association with money outside the US |

> **Best practice:** never assume an association is universal. Check with the actual target audience rather than relying on a single cultural reference.

> **Current trend (2026):** hyper-personalized palettes (interfaces that can adapt to each user's preferences) and a return to bold, "characterful" colors, rather than generic neutral tones.

## Moving to implementation

In CSS, a color palette is declared as a set of reusable values rather than repeated in every rule: see [CSS Variables and the Cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Color combines harmonies (complementary, analogous, triadic) and sufficient contrast (WCAG ratios AA 4.5:1 / AAA 7:1) to stay both aesthetic and readable by everyone. |
| **Tools you can use** | A contrast checker (built into browser dev tools, or online) to check an actual ratio rather than by eye. |
| **Pitfalls to avoid** | Using a harmony's colors in equal parts (loss of hierarchy); encoding information through color alone (invisible to colorblind users, ~8% of men). |
| **Best practices** | Distribute colors as dominant/secondary/accent (the 60-30-10 rule); back up any color-coded information with a second cue (icon, text, shape). |
