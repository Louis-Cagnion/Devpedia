---
order: 4
---

# Tampons, textures et shaders OpenGL

Le [chapitre précédent](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) ouvre une fenêtre et fait tourner une boucle de rendu, mais n'y dessine encore rien. Pour afficher un objet, il faut envoyer ses données à la **carte graphique** (le processeur spécialisé dans le dessin, aussi appelé GPU) et lui fournir les petits programmes qui les transforment en pixels. Ce chapitre couvre les trois ingrédients : les **tampons** (les sommets), les **textures** (les images) et les **shaders** (les programmes).

> **Vocabulaire :** en OpenGL, presque tout est un **objet**, c'est-à-dire une ressource gardée côté carte graphique que le programme ne manipule que par un **identifiant entier** (un `GLuint`). On demande à OpenGL de créer l'objet (`glGen...`), on le **lie** (`glBind...`) pour dire « les prochaines commandes visent celui-ci », puis on le remplit ou on le configure.

## Les tampons : VBO, EBO et VAO

Un **tampon** (*buffer*) est une zone de mémoire de la carte graphique. Trois objets travaillent ensemble pour décrire une forme :

| Objet | Nom complet | Contient | Sert à |
|---|---|---|---|
| **VBO** | *Vertex Buffer Object* | Les sommets : position, coordonnée de texture, normale... | Stocker les données une seule fois côté carte graphique |
| **EBO** | *Element Buffer Object* | Des **indices** : quels sommets forment chaque triangle | Réutiliser un même sommet dans plusieurs triangles |
| **VAO** | *Vertex Array Object* | Aucune donnée : la **configuration** (quel VBO, comment le lire, quel EBO) | Retrouver toute cette configuration d'un seul `glBindVertexArray` |

Pourquoi un EBO : un carré (*quad*) se dessine avec 2 triangles, donc 6 sommets, alors qu'il n'a que 4 coins. Avec des indices, les 4 coins sont stockés une fois et les triangles s'écrivent `0 3 2` et `0 2 1`, comme les lignes `f` d'un fichier [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong).

```c
/* x      y     z      u     v      <- 5 floats par sommet (position, puis texture) */
float vertices[] = {
	 0.5f,  0.5f, 0.0f,  1.0f, 1.0f,   /* sommet 0 : haut droite */
	 0.5f, -0.5f, 0.0f,  1.0f, 0.0f,   /* sommet 1 : bas droite */
	-0.5f, -0.5f, 0.0f,  0.0f, 0.0f,   /* sommet 2 : bas gauche */
	-0.5f,  0.5f, 0.0f,  0.0f, 1.0f,   /* sommet 3 : haut gauche */
};
unsigned int indices[] = {0, 3, 2,  0, 2, 1};   /* deux triangles, sens antihoraire */

GLuint vao, vbo, ebo;
glGenVertexArrays(1, &vao);                     /* crée les trois objets (identifiants) */
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);

glBindVertexArray(vao);                         /* tout ce qui suit est mémorisé dans ce VAO */
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof vertices, vertices, GL_STATIC_DRAW);  /* copie vers la carte */
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);     /* l'EBO lié ici est mémorisé par le VAO */
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof indices, indices, GL_STATIC_DRAW);

/* attribut 0 : 3 floats (position), un sommet = 5 floats, lecture à partir de l'octet 0 */
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)0);
glEnableVertexAttribArray(0);
/* attribut 1 : 2 floats (texture), à partir de l'octet 12 (3 floats plus loin) */
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                           /* fin de l'enregistrement */

/* dans la boucle de rendu : */
glBindVertexArray(vao);                         /* rappelle toute la configuration */
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);   /* dessine 6 indices = 2 triangles */
```

`GL_STATIC_DRAW` est une indication d'usage : données écrites une fois, dessinées souvent (l'inverse, `GL_DYNAMIC_DRAW`, annonce des mises à jour fréquentes).

