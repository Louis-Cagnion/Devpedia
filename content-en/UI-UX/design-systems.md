---
order: 9
---

# Design Systems

The previous chapters (color, typography, spacing, hierarchy) give principles; on a single-page product, applying each one case by case is enough. Past a few dozen screens and several people designing them, reapplying these decisions by hand for every new screen eventually drifts: two "primary" buttons with a slightly different blue, spacing that varies from one screen to another for no reason. A **design system** is the organizational answer to this problem: a single set of rules, values, and reusable components that every new interface refers to, rather than re-deciding every detail.

## Design tokens: naming values instead of repeating them

A **design token** is a design value (a color, a spacing, a border radius) given a name, so it can be referenced everywhere instead of copied:

| Category | Example token | Value | Comes from |
|---|---|---|---|
| Color | `accent-color` | The accent blue chosen for main actions | [Color and Contrast](/?c=ui-ux&p=couleur-et-contraste) (harmony, WCAG contrast) |
| Spacing | `space-m` | 16px | [Spacing and Grid](/?c=ui-ux&p=espacement-et-grille) (coherent scale) |
| Border radius | `radius-standard` | 8px | A style decision specific to the product |
| Typography | `heading-text` | A heading's family, size, and weight | [Typography](/?c=ui-ux&p=typographie) (scale, pairing) |

A token replaces none of the principles already covered (a coherent spacing scale, sufficient contrast...): it gives them a reusable name, once the value is chosen. Technically, a token most often translates into a [CSS variable](/?c=langages-de-balisage&s=css&p=variables-et-cascade) — this chapter stays at the design-decision level, not its implementation syntax.

> **Pitfall:** letting a token AND hardcoded occurrences of the same value coexist elsewhere in the product (one button referencing `accent-color`, another writing the color code directly). Changing the token then only fixes part of the cases — exactly the problem a [single source of truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) is supposed to prevent.
>
> **Best practice:** once a token is created, have its value referenced everywhere it appears, with no one-off exception "just this once" — a single hardcoded occurrence is enough to break the consistency the token is supposed to guarantee.

## The component library: build once, reuse everywhere

A **component library** groups recurring interface elements (button, form field, card, menu) built once from tokens, then reused on every screen rather than redrawn:

```text
Without a library                With a library
------------------------         ------------------------
Screen A: "Submit" button        Screen A: <PrimaryButton>
Screen B: "Submit" button        Screen B: <PrimaryButton>
  (redrawn independently,          (same component, single
   slight style variation)          source, guaranteed identical)
```

> **Pitfall:** duplicating an existing component to slightly adapt it for a new screen ("I'll start from the existing button but just change this one detail"), rather than evolving the original component. The copy inevitably drifts from the original through later tweaks, and the product ends up with several slightly different versions of the "same" component.
>
> **Best practice:** evolve the shared component itself (with a parameter for the needed variation, if it's legitimate) rather than duplicating it — the same logic as [single source of truth](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) and [avoiding repetition](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) already seen on the code side applies just as much to interface elements.

## Pitfall: building a design system before having real screens

A design system emerges from patterns that actually repeat across several already-designed screens — not from anticipating what might one day repeat.

> **Pitfall:** building an exhaustive component library before even designing a few real screens of the product. With no real use cases to test them against, anticipated components often don't match the needs that emerge once the product is actually designed — time invested generalizing a still-hypothetical need.
>
> **Best practice:** let a design system emerge gradually from real screens (extract a component once a pattern has repeated 2 or 3 times), rather than designing it entirely in advance.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A design system names design values as reusable tokens (color, spacing, typography...) and builds a component library from them, to keep a product consistent beyond what one person can decide screen by screen. It emerges from real patterns rather than being anticipated. |
| **Tools you can use** | Design tokens (often [CSS variables](/?c=langages-de-balisage&s=css&p=variables-et-cascade)); a shared component library. |
| **Pitfalls to avoid** | Letting a hardcoded value coexist with a token that replaces it. Duplicating a component rather than evolving the original. Building a complete design system before having real screens to generalize from. |
| **Best practices** | Reference a token everywhere its value appears, with no exception. Evolve a shared component rather than duplicating it. Let a design system emerge gradually from a pattern repeated several times. |
