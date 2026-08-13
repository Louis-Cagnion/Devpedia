---
order: 2
---

# Model Training and Gradient Descent

A [neural network](/?c=ia&p=reseaux-de-neurones) starts out with **random** weights: its initial predictions are therefore meaningless. **Training** is the process that gradually adjusts these weights so predictions get closer to the correct answers, based on examples.

## The loss function

A **loss function** is a [mathematical function](/?c=mathematiques&p=la-fonction-mathematique) that numerically measures how far the model's predictions are from the correct answers: the lower the loss, the better the model is on those particular examples.

```python
# Mean squared error (MSE): common for a regression task (predicting a number)
def mean_squared_error(predictions, true_values):
    errors = [(p - v) ** 2 for p, v in zip(predictions, true_values)]
    return sum(errors) / len(errors)

mean_squared_error([3.2, 5.1], [3.0, 5.0])   # small loss -> predictions are close
mean_squared_error([1.0, 1.0], [3.0, 5.0])    # large loss -> predictions are far off
```

For a classification task, **cross-entropy** is more commonly used: it compares two [probability distributions](/?c=mathematiques&p=les-probabilites-de-base): the one predicted by the model and the known one for the correct answer (100% on the correct class, 0% on the others). It's equal to `-log(probability assigned to the correct class)`; this is directly the [logarithm](/?c=mathematiques&p=le-logarithme) property seen earlier: the closer that probability gets to 0, the more `-log(...)` explodes, heavily penalizing a confident but wrong prediction:

```python
import math

def cross_entropy(correct_class_probability):
    return -math.log(correct_class_probability)

cross_entropy(0.99)   # ~0.01 -> confident AND correct: near-zero loss
cross_entropy(0.5)     # ~0.69 -> unsure: moderate loss
cross_entropy(0.01)    # ~4.6  -> confident BUT wrong: very high loss
```

