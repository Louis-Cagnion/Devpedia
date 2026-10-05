---
order: 7
---

# Édition de maillage et sélection proportionnelle

Le [chapitre précédent](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d) couvre le picking, qui identifie **un** sommet cliqué. Ce chapitre couvre ce qui se passe une fois ce sommet sélectionné : comment le déplacer sans casser la forme générale du maillage qui l'entoure.

## Le problème : déplacer un sommet isolément casse la surface

Un [maillage](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) est un ensemble de sommets reliés par des faces. Déplacer un seul sommet, sans toucher à ses voisins, crée une pointe ou un creux brutal, disproportionné par rapport au reste de la surface : visuellement, la modification "casse" la forme plutôt que de la faire évoluer naturellement.

```text
Deplacement isole du sommet central :        Avec selection proportionnelle :

      *                                            *
     /|\                                          /~\
    / | \          -- vs --                      /   \
---*--+--*---                              ---*--~~~~~--*---
   (pointe brutale)                        (transition adoucie)
```

## La sélection proportionnelle : une influence qui décroît avec la distance

La **sélection proportionnelle** (notion popularisée par l'outil de modélisation [Blender](https://www.blender.org)) répond à ce problème : déplacer un sommet influence aussi ses voisins, avec une intensité qui **décroît** selon leur distance au sommet directement sélectionné.

```c
float distance = distance_3d(sommet_voisin.position, sommet_selectionne.position);

if (distance < rayon_influence) {
    // 1.0 au centre, 0.0 au bord du rayon
    float facteur = 1.0f - (distance / rayon_influence);
    sommet_voisin.position += deplacement * facteur;
}
```

Chaque sommet à l'intérieur du rayon d'influence se déplace donc dans la même direction que le sommet directement sélectionné, mais d'autant moins qu'il en est éloigné : le sommet sélectionné lui-même se déplace en entier (`facteur = 1.0`), un voisin à la limite du rayon ne bouge presque pas (`facteur` proche de `0.0`).

| Paramètre | Effet |
|---|---|
| Rayon d'influence petit | Modification localisée, proche d'un déplacement isolé |
| Rayon d'influence grand | Déformation large et douce, sur une zone étendue du maillage |
| Courbe de décroissance linéaire (ci-dessus) | Transition simple, mais avec un changement de pente visible à la limite du rayon |
| Courbe de décroissance lissée (ex. `smoothstep`) | Transition plus douce, sans changement de pente perceptible |

> **Piège :** un rayon d'influence choisi sans rapport avec l'échelle réelle du maillage. Sur un objet minuscule, un rayon pensé pour un objet immense englobe la totalité du maillage (tout bouge de façon quasi uniforme) ; sur un objet immense, le même rayon peut n'affecter presque aucun voisin (retour à un déplacement isolé).
>
> **Bonne pratique :** exprimer le rayon d'influence relativement à la taille de l'objet édité (par exemple, un pourcentage de sa boîte englobante), plutôt qu'en valeur absolue fixe.

## Compacter un maillage : retirer les sommets qu'aucune face n'utilise

Un fichier [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) peut déclarer des sommets (`v`) qu'aucune face (`f`) ne référence : des **sommets isolés**. Invisibles à l'écran, ils comptent pourtant dans le calcul de la **boîte englobante**, le plus petit parallélépipède aligné sur les axes qui contient tous les sommets. Or le programme s'en sert pour placer le **pivot** (le point autour duquel l'objet tourne, ici le centre de la boîte) et pour [cadrer la caméra](/?c=fondamentaux&s=graphisme&p=matrices-et-camera).

```text
Avec le sommet isole D :          Sans D :
+----------------------+          +-------+
|  A---B             D |          | A---B |
|   \ /                |          |  \ /  |
|    C                 |          |   C   |
+----------------------+          +-------+
pivot decentre, objet             pivot et cadrage
petit et excentre                 corrects
```

La parade est de **compacter** le maillage : ne garder que les sommets utilisés, puis renuméroter les faces. Les faces désignent un sommet par son **indice** (sa position dans le tableau des sommets) : retirer le sommet n°2 décale tous les suivants, donc tout indice supérieur à 2 doit être corrigé.

