---
order: 4
---

# Effets de rendu et interaction 3D

Une fois une scène chargée ([format .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) et affichée ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), trois besoins reviennent souvent : enrichir visuellement le rendu (un effet de post-traitement), l'animer sans données externes, et permettre à l'utilisateur d'interagir avec elle à la souris. Ce chapitre couvre ces trois besoins.

## L'aberration chromatique : un effet de post-traitement

La lumière blanche traversant un matériau réfractif (verre, eau) ne dévie pas exactement de la même façon selon sa couleur : c'est l'**aberration chromatique**, visible en photographie comme une frange colorée sur les contours à fort contraste. Un moteur de rendu peut simuler cet effet volontairement, en post-traitement : plutôt que de calculer une seule fois la réfraction d'un rayon (voir [vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) pour les bases du calcul vectoriel utilisé ici), on la calcule **trois fois**, une par canal de couleur, avec un indice de réfraction légèrement différent à chaque fois :

```text
Rayon incident
      |
      v
  Refraction avec IOR rouge   -> echantillonne le canal ROUGE de la cubemap
  Refraction avec IOR vert    -> echantillonne le canal VERT de la cubemap
  Refraction avec IOR bleu    -> echantillonne le canal BLEU de la cubemap
      |
      v
Recombine les 3 canaux -> le resultat final, avec ses franges colorees
```

Une **cubemap** (une texture composée de 6 images, une par face d'un cube, représentant l'environnement autour d'un objet) fournit l'image réfractée : chacun des 3 rayons, légèrement dévié différemment, échantillonne cette même cubemap à un point légèrement différent, ce qui produit la séparation de couleurs.

> **Bonne pratique :** garder les 3 indices de réfraction proches les uns des autres (une variation de quelques centièmes suffit). Un écart trop grand produit un résultat qui ne ressemble plus à un verre réaliste, mais à un artefact visuel grossier.

## L'animation procédurale : recalculer plutôt que rejouer

Contrairement à une animation par **images clés** (*keyframes*, des positions enregistrées à l'avance et interpolées), une animation **procédurale** recalcule la position ou la déformation d'un objet à chaque image, à partir d'une formule dépendant du temps écoulé, sans aucune donnée externe :

```c
float hauteur = amplitude * sinf(temps_ecoule * vitesse);
position.y = hauteur;   // fait "flotter" un objet de haut en bas, indefiniment
```

Aucune donnée n'est stockée pour cette animation : elle est entièrement déterminée par la formule et le temps écoulé, ce qui la rend triviale à faire durer indéfiniment (contrairement à une séquence d'images clés, forcément finie) et bon marché en mémoire.

> **Piège :** utiliser directement le nombre d'images passées (`frame_count`) plutôt qu'un temps réel écoulé (en secondes). Une animation basée sur le nombre d'images va plus vite sur une machine qui affiche plus d'images par seconde, exactement le même piège que celui déjà vu pour une [boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) basée sur le temps.

## Le picking souris : trouver quel objet 3D a été cliqué

Le **picking** répond à une question précise : sur quel objet, dans une scène 3D, l'utilisateur vient-il de cliquer, à partir d'une position 2D (`x`, `y`) sur l'écran ? Le principe : transformer ce clic 2D en un **rayon** dans l'espace 3D, puis tester quel objet ce rayon touche en premier.

```text
Clic ecran (x, y)
      |
      v  inverse de la matrice de projection, puis de la matrice de vue
Rayon 3D, de la camera vers la scene
      |
      v  intersection rayon/objet (teste chaque objet de la scene)
Objet le plus proche touche par ce rayon -> objet "clique"
```

Concrètement, le clic 2D est d'abord converti en coordonnées normalisées (entre -1 et 1), puis **l'inverse** de la matrice de projection ramène ce point dans l'espace caméra, et **l'inverse** de la matrice de vue le ramène ensuite dans l'espace du monde : deux transformations inversées, dans l'ordre inverse de celui utilisé pour afficher normalement un objet 3D à l'écran.

> **Note :** ce mécanisme est l'exact inverse du pipeline de rendu habituel (monde → vue → projection → écran), d'où l'usage des matrices **inverses**, dans l'ordre **inverse**.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'aberration chromatique simule la dispersion de la lumière en calculant la réfraction 3 fois (une par canal de couleur), avec un indice de réfraction légèrement différent à chaque fois. Une animation procédurale recalcule une position à chaque image via une formule dépendant du temps réel écoulé, sans données externes. Le picking souris convertit un clic 2D en rayon 3D via les matrices de projection/vue inversées, dans l'ordre inverse du rendu normal. |
| **Outils utilisables** | Une cubemap pour l'environnement réfracté. Une formule temporelle (`sinf(temps * vitesse)`) pour une animation procédurale simple. L'inverse des matrices de projection et de vue pour le picking. |
| **Pièges à éviter** | Un écart trop grand entre les indices de réfraction (résultat irréaliste). Animer selon le nombre d'images plutôt que le temps réel écoulé. |
| **Bonnes pratiques** | Garder les indices de réfraction proches les uns des autres pour un résultat crédible. Toujours baser une animation sur le temps réel, jamais sur le nombre d'images passées. |
