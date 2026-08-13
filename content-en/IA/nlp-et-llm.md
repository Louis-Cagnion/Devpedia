---
order: 5
---

# Natural Language Processing (NLP) and Large Language Models (LLMs)

A [neural network](/?c=ia&p=reseaux-de-neurones) works with numbers, never directly with text. Natural Language Processing (NLP) groups the techniques that convert text into usable numerical representations, the essential preliminary step for any language model, up to modern large language models (LLMs).

## Tokenization: splitting text apart

A model never processes a whole sentence as a single block: the text is first split into smaller units, called **tokens**:

```text
"The cats are sleeping" -> ["The", "cats", "are", "sleeping"]      -> word-level tokenization
"The cats are sleeping" -> ["The", "cat", "s", "are", "sleep", "ing"] -> subword tokenization (more common)
```

Word-level tokenization runs into a vocabulary problem: every possible word (including conjugation variants, rare words, proper nouns...) would need its own entry, a potentially unbounded vocabulary. **Subword** tokenization (e.g. the *Byte-Pair Encoding* algorithm) splits rare words into more common fragments, keeping a fixed, manageable vocabulary size (typically tens of thousands of entries) while still being able to represent any word, even one never seen as-is during training.

> **Pitfall:** confusing token count with word count. With subword tokenization, a single word can be split into several tokens (see the example above): estimating a text's length or cost (see [LLM in Production](/?c=ia&p=llm-en-production)) by counting words instead of actual tokens gives an approximate result, sometimes wildly off.
>
> **Best practice:** always measure text length in actual tokens (via the tokenizer of the model being used), never by eyeballing word counts.

## Embeddings: from words to vectors

Each token is then converted into a [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) of numbers (an **embedding**), learned so that words with similar meaning end up with nearby vectors in that space:

```python
# Purely illustrative representation
embedding("cat")   -> [0.2, -0.5, 0.8, ...]
embedding("kitten") -> [0.3, -0.4, 0.7, ...]   # close to "cat" -> similar meaning
embedding("car")    -> [-0.9, 0.6, -0.1, ...]  # far from "cat" -> different meaning
```

"Close" or "far" is measured exactly as in the chapter on [vectors and the dot product](/?c=mathematiques&p=vecteurs-et-produit-scalaire): by the norm of their difference, or by their dot product once normalized. This property enables operations that have become classic illustrations of the concept: `embedding("king") - embedding("man") + embedding("woman")` produces a vector close to `embedding("queen")`: meaning ends up encoded, at least partially, as a geometric direction in this vector space.

> **Pitfall:** comparing two embeddings produced by **different models**. Each model builds its own vector space during training: two models have no reason to place the word "cat" in the same spot in their respective spaces. A distance between two embeddings is only meaningful between embeddings from the **same** model.
>
> **Best practice:** always produce the embeddings being compared with one single model, never by mixing outputs from two different models.

## Attention applied to text

The attention mechanism (see [Architectures: CNNs, RNNs, and Transformers](/?c=ia&p=architectures-cnn-rnn-transformers)) lets each token "look at" the other tokens in the sequence to adjust its own representation based on context:

```text
"The bank of the river"          vs      "The bank raised its rates"
     ^                                          ^
"bank" influenced by "river"           "bank" influenced by "rates"
-> meaning "riverside"                 -> meaning "financial institution"
```

The same word ("bank") gets a **different** numerical representation depending on context: it's this ability that sets an attention-based model apart from a simple fixed "word → vector" dictionary.

## What is a large language model (LLM)?

An **LLM** (*Large Language Model*) is, in its simplest form, a [Transformer](/?c=ia&p=architectures-cnn-rnn-transformers) model trained on huge amounts of text, with a remarkably simple training objective: **predict the next word (or token)**, given everything that came before.

```text
"The cat is sleeping on the" -> the model predicts a probability distribution over the next token
                                  ("couch": 45%, "rug": 20%, "bed": 15%, ...)
```

This output is exactly a [probability distribution](/?c=mathematiques&p=les-probabilites-de-base) in the sense covered earlier: every possible token in the vocabulary gets a probability, and they all sum to 1.

What makes an LLM impressive isn't the simplicity of that objective, but its **scale**: billions of parameters, trained on a significant fraction of publicly available text, with enough compute power (see [Deep Learning with PyTorch](/?c=ia&p=deep-learning-pytorch)) that this prediction task, pushed to this scale, gives rise to capabilities that were never explicitly programmed (answering questions, summarizing, translating, reasoning step by step...), a phenomenon called **emergent capabilities**.

> **Pitfall:** concluding that the model "understands" or "reasons" in the human sense. The mechanism remains, from start to finish, a statistical prediction of the next token, behavior that *resembles* understanding, with no guarantee that it shares its properties (see the limits detailed in [LLM in Production](/?c=ia&p=llm-en-production)).
>
> **Best practice:** evaluate an LLM on what it actually produces (verified, tested outputs) rather than on an intuition of what it "should" understand because of its size or the fluency of its answers.

## From raw model to usable assistant: fine-tuning vs. prompting

A freshly trained LLM whose only objective was "predict the next word" doesn't naturally respond like a conversational assistant; two approaches (often combined) steer it:

| Approach | Principle |
|---|---|
| **Fine-tuning** | Continue training the model on specific data (example conversations, instructions followed by good answers...), adjusting its weights again |
| **Prompting** | Changes **no** weight in the model: the input (the *prompt*) is simply phrased to guide the already-trained model toward the desired behavior (giving examples in the prompt, phrasing the question a certain way...) |

Prompting only leverages capabilities already acquired during initial training: which is why a well-phrased question (**prompt engineering**, see the dedicated chapter right after this one) can considerably improve a result, without any additional training data or gradient computation coming into play.

> **Pitfall:** expecting prompting to teach a skill that's completely absent from the model's initial training: rephrasing a question differently only leverages what the model has already learned, it doesn't teach it anything new.
>
> **Best practice:** reserve fine-tuning for cases where the desired behavior goes beyond what prompting can leverage (a very specific style, a skill absent from the original training data): prompting stays faster and cheaper whenever it's enough.

See also [Architectures: CNNs, RNNs, and Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) (the underlying attention mechanism), [Deep Learning with PyTorch](/?c=ia&p=deep-learning-pytorch) (how such a model is concretely trained, at a much smaller scale in that chapter's examples) and [Prompt Engineering](/?c=ia&p=prompt-engineering) (how to concretely phrase a good prompt).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Text is split into tokens, then converted into vectors (embeddings) whose proximity reflects proximity of meaning. An LLM is a Transformer trained to predict a probability distribution over the next token, at a very large scale. Prompting leverages already-acquired capabilities; fine-tuning adds new ones by retraining the model. |
| **Tools you can use** | The tokenizer of the model being used, to measure actual length in tokens rather than words. |
| **Pitfalls to avoid** | Confusing token count with word count. Comparing embeddings from different models. Attributing genuine understanding to an LLM. Expecting prompting to teach a skill absent from initial training. |
| **Best practices** | Measure text length in actual tokens. Only compare embeddings from the same model. Evaluate an LLM on its actual outputs rather than on an intuition of what it "should" understand. Reserve fine-tuning for cases where prompting isn't enough. |
