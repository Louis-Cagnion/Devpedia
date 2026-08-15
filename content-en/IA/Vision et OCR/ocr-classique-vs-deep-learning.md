---
order: 18
---

# OCR: from classic pattern recognition to deep learning

The [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) chapter defines **OCR** (optical character recognition) and covers what happens **around** the text (locating a table, rebuilding its grid). This chapter focuses on the step that comes before: how a model turns the pixels of a text region into characters, from the very first OCR engines (pattern matching) to modern deep learning models.

## Classic OCR: recognizing a character as a reference image

The first OCR engines (including the earliest versions of [**Tesseract**](https://github.com/tesseract-ocr/tesseract), an open-source OCR engine) split the problem into three strictly separate steps:

```text
Image of the text line
        │
        ▼
1. Segmentation: split the line into one image per character
        │
        ▼
2. Feature extraction: measure traits of the drawing
   (number of loops, vertical strokes, holes...)
        │
        ▼
3. Comparison: which reference character has the closest features?
```

This approach works well on clean, printed text with clearly separated characters: it's the **segmentation** in step 1 that's the weak point.

> **Pitfall:** a segmentation that assumes characters are always separated by a clean gap. Two touching letters (a thin, tight font, cursive handwriting) or a character damaged by scan noise (a slightly tilted or smudged image) break this assumption: the line then gets split in the wrong place, and everything downstream (feature extraction, comparison) starts from an already-wrong character image.
>
> **Best practice:** reserve classic OCR for documents whose text is genuinely clean and printed (standardized forms, digital text rendered as an image); for handwritten or variable-quality text, prefer a deep learning approach that doesn't depend on upfront segmentation (see below).

## Deep learning avoids character-by-character segmentation

A **CRNN** (*Convolutional Recurrent Neural Network*) combines the two [architectures seen earlier](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) rather than inventing a new one:

```text
Image of the whole line
        │
        ▼
CNN: extracts a column of visual features at each horizontal position
      (no splitting into individual characters)
        │
        ▼
RNN (LSTM/GRU): reads these columns left to right, as a sequence
        │
        ▼
A probability distribution over possible characters, at each position
```

The CNN doesn't "know" where each character starts or ends: it produces a sequence of feature columns, one per vertical slice of the image, without ever needing to segment the line beforehand. It's the RNN, then the next step, that give this sequence meaning.

### The problem CTC solves: aligning an output longer than the text

The number of columns produced by the CNN (one per image slice) never exactly matches the number of characters in the text: a wide letter like "M" spans several columns, a thin letter like "l" spans only one. Without a dedicated mechanism, the network has no way to learn "which columns correspond to which character", for lack of annotation that precise in the training data (which gives the line's text, not the pixel-by-pixel position of each letter).

**CTC** (*Connectionist Temporal Classification*) solves this problem by adding a special symbol, the **blank** (`Ø`), which the model can freely produce between two repeated or uncertain characters, then applying a fixed simplification rule to get the final text:

```text
Raw RNN output (one prediction per column):
  Ø  Ø  h  h  Ø  e  e  Ø  l  l  l  Ø  Ø  l  o  o  Ø

CTC rule: merge consecutive identical characters, then remove Ø
  h  h  →  h          l  l  l  →  l         (repetitions merged)
  Ø         (removed)

Result: h  e  l  l  o   ->  "hello"
```

| | Classic OCR | CRNN + CTC |
|---|---|---|
| Character-level splitting | Required, before recognition | Never needed |
| Training data required | Isolated, already-labeled character image | Whole line image + its text, no position |
| Robustness to cursive/tight text | Weak (segmentation fails) | Good (no segmentation needed) |

> **Pitfall:** deliberately repeating a character in the actual text (e.g. "book", with two consecutive "o"s) and assuming the CTC merge rule will collapse it into a single "o". The merge rule only applies to consecutive repetitions in the model's raw output, not to the final text: the model learns to insert a `Ø` between two **intentional** repetitions in the text, precisely to keep them from wrongly merging.
>
> **Best practice:** leave this distinction to training (the model learns, from examples, when to insert a `Ø` between two identical intentional characters) rather than trying to hand-code it in post-processing.

## Transformer-based models: replacing the RNN with attention

As with plain text (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), a CRNN's RNN can be replaced with an **attention** mechanism. A Transformer architecture for OCR (e.g. [TrOCR](https://arxiv.org/abs/2109.10282)) is made of two blocks:

- A **visual encoder**: splits the image into small patches (like a grid), and computes a representation of each patch that accounts for every other patch via attention, instead of an RNN's strictly left-to-right reading.
- A **text decoder**: generates characters one at a time, each able to "look at" any patch of the image (not just the patches near the last character produced), plus the text already generated.

This architecture no longer depends on CTC: the decoder directly generates a sequence of characters, the way an LLM generates a sequence of words (see [Natural Language Processing (NLP) and Large Language Models (LLMs)](/?c=ia&s=nlp-llm&p=nlp-et-llm)), without a CRNN's column-by-column alignment constraints.

> **Pitfall:** assuming a Transformer model is automatically superior to a CRNN+CTC for every OCR task. An OCR Transformer generally needs more training data and compute; on a narrow use case (a single font, a fixed document format), a lighter CRNN+CTC often reaches comparable quality at a much lower cost.
>
> **Best practice:** make this choice based on the actual diversity of the documents to process (see also [Local vs. cloud trade-off for a vision model](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) for where to run the chosen model), not by defaulting to the newest architecture.

## Comparing the three approaches

| | Classic OCR | CRNN + CTC | Transformer |
|---|---|---|---|
| Upfront character segmentation | Required | None | None |
| Robustness to cursive/degraded text | Weak | Good | Good to very good |
| Training data volume required | Low (reference patterns) | Moderate | High |
| Compute cost | Very low | Low to moderate | Moderate to high |

See also [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) for the step that uses this recognized text (placing it back into a page structure), and [Architectures: CNNs, RNNs, and Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) for the details of the building blocks (CNN, RNN, attention) reused here.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Classic OCR segments the line into characters then compares each to reference patterns; fragile as soon as characters touch or are degraded. The CRNN combines a CNN (visual extraction) and an RNN (sequential reading), with CTC to align an output longer than the final text without upfront segmentation. An OCR Transformer replaces the RNN with attention and generates the text directly, without CTC. |
| **Tools you can use** | Tesseract (the historic engine, classic OCR then LSTM+CTC in its recent versions), CRNN+CTC or Transformer models trainable with [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch). |
| **Pitfalls to avoid** | Applying classic OCR to cursive or degraded text. Believing the CTC merge rule collapses intentional repetitions in the actual text. Choosing a Transformer by default without looking at the compute cost and the volume of data actually available. |
| **Best practices** | Reserve classic OCR for clean, printed documents. Let training handle the distinction between an intentional repetition and one to merge (CTC). Choose the architecture based on the actual diversity of the documents, not on how new it is. |
