---
order: 2
---

# Layout detection: bounding boxes, confidence score, and duplicate removal

The [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) chapter presents the general principle: before reading the text, a model first locates the page's regions (title, paragraph, table...). This chapter develops how that localization model itself works, an **object detection** model in the general sense of the term, applied here to page regions rather than photographed objects.

## The bounding box: representing a detected region

A **bounding box** represents the position of a detected region on the page as a simple rectangle, described by 4 numbers:

```text
(x_min, y_min) ●─────────────────────┐
               │                     │
               │   Detected region   │
               │   (e.g. a table)    │
               │                     │
               └─────────────────────● (x_max, y_max)
```

| Representation | The 4 numbers |
|---|---|
| Opposite corners | `x_min`, `y_min` (top-left corner), `x_max`, `y_max` (bottom-right corner) |
| Center + dimensions | `x_center`, `y_center`, `width`, `height` |

Both representations describe the same rectangle; the choice between them is a convention of the model being used (check its documentation), not a substantive difference.

For each box, the model also produces a **class** (the region type: title, paragraph, table, figure...) and a **confidence score**: a probability, between 0 and 1, that this class is the right one for this region (the same kind of output as [softmax classification](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), the class chosen being the one with the highest probability).

> **Pitfall:** keeping every box returned by the model, without looking at its confidence score. A detection model systematically proposes many candidate boxes across the whole image; most have a very low confidence score (a plain block of aligned text mistaken for a table, for instance) and correspond to nothing real on the page.
>
> **Best practice:** discard any box whose confidence score falls below a threshold fixed in advance (often between 0.3 and 0.7 depending on the desired tolerance to false positives), before any other processing.

## The duplicate problem: IoU (*Intersection over Union*)

A detection model proposes its candidate boxes independently of each other: it's therefore common for it to detect the **same physical region** several times, as several slightly different boxes (one covering a whole table, another covering only part of it, a third slightly offset):

```text
┌──────────────────┐
│  ┌───────────────┼──┐    <- 3 boxes that overlap heavily,
│  │///////////////│  │       all candidates for THE SAME table
└──┼───────────────┘  │
   └───────────────────┘
```

To decide whether two boxes designate the same region (to deduplicate) or two genuinely distinct regions (to keep both), their overlap has to be measured. **IoU** (*Intersection over Union*) is that measure: the area of their intersection, divided by the area of their union.

```text
Box A             Box B
┌────────┐
│    ┌───┼────┐
│    │###│    │    ### = intersection (shared by A and B)
└────┼───┘    │
     └────────┘

IoU = area(###) / area(A union B)
```

```python
def iou(box_a, box_b):
    # Coordinates of the intersection rectangle
    x_min = max(box_a.x_min, box_b.x_min)
    y_min = max(box_a.y_min, box_b.y_min)
    x_max = min(box_a.x_max, box_b.x_max)
    y_max = min(box_a.y_max, box_b.y_max)

    intersection_width = max(0, x_max - x_min)   # 0 if the boxes don't touch
    intersection_height = max(0, y_max - y_min)
    intersection_area = intersection_width * intersection_height

    area_a = (box_a.x_max - box_a.x_min) * (box_a.y_max - box_a.y_min)
    area_b = (box_b.x_max - box_b.x_min) * (box_b.y_max - box_b.y_min)
    union_area = area_a + area_b - intersection_area

    return intersection_area / union_area
```

An IoU of 1 means two identical boxes; an IoU of 0 means they don't touch at all. Two boxes designating the same physical region typically have a high IoU (often above 0.5), even if their exact coordinates differ slightly.

> **Pitfall:** subtracting the intersection a second time when computing the union (`area_a + area_b`, without the `- intersection_area`). The intersection belongs to both individual areas: adding it without removing it once counts it twice, artificially inflating the union and underestimating the IoU.
>
> **Best practice:** always double-check the formula `union = area_a + area_b - intersection` (the simplest case of the [inclusion-exclusion principle](https://en.wikipedia.org/wiki/Inclusion%E2%80%93exclusion_principle), a general counting rule for not double-counting a part shared by two sets) rather than improvising it from memory.

## NMS (*Non-Maximum Suppression*): keeping a single box per region

**NMS** uses IoU to keep only one box per physical region, among all the candidate duplicates:

```text
1. Sort all boxes by descending confidence score
2. Take the box with the highest score -> keep it for good
3. Remove every remaining box whose IoU with it exceeds a threshold
   (e.g. 0.5) -> these are duplicates of the box just kept
4. Repeat steps 2 and 3 on the remaining boxes, until none are left
```

```python
def nms(boxes, iou_threshold=0.5):
    sorted_boxes = sorted(boxes, key=lambda b: b.score, reverse=True)
    kept = []
    while sorted_boxes:
        best = sorted_boxes.pop(0)   # highest score remaining
        kept.append(best)
        sorted_boxes = [
            b for b in sorted_boxes
            if iou(best, b) <= iou_threshold   # discard duplicates of "best"
        ]
    return kept
```

At each round, the remaining box with the best score is assumed to be the best estimate of the real region: every box that overlaps it heavily is therefore treated as a duplicate, not a distinct region.

> **Pitfall:** applying NMS to all boxes at once, without distinguishing their predicted class. A "title" box and a "table" box can overlap by geometric coincidence (a title right above a table, whose boxes touch slightly) without designating the same region: processing them together risks wrongly removing one of the two.
>
> **Best practice:** apply NMS separately for each class (compare "table" boxes against each other, "title" boxes against each other, etc.), never across different classes.

## The IoU threshold: a trade-off, not a universal value

| Chosen IoU threshold | Effect |
|---|---|
| Too low (e.g. 0.1) | Genuinely distinct but nearby regions (two small tables side by side) risk being merged into one |
| Too high (e.g. 0.9) | Obvious duplicates of the same region, with slightly different coordinates, aren't eliminated |

> **Best practice:** tune this threshold on documents representative of the actual use case (dense, closely packed tables need a higher threshold than an airy layout), rather than keeping a default value that's never been checked against your own documents.

See also [Structured OCR and layout analysis](/?c=traitement-de-documents&p=ocr-structure) for the rest of the pipeline (rebuilding a table's grid once its region has been located and deduplicated), and [Neural Networks: The Fundamentals](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) for the confidence-score classification this chapter builds on.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A detection model produces bounding boxes (4 coordinates), each with a class and a confidence score. It often detects the same region several times: IoU (intersection area / union area) measures the overlap between two boxes, and NMS keeps only the highest-scoring box among those that overlap heavily, class by class. |
| **Tools you can use** | Computer vision libraries ([torchvision](https://pytorch.org/vision/stable/index.html), for instance) provide ready-made NMS implementations, faster than pure Python code on a large number of boxes. |
| **Pitfalls to avoid** | Keeping low-confidence boxes without filtering. Miscomputing the union by counting the intersection twice. Applying NMS across different classes rather than separately per class. Keeping a default IoU threshold without validating it on your own documents. |
| **Best practices** | Filter by confidence score before any processing. Double-check the union formula (inclusion-exclusion). Apply NMS separately per class. Tune the IoU threshold on documents representative of the actual use case. |
