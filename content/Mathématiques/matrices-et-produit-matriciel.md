---
order: 3
---

# Les matrices et le produit matriciel

Un [vecteur](/?c=mathematiques&p=vecteurs-et-produit-scalaire) range plusieurs nombres dans une seule liste. Une **matrice** va un cran plus loin : elle range des nombres dans un **tableau à deux dimensions** (des lignes et des colonnes), exactement comme une feuille de calcul. C'est l'outil qui permet de calculer sur *plusieurs* vecteurs à la fois, d'un seul coup, plutôt qu'un par un, et c'est très concrètement ce qui fait tourner un réseau de neurones.

## Qu'est-ce qu'une matrice ?

Une matrice est un tableau de nombres organisé en lignes et en colonnes. On note ses dimensions **lignes × colonnes** :

```text
     colonne 1  colonne 2  colonne 3
ligne 1   1         2          3
ligne 2   4         5          6
```

Cette matrice a 2 lignes et 3 colonnes : on dit qu'elle est de dimension **2×3**. Un élément se repère par sa position `(ligne, colonne)` : l'élément en position (2, 3) vaut 6.

> **Analogie :** une feuille de calcul (tableur) sans les formules : juste des cellules organisées en lignes et en colonnes, chacune contenant un nombre.

> **Piège :** cette numérotation `(2, 3)` compte à partir de 1, comme en mathématiques. En NumPy (voir le chapitre [NumPy](/?c=data-science&p=numpy)) et dans la plupart des langages de programmation, l'indexation commence à 0 : ce même élément s'obtiendrait en code avec `matrice[1, 2]`, pas `matrice[2, 3]`.

Un vecteur n'est donc rien d'autre qu'un cas particulier de matrice : une seule colonne (dimension *n*×1) ou une seule ligne (1×*n*). Tout ce qui a été vu sur les [vecteurs](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (l'addition, le produit scalaire) se généralise directement aux matrices.

## Addition et multiplication par un nombre

Comme pour les vecteurs, ces deux opérations se font terme à terme, position par position :

```text
[1, 2]     [5, 6]     [1+5, 2+6]     [6,  8]
[3, 4]  +  [7, 8]  =  [3+7, 4+8]  =  [10, 12]

[1, 2]           [1×3, 2×3]        [3, 6]
[3, 4]  × 3  =    [3×3, 4×3]   =    [9, 12]
```

> **Piège :** additionner deux matrices de dimensions différentes n'a pas de sens : comme pour les vecteurs, chaque position doit avoir un correspondant exact dans l'autre matrice.
>
> **Bonne pratique :** vérifier que deux matrices ont exactement les mêmes dimensions avant de les additionner.

## Le produit matrice-vecteur : plusieurs neurones, un seul calcul

