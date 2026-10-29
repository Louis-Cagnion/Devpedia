---
order: 13
---

# Tri puis balayage (sweep and prune) : ne comparer que les voisins plausibles

Un **segment** est la portion de droite comprise entre deux points du plan, appelés ses **extrémités** (ou ses bouts). Un **plan** est une surface plate où chaque point se repère par deux nombres, ses **coordonnées** : `x` (la position horizontale) et `y` (la position verticale). Deux segments **se croisent** quand ils ont au moins un point en commun. Savoir lesquels se croisent est un besoin courant : les côtés d'un polygone (une figure fermée formée de segments mis bout à bout, dont les segments s'appellent aussi **arêtes**) ne doivent pas se traverser, deux trajectoires de véhicules ne doivent pas se couper, deux routes d'une carte se rejoignent peut-être en un carrefour.

La méthode évidente compare tous les segments deux à deux, et devient inutilisable dès que leur nombre grandit. La technique du **tri puis balayage** (en anglais *sweep and prune*, « balayer et élaguer ») évite l'immense majorité de ces comparaisons : elle trie les segments, puis ne compare que ceux dont les **boîtes englobantes** (des rectangles qui les entourent, définis plus bas) se recouvrent. Ce chapitre construit la technique pas à pas, la démontre, la mesure, et montre dans quel cas elle ne sert à rien.

