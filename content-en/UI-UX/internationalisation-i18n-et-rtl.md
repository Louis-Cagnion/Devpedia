---
order: 7
---

# Internationalization (i18n) and RTL: Designing Beyond a Single Language

**i18n** (*internationalization*, 18 letters between the i and the n) refers to designing a product so it **can** be adapted to other languages and regions without being redesigned; **l10n** (*localization*) refers to the concrete work of adapting it to a specific language and region (translation, date format, reading direction). i18n is a design prerequisite, l10n is the result for each added language.

## i18n vs l10n: Making It Possible, Then Doing It Concretely

| | i18n | l10n |
|---|---|---|
| When | Decided from the outset, during product design and architecture | Done for each targeted language/region, potentially after the fact |
| Nature | Structural: no hardcoded text, adaptable formats, layout that tolerates longer text | Concrete: actual translation, local date format, local currency |
| Cost if skipped | Expensive to fix later (restructuring code and mockups) | Costly but contained (adding one more language) |

A product designed with i18n in mind from the start can add a language through l10n almost without touching the code; a product that wasn't must first be restructured before a single additional translation becomes possible.

## The Pitfall of Text That Changes Length

A translation almost never takes up the same space as the original text: a short English word can become a German phrase twice as long, a space that's enough in French might not be enough in another language.

> **Pitfall:** designing a mockup with fixed-size containers, sized to fit the text length in a single language (often English, the original design language). Longer translated text overflows, gets truncated, or breaks the layout — discovered only once the translation has been added.
>
> **Best practice:** test the layout with artificially lengthened text right from the design stage (a technique called *pseudo-localization*), rather than waiting for a real translation to discover the problem; plan for containers that adapt to content instead of a fixed width.

## RTL: Much More Than a Reversed Reading Direction

An **RTL** (*right-to-left*) language, such as Arabic or Hebrew, doesn't just reverse the reading direction of the text: it **reverses the entire layout**, as if the whole interface were reflected in a mirror.

| Element | In LTR (left to right) | In RTL (right to left) |
|---|---|---|
| Text alignment | Left | Right |
| "Back" icon | Arrow pointing left | Arrow pointing right |
| Main navigation order | Left to right | Right to left |
| Progress bar | Fills toward the right | Fills toward the left |

> **Pitfall:** translating only the text and leaving the layout unchanged (navigation icons, alignment, element order). The result mixes text that reads right to left with an interface still designed left to right — inconsistent and confusing for an RTL user.
>
> **Best practice:** use "logical" CSS properties (`margin-inline-start` rather than `margin-left`, for example), which flip automatically depending on the page direction, instead of fixed physical properties that would need to be manually duplicated for each direction.

Some icons deliberately **never** flip, even in RTL: those representing a real-world object whose orientation has a universal meaning (a clock, a play symbol ▶ in many conventions) stay the same, while purely directional icons (arrows, navigation chevrons) do flip.

## Never Hardcode Text

Text written directly in the code (`<button>Confirm</button>`) can only be translated by modifying the code itself, language by language. The standard i18n technique externalizes each piece of text into a translation file, referenced by a **key** rather than by its value:

```json
// en.json
{ "button_confirm": "Confirm" }

// fr.json
{ "button_confirm": "Valider" }
```

```javascript
<button>{translate("button_confirm")}</button>
```

Adding a language then becomes adding a file of translated keys, without touching the code that displays them.

## Locale-Sensitive Formats: Dates, Numbers, Currencies

Beyond text, several formats change by region, independently of the language itself:

| Data | Example United States (en-US) | Example Germany (de-DE) |
|---|---|---|
| Date | 08/20/2026 | 20.08.2026 |
| Decimal number | 1,234.56 | 1.234,56 |
| Currency | $1,234.56 | 1.234,56 € |

> **Pitfall:** formatting a date or number yourself with hand-written logic (string concatenation), valid only for a single region's format. A user from another region then reads an ambiguous or malformed date (`08/20/2026` read as the 8th day of the 20th month by a reader used to a day/month format).
>
> **Best practice:** use the locale-sensitive formatting functions already provided by the language or platform instead of hand-written formatting, so that the date, number, or currency automatically displays in the convention expected by each region.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | i18n (making a product adaptable) precedes l10n (concretely adapting it to a language). Translated text changes length, which breaks a fixed-size layout. RTL reverses the entire layout, not just the text direction. All text must be externalized into a translation file, never hardcoded. |
| **Tools you can use** | Pseudo-localization for testing a layout with lengthened text. Logical CSS properties (`margin-inline-start`...) for a layout that automatically flips in RTL. Locale-sensitive formatting functions for dates, numbers, and currencies. |
| **Pitfalls to avoid** | A fixed-size layout sized for a single language. Translating only the text without flipping the layout in RTL. Hardcoding text instead of putting it in a translation file. Formatting a date or number by hand instead of using locale-sensitive functions. |
| **Best practices** | Test with artificially lengthened text right from the design stage. Use logical CSS properties for layout. Externalize all text into a translation file referenced by key. Use native locale-sensitive formatting functions. |
