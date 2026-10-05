---
order: 3
---

# Ouvrir une fenêtre OpenGL moderne : GLFW, GLAD et la boucle de rendu

Le [chapitre sur le raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) dessinait des pixels un par un, sans carte graphique. Un moteur 3D moderne délègue au contraire le calcul à la carte graphique elle-même, via une API comme **OpenGL**. Avant de pouvoir lui envoyer le moindre triangle (voir le [format .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)), il faut d'abord obtenir une fenêtre, un contexte graphique, et une boucle qui affiche une image après l'autre. Ce chapitre couvre cette étape, avec deux bibliothèques quasi systématiques dans ce cadre : **GLFW** (fenêtrage) et **GLAD** (chargement des fonctions OpenGL).

## GLFW : la fenêtre et son contexte OpenGL

[GLFW](https://www.glfw.org) joue, pour OpenGL, un rôle proche de celui de MinilibX/X11 vu au chapitre précédent : demander au système d'exploitation une fenêtre, recevoir les événements clavier/souris. Mais GLFW crée en plus un **contexte OpenGL** : l'espace où la carte graphique conserve tout son état (textures chargées, programme de shader actif...) pour cette fenêtre précise.

```c
GLFWwindow *fenetre = glfwCreateWindow(800, 600, "Titre", NULL, NULL);
glfwMakeContextCurrent(fenetre);   // active ce contexte pour tous les appels OpenGL suivants
```

## Charger les fonctions OpenGL modernes : GLAD

Sur la plupart des systèmes, une seule petite partie d'OpenGL (une version ancienne, figée) est directement liée au programme à la compilation. Les fonctions **modernes** doivent être demandées au pilote graphique à l'exécution, une par une, via `glfwGetProcAddress()` : une **OpenGL Loading Library** comme [GLAD](https://glad.dav1d.de) automatise cette étape pour toute la version d'OpenGL choisie, plutôt que d'appeler `glfwGetProcAddress()` à la main pour chaque fonction utilisée.

```c
if (!gladLoadGLLoader((GLADloadproc) glfwGetProcAddress)) {
    fprintf(stderr, "Impossible de charger OpenGL\n");
    exit(1);
}
```

> **Note :** GLAD doit être appelé **après** `glfwMakeContextCurrent()`, jamais avant : sans contexte actif, il n'y a rien vers quoi résoudre les fonctions demandées.

## Le fichier GLAD : généré, puis "vendoré"

Contrairement à une bibliothèque système classique, GLAD ne s'installe pas via un gestionnaire de paquets : son [générateur en ligne](https://glad.dav1d.de) produit un `.c`/`.h` sur mesure, pour la version d'OpenGL et le système ciblés. Ce fichier généré est ensuite committé directement dans le dépôt du projet, une pratique appelée **vendoring**.

> **Piège :** un `-I` pointé sur le mauvais niveau de dossier pour ce fichier généré casse la compilation exactement comme pour tout autre header (voir [`#include` et `-I`](/?c=langages&s=c&p=headers) pour le mécanisme précis de résolution).
>
> **Bonne pratique :** le vendoring évite une dépendance à un gestionnaire de paquets externe et garantit que tout le monde compile avec exactement le même fichier généré, au prix de committer du code qu'on n'a pas écrit soi-même : à réserver à un cas comme celui-ci (un fichier généré une fois pour toutes, jamais modifié à la main ensuite), pas à une bibliothèque qui évolue régulièrement.

## Le double buffering : éviter l'image à moitié dessinée

Dessiner directement à l'écran, pixel par pixel, expose un problème : si l'écran se rafraîchit pendant que l'image est à moitié dessinée, l'utilisateur voit un instant une image incohérente (*tearing*). Le **double buffering** évite ça en dessinant toujours dans un tampon invisible, échangé avec le tampon affiché seulement une fois l'image complète :

```text
Tampon avant (affiché à l'écran)     Tampon arrière (en cours de dessin)
        |                                      |
        |         glfwSwapBuffers()            |
        +------------- échange ---------------->
        (le tampon arrière devient le tampon avant, d'un coup)
```

```c
// échange les deux tampons, jamais un dessin pixel par pixel direct à l'écran
glfwSwapBuffers(fenetre);
```

## La boucle de rendu

Comme la boucle d'événements du chapitre précédent, une boucle de rendu OpenGL tourne tant que la fenêtre reste ouverte, en général sous cette forme fixe :

```c
while (!glfwWindowShouldClose(fenetre)) {
    // 1. récupérer les événements (clavier, souris...)
    glfwPollEvents();
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  // 2. effacer l'image précédente
    // 3. dessiner la nouvelle image (tampon arrière)
    dessinerLaScene();
    // 4. l'afficher d'un coup (double buffering)
    glfwSwapBuffers(fenetre);
}
```

> **Piège :** oublier `glClear()` avant de redessiner. Sans effacement, chaque nouvelle image se superpose aux précédentes plutôt que de les remplacer, laissant une traînée visuelle.

## Le delta time : une vitesse indépendante de la machine

Un tour de la boucle de rendu produit une image (une *frame*). Le nombre d'images par seconde, les **FPS** (*frames per second*), dépend de la machine : 30 sur un ordinateur modeste, 144 sur un écran rapide. Si l'objet avance d'une distance fixe à chaque tour de boucle, sa vitesse réelle suit donc les FPS :

```c
position += 0.1;   // 0,1 unité (la mesure de longueur de la scène) par image : la vitesse dépend du nombre d'images
```

| FPS de la machine | Images en 1 seconde | Distance parcourue en 1 seconde |
|---|---|---|
| 30 | 30 | 30 × 0,1 = 3 unités |
| 60 | 60 | 60 × 0,1 = 6 unités |
| 144 | 144 | 144 × 0,1 = 14,4 unités |

Le **delta time** est la durée écoulée entre l'image précédente et l'image courante, en secondes (par exemple 0,0069 s à 144 FPS). Multiplier chaque déplacement par cette durée rend la vitesse indépendante des FPS : on exprime la vitesse en unités **par seconde**, et chaque image n'avance que de la part de seconde qu'elle a duré.

```c
double dernier_instant = glfwGetTime();   // double = nombre à virgule ; ici, secondes écoulées depuis l'initialisation de GLFW
double vitesse = 5.0;                     // 5 unités par seconde, quelle que soit la machine

while (!glfwWindowShouldClose(fenetre)) {
    double maintenant = glfwGetTime();           // instant de cette image
    double delta = maintenant - dernier_instant; // durée de l'image précédente, en secondes
    dernier_instant = maintenant;                // mémorise pour le prochain tour

    position += vitesse * delta;                 // 144 FPS : 5 × 0,0069 ; 30 FPS : 5 × 0,033
    // ... événements, effacement, dessin, glfwSwapBuffers() comme ci-dessus
}
```

> **Piège :** ne rafraîchir le delta time qu'à intervalle régulier (par exemple « seulement si 0,01 s se sont écoulées »). Entre deux rafraîchissements, la valeur périmée s'applique à chaque image : à 144 FPS (une image dure 0,0069 s, soit moins que ce seuil), le déplacement est ajouté plus souvent que le temps ne passe et tout va trop vite (environ 1,5 fois dans un cas rencontré). Le delta time se recalcule à **chaque** image.
>
> **Piège :** après une pause (fenêtre déplacée, programme suspendu), le premier delta peut valoir plusieurs secondes et propulser l'objet très loin d'un coup. On plafonne alors la valeur, par exemple `if (delta > 0.1) delta = 0.1;`.

## La synchronisation verticale (vsync)

L'écran se rafraîchit à fréquence fixe, exprimée en hertz (Hz, rafraîchissements par seconde) : 60 Hz, 144 Hz... Sans règle, la boucle de rendu tourne aussi vite que possible, bien au-delà de ce que l'écran peut montrer : des images sont gaspillées, la carte graphique chauffe, et l'échange des tampons peut tomber au milieu d'un rafraîchissement (*tearing*, vu plus haut). La **synchronisation verticale** (*vsync*) fait attendre `glfwSwapBuffers()` jusqu'au prochain rafraîchissement de l'écran :

```c
glfwMakeContextCurrent(fenetre);   // le contexte doit déjà être actif
glfwSwapInterval(1);               // 1 = attendre 1 rafraîchissement par échange (vsync) ; 0 = ne pas attendre
```

| Réglage | FPS obtenus | Effet |
|---|---|---|
| `glfwSwapInterval(1)` | égaux à la fréquence de l'écran (60 sur un écran 60 Hz) | pas de tearing, carte graphique ménagée |
| `glfwSwapInterval(0)` | aussi hauts que la machine le permet | tearing possible, utile pour mesurer les performances |

> **Bonne pratique :** ne jamais compter sur le vsync pour régler la vitesse. Le pilote graphique (le logiciel qui fait dialoguer le système avec la carte graphique) ou l'utilisateur peuvent le forcer à l'arrêt, et les FPS changent d'un écran à l'autre : seul le delta time garantit la même vitesse partout. Le vsync règle l'affichage, le delta time règle le mouvement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GLFW crée la fenêtre et son contexte OpenGL ; GLAD charge ensuite les fonctions OpenGL modernes via `glfwGetProcAddress()`. Le double buffering (`glfwSwapBuffers()`) évite une image affichée à moitié dessinée. Une boucle de rendu répète : événements, effacement, dessin, échange des tampons. Le delta time (durée de l'image précédente, via `glfwGetTime()`) rend les vitesses indépendantes des FPS ; le vsync (`glfwSwapInterval(1)`) cale l'affichage sur l'écran. |
| **Outils utilisables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`. |
| **Pièges à éviter** | Appeler GLAD avant `glfwMakeContextCurrent()`. Pointer `-I` sur le mauvais niveau de dossier pour les headers générés par GLAD. Oublier `glClear()` avant de redessiner. Déplacer un objet d'une distance fixe par image. Ne rafraîchir le delta time qu'à intervalle régulier. Laisser un delta géant après une pause. |
| **Bonnes pratiques** | Vendorer un fichier généré une fois pour toutes (comme celui de GLAD) plutôt que d'en dépendre à chaque build ; réserver cette pratique aux fichiers qui n'évoluent pas régulièrement. Exprimer les vitesses en unités par seconde, recalculer le delta time à chaque image et le plafonner ; ne jamais s'appuyer sur le vsync pour régler la vitesse. |
