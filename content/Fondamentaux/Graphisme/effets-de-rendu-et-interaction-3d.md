---
order: 6
---

# Effets de rendu et interaction 3D

Une fois une scène chargée ([format .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) et affichée ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), quatre besoins reviennent souvent : enrichir visuellement le rendu (un objet de verre, par exemple), l'animer sans données externes, habiller un objet qui n'a pas de coordonnées de texture, et permettre à l'utilisateur d'interagir avec la scène à la souris. Ce chapitre couvre ces quatre besoins.

## L'aberration chromatique : un effet de post-traitement

La lumière blanche traversant un matériau réfractif (verre, eau) ne dévie pas exactement de la même façon selon sa couleur : c'est l'**aberration chromatique**, visible en photographie comme une frange colorée sur les contours à fort contraste. Un moteur de rendu peut simuler cet effet volontairement, en post-traitement : plutôt que de calculer une seule fois la réfraction d'un rayon (voir [vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) pour les bases du calcul vectoriel utilisé ici), on la calcule **trois fois**, une par canal de couleur, avec un indice de réfraction légèrement différent à chaque fois :

```text
Rayon incident
      |
      v
  Refraction avec IOR rouge   -> echantillonne le canal ROUGE de la cubemap
  Refraction avec IOR vert    -> echantillonne le canal VERT de la cubemap
  Refraction avec IOR bleu    -> echantillonne le canal BLEU de la cubemap
      |
      v
Recombine les 3 canaux -> le resultat final, avec ses franges colorees
```

Une **cubemap** (une texture composée de 6 images, une par face d'un cube, représentant l'environnement autour d'un objet) fournit l'image réfractée : chacun des 3 rayons, légèrement dévié différemment, échantillonne cette même cubemap à un point légèrement différent, ce qui produit la séparation de couleurs.

> **Bonne pratique :** garder les 3 indices de réfraction proches les uns des autres (une variation de quelques centièmes suffit). Un écart trop grand produit un résultat qui ne ressemble plus à un verre réaliste, mais à un artefact visuel grossier.

## Le reflet de Fresnel : plus on regarde de biais, plus ça reflète

Sur une vitre, un lac ou une bille de verre, la surface laisse passer la lumière quand on la regarde de face, et agit comme un miroir quand on la regarde sous un angle rasant. C'est l'**effet de Fresnel** : la part de lumière **réfléchie** (renvoyée) augmente avec l'angle entre la direction du regard et la **normale** (le vecteur perpendiculaire à la surface, voir [tampons, textures et shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)). Le calcul exact est lourd ; l'**approximation de Schlick** (du nom de son auteur) suffit en temps réel :

```text
F = F0 + (1 - F0) x (1 - cos(angle))^5

F0    : part réfléchie de face (environ 0,04 pour le verre, soit 4 %)
angle : entre la normale et la direction vers l'œil ; cos(angle) = produit scalaire des deux
        (deux vecteurs de longueur 1)
F     : part réfléchie finale, entre F0 (de face) et 1 (tout à fait de biais)
```

```glsl
vec3 n = normalize(world_normal);                    // normale de la surface, longueur 1
vec3 v = normalize(camera_pos - world_pos);          // direction du point vers l'œil
float cos_angle = max(dot(n, v), 0.0);               // 1 de face, 0 de biais
float fresnel = 0.04 + 0.96 * pow(1.0 - cos_angle, 5.0);   // pow(a, b) : a puissance b

vec3 mirrored = texture(env_map, reflect(-v, n)).rgb;     // ce que le miroir renvoie
vec3 final_color = mix(refracted_color, mirrored, fresnel);
```

`texture(env_map, direction)` lit la cubemap (déclarée `uniform samplerCube env_map`) dans une direction, et `.rgb` extrait les trois composantes rouge, vert, bleu du résultat (un `vec4`). `reflect(i, n)` est une fonction GLSL qui renvoie la direction d'un rayon `i` après rebond sur une surface de normale `n` (ici `-v`, le rayon qui part de l'œil vers le point). `mix(a, b, t)` mélange deux valeurs : `a x (1 - t) + b x t`, soit `a` pour `t = 0` et `b` pour `t = 1`. Le résultat : la couleur réfractée (celle de la section précédente, avec ses franges) au centre de la bille, et de plus en plus l'environnement réfléchi vers ses bords.

