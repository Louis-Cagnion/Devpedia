---
order: 1
---

# Rendu 3D bas niveau et fenêtrage : le raycasting façon Wolfenstein

Avant qu'un moteur de jeu ne s'occupe d'ouvrir une fenêtre et de dessiner une scène en 3D à sa place, un programme doit le faire lui-même : demander au système d'exploitation une zone d'affichage, puis y écrire directement les pixels qui composent l'image. Ce chapitre couvre cette étape bas niveau, avec le **raycasting**, la technique qui a rendu possible *Wolfenstein 3D* (1992) sur du matériel bien trop lent pour du vrai calcul 3D.

## Le fenêtrage : obtenir une zone où dessiner

**Ouvrir une fenêtre** ne va pas de soi : le programme doit demander au système d'exploitation une zone d'affichage, y recevoir les événements (touche pressée, souris déplacée, fenêtre fermée), et lui transmettre l'image à afficher à chaque étape. Une bibliothèque de fenêtrage s'occupe de ces échanges bas niveau avec le système :

| Bibliothèque | Rôle |
|---|---|
| **X11** (*X Window System*) | Le système de fenêtrage standard sous Linux : gère les fenêtres, les événements clavier/souris, et l'affichage à l'écran |
| **MinilibX** | Une petite bibliothèque construite au-dessus de X11, qui simplifie son usage pour un programme qui n'a besoin que de créer une fenêtre et d'y dessiner des pixels un par un |

Une **boucle d'événements** (*event loop*) tourne en continu tant que la fenêtre reste ouverte : à chaque tour, elle vérifie si une touche a été pressée ou si la souris a bougé, met à jour l'état du programme en conséquence, puis redessine l'image.

```text
Tant que la fenetre est ouverte :
  1. Verifier les evenements (touche pressee, souris deplacee, fermeture demandee)
  2. Mettre a jour l'etat du jeu (position du joueur, direction du regard)
  3. Recalculer l'image a afficher
  4. Envoyer l'image a l'ecran
```

> **Piège :** redessiner l'intégralité de l'image à chaque tour même quand rien n'a changé. Ce principe rejoint celui déjà vu dans [éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) : ne retraiter que ce qui a réellement changé, appliqué ici au rendu d'une image plutôt qu'à un calcul serveur.
>
> **Bonne pratique :** ne redessiner que quand l'état du jeu a réellement changé (une touche pressée, la souris déplacée), plutôt qu'à chaque tour de boucle sans condition.

## Écrire directement dans le buffer mémoire de l'image

MinilibX propose deux façons de poser un pixel dans une image : `mlx_pixel_put()`, un appel de fonction par pixel, ou un accès direct au buffer mémoire de l'image via `mlx_get_data_addr()`. Pour une image redessinée entièrement à chaque frame (comme un rendu par raycasting), la seconde est nettement plus rapide : un appel de fonction par pixel a un coût non négligeable, multiplié par des centaines de milliers de pixels par image.

`mlx_get_data_addr()` renvoie l'adresse mémoire du premier pixel de l'image, ainsi que trois informations nécessaires pour calculer l'adresse d'un pixel précis : `line_length` (le nombre d'octets par ligne de l'image), `bits_per_pixel` (la taille en bits d'un pixel, généralement 32) et `endian` (l'ordre des octets).

```c
int line_length, bits_per_pixel, endian;
char *buffer = mlx_get_data_addr(image, &bits_per_pixel, &line_length, &endian);

void poserPixel(char *buffer, int line_length, int bits_per_pixel, int x, int y, int couleur)
{
    char *adresse = buffer + (y * line_length) + (x * (bits_per_pixel / 8));

    *(unsigned int *)adresse = couleur; // écrit directement les 4 octets du pixel
}
```

> **Piège :** oublier que `bits_per_pixel` s'exprime en bits, pas en octets : diviser par 8 (`bits_per_pixel / 8`) est indispensable pour obtenir le nombre d'octets à décaler par pixel, sinon l'accès mémoire vise le mauvais endroit dans le buffer.
>
> **Bonne pratique :** calculer `line_length` et `bits_per_pixel` une seule fois (au lancement), puis ne recalculer que l'adresse du pixel (`x`, `y` variables) à chaque écriture : ce sont les seules valeurs qui changent d'un pixel à l'autre.

## Le problème : simuler la 3D sans vraie 3D

Calculer une scène 3D complète (chaque surface, chaque angle de vue) demandait, au début des années 1990, une puissance de calcul qu'aucun ordinateur grand public n'avait. Le raycasting contourne le problème : plutôt que de modéliser un vrai volume en 3D, il simule la profondeur à partir d'une carte **en 2D** (un plan vu du dessus, comme un labyrinthe), en calculant seulement la distance jusqu'au mur le plus proche dans chaque direction regardée.