Voici l'opération qui compte vraiment. Rappel du chapitre sur [les réseaux de neurones](/?c=ia&p=reseaux-de-neurones) : un neurone calcule une somme pondérée de ses entrées, c'est-à-dire un [produit scalaire](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre le vecteur des entrées et son propre vecteur de poids. Une couche contient *plusieurs* neurones, chacun avec son propre vecteur de poids ; rangés en lignes, ces vecteurs de poids forment une matrice :

```text
Poids de 2 neurones, pour 2 entrées chacun :

W = [ 0.5  -0.3 ]   <- poids du neurone 1
    [ 0.2   0.4 ]   <- poids du neurone 2

Entrée :  x = [1.0]
              [2.0]
```

Le **produit matrice-vecteur** `W · x` calcule le produit scalaire de **chaque ligne** de `W` avec `x`, et range chaque résultat dans une nouvelle colonne :

```text
W · x = [ 0.5×1.0 + (-0.3)×2.0 ]  =  [ -0.1 ]
        [ 0.2×1.0 +   0.4×2.0 ]      [  1.0 ]
```

Comparez avec le calcul neurone par neurone du chapitre sur les réseaux de neurones : `poids_n1 · entrees = 0.5×1.0 + (-0.3)×2.0` et `poids_n2 · entrees = 0.2×1.0 + 0.4×2.0`. Ce sont exactement les deux mêmes produits scalaires, obtenus ici **en une seule opération** plutôt qu'un calcul répété par neurone. C'est tout l'intérêt : une couche de 500 neurones ne demande pas 500 produits scalaires écrits un par un, mais un seul produit matrice-vecteur, `W · x`.

> **Piège :** multiplier une matrice par un vecteur dont la taille ne correspond pas au nombre de colonnes de la matrice : `W` ci-dessus (2×2) ne peut multiplier qu'un vecteur à 2 éléments. Les bibliothèques de calcul lèvent une erreur explicite dans ce cas plutôt que de deviner.
>
> **Bonne pratique :** vérifier que le nombre de colonnes de la matrice correspond exactement à la taille du vecteur, avant toute multiplication.

## Le produit matrice-matrice : traiter plusieurs exemples à la fois (le *batch*)

Une seule entrée à la fois reste inefficace à l'échelle de l'entraînement d'un modèle. En pratique, plusieurs exemples (un **batch**, voir [L'entraînement d'un modèle](/?c=ia&p=entrainement-descente-de-gradient)) sont empilés en lignes dans une matrice `X`, et un seul produit matriciel calcule la sortie de tous les exemples à la fois :

```text
X (2 exemples, 2 entrées chacun) :   [ 1.0  2.0 ]
                                       [ 0.5  1.5 ]

W (2 neurones, transposee pour l'occasion) :   [ 0.5   0.2 ]
                                                 [-0.3   0.4 ]

X · W = [ 1.0×0.5+2.0×(-0.3)   1.0×0.2+2.0×0.4 ]   [ -0.1   1.0 ]
        [ 0.5×0.5+1.5×(-0.3)   0.5×0.2+1.5×0.4 ] = [ -0.2   0.7 ]
```

Chaque ligne du résultat correspond à un exemple, chaque colonne à un neurone : les deux sorties du premier exemple ((-0.1, 1.0)) retombent exactement sur le résultat calculé plus haut avec `W · x`, obtenu ici en même temps que celles du second exemple.

**La règle des dimensions :** multiplier une matrice (*m*×*n*) par une matrice (*n*×*p*) donne une matrice (*m*×*p*) ; le nombre de colonnes de la première doit toujours égaler le nombre de lignes de la seconde :

```text
(m × n)  ·  (n × p)  =  (m × p)
      \_______/
    doivent être égaux
```

> **Piège :** un produit matriciel n'est **pas commutatif** : `A · B` et `B · A` ne donnent en général pas le même résultat, et l'un des deux peut même ne pas être défini du tout si les dimensions ne s'y prêtent pas (contrairement à l'addition de nombres, où l'ordre n'a jamais d'importance).
>
> **Bonne pratique :** toujours vérifier l'ordre des matrices dans un produit : `A · B` et `B · A` sont deux calculs différents, jamais interchangeables par défaut.

## Comment un résultat du produit matriciel est calculé

La règle générale, dont les deux sections précédentes ne sont que des cas particuliers : l'élément à la position (ligne *i*, colonne *j*) du résultat est le [produit scalaire](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de la ligne *i* de la première matrice et de la colonne *j* de la seconde. Rien de nouveau mathématiquement : c'est la même opération que pour un vecteur, répétée une fois par case du résultat.

## Produit matriciel contre produit terme à terme : ne pas confondre

Deux opérations distinctes portent des noms proches et se confondent facilement :

| Opération | Nom | Calcul | Dimensions |
|---|---|---|---|
| `A · B` | Produit matriciel | Produit scalaire ligne × colonne (voir ci-dessus) | (*m*×*n*) · (*n*×*p*) = (*m*×*p*) |
| `A ⊙ B` | Produit terme à terme (*Hadamard*) | Chaque case de `A` multipliée par la case correspondante de `B` | `A` et `B` doivent avoir exactement les mêmes dimensions |

> **Piège :** en NumPy (voir le chapitre [NumPy](/?c=data-science&p=numpy)), `A * B` calcule le produit **terme à terme**, pas le produit matriciel : c'est `A @ B` (ou `np.dot(A, B)`) qu'il faut utiliser pour un vrai produit matriciel. Utiliser `*` par réflexe là où `@` était voulu ne provoque pas toujours une erreur (si les dimensions coïncident par coïncidence), ce qui rend ce piège particulièrement difficile à repérer.
>
> **Bonne pratique :** vérifier systématiquement lequel des deux produits une bibliothèque de calcul applique à un opérateur donné, plutôt que de supposer que `*` désigne toujours la même opération d'un langage ou d'une bibliothèque à l'autre.

## La transposée : échanger lignes et colonnes

La **transposée** d'une matrice (notée `Aᵀ`) échange ses lignes et ses colonnes :

```text
     [ 1  2  3 ]                [ 1  4 ]
A =  [ 4  5  6 ]      Aᵀ =      [ 2  5 ]
                                 [ 3  6 ]
```

Une matrice 2×3 devient une matrice 3×2. La transposée sert le plus souvent à réorienter une matrice pour que ses dimensions correspondent à celles attendues par un produit matriciel : c'est exactement pour cette raison que `W` a été transposée dans l'exemple du batch plus haut, afin que ses colonnes (une par neurone) s'alignent avec les colonnes de `X`.

## Le coût du calcul : pourquoi le matériel compte autant

Calculer `A · B` pour deux matrices *n*×*n* demande, méthode naïve, *n*³ multiplications ; un coût qui grandit **beaucoup** plus vite que la taille des matrices :

```python
# Version naive : trois boucles imbriquees
def produit_matriciel(A, B, n):
    resultat = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                resultat[i][j] += A[i][k] * B[k][j]
    return resultat
```

Doubler la taille d'une matrice ne double pas le temps de calcul : il est multiplié par 8 (2³). C'est exactement pourquoi la taille d'un modèle (le nombre de neurones par couche, la taille d'un batch) a un coût matériel qui grandit très vite, et pourquoi le [GPU](/?c=infrastructure&p=cpu-vs-gpu) et la [vectorisation SIMD](/?c=performance&p=cache-cpu-et-simd) existent : le produit matriciel est précisément le genre de calcul (répétitif, identique, sur des données indépendantes) qu'un GPU accélère le mieux, ce qui explique pourquoi l'entraînement d'un modèle de deep learning est presque toujours fait sur GPU plutôt que sur CPU.