## Un nuage à l'intérieur : le ray-marching

Pour donner à un cristal un intérieur brumeux, on ne dessine aucune géométrie à l'intérieur : on fait **marcher** un rayon à travers l'objet par petits pas, et on accumule à chaque pas la **densité** d'une fonction (0 = vide, 1 = très dense). C'est le **ray-marching** (« marche de rayon »), à distinguer du [raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) qui cherche un seul point d'impact.

```glsl
uniform float time;                                   // secondes écoulées, fixé par le programme C

float density(vec3 p)                                 // densité du nuage au point p
{
	return clamp(sin(p.x * 3.0) * sin(p.y * 3.0 + time) * sin(p.z * 3.0), 0.0, 1.0);
}                                                     // clamp(x, 0.0, 1.0) borne x à l'intervalle 0..1

float cloud_opacity(vec3 entry, vec3 dir, float thickness)   // dir : longueur 1 ; thickness : épaisseur traversée
{
	const int STEPS = 24;                             // nombre de pas, fixe
	float step_len = thickness / float(STEPS);
	float opacity = 0.0;                              // 0 = transparent, 1 = opaque
	for (int i = 0; i < STEPS && opacity < 0.95; i++)
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;      // milieu du pas i
		opacity += (1.0 - opacity) * density(p) * step_len * 4.0; // ajoute ce qui reste à couvrir
	}
	return opacity;
}
```

Le résultat se mélange à la couleur du verre : `mix(glass_color, cloud_color, cloud_opacity(...))`.