```text
Carte 2D (vue du dessus) :          Rendu final (vue du joueur) :

# # # # # # #                        Le mur proche parait grand,
#           #                        le mur eloigne parait petit :
#     @     #    -- raycasting -->   la meme information de distance,
#           #                        traduite en hauteur de mur
# # # # # # #                        a l'ecran.
```

## Lancer un rayon par colonne de pixels

Pour chaque colonne verticale de pixels à l'écran (une image de 800 pixels de large demande 800 calculs), le programme lance un **rayon** imaginaire depuis la position du joueur, dans la direction correspondant à cette colonne, et avance ce rayon sur la carte 2D jusqu'à toucher un mur :

```text
Position du joueur : (x, y)
Direction du rayon : angle de vue du joueur + decalage selon la colonne

Avancer le rayon pas a pas sur la carte :
  tant que la case actuelle n'est pas un mur :
    avancer le rayon d'un petit pas
  -> distance parcourue = distance jusqu'au mur, dans cette direction
```

Une fois cette distance connue, la hauteur du mur à dessiner à l'écran pour cette colonne en découle directement : plus la distance est courte, plus le mur paraît haut (proche), plus elle est longue, plus il paraît bas (éloigné), exactement comme un objet réel rapetisse avec la distance.

> **Piège :** avancer le rayon par pas fixes trop grands, ce qui peut le faire "sauter" par-dessus un mur fin sans jamais détecter la collision. Un pas trop petit, à l'inverse, ralentit le calcul pour chaque colonne de l'image.
>
> **Bonne pratique :** utiliser un algorithme d'avancée sur grille (*DDA*, *Digital Differential Analyzer*) qui saute directement d'une case de la grille à la suivante plutôt que d'avancer par petits pas fixes, garantissant qu'aucun mur n'est manqué tout en restant rapide (détaillé ci-dessous).

## L'algorithme DDA : avancer case de grille en case de grille

Le principe précédent (avancer le rayon "pas à pas") fonctionne, mais gaspille du calcul : un petit pas peut retomber plusieurs fois dans la même case de la carte avant d'atteindre la case suivante. Le **DDA** avance directement de case de grille en case de grille, en calculant à chaque étape la distance jusqu'à la prochaine ligne verticale de la grille et jusqu'à la prochaine ligne horizontale, puis en choisissant le plus proche des deux :

```text
A chaque etape du DDA :
  distance_x = distance jusqu'a la prochaine ligne verticale de la grille
  distance_y = distance jusqu'a la prochaine ligne horizontale de la grille
  si distance_x < distance_y :
    avancer jusqu'a cette ligne verticale (cote du mur potentiellement touche : X)
  sinon :
    avancer jusqu'a cette ligne horizontale (cote du mur potentiellement touche : Y)
  repeter jusqu'a toucher un mur
```

Ce choix (verticale ou horizontale) mémorise aussi de quel **côté** un mur est éventuellement touché (nord/sud ou est/ouest), une information réutilisée plus loin pour choisir la bonne texture ou assombrir légèrement un côté par rapport à l'autre.

## Corriger l'effet fisheye avec le vecteur plan caméra