Il suppose connus [la complexité et la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o), [le tri par comparaison](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), [les vecteurs](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (une liste de nombres traitée comme une seule entité, par exemple les deux coordonnées d'un point), et, pour les programmes en C, [les variables](/?c=langages&s=c&p=variables), [les structures](/?c=langages&s=c&p=variables#les-structures-struct), [les pointeurs](/?c=langages&s=c&p=pointeurs) et [la gestion de la mémoire](/?c=langages&s=c&p=memoire). Tous les programmes ont été compilés avec `gcc` (le compilateur du projet GNU, voir [la compilation](/?c=langages&s=c&p=compilation)) et exécutés ; les sorties affichées sont les sorties réelles.

## Le problème : tester toutes les paires

Pour `n` segments, la version naïve teste chaque **paire** (deux segments distincts, l'ordre ne comptant pas : la paire A-B est la même que B-A). Chacun des `n` segments a `n - 1` partenaires, mais chaque paire serait alors comptée deux fois, d'où `n × (n - 1) / 2` paires. Le coût est donc en `O(n²)` (« en n au carré » : multiplier `n` par 10 multiplie le travail par 100, voir [la complexité](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

| Nombre de segments `n` | Nombre de paires `n(n-1)/2` | Par rapport à la ligne précédente |
|---|---|---|
| 100 | 4 950 | : |
| 1 000 | 499 500 | environ 100 fois plus |
| 10 000 | 49 995 000 | environ 100 fois plus |
| 100 000 | 4 999 950 000 | environ 100 fois plus |

Cinq milliards de tests pour 100 000 segments : et si peu de segments se croisent réellement, presque tout ce travail est gaspillé. L'idée de la technique est d'écarter à moindre frais les paires qui ne peuvent évidemment pas se croiser, et de ne payer le test exact que pour les autres.

## Le test exact : deux segments se croisent-ils ?

Avant de l'éviter, il faut le connaître : c'est le « test coûteux » dont la technique cherche à réduire le nombre d'appels. Il repose sur une opération simple, le produit vectoriel en deux dimensions.

Un **vecteur** va d'un point à un autre : celui de `o` vers `p` a pour composantes `(p.x - o.x, p.y - o.y)`. Le **produit vectoriel** (*cross product*) de deux vecteurs `u = (ux, uy)` et `v = (vx, vy)` du plan est le nombre `ux × vy - uy × vx`. Son signe dit de quel côté tourne `v` par rapport à `u`. Pour trois points `o`, `p`, `q`, on l'appelle l'**orientation** du triplet : c'est le produit vectoriel du vecteur de `o` vers `p` et du vecteur de `o` vers `q`.

| Signe du produit vectoriel | Position de `q` quand on va de `o` vers `p` | Exemple avec `o = (0, 0)`, `p = (4, 0)` |
|---|---|---|
| Positif | À gauche (virage à gauche) | `q = (2, 3)` : `4 × 3 - 0 × 2 = 12` |
| Négatif | À droite (virage à droite) | `q = (2, -3)` : `4 × (-3) - 0 × 2 = -12` |
| Nul | Sur la même droite que `o` et `p` (les trois points sont **alignés**, on dit aussi **colinéaires**) | `q = (8, 0)` : `4 × 0 - 0 × 8 = 0` |

> **Note :** « gauche » et « droite » supposent un axe `y` qui monte. Sur un écran, `y` descend et les côtés s'échangent, ce qui est sans conséquence ici : le test ne compare que des signes entre eux.

Le raisonnement du test : le segment `s` (de `s.a` à `s.b`) et le segment `t` (de `t.a` à `t.b`) se croisent franchement quand les deux bouts de `t` sont de part et d'autre de la droite de `s` (orientations de signes opposés) **et** les deux bouts de `s` de part et d'autre de la droite de `t`.

```text
            t.a      orientation(s.a, s.b, t.a) = +1  (à gauche de s)
              \
  s.a ---------\---------> s.b
                \
                 t.b     orientation(s.a, s.b, t.b) = -1  (à droite de s)
```

Cela ne suffit pas quand une orientation vaut 0 (un bout posé exactement sur la droite de l'autre segment) : il faut décider ce que l'on appelle « croisement ». **Décision de ce chapitre : deux segments se croisent s'ils ont au moins un point commun**, ce qui inclut le croisement franc, le contact par une extrémité, et le chevauchement de deux segments alignés. Un bout aligné avec l'autre segment ne compte que s'il se trouve réellement **entre** ses extrémités.

| Situation | Orientations | Verdict |
|---|---|---|
| Croisement franc (en croix) | Signes opposés des deux côtés | Se croisent |
| Un bout de `t` posé au milieu de `s` | Une orientation à 0, bout entre `s.a` et `s.b` | Se croisent |
| Deux bouts qui se touchent | Une orientation à 0, bout entre les extrémités | Se croisent |
| Alignés, qui se chevauchent | Toutes à 0, un bout dans l'autre segment | Se croisent |
| Alignés, séparés | Toutes à 0, aucun bout dans l'autre segment | Disjoints (sans point commun) |
| Parallèles | Mêmes signes | Disjoints |
| Droites sécantes, segments trop courts | Les bouts de `t` encadrent `s`, mais pas l'inverse | Disjoints |
| Segment réduit à un point | Orientations toujours à 0 | Se croisent si le point est sur l'autre segment |

Le code correspondant. Les éléments du langage C utilisés :

| Élément | Rôle |
|---|---|
| `typedef struct { ... } Point;` | Crée un type `Point` qui regroupe plusieurs champs sous un seul nom (voir [les structures](/?c=langages&s=c&p=variables#les-structures-struct)) |
| `long long` | Entier signé d'au moins 64 bits : les produits de coordonnées ne débordent pas (voir [les entiers et les débordements](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)) |
| `static` | La fonction n'est visible que dans ce fichier |
| `const Segment *s` | Pointeur vers un segment qu'on promet de ne pas modifier ; `s->a` lit son champ `a` (voir [les pointeurs](/?c=langages&s=c&p=pointeurs)) |
| `(produit > 0) - (produit < 0)` | Une comparaison vaut 1 si elle est vraie et 0 sinon : la différence donne 1, -1 ou 0, le signe du nombre |
| `condition ? a : b` | Vaut `a` si la condition est vraie, `b` sinon |

```c
#include <stdio.h>

typedef struct {
    long long x, y;                         // les deux coordonnées d'un point
} Point;

typedef struct {
    Point a, b;                             // les deux extrémités du segment
} Segment;

static long long minimum(long long u, long long v)
{
    return u < v ? u : v;                   // le plus petit des deux
}

static long long maximum(long long u, long long v)
{
    return u > v ? u : v;                   // le plus grand des deux
}

// Signe du produit vectoriel de (o vers p) et (o vers q) : 1, -1 ou 0.
static int orientation(Point o, Point p, Point q)
{
    long long vers_p_x = p.x - o.x;         // composante x du vecteur o vers p
    long long vers_p_y = p.y - o.y;         // composante y du vecteur o vers p
    long long vers_q_x = q.x - o.x;         // composante x du vecteur o vers q
    long long vers_q_y = q.y - o.y;         // composante y du vecteur o vers q
    long long produit = vers_p_x * vers_q_y - vers_p_y * vers_q_x;   // le produit vectoriel

    return (produit > 0) - (produit < 0);   // 1 si positif, -1 si négatif, 0 si nul
}

// Vrai si p, déjà connu aligné avec a et b, se trouve entre eux.
static int entre(Point a, Point b, Point p)
{
    return minimum(a.x, b.x) <= p.x && p.x <= maximum(a.x, b.x)   // dans l'intervalle en x
        && minimum(a.y, b.y) <= p.y && p.y <= maximum(a.y, b.y);   // et dans celui en y
}

// Vrai si les deux segments ont au moins un point en commun.
static int segments_se_croisent(const Segment *s, const Segment *t)
{
    int o1 = orientation(s->a, s->b, t->a);   // de quel côté de (s) est le bout a de t
    int o2 = orientation(s->a, s->b, t->b);   // de quel côté de (s) est le bout b de t
    int o3 = orientation(t->a, t->b, s->a);   // de quel côté de (t) est le bout a de s
    int o4 = orientation(t->a, t->b, s->b);   // de quel côté de (t) est le bout b de s

    if (o1 != o2 && o3 != o4)               // chaque segment sépare les bouts de l'autre
        return 1;                           // croisement franc, ou contact par un bout
    if (o1 == 0 && entre(s->a, s->b, t->a)) // le bout a de t est posé sur s
        return 1;
    if (o2 == 0 && entre(s->a, s->b, t->b)) // le bout b de t est posé sur s
        return 1;
    if (o3 == 0 && entre(t->a, t->b, s->a)) // le bout a de s est posé sur t
        return 1;
    if (o4 == 0 && entre(t->a, t->b, s->b)) // le bout b de s est posé sur t
        return 1;
    return 0;                               // aucun point commun
}
```

Un `main` d'essai (à placer à la suite) passe en revue les situations du tableau :

```c
typedef struct {
    const char *nom;                        // description du cas, pour l'affichage
    Segment s, t;                           // les deux segments à comparer
} Cas;

int main(void)
{
    Cas cas[] = {                           // un cas par situation à distinguer
        {"en croix", {{0, 0}, {4, 4}}, {{0, 4}, {4, 0}}},
        {"bout posé sur l'autre", {{0, 0}, {4, 0}}, {{2, 0}, {2, 3}}},
        {"deux bouts qui se touchent", {{0, 0}, {2, 2}}, {{2, 2}, {5, 0}}},
        {"alignés qui se chevauchent", {{0, 0}, {4, 0}}, {{3, 0}, {7, 0}}},
        {"alignés mais séparés", {{0, 0}, {2, 0}}, {{3, 0}, {7, 0}}},
        {"parallèles", {{0, 0}, {4, 0}}, {{0, 1}, {4, 1}}},
        {"droites sécantes, segments non", {{0, 0}, {2, 0}}, {{3, -1}, {3, 5}}},
        {"un point sur un segment", {{1, 1}, {1, 1}}, {{0, 0}, {2, 2}}},
        {"un point hors du segment", {{1, 2}, {1, 2}}, {{0, 0}, {2, 2}}},
    };

    for (size_t i = 0; i < sizeof cas / sizeof cas[0]; i++)   // parcourt les cas
        printf("%-12s %s\n",                // résultat sur 12 colonnes, puis le nom du cas
               segments_se_croisent(&cas[i].s, &cas[i].t) ? "se croisent" : "disjoints",
               cas[i].nom);
    return 0;
}
```

```text
se croisent  en croix
se croisent  bout posé sur l'autre
se croisent  deux bouts qui se touchent
se croisent  alignés qui se chevauchent
disjoints    alignés mais séparés
disjoints    parallèles
disjoints    droites sécantes, segments non
se croisent  un point sur un segment
disjoints    un point hors du segment
```

Les neuf cas donnent le verdict annoncé par le tableau. Ce test a un coût non négligeable : quatre calculs d'orientation (sept opérations arithmétiques chacun), puis des comparaisons. C'est ce qu'on veut appeler le moins possible.

## La boîte englobante : un test bon marché

Une **boîte englobante alignée sur les axes** (en anglais *axis-aligned bounding box*, abrégé **AABB**) est le plus petit rectangle, aux côtés parallèles aux axes `x` et `y`, qui contient entièrement une forme. Pour un segment, quatre nombres suffisent : `xmin` et `xmax` (le plus petit et le plus grand `x` de ses deux bouts), `ymin` et `ymax` (idem pour `y`). Chacun des deux intervalles `[xmin, xmax]` et `[ymin, ymax]` est la **projection** du segment sur un axe, c'est-à-dire son ombre sur cet axe.

```text
  y
  ^
  |  ymax  +-------------B
  |        |         .   |
  |        |      .      |
  |        |   .         |
  |  ymin  A-------------+
  |        |             |
  +--------+-------------+----------> x
         xmin          xmax
```

Si deux segments ont un point commun, ce point appartient aux deux boîtes : **les deux boîtes se recouvrent**. Dit autrement : si deux boîtes sont **disjointes** (sans point commun), les segments ne peuvent pas se croiser, inutile d'appliquer le test exact. L'inverse est faux : deux boîtes peuvent se recouvrir sans que les segments se touchent, auquel cas le test exact tranchera.

```text
 Recouvrement en x seulement          Recouvrement en x et en y
 (pas de croisement possible)         (le test exact tranche)

      +--------+                       +--------+
      |   S    |                       |   S    |
      |        |                       |     +--+-----+
      +--------+                       +-----+--+     |
   +--------+                                |   T    |
   |   T    |                                +--------+
   +--------+
```

Deux boîtes se recouvrent si et seulement si leurs intervalles se recouvrent **sur chaque axe**. Deux intervalles fermés (extrémités comprises) `[min1, max1]` et `[min2, max2]` ont un point commun exactement quand chacun commence avant que l'autre finisse : `min1 <= max2` et `min2 <= max1`.

| Intervalle 1 | Intervalle 2 | `min1 <= max2` | `min2 <= max1` | Recouvrement |
|---|---|---|---|---|
| `[1, 4]` | `[3, 6]` | oui (1 <= 6) | oui (3 <= 4) | Oui |
| `[1, 4]` | `[4, 7]` | oui (1 <= 7) | oui (4 <= 4) | Oui : ils se touchent en 4 |
| `[1, 4]` | `[5, 7]` | oui (1 <= 7) | non (5 <= 4 est faux) | Non |

Le test de boîte coûte quatre comparaisons au plus (deux par axe), contre une trentaine d'opérations pour le test exact. Les boîtes se calculent une seule fois par segment.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    long long xmin, xmax;                   // bornes de la boîte sur l'axe x
    long long ymin, ymax;                   // bornes de la boîte sur l'axe y
} Boite;

// Calcule la boîte englobante alignée sur les axes d'un segment.
static Boite boite_de(const Segment *s)
{
    Boite b;                                // la boîte à remplir

    b.xmin = minimum(s->a.x, s->b.x);       // le x le plus à gauche des deux bouts
    b.xmax = maximum(s->a.x, s->b.x);       // le x le plus à droite
    b.ymin = minimum(s->a.y, s->b.y);       // le y le plus bas
    b.ymax = maximum(s->a.y, s->b.y);       // le y le plus haut
    return b;
}

// Vrai si les intervalles fermés [min1, max1] et [min2, max2] ont un point commun.
static int se_recouvrent(long long min1, long long max1, long long min2, long long max2)
{
    return min1 <= max2 && min2 <= max1;    // chacun commence avant que l'autre finisse
}

// Un segment, son numéro d'origine et sa boîte (calculée une seule fois).
typedef struct {
    int id;                                 // position dans le tableau de départ
    Segment seg;                            // le segment lui-même
    Boite boite;                            // sa boîte englobante
} Element;
```

Les segments verticaux (`xmin == xmax`), horizontaux, ou réduits à un point n'ont rien de particulier : leur boîte est un rectangle aplati, voire un point, et le test d'intervalles fermés fonctionne tel quel.

Mais tester la boîte de chaque paire reste un travail en `O(n²)` : cinq milliards de comparaisons de boîtes pour 100 000 segments. Le tri évite même cela.

## Le tri puis le balayage

L'idée : si les segments sont rangés par `xmin` croissant, les candidats d'un segment sont ses voisins immédiats dans ce rangement, et on s'arrête dès que le suivant commence trop loin à droite.

| Étape | Action | Pourquoi |
|---|---|---|
| 1 | Copier les segments avec leur boîte et leur numéro | Garder le tableau d'origine intact |
| 2 | Trier la copie par `xmin` croissant | Les candidats d'un segment deviennent contigus |
| 3 | Pour chaque segment `i`, parcourir les suivants `j = i + 1, i + 2...` **tant que** `xmin[j] <= xmax[i]` | Au-delà, aucun recouvrement en `x` n'est possible : on s'arrête |
| 4 | Pour chaque `j` visité, tester le recouvrement en `y` | Test bon marché |
| 5 | Seulement si les `y` se recouvrent, appeler le test exact | On ne paie le test coûteux que pour les paires plausibles |

Le **balayage** (*sweep*) est le nom de l'étape 3 : on imagine une ligne verticale qui avance de gauche à droite sur l'axe `x`, et à chaque segment rencontré on regarde ceux qu'elle croise encore. Le **tri** vient de l'étape 2 : sans lui, il faudrait parcourir tout le tableau pour savoir quels segments sont à portée.

Les blocs de code de ce chapitre s'ajoutent les uns aux autres dans un même fichier (retirer le `main` d'essai de la section précédente avant de continuer). Le premier range les résultats : un croisement `(i, j)` devient une **clé**, un seul entier de 64 bits (`i` dans la moitié haute des 64 bits, `j` dans la moitié basse), et un tableau qui s'agrandit au besoin ([`realloc`](/?c=langages&s=c&p=memoire#redimensionner-un-bloc-realloc)) les conserve. Le type `Compteurs` mesure le travail : `visitees` compte les paires que la boucle examine, `tests_exacts` les appels au test coûteux.

| Élément | Rôle |
|---|---|
| `size_t` | Entier non signé (sans valeur négative) fait pour les tailles et les nombres d'éléments |
| `realloc(ancien, taille)` | Agrandit un bloc de mémoire, ou en renvoie un nouveau qui contient les mêmes données |
| `perror("texte")` | Affiche le texte suivi de la description de la dernière erreur du système |
| `exit(1)` | Arrête le programme avec le code 1, qui signale un échec (voir [exit et les codes de retour](/?c=langages&s=c&p=exit-et-codes-de-retour)) |
| `<<` et `\|` | Décalage de bits vers la gauche et OU binaire, pour loger deux numéros dans un seul entier (voir [les opérateurs binaires](/?c=langages&s=c&p=operateurs-binaires)) |
| `for (; j < n && ...; j++)` | Boucle `for` dont la première partie est vide : `j` existe déjà |
| `continue` | Passe directement au tour de boucle suivant |
| `%c` | Code de `printf` pour afficher un caractère ; `'A' + 2` vaut le caractère `C` |

```c
typedef struct {
    long long visitees;                     // paires examinées par la boucle intérieure
    long long tests_exacts;                 // appels à segments_se_croisent
} Compteurs;

typedef struct {
    unsigned long long *cles;               // une clé par croisement trouvé
    size_t nb, capacite;                    // nombre de clés rangées, places disponibles
} Resultats;

// Range le croisement (i, j) sous la forme d'un seul nombre, le petit numéro en tête.
static void enregistrer(Resultats *r, int i, int j)
{
    int petit = i < j ? i : j;              // le plus petit des deux numéros
    int grand = i < j ? j : i;              // le plus grand

    if (r->nb == r->capacite) {             // tableau plein : on l'agrandit
        size_t nouvelle = r->capacite ? 2 * r->capacite : 1024;   // on double
        unsigned long long *p = realloc(r->cles, nouvelle * sizeof *p);

        if (p == NULL) {                    // plus de mémoire : on abandonne
            perror("realloc");
            exit(1);
        }
        r->cles = p;
        r->capacite = nouvelle;
    }
    r->cles[r->nb++] = ((unsigned long long)petit << 32) | (unsigned)grand;   // petit:grand
}
```

Le second bloc est le cœur de la technique. Il utilise `qsort`, la fonction de tri de la bibliothèque standard du C (voir [`qsort` et la stabilité](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#qsort-ne-promet-rien) ; référence : [`qsort`](https://en.cppreference.com/w/c/algorithm/qsort)) : elle reçoit le tableau, le nombre d'éléments, la taille d'un élément et une **fonction de comparaison** (un [pointeur de fonction](/?c=langages&s=c&p=pointeurs)) qui renvoie un nombre négatif, nul ou positif. Les fonctions `malloc` (réserver de la mémoire), `memcpy` (copier des octets) et `free` (la rendre) sont expliquées dans [la gestion de la mémoire](/?c=langages&s=c&p=memoire). Le paramètre `bavard` sert à afficher les étapes dans l'exemple qui suit ; il vaudra 0 pour les mesures.

```c
// Compare deux éléments par xmin croissant (sans soustraction, qui pourrait déborder).
static int comparer_xmin(const void *p, const void *q)
{
    const Element *e = p;                   // le premier élément comparé
    const Element *f = q;                   // le second

    return (e->boite.xmin > f->boite.xmin) - (e->boite.xmin < f->boite.xmin);
}

// Le balayage : suppose le tableau déjà trié par xmin croissant.
static void balayer(const Element *tri, int n, Compteurs *c, Resultats *res, int bavard)
{
    for (int i = 0; i < n; i++) {           // chaque segment, de gauche à droite
        const Element *e = &tri[i];         // le segment dont on cherche les voisins
        int j = i + 1;                      // premier candidat : le suivant dans l'ordre

        for (; j < n && tri[j].boite.xmin <= e->boite.xmax; j++) {   // encore à portée en x
            const Element *f = &tri[j];     // le candidat
            c->visitees++;                  // une paire de plus examinée
            if (!se_recouvrent(e->boite.ymin, e->boite.ymax, f->boite.ymin, f->boite.ymax)) {
                if (bavard)
                    printf("  %c-%c : y disjoints, écartée\n", 'A' + e->id, 'A' + f->id);
                continue;                   // pas de recouvrement en y : paire éliminée
            }
            c->tests_exacts++;              // seul cas où l'on paie le test exact
            int oui = segments_se_croisent(&e->seg, &f->seg);   // le verdict exact
            if (oui)
                enregistrer(res, e->id, f->id);
            if (bavard)
                printf("  %c-%c : test exact, %s\n", 'A' + e->id, 'A' + f->id,
                       oui ? "croisement" : "pas de croisement");
        }
        if (bavard && j < n)                // on s'est arrêté avant la fin du tableau
            printf("  %c-%c : xmin %lld > xmax %lld, on arrête\n", 'A' + e->id,
                   'A' + tri[j].id, tri[j].boite.xmin, e->boite.xmax);
    }
}

// Version triée : trie une copie (l'original garde son ordre), puis balaie.
static void methode_triee(const Element *e, int n, Compteurs *c, Resultats *res, int bavard)
{
    Element *copie = malloc((size_t)n * sizeof *copie);   // la copie qu'on va trier

    if (copie == NULL) {                    // plus de mémoire : on abandonne
        perror("malloc");
        exit(1);
    }
    memcpy(copie, e, (size_t)n * sizeof *copie);   // recopie les éléments
    qsort(copie, (size_t)n, sizeof *copie, comparer_xmin);   // tri par xmin croissant
    balayer(copie, n, c, res, bavard);      // puis le balayage
    free(copie);                            // la copie ne sert plus
}
```

### Pas à pas sur six segments

Six segments `A` à `F`, de coordonnées entières. Leurs boîtes englobantes :

| Segment | Extrémités | `[xmin, xmax]` | `[ymin, ymax]` |
|---|---|---|---|
| A | (1, 1) et (4, 4) | [1, 4] | [1, 4] |
| B | (2, 4) et (5, 1) | [2, 5] | [1, 4] |
| C | (3, 4) et (6, 7) | [3, 6] | [4, 7] |
| D | (6, 7) et (9, 4) | [6, 9] | [4, 7] |
| E | (7, 3) et (9, 7) | [7, 9] | [3, 7] |
| F | (8, 0) et (11, 1) | [8, 11] | [0, 1] |

Les points du dessin sont les nœuds de la grille traversés par chaque segment ; `X` marque un point commun à deux segments (`A` et `B` en (3, 3), `C` et `D` en (6, 7), `D` et `E` en (8, 5)).

```text
   y
   8 .  .  .  .  .  .  .  .  .  .  .  .
   7 .  .  .  .  .  .  X  .  .  E  .  .
   6 .  .  .  .  .  C  .  D  .  .  .  .
   5 .  .  .  .  C  .  .  .  X  .  .  .
   4 .  .  B  C  A  .  .  .  .  D  .  .
   3 .  .  .  X  .  .  .  E  .  .  .  .
   2 .  .  A  .  B  .  .  .  .  .  .  .
   1 .  A  .  .  .  B  .  .  .  .  .  F
   0 .  .  .  .  .  .  .  .  F  .  .  .
     0  1  2  3  4  5  6  7  8  9  10 11  x
```

Après le tri, l'ordre est déjà `A, B, C, D, E, F` (par `xmin` : 1, 2, 3, 6, 7, 8). Les intervalles en `x` montrent ce que « à portée » veut dire : le segment `A` n'a pour candidats que ceux dont l'intervalle commence avant que le sien finisse.

```text
      0  1  2  3  4  5  6  7  8  9  10 11  x
   A     [========]
   B        [========]
   C           [========]
   D                    [========]
   E                       [=====]
   F                          [========]
```

Pour `A` (`xmax = 4`) : `B` commence en 2, `C` en 3, mais `D` en 6 : 6 est plus grand que 4, on arrête, `E` et `F` ne sont même pas regardés (le tableau étant trié, ils commencent encore plus loin). Voici le programme qui rejoue le balayage, avec les segments donnés dans le désordre pour que le tri serve à quelque chose :

```c
int main(void)
{
    Segment seg[6] = {                      // les six segments, A à F, dans le désordre
        {{6, 7}, {9, 4}},                   // D
        {{1, 1}, {4, 4}},                   // A
        {{8, 0}, {11, 1}},                  // F
        {{3, 4}, {6, 7}},                   // C
        {{2, 4}, {5, 1}},                   // B
        {{7, 3}, {9, 7}},                   // E
    };
    int noms[6] = {3, 0, 5, 2, 1, 4};       // numéro de lettre de chaque segment (A = 0)
    Element e[6];                           // les éléments à balayer
    Compteurs c = {0, 0};                   // compteurs à zéro
    Resultats res = {NULL, 0, 0};           // aucun croisement trouvé pour l'instant

    for (int i = 0; i < 6; i++) {           // prépare chaque élément
        e[i].id = noms[i];                  // son numéro de lettre
        e[i].seg = seg[i];                  // son segment
        e[i].boite = boite_de(&seg[i]);     // sa boîte englobante
    }
    methode_triee(e, 6, &c, &res, 1);       // balayage bavard
    printf("paires visitées : %lld, tests exacts : %lld, croisements : %zu\n",
           c.visitees, c.tests_exacts, res.nb);
    free(res.cles);                         // libère les résultats
    return 0;
}
```

```text
  A-B : test exact, croisement
  A-C : test exact, pas de croisement
  A-D : xmin 6 > xmax 4, on arrête
  B-C : test exact, pas de croisement
  B-D : xmin 6 > xmax 5, on arrête
  C-D : test exact, croisement
  C-E : xmin 7 > xmax 6, on arrête
  D-E : test exact, croisement
  D-F : y disjoints, écartée
  E-F : y disjoints, écartée
paires visitées : 7, tests exacts : 5, croisements : 3
```

| Segment balayé | Candidats visités | Arrêt | Tests exacts | Remarque |
|---|---|---|---|---|
| A (`xmax = 4`) | B, C | `D` commence en 6 | 2 | `A`-`C` : boîtes en contact en `y = 4`, le test exact dit non |
| B (`xmax = 5`) | C | `D` commence en 6 | 1 | Même cas : boîtes recouvertes, segments disjoints |
| C (`xmax = 6`) | D | `E` commence en 7 | 1 | `D` commence **exactement** en 6 : retenu grâce au `<=`, et ils se touchent en (6, 7) |
| D (`xmax = 9`) | E, F | fin du tableau | 1 | `F` écarté par les `y` ([0, 1] contre [4, 7]) |
| E (`xmax = 9`) | F | fin du tableau | 0 | `F` écarté par les `y` |
| F | aucun | fin du tableau | 0 | : |

Bilan : 15 paires possibles, 7 examinées, 5 tests exacts, 3 croisements trouvés. Le cas de `C` et `D` montre pourquoi le test est `<=` et non `<` : avec `<`, la paire `C`-`D` n'est jamais examinée et le programme n'en trouve que 2 (6 paires visitées, 4 tests exacts, mesuré en remplaçant le seul caractère).

### Pourquoi aucun croisement n'est manqué

Une technique qui élimine des paires doit prouver qu'elle n'élimine jamais une paire qui se croise. Soient deux segments `s` et `t` qui se croisent, `s` placé avant `t` dans le tableau trié (indices `i < j`).

1. Ils ont un point commun, qui appartient à leurs deux boîtes : leurs intervalles se recouvrent en `x` **et** en `y`. Le test en `y` ne les écarte donc pas.
2. Le tri donne `xmin[i] <= xmin[j]`. Le recouvrement en `x` exige `xmin[j] <= xmax[i]` (« chacun commence avant que l'autre finisse »), c'est exactement la condition de continuation de la boucle.
3. La boucle de `i` avance `j` depuis `i + 1` et ne s'arrête qu'au premier `j` qui viole la condition. Pour tout `k` plus loin, `xmin[k] >= xmin[j] > xmax[i]` (tableau trié) : aucun segment après l'arrêt ne peut recouvrir `i` en `x`. Rien de plausible n'est sauté.
4. La paire `(i, j)` est donc visitée, passe le test en `y`, et le test exact la déclare croisée.

Par construction, `j` démarre à `i + 1` : une paire n'est examinée qu'une fois, et jamais un segment avec lui-même.

## Le coût

| Étape | Coût | Explication |
|---|---|---|
| Copie et calcul des boîtes | `O(n)` | Un passage |
| Tri par `xmin` | `O(n log n)` | Tri par comparaison, voir [le tri par comparaison](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) |
| Balayage | `O(n + p)` | `n` tours de la boucle extérieure, plus une visite par paire dont les intervalles en `x` se recouvrent (leur nombre est `p`), plus un test d'arrêt par segment |
| Tests exacts | au plus `p` | Seules passent les paires dont les boîtes se recouvrent aussi en `y` |

Au total : `O(n log n + p)`. Tout dépend de `p`. La mesure ci-dessous compare, pour 1 000, 10 000 et 100 000 petits segments aléatoires, le nombre de tests exacts de la version naïve et de la version triée. Les données viennent d'un **générateur pseudo-aléatoire** (une formule qui produit une suite de nombres d'allure aléatoire, mais entièrement déterminée par un nombre de départ, la **graine** ; voir [l'aléatoire et les générateurs](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#un-prng-est-une-suite-deterministe)) : avec la même graine, chaque exécution produit les mêmes segments. C'est l'**xorshift64** du chapitre [la stabilité d'un tri et le bruit reproductible](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#un-bruit-reproductible-xorshift), dont la formule est reprise (`<<` et `>>` décalent les bits, `^=` est un « ou exclusif » : voir [les opérateurs binaires](/?c=langages&s=c&p=operateurs-binaires)). Chaque segment part d'un point tiré au hasard dans un carré de côté 100 000, et son second bout est décalé de -1 000 à +1 000 sur chaque axe.

| Élément | Rôle |
|---|---|
| `enum { MONDE = 100000, PORTEE = 1000 };` | Donne un nom à des constantes entières |
| `unsigned long long` et `0x9E3779B97F4A7C15ull` | Entier non signé de 64 bits ; constante écrite en hexadécimal (en base 16, d'où le préfixe `0x`), le suffixe `ull` précisant son type. Multiplier la graine par cette constante évite une graine « trop simple » |
| `x % borne` | Reste de la division : ramène un grand nombre entre 0 et `borne - 1` (le léger biais de cette méthode est expliqué dans [le biais du modulo](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#le-biais-du-modulo), sans effet ici) |
| `memcmp(a, b, taille)` | Compare deux zones mémoire octet par octet, renvoie 0 si elles sont identiques |
| `%zu`, `%lld` | Codes de `printf` pour un `size_t` (entier non signé fait pour les tailles et les nombres d'éléments) et un `long long` |

Le premier bloc contient la version naïve, la transposition des axes (expliquée plus bas, dans « Le pire cas »), le générateur et la fabrication des segments.

```c
// Version naïve : teste les n(n-1)/2 paires avec le test exact.
static void methode_naive(const Element *e, int n, Compteurs *c, Resultats *res)
{
    for (int i = 0; i < n; i++) {           // premier segment de la paire
        for (int j = i + 1; j < n; j++) {   // second segment, toujours après le premier
            c->visitees++;                  // une paire de plus examinée
            c->tests_exacts++;              // et un test exact de plus
            if (segments_se_croisent(&e[i].seg, &e[j].seg))
                enregistrer(res, e[i].id, e[j].id);
        }
    }
}

static void echanger(long long *u, long long *v)
{
    long long reserve = *u;                 // met u de côté
    *u = *v;                                // u prend la valeur de v
    *v = reserve;                           // v prend l'ancienne valeur de u
}

// Échange x et y partout : balayer ensuite « en x » revient à balayer en y l'original.
static void transposer(Element *e, int n)
{
    for (int i = 0; i < n; i++) {           // chaque segment
        echanger(&e[i].seg.a.x, &e[i].seg.a.y);   // transpose le premier bout
        echanger(&e[i].seg.b.x, &e[i].seg.b.y);   // transpose le second bout
        e[i].boite = boite_de(&e[i].seg);   // recalcule la boîte avec les axes échangés
    }
}

enum { MONDE = 100000, PORTEE = 1000 };    // côté du monde, déplacement maximal d'un bout

// Un pas de xorshift64, le générateur du chapitre sur la stabilité du tri.
static unsigned long long xorshift64(unsigned long long *etat)
{
    unsigned long long x = *etat;           // l'état actuel du générateur

    x ^= x << 13;                           // mélange les bits par un décalage et un XOR
    x ^= x >> 7;                            // deuxième mélange
    x ^= x << 17;                           // troisième mélange
    return *etat = x;                       // range le nouvel état et le renvoie
}

// Tire un entier de 0 inclus à borne exclue (biais du modulo négligeable ici).
static long long tirer(unsigned long long *etat, long long borne)
{
    return (long long)(xorshift64(etat) % (unsigned long long)borne);
}

// Remplit e avec n petits segments au hasard, dans un carré de côté MONDE.
static void segments_aleatoires(Element *e, int n, unsigned long long *etat)
{
    for (int i = 0; i < n; i++) {           // un segment par tour
        long long x = tirer(etat, MONDE);   // abscisse du premier bout
        long long y = tirer(etat, MONDE);   // ordonnée du premier bout
        long long dx = tirer(etat, 2 * PORTEE + 1) - PORTEE;   // déplacement en x
        long long dy = tirer(etat, 2 * PORTEE + 1) - PORTEE;   // déplacement en y

        e[i].id = i;                        // son numéro d'origine
        e[i].seg = (Segment){{x, y}, {x + dx, y + dy}};   // le second bout est tout proche
        e[i].boite = boite_de(&e[i].seg);   // sa boîte englobante
    }
}
```

Le second bloc vérifie que les deux méthodes trouvent **le même ensemble** de croisements (on trie les clés des deux listes, puis on les compare octet par octet), et lance la mesure. Pour 100 000 segments, la version naïve ferait 4 999 950 000 tests : elle ne terminait pas en 20 secondes lors de l'essai, même sans les contrôles de la compilation. Le programme n'exécute donc pas le naïf à cette taille : le nombre de tests naïfs affiché est la formule `n(n-1)/2` (la boucle naïve en fait exactement autant), et le résultat est vérifié contre un second balayage, fait sur l'axe `y` en échangeant les deux axes avec `transposer`.

```c
// Compare deux clés pour le tri croissant.
static int comparer_cles(const void *p, const void *q)
{
    unsigned long long u = *(const unsigned long long *)p;   // première clé
    unsigned long long v = *(const unsigned long long *)q;   // seconde clé

    return (u > v) - (u < v);
}

// Vrai si les deux listes de croisements contiennent exactement les mêmes paires.
static int memes_croisements(Resultats *r1, Resultats *r2)
{
    if (r1->nb != r2->nb)                   // pas le même nombre : forcément différents
        return 0;
    qsort(r1->cles, r1->nb, sizeof *r1->cles, comparer_cles);   // trie la première liste
    qsort(r2->cles, r2->nb, sizeof *r2->cles, comparer_cles);   // et la seconde
    return memcmp(r1->cles, r2->cles, r1->nb * sizeof *r1->cles) == 0;   // octet par octet
}

int main(void)
{
    int tailles[3] = {1000, 10000, 100000};   // les trois tailles à comparer

    printf("%7s %14s %14s %12s %12s  %s\n", "n", "naïf : tests", "trié : paires",
           "trié : tests", "croisements", "vérifié contre");
    for (int k = 0; k < 3; k++) {           // une ligne de résultats par taille
        int n = tailles[k];                 // nombre de segments de cette ligne
        unsigned long long graine = 0x9E3779B97F4A7C15ull * 42;   // graine fixe
        Element *e = malloc((size_t)n * sizeof *e);   // les segments de départ
        Element *autre = malloc((size_t)n * sizeof *autre);   // copie pour l'autre méthode
        Compteurs cn = {0, 0}, ct = {0, 0}, ca = {0, 0};   // naïf, trié en x, vérification
        Resultats rt = {NULL, 0, 0}, rv = {NULL, 0, 0};    // résultats : trié, contrôle
        const char *contre = n <= 10000 ? "naïf" : "balayage en y";   // la référence

        if (e == NULL || autre == NULL)
            return 1;
        segments_aleatoires(e, n, &graine); // génère les segments
        methode_triee(e, n, &ct, &rt, 0);   // tri puis balayage en x
        if (n <= 10000) {                   // assez petit pour tout tester
            methode_naive(e, n, &cn, &rv);  // toutes les paires
        } else {                            // trop long à exécuter ici
            memcpy(autre, e, (size_t)n * sizeof *autre);   // copie les segments
            transposer(autre, n);           // échange les axes
            methode_triee(autre, n, &ca, &rv, 0);   // balayage selon y
            cn.tests_exacts = (long long)n * (n - 1) / 2;   // ce que ferait le naïf
        }
        int memes = memes_croisements(&rt, &rv);   // les deux méthodes concordent-elles ?

        printf("%7d %14lld %14lld %12lld %12zu  %s%s\n", n, cn.tests_exacts, ct.visitees,
               ct.tests_exacts, rt.nb, memes ? "" : "DIFFÉRENT ", contre);
        free(rt.cles);                      // libère le résultat du trié
        free(rv.cles);                      // libère celui de la vérification
        free(autre);                        // libère la copie
        free(e);                            // libère les segments
    }
    return 0;
}
```

```text
      n  naïf : tests trié : paires trié : tests  croisements  vérifié contre
   1000         499500           5002           45           16  naïf
  10000       49995000         494868         4984         1800  naïf
 100000     4999950000       49743253       499117       184665  balayage en y
```

| `n` | Tests exacts du naïf | Paires visitées (tri + balayage) | Tests exacts (tri + balayage) | Réduction des tests exacts |
|---|---|---|---|---|
| 1 000 | 499 500 | 5 002 | 45 | environ 11 000 fois moins |
| 10 000 | 49 995 000 | 494 868 | 4 984 | environ 10 000 fois moins |
| 100 000 | 4 999 950 000 | 49 743 253 | 499 117 | environ 10 000 fois moins |

Deux enseignements. D'abord, le gain est énorme : à 100 000 segments, de cinq milliards de tests exacts on passe à moins d'un demi-million, et les croisements trouvés sont les mêmes. Ensuite, et c'est le point à ne pas rater : le nombre de paires visitées **continue de croître comme `n²`** (il est multiplié par 99 puis par 100 quand `n` est multiplié par 10 deux fois). La technique ne change pas la forme de la courbe ici, elle en divise la hauteur par 100 environ, parce que dans ce monde de côté 100 000 un segment recouvre en `x` seulement 1 % des autres. Le gain dépend donc de la **répartition** des segments : `p` vaut ici environ 1 % de `n(n-1)/2`.

### Le pire cas : tout se recouvre en x

Si tous les segments sont longs et superposés en `x`, chaque segment recouvre en `x` tous les autres : `p = n(n-1)/2`, et le balayage retombe en `O(n²)`. La mesure ci-dessous fabrique `n` longs segments presque horizontaux (de `x` proche de 0 à `x` proche de 100 000), empilés de 4 en 4 en `y`, donc sans aucun croisement. Elle compte les paires visitées par un balayage selon `x`, puis par un balayage selon `y` après `transposer` (les blocs précédents restent dans le fichier, seul le `main` de la mesure est remplacé par celui-ci ; le compilateur signale alors des fonctions `static` inutilisées, sans conséquence).

```c
// n longs segments presque horizontaux, tous superposés en x, empilés de 4 en 4 en y.
static void segments_en_bandes(Element *e, int n, unsigned long long *etat)
{
    for (int i = 0; i < n; i++) {           // un segment par étage
        long long gauche = tirer(etat, 100);   // départ près du bord gauche (0 à 99)
        long long droite = MONDE - tirer(etat, 100);   // arrivée près du bord droit
        long long etage = 4 * (long long)i; // hauteur de l'étage, 4 de plus
        long long pente = tirer(etat, 3);   // montée de 0 à 2 : reste dans son étage

        e[i].id = i;                        // son numéro d'origine
        e[i].seg = (Segment){{gauche, etage}, {droite, etage + pente}};   // très long
        e[i].boite = boite_de(&e[i].seg);   // sa boîte englobante
    }
}

int main(void)
{
    int tailles[4] = {1000, 2000, 4000, 8000};   // on double n à chaque ligne

    printf("%6s %16s %14s %14s\n", "n", "balayage en x", "balayage en y", "n(n-1)/2");
    for (int k = 0; k < 4; k++) {           // une ligne par taille
        int n = tailles[k];                 // nombre de segments de cette ligne
        unsigned long long graine = 0x9E3779B97F4A7C15ull * 42;   // graine fixe
        Element *e = malloc((size_t)n * sizeof *e);   // les segments de départ
        Compteurs cx = {0, 0}, cy = {0, 0}; // compteurs des deux balayages
        Resultats rx = {NULL, 0, 0}, ry = {NULL, 0, 0};   // résultats des deux balayages

        if (e == NULL)
            return 1;
        segments_en_bandes(e, n, &graine);  // génère les bandes
        methode_triee(e, n, &cx, &rx, 0);   // balayage en x : tous les segments se recouvrent
        transposer(e, n);                   // échange les axes
        methode_triee(e, n, &cy, &ry, 0);   // balayage en y : les étages sont séparés
        printf("%6d %16lld %14lld %14lld\n", n, cx.visitees, cy.visitees,
               (long long)n * (n - 1) / 2);
        free(rx.cles);                      // libère les résultats (vides ici)
        free(ry.cles);
        free(e);                            // libère les segments
    }
    return 0;
}
```

```text
     n    balayage en x  balayage en y       n(n-1)/2
  1000           499500              0         499500
  2000          1999000              0        1999000
  4000          7998000              0        7998000
  8000         31996000              0       31996000
```

Le balayage selon `x` visite **exactement** `n(n-1)/2` paires, comme la version naïve : doubler `n` multiplie le travail par 4, c'est le `O(n²)`. Le balayage selon `y` n'en visite aucune, car les étages sont séparés sur cet axe. Le choix de l'axe compte donc autant que la technique elle-même. Reste un cas sans issue : si tous les segments se croisent réellement (par exemple tous passent par un même point), la réponse elle-même contient `n(n-1)/2` paires, et aucun algorithme ne peut la produire plus vite qu'en l'écrivant.

## D'autres usages, et des structures plus fines

| Usage | Comment la technique s'y applique |
|---|---|
| Collisions dans un jeu | Chaque objet a une boîte ; la **phase large** (*broad phase*) élimine les paires éloignées avec ce balayage, la **phase étroite** (*narrow phase*) fait le test précis sur les paires restantes. C'est le rôle exact du test exact ci-dessus |
| Contour de polygone avant triangulation | Vérifier que deux arêtes ne se croisent pas avant la [triangulation par *ear clipping*](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#des-faces-a-nombre-de-sommets-variable), qui [refuse les faces qui se recoupent](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#rendre-l-ear-clipping-robuste). Cette technique n'y figure pas : elle s'ajoute en amont |
| Autres formes | Un cercle, un triangle, un rectangle ont aussi une boîte englobante : seul le test exact change |
| Trajectoires, routes, câblage | Tout ensemble de segments dont on cherche les intersections |

Quand la répartition des segments est défavorable sur les deux axes, des structures plus élaborées prennent le relais : une **grille uniforme** (le monde découpé en cases, chaque segment rangé dans les cases qu'il touche, souvent avec une [table de hachage](/?c=langages&s=c&p=tables-de-hachage) pour retrouver une case) ou un **arbre** de boîtes (voir [les arbres binaires](/?c=langages&s=c&p=arbres-binaires)). Elles dépassent le cadre de ce chapitre.

## Les pièges

| Piège | Pourquoi | Parade |
|---|---|---|
| `<` au lieu de `<=` dans la condition du balayage | Deux boîtes qui se touchent (`xmin[j] == xmax[i]`) se recouvrent ; avec `<`, la paire `C`-`D` de l'exemple est perdue (2 croisements trouvés au lieu de 3) | Intervalles fermés, `<=` partout |
| `xmin` égaux entre plusieurs segments | Le tri n'a pas besoin d'être stable : si `xmin[i] == xmin[j]`, la condition `xmin[j] <= xmax[i]` est vraie dans les deux ordres, la paire est visitée une fois quel que soit l'ordre choisi par `qsort` (voir [la stabilité d'un tri](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible)) | Aucun départage nécessaire pour la correction ; en ajouter un (par numéro) seulement pour rendre l'ordre des résultats reproductible |
| Nombres à virgule flottante | `0.1 + 0.2` n'est pas exactement `0.3` (voir [les nombres à virgule flottante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)) : trois points censés être alignés donnent un produit vectoriel proche de 0 mais non nul, voir l'essai juste après | Coordonnées entières quand c'est possible ; sinon une tolérance, et **élargir les boîtes** de cette tolérance pour que le filtre ne rejette jamais une paire que le test accepterait |
| Débordement des entiers | Avec des `int` de 32 bits, un produit de deux différences de coordonnées dépasse vite 2 milliards | `long long`, et des différences de coordonnées inférieures à 2 milliards (leur produit tient alors dans 64 bits) |
| Segment vertical, horizontal ou réduit à un point | Aucun problème : la boîte est aplatie ou réduite à un point, les intervalles fermés restent corrects | Ne pas écrire de cas particulier |
| Paire testée deux fois, ou segment comparé à lui-même | Boucle intérieure démarrée à `0` au lieu de `i + 1` : chaque croisement est compté deux fois, et un segment « se croise » toujours lui-même | Démarrer `j` à `i + 1` |
| Arêtes voisines d'un polygone | Deux arêtes consécutives partagent une extrémité : le test les déclare croisées, à juste titre au sens du chapitre | Ignorer les paires `(i, i+1)` et `(dernière, première)` avant le test exact, en gardant le numéro d'origine de chaque segment |
| Trier le tableau d'origine | Ses numéros de position sont perdus, les résultats n'ont plus de sens | Trier une copie qui garde un `id` (ce chapitre), ou trier un tableau d'indices (les positions des segments) : moins d'octets déplacés, mais un accès indirect à chaque comparaison ; à mesurer sur ses propres données |
| Mauvais axe | Mesuré plus haut : `n(n-1)/2` paires visitées sur `x`, zéro sur `y` | Balayer sur l'axe où les intervalles se recouvrent le moins (règle empirique après le tableau) |
| Croire que le tri rend toujours le calcul en `O(n log n)` | Le balayage coûte `O(n + p)`, `p` pouvant valoir `n(n-1)/2` | Mesurer `p` (le compteur `visitees`) sur des données réelles |
| Comparateur de `qsort` par soustraction | `a - b` peut déborder pour de grands entiers et renvoyer un signe faux | `(a > b) - (a < b)` |

L'essai sur les nombres à virgule flottante : trois points censés être alignés sur la droite `y = x`, dont le troisième est calculé comme `0.1 + 0.2` au lieu d'être écrit `0.3`.

```c
#include <stdio.h>

int main(void)
{
    double ax = 0.1, ay = 0.1;              // premier point, sur la droite y = x
    double bx = 0.3, by = 0.3;              // deuxième point, sur la même droite
    double cx = 0.1 + 0.2, cy = 0.3;        // troisième point : 0.1 + 0.2 devrait valoir 0.3
    double produit = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);   // produit vectoriel

    printf("%g\n", produit);                // 0 attendu
    return 0;
}
```

```text
-1.38778e-17
```

Le résultat n'est pas 0 : le test déclarerait ces trois points non alignés. Pour choisir l'axe, une règle empirique (tirée de l'expérience, non démontrée ici) consiste à calculer, pour chaque axe, la somme des longueurs des intervalles (`xmax - xmin`, puis `ymax - ymin`) et à balayer sur l'axe où cette somme est la plus petite : c'est là que les intervalles se recouvrent le moins. Une autre consiste à mesurer `p` sur chaque axe avec un échantillon.

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Garder le test exact tel quel et ne lui ajouter qu'un filtre en amont | La correction du résultat ne dépend que du test exact et de la preuve du filtre |
| Calculer la boîte une seule fois par segment | Elle est relue à chaque comparaison |
| Utiliser des intervalles fermés et `<=` | Les contacts ne sont jamais perdus |
| Préférer des coordonnées entières et un type assez large | Le test exact devient exact, sans tolérance |
| Compter les paires visitées et les tests exacts | `p` dit si la technique rapporte quelque chose sur ses données |
| Vérifier le résultat contre la version naïve sur de petites entrées | Une erreur du filtre apparaît comme un croisement manquant |
| Décider une fois pour toutes ce que « se croiser » veut dire (contact, chevauchement) | Les cas limites changent de verdict selon la définition |
| Générer les données d'essai avec une graine fixe | Les mesures sont rejouables et comparables |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Tester toutes les paires de `n` segments coûte `n(n-1)/2` tests exacts, soit `O(n²)`. Le tri puis balayage trie les segments par `xmin`, puis, pour chaque segment `i`, parcourt les suivants `j` tant que `xmin[j] <= xmax[i]`, teste le recouvrement en `y`, et ne lance le test exact (orientation par produit vectoriel, contacts et chevauchements compris) que sur les paires restantes. Aucune paire qui se croise n'est manquée : elle recouvre en `x` et en `y`, et le tri garantit qu'on ne s'arrête pas avant. Le coût est `O(n log n + p)`, où `p` est le nombre de paires dont les intervalles en `x` se recouvrent. Mesuré : 5 milliards de tests pour 100 000 petits segments contre moins de 500 000, mais `p` grandit toujours comme `n²` à répartition constante, et vaut `n(n-1)/2` si tout se superpose en `x`. |
| **Pièges à éviter** | `<` au lieu de `<=` ; oublier que les boîtes qui se recouvrent ne garantissent pas un croisement (le test exact reste nécessaire) ; flottants non alignés par arrondi ; débordement d'entiers 32 bits ; boucle intérieure démarrée avant `i + 1` ; arêtes voisines d'un polygone comptées comme des croisements ; trier le tableau d'origine et perdre les numéros ; balayer sur le mauvais axe ; croire à un `O(n log n)` garanti. |
| **Bonnes pratiques** | Intervalles fermés et `<=` ; boîte calculée une fois ; coordonnées entières sur `long long` ; compteurs de paires visitées et de tests exacts ; vérification contre la version naïve sur de petites entrées ; définition du « croisement » écrite et testée sur les cas limites ; graine fixe pour les mesures ; choix de l'axe mesuré, avec une grille ou un arbre en secours quand aucun axe ne convient. |
