---
order: 32
---

# Evaluating speech synthesis: MOS, intelligibility, latency

[Evaluating an OCR](/?c=ia&p=evaluer-un-ocr) compares an output to a known exact reference (the image's actual text). Speech synthesis doesn't have that luxury: there's no single "right answer" for "what a voice should sound like", a question that remains largely subjective.

## MOS (*Mean Opinion Score*): measuring a subjective perception

The [**MOS**](https://en.wikipedia.org/wiki/Mean_opinion_score) has an audio sample rated by human listeners, on a scale from 1 (bad) to 5 (excellent), then averages their ratings:

```text
Generated audio sample
      │
      ▼
Rating by several independent human listeners: 4, 5, 3, 4, 4
      │
      ▼
MOS = average of the ratings = (4+5+3+4+4) / 5 = 4.0
```

| MOS | Typical interpretation |
|---|---|
| Close to 5 | Perceived as a real human voice, nearly indistinguishable |
| 3 to 4 | Understandable, but some cues give away a synthetic origin |
| Below 3 | Distracting audible artifacts (see concatenative synthesis, see [Fundamentals](/?c=ia&p=synthese-classique-vs-deep-learning)) |

> **Pitfall:** comparing MOS scores obtained under different evaluation conditions (number of listeners, instructions given, listening equipment). An MOS isn't an absolute physical measurement like a length in meters: two different evaluation protocols produce scores that don't directly compare, even on the same audio sample.
>
> **Best practice:** only compare MOS scores that come from the same evaluation protocol (same instructions, comparable listener panel), or use the same automatic MOS predictor for both, never scores gathered from heterogeneous contexts.

## Intelligibility: beyond perceived naturalness

Audio can sound "natural" (high MOS) without every word being clearly understood, and conversely, a clearly synthetic voice can remain perfectly understood. **Intelligibility** is measured separately, often by having listeners transcribe the audio and comparing their transcription to the original text, exactly the same [WER](/?c=ia&p=evaluer-un-ocr) computation already seen for OCR, but applied to what a human understood by ear rather than what a model recognized on an image.

> **Pitfall:** relying only on MOS for a use case where exact understanding of the message matters more than perceived naturalness (a safety announcement, an alert). A high MOS doesn't guarantee a critical message stays 100% intelligible.
>
> **Best practice:** measure intelligibility separately from MOS as soon as a use case requires reliably understanding the content, not just a pleasant-sounding voice.

## Latency: real-time vs. generated ahead of time

| | Generated ahead of time | Real-time |
|---|---|---|
| Typical use case | Audiobook, video narration | Voice assistant, live translation |
| What matters | Total generation time (can take several seconds per sentence) | The delay between sending the text and the first audible sound (*time to first audio*) |
| Constraint on the architecture | Little constraint: generation can run in the background | Requires streaming: generating and playing audio in small segments, without waiting for the whole sentence |

> **Pitfall:** measuring only the total generation time of a whole sentence to judge whether a model suits real-time use. A model can take 2 seconds to generate a whole sentence while producing the first audible segment in 200 ms via progressive streaming: it's that initial delay that matters for interactive use, not the total time.
>
> **Best practice:** specifically measure the delay before the first audible sound for real-time use, and check that the chosen architecture genuinely supports progressive streaming rather than blocking generation of the whole sentence.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | MOS measures a subjective perception of naturalness via averaged human ratings, not comparable across different protocols. Intelligibility is measured separately (close to WER, applied to human listening) and matters more than a high MOS for a critical message. Real-time-relevant latency is the delay before the first sound, not total generation time. |
| **Tools you can use** | A listener panel with a fixed protocol for MOS. A WER measurement on human transcription for intelligibility. A streaming architecture for real-time use. |
| **Pitfalls to avoid** | Comparing MOS scores from different protocols. Relying on MOS alone for a message where exact understanding matters. Judging latency by total generation time rather than the delay before the first sound. |
| **Best practices** | Only compare MOS scores with a comparable protocol. Measure intelligibility separately as soon as it's critical. Measure the delay before the first sound for real-time use. |
