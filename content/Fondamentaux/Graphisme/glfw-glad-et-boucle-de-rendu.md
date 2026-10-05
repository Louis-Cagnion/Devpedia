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

### Un seul chronomètre par usage

Un **chronomètre** désigne ici une variable qui mémorise un instant (comme `dernier_instant` ci-dessus). Quand un même chronomètre sert à **deux usages** (mesurer la durée d'une image **et** espacer les étapes d'un fondu, c'est-à-dire d'une transition progressive d'opacité), l'un des deux est faux. Le cas typique :

```c
double now = glfwGetTime();

if (now - prev_time >= FADE_STEP)   /* limiteur du fondu : une étape tous les FADE_STEP */
{
	frame_time = now - prev_time;   /* depuis la dernière ÉTAPE, pas la dernière image */
	prev_time = now;
	alpha += 0.05;                  /* alpha : opacité de 0 (transparent) à 1 (opaque) */
}
position += speed * frame_time;     /* utilisé à CHAQUE image, rafraîchi à chaque ÉTAPE */
```

Ici `FADE_STEP` vaut 0,016 s. `frame_time` ne se rafraîchit qu'à chaque étape de fondu, mais il est utilisé à chaque image : plus la machine produit d'images entre deux étapes, plus le mouvement est multiplié. Mesure sur une simulation d'une seconde, vitesse 5 unités par seconde (la bonne distance est donc 5) :

| FPS | Distance avec un chronomètre partagé | Avec un chronomètre par usage |
|---|---|---|
| 30 ou 60 | 5,0 | 5,0 |
| 144 | 14,8 (3 fois trop) | 5,0 |
| 1 000 | 79,0 (16 fois trop) | 5,0 |
| 2 500 | 199,7 (**40 fois** trop) | 5,0 |

Sur un écran à 60 Hz avec vsync, le défaut ne se voit pas (une image dure plus que le pas du fondu) : il apparaît sur un écran rapide ou sans vsync. Le correctif tient en trois règles : Mesuré sur une vraie boucle GLFW (écran à 144 Hz, déplacement de 5 unités par seconde pendant 1 s) : avec vsync (147 images) le chronomètre partagé donne **14,70** ; sans vsync (18 037 images) **1 434,21**, soit 287 fois trop ; avec un chronomètre par usage, 4,98 à 5,00 dans tous les cas.

| Règle | Ce que ça change |
|---|---|
| **Un chronomètre par usage** | La durée de l'image se recalcule à chaque image ; rien d'autre n'y touche |
| **Plafonner** cette durée (`MAX_FRAME_TIME`, ex. 0,1 s) | Une pause ne propulse plus l'objet (voir le piège précédent) |
| **Exprimer un fondu par sa durée**, pas par un nombre d'étapes | `alpha = écoulé / FADE_DURATION` (0,5 s ici), donc le même temps sur toute machine ; le limiteur devient inutile |

```c
double now = glfwGetTime();
double frame_time = now - last_frame;     /* durée de l'image, recalculée à chaque tour */

last_frame = now;
if (frame_time > MAX_FRAME_TIME)          /* après une pause */
	frame_time = MAX_FRAME_TIME;
position += speed * frame_time;
fade_elapsed += frame_time;               /* le fondu cumule du temps réel */
alpha = fminf(fade_elapsed / FADE_DURATION, 1.0f);   /* fminf : plafonne à 1 */
```

> **Piège (mesurer à une seule cadence) :** un mouvement maintenu (touche enfoncée, rotation continue) qui paraît juste à 60 FPS peut être faux à une autre cadence. Le mesurer à **plusieurs cadences** : avec vsync, puis sans. Sans vsync, Mesa se règle par la [variable d'environnement](/?c=shells&s=bash&p=variables-denvironnement) `vblank_mode=0` et le pilote NVIDIA par `__GL_SYNC_TO_VBLANK=0` (`vblank_mode=0 ./programme`). L'angle ou la distance parcourus après une seconde doivent être les mêmes dans tous les cas. Mesuré sur un portable à deux cartes : `vblank_mode=0` désactive bien le vsync de Mesa (17 447 images en 1 s au lieu de 147), mais `__GL_SYNC_TO_VBLANK=0` n'a eu **aucun effet** quand le rendu est délégué à la carte NVIDIA (`__NV_PRIME_RENDER_OFFLOAD=1` : 169 images au lieu de 147) ; `glfwSwapInterval(0)` dans le programme, lui, marche partout (7 556 images avec NVIDIA, 17 244 avec Mesa). Autre limite de l'égalité des distances : une image plus longue que `MAX_FRAME_TIME` est plafonnée, donc le temps en trop est perdu (un arrêt d'environ 0,3 s au démarrage du pilote NVIDIA a donné 3,81 au lieu de 5).

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

## Comment OpenGL connaît la machine : du programme au matériel

OpenGL n'est pas un programme : c'est une **spécification**, un document (maintenu par le consortium [Khronos](https://www.khronos.org/opengl/)) qui décrit chaque fonction, ses paramètres et son comportement. Aucun code n'est livré avec ce document : chaque fabricant écrit le sien dans son **pilote** (le logiciel qui traduit les appels OpenGL en ordres compris par sa carte). D'où `glGetString(GL_VENDOR)` (voir plus haut), et un même programme qui se comporte différemment d'une machine à l'autre.

Sous Linux, un appel comme `glClear` traverse ces couches :

```
Votre programme              appelle glClear, glDrawArrays...
      │  GLAD et glfwGetProcAddress retrouvent l'adresse de chaque fonction
      ▼
Bibliothèque d'accès         libGL.so.1 (GLVND) : choisit quel pilote utiliser
      ▼
Pilote OpenGL                Mesa (AMD, Intel) ou pilote propriétaire NVIDIA
      ▼
Noyau Linux                  pilote noyau (amdgpu, i915, nvidia...) via le DRM
      ▼
Matériel                     la carte, branchée sur le bus PCI
```

| Couche | Rôle |
|---|---|
| **Bibliothèque d'accès** (`libGL`) | Point d'entrée unique. **[GLVND](https://github.com/NVIDIA/libglvnd)** (*GL Vendor-Neutral Dispatch*, « aiguillage neutre ») laisse plusieurs pilotes cohabiter et choisit celui qui correspond à la carte utilisée. |
| **Pilote OpenGL** | Exécute réellement les fonctions. **[Mesa](https://www.mesa3d.org/)** est le pilote libre (`radeonsi` pour AMD, `iris` pour Intel, `llvmpipe` pour dessiner avec le processeur quand il n'y a pas de carte) ; NVIDIA fournit son propre pilote propriétaire. |
| **Pilote noyau** | Le [noyau](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#espace-utilisateur-vs-espace-noyau) (le cœur du système, seul autorisé à parler au matériel) possède un pilote par famille de cartes. Le **[DRM](https://docs.kernel.org/gpu/drm-uapi.html)** (*Direct Rendering Manager*) est le sous-système qui permet à plusieurs programmes de se partager la carte ; il s'expose par des fichiers dans `/dev/dri`. |
| **Matériel** | La carte graphique, branchée sur le bus **PCI** (le circuit qui relie la carte mère à ses cartes d'extension). |

Chaque couche s'observe depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (`grep` ne garde que les lignes qui contiennent un motif ; le `|` envoie la sortie de la commande de gauche à celle de droite : voir les [redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes)) :

```bash
lspci | grep -iE "vga|3d"              # lspci liste les périphériques PCI : la ou les cartes graphiques
ls /dev/dri                            # fichiers du DRM : cardN (une par carte), renderDN (calcul sans écran)
lsmod | grep -E "amdgpu|i915|nouveau|nvidia"   # lsmod liste les pilotes chargés dans le noyau
glxinfo -B | grep -i renderer          # glxinfo (paquet mesa-utils) : le pilote OpenGL réellement en service
```

`GL_RENDERER` empile d'ailleurs plusieurs de ces couches dans un seul texte. Forme typique sous Mesa, qui s'appuie sur [LLVM](https://llvm.org/) (valeurs d'exemple) :

```
AMD Radeon RX 6600 (radeonsi, navi23, LLVM 15.0.6, DRM 3.54, 6.1.0-18-amd64)
 │                  │        │       │               │        └ version du noyau
 │                  │        │       │               └ version du DRM
 │                  │        │       └ LLVM : bibliothèque qui compile les shaders pour la carte
 │                  │        └ puce de la carte
 │                  └ pilote Mesa
 └ nom de la carte
```

### Quand il n'y a pas de carte : `llvmpipe`

Dans une [machine virtuelle](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos), un [conteneur](/?c=infrastructure-devops&s=docker&p=concepts-de-base), [WSL](https://learn.microsoft.com/fr-fr/windows/wsl/) sans pilote graphique ou une session distante, Mesa bascule sur `llvmpipe` : le processeur dessine à la place de la carte. Le programme fonctionne, mais lentement, et `GL_RENDERER` commence par `llvmpipe`. On peut le forcer pour simuler une machine sans carte, grâce à une **variable d'environnement** (un réglage nommé que le shell transmet aux programmes qu'il lance, voir les [variables d'environnement](/?c=shells&s=bash&p=variables-denvironnement)) :

```bash
LIBGL_ALWAYS_SOFTWARE=1 ./programme    # la variable ne vaut que pour ce lancement
```

### Plusieurs cartes graphiques

Un portable a souvent une carte **intégrée** (dans le processeur, économe) et une carte **dédiée** (puissante). Par défaut le système choisit la première ; on désigne l'autre par variable d'environnement, le temps d'un lancement :

| Pilote | Lancer sur la carte dédiée |
|---|---|
| Mesa (AMD, Intel) | `DRI_PRIME=1 ./programme` |
| NVIDIA propriétaire | `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia ./programme` |

Les deux cartes n'ont ni les mêmes limites (`GL_MAX_TEXTURE_SIZE`...) ni la même version d'OpenGL : ce que le programme lit au démarrage dépend de la carte qui a créé le contexte.

Mesuré sur un portable à deux cartes (AMD intégrée, NVIDIA dédiée), avec un programme qui demande un contexte OpenGL 3.3 « core » et lit `GL_RENDERER`, `GL_VERSION` et `GL_MAX_TEXTURE_SIZE` :

| Lancement | `GL_RENDERER` | `GL_VERSION` | `GL_MAX_TEXTURE_SIZE` |
|---|---|---|---|
| par défaut | `AMD Radeon 680M (radeonsi, rembrandt, LLVM 20.1.2, DRM 3.64, 7.0.0-34-generic)` | `4.6 (Core Profile) Mesa 25.2.8` | 16384 |
| `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia` | `NVIDIA GeForce RTX 3070 Laptop GPU/PCIe/SSE2` | `3.3.0 NVIDIA 595.91.07` | 32768 |
| `LIBGL_ALWAYS_SOFTWARE=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |
| `DRI_PRIME=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |

La carte change bien tout ce que le programme lit, version comprise (NVIDIA renvoie la version demandée, Mesa la plus haute qu'il fournit). La dernière ligne est un piège : `DRI_PRIME=1` suppose que la carte dédiée utilise aussi un pilote Mesa. Ici elle est NVIDIA propriétaire : Mesa n'arrive pas à charger `nvidia-drm` (messages `glx: failed to create dri3 screen` et `failed to load driver: nvidia-drm`) et **retombe sur `llvmpipe`** sans s'arrêter. Vérifier `GL_RENDERER` plutôt que de croire que la carte dédiée est utilisée.

### Et sur Windows et macOS ?

| Système | Qui fournit OpenGL |
|---|---|
| **Linux** | Les couches ci-dessus (GLVND, Mesa ou pilote NVIDIA, noyau). |
| **Windows** | `opengl32.dll` redirige vers le pilote du fabricant, installé avec les pilotes de la carte. Sans lui, Windows retombe sur une version logicielle limitée à OpenGL 1.1. |
| **macOS** | Le système fournit lui-même OpenGL, figé à la version 4.1 et abandonné par Apple. |

> **Piège :** un pilote absent ou trop ancien ne plante pas toujours : `glfwCreateWindow` renvoie `NULL`, ou `gladLoadGLLoader` échoue, ou la version lue est plus basse que prévu. Afficher la cause réelle de GLFW plutôt qu'un message générique :

```c
GLFWwindow *window = glfwCreateWindow(800, 600, "scop", NULL, NULL);

if (!window)                                /* pilote absent, trop ancien, ou version demandee non fournie */
{
	const char *description = NULL;         /* texte de GLFW qui explique l'echec */

	glfwGetError(&description);             /* lit la derniere erreur de GLFW (description peut rester NULL) */
	fprintf(stderr, "fenetre impossible : %s\n", description ? description : "cause inconnue");
	return -1;
}
```

Mesuré en demandant OpenGL 9.9 (une version qui n'existe pas) sous X11 : `fenetre impossible : GLX: Failed to create context: BadMatch (invalid parameter attributes)`.

Bonne pratique : tester sur les deux cartes d'un portable, et avec `LIBGL_ALWAYS_SOFTWARE=1`, avant de dire que le programme « marche partout ».

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GLFW crée la fenêtre et son contexte OpenGL ; GLAD charge ensuite les fonctions OpenGL modernes via `glfwGetProcAddress()`. Le double buffering (`glfwSwapBuffers()`) évite une image affichée à moitié dessinée. Une boucle de rendu répète : événements, effacement, dessin, échange des tampons. Le delta time (durée de l'image précédente, via `glfwGetTime()`) rend les vitesses indépendantes des FPS ; le vsync (`glfwSwapInterval(1)`) cale l'affichage sur l'écran. Les limites de la carte (taille de texture, de zone de dessin) changent d'une machine à l'autre : on les lit ; OpenGL ne signale une erreur que par un drapeau qu'on lit avec `glGetError()`. `glGetString` identifie le pilote ; la mémoire de la carte n'a pas de requête standard (extensions) ; la taille de l'écran se demande à GLFW. OpenGL n'est qu'une spécification : le code vient du pilote du fabricant (Mesa ou NVIDIA sous Linux), qui parle au noyau (DRM) puis à la carte ; sans carte, `llvmpipe` dessine avec le processeur ; avec plusieurs cartes, une variable d'environnement choisit la carte. Un chronomètre par usage : la durée d'une image se recalcule à chaque image, un fondu s'exprime par sa durée. |
| **Outils utilisables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`, `glGetString`, `glfwGetPrimaryMonitor`/`glfwGetVideoMode`, `glfwExtensionSupported`, `glfwGetError`, `lspci`, `lsmod`, `glxinfo -B`, `LIBGL_ALWAYS_SOFTWARE`, `DRI_PRIME`. |
| **Pièges à éviter** | Appeler GLAD avant `glfwMakeContextCurrent()`. Pointer `-I` sur le mauvais niveau de dossier pour les headers générés par GLAD. Oublier `glClear()` avant de redessiner. Déplacer un objet d'une distance fixe par image. Ne rafraîchir le delta time qu'à intervalle régulier. Laisser un delta géant après une pause. Supposer une limite de la carte au lieu de la lire, appeler `glGetIntegerv` sans contexte actif, lire une seule erreur au lieu de vider la pile, répéter le même message à chaque image. Afficher le résultat de `glGetString` sans tester `NULL`, prendre `GL_MAX_ELEMENTS_INDICES` pour une limite, ouvrir une fenêtre plus grande que l'écran, confondre coordonnées d'écran et pixels sur un écran HiDPI. Conclure que le programme marche partout après un test sur une seule carte, ou ne pas afficher la cause d'un échec de `glfwCreateWindow`. Un même chronomètre pour la durée d'image et le limiteur d'un fondu (mouvement jusqu'à 40 fois trop rapide sans vsync), un fondu exprimé en nombre d'étapes. |
| **Bonnes pratiques** | Vendorer un fichier généré une fois pour toutes (comme celui de GLAD) plutôt que d'en dépendre à chaque build ; réserver cette pratique aux fichiers qui n'évoluent pas régulièrement. Exprimer les vitesses en unités par seconde, recalculer le delta time à chaque image et le plafonner ; ne jamais s'appuyer sur le vsync pour régler la vitesse. Comparer une image à la limite de la carte avant de l'envoyer, avec un message qui nomme l'image, ses dimensions et la limite. Boucler sur `glGetError()` jusqu'à `GL_NO_ERROR` et nommer l'étape contrôlée. Journaliser fabricant, carte et version au démarrage pour reconnaître la machine d'un rapport de bogue ; vérifier la taille de fenêtre demandée contre celle de l'écran. Tester sur chaque carte d'un portable et avec `LIBGL_ALWAYS_SOFTWARE=1`. Mesurer un mouvement maintenu à plusieurs cadences, avec et sans vsync. |
