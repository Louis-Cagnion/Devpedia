---
order: 27
---

# Speech synthesis: from classic concatenation to deep learning

**Speech synthesis** (*text-to-speech*, TTS) converts text into audio. As with OCR (see [OCR: from classic pattern recognition to deep learning](/?c=ia&p=ocr-classique-vs-deep-learning)), the earliest approaches relied on rules and recorded fragments, before deep learning replaced them with end-to-end trained models.

## Concatenative synthesis: assembling recorded fragments

A human voice is recorded in a studio, then cut into small sound fragments (**diphones**: the transition between two consecutive sounds, e.g. the sound between "a" and "b" in "ab"). To pronounce a new word, the system selects and assembles the matching fragments from a large pre-recorded library:

```text
Text: "cat"
        │
        ▼
Split into phonemes: c - a - t
        │
        ▼
Look up the matching diphones in the recorded library:
  silence->c, c->a, a->t, t->silence
        │
        ▼
Concatenation of the fragments found -> final audio signal
```

| | Advantage | Limit |
|---|---|---|
| Concatenative synthesis | Natural voice on recorded fragments (they're real recordings) | Sometimes audible transitions between fragments; coverage limited to combinations planned at recording time; a new voice requires re-recording everything |

> **Note:** the browser's **Web Speech API** (`SpeechSynthesisUtterance`, used by Devpedia's own audio playback) is an abstraction: it delegates actual synthesis to the voices installed on the system, which vary by device. Some of these system voices stay close to the concatenative principle described here; others, on more recent systems, already rely internally on neural models. The API itself says nothing about the underlying engine, only a common interface to drive it (text to read, language, rate, pitch).

> **Pitfall:** assuming a recorded fragment can be combined with any other with no loss of quality. Two diphones recorded in different sentences never have exactly the same intonation, volume, or pace: gluing them back together often produces an audible transition, an artifact characteristic of concatenative synthesis.
>
> **Best practice:** for a use case where perceived quality matters (see the [chapter on evaluation](/?c=ia&p=evaluer-synthese-vocale)), prefer a deep learning model over concatenative approaches whenever possible: it doesn't suffer from this artifact, at the cost of needing more compute.

## Deep learning synthesis: Tacotron and the vocoder

A deep learning model no longer glues existing fragments together: it **generates** an audio signal, the way a [Transformer generates text token by token](/?c=ia&p=nlp-et-llm). The pioneering architecture, **Tacotron** (then Tacotron 2), splits the problem into two steps:

```text
Text -> [Tacotron: encoder-decoder with attention] -> mel spectrogram
                                                                  │
                                                                  ▼
                                              [Vocoder, e.g. WaveNet] -> final audio signal
```

- **Tacotron** converts text into a **mel spectrogram**: an image-like representation of sound energy per frequency over time, not yet a playable audio signal, via an encoder-decoder with [attention](/?c=ia&p=architectures-cnn-rnn-transformers), the same mechanism an LLM uses for text.
- The **vocoder** (e.g. **WaveNet**) converts this spectrogram into an actual sound wave, sample by sample.

> **Pitfall:** assuming a mel spectrogram is directly a listenable sound. It's an intermediate representation (close to what a musical score describes, in more detail): the vocoder is needed to turn it into an actually audible sound wave.
>
> **Best practice:** treat spectrogram generation and vocoding as two separate steps, potentially replaceable independently (the same Tacotron can work with several different vocoders), rather than as a single indivisible block.

## Comparison

| | Concatenative | Deep learning (Tacotron + vocoder) |
|---|---|---|
| What produces the sound | Assembly of genuinely recorded fragments | Generation entirely computed by the model |
| Natural on planned cases | Yes | Yes, and on a wider variety of sentences |
| Typical artifacts | Audible transitions between fragments | Rare with a well-trained model, but a poor-quality vocoder produces a "metallic" sound |
| Adding a new voice | Re-record the whole fragment library | Retrain or fine-tune on new recordings (see [Cloning a Voice](/?c=ia&p=cloner-une-voix)) |

See also [Architectures: CNNs, RNNs, and Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) for the attention mechanism reused here, and [Controlling Prosody](/?c=ia&p=controler-la-prosodie) for what Tacotron only controls implicitly.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Concatenative synthesis assembles genuinely recorded audio fragments (diphones), with sometimes audible transitions. Deep learning synthesis generates the sound: Tacotron converts text into a mel spectrogram via attention, a vocoder (WaveNet) then converts it into a sound wave. The browser's Web Speech API is an abstraction that delegates to one or the other depending on the system. |
| **Tools you can use** | The Web Speech API for simple, free, client-side synthesis. Tacotron 2 + a neural vocoder for higher-quality synthesis, more compute-intensive. |
| **Pitfalls to avoid** | Assuming two concatenated fragments combine with no loss of quality. Confusing a mel spectrogram with a directly playable audio signal. |
| **Best practices** | Prefer deep learning over concatenation whenever perceived quality matters. Treat spectrogram generation and vocoding as two separate steps. |
