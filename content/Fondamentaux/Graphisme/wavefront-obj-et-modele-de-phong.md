---
order: 2
---

# Le format Wavefront .obj et le modèle de Phong

Le [chapitre précédent](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) simule la 3D à partir d'une carte 2D, sans jamais charger de vrai maillage. Un moteur de rendu 3D moderne (OpenGL, Vulkan, Metal) part au contraire d'un objet modélisé dans un outil comme Blender, exporté dans un fichier texte qu'il faut lire et transformer en données exploitables par la carte graphique.

## Le format .obj : une instruction par ligne

Un fichier **.obj** (format Wavefront) liste, une ligne à la fois, les données géométriques d'un objet. Chaque ligne commence par un mot-clé qui indique le type d'instruction :

| Préfixe | Contenu | Exemple |
|---|---|---|
| `v` | Un sommet, en coordonnées x y z | `v 0.232406 -1.216630 1.133818` |
| `vt` | Une coordonnée de texture (pour plaquer une image sur la surface) | `vt 0.5 0.8` |
| `vn` | Un vecteur normal (orientation d'une surface, utile pour l'éclairage) | `vn 0.0 1.0 0.0` |
| `o` | Le nom de l'objet qui commence à cette ligne | `o Cube` |
| `f` | Une face, qui relie plusieurs sommets déjà déclarés | `f 16 2 3 17` |
| `mtllib` / `usemtl` | Référence vers un fichier de matériaux et le matériau à appliquer | `mtllib 42.mtl` |
| `s` | Active/désactive le lissage des normales pour les faces suivantes (groupe de lissage) | `s off` ou `s 1` |

> **Piège :** les indices utilisés dans une ligne `f` commencent à **1**, pas à 0. `f 16 2 3 17` désigne le 16e sommet déclaré par une ligne `v`, pas le 17e. C'est une source classique d'erreur par décalage d'un cran (*off-by-one*) chez qui écrit son premier analyseur de ce format, l'indexation habituelle des tableaux commençant à 0 dans la plupart des langages.

## Des faces à nombre de sommets variable

Une ligne `f` ne relie pas forcément trois sommets : un modeleur 3D exporte souvent des faces à 4 sommets (des quadrilatères, ou *quads*), voire davantage. Or la carte graphique ne sait dessiner nativement que des triangles (une surface à plus de 3 sommets n'est pas garantie d'être plane). Il faut donc **trianguler** : découper chaque face à 4+ sommets en plusieurs triangles, une étape à part entière du traitement du fichier, distincte de sa simple lecture.

```text
Face lue depuis le fichier :         Une fois triangulee :
f 1 2 3 4                            triangle 1 2 3
(un quad, 4 sommets)                 triangle 1 3 4
```

Cette méthode (relier systématiquement le premier sommet à chaque paire de sommets suivants) s'appelle la **triangulation en éventail** (*fan triangulation*). Elle est simple et rapide, mais elle suppose que la face est **convexe** : sur une face concave, un des triangles produits peut recouvrir une zone qui ne fait pas partie de la forme réelle (le triangle "traverse" l'encoche concave au lieu de la contourner).

