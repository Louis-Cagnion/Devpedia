---
order: 5
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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Déplacer un sommet isolément casse visuellement la surface d'un maillage. La sélection proportionnelle déplace aussi les voisins, avec une intensité qui décroît selon leur distance au sommet sélectionné, à l'intérieur d'un rayon d'influence. |
| **Outils utilisables** | Une distance 3D entre sommets, un facteur d'atténuation linéaire ou lissé (`smoothstep`) selon cette distance. |
| **Pièges à éviter** | Un rayon d'influence fixe, sans rapport avec l'échelle réelle de l'objet édité. |
| **Bonnes pratiques** | Exprimer le rayon d'influence relativement à la taille de l'objet plutôt qu'en valeur absolue. Une courbe de décroissance lissée pour une transition sans changement de pente visible à la limite du rayon. |