> **Pitfall:** using mean squared error for a classification (categories), or cross-entropy for a regression (a continuous number): each loss function assumes a specific type of output, mixing them up produces inconsistent training (see the same distinction between `LinearRegression` and `LogisticRegression` in [Introduction to Machine Learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Best practice:** choose the loss function based on the expected output type (continuous number -> MSE, category -> cross-entropy), never out of habit or by default.

> **Note:** a loss function must be differentiable (see [the derivative and the gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)), since training computes its gradient at every step, a mathematical constraint, not a readability choice. Once the model is trained, its quality is instead judged with metrics meant to be understood by a human (accuracy, precision, recall...), not necessarily differentiable; see [Measuring a Model's Quality](/?c=data-science&p=machine-learning-scikit-learn).

## Gradient descent: finding the minimum of the loss

Training a network comes down to exactly the principle already seen in [the derivative and the gradient](/?c=mathematiques&p=la-derivee-et-le-gradient): the loss function plays the role of the curve to descend, and the network's weights play the role of the vector being adjusted step by step, in the direction opposite the gradient:

```python
new_weight = old_weight - learning_rate * gradient
```

At each step, the algorithm computes the gradient of the loss with respect to **every** weight in the network (potentially millions of them), then adjusts them all simultaneously in the direction that decreases the loss.

## The learning rate

The **learning rate** is the `learning_rate` in the formula above: it controls the size of each descent step.

| Learning rate | Effect |
|---|---|
| Too high | The model "jumps over" the minimum, the loss oscillates or even diverges (increases instead of decreasing) |
| Too low | Descent is very slow, training can take an unreasonable amount of time, or get stuck in an unsatisfying local minimum |
| Well tuned | Steady, reasonably fast descent toward a good minimum |

> **Pitfall:** keeping the same learning rate without ever questioning it. A loss that plateaus or oscillates without converging almost always points to a poorly tuned learning rate, not necessarily a model unsuited to the problem.
>
> **Best practice:** monitor how the loss evolves over training, and adjust the learning rate (often by gradually reducing it) if it doesn't evolve as expected, rather than treating it as a parameter fixed once and for all.

## Backpropagation: computing the gradient efficiently

A multi-layer network is a **composition** of functions: the output of layer 1 becomes the input of layer 2, and so on. Computing the effect of a weight in the very first layer on the final loss therefore requires working back up this whole chain. The **chain rule** makes it possible to compute this gradient without recalculating each effect from scratch: the derivative of a composition of functions is the product of the derivatives of each function that makes it up. **Backpropagation** applies this rule layer by layer, starting from the output and working back toward the input:

```text
Direction of the normal computation (forward):  Input -> Layer 1 -> Layer 2 -> Output -> Loss
Direction of backpropagation:                   Input <- Layer 1 <- Layer 2 <- Output <- Loss
```

> **Note:** this isn't an operation you recompute by hand to use a framework like [PyTorch](/?c=ia&p=deep-learning-pytorch): `autograd` (automatic differentiation) performs this computation automatically. Understanding the **principle** (propagating the gradient backward, layer by layer, via the chain rule) is enough to reason about why certain training problems occur (e.g. the "vanishing gradient", see [Architectures: CNNs, RNNs, and Transformers](/?c=ia&p=architectures-cnn-rnn-transformers)).

## Epochs, batches, and stochastic gradient descent

```python
for epoch in range(num_epochs):        # an "epoch" = one full pass over ALL the data
    for batch in data_in_batches(data, batch_size=32):  # a "batch" = a small subset
        predictions = model.forward(batch)
        loss = compute_loss(predictions, true_values)
        gradients = backpropagate(loss)
        adjust_weights(gradients, learning_rate)
```

Rather than recomputing the gradient over the **entire** dataset at every step (expensive, especially with millions of examples), small batches (*mini-batch*) are generally used; hence the name **stochastic gradient descent** (SGD): each weight adjustment is based on a sample, not the whole dataset, which introduces a bit of noise but considerably speeds up each step.

> **Pitfall:** choosing a batch size poorly suited to the memory available (see the cost of transfers between CPU and [GPU](/?c=infrastructure&p=cpu-vs-gpu)): too large a batch can exceed available memory, too small a batch needlessly multiplies the number of round trips.
>
> **Best practice:** adjust batch size to the memory actually available (in particular the GPU's), rather than fixing an arbitrary value copied from another project.

## Where the data comes from, and how to make it usable

Everything above already assumes data ready to be fed into the model: in practice, this preparation is often more work than the training itself.

**The amount and nature of the data.** The general principle (collect, clean, split into train/test) is the same as for a classic model, see [the typical stages of a machine learning project](/?c=data-science&p=machine-learning-scikit-learn): a neural network simply demands a lot more of it, often thousands or even millions of examples, to adjust its many parameters without just memorizing them. Two cases differ in how the "correct answer" to compare against the prediction is obtained:

- **Supervised**: each example is labeled by hand (an image classified as "cat", an email marked "spam"): expensive to produce at volume.
- **Self-supervised**: the correct answer is automatically derived from the raw data itself, with no human involvement; this is the case for an LLM trained to predict the next word (see [NLP and LLM](/?c=ia&p=nlp-et-llm)): the "correct answer" for each training example is simply the word that actually follows in the source text. This is what makes it possible to train on far larger volumes of text than any human team could ever label.

**Turning raw data into usable data.** A neural network only accepts a [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) of numbers as input, of **fixed size** (see the input layer in [Neural Networks](/?c=ia&p=reseaux-de-neurones)), never an image, a text, or a spreadsheet row as-is. Each type of data has its own conversion step into this fixed numeric form: text is split into tokens then converted into embeddings (see [NLP and LLM](/?c=ia&p=nlp-et-llm)), an image is resized to a fixed resolution then its pixels normalized into a standard range (e.g. 0 to 1, rather than 0 to 255), tabular data is cleaned and its categorical columns converted into numbers (see [pandas](/?c=data-science&p=pandas)). Without this scale normalization, columns with very different ranges (an age between 0 and 100, a salary between 0 and 100,000) would make gradient descent converge very unevenly depending on direction.

> **Pitfall:** training a model on data that isn't representative of its real-world use (a biased or incomplete dataset, or one too different from the cases encountered in production). The model then faithfully learns the patterns in that data (including its biases) with no code error to flag it.
>
> **Best practice:** check that the training data properly covers the diversity of cases expected in real-world use, before trusting the quality of the resulting model.

**The environment required.** A classic model (scikit-learn) trains in a few seconds on an ordinary CPU. A deep neural network, with its millions or even billions of parameters, quickly becomes impractical without a [GPU](/?c=infrastructure&p=cpu-vs-gpu). Concretely, setting up this environment requires: a deep learning framework (PyTorch, TensorFlow), dependencies isolated from the rest of the system to stay reproducible (see virtual environments in [Python](/?c=langages-de-programmation&s=python&p=modules-et-environnements)), and most often a machine equipped with a GPU, either local or rented on demand in the [cloud](/?c=infrastructure&p=le-cloud) for training too heavy for a personal machine. A notebook (see [Jupyter Notebooks](/?c=data-science&p=jupyter-notebooks)) remains the usual tool for experimenting quickly on a small sample, before launching a full, longer training run via a script.

See also [Deep Learning with PyTorch](/?c=ia&p=deep-learning-pytorch), which fully automates this training loop (`loss.backward()`, `optimizer.step()`).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Training adjusts a network's weights to minimize a loss function, by descending its gradient step by step (see [the derivative and the gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)). Backpropagation computes this gradient efficiently via the chain rule. |
| **Tools you can use** | `autograd` (PyTorch and equivalents) automatically computes the gradient via backpropagation: no manual computation needed in practice. |
| **Pitfalls to avoid** | Mixing up MSE and cross-entropy based on output type. Keeping a poorly tuned learning rate without questioning it. A batch size incompatible with available memory. Training on data unrepresentative of real-world use. |
| **Best practices** | Choose the loss function based on output type. Monitor how the loss evolves to adjust the learning rate. Adapt batch size to the memory actually available. Check the representativeness of the training data. |
