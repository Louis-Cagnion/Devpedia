---
order: 2
---

# Structured OCR and layout analysis

**OCR** (*Optical Character Recognition*) is the family of models that convert pixels into text: the operation needed as soon as content only exists as an image rather than as [native text](/?c=traitement-de-documents&p=extraction-pdf) (a scan, a table formatted as an image). A "plain text" OCR stops there: it returns a sequence of words found on the image, with their position, with no notion of what connects them to each other.

## What "plain text" OCR doesn't capture

A table isn't just a list of words scattered across a page: it's a **grid**, with rows and columns that give meaning to the values it contains. On a table, a plain text OCR returns each cell as an isolated word among others, with no indication of which row or column it's in:

| | Plain text OCR | Structured OCR |
|---|---|---|
| Output | A list of words, each with its position on the image | A structure (rows, columns, cells), with each cell's text in its right place |
| Enough for | A simple paragraph of text | A table, a form with aligned fields |
| What plain text is missing | No way to know that two words belong to the same row of a table, rather than to two unrelated spots on the page | - |

**Structured OCR** adds a **layout analysis** step even before reading the text: first locate the page's regions (a heading, a paragraph, a table...), then, for each region recognized as a table, reconstruct its grid rather than returning a plain pile of words.

## Two models, two costs: filter before structuring

A model that locates regions (answering "is there a table on this page?") is much cheaper to run than a model that also fully reconstructs that table's structure (rows, columns, each cell's text). Systematically running the full model on every page, including ones that visibly contain no table, wastes most of the compute time:

```text
Page rendered as an image
        │
        ▼
Layout detection model (fast, ~40x faster than the full pipeline)
        │
        ├── no "table" zone found ──> page skipped, nothing else to do
        │
        └── at least one "table" zone ──> full structuring pipeline
                                            (precise localization + grid
                                            reconstruction, slower)
```

> **Pitfall:** running the most complete (and slowest) model on every page of a document, for implementation simplicity, when most pages only need an answer to "is there a table here?".
>
> **Best practice:** insert a fast pre-filtering model that eliminates the obvious negative cases, and reserve the expensive model for the regions that genuinely need it. The same principle as an [index that avoids scanning an entire table](/?c=domain-specific-languages-dsl&p=sql): answer "should I even look here?" quickly before doing the full work.

## Reconstructing the grid: rows, columns, merged cells

A detected table isn't limited to a uniform rectangular grid: a header cell can span several columns, or a cell in the first column can cover several rows. Two concepts describe these merges, borrowed directly from [HTML](/?c=langages-de-balisage&s=html&p=html) table vocabulary:

```text
+----------+----------------------+
|          |      Quarter 1       |   <- "colspan" 2: a cell that spans 2 columns
+----------+-----------+----------+
|          |  January  | February |
+----------+-----------+----------+
| Region A |    120    |   135    |
+          +-----------+----------+   <- "rowspan" 2: "Region A" covers these 2 rows
|          |    98     |   110    |
+----------+-----------+----------+
```

| Term | Means |
|---|---|
| `colspan` (*column span*) | A cell occupies several columns on the same row |
| `rowspan` (*row span*) | A cell occupies several rows on the same column |

A structured OCR model (such as [PP-StructureV3](/?c=ia&s=vision-et-ocr&p=modeles-document-ai), used in this chapter's source project) typically returns this grid in **HTML** format (`<table>`, `<tr>`, `<td colspan="...">`), the same format as a web page: reconstructing, from this HTML, the exact position (row, column) of each cell while accounting for ongoing merges, is a full incremental parsing exercise in its own right.

> **Pitfall:** ignoring the merges and assuming a reconstructed table always has the same number of cells on every row. A row where a column is "skipped" because of a `rowspan` that started higher up would, without accounting for it, silently misalign the content with the column it's actually associated with.
>
> **Best practice:** explicitly track, column by column, how many rows a vertical merge still has left to occupy, before placing a row's next cell.

## A detection model's results are never perfect

A model that locates zones (here, tables) provides a **confidence score** per detected zone, and can also detect the same physical zone twice as two slightly different boxes (one covering the whole table, another covering only part of it): this is the same confidence-score filtering and IoU/NMS deduplication covered in the Vision et OCR track's layout detection chapter (IA section), directly applicable here.

See also [Extracting text and pages from a PDF](/?c=traitement-de-documents&p=extraction-pdf) for the preceding step (obtaining the page image to analyze), and [Local vs. cloud trade-off for a vision model](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) for the question of where to run this type of model.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A plain text OCR returns isolated words with their position; a structured OCR adds a layout analysis (locating headings, paragraphs, tables) and reconstructs a table's grid (rows, columns, cells merged via `rowspan`/`colspan`). |
| **Tools you can use** | A lightweight layout detection model as a pre-filter, a full structuring pipeline reserved for the zones that need it. |
| **Pitfalls to avoid** | Systematically running the most expensive model on every page. Ignoring cell merges when reconstructing a grid. Keeping low-confidence or near-duplicate detections with no filtering. |
| **Best practices** | Pre-filter with a fast model before the full pipeline. Explicitly track merges column by column. Filter by confidence score and deduplicate zones that overlap heavily. |