| Piège | Pourquoi | Parade |
|---|---|---|
| `sizeof` d'un pointeur au lieu du tableau | `sizeof(ptr)` vaut 8 octets, pas la taille des données : le tampon est presque vide | Garder la taille du tableau, ou la passer explicitement (nombre de sommets x taille d'un sommet) |
| Pas et décalage donnés en nombre de `float` | `glVertexAttribPointer` attend des **octets** | Multiplier par `sizeof(float)`, comme ci-dessus |
| Délier l'EBO (`glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0)`) tant que le VAO est lié | L'EBO fait partie de l'état du VAO : il est retiré du VAO | Délier le VAO d'abord (ou ne pas délier l'EBO) |
| Dessiner sans VAO lié | Le profil *core* d'OpenGL refuse de dessiner sans VAO | Toujours lier un VAO avant `glDraw...` |
| Oublier de libérer | Les objets restent en mémoire de la carte tant qu'on ne les supprime pas | `glDeleteBuffers`, `glDeleteVertexArrays` à la fermeture |

## Les textures : une image collée sur la surface

Une **texture** est une image gardée côté carte graphique. Chaque sommet porte une coordonnée de texture `(u, v)` entre 0 et 1 (les colonnes `u v` du tableau ci-dessus) : la carte interpole ces coordonnées sur le triangle et lit l'image à cet endroit pour chaque pixel (voir [le fichier image référencé par le `.mtl`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#le-fichier-image-reference-par-le-mtl)). Les pixels s'obtiennent par exemple en lisant un [fichier PPM](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#le-format-ppm-p6-une-texture-sans-bibliotheque).

```c
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);          /* lignes de pixels sans remplissage (voir plus bas) */
GLuint tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);              /* les commandes suivantes visent cette texture */
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0,
             GL_RGB, GL_UNSIGNED_BYTE, pixels); /* envoie les pixels (3 octets chacun) */
glGenerateMipmap(GL_TEXTURE_2D);                /* versions réduites, voir plus bas */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   /* si u sort de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);   /* si v sort de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);  /* image réduite */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);                /* image agrandie */
```

### `GL_UNPACK_ALIGNMENT` : les lignes de pixels alignées sur 4 octets

Par défaut, OpenGL suppose que **chaque ligne de pixels commence à une adresse multiple de 4 octets** et lit le remplissage manquant. Un fichier comme le PPM, lui, range les lignes **sans aucun remplissage**. Pour des pixels de 3 octets (rouge, vert, bleu), le désaccord apparaît dès que la largeur n'est pas un multiple de 4 :

| Largeur (pixels) | Octets réels par ligne | Octets lus par OpenGL | Résultat |
|---|---|---|---|
| 1 | 3 | 4 | Décalé |
| 2 | 6 | 8 | Décalé |
| 3 | 9 | 12 | Décalé |
| 4 | 12 | 12 | Correct |
| 5 | 15 | 16 | Décalé |
| 6 | 18 | 20 | Décalé |

Le symptôme : une image **cisaillée** (chaque ligne glisse un peu plus que la précédente) et des couleurs fausses, uniquement pour certaines largeurs. Pire, la dernière ligne est lue jusqu'à 3 octets au-delà de la fin du tableau : une lecture hors limites. Parade : `glPixelStorei(GL_UNPACK_ALIGNMENT, 1)` **avant** `glTexImage2D`, qui dit « mes lignes sont compactes ». Avec 4 octets par pixel (rouge, vert, bleu, transparence), la ligne est toujours un multiple de 4 et le problème n'existe pas.

### Mipmaps, filtres et répétition

Un objet éloigné couvre peu de pixels à l'écran : la carte lit alors une grande image au hasard de quelques points, et l'image scintille. Les **mipmaps** sont des copies de la texture réduites de moitié à chaque niveau (1/2, 1/4, 1/8...), `glGenerateMipmap` les calcule d'un appel (à faire **après** `glTexImage2D`). La carte choisit le niveau adapté à la taille à l'écran. Coût : un tiers de mémoire en plus (1/4 + 1/16 + ... tend vers 1/3).

| Réglage | Valeur | Effet |
|---|---|---|
| Filtre | `GL_NEAREST` | Prend le pixel le plus proche : net, en blocs visibles |
| Filtre | `GL_LINEAR` | Mélange les 4 pixels voisins : lisse |
| Filtre de réduction (`MIN`) | `GL_LINEAR_MIPMAP_LINEAR` | Lisse, et mélange aussi deux niveaux de mipmap |
| Répétition | `GL_REPEAT` | L'image se répète au-delà de 0..1 |
| Répétition | `GL_MIRRORED_REPEAT` | Elle se répète en miroir |
| Répétition | `GL_CLAMP_TO_EDGE` | Le dernier pixel du bord se prolonge |

> **Piège :** le filtre de réduction par défaut attend des mipmaps. Sans `glGenerateMipmap` ni changement du filtre `MIN`, la texture est dite **incomplète** et s'affiche **noire**, sans aucune erreur. Soit générer les mipmaps, soit régler `GL_TEXTURE_MIN_FILTER` sur `GL_LINEAR`. Et le filtre d'agrandissement (`MAG`) n'accepte jamais une valeur « mipmap » : l'erreur `GL_INVALID_ENUM` est signalée dans le drapeau d'erreur, pas par un plantage.

## Les shaders : les programmes de la carte graphique

Un **shader** est un petit programme écrit en **GLSL** ([*OpenGL Shading Language*](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language), un langage proche du C) qui s'exécute sur la carte graphique, en parallèle pour des milliers de sommets ou de pixels à la fois. Le dessin d'un triangle traverse une chaîne d'étages :

```text
sommets (VBO)
   |
   v
[ vertex shader ]      un appel PAR SOMMET : calcule sa position à l'écran
   |
   v
assemblage             regroupe les sommets en triangles
   |
   v
[ geometry shader ]    OPTIONNEL, un appel PAR TRIANGLE : peut en émettre 0, 1 ou plusieurs
   |
   v
rasterisation          découpe chaque triangle en fragments (les pixels qu'il couvre)
   |
   v
[ fragment shader ]    un appel PAR FRAGMENT : calcule sa couleur
   |
   v
test de profondeur, puis écran
```

| Étage | S'exécute | Entrée | Sortie |
|---|---|---|---|
| Vertex | Une fois par sommet | Les attributs du VBO (position, `u v`...) | La position à l'écran (`gl_Position`) et des valeurs à transmettre |
| Geometry | Une fois par triangle (optionnel) | Les 3 sommets du triangle | 0 à N sommets émis |
| Fragment | Une fois par pixel couvert | Les valeurs transmises, **interpolées** entre les sommets | La couleur finale |

Deux mots reviennent dans tout shader. Un **`uniform`** est une valeur fixée par le programme C, **identique** pour tous les sommets et pixels d'un même dessin (direction de la lumière, matrice, temps). Un **`in`/`out`** passe une valeur d'un étage au suivant (un `out` du vertex shader devient un `in` du suivant, **appariés par le nom**).

### Exemple : une normale plate par triangle, calculée au geometry shader

La **normale** est le vecteur perpendiculaire à une surface, nécessaire à l'éclairage (voir [le modèle de Phong](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Calculée par triangle, elle donne un rendu à facettes. Le geometry shader reçoit les 3 sommets d'un coup, donc peut la calculer sans que le fichier ne la fournisse :

```glsl
#version 330 core
layout(triangles) in;                           // reçoit un triangle entier : 3 sommets
layout(triangle_strip, max_vertices = 3) out;   // en renvoie un, de 3 sommets au plus
in vec3 world_pos[];                            // position de chaque sommet (venue du vertex shader)
out vec3 flat_normal;                           // même normale pour les 3 sommets émis

void main()
{
	vec3 n = normalize(cross(world_pos[1] - world_pos[0],
	                         world_pos[2] - world_pos[0]));   // perpendiculaire au triangle
	for (int i = 0; i < 3; i++)
	{
		gl_Position = gl_in[i].gl_Position;     // position écran déjà calculée
		flat_normal = n;
		EmitVertex();                           // émet ce sommet
	}
	EndPrimitive();                             // termine le triangle
}
```

Le fragment shader qui l'utilise éclaire la face selon l'angle avec la lumière :

```glsl
#version 330 core
in vec3 flat_normal;                            // normale transmise (même valeur sur tout le triangle)
uniform vec3 light_dir;                         // direction de la lumière, fixée par le programme C
out vec4 color;                                 // couleur finale du pixel

void main()
{
	float light = max(dot(normalize(flat_normal), -light_dir), 0.0);   // 0 si la face tourne le dos
	color = vec4(vec3(0.8) * light, 1.0);       // gris x intensité, opaque
}
```

> **Piège :** un triangle dégénéré (trois sommets alignés) a un produit vectoriel nul, et `normalize` d'un vecteur nul donne un résultat indéfini (possiblement `NaN`) : un triangle noir ou des pixels corrompus. Ensuite, le **sens** de la normale dépend de l'ordre des sommets (antihoraire = face avant) : un maillage à l'envers a toutes ses normales retournées.

### Éclairage double face : `gl_FrontFacing`

Un triangle a deux côtés. Le côté **avant** est celui d'où l'on voit ses sommets dans le sens **antihoraire** à l'écran (*CCW*, *counter-clockwise*) : c'est l'**ordre d'enroulement** (*winding order*) des sommets qui le décide, pas la géométrie. Par défaut, OpenGL considère l'antihoraire comme l'avant (réglage `glFrontFace(GL_CCW)`) ; pour l'élimination des faces qui s'appuie sur la même notion, voir [dessiner un objet transparent](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#dessiner-un-objet-transparent).

La normale calculée par `cross` (le produit vectoriel, voir [Vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) pointe vers l'extérieur du côté avant. Vu par son dos, un triangle a donc une normale qui s'éloigne de l'observateur et de la lumière : le `dot` (produit scalaire) du fragment shader ci-dessus devient négatif, `max(..., 0.0)` le ramène à 0 et le pixel est noir.

| Situation | Côté vu | Normale | Rendu avec l'éclairage ci-dessus |
|---|---|---|---|
| Maillage fermé, sommets en antihoraire | avant | vers l'extérieur | éclairé |
| Maillage fermé, sommets en sens inverse | « dos » (alors que c'est l'extérieur) | vers l'intérieur | **noir** |
| Surface ouverte (feuille, drapeau) vue par ses deux côtés | avant puis dos | d'un seul côté | éclairée d'un côté, **noire** de l'autre |

Le fragment shader reçoit pour cela la variable prédéfinie **`gl_FrontFacing`** (booléen) : vrai si le triangle est vu par son côté avant. Il suffit de retourner la normale quand elle est fausse :

```glsl
#version 330 core
in vec3 flat_normal;                            // normale du triangle, orientée côté avant
uniform vec3 light_dir;                         // direction de la lumière
out vec4 color;                                 // couleur finale du pixel

void main()
{
	vec3 n = normalize(flat_normal);            // vecteur de longueur 1
	if (!gl_FrontFacing)                        // triangle vu par son dos
		n = -n;                                 // normale retournée : elle regarde l'observateur
	float light = max(dot(n, -light_dir), 0.0);
	color = vec4(vec3(0.8) * light, 1.0);
}
```

Cela suppose que l'élimination des faces arrière (`GL_CULL_FACE`) soit **désactivée** : une face éliminée n'atteint jamais le fragment shader.

> **Piège :** l'éclairage double face masque un maillage à l'envers au lieu de le réparer : ses normales restent fausses pour tout autre usage (reflets, ombres, élimination des faces). Corriger la donnée en inversant l'ordre de deux sommets de chaque triangle. Un **miroir** (échelle négative sur un seul axe) inverse aussi l'enroulement : un objet retourné par une échelle `-1` devient noir sans que le fichier ait changé.

**Mesurer le résultat.** Un maillage « noir » se vérifie sur une capture d'écran par la **proportion de pixels noirs**. Une comparaison pixel à pixel avec une image de référence échoue : la luminosité pulse au fil du temps, deux captures du même rendu diffèrent. Choisir un fond qui n'est pas noir (sinon le fond compte comme du noir), puis compter :

```c
/* Proportion (0 à 1) de pixels presque noirs dans une image RGB de n pixels ; -1 si n vaut 0. */
static double dark_ratio(const unsigned char *rgb, size_t n)
{
	size_t dark = 0;

	if (n == 0)                                 /* image vide : aucune proportion à calculer */
		return -1;
	for (size_t i = 0; i < n; i++)
		if (rgb[3 * i] < 16 && rgb[3 * i + 1] < 16 && rgb[3 * i + 2] < 16)   /* R, V et B sous 16 sur 255 */
			dark++;
	return (double)dark / (double)n;
}
```

Un maillage à l'envers donne une proportion proche de celle de la silhouette entière ; le même maillage corrigé (ou éclairé en double face) la fait chuter. Mesuré avec les trois shaders de ce chapitre (le geometry shader et les deux fragment shaders, sans modification) sur un cube de 12 triangles rendu dans une image de 256 × 256 à fond bleu, la lumière venant de l'observateur et l'élimination des faces désactivée, sur trois moteurs (AMD Radeon 680M avec Mesa, NVIDIA RTX 3070, `llvmpipe`) avec des résultats identiques : sommets dans le bon sens et éclairage de base, `dark_ratio` = **0,000** ; sommets inversés et éclairage de base, **0,425** (le fond occupe 0,575 de l'image : c'est exactement la silhouette du cube) ; sommets inversés avec `gl_FrontFacing`, **0,000**.

### Compiler, lier et utiliser un programme

Le code GLSL est du **texte**, compilé à l'exécution par le **pilote** de la carte (voir [GLFW et GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Une faute de frappe n'est donc détectée qu'au lancement du programme : il faut lire le journal du compilateur.

```c
/* Compile un shader ; en cas d'échec, affiche le journal du compilateur et renvoie 0. */
static GLuint compile_shader(GLenum type, const char *source)
{
	GLuint shader = glCreateShader(type);        /* type : GL_VERTEX_SHADER, GL_GEOMETRY_SHADER... */
	GLint ok;

	glShaderSource(shader, 1, &source, NULL);    /* confie le texte GLSL */
	glCompileShader(shader);
	glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
	if (!ok)
	{
		char log[1024];
		glGetShaderInfoLog(shader, sizeof log, NULL, log);   /* ligne et cause de l'erreur */
		fprintf(stderr, "shader : %s\n", log);
		glDeleteShader(shader);
		return 0;
	}
	return shader;
}
```

L'édition de liens (`glAttachShader` pour chaque étage, `glLinkProgram`, puis `glGetProgramiv(..., GL_LINK_STATUS, ...)` et `glGetProgramInfoLog`) suit exactement le même schéma, avec les noms `program` à la place de `shader`. Une fois lié, `glUseProgram(program)` l'active pour les dessins suivants.

Une valeur `uniform` se fixe ainsi, **après** `glUseProgram` :

```c
GLint loc = glGetUniformLocation(program, "light_dir");   /* numéro de l'emplacement */
if (loc == -1)
	fprintf(stderr, "uniform light_dir absent\n");
else
	glUniform3f(loc, 0.0f, -1.0f, 0.0f);                  /* la lumière tombe vers le bas */
```

> **Piège :** `glGetUniformLocation` renvoie **-1** si le nom n'existe pas, et `glUniform...` avec -1 est **ignoré en silence**. Deux causes : une faute de frappe dans le nom, ou une variable que le compilateur a **supprimée parce qu'elle ne sert à rien** dans le shader. Tester `-1` et le signaler **une seule fois** (jamais à chaque image de la boucle de rendu).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un VBO stocke les sommets, un EBO les indices des triangles, un VAO mémorise la configuration de lecture : on le lie, puis on dessine. Une texture est une image côté carte graphique, lue grâce aux coordonnées `(u, v)` ; ses lignes sont supposées alignées sur 4 octets, et des mipmaps évitent le scintillement à distance. Un programme GLSL enchaîne vertex shader (par sommet), geometry shader optionnel (par triangle) et fragment shader (par pixel) ; un `uniform` est identique pour tout un dessin. Le côté avant d'un triangle est celui où ses sommets apparaissent dans le sens antihoraire ; `gl_FrontFacing` permet au fragment shader de retourner la normale d'une face vue par son dos. |
| **Outils utilisables** | `glGenBuffers`/`glBufferData`/`glVertexAttribPointer`/`glDrawElements`, `glPixelStorei`, `glGenerateMipmap`, `glTexParameteri`, `glCompileShader` et ses journaux, `glGetUniformLocation`. Documentation : [Vertex Specification](https://www.khronos.org/opengl/wiki/Vertex_Specification), [Texture](https://www.khronos.org/opengl/wiki/Texture), [Geometry Shader](https://www.khronos.org/opengl/wiki/Geometry_Shader). |
| **Pièges à éviter** | `sizeof` d'un pointeur, pas et décalage en nombre de `float` au lieu d'octets, EBO délié avant le VAO, dessin sans VAO. Largeur de texture non multiple de 4 sans `GL_UNPACK_ALIGNMENT` à 1 (image cisaillée, lecture hors limites). Texture sans mipmaps avec le filtre par défaut (noire, sans erreur). Triangle dégénéré dans une normale calculée au shader. Maillage à l'envers (noir avec un éclairage à une seule face), échelle négative qui inverse l'enroulement. Uniform absent (-1) ignoré en silence. |
| **Bonnes pratiques** | Lire le journal du compilateur et de l'édition de liens, et l'afficher avec la cause réelle. Signaler une erreur de `uniform` une seule fois. Fixer `GL_UNPACK_ALIGNMENT` avant d'envoyer une image dont les lignes sont compactes. Générer les mipmaps ou régler le filtre `MIN`. Supprimer les objets à la fermeture. Réparer un maillage à l'envers en inversant deux sommets par triangle plutôt que de masquer le défaut en double face ; contrôler un rendu par la proportion de pixels noirs d'une capture. |
