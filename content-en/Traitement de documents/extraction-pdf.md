---
order: 1
---

# Extracting text and pages from a PDF

A **PDF** (*Portable Document Format*) is a file format designed so a document displays identically on any device, unlike an editable file ([Word](https://www.microsoft.com/microsoft-365/word), [HTML](/?c=langages-de-balisage&s=html&p=html)) whose layout can vary depending on the software that opens it. This portability comes at a cost for anyone trying to automatically extract information from it: a PDF doesn't contain "text" uniformly, it mixes two very different kinds of content on the same page.

## Two kinds of content, on the same page

| | Native text | Image content |
|---|---|---|
| What it is | Real characters stored as such in the file (like in a text file) | Pixels, exactly like a photo: no characters are stored behind them |
| Where it comes from | A document generated from software (word processor, web export) | A scanned page, a screenshot pasted into the document, a complex table formatted as an image |
| How to extract it | Read the stored characters directly: fast, reliable, no possible misinterpretation | You can't "read" pixels as text: you either interpret them visually ([structured OCR](/?c=traitement-de-documents&p=ocr-structure)) or give up on that portion |

> **Pitfall:** assuming a PDF always contains usable native text. A fully scanned document (each page is just a full-page photo) contains **no** native text at all, even if the file "looks" like a text document when opened: without an OCR step, no automated extraction will find a single character in it.

> **Best practice:** concretely check for the presence of native text on a sample before designing an extraction pipeline; never assume a PDF "resembles" a text document just because it visually looks like one.

## Extracting native text: blocks, positions, font size

A library like [**PyMuPDF**](https://pymupdf.readthedocs.io) (the Python `pymupdf` module) opens a PDF and gives access, page by page, to its internal structure: the text is never returned as a single large string, but split into **blocks** (a paragraph, a table cell...), themselves split into lines then into **spans** (a portion of text sharing the same font and size):

```python
import pymupdf

with pymupdf.open("document.pdf") as document:
    for page_number, page in enumerate(document, start=1):
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:      # 0 = text block; 1 = image block, ignored here
                continue
            spans = [span for line in block["lines"] for span in line["spans"]]
            text = "".join(span["text"] for span in spans).strip()
            if not text:
                continue                # empty block (spacing, blank line): nothing to keep
            print(page_number, block["bbox"], text)
```

- `page.get_text("dict")` returns a nested structure (a Python dictionary) rather than a plain string: this is what gives access to each block's **position** on the page (`bbox`, the bounding box in `x0, y0, x1, y1` coordinates) and its formatting, not just its text content.
- `block["type"]` distinguishes a text block (`0`) from an image block (`1`, covered in the next section): a PDF can mix both on the same page, this filter keeps only the text.
- A span's **font size** (`span["size"]`) is used, in real-world usage, to spot a heading (larger font than the body text) without having to guess the layout any other way than by measuring it.

> **Pitfall:** taking a block's **maximum** font size to characterize it, without thinking about what makes up that block. A block might mix, for example, a large page number stuck next to a small footer note: the maximum size would then reflect the page number, not the text actually representative of the block.
>
> **Best practice:** characterize a block by the font size of its **longest** span (the most characters), not by the raw maximum size: a simple choice that keeps a short, isolated element (a number, a bullet) from skewing the measurement.

## Rendering a page as an image

Some processes (structured [OCR](/?c=traitement-de-documents&p=ocr-structure), a visual check) need the page as an **image**, independent of any native text it already contains. PyMuPDF can also produce this rendering:

```python
pixmap = page.get_pixmap(dpi=200)
```

A **DPI** (*dots per inch*) measures the rendering's resolution: the higher it is, the more detailed (and heavier) the resulting image. It's a direct trade-off:

| DPI | Effect |
|---|---|
| Too low (e.g. 72, typical screen display resolution) | Blurry image: small text or a dense table becomes unreadable, even for an OCR |
| Too high (e.g. 600) | Very sharp image, but much heavier in memory and slower to process, with no real gain past a certain point |
| Common trade-off (e.g. 200) | Enough for most modern OCR engines, without exploding processing time |

> **Pitfall:** picking a default DPI without validating it against your own documents. A DPI too low for a dense table produces OCR errors that are hard to diagnose (the source text was already unreadable before the OCR even ran); nothing in the program's behavior points to this specific cause.
>
> **Best practice:** test several DPI values on documents representative of the real case (dense text, a fine table) before settling on one, rather than copying a default value.

The rendering produced by `get_pixmap` then needs to be converted into an array of numbers to be usable by the rest of a pipeline (OCR, display):

```python
import numpy as np

image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
```

`pixmap.samples` is a raw sequence of bytes (the pixels, one after another); `reshape` reorganizes it into a 3-dimensional [NumPy array](/?c=data-science&p=numpy) (height, width, color channels), the shape expected by nearly every computer vision library.

## Result: a structure, not just raw text

A full extraction pipeline typically produces, for a given PDF, two separate collections rather than a single block of text: the native text blocks (with their page and position) on one hand, the per-page image renderings on the other. Keeping this separation (rather than merging everything into a single text output) is what lets later pipeline steps choose, page by page or even block by block, the right extraction method.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A PDF mixes native text (characters actually stored) and image content (pixels) on the same page. Native text is extracted directly, with position and font size; image content must be rendered as an image (resolution set in DPI) before being interpreted any other way. |
| **Tools you can use** | `pymupdf`: `page.get_text("dict")` for structured text, `page.get_pixmap(dpi=...)` for an image rendering, converted to a NumPy array with `np.frombuffer`/`reshape`. |
| **Pitfalls to avoid** | Assuming a scanned PDF contains native text. Characterizing a block by its maximum font size rather than its longest span's. Picking a default DPI without validating it on real documents. |
| **Best practices** | Check for the actual presence of native text before designing a pipeline. Measure a block by its longest span. Test several DPI values on representative documents before settling on one. |
