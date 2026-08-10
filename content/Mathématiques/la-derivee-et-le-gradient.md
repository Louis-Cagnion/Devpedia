---
order: 6
---

# La dérivée et le gradient

Ce chapitre répond à une question posée par [la courbe d'une fonction](/?c=mathematiques&p=la-fonction-mathematique) : à quel point une fonction change-t-elle en un point donné, et dans quelle direction ? C'est ce que mesurent la dérivée, puis le gradient — sa généralisation à une fonction à plusieurs entrées.

## La pente : à quelle vitesse une fonction change

Pour une fonction simple comme `f(x) = 2x + 1`, la **pente** entre deux points mesure de combien `f` change, rapporté à un changement de `x` :

```text
f(1) = 3
f(3) = 7

pente entre x=1 et x=3 = (f(3) - f(1)) / (3 - 1) = (7 - 3) / 2 = 2
```

Cette fonction est une droite : sa pente vaut 2 partout, quels que soient les deux points choisis. Ce n'est plus vrai pour une fonction dont la courbe n'est pas une droite, comme on va le voir.

## La dérivée : la pente en un seul point précis

Pour une courbe (par exemple `f(x) = x²`), la pente n'est plus constante — elle dépend du point observé. Pour connaître la pente **exactement en un point**, on calcule la pente entre ce point et un autre de plus en plus proche :

```text
f(x) = x²

Autour de x = 2 :
f(2)      = 4
f(2,1)    = 4,41      -> pente entre 2 et 2,1   : (4,41 - 4) / 0,1     = 4,1
f(2,01)   = 4,0401    -> pente entre 2 et 2,01  : (4,0401 - 4) / 0,01  = 4,01
f(2,001)  = 4,004001  -> pente entre 2 et 2,001 : (4,004001 - 4) / 0,001 = 4,001
```

Plus l'écart se réduit, plus la pente calculée se rapproche de **4** — c'est la **dérivée** de `f` au point `x = 2`, notée `f'(2) = 4`. Pour `f(x) = x²`, cette dérivée vaut `2x` en tout point (un résultat connu, qu'on peut vérifier ici : `2 × 2 = 4`).

## Le signe de la dérivée indique la direction

| Signe de `f'(x)` | Comportement de la fonction en ce point |
|---|---|
| Positif | La fonction augmente |
| Négatif | La fonction diminue |
| Zéro | La fonction est momentanément plate (un sommet, un creux, ou un palier) |

```text
f(x)
  |  \                                /
  |   \                              /
  |    \          creux            /
  |     \_____   (derivee = 0)   _/
  |           \_________________/
  |     f' < 0     f'=0      f' > 0
  +------------------------------------ x
```

## Descendre une courbe : avancer dans le sens opposé à la dérivée

Si l'objectif est de trouver le point le plus bas d'une courbe (son minimum), et que seule la pente au point actuel est connue, avancer dans la direction **opposée** au signe de cette pente rapproche du minimum :

```text
f(x) = x²   (minimum en x = 0)

Point de depart : x = 3         f'(x) = 2x = 6
nouveau x = x - 0,1 × f'(x) = 3 - 0,1 × 6 = 2,4

x = 2,4     f'(x) = 4,8    nouveau x = 2,4 - 0,1 × 4,8   = 1,92
x = 1,92    f'(x) = 3,84   nouveau x = 1,92 - 0,1 × 3,84  = 1,536
...                        -> se rapproche progressivement de x = 0
```

Le `0,1` contrôle la taille de chaque pas — un pas trop grand peut faire dépasser le minimum, un pas trop petit rend la descente très lente. Cette méthode (avancer à l'opposé de la dérivée, pas après pas) s'appelle la **descente de gradient**.

> **Piège :** une courbe peut avoir plusieurs creux (plusieurs minima locaux). Cette méthode ne garantit de trouver que le creux le plus proche du point de départ, pas nécessairement le plus bas de tous.
>
> **Bonne pratique :** garder à l'esprit qu'un minimum trouvé par cette méthode est local, pas forcément le meilleur possible — essayer plusieurs points de départ différents est une parade courante pour limiter ce risque.

## Le gradient : la dérivée d'une fonction à plusieurs entrées

Pour une fonction à plusieurs entrées (voir [la fonction mathématique](/?c=mathematiques&p=la-fonction-mathematique)), le **gradient** généralise la dérivée : c'est un [vecteur](/?c=mathematiques&p=vecteurs-et-produit-scalaire) qui contient, pour chaque entrée, sa propre **dérivée partielle** — à quel point la fonction change si on bouge uniquement cette entrée-là, toutes les autres restant fixes.

```text
f(x, y) = x² + y²

derivee partielle par rapport a x (y traite comme une constante) : 2x
derivee partielle par rapport a y (x traite comme une constante) : 2y

gradient de f au point (3, 4) = [2×3, 2×4] = [6, 8]
```

Le gradient pointe dans la direction où la fonction **augmente** le plus vite. Avancer dans la direction opposée (soustraire le gradient, composante par composante — voir [l'addition de vecteurs](/?c=mathematiques&p=vecteurs-et-produit-scalaire)) fait donc diminuer la fonction le plus rapidement possible, exactement la même logique que pour une seule entrée, appliquée à chaque composante du vecteur :

```text
nouveau_vecteur = ancien_vecteur - taux × gradient
```

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La dérivée mesure la pente d'une fonction en un point précis (son signe indique si la fonction augmente, diminue, ou est momentanément plate). Le gradient généralise la dérivée à une fonction à plusieurs entrées : un vecteur de dérivées partielles, qui pointe vers la direction de plus forte augmentation. |
| **Outils utilisables** | Aucun calcul à la main en pratique : les bibliothèques de deep learning calculent les dérivées et gradients automatiquement (différenciation automatique). |
| **Pièges à éviter** | Confondre "un minimum trouvé" et "le minimum le plus bas possible" — une courbe à plusieurs creux ne garantit que le creux le plus proche du point de départ. |
| **Bonnes pratiques** | Essayer plusieurs points de départ différents pour limiter le risque de rester bloqué sur un minimum local peu satisfaisant. |
