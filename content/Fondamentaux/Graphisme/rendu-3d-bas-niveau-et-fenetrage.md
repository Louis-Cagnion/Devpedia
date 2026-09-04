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
> **Bonne pratique :** utiliser un algorithme d'avancée sur grille (*DDA*, *Digital Differential Analyzer*) qui saute directement d'une case de la grille à la suivante plutôt que d'avancer par petits pas fixes, garantissant qu'aucun mur n'est manqué tout en restant rapide.

## Ce que le raycasting ne calcule pas

Le raycasting classique ne gère qu'un seul niveau de hauteur par colonne : il ne peut pas représenter un vrai relief (des marches, un pont au-dessus d'un couloir) ni regarder vers le haut ou le bas de façon réaliste, contrairement à un vrai moteur 3D qui calcule un volume complet. C'est ce compromis délibéré (sacrifier le réalisme géométrique pour la vitesse de calcul) qui rendait la technique jouable sur le matériel de l'époque, et qui la rend encore aujourd'hui utile comme premier projet pour comprendre le rendu 3D sans la complexité d'un moteur complet.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une bibliothèque de fenêtrage (X11, MinilibX) donne accès à une zone d'affichage et aux événements clavier/souris via une boucle qui tourne en continu. Le raycasting simule la 3D en lançant un rayon par colonne de pixels sur une carte 2D, la distance jusqu'au mur touché déterminant sa hauteur à l'écran. |
| **Outils utilisables** | MinilibX/X11 pour le fenêtrage sous Linux. Un algorithme DDA pour avancer le rayon efficacement sur la grille de la carte. |
| **Pièges à éviter** | Redessiner toute l'image à chaque tour sans condition. Avancer le rayon par pas fixes trop grands, au risque de manquer un mur fin. |
| **Bonnes pratiques** | Ne redessiner qu'après un changement réel de l'état du jeu. Utiliser un DDA plutôt que des petits pas fixes pour l'avancée du rayon. |
