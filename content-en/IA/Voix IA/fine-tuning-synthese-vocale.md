---
order: 31
---

# Training and fine-tuning a speech synthesis model

[Fine-tuning a vision model](/?c=ia&s=vision-et-ocr&p=fine-tuning-modele-vision) already covers the generic principles (transfer learning, freezing layers, a reduced learning rate) that apply as-is to a speech synthesis model. This chapter covers what's specific to voice.

## Two different needs, two different approaches

| Need | Approach | Data volume needed |
|---|---|---|
| Use an existing voice, occasionally | [Zero-shot cloning](/?c=ia&s=voix-ia&p=cloner-une-voix) | A few seconds, no retraining |
| A stable-quality voice, reused massively in production | Dedicated fine-tuning | Several hours of recordings of that voice |

Zero-shot cloning (see the previous chapter) remains a fast approximation; dedicated fine-tuning, starting from a pretrained model and continuing its training specifically on hours of recordings of a given voice, produces a more stable, higher-quality result, at the cost of much heavier data-collection work.

> **Pitfall:** choosing dedicated fine-tuning for a one-off need (a single sentence, occasional use), when the cost of collecting several hours of recordings far outweighs the benefit for that use case.
>
> **Best practice:** reserve dedicated fine-tuning for voices genuinely reused at scale (a production voice assistant, a recurring narrator), and zero-shot cloning for anything more occasional.

## Training data quality, an issue specific to audio

Unlike an image, whose quality is judged fairly directly by eye, the quality of a training audio recording depends on factors easy to overlook:

| Factor | Problem if neglected |
|---|---|
| Background noise | The model learns to reproduce the noise along with the voice |
| Volume variation between recordings | The model produces a voice with inconsistent intensity from one sentence to the next |
| Diversity of recorded sentences (phonemes covered) | A rare phoneme, never heard during training, is poorly reproduced at generation time |

> **Pitfall:** using recordings of uneven quality (variable background noise, different volumes) assuming the model will "average it out" and still produce a clean result. The model faithfully learns what it sees, including its flaws, exactly like a model trained on unrepresentative data (see [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
>
> **Best practice:** normalize the volume of all recordings before training, and clean up background noise as much as possible, rather than counting on the model to compensate for uneven-quality data.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Zero-shot cloning suits occasional use; dedicated fine-tuning, on several hours of recordings, produces a more stable voice for massive production use. Background noise and volume variation in training data get faithfully reproduced in the generated voice. |
| **Tools you can use** | The generic fine-tuning principles already seen for vision (transfer learning, freezing layers). Audio cleanup and normalization tools ahead of training. |
| **Pitfalls to avoid** | Choosing dedicated fine-tuning for a one-off need. Using recordings of uneven quality hoping the model compensates. |
| **Best practices** | Reserve dedicated fine-tuning for voices reused at scale. Normalize and clean up recordings before training. |
