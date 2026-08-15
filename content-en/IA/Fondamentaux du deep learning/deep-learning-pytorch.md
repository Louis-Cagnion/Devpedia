---
order: 4
---

# Deep Learning with PyTorch

**PyTorch** is one of the two most widely used deep learning frameworks (along with TensorFlow). It provides the **tensor**: a structure that stores a [vector or matrix of numbers](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (close to the [NumPy](/?c=data-science&p=numpy) library's `ndarray` for anyone already familiar with it), with two extra capabilities: running on a [GPU](/?c=infrastructure&p=cpu-vs-gpu), and automatically computing its own gradient. PyTorch thus automates all the mechanics from the chapter on [training and gradient descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## The tensor: numbers that can compute their own gradient

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # vectorized operations, like the dot product seen earlier
```

A PyTorch tensor can live on the CPU or on a GPU (`x.to("cuda")`), which runs the same vectorized operations massively in parallel (see [CPU vs. GPU](/?c=infrastructure&p=cpu-vs-gpu)): this is what makes training networks with millions or even billions of parameters practical.

> **Pitfall:** mixing, in the same computation, a tensor left on the CPU and a tensor moved to the GPU (for example the model on GPU, but a batch of data forgotten on CPU). PyTorch refuses the operation with an explicit error rather than guessing where to run the computation.
>
> **Best practice:** systematically move **all** the elements involved in a computation (model and data) to the same device before using them together, never just one of the two.

## `autograd`: automatic differentiation

```python
x = torch.tensor(3.0, requires_grad=True)   # "track operations on x so it can be differentiated later"

y = x ** 2 + 2 * x

y.backward()    # automatically computes dy/dx (backpropagation)

print(x.grad)   # 8.0 -> since dy/dx = 2x + 2, evaluated at x=3 -> 2*3 + 2 = 8
```

`requires_grad=True` tells PyTorch to remember every operation applied to this tensor; `.backward()` then automatically walks back up this chain of operations to compute the gradient (see [the derivative and the gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)), exactly the mechanism described conceptually in [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), but fully automated.

## Defining a network with `nn.Module`

```python
import torch.nn as nn

class SimpleNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(10, 32)   # fully connected layer: 10 inputs -> 32 outputs
        self.activation = nn.ReLU()
        self.layer2 = nn.Linear(32, 1)     # 32 inputs -> 1 output

    def forward(self, x):
        x = self.layer1(x)
        x = self.activation(x)
        x = self.layer2(x)
        return x

model = SimpleNetwork()
```

`nn.Linear(inputs, outputs)` automatically creates the corresponding weights and biases (see [Neural Networks: The Fundamentals](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)); `forward()` describes the data's path through the layers, exactly like the "forward pass" detailed by hand in that same chapter.

> **Pitfall:** forgetting `super().__init__()` at the start of `__init__()`. This line initializes `nn.Module`'s internal mechanisms (including weight tracking): without it, the rest of the class fails or behaves inconsistently, often with an unhelpful error message.
>
> **Best practice:** always call `super().__init__()` as the very first line of the constructor of a class that inherits from `nn.Module`, before defining a single layer.

## The typical training loop

```python
import torch.optim as optim

loss_function = nn.MSELoss()                       # mean squared error
optimizer = optim.SGD(model.parameters(), lr=0.01)  # stochastic gradient descent

for epoch in range(100):
    predictions = model(X_train)                     # equivalent to model.forward(X_train)
    loss = loss_function(predictions, y_train)

    optimizer.zero_grad()   # resets the gradients (otherwise they'd add up from one iteration to the next)
    loss.backward()          # computes the gradients (automatic backpropagation)
    optimizer.step()          # adjusts the weights based on the computed gradients

    if epoch % 10 == 0:
        print(f"Epoch {epoch}: loss = {loss.item():.4f}")
```

This loop is the near-universal structure of any PyTorch training run: predict, measure the error, backpropagate, adjust, repeated for as many epochs as needed for the loss to decrease enough (see [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) for what each step actually means).

> **Pitfall:** forgetting `optimizer.zero_grad()`. PyTorch **accumulates** gradients by default on every `.backward()` rather than replacing them, a design decision useful for some advanced cases, but one that throws off standard training if gradients are never reset between batches.
>
> **Best practice:** systematically call `zero_grad()` before every `.backward()`, on every iteration of the training loop, with no exceptions.

## Evaluation mode vs. training mode

```python
model.eval()    # disables training-specific behaviors (e.g. dropout)
with torch.no_grad():   # disables gradient tracking: faster, unnecessary outside training
    predictions = model(X_test)

model.train()   # re-enables training mode afterward
```

**Dropout** is a regularization technique that randomly disables a portion of the neurons on each pass, only during training: this stops the network from relying too heavily on a few specific neurons, and reduces overfitting (see [Introduction to Machine Learning](/?c=data-science&p=machine-learning-scikit-learn)).

> **Pitfall:** forgetting `model.eval()` before a prediction outside of training. Dropout would stay active, randomly disabling neurons: the same input would then produce slightly different outputs on every call, a source of inconsistency that's hard to diagnose if the cause is unknown.
>
> **Best practice:** explicitly switch to `eval()` before any prediction outside training, and wrap that computation in `torch.no_grad()` to avoid tracking gradients that have become useless, which saves memory and compute time.

See also [Architectures: CNNs, RNNs, and Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers): PyTorch provides ready-made layers for each (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), built on top of the same basic building blocks seen here.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | PyTorch provides the tensor (vectorized computation, GPU, automatic gradient via `autograd`), `nn.Module` for defining a network, and a standard training loop (predict, measure loss, backpropagate, adjust). Evaluation mode disables training-specific behaviors (dropout). |
| **Tools you can use** | `torch.tensor`, `nn.Module`, `nn.Linear`, `optim.SGD` (and variants), `model.eval()` / `torch.no_grad()`. |
| **Pitfalls to avoid** | Mixing tensors on different devices. Forgetting `super().__init__()` in an `nn.Module` class. Forgetting `zero_grad()` before `.backward()`. Forgetting `eval()` before a prediction outside training. |
| **Best practices** | Systematically move model and data to the same device. Always call `zero_grad()` on every iteration. Explicitly switch to `eval()` + `no_grad()` for any prediction outside training. |
