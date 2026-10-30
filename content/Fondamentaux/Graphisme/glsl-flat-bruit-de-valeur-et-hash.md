---
order: 10
---

# GLSL : le qualificateur `flat`, le bruit de valeur et les fonctions de hachage

Un [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-shaders-les-programmes-de-la-carte-graphique) est un petit programme écrit en GLSL qui tourne sur la carte graphique. Ce chapitre traite deux outils qui reviennent dans presque tous les shaders un peu avancés. Le premier est un mot-clé, `flat`, qui décide comment une valeur voyage d'un étage du shader au suivant : sans lui, la carte la **mélange** entre les trois sommets d'un triangle, ce qui n'a aucun sens pour un numéro de matériau. Le second est une manière de fabriquer du « hasard » sans générateur : le **bruit de valeur**, fondé sur une **fonction de hachage**. Tous les chiffres des tableaux viennent de programmes C écrits pour ce chapitre et exécutés (le même algorithme que le GLSL, à l'arrondi près) ; les blocs GLSL, eux, n'ont pas été compilés ici.

Le chapitre suppose connus [les étages d'un shader et leurs entrées/sorties `in`/`out`](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-shaders-les-programmes-de-la-carte-graphique) (un **sommet** est un point du maillage, un **fragment** est un pixel candidat à l'écran), [les nombres à virgule flottante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), [les opérateurs binaires du C](/?c=langages&s=c&p=operateurs-binaires) (`^`, `>>`, `<<`) et [le produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Ce que reçoit un fragment : une moyenne des trois sommets

Un triangle est dessiné à partir de ses trois sommets, et chacun peut porter des valeurs (une couleur, une coordonnée de texture, une normale). Mais l'écran est fait de pixels, bien plus nombreux : pour chaque fragment couvert par le triangle, la carte graphique doit **inventer** une valeur. Elle fait une moyenne pondérée des trois valeurs, avec des **poids barycentriques** : trois nombres positifs dont la somme vaut 1, qui disent à quel point le fragment est proche de chaque sommet. C'est l'**interpolation** (le calcul d'une valeur intermédiaire à partir de valeurs connues en des points voisins).

```text
              B  (valeur 5)
             /\
            /  \
           /    \         P : un fragment, avec les poids wA, wB, wC
          /   P  \        (wA + wB + wC = 1 ; plus P est près d'un sommet,
         /        \        plus son poids est grand)
        A----------C
 (valeur 2)      (valeur 9)

 valeur en P = wA x 2 + wB x 5 + wC x 9
```

