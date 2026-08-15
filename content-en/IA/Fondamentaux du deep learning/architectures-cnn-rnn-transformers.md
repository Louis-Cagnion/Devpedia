---
order: 3
---

# Architectures: CNNs, RNNs, and Transformers

The "fully connected" network described in the [chapter on fundamentals](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) (where each neuron is connected to all neurons in the next layer) is not the only way to organize layers. Depending on the type of data being processed (image, sequence, text), certain architectures are much more efficient. This chapter presents the three most influential families.

## Convolutional Neural Networks (CNNs): for images

A fully connected network processing a 1000x1000-pixel image would require an enormous number of weights (one weight per pixel, per neuron in the next layer), which is impractical and ignores an essential property of images: a pattern (an edge, an eye, a texture) retains the same meaning **no matter where it appears** in the image.

A **CNN** (*Convolutional Neural Network*) slides a small **filter** (a grid of weights, e.g., 3x3) across the entire image, reusing **the same weights** at each position:

```text
Image (excerpt)         Filter (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> a single output value, per filter position
2  0  1  1                0  1  0
```

- The same filter detects the same pattern (e.g., a vertical edge) **throughout** the image: a property known as translation invariance.
- The number of weights to be learned remains small (the filter size), regardless of the image size.
- **Pooling** layers (e.g., *max pooling*) then reduce the resolution by retaining only the maximum value from a small area, which decreases the computational load and makes the network more robust to small shifts.

Stacking multiple convolutional layers allows the first layers to detect simple patterns (edges, corners), and the subsequent layers to combine them into increasingly abstract patterns (shapes, then entire objects).

> **Pitfall:** Using a CNN on data without a local spatial structure (such as standard tabular data, for example, where each column has a fixed meaning that differs from the others): the central assumption of the CNN (that a pattern retains the same meaning wherever it appears) then has no basis.
>
> **Best practice:** Reserve the CNN for data where **relative** position matters but **absolute** position does not (images, grids, sounds represented as spectrograms), not for data where each position has a fixed, non-interchangeable meaning.

## Recurrent Neural Networks (RNNs): for sequences

A sentence, a time series, an audio signal: these data sets have a meaningful order that neither a fully connected network nor a CNN naturally processes. An **RNN** (*Recurrent Neural Network*) processes a sequence element by element, maintaining a **hidden state** that summarizes what has been processed so far:

```text
word1 -> [RNN] -> state1 --\
                            +-> word2 -> [RNN] -> state2 --\
                                                            +-> word3 -> [RNN] -> state3 -> output
```

Each step receives both the current element **and** the hidden state from the previous step: this is what allows the network to “remember” the previous context when processing a sentence, for example.

### The Fading Gradient Problem

For a long sequence, backpropagation (see [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) must propagate backward through **all** preceding stages: the gradient can become extremely small (or extremely large) along the way, making it very difficult to learn dependencies **that are far apart** in the sequence. Variants such as **LSTM** and **GRU** add gate mechanisms to better control which information to retain or forget, mitigating this problem.

> **Pitfall:** Using a “simple” RNN (without gates) on long sequences where distant dependencies matter (for example, the beginning of a paragraph influences its conclusion): the vanishing gradient makes this learning method unreliable in practice.
>
> **Best practice:** Opt for a gate-based variant (LSTM, GRU) whenever the sequence is long and distant dependencies are likely to be important for the task.

## Transformers: the attention mechanism

An RNN processes a sequence **sequentially** (it is impossible to compute step 5 before step 4): a major obstacle to parallelization on long sequences and large volumes of data (see parallel computing on [CPU vs. GPU](/?c=infrastructure&p=cpu-vs-gpu)). The **Transformer** (2017) replaces recurrence with an attention mechanism: each element in the sequence “looks” directly at all the others (including itself), weighting their relative importance, without depending on a state propagated step by step.

```text
"The cat sleeping on the couch is black."
                               ^
                     attention lets "is black" connect directly to "cat",
                     despite the distance in the sentence, without passing through every word in between
```

- Attention can be computed **in parallel** across the entire sequence (unlike an RNN), which has made it possible to train much larger models on much more data.
- This architecture forms the basis of modern large language models (LLMs) (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

> **Pitfall:** Applying a standard Transformer to an extremely long sequence without paying attention to it: the computational cost of attention increases faster than the length of the sequence itself (each element looks at all the others), unlike an RNN, where the cost per step remains constant.
>
> **Best practice:** For very long sequences, check the context limits of the model being used (see [LLM in Production](/?c=ia&s=nlp-llm&p=llm-en-production)) rather than assuming that a Transformer can handle any length without additional cost.

## Quick Comparison

| Architecture | Suitable data type | Strength | Limitation |
|---|---|---|---|
| **CNN** | Images, spatial grids | Lightweight, detects local patterns | Less natural for long sequences |
| **RNN** (LSTM/GRU) | Sequences (text, time series) | Models order and short-term memory | Difficult to parallelize, fragile long-range dependencies |
| **Transformer** | Sequences, text, and an increasing number of images as well | Scalable to parallel processing; captures long-range dependencies via attention | High memory and computational cost for very long sequences |

See also [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) for the application of the Transformer architecture to natural language processing.

## Key Takeaways

| | |
|---|---|
| **Key Takeaways** | The CNN leverages the local spatial structure of images using shared-weight filters. The RNN processes a sequence step by step while maintaining a hidden state, but suffers from vanishing gradients on distant dependencies. The Transformer replaces recurrence with attention, which is parallelizable and forms the basis of modern LLMs. |
| **Available Tools** | Deep learning libraries provide ready-to-use layers for each architecture (see [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Pitfalls to Avoid** | Using a CNN on data without local spatial structure. Using a simple RNN on long sequences with distant dependencies. Underestimating the cost of attention on a very long sequence. |
| **Best Practices** | Choose the architecture based on the actual data structure (spatial, short-sequence, long-sequence), not out of habit. Prefer LSTM/GRU over a simple RNN whenever long-range dependencies matter. Check context limits before feeding a very long sequence to a Transformer. |
