---
order: 10
---

# Les flottants loin de l'origine : précision perdue et origine locale

Un nombre de type `float` (un nombre à virgule stocké sur 32 bits) garde environ sept chiffres décimaux fiables, **quelle que soit sa taille**. Pour une valeur proche de 1, cela donne un détail de l'ordre du dix-millionième ; pour une valeur de dix millions, le détail le plus fin est le mètre entier. Un point situé à 10 000 km de l'origine, exprimé en mètres, ne peut donc plus se déplacer de moins d'un mètre : un détail d'un centimètre disparaît. Ce chapitre mesure cette perte, puis présente la parade employée en graphisme, en cartographie et dans les jeux : une **origine locale**, un point de référence choisi près des données, soustrait en `double` (un nombre à virgule stocké sur 64 bits, plus précis) avant de ranger les valeurs en `float`.

Quelques mots du métier, définis ici une fois pour toutes. Une **coordonnée** est un nombre qui situe un point par rapport à un repère (par exemple « 12,5 mètres vers l'est »). L'**origine** est le point de ce repère dont toutes les coordonnées valent 0. Un **sommet** est un point d'un objet en 3D, et un **maillage** est un objet décrit par des sommets reliés en triangles (voir [le format `.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Une carte, un niveau de jeu ou un maillage manipulent tous des listes de coordonnées de ce genre.

Ce chapitre suppose connues les bases du C ([les variables](/?c=langages&s=c&p=variables), [les conditions](/?c=langages&s=c&p=conditions), [les boucles](/?c=langages&s=c&p=boucles)), [les types de nombres à virgule en C](/?c=langages&s=c&p=variables#les-nombres-a-virgule-flottante) et [l'encodage des flottants](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#comment-un-flottant-est-encode) (signe, exposant, mantisse), qu'il prolonge sans le répéter. Les puissances de deux et les bits sont rappelés dans [les entiers et les débordements](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements). Tous les programmes ont été compilés avec `gcc -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined` sous Linux (`-Werror` transforme chaque avertissement en erreur ; `-fsanitize=...` ajoute des contrôles à l'exécution qui repèrent les erreurs de mémoire et les comportements indéfinis ; voir [le processus de compilation](/?c=langages&s=c&p=compilation)) puis exécutés ; ils ont aussi été recompilés avec `-O2 -ffp-contract=off` (l'optimisation du compilateur, voir [les niveaux d'optimisation](/?c=langages&s=c&p=compilation#les-niveaux-d-optimisation-o0-a-o3-os), sans la fusion d'une multiplication et d'une addition en une seule opération, qui changerait les arrondis) : les sorties sont **identiques** dans les deux cas. Elles supposent un processeur courant dont le `float` calcule réellement sur 32 bits.

## Le constat : 24 bits significatifs, donc un écart qui double

Un `float` garde **24 bits significatifs** : les chiffres binaires qui portent la valeur. On lit parfois 23 bits de mantisse, parfois 24. Les deux sont justes : 23 bits sont **stockés** (la mantisse), et le 24ᵉ est implicite. Un nombre binaire écrit sous la forme normalisée « 1,xxx × 2ᵉ » (un seul chiffre avant la virgule, toujours 1) n'a pas besoin de stocker ce premier 1. Le `double` fait de même avec 52 bits stockés et 53 significatifs.

| Type | Bits stockés (mantisse) | Bits significatifs | Écart juste au-dessus de 1,0 | Chiffres décimaux fiables |
|---|---|---|---|---|
| `float` | 23 | 24 | 2⁻²³ ≈ 1,19 × 10⁻⁷ | environ 7 |
| `double` | 52 | 53 | 2⁻⁵² ≈ 2,2 × 10⁻¹⁶ | environ 15 à 16 |

Entre deux nombres consécutifs représentables, il y a un **écart**, appelé en anglais *ULP* (*unit in the last place*, « unité de la dernière place » : la valeur du dernier bit de la mantisse). Pour un `float` compris entre 2ᵉ et 2ᵉ⁺¹, l'écart vaut 2ᵉ⁻²³. Chaque **palier** [2ᵉ ; 2ᵉ⁺¹[ (l'intervalle entre deux puissances de deux consécutives) contient exactement le même nombre de `float` (2²³ = 8 388 608) et sa largeur double d'un palier au suivant : l'écart double donc lui aussi.

```text
valeur :    1                2                      4                              8
            |----------------|----------------------|------------------------------|
float :     8 388 608 float   8 388 608 float         8 388 608 float
écart :     2⁻²³ ≈ 1,2e-7     2⁻²² (x2)              2⁻²¹ (x4)
```

Le programme suivant interroge directement l'ordinateur. `nextafterf(x, vers)` renvoie le `float` voisin de `x` en direction de `vers` ([`nextafterf`](https://en.cppreference.com/w/c/numeric/math/nextafter)) ; la différence avec `x` est l'écart cherché.

```c
#include <float.h>
#include <math.h>
#include <stdio.h>

// Affiche l'écart entre x et ses voisins, puis FLT_EPSILON * x pour comparaison
static void afficher_ecart(float x)
{
    float suivant = nextafterf(x, INFINITY);    // plus petit float strictement plus grand
    float precedent = nextafterf(x, -INFINITY); // plus grand float strictement plus petit
    printf("%10.0f | %-14.9g | %-14.9g | %.9g\n", x, suivant - x, x - precedent,
           FLT_EPSILON * x);
}

int main(void)
{
    const float valeurs[] = {1.0f, 1000.0f, 1000000.0f, 16777216.0f, 100000000.0f};
    const int nb = sizeof valeurs / sizeof valeurs[0];  // nombre de valeurs du tableau

    printf("%10s | %-14s | %-14s | %s\n", "x", "au-dessus", "en dessous", "FLT_EPSILON*x");
    for (int i = 0; i < nb; i++)            // une ligne par valeur
        afficher_ecart(valeurs[i]);
    printf("FLT_EPSILON = %.9g\n", FLT_EPSILON);    // l'écart au-dessus de 1.0, rien d'autre

    float grand = 16777216.0f;              // 2^24 : au-delà, des entiers manquent
    float plus_un = grand + 1.0f;           // 16777217 n'existe pas : arrondi au plus proche
    float plus_deux = grand + 2.0f;         // 16777218 existe
    printf("2^24 + 1 == 2^24 ? %s\n", plus_un == grand ? "oui" : "non");
    printf("2^24 + 2 == 2^24 ? %s\n", plus_deux == grand ? "oui" : "non");
    return 0;
}
```

```text
         x | au-dessus      | en dessous     | FLT_EPSILON*x
         1 | 1.1920929e-07  | 5.96046448e-08 | 1.1920929e-07
      1000 | 6.10351562e-05 | 6.10351562e-05 | 0.00011920929
   1000000 | 0.0625         | 0.0625         | 0.11920929
  16777216 | 2              | 1              | 2
 100000000 | 8              | 8              | 11.920929
FLT_EPSILON = 1.1920929e-07
2^24 + 1 == 2^24 ? oui
2^24 + 2 == 2^24 ? non
```

| Élément | Rôle |
|---|---|
| `#include <float.h>` | L'en-tête (fichier de déclarations, voir [les en-têtes](/?c=langages&s=c&p=headers)) qui donne les limites des types à virgule, dont `FLT_EPSILON` ([`<float.h>`](https://en.cppreference.com/w/c/types/limits)) |
| `static`, `const` | `static` devant une fonction la rend visible dans ce seul fichier ; `const` promet qu'une valeur ne sera pas modifiée |
| `#include <math.h>` | L'en-tête des fonctions mathématiques : `nextafterf` et la valeur `INFINITY` |
| `INFINITY` | La valeur « infini positif » ; `nextafterf(x, INFINITY)` donne le voisin au-dessus, `-INFINITY` le voisin en dessous |
| `1.0f` | Le suffixe `f` fabrique un `float` ; sans lui, `1.0` serait un `double` |
| `sizeof valeurs / sizeof valeurs[0]` | La taille du tableau divisée par celle d'une case : le nombre de cases |
| `%10.0f`, `%-14.9g`, `%.9g` | Formats de `printf` : un `float` sur 10 caractères sans décimale ; un nombre sur 14 caractères aligné à gauche (`-`) avec 9 chiffres significatifs ; idem sans largeur. Neuf chiffres suffisent à distinguer deux `float` |

Les écarts relevés, rapprochés de la formule 2ᵉ⁻²³ :

| Valeur | Intervalle [2ᵉ ; 2ᵉ⁺¹[ | Écart au-dessus | Ce que cela signifie pour des mètres |
|---|---|---|---|
| 1 | [1 ; 2[ | 2⁻²³ ≈ 0,00000012 | Un dix-millionième de mètre |
| 1 000 | [512 ; 1 024[ | 2⁻¹⁴ ≈ 0,000061 | Environ 6 centièmes de millimètre |
| 1 000 000 | [524 288 ; 1 048 576[ | 2⁻⁴ = 0,0625 | Plus de 6 centimètres |
| 16 777 216 (2²⁴) | [2²⁴ ; 2²⁵[ | 2 | Les entiers **impairs** n'existent plus |
| 100 000 000 | [2²⁶ ; 2²⁷[ | 2³ = 8 | Des écarts de 8 mètres |

Trois remarques sur la sortie. D'abord, à partir de 16 777 216 = 2²⁴, deux nombres consécutifs sont distants de 2 : `16777217` n'existe pas, et le calcul `2²⁴ + 1` retombe sur `2²⁴` (le résultat exact se trouve pile entre deux `float` ; la règle d'arrondi, voir [l'absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#l-absorption-et-l-annulation-quand-un-calcul-perd-ses-chiffres), choisit celui dont le dernier bit est 0). Ensuite, l'écart **en dessous** de 1 et de 2²⁴ vaut la moitié de l'écart au-dessus (5,96e-08 et 1) : une puissance de deux ouvre un intervalle, donc le palier précédent est deux fois plus fin. Enfin, la colonne `FLT_EPSILON*x` donne l'ordre de grandeur de l'écart, jamais sa valeur exacte.

### Ce que veut dire `FLT_EPSILON`

`FLT_EPSILON`, défini dans `<float.h>`, est l'écart juste au-dessus de **1,0** et rien d'autre : 2⁻²³ ≈ 1,19 × 10⁻⁷. Le prendre pour « la précision d'un `float` » est une erreur courante.

| Ce qu'on croit | Ce qui est vrai |
|---|---|
| « Deux `float` à moins de `FLT_EPSILON` l'un de l'autre sont égaux » | Cela ne vaut que près de 1. À 1 000 000, l'écart est 0,0625 : plus de 500 000 fois plus grand |
| « Un `float` a une précision de 10⁻⁷ » | La précision est **relative** : environ 10⁻⁷ **de la valeur** (entre 6 × 10⁻⁸ et 1,2 × 10⁻⁷ de `x`) |
| « La précision est la même partout » | Elle est constante en proportion, mais l'erreur **absolue** grandit avec la valeur : 10⁻⁷ à 1, 8 à 10⁸ |
| « Le `double` règle le problème » | Il le repousse : le même phénomène existe avec 53 bits, à des valeurs bien plus grandes ([le chapitre sur les flottants](/?c=donnees&s=representation-des-donnees&p=nombres-flottants) donne les seuils du `double`) |

Pour comparer deux `float`, on prend donc une marge **proportionnelle** à leur taille (voir [comparer correctement](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#la-consequence-pratique-ne-jamais-tester-l-egalite)), jamais `FLT_EPSILON` seul.

## Les symptômes, mesurés

Un seul programme fait deux mesures. **Première mesure** : ajouter 0,1 un million de fois à un `float`, une première fois en partant de 0, une seconde en partant de 10 000 000. Le résultat mathématique est 100 000 puis 10 100 000.

**Seconde mesure**, plus proche d'un vrai maillage : un petit triangle ABC aux côtés de 1 cm (0,01 m) est posé à 10 000 km de l'origine (10 000 000 m). On range ses sommets dans des `float`, on les relit, et on mesure les côtés. Deux triangles sont essayés : l'un loin de toute frontière d'arrondi, l'autre à cheval sur une frontière. Pour le second, voici ce qui arrive à ses deux sommets A et B :

```text
x de A : 10000000.495  --arrondi-->  10000000   (le float le plus proche)
x de B : 10000000.505  --arrondi-->  10000001   (le float le plus proche)
écart réel : 0,01 m                  écart obtenu : 1 m
(deux float voisins sont à 1 m ; leur milieu est 10000000.5, A en dessous, B au-dessus)
```

Les deux sommets, distants de 1 cm, tombent de part et d'autre du milieu entre deux `float` voisins : A devient 10 000 000 et B devient 10 000 001.

```c
#include <math.h>
#include <stdio.h>

// Un sommet : deux coordonnées en mètres, mesurées depuis l'origine du repère
typedef struct {
    double x;
    double y;
} Point;

// Ce que devient un nombre quand on le range dans un float puis qu'on le relit
static double via_float(double v)
{
    return (double)(float)v;            // double -> float (arrondi) -> double (sans perte)
}

// Longueur du segment entre deux points, en mètres
static double cote(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y); // hypot(dx, dy) : racine de dx² + dy²
}

// Affiche les trois côtés du triangle, après un passage par le float
static void afficher_triangle(const char *nom, const Point s[3])
{
    Point f[3];                         // les trois sommets après le passage par le float

    for (int i = 0; i < 3; i++) {       // chaque coordonnée est arrondie à un float
        f[i].x = via_float(s[i].x);
        f[i].y = via_float(s[i].y);
    }
    printf("%s : AB=%g BC=%g CA=%g (attendu : 0.01 0.0141421 0.01)\n",
           nom, cote(f[0], f[1]), cote(f[1], f[2]), cote(f[2], f[0]));
}

int main(void)
{
    float depuis_zero = 0.0f;                   // somme qui part de 0
    float depuis_dix_millions = 10000000.0f;    // somme qui part de dix millions

    for (int i = 0; i < 1000000; i++) {         // un million d'additions de 0,1
        depuis_zero += 0.1f;
        depuis_dix_millions += 0.1f;
    }
    printf("depuis 0        : %.2f (attendu 100000)\n", depuis_zero);
    printf("depuis 10000000 : %.2f (attendu 10100000)\n", depuis_dix_millions);

    const Point au_milieu[3] = {                // côtés de 1 cm, à 10 000 km (10^7 m)
        {10000000.2, 10000000.2}, {10000000.21, 10000000.2}, {10000000.2, 10000000.21}};
    const Point a_cheval[3] = {                 // A juste sous x.5, B juste au-dessus
        {10000000.495, 10000000.0}, {10000000.505, 10000000.0},
        {10000000.495, 10000000.01}};

    afficher_triangle("dégénéré", au_milieu);
    afficher_triangle("déformé ", a_cheval);
    return 0;
}
```

```text
depuis 0        : 100958.34 (attendu 100000)
depuis 10000000 : 10000000.00 (attendu 10100000)
dégénéré : AB=0 BC=0 CA=0 (attendu : 0.01 0.0141421 0.01)
déformé  : AB=1 BC=1 CA=0 (attendu : 0.01 0.0141421 0.01)
```

| Élément | Rôle |
|---|---|
| `typedef struct {...} Point;` | Donne le nom `Point` à un regroupement de deux champs (voir [les structures](/?c=langages&s=c&p=variables#les-structures-struct)) |
| `(double)(float)v` | Deux conversions à la suite : vers un `float` (l'arrondi a lieu ici), puis vers un `double` (sans perte, car un `double` contient tous les `float`) |
| `hypot(dx, dy)` | La racine carrée de dx² + dy² : la longueur d'un segment de côtés dx et dy |
| `0.1f` | Le `float` le plus proche de 0,1 (valeur exacte : 0,100000001490116...) |
| `const Point s[3]` | Un paramètre qui reçoit trois points (en réalité l'adresse du premier, voir [les pointeurs](/?c=langages&s=c&p=pointeurs)) |
| `%.2f`, `%g`, `%s` | Formats de `printf` : deux décimales ; un nombre sans zéros inutiles ; un texte |
| `for` | La boucle qui répète un bloc un nombre donné de fois (voir [la boucle `for`](/?c=langages&s=c&p=boucles#la-boucle-for)) |

| Mesure | Résultat | Explication |
|---|---|---|
| Somme partie de 0 | 100 958,34 au lieu de 100 000 | 0,1 n'est jamais un multiple exact de l'écart. À chaque addition, le résultat est arrondi, et à ces tailles il l'est **du même côté** à chaque fois : les erreurs s'additionnent au lieu de se compenser |
| Somme partie de 10 000 000 | Reste à 10 000 000,00 | L'écart y vaut 1 : ajouter 0,1 (moins que la moitié d'un écart) change zéro bit. Chacun des un million d'ajouts est **absorbé** |
| Triangle « loin d'une frontière » | Les trois côtés valent 0 | Les trois sommets deviennent le même `float` : le triangle est **dégénéré** (réduit à un point) |
| Triangle « à cheval » | AB = 1 m, BC = 1 m, CA = 0 | Côtés 100 fois trop grands, ou nuls : le triangle est **déformé** |

Ces triangles n'ont rien d'exotique : un sommet qui devient un point, un côté qui devient un mètre, c'est un trou dans une surface, un objet qui tremble quand on bouge la caméra, ou une collision qui rate.

## La parade : une origine locale

L'idée : ne pas ranger les coordonnées **absolues** (mesurées depuis l'origine du monde), mais des coordonnées **relatives** à un point voisin, l'**origine locale**. Si les données tiennent dans un rayon de quelques mètres, les nombres rangés valent quelques mètres, et un `float` y a un écart de l'ordre du micromètre.

```text
        origine du monde                        origine locale O
              (0,0)                         (choisie près des données)
                |                                    |
                |<------------ 10 000 000 m -------->|<-- 0,01 m -->| sommet
                |                                    |
   stockage direct : x = 10000000.505  -> float : écart de 1 m  (perdu)
   stockage local  : x - O = 0.01      -> float : écart de ~1e-9 m (précis)
```

La méthode tient en quatre étapes :

| Étape | Quoi | En quel type |
|---|---|---|
| 1. Choisir l'origine O | Le premier sommet, le centre des données, un coin... | `double` |
| 2. Soustraire | Pour chaque coordonnée : `p - O` | **`double`** |
| 3. Convertir et stocker | La différence, devenue petite, est rangée dans un `float` | `float` |
| 4. Relire | À la lecture : `O + valeur_float`, additionné en `double` | `double` |

O est conservée **avec l'objet**, en `double` : c'est la seule valeur qui garde la position réelle.

### Pourquoi la soustraction se fait en `double`

Tout est dans l'ordre. Convertir **d'abord** en `float` puis soustraire détruit l'information, car la perte a lieu à la conversion et la soustraction ne fait que la rendre visible. Soustraire **d'abord** en `double` conserve tout, puis la conversion porte sur un nombre petit.

| Ordre des opérations | Calcul pour B − A (B = 10000000.505, A = 10000000.495) | Résultat |
|---|---|---|
| Convertir, puis soustraire en `float` | `(float)B - (float)A` = 10000001 − 10000000 | **1** |
| Soustraire en `double`, puis convertir | `(float)(B - A)` | **0,01** |

La différence de deux `double` proches l'un de l'autre est **exacte**. Plus précisément, si l'un des deux nombres est compris entre la moitié et le double de l'autre, leur différence tient exactement dans un `double` : c'est le lemme de Sterbenz (un résultat classique de l'arithmétique des flottants). Intuitivement : les deux nombres s'écrivent avec les mêmes chiffres de poids fort, qui s'annulent dans la soustraction ; il ne reste que quelques bits à conserver, et les 53 bits du `double` y suffisent largement. Le programme suivant range les mêmes sommets des deux façons et mesure l'erreur de position.

```c
#include <math.h>
#include <stdio.h>

typedef struct { double x, y; } Point;      // un sommet en mètres, en double (53 bits)
typedef struct { float x, y; } PointF;      // un sommet stocké en float (24 bits)

// Rangement sans précaution : on convertit directement les coordonnées en float
static PointF stocker_direct(Point p)
{
    return (PointF){(float)p.x, (float)p.y};
}

// Rangement avec origine locale : on soustrait en double, puis on convertit
static PointF stocker_local(Point p, Point origine)
{
    return (PointF){(float)(p.x - origine.x), (float)(p.y - origine.y)};
}

// Relecture sans origine : on retrouve la valeur du float, rien de plus
static Point relire_direct(PointF f)
{
    return (Point){f.x, f.y};
}

// Relecture avec origine : on remet l'origine, en double
static Point relire_local(PointF f, Point origine)
{
    return (Point){origine.x + f.x, origine.y + f.y};
}

// Distance entre deux points, en mètres
static double dist(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y);
}

// Affiche les trois côtés du triangle relu r et sa plus grande erreur de position
static void afficher(const char *nom, const Point v[3], const Point r[3])
{
    double pire = 0.0;                      // plus grand écart entre v[i] et r[i]

    for (int i = 0; i < 3; i++)
        pire = fmax(pire, dist(v[i], r[i]));
    printf("%-15s AB=%.6f BC=%.6f CA=%.6f  erreur max=%.2e m\n", nom,
           dist(r[0], r[1]), dist(r[1], r[2]), dist(r[2], r[0]), pire);
}

int main(void)
{
    // Côtés de 1 cm, à 10 000 km (10^7 m) : A est juste sous x.5, B juste au-dessus
    const Point v[3] = {{10000000.495, 10000000.0}, {10000000.505, 10000000.0},
                        {10000000.495, 10000000.01}};
    const Point origine = v[0];             // origine locale : le premier sommet
    Point direct[3], local[3];              // sommets relus, sans puis avec origine locale

    for (int i = 0; i < 3; i++) {           // stockage en float, puis relecture
        direct[i] = relire_direct(stocker_direct(v[i]));
        local[i] = relire_local(stocker_local(v[i], origine), origine);
    }
    printf("attendu         AB=0.010000 BC=0.014142 CA=0.010000\n");
    afficher("float direct", v, direct);
    afficher("origine locale", v, local);

    float fa = (float)v[0].x, fb = (float)v[1].x;   // A et B convertis en float
    printf("B - A en float  : %g\n", fb - fa);      // soustraction faite en float
    printf("B - A en double : %.6f\n", v[1].x - v[0].x);    // même soustraction en double
    return 0;
}
```

```text
attendu         AB=0.010000 BC=0.014142 CA=0.010000
float direct    AB=1.000000 BC=1.000000 CA=0.000000  erreur max=4.95e-01 m
origine locale  AB=0.010000 BC=0.014142 CA=0.010000  erreur max=0.00e+00 m
B - A en float  : 1
B - A en double : 0.010000
```

| Élément | Rôle |
|---|---|
| `(PointF){(float)p.x, (float)p.y}` | Un **littéral composé** : fabrique un `PointF` sur place, sans variable intermédiaire (voir [le littéral composé](/?c=langages&s=c&p=offsetof-et-litteral-compose#le-litteral-compose-c99-une-valeur-fabriquee-sur-place)) |
| `fmax(a, b)` | Le plus grand des deux nombres |
| `%-15s` | Un texte sur 15 caractères, aligné à gauche |
| `%.2e` | Notation scientifique avec deux décimales : `4.95e-01` signifie 4,95 × 10⁻¹ |
| `const Point origine = v[0];` | L'origine locale est ici le premier sommet |

Avec l'origine locale, les côtés sont justes. L'« erreur max » de `0.00e+00` ne dit pas que le `float` est exact (0,01 y est stocké à environ 2 × 10⁻¹⁰ près) : cette erreur est plus petite que la moitié du pas du `double` à 10 000 km (environ 9 × 10⁻¹⁰ m), donc l'addition `origine + valeur` retombe sur la valeur d'origine.

### Quelle origine choisir

| Choix | Avantage | Inconvénient |
|---|---|---|
| Le premier sommet | Simple ; décalages petits pour un objet compact | Dépend de l'ordre des sommets ; deux objets voisins ont deux origines différentes |
| Le centre de la boîte englobante (le plus petit pavé qui contient les données) | Décalages au plus égaux à la demi-taille | Se recalcule dès que les données changent |
| Un coin de la zone | Facile à retrouver | Décalages jusqu'à la taille entière |
| Un multiple d'une puissance de deux (section suivante) | Exacte partout, identique pour tous les objets d'une même case | Choisir le pas |

## Pourquoi un pas de puissance de deux

Les trois premiers choix ont un défaut commun : l'origine dépend des données. Un **pas** est une longueur fixe, ici 2ᵏ mètres (k est un entier : k = 10 donne 1 024 m). L'origine se calcule alors à partir de la coordonnée seule : O = 2ᵏ × (x / 2ᵏ arrondi à l'entier le plus proche). Tous les points qui reçoivent la même origine forment une **case** : un segment de 2ᵏ mètres (un carré en 2D, un cube en 3D).

```text
frontières :  9999872                  10000896
                 |<------- 1024 m ------->|
                 |           O             |
                 |       10000384          |   toute coordonnée de cette case
                 |                         |   reçoit la même origine O
```

Le calcul, avec x = 10000000.495 et k = 10 :

| Étape | Opération | Valeur |
|---|---|---|
| 1 | x ÷ 2¹⁰ (un simple décalage de l'exposant) | 9765,6255 |
| 2 | Ajouter 0,5 puis prendre la partie entière (`floor`) | 9766 |
| 3 | Multiplier par 2¹⁰ | O = 10 000 384 |
| 4 | Décalage x − O | −383,505 |

```c
#include <math.h>
#include <stdio.h>

// Origine choisie par pas : le multiple de 2^k le plus proche de x
static double origine_par_pas(double x, int k)
{
    double n = floor(ldexp(x, -k) + 0.5);   // x / 2^k, arrondi à l'entier le plus proche
    return ldexp(n, k);                     // n * 2^k (ldexp(m, e) vaut m * 2^e, sans erreur)
}

// Range x dans un float relatif à l'origine o, puis le relit : la valeur retrouvée
static double aller_retour(double x, double o)
{
    float f = (float)(x - o);               // soustraction en double, puis en float
    return o + f;                           // on remet l'origine, en double
}

int main(void)
{
    const double x = 10000000.495;          // une coordonnée à 10 000 km de l'origine
    const int pas[] = {0, 4, 10, 16};       // les exposants k testés

    printf("x = %.3f\n", x);
    for (int i = 0; i < 4; i++) {           // un essai par pas
        double o = origine_par_pas(x, pas[i]);
        double pire = 0.0;                  // plus grande erreur sur 200 000 points voisins
        for (int j = 0; j < 200000; j++) {
            double p = 10000000.0 + j * 0.4713;
            pire = fmax(pire, fabs(aller_retour(p, origine_par_pas(p, pas[i])) - p));
        }
        printf("k=%2d pas=%6.0f origine=%.0f décalage=%+.3f erreur max=%.2e\n",
               pas[i], ldexp(1.0, pas[i]), o, x - o, pire);
    }

    const double libre = 10000000.1;        // une origine « libre », près des données
    const double par_pas = origine_par_pas(libre, 10);
    printf("quelconque : double=%.9f float=%.9f\n", libre, (double)(float)libre);
    printf("par pas    : double=%.9f float=%.9f\n", par_pas, (double)(float)par_pas);

    const double partage = 10000040.123;    // un sommet commun à deux morceaux voisins
    const double centre_a = 10000020.3, centre_b = 10000070.7;  // un centre par morceau
    printf("centres : écart entre les deux relectures = %.2e m\n",
           fabs(aller_retour(partage, centre_a) - aller_retour(partage, centre_b)));
    printf("par pas : écart entre les deux relectures = %.2e m\n",
           fabs(aller_retour(partage, origine_par_pas(partage - 20.0, 10))
                - aller_retour(partage, origine_par_pas(partage + 30.0, 10))));

    const double bord = 10000895.9;         // un sommet voisin d'une frontière de case
    printf("à la frontière : écart = %.2e m\n",
           fabs(aller_retour(bord, origine_par_pas(bord - 2.0, 10))
                - aller_retour(bord, origine_par_pas(bord + 2.0, 10))));
    return 0;
}
```

```text
x = 10000000.495
k= 0 pas=     1 origine=10000000 décalage=+0.495 erreur max=1.49e-08
k= 4 pas=    16 origine=10000000 décalage=+0.495 erreur max=2.38e-07
k=10 pas=  1024 origine=10000384 décalage=-383.505 erreur max=1.52e-05
k=16 pas= 65536 origine=10027008 décalage=-27007.505 erreur max=9.75e-04
quelconque : double=10000000.100000000 float=10000000.000000000
par pas    : double=10000384.000000000 float=10000384.000000000
centres : écart entre les deux relectures = 3.80e-07 m
par pas : écart entre les deux relectures = 0.00e+00 m
à la frontière : écart = 3.05e-05 m
```

| Élément | Rôle |
|---|---|
| `ldexp(m, e)` | Calcule m × 2ᵉ en ne modifiant que l'exposant du nombre : **aucune erreur d'arrondi** ([`ldexp`](https://en.cppreference.com/w/c/numeric/math/ldexp)) |
| `floor(y)` | Le plus grand entier inférieur ou égal à y, renvoyé en `double` ; `floor(y + 0.5)` arrondit à l'entier le plus proche ([`floor`](https://en.cppreference.com/w/c/numeric/math/floor)) |
| `fabs(y)` | La valeur absolue de y |
| `%+.3f`, `%6.0f`, `%2d` | Formats de `printf` : trois décimales avec le signe ; un nombre sur 6 caractères sans décimale ; un entier sur 2 caractères |
| `%.9f` | Un nombre avec neuf décimales |
| `(double)(float)libre` | Ce que devient `libre` si on le fait passer par un `float` |

Pourquoi des puissances de deux, et pas une origine « libre » ou un pas décimal comme 0,1 m (que ni `float` ni `double` ne représentent exactement) ?

| Propriété | Explication | Ce que la sortie montre |
|---|---|---|
| L'origine elle-même est exacte | Un multiple n × 2ᵏ (n < 2²⁴) tient dans un `float` **et** dans un `double` sans arrondi. Un nombre comme 10000000.1 ne tient dans aucun : il n'est qu'approché | `libre` repasse par un `float` et devient 10 000 000,0 : **0,1 m d'erreur de plus**, soit dix fois le côté du triangle. `par_pas` revient inchangée |
| Le décalage est borné | La case ne dépasse jamais 2ᵏ⁻¹ de part et d'autre de O : l'erreur de la conversion est bornée par 2ᵏ⁻²⁶ (plus l'arrondi minuscule de l'addition finale en `double`), quelle que soit la distance à l'origine du monde | La colonne `erreur max` suit la borne (tableau ci-dessous) |
| La même origine se retrouve partout | O ne dépend que de x et de k : chargement, sauvegarde, envoi à la carte graphique et autre machine donnent la même valeur. On peut même ne mémoriser que l'entier n | Dans la ligne `par pas`, deux points distants de 50 m reçoivent la même origine |
| Les voisins la partagent | Tous les points d'une même case ont la même origine, donc la même conversion pour un sommet commun | `centres` : 3,80e-07 m d'écart ; `par pas` : 0 |

Le point 1 mérite une précision d'honnêteté. La **soustraction** `x - 10000000.1` reste exacte en `double`, comme avec n'importe quelle origine proche (voir plus haut). L'erreur supplémentaire naît quand cette origine voyage ailleurs que dans un `double` : envoyée à la carte graphique en `float`, écrite dans un fichier en texte arrondi, ou recalculée un peu différemment à un autre endroit du programme. Une origine multiple de 2ᵏ traverse tous ces passages sans changer.

Choisir k règle un compromis, mesuré sur 200 000 points voisins :

| k | Pas (m) | Décalage maximal (m) | Borne 2ᵏ⁻²⁶ (m) | Erreur mesurée (m) |
|---|---|---|---|---|
| 0 | 1 | 0,5 | 1,49 × 10⁻⁸ | 1,49 × 10⁻⁸ |
| 4 | 16 | 8 | 2,4 × 10⁻⁷ | 2,38 × 10⁻⁷ |
| 10 | 1 024 | 512 | 1,5 × 10⁻⁵ | 1,52 × 10⁻⁵ |
| 16 | 65 536 | 32 768 | 9,8 × 10⁻⁴ | 9,75 × 10⁻⁴ |

On choisit le plus grand k dont la borne reste sous la tolérance voulue : un pas plus grand signifie moins d'origines à gérer, un pas plus petit plus de précision. Le dernier test de la sortie montre la limite de la méthode : à la **frontière** entre deux cases, deux points voisins reçoivent deux origines différentes (10 000 384 et 10 001 408), et un sommet commun rangé deux fois peut différer de 3,05 × 10⁻⁵ m, soit un écart de `float` à 512 m. L'écart reste borné, mais il n'est pas nul.

## Limites et autres remèdes

### Stocker l'origine avec l'objet

L'origine locale fait partie des données : sans elle, les `float` ne situent plus rien. On la range en `double`, à côté des coordonnées relatives :

```c
#include <stddef.h>

typedef struct {
    double origine[3];      // l'origine locale de l'objet, en double (3 × 8 = 24 octets)
    float *sommets;         // x, y, z de chaque sommet, relatifs à l'origine, en float
    size_t nb_sommets;      // nombre de sommets
} Maillage;

// Coordonnée x absolue du sommet i : l'origine est remise en double
static double x_absolu(const Maillage *m, size_t i)
{
    return m->origine[0] + m->sommets[3 * i];
}

// Écart en x entre le sommet i de a et le sommet j de b, sans passer par un grand nombre
static double ecart_x(const Maillage *a, size_t i, const Maillage *b, size_t j)
{
    double entre_origines = a->origine[0] - b->origine[0];  // grande différence, en double
    return entre_origines + ((double)a->sommets[3 * i] - b->sommets[3 * j]);
}
```

| Élément | Rôle |
|---|---|
| `size_t` | Un entier sans signe fait pour compter des éléments et des positions |
| `m->origine[0]` | Le champ `origine` de la structure dont `m` est l'adresse, première case (x) |
| `m->sommets[3 * i]` | Les sommets sont rangés à plat : x, y, z du sommet 0, puis du sommet 1... ; la coordonnée x du sommet i est à la case 3 × i |
| `(double)a->sommets[3 * i] - b->sommets[3 * j]` | Le cast convertit le `float` de gauche en `double` ; celui de droite est alors promu automatiquement en `double`, donc la soustraction se fait en `double` |

`ecart_x` illustre la règle pour deux objets d'origines différentes : on soustrait d'abord les **origines** entre elles, en `double`, puis on ajoute la petite différence des décalages.

### Le coût et la carte graphique

| Question | Réponse |
|---|---|
| Pourquoi ne pas tout stocker en `double` ? | Un `double` occupe 8 octets, un `float` 4 (voir [l'organisation en mémoire](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Un million de sommets en 3D : 12 Mo (mégaoctets, des millions d'octets) en `float`, 24 Mo en `double`, et le double de données à envoyer à la carte graphique à chaque fois |
| Pourquoi la carte graphique est-elle concernée ? | Ses programmes, les [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-shaders-les-programmes-de-la-carte-graphique), calculent en `float` : le `double` y est absent sur certains matériels et nettement plus lent sur d'autres |
| Que faire alors ? | Garder l'origine en `double` côté processeur et n'envoyer que des `float` relatifs. La translation de l'objet (voir [les matrices model, view et projection](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#de-l-objet-a-l-ecran-model-view-projection)) se calcule en `double`, et seule sa version réduite part en `float` |

### D'autres remèdes

| Remède | Principe | Détail |
|---|---|---|
| Coordonnées relatives à la caméra | À chaque image, soustraire en `double` la position de la caméra : la précision est maximale près de l'œil | Une origine locale qui suit la caméra |
| Entiers à point fixe | Compter en millimètres dans un entier de 64 bits : l'écart est le même partout | Voir [la virgule fixe](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#une-alternative-la-representation-en-virgule-fixe) |
| `double` partout | Repousse le seuil (de 16,7 millions à 9 millions de milliards pour les entiers) | Coût mémoire, vitesse |
| Découper le monde en cases | Une origine par case (le pas de puissance de deux de ce chapitre), chaque case a ses propres `float` | Gérer les frontières |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Convertir en `float` **avant** de soustraire | `(float)p - (float)O` retombe sur 0 ou sur un mètre : la perte est déjà faite. Soustraire en `double` d'abord |
| Perdre l'origine, ou la ranger en `float` | Les décalages restent justes, mais tout l'objet est déplacé (de 0,1 m dans l'exemple de `libre`). Stocker l'origine en `double` avec l'objet |
| Mélanger deux objets d'origines différentes | Comparer ou additionner leurs `float` comme s'ils partageaient un repère décale tout de la différence des origines. Ramener au même repère (soustraire les origines en `double`, voir `ecart_x`) |
| Un sommet commun à deux morceaux d'origines différentes | Rangé deux fois, il diffère de quelques écarts de `float` : une fissure entre les morceaux. Donner la même origine aux deux, ou ne le ranger qu'une fois |
| Ajouter la translation de l'objet en `float` plus tard | Une matrice de placement (un tableau de nombres qui déplace et tourne l'objet) qui contient 10 000 000 en `float` ramène le problème d'origine. Composer en `double`, réduire à la fin |
| Comparer deux flottants avec `==` | Même après un aller-retour exact, un arrondi peut subsister. Comparer avec une marge relative (voir `presque_egaux` plus bas) ou en `double` après remise de l'origine |
| Prendre `FLT_EPSILON` pour la précision de tout `float` | Il ne vaut que près de 1. Une tolérance proportionnelle à la valeur est nécessaire |
| Choisir un pas trop grand | À k = 16, l'erreur monte à près d'un millimètre. Choisir k d'après la tolérance |
| Additionner beaucoup de petites valeurs à un grand total | Chaque ajout est arrondi (ou absorbé) : voir les sommes plus haut et [l'absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#l-absorption-et-l-annulation-quand-un-calcul-perd-ses-chiffres). Additionner d'abord les petites valeurs entre elles |

Une comparaison de `float` avec marge proportionnelle (`fabsf` est la valeur absolue d'un `float`, `fmaxf` le plus grand de deux `float`) :

```c
#include <float.h>
#include <math.h>

// Vrai si a et b diffèrent d'au plus quatre fois l'écart relatif d'un float
static int presque_egaux(float a, float b)
{
    float marge = 4.0f * FLT_EPSILON * fmaxf(fabsf(a), fabsf(b));  // marge proportionnelle
    return fabsf(a - b) <= marge;       // fabsf : valeur absolue d'un float
}
```

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Garder les coordonnées du monde en `double`, ne ranger en `float` que des décalages | Les grands nombres restent précis, les petits tiennent en 24 bits |
| Soustraire l'origine en `double`, convertir ensuite | La différence est exacte, la conversion porte sur un petit nombre |
| Choisir l'origine par pas de puissance de deux (`ldexp`, `floor`) | Origine exacte, reproductible, partagée par les voisins |
| Choisir k d'après la tolérance : erreur ≤ 2ᵏ⁻²⁶ | L'erreur maximale se calcule avant de coder |
| Ranger l'origine (ou l'entier n et k) avec chaque objet | Les `float` ne servent à rien sans elle |
| Ramener deux objets au même repère en soustrayant leurs origines en `double` | Aucune grande valeur ne repasse par un `float` |
| Mesurer l'écart au-dessus de la valeur utile avec `nextafterf` plutôt que le supposer | On voit la précision réelle à l'endroit où l'on travaille |
| Comparer avec une marge proportionnelle, jamais avec `==` | La tolérance suit la taille des valeurs |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un `float` a 24 bits significatifs : l'écart entre deux voisins vaut 2ᵉ⁻²³ et double à chaque palier de puissance de deux (1,2e-7 à 1, 0,0625 à un million, 2 à 16 777 216, 8 à cent millions). `FLT_EPSILON` est cet écart autour de 1,0 seulement : la précision est constante en proportion, mais l'erreur absolue grandit. Loin de l'origine, un triangle de 1 cm devient nul ou fait 1 m. La parade est une origine locale en `double`, soustraite **avant** la conversion en `float` ; l'origine est choisie par pas de puissance de deux (2ᵏ × entier), exacte, reproductible et partagée par les voisins. |
| **Pièges à éviter** | Convertir avant de soustraire ; oublier ou arrondir l'origine ; mélanger deux repères d'origines différentes ; un sommet commun rangé avec deux origines ; la translation d'objet recomposée en `float` ; `==` et `FLT_EPSILON` comme tolérance universelle ; un pas trop grand ; additionner de petits termes à un grand total. |
| **Bonnes pratiques** | Monde en `double`, décalages en `float` ; soustraction en `double` puis conversion ; origine par pas 2ᵏ avec k choisi selon la tolérance ; origine stockée avec l'objet ; différence des origines en `double` entre objets ; marge de comparaison proportionnelle à la valeur ; `nextafterf` pour mesurer l'écart réel. |