Chaque rayon est construit à partir de deux vecteurs : la **direction** du joueur (`direction_x`/`direction_y`) et un vecteur **plan caméra**, perpendiculaire à la direction, qui représente la largeur du champ de vision. Un facteur `cam_x`, qui balaie de `-1` (bord gauche de l'écran) à `1` (bord droit), combine les deux pour obtenir la direction exacte du rayon de chaque colonne :

```text
direction_rayon = direction_joueur + plan_camera * cam_x
```

> **Piège :** utiliser la distance euclidienne réelle entre le joueur et le point d'impact du rayon pour calculer la hauteur du mur à l'écran. Les rayons des colonnes latérales parcourent une distance plus longue en ligne droite que celui du centre pour atteindre le même mur, ce qui courberait visuellement les murs droits sur les bords de l'écran : l'effet **fisheye**.
>
> **Bonne pratique :** utiliser la distance **perpendiculaire** à la direction du joueur (la distance projetée sur l'axe de direction, plutôt que la distance en ligne droite) pour calculer la hauteur du mur. Cette correction élimine l'effet fisheye sans aucun calcul trigonométrique supplémentaire : c'est un sous-produit direct de la construction du rayon via le vecteur plan caméra.

## Plaquer une texture sur un mur raycasté

Une fois le point d'impact du rayon connu, sa position **fractionnaire** le long du mur touché (`wall_x`, la partie décimale de la coordonnée d'impact) donne directement la coordonnée horizontale à lire dans la texture (`tex_x`) :

```text
wall_x = partie fractionnaire du point d'impact sur le mur
tex_x  = wall_x * largeur_texture
```

Verticalement, un pas (`step = hauteur_texture / hauteur_mur_a_l_ecran`) permet d'avancer dans la texture pixel d'écran par pixel d'écran : ce facteur d'échelle s'adapte automatiquement à la distance, un mur proche (grand à l'écran) parcourt la texture lentement, un mur éloigné (petit à l'écran) l'étire. Le côté touché par le rayon (retenu par le DDA ci-dessus) détermine quelle texture utiliser (nord/sud/est/ouest).

## Afficher un sprite dans une scène raycastée

Un **sprite** (un objet 2D, comme un personnage ou un objet ramassable) n'a pas de volume dans le monde raycasté : il doit être transformé pour apparaître à la bonne position et à la bonne taille à l'écran, toujours face à la caméra (un *billboard*, comme un panneau publicitaire toujours tourné vers l'observateur).

La position du sprite relative au joueur est transformée par l'inverse de la matrice caméra (construite à partir de la direction et du plan caméra déjà utilisés pour les rayons) ; ce calcul donne directement sa position horizontale à l'écran et sa distance apparente (donc sa taille).

> **Piège :** dessiner un sprite sans vérifier ce qui a déjà été dessiné à cet endroit de l'écran. Un sprite plus loin qu'un mur qui le cache doit rester invisible, sinon il apparaît à travers les murs.
>
> **Bonne pratique :** garder en mémoire, pour chaque colonne d'écran, la distance du mur déjà dessiné par le raycasting (un **z-buffer**, littéralement "tampon de profondeur") ; avant de dessiner un pixel de sprite, comparer sa distance à celle déjà enregistrée pour cette colonne, et ne le dessiner que s'il est plus proche. Ce test de profondeur est le même principe, simplifié à une dimension (une valeur par colonne plutôt que par pixel), que le z-buffer utilisé dans tous les moteurs 3D modernes.

## Simuler une souris infinie

Pour faire tourner la caméra à la souris sans que le curseur ne sorte jamais de la fenêtre (comme dans un jeu de tir à la première personne), une technique simple consiste à **recentrer** le curseur dès qu'il s'approche d'un bord de l'écran :

```c
void surMouvementSouris(int x, int y)
{
    if (x <= 10) {
        mlx_mouse_move(fenetre, largeur_ecran - 11, y); // replace près du bord opposé
    } else if (x >= largeur_ecran - 10) {
        mlx_mouse_move(fenetre, 11, y);
    }
    // ... utiliser x - dernier_x pour faire tourner la caméra ...
}
```

Seul le déplacement **relatif** entre deux positions successives (`x - dernier_x`) sert à faire tourner la caméra : le repositionnement du curseur lui-même n'est qu'un artifice pour ne jamais être bloqué par le bord de la fenêtre, invisible pour l'utilisateur puisqu'aucune rotation n'est calculée à partir de la position absolue.

> **Note :** cette approche (téléporter le curseur) diffère du **pointer lock** utilisé par les navigateurs web pour le même besoin, qui cache et verrouille complètement le curseur au lieu de le déplacer : deux solutions différentes au même problème.

## Ce que le raycasting ne calcule pas

Le raycasting classique ne gère qu'un seul niveau de hauteur par colonne : il ne peut pas représenter un vrai relief (des marches, un pont au-dessus d'un couloir) ni regarder vers le haut ou le bas de façon réaliste, contrairement à un vrai moteur 3D qui calcule un volume complet. C'est ce compromis délibéré (sacrifier le réalisme géométrique pour la vitesse de calcul) qui rendait la technique jouable sur le matériel de l'époque, et qui la rend encore aujourd'hui utile comme premier projet pour comprendre le rendu 3D sans la complexité d'un moteur complet.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une bibliothèque de fenêtrage (X11, MinilibX) donne accès à une zone d'affichage et aux événements clavier/souris via une boucle qui tourne en continu. Le raycasting simule la 3D en avançant un rayon par colonne de pixels (DDA) sur une carte 2D, la distance perpendiculaire jusqu'au mur touché déterminant sa hauteur à l'écran sans effet fisheye. |
| **Outils utilisables** | MinilibX/X11 pour le fenêtrage sous Linux. `mlx_get_data_addr()` pour écrire directement dans le buffer de l'image plutôt que pixel par pixel. Le DDA pour avancer le rayon efficacement ; un z-buffer par colonne pour occulter correctement les sprites derrière un mur. |
| **Pièges à éviter** | Redessiner toute l'image à chaque tour sans condition. Avancer le rayon par pas fixes trop grands, au risque de manquer un mur fin. Oublier de diviser `bits_per_pixel` par 8 en écrivant dans le buffer. Utiliser la distance euclidienne plutôt que perpendiculaire (effet fisheye). Dessiner un sprite sans test de profondeur. |
| **Bonnes pratiques** | Ne redessiner qu'après un changement réel de l'état du jeu. Utiliser un DDA plutôt que des petits pas fixes pour l'avancée du rayon. Recentrer le curseur près des bords pour une souris infinie, en ne se basant que sur le déplacement relatif. |
