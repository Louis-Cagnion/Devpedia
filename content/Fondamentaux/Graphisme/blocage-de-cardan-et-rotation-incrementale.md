---
order: 11
---

# Blocage de cardan et rotation incrémentale

Une **orientation** est la façon dont un objet est tourné dans l'espace, sa position mise à part : un avion qui pique du nez, une caméra qui regarde vers le haut, un modèle 3D que l'on fait pivoter à la souris. Pour la mémoriser, l'idée la plus naturelle est de garder **trois angles**, un par axe : ce sont les **angles d'Euler**. Elle fonctionne bien, jusqu'à une valeur précise où deux des trois commandes se mettent à faire la même chose : un mouvement devient impossible et la vue peut sauter. Ce défaut s'appelle le **blocage de cardan** (*gimbal lock* en anglais). Un **cardan** est une suspension faite d'anneaux emboîtés, chacun pivotant dans le suivant, comme celle d'une boussole de bateau ou d'un gyroscope ; le blocage survient quand deux de ces anneaux se retrouvent dans le même plan. Les calculs ci-dessous reproduisent ce montage avec des matrices ([détail du phénomène](https://en.wikipedia.org/wiki/Gimbal_lock)).

Ce chapitre montre le défaut par des mesures, le contourne en stockant une matrice au lieu d'angles, puis traite le prix à payer :