| Choix | Effet | Coût ou piège |
|---|---|---|
| Nombre de pas (`STEPS`) | Plus il y en a, plus le nuage est fin | Le coût est **par pixel**, multiplié par le nombre de pas : 24 pas sur un écran de 2 millions de pixels font près de 50 millions d'appels de `density` par image |
| Sortie anticipée (`opacity < 0.95`) | Inutile de continuer quand le nuage est déjà presque opaque | Aucun, et ça économise des pas |
| Décalage d'un demi-pas (`+ 0.5`) | Échantillonne au milieu du pas plutôt qu'à son bord | Sans lui, les bandes des pas se voient |
| Épaisseur traversée | Une valeur approchée suffit (par exemple le diamètre de l'objet) | La calculer exactement demande l'intersection rayon/objet |

### La loi de Beer-Lambert : pourquoi l'opacité suit une exponentielle

La ligne `opacity += (1.0 - opacity) * ...` de la boucle ci-dessus ajoute « ce qui reste à couvrir » à chaque pas : elle imite une loi physique, la loi de Beer-Lambert. Dans un milieu de densité uniforme (brouillard, fumée, verre dépoli), chaque tranche de même épaisseur absorbe la même **fraction** de la lumière qui lui arrive, et non la même quantité. La part de lumière qui traverse (la **transmission**) décroît donc de façon exponentielle avec l'épaisseur :

```text
transmission = exp(-densité x épaisseur)   part de la lumière qui traverse, entre 0 et 1
opacité      = 1 - transmission            part arrêtée : 1 - exp(-densité x épaisseur)

densité : absorption par unité d'épaisseur (2 = deux unités d'absorption par unité traversée)
```

`exp(x)` est la fonction **exponentielle** ([fiche de référence](https://registry.khronos.org/OpenGL-Refpages/gl4/html/exp.xhtml)) : le nombre e (environ 2,718281828) élevé à la puissance `x`. Elle vaut 1 pour `x = 0`, et `exp(-x)` se rapproche de 0 quand `x` grandit, sans jamais l'atteindre ni devenir négative. L'opacité reste donc toujours entre 0 et 1, aussi épais ou dense que soit le milieu. Pour une densité de 2 (valeurs calculées par un script) :

| Épaisseur | Transmission `exp(-2 x épaisseur)` | Opacité `1 - exp(-2 x épaisseur)` | Opacité si on additionnait simplement (`2 x épaisseur`) |
|---|---|---|---|
| 0 | 1,0000 | 0,0000 | 0 |
| 0,25 | 0,6065 | 0,3935 | 0,5 |
| 0,5 | 0,3679 | 0,6321 | 1 |
| 1 | 0,1353 | 0,8647 | 2 (impossible) |
| 2 | 0,0183 | 0,9817 | 4 (impossible) |
| 3 | 0,0025 | 0,9975 | 6 (impossible) |

Deux demi-épaisseurs se **multiplient** : 0,3679 x 0,3679 = 0,1353, soit exactement la transmission de l'épaisseur 1 (0,135335 dans les deux cas, au millionième près). C'est ce qui rend la boucle possible : traverser le nuage tranche par tranche et multiplier les transmissions revient à traverser son épaisseur totale d'un coup.

La boucle ci-dessus applique cette multiplication pas à pas, mais en remplaçant `exp(-x)` par `1 - x`, une bonne approximation seulement quand `x` (ici `densité x pas`) est petit. Une version plus fidèle additionne la densité sur tout le rayon (le total s'appelle l'**épaisseur optique**), puis applique `exp` **une seule fois**, à la sortie :

```glsl
float cloud_opacity_beer(vec3 entry, vec3 dir, float thickness)   // mêmes paramètres
{
	const int STEPS = 24;                             // nombre de pas, fixe
	float step_len = thickness / float(STEPS);        // longueur d'un pas
	float optical = 0.0;                              // épaisseur optique cumulée
	for (int i = 0; i < STEPS && optical < 3.0; i++)  // 3.0 : opacité d'environ 0,95
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;   // milieu du pas i
		optical += density(p) * step_len * 4.0;               // on additionne, sans borner
	}
	return 1.0 - exp(-optical);                       // un seul exp, hors de la boucle
}
```

La sortie anticipée testait `opacity < 0.95` ; ici, `1 - exp(-3)` vaut 0,9502, d'où le seuil de 3 sur l'épaisseur optique. Comparaison pour une densité constante de 2 (le facteur `4.0` mis à 1, sans sortie anticipée), avec le résultat exact `1 - exp(-densité x épaisseur)` :

| Épaisseur | Exact | Boucle ci-dessus, 4 pas | Boucle ci-dessus, 24 pas | Somme puis `exp`, 4 ou 24 pas |
|---|---|---|---|---|
| 0,5 | 0,6321 | 0,6836 | 0,6399 | 0,6321 |
| 1 | 0,8647 | 0,9375 | 0,8761 | 0,8647 |
| 2 | 0,9817 | 1,0000 | 0,9874 | 0,9817 |

La somme suivie d'un `exp` donne le résultat exact quelle que soit la finesse du pas quand la densité est constante ; quand elle varie, l'erreur ne vient plus que de la finesse de l'échantillonnage. Le piège de la récurrence est plus grave que cet écart : avec 4 pas, une épaisseur de 3, la densité constante de 2 et le facteur `4.0` mis à 1 comme dans la comparaison ci-dessus, le premier pas ajoute déjà `densité x pas = 1,5` : l'opacité vaut 1,5 dès le premier tour, la sortie anticipée arrête la boucle et renvoie 1,5, une opacité impossible. Avec `1.0 - exp(-optical)`, le résultat ne quitte jamais l'intervalle de 0 à 1.

> **Piège :** une densité négative (une fonction `density` mal bornée) donne `exp` d'un nombre positif, donc une opacité négative. D'où le `clamp(..., 0.0, 1.0)` dans `density` plus haut : le garder.

## Dessiner un objet transparent

Un cristal laisse voir ce qui est derrière lui : il faut **mélanger** sa couleur à ce qui est déjà à l'écran. OpenGL le fait avec le **blending** (mélange), activé par `glEnable(GL_BLEND)`, avec la formule choisie par `glBlendFunc` :

```text
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) donne :

couleur finale = alpha x couleur du fragment + (1 - alpha) x couleur déjà à l'écran

alpha : opacité du fragment, 4e valeur de la couleur (vec4) rendue par le fragment shader ;
        1 = opaque, 0 = invisible
```

Trois règles en découlent.

- **Les objets opaques d'abord.** Le test de profondeur (voir [la chaîne de dessin](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)) refuse tout pixel situé derrière un pixel déjà dessiné. Un verre dessiné en premier ferait donc disparaître ce qui se trouve derrière lui : le mélange n'aurait rien à mélanger. Les opaques se dessinent sans mélange, puis on active le mélange pour les transparents.
- **Un cristal se dessine en deux passes : l'intérieur, puis l'extérieur.** Une bille de verre a une face arrière (vue à travers le verre) et une face avant. Le **face culling** (élimination des faces) permet de choisir laquelle la carte ignore : `glEnable(GL_CULL_FACE)`, puis `glCullFace(GL_FRONT)` ignore les faces avant (on dessine donc le dos du cristal), `glCullFace(GL_BACK)` ignore les faces arrière (on dessine le devant, par-dessus). Sans cela, face avant et face arrière se mélangent dans un ordre quelconque et le résultat clignote.
- **Le sens des sommets décide de ce qu'est une face avant.** Un triangle est « de face » quand ses sommets apparaissent dans le sens antihoraire à l'écran (réglage par défaut, `glFrontFace(GL_CCW)`). Un maillage dont les triangles sont listés dans l'autre sens voit ses faces avant prises pour des faces arrière : elles sont éliminées à la mauvaise passe, ou éclairées avec une normale retournée, et l'objet apparaît noir (le `max(dot(...), 0.0)` de l'éclairage tombe à 0).

```c
glEnable(GL_CULL_FACE);                              /* élimination des faces activée */
draw_opaque_objects();                               /* 1. opaques, sans mélange */

glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);   /* formule du mélange ci-dessus */
glCullFace(GL_FRONT);                                /* 2. le dos du cristal d'abord */
draw_crystal();
glCullFace(GL_BACK);                                 /* 3. puis son devant, par-dessus */
draw_crystal();
glDisable(GL_BLEND);                                 /* pour l'image suivante */
```

> **Piège :** un cristal qui s'affiche noir ou à moitié vide vient presque toujours de l'un de ces trois réglages (ordre opaque/transparent, face éliminée, sens des sommets), sans le moindre message d'erreur : OpenGL ne signale rien, il fait ce qu'on lui a demandé. Tester d'abord en désactivant `GL_CULL_FACE` : si l'objet réapparaît, c'est le sens des sommets.

## L'animation procédurale : recalculer plutôt que rejouer

Contrairement à une animation par **images clés** (*keyframes*, des positions enregistrées à l'avance et interpolées), une animation **procédurale** recalcule la position ou la déformation d'un objet à chaque image, à partir d'une formule dépendant du temps écoulé, sans aucune donnée externe :

```c
float hauteur = amplitude * sinf(temps_ecoule * vitesse);
position.y = hauteur;   // fait "flotter" un objet de haut en bas, indefiniment
```

Aucune donnée n'est stockée pour cette animation : elle est entièrement déterminée par la formule et le temps écoulé, ce qui la rend triviale à faire durer indéfiniment (contrairement à une séquence d'images clés, forcément finie) et bon marché en mémoire.

> **Piège :** utiliser directement le nombre d'images passées (`frame_count`) plutôt qu'un temps réel écoulé (en secondes). Une animation basée sur le nombre d'images va plus vite sur une machine qui affiche plus d'images par seconde, exactement le même piège que celui déjà vu pour une [boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) basée sur le temps.

## Un ressort amorti : une valeur qui rejoint sa cible en douceur

Pour qu'une valeur (l'échelle d'un objet qu'on survole, un décalage, une déformation) rejoigne sa **cible** sans saut brusque, on la relie à celle-ci par un **ressort** : plus l'écart est grand, plus il tire fort. Seul, un ressort oscillerait indéfiniment ; un **amortissement** (un frottement proportionnel à la vitesse) éteint peu à peu le mouvement.

```c
typedef struct s_spring
{
	float pos;   /* valeur actuelle */
	float vel;   /* vitesse de variation de pos, en unités par seconde */
}	t_spring;

void	spring_update(t_spring *s, float target, float stiffness, float damping, float dt)
{
	float	accel;

	if (dt > 0.05f)
		dt = 0.05f;                                           /* pas borné, voir plus bas */
	accel = stiffness * (target - s->pos) - damping * s->vel; /* tire vers la cible, freine */
	s->vel += accel * dt;                                     /* la vitesse d'abord... */
	s->pos += s->vel * dt;                                    /* ...puis la position */
}
```

`stiffness` (**raideur**) mesure la force de rappel par unité d'écart ; `damping` (**amortissement**) la force de freinage par unité de vitesse ; `dt` est le temps écoulé depuis l'image précédente (voir [le delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-delta-time-une-vitesse-independante-de-la-machine)). Le comportement dépend du rapport entre les deux :

| Amortissement | Comportement |
|---|---|
| 0 | Oscille sans fin autour de la cible |
| Faible | Dépasse la cible, rebondit, s'éteint (effet « élastique ») |
| `2 x sqrt(stiffness)` (dit **critique**) | Rejoint la cible le plus vite possible, sans dépasser |
| Fort | Rejoint la cible lentement, sans dépasser |

> **Piège (le pas de temps non borné) :** si une image dure très longtemps (fenêtre déplacée, programme suspendu une seconde), `dt` est grand et le pas ci-dessus dépasse la cible de plus que l'écart de départ : à chaque image l'écart grandit, la valeur diverge, puis devient `inf` ou `NaN`. D'où le plafond `dt <= 0.05` (50 ms) : le ressort rattrape son retard sur plusieurs images plutôt que d'exploser en une.

### Euler semi-implicite : pourquoi la vitesse est mise à jour avant la position

Le ressort ci-dessus avance image par image : c'est de l'**intégration numérique**, une simulation par petits pas où `dt` (la durée d'une image, en secondes, voir [le delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-delta-time-une-vitesse-independante-de-la-machine)) est le **pas de temps**. La règle la plus simple, la **méthode d'Euler**, dit : « nouvelle valeur = ancienne valeur + variation par seconde x `dt` ». Un ressort fait évoluer deux valeurs à la fois, sa position `pos` et sa vitesse `vel`, et l'ordre des deux mises à jour change le résultat :

| Méthode | Ordre dans le pas | Ce que lit chaque ligne |
|---|---|---|
| Euler **explicite** | `pos += vel x dt`, puis `vel += accel x dt` | Les deux lignes lisent l'état du **début** du pas |
| Euler **semi-implicite** (celui du ressort ci-dessus) | `vel += accel x dt`, puis `pos += vel x dt` | La position lit la vitesse **déjà mise à jour** : une valeur de la fin du pas, d'où « à moitié implicite » |

Le test : un ressort **sans amortissement**, tiré à 1 puis lâché. En physique il oscille éternellement avec la même amplitude, car son **énergie** ne change jamais. L'énergie est la somme de celle du mouvement (`0,5 x vel x vel`) et de celle de l'étirement (`0,5 x raideur x pos x pos`) ; ici, 2 au départ. Une bonne méthode doit la garder à peu près constante.

```c
#include <stdio.h>                                  /* printf */

typedef struct s_spring
{
	float	pos;   /* écart à la position de repos */
	float	vel;   /* vitesse de variation de pos, en unités par seconde */
}	t_spring;

void	step_explicit(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* force de rappel (ni cible ni frottement ici) */
	s->pos += s->vel * dt;         /* la position d'abord, avec l'ANCIENNE vitesse */
	s->vel += accel * dt;          /* puis la vitesse, avec l'ancienne position */
}

void	step_semi_implicit(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* force de rappel, calculée une seule fois */
	s->vel += accel * dt;          /* la vitesse d'abord... */
	s->pos += s->vel * dt;         /* ...puis la position, avec la NOUVELLE vitesse */
}

float	energy(t_spring s, float stiffness)
{
	/* énergie de mouvement + énergie d'étirement */
	return (0.5f * s.vel * s.vel + 0.5f * stiffness * s.pos * s.pos);
}

int	main(void)
{
	t_spring	a = {1.0f, 0.0f};   /* ressort tiré à 1, lâché sans vitesse */
	t_spring	b = {1.0f, 0.0f};   /* même départ pour la seconde méthode */
	int			n;

	for (n = 1; n <= 10000; n++)
	{
		step_explicit(&a, 4.0f, 0.016f);        /* raideur 4, pas de 16 ms */
		step_semi_implicit(&b, 4.0f, 0.016f);   /* mêmes valeurs */
		if (n == 1 || n == 100 || n == 1000 || n == 10000)
			printf("pas %5d : explicite %.4f, semi-implicite %.4f\n",
				n, energy(a, 4.0f), energy(b, 4.0f));
	}
	return (0);
}
```

Sortie réelle du programme (compilé avec `gcc -Wall -Wextra`) :

```text
pas     1 : explicite 2.0020, semi-implicite 1.9980
pas   100 : explicite 2.2155, semi-implicite 1.9963
pas  1000 : explicite 5.5657, semi-implicite 1.9708
pas 10000 : explicite 55710.1133, semi-implicite 2.0244
```

| Méthode | Énergie après 10 000 pas (départ : 2) | Ce qui se passe |
|---|---|---|
| Euler explicite | 55710,1133 | Chaque pas multiplie l'énergie par `1 + raideur x dt x dt` (ici 1,001024) : le ressort **gagne** de l'énergie et ses oscillations grandissent sans fin |
| Euler semi-implicite | 2,0244 (entre 1,9685 et 2,0325 sur toute la durée) | L'énergie **oscille** autour de 2 sans dériver : l'amplitude reste stable aussi longtemps qu'on veut |

Le facteur de l'explicite se vérifie : 1,001024 à la puissance 1000 donne 2,7829, et 5,5657 / 2 donne bien 2,7829. Une erreur minuscule par pas (0,1 %), répétée à chaque image, devient énorme en quelques minutes. Avec l'amortissement de la section précédente, le défaut persiste : à raideur 4 et amortissement 0,01 (même pas), l'énergie mesurée après 10 000 pas vaut 11240 en explicite, alors que le frottement devrait l'éteindre, et 0,41 en semi-implicite, qui l'éteint bien. C'est pourquoi `spring_update` met à jour `vel` **avant** `pos`, et pourquoi l'ordre des deux lignes ne se permute pas « parce que ça revient au même ».

Le plafond sur `dt` reste nécessaire, même en semi-implicite : cette méthode n'est stable que si `dt` est inférieur à `2 / sqrt(raideur)` (`sqrt` : la racine carrée). Pour une raideur de 400, la limite mesurée par dichotomie (on coupe l'intervalle en deux jusqu'à la trouver) est 0,10000, soit `2 / sqrt(400)`. La fonction ci-dessous mesure le plus grand écart atteint sur 200 pas (`isnan` teste si une valeur est `NaN`, *Not a Number*, le résultat d'un calcul impossible comme `inf - inf`, où `inf` est l'infini) :

```c
#include <math.h>                         /* fabsf : valeur absolue ; isnan */

/* utilise t_spring et step_semi_implicit, définis plus haut */
float	max_pos(float stiffness, float dt, int steps)
{
	t_spring	s = {1.0f, 0.0f};   /* départ : tiré à 1, sans vitesse */
	float		big = 1.0f;         /* plus grand écart vu, 1 au départ */
	int			i;

	for (i = 0; i < steps; i++)
	{
		step_semi_implicit(&s, stiffness, dt);   /* un pas de la méthode */
		if (isnan(s.pos))                        /* explosé : on s'arrête */
			return (s.pos);
		if (fabsf(s.pos) > big)                  /* nouveau record d'écart */
			big = fabsf(s.pos);
	}
	return (big);
}
```

| `dt` (raideur 400) | Plus grand écart sur 200 pas | Verdict |
|---|---|---|
| 0,016 (une image à 60 par seconde) | 1,01305 | Stable |
| 0,050 (le plafond du ressort ci-dessus) | 1 | Stable |
| 0,090 | 2,29416 | Amplitude gonflée |
| 0,099 | 7,08858 | Juste sous la limite de 0,1 : très gonflée |
| 0,101 | 1,4314e+25 | Juste au-dessus : divergence |
| 0,110 | `NaN` (affiché `-nan`) | Explosé |
| 1,000 (une seconde de pause) | `NaN` (affiché `-nan`) | Explosé |

Le plafond de 0,05 est donc sûr tant que la raideur reste sous 1600 (`2 / 0,05` = 40, et 40 au carré = 1600) ; avec un ressort plus raide, il faut baisser le plafond.

> **Piège :** inverser les deux lignes de mise à jour ne produit aucune erreur ni aucun avertissement : le ressort a l'air de fonctionner, et c'est seulement après des secondes ou des minutes, ou avec un amortissement faible, que l'oscillation prend de l'ampleur. Garder `vel` avant `pos`, puis plafonner `dt` en tenant compte de la raideur.

## Borner une déformation avec `tanh`

Une déformation pilotée par la souris ou par un ressort peut recevoir une valeur arbitrairement grande, et un objet étiré d'un facteur 1000 est inutilisable. `clamp` (couper net à une borne) la limite, mais crée un **coude** : la déformation grandit, puis se fige d'un coup. La **tangente hyperbolique**, `tanh` (en C `tanhf` de `<math.h>`, voir aussi [les fonctions d'activation](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) qui l'utilisent), est une courbe en S qui reste proche de `x` autour de 0 puis s'aplatit en douceur vers -1 et 1 :

```c
/* ramène une valeur quelconque dans ]-limit, limit[ ; limit > 0 */
float	soft_bound(float raw, float limit)
{
	return (limit * tanhf(raw / limit));
}
```

| `raw` (avec `limit = 1`) | `soft_bound` |
|---|---|
| 0,1 | 0,0997 (presque inchangé) |
| 1 | 0,762 |
| 3 | 0,995 |
| 100 | 1,000 (sature) |

> **Piège :** `limit` à 0 (division par zéro) ou négatif (bornes inversées) donne `NaN` ou un résultat à l'envers : le refuser avant l'appel. Et `tanhf` laisse passer un `NaN` en entrée tel quel : la borne protège d'une valeur énorme, pas d'une valeur invalide.

## Le placage triplanaire : une texture sans coordonnées UV

Une [texture](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) se plaque grâce aux coordonnées `(u, v)` portées par chaque sommet. Un maillage généré par programme, ou un `.obj` sans lignes `vt`, n'en a pas. Le **placage triplanaire** (*triplanar mapping*) s'en passe : il projette la texture selon **les trois axes** (une projection le long de x, une le long de y, une le long de z), en utilisant deux des coordonnées de la position comme `(u, v)`, puis mélange les trois résultats selon l'orientation de la surface.

```glsl
uniform sampler2D tex;                  // sampler2D : une texture 2D que le shader peut lire
in vec3 world_pos;                      // position du fragment dans la scène
in vec3 world_normal;
out vec4 color;

void main()
{
	vec3 w = pow(abs(normalize(world_normal)), vec3(4.0));   // abs : valeur absolue de chaque composante
	w /= (w.x + w.y + w.z);                                   // poids par axe, somme égale à 1
	vec3 cx = texture(tex, world_pos.yz).rgb;                 // .yz : composantes y et z de la position, projection le long de x
	vec3 cy = texture(tex, world_pos.xz).rgb;                 // le long de y
	vec3 cz = texture(tex, world_pos.xy).rgb;                 // le long de z
	color = vec4(cx * w.x + cy * w.y + cz * w.z, 1.0);
}
```

Une face tournée vers x (normale `(1, 0, 0)`) donne un poids de 1 à la projection selon x : on voit la texture de face. Sur une face oblique, plusieurs poids sont non nuls et les projections se fondent. L'élévation à la puissance 4 resserre les zones de mélange, sinon l'image devient floue partout où la normale n'est pas alignée.

Le même schéma sert à un motif **calculé** plutôt que lu dans une image, par exemple des briques : une rangée sur deux est décalée d'une demi-brique, et les bords de chaque brique forment le joint.

```glsl
float brick(vec2 p)                                   // 1 = brique, 0 = joint
{
	p *= vec2(2.0, 4.0);                              // 2 briques de large, 4 rangées par unité
	p.x += 0.5 * mod(floor(p.y), 2.0);                // floor : partie entière ; mod : reste de la division
	vec2 f = fract(p);                                // fract : partie après la virgule, position dans la brique
	return step(0.06, f.x) * step(0.1, f.y);          // step(s, x) : 0 si x < s, 1 sinon ; 0 sur les bords
}

// dans main(), à la place des trois lectures de texture :
float b = brick(world_pos.yz) * w.x + brick(world_pos.xz) * w.y + brick(world_pos.xy) * w.z;
color = vec4(mix(vec3(0.3), vec3(0.7, 0.3, 0.2), b), 1.0);   // gris pour le joint, rouille pour la brique
```

| Avantage | Limite |
|---|---|
| Aucune coordonnée `(u, v)` à fournir ni à réparer (pas de couture) | Trois lectures de texture par pixel au lieu d'une |
| Fonctionne sur n'importe quel maillage, même déformé en cours d'exécution | La texture n'épouse pas la surface : sur un objet qui tourne, elle reste fixe dans la scène, sauf si on utilise la position dans l'objet plutôt que dans la scène |
| Aucun étirement visible sur les faces parallèles aux axes | Un flou dans les zones de mélange, et un motif orienté (des lettres) apparaît parfois inversé selon la face |

## Le picking souris : trouver quel objet 3D a été cliqué

Le **picking** répond à une question précise : sur quel objet, dans une scène 3D, l'utilisateur vient-il de cliquer, à partir d'une position 2D (`x`, `y`) sur l'écran ? Le principe : transformer ce clic 2D en un **rayon** dans l'espace 3D, puis tester quel objet ce rayon touche en premier.

```text
Clic ecran (x, y)
      |
      v  inverse de la matrice de projection, puis de la matrice de vue
Rayon 3D, de la camera vers la scene
      |
      v  intersection rayon/objet (teste chaque objet de la scene)
Objet le plus proche touche par ce rayon -> objet "clique"
```

Concrètement, le clic 2D est d'abord converti en coordonnées normalisées (entre -1 et 1), puis **l'inverse** de la matrice de projection ramène ce point dans l'espace caméra, et **l'inverse** de la matrice de vue le ramène ensuite dans l'espace du monde : deux transformations inversées, dans l'ordre inverse de celui utilisé pour afficher normalement un objet 3D à l'écran.

> **Note :** ce mécanisme est l'exact inverse du pipeline de rendu habituel (monde → vue → projection → écran), d'où l'usage des matrices **inverses**, dans l'ordre **inverse**.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'aberration chromatique simule la dispersion de la lumière en calculant la réfraction 3 fois (une par canal de couleur), avec un indice de réfraction légèrement différent à chaque fois. Une animation procédurale recalcule une position à chaque image via une formule dépendant du temps réel écoulé, sans données externes. Le reflet de Fresnel (approximation de Schlick) fait croître la part réfléchie avec l'angle de biais. Le ray-marching accumule une densité par petits pas pour un nuage intérieur, et la loi de Beer-Lambert (`opacité = 1 - exp(-densité x épaisseur)`) garde l'opacité entre 0 et 1. Un objet transparent se dessine après les opaques, en deux passes (dos puis face) avec `GL_SRC_ALPHA`. Un ressort amorti rejoint sa cible sans saut, avancé par Euler semi-implicite (la vitesse est mise à jour avant la position, ce qui garde l'énergie stable là où l'Euler explicite en gagne à chaque pas), et `tanh` borne une déformation en douceur. Le placage triplanaire texture un objet sans UV en projetant selon les trois axes. Le picking souris convertit un clic 2D en rayon 3D via les matrices de projection/vue inversées, dans l'ordre inverse du rendu normal. |
| **Outils utilisables** | Une cubemap pour l'environnement réfracté et réfléchi, `reflect`, `mix`, `pow`, `exp` pour l'atténuation de Beer-Lambert. `glBlendFunc`, `glCullFace`, `glFrontFace` pour la transparence. Une formule temporelle (`sinf(temps * vitesse)`) ou un ressort amorti pour animer. `tanhf` pour borner. Trois lectures de texture pondérées par la normale pour le triplanaire. L'inverse des matrices de projection et de vue pour le picking. |
| **Pièges à éviter** | Un écart trop grand entre les indices de réfraction (résultat irréaliste). Animer selon le nombre d'images plutôt que le temps réel écoulé. Dessiner un transparent avant les opaques, ou inverser le sens des sommets (objet noir ou vide, sans erreur). Un ressort sans plafond sur le pas de temps (divergence, `NaN`). Un `ray-marching` à trop de pas (coût par pixel). Une opacité additionnée sans `exp` (elle dépasse 1). Deux lignes de mise à jour du ressort dans le mauvais ordre (l'oscillation grandit sans erreur visible). |
| **Bonnes pratiques** | Garder les indices de réfraction proches les uns des autres pour un résultat crédible. Toujours baser une animation sur le temps réel, jamais sur le nombre d'images passées. Additionner la densité sur le rayon puis appliquer `1.0 - exp(-optical)` une seule fois. Mettre `vel` à jour avant `pos`, plafonner `dt` sous `2 / sqrt(raideur)` dans un ressort et refuser une limite nulle ou négative pour `tanh`. En cas d'objet noir, tester d'abord sans `GL_CULL_FACE`. |
