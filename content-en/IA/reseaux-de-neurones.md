---
order: 1
---

# Neural Networks: The Fundamentals

**Machine learning** consists of getting a program to learn a behavior from data, rather than dictating every rule to it explicitly (see [Introduction to Machine Learning](/?c=data-science&p=machine-learning-scikit-learn) to go further). An **artificial neural network** is a family of machine learning models: a [mathematical function](/?c=mathematiques&p=la-fonction-mathematique), made up of many simple computing units ("neurons") organized in layers, whose parameters adjust themselves automatically from data rather than being written by hand.

## The artificial neuron

A neuron receives several inputs, computes a **weighted sum** (see the [dot product](/?c=mathematiques&p=vecteurs-et-produit-scalaire): that's exactly this computation, between the input vector and the weight vector), adds a **bias**, then applies an **activation function**:

```text
output = activation(w1*x1 + w2*x2 + w3*x3 + ... + bias)
```

```python
def neuron(inputs, weights, bias, activation):
    weighted_sum = sum(i * w for i, w in zip(inputs, weights)) + bias
    return activation(weighted_sum)
```

- The **weights** (`w1`, `w2`...) determine how important each input is: these, along with the bias, are what training adjusts (see [Model Training and Gradient Descent](/?c=ia&p=entrainement-descente-de-gradient)).
- The **bias** lets the output be shifted even when all inputs are zero (like the y-intercept of a line).

> **Pitfall:** omitting the bias. Without it, a neuron's output is always zero as soon as all inputs are zero, no matter the weights: the neuron can never shift its response independently of its inputs, which severely limits what it can learn to represent.
>
> **Best practice:** always include a bias in a neuron, unless you have a specific reason to force a zero output for zero inputs.

## Why an activation function is essential

Without an activation function (or with a linear one), stacking several layers of neurons would mathematically amount to... a single linear operation: the composition of several linear functions is still linear, no matter how many layers are stacked. The activation function introduces **non-linearity**, essential for the network to learn complex patterns (a curved decision boundary, for instance, rather than a simple straight line).

| Activation function | Formula (simplified) | Typical use |
|---|---|---|
| **Sigmoid** | Squashes any value between 0 and 1 | Output of a binary classification (a [probability](/?c=mathematiques&p=les-probabilites-de-base)) |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)`: lets positive values through, squashes negatives to 0 | Hidden layers, very widely used in practice (simple and cheap to compute) |
| **Softmax** | Turns a vector of scores into a [probability distribution](/?c=mathematiques&p=les-probabilites-de-base) that sums to 1 | Output of a multi-category classification |

```python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

> **Pitfall:** using sigmoid on the output of a classification with **more than two** categories. Sigmoid produces an independent probability per category, with no guarantee that they sum to 1: softmax is built precisely to produce a valid probability distribution across several categories at once (see a [distribution summing to 1](/?c=mathematiques&p=les-probabilites-de-base)).
>
> **Best practice:** choose the output activation function based on the number of categories to distinguish: sigmoid for a binary choice, softmax as soon as more than two mutually exclusive categories are involved.

## The layers of a network

```text
Input -> [Hidden layer 1] -> [Hidden layer 2] -> ... -> Output
```

- **Input layer**: receives the raw data (an image's pixels, a sentence's words encoded as numbers...).
- **Hidden layers**: each transforms the representation received from the previous layer: the more layers there are ("*deep* learning"), the more abstract and complex the patterns the network can represent.
- **Output layer**: produces the final result (a probability, a category, a numeric value...).

> **Pitfall:** adding layers without having enough data to train them properly. A network too deep for the amount of data available memorizes the training examples instead of learning a general pattern (see overfitting in [Introduction to Machine Learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Best practice:** adjust network depth to the amount of data actually available, rather than stacking layers hoping for an automatic gain.

## A forward pass, step by step

For a minimal network with a single hidden layer of 2 neurons, and an input `[1.0, 2.0]`:

```python
inputs = [1.0, 2.0]

# Hidden layer neuron 1
weights_n1 = [0.5, -0.3]
bias_n1 = 0.1
output_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # relu(0.0) = 0

# Hidden layer neuron 2
weights_n2 = [0.2, 0.4]
bias_n2 = 0.0
output_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Output layer (1 neuron, from the 2 previous outputs)
output_weights = [0.6, 0.9]
output_bias = 0.05
result = sigmoid(output_n1 * 0.6 + output_n2 * 0.9 + 0.05)  # sigmoid(0.95) ~= 0.72
```

This computation (multiply, sum, apply an activation, layer after layer) is **all** a neural network does to produce a prediction. What makes the network "intelligent" is never this mechanism (fixed, purely arithmetic), but the **values of its weights and biases**, adjusted automatically by training (see [Model Training and Gradient Descent](/?c=ia&p=entrainement-descente-de-gradient)) from a large number of examples.

In this example, the weights are already fixed at specific values to illustrate the computation, at the very start of actual training, they instead start out as random values.

> **Pitfall:** initializing all of a layer's weights to the **same** value (often zero). All neurons in that layer would then compute exactly the same thing at every step, and would keep learning identically: the network loses the ability to have its neurons learn different roles.
>
> **Best practice:** initialize weights with small random values (see [randomness and generators](/?c=representation-des-donnees&p=aleatoire-et-generateurs)), different from one another, so each neuron starts from a distinct starting point.

## A network = an approximating function

Seen from this angle, a neural network is nothing more than a [mathematical function](/?c=mathematiques&p=la-fonction-mathematique) parameterized (by its weights and biases), flexible enough to approximate a complex relationship between an input (an image, a text...) and an output (a category, a sequence of words...), provided there is enough representative data to properly adjust these parameters.

> **Pitfall:** trusting a network on inputs very different from those seen during training. A function approximated from examples only stays reliable within the range covered by those examples; outside it, its output has no guarantee of remaining relevant.
>
> **Best practice:** check that the data actually submitted to the model in use remains representative of the training data, rather than assuming the model "generalizes" indefinitely beyond it.

See also [Model Training and Gradient Descent](/?c=ia&p=entrainement-descente-de-gradient) (how these weights are concretely adjusted) and [Architectures: CNNs, RNNs, and Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) (specific ways of organizing these layers depending on the type of data processed).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | An artificial neuron computes a weighted sum of its inputs (a dot product), adds a bias, then applies a non-linear activation function. A network stacks these neurons into layers (input, hidden, output); its weights and biases are adjusted through training. |
| **Tools you can use** | Common activation functions (sigmoid, ReLU, softmax) are provided directly by deep learning libraries (see [PyTorch](/?c=ia&p=deep-learning-pytorch)). |
| **Pitfalls to avoid** | Omitting the bias. Using sigmoid for a multi-category classification. Stacking layers without enough data. Initializing all weights to the same value. Trusting the model outside the range covered by its training data. |
| **Best practices** | Choose the output activation based on the number of categories (sigmoid vs. softmax). Adjust network depth to the amount of data available. Initialize weights with small, distinct random values. |