### Une table de renumérotation, remplie en trois passes

La **table de renumérotation** (`remap`) associe à l'ancien indice de chaque sommet son nouvel indice, ou `-1` s'il disparaît.

```c
typedef struct {
    float position[3];
    float uv[2];        // coordonnées de texture : voyager avec le sommet
} Sommet;

// Retire en place les sommets inutilisés ; renvoie le nombre conservé,
// -1 si l'allocation échoue, -2 si un indice de face sort du tableau.
long compacter_maillage(Sommet *sommets, size_t nb_sommets,
                        unsigned *indices, size_t nb_indices) {
    long *remap = malloc(nb_sommets * sizeof *remap);

    if (remap == NULL)
        return -1;
    for (size_t i = 0; i < nb_sommets; i++)
        remap[i] = -1;
    for (size_t k = 0; k < nb_indices; k++) {
        if (indices[k] >= nb_sommets) {
            free(remap);
            return -2;
        }
        remap[indices[k]] = 0;          // marque « utilisé »
    }
    long nouveau = 0;
    for (size_t i = 0; i < nb_sommets; i++) {
        if (remap[i] < 0)
            continue;
        sommets[nouveau] = sommets[i];  // nouveau <= i : case déjà lue
        remap[i] = nouveau++;
    }
    for (size_t k = 0; k < nb_indices; k++)
        indices[k] = remap[indices[k]];
    free(remap);
    return nouveau;
}
```

| Passe | Rôle |
|---|---|
| 1. Marquer | Pour chaque indice de face, passer `remap[indice]` de `-1` à « utilisé » |
| 2. Déplacer | Parcourir les sommets dans l'ordre ; chaque sommet utilisé reçoit le prochain nouvel indice et est recopié à sa nouvelle place |
| 3. Renuméroter | Remplacer chaque indice de face par `remap[indice]` |

- **Pas de second tableau** : le déplacement se fait en place, car un sommet ne monte jamais (`nouveau <= i`). La case d'arrivée a donc déjà été lue, ou était inutilisée.
- **Indice et UV ensemble** : les UV (coordonnées de texture, cf. [indexation `v/vt/vn`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#lindexation-combinee-vvtvn-et-la-couture-uv)) voyagent avec le sommet dans la même structure. Si le fichier les garde dans un tableau séparé, ce tableau a sa propre table de renumérotation, appliquée aux mêmes faces.
- **Valider avant de renuméroter** : un indice hors du tableau écrirait hors de `remap`. La fonction le refuse avec un code d'erreur dédié plutôt que de le supposer valide.

> **Piège de test :** un vérificateur qui lit les triangles par numéro de sommet échoue après la renumérotation, puisque les numéros ont changé. Comparer les triangles par **coordonnées**, pas par indice. Attention aussi : deux sommets distincts dont les coordonnées s'arrondissent au même `float` rendent cet indice ambigu.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Déplacer un sommet isolément casse visuellement la surface d'un maillage. La sélection proportionnelle déplace aussi les voisins, avec une intensité qui décroît selon leur distance au sommet sélectionné, à l'intérieur d'un rayon d'influence. Un sommet qu'aucune face n'utilise fausse la boîte englobante, donc le pivot et le cadrage : on compacte le maillage. |
| **Outils utilisables** | Une distance 3D entre sommets, un facteur d'atténuation linéaire ou lissé (`smoothstep`) selon cette distance. Une table de renumérotation (`remap`) remplie en trois passes (marquer, déplacer en place, renuméroter les faces). |
| **Pièges à éviter** | Un rayon d'influence fixe, sans rapport avec l'échelle réelle de l'objet édité. Renuméroter sans valider les indices de face, ou comparer des triangles par indice après compactage. |
| **Bonnes pratiques** | Exprimer le rayon d'influence relativement à la taille de l'objet plutôt qu'en valeur absolue. Une courbe de décroissance lissée pour une transition sans changement de pente visible à la limite du rayon. Renuméroter faces et UV ensemble ; comparer les triangles par coordonnées. |
