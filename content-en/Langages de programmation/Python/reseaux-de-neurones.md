---
order: 18
---

# Neural Networks — The Basics

An **artificial neural network** is a machine learning model (see the dedicated chapter) composed of numerous simple computational units (“neurons”), organized into layers and interconnected—a structure loosely inspired by biological processes, but which remains, above all, a mathematical construct: a complex function whose parameters are automatically adjusted based on data.

## The Artificial Neuron

A neuron receives multiple inputs, calculates a **weighted sum**, adds a bias to it, and then applies an **activation function**:

```
sortie = activation(w1*x1 + w2*x2 + w3*x3 + ... + biais)
```

```python
def neurone(entrees, poids, biais, activation):
    somme_ponderee = sum(e * p for e, p in zip(entrees, poids)) + biais
    return activation(somme_ponderee)
```

- The **weights** (`w1`, `w2`...) determine the importance of each input—it is these, along with the bias, that the training process will adjust (see the chapter on gradient descent).
- **Offset** allows the output to be shifted even when all inputs are zero (like the y-intercept of a straight line).

## Why an activation function is essential

Without an activation function (or with a linear one), stacking multiple layers of neurons would mathematically amount to... a single linear operation: the composition of multiple linear functions remains linear, regardless of the number of stacked layers. The activation function introduces **nonlinearity**, which is essential for the network to learn complex patterns (a curved decision boundary, for example, rather than a simple straight line).

| Activation Function | Formula (simplified) | Typical Use |
|---|---|---|
| **Sigmoid** | Clamps all values between 0 and 1 | Output of a binary classification (probability) |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)` — passes through positive values and sets negative values to 0 | Hidden layers; widely used in practice (simple and efficient to compute) |
| **Softmax** | Converts a vector of scores into probabilities that sum to 1 | Outputs a multi-class classification |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

## The Layers of a Network

```
Entrée -> [Couche cachée 1] -> [Couche cachée 2] -> ... -> Sortie
```

- **Input layer**: receives raw data (the pixels in an image, the words in a sentence encoded as numbers, etc.).
- **Hidden layers**: Each layer transforms the representation received from the previous layer—the more layers there are ("*deep* learning"), the better the network can represent abstract and complex patterns.
- **Output layer**: produces the final result (a probability, a category, a numeric value, etc.).

## A Forward Pass, Step by Step

For a minimal network with a single hidden layer of 2 neurons and an input of `[1.0, 2.0]`:

```python
entrees = [1.0, 2.0]

# Hidden layer neuron 1
poids_n1 = [0.5, -0.3]
biais_n1 = 0.1
sortie_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # read(0.0) = 0

# Hidden layer neuron 2
poids_n2 = [0.2, 0.4]
biais_n2 = 0.0
sortie_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Output layer (1 neuron, based on the 2 previous outputs)
poids_sortie = [0.6, 0.9]
biais_sortie = 0.05
resultat = sigmoide(sortie_n1 * 0.6 + sortie_n2 * 0.9 + 0.05)  # sigmoid(0.95) ≈ 0.72
```

This calculation—multiplying, summing, and applying an activation function, layer by layer—is **all** a neural network does to produce a prediction. What makes the network “intelligent” is never this mechanism (which is fixed and purely arithmetic), but rather the **values of the weights and biases**, which are automatically adjusted through training (see the chapter on gradient descent) based on a large number of examples.

## One network = one approximation function

Viewed from this perspective, a neural network is nothing more than a mathematical function with parameters (weights and biases) that is flexible enough to approximate a complex relationship between an input (an image, text, etc.) and an output (a category, a sequence of words, etc.) — provided there is enough representative data to properly adjust these parameters.

See also the chapters on gradient descent (how these weights are actually adjusted) and on CNN/RNN/Transformer architectures (specific ways of organizing these layers depending on the type of data being processed).
