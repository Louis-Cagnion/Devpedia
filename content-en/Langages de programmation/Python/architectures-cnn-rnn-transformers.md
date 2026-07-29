---
order: 21
---

# Architectures — CNNs, RNNs, and Transformers

The "fully connected" network described in the chapter on fundamentals (where each neuron is connected to all neurons in the next layer) is not the only way to organize layers. Depending on the type of data being processed (image, sequence, text), certain architectures are much more effective. This chapter presents the three most influential families.

## Convolutional Neural Networks (CNNs) — for images

A fully connected network processing a 1000x1000-pixel image would require an enormous number of weights (one weight per pixel, per neuron in the next layer)—which is impractical and ignores an essential property of images: a feature (an edge, an eye, a texture) retains the same meaning **no matter where it appears** in the image.

A **CNN** (*Convolutional Neural Network*) slides a small **filter** (a grid of weights, e.g., 3x3) across the entire image, reusing **the same weights** at each position:

```
Image (extrait)         Filtre (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> une seule valeur en sortie, par position du filtre
2  0  1  1                0  1  0
```

- The same filter detects the same pattern (e.g., a vertical edge) **throughout** the image—a property known as translation invariance.
- The number of weights to be learned remains small (the filter size), regardless of the image size.
- **Pooling** layers (e.g., *max pooling*) then reduce the resolution by retaining only the maximum value from a small area, which decreases the computational load and makes the network more robust to small shifts.

Stacking multiple convolutional layers allows the first layers to detect simple patterns (edges, corners), and the subsequent layers to combine them into increasingly abstract patterns (shapes, then entire objects).

## Recurrent Neural Networks (RNNs) — for sequences

A sentence, a time series, an audio signal: this data has a meaningful order that neither a fully connected network nor a CNN naturally processes. An **RNN** (*Recurrent Neural Network*) processes a sequence element by element, maintaining a **hidden state** that summarizes what has been processed so far:

```
mot1 -> [RNN] -> état1 --\
                           +-> mot2 -> [RNN] -> état2 --\
                                                           +-> mot3 -> [RNN] -> état3 -> sortie
```

Each step receives both the current feature **and** the hidden state from the previous step—this is what allows the network to “remember” the previous context when processing a sentence, for example.

### The Problem of the Fading Gradient

For a long sequence, backpropagation (see the chapter on gradient descent) must travel backward through **all** the previous layers—the gradient can become extremely small (or extremely large) along the way, making it very difficult to learn dependencies **that are far apart** in the sequence. Variants such as **LSTM** and **GRU** add gate mechanisms to better control which information to retain or forget, mitigating this problem.

## The Transformers — The Attention Mechanism

An RNN processes a sequence **sequentially** (it is impossible to compute step 5 before step 4)—a major obstacle to parallelization when dealing with long sequences and large volumes of data. The **Transformer** (2017) replaces recurrence with an attention mechanism: each element in the sequence “looks” directly at all the others (including itself), weighing their relative importance, without depending on a state propagated step by step.

```
"Le chat qui dort sur le canapé est noir"
                                    ^
                     l'attention permet à "est noir" de se relier directement à "chat",
                     malgré la distance dans la phrase, sans passer par tous les mots intermédiaires
```

- Attention can be computed **in parallel** across the entire sequence (unlike an RNN), which has made it possible to train much larger models on much more data.
- It is this architecture that forms the basis of modern large language models (LLMs) (see the chapter on NLP and LLMs).

## Quick Comparison

| Architecture | Suitable Data Type | Strength | Limitation |
|---|---|---|---|
| **CNN** | Images, spatial grids | Lightweight, detects local patterns | Less natural for long sequences |
| **RNN** (LSTM/GRU) | Sequences (text, time series) | Models order and short-term memory | Difficult to parallelize, fragile long-range dependencies |
| **Transformer** | Sequences, text, and an increasing number of images as well | Scalable, captures long-range dependencies via attention | High memory and computational cost for very long sequences |

See also the chapter on NLP and LLMs for an overview of how the Transformer architecture is applied to natural language processing.