> **Piège :** écrire soi-même une boucle de produit matriciel (comme ci-dessus) dans du code réel. Une implémentation naïve ignore tout ce qui a été vu dans [Cache CPU et vectorisation](/?c=performance&p=cache-cpu-et-simd) (localité mémoire, SIMD) : une bibliothèque comme NumPy peut être des dizaines à des centaines de fois plus rapide sur le même calcul, à résultat strictement identique.
>
> **Bonne pratique :** toujours déléguer un produit matriciel à une bibliothèque optimisée (NumPy, PyTorch...) plutôt que d'écrire la boucle soi-même. Voir aussi le chapitre [NumPy](/?c=data-science&p=numpy).

## Où les matrices apparaissent concrètement en IA

| Élément | Ce qu'il représente | Chapitre lié |
|---|---|---|
| Poids d'une couche | Une matrice, une ligne par neurone | [Les réseaux de neurones](/?c=ia&p=reseaux-de-neurones) |
| Un batch d'entrées | Une matrice, une ligne par exemple | [L'entraînement et la descente de gradient](/?c=ia&p=entrainement-descente-de-gradient) |
| Une table d'embeddings | Une matrice, une ligne par mot du vocabulaire | [NLP et LLM](/?c=ia&p=nlp-et-llm) |
| L'attention d'un Transformer | Des produits matriciels entre matrices de requêtes/clés/valeurs | [Architectures : CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) |

Dans les quatre cas, le principe reste celui vu dans ce chapitre : remplacer une série de calculs répétés par un seul produit matriciel, pour que le matériel (GPU, SIMD) puisse les exécuter en parallèle plutôt qu'un par un.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une matrice range des nombres en lignes et en colonnes ; un vecteur en est un cas particulier. Le produit matriciel calcule plusieurs produits scalaires en une seule opération (plusieurs neurones, ou plusieurs exemples d'un batch) : c'est cette opération, répétée à très grande échelle, qui fait tourner le deep learning. |
| **Outils utilisables** | `@` ou `np.dot()` en NumPy pour un vrai produit matriciel (jamais `*`, qui multiplie terme à terme) ; la transposée pour réorienter une matrice avant un produit. |
| **Pièges à éviter** | Multiplier deux matrices dont les dimensions internes ne correspondent pas. Confondre produit matriciel et produit terme à terme. Supposer que `A · B` et `B · A` donnent le même résultat. Écrire sa propre boucle de produit matriciel dans du code réel. |
| **Bonnes pratiques** | Vérifier les dimensions avant tout produit matriciel. Toujours vérifier quel opérateur une bibliothèque utilise pour quel produit. Déléguer tout calcul matriciel à une bibliothèque optimisée (NumPy, PyTorch) plutôt que de le réimplémenter. |
