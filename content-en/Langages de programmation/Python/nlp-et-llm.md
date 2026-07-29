---
order: 22
---

# Natural Language Processing (NLP) and Large Language Models (LLMs)

A neural network (see the dedicated chapter) processes numbers, never text directly. Natural language processing (NLP) encompasses the techniques that convert text into usable numerical representations—the essential preliminary step for any language model, including modern large language models (LLMs).

## Tokenization: Splitting Up the Text

A model never processes an entire sentence all at once—the text is first broken down into smaller units called **tokens**:

```
"Les chats dorment" -> ["Les", "chats", "dorment"]          -> tokenisation par mot
"Les chats dorment" -> ["Les", "chat", "s", "dor", "ment"]   -> tokenisation en sous-mots (plus courant)
```

> **Note:** Whole-word tokenization poses a vocabulary problem: every possible word (including conjugation variants, rare words, proper nouns, etc.) would require its own entry, resulting in a potentially infinite vocabulary. **Subword** tokenization (e.g., the *Byte-Pair Encoding* algorithm) breaks rare words down into more common fragments, maintaining a fixed-size, manageable vocabulary (typically a few tens of thousands of entries) while still being able to represent any word, even one never seen exactly as is during training.

## Embeddings: From Words to Vectors

Each token is then converted into a vector of numbers (an **embedding**), trained so that words with similar meanings have similar vectors in this space:

```python
# For illustrative purposes only
embedding("chat")   -> [0.2, -0.5, 0.8, ...]
embedding("chaton")  -> [0.3, -0.4, 0.7, ...]   # similar to "chat" -> similar meaning
embedding("voiture")  -> [-0.9, 0.6, -0.1, ...]  # far from "cat" -> different meaning
```

This property allows us to use some now-classic operations to illustrate the concept: `embedding("roi") - embedding("homme") + embedding("femme")` produces a vector close to `embedding("reine")`—the direction is encoded, at least partially, as a geometric direction in this vector space.

## Attention to the text

The attention mechanism (see the chapter on Transformer architectures) allows each token to "look" at the other tokens in the sequence in order to adjust its own representation based on the context:

```
"La banque au bord de la rivière"      vs      "La banque a augmenté ses taux"
        ^                                              ^
   "banque" influencée par "rivière"          "banque" influencée par "taux"
   -> sens "berge"                            -> sens "établissement financier"
```

The same word ("bank") is represented numerically **differently** depending on its context—it is this capability that distinguishes an attention-based model from a simple, fixed "word → vector" dictionary.

## What is a large language model (LLM)?

An **LLM** (*Large Language Model*) is, in its simplest form, a Transformer model (see the dedicated chapter) trained on vast amounts of text, with a remarkably simple training objective: **to predict the next word (or token)**, given everything that comes before it.

```
"Le chat dort sur le" -> le modèle prédit une distribution de probabilité sur le token suivant
                          ("canapé" : 45%, "tapis" : 20%, "lit" : 15%, ...)
```

What makes an LLM impressive is not the simplicity of its goal, but its scale: billions of parameters, trained on a significant fraction of publicly available text, with enough computing power (see the chapter on PyTorch/GPU) so that this prediction task, pushed to this scale, gives rise to capabilities that were not explicitly programmed (answering questions, summarizing, translating, step-by-step reasoning...) — a phenomenon known as **emergent capabilities**.

## From a Raw Model to a Usable Assistant: Fine-Tuning vs. Prompting

An LLM that has just been trained to "predict the next word" does not naturally respond like a conversational assistant—two approaches (often combined) can help guide it:

| Approach | Principle |
|---|---|
| **Fine-tuning** | Continue training the model on specific data (exemplary conversations, instructions followed by correct responses, etc.), while readjusting its weights |
| **Prompting** | Does not change **any** of the model's weights—we simply formulate the input (the *prompt*) in a way that guides the pre-trained model toward the desired behavior (providing examples in the prompt, phrasing the question in a certain way, etc.) |

> **Note:** Prompting relies solely on the capabilities already acquired during initial training—which is why well-formulated questions (“prompt engineering”) can significantly improve results without requiring any additional training data or gradient calculations.

See also the chapters on Transformer architectures (the underlying attention mechanism) and on PyTorch (how such a model is actually trained, on a much smaller scale in the examples in this chapter).