C'est exactement ce qu'on veut pour une couleur ou une coordonnée de texture : un dégradé continu. Pour un **identifiant** (un numéro de matériau, un numéro d'objet), c'est une catastrophe. Les valeurs 2, 5 et 9 du schéma, interpolées en quatre points d'un triangle (résultat du programme C de la section sur le sommet provoquant) :

| Poids (wA, wB, wC) | Valeur interpolée | Ce que l'on voulait |
|---|---|---|
| 0,33 ; 0,33 ; 0,33 | 5,3333 | Un numéro entier |
| 0,60 ; 0,30 ; 0,10 | 3,6000 | Un numéro entier |
| 0,10 ; 0,10 ; 0,80 | 7,9000 | Un numéro entier |
| 0,05 ; 0,90 ; 0,05 | 5,0500 | Un numéro entier |

Aucun de ces nombres n'est un matériau choisi par un sommet, et l'arrondir n'arrange rien : 3,6 devient 4 et 7,9 devient 8, des numéros que personne n'a fournis. GLSL propose trois comportements, choisis par un **qualificateur** (un mot placé devant la déclaration d'une variable) :

| Qualificateur | Valeur reçue par le fragment | Usage typique |
|---|---|---|
| `smooth` (par défaut) | Moyenne pondérée, corrigée de la perspective (la correction garde un motif droit sur une surface vue de biais) | Couleur, coordonnée de texture, normale lissée |
| `noperspective` | Moyenne pondérée, sans cette correction : linéaire à l'écran | Effets dessinés directement dans l'espace de l'écran |
| `flat` | **Aucune moyenne** : la valeur d'un seul sommet, la même sur tout le triangle | Identifiant, indice de matériau, couleur ou normale par face |

Les trois sont décrits par la [page Type Qualifier de la documentation Khronos](https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)).

## `flat` : une valeur par triangle, sans moyenne

On écrit `flat` devant la sortie du vertex shader **et** devant l'entrée du fragment shader qui porte le même nom. Exemple : un entier par sommet choisit une couleur dans une petite palette.

```glsl
// ----- vertex shader -----
#version 330 core                        // version 3.30 de GLSL, profil moderne (core)
layout(location = 0) in vec3 position;   // position du sommet ; 0 : numéro de l'attribut
layout(location = 1) in int material;    // un entier par sommet ; attribut numéro 1
uniform mat4 mvp;                        // uniform : fixé par le programme C ; mat4 : 4x4
flat out int v_material;                 // sortie « flat » : jamais moyennée

void main()
{
	gl_Position = mvp * vec4(position, 1.0);   // position du sommet à l'écran
	v_material = material;                     // l'entier est recopié tel quel
}
```

```glsl
// ----- fragment shader -----
#version 330 core
flat in int v_material;        // même nom, même qualificateur que la sortie ci-dessus
uniform vec3 palette[4];       // quatre couleurs, fixées par le programme C
out vec4 color;                // couleur finale du fragment

void main()
{
	color = vec4(palette[v_material], 1.0);   // l'entier choisit la couleur
}
```

Côté programme C, un attribut entier se déclare avec `glVertexAttribIPointer` (le **I** signifie « integer » : sans lui, la carte convertirait l'entier en flottant), documenté avec [`glVertexAttribPointer`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glVertexAttribPointer.xhtml).

```c
/* attribut 1 : 1 composante de type GL_INT ; stride : octets d'un sommet à l'autre ;
   offset : position de l'entier dans un sommet */
glVertexAttribIPointer(1, 1, GL_INT, stride, (void *)offset);
glEnableVertexAttribArray(1);                    /* active l'attribut 1 */
```

Une règle du langage s'ajoute : une entrée de fragment shader de **type entier** (`int`, `uint`, `ivec3`...) doit obligatoirement être `flat`. La raison est logique : une moyenne d'entiers n'est pas un entier. Sans `flat`, le shader est refusé à la compilation ou à l'édition de liens (règle de la page Khronos ci-dessus ; non testée ici faute de pilote). Un flottant peut être `flat` aussi.

| Cas d'usage | Ce que porte la variable `flat` | Pourquoi pas une valeur interpolée |
|---|---|---|
| Identifiant d'objet | Un numéro écrit dans une image à part pour le [picking](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#le-picking-souris-trouver-quel-objet-3d-a-ete-clique) | Un numéro mélangé désigne un autre objet |
| Indice de matériau | Un entier qui indexe une palette ou un tableau de textures | Un indice moyen n'existe pas |
| Couleur par face | Une couleur par triangle, pour un rendu à facettes | Le dégradé effacerait les arêtes |
| Normale par face | Le vecteur perpendiculaire au triangle, calculé par le [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#exemple-une-normale-plate-par-triangle-calculee-au-geometry-shader) | Les trois sommets portent la même valeur : `flat` le dit explicitement et évite un calcul de moyenne inutile |

## Quel sommet fournit la valeur : le sommet provoquant

Si `flat` supprime la moyenne, il reste une question : les trois sommets portent trois valeurs possibles, laquelle le fragment reçoit-il ? OpenGL en choisit **un seul**, le **sommet provoquant** (*provoking vertex* : le sommet qui « provoque » la valeur du triangle entier). Par défaut c'est le **dernier** sommet du triangle (`GL_LAST_VERTEX_CONVENTION`) ; `glProvokingVertex` permet de choisir le premier (`GL_FIRST_VERTEX_CONVENTION`), voir la [documentation Khronos de glProvokingVertex](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glProvokingVertex.xhtml).

```c
glProvokingVertex(GL_FIRST_VERTEX_CONVENTION);   /* le 1er sommet fournit la valeur flat */
glProvokingVertex(GL_LAST_VERTEX_CONVENTION);    /* retour au réglage par défaut */
```

Pour une liste de triangles (`GL_TRIANGLES`), « dernier » veut dire le troisième indice de chaque triangle. S'il existe un geometry shader, la règle s'applique aux sommets **émis** par lui, pas à ceux du maillage. La convention n'a pas été vérifiée sur une carte graphique ici : le programme C ci-dessous applique la règle « dernier indice » à un cube indexé de 8 sommets et 12 triangles, et à l'interpolation de la valeur 2, 5, 9 du schéma précédent.

```c
#include <stdio.h>   /* printf */

int	main(void)
{
	float	ids[3] = {2.0f, 5.0f, 9.0f};                    /* valeur de A, B, C */
	float	w[4][3] = {{1 / 3.0f, 1 / 3.0f, 1 / 3.0f}, {0.6f, 0.3f, 0.1f},
		{0.1f, 0.1f, 0.8f}, {0.05f, 0.9f, 0.05f}};          /* quatre fragments */
	int		cube[12][3] = {{0,1,2}, {0,2,3}, {1,5,6}, {1,6,2}, {5,4,7}, {5,7,6},
		{4,0,3}, {4,3,7}, {3,2,6}, {3,6,7}, {4,5,1}, {4,1,0}};   /* indices */
	int		uses[8] = {0};                                  /* triangles par sommet */
	int		k;

	for (k = 0; k < 4; k++)                                 /* moyenne contre flat */
		printf("poids %.2f %.2f %.2f : moyenne %.4f, flat dernier 9, flat premier 2\n",
			w[k][0], w[k][1], w[k][2],
			w[k][0] * ids[0] + w[k][1] * ids[1] + w[k][2] * ids[2]);
	for (k = 0; k < 12; k++)
		uses[cube[k][2]]++;                                 /* le dernier indice compte */
	for (k = 0; k < 8; k++)
		printf("sommet %d fournit la valeur de %d triangle(s)\n", k, uses[k]);
	return (0);
}
```

```text
poids 0.33 0.33 0.33 : moyenne 5.3333, flat dernier 9, flat premier 2
poids 0.60 0.30 0.10 : moyenne 3.6000, flat dernier 9, flat premier 2
poids 0.10 0.10 0.80 : moyenne 7.9000, flat dernier 9, flat premier 2
poids 0.05 0.90 0.05 : moyenne 5.0500, flat dernier 9, flat premier 2
sommet 0 fournit la valeur de 1 triangle(s)
sommet 1 fournit la valeur de 1 triangle(s)
sommet 2 fournit la valeur de 2 triangle(s)
sommet 3 fournit la valeur de 2 triangle(s)
sommet 4 fournit la valeur de 0 triangle(s)
sommet 5 fournit la valeur de 0 triangle(s)
sommet 6 fournit la valeur de 3 triangle(s)
sommet 7 fournit la valeur de 3 triangle(s)
```

| Sommet du cube | Triangles dont il est le dernier indice | Conséquence |
|---|---|---|
| 0 et 1 | 1 chacun | Pas de conflit |
| 2 et 3 | 2 chacun | Avec cet ordre d'indices, les deux triangles viennent de faces différentes (par exemple l'avant et la droite pour le sommet 2) : conflit |
| 4 et 5 | 0 | Ils ne fournissent jamais de valeur : ce qu'ils portent est ignoré par `flat` |
| 6 et 7 | 3 chacun | Trois faces différentes lui réclament chacune sa valeur : conflit |

Les deux derniers cas sont le piège principal : un sommet **partagé** par plusieurs triangles (c'est tout l'intérêt d'un [tampon d'indices](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-tampons-vbo-ebo-et-vao)) ne porte qu'**une** valeur, mais plusieurs faces voudraient la leur. Trois parades :

| Parade | Principe | Coût |
|---|---|---|
| Dupliquer les sommets | Chaque face a ses propres sommets (24 pour un cube au lieu de 8), donc sa propre valeur | Plus de mémoire, plus de sommets à traiter |
| Calculer la valeur dans un geometry shader | Il reçoit les trois sommets et émet la même valeur trois fois : aucun sommet ne peut entrer en conflit | Un étage de plus (optionnel) |
| Lire un tableau avec `gl_PrimitiveID` | Variable prédéfinie du fragment shader qui donne le numéro du triangle ; on lit sa donnée dans un tableau | Un accès mémoire par fragment |

## Ce que fait un hash dans un shader

Pour du bruit, du grain, des motifs aléatoires, il faut un nombre qui « ressemble » à du hasard. Un générateur classique (voir [l'aléatoire et les générateurs](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs) ou [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#un-bruit-reproductible-xorshift)) garde un **état** : chaque tirage modifie l'état, et le suivant en dépend. Dans un shader, c'est impossible : les fragments sont calculés en parallèle, dans un ordre quelconque, sans mémoire commune. On utilise donc une **fonction de hachage** (*hash*) : une fonction qui reçoit une valeur (ici une position) et renvoie un nombre qui a l'air aléatoire, mais qui est **entièrement déterminé** par l'entrée. Ne pas la confondre avec le hachage d'une [table de hachage](/?c=langages&s=c&p=tables-de-hachage), qui répond à un autre besoin.

| | Générateur à état (`rand`, xorshift) | Hash sans état |
|---|---|---|
| Entrée | Aucune : on demande « le suivant » | Une position (ou un numéro) |
| Mémoire entre deux appels | Oui, l'état | Non |
| Même position, deux appels | Deux valeurs différentes | **La même valeur** |
| Ordre des appels | Compte | Sans importance |
| Convient à un shader | Non | Oui |

Un bon hash de shader doit avoir trois qualités : être **déterministe** (même entrée, même sortie, d'une image à l'autre, sinon le motif scintille), être **uniforme** (toutes les valeurs de 0 à 1 sortent aussi souvent) et avoir un **effet d'avalanche** (changer un seul bit de l'entrée change environ la moitié des bits de la sortie, donc deux positions voisines donnent des valeurs sans rapport).

## Premier hash : `fract(sin(dot(...)))`

```glsl
float hash31(vec3 p)   // p : un point de l'espace ; résultat : de 0 à moins de 1
{
	float d = dot(p, vec3(12.9898, 78.233, 37.719));   // dot : x*12.99 + y*78.23 + z*37.72
	d = sin(d) * 43758.5453;     // sin : de -1 à 1 ; le grand facteur étale les chiffres
	return fract(d);             // fract : la partie décimale seule (3,7 donne 0,7)
}
```

Le raisonnement : `dot` réduit le point à **un seul nombre** (trois coordonnées voisines donnent un nombre voisin) ; `sin` est une fonction qui oscille vite quand son argument grandit, donc deux arguments proches donnent des sinus différents ; multiplier par 43 758,5453 amplifie ces différences jusqu'aux chiffres décimaux ; `fract` ne garde que ces chiffres, que rien ne relie plus à l'entrée. Les constantes (12,9898 ; 78,233 ; 37,719 ; 43 758,5453) sont devenues courantes par habitude : aucune règle mathématique ne les impose.

C'est court et pratique, mais tout repose sur la précision d'un `float` de 32 bits. Le programme C suivant exécute la même formule en `float`, puis en `double` (64 bits).

```c
#include <math.h>     /* sinf, sin, floorf, floor */
#include <stdio.h>    /* printf */
#include <stdlib.h>   /* qsort */

float	hash_f(float x, float y, float z)      /* fract(sin(dot(p, k)) * 43758.5453) */
{
	float	d = x * 12.9898f + y * 78.233f + z * 37.719f;   /* dot(p, k) en float 32 bits */
	float	v = sinf(d) * 43758.5453f;                      /* sin, puis l'amplification */

	return (v - floorf(v));                                 /* fract : la partie décimale */
}

double	hash_d(double x, double y, double z)   /* la même formule en double (64 bits) */
{
	double	v = sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;

	return (v - floor(v));
}

int	cmp_float(const void *a, const void *b)
{
	float	x = *(const float *)a;
	float	y = *(const float *)b;

	return ((x > y) - (x < y));
}

int	count_distinct(float *v, int n)                  /* combien de valeurs différentes */
{
	int	i;
	int	count = 1;

	qsort(v, n, sizeof(float), cmp_float);
	for (i = 1; i < n; i++)
		if (v[i] != v[i - 1])
			count++;
	return (count);
}

int	main(void)
{
	static float	v[1048576];   /* static : hors de la pile, trop petite pour ce tableau */
	int				i;
	int				bad = 0;
	int				j;

	for (i = 0; i < 8; i++)
		printf("h(%d,0,0) = %.6f\n", i, hash_f((float)i, 0, 0));
	for (i = 0; i < 1048576; i++)
		v[i] = hash_f((float)i, 0, 0);
	printf("float 32 bits : %d valeurs distinctes\n", count_distinct(v, 1048576));
	for (i = 0; i < 1048576; i++)
		v[i] = (float)hash_d(i, 0, 0);
	printf("double        : %d valeurs distinctes\n", count_distinct(v, 1048576));
	for (i = 0; i < 1024; i++)                        /* float contre double, x < 1024 */
		if (fabs(hash_f((float)i, 0, 0) - hash_d(i, 0, 0)) > 0.01)
			bad++;
	printf("écart de plus de 0,01 entre les deux : %d cas sur 1024\n", bad);
	for (i = 0; i < 2; i++)                           /* x = 0, puis x = 1 000 000 */
	{
		printf("x = %d, y de 0 à 0,007 : ", i * 1000000);
		for (j = 0; j < 8; j++)
			printf("%.4f ", hash_f((float)i * 1000000.0f, 0.001f * j, 0));
		printf("\n");
	}
	return (0);
}
```

Sortie réelle (compilé avec `gcc -Wall -Wextra -O1 -ffp-contract=off` ; la dernière option interdit au compilateur de fusionner une multiplication et une addition en une seule opération, ce qui changerait les arrondis) :

```text
h(0,0,0) = 0.000000
h(1,0,0) = 0.941406
h(2,0,0) = 0.085938
h(3,0,0) = 0.589844
h(4,0,0) = 0.367188
h(5,0,0) = 0.335938
h(6,0,0) = 0.460938
h(7,0,0) = 0.987793
float 32 bits : 16691 valeurs distinctes
double        : 1027137 valeurs distinctes
écart de plus de 0,01 entre les deux : 998 cas sur 1024
x = 0, y de 0 à 0,007 : 0.0000 0.8716 0.8232 0.0615 0.0508 0.6348 0.1562 0.5957
x = 1000000, y de 0 à 0,007 : 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1299
```

| Constat | Mesure | Explication |
|---|---|---|
| Très peu de valeurs différentes | 16 691 valeurs distinctes sur 1 048 576 entrées en `float`, contre 1 027 137 en `double` | Le produit `sin(d) * 43758.5453` atteint plusieurs dizaines de milliers : un `float` a 24 bits significatifs, il ne lui en reste que quelques-uns pour les décimales (un pas de 1/256 au-dessus de 32 768, plus fin en dessous). Les sorties du programme sont toutes des multiples de 1/4096 (0,941406 = 3856/4096) |
| Résultat différent selon la précision | Écart de plus de 0,01 entre `float` et `double` pour 998 entrées sur 1 024 | L'erreur d'arrondi du `float` sur `d` est multipliée par le grand facteur : le « hasard » dépend de la précision du calcul |
| Les petits changements disparaissent loin de l'origine | Avec x = 1 000 000, faire varier y de 0,001 en 0,001 donne 0,1680 sept fois de suite | `d` vaut alors environ 13 millions, un `float` y est arrondi à l'unité : le terme `y * 78.233` est **absorbé** (voir [l'absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#l-absorption-et-l-annulation-quand-un-calcul-perd-ses-chiffres) et [les flottants loin de l'origine](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine)) |
| Une entrée nulle donne une sortie nulle | h(0,0,0) = 0,000000 | `sin(0)` vaut 0 : le point 0 ne ressemble pas à du hasard |

Les résultats se rapprochent de l'uniforme (χ² de 21,36 pour 15 degrés de liberté sur 1 048 576 entrées, valeur ordinaire pour un tirage uniforme ; le test est expliqué dans [Comparer deux réglages](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages#verifier-un-tirage-uniforme-le-test-du), mesure faite avec un programme annexe), mais le défaut majeur est ailleurs : la valeur dépend de l'implémentation de `sin`. L'écart `float`/`double` ci-dessus a été mesuré sur le processeur ; que deux cartes graphiques différentes donnent des `sin` différents pour de grands arguments n'a pas pu être mesuré ici (une seule machine), mais la formule y est exposée par construction : un motif calculé avec ce hash peut changer d'aspect d'une carte à l'autre, ou d'un pilote à l'autre.

## Second hash : un entier sans état

La parade consiste à ne plus utiliser de flottants pour mélanger : on travaille sur des **entiers non signés** de 32 bits (`uint` en GLSL, `uint32_t` en C), dont les opérations sont exactes et identiques partout. Un `uint` ne dépasse jamais `2³² - 1` : au-delà, le résultat est calculé **modulo 2³²** (on garde le reste de la division par 2³², donc les bits en trop sont perdus). Deux opérations se répètent :

| Opération | Effet | Pourquoi c'est utile |
|---|---|---|
| `x ^= x >> 16` (xor-décalage) | Décale `x` de 16 positions vers la droite (les bits de poids fort, à gauche, descendent sur les bits de poids faible), puis combine par `^`, le « ou exclusif » : un bit vaut 1 si les deux bits combinés diffèrent (voir [les opérateurs binaires](/?c=langages&s=c&p=operateurs-binaires#les-six-operateurs)) | Une multiplication ne propage les bits que vers le **haut** : le xor-décalage ramène l'information du haut vers le bas |
| `x *= constante impaire` | Multiplie, modulo 2³² | Chaque bit d'entrée se répand sur tous les bits plus hauts ; une constante impaire ne fait perdre aucune information (la multiplication reste réversible) |

```glsl
uint hash_u(uint x)              // uint : entier non signé sur 32 bits, calcul modulo 2^32
{
	x ^= x >> 16;                // xor-décalage : mêle le haut et le bas
	x *= 0x7feb352du;            // multiplie ; 0x : écriture en base 16, u : non signé
	x ^= x >> 15;                // second xor-décalage
	x *= 0x846ca68bu;            // seconde multiplication
	x ^= x >> 16;                // dernier brassage
	return x;
}

float hash_unit(uint h)          // convertit un uint en nombre de 0 à moins de 1
{
	return float(h >> 8) * (1.0 / 16777216.0);   // 24 bits : exacts en float
}
```

Pourquoi `h >> 8` ? Un `float` ne représente exactement que 24 bits d'entier (voir [l'encodage des flottants](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#comment-un-flottant-est-encode)). Écrire `float(h) / 4294967295.0` arrondit : `(float)0xffffffff` vaut 4294967296,0 et le quotient vaut alors exactement 1,0, une valeur que le bruit ne doit jamais produire (mesuré par un programme annexe). En gardant 24 bits, la valeur maximale est 0,99999994.

Les cinq étapes, suivies sur quelques entrées (valeurs en hexadécimal, produites par un programme annexe) :

| Entrée | Après le 1er xor-décalage | Après `* 0x7feb352d` | Après le xor-décalage 15 | Après `* 0x846ca68b` | Sortie |
|---|---|---|---|---|---|
| `0x00000001` | `0x00000001` | `0x7feb352d` | `0x7febcafb` | `0x6889f849` | `0x688990c0` |
| `0x00000002` | `0x00000002` | `0xffd66a5a` | `0xffd795f6` | `0xd113f092` | `0xd1132181` |
| `0x00000003` | `0x00000003` | `0x7fc19f87` | `0x7fc16004` | `0x53f1ba2c` | `0x53f1e9dd` |
| `0x00010000` | `0x00010001` | `0xb518352d` | `0xb5195f1d` | `0xdcaf72bf` | `0xdcafae10` |

On voit que le premier xor-décalage ne fait rien tant que l'entrée tient sur 16 bits (les trois premières lignes) : il ne sert que pour de grandes entrées. Le programme complet, en C (même algorithme que le GLSL) :

```c
#include <stdint.h>   /* uint32_t : entier non signé sur exactement 32 bits */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)
{
	x ^= x >> 16;       /* ramène les 16 bits hauts vers les 16 bits bas */
	x *= 0x7feb352du;   /* multiplie, modulo 2^32 : propage vers le haut */
	x ^= x >> 15;       /* ramène à nouveau le haut vers le bas */
	x *= 0x846ca68bu;   /* seconde multiplication */
	x ^= x >> 16;       /* dernier brassage */
	return (x);
}

float	to_unit(uint32_t h)
{
	return ((float)(h >> 8) * (1.0f / 16777216.0f));   /* 24 bits : de 0 à moins de 1 */
}

int	main(void)
{
	long		count[16] = {0};
	double		chi2 = 0;
	long		bits = 0;
	long		twice = 0;
	uint32_t	x;
	int			b;

	for (x = 0; x < 8; x++)                                  /* voisins 0 à 7 */
		printf("hash(%u) = 0x%08x -> %.6f\n", x, hash_u32(x), to_unit(hash_u32(x)));
	for (x = 0; x < 1048576; x++)                            /* 2^20 entrées consécutives */
		count[(int)(to_unit(hash_u32(x)) * 16.0f)]++;        /* classe de 0 à 15 */
	for (b = 0; b < 16; b++)
		chi2 += (count[b] - 65536.0) * (count[b] - 65536.0) / 65536.0;
	for (b = 0; b < 16; b++)
		printf("%ld%s", count[b], b % 8 == 7 ? "\n" : " ");     /* 8 compteurs par ligne */
	printf("chi2 = %.2f\n", chi2);
	for (x = 0; x < 100000; x++)                             /* 100 000 entrées de départ */
		for (b = 0; b < 32; b++)                             /* popcount : bits à 1 */
			bits += __builtin_popcount(hash_u32(x) ^ hash_u32(x ^ (1u << b)));
	printf("bits changés en moyenne : %.3f sur 32\n", bits / 3200000.0);
	for (x = 1; x < 65536; x++)                              /* h(2x) proche de 2 h(x) ? */
		twice += (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) >= -4
			&& (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) <= 4;
	printf("h(2x) = 2 h(x) à 4 près : %ld cas sur 65535\n", twice);
	return (0);
}
```

Sortie réelle (compilé avec `gcc -Wall -Wextra`) :

```text
hash(0) = 0x00000000 -> 0.000000
hash(1) = 0x688990c0 -> 0.408349
hash(2) = 0xd1132181 -> 0.816698
hash(3) = 0x53f1e9dd -> 0.327910
hash(4) = 0xd97e5ed1 -> 0.849584
hash(5) = 0x5c45d53e -> 0.360441
hash(6) = 0xa7e3d3bb -> 0.655820
hash(7) = 0x948ba1e6 -> 0.580256
65646 65825 65785 65592 65704 65720 65498 65527
65228 65225 65119 65486 65316 65493 65566 65846
chi2 = 11.29
bits changés en moyenne : 15.998 sur 32
h(2x) = 2 h(x) à 4 près : 4079 cas sur 65535
```

| Mesure | Résultat | Lecture |
|---|---|---|
| Distribution sur 1 048 576 entrées consécutives, 16 classes de 65 536 attendues | De 65 119 à 65 846 par classe ; χ² = 11,29 pour 15 degrés de liberté | Compatible avec un tirage uniforme (la valeur attendue d'un χ² est 15, avec un écart d'environ 5,5) |
| Avalanche : un bit d'entrée basculé, 3 200 000 essais | 15,998 bits de sortie changés en moyenne sur 32 | Presque exactement la moitié, comme voulu |
| `hash(0)` | `0x00000000` | L'entrée 0 reste 0 : multiplier et décaler du zéro donne zéro |
| `hash(2)` contre `2 x hash(1)` | 0,816698 contre 2 x 0,408349 = 0,816698 | Pour les petites entrées, la sortie garde une trace de l'entrée |
| `h(2x)` égal à `2 h(x)` à 4 près | 4 079 entrées sur 65 535 | Environ 6 % des petites entrées : le hash est bon pour des motifs, pas pour de la sécurité |

Comment hacher **plusieurs coordonnées** (x, y, z entiers) avec une fonction qui n'en prend qu'une : on enchaîne, en injectant chaque coordonnée dans le hash de la suivante. Dans le code du bruit plus bas : `hash_u(x ^ hash_u(y ^ hash_u(z)))`.

## Le bruit de valeur 3D

Appeler `hash_unit(hash_u(...))` pour chaque pixel donne du **bruit blanc** (du grain sans aucun lien entre voisins) : utile pour du grain de film, inutilisable pour dessiner un nuage, un marbre ou des rayures déformées. Le **bruit de valeur** (*value noise*) en tire un bruit **doux** : on pose un hash aux **coins d'une grille** régulière, puis on **lisse** entre les coins.

### La grille et la cellule

La grille a un coin à chaque point dont les trois coordonnées sont entières. Un point `p` tombe dans une **cellule** (un cube de côté 1) ; `floor(p)` (la partie entière, ex. `floor(2.3)` vaut 2) donne le coin bas de cette cellule et `fract(p)` (la partie décimale) donne la position de `p` à l'intérieur, de 0 à 1 sur chaque axe. Vue en 2D (pour tenir sur une page) :

```text
 y
 6 |  c(2,6)------------------c(3,6)
   |    |                       |
   |    |        p = (2.3, 5.7) |   i = floor(p) = (2, 5)
   |    |   fy=0.7  *           |   f = fract(p) = (0.3, 0.7)
   |    |      <-fx=0.3->       |
 5 |  c(2,5)------------------c(3,5)
   |
   +----------------------------------> x
 chaque c(i,j) : la valeur du hash au coin (i, j)
```

En 3D, la cellule a **8 coins** (chaque coin entier plus 0 ou 1 sur chacun des trois axes). Un coin est toujours **le même** pour toutes les cellules qui le partagent : il n'est pas stocké, il est recalculé par le hash à chaque fois, et donne la même valeur.

### La courbe de lissage

Entre deux coins, la valeur est un mélange (`mix`, voir [le reflet de Fresnel](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#le-reflet-de-fresnel-plus-on-regarde-de-biais-plus-ca-reflete)) : `mix(a, b, t) = a x (1 - t) + b x t`. Avec `t` égal directement à `fract(p)`, la valeur varie en ligne droite d'un coin à l'autre, mais la **pente** (de combien la valeur monte par unité de déplacement) change brusquement quand on franchit une face de cellule, ce qui laisse apparaître la grille. On remplace `t` par `t * t * (3 - 2 * t)`, une courbe de Hermite (une courbe polynomiale du troisième degré) : c'est la formule de `smoothstep(0.0, 1.0, t)`, fonction GLSL qui vaut 0 sous le premier seuil, 1 au-dessus du second et suit cette courbe entre les deux (voir [la fiche de référence](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml), et un exemple d'atténuation dans [l'édition de maillage](/?c=fondamentaux&s=graphisme&p=edition-de-maillage-et-selection-proportionnelle)). Sa pente est nulle en 0 et en 1 : de part et d'autre d'une face, la valeur arrive et repart à plat, sans cassure.

| `t` | Mélange en ligne droite | Courbe lissée |
|---|---|---|
| 0 | 0,00000 | 0,00000 |
| 0,25 | 0,25000 | 0,15625 |
| 0,5 | 0,50000 | 0,50000 |
| 0,75 | 0,75000 | 0,84375 |
| 1 | 1,00000 | 1,00000 |

### Les 8 coins et l'interpolation trilinéaire

Le mélange se fait axe par axe, c'est l'**interpolation trilinéaire** : 4 mélanges le long de x (les 8 coins se réduisent à 4 valeurs), 2 le long de y (4 valeurs deviennent 2), 1 le long de z.

```text
 8 coins                 après x            après y        après z
 c000 c100  --mix x-->   x00  \
 c010 c110  --mix x-->   x10  / --mix y--> y0  \
 c001 c101  --mix x-->   x01  \                 --mix z--> bruit
 c011 c111  --mix x-->   x11  / --mix y--> y1  /
```

```glsl
float corner(ivec3 c)            // ivec3 : trois entiers ; valeur du hash au coin c
{
	uvec3 u = uvec3(c);                  // uvec3 : trois uint ; mêmes bits, sans signe
	return hash_unit(hash_u(u.x ^ hash_u(u.y ^ hash_u(u.z))));   // chaîne des 3 axes
}

float value_noise(vec3 p)        // résultat : de 0 à moins de 1, continu en p
{
	ivec3 i = ivec3(floor(p));            // coin bas de la cellule
	vec3 f = fract(p);                    // position dans la cellule, de 0 à 1
	vec3 u = f * f * (3.0 - 2.0 * f);     // courbe lissée appliquée aux trois axes
	// 4 mélanges en x, un par paire de coins voisins
	float x00 = mix(corner(i), corner(i + ivec3(1, 0, 0)), u.x);
	float x10 = mix(corner(i + ivec3(0, 1, 0)), corner(i + ivec3(1, 1, 0)), u.x);
	float x01 = mix(corner(i + ivec3(0, 0, 1)), corner(i + ivec3(1, 0, 1)), u.x);
	float x11 = mix(corner(i + ivec3(0, 1, 1)), corner(i + ivec3(1, 1, 1)), u.x);
	return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);   // 2 mélanges en y, 1 en z
}
```

Le point `p = (2.3, 5.7, 1.1)` donne `i = (2, 5, 1)`, `f = (0,3 ; 0,7 ; 0,1)` et, après la courbe, `u = (0,216 ; 0,784 ; 0,028)` (par exemple `0,3 x 0,3 x (3 - 0,6) = 0,216`). Les huit valeurs de coin, produites par le programme C plus bas, puis les mélanges :

| Coin | Valeur |
|---|---|
| (2, 5, 1) | 0,482036 |
| (3, 5, 1) | 0,212697 |
| (2, 6, 1) | 0,329994 |
| (3, 6, 1) | 0,220200 |
| (2, 5, 2) | 0,533925 |
| (3, 5, 2) | 0,170217 |
| (2, 6, 2) | 0,700765 |
| (3, 6, 2) | 0,960027 |

| Étape | Calcul | Valeur |
|---|---|---|
| `x00` | mix des coins (2,5,1) et (3,5,1), poids 0,216 | 0,423859 |
| `x10` | coins (2,6,1) et (3,6,1) | 0,306279 |
| `x01` | coins (2,5,2) et (3,5,2) | 0,455364 |
| `x11` | coins (2,6,2) et (3,6,2) | 0,756766 |
| `y0` | mix de `x00` et `x10`, poids 0,784 | 0,331676 |
| `y1` | mix de `x01` et `x11`, poids 0,784 | 0,691663 |
| bruit | mix de `y0` et `y1`, poids 0,028 | 0,341756 |

Les mélanges intermédiaires ont été recalculés à la main à partir des huit coins (le programme C ne les affiche pas) ; le résultat final concorde avec celui du programme.

```c
#include <math.h>     /* floorf, fabsf, sqrt */
#include <stdint.h>   /* uint32_t */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)           /* le hash entier de la section précédente */
{
	x ^= x >> 16;
	x *= 0x7feb352du;
	x ^= x >> 15;
	x *= 0x846ca68bu;
	x ^= x >> 16;
	return (x);
}

float	corner(int x, int y, int z)            /* valeur du coin, de 0 à moins de 1 */
{
	uint32_t	h = hash_u32((uint32_t)x ^ hash_u32((uint32_t)y ^ hash_u32((uint32_t)z)));

	return ((float)(h >> 8) * (1.0f / 16777216.0f));
}

float	mix(float a, float b, float t)         /* a pour t = 0, b pour t = 1 */
{
	return (a * (1.0f - t) + b * t);
}

float	curve(float t, int smooth)             /* smooth = 1 : lissée ; 0 : droite */
{
	return (smooth ? t * t * (3.0f - 2.0f * t) : t);
}

float	noise(float px, float py, float pz, int smooth)
{
	int		ix = (int)floorf(px);          /* coin bas de la cellule */
	int		iy = (int)floorf(py);
	int		iz = (int)floorf(pz);
	float	fx = curve(px - floorf(px), smooth);   /* position dans la cellule, lissée */
	float	fy = curve(py - floorf(py), smooth);
	float	fz = curve(pz - floorf(pz), smooth);
	float	x00 = mix(corner(ix, iy, iz), corner(ix + 1, iy, iz), fx);
	float	x10 = mix(corner(ix, iy + 1, iz), corner(ix + 1, iy + 1, iz), fx);
	float	x01 = mix(corner(ix, iy, iz + 1), corner(ix + 1, iy, iz + 1), fx);
	float	x11 = mix(corner(ix, iy + 1, iz + 1), corner(ix + 1, iy + 1, iz + 1), fx);

	return (mix(mix(x00, x10, fy), mix(x01, x11, fy), fz));   /* y puis z */
}

float	max_gap(int smooth)                   /* plus grand saut entre deux points voisins */
{
	float	gap = 0;
	float	x;
	int		s;

	for (s = 1; s <= 200; s++)             /* x de 0,900 à 1,100, pas de 0,001 */
	{
		x = 0.9f + 0.001f * s;
		gap = fmaxf(gap, fabsf(noise(x, 0.3f, 0.6f, smooth)
					- noise(x - 0.001f, 0.3f, 0.6f, smooth)));
	}
	return (gap);
}

float	slope(float x0, float x1, int smooth)  /* pente entre x0 et x1, y et z fixes */
{
	float	d = noise(x1, 0.3f, 0.6f, smooth) - noise(x0, 0.3f, 0.6f, smooth);

	return (d / (x1 - x0));
}

void	stats(void)                            /* moyenne, écart-type : 10^6 points */
{
	uint32_t	r = 1;
	double		sum[2] = {0, 0};
	double		sq[2] = {0, 0};
	float		p[3];
	float		v[2];
	int			i;
	int			k;

	for (i = 0; i < 1000000; i++)
	{
		for (k = 0; k < 3; k++)            /* trois coordonnées dans [0, 64[ */
		{
			r = hash_u32(r + 1);
			p[k] = (float)(r >> 8) * (64.0f / 16777216.0f);
		}
		v[0] = noise(p[0], p[1], p[2], 1);
		v[1] = corner((int)p[0], (int)p[1], (int)p[2]);   /* le hash seul */
		for (k = 0; k < 2; k++)
		{
			sum[k] += v[k];
			sq[k] += (double)v[k] * v[k];
		}
	}
	for (k = 0; k < 2; k++)
		printf("%s : moyenne %.4f, écart-type %.4f\n", k ? "hash " : "bruit", sum[k] / 1e6,
			sqrt(sq[k] / 1e6 - sum[k] / 1e6 * sum[k] / 1e6));
}

int	main(void)
{
	int	s;

	for (s = 0; s < 8; s++)                      /* les 8 coins de la cellule (2, 5, 1) */
		printf("coin (%d,%d,%d) = %.6f\n", 2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2),
			corner(2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2)));
	printf("noise(2.3, 5.7, 1.1) = %.6f\n", noise(2.3f, 5.7f, 1.1f, 1));
	for (s = 0; s < 4; s++)                      /* points entiers : bruit = coin */
		printf("noise(%d,2,3) = %.6f, coin = %.6f\n", s, noise(s, 2, 3, 1), corner(s, 2, 3));
	printf("écart max entre voisins : lissée %.6f, droite %.6f\n", max_gap(1), max_gap(0));
	printf("pente avant x = 1 : lissée %.5f, droite %.5f\n", slope(0.99f, 1.0f, 1),
		slope(0.99f, 1.0f, 0));
	printf("pente après x = 1 : lissée %.5f, droite %.5f\n", slope(1.0f, 1.01f, 1),
		slope(1.0f, 1.01f, 0));
	stats();
	return (0);
}
```

Sortie réelle (compilé avec `gcc -Wall -Wextra -O1 -ffp-contract=off`) :

```text
coin (2,5,1) = 0.482036
coin (3,5,1) = 0.212697
coin (2,6,1) = 0.329994
coin (3,6,1) = 0.220200
coin (2,5,2) = 0.533925
coin (3,5,2) = 0.170217
coin (2,6,2) = 0.700765
coin (3,6,2) = 0.960027
noise(2.3, 5.7, 1.1) = 0.341756
noise(0,2,3) = 0.164228, coin = 0.164228
noise(1,2,3) = 0.675743, coin = 0.675743
noise(2,2,3) = 0.459813, coin = 0.459813
noise(3,2,3) = 0.143211, coin = 0.143211
écart max entre voisins : lissée 0.000312, droite 0.000575
pente avant x = 1 : lissée 0.01732, droite 0.57474
pente après x = 1 : lissée 0.00376, droite 0.13027
bruit : moyenne 0.4997, écart-type 0.1849
hash  : moyenne 0.4997, écart-type 0.2891
```

| Mesure | Courbe lissée | Droite (pas de lissage) |
|---|---|---|
| Plus grand écart entre deux points distants de 0,001, x de 0,9 à 1,1 | 0,000312 | 0,000575 |
| Pente juste avant la face x = 1 (pas de 0,01) | 0,01732 | 0,57474 |
| Pente juste après la face x = 1 | 0,00376 | 0,13027 |

Avec la droite, la pente passe de 0,57 à 0,13 en franchissant la face : un coude, donc une arête visible dans le motif. Avec la courbe, les deux pentes sont proches de 0 (il reste l'effet du pas de mesure de 0,01) : la transition est invisible. Aux points entiers, le bruit vaut exactement le hash du coin (les quatre lignes `noise(s,2,3)`). Et le bruit est **continu** : deux points distants de 0,001 ont des valeurs voisines, alors que deux hash successifs sautent (de 0,000000 à 0,408349 entre les entrées 0 et 1 de la sortie du hash entier).

Autre mesure, sur 1 000 000 de points répartis dans un cube de côté 64 : le bruit vaut 0,4997 en moyenne avec un écart-type (qui mesure à quel point les valeurs s'écartent de la moyenne) de 0,1849, alors que le hash seul a la même moyenne (0,4997) mais un écart-type de 0,2891. Le bruit est donc **moins contrasté** que son hash : chaque valeur est une moyenne de huit coins, donc elle s'écarte moins de 0,5. Pour obtenir un contraste plein, on étire le résultat autour de 0,5 (par exemple `0.5 + (n - 0.5) * 1.5`, le facteur 1,5 étant à régler à l'œil) en bornant avec `clamp` (`clamp(x, 0.0, 1.0)` ramène `x` dans l'intervalle de 0 à 1).

### Rayures déformées et octaves

Un usage direct : déformer une fonction régulière. Ici, des rayures dont la position est perturbée par le bruit :

```glsl
float stripes(vec3 p)
{
	float wobble = value_noise(p * 2.0);                // bruit lent : cellule de 0,5
	float s = sin(p.x * 16.0 + wobble * 2.0);           // rayures décalées par le bruit
	return smoothstep(-0.7, -0.3, s);                   // 0 sous -0,7, 1 au-dessus de -0,3
}
```

Une seule couche de bruit donne des taches de la taille d'une cellule. Pour un aspect naturel (nuages, relief), on additionne plusieurs **octaves** : la même fonction à une fréquence doublée (détails deux fois plus fins) et une amplitude divisée par deux (détails moins visibles). Cette somme s'appelle un bruit **fractal** (*fBm*).

```glsl
float fbm(vec3 p)                // somme de 4 octaves de bruit de valeur
{
	float sum = 0.0;             // total accumulé
	float amp = 0.5;             // amplitude de la première octave
	for (int k = 0; k < 4; k++)
	{
		sum += amp * value_noise(p);   // ajoute une couche
		p *= 2.0;                      // fréquence doublée : détails deux fois plus fins
		amp *= 0.5;                    // amplitude divisée par deux
	}
	return sum;                  // au plus 0,5 + 0,25 + 0,125 + 0,0625 = 0,9375
}
```

## Choisir son hash

| | `fract(sin(dot(...)))` | Hash entier (xor-décalages et multiplications) |
|---|---|---|
| Calcul | En `float`, très sensible aux arrondis | En entiers, exact modulo 2³² |
| Même résultat d'une carte à l'autre | Non garanti (dépend de `sin`) | Oui, si la carte gère les `uint` |
| Entrées de grande taille | Les petits changements s'absorbent | Les 32 bits de l'entrée comptent tous |
| Disponibilité | Partout | `uint` et opérateurs binaires : GLSL 1.30 et suivants, donc `#version 330` convient |
| Lisibilité | Une ligne | Cinq lignes, des constantes opaques |
| Quand l'utiliser | Prototype rapide, entrées petites et résultat qui peut varier | Tout motif qui doit être **reproductible** |

## Les pièges

| Piège | Pourquoi c'est un problème | Parade |
|---|---|---|
| Une entrée entière de fragment sans `flat` | Une moyenne d'entiers n'est pas un entier : refus du shader | `flat` des deux côtés (sortie et entrée), même nom |
| Un indice `flat` utilisé hors du tableau | `palette[v_material]` avec un indice trop grand : résultat indéfini, sans message | Contrôler l'indice côté C, ou le borner avec `clamp` |
| Attribut entier déclaré avec `glVertexAttribPointer` | La carte convertit l'entier en flottant | `glVertexAttribIPointer` |
| Un sommet partagé par des faces qui veulent des valeurs différentes | Le sommet provoquant ne porte qu'une valeur : une face reçoit celle d'une autre | Dupliquer les sommets, ou passer par un geometry shader |
| Supposer que `flat` prend le premier sommet | Le réglage par défaut est le dernier | `glProvokingVertex` si on veut l'autre, et le poser une fois pour tout le programme |
| `fract(sin(...))` avec de grandes entrées | Les petits changements d'entrée s'absorbent : zones de valeur constante (0,1680 sept fois de suite pour x = 1 000 000) | Garder les entrées petites (soustraire une origine), ou utiliser le hash entier |
| `fract(sin(...))` et reproductibilité | Le même code peut donner d'autres valeurs sur une autre carte | Hash entier pour tout ce qui doit se retrouver |
| Hash entier : l'entrée 0 donne 0 | `hash(0)` vaut `0x00000000` | Ajouter une constante à la graine ou à la coordonnée avant de hacher |
| Diviser un `uint` par `4294967295.0` | `(float)0xffffffff` vaut 4294967296 : on obtient 1,0 | Garder 24 bits : `float(h >> 8) * (1.0 / 16777216.0)` |
| Coordonnées négatives converties en `uint` | En C, le résultat est le même motif de 32 bits (modulo 2³²) ; en GLSL, vérifier la conversion `int` vers `uint` dans la spécification de votre version | Décaler les coordonnées pour qu'elles restent positives, ou tester sur la cible |
| Bruit de valeur sans lissage | La pente change à chaque face de cellule : la grille se voit | Appliquer `t * t * (3.0 - 2.0 * t)` avant les mélanges |
| Croire le bruit aussi contrasté que le hash | Écart-type de 0,1849 contre 0,2891 | Étirer le résultat autour de 0,5, puis borner |
| Un hash entier pour de la sécurité | Il suffit à un shader, il n'est pas fait pour résister à un attaquant (6 % des petites entrées vérifient `h(2x)` proche de `2 h(x)`) | Pour un secret, voir [l'aléatoire et les générateurs](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#deux-familles-a-ne-pas-confondre) |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Écrire `flat` sur la sortie **et** l'entrée, avec le même nom | Aucune ambiguïté sur l'interpolation attendue |
| Réserver `flat` aux données par triangle (identifiant, matériau, face) | Le reste (couleur, texture, normale lissée) doit rester interpolé |
| Décider dès le départ de la convention du sommet provoquant, et la noter | Un changement ultérieur fait changer la valeur de chaque face |
| Préférer un hash entier à `fract(sin(...))` dès que le motif doit être reproductible | Les entiers donnent le même résultat partout |
| Ramener un `uint` à un `float` par 24 bits, jamais par une division par `2³² - 1` | La sortie reste dans [0, 1[ et exacte |
| Brasser plusieurs coordonnées en chaînant `hash_u(a ^ hash_u(b ^ ...))` | Un seul mélange par coordonnée suffit, et l'ordre des axes compte |
| Mesurer son hash (distribution, avalanche) avant de l'utiliser | Les trois tests des programmes C ci-dessus se refont en quelques lignes |
| Lisser le bruit de valeur avec la courbe de Hermite | La grille de cellules disparaît |
| Ajuster le contraste du bruit après coup | La moyenne de huit coins s'écarte peu de 0,5 |
| Commencer avec une octave, en ajouter seulement si le rendu l'exige | Chaque octave coûte huit hash par pixel |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un fragment reçoit par défaut une moyenne pondérée (interpolation) des valeurs des trois sommets ; `flat` supprime la moyenne et donne à tout le triangle la valeur d'un seul sommet, le sommet provoquant (le dernier par défaut, `GL_LAST_VERTEX_CONVENTION`, modifiable par `glProvokingVertex`). Une entrée de fragment de type entier doit être `flat`. Les usages : identifiant d'objet, indice de matériau, couleur ou normale par face. Un shader n'a pas de générateur à état : il utilise une fonction de hachage, déterminée par la position. `fract(sin(dot(...)) * 43758.5453)` est court mais dépend de la précision du `float` (16 691 valeurs distinctes sur 1 048 576 entrées, 998 écarts de plus de 0,01 contre le même calcul en `double`, valeurs constantes loin de l'origine). Le hash entier (xor-décalage, multiplication par `0x7feb352d`, xor-décalage, multiplication par `0x846ca68b`, xor-décalage) est exact, uniforme (χ² de 11,29 pour 15 degrés de liberté) et change 15,998 bits sur 32 en moyenne quand un bit d'entrée change. Le bruit de valeur 3D pose un hash aux coins d'une grille, lisse par `t * t * (3 - 2 * t)` et combine les 8 coins par trois mélanges successifs (interpolation trilinéaire). |
| **Pièges à éviter** | Un entier de fragment sans `flat` ; un sommet partagé qui porte la valeur de plusieurs faces ; un attribut entier sans `glVertexAttribIPointer` ; `fract(sin(...))` avec de grandes entrées ou quand le résultat doit se retrouver sur une autre carte ; l'entrée 0 qui donne 0 ; la division par `4294967295.0` qui donne 1,0 ; un bruit sans lissage ; un bruit moins contrasté que son hash. |
| **Bonnes pratiques** | `flat` des deux côtés avec le même nom ; hash entier pour tout motif reproductible ; 24 bits pour passer d'un `uint` à un `float` ; courbe de Hermite avant les mélanges ; mesurer la distribution et l'avalanche d'un hash ; ajouter des octaves seulement si nécessaire. |
