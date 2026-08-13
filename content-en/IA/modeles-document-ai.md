---
order: 20
---

# "Document AI" models: understanding a document beyond plain text

The previous two chapters treat reading a document as a **pipeline**: first [detect the layout](/?c=ia&p=detection-de-mise-en-page) (where the regions are), then [recognize the text](/?c=ia&p=ocr-classique-vs-deep-learning) of each region, separately. This chapter presents a more recent family of models, called **Document AI**, which treats a document as an object in its own right (text, position, and visual appearance combined), rather than as plain text once OCR is done.

## What a plain-text LLM doesn't see

A classic [LLM](/?c=ia&p=nlp-et-llm) receives a sequence of [tokens](/?c=ia&p=nlp-et-llm), with no notion of **where** each word was located on the original page. But on a real document, position alone carries meaning:

```text
Invoice #2024-118            <- top of page, bold: a title/reference

Client        Amount         <- aligned in columns: a table
Smith Inc.    1,250 USD
```

The same word ("Amount") plays a different role depending on whether it appears as a column header or inside a paragraph sentence: a model that ignores position has to guess this role purely from the surrounding text, with more room for confusion than a model that sees the position directly.

## LayoutLM: merging text, position, and image

[**LayoutLM**](https://arxiv.org/abs/1912.13318) reuses a text LLM's Transformer architecture, but builds each token's [embedding](/?c=ia&p=nlp-et-llm) from **three** combined sources instead of one:

```text
For each word recognized by OCR:

  embedding(word text)  +  embedding(word x,y position)  +  embedding(image of the word's region)
         |                            |                                    |
   like a classic            normalized coordinates                extracted by a CNN
   text LLM                  on the page (0 to 1000)                (font, style...)

                    = final embedding, sent to the Transformer
```

- **Text**: the word itself, as in any LLM.
- **Position**: the coordinates of the word's bounding box (see [Layout detection](/?c=ia&p=detection-de-mise-en-page)), also converted into a vector.
- **Image**: a visual representation of the region (produced by a [CNN](/?c=ia&p=architectures-cnn-rnn-transformers)), which captures cues plain text doesn't carry (bold, font size, a box border).

These three vectors are summed into a single embedding per word, exactly like a text LLM already sums a token's embedding and its position embedding within the sequence: LayoutLM simply adds two extra dimensions (2D **spatial** position, and image) to this already-familiar mechanism.

> **Pitfall:** thinking LayoutLM does away with OCR. LayoutLM still always needs OCR to have first extracted each word's text and position: it enriches what OCR produced, it doesn't replace it.
>
> **Best practice:** place LayoutLM as a step **after** classic OCR (text recognition), not as an alternative to that step.

## Donut: doing away with OCR entirely

[**Donut**](https://arxiv.org/abs/2111.15664) (*Document understanding transformer*) takes the problem the other way around: instead of adding information to text already extracted by OCR, it starts directly from the document's **raw image** and directly generates the desired output (for instance, a JSON structure with an invoice's fields), without ever running a separate OCR step:

```text
Classic pipeline (LayoutLM):
Image -> OCR (text + position) -> LayoutLM (text+position+image) -> structured result

Donut (end-to-end, no OCR):
Image -> visual encoder -> decoder -> structured result directly
```

The architecture reuses the same encoder/decoder principle as an [OCR Transformer](/?c=ia&p=ocr-classique-vs-deep-learning): a visual encoder reads the image, a decoder generates the output token by token. The difference is that the output is no longer the image's raw text, but directly the desired final structure (the fields, already extracted and named).

| | Classic pipeline (OCR + LayoutLM) | End-to-end (Donut) |
|---|---|---|
| Steps | Several specialized models chained together | A single model, image in, structure out |
| Each step inspectable separately | Yes (the recognized text, position, and final structure are each visible) | No (only the final output is visible; impossible to know "where" an error was introduced) |
| Sensitive to classic OCR errors | Yes (a character recognition error propagates) | Less directly, but its own errors are harder to diagnose |
| Training data volume required | Moderate (each specialized model trains on a narrow task) | High (the model has to learn the whole task in one block) |

> **Pitfall:** choosing Donut by default because it's newer and simpler to call (a single step). A classic pipeline stays easier to debug (each step produces a checkable intermediate result) and needs less training data for a narrow use case.
>
> **Best practice:** choose an end-to-end architecture when operational simplicity (a single model to maintain) matters more than the ability to precisely diagnose an error; keep a classic pipeline when the traceability of each step matters (a regulated context, for instance), or when the available training data volume stays limited.

## PP-StructureV3: a complete, ready-to-use classic pipeline

The [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) chapter already mentions [**PP-StructureV3**](https://github.com/PaddlePaddle/PaddleOCR): it's a concrete example of a classic pipeline (in the sense of the "Classic pipeline" row in the table above), which chains layout detection, OCR, and table reconstruction as separate steps, but already assembled and ready to use rather than built model by model from scratch.

See also [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) for the grid-reconstruction step downstream of this chapter, and [NLP and LLM](/?c=ia&p=nlp-et-llm) for the embedding and attention mechanism reused here.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A plain-text LLM ignores a word's position on the page, information that carries meaning on a real document. LayoutLM merges text, position, and image into a single embedding, but still always needs OCR upstream. Donut does away with OCR entirely by directly generating a structured output from the image, at the cost of losing step-by-step traceability. PP-StructureV3 is an example of a complete, ready-to-use classic pipeline. |
| **Tools you can use** | LayoutLM and Donut as reusable pretrained models; PP-StructureV3 as an already-assembled classic pipeline. |
| **Pitfalls to avoid** | Thinking LayoutLM replaces OCR. Choosing an end-to-end architecture by default without considering the loss of traceability and the required data volume. |
| **Best practices** | Place LayoutLM after OCR, not in its place. Reserve end-to-end for cases where operational simplicity outweighs traceability, and keep a classic pipeline in a regulated context or with limited data. |
