---
order: 5
---

# Les probabilités de base

Ce chapitre présente les probabilités, une notion reprise plus loin pour décrire ce qu'un modèle prédit : non pas une réponse unique et certaine, mais plusieurs réponses possibles, chacune avec sa propre chance de se produire.

## Qu'est-ce qu'une probabilité ?

Une **probabilité** mesure à quel point un événement a des chances de se produire : un nombre entre 0 (impossible) et 1 (certain).

| Valeur | Signification | Exemple |
|---|---|---|
| 0 | Impossible | Obtenir un 7 en lançant un dé à 6 faces |
| 0,5 | Autant de chances que ce soit le cas que le contraire | Obtenir face en lançant une pièce équilibrée |
| 1 | Certain | Obtenir un nombre inférieur à 10 en lançant un dé à 6 faces |

> **Analogie :** une jauge graduée de 0 à 1, comme une jauge de carburant, mais qui mesure la confiance qu'un événement se produise plutôt qu'une quantité d'essence.

On note `P(événement) = valeur`. Pour un dé à 6 faces équilibré (chaque face a autant de chances de sortir que les autres) : `P(obtenir un 3) = 1/6 ≈ 0,167`.

## Une distribution de probabilité : plusieurs résultats, une seule somme

Quand un événement a plusieurs résultats possibles, chacun reçoit sa propre probabilité : l'ensemble de ces probabilités s'appelle une **distribution de probabilité** :

```text
Dé à 6 faces équilibré :

P(1) = 0,167
P(2) = 0,167
P(3) = 0,167
P(4) = 0,167
P(5) = 0,167
P(6) = 0,167
        -----
Somme = 1,000
```

Peu importe comment les probabilités se répartissent entre les résultats possibles, leur somme vaut toujours exactement **1** : un des résultats listés se produit forcément, il n'y a rien en dehors de cette liste.

> **Piège :** une distribution calculée par un programme qui ne somme pas exactement à 1 (arrondi imprécis, résultat possible oublié dans le calcul) n'est pas une distribution de probabilité valide.
>
> **Bonne pratique :** après avoir calculé une distribution de probabilité, vérifier que la somme de ses valeurs vaut bien 1 (ou très proche, en tenant compte des arrondis) avant de l'utiliser plus loin dans un calcul.

## Une distribution n'est pas forcément équilibrée

Rien n'oblige chaque résultat à avoir la même probabilité que les autres : un dé à 6 faces équilibré est un cas particulier, pas la règle générale :

```text
Une meteo qui privilegie fortement la pluie :

P(pluie)  = 0,80
P(soleil) = 0,15
P(neige)  = 0,05
             -----
Somme      = 1,00
```

Le résultat le plus probable (ici, la pluie) n'est pas le seul possible : juste celui dont la probabilité est la plus élevée. Cette distinction sera reprise telle quelle plus loin : un modèle qui prédit "probablement X" laisse toujours ouverte la possibilité d'un résultat différent, avec une probabilité plus faible mais non nulle.

> **Piège :** confondre "le résultat le plus probable" avec "le seul résultat possible" : une probabilité de 0,80 signifie encore 20% de chances que ce soit autre chose, pas une certitude.
>
> **Bonne pratique :** raisonner sur la distribution entière plutôt que sur son seul résultat le plus probable, dès que les résultats moins probables ont des conséquences importantes s'ils se produisent quand même.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une probabilité est un nombre entre 0 (impossible) et 1 (certain). Une distribution de probabilité liste la probabilité de chaque résultat possible ; ces probabilités somment toujours à 1. Le résultat le plus probable n'est pas le seul possible. |
| **Outils utilisables** | Aucun outil spécifique : la notation `P(événement) = valeur` suffit pour raisonner sur le papier. |
| **Pièges à éviter** | Une distribution dont la somme ne vaut pas exactement 1 (erreur de calcul). Confondre "le plus probable" avec "certain". |
| **Bonnes pratiques** | Vérifier qu'une distribution calculée somme bien à 1 avant de l'utiliser. Raisonner sur la distribution entière, pas seulement sur son résultat le plus probable, quand les résultats rares ont des conséquences importantes. |
