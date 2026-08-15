---
order: 25
---

# Data governance for scanned documents

[Data governance for an AI system](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) lays out the general principles (classifying data, tracing who requested what, honoring the right to erasure) for data passing through an LLM, essentially **text**. This chapter revisits these same principles for a scanned document **image**, where one difference changes everything: erasing personal data in an image isn't the same operation as erasing it in text.

## Classifying a document before sending it to a vision model

The sensitivity-based classification principle (public/internal/personal/secret, see the [general chapter](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) applies as-is to a scanned document, with a nuance already noted in [the local vs. cloud trade-off for a vision model](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): a document's full image often exposes **more** information than what the pipeline is actually trying to extract from it (the whole page, not just the useful field).

> **Pitfall:** classifying a document based solely on the field being extracted (an amount, for instance), ignoring the rest of the image sent to the model. A fully scanned invoice can contain, besides the sought-after amount, an address, an account number, or a signature, just as exposed to a third-party provider.
>
> **Best practice:** classify a document based on **everything** the image actually contains, not just the field targeted for extraction.

## Erasing personal data in an image: a different operation

In a text database, replacing a value amounts to overwriting one string with another (see the classic [`DELETE`](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)). Personal data visible on a scanned image (a handwritten name, a signature, an ID card number) has no equivalent that simple: it has to be **located** then **visually masked**, not simply replaced in a database:

| | Personal data as text | Personal data in a scanned image |
|---|---|---|
| How to locate it | A string search, or a known database column | A [region detection](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (a bounding box around the area to mask) |
| How to erase it | Replace (or delete) the value in the relevant field | Cover the detected region with an opaque fill (*redaction*), directly in the image's pixels |
| Risk if done poorly | A value forgotten in a secondary field | A poorly detected region (too small) leaves part of the data visible despite the "fix" |

> **Pitfall:** blurring a region containing personal data instead of covering it with an opaque fill. A blur sometimes stays reversible (reconstruction techniques can recover part of the blurred information, especially on text printed in a regular font): it isn't reliable erasure.
>
> **Best practice:** cover the relevant region with an opaque fill that permanently replaces the original pixels, never a blur or a reversible visual effect.

## Retention: extracted text isn't the only place the data exists

The principle already seen (personal data can be copied in several places, and a single `DELETE` isn't enough, see the [general chapter](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) gains an extra dimension with a scanned document: the **source image** itself is a copy of the data, distinct from the text extracted from it.

| Place the data may have been copied | Erased by deleting the extracted text? |
|---|---|
| Extracted text, stored in a database | Yes, by definition |
| Source scan image (raw storage, before or after OCR) | No: the image stays intact, with the data still visible in it |
| Third-party OCR call logs (see [version drift](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Depends entirely on the provider's contractual terms |
| Intermediate copies (regions cropped out for human review, see [OCR in production](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | No, unless the deletion procedure explicitly covers them |

> **Pitfall:** responding to a right-to-erasure request by deleting only the extracted text stored in a database, leaving the source scan image intact somewhere (file storage, a backup): the personal data then stays fully visible to anyone who accesses that image.
>
> **Best practice:** apply the deletion procedure to the source image as much as to the extracted text, by explicitly identifying every place the image (not just its text) may have been copied or archived.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | The governance principles already seen for an LLM (classification, traceability, retention) apply to a scanned document, with one substantive difference: personal data in an image has to be located then visually masked (opaque fill), not simply replaced like a text string. The source image is a copy of the data distinct from the extracted text, and must be covered by any deletion procedure. |
| **Tools you can use** | A region detector to locate the data to mask. An opaque fill applied directly to the pixels to cover it non-reversibly. |
| **Pitfalls to avoid** | Classifying a document based solely on the targeted field, ignoring the rest of the image. Blurring a sensitive region instead of covering it with an opaque fill. Deleting extracted text without deleting the corresponding source image. |
| **Best practices** | Classify a document based on everything the image actually contains. Cover a sensitive region with an opaque fill, never a reversible blur. Extend any deletion procedure to the source image, not just the extracted text. |
