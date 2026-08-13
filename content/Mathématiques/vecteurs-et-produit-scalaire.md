---
order: 2
---

# Vecteurs et produit scalaire

Un nombre seul suffit pour représenter une information isolée (voir [la variable](/?c=bases-de-l-informatique&p=la-variable)). Mais souvent, plusieurs nombres décrivent ensemble une seule chose : une position, les caractéristiques d'un client. C'est ce que représente un **vecteur**.

Un vecteur est une liste ordonnée de nombres, traitée comme une seule entité.

```text
Position d'un point sur un plan :  [3, 5]
                                     |  |
                                     |  deuxième coordonnée (hauteur, y)
                                     première coordonnée (largeur, x)
```

```vecteurs
vecteurs: (3, 5)
label: Le vecteur [3, 5]
```

> **Analogie :** une liste de courses où l'ordre a un sens précis (2 kg de pommes, puis 3 baguettes) : inverser l'ordre changerait ce que chaque nombre représente, pas seulement leur position dans la liste.

> **Piège :** croire que l'ordre des composantes est interchangeable. `[3, 5]` et `[5, 3]` ne décrivent pas le même point : la première composante a toujours le même rôle (ici, la position horizontale), quelle que soit sa valeur.
>
> **Bonne pratique :** documenter ce que représente chaque position d'un vecteur dès sa création (un commentaire, un nom de variable explicite) : rien dans les nombres eux-mêmes ne rappelle ce qu'ils signifient.

## Un vecteur peut avoir bien plus de deux nombres

Rien ne limite un vecteur à deux composantes :

```text
Un client :  [age, salaire, anciennete] = [34, 42000, 5]
```

Chaque composante supplémentaire ajoute une **dimension**. Un vecteur à 3 composantes se représente encore dans l'espace (comme un point en 3D), mais un vecteur à 100 ou 1000 composantes (le cas courant en intelligence artificielle pour représenter un mot ou une image) ne se dessine plus, seul le calcul continue de fonctionner exactement pareil.

## Additionner deux vecteurs

```text
[1, 2] + [3, 4] = [1+3, 2+4] = [4, 6]
```

```vecteurs
vecteurs: (1, 2), (3, 4), (4, 6)
label: [1, 2] + [3, 4] = [4, 6]
```

On additionne les composantes une à une, à la même position.

> **Piège :** additionner deux vecteurs de tailles différentes n'a pas de sens (`[1, 2] + [1, 2, 3]` n'est pas défini : quelle composante irait avec quoi ?). Un programme qui tente l'opération lève en général une erreur explicite (ex. *"shapes mismatch"* avec [NumPy](/?c=data-science&p=numpy)) plutôt que de deviner.
>
> **Bonne pratique :** vérifier que deux vecteurs ont la même dimension avant de les combiner, plutôt que de découvrir l'incompatibilité au moment de l'exécution.

## Le produit scalaire : réduire deux vecteurs à un seul nombre

Le **produit scalaire** (*dot product*) de deux vecteurs de même dimension multiplie leurs composantes une à une, puis additionne tous ces produits :

```text
[1, 2, 3] . [4, 5, 6] = (1×4) + (2×5) + (3×6) = 4 + 10 + 18 = 32
```

Contrairement à l'addition, le résultat n'est pas un vecteur mais un **nombre unique** : d'où le nom "scalaire".

Ce nombre mesure à quel point deux vecteurs pointent dans la même direction :

| Résultat du produit scalaire | Interprétation |
|---|---|
| Grand et positif | Les deux vecteurs pointent globalement dans la même direction |
| Proche de zéro | Les deux vecteurs n'ont globalement aucune relation directionnelle |
| Négatif | Les deux vecteurs pointent globalement dans des directions opposées |

> **Bonne pratique :** cette même opération (multiplier terme à terme, puis additionner) revient dans de nombreux calculs par la suite, notamment pour combiner plusieurs entrées en une seule valeur en donnant à chacune un **poids**, un nombre qui reflète son importance relative dans le résultat final (une entrée au poids élevé pèse plus dans la somme qu'une entrée au poids faible). On dit alors que le résultat est une somme **pondérée**. Reconnaître cette opération sous cette forme évite de la redécouvrir à chaque fois sous un nom différent.

## La norme d'un vecteur : sa longueur

Un vecteur à 2 composantes comme `[3, 4]` peut se lire comme un point sur un plan (voir le tout premier exemple de ce chapitre), atteint en partant d'un point de départ commun à tous les vecteurs : l'**origine**, le point `[0, 0]`. La **norme** d'un vecteur est la distance entre l'origine et ce point : le chemin le plus direct, en ligne droite, pas la somme des deux distances parcourues en équerre (`3 + 4 = 7` serait faux) :

```text
        (3,4)
          /|
         / |
    5   /  | 4   <- deuxième composante du vecteur : distance verticale depuis l'origine
       /   |
      /____|
    (0,0)  3     <- première composante du vecteur : distance horizontale depuis l'origine
   origine
```

Le trajet direct (la diagonale, longueur 5) est toujours plus court que le trajet en équerre (3 puis 4, soit 7) : c'est précisément ce que calcule la formule de la norme, qui vient du théorème de Pythagore : la racine carrée de la somme des carrés de chaque composante.

```text
norme([3, 4]) = racine(3² + 4²) = racine(9 + 16) = racine(25) = 5
```

Diviser chaque composante d'un vecteur par sa propre norme le **normalise** : sa direction reste la même, mais sa longueur devient exactement 1.

```text
[3, 4] a pour norme 5 (calculé plus haut)

Vecteur normalisé = [3/5, 4/5] = [0.6, 0.8]

Vérification, en recalculant la norme de ce nouveau vecteur :
norme([0.6, 0.8]) = racine(0.6² + 0.8²) = racine(0.36 + 0.64) = racine(1) = 1
```

Ce résultat n'est pas une coïncidence propre à cet exemple : diviser chaque composante par la norme divise mécaniquement la norme elle-même par cette même valeur : une norme `N` divisée par `N` donne toujours `1`, quel que soit le vecteur de départ. Utile pour comparer deux vecteurs sur leur seule direction, sans que leur longueur respective ne fausse la comparaison.

> **Piège :** normaliser un vecteur nul (`[0, 0]`) revient à diviser par une norme de 0 : une opération non définie, pas seulement une erreur d'arrondi.
>
> **Bonne pratique :** vérifier qu'un vecteur n'est pas nul avant de le normaliser, plutôt que de laisser le programme échouer sur une division par zéro.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un vecteur est une liste ordonnée de nombres traitée comme une seule entité. Le produit scalaire réduit deux vecteurs de même dimension à un seul nombre, qui mesure à quel point ils pointent dans la même direction. La norme est la longueur d'un vecteur. |
| **Outils utilisables** | Aucun outil spécifique pour le calcul à la main ; en pratique, une bibliothèque comme [NumPy](/?c=data-science&p=numpy) effectue ces opérations directement sur des vecteurs entiers, sans boucle explicite. |
| **Pièges à éviter** | Additionner ou combiner deux vecteurs de dimensions différentes. Normaliser un vecteur nul (division par une norme de 0). |
| **Bonnes pratiques** | Vérifier que deux vecteurs ont la même dimension avant toute opération entre eux. Documenter ce que représente chaque composante d'un vecteur dès sa création. |
