---
order: 4
---

# Deep learning avec PyTorch

**PyTorch** est l'un des deux frameworks de deep learning les plus utilisés (avec TensorFlow). Il fournit le **tenseur** : une structure qui stocke un [vecteur](/?c=mathematiques&p=vecteurs-et-produit-scalaire) ou une [matrice](/?c=mathematiques&p=matrices-et-produit-matriciel) de nombres (proche du `ndarray` de la bibliothèque [NumPy](/?c=data-science&p=numpy) pour qui la connaît déjà), avec deux capacités supplémentaires : s'exécuter sur [GPU](/?c=infrastructure&p=cpu-vs-gpu), et calculer automatiquement son propre gradient. PyTorch automatise ainsi toute la mécanique du chapitre sur [l'entraînement et la descente de gradient](/?c=ia&p=entrainement-descente-de-gradient).

## Le tenseur : des nombres qui peuvent calculer leur propre gradient

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # opérations vectorisées, comme le produit scalaire vu précédemment
```

Un tenseur PyTorch peut vivre sur le CPU ou sur un GPU (`x.to("cuda")`), qui exécute les mêmes opérations vectorisées massivement en parallèle (voir [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)) : c'est ce qui rend praticable l'entraînement de réseaux comportant des millions, voire des milliards de paramètres.

> **Piège :** mélanger, dans un même calcul, un tenseur resté sur le CPU et un tenseur déplacé sur le GPU (par exemple le modèle sur GPU, mais un lot de données oublié sur CPU). PyTorch refuse l'opération avec une erreur explicite plutôt que de deviner où effectuer le calcul.
>
> **Bonne pratique :** déplacer systématiquement **tous** les éléments impliqués dans un calcul (modèle et données) sur le même device avant de les utiliser ensemble, jamais seulement l'un des deux.

## `autograd` : la différenciation automatique

```python
x = torch.tensor(3.0, requires_grad=True)   # "suis les opérations sur x pour pouvoir dériver plus tard"

y = x ** 2 + 2 * x

y.backward()    # calcule dy/dx automatiquement (rétropropagation)

print(x.grad)   # 8.0 -> car dy/dx = 2x + 2, évalué en x=3 -> 2*3 + 2 = 8
```

`requires_grad=True` indique à PyTorch de mémoriser chaque opération appliquée à ce tenseur ; `.backward()` remonte alors automatiquement cette chaîne d'opérations pour calculer le gradient (voir [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)), exactement le mécanisme décrit conceptuellement dans [L'entraînement d'un modèle et la descente de gradient](/?c=ia&p=entrainement-descente-de-gradient), mais entièrement automatisé.

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

`nn.Linear(entrees, sorties)` crée automatiquement les poids et biais correspondants (voir [Les réseaux de neurones : les fondamentaux](/?c=ia&p=reseaux-de-neurones)) ; `forward()` décrit le trajet des données à travers les couches, exactement comme le "passage en avant" détaillé manuellement dans ce même chapitre.

> **Piège :** oublier `super().__init__()` au début de `__init__()`. Cette ligne initialise les mécanismes internes de `nn.Module` (dont le suivi des poids) : sans elle, le reste de la classe échoue ou se comporte de façon incohérente, souvent avec un message d'erreur peu explicite.
>
> **Bonne pratique :** toujours appeler `super().__init__()` en toute première ligne du constructeur d'une classe qui hérite de `nn.Module`, avant de définir la moindre couche.

## La boucle d'entraînement type

```python
import torch.optim as optim

fonction_perte = nn.MSELoss()                             # erreur quadratique moyenne
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

Cette boucle est la structure quasi universelle de tout entraînement PyTorch : prédire, mesurer l'erreur, rétropropager, ajuster, répété autant d'époques que nécessaire pour que la perte diminue suffisamment (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&p=entrainement-descente-de-gradient) pour ce que chaque étape signifie réellement).

> **Piège :** oublier `optimiseur.zero_grad()`. PyTorch **accumule** les gradients par défaut à chaque `.backward()` plutôt que de les remplacer, une décision de conception utile pour certains cas avancés, mais qui fausse l'entraînement standard si les gradients ne sont jamais réinitialisés entre deux lots.
>
> **Bonne pratique :** appeler systématiquement `zero_grad()` avant chaque `.backward()`, à chaque itération de la boucle d'entraînement, sans exception.

## Mode évaluation vs entraînement

```python
modele.eval()    # désactive des comportements spécifiques à l'entraînement (ex. dropout)
with torch.no_grad():   # désactive le suivi des gradients : plus rapide, inutile hors entraînement
    predictions = modele(X_test)

modele.train()   # réactive le mode entraînement pour la suite
```

Le **dropout** est une technique de régularisation qui désactive aléatoirement une partie des neurones à chaque passage, uniquement pendant l'entraînement : cela empêche le réseau de trop dépendre de quelques neurones précis, et réduit le surapprentissage (voir [Introduction au machine learning](/?c=data-science&p=machine-learning-scikit-learn)).

> **Piège :** oublier `modele.eval()` avant une prédiction en dehors de l'entraînement. Le dropout resterait actif, désactivant aléatoirement des neurones : la même entrée produirait alors des sorties légèrement différentes à chaque appel, une source d'incohérence difficile à diagnostiquer si la cause n'est pas connue.
>
> **Bonne pratique :** basculer explicitement en `eval()` avant toute prédiction hors entraînement, et envelopper ce calcul dans `torch.no_grad()` pour éviter de suivre des gradients devenus inutiles, ce qui économise mémoire et temps de calcul.

Voir aussi [Architectures : CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) : PyTorch fournit des couches prêtes à l'emploi pour chacune (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), au-dessus des mêmes briques de base vues ici.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | PyTorch fournit le tenseur (calcul vectorisé, GPU, gradient automatique via `autograd`), `nn.Module` pour définir un réseau, et une boucle d'entraînement standard (prédire, mesurer la perte, rétropropager, ajuster). Le mode évaluation désactive les comportements propres à l'entraînement (dropout). |
| **Outils utilisables** | `torch.tensor`, `nn.Module`, `nn.Linear`, `optim.SGD` (et variantes), `model.eval()` / `torch.no_grad()`. |
| **Pièges à éviter** | Mélanger des tenseurs sur des devices différents. Oublier `super().__init__()` dans une classe `nn.Module`. Oublier `zero_grad()` avant `.backward()`. Oublier `eval()` avant une prédiction hors entraînement. |
| **Bonnes pratiques** | Déplacer systématiquement modèle et données sur le même device. Toujours appeler `zero_grad()` à chaque itération. Basculer explicitement en `eval()` + `no_grad()` pour toute prédiction hors entraînement. |
