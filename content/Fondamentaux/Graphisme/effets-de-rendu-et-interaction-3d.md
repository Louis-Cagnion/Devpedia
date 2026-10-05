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
| **À retenir** | L'aberration chromatique simule la dispersion de la lumière en calculant la réfraction 3 fois (une par canal de couleur), avec un indice de réfraction légèrement différent à chaque fois. Une animation procédurale recalcule une position à chaque image via une formule dépendant du temps réel écoulé, sans données externes. Le reflet de Fresnel (approximation de Schlick) fait croître la part réfléchie avec l'angle de biais. Le ray-marching accumule une densité par petits pas pour un nuage intérieur. Un objet transparent se dessine après les opaques, en deux passes (dos puis face) avec `GL_SRC_ALPHA`. Un ressort amorti rejoint sa cible sans saut, et `tanh` borne une déformation en douceur. Le placage triplanaire texture un objet sans UV en projetant selon les trois axes. Le picking souris convertit un clic 2D en rayon 3D via les matrices de projection/vue inversées, dans l'ordre inverse du rendu normal. |
| **Outils utilisables** | Une cubemap pour l'environnement réfracté et réfléchi, `reflect`, `mix`, `pow`. `glBlendFunc`, `glCullFace`, `glFrontFace` pour la transparence. Une formule temporelle (`sinf(temps * vitesse)`) ou un ressort amorti pour animer. `tanhf` pour borner. Trois lectures de texture pondérées par la normale pour le triplanaire. L'inverse des matrices de projection et de vue pour le picking. |
| **Pièges à éviter** | Un écart trop grand entre les indices de réfraction (résultat irréaliste). Animer selon le nombre d'images plutôt que le temps réel écoulé. Dessiner un transparent avant les opaques, ou inverser le sens des sommets (objet noir ou vide, sans erreur). Un ressort sans plafond sur le pas de temps (divergence, `NaN`). Un `ray-marching` à trop de pas (coût par pixel). |
| **Bonnes pratiques** | Garder les indices de réfraction proches les uns des autres pour un résultat crédible. Toujours baser une animation sur le temps réel, jamais sur le nombre d'images passées. Plafonner `dt` dans un ressort et refuser une limite nulle ou négative pour `tanh`. En cas d'objet noir, tester d'abord sans `GL_CULL_FACE`. |
