---
order: 11
---

# Parallel text generation: diffusion and NCM (31/10/2026)

An assistant such as [ChatGPT](https://chatgpt.com) (OpenAI's conversational assistant) writes its answer **one piece of a word after another**, from left to right, and cannot write the end before the beginning. This chapter explains why this method is slow, then presents two families of research that try to produce **a lot of text at once**: **diffusion** models and a method published in October 2026 called **NCM**. The subject is at the **research stage**: these approaches are better on a few specific tasks, behind on most others, and do not replace today's LLMs. The figures cited come from the research paper, the blog of its authors and the model card of one model, collected on 31/10/2026; they will change.

The chapter assumes you already know [tokens and LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm) (an LLM, *Large Language Model*, is a language model trained to predict the continuation of a text), [the Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) and [the cost of an LLM in production](/?c=ia&s=nlp-llm&p=llm-en-production).

## Why an LLM writes slowly

### One token after another

A **token** is a piece of text: a short word, part of a word, or a punctuation mark (see [tokenization](/?c=ia&s=nlp-llm&p=nlp-et-llm#tokenization-splitting-text-apart)). A classic LLM is **autoregressive**: it produces text token by token, each new token being computed **from all the previous ones**, including those it has just written itself. "Regressive" comes from the idea of relying on what comes before, and "auto" from the fact that these are its own outputs.

The code in this chapter is written in Python (see [variables](/?c=langages&s=python&p=variables), [lists](/?c=langages&s=python&p=listes-et-tuples) and [loops](/?c=langages&s=python&p=boucles)): `print` displays a value, `len` gives the length of a list, `append` adds an element to its end, `round` rounds a number, `abs` gives the absolute value of a number (its distance from zero, without sign) and `if` runs the following lines only if the condition is true. `while` repeats its lines as long as its condition is true, and `for x in sequence` repeats them for each element of the sequence. `+=` adds a value to a variable (`n += 1` is the same as `n = n + 1`). `items[3]` reads the element at position 3 (counting from 0). A **tuple** such as `(1, 100, 1024)` is a list that cannot be modified, and `for name, passes in` puts the two values of each element into two variables. The operators `*`, `/`, `//` and `<` mean multiply, divide, divide keeping only the whole part of the result (integer division), and "is less than".

```python
# The text our fake model is going to "produce" (one token per list item)
sentence = ["The", "cat", "sleeps", "on", "the", "mat", "."]
# The text written so far: empty at the start
text = []
# Counter of the number of times the model has to read all its weights
weight_reads = 0
# While the text written is shorter than the target sentence
while len(text) < len(sentence):
    # Each token forces the model to read all its weights (explained below)
    weight_reads += 1
    # The fake model adds ONE token only: the next one in the list
    text.append(sentence[len(text)])
# Print the final text and the number of reads
print(text, weight_reads)
```

Output obtained: `['The', 'cat', 'sleeps', 'on', 'the', 'mat', '.'] 7`. Seven tokens, seven reads. There is no shortcut: token 5 cannot be computed before token 4, since it depends on it.

### Weights, memory and bandwidth

The **weights** (or **parameters**) are the millions or billions of numbers learned during training, which define how the model behaves (see [neural networks](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)). They are stored in the **memory** of the graphics card (the GPU, see [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)). To compute **a single** token, the compute chip must read **almost all** of these weights from memory (except in a "mixture of experts" model, explained with DiffusionGemma below, where only the weights of the activated experts are read).

The **memory bandwidth** is the amount of data the memory can send to the chip per second, in gigabytes per second (**GB/s**). A **bit** is a binary digit (0 or 1), a **byte** holds 8 of them, and a gigabyte is one billion bytes. Analogy: a very fast cook whose ingredients are kept in a cellar. If the cook has to climb back up **the whole cellar** for every plate, the climb sets the pace, not how fast the cook cooks. The work is said to be limited by **memory** (*memory-bound*) and not by **computation** (*compute-bound*).

```
  Memory (weights: 16 GB)                    Compute chip
  +------------------------+     read     +--------------------+
  | all the weights        | -----------> | a few operations   |
  +------------------------+  per token   | per weight read    |
          ^                                +----------+---------+
          |                                           |
          +---------- next token, start again --------+
```

An arithmetic operation costs very little compared with moving a weight: the chip spends most of its time waiting for data.

### An order-of-magnitude calculation

The formula is: **time ≈ model size × number of tokens ÷ bandwidth** (≈: roughly equal to; ×: multiplied by; ÷: divided by). It gives a **minimum** (the reading time alone), because the rest of the work can only make it longer.

Example data: a model with **16 GB** of weights, **1,024 tokens** to produce, and an [NVIDIA GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) graphics card (a graphics card made by NVIDIA). Its memory bandwidth, as announced by the manufacturer, is **1,792 GB/s**. It is derived from the datasheet: the **bus** is the number of wires carrying bits in parallel (here 512), a **pin** is one of these connection wires of the chip, a **gigabit** is one billion bits, and **GDDR7** is a type of graphics memory, here at 28 gigabits per second per pin: 512 × 28 ÷ 8 = 1,792 (we divide by 8 to convert bits into bytes). This value could not be re-checked against NVIDIA's official specification sheet when this chapter was written: check it before relying on it.

```python
# Bandwidth in GB/s: 512 bits wide x 28 gigabits per second
# The whole is divided by 8, because a byte holds 8 bits
bandwidth = 512 * 28 / 8
# Print the bandwidth used
print("bandwidth (GB/s):", bandwidth)

# Model size in gigabytes (GB)
model_size = 16
# We try three response lengths
for nb_tokens in (1, 100, 1024):
    # Formula: model size x number of tokens / bandwidth (result in seconds)
    time = model_size * nb_tokens / bandwidth
    # Print the time rounded to 3 decimals
    print(nb_tokens, "tokens ->", round(time, 3), "s")
# Tokens per second: one full read of the weights per token
print("tokens per second:", round(bandwidth / model_size, 1))
```

Output obtained:

```
bandwidth (GB/s): 1792.0
1 tokens -> 0.009 s
100 tokens -> 0.893 s
1024 tokens -> 9.143 s
tokens per second: 112.0
```

| Quantity | Value | Origin |
|---|---|---|
| Size of the weights | 16 GB | Assumption of the example |
| Memory bandwidth | 1,792 GB/s | RTX 5090 manufacturer's datasheet (value not re-checked here) |
| Reading the weights for one token | about 8.9 ms | 16 ÷ 1,792 |
| Response of 1,024 tokens | about 9.1 s | 1,024 × 8.9 ms |
| Maximum throughput (one single conversation) | about 112 tokens per second | 1,792 ÷ 16 |

We find the order of magnitude of "about 9 seconds". The real time is longer (computation, context data, software), but **never shorter** than this reading. Buying a chip that computes twice as fast changes almost nothing if the memory does not send twice as much data.

### Batching requests

A **batch** means processing **several requests at the same time**: the chip reads the weights **once**, then uses them to advance by one token in each conversation of the batch. The reading, which is expensive, is shared.

```python
# Reuse the bandwidth and model size of the previous example
bandwidth = 1792
model_size = 16
# We try several batch sizes (number of conversations processed together)
for batch_size in (1, 8, 64, 256):
    # One read of the weights produces one token per conversation in the batch
    throughput = batch_size * bandwidth / model_size
    # Print the maximum total throughput (sum over all conversations)
    print("batch", batch_size, "->", round(throughput), "tokens/s (cap)")
```

Output obtained: 112, 896, 7,168 and 28,672 tokens per second. These are **theoretical caps** (the calculation uses the example values): beyond a certain batch size, the chip no longer has enough computing power, and each conversation also keeps its own context memory (the **KV cache**: the attention keys and values, already computed for the previous tokens), which is not shared between them.

| | [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) provider (many users) | Local use (one conversation) |
|---|---|---|
| Simultaneous requests | Hundreds, grouped into batches | Just one |
| Shared weight reads | Yes: a cost divided by the batch size | No: each token pays for its full reading |
| Limiting factor | Mostly computation, beyond a certain batch size | Memory bandwidth |
| Effect of a model that writes several tokens per read | Modest gain: the reading is already spread out | Potentially large gain |
| Where the slowness is felt | Mostly in latency (the waiting time) for each user | Everywhere |

This is why a provider is not very sensitive to this bottleneck, whereas the same question asked of a model running on your own computer is slow. For the cost of a call on the provider's side, see [LLMs in production](/?c=ia&s=nlp-llm&p=llm-en-production).

## The two parallel approaches

Common idea: **produce several tokens per read of the weights**. One read then serves many positions of the text at once; the calculation increases, but the number of reads decreases.

### Text diffusion

**Diffusion** is a method born for images: you start from a result full of noise (an image of random pixels, a pixel being a point of color in the image), and a model **cleans it up** step by step until it obtains a sharp image. Each step is a **denoising pass**: the model looks at the whole noisy image and produces a slightly less noisy version.

For text, the principle is transposed: you start from a **complete draft** of the text, whose positions are masked or random, and at **each pass** the model **rewrites the whole draft** at once, making it more coherent. The number of passes is chosen in advance and can be much lower than the number of tokens.

A usable example today: **DiffusionGemma**, a model from the Gemma family (open models from Google) whose [official model card](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) describes parallel denoising of **blocks of 256 tokens**, with 15 to 20 tokens obtained per pass.

### NCM: a pyramid of codes

**NCM** stands for *Next-Concept Modeling*. It is a method submitted on 9 October 2026 by a team around Stanford University. Here, a "concept" is **not** an idea in the everyday sense: it is a **code** chosen from a codebook. It works in two steps.

**Step 1: build a hierarchical tokenizer.** A **tokenizer** is the program that converts a text into tokens and back; here, it produces a hierarchy of codes. It relies on a **VQ-VAE** (*Vector Quantized Variational Auto-Encoder*, "variational auto-encoder with vector quantization"). A VQ-VAE is a neural network in three parts: an encoder that compresses a text, a **quantization** step that replaces each result with the closest code in a **codebook** (a fixed list of vectors, that is, lists of numbers; see [vectors](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)), and a decoder that rebuilds the text from the codes. NCM uses a **residual** and **multi-scale** variant: the first level encodes the text **coarsely**, the second encodes what **remains** (the residual: the error of the first), the third encodes the remainder of the remainder, and so on down to the finest level. Each level has its own codebook. The idea is taken from [VAR](https://arxiv.org/abs/2404.02905) (*Visual AutoRegressive modeling*), an image generation method.

The following toy version encodes **a single number** in three levels, to show the principle (real codes are vectors, not bare numbers).

```python
# One codebook per level (a list of codes, here a Python list)
# Level 1 is coarse, level 3 is fine
codebooks = [
    [0, 4, 8, 12],
    [-2, -1, 0, 1, 2],
    [-0.5, -0.25, 0, 0.25, 0.5],
]
# The number to encode
target = 7.3
# What has been reconstructed so far: nothing at the start
reconstruction = 0
# Number of the current level
level = 0
# We go through the codebooks from coarse to fine
for codebook in codebooks:
    # Move on to the next level
    level += 1
    # The remainder to encode: what the reconstruction has not reached yet
    remainder = target - reconstruction
    # First assume that the first code of the codebook is the best
    best = codebook[0]
    # Examine each code of the codebook
    for code in codebook:
        # abs gives the absolute value (unsigned distance); keep the closest code
        if abs(code - remainder) < abs(best - remainder):
            best = code
    # The chosen code is added to the reconstruction
    reconstruction += best
    # Print the level, the chosen code, the running reconstruction and the remaining error
    print(level, "code", best, "reconstruction", reconstruction,
          "error", round(abs(target - reconstruction), 2))
```

Output obtained:

```
1 code 8 reconstruction 8 error 0.7
2 code -1 reconstruction 7 error 0.3
3 code 0.25 reconstruction 7.25 error 0.05
```

Each level **refines** the previous one: the error goes from 0.7 to 0.3, then to 0.05.

**Step 2: generate.** The tokenizer is **frozen** (it is no longer changed). A Transformer predicts **one level at a time**: at each pass, it writes **all the codes of one level in parallel**, relying on the running reconstruction of the levels already produced. When the hierarchy is complete, the tokenizer's decoder converts it into text. The translation example in the authors' blog has **11 levels**, so 11 passes of the Transformer. The hierarchy is **fixed** within a task (12 model evaluations for the Sudoku, according to the paper).

### The three ways of writing, as a diagram

```
Autoregressive: one token per pass, from left to right
  pass 1: [The] .  .  .  .  .  .
  pass 2: [The][cat] .  .  .  .  .
  pass 3: [The][cat][sleeps] .  .  .  .      ... 1 pass per token

Diffusion: the whole draft is rewritten at each pass
  pass 1: [?][?][?][?][?][?][?]    very blurry draft
  pass 2: [The][?][sleeps][?][the][?][.]
  pass 3: [The][cat][sleeps][on][the][mat][.]   ... a few passes

NCM: one level of the pyramid per pass, over the whole text
  level 1 (coarse): overall shape of the text
  level 2          : correction of level 1
  ...
  level 11 (fine) : details         -> decoder -> text
```

The diffusion diagram is an illustration of the principle: the positions fixed at each pass depend on the actual model.

### Comparison

| | Autoregressive | Text diffusion | NCM |
|---|---|---|---|
| What one pass does | Adds one token | Rewrites the whole draft | Writes one level of codes for the whole text |
| Number of passes | One per token | Chosen in advance, often well below the number of tokens | Fixed within a task: one per level (11 in the blog's translation example) |
| What is produced | Tokens | Tokens | Codes, converted into text by a decoder |
| Writing order | Left to right | All positions together | From coarse to fine |
| Availability | Everywhere | One usable model: DiffusionGemma | Code and weights published by the authors (GitHub and Hugging Face) |
| Maturity | Very widespread | Research, one first published model | Research, small-scale tests |

Passes are easy to count: with the 16 GB model of the example and a reading of 8.9 ms per pass, a text of 1,024 tokens needs 1,024 passes in autoregressive mode. If a diffusion pass gave 16 tokens (a **made-up** value for the illustration, close to the 15 to 20 of the DiffusionGemma model card), it would take 64; with 11 levels, NCM needs 11.

```python
# Time to read the weights for one pass: 16 GB / 1,792 GB/s
time_per_pass = 16 / 1792
# Three scenarios, each a pair (name, number of passes); the last two are
# assumptions. 1024 // 16 is integer division: 64 passes of 16 tokens
scenarios = (
    ("autoregressive", 1024),
    ("diffusion, 16 tokens per pass", 1024 // 16),
    ("NCM, 11 levels", 11),
)
# Go through each scenario
for name, passes in scenarios:
    # Total time to read the weights (excluding computation) for this scenario
    print(name, passes, "passes ->", round(passes * time_per_pass, 3), "s")
```

Output obtained: 9.143 s, 0.571 s and 0.098 s. Warning: this is a **reading-only** calculation. An NCM model of this size does not exist (the largest one has 725 million parameters), and each pass does more computation than an autoregressive pass, since it processes many positions. The table shows the **origin** of the expected gain, not a measured gain.

## Results and limits

### What NCM measured

The authors compare NCM, on an [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) (a data-center card), with the **best text diffusion model**. They **do not compare** its speed with an autoregressive model: the claim "10 to 31 times faster" concerns diffusion, never the usual LLMs.

[**ROUGE-L**](https://aclanthology.org/W04-1013/) is a score that measures the overlap between a generated summary and a reference summary written by a human (it relies on the longest sequence of words common to both, in the same order). **Perplexity** measures how much a text "surprises" a language model: the lower it is, the more predictable the text is for the model. **Generative perplexity** applies this measure to the texts a model has just generated, the measurement being made by another model, called a reference model (paper, appendix E.1). The authors themselves point out that it **does not measure all of the quality**: a flat, repetitive text can get a good perplexity.

| Test set | Task | Result announced against the best diffusion model |
|---|---|---|
| [LM1B](https://arxiv.org/abs/1312.3005) (sentence set) | Generate text | 21 times faster, better generative perplexity |
| [OpenWebText](https://skylion007.github.io/OpenWebTextCorpus/) (web texts) | Generate text | 10 times faster, comparable quality |
| [XSum](https://arxiv.org/abs/1808.08745) (article summaries) | Summarize | 31 times faster, at **equal ROUGE-L** |

Other reported points:

| Point | Value |
|---|---|
| Sizes tested | 97 M, 317 M and 725 M parameters (M: millions), experiments described as **preliminary** |
| Training | 4 to 5 times fewer tokens than the reference diffusion models (4.9 times on LM1B, 4 times on OpenWebText, tokenizer and generator training combined) |
| Translation (test set [WMT14](https://www.statmt.org/wmt14/), German and English) and summarization | "Similar or better performance" than the best diffusion models; no numerical comparison with an autoregressive model |

### The Sudoku

A Sudoku is a 9 × 9 grid of cells to fill with digits from 1 to 9, with no repetition in any row, column or **block** (one of the nine 3 × 3 squares of cells); the **clues** are the digits already placed. A classic program solves it by [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) (trial and error with returns). Here, the models must write the grid. **MDLM** and **DUO** are two reference diffusion models cited by the [paper](https://arxiv.org/abs/2610.14162). The table gives the percentage of grids **fully solved**, by difficulty level.

| Level | Autoregressive | MDLM (diffusion) | DUO (diffusion) | NCM |
|---|---|---|---|---|
| Easy (40 clues) | 14.6% | 92.0% | 96.3% | 99.5% |
| Medium (35 clues) | 5.1% | 77.1% | 84.7% | 96.5% |
| Hard (30 clues) | 1.0% | 30.2% | 58.4% | 86.1% |

NCM is top at each level, with far fewer **evaluations** of the model (number of complete passes through the network to produce a grid): 12 for NCM against 128 for the autoregressive model (paper, table 3). This result concerns a **specific** task and says nothing about writing free-form text. The autoregressive model compared is a small model of 25 million parameters, trained for this task (paper, table 3). Reading "86.1% against 1.0%" as "NCM is 86 times better than LLMs" would therefore be misleading: nothing makes it comparable to a commercial assistant.

### DiffusionGemma

The model card compares the **26B A4B** variant of [DiffusionGemma](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) with the variant of the same name from Gemma 4, an autoregressive model from the same family (in this name, 26B evokes the total size and A4B the number of parameters active at a time; the model card gives precisely 25.2 billion in total and 3.8 billion active). These are so-called **mixture of experts** models: the network contains many specialized sub-networks (the experts) and, for each token, only a few of them are activated. Only their weights are read, hence the gap between total parameters and active parameters. The tests are standard competitions or question sets.

| Test | Content | Gemma 4 26B A4B | DiffusionGemma 26B A4B | Gap |
|---|---|---|---|---|
| [AIME](https://artofproblemsolving.com/wiki/index.php/American_Invitational_Mathematics_Examination) 2026 (without tools) | Competition mathematics problems | 88.3% | 69.1% | 19.2 percentage points lost |
| [LiveCodeBench](https://livecodebench.github.io/) v6 | Programming problems | 77.1% | 69.1% | 8.0 points lost |
| [Codeforces](https://codeforces.com/) (ELO rating) | Programming competitions | 1718 | 1429 | 289 points lost |
| [GPQA](https://arxiv.org/abs/2311.12022) Diamond | Difficult science questions | 82.3% | 73.2% | 9.1 points lost |
| [MMLU Pro](https://arxiv.org/abs/2406.01574) | Broad knowledge | 82.6% | 77.6% | 5.0 points lost |

"Without tools" means that the model cannot call a calculator or code. **ELO** is a rating system: a higher number means a higher level. Diffusion is therefore **usable today**, but at the cost of lower quality on each of these tests.

For speed, the model card mentions 15 to 20 tokens per pass and more than 1,100 tokens per second per user, with small batches, on H100 in FP8 (model card consulted on 26/10/2026; FP8 is a number format using 8 bits). A secondary article cites 1,107 tokens per second against 303 for autoregressive, but these two precise figures do not appear in the model card: they are **unverified** and should not be retained.

### Hardware consequence

If a pass produces many tokens, each weight read serves **many more calculations** before being read again. The work would therefore shift from "limited by memory bandwidth" to "limited by computation". This is a line of reasoning, not a measurement from the sources read. It brings local use closer to a provider that already processes batches: the chips that matter would then be those that compute fast, a different field from chips designed against the memory bottleneck, such as the LPU presented in [TPU, NPU, LPU and VPU](/?c=infrastructure-devops&s=infrastructure&p=tpu-npu-lpu-vpu).

| | Autoregressive, one conversation | Parallel generation (hypothesis) |
|---|---|---|
| Main bottleneck | Memory bandwidth | Computing power |
| What helps | Faster memory, weights kept in memory on the chip | More computing units |
| Weight reads | One per token | One per pass |

## What remains uncertain

| Question | Status |
|---|---|
| Does NCM scale up to models of several billion parameters? | Unknown: experiments up to 725 M, described as preliminary by the authors |
| How does NCM compare with an autoregressive LLM, in speed and in quality? | Not measured in the sources read |
| Does the fixed hierarchy limit the texts? | Limit noted by the authors, effects not detailed here |
| Does generative perplexity reflect real quality? | Not entirely, according to the authors |
| Are the figures of 1,107 and 303 tokens per second (DiffusionGemma, autoregressive) correct? | Unverified: absent from the model card, which speaks of more than 1,100 tokens per second |
| Does parallel generation generalize beyond a few tasks? | Unknown: DiffusionGemma loses 5.0 to 19.2 percentage points on four tests and 289 ELO points on Codeforces (model card) |

The paper was submitted on 9 October 2026, three weeks before this chapter was written: the results of a recent, isolated publication are often confirmed or corrected later, by other teams.

## Sources consulted

| Source | Address |
|---|---|
| Research paper, "Next-Concept Modeling: Fast, Parallel Coarse-to-Fine Text Generation" (9 October 2026) | [arxiv.org/abs/2610.14162](https://arxiv.org/abs/2610.14162) (arXiv: public site for depositing research papers) |
| Authors' blog (Hazy Research) | [hazyresearch.stanford.edu/blog/2026-10-12-ncm](https://hazyresearch.stanford.edu/blog/2026-10-12-ncm) |
| Official DiffusionGemma model card | [ai.google.dev/gemma/docs/diffusiongemma/model_card](https://ai.google.dev/gemma/docs/diffusiongemma/model_card?hl=en) |
| Code of NCM on [GitHub](/?c=git&p=github-et-plateformes) (code hosting platform) | [github.com/HazyResearch/ncm](https://github.com/HazyResearch/ncm) |
| Weights of NCM (Hugging Face collection, indicated by the repository's README) | [huggingface.co/hazyresearch](https://huggingface.co/hazyresearch) |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Reading "31 times faster" as "31 times faster than ChatGPT" | The measure compares NCM with the best **diffusion** model, never with an autoregressive one | Always read the point of comparison |
| Concluding that today's LLMs are finished | The results are isolated, and DiffusionGemma loses quality on the five tests cited in its model card (gap of 5.0 to 19.2 percentage points, 289 ELO points on Codeforces) | Present parallel generation as a research direction |
| Generalizing from the Sudoku | A specific task does not predict quality on free-form text | Cite the task along with the figure |
| Believing that "concept" means an idea | In NCM, it is a code from a codebook | Say "code" |
| Relying on perplexity alone | It does not measure all of the quality | Also look at task scores (ROUGE-L, puzzle solving) |
| Taking a throughput cap for a measurement | The reading-only calculation ignores computation and context memory | Measure on the real machine |
| Reusing a figure from a secondary article | It is absent from the official model card (case of 1,107 and 303 tokens/s) | Go back to the model card or to the paper |
| Assuming that a research model is ready to use | The weights of NCM are published (repository README, Hugging Face), but these are small-scale tests (725 M at most) | Read the README and the limits before trying |
| Confusing model size with speed | At equal size, the number of weight reads decides the time | Count the passes |

## Best practices

| Best practice | Why |
|---|---|
| Compute the order of magnitude first: size × tokens ÷ bandwidth | To know whether a slowdown comes from memory or from computation |
| Give the source and the date of every speed figure | Measurements change quickly and depend on the card |
| Compare models of the same type on the same task | Avoid comparisons that say nothing |
| Keep an autoregressive LLM in production until a parallel model reaches its quality | The losses of DiffusionGemma are measured |
| Distinguish provider (batches) from local use (one conversation) | The bottleneck is not the same |
| Read the "limitations" section of a publication before its summary | The authors say there what is not proven |

## Key takeaways

| | |
|---|---|
| **Key takeaways** | An **autoregressive** LLM writes one token at a time and reads all its weights for each one: it is limited by **memory bandwidth**, not by computation (16 GB model, 1,024 tokens, 1,792 GB/s: at least 9.1 s). A provider spreads these reads across **batches**; a single local conversation cannot. **Diffusion** rewrites the whole draft at each **denoising pass** (DiffusionGemma is usable, but loses 19.2 and 8.0 points on AIME 2026 and LiveCodeBench v6); **NCM** encodes the text with a residual, multi-scale VQ-VAE and generates one level of codes per pass, from coarse to fine ("31 times" measured against diffusion, hard Sudoku 86.1% against 1.0%, experiments up to 725 M parameters). If parallel generation generalizes, the bottleneck would shift from memory to computation. A **research** subject. |
| **Pitfalls to avoid** | Confusing "faster than diffusion" with "faster than an LLM"; announcing the end of LLMs; generalizing from the Sudoku; believing that a "concept" is an idea; judging by perplexity alone; reusing a figure without a primary source. |
| **Best practices** | Estimate the bottleneck with the formula size × tokens ÷ bandwidth; date and source every figure; compare on the same task; keep the autoregressive model in production while quality is not equal; read the authors' limitations. |
