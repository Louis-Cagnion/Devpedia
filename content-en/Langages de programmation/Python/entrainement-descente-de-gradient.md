---
order: 19
---

# Model Training and Gradient Descent

A neural network (see the dedicated chapter) starts with **random** weights—so its initial predictions make no sense. **Training** is the process that gradually adjusts these weights so that the predictions come closer to the correct answers, based on examples.

## The loss function

A **loss function** numerically measures how far the model's predictions are from the correct answers—the lower the loss, the better the model performs on those specific examples.

```python
# Mean Square Error (MSE): commonly used for regression tasks (predicting a number)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # small loss -> close predictions
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # large loss -> far-out predictions
```

For a classification task, **cross-entropy** is more commonly used, as it heavily penalizes a confident but incorrect prediction.

## Gradient Descent: Finding the Minimum of the Loss Function

Imagine the loss function as a **terrain**: each point on this terrain corresponds to a possible set of weights, and its elevation corresponds to the loss obtained with those weights. Training the model is like **descending this terrain** to its lowest point—the weights that minimize the loss.

```
Perte
  |     .
  |    / \
  |   /   \        <- point de départ (poids aléatoires)
  |  /     \  .
  | /       \/ \
  |/           \___     <- minimum recherché
  +------------------ Valeur du poids
```

At each step, the algorithm calculates the **gradient** of the loss with respect to each weight (in which direction, and by how much, the loss changes if that weight is slightly increased), and then adjusts the weight in the direction that **minimizes** the loss:

```python
nouveau_poids = ancien_poids - taux_apprentissage * gradient
```

## The learning rate

The **learning rate** controls the size of each descent step:

| Learning Rate | Effect |
|---|---|
| Too high | The model "jumps" above the minimum; the loss fluctuates or even diverges (increases instead of decreasing) |
| Too low | The descent is very slow; training may take an unreasonable amount of time, or get stuck at an unsatisfactory local minimum |
| Well-balanced | Smooth and reasonably fast descent to a good low |

It is one of the most critical parameters (and the ones most often adjusted manually) in a neural network training process.

## Backpropagation: Calculating the Gradient Efficiently

For a multi-layer network, calculating the effect of **each** weight on the final loss seems computationally expensive—a weight in the first layer influences the output through a long chain of intermediate calculations. **Backpropagation** uses the chain rule to efficiently compute **all** these gradients by propagating the error from the output back to the input, layer by layer:

```
Sens du calcul normal (forward) :  Entrée -> Couche 1 -> Couche 2 -> Sortie -> Perte
Sens de la rétropropagation :      Entrée <- Couche 1 <- Couche 2 <- Sortie <- Perte
```

> **Note:** You don’t need a deep mathematical understanding to use a framework like PyTorch (see the dedicated chapter)—`autograd` performs this calculation automatically. Understanding the **principle**—backpropagating the error layer by layer using the chain rule—is sufficient to reason why certain training issues arise (e.g., the “vanishing gradient” problem; see the chapter on CNN/RNN/Transformer architectures).

## Epochs, Batches, and Stochastic Gradient Descent

```python
for epoque in range(nombre_epoques):        # one "period" = a complete run through ALL the data
    for lot in donnees_par_lots(data, taille_lot=32):  # A "batch" = a small subset
        predictions = model.forward(lot)
        perte = calculer_perte(predictions, vraies_valeurs)
        gradients = retropropager(perte)
        ajuster_poids(gradients, taux_apprentissage)
```

Rather than recalculating the gradient across the **entire** dataset at each step (which is computationally expensive, especially with millions of examples), we generally use small batches (*mini-batches*)—hence the name **stochastic gradient descent** (SGD): each weight adjustment is based on a sample, not on the entire dataset, which introduces a little noise but significantly speeds up each step.

See also the chapter on PyTorch, which fully automates this training loop (`loss.backward()`, `optimizer.step()`).
