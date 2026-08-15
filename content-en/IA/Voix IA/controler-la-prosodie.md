---
order: 28
---

# Controlling prosody

A model that produces intelligible audio isn't enough: the same text can be read in a flat, robotic way, or with natural intonation. This chapter covers **prosody**: what, in a voice, doesn't depend on the choice of words themselves.

## The three components of prosody

| Component | What it controls | Example |
|---|---|---|
| **Pitch** (or F0) | The voice's fundamental frequency, perceived as "low" or "high" | A rising intonation at the end of a sentence signals a question |
| **Duration** | Speaking rate, and the lengthening of certain sounds | A stressed syllable lasts longer than the others |
| **Energy** | Volume, and how it evolves over a sentence | A stressed syllable is also louder |

```text
"You coming?"           vs        "You're coming."
       ↗                                ↘
   pitch rising                   pitch falling
   at the end                     at the end
   -> perceived as a question     -> perceived as a statement
```

The same text, with different prosody, changes the meaning perceived by the listener, even though the words themselves don't change.

## Where prosody gets decided, depending on the architecture

[Tacotron](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) only controls prosody **implicitly**: the model has learned, from training examples, a plausible prosody for a given text, with no explicit model parameter representing "pitch" or "duration" separately. More recent architectures add **explicit** control:

```text
Tacotron (implicit control):
Text -> [model] -> spectrogram (prosody automatically inferred)

Model with explicit prosody control:
Text + desired prosody parameters (pitch, duration, energy)
     -> [model] -> spectrogram that follows these parameters
```

> **Pitfall:** expecting a model with implicit control (like a standard Tacotron) to produce precise, reproducible prosody on demand (e.g. "stress this specific word"). Without an explicit parameter for that, the result depends only on what the model learned to associate with text of that shape, not on a direct instruction.
>
> **Best practice:** use an architecture with explicit prosody control as soon as the use case requires precise intonation (stressing a word, marking a deliberate pause), rather than hoping to get it indirectly through the input text alone.

## Coarse control exists even on a simple API

The browser's [Web Speech API](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning), far simpler than a neural model with explicit control, already exposes the three components above, in a form reduced to a single global setting per sentence rather than a detailed curve:

```javascript
const utterance = new SpeechSynthesisUtterance("Hello everyone");
utterance.pitch = 1.2;   // pitch: 0 (low) to 2 (high), 1 by default
utterance.rate = 0.9;    // duration/speed: 0.1 (slow) to 10 (fast), 1 by default
utterance.volume = 1.0;  // energy/volume: 0 (silent) to 1 (loud)
```

Unlike a neural model with explicit control, these three settings apply uniformly to the whole sentence: it's impossible to raise the pitch on a single specific word without splitting the sentence into several successive utterances.

> **Pitfall:** adjusting `pitch`/`rate`/`volume` by ear, sentence by sentence, with no method. These settings act globally on the whole utterance: stressing a single word requires splitting the text into several distinct `SpeechSynthesisUtterance` objects, one per segment with its own value, not a single setting on the whole sentence.
>
> **Best practice:** explicitly split a text into segments as soon as differentiated prosody control is needed, even with an API as simple as the Web Speech API.

See also [Modern Synthesis Models](/?c=ia&s=voix-ia&p=modeles-modernes-synthese) for architectures that go further than this basic explicit control.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Prosody (pitch, duration, energy) carries part of the perceived meaning, independently of the words themselves. A model like Tacotron controls it implicitly, inferred from training; more recent architectures expose explicit control. Even a simple API like the Web Speech API exposes these three levers, but globally per utterance. |
| **Tools you can use** | `pitch`/`rate`/`volume` on `SpeechSynthesisUtterance` for basic control. An architecture with explicit control for a more precise need. |
| **Pitfalls to avoid** | Expecting precise, reproducible prosody from a model with implicit control. Adjusting a simple API's settings by ear without splitting the text by segment. |
| **Best practices** | Use a model with explicit control as soon as precise intonation is needed. Split text into segments to differentiate prosody, even with a simple API. |
