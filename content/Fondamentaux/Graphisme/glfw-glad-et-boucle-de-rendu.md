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
Tampon avant (affiché a l'ecran)     Tampon arriere (en cours de dessin)
        |                                      |
        |         glfwSwapBuffers()            |
        +------------- echange ---------------->
        (le tampon arriere devient le tampon avant, d'un coup)
```

```c
glfwSwapBuffers(fenetre);   // echange les deux tampons, jamais un dessin pixel par pixel direct a l'ecran
```

## La boucle de rendu

Comme la boucle d'événements du chapitre précédent, une boucle de rendu OpenGL tourne tant que la fenêtre reste ouverte, en général sous cette forme fixe :

```c
while (!glfwWindowShouldClose(fenetre)) {
    glfwPollEvents();                              // 1. recuperer les evenements (clavier, souris...)
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  // 2. effacer l'image precedente
    dessinerLaScene();                             // 3. dessiner la nouvelle image (tampon arriere)
    glfwSwapBuffers(fenetre);                       // 4. l'afficher d'un coup (double buffering)
}
```

> **Piège :** oublier `glClear()` avant de redessiner. Sans effacement, chaque nouvelle image se superpose aux précédentes plutôt que de les remplacer, laissant une traînée visuelle.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GLFW crée la fenêtre et son contexte OpenGL ; GLAD charge ensuite les fonctions OpenGL modernes via `glfwGetProcAddress()`. Le double buffering (`glfwSwapBuffers()`) évite une image affichée à moitié dessinée. Une boucle de rendu répète : événements, effacement, dessin, échange des tampons. |
| **Outils utilisables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`. |
| **Pièges à éviter** | Appeler GLAD avant `glfwMakeContextCurrent()`. Pointer `-I` sur le mauvais niveau de dossier pour les headers générés par GLAD. Oublier `glClear()` avant de redessiner. |
| **Bonnes pratiques** | Vendorer un fichier généré une fois pour toutes (comme celui de GLAD) plutôt que d'en dépendre à chaque build ; réserver cette pratique aux fichiers qui n'évoluent pas régulièrement. |
