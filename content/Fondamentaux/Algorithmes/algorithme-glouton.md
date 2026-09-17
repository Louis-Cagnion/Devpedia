---
order: 4
---

# L'algorithme glouton (Greedy algorithm)

Un **algorithme glouton** (*greedy algorithm*) résout un problème étape par étape en choisissant, à chaque étape, l'option localement la meilleure, sans jamais revenir en arrière ni garantir un résultat globalement optimal.

## Exemple : le rendu de monnaie

Rendre 67 centimes avec le moins de pièces possible, en disposant de pièces de 50, 20, 10, 5, 2 et 1 centime : à chaque étape, on prend la plus grande pièce qui ne dépasse pas la somme restante.

```text
Reste à rendre : 67
  -> 50 (reste 17)
  -> 10 (reste 7)
  -> 5  (reste 2)
  -> 2  (reste 0)
Résultat : 4 pièces (50 + 10 + 5 + 2)
```

Avec ce système de pièces (1, 2, 5, 10, 20, 50), ce choix glouton donne toujours le nombre minimal de pièces. Ce n'est pas garanti avec n'importe quel système : voir le piège ci-dessous.

## Un choix glouton n'est pas toujours optimal

> **Piège :** croire qu'un algorithme glouton donne toujours la meilleure solution possible. Avec des pièces de 1, 3 et 4 centimes, rendre 6 centimes de façon gloutonne prend une pièce de 4 puis deux de 1 (3 pièces), alors que deux pièces de 3 suffisent (2 pièces) : le choix localement optimal à la première étape (prendre la plus grande pièce) mène ici à un résultat globalement moins bon.
>
> **Bonne pratique :** un algorithme glouton se prouve correct (ou se vérifie empiriquement sur le système de pièces réellement utilisé) avant d'être adopté ; en cas de doute, la **programmation dynamique** (qui explore plusieurs choix à chaque étape et garde le meilleur a posteriori, hors du périmètre de ce chapitre) garantit un résultat optimal là où le glouton ne le garantit pas.

## Autres exemples classiques

| Problème | Choix glouton |
|---|---|
| Rendu de monnaie | Toujours prendre la plus grande pièce possible |
| Algorithme de Dijkstra (plus court chemin) | Toujours étendre vers le sommet non visité le plus proche |
| Codage de Huffman (compression) | Toujours regrouper les deux symboles les moins fréquents |

Un algorithme glouton est en général rapide et simple à implémenter (une seule passe, aucun retour en arrière) ; à opposer à un algorithme qui explore plusieurs possibilités avant de choisir (programmation dynamique, `backtracking`), plus coûteux mais qui garantit l'optimalité dans des cas où le glouton échoue.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un algorithme glouton choisit, à chaque étape, l'option localement la meilleure, sans retour en arrière ni garantie de résultat globalement optimal. |
| **Outils utilisables** | Le rendu de monnaie, Dijkstra, Huffman comme exemples classiques d'algorithmes gloutons. |
| **Pièges à éviter** | Supposer qu'un choix glouton est toujours optimal : ça dépend entièrement du problème (voir le contre-exemple avec des pièces de 1/3/4). |
| **Bonnes pratiques** | Vérifier (ou prouver) qu'un algorithme glouton est correct sur le problème réel avant de l'adopter ; sinon, préférer la programmation dynamique. |
