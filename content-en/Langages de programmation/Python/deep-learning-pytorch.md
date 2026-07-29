---
order: 20
---

# Deep Learning with PyTorch

**PyTorch** is one of the two most widely used deep learning frameworks (along with TensorFlow). It provides a **tensor** (similar to the NumPy`ndarray`—see the dedicated chapter—but with GPU support and automatic differentiation) and automates all the mechanics described in the chapter on gradient descent.

## The tensor: a "`ndarray`" that can compute its own gradient

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # vectorized operations, such as those in NumPy
```

A PyTorch tensor can reside on the CPU or on a **GPU** (`x.to("cuda")`), which executes the same vectorized operations in a highly parallel manner—this is what makes it feasible to train networks with millions or even billions of parameters.

## `autograd` : automatic differentiation

```python
x = torch.tensor(3.0, requires_grad=True)   # "Keep track of the operations on x so you can differentiate later"

y = x ** 2 + 2 * x

y.backward()    # automatically calculates dy/dx (backpropagation; see the relevant chapter)

print(x.grad)   # 8.0 -> since dy/dx = 2x + 2, evaluated at x = 3 -> 2 × 3 + 2 = 8
```

`requires_grad=True` tells PyTorch to keep track of each operation applied to this tensor; `.backward()` then automatically traces this chain of operations to compute the gradient—exactly the mechanism described conceptually in the chapter on gradient descent, but fully automated.

## Define a network using `nn.Module`

```python
import torch.nn as nn

class ReseauSimple(nn.Module):
    def __init__(self):
        super().__init__()
        self.couche1 = nn.Linear(10, 32)   # Fully connected layer: 10 inputs -> 32 outputs
        self.activation = nn.ReLU()
        self.couche2 = nn.Linear(32, 1)     # 32 inputs -> 1 output

    def forward(self, x):
        x = self.couche1(x)
        x = self.activation(x)
        x = self.couche2(x)
        return x

modele = ReseauSimple()
```

`nn.Linear(entrees, sorties)` automatically creates the corresponding weights and biases (see the chapter on neural networks); `forward()` describes the path of the data through the layers, exactly as the "forward pass" is detailed manually in that same chapter.

## The Typical Training Loop

```python
import torch.optim as optim

fonction_perte = nn.MSELoss()                             # mean square error (see the dedicated chapter)
optimiseur = optim.SGD(modele.parameters(), lr=0.01)        # stochastic gradient descent

for epoque in range(100):
    predictions = modele(X_entrainement)                    # is equivalent to model.forward(X_training)
    perte = fonction_perte(predictions, y_entrainement)

    optimiseur.zero_grad()   # resets the gradients (otherwise they accumulate from one iteration to the next)
    perte.backward()          # calculates the gradients (automatic backpropagation)
    optimiseur.step()          # adjusts the weights based on the calculated gradients

    if epoque % 10 == 0:
        print(f"Époque {epoque} : perte = {perte.item():.4f}")
```

This loop is the nearly universal structure of any PyTorch training process: predict, measure the error, backpropagate, adjust—repeated for as many epochs as necessary until the loss decreases sufficiently (see the chapter on gradient descent for what each step actually means).

> **Note:** `optimiseur.zero_grad()` is an easy-to-forget but essential step—by default, PyTorch **accumulates** gradients with each `.backward()` rather than overwriting them, a design choice that is useful for certain advanced cases but would skew standard training if the gradients were never reset between batches.

## Assessment Mode vs. Training Mode

```python
modele.eval()    # disables specific training behaviors (e.g., dropout)
with torch.no_grad():   # Turn off gradient tracking: faster, unnecessary outside of training
    predictions = modele(X_test)

modele.train()   # Reactivates training mode for the rest of the session
```

> **Note:** **Dropout** is a regularization technique that randomly deactivates a portion of the neurons at each iteration, but only during training—this prevents the network from becoming overly dependent on a few specific neurons and reduces overfitting (see the chapter on scikit-learn). It is disabled in `modele.eval()` mode: in this case, we want a stable prediction that uses all the neurons.

See also the chapter on CNN/RNN/Transformer architectures: PyTorch provides ready-to-use layers for each (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), built on top of the same basic building blocks discussed here.