| Étape | Question | Section |
|---|---|---|
| 1 | Qu'est-ce qu'un angle d'Euler, et pourquoi l'ordre des rotations compte-t-il ? | [Les angles d'Euler](#les-angles-d-euler-trois-nombres-trois-axes) |
| 2 | Que se passe-t-il exactement au moment du blocage ? | [Le blocage de cardan](#le-blocage-de-cardan-quand-deux-axes-n-en-font-plus-qu-un) |
| 3 | Comment l'éviter ? | [La rotation incrémentale](#la-rotation-incrementale-garder-la-matrice-pas-les-angles) |
| 4 | Quelle erreur cette matrice accumule-t-elle, et comment l'effacer ? | [L'erreur d'arrondi](#l-erreur-d-arrondi-qui-s-accumule) puis [la ré-orthonormalisation](#la-re-orthonormalisation-remettre-la-matrice-d-aplomb) |
| 5 | Quand garder des angles quand même ? | [Les variantes](#les-variantes-quaternions-et-angles-limites) |

Il prolonge [Matrices et caméra](/?c=fondamentaux&s=graphisme&p=matrices-et-camera), qui construit les matrices de rotation, présente la [rotation accumulée](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#faire-tourner-un-objet-la-rotation-accumulee) et la [formule de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#tourner-autour-d-un-axe-quelconque-la-formule-de-rodrigues) : il les utilise sans les redémontrer. Il suppose connus [les matrices et le produit matriciel](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) (un tableau de nombres, et la façon de multiplier deux tableaux), [les vecteurs, le produit scalaire et la norme](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (une liste de nombres, la somme de leurs produits deux à deux, et la longueur du vecteur), et les bases du C : [les variables](/?c=langages&s=c&p=variables), [les conditions](/?c=langages&s=c&p=conditions) et [les boucles](/?c=langages&s=c&p=boucles).

Tous les programmes se compilent avec `gcc -std=c99 -Wall -Wextra -o programme programme.c -lm` (voir [la compilation](/?c=langages&s=c&p=compilation) : `-Wall -Wextra` demandent tous les avertissements, `-lm` ajoute la bibliothèque mathématique) et se lancent avec `./programme` (sous Linux ou macOS). Les sorties reproduites dans ce chapitre ont toutes été relevées à l'exécution. Règle d'assemblage : un programme est formé de **tous les blocs de fonctions qui précèdent**, dans l'ordre, suivis d'**un seul bloc contenant `main`** (la fonction par laquelle un programme C démarre). Les blocs qui contiennent déjà un `main` ne servent qu'à eux-mêmes.

## Les angles d'Euler : trois nombres, trois axes

Un **axe** est la ligne droite autour de laquelle on tourne, comme la broche d'une toupie. L'espace en a trois, nommés comme dans [le chapitre sur les matrices](/?c=fondamentaux&s=graphisme&p=matrices-et-camera) : **X** vers la droite, **Y** vers le haut, **Z** vers vous, hors de l'écran (la caméra regarde donc vers -Z). Les angles d'Euler, du nom du mathématicien Leonhard Euler ([détail](https://en.wikipedia.org/wiki/Euler_angles)), décrivent une orientation par une rotation autour de chacun :

| Angle | Nom anglais | Axe | Le geste de la tête | Pour un avion |
|---|---|---|---|---|
| **Tangage** | *pitch* | X | Hocher la tête pour dire « oui » | Le nez monte ou descend |
| **Lacet** | *yaw* | Y | Tourner la tête pour dire « non » | Le nez part à gauche ou à droite |
| **Roulis** | *roll* | Z | Pencher la tête, l'oreille vers l'épaule | Les ailes s'inclinent |

```text
            Y (haut)  lacet : tourner autour de Y
            ^
            |
            |
            +---------> X (droite)   tangage : tourner autour de X
           /
          /
         v
        Z (vers vous)                roulis : tourner autour de Z
```

Un angle se mesure en **degrés** (un tour complet vaut 360) ou en **radians** (180 degrés valent π, soit environ 3,14159 radians ; [rappel](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#de-l-objet-a-l-ecran-model-view-projection) avec le cosinus et le sinus). Les fonctions `cos` et `sin` du C attendent des radians. Le sens positif est celui de la **règle de la main droite** : le pouce le long de l'axe, pointé vers soi, les doigts qui se referment donnent le sens de rotation d'un angle positif.

Chaque rotation est une matrice 3×3, la version sans translation de celles du [chapitre précédent](/?c=fondamentaux&s=graphisme&p=matrices-et-camera). Pour une telle matrice, la **colonne j** dit où va la flèche de longueur 1 posée sur l'axe j (colonne 0 pour X, 1 pour Y, 2 pour Z) : c'est ce que donne le produit de la matrice par cette flèche. Les blocs de code qui suivent utilisent quelques écritures du C :

| Écriture | Sens |
|---|---|
| `#include <math.h>` | Charge une bibliothèque de fonctions ([les en-têtes](/?c=langages&s=c&p=headers)). `math.h` apporte `cos`, `sin`, `sqrt` (racine carrée) et `fabs` (valeur absolue : le nombre sans son signe), voir la [liste des fonctions de `<math.h>`](https://en.cppreference.com/w/c/numeric/math) ; `stdio.h` apporte `printf` |
| `int`, `long` | Nombres entiers (`long` : une plage plus grande), voir [les variables](/?c=langages&s=c&p=variables) |
| `float`, `double` | Nombres à virgule stockés sur 32 et 64 bits, soit environ 7 et 15 chiffres exacts ([détail](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#comment-un-flottant-est-encode)). Les fonctions `cos`, `sin`, `sqrt` calculent en `double` |
| `1e-9`, `3.0e-08` | Notation scientifique : `1e-9` vaut 10⁻⁹, soit 0,000000001 |
| `const` | Une valeur qui ne changera jamais |
| `float v[3]` | Un tableau : 3 nombres rangés côte à côte, `v[0]`, `v[1]`, `v[2]`, que l'on remplit avec `{1, 0, 0}` |
| `typedef struct { ... } Nom;` | Regroupe plusieurs valeurs sous un seul nom de type ; `e.champ` désigne le champ `champ` de la valeur `e` |
| `m[i][j]` | La case de la ligne `i` et de la colonne `j` d'un tableau à deux dimensions ; on compte à partir de 0 |
| `for (int i = 0; i < 3; i++)` | Répète l'instruction suivante avec `i` valant 0, puis 1, puis 2 |
| `a % b` | Le reste de la division de `a` par `b` |
| `a += b`, `a -= b`, `a /= b` | Raccourcis pour `a = a + b`, `a = a - b`, `a = a / b` |
| `a == b`, `a && b` | `==` compare deux valeurs (vrai si elles sont égales) ; `&&` signifie « et » |
| Une fonction | Un morceau de code nommé : `Mat3 produit(Mat3 a, Mat3 b)` reçoit deux matrices et en renvoie une (`return`) |
| `x ? a : b` | Vaut `a` si la condition `x` est vraie, `b` sinon |

Le premier bloc écrit les rotations autour d'un axe, le produit de deux matrices et l'application d'une matrice à un point. Une seule fonction `rotation_axe` fabrique les trois rotations : pour l'axe 2 (Z), elle remplit exactement la matrice du tableau du chapitre voisin.

```c
#include <math.h>      // cos, sin, sqrt, fabs...
#include <stdio.h>     // printf

// Un angle de 1 degré, exprimé en radians : π / 180
const float DEG = 0.017453292;

// Une matrice 3 x 3 de float, lue m[ligne][colonne] ; typedef lui donne un nom court
typedef struct { float m[3][3]; } Mat3;

// Matrice de rotation de "angle" radians autour de l'axe 0 (X), 1 (Y) ou 2 (Z)
Mat3 rotation_axe(int axe, float angle)
{
    Mat3 r = {{{0}}};                       // toute la matrice commence à 0
    int i = (axe + 1) % 3;                  // les deux autres axes, dans l'ordre X, Y, Z
    int j = (axe + 2) % 3;                  // (% : reste de la division : 2 + 1 donne 0)
    r.m[axe][axe] = 1;                      // l'axe de rotation lui-même ne bouge pas
    r.m[i][i] = cos(angle);                 // cos et sin calculent en double ;
    r.m[i][j] = -sin(angle);                // le résultat est rangé dans un float
    r.m[j][i] = sin(angle);                 // seconde case hors diagonale : sinus
    r.m[j][j] = cos(angle);                 // seconde case de la diagonale : cosinus
    return r;
}

// Produit matriciel a * b : l'élément (i, j) est le produit scalaire de la ligne i
// de a par la colonne j de b
Mat3 produit(Mat3 a, Mat3 b)
{
    Mat3 r = {{{0}}};                       // le résultat, rempli case par case
    for (int i = 0; i < 3; i++)             // chaque ligne i du résultat
        for (int j = 0; j < 3; j++)         // chaque colonne j du résultat
            for (int k = 0; k < 3; k++)     // somme des trois produits ligne x colonne
                r.m[i][j] += a.m[i][k] * b.m[k][j];  // ajoute un produit à la case (i, j)
    return r;
}

// Image du point p par la matrice a : le vecteur a * p, rangé dans v (void : rien à renvoyer)
void appliquer(Mat3 a, const float p[3], float v[3])
{
    for (int i = 0; i < 3; i++)             // chaque coordonnée du résultat
        // ligne i de a, multipliée terme à terme par p, puis sommée
        v[i] = a.m[i][0] * p[0] + a.m[i][1] * p[1] + a.m[i][2] * p[2];
}

// Ramène à 0 un reste d'arrondi (moins de 0,00005) pour un affichage lisible ;
// « x ? a : b » vaut a si la condition x est vraie, b sinon
float net(float x)
{
    return fabs(x) < 0.00005 ? 0 : x;
}
```

Le programme suivant compose deux rotations de 90 degrés dans les deux ordres. `printf("(%.0f, %.0f)\n", x, y)` affiche du texte dans lequel chaque `%` est remplacé par une valeur donnée ensuite (`%.0f` : un nombre à virgule sans décimale), et `\n` passe à la ligne ; `return 0` dit au système que le programme s'est bien terminé.

```c
int main(void)
{
    const float depart[3] = {1, 0, 0};      // un point posé sur l'axe X
    float v[3];                             // le point après rotation
    // Z (axe 2) puis X (axe 0) : le produit s'écrit X * Z
    Mat3 z_puis_x = produit(rotation_axe(0, 90 * DEG), rotation_axe(2, 90 * DEG));
    // X (axe 0) puis Z (axe 2) : le produit s'écrit Z * X
    Mat3 x_puis_z = produit(rotation_axe(2, 90 * DEG), rotation_axe(0, 90 * DEG));

    appliquer(z_puis_x, depart, v);         // Z agit en premier (matrice la plus à droite)
    // les trois coordonnées, sans reste d'arrondi
    printf("Z puis X : (%.0f, %.0f, %.0f)\n", net(v[0]), net(v[1]), net(v[2]));
    appliquer(x_puis_z, depart, v);         // X agit en premier
    printf("X puis Z : (%.0f, %.0f, %.0f)\n", net(v[0]), net(v[1]), net(v[2]));  // idem
    return 0;
}
```

```text
Z puis X : (0, 0, 1)
X puis Z : (0, 1, 0)
```

| Ordre | Ce que fait le point (1, 0, 0) | Résultat |
|---|---|---|
| Z puis X | Z l'envoie de l'axe X vers l'axe Y ; X le fait ensuite passer de Y à Z | (0, 0, 1) |
| X puis Z | X le laisse en place (il est sur l'axe X) ; Z l'envoie ensuite vers Y | (0, 1, 0) |

**L'ordre compte** : deux rotations ne se « commutent » pas. Pour trois angles, il faut donc **choisir un ordre une fois pour toutes** et le garder. Ce chapitre prend **lacet, tangage, roulis** : l'orientation est le produit `Ry(lacet) × Rx(tangage) × Rz(roulis)`. Le produit se lit de droite à gauche, comme au chapitre sur les matrices : le roulis agit d'abord sur l'objet, le tangage ensuite, le lacet en dernier.

### Pourquoi c'est tentant

| Atout | Détail |
|---|---|
| Lisible | « tangage 30 degrés » parle à un humain ; neuf coefficients de matrice, non |
| Facile à piloter à la souris | Un déplacement horizontal ajoute au lacet, un déplacement vertical ajoute au tangage |
| Léger | 3 nombres au lieu de 9 |
| Aucune dérive | La matrice est recalculée à partir des 3 angles : elle est toujours une rotation exacte, aux arrondis près |
| Simple à écrire dans un fichier ou un éditeur | Trois curseurs, trois champs de saisie |

Le prix à payer apparaît dans la section suivante.

## Le blocage de cardan : quand deux axes n'en font plus qu'un

Le produit `Ry(lacet) × Rx(tangage) × Rz(roulis)` fait agir le roulis autour de Z, puis le tangage **bascule** cet axe Z. Quand le tangage vaut 90 degrés, il le couche exactement sur l'axe Y, celui du lacet : roulis et lacet tournent alors autour **du même axe**.

```text
Tangage 0 degré                       Tangage 90 degrés

    Y = axe du lacet                      Y = axe du lacet
    ^                                     ^  = axe du roulis (couché par le tangage)
    |                                     |
    +-----> X                             +-----> X
   /                                     /
  Z = axe du roulis                     Z : plus aucun angle n'y tourne

trois axes différents :               deux axes confondus :
trois rotations possibles             deux rotations possibles
```

Une rotation est perdue : on dit qu'on a **un degré de liberté en moins** (un degré de liberté est une façon indépendante de bouger : ici, trois au départ, deux au blocage). Le programme suivant le prouve avec les 9 coefficients de la matrice. Il fabrique une orientation à partir d'un ordre d'axes et de trois angles, mesure le plus grand écart entre deux matrices (`ecart_max`) et affiche une matrice (`afficher`). Dans `afficher`, `const char *nom` est un texte ; `%s` l'insère dans l'affichage et `%7.4f` écrit un nombre à virgule sur 7 caractères de large, avec 4 décimales.

```c
// Orientation décrite par trois angles : produit des rotations ordre[0], ordre[1], ordre[2]
// d'angles angle[0], angle[1], angle[2] ; la rotation écrite en dernier agit en premier
Mat3 euler(const int ordre[3], const float angle[3])
{
    Mat3 r = rotation_axe(ordre[0], angle[0]);      // la première du produit
    // on multiplie par la deuxième rotation
    r = produit(r, rotation_axe(ordre[1], angle[1]));
    return produit(r, rotation_axe(ordre[2], angle[2]));
}

// Plus grand écart, en valeur absolue, entre les 9 coefficients de a et ceux de b
float ecart_max(Mat3 a, Mat3 b)
{
    float pire = 0;                         // le plus grand écart rencontré
    for (int i = 0; i < 3; i++)             // chaque ligne
        for (int j = 0; j < 3; j++)         // chaque colonne
            if (fabs(a.m[i][j] - b.m[i][j]) > pire)  // cet écart bat-il le record ?
                pire = fabs(a.m[i][j] - b.m[i][j]);  // oui : il devient le record
    return pire;
}

// Affiche une matrice, une ligne de trois coefficients par ligne de texte ;
// « const char *nom » est un texte (une adresse de caractères), %s l'insère
void afficher(const char *nom, Mat3 a)
{
    printf("%s\n", nom);                    // le titre de la matrice
    for (int i = 0; i < 3; i++)             // une ligne de texte par ligne de la matrice
        // les trois coefficients de la ligne
        printf("  %7.4f %7.4f %7.4f\n", net(a.m[i][0]), net(a.m[i][1]), net(a.m[i][2]));
}
```

Trois jeux d'angles {lacet, tangage, roulis} partagent le même tangage de 90 degrés et le même écart lacet moins roulis (20). Deux autres, à 45 degrés, ont les mêmes lacets et roulis. `%.1e` affiche un nombre en notation scientifique avec une décimale : `3.0e-08` vaut 3,0 × 10⁻⁸, soit 0,00000003.

```c
int main(void)
{
    const int ordre[3] = {1, 0, 2};         // lacet (axe Y), tangage (axe X), roulis (axe Z)
    // Chaque jeu d'angles s'écrit {lacet, tangage, roulis}
    const float a[3] = {30 * DEG, 90 * DEG, 10 * DEG};
    // même tangage ; lacet et roulis augmentés de 20 degrés
    const float b[3] = {50 * DEG, 90 * DEG, 30 * DEG};
    // même tangage ; lacet moins roulis vaut encore 20
    const float c[3] = {20 * DEG, 90 * DEG, 0 * DEG};
    const float d[3] = {30 * DEG, 45 * DEG, 10 * DEG};      // même lacet et roulis que a,
    const float e[3] = {50 * DEG, 45 * DEG, 30 * DEG};      // mais tangage de 45 degrés

    // les 9 coefficients du jeu A
    afficher("A : lacet 30, tangage 90, roulis 10", euler(ordre, a));
    afficher("B : lacet 50, tangage 90, roulis 30", euler(ordre, b));  // ceux du jeu B
    afficher("C : lacet 20, tangage 90, roulis 0", euler(ordre, c));  // ceux du jeu C
    // plus grand écart entre les matrices A et B
    printf("écart A-B : %.1e\n", ecart_max(euler(ordre, a), euler(ordre, b)));
    // entre A et C
    printf("écart A-C : %.1e\n", ecart_max(euler(ordre, a), euler(ordre, c)));
    // entre D et E
    printf("écart D-E (tangage 45) : %.1e\n", ecart_max(euler(ordre, d), euler(ordre, e)));
    return 0;
}
```

```text
A : lacet 30, tangage 90, roulis 10
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
B : lacet 50, tangage 90, roulis 30
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
C : lacet 20, tangage 90, roulis 0
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
écart A-B : 3.0e-08
écart A-C : 3.0e-08
écart D-E (tangage 45) : 2.3e-01
```

| Comparaison | Tangage | Plus grand écart entre les 9 coefficients | Lecture |
|---|---|---|---|
| A (30, 90, 10) contre B (50, 90, 30) | 90 degrés | 3,0 × 10⁻⁸ | Même matrice (au bruit d'arrondi près) |
| A (30, 90, 10) contre C (20, 90, 0) | 90 degrés | 3,0 × 10⁻⁸ | Même matrice |
| D (30, 45, 10) contre E (50, 45, 30) | 45 degrés | 0,23 | Deux orientations bien différentes |

Trois jeux d'angles distincts donnent **la même orientation** : à 90 degrés, seule la différence lacet moins roulis compte. Le calcul à la main le confirme : `Ry(a) × Rx(90°) × Rz(c) = Ry(a - c) × Rx(90°)`. Le tableau des ordres plus bas vérifie cette règle par la mesure.

### Mesurer la liberté perdue

Pour savoir autour de quel axe chaque angle fait tourner l'objet, on le fait varier d'un tout petit pas (0,001 radian) et on lit l'axe de la petite rotation obtenue. La **transposée** d'une matrice échange ses lignes et ses colonnes ([rappel](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transposee-echanger-lignes-et-colonnes)) ; pour une rotation, c'est aussi son **inverse** : la rotation qui défait exactement la première. Multiplier une orientation `apres` par la transposée de `avant` donne donc la rotation qui mène de l'une à l'autre, dont on lit l'axe dans les écarts entre éléments symétriques (`r21 - r12`, ..., où `rij` est l'élément de la ligne `i` et de la colonne `j`, comme dans [la section sur l'axe et l'angle](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#retrouver-l-axe-et-l-angle-d-une-rotation)).

```c
// Transposée de a : lignes et colonnes échangées. Pour une rotation, c'est aussi
// son inverse : la rotation qui défait exactement a
Mat3 transposee(Mat3 a)
{
    Mat3 t = {{{0}}};                       // la transposée, remplie case par case
    for (int i = 0; i < 3; i++)             // chaque ligne i de a
        for (int j = 0; j < 3; j++)         // chaque colonne j de a
            t.m[j][i] = a.m[i][j];          // devient la ligne j, colonne i de t
    return t;
}

// Vitesse de rotation entre deux orientations très proches : l'axe de la petite rotation
// qui mène de avant à après, lu dans les écarts r21 - r12, r02 - r20, r10 - r01
void vitesse(Mat3 avant, Mat3 apres, float pas, float w[3])
{
    Mat3 r = produit(apres, transposee(avant));     // la rotation qui mène de avant à après
    w[0] = (r.m[2][1] - r.m[1][2]) / (2 * pas);     // composante selon X
    w[1] = (r.m[0][2] - r.m[2][0]) / (2 * pas);     // composante selon Y
    w[2] = (r.m[1][0] - r.m[0][1]) / (2 * pas);     // composante selon Z
}
```

```c
int main(void)
{
    const int ordre[3] = {1, 0, 2};         // lacet (Y), tangage (X), roulis (Z)
    // les noms affichés des trois angles
    const char *nom[3] = {"lacet", "tangage", "roulis"};
    const float pas = 0.001;                // on fait varier chaque angle de 0,001 radian
    // les deux tangages essayés : 0 et 90 degrés
    const float tangages[2] = {0 * DEG, 90 * DEG};

    for (int t = 0; t < 2; t++) {           // une série à tangage 0, une à tangage 90
        float angle[3] = {0, tangages[t], 0};  // lacet 0, tangage de la série, roulis 0
        Mat3 avant = euler(ordre, angle);   // l'orientation de départ
        printf("tangage %.0f degrés\n", tangages[t] / DEG);  // le titre de la série
        for (int i = 0; i < 3; i++) {       // on bouge un seul des trois angles
            float w[3];                     // l'axe mesuré, rempli par vitesse
            // copie des angles dont un seul va changer
            float bouge[3] = {angle[0], angle[1], angle[2]};
            bouge[i] += pas;                // l'angle numéro i augmente de 0,001 radian
            // l'axe de la petite rotation obtenue
            vitesse(avant, euler(ordre, bouge), pas, w);
            // %-8s : un texte, complété par des espaces jusqu'à 8 caractères
            printf("  %-8s fait tourner autour de (%6.3f, %6.3f, %6.3f)\n", nom[i],
                   net(w[0]), net(w[1]), net(w[2]));
        }
    }
    return 0;
}
```

```text
tangage 0 degrés
  lacet    fait tourner autour de ( 0.000,  1.000,  0.000)
  tangage  fait tourner autour de ( 1.000,  0.000,  0.000)
  roulis   fait tourner autour de ( 0.000,  0.000,  1.000)
tangage 90 degrés
  lacet    fait tourner autour de ( 0.000,  1.000,  0.000)
  tangage  fait tourner autour de ( 1.000,  0.000,  0.000)
  roulis   fait tourner autour de ( 0.000, -1.000,  0.000)
```

| Tangage | Axe du lacet | Axe du tangage | Axe du roulis | Axes distincts |
|---|---|---|---|---|
| 0 degré | (0, 1, 0) | (1, 0, 0) | (0, 0, 1) | 3 : tout mouvement est possible |
| 90 degrés | (0, 1, 0) | (1, 0, 0) | **(0, -1, 0)** | 2 : le roulis tourne autour de l'axe du lacet, en sens inverse |

Au blocage, **plus aucun angle ne fait tourner l'objet autour de Z** (l'axe qui pointe vers vous). Pour pencher la vue, le seul recours est de quitter les 90 degrés, par exemple en changeant le tangage.

### Le symptôme : la vue qui saute au zénith

Le **zénith** est le point situé à la verticale au-dessus de soi. Quand le nez d'un objet ou le regard d'une caméra passe par là, les angles qui le décrivent changent brutalement, alors que le mouvement est minuscule. Pour le voir, il faut relire le lacet à partir d'une direction : `atan2(a, b)` donne l'angle du point (b, a) vu depuis l'origine, dans la plage de -180 à 180 degrés, et sait dans quel quart de tour le point se trouve.

```c
// Lacet, en degrés, que les angles d'Euler (ordre Y, X, Z) attribuent à un nez qui pointe
// vers (x, y, z). atan2(a, b) renvoie l'angle du point (b, a) vu depuis l'origine,
// de -180 à 180 degrés (asin, l'arc sinus, rendrait le tangage : l'angle de sinus y)
float lacet_du_nez(const float nez[3])
{
    return atan2(-nez[0], -nez[2]) / DEG;
}

int main(void)
{
    const int ordre[3] = {1, 0, 2};         // lacet (Y), tangage (X), roulis (Z)
    // lacet 30 degrés, tangage 80 degrés, roulis 0
    const float angle[3] = {30 * DEG, 80 * DEG, 0};
    const float devant[3] = {0, 0, -1};     // le nez, avant toute rotation : vers -Z
    float nez[3];                           // la direction du nez après rotation

    appliquer(euler(ordre, angle), devant, nez);        // où pointe le nez ?
    // le lacet relu doit valoir 30
    printf("contrôle : lacet 30, tangage 80 -> lacet relu %.1f\n", lacet_du_nez(nez));

    // Deux nez presque verticaux, écartés de 0,02 degré l'un de l'autre :
    // l'un penche de 0,01 degré vers la droite, l'autre de 0,01 degré vers la gauche
    const float ecart = sin(0.01 * DEG);
    const float droite[3] = {ecart, 1, 0};  // nez à 0,01 degré de la verticale, côté droit
    const float gauche[3] = {-ecart, 1, 0};  // nez à 0,01 degré de la verticale, côté gauche
    // le lacet attribué au nez de droite
    printf("nez à droite : lacet %.1f\n", lacet_du_nez(droite));
    // le lacet attribué au nez de gauche
    printf("nez à gauche : lacet %.1f\n", lacet_du_nez(gauche));
    return 0;
}
```

```text
contrôle : lacet 30, tangage 80 -> lacet relu 30.0
nez à droite : lacet -90.0
nez à gauche : lacet 90.0
```

La première ligne contrôle la fonction : un lacet de 30 degrés est relu à 30,0. Les deux nez suivants ne sont écartés que de **0,02 degré** (un centième de degré de chaque côté de la verticale), mais leur lacet diffère de **180 degrés**. Dans une application, la vue pivote donc d'un demi-tour autour de la verticale d'une image à l'autre (une **image** est un affichage de la scène, voir la [boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#la-boucle-de-rendu) : il y en a en général une soixantaine par seconde). Le symptôme que l'on décrit est celui-ci : en regardant tout en haut, déplacer la souris sur le côté fait tourner la vue sur elle-même au lieu de la pencher vers ce côté (le lacet et le roulis ont le même effet, au sens près, comme la mesure précédente l'a montré), et franchir la verticale fait sauter l'affichage.

### Quel axe se bloque, selon l'ordre choisi ?

Changer l'ordre ne supprime pas le blocage : il le déplace. Le programme suivant teste les six ordres possibles des trois axes (le premier axe agit en dernier, comme dans le produit écrit), avec l'angle **du milieu** à 90, -90 puis 45 degrés. Pour chaque cas, il fait bouger le premier et le dernier angle de 10 degrés (dans le même sens, puis en sens contraires) et dit quelle combinaison des deux reste seule en jeu : leur **différence** (bouger les deux dans le même sens ne change rien) ou leur **somme** (bouger les deux en sens contraires ne change rien). Il teste aussi l'ordre Z X Z, qui répète un axe (les angles d'Euler dits « propres », par opposition aux angles « de Tait-Bryan » à trois axes différents, [détail](https://en.wikipedia.org/wiki/Euler_angles)), avec l'angle du milieu à 0, 180 puis 90 degrés. Dans le bloc, `"différence"` est un texte que la fonction renvoie, `'X'` un caractère seul, et `const int *o` désigne l'adresse d'un tableau de trois entiers.

```c
// Que devient la matrice quand on bouge le premier et le dernier angle de 10 degrés ?
// Renvoie "différence" si seule la différence des deux compte (même sens : aucun effet),
// "somme" si seule leur somme compte (sens contraires : aucun effet), "aucun" sinon
const char *blocage(const int ordre[3], float milieu)    // renvoie un texte
{
    const float base[3] = {20 * DEG, milieu, 35 * DEG};     // un point de départ quelconque
    const float meme[3] = {30 * DEG, milieu, 45 * DEG};     // les deux extrêmes +10 degrés
    const float inverse[3] = {30 * DEG, milieu, 25 * DEG};  // premier +10, dernier -10
    Mat3 m = euler(ordre, base);            // l'orientation de départ

    // même sens : la matrice est-elle inchangée ?
    if (ecart_max(m, euler(ordre, meme)) < 0.0001)
        return "différence";
    if (ecart_max(m, euler(ordre, inverse)) < 0.0001)  // sens contraires : inchangée ?
        return "somme";
    return "aucun";
}

int main(void)
{
    // Les six façons de ranger X (0), Y (1) et Z (2) dans un produit de trois rotations
    const int ordres[6][3] = {
        // chaque triplet est un ordre d'axes ({0, 1, 2} : X Y Z)
        {0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}
    };
    const char axe[3] = {'X', 'Y', 'Z'};    // 'X' : un caractère seul, affiché par %c

    for (int k = 0; k < 6; k++) {           // une ligne par ordre
        const int *o = ordres[k];           // o : l'adresse des trois axes de cet ordre
        // un ordre, puis le verdict pour chaque angle du milieu
        printf("%c %c %c : milieu à 90 : %s ; à -90 : %s ; à 45 : %s\n", axe[o[0]],
               axe[o[1]], axe[o[2]], blocage(o, 90 * DEG), blocage(o, -90 * DEG),
               blocage(o, 45 * DEG));
    }
    const int zxz[3] = {2, 0, 2};           // axe Z répété : les angles d'Euler « propres »
    // même affichage pour l'ordre Z X Z
    printf("Z X Z : milieu à 0 : %s ; à 180 : %s ; à 90 : %s\n", blocage(zxz, 0 * DEG),
           blocage(zxz, 180 * DEG), blocage(zxz, 90 * DEG));
    return 0;
}
```

```text
X Y Z : milieu à 90 : somme ; à -90 : différence ; à 45 : aucun
X Z Y : milieu à 90 : différence ; à -90 : somme ; à 45 : aucun
Y X Z : milieu à 90 : différence ; à -90 : somme ; à 45 : aucun
Y Z X : milieu à 90 : somme ; à -90 : différence ; à 45 : aucun
Z X Y : milieu à 90 : somme ; à -90 : différence ; à 45 : aucun
Z Y X : milieu à 90 : différence ; à -90 : somme ; à 45 : aucun
Z X Z : milieu à 0 : somme ; à 180 : différence ; à 90 : aucun
```

| Ordre (premier axe écrit en premier) | Angle qui bloque | Le premier et le dernier angle : seule compte... (milieu à 90 degrés) | ... (milieu à -90 degrés) |
|---|---|---|---|
| X Y Z | Y (le milieu) | leur somme | leur différence |
| X Z Y | Z | leur différence | leur somme |
| **Y X Z** (celui du chapitre) | **X, le tangage** | leur différence | leur somme |
| Y Z X | Z | leur somme | leur différence |
| Z X Y | X | leur somme | leur différence |
| Z Y X | Y | leur différence | leur somme |

Dans les six ordres à trois axes, c'est toujours **l'angle du milieu** qui bloque, à 90 degrés comme à -90 degrés ; la combinaison qui reste seule en jeu est alors l'autre (la somme devient la différence, et inversement : mesuré pour les six ordres). À 45 degrés, aucun ne se bloque. Choisir l'ordre revient donc à choisir **quel geste sera piégé** ; on ne peut pas faire disparaître le piège. L'ordre Z X Z, qui répète un axe, se bloque autrement : ses deux axes extrêmes sont confondus quand l'angle du milieu vaut 0 (seule leur somme compte) ou 180 degrés (seule leur différence compte), et il ne se bloque pas à 90 degrés. Le blocage a donc lieu au repos, et non à la verticale.

## La rotation incrémentale : garder la matrice, pas les angles

Le blocage vient de ce qu'on **stocke des angles** : trois nombres globaux, relatifs à des axes dans un ordre figé. L'idée de la **rotation incrémentale** est de ne plus en stocker. On garde l'orientation elle-même, une matrice 3×3 `R` (9 nombres), et, à chaque image, on lui multiplie une **petite rotation** `d` (un axe et un petit angle) calculée à partir du mouvement de la souris : `R = d × R`. Aucun angle global n'existe : la matrice ne se souvient pas de la façon dont elle est arrivée là, donc rien ne peut se confondre.

| | Angles d'Euler | Rotation incrémentale |
|---|---|---|
| Ce qu'on stocke | 3 angles | 1 matrice 3×3 (9 nombres) |
| Mise à jour à chaque image | `lacet += ...` puis `tangage += ...` | `R = d × R` |
| Blocage de cardan | **Oui**, quand l'angle du milieu vaut 90 degrés | **Non** |
| Erreur d'arrondi qui s'accumule | Non (matrice recalculée à chaque fois) | **Oui** : à corriger (sections suivantes) |
| Lisible et modifiable à la main | Oui | Non |

La petite rotation vient de la formule de Rodrigues, donnée au [chapitre voisin](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#tourner-autour-d-un-axe-quelconque-la-formule-de-rodrigues). Elle s'écrit ici sous une forme équivalente et plus compacte : `cos(θ) × I + sin(θ) × K + (1 - cos(θ)) × k × kᵀ`, où `k` est l'axe de longueur 1 et `θ` l'angle ; `I` est la **matrice identité** (des 1 sur la diagonale, des 0 ailleurs : elle laisse tout en place) ; `K` est la matrice `0 -kz ky / kz 0 -kx / -ky kx 0` (lignes séparées par `/`), qui multipliée par un vecteur `v` donne le produit vectoriel `k × v` (un vecteur perpendiculaire aux deux, voir [la caméra](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camera-look-at)) ; et `k × kᵀ` est la matrice dont l'élément (i, j) vaut `k_i × k_j`. La fonction `glisser` traduit un glissé de souris (bouton enfoncé, souris déplacée de `dx` pixels vers la droite et `dy` vers le bas ; un **pixel** est le plus petit point de l'écran) en une rotation autour de l'axe `(dy, dx, 0)`, d'un angle proportionnel à la longueur du glissé.

```c
// Matrice identité : des 1 sur la diagonale, des 0 ailleurs ; elle ne fait tourner de rien
Mat3 identite(void)
{
    Mat3 r = {{{0}}};                       // des zéros partout, puis des 1 sur la diagonale
    for (int i = 0; i < 3; i++)             // chaque case de la diagonale
        r.m[i][i] = 1;                      // un 1 sur la case (i, i)
    return r;
}

// Rotation de "angle" radians autour de l'axe (x, y, z), de longueur quelconque
// (formule de Rodrigues : cos * I + sin * K + (1 - cos) * k * kᵀ, K décrite dans le texte)
Mat3 rotation_axe_angle(float x, float y, float z, float angle)
{
    double n = sqrt(x * x + y * y + z * z);             // longueur de l'axe
    if (n < 1e-9)                                       // axe nul : la souris n'a pas bougé
        return identite();
    double k[3] = {x / n, y / n, z / n};                // l'axe ramené à la longueur 1
    double c = cos(angle), s = sin(angle);  // cosinus et sinus de l'angle
    // la matrice K : multiplier par elle, c'est faire k x v
    const double croix[3][3] = {{0, -k[2], k[1]}, {k[2], 0, -k[0]}, {-k[1], k[0], 0}};
    Mat3 r;                                 // la rotation, remplie case par case
    for (int i = 0; i < 3; i++)             // chaque ligne i
        for (int j = 0; j < 3; j++)         // chaque colonne j
            // les trois termes de la formule, case (i, j)
            r.m[i][j] = (i == j ? c : 0) + s * croix[i][j] + (1 - c) * k[i] * k[j];
    return r;
}

// Orientation après un glissé de souris de (dx, dy) pixels : une petite rotation autour
// de l'axe (dy, dx, 0), d'autant plus grande que le glissé est long
Mat3 glisser(Mat3 r, float dx, float dy)
{
    float angle = sqrt(dx * dx + dy * dy) * 0.005;      // 0,005 radian par pixel
    return produit(rotation_axe_angle(dy, dx, 0, angle), r);    // R = d * R
}
```

Le programme suivant fait glisser la souris à la verticale pendant 180 images d'un degré, autour de l'axe X de l'écran : le nez de l'objet monte, passe par le zénith, puis redescend de l'autre côté. Depuis le zénith (le moment où le nez pointe pile vers le haut, image 90), il mesure ensuite les axes de trois petits glissés, comme pour les angles d'Euler. `%3d` affiche un entier sur 3 caractères de large.

```c
int main(void)
{
    const float devant[3] = {0, 0, -1};     // le nez de l'objet : vers -Z au départ
    const float pas = 0.001;                // petit angle d'essai : 0,001 radian
    Mat3 r = identite();                    // orientation de départ : aucune rotation
    Mat3 zenith = r;                        // copie de l'orientation « nez vers le haut »
    float nez[3], w[3];                     // la direction du nez, et l'axe mesuré

    // Un glissé vertical de 180 images, 1 degré par image, autour de l'axe X de l'écran
    for (int image = 0; image <= 180; image++) {
        if (image % 45 == 0) {              // une ligne tous les 45 degrés
            appliquer(r, devant, nez);      // où pointe le nez maintenant ?
            // l'angle parcouru, puis la direction du nez
            printf("%3d degrés : nez = (%6.3f, %6.3f, %6.3f)\n", image,
                   net(nez[0]), net(nez[1]), net(nez[2]));
        }
        if (image == 90)                    // à mi-course, nez pile vers le haut
            zenith = r;                     // le nez vient d'arriver pile en haut
        r = produit(rotation_axe_angle(1, 0, 0, 1 * DEG), r);       // R = d * R
    }
    // Depuis le zénith, trois petits glissés : selon X, Y puis Z de l'écran
    for (int axe = 0; axe < 3; axe++) {
        float k[3] = {0, 0, 0};             // l'axe du glissé : trois zéros...
        k[axe] = 1;                         // l'axe de ce glissé
        // l'orientation après un petit glissé selon cet axe
        Mat3 apres = produit(rotation_axe_angle(k[0], k[1], k[2], pas), zenith);
        vitesse(zenith, apres, pas, w);     // l'axe de la rotation obtenue
        // le numéro du glissé, puis l'axe mesuré
        printf("glissé %d : tourne autour de (%6.3f, %6.3f, %6.3f)\n", axe + 1,
               net(w[0]), net(w[1]), net(w[2]));
    }
    return 0;
}
```

```text
  0 degrés : nez = ( 0.000,  0.000, -1.000)
 45 degrés : nez = ( 0.000,  0.707, -0.707)
 90 degrés : nez = ( 0.000,  1.000,  0.000)
135 degrés : nez = ( 0.000,  0.707,  0.707)
180 degrés : nez = ( 0.000,  0.000,  1.000)
glissé 1 : tourne autour de ( 1.000,  0.000,  0.000)
glissé 2 : tourne autour de ( 0.000,  1.000,  0.000)
glissé 3 : tourne autour de ( 0.000,  0.000,  1.000)
```

Le nez traverse le zénith **sans à-coup** : sa hauteur monte de 0 à 1 puis redescend, régulièrement. Surtout, depuis le zénith, les trois glissés tournent autour de trois axes **distincts** (X, Y et Z), là où trois angles d'Euler n'en offraient que deux. Comme les petites rotations sont exprimées dans le repère de l'écran, trois directions de rotation restent toujours disponibles, quelle que soit l'orientation de l'objet. Une souris ne fournit que deux directions (axes X et Y) ; la rotation autour de Z (le roulis) se commande autrement, par la molette ou des touches.

### `d × R` ou `R × d` ?

Le produit ne commute pas : le côté où l'on place `d` change l'axe de la rotation. Le programme suivant contrôle aussi `glisser` : un glissé de 100 pixels vers la droite doit faire partir vers la droite (+X) la face tournée vers l'écran, et un glissé vers le bas la faire descendre (-Y).

```c
int main(void)
{
    const float devant[3] = {0, 0, -1};     // le nez de l'objet : vers -Z au départ
    const float face[3] = {0, 0, 1};        // un point de la face tournée vers l'écran
    Mat3 r = rotation_axe_angle(0, 1, 0, 90 * DEG);     // objet tourné de 90° (axe Y)
    Mat3 d = rotation_axe_angle(1, 0, 0, 10 * DEG);     // glissé vertical de 10° (axe X)
    float p[3];                             // le point après transformation

    appliquer(glisser(identite(), 100, 0), face, p);    // 100 pixels vers la droite
    printf("glissé à droite : face = (%6.3f, %6.3f, %6.3f)\n",  // où est allée la face
           net(p[0]), net(p[1]), net(p[2]));
    appliquer(glisser(identite(), 0, 100), face, p);    // 100 pixels vers le bas
    printf("glissé en bas   : face = (%6.3f, %6.3f, %6.3f)\n",  // où est allée la face
           net(p[0]), net(p[1]), net(p[2]));
    appliquer(produit(d, r), devant, p);                // d * R : axe X de l'écran
    // où pointe le nez
    printf("d * R : nez = (%6.3f, %6.3f, %6.3f)\n", net(p[0]), net(p[1]), net(p[2]));
    appliquer(produit(r, d), devant, p);                // R * d : axe X de l'objet
    // où pointe le nez
    printf("R * d : nez = (%6.3f, %6.3f, %6.3f)\n", net(p[0]), net(p[1]), net(p[2]));
    return 0;
}
```

```text
glissé à droite : face = ( 0.479,  0.000,  0.878)
glissé en bas   : face = ( 0.000, -0.479,  0.878)
d * R : nez = (-1.000,  0.000,  0.000)
R * d : nez = (-0.985,  0.174,  0.000)
```

| Produit | Autour de quels axes ? | Nez après un glissé vertical de 10 degrés, objet déjà tourné de 90 degrés autour de Y |
|---|---|---|
| `d × R` (celui de `glisser`) | Les axes **de l'écran** : un glissé vers la droite tourne toujours vers la droite | (-1,000, 0,000, 0,000) : le nez est aligné sur l'axe X de l'écran, il ne bouge pas |
| `R × d` | Les axes **de l'objet** : ils ont tourné avec lui | (-0,985, 0,174, 0,000) : le nez monte |

Pour une manipulation à la souris, les axes de l'écran sont ce que l'on attend. Choisissez un côté, écrivez-le en commentaire, et ne le changez plus.

### Brancher la matrice sur le rendu

Pour une caméra, la partie rotation de la matrice de vue est l'**inverse** de l'orientation de la caméra. Pour une matrice qui est une vraie rotation, l'inverse est la transposée (fonction `transposee` plus haut) : pas besoin d'un calcul d'inverse général. C'est ce que fait déjà [`look_at`](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camera-look-at), dont les lignes sont les trois directions de la caméra. Son cas dégénéré (regarder pile vers le haut avec `up = (0, 1, 0)`) est de la même famille que le blocage de cardan : deux directions se confondent. Avec une orientation en matrice, aucune direction « haut » n'est imposée, le cas ne se présente plus.

## L'erreur d'arrondi qui s'accumule

Un `float` ne garde qu'environ 7 chiffres exacts ([détail](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), et [l'écart entre deux `float` voisins](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine#ce-que-veut-dire-flt-epsilon)) : chaque addition et chaque multiplication arrondit son résultat. Un produit de deux matrices 3×3 contient 27 multiplications et 18 additions. L'erreur par image est minuscule, de l'ordre de 10⁻⁷, mais `R = d × R` repart à chaque image du résultat de la précédente : les erreurs **s'ajoutent**.

Une vraie rotation a une matrice **orthogonale** : ses trois colonnes ont une longueur de 1 et sont deux à deux perpendiculaires (leur produit scalaire est nul) ; de façon équivalente, `R × Rᵀ` est la matrice identité. Quand l'erreur grandit, la matrice cesse d'être une rotation : une colonne plus longue que 1 **étire** l'objet dans cette direction, des colonnes qui ne sont plus à angle droit l'**inclinent** (le cisaillent).

| Mesure | Ce qu'elle calcule | Valeur pour une rotation parfaite |
|---|---|---|
| `longueur` | Le plus grand écart à 1 de la longueur d'une colonne | 0 |
| `perpendiculaire` | Le plus grand produit scalaire entre deux colonnes | 0 |
| `identite` | Le plus grand écart entre `R × Rᵀ` et la matrice identité | 0 |

La fonction `mesurer` les calcule (en `double`, pour que la mesure elle-même n'ajoute pas d'erreur).

```c
// Les trois écarts à une vraie rotation : 0 partout si la matrice est parfaite
typedef struct {
    double longueur;            // plus grand écart à 1 de la longueur d'une colonne
    double perpendiculaire;     // plus grand produit scalaire de deux colonnes
    double identite;            // plus grand écart entre a * aᵀ et la matrice identité
} Ecarts;

Ecarts mesurer(Mat3 a)
{
    Ecarts e = {0, 0, 0};                   // les trois écarts commencent à 0
    for (int j = 0; j < 3; j++) {           // chaque colonne j
        double somme = 0;                   // le carré de sa longueur
        // somme des carrés des trois éléments de la colonne
        for (int i = 0; i < 3; i++)
            somme += (double)a.m[i][j] * a.m[i][j];     // (double) : calcul en double
        // l'écart à 1 de sa longueur bat-il le record ?
        if (fabs(sqrt(somme) - 1) > e.longueur)
            e.longueur = fabs(sqrt(somme) - 1);  // oui : nouveau record
        for (int k = j + 1; k < 3; k++) {   // chaque colonne k après j : une fois par paire
            double p = 0;                   // produit scalaire des colonnes j et k
            // somme des produits terme à terme des colonnes j et k
            for (int i = 0; i < 3; i++)
                p += (double)a.m[i][j] * a.m[i][k];  // on ajoute un produit
            if (fabs(p) > e.perpendiculaire)  // ce produit scalaire bat-il le record ?
                e.perpendiculaire = fabs(p);  // oui : nouveau record
        }
    }
    for (int i = 0; i < 3; i++)             // a * aᵀ : l'élément (i, k) est le produit
        for (int k = 0; k < 3; k++) {       // scalaire de la ligne i par la ligne k de a
            double p = 0;                   // produit scalaire des lignes i et k
            for (int j = 0; j < 3; j++)     // somme des produits terme à terme
                p += (double)a.m[i][j] * a.m[k][j];  // on ajoute un produit
            if (fabs(p - (i == k)) > e.identite)    // (i == k) : 1 sur la diagonale
                e.identite = fabs(p - (i == k));  // oui : nouveau record
        }
    return e;
}
```

Le programme fait tourner une orientation pendant un million d'images, de 0,01 radian par image (environ 0,57 degré), autour d'un axe qui change lentement, et relève les trois mesures à 100, 10 000, 100 000 puis 1 000 000 d'images. `%8ld` affiche un entier de type `long` sur 8 caractères de large.

```c
int main(void)
{
    const long jalons[4] = {100, 10000, 100000, 1000000};   // nombres d'images relevés
    Mat3 r = identite();                    // l'orientation, au départ sans rotation
    long image = 0;                         // nombre d'images déjà calculées

    for (int j = 0; j < 4; j++) {           // on s'arrête à chaque jalon pour mesurer
        for (; image < jalons[j]; image++) {  // une image par tour, jusqu'au jalon
            double t = image * 0.001;       // le temps : l'axe de la souris tourne lentement
            // 0,01 radian de rotation par image, autour d'un axe qui change à chaque image
            r = produit(rotation_axe_angle(cos(t), sin(t), 0.5, 0.01), r);
        }
        Ecarts e = mesurer(r);              // les trois écarts à ce jalon
        // nombre d'images, puis les trois écarts
        printf("%8ld images : longueur %.1e, produit scalaire %.1e, a*aT %.1e\n",
               image, e.longueur, e.perpendiculaire, e.identite);
    }
    return 0;
}
```

```text
     100 images : longueur 4.0e-07, produit scalaire 3.2e-07, a*aT 8.3e-07
   10000 images : longueur 1.9e-05, produit scalaire 8.3e-06, a*aT 3.4e-05
  100000 images : longueur 2.0e-04, produit scalaire 9.0e-05, a*aT 3.4e-04
 1000000 images : longueur 2.0e-03, produit scalaire 8.3e-04, a*aT 3.1e-03
```

Le même programme, avec `float` remplacé par `double` partout, donne des écarts de l'ordre de 10⁻¹¹ au bout d'un million d'images ; ce second essai montre que la précision du type est bien la cause.

| Images | `longueur` (`float`) | `perpendiculaire` (`float`) | `identite` (`float`) | `identite` (`double`) |
|---|---|---|---|---|
| 100 | 4,0 × 10⁻⁷ | 3,2 × 10⁻⁷ | 8,3 × 10⁻⁷ | 2,2 × 10⁻¹⁵ |
| 10 000 | 1,9 × 10⁻⁵ | 8,3 × 10⁻⁶ | 3,4 × 10⁻⁵ | 2,5 × 10⁻¹³ |
| 100 000 | 2,0 × 10⁻⁴ | 9,0 × 10⁻⁵ | 3,4 × 10⁻⁴ | 2,5 × 10⁻¹² |
| 1 000 000 | 2,0 × 10⁻³ | 8,3 × 10⁻⁴ | 3,1 × 10⁻³ | 2,5 × 10⁻¹¹ |

Lecture : de 10 000 à 1 000 000 d'images, l'écart est à peu près **multiplié par 10 chaque fois que le nombre d'images l'est** : il croît régulièrement et ne se stabilise jamais. Après un million d'images (environ quatre heures et demie à 60 images par seconde), la longueur d'une colonne s'écarte de 1 de 0,002 : un segment de 1 mètre, une fois transformé, mesure 2 millimètres de plus ou de moins, et l'écart continue de grandir. Passer en `double` ne règle pas le problème, il le **repousse** : l'écart est environ cent millions de fois plus petit (10⁸), et il croît toujours de la même façon. Ces valeurs précises dépendent de la vitesse de rotation et du mouvement ; ce qu'il faut retenir est l'ordre de grandeur et la croissance régulière.

## La ré-orthonormalisation : remettre la matrice d'aplomb

**Ré-orthonormaliser** une matrice, c'est la corriger légèrement pour qu'elle redevienne orthogonale : colonnes de longueur 1 et perpendiculaires. Comme l'erreur est d'environ 10⁻⁷ par image, la correction est minuscule et ne se voit pas à l'écran. Plusieurs méthodes existent :

| Méthode | Principe | Résultat mesuré (voir plus bas) |
|---|---|---|
| Normaliser chaque colonne | Diviser chaque colonne par sa longueur | Les longueurs sont corrigées, mais pas l'angle entre colonnes : **insuffisant** |
| **Gram-Schmidt sur deux colonnes, puis produit vectoriel** (choisie) | Fixer la colonne 0, rendre la colonne 1 perpendiculaire à elle, **fabriquer** la colonne 2 par un produit vectoriel | Les trois écarts redescendent à quelques 10⁻⁶ (N = 100) |
| Gram-Schmidt sur trois colonnes | Même procédé, appliqué aussi à la colonne 2 | Non mesuré ici : un calcul de plus pour une colonne que le produit vectoriel détermine déjà entièrement |

Le **procédé de Gram-Schmidt** ([détail](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)) traite les colonnes une à une : chaque nouvelle colonne perd d'abord la part qui va dans la direction des colonnes déjà fixées, puis est remise à la longueur 1. Cette part se calcule avec le produit scalaire : si `c0` a une longueur de 1, `c1 · c0` en est la mesure. Exemple chiffré : `c0 = (1, 0, 0)` et `c1 = (1, 2, 0)` ont pour produit scalaire 1 (1 × 1 + 0 × 2 + 0 × 0) ; `c1 - 1 × c0 = (0, 2, 0)`, qui est perpendiculaire à `c0` ; remis à la longueur 1 (on le divise par 2), il devient `(0, 1, 0)`.

La méthode choisie est la plus simple à écrire et à vérifier : deux normalisations, un produit scalaire, un produit vectoriel. Elle donne deux garanties : la colonne 2 est **exactement** perpendiculaire aux deux autres et de longueur 1 (le produit vectoriel de deux vecteurs de longueur 1 perpendiculaires entre eux en est un troisième), et elle est du bon côté : le résultat est une vraie rotation et non un **miroir** (qui échangerait la gauche et la droite de l'objet, ce qu'aucune rotation ne fait). Le prix : la colonne 0 garde sa direction et les deux autres s'ajustent autour d'elle ; la correction étant de l'ordre de l'erreur (10⁻⁶), ce léger privilège est sans conséquence.

```c
// Divise le vecteur v par sa longueur : sa direction reste la même, sa longueur devient 1
void normaliser(double v[3])
{
    double n = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);   // sa longueur (sa norme)
    if (n > 0)                              // un vecteur nul ne peut pas être normalisé
        for (int i = 0; i < 3; i++)         // chaque composante de v
            v[i] /= n;                      // divisée par la longueur
}

// Redresse en trois étapes la matrice dont a est l'adresse : « Mat3 *a » est un pointeur,
// et a->m désigne le tableau de cette matrice, que la fonction modifie sur place
void redresser(Mat3 *a)
{
    double c0[3], c1[3], c2[3];             // les trois colonnes
    for (int i = 0; i < 3; i++) {           // chaque ligne i
        c0[i] = a->m[i][0];                 // on recopie les colonnes 0 et 1
        c1[i] = a->m[i][1];                 // colonne 1
    }
    normaliser(c0);                         // étape 1 : la colonne 0 garde sa direction
    double d = c1[0] * c0[0] + c1[1] * c0[1] + c1[2] * c0[2];   // part de c1 le long de c0
    for (int i = 0; i < 3; i++)             // chaque composante
        c1[i] -= d * c0[i];                 // étape 2 : on retire cette part, c1 devient
    normaliser(c1);                         // perpendiculaire à c0, puis de longueur 1
    c2[0] = c0[1] * c1[2] - c0[2] * c1[1];  // étape 3 : la colonne 2 est le produit
    c2[1] = c0[2] * c1[0] - c0[0] * c1[2];  // vectoriel des deux autres : perpendiculaire
    c2[2] = c0[0] * c1[1] - c0[1] * c1[0];  // aux deux et de longueur 1, sans calcul de plus
    for (int i = 0; i < 3; i++) {           // chaque ligne i
        a->m[i][0] = c0[i];                 // on réécrit les trois colonnes
        a->m[i][1] = c1[i];                 // colonne 1
        a->m[i][2] = c2[i];                 // colonne 2
    }
}

// Variante insuffisante, pour comparer : chaque colonne remise à la longueur 1, rien de plus
void normaliser_colonnes(Mat3 *a)
{
    for (int j = 0; j < 3; j++) {           // chaque colonne j
        double c[3] = {a->m[0][j], a->m[1][j], a->m[2][j]};  // la colonne j, recopiée
        normaliser(c);                      // ramenée à la longueur 1
        for (int i = 0; i < 3; i++)         // chaque ligne i
            a->m[i][j] = c[i];              // et réécrite dans la matrice
    }
}
```

Le programme suivant rejoue le million d'images du programme précédent, en corrigeant la matrice toutes les `N` images (la période `periode` du code), et relève, pour chacune des trois mesures, **la pire valeur rencontrée** pendant tout l'essai (une mesure à chaque image). Il compare l'absence de correction, la simple normalisation des colonnes, et `redresser` à six rythmes. `fmax` renvoie le plus grand de deux nombres.

```c
// Un million d'images ; mode 0 : aucune correction, 1 : normaliser_colonnes, 2 : redresser.
// La correction a lieu toutes les "periode" images. Renvoie, pour chacun des trois écarts,
// la pire valeur rencontrée pendant toute l'expérience
Ecarts essai(int mode, long periode)
{
    Mat3 r = identite();                    // l'orientation de départ
    Ecarts pire = {0, 0, 0};                // les pires valeurs, à 0 au départ

    for (long image = 1; image <= 1000000; image++) {  // un tour par image
        double t = image * 0.001;           // même mouvement qu'à la section précédente
        // la rotation de cette image
        r = produit(rotation_axe_angle(cos(t), sin(t), 0.5, 0.01), r);
        if (mode == 1 && image % periode == 0)  // mode 1 : toutes les "periode" images
            normaliser_colonnes(&r);        // &r : l'adresse de r
        if (mode == 2 && image % periode == 0)  // mode 2 : toutes les "periode" images
            redresser(&r);                  // on redresse la matrice
        Ecarts e = mesurer(r);              // on mesure à chaque image ; fmax : le plus grand
        // on garde le plus grand écart rencontré
        pire.longueur = fmax(pire.longueur, e.longueur);
        pire.perpendiculaire = fmax(pire.perpendiculaire, e.perpendiculaire);  // idem
        pire.identite = fmax(pire.identite, e.identite);  // idem
    }
    return pire;
}

int main(void)
{
    // les rythmes de correction essayés
    const long periodes[6] = {1, 10, 100, 1000, 10000, 100000};
    Ecarts e = essai(0, 1);                 // la période ne sert à rien sans correction
    // les trois pires écarts, sans correction
    printf("aucune correction : %.1e %.1e %.1e\n", e.longueur, e.perpendiculaire, e.identite);
    e = essai(1, 100);                      // normaliser les colonnes, toutes les 100 images
    // les trois pires écarts
    printf("normaliser, N=100 : %.1e %.1e %.1e\n", e.longueur, e.perpendiculaire, e.identite);
    for (int k = 0; k < 6; k++) {           // la même correction à des rythmes différents
        e = essai(2, periodes[k]);          // redresser toutes les periodes[k] images
        // la période, puis les trois pires écarts
        printf("redresser, N=%-6ld : %.1e %.1e %.1e\n", periodes[k], e.longueur,
               e.perpendiculaire, e.identite);
    }
    return 0;
}
```

```text
aucune correction : 2.0e-03 8.8e-04 4.0e-03
normaliser, N=100 : 1.3e-06 9.3e-04 9.3e-04
redresser, N=1      : 5.1e-08 8.5e-08 1.0e-07
redresser, N=10     : 4.7e-07 5.4e-07 1.0e-06
redresser, N=100    : 1.5e-06 1.7e-06 2.7e-06
redresser, N=1000   : 4.8e-06 4.2e-06 8.5e-06
redresser, N=10000  : 2.6e-05 1.5e-05 5.1e-05
redresser, N=100000 : 2.2e-04 1.1e-04 4.3e-04
```

Les trois colonnes de chiffres sont, dans l'ordre : `longueur`, `perpendiculaire`, `identite`.

| Correction | `longueur` | `perpendiculaire` | `identite` |
|---|---|---|---|
| Aucune | 2,0 × 10⁻³ | 8,8 × 10⁻⁴ | 4,0 × 10⁻³ |
| Normaliser les colonnes, N = 100 | 1,3 × 10⁻⁶ | **9,3 × 10⁻⁴** | **9,3 × 10⁻⁴** |
| `redresser`, N = 1 | 5,1 × 10⁻⁸ | 8,5 × 10⁻⁸ | 1,0 × 10⁻⁷ |
| `redresser`, N = 10 | 4,7 × 10⁻⁷ | 5,4 × 10⁻⁷ | 1,0 × 10⁻⁶ |
| `redresser`, N = 100 | 1,5 × 10⁻⁶ | 1,7 × 10⁻⁶ | 2,7 × 10⁻⁶ |
| `redresser`, N = 1 000 | 4,8 × 10⁻⁶ | 4,2 × 10⁻⁶ | 8,5 × 10⁻⁶ |
| `redresser`, N = 10 000 | 2,6 × 10⁻⁵ | 1,5 × 10⁻⁵ | 5,1 × 10⁻⁵ |
| `redresser`, N = 100 000 | 2,2 × 10⁻⁴ | 1,1 × 10⁻⁴ | 4,3 × 10⁻⁴ |

Trois enseignements :

- **Normaliser les colonnes seules ne suffit pas** : les longueurs sont corrigées (10⁻⁶), mais les colonnes restent inclinées l'une sur l'autre (`perpendiculaire` 9,3 × 10⁻⁴, pas mieux que sans correction).
- **Corriger à chaque image** (N = 1) donne le meilleur résultat, de l'ordre de 10⁻⁷ : la limite du `float`, car la correction arrondit elle aussi.
- **Corriger plus rarement dégrade lentement** : le pire écart passe de 10⁻⁷ (N = 1) à 8,5 × 10⁻⁶ (N = 1 000) puis 4,3 × 10⁻⁴ (N = 100 000), soit à peu près ce que l'on mesurait sans correction après 100 000 images.

Pour choisir `N`, fixez l'écart maximal acceptable. Un écart de 10⁻⁵ sur un objet large de 1 000 pixels représente 0,01 pixel : invisible. À cette cadence de rotation, **N = 1 000** respecte cette limite (8,5 × 10⁻⁶), soit une correction toutes les 17 secondes environ à 60 images par seconde. Le coût d'un appel de `redresser` se compte : 2 racines carrées, 6 divisions et 18 multiplications, contre 27 multiplications pour un produit de deux matrices. Corriger à chaque image reste donc envisageable pour quelques objets, et corriger toutes les centaines d'images ne coûte presque rien. Un mouvement plus rapide ou une scène plus longue demandent de rejouer la mesure.

## Les variantes : quaternions et angles limités

### Les quaternions

Un **quaternion** représente une rotation avec **4 nombres** au lieu de 9. Comme les angles d'Euler, il est compact ; comme la matrice, il n'a **pas de blocage de cardan**. Composer deux rotations revient à multiplier deux quaternions, et il se redresse simplement en le divisant par sa norme (sa longueur) : 4 nombres à normaliser, au lieu de redresser trois colonnes. Le chapitre voisin le signale en [alternative](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#faire-tourner-un-objet-la-rotation-accumulee) ; aucun chapitre du site ne le développe : la source de référence est la page sur les [quaternions et les rotations dans l'espace](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation). Pour un projet qui n'a besoin que de tourner un objet à la souris et de le dessiner, la matrice redressée de ce chapitre suffit et reste facile à brancher sur [OpenGL](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl).

### Quand garder des angles quand même

Le blocage n'est un problème que si l'orientation peut atteindre la configuration piégée. Si l'application n'a pas de roulis, ou empêche d'atteindre la verticale, deux angles suffisent :

| Situation | Choix | Pourquoi |
|---|---|---|
| Caméra à la première personne (un personnage marche, l'horizon reste horizontal) | Deux angles (lacet, tangage), **tangage limité à moins de 90 degrés** | Sans roulis, rien à bloquer ; la limite empêche de passer par le zénith |
| Caméra orbitale (elle tourne autour d'un objet, comme un satellite) | Deux angles (autour de l'objet, hauteur au-dessus), **hauteur limitée** | Même raison |
| Caméra de vol libre (elle peut se retourner, comme celle d'un vaisseau), objet qu'on fait tourner dans tous les sens | Matrice incrémentale redressée, ou quaternion | Aucune direction n'est interdite |
| Affichage ou saisie par l'utilisateur (curseurs, fichier de scène lisible) | Angles d'Euler **pour l'interface seulement** | Lisibles ; ne pas les relire depuis la matrice près du zénith (la vue saute de 180 degrés, mesuré plus haut) |
| Enregistrer une orientation dans un fichier | La matrice (9 nombres) ou le quaternion | Les angles ne sont pas uniques au voisinage du blocage |

Le bloc suivant limite le tangage d'une caméra à 89 degrés. `c->lacet` désigne le champ `lacet` de la caméra `c` (un pointeur : l'adresse de la caméra, que la fonction modifie sur place). `dx` et `dy` sont les déplacements de la souris, en pixels, depuis l'image précédente ; dans un vrai programme, on les obtient avec les événements de souris de [GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu).

```c
// Une caméra décrite par deux angles seulement : sans roulis, il n'y a rien à bloquer
typedef struct { float lacet, tangage; } Camera;

const float LIMITE = 1.553343;              // 89 degrés en radians : jamais tout à fait 90

// dx et dy : déplacement de la souris depuis l'image précédente, en pixels
void viser(Camera *c, float dx, float dy)      // c->lacet : le champ lacet de la caméra c
{
    c->lacet += dx * 0.002;                 // 0,002 radian de lacet par pixel vers la droite
    c->tangage -= dy * 0.002;               // souris vers le haut (dy < 0) : regard plus haut
    if (c->tangage > LIMITE)                // le tangage reste entre -89 et +89 degrés
        c->tangage = LIMITE;                // plafonné à +89 degrés
    if (c->tangage < -LIMITE)               // trop bas ?
        c->tangage = -LIMITE;               // plancher à -89 degrés
}

int main(void)
{
    Camera c = {0, 0};                      // regarde droit devant
    for (int i = 0; i < 3; i++)             // trois grands glissés vers le haut
        viser(&c, 0, -1000);                // 1000 pixels vers le haut (dy est négatif)
    // le tangage final, en degrés
    printf("tangage après 3000 pixels vers le haut : %.1f degrés\n", c.tangage / DEG);
    viser(&c, 0, 5000);                     // puis un très grand glissé vers le bas
    printf("tangage après 5000 pixels vers le bas : %.1f degrés\n", c.tangage / DEG);  // idem
    return 0;
}
```

```text
tangage après 3000 pixels vers le haut : 89.0 degrés
tangage après 5000 pixels vers le bas : -89.0 degrés
```

Quelle que soit la longueur du glissé (3 000 pixels vers le haut, puis 5 000 vers le bas), le tangage reste entre -89 et +89 degrés : la vue ne peut plus atteindre la verticale.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Croire que le blocage ne gêne qu'à 90 degrés exacts | Près de la verticale, un mouvement minuscule demande un grand changement de lacet : 0,02 degré d'écart donne 180 degrés de lacet de différence (mesuré) |
| Stocker l'orientation en angles pour un objet qui tourne librement | Un angle du milieu à 90 degrés perd une rotation : le mouvement demandé n'a plus d'effet |
| Changer l'ordre des rotations pour éviter le blocage | Changer d'ordre déplace le blocage, il ne le supprime pas (tableau des six ordres) |
| Relire les angles depuis la matrice, puis les réinjecter | Au zénith, le lacet saute de 180 degrés pour 0,02 degré de mouvement |
| Ne jamais redresser la matrice | L'écart grandit à chaque image (3,1 × 10⁻³ après un million d'images) : l'objet s'étire et s'incline |
| Normaliser seulement les colonnes | Les longueurs sont corrigées, pas l'angle entre colonnes (9,3 × 10⁻⁴ mesuré) |
| Copier la colonne 2 au lieu de la recalculer par le produit vectoriel | Elle garde son erreur et rien ne garantit qu'on obtienne une rotation plutôt qu'un miroir |
| Passer en `double` en croyant supprimer la dérive | Le `double` rend l'erreur environ cent millions de fois plus petite, mais elle croît toujours régulièrement |
| Normaliser un axe nul | Quand la souris n'a pas bougé, l'axe `(dy, dx, 0)` est nul : la division par sa longueur (0) donne **`NaN`** (*Not a Number*, le résultat d'un calcul impossible comme `0 / 0`, [détail](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camera-look-at)) qui contamine toute la matrice. `rotation_axe_angle` renvoie l'identité dans ce cas |
| Mélanger `d × R` et `R × d` | Les axes de rotation passent de l'écran à l'objet : la souris semble tourner dans le mauvais sens |
| Tourner d'un angle fixe par image | La vitesse dépend alors de la cadence de la machine : utiliser une vitesse par seconde multipliée par [le delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-delta-time-une-vitesse-independante-de-la-machine) |
| Limiter le tangage à exactement 90 degrés | Le zénith reste atteignable : prendre une marge (89 degrés) |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Stocker l'orientation d'un objet qui tourne librement sous forme de matrice (ou de quaternion), pas d'angles | Aucun angle global : le blocage n'existe plus |
| Garder deux angles et limiter le tangage pour une caméra à la première personne ou orbitale | Le plus simple, et sans blocage possible |
| Redresser la matrice avec Gram-Schmidt sur deux colonnes plus un produit vectoriel, toutes les `N` images | Écart ramené d'environ 10⁻³ à 10⁻⁵ ou moins ; la colonne 2 est exacte et le résultat reste une rotation |
| Choisir `N` en mesurant (`mesurer`, `essai`) selon l'écart acceptable | `N = 1 000` donne 8,5 × 10⁻⁶ à 0,01 radian par image ; un mouvement plus rapide demande une nouvelle mesure |
| Choisir un côté pour la composition (`d × R`, axes de l'écran, pour la souris) et le noter en commentaire | Évite des rotations qui partent du mauvais côté |
| Traiter l'axe nul (souris immobile) avant de normaliser | Pas de `NaN` dans la matrice |
| Tester les cas limites : tangage de 90 degrés, glissé nul, un million d'images | Ce sont eux qui révèlent le blocage et la dérive |
| Enregistrer la matrice ou le quaternion, n'afficher les angles que pour l'interface | Les angles ne sont pas uniques près du blocage |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Les angles d'Euler (tangage, lacet, roulis) décrivent une orientation par trois rotations dans un ordre figé, et l'ordre compte. Quand l'angle du milieu vaut 90 degrés, les deux autres tournent autour du même axe : c'est le blocage de cardan, une rotation est perdue (mesuré : trois jeux d'angles donnent la même matrice, et au zénith 0,02 degré de mouvement fait sauter le lacet de 180 degrés). La parade est la rotation incrémentale : stocker la matrice 3×3 et lui multiplier à chaque image une petite rotation, `R = d × R`, sans angle global donc sans blocage. Sa contrepartie est l'erreur d'arrondi, qui s'accumule (3,1 × 10⁻³ après un million d'images en `float`) : on la corrige en remettant les colonnes à la longueur 1 et perpendiculaires (Gram-Schmidt sur deux colonnes, produit vectoriel pour la troisième), par exemple toutes les 1 000 images (8,5 × 10⁻⁶). Un quaternion, ou deux angles limités à moins de 90 degrés pour une caméra à la première personne, sont les variantes. |
| **Outils utilisables** | `cos`, `sin`, `sqrt`, `fabs`, `fmax`, `atan2` de la [bibliothèque mathématique du C](https://en.cppreference.com/w/c/numeric/math) ; [la formule de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#tourner-autour-d-un-axe-quelconque-la-formule-de-rodrigues) ; [le procédé de Gram-Schmidt](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process) ; [les quaternions](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation) ; [les angles d'Euler](https://en.wikipedia.org/wiki/Euler_angles) ; [le blocage de cardan](https://en.wikipedia.org/wiki/Gimbal_lock). |
| **Pièges à éviter** | Stocker des angles pour un objet libre ; croire que changer l'ordre supprime le blocage ; relire des angles depuis la matrice près du zénith ; ne jamais redresser la matrice ; ne normaliser que les colonnes ; normaliser un axe nul (`NaN`) ; mélanger `d × R` et `R × d` ; un angle fixe par image au lieu d'une vitesse par seconde ; un tangage limité à exactement 90 degrés. |
| **Bonnes pratiques** | Matrice (ou quaternion) pour la rotation libre, deux angles limités pour la caméra au sol ou orbitale ; redresser toutes les `N` images avec `N` choisi par la mesure ; composer du côté de l'écran pour la souris ; traiter l'axe nul ; tester tangage 90 degrés, glissé nul et très longues sessions ; enregistrer la matrice, afficher les angles seulement à l'interface. |
