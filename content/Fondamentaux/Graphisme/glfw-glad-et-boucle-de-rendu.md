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

## Les limites de la carte graphique et `glGetError`

Chaque carte graphique a ses **limites** : taille maximale d'une texture, taille maximale de la **zone de dessin** (*viewport*, le rectangle de la fenêtre où OpenGL écrit les pixels)... Elles changent d'une machine à l'autre : un programme qui marche chez son auteur peut échouer chez quelqu'un d'autre, sans que le code ait changé. On les **lit** au lieu de les supposer, avec `glGetIntegerv(constante, &valeur)` (la fonction qui lit un entier de l'état d'OpenGL ; `GLint` est le type entier d'OpenGL, 32 bits sur toutes les machines).

| Constante | Ce qu'elle donne | Si on la dépasse |
|---|---|---|
| `GL_MAX_TEXTURE_SIZE` | côté maximal, en pixels, d'une [texture](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-textures-une-image-collee-sur-la-surface) | l'envoi de l'image est refusé, la texture est inutilisable (lue noire) |
| `GL_MAX_VIEWPORT_DIMS` | **deux** entiers : largeur et hauteur maximales de la zone de dessin | la spécification ne garantit rien : dessin tronqué selon le pilote |

```c
/* Vrai si une image width x height tient dans une texture de cette carte ; message sinon. */
static int texture_fits(int width, int height)
{
	GLint max_size = 0;

	if (width <= 0 || height <= 0)                 /* dimensions dégénérées : cause à part */
	{
		fprintf(stderr, "image de %d x %d : dimensions nulles ou negatives\n", width, height);
		return 0;
	}
	glGetIntegerv(GL_MAX_TEXTURE_SIZE, &max_size); /* un entier ; contexte actif obligatoire */
	if (width > max_size || height > max_size)
	{
		fprintf(stderr, "image %d x %d trop grande : cette carte accepte %d au maximum par cote\n",
			width, height, max_size);
		return 0;
	}
	return 1;
}

GLint max_viewport[2] = {0, 0};
glGetIntegerv(GL_MAX_VIEWPORT_DIMS, max_viewport); /* ici deux valeurs : un tableau de 2 entiers */
```

> **Piège :** `glGetIntegerv` comme toute fonction OpenGL ne marche qu'**après** [`glfwMakeContextCurrent()` et le chargement de GLAD](#charger-les-fonctions-opengl-modernes-glad) : avant, le pointeur de fonction est nul et le programme plante.

**OpenGL ne signale presque jamais une erreur par une valeur de retour.** Un appel refusé (taille trop grande, mauvais état) ne plante pas et n'affiche rien : il lève un **drapeau d'erreur** interne, que le programme lit avec `glGetError()`. Cette fonction renvoie un code et remet le drapeau à zéro ; `GL_NO_ERROR` (0) signifie « rien en attente ».

| Code | Signification courante |
|---|---|
| `GL_INVALID_ENUM` | constante inconnue passée à une fonction |
| `GL_INVALID_VALUE` | valeur numérique hors plage (taille trop grande, négative) |
| `GL_INVALID_OPERATION` | appel interdit dans l'état actuel (mauvais ordre, objet non lié) |
| `GL_OUT_OF_MEMORY` | la carte (ou le pilote) n'a plus de mémoire |
| `GL_INVALID_FRAMEBUFFER_OPERATION` | dessin vers un tampon d'image incomplet |

Les erreurs **s'empilent** et `glGetError()` en rend **une par appel** : on boucle jusqu'au vide, sinon l'erreur lue date d'un appel antérieur et non du dernier.

