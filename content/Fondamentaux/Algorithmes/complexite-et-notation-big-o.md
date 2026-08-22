---
order: 1
---

# La complexité et la notation Big-O

Deux algorithmes peuvent résoudre exactement le même problème avec des performances radicalement différentes selon la quantité de données traitée. La **complexité algorithmique** mesure comment le temps d'exécution (ou la mémoire utilisée) d'un algorithme **augmente** quand la taille de ses données d'entrée augmente, indépendamment de la machine sur laquelle il tourne ou du langage utilisé pour l'écrire.

## Pourquoi pas simplement mesurer le temps en secondes ?

Chronométrer un algorithme donne un résultat qui dépend du processeur, de la charge de la machine au moment du test, du langage utilisé... Ce chiffre ne permet donc pas de comparer deux algorithmes de façon fiable, ni de prédire ce qui se passera avec 10 fois plus de données. La complexité répond à une question différente et plus utile : "si je multiplie la taille des données par 10, le temps d'exécution est-il multiplié par 10 ? Par 100 ? Reste-t-il identique ?"

## La notation Big-O : décrire une tendance, pas un chiffre précis

La **notation Big-O** (écrite `O(...)`) décrit comment le coût d'un algorithme évolue en fonction de la taille `n` de ses données d'entrée, dans le pire des cas, une fois les détails constants ignorés (un facteur `2×` ou une opération fixe supplémentaire ne change pas la catégorie).

```c
void afficherUnePremiereFois(int tableau[], int taille)
{
    printf("%d\n", tableau[0]); // toujours 1 seule opération, quelle que soit "taille"
}
```

```c
void afficherTout(int tableau[], int taille)
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", tableau[i]); // 1 opération par élément -> "taille" opérations au total
    }
}
```

Le premier exemple est en **O(1)** (temps constant : toujours une seule opération). Le second est en **O(n)** (temps linéaire : le nombre d'opérations grandit exactement comme `n`, le nombre d'éléments).

## Les classes de complexité les plus courantes

| Notation | Nom | Exemple d'opération | Pour n = 1 000 000 |
|---|---|---|---|
| `O(1)` | Constante | Accéder à `tableau[i]` par index | 1 opération |
| `O(log n)` | Logarithmique | Recherche dans un [arbre binaire de recherche](/?c=langages-de-programmation&s=c&p=arbres-binaires) équilibré | ~20 opérations |
| `O(n)` | Linéaire | Parcourir tous les éléments une fois | 1 000 000 opérations |
| `O(n log n)` | Quasi-linéaire | Un [tri par fusion](/?c=algorithmes&p=tri-par-comparaison) | ~20 000 000 opérations |
| `O(n²)` | Quadratique | Comparer chaque élément à tous les autres (double boucle imbriquée) | 1 000 000 000 000 opérations |
| `O(2ⁿ)` | Exponentielle | Tester toutes les combinaisons possibles d'un ensemble | Astronomique, déjà pour n = 40 |

```text
Temps
  ^                                         O(2^n)
  |                                    ,
  |                               ,   O(n^2)
  |                          ,·''
  |                    ,·''       O(n log n)
  |              ,·''''
  |        ,·'''            O(n)
  |   ,·''''
  |,·'  ________________ O(log n) / O(1)
  +----------------------------------------> n (taille des données)
```

> **Note :** Big-O décrit le **pire des cas** par défaut (ex : chercher un élément absent d'un tableau non trié force à tout parcourir). On distingue parfois le meilleur cas (*best case*), le cas moyen (*average case*) et le pire cas (*worst case*), mais Big-O seul, sans précision, désigne toujours le pire cas.

## Complexité en temps vs complexité en mémoire

La même notation s'applique à la **mémoire** utilisée par un algorithme, pas seulement à sa durée d'exécution : un algorithme peut être rapide (`O(n)` en temps) mais coûteux en mémoire (`O(n)` d'espace supplémentaire alloué), ou inversement. Les deux doivent être évaluées séparément : un compromis fréquent en algorithmique consiste à échanger de la mémoire supplémentaire contre un temps d'exécution plus court, ou l'inverse.

> **Piège :** ignorer un `O(n²)` caché dans une boucle qui appelle une fonction elle-même en `O(n)` (ex : chercher un élément par balayage à l'intérieur d'une boucle qui parcourt déjà tous les éléments) : le coût réel n'est pas la somme des deux complexités, mais leur produit.
>
> **Bonne pratique :** avant d'optimiser un algorithme au niveau matériel (voir [Performance](/?c=performance)), vérifier d'abord sa complexité : un `O(n²)` remplacé par un `O(n log n)` gagne souvent bien plus qu'un ajustement bas niveau sur un algorithme dont la complexité reste mauvaise.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La notation Big-O décrit comment le coût d'un algorithme évolue avec la taille de ses données, dans le pire des cas, indépendamment de la machine utilisée. |
| **Outils utilisables** | Le tableau des classes de complexité (`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(2ⁿ)`) pour classer rapidement un algorithme. |
| **Pièges à éviter** | Confondre la somme et le produit des complexités d'opérations imbriquées ; ne mesurer qu'en secondes sans tenir compte de la tendance à grande échelle. |
| **Bonnes pratiques** | Évaluer la complexité en temps ET en mémoire séparément ; corriger une mauvaise complexité avant d'optimiser au niveau matériel. |
