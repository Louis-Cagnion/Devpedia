---
order: 23
---

# OCR post-processing and correction

The [evaluation chapter](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) measures an OCR's errors; this chapter covers the step that comes right after, before using the recognized text: attempting to automatically **correct** the most likely errors, without going back through the recognition model itself.

## Dictionary-based correction

Dictionary-based correction compares each recognized word to a list of valid words (a **lexicon**): if the recognized word isn't in it, it's replaced with the closest lexicon entry, measured with the [Levenshtein distance](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) already seen for evaluation:

```python
def correct_with_dictionary(word, lexicon, max_distance=2):
    if word in lexicon:
        return word   # already a valid word, nothing to correct

    candidates = [(entry, levenshtein_distance(word, entry)) for entry in lexicon]
    best_entry, best_distance = min(candidates, key=lambda c: c[1])

    if best_distance <= max_distance:
        return best_entry   # close enough: correct it
    return word              # too different from any known word: leave it alone
```

> **Pitfall:** using a generic language dictionary (everyday English words) on a business document. A proper noun, a product reference, or a technical identifier (a tax ID, an order reference) belongs to no general-purpose dictionary: the correction mechanism would "correct" them to the nearest dictionary word, often a completely different one from the right one.
>
> **Best practice:** build or extend the lexicon from the vocabulary actually encountered in the business domain (customer names, product references, industry terminology), not just a generic language dictionary.

## Contextual correction: beyond the isolated word

Dictionary-based correction treats each word in isolation, without accounting for what surrounds it. A common OCR confusion (the digit `0` read as the letter `O`, or the reverse) often produces a word that does exist in a dictionary, but is wrong in context:

```text
"Total amount: 1O0 USD"
                ^
        "1O0" isn't flagged as suspect by ANY word dictionary
        (it isn't a word); the context ("amount", "USD")
        is needed to know a sequence of digits is expected here, not a letter
```

Contextual correction relies on a model that evaluates the **plausibility** of a whole sequence, not of an isolated word: exactly the principle already seen in [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), where a language model assigns a probability distribution to the next token given what precedes it. Applied here, a language model evaluates which of the candidate readings (`1O0` vs `100`) is more likely given the context ("Total amount:", followed by "USD"), rather than judging the token alone.

> **Pitfall:** applying uniform contextual correction, with the same confidence, to the whole document. A correction based on **statistical** plausibility can, unlike a genuine OCR error, "correct" a rare but perfectly accurate value (an unusual amount, an uncommon name) into a more frequent but wrong one.
>
> **Best practice:** reserve automatic contextual correction for free-text fields, and disable it (or use it only to flag, never to auto-replace) on fields with a strict format constraint (amounts, identifiers), handled by format validation (see below), more reliable for that kind of data.

## Format validation: using what's already known about the expected field

Many fields of a structured document follow a format known in advance (a date, a 9-digit tax ID, a 5-digit ZIP code): a constraint a [regular expression](/?c=domain-specific-languages-dsl&p=regex) is enough to check, with no dictionary or language model needed:

```python
import re

def is_valid_tax_id(text):
    return re.fullmatch(r"\d{9}", text) is not None

is_valid_tax_id("12345678 9")  # False -> an extra space, signals a likely OCR error
is_valid_tax_id("123456789")   # True
```

A field that fails this check is flagged as suspect, even without knowing precisely *what* correction to apply: information that's already useful on its own for prioritizing human review.

## Statistical shape detection: flag without correcting

The three previous approaches all share one point in common: they know, or try to guess, **which** value would be correct. A free-text field, with no business lexicon or known format, doesn't lend itself to any of the three: what's left is the possibility of noticing that **a value has a statistically suspicious shape**, without claiming to know how to correct it.

Two signals common in practice:

- **An abnormally high ratio of isolated letters**: a single letter surrounded by digits (`"12A34"`) is rare in a well-recognized real text; a high rate of this pattern in a document often betrays a systematic digit/letter confusion by the OCR model on that specific document.
- **A substitution pattern restricted to a confusable subset**: `0`/`O`, `1`/`l`/`I`, `5`/`S`, `8`/`B` look visually similar and are often confused with each other; a substitution outside this subset (a `7` read as `K`, for instance) is statistically much rarer and deserves different scrutiny.

> **Pitfall:** confusing this approach with contextual correction (seen above): statistical detection proposes **no** replacement value, it only flags a field as suspect. Treating it as a correction (automatically replacing the value) amounts to guessing a value with no real basis at all, worse than a poorly calibrated contextual correction.
>
> **Best practice:** reserve this detection for fields that escape the three previous approaches (no business lexicon, no known format, insufficient context for a language model), and always have it lead to human review, never an automatic replacement.

## Never lose track of the raw text

Whatever correction method is applied, the text recognized **before** correction remains valuable information: without it, it becomes impossible to know afterward whether a value comes from the OCR model or an automatic correction, or to measure that correction's actual effect on overall quality (see [CER/WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)).

> **Pitfall:** overwriting the raw recognized text with its corrected version, without keeping the original. A later audit, or a future change of correction strategy, then loses any way to compare before/after.
>
> **Best practice:** always keep the raw text alongside the corrected text (two separate fields, never a single overwritten field), if possible along with the correction method applied to each field.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Dictionary-based correction replaces a word absent from a lexicon with its closest entry (Levenshtein distance). Contextual correction judges the plausibility of a whole sequence via a language model, useful against confusions an isolated word doesn't reveal. Format validation (regex) detects an anomaly on a field with a known structure, with no dictionary or model needed. Statistical shape detection flags a suspect field without proposing a correction, for cases the three previous approaches don't cover. |
| **Tools you can use** | A business lexicon built from vocabulary actually encountered. A language model for contextual correction. Regular expressions to validate a field with a known format. An isolated-letter ratio or a restricted substitution pattern for statistical detection. |
| **Pitfalls to avoid** | Using a generic language dictionary on business vocabulary. Applying automatic contextual correction on fields with a strict format constraint. Overwriting the raw text with its corrected version. Treating statistical detection as a correction, by automatically replacing the flagged value. |
| **Best practices** | Build the lexicon from actual business vocabulary. Reserve contextual correction for free text, validate known-format fields with regex. Always keep the raw text alongside the corrected text. Always have any statistical detection lead to human review, never an automatic replacement. |
