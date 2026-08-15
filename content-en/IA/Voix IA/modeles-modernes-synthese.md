---
order: 29
---

# Modern synthesis models: neural codecs

[Tacotron + vocoder](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) treats text and audio as two separate worlds, connected by an intermediate spectrogram. A more recent family of models, illustrated by [**VALL-E**](https://arxiv.org/abs/2301.02111), unifies the two by treating speech synthesis as a language problem, exactly the way an LLM treats text.

## The key idea: audio becomes a sequence of tokens

An [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) predicts the next text token, based on the ones before it. VALL-E applies the same principle, but on **audio tokens** rather than text tokens:

```text
Text LLM:
"The cat is sleeping on the" -> predicts the next text token ("couch")

VALL-E (an LLM applied to audio):
Text to read + a few seconds of reference voice
      -> predicts a sequence of audio tokens, one by one
      -> these audio tokens are then decoded into a sound signal
```

These audio tokens come from a **neural codec**: a model trained separately to compress an audio signal into a short sequence of discrete numbers (the tokens), then to reconstruct it from those same tokens, a bit like a compressed audio file (MP3) represents a sound as a shorter sequence of numbers than the original wave, but learned rather than hand-designed.

> **Pitfall:** confusing this approach with Tacotron just because both "generate audio from text". Tacotron produces a continuous spectrogram (an image); in VALL-E's case, token by token, it's a discrete sequence of symbols, predicted exactly the way an LLM predicts text: the training objective and the nature of the intermediate output differ completely.
>
> **Best practice:** identify whether a model produces a continuous representation (spectrogram) or a sequence of discrete tokens before comparing it to another one: this structural choice explains much of its strengths and limits (see voice cloning below).

## What this architecture enables: "zero-shot" cloning

Because the model receives "a few seconds of reference voice" as part of its input (like a [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) that guides an LLM), it can imitate a voice it has never seen during training, from a very short sample, with no retraining at all:

| | "Fixed" voice (a pretrained voice) | Zero-shot cloning (VALL-E and equivalents) |
|---|---|---|
| New voice available | No, only already-trained voices | Yes, from a few seconds of reference audio |
| Retraining required | No (already trained) | No (the model generalizes from the example given as input) |
| Control over the result | Predictable, the voice was validated during training | Variable, fidelity depends on the quality and length of the reference sample |

This mechanism is developed in more detail, with its ethical and legal stakes, in [Cloning a Voice](/?c=ia&s=voix-ia&p=cloner-une-voix).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | VALL-E and similar models treat speech synthesis as a language problem: a neural codec converts audio into discrete tokens, which a model predicts one by one the way an LLM predicts text. This architecture enables "zero-shot" voice cloning from a short sample, with no retraining. |
| **Tools you can use** | A neural codec to convert audio into tokens; an LLM-like model to predict these tokens from text and a reference sample. |
| **Pitfalls to avoid** | Confusing this architecture with Tacotron because both "generate audio from text", ignoring the difference between a continuous representation and discrete tokens. |
| **Best practices** | Identify whether a model produces a continuous representation or discrete tokens before comparing it to another one. |
