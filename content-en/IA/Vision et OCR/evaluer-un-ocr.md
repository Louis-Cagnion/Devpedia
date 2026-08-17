---
order: 22
---

# Evaluating an OCR: CER, WER, and per-field recognition rate

The general evaluation principle (splitting off a test set, comparing a prediction to the true answer) is already laid out in [Introduction to Machine Learning](/?c=data-science&p=machine-learning-scikit-learn). An OCR, however, has an advantage an LLM doesn't: its output compares directly to a **known true answer** (the image's actual text), without the non-determinism that forces methods like the golden set or LLM-as-judge (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)). This chapter covers the metrics specific to this direct comparison.

> **Note:** This determinism remains theoretical down to the bit. Under multi-threaded computation (inference libraries like MKL-DNN/oneDNN parallelize internal operations), floating-point addition isn't associative: adding the same numbers in a different order from one run to the next can produce a slightly different result. Two runs of the same model, on the same CPU, can therefore in theory diverge by a numerical epsilon, a phenomenon unrelated to an LLM's sampling-based non-determinism (see above) and in practice almost always too tiny to change the recognized text.

## Measuring the gap between two texts: edit distance

Comparing two texts character by character at a fixed position would fail at the very first missing or added character: everything else would shift, creating an artificial mismatch at every following position. **[Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)** solves this problem: the minimum number of operations (substitute, insert, delete a character) needed to turn one text into another.

```text
Recognized text:   "Ihe cats are sleeping"
Actual text:       "The cats are sleeping"
                     ^
              1 substitution (I -> T) -> Levenshtein distance = 1
```

```python
def levenshtein_distance(a, b):
    # table[i][j] = distance between the first i characters of a and the first j of b
    table = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        table[i][0] = i   # turning a[:i] into "" costs i deletions
    for j in range(len(b) + 1):
        table[0][j] = j   # turning "" into b[:j] costs j insertions

    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]              # identical characters, nothing to do
            else:
                table[i][j] = 1 + min(
                    table[i - 1][j],      # deletion
                    table[i][j - 1],      # insertion
                    table[i - 1][j - 1],  # substitution
                )
    return table[len(a)][len(b)]
```

## CER (*Character Error Rate*): edit distance, as a proportion

A raw distance of 5 doesn't carry the same weight on a 6-letter word as on a 2000-character page: **CER** relates this distance to the length of the reference text, to get a proportion comparable across documents of different sizes.

```python
def cer(recognized_text, actual_text):
    return levenshtein_distance(recognized_text, actual_text) / len(actual_text)

cer("Ihe cats are sleeping", "The cats are sleeping")  # 1 / 22 ~= 0.045 -> 4.5% of characters wrong
```

A CER of 0 means perfect recognition; a CER of 0.05 (5%) means that, on average, 5 characters out of 100 are misrecognized.

## WER (*Word Error Rate*): the same idea, at the word level

**WER** applies the same computation (edit distance, related to the reference length), but on the sequence of **words** rather than characters:

```python
def wer(recognized_text, actual_text):
    return levenshtein_distance(recognized_text.split(), actual_text.split()) / len(actual_text.split())
```

| | CER | WER |
|---|---|---|
| Unit compared | Character | Word |
| Sensitivity | A single wrong letter in a 10-letter word carries little weight | The same error invalidates the whole word: closer to human readability |
| Typical use case | Scripts with no clear word separator, or fine-grained evaluation of a recognition engine | Evaluation oriented toward end use (a misrecognized word is still a word to fix, regardless of how large the error is) |

> **Pitfall:** following only one of these two metrics and drawing a general conclusion about "the" model's quality from it. A low CER can hide a high WER (many slightly-off words, each counted as wrong at the word level): the two metrics answer different questions, not the same question with more or less precision.
>
> **Best practice:** track both metrics in parallel, and pick whichever matters most for the actual use case (WER if a human has to proofread and correct word by word, CER for a finer-grained diagnosis of the model's behavior).

## The pitfall of a global score: per-field recognition rate

On a structured document (an invoice, a form), a CER or WER computed over the whole text hides **where** errors concentrate:

```text
Invoice with a global CER of 2% (looks excellent):

  Client address : "12 Main Street, 9O210 Los Angeles"   <- 1-character error in the ZIP code (O instead of 0)
  Total amount   : "1,250.00 USD"                         <- perfectly recognized

  The global CER (2%) drowns out the ZIP code error (a field critical for delivery)
  in the mass of correctly recognized text around it.
```

> **Pitfall:** settling for a low global CER or WER without checking how errors are distributed by field. A single error on a critical field (an amount, a due date, an account number) can have far more serious consequences than an aggregated global CER suggests, especially if that error systematically concentrates on the same type of field (a recurring O/0 confusion in ZIP codes, for instance).
>
> **Best practice:** compute a CER/WER **per identified field** (amount, date, customer reference...) in addition to the global score, on a representative set of documents, to spot a field that's systematically more fragile than the others before going to production.

An annotated test set (images paired with their exact, hand-verified transcription) replayed at every model or version change is exactly the **golden set** principle already seen for an LLM (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), applied here to a deterministic output rather than one that varies from call to call.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Levenshtein distance measures the minimum number of operations to turn one text into another. CER relates it to the text length at the character level, WER at the word level; the two answer different questions and are tracked in parallel. A global score hides the actual error distribution: also measure per field on a structured document. |
| **Tools you can use** | An annotated test set (golden set), replayed at every model change. Dedicated libraries (`jiwer`, for instance) compute CER/WER without reimplementing edit distance by hand. |
| **Pitfalls to avoid** | Following only one of the two metrics. Settling for a global score without checking the per-field error distribution. |
| **Best practices** | Track CER and WER in parallel. Compute a per-field score in addition to the global score on a structured document. |
