---
title: Deep learning avec PyTorch
---

**PyTorch** est l'un des deux frameworks de deep learning les plus utilisés (avec TensorFlow). Il fournit le **tenseur** (proche du `ndarray` NumPy, cf. chapitre dédié, mais avec support GPU et différenciation automatique), et automatise toute la mécanique du chapitre sur la descente de gradient.

## Le tenseur : un `ndarray` qui peut calculer son propre gradient

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # opérations vectorisées, comme avec NumPy
```

Un tenseur PyTorch peut vivre sur le CPU ou sur un **GPU** (`x.to("cuda")`), qui exécute les mêmes opérations vectorisées massivement en parallèle — c'est ce qui rend praticable l'entraînement de réseaux comportant des millions, voire des milliards de paramètres.

## `autograd` : la différenciation automatique

```python
x = torch.tensor(3.0, requires_grad=True)   # "suis les opérations sur x pour pouvoir dériver plus tard"

y = x ** 2 + 2 * x

y.backward()    # calcule dy/dx automatiquement (rétropropagation, cf. chapitre dédié)

print(x.grad)   # 8.0 -> car dy/dx = 2x + 2, évalué en x=3 -> 2*3 + 2 = 8
```

`requires_grad=True` indique à PyTorch de mémoriser chaque opération appliquée à ce tenseur ; `.backward()` remonte alors automatiquement cette chaîne d'opérations pour calculer le gradient — exactement le mécanisme décrit conceptuellement au chapitre sur la descente de gradient, mais entièrement automatisé.

## Définir un réseau avec `nn.Module`

```python
import torch.nn as nn

class ReseauSimple(nn.Module):
    def __init__(self):
        super().__init__()
        self.couche1 = nn.Linear(10, 32)   # couche entièrement connectée : 10 entrées -> 32 sorties
        self.activation = nn.ReLU()
        self.couche2 = nn.Linear(32, 1)     # 32 entrées -> 1 sortie

    def forward(self, x):
        x = self.couche1(x)
        x = self.activation(x)
        x = self.couche2(x)
        return x

modele = ReseauSimple()
```

`nn.Linear(entrees, sorties)` crée automatiquement les poids et biais correspondants (cf. chapitre sur les réseaux de neurones) ; `forward()` décrit le trajet des données à travers les couches, exactement comme le "passage en avant" détaillé manuellement dans ce même chapitre.

## La boucle d'entraînement type

```python
import torch.optim as optim

fonction_perte = nn.MSELoss()                             # erreur quadratique moyenne (cf. chapitre dédié)
optimiseur = optim.SGD(modele.parameters(), lr=0.01)        # descente de gradient stochastique

for epoque in range(100):
    predictions = modele(X_entrainement)                    # équivaut à modele.forward(X_entrainement)
    perte = fonction_perte(predictions, y_entrainement)

    optimiseur.zero_grad()   # réinitialise les gradients (sinon ils s'additionnent d'une itération à l'autre)
    perte.backward()          # calcule les gradients (rétropropagation automatique)
    optimiseur.step()          # ajuste les poids selon les gradients calculés

    if epoque % 10 == 0:
        print(f"Époque {epoque} : perte = {perte.item():.4f}")
```

Cette boucle est la structure quasi universelle de tout entraînement PyTorch : prédire, mesurer l'erreur, rétropropager, ajuster — répété autant d'époques que nécessaire pour que la perte diminue suffisamment (cf. chapitre sur la descente de gradient pour ce que chaque étape signifie réellement).

> **Note :** `optimiseur.zero_grad()` est une étape facile à oublier mais essentielle — PyTorch **accumule** les gradients par défaut à chaque `.backward()` plutôt que de les remplacer, une décision de conception utile pour certains cas avancés, mais qui fausserait l'entraînement standard si les gradients n'étaient jamais réinitialisés entre deux lots.

## Mode évaluation vs entraînement

```python
modele.eval()    # désactive des comportements spécifiques à l'entraînement (ex. dropout)
with torch.no_grad():   # désactive le suivi des gradients : plus rapide, inutile hors entraînement
    predictions = modele(X_test)

modele.train()   # réactive le mode entraînement pour la suite
```

> **Note :** le **dropout** est une technique de régularisation qui désactive aléatoirement une partie des neurones à chaque passage, uniquement pendant l'entraînement — cela empêche le réseau de trop dépendre de quelques neurones précis, et réduit le surapprentissage (cf. chapitre sur scikit-learn). Il est désactivé en mode évaluation (`modele.eval()`) : on veut alors une prédiction stable, utilisant tous les neurones.

Voir aussi le chapitre sur les architectures CNN/RNN/Transformer : PyTorch fournit des couches prêtes à l'emploi pour chacune (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), au-dessus des mêmes briques de base vues ici.
