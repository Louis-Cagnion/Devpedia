---
order: 2
---

# Le tri par comparaison

Trier une liste de valeurs est l'un des problèmes les plus étudiés en algorithmique : de nombreuses stratégies existent, avec des [complexités](/?c=algorithmes&p=complexite-et-notation-big-o) très différentes. Un **tri par comparaison** ne dispose que d'une seule opération de base pour décider de l'ordre : comparer deux éléments entre eux (`a < b ?`), sans jamais accéder directement à leur valeur numérique (contrairement à d'autres familles de tri, hors du périmètre de ce chapitre, qui exploitent la structure des valeurs elles-mêmes).

## Le tri par insertion

Le **tri par insertion** construit la partie triée du tableau élément par élément : à chaque étape, il prend l'élément suivant et l'insère à sa bonne place parmi ceux déjà triés, comme on trierait des cartes à jouer une par une dans sa main.

```c
void triInsertion(int tableau[], int taille)
{
    for (int i = 1; i < taille; i++) {
        int valeur = tableau[i];
        int j = i - 1;

        while (j >= 0 && tableau[j] > valeur) {
            tableau[j + 1] = tableau[j]; // décale l'élément vers la droite
            j--;
        }
        tableau[j + 1] = valeur; // insère à la bonne place
    }
}
```

Ce tri est en **O(n²)** dans le pire des cas (tableau trié à l'envers : chaque insertion décale tout ce qui précède), mais seulement **O(n)** si le tableau est déjà presque trié : un avantage qu'exploitent des algorithmes hybrides plus avancés.

## Le tri fusion (*merge sort*)

Le **tri fusion** applique le principe *diviser pour régner* : il coupe le tableau en deux moitiés, trie récursivement chaque moitié, puis **fusionne** les deux moitiés triées en une seule liste triée.

```text
[8, 3, 5, 1, 9, 2]
        |
   diviser en deux
        |
  [8, 3, 5]      [1, 9, 2]
    |                |
  trier            trier
    |                |
  [3, 5, 8]      [1, 2, 9]
        \            /
         \          /
          fusionner
              |
      [1, 2, 3, 5, 8, 9]
```

La fusion de deux listes déjà triées est en **O(n)** : il suffit de comparer les deux premiers éléments restants de chaque liste et de prendre le plus petit, en avançant progressivement. Combiné au découpage en deux (`log n` niveaux de division), le tri fusion complet coûte **O(n log n)**, quel que soit l'état initial du tableau : contrairement au tri par insertion, son pire cas n'est pas dégradé.

> **Note :** ce compromis entre les deux algorithmes (insertion rapide sur des données presque triées, fusion stable en O(n log n) dans tous les cas) est directement exploité par des tris hybrides comme le **tri fusion-insertion** (*merge-insertion sort*), qui insère de petits groupes déjà triés par fusion à l'aide d'une recherche par insertion optimisée.

## Comparer les algorithmes de tri

| Algorithme | Pire cas | Cas moyen | Mémoire supplémentaire | Stable ? |
|---|---|---|---|---|
| Tri à bulles | O(n²) | O(n²) | O(1) | Oui |
| Tri par sélection | O(n²) | O(n²) | O(1) | Non |
| Tri par insertion | O(n²) | O(n²) | O(1) | Oui |
| Tri fusion | O(n log n) | O(n log n) | O(n) | Oui |
| Tri rapide (*quicksort*) | O(n²) | O(n log n) | O(log n) | Non |

Un tri est dit **stable** quand deux éléments considérés égaux par la comparaison conservent leur ordre relatif d'origine après le tri (important si on trie, par exemple, une liste déjà triée par nom, cette fois par âge : deux personnes du même âge doivent rester dans leur ordre alphabétique).

> **Piège :** croire qu'un tri par comparaison peut descendre sous **O(n log n)** dans le cas général : c'est une limite théorique démontrée (impossible de faire mieux en ne comparant que des paires d'éléments), pas une simple question d'optimisation d'implémentation.
>
> **Bonne pratique :** utiliser l'implémentation de tri déjà fournie par le langage/la bibliothèque standard (généralement un tri hybride déjà optimisé) plutôt que de réécrire un tri à la main, sauf contrainte spécifique (mémoire limitée, contrainte sur le nombre d'opérations autorisées, structure de données particulière).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un tri par comparaison ne décide de l'ordre qu'en comparant des paires d'éléments. Le tri par insertion est simple mais en O(n²) ; le tri fusion garantit O(n log n) dans tous les cas au prix de mémoire supplémentaire. |
| **Outils utilisables** | Le tableau comparatif des algorithmes de tri (complexité, mémoire, stabilité) pour choisir le bon selon le contexte. |
| **Pièges à éviter** | Espérer descendre sous O(n log n) avec un tri par comparaison pur : c'est une limite théorique, pas un défaut d'implémentation. |
| **Bonnes pratiques** | Préférer le tri déjà fourni par le langage, et ne réimplémenter un tri à la main qu'avec une contrainte précise qui le justifie. |
