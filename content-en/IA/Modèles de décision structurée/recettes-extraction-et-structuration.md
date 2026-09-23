---
order: 9
---

# Recipes: Extracting and Restructuring Free Text

This chapter and the two that follow apply the [methodology](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) to concrete problems, documented by TypeSafe AI as recipes ("cookbooks"). This first series covers extraction: finding a precise value, or a structure, in text that lacks one.

## Structure recovery: rebuilding a poorly formatted document

Text pasted without formatting (headings, lists, quotes lost) is restructured in two passes, without ever rewriting a single character of the source text:

| Pass | Question asked | Purpose |
|---|---|---|
| 1. Stitching | One Noul per pair of neighboring lines: "does this line continue the previous sentence?" | Merge lines split by mistake |
| 2. Classification | One Choice per merged block: heading, paragraph, list item, quote, code, callout | Recover the document's logical structure |

The model only answers narrow factual questions; it's the code that handles punctuation and spacing, eliminating any risk of unintentionally rewriting the original text.

## Structured-data-extraction cascade: saving cost without losing quality

The **SDE cascade** (*structured-data-extraction cascade*) processes a document through several stages of increasing cost, escalating to the next stage only when needed:

```text
1. A cheap model extracts the fields (fast, inexpensive)
        |
        v
2. The structured decision model VERIFIES each field (one Noul per field,
   detects a doubtful or hallucinated extraction)
        |
        v
3. Only the fields judged doubtful (confidence above a threshold) are
   reprocessed by a powerful model (expensive, reserved for hard cases)
```

The cheap model can hallucinate a plausible but false value (e.g. inventing a registration date absent from a page); the structured decision model's role is precisely to catch this kind of gap before it propagates, without calling the powerful model for fields that are already correct.

## Date extraction: reading then resolving in code

A direct consequence of [pitfall #3 from the previous chapter](/?c=ia&s=modeles-de-decision-structuree&p=limites-et-pieges-jev) (the model calculates dates poorly): it's never asked to calculate a date, only to **read how it's written**.

```text
1. The model answers Choice questions: absolute or relative date?
   which components are named (month, day, year, weekday)?
2. The CODE converts these answers into a real date (e.g. which Thursday for
   "next Thursday"), inferring the missing year if needed
```

| Pitfall | Best practice |
|---|---|
| Asking the model directly "what is the exact date?" | Ask it how the text expresses it, resolve the calculation in code |

## Pre-located value extraction: the regex finds, the model chooses

For values with a recognizable pattern (email, phone number, amount), a regular expression first locates all plausible candidates (even at the cost of over-matching), then a Choice question selects the one that genuinely matches what's being asked for:

```text
Text -> regex (email/phone/amount patterns) -> N candidates
Candidates + question -> Choice -> the relevant candidate
Chosen candidate -> code -> verbatim copy + normalization (e.g. E.164 format)
```

The model never copies a value itself: it **designates** a candidate already found by the regex, which the code then copies as-is. It can therefore neither invent a value nor transpose a digit by mistake, unlike a generative LLM that would retype the value itself.

> **Pitfall common to these four recipes:** letting the model produce or calculate an exact value directly (a resolved date, a copied amount), instead of confining it to a judgment (which one? what type? does this look consistent?) and letting the code do the calculation or exact copy.
>
> **Common best practice:** always split the work according to each side's strengths: to the model, the contextual judgment (which of these candidates? what type of block? does this extraction look correct?); to the code, every calculation or copy that must be 100% exact.

## What to remember

| | |
|---|---|
| **To remember** | Four extraction recipes share the same principle: the structured decision model never does the exact calculation or copy itself, it judges (does this line continue? does this field look correct? how is this date written? which candidate matches?), and the code executes the part that must be exact. |
| **Usable tools** | Noul/Choice questions in cascade or successive passes; a regular expression upstream to locate candidates; downstream resolution/normalization code. |
| **Pitfalls to avoid** | Having the model calculate or copy an exact value instead of the code. |
| **Best practices** | Reserve the model for contextual judgment, hand the code every calculation or copy that must remain exact. |
