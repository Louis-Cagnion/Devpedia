---
order: 5
---

# Matrices et caméra

Le [chapitre précédent](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) envoie des sommets à la carte graphique, mais ils s'affichent tels quels, à plat. Pour **déplacer** un objet, le **faire tourner** et le **regarder en perspective** depuis une caméra, il faut des **matrices**. Ce chapitre construit les trois matrices d'un rendu 3D, la caméra, la perspective, la rotation autour d'un axe quelconque, et le calcul qui cadre automatiquement un objet.

> **Prérequis :** une [matrice](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) est un tableau de nombres, et multiplier une matrice par un [vecteur](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) donne un nouveau vecteur. Ici, chaque matrice **transforme** un point : elle le déplace, le fait tourner ou l'écrase vers l'écran.

## De l'objet à l'écran : model, view, projection

Un sommet change de **repère** (système de coordonnées) quatre fois avant d'atteindre un pixel. Trois matrices font ces changements :

| Matrice | Nom courant | Passe de... à... | Contient |
|---|---|---|---|
| **M** | *model* (modèle) | l'objet → le **monde** | Position, rotation, échelle de cet objet |
| **V** | *view* (vue) | le monde → la **caméra** | Où est la caméra et où elle regarde |
| **P** | *projection* | la caméra → l'**écran** | Perspective (les objets lointains rapetissent) |

```text
sommet de l'objet      repère du monde       repère de la caméra     coordonnées écran
   (x, y, z, 1)  --M-->   (monde)     --V-->    (caméra)       --P-->   (clip → NDC)
```

« Clip » est le résultat brut de `P` ; il devient les coordonnées écran (NDC) après la division décrite dans la section sur la perspective.

Le vertex shader (le [programme exécuté pour chaque sommet](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), vu au chapitre précédent) calcule `P * V * M * sommet` : on lit de **droite à gauche** (d'abord M, puis V, puis P). Inverser l'ordre donne un résultat faux, sans erreur.

**Pourquoi des matrices 4×4 pour des points 3D ?** Un point `(x, y, z)` s'écrit `(x, y, z, 1)`, dit en **coordonnées homogènes** ([explication](https://en.wikipedia.org/wiki/Homogeneous_coordinates)). La quatrième colonne de la matrice sert alors à **translater** (déplacer), ce qu'une matrice 3×3 ne sait pas faire. Le quatrième nombre sert aussi à la perspective (voir plus bas).

| Transformation | Matrice 4×4 (lignes) |
|---|---|
| **Translation** de `(tx, ty, tz)` | `1 0 0 tx` / `0 1 0 ty` / `0 0 1 tz` / `0 0 0 1` |
| **Échelle** de `(sx, sy, sz)` | `sx 0 0 0` / `0 sy 0 0` / `0 0 sz 0` / `0 0 0 1` |
| **Rotation** de `a` autour de Z | `cos a  -sin a  0 0` / `sin a  cos a  0 0` / `0 0 1 0` / `0 0 0 1` |

`cos a` et `sin a` sont le **cosinus** et le **sinus** de l'angle `a`, exprimé ici en **radians** (une unité d'angle : 180° valent π ≈ 3,14 rad et 90° valent ≈ 1,57 rad) : deux nombres compris entre -1 et 1 qui donnent le point `(cos a, sin a)` où l'on arrive en tournant de `a` depuis `(1, 0)` sur un cercle de rayon 1.

> **Piège (ordre des éléments en mémoire) :** OpenGL attend la matrice **colonne par colonne** (*column-major*) : l'élément de la ligne `r` et de la colonne `c` est à l'indice `c * 4 + r` du tableau de 16 `float`. Le tableau ci-dessus lit donc `m[12]`, `m[13]`, `m[14]` pour `tx`, `ty`, `tz`. On l'envoie avec `glUniformMatrix4fv(loc, 1, GL_FALSE, m)` ; le `GL_FALSE` veut dire « ne pas **transposer** » (échanger lignes et colonnes, cf. la [transposée](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transposee-echanger-lignes-et-colonnes)), car le tableau est déjà dans le bon ordre. Une matrice écrite ligne par ligne et envoyée telle quelle produit un objet déformé ou absent.

## La caméra : `look_at`