Pour une face potentiellement concave, l'algorithme de référence est l'**ear clipping** (*découpe d'oreilles*) : plutôt que de fixer un sommet de référence, il retire un sommet à la fois, en ne l'acceptant que si le triangle qu'il forme avec ses deux voisins reste bien orienté (produit vectoriel local comparé à la normale de la face, voir [Vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) ET ne contient aucun autre sommet de la face. Le polygone rétrécissant à chaque retrait, une [liste doublement chaînée circulaire](/?c=langages-de-programmation&s=c&p=listes-chainees) est une structure bien adaptée pour l'implémenter : chaque retrait ne demande que de reconnecter les deux voisins du sommet retiré, sans décaler de tableau.

> **Bonne pratique :** garder la lecture du fichier (remplir une structure avec les données brutes) et la triangulation dans deux fonctions séparées plutôt que fusionnées. Chacune n'a alors qu'une seule raison de changer (voir [responsabilité unique et couplage](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)), et la triangulation peut être testée indépendamment du parseur.

### Vérifier qu'aucun sommet n'est piégé dans l'oreille

Le test d'orientation seul ne suffit pas : un triangle correctement orienté peut quand même "avaler" un autre sommet du polygone, qui devrait rester à l'extérieur. Il faut donc un second test, appliqué à chaque sommet restant du polygone (hors des 3 sommets du triangle candidat) : le **test du même côté** (*same-side test*), qui vérifie qu'un point donné se trouve à l'intérieur d'un triangle.

Principe : un point `P` est à l'intérieur du triangle `(A, B, C)` si et seulement s'il se trouve du même côté de chacune des 3 arêtes. Ce test réutilise exactement la même primitive géométrique que le test d'orientation (produit vectoriel de deux vecteurs, produit scalaire avec la normale de référence) : seuls les points croisés changent d'un appel à l'autre.

```text
côté 1 = (B-A) × (P-A) . normale
côté 2 = (C-B) × (P-B) . normale
côté 3 = (A-C) × (P-C) . normale

P est dedans si les 3 résultats ont le même signe (tous positifs, ou tous négatifs)
```

> **Bonne pratique :** une seule fonction utilitaire (produit vectoriel de 2 vecteurs + produit scalaire avec la normale) suffit à implémenter à la fois le test d'orientation ET les 3 tests de côté : seuls les points passés en paramètre changent. Éviter de dupliquer ce calcul dans plusieurs fonctions.

### Vérifier une triangulation : la formule `n - 2`

Peu importe l'algorithme (éventail ou ear clipping) et la forme du polygone (convexe ou concave), trianguler un polygone simple à `n` sommets produit toujours exactement `n - 2` triangles (conséquence directe du [théorème des deux oreilles](https://en.wikipedia.org/wiki/Two_ears_theorem) de Meisters (1975), qui garantit que tout polygone simple non-triangle possède au moins deux "oreilles" découpables). Un compte différent de `n - 2` en sortie est la preuve certaine d'un bug ; un compte correct ne prouve pas à lui seul que le découpage est géométriquement juste (à vérifier séparément, par exemple en traçant le polygone et ses diagonales).

## Le fichier .mtl et le modèle de Phong

Un `.obj` référence en général un fichier **.mtl** qui décrit l'apparence des surfaces :

```text
newmtl Material
Ns 96.078431
Ka 0.000000 0.000000 0.000000
Kd 0.640000 0.640000 0.640000
Ks 0.500000 0.500000 0.500000
illum 2
```

| Champ | Signification |
|---|---|
| `Ka` | Couleur ambiante : la couleur perçue même sans lumière directe |
| `Kd` | Couleur diffuse : la couleur de base de la surface sous une lumière directe |
| `Ks` | Couleur spéculaire : la couleur du reflet brillant |
| `Ns` | Exposant spéculaire (*shininess*) : plus il est élevé, plus le reflet est petit et net |

Ces quatre valeurs correspondent exactement aux termes du **modèle de Phong** (*Phong reflection model*), un algorithme d'éclairage classique en synthèse d'image qui décompose la lumière reçue par une surface en trois composantes combinées : ambiante, diffuse et spéculaire.

> **Piège :** un fichier `.mtl` ne définit en général qu'un seul matériau (donc une seule couleur) pour tout l'objet. Si le besoin est de distinguer visuellement des sous-parties différentes (par exemple une couleur par face), cette information doit venir d'ailleurs : le `.mtl` ne la fournit pas.

## L'indexation combinée `v/vt/vn` et la couture UV

Les exemples précédents (`f 16 2 3 17`) ne montrent qu'un seul indice par sommet, celui de la position (`v`). Une ligne `f` réelle référence en général plusieurs listes à la fois, un indice par coin de face et par liste, séparés par `/` :

| Syntaxe | Référence |
|---|---|
| `f 1 2 3` | Position uniquement (utilisé jusqu'ici pour simplifier) |
| `f 1/1 2/2 3/3` | Position **et** coordonnée de texture |
| `f 1/1/1 2/2/2 3/3/3` | Position, texture **et** normale |
| `f 1//1 2//2 3//3` | Position et normale, sans texture (le `//` laisse l'indice de texture vide) |

Pourquoi un indice par liste plutôt qu'un seul indice partagé : `v` (positions) et `vt` (coordonnées de texture) sont deux listes indépendantes, remplies séparément par l'outil d'export, et n'ont aucune raison d'avoir la même longueur ni le même ordre. Un indice unique ne pourrait pas désigner à la fois "le 5e sommet" et "la 5e coordonnée de texture" si ces deux listes ne s'alignent pas terme à terme.

> **Couture UV (*UV seam*) :** un même sommet 3D (un seul indice `v`) peut avoir besoin d'une coordonnée de texture différente selon la face qui le référence. Exemple concret : les 3 faces d'un cube qui se rencontrent en un coin partagent ce sommet, mais chaque face est dépliée à un endroit différent de l'image 2D utilisée comme texture -- donc avec un `vt` différent. Un indice `v` unique combiné à un indice `vt` par coin de face permet de représenter ce cas ; un indice unique partagé entre position et texture ne le permettrait pas.

> **Piège :** stocker les coordonnées de texture indexées uniquement par sommet (un tableau `vt_du_sommet[indice_v]`) casse silencieusement sur une couture UV : chaque face qui référence ce sommet avec un `vt` différent écrase la valeur précédente, seule la dernière écriture survit. La donnée doit être indexée par **couple** (`v`, `vt`), pas par `v` seul -- c'est pourquoi un moteur de rendu duplique en général les sommets à chaque couture UV rencontrée (un sommet unique envoyé à la carte graphique par couple `(v, vt[, vn])` distinct, plutôt qu'un sommet par position).

## Le fichier image référencé par le `.mtl`

Le `.mtl` ne décrit pas que des couleurs unies : la ligne `map_Kd` y référence un fichier image (PNG, JPEG...) utilisé comme texture diffuse :

```text
newmtl Material
map_Kd caisse.png
Kd 0.640000 0.640000 0.640000
```

Au moment de dessiner un triangle, chaque coordonnée `vt` (une paire `(u, v)` avec `u` et `v` entre 0 et 1) désigne un point de cette image, quelle que soit sa résolution réelle en pixels : `(0, 0)` un coin de l'image, `(1, 1)` le coin opposé. La carte graphique interpole ces coordonnées entre les 3 sommets d'un triangle pour savoir, pixel par pixel, quel point de l'image afficher. Si `map_Kd` est absent, `Kd` reste la seule couleur utilisée et les `vt` du fichier n'ont alors aucun effet visuel.

## Les groupes de lissage (`s`)

`s` ne touche pas à la géométrie : il contrôle uniquement le calcul des **normales** utilisées pour l'éclairage.

- `s off` (équivalent à `s 0`) : chaque face garde sa propre normale plate -> rendu à facettes visibles (*flat shading*).
- `s 1`, `s 2`... : les faces qui partagent le même numéro de groupe ont leurs normales moyennées aux sommets qu'elles ont en commun -> rendu lissé (*smooth shading*, aussi appelé *Gouraud shading*).

```text
s 1
f 1 2 5
f 2 3 5
f 3 4 5
f 4 1 5
```

Les 4 faces ci-dessus partagent toutes le sommet `5` et le même groupe de lissage : sa normale sera la moyenne des 4 normales de face, donnant un aspect arrondi à cette pointe plutôt qu'une arête franche.

> **Piège :** `s`, comme `usemtl`, est une **directive d'état** : elle s'applique à toutes les lignes `f` qui suivent, jusqu'à la prochaine `s`/`usemtl` rencontrée dans le fichier. Un parseur doit donc garder en mémoire "quel groupe de lissage et quel matériau sont actifs en ce moment" au fil de la lecture, et les associer à chaque face au moment où elle est lue : cette information n'apparaît jamais sur la ligne `f` elle-même.

## `o` n'est pas une directive d'état comme `s`/`usemtl`

`o` (et son cousin `g`, pour des sous-groupes) se contente d'étiqueter un ensemble de géométrie sous un nom d'objet, pour l'organisation. Contrairement à `s`/`usemtl`, il ne change **rien** à l'interprétation des lignes qui suivent.

> **Piège :** la numérotation des sommets (`v`) reste **globale à tout le fichier** : elle ne redémarre jamais à 1 à chaque nouveau `o`. Dans un fichier à plusieurs objets, les faces du deuxième objet continuent donc la numérotation du premier :
> ```text
> o Cube1
> v 0 0 0
> v 1 0 0
> v 0 1 0
>
> o Cube2
> v 5 5 5   <- 4e sommet du FICHIER, pas le 1er de Cube2
> v 6 5 5
> v 5 6 5
>
> f 4 5 6   <- fait reference aux sommets de Cube2
> ```
> Réinitialiser un compteur de sommets à chaque `o` casse silencieusement l'indexation de toutes les faces dès qu'un fichier contient plus d'un objet.

## Lire un `.obj` avec tolérance

Les fichiers `.obj` viennent de logiciels différents, qui ne respectent pas tous la même variante du format. Un analyseur (*parser*) robuste **accepte large** (toute variante qui a un sens) et **refuse avec un message précis** (fichier, ligne, valeur fautive) tout le reste, plutôt que de planter ou de continuer en silence avec des données fausses.

| Variante rencontrée | Que faire |
|---|---|
| `v x y z w` (4 valeurs, `w` est un poids, 1.0 si absent) | Lire `w` puis l'ignorer |
| `v x y z r g b` (6 valeurs, couleur par sommet, extension de certains exports) | Garder les 3 premières, ignorer ou stocker la couleur |
| `vt u`, `vt u v`, `vt u v w` (1 à 3 valeurs) | `v` vaut 0 s'il manque, `w` est inutile pour une image 2D |
| Directive inconnue (`l`, `p`, `cstype`...), ligne vide, commentaire `#` | Ignorer la ligne, sans erreur |
| Moins de valeurs que prévu, texte à la place d'un nombre, `1e999` | Refuser, en nommant le fichier, la ligne et la valeur reçue |

```c
/* Lit 3, 4 ou 6 nombres d'une ligne « v » ; renvoie le nombre lu, -1 si invalide. */
static int parse_vertex(const char *s, double out[6])
{
	int n = 0;
	char *end;

	while (n < 6)
	{
		errno = 0;
		out[n] = strtod(s, &end);        /* lit un nombre et avance jusqu'à sa fin */
		if (end == s)                    /* rien de lisible : fin des nombres */
			break;
		if (errno || !isfinite(out[n]))  /* 1e999, inf ou nan : refusé */
			return -1;
		s = end;
		n++;
	}
	while (*s == ' ' || *s == '\t' || *s == '\r')  /* blancs de fin de ligne */
		s++;
	return (*s == '\0' && (n == 3 || n == 4 || n == 6)) ? n : -1;
}
```

Testée avec `"1 2 3"` (3), `"1 2 3 1.0"` (4), `"1 2 3 0.5 0.5 0.5"` (6) : valides. `"1 2"`, `"1 2 x"`, `"1e999 0 0"` et `"1 2 3 4 5"` renvoient -1. `strtod` est préférée à `atof`, qui renvoie 0 sur n'importe quel texte sans rien signaler (voir [convertir un texte en nombre](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)).

### Fins de ligne et BOM

| Cas | Ce qu'il contient | Conséquence si non traité |
|---|---|---|
| LF (`\n`) | Fin de ligne Unix | Aucune |
| CRLF (`\r\n`) | Fin de ligne Windows | Un `\r` reste collé en fin de ligne, donc dans la dernière valeur lue |
| CR (`\r`) seul | Fin de ligne des très anciens Mac | `fgets` ne coupe qu'à `\n` : tout le fichier devient une seule ligne |
| BOM UTF-8 (octets `EF BB BF` en tête de fichier) | Marque d'encodage, voir [encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) | Elle se colle à la première directive : `\xEF\xBB\xBFv` n'est pas `v`, la ligne est prise pour une directive inconnue, **le premier sommet disparaît sans erreur** et tous les indices de faces sont décalés d'un cran |

> **Bonne pratique :** lire le fichier entier en mémoire, sauter un éventuel BOM, puis découper aux trois fins de ligne (`\r\n`, `\r` et `\n`) plutôt que d'appeler `fgets` : le même code traite alors les fichiers de n'importe quel système.

## Le format PPM P6 : une texture sans bibliothèque

Le [`map_Kd` du `.mtl`](#le-fichier-image-reference-par-le-mtl) désigne une image. Le **PPM** (*Portable PixMap*, [spécification](https://netpbm.sourceforge.net/doc/ppm.html)) est le format d'image le plus simple à lire à la main : un petit en-tête en texte, suivi des pixels en **binaire** (des octets bruts, qu'un éditeur de texte n'affiche pas lisiblement). Sa variante **P6** stocke trois canaux (rouge, vert, bleu) par pixel.

```text
P6                  <- nombre magique : identifie le format
# un commentaire    <- optionnel : # jusqu'à la fin de la ligne, à ignorer
640 480             <- largeur et hauteur, en pixels
255                 <- maxval : valeur maximale d'un canal
<octets binaires>   <- largeur x hauteur x 3 canaux, ligne par ligne, de haut en bas
```

| `maxval` | Octets par canal | Pour revenir à 0 à 255 |
|---|---|---|
| 1 à 255 | 1 | `valeur x 255 / maxval` |
| 256 à 65535 | 2, octet de poids fort d'abord | `valeur x 255 / maxval` (même formule, valeur sur 16 bits) |

```c
/* Lit un entier de l'en-tête PPM en sautant blancs et commentaires ; -1 si absent. */
static long read_header_int(FILE *f)
{
	int c;

	while ((c = fgetc(f)) != EOF)
	{
		if (c == '#')                    /* commentaire : ignoré jusqu'à la fin de ligne */
			while ((c = fgetc(f)) != EOF && c != '\n' && c != '\r')
				;
		else if (!isspace(c))
			break;
	}
	if (!isdigit(c))
		return -1;
	long n = 0;
	for (; isdigit(c); c = fgetc(f))     /* le blanc qui termine le nombre est consommé */
	{
		n = n * 10 + (c - '0');
		if (n > 1000000)                 /* dimension absurde : refusée */
			return -1;
	}
	return n;
}
```

La fonction principale appelle `read_header_int` trois fois (largeur, hauteur, `maxval`) :

```c
/* Renvoie largeur x hauteur x 3 octets (0 à 255), ou NULL avec un message sur stderr. */
unsigned char *read_ppm(const char *path, int *w, int *h)
{
	FILE *f = fopen(path, "rb");                 /* « b » : mode binaire, indispensable sous Windows */
	if (!f)
		return fprintf(stderr, "%s: %s\n", path, strerror(errno)), NULL;
	if (fgetc(f) != 'P' || fgetc(f) != '6')
		return fprintf(stderr, "%s: pas un PPM P6\n", path), fclose(f), NULL;
	long width = read_header_int(f);             /* saute blancs et commentaires, -1 si absent */
	long height = read_header_int(f);
	long maxval = read_header_int(f);            /* consomme le blanc unique qui suit */
	if (width < 1 || height < 1 || maxval < 1 || maxval > 65535)
		return fprintf(stderr, "%s: en-tête invalide\n", path), fclose(f), NULL;
	size_t bytes = maxval < 256 ? 1 : 2;
	size_t count = (size_t)width * (size_t)height * 3;
	unsigned char *raw = malloc(count * bytes);
	unsigned char *out = malloc(count);
	if (!raw || !out || fread(raw, bytes, count, f) != count)
	{                                            /* tronqué, ou mémoire insuffisante */
		fprintf(stderr, "%s: données tronquées ou mémoire insuffisante\n", path);
		return free(raw), free(out), fclose(f), NULL;
	}
	for (size_t i = 0; i < count; i++)
	{
		long v = bytes == 1 ? raw[i] : (raw[2 * i] << 8) | raw[2 * i + 1];
		out[i] = (unsigned char)((v * 255 + maxval / 2) / maxval);  /* arrondi au plus proche */
	}
	free(raw);
	fclose(f);
	*w = (int)width;
	*h = (int)height;
	return out;
}
```

Compilée avec `-Wall -Wextra -pedantic` sans avertissement, puis essayée sur quatre fichiers : un PPM 8 bits avec commentaire et un PPM 16 bits donnent tous deux le pixel rouge `255 0 0` ; un fichier dont les données s'arrêtent trop tôt, un fichier `P5` (niveaux de gris) et un fichier absent sont refusés chacun avec leur propre message.

| Piège | Pourquoi | Parade |
|---|---|---|
| Sauter tous les blancs après `maxval` | Un octet de pixel peut valoir `0x20` ou `0x0A` (un blanc) : il serait pris pour de l'espace | Consommer **un seul** blanc, puis lire les données telles quelles |
| Fichier converti en CRLF | Chaque `\n` binaire devient `\r\n` : les données s'allongent et se décalent | Détecter la taille incohérente et refuser |
| Fichier tronqué | `fread` renvoie moins que prévu | Comparer le compte lu au compte attendu |
| `largeur x hauteur x 3` énorme | Le produit déborde ou réclame des gigaoctets | Borner chaque dimension, calculer en `size_t` |
| Ligne du bas en premier | Le PPM stocke la première ligne **en haut**, OpenGL attend la première ligne **en bas** | Retourner l'image verticalement ou inverser `v` |

## La normale d'un polygone : la méthode de Newell

Le test d'orientation de l'ear clipping a besoin de la normale de la face. Le calcul naïf (produit vectoriel des deux premières arêtes) échoue de deux façons : si les trois premiers sommets sont alignés, le produit vaut le vecteur nul ; si le premier coin est rentrant (angle intérieur supérieur à 180 degrés), la normale obtenue est inversée, donc toute la suite du test est fausse.

La **méthode de Newell** additionne une contribution par arête, sur **tout** le contour, donc aucun sommet n'est privilégié :

```text
pour chaque arête (a -> b) du polygone :
    nx += (a.y - b.y) * (a.z + b.z)
    ny += (a.z - b.z) * (a.x + b.x)
    nz += (a.x - b.x) * (a.y + b.y)
normale = (nx, ny, nz) / longueur        <- sa longueur vaut 2 fois l'aire du polygone
```

```c
/* Normale unitaire d'un polygone (méthode de Newell) ; -1 si la surface est nulle. */
static int newell_normal(const double (*p)[3], int n, double out[3])
{
	double nx = 0, ny = 0, nz = 0;

	for (int i = 0; i < n; i++)
	{
		const double *a = p[i];
		const double *b = p[(i + 1) % n];      /* le dernier sommet se relie au premier */
		nx += (a[1] - b[1]) * (a[2] + b[2]);
		ny += (a[2] - b[2]) * (a[0] + b[0]);
		nz += (a[0] - b[0]) * (a[1] + b[1]);
	}
	double len = sqrt(nx * nx + ny * ny + nz * nz);
	if (len == 0)                              /* sommets alignés ou confondus */
		return -1;
	out[0] = nx / len;
	out[1] = ny / len;
	out[2] = nz / len;
	return 0;
}
```

Essai sur un polygone en L concave dont les trois premiers sommets sont alignés (`(0,0) (1,0) (2,0) (2,1) (1,1) (1,2)`, dans le plan z = 0) : le calcul naïf donne le vecteur nul, Newell donne `0 0 1`. Sur trois sommets alignés seulement, il renvoie -1 : une face de surface nulle se refuse avec son propre message, elle n'a pas de normale. Pour le produit vectoriel, voir [Vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Rendre l'ear clipping robuste

L'algorithme décrit plus haut est exact avec des nombres exacts ; les nombres à virgule flottante (voir [représentation des flottants](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)) l'obligent à trois précautions :

| Précaution | Pourquoi |
|---|---|
| Faire les prédicats (orientation, même côté) en `double`, même si les sommets sont stockés en `float` | Près de zéro, un `float` fait changer le signe du produit vectoriel : une oreille valide est refusée, une invalide est acceptée |
| Comparer à une tolérance **relative** (`abs(produit) <= epsilon x longueur1 x longueur2`), jamais à une constante absolue | Une constante absolue dépend de l'unité du modèle (un objet de 0,001 ou de 1000 unités) |
| Traiter à part le sommet **aligné** avec ses voisins ou posé **sur une arête** du triangle candidat | Ni dedans ni dehors : le test strict l'accepte ou le refuse au hasard de l'arrondi |

Le découpage se fait alors en **deux passes** : une passe stricte (une oreille doit être strictement convexe et ne contenir ni sommet intérieur ni sommet sur son bord) ; si elle ne trouve aucune oreille alors qu'il reste plus de 3 sommets, une seconde passe tolère les sommets posés exactement sur le bord. Si elle échoue aussi, la face est refusée (dégénérée ou qui se recoupe elle-même) avec un message qui nomme le fichier et la ligne, au lieu de boucler sans fin.

## Accélérer l'ear clipping : n'examiner que les sommets réflexes

Le test « aucun sommet piégé » parcourt tous les sommets restants, pour chaque oreille candidate, et chaque retrait en réclame une nouvelle : au moins `n x n` opérations ([complexité quadratique](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Deux mots suffisent pour faire mieux. Le **virage** en un sommet `b` entre ses voisins `a` et `c` est le produit scalaire de la normale de la face avec le produit vectoriel de `a->b` et `a->c` (voir [Vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) : son signe dit de quel côté le contour tourne.

| Terme | Sens | Signe du virage |
|---|---|---|
| Sommet **convexe** | Le contour y tourne dans le sens de la normale : angle intérieur inférieur à 180 degrés | `> 0` |
| Sommet **réflexe** (*reflex*) | Le contour y tourne en sens inverse : angle intérieur supérieur à 180 degrés, c'est une encoche | `<= 0` (un virage nul, sommet aligné avec ses voisins, est classé ici par prudence) |

Dans le polygone en L de la section précédente, le sommet `(1,1)` est réflexe, `(1,0)` est aligné avec ses voisins (virage nul) et les quatre autres sont convexes. Un polygone convexe n'a aucun sommet réflexe.

### Pourquoi les réflexes suffisent

**Si un sommet se trouve dans le triangle d'une oreille candidate, alors un sommet réflexe s'y trouve aussi.** Raisonnement : les deux côtés du triangle qui touchent la pointe `v` sont des arêtes du polygone, que le contour ne peut pas traverser (il se recouperait lui-même). Un contour qui entre dans le triangle n'a donc que la base `[prev, next]` pour entrer et pour ressortir. La zone comprise entre ce détour et la pointe `v` n'est bordée que par des arêtes du polygone, donc elle est à l'intérieur du polygone. Le point du détour le plus proche de `v` (`Q` ci-dessous) a l'intérieur du côté de `v` et fait un pic vers lui : son angle intérieur dépasse 180 degrés.

```text
            v           contour qui entre par la base, monte jusqu'à Q, redescend
           / \          Q : sommet du détour le plus proche de v
          /   \         l'intérieur du polygone est du côté de v : Q est réflexe
         /  Q  \
        /  / \  \
   prev ----------- next
```

Conséquence : le test du même côté ne se fait plus que contre la liste des réflexes, qui est vide pour un polygone convexe (aucun test de point du tout).

### Tenir la liste des réflexes à jour

| Moment | Ce qui se passe | Coût |
|---|---|---|
| Au départ | Une passe : tout sommet de virage `<= 0` entre dans le tableau `reflex[]` | `n` |
| Après un retrait d'oreille | Seuls les deux voisins de la pointe coupée changent d'angle, et il ne peut que diminuer (un triangle quitte le polygone) : un réflexe peut devenir convexe, un convexe ne redevient **jamais** réflexe | 2 vérifications |
| Sortie de la liste | [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove) : le sommet prend la place du dernier. Chaque nœud mémorise sa position `reflex_pos` dans le tableau pour la trouver sans le parcourir | O(1) |

```c
typedef struct { int prev, next, reflex_pos; } Node;    /* reflex_pos : -1 si convexe */

typedef struct
{
	const double (*p)[3];      /* positions des sommets */
	double normal[3];          /* normale de la face (méthode de Newell) */
	Node *node;                /* liste doublement chaînée circulaire */
	int *reflex;               /* indices des sommets réflexes */
	int n_reflex;
}	Ctx;

/* Virage en b entre a et c : > 0 convexe, < 0 réflexe, 0 aligné. */
static double turn(const double *a, const double *b, const double *c, const double nrm[3])
{
	double u[3] = {b[0] - a[0], b[1] - a[1], b[2] - a[2]};
	double v[3] = {c[0] - a[0], c[1] - a[1], c[2] - a[2]};

	return (u[1] * v[2] - u[2] * v[1]) * nrm[0]      /* produit vectoriel u x v, */
		+ (u[2] * v[0] - u[0] * v[2]) * nrm[1]       /* puis produit scalaire */
		+ (u[0] * v[1] - u[1] * v[0]) * nrm[2];      /* avec la normale */
}

/* Test des trois côtés : q est dans le triangle (a, b, d), bord compris. */
static int in_triangle(const Ctx *c, int a, int b, int d, int q)
{
	return turn(c->p[a], c->p[b], c->p[q], c->normal) >= 0
		&& turn(c->p[b], c->p[d], c->p[q], c->normal) >= 0
		&& turn(c->p[d], c->p[a], c->p[q], c->normal) >= 0;
}

static int is_reflex(const Ctx *c, int i)
{
	const Node *nd = &c->node[i];

	return turn(c->p[nd->prev], c->p[i], c->p[nd->next], c->normal) <= 0;
}

static int is_ear(const Ctx *c, int i)
{
	int a = c->node[i].prev;
	int d = c->node[i].next;

	if (is_reflex(c, i))
		return 0;
	for (int k = 0; k < c->n_reflex; k++)      /* seulement les réflexes */
	{
		int q = c->reflex[k];
		if (q != a && q != d && in_triangle(c, a, i, d, q))
			return 0;
	}
	return 1;
}

static void reflex_remove(Ctx *c, int i)
{
	int pos = c->node[i].reflex_pos;
	int last = c->reflex[--c->n_reflex];

	c->reflex[pos] = last;                     /* le dernier prend la place */
	c->node[last].reflex_pos = pos;            /* et note sa nouvelle position */
	c->node[i].reflex_pos = -1;
}

/* Après un retrait : un voisin réflexe devenu convexe quitte la liste. */
static void refresh(Ctx *c, int i)
{
	if (c->node[i].reflex_pos >= 0 && !is_reflex(c, i))
		reflex_remove(c, i);
}
```

`in_triangle` est le test du même côté de la section « Vérifier qu'aucun sommet n'est piégé dans l'oreille » ; la boucle de découpe appelle `refresh` sur `prev` et `next` après chaque oreille coupée.

### Ce que ça change, mesuré

12000 sommets, `-O2`, une exécution, même résultat (11998 triangles, soit `n - 2`) avec les deux tests :

| Polygone | Sommets réflexes | Test contre tous les sommets | Test contre les réflexes |
|---|---|---|---|
| Cercle (convexe) | 0 | 0,38 s | 0,0002 s |
| Étoile (un sommet sur deux rentrant) | 6000 | 0,28 s | 0,06 s |

Le coût résiduel est de l'ordre de `n x r` (`r` : nombre de réflexes) : une forme très découpée reste quadratique, seule la constante baisse. Le gain est maximal sur les polygones peu concaves, qui sont l'immense majorité des faces d'un `.obj`.

> **Piège : le bruit d'arrondi.** Sur un grand polygone presque plat à chaque sommet, une erreur de calcul peut faire basculer des sommets convexes dans la liste des réflexes : elle gonfle et le coût redevient `n x n`. Calculer le virage en `double` (voir [Rendre l'ear clipping robuste](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#rendre-l-ear-clipping-robuste)) limite ce risque. En cas de doute, **toujours classer le sommet réflexe** (`<= 0`, pas `< 0`) : un réflexe en trop ne coûte que du temps, un réflexe oublié ferait accepter une oreille qui piège un sommet.

> **Bonne pratique :** valider l'optimisation en comparant, sur les mêmes polygones, le nombre de triangles (`n - 2`) et la somme de leurs aires entre l'ancien test (tous les sommets) et le nouveau (réflexes seulement), avant de jeter l'ancien. Voir aussi [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `.obj` liste des instructions ligne par ligne (`v`, `vt`, `vn`, `f`, `s`...), avec des indices de sommets qui commencent à 1. Les faces peuvent avoir plus de 3 sommets et doivent être triangulées pour être dessinées par la carte graphique ; l'ear clipping gère aussi les faces concaves grâce à un test d'orientation ET un test "même côté" par sommet restant. Une face combine en général un indice par liste et par coin (`v/vt/vn`), car `v` et `vt` sont deux listes indépendantes non alignées -- nécessaire pour représenter une couture UV. Le `.mtl` associé décrit l'apparence via les 4 paramètres du modèle de Phong (ambiant, diffus, spéculaire, brillance) et peut référencer un fichier image (`map_Kd`) comme texture. `s` contrôle le lissage des normales, indépendamment de la géométrie. Un analyseur accepte large (`v` à 3, 4 ou 6 valeurs, directives inconnues ignorées, LF, CRLF ou CR, BOM) et refuse le reste avec un message précis. Le PPM P6 est un en-tête texte suivi de pixels binaires (`maxval` sur 1 ou 2 octets). La normale d'un polygone se calcule par la méthode de Newell, sur tout son contour. |
| **Outils utilisables** | Le modèle de Phong (`Ka`/`Kd`/`Ks`/`Ns`) pour interpréter un `.mtl`. `map_Kd` pour relier un `.mtl` à un fichier image de texture. Les groupes de lissage (`s`) pour choisir entre rendu plat et rendu lissé. La formule `n - 2` pour vérifier le nombre de triangles produit par n'importe quelle triangulation. `strtod` pour lire les nombres, la méthode de Newell pour la normale, des prédicats en `double` pour l'ear clipping. |
| **Pièges à éviter** | Indices de sommets 1-based plutôt que 0-based. Faces à nombre de sommets variable non triangulées. La triangulation en éventail produit un résultat faux sur une face concave, et un test d'orientation seul (sans test "même côté") peut valider à tort une oreille qui piège un autre sommet. Indexer une coordonnée de texture par sommet seul (plutôt que par couple sommet/texture) casse silencieusement sur une couture UV. Un `.mtl` à matériau unique ne fournit pas une couleur par sous-partie. `s`/`usemtl` sont des directives d'état à suivre pendant tout le parsing, pas des attributs présents sur chaque ligne `f`. `o` n'affecte jamais la numérotation des sommets, qui reste globale au fichier même avec plusieurs objets. BOM collé à la première directive (premier sommet perdu en silence), `\r` résiduel d'un fichier CRLF, `fgets` face à un CR seul. Sauter tous les blancs après le `maxval` d'un PPM, ne pas contrôler la taille des données, oublier que sa première ligne est en haut alors qu'OpenGL attend celle du bas. Calculer la normale sur les deux premières arêtes seulement. Utiliser une tolérance absolue dans un test géométrique. |
| **Bonnes pratiques** | Séparer la lecture brute du fichier et la triangulation en deux fonctions distinctes, à responsabilité unique chacune. Réutiliser la même primitive géométrique (produit vectoriel + produit scalaire avec la normale) pour le test d'orientation et le test "même côté", plutôt que de la dupliquer. Vérifier une triangulation avec la formule `n - 2` avant de juger le découpage correct. Dupliquer un sommet par couple unique `(v, vt[, vn])` plutôt que par position seule, pour gérer les coutures UV. Conserver l'état courant (matériau, groupe de lissage) dans des variables mises à jour au fil du parsing, et l'attacher à chaque face lue. Lire le fichier entier et le découper aux trois fins de ligne après avoir sauté le BOM. Refuser une entrée invalide en nommant le fichier, la ligne et la valeur. Calculer les prédicats géométriques en `double` avec une tolérance relative, en deux passes, et refuser la face si aucune oreille n'existe. |
