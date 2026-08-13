---
order: 10
---

# Tools of the Trade

The previous chapters cover concepts (hierarchy, color, tokens, wireframes...) independently of any specific software. In practice, an interface designer spends most of their time in a dedicated design tool, then sometimes in an animation tool for the most advanced interactions — this chapter names this landscape of tools, without turning into a tutorial: each deserves its own dedicated learning, outside the scope of this site.

## Interface design tools

Most tools of this kind ([Figma](https://www.figma.com), [Sketch](https://www.sketch.com), Adobe XD, [Penpot](https://penpot.app)...) share the same basic concepts, sometimes under different names:

| Concept | Role | Equivalent already seen |
|---|---|---|
| Layer | Each element (text, shape, image) exists independently, stacked on top of the others | Similar to the stacking of HTML elements in a document |
| Component | A reusable element (button, card...), defined once and instantiated everywhere | A design system's [component library](/?c=ui-ux&p=design-systems) |
| Auto-layout | A container that repositions and resizes its content automatically based on rules (spacing, alignment), rather than hand-set fixed positions | [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) in CSS — the same principle, in the design tool rather than in code |

Working with components and auto-layout in the design tool, rather than with fixed positions, produces mockups that already behave the way the coded interface will (a button that adapts to its text's length, for instance) — reducing the gap between the mockup and the coded result.

> **Pitfall:** building a mockup entirely with fixed positions, with no components or auto-layout, because "it's faster this time". Every later change (longer text, a new language) then has to be propagated by hand to every occurrence rather than to a single shared definition.
>
> **Best practice:** create a component as soon as an element appears identically a second time, and use auto-layout by default rather than fixed positioning — the same reflexes as the [component library](/?c=ui-ux&p=design-systems) and using [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) on the code side.

## Animation tools for advanced interactions

A simple transition (a button that slightly changes color on hover) is covered directly in CSS. A more elaborate interaction — several elements animated in a precise order, a movement that reacts to the user's gesture, spring physics rather than plain linear easing — goes beyond what basic CSS transitions comfortably cover, and then relies on a JavaScript library dedicated to animation ([GSAP](https://gsap.com), Framer Motion, among others):

| | CSS transition | JS animation library |
|---|---|---|
| Suited to | A simple state change (hover, appearance) | Sequences of several coordinated animations, gestures, movement physics |
| Control from code | Limited (triggered by a CSS state change) | Fine-grained (start, pause, chain steps precisely) |
| Cost | No extra dependency | An external library to load and maintain |

> **Pitfall:** using a JavaScript animation library for a simple state transition (a hover, an appearance) that a CSS transition would be enough to cover. The cost (library weight, extra code complexity) far outweighs the gain on such a simple case.
>
> **Best practice:** reserve a JS animation library for interactions that genuinely exceed what CSS transitions cover (coordinated sequences, gestures, movement physics) — not as a default reflex for every animation.

## Choosing a tool: stability over novelty

> **Pitfall:** switching design tools because a new tool is trendy, without it solving an actual problem encountered with the current one. The switch has a real cost: the whole team relearning it, migrating existing mockups, a temporary disruption to collaboration with other roles (developers, product) accustomed to the tool in place.
>
> **Best practice:** choose a tool based on what the team and the existing ecosystem already use (interoperability with the project's other tools, skills already acquired), and only switch in the face of an actual need the current tool doesn't cover — not in anticipation of a hypothetical need.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Interface design tools (Figma and its alternatives) share the same basic concepts — layers, components, auto-layout — which directly foreshadow the final code's structure. A JS animation library (GSAP, Framer Motion) takes over from CSS transitions for more elaborate interactions (sequences, gestures, movement physics). |
| **Tools you can use** | A design tool with components and auto-layout (Figma or equivalent); a JS animation library for interactions beyond a simple CSS transition. |
| **Pitfalls to avoid** | Building a mockup with fixed positions and no components or auto-layout. Using a JS animation library for a simple transition a CSS rule would cover. Switching tools out of trend rather than actual need. |
| **Best practices** | Create a component as soon as an element repeats, use auto-layout by default. Reserve a JS animation library for genuinely complex interactions. Choose a tool for its fit with the existing team, not its novelty. |