Une caméra n'existe pas vraiment : on **déplace le monde en sens inverse**. La matrice de vue place la caméra à l'origine, tournée vers l'axe **-Z**. On la construit à partir de trois informations : la position de l'œil (`eye`), le point regardé (`target`) et la direction du haut (`up`, souvent `(0, 1, 0)`).

Deux opérations vectorielles reviennent. **Normaliser** un vecteur, c'est le diviser par sa longueur pour qu'elle vaille 1 en gardant sa direction (`(0, 3, 4)` devient `(0, 0,6, 0,8)`). Le **produit vectoriel** `a x b` de deux vecteurs est un troisième vecteur **perpendiculaire** (à angle droit) aux deux, nul si `a` et `b` sont parallèles (`(1, 0, 0) x (0, 1, 0) = (0, 0, 1)`). Le **produit scalaire** (`vdot`, vu dans le [chapitre sur les vecteurs](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) vaut 0 pour deux vecteurs perpendiculaires.

```text
f = normaliser(target - eye)     avant : où regarde la caméra
s = normaliser(f x up)           droite : perpendiculaire à f et à up  (x = produit vectoriel)
u = s x f                        haut réel : perpendiculaire aux deux autres
```

Ces trois directions, perpendiculaires entre elles, forment les lignes de la matrice de vue ; la dernière colonne annule la position de l'œil.

Une valeur `NaN` (*Not a Number*) est le résultat spécial d'un `float` pour un calcul impossible (`0 / 0`) : elle traverse tous les calculs suivants sans erreur ([détails](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)). D'où le test écrit `!(len > 1e-6f)` plutôt que `len <= 1e-6f` : le premier refuse aussi `NaN`, le second le laisse passer.

```c
typedef struct { float x, y, z; } Vec3;

/* Normalise v. Renvoie 0 (et ne touche à rien) si sa longueur est quasi nulle. */
static int vnormalize(Vec3 *v)
{
	float len = sqrtf(v->x * v->x + v->y * v->y + v->z * v->z);

	if (!(len > 1e-6f))                      /* la forme « !(a > b) » refuse aussi NaN */
		return 0;
	v->x /= len;
	v->y /= len;
	v->z /= len;
	return 1;
}

/* Matrice de vue (colonne par colonne). Renvoie 0 si l'œil est sur la cible ou si
   la direction de visée est parallèle à « up » : la droite n'est alors pas définie. */
int look_at(float m[16], Vec3 eye, Vec3 target, Vec3 up)
{
	Vec3 f = vsub(target, eye);              /* vsub, vcross, vdot : calculs vectoriels de base */
	Vec3 s, u;

	if (!vnormalize(&f))
		return 0;
	s = vcross(f, up);
	if (!vnormalize(&s))
		return 0;
	u = vcross(s, f);
	memset(m, 0, 16 * sizeof(float));
	m[0] = s.x;  m[4] = s.y;  m[8]  = s.z;   m[12] = -vdot(s, eye);
	m[1] = u.x;  m[5] = u.y;  m[9]  = u.z;   m[13] = -vdot(u, eye);
	m[2] = -f.x; m[6] = -f.y; m[10] = -f.z;  m[14] =  vdot(f, eye);
	m[15] = 1.0f;
	return 1;
}
```

Vérification par exécution, avec `eye = (3, 2, 5)` et `target = (1, 0, 0)` : l'œil devient `(0, 0, 0)` et la cible `(0, 0, -5,74)`, soit exactement la distance qui les sépare, sur l'axe -Z.

> **Piège (le cas dégénéré) :** quand on regarde **pile vers le haut ou vers le bas** (`f` parallèle à `up`), le produit vectoriel `f x up` vaut zéro et la normalisation divise par zéro : la matrice se remplit de `NaN` et l'écran devient vide. `look_at` doit **refuser** ce cas avec un message précis, ou l'appelant doit alors prendre un autre `up` (par exemple `(0, 0, 1)`). Même chose si `eye == target`.

## La perspective

La matrice de projection écrase le volume visible, une **pyramide tronquée** (le *frustum*), dans un cube. Quatre paramètres la définissent :

| Paramètre | Rôle | Domaine valide |
|---|---|---|
| `fov` | Angle d'ouverture **vertical** (*field of view*), en radians | `0 < fov < π` |
| `aspect` | Largeur / hauteur de la fenêtre | `aspect > 0` |
| `near` | Distance du plan **proche** : ce qui est plus près est coupé | `near > 0` |
| `far` | Distance du plan **lointain** : ce qui est plus loin est coupé | `far > near` |

`tanf` calcule la **tangente** d'un angle : plus l'angle d'ouverture est grand, plus elle grandit, et plus la scène paraît « dézoomée ». Sous Windows, `<windows.h>` définit `near` et `far` comme des **macros** (des mots que le préprocesseur remplace par du texte avant la compilation, cf. [en-têtes et macros](/?c=langages&s=c&p=headers)) : les paramètres s'appellent donc `near_plane` et `far_plane`.

```c
/* Matrice de projection en perspective (colonne par colonne). Renvoie 0 si un paramètre
   sort de son domaine. */
int perspective(float m[16], float fov, float aspect, float near_plane, float far_plane)
{
	float f;

	if (!(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f)
		|| !(near_plane > 0.0f) || !(far_plane > near_plane))
		return 0;
	f = 1.0f / tanf(fov / 2.0f);             /* grand angle d'ouverture : f petit, scène « dézoomée » */
	memset(m, 0, 16 * sizeof(float));
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far_plane + near_plane) / (near_plane - far_plane);
	m[11] = -1.0f;                           /* recopie -z dans w : c'est ce qui crée la perspective */
	m[14] = 2.0f * far_plane * near_plane / (near_plane - far_plane);
	return 1;
}
```

**Où est la perspective ?** Le résultat `(x, y, z, w)` de `P * V * M * sommet` n'est pas encore l'écran : la carte graphique le divise par `w` (la **division perspective**). Comme `m[11] = -1`, `w` vaut la **distance** à la caméra : plus un point est loin, plus on divise, plus il rapetisse. Après division, `z` est compris entre -1 (plan proche) et +1 (plan lointain), c'est l'espace **NDC** (*normalized device coordinates*). Mesuré avec `near = 0,1` et `far = 100` : un point à `z = -0,1` donne -1, un point à `z = -100` donne +1.

> **Piège (les violations du domaine) :** chacune casse l'image **sans erreur d'OpenGL**.
>
> | Violation | Conséquence |
> |---|---|
> | `near = 0` | Division par zéro : matrice infinie, plus rien à l'écran |
> | `near > far` | Profondeur inversée : l'objet lointain passe devant |
> | `fov = π` ou `0` | `tan` infinie ou nulle : image vide |
> | `aspect = 0` (fenêtre réduite à une ligne) | Division par zéro |
> | `near` minuscule | Profondeur **inutilisable** : à `z = -50`, la profondeur normalisée vaut déjà 0,998, donc presque tout l'objet tombe sur quelques valeurs voisines, et deux surfaces proches se « battent » (*z-fighting*, scintillement) |
>
> Pour `near` et `far`, mieux vaut un rapport `far / near` raisonnable (quelques milliers au plus) qu'un `near` « le plus petit possible ».

Un calcul comme `near = distance - rayon` peut valoir 0 (ou même devenir négatif) quand la caméra touche l'objet : la section sur le cadrage plus bas explique la parade.

## Faire tourner un objet : la rotation accumulée

Pour une rotation à la souris, la tentation est de garder l'objet orienté par **une seule matrice 3×3** `R` et, à chaque image, de la multiplier par une petite rotation `d` : `R = d * R`. Chaque produit arrondit les `float` ; les trois lignes de `R`, censées rester perpendiculaires et de longueur 1 (on dit que la matrice est **orthonormale**), **dérivent** lentement : la matrice déforme (incline, étire) l'objet au lieu de seulement le tourner.

| Nombre de petites rotations (0,01 rad) | Écart mesuré à une vraie rotation |
|---|---|
| 100 | 0,000004 |
| 10 000 | 0,00014 |
| 100 000 | 0,0014 |
| 1 000 000 | 0,014 |

La parade : **réorthonormaliser** de temps en temps, c'est-à-dire redresser les lignes (procédé de **Gram-Schmidt**, [détail](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)).

```c
/* Redresse une matrice de rotation 3×3 (lignes) dérivée : lignes de longueur 1,
   perpendiculaires. Après l'appel sur le cas ci-dessus, l'écart retombe à 1e-7. */
void reorthonormalize(float r[3][3])
{
	Vec3 a = {r[0][0], r[0][1], r[0][2]};
	Vec3 b = {r[1][0], r[1][1], r[1][2]};
	Vec3 c;
	float d;

	vnormalize(&a);                          /* 1re ligne : longueur 1 */
	d = vdot(b, a);
	b = (Vec3){b.x - d * a.x, b.y - d * a.y, b.z - d * a.z};   /* retire de b sa part parallèle à a */
	vnormalize(&b);
	c = vcross(a, b);                        /* 3e ligne : perpendiculaire aux deux autres */
	r[0][0] = a.x; r[0][1] = a.y; r[0][2] = a.z;
	r[1][0] = b.x; r[1][1] = b.y; r[1][2] = b.z;
	r[2][0] = c.x; r[2][1] = c.y; r[2][2] = c.z;
}
```

> **Alternative :** un **quaternion** ([présentation](https://en.wikipedia.org/wiki/Quaternion)) représente une rotation avec 4 nombres au lieu de 9 et se redresse en le divisant par sa norme (sa longueur). Le choix d'une matrice reste raisonnable tant qu'on réorthonormalise.

## Tourner autour d'un axe quelconque : la formule de Rodrigues

Tourner autour de X, Y ou Z est simple (tableau plus haut). Pour un **axe quelconque** `k` (vecteur de longueur 1) et un angle `θ`, la **formule de Rodrigues** ([détail](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula)) donne la matrice directement :

| Terme | Valeur (avec `c = cos θ`, `s = sin θ`, `t = 1 - c`) |
|---|---|
| Diagonale | `c + t·k.x²`, `c + t·k.y²`, `c + t·k.z²` |
| Hors diagonale | `t·k.a·k.b` plus ou moins `s·k.c`, où `c` est le **troisième** axe (a, b, c = x, y, z dans un ordre cyclique) ; les signes sont ceux du code ci-dessous |

```c
/* Rotation d'angle « angle » (radians) autour de « axis » (normalisé ici), lignes r[ligne][colonne]. */
void rotation_from_axis_angle(float r[3][3], Vec3 axis, float angle)
{
	float c = cosf(angle), s = sinf(angle), t = 1.0f - c;
	Vec3 k = axis;

	vnormalize(&k);
	r[0][0] = c + t * k.x * k.x;        r[0][1] = t * k.x * k.y - s * k.z;  r[0][2] = t * k.x * k.z + s * k.y;
	r[1][0] = t * k.x * k.y + s * k.z;  r[1][1] = c + t * k.y * k.y;        r[1][2] = t * k.y * k.z - s * k.x;
	r[2][0] = t * k.x * k.z - s * k.y;  r[2][1] = t * k.y * k.z + s * k.x;  r[2][2] = c + t * k.z * k.z;
}
```

Vérification : 90° autour de `(0, 0, 1)` envoie `(1, 0, 0)` sur `(0, 1, 0)` (au bruit d'arrondi près : `-4e-8`).

> **Piège :** l'axe doit être de **longueur 1**, sinon la matrice n'est plus une rotation. La fonction normalise elle-même ; un axe nul (`(0, 0, 0)`) reste nul et produit une matrice fausse, à refuser en amont.

## Retrouver l'axe et l'angle d'une rotation

L'opération inverse, utile pour comparer deux orientations ou animer entre elles, extrait l'angle de la **trace** (la somme des éléments de la diagonale, `r00 + r11 + r22`, où `rij` est l'élément de la ligne `i` et de la colonne `j`, en comptant depuis 0) et l'axe des différences entre éléments symétriques par rapport à la diagonale (`r21 - r12`, ...). `acos` (arc cosinus) retrouve l'angle dont on connaît le cosinus, mais n'accepte que des valeurs entre -1 et 1 :

| Étape | Formule |
|---|---|
| Angle | `θ = acos((r00 + r11 + r22 - 1) / 2)` |
| Axe (cas général) | `k` a la direction de `(r21 - r12, r02 - r20, r10 - r01)`, puis normalisé |

Trois pièges, tous rencontrés en pratique :

| Cas | Problème | Parade |
|---|---|---|
| Le résultat de `(trace - 1) / 2` dépasse 1 de `1e-7` | `acos` renvoie `NaN` | **Borner** la valeur dans `[-1, 1]` avant `acos` |
| `θ ≈ 0` | L'axe est **indéfini** (aucune rotation : tous les axes conviennent) | Renvoyer un axe par défaut et signaler « pas de rotation » |
| `θ ≈ 180°` | `sin θ ≈ 0` : le vecteur `(r21 - r12, ...)` s'annule, l'axe devient du bruit | Utiliser `(R + I) / 2 = k·kᵀ` : la colonne de plus grande diagonale vaut `k_i · k` |

Dans la dernière ligne, `I` est la **matrice identité** (des 1 sur la diagonale, des 0 ailleurs : elle ne change rien) et `k·kᵀ` la matrice 3×3 dont l'élément `(i, j)` vaut `k_i · k_j`.

```c
/* Extrait axe et angle d'une rotation 3×3. Renvoie 0 si l'angle est quasi nul (axe arbitraire). */
int axis_angle_from_rotation(float r[3][3], Vec3 *axis, float *angle)
{
	float cos_a = (r[0][0] + r[1][1] + r[2][2] - 1.0f) / 2.0f;
	Vec3 k;

	if (cos_a > 1.0f)                        /* l'arrondi peut sortir de [-1, 1] */
		cos_a = 1.0f;
	if (cos_a < -1.0f)
		cos_a = -1.0f;
	*angle = acosf(cos_a);
	k = (Vec3){r[2][1] - r[1][2], r[0][2] - r[2][0], r[1][0] - r[0][1]};
	if (*angle < 1e-4f) {
		*axis = (Vec3){0.0f, 0.0f, 1.0f};
		return 0;
	}
	if (3.14159265f - *angle < 1e-3f) {      /* demi-tour : ces différences s'annulent */
		int i = 0;

		for (int d = 1; d < 3; d++)          /* colonne de plus grande diagonale : la plus fiable */
			if (r[d][d] > r[i][i])
				i = d;
		k = (Vec3){(r[0][i] + (i == 0)) / 2.0f, (r[1][i] + (i == 1)) / 2.0f,
			(r[2][i] + (i == 2)) / 2.0f};
	}
	vnormalize(&k);
	*axis = k;
	return 1;
}
```

Testé sur 4 axes (dont `(0, 0, -1)` et `(-1, 0, 0)`) et 6 angles (de `1e-5` à `π`) : l'axe retrouvé est le bon, **au signe près** (à 180°, un axe et son opposé décrivent la même rotation). À 0°, aucun axe n'est défini : la fonction le signale.

## Cadrer automatiquement un objet

Pour qu'un objet quelconque **tienne dans l'image** au chargement, on calcule la **boîte englobante** (*bounding box*) : la plus petite boîte, aux faces parallèles aux axes, qui contient tous les sommets (`min` et `max` sur chaque coordonnée). On en déduit une **sphère englobante** :

| Valeur | Calcul |
|---|---|
| Centre (le point à regarder, `target`) | `(min + max) / 2` |
| Rayon | La moitié de la diagonale (du coin `min` au coin `max`) : `norme(max - min) / 2` |
| Distance de la caméra | `rayon / sin(demi-angle)` : la sphère touche alors les bords de l'image |
| `far` | `distance + rayon` |
| `near` | `distance - rayon`, **borné** par un minimum (ex. `far × 0,001`) |

Le **demi-angle** est celui de la dimension la plus **étroite** : si la fenêtre est plus haute que large (`aspect < 1`), c'est l'angle horizontal `atan(tan(fov / 2) × aspect)` qui limite, pas `fov / 2` (`atan`, l'arc tangente, est l'inverse de `tan`).

```c
/* Distance et plans pour cadrer une sphère de rayon « radius ». Renvoie 0 si un paramètre
   est hors domaine (rayon nul : objet réduit à un point, rien à cadrer). */
int frame_sphere(float radius, float fov, float aspect,
	float *distance, float *near_plane, float *far_plane)
{
	float half_v = fov / 2.0f;
	float half_h = atanf(tanf(half_v) * aspect);   /* demi-angle horizontal */
	float half = fminf(half_v, half_h);            /* le plus étroit des deux */

	if (!(radius > 0.0f) || !(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f))
		return 0;
	*distance = radius / sinf(half);
	*far_plane = *distance + radius;
	*near_plane = fmaxf(*distance - radius, *far_plane * 1e-3f);   /* jamais ≤ 0 */
	return 1;
}
```

Exemple chiffré : rayon 2, `fov = 1` rad, `aspect = 0,5` (fenêtre deux fois plus haute que large) : demi-angle retenu 0,267 rad (l'horizontal), distance 7,59, `near = 5,59`, `far = 9,59`.

> **Piège (le sommet fantôme) :** un seul sommet que **aucune face n'utilise** (reste d'un export, ligne `v` oubliée) agrandit la boîte : le centre se décale, le rayon gonfle, l'objet apparaît minuscule et mal centré. Calculer la boîte **sur les sommets réellement utilisés**, ou retirer les sommets orphelins avant.

## Normaliser l'échelle d'une scène

Une **constante absolue** est une valeur exprimée dans les unités de la scène : « la caméra avance de 0,1 par seconde », « jamais plus près que 0,5 de l'objet », « marge de 0,2 autour du modèle ». Elle n'est juste que pour **une plage de tailles**. Hors de cette plage :

| Taille de la scène (rayon) | Effet des constantes absolues |
|---|---|
| Minuscule (0,001) | 0,1 par seconde fait **100 rayons par seconde** : la caméra file ; la distance minimale 0,5 dépasse l'objet entier |
| Dans la plage (autour de 1) | Tout est réglé pour cette taille |
| Énorme (5 000) | 0,1 par seconde fait 0,00002 rayon par seconde : la caméra semble figée ; une marge de 0,2 est invisible |

Deux façons d'y remédier :

| Approche | Coût | Effet sur l'existant |
|---|---|---|
| Rendre **chaque constante relative** au rayon | Une modification par constante, et il faut penser à toutes les futures | Change le rendu des scènes qui marchaient |
| **Normaliser la scène une fois** : la ramener dans la plage au chargement | Un seul endroit | Aucun, si l'on ne touche pas aux scènes déjà dans la plage |

Règles de la normalisation :

1. **Ne rien changer dans la plage** (ex. rayon entre 0,5 et 2) : les scènes déjà bien réglées gardent exactement leur rendu. Vérifier en comparant des captures d'écran avant et après.
2. **Un seul facteur pour toute la scène**, calculé sur la sphère englobante de l'ensemble (voir [Cadrer automatiquement un objet](#cadrer-automatiquement-un-objet)) et appliqué à tous les objets : leurs tailles relatives sont conservées. Un facteur par objet les mettrait tous à la même taille.
3. **Calculer en double précision** : le carré de `1e30` dépasse le plus grand `float` (≈ 3,4 × 10³⁸), il donne l'infini, alors qu'un `double` le supporte (voir les [nombres à virgule flottante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)).
4. **Recentrer aussi** une scène très éloignée de l'origine (voir le piège plus bas).

```c
#define RADIUS_MIN 0.5      /* plage de rayons pour laquelle vitesses et marges sont réglées */
#define RADIUS_MAX 2.0
#define RADIUS_TARGET 1.0   /* rayon visé quand il faut redimensionner */
#define FAR_FACTOR 100.0    /* centre « loin » : à plus de 100 rayons de l'origine */

/* Ramène en place des sommets (x, y, z consécutifs) dans la plage de tailles de référence.
   Ne touche à rien si le rayon est dans la plage et le centre proche de l'origine.
   Renvoie 1 si modifiés, 0 si laissés tels quels, -1 si inutilisables (message sur stderr). */
int normalize_scene(float *vertices, size_t count)
{
	double lo[3], hi[3], center[3], d[3], radius, scale = 1.0;
	size_t i;
	int k;

	if (!vertices || count == 0)
	{
		fprintf(stderr, "scene vide : rien a normaliser\n");
		return -1;
	}
	for (k = 0; k < 3; k++)
		lo[k] = hi[k] = vertices[k];                  /* boîte englobante : min et max par axe */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
		{
			double v = vertices[3 * i + k];           /* float converti en double, sans perte */

			if (!isfinite(v))                         /* NaN ou infini : la boîte serait fausse */
			{
				fprintf(stderr, "sommet %zu : coordonnee %d non finie\n", i, k);
				return -1;
			}
			lo[k] = fmin(lo[k], v);
			hi[k] = fmax(hi[k], v);
		}
	for (k = 0; k < 3; k++)
	{
		center[k] = (lo[k] + hi[k]) / 2.0;
		d[k] = hi[k] - lo[k];
	}
	radius = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) / 2.0;
	if (!(radius > 0.0))                              /* refuse aussi NaN ; sommets tous confondus */
	{
		fprintf(stderr, "rayon nul : tous les sommets sont confondus\n");
		return -1;
	}
	if (radius < RADIUS_MIN || radius > RADIUS_MAX)
		scale = RADIUS_TARGET / radius;               /* hors plage : on redimensionne */
	else if (sqrt(center[0] * center[0] + center[1] * center[1]
			+ center[2] * center[2]) <= FAR_FACTOR * radius)
		return 0;                                     /* dans la plage et centrée : on ne touche à rien */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
			vertices[3 * i + k] = (float)((vertices[3 * i + k] - center[k]) * scale);
	return 1;
}
```

Testée sur 8 scènes : un cube de côté 1 reste inchangé (renvoie 0) ; des rayons de `1e30`, `1e-30` et 5 000 reviennent tous à 1 ; une scène à `1e7` de l'origine est recentrée ; un `NaN`, une scène vide et des sommets confondus sont refusés, chacun avec son message.

> **Piège (la précision d'un `float`) :** un `float` garde ≈ 7 chiffres significatifs. À `10 000 000`, deux `float` voisins sont séparés de **1** : un objet de rayon 1 posé là n'a plus que quelques positions possibles, ses sommets « sautent ». Rescaler ne répare pas cela, car la perte a lieu **à la lecture du fichier** ; seule une lecture en `double` ([`strtod`](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)), recentrée avant la conversion en `float`, l'évite.

> **Piège (une borne exprimée en rayon) :** un minimum de distance de caméra du type `distance ≥ 2 × rayon` semble relatif, donc sans danger. Dans une scène à plusieurs objets, c'est pourtant lui qui décide de la distance de la caméra : le changer ou le rendre relatif modifie le rendu de ces scènes, même dans la plage où l'on voulait ne rien changer. Comparer les captures avant et après chaque ajustement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Trois matrices : M (objet → monde), V (monde → caméra), P (caméra → écran), appliquées de droite à gauche (`P * V * M * sommet`). OpenGL lit les matrices **colonne par colonne**. La vue se construit avec `look_at` (avant, droite, haut) ; la perspective divise par `w` et exige `0 < near < far`, `0 < fov < π`, `aspect > 0`. Une rotation accumulée dérive : on la redresse. Rodrigues donne la rotation autour d'un axe quelconque ; l'extraction angle/axe a deux cas limites (0° et 180°). Le cadrage vient de la sphère englobante. Des constantes absolues (vitesses, marges) ne valent que pour une plage de tailles : on ramène la scène dans cette plage une seule fois, avec un facteur commun, calculé en double précision, sans toucher aux scènes déjà dans la plage. |
| **Outils utilisables** | `glUniformMatrix4fv`, `tanf`/`atanf`/`acosf`, produit vectoriel et scalaire. Documentation : [Viewing and Transformations](https://www.khronos.org/opengl/wiki/Viewing_and_Transformations), [Rodrigues](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula), [coordonnées homogènes](https://en.wikipedia.org/wiki/Homogeneous_coordinates). |
| **Pièges à éviter** | Matrice envoyée ligne par ligne, ordre `M * V * P` inversé. `look_at` vers le haut (produit vectoriel nul, `NaN`). `near = 0` ou `near > far` (matrice infinie, profondeur inversée), `near` minuscule (profondeur écrasée, scintillement). Rotation accumulée jamais redressée. `acos` d'une valeur légèrement supérieure à 1. Axe d'une rotation à 0° ou 180° lu sans cas particulier. Boîte englobante faussée par un sommet orphelin. Une constante absolue appliquée à une scène minuscule ou énorme, un facteur par objet, un carré calculé en `float` (infini), une scène lointaine rescalée après la perte de précision, une borne « en rayon » qui change le rendu des scènes à plusieurs objets. |
| **Bonnes pratiques** | Valider chaque paramètre (`!(a > b)` refuse aussi `NaN`) et nommer la cause dans le message. Borner avant `acos`. Réorthonormaliser une rotation accumulée. Calculer `near` et `far` à partir du rayon et les borner. Tester `look_at` et `perspective` sur les cas limites avant de les brancher au rendu. Normaliser l'échelle au chargement plutôt que rendre chaque constante relative ; comparer des captures avant et après. |