```c
/* Nom lisible d'un code d'erreur OpenGL. */
static const char *gl_error_name(GLenum err)
{
	switch (err)
	{
	case GL_INVALID_ENUM: return "GL_INVALID_ENUM";
	case GL_INVALID_VALUE: return "GL_INVALID_VALUE";
	case GL_INVALID_OPERATION: return "GL_INVALID_OPERATION";
	case GL_OUT_OF_MEMORY: return "GL_OUT_OF_MEMORY";
	case GL_INVALID_FRAMEBUFFER_OPERATION: return "GL_INVALID_FRAMEBUFFER_OPERATION";
	default: return "code inconnu";
	}
}

/* Lit et affiche toutes les erreurs en attente, avec l'étape `where` ; renvoie leur nombre. */
static int check_gl_errors(const char *where)
{
	int count = 0;
	GLenum err;

	while ((err = glGetError()) != GL_NO_ERROR)   /* chaque lecture retire une erreur de la pile */
	{
		fprintf(stderr, "OpenGL : %s pendant '%s'\n", gl_error_name(err), where);
		count++;
	}
	return count;
}
```

Usage : `check_gl_errors("glTexImage2D");` juste après l'appel suspect, pour nommer l'étape fautive (un `check_gl_errors("avant")` placé avant vide l'ancien contenu).

> **Piège :** dans une boucle de rendu, un même problème se répéterait à **chaque image** (60 messages par seconde qui noient tout le reste). Signaler chaque cause **une seule fois** (liste bornée des codes déjà affichés), ou ne contrôler qu'au démarrage et en mode débogage.

### Interroger le pilote graphique et l'écran

Le **pilote** (le logiciel du fabricant qui fait dialoguer OpenGL avec la carte) sait dire qui il est et ce qu'il accepte. `glGetString` renvoie un texte, `glGetIntegerv` un entier :

| Requête | Ce qu'elle donne |
|---|---|
| `glGetString(GL_VENDOR)` | le fabricant du pilote |
| `glGetString(GL_RENDERER)` | le nom de la carte (et souvent du pilote) |
| `glGetString(GL_VERSION)` | la version d'OpenGL fournie, suivie du pilote |
| `glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, ...)` | le nombre maximal d'attributs par sommet (position, normale...) |
| `glGetIntegerv(GL_MAX_GEOMETRY_OUTPUT_VERTICES, ...)` | le maximum du `max_vertices` d'un [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-shaders-les-programmes-de-la-carte-graphique) |
| `glGetIntegerv(GL_MAX_ELEMENTS_INDICES, ...)` | un **conseil** (nombre d'indices conseillé par appel de dessin), jamais une limite : le dépasser ne produit aucune erreur, seulement un dessin possiblement plus lent |

```c
/* Affiche fabricant, carte et version d'OpenGL ; renvoie 0, ou -1 si le pilote ne répond pas. */
static int print_gl_info(void)
{
	const char *vendor = (const char *)glGetString(GL_VENDOR);      /* GLubyte * converti en texte */
	const char *renderer = (const char *)glGetString(GL_RENDERER);
	const char *version = (const char *)glGetString(GL_VERSION);

	if (!vendor || !renderer || !version)          /* NULL : pas de contexte actif, ou constante refusée */
	{
		fprintf(stderr, "glGetString a renvoye NULL : pas de contexte actif, ou constante refusee\n");
		return -1;
	}
	printf("Fabricant : %s\nCarte : %s\nOpenGL : %s\n", vendor, renderer, version);
	return 0;
}
```

**La mémoire de la carte n'a pas de requête standard.** Seules des **extensions** (fonctions facultatives, propres à un fabricant, que le pilote peut ou non fournir) la donnent : `GL_NVX_gpu_memory_info` chez NVIDIA, `GL_ATI_meminfo` chez AMD. `glfwExtensionSupported("GL_NVX_gpu_memory_info")` dit si le pilote en dispose. Sans elle, le seul signal d'un manque de mémoire est `GL_OUT_OF_MEMORY` à lire avec `glGetError()` (voir plus haut).

**L'écran se demande à GLFW**, pas à OpenGL : une fenêtre plus grande que l'écran est en partie hors de la vue de l'utilisateur.

```c
/* Vrai (1) si une fenêtre width x height tient sur l'écran principal, 0 sinon, -1 si l'écran est inconnu. */
static int window_fits_screen(int width, int height)
{
	GLFWmonitor *monitor = glfwGetPrimaryMonitor();   /* NULL : aucun écran détecté */
	const GLFWvidmode *mode = monitor ? glfwGetVideoMode(monitor) : NULL;   /* NULL en cas d'échec */

	if (!mode)
	{
		fprintf(stderr, "ecran principal introuvable : taille de fenetre non verifiee\n");
		return -1;
	}
	if (width > mode->width || height > mode->height)   /* mode->width et ->height : taille de l'écran */
	{
		fprintf(stderr, "fenetre %d x %d plus grande que l'ecran (%d x %d)\n",
			width, height, mode->width, mode->height);
		return 0;
	}
	return 1;
}
```

> **Piège :** `glfwGetVideoMode` donne la taille en **coordonnées d'écran**, qui diffèrent des pixels sur un écran à haute densité (HiDPI, par exemple un écran qui affiche 2 pixels par unité) ; `glfwGetFramebufferSize` donne la taille en pixels de la fenêtre. Avec plusieurs écrans, `glfwGetPrimaryMonitor` ne désigne que l'écran principal : la fenêtre peut s'ouvrir sur un autre.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GLFW crée la fenêtre et son contexte OpenGL ; GLAD charge ensuite les fonctions OpenGL modernes via `glfwGetProcAddress()`. Le double buffering (`glfwSwapBuffers()`) évite une image affichée à moitié dessinée. Une boucle de rendu répète : événements, effacement, dessin, échange des tampons. Le delta time (durée de l'image précédente, via `glfwGetTime()`) rend les vitesses indépendantes des FPS ; le vsync (`glfwSwapInterval(1)`) cale l'affichage sur l'écran. Les limites de la carte (taille de texture, de zone de dessin) changent d'une machine à l'autre : on les lit ; OpenGL ne signale une erreur que par un drapeau qu'on lit avec `glGetError()`. `glGetString` identifie le pilote ; la mémoire de la carte n'a pas de requête standard (extensions) ; la taille de l'écran se demande à GLFW. |
| **Outils utilisables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`, `glGetString`, `glfwGetPrimaryMonitor`/`glfwGetVideoMode`, `glfwExtensionSupported`. |
| **Pièges à éviter** | Appeler GLAD avant `glfwMakeContextCurrent()`. Pointer `-I` sur le mauvais niveau de dossier pour les headers générés par GLAD. Oublier `glClear()` avant de redessiner. Déplacer un objet d'une distance fixe par image. Ne rafraîchir le delta time qu'à intervalle régulier. Laisser un delta géant après une pause. Supposer une limite de la carte au lieu de la lire, appeler `glGetIntegerv` sans contexte actif, lire une seule erreur au lieu de vider la pile, répéter le même message à chaque image. Afficher le résultat de `glGetString` sans tester `NULL`, prendre `GL_MAX_ELEMENTS_INDICES` pour une limite, ouvrir une fenêtre plus grande que l'écran, confondre coordonnées d'écran et pixels sur un écran HiDPI. |
| **Bonnes pratiques** | Vendorer un fichier généré une fois pour toutes (comme celui de GLAD) plutôt que d'en dépendre à chaque build ; réserver cette pratique aux fichiers qui n'évoluent pas régulièrement. Exprimer les vitesses en unités par seconde, recalculer le delta time à chaque image et le plafonner ; ne jamais s'appuyer sur le vsync pour régler la vitesse. Comparer une image à la limite de la carte avant de l'envoyer, avec un message qui nomme l'image, ses dimensions et la limite. Boucler sur `glGetError()` jusqu'à `GL_NO_ERROR` et nommer l'étape contrôlée. Journaliser fabricant, carte et version au démarrage pour reconnaître la machine d'un rapport de bogue ; vérifier la taille de fenêtre demandée contre celle de l'écran. |
