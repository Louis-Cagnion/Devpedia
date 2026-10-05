---
order: 12
---

# Couplages, test de Hall et filtrage de Régin

Le [théorème de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#le-theoreme-de-hall-quand-des-cases-se-bloquent-entre-elles) explique pourquoi des cases peuvent se bloquer entre elles sans qu'aucune, prise seule, n'ait de problème. Ce chapitre montre **comment un programme le détecte**, puis comment il va plus loin : retirer d'une case les valeurs qu'elle ne pourra jamais prendre. C'est ce que fait le solveur Skyscraper sur les lignes et colonnes presque remplies de sa grille (voir les [solveurs SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)).

## La contrainte « toutes différentes »

Une ligne d'un [carré latin](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) contient chaque valeur exactement une fois. Chaque case a un **domaine** : la liste des valeurs qui ne sont pas encore exclues (voir [la propagation de contraintes](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduire-les-domaines-avant-meme-d-essayer-la-propagation-de-contraintes)). Une règle comme « ces cases prennent des valeurs toutes différentes » s'appelle une **contrainte globale** : elle porte sur plusieurs cases à la fois.

La propagation simple ne retire une valeur que quand une case est **fixée** : la case X1 vaut 2, donc 2 disparaît des autres cases. Elle rate des déductions qui demandent de raisonner sur un groupe :

| Case | Domaine | Déduction possible |
|---|---|---|
| X1 | 1 ou 2 | |
| X2 | 1 ou 2 | |
| X3 | 1, 2, 3 ou 4 | X1 et X2 se partagent 1 et 2 : X3 ne peut valoir ni 1 ni 2 |

Aucune case n'est fixée, la propagation simple ne voit rien. Pourtant X3 vaut 3 ou 4. Un morceau de code dédié à cette contrainte, un [propagateur](/?c=fondamentaux&s=algorithmes&p=encodages-sat#propagateurs-et-generation-paresseuse-de-clauses), peut faire ce raisonnement.

## Dessiner le problème : cases d'un côté, valeurs de l'autre

Un **graphe** est un ensemble de points reliés par des traits. Ici, deux familles de points : les cases à gauche, les valeurs à droite, et un trait entre une case et chaque valeur de son domaine. Un graphe dont les points se répartissent en deux familles, sans trait à l'intérieur d'une famille, est dit **biparti**.

| Case | Domaine = traits vers les valeurs |
|---|---|
| A | 1, 2 |
| B | 1, 3 |
| C | 1 |
| D | 3, 4 |

Un **couplage** est un choix de traits qui n'ont aucune extrémité commune : chaque case a au plus une valeur, chaque valeur au plus une case. Un **couplage complet** couple **toutes** les cases : c'est exactement une façon de remplir la ligne avec des valeurs toutes différentes.

```
cases :     A    B    C    D
            │    │    │    │
valeurs :   2    3    1    4        un couplage complet
```

| Vocabulaire | Sens |
|---|---|
| Couplage | Traits sans extrémité commune |
| Couplage complet | Un trait pour chaque case |
| Détenteur d'une valeur | La case qui est couplée à cette valeur |
| Ensemble de Hall | Un groupe de k cases dont les domaines réunis comptent moins de k valeurs |

## Trouver un couplage : le chemin augmentant (algorithme de Kuhn)

On place les cases une par une. Quand la valeur voulue est déjà prise, on ne renonce pas : on **demande à son détenteur de s'écarter**, s'il peut prendre une autre valeur ; et celui-ci peut à son tour demander à un autre... La suite de ces déplacements s'appelle un **chemin augmentant** : à la fin, une case de plus a une valeur. Cette méthode, connue sous le nom d'algorithme de Kuhn, découle de la méthode hongroise de [Kuhn (1955)](https://doi.org/10.1002/nav.3800020109).

| Étape | Case | Ce qui se passe | Couplage après |
|---|---|---|---|
| 1 | A | Prend 1 | A=1 |
| 2 | B | Veut 1, détenu par A. A peut prendre 2 : A s'écarte, B prend 1 | B=1 A=2 |
| 3 | C | Veut 1, détenu par B. B peut prendre 3 : B s'écarte, C prend 1 | C=1 A=2 B=3 |
| 4 | D | Veut 3, détenu par B, qui n'a plus de valeur libre (sa valeur 1 est tenue par C, qui n'a pas d'autre choix). Essaie 4 : libre | C=1 A=2 B=3 D=4 |

Chaque domaine est un **masque de bits** (le bit `v` vaut 1 si la valeur `v` est possible ; voir [les masques](/?c=langages&s=c&p=operateurs-binaires#les-masques-la-vraie-utilite-au-quotidien)) : un `uint64_t` suffit pour 64 valeurs, et « prendre la plus petite valeur possible » est une instruction (`__builtin_ctzll`, voir [parcourir les bits à 1](/?c=langages&s=c&p=operateurs-binaires#parcourir-les-bits-a-1-les-fonctions-integrees-du-compilateur)).

Le code de ce chapitre se range dans un fichier d'en-tête nommé `couplage.h`, que les exemples suivants incluent.

```c
/* Couplage cases / valeurs, test de Hall et filtrage de Régin.
   domaine[i] : masque de la case i, le bit v vaut 1 si la valeur v est encore possible.
   Au plus 64 cases et 64 valeurs : un masque tient dans un uint64_t. */
#include <stdint.h>

/* Cherche un chemin augmentant depuis la case i (algorithme de Kuhn).
   vues : valeurs déjà essayées pendant cette recherche. */
static inline int augmenter(int i, const uint64_t *domaine, int *proprio, uint64_t *vues)
{
    uint64_t m;

    while ((m = domaine[i] & ~*vues)) {         /* valeurs possibles pas encore essayées */
        int v = __builtin_ctzll(m);             /* la plus petite d'entre elles */

        *vues |= 1ull << v;                     /* chaque valeur n'est essayée qu'une fois */
        if (proprio[v] < 0 || augmenter(proprio[v], domaine, proprio, vues)) {
            proprio[v] = i;                     /* i prend v ; l'ancien détenteur a bougé */
            return 1;
        }
    }
    return 0;
}

/* Couple les n cases à des valeurs toutes différentes.
   Renvoie -1 si tout est couplé, sinon la première case sans valeur ; *vues contient
   alors les valeurs que la recherche a atteintes : l'ensemble de Hall. */
static inline int coupler(int n, const uint64_t *domaine, int *proprio, uint64_t *vues)
{
    for (int v = 0; v < 64; v++)
        proprio[v] = -1;
    for (int i = 0; i < n; i++) {
        *vues = 0;
        if (!augmenter(i, domaine, proprio, vues))
            return i;
    }
    return -1;
}
```

| Élément | Rôle |
|---|---|
| `domaine[i]` | Masque des valeurs encore possibles pour la case `i` |
| `proprio[v]` | La case qui détient la valeur `v`, ou -1 si elle est libre |
| `vues` | Les valeurs déjà essayées pendant **cette** recherche : une valeur n'est essayée qu'une fois, ce qui garantit que la recherche s'arrête |
| `augmenter` | Fonction **récursive** (elle s'appelle elle-même, voir [l'insertion récursive](/?c=langages&s=c&p=arbres-binaires#insertion-recursive)) : elle demande au détenteur de s'écarter |
| `coupler` | Lance une recherche par case ; au premier échec, renvoie cette case et les valeurs `vues` |

Le programme ci-dessous rejoue l'exemple de la table précédente, case par case :

```c
#include <stdio.h>
#include "couplage.h"

/* masque des valeurs données (de 1 à 5) ; 0 veut dire « pas de valeur » */
static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void afficher_couplage(const int *proprio)
{
    for (int v = 0; v < 5; v++)                 /* les valeurs vont de 1 à 5 */
        if (proprio[v] >= 0)
            printf(" %c=%d", 'A' + proprio[v], v + 1);
    printf("\n");
}

static void essayer(const char *titre, int n, const uint64_t *domaine)
{
    int proprio[64];
    uint64_t vues;

    for (int v = 0; v < 64; v++)
        proprio[v] = -1;
    printf("%s\n", titre);
    for (int i = 0; i < n; i++) {
        vues = 0;
        int ok = augmenter(i, domaine, proprio, &vues);     /* une case à la fois */

        printf("  case %c : %-6s couplage :", 'A' + i, ok ? "placée" : "ÉCHEC");
        afficher_couplage(proprio);
        if (!ok) {
            printf("  valeurs atteintes par la recherche : ");
            for (uint64_t m = vues; m; m &= m - 1)
                printf("%d ", __builtin_ctzll(m) + 1);
            printf("\n  cases qui les détiennent, plus la case %c :", 'A' + i);
            for (uint64_t m = vues; m; m &= m - 1)
                printf(" %c", 'A' + proprio[__builtin_ctzll(m)]);
            printf("\n");
            return;
        }
    }
}

int main(void)
{
    /* A : 1 ou 2   B : 1 ou 3   C : 1 seulement   D : 3 ou 4 */
    uint64_t un[4] = { M(1, 2, 0, 0), M(1, 3, 0, 0), M(1, 0, 0, 0), M(3, 4, 0, 0) };
    /* A, B et C : 2 ou 5 seulement   D : 1, 3 ou 4 */
    uint64_t deux[4] = { M(2, 5, 0, 0), M(2, 5, 0, 0), M(2, 5, 0, 0), M(1, 3, 4, 0) };

    essayer("Un couplage existe :", 4, un);
    essayer("Aucun couplage :", 4, deux);
    return 0;
}
```

La première partie de la sortie reproduit les étapes de la table (la seconde partie est expliquée plus bas) :

```
Un couplage existe :
  case A : placée couplage : A=1
  case B : placée couplage : B=1 A=2
  case C : placée couplage : C=1 A=2 B=3
  case D : placée couplage : C=1 A=2 B=3 D=4
Aucun couplage :
  case A : placée couplage : A=2
  case B : placée couplage : B=2 A=5
  case C : ÉCHEC couplage : B=2 A=5
  valeurs atteintes par la recherche : 2 5 
  cases qui les détiennent, plus la case C : B A
```

## Quand aucun couplage n'existe : l'ensemble de Hall

Dans le second essai du programme, les cases A, B et C n'acceptent que 2 ou 5 ; la case D accepte 1, 3 ou 4. A prend 2, puis B prend 2 en envoyant A vers 5 ; C veut 2 mais ni B ni A ne peuvent s'écarter. Le programme affiche alors :

| Résultat | Lecture |
|---|---|
| Échec à la case C | Aucun chemin augmentant ne part de C |
| Valeurs atteintes : 2, 5 | Les seules valeurs que la recherche a pu essayer |
| Détenteurs : B, A, plus la case C | Trois cases pour deux valeurs : un **ensemble de Hall** |

C'est exactement le [théorème de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#le-theoreme-de-hall-quand-des-cases-se-bloquent-entre-elles), lu à l'envers : quand la recherche échoue, les valeurs qu'elle a atteintes et les cases qui les détiennent forment un groupe de k cases dont les domaines réunis comptent k - 1 valeurs. Ce groupe **explique** pourquoi aucun couplage n'existe.

Dans un solveur, cette explication sert de clause de conflit : une case du groupe doit prendre une valeur manquante hors de l'ensemble, ou une valeur déjà placée dans la ligne doit être libérée (voir [le conflit et l'apprentissage](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#le-conflit-et-l-apprentissage-de-clause-cdcl)). Cette clause n'est utilisée que pour analyser le conflit ; elle est ensuite jetée.

## Tester en cours de recherche : quand et sur quelles lignes

Le solveur lance le test quand la [propagation unitaire](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#la-propagation-unitaire-les-niveaux-et-la-trace) n'a plus rien à déduire (son **point fixe**), et seulement sur les lignes et colonnes **modifiées depuis le dernier test** et qui n'ont plus **que quelques cases libres**. Trois raisons :

| Raison | Explication |
|---|---|
| Une ligne presque pleine a peu de cases libres | Un groupe de cases qui se bloquent y est facile à repérer, et le test reste court |
| Le coût croît avec le nombre de cases libres | Le filtrage de Régin (plus bas) lit le graphe complet de la ligne : un nombre de lectures proportionnel au carré du nombre de cases libres |
| Les masques ne tiennent que sur 64 bits | Au plus 64 cases libres par ligne |

Le test ne repart pas de zéro à chaque fois : il reprend le couplage du dernier test réussi et ne cherche un chemin augmentant que pour les cases dont la paire n'est plus valable (voir [éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Un conflit est toujours recalculé depuis zéro pour produire une explication qui ne dépend pas du couplage de départ.

Le seuil de cases libres se règle par mesure. Sur des grilles 104 × 104 (100 grilles, 4 copies du solveur en parallèle, voir [les queues lourdes](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#les-queues-lourdes-quelques-instances-catastrophiques)) :

| Test de Hall sur les lignes... | Grilles au-delà de 90 s |
|---|---|
| Aucun test | 9 |
| À au plus 16 cases libres | 3 |
| À au plus 32 cases libres | 0 (moyenne 51,5 s, pire grille 68,8 s) |

Plus haut, la recherche se dégrade : à 108 × 108, un seuil de 48 cases libres ne résout aucune grille sur 14 mesures, un seuil de 64 une sur 61 (budget de 1,5 milliard de propagations par mesure). La cause n'a pas été isolée ; seule la mesure fait foi.

## Aller plus loin : le filtrage de Régin

Le test de Hall répond par oui ou non : « existe-t-il un couplage ? ». Mais un couplage peut exister **tout en interdisant des valeurs**. Dans l'exemple de départ, X1 et X2 se partagent 1 et 2 : X3 ne peut pas les prendre, même si le test de Hall ne voit aucun problème. Le **filtrage de Régin** ([Régin, 1994](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf)) retire de chaque domaine **toute valeur qui n'appartient à aucun couplage complet**.

L'idée : partir d'un couplage complet (le test de Hall en a trouvé un). Pour qu'une case prenne une autre valeur `k` que la sienne, il faut que celui qui détient `k` en prenne une autre, qui à son tour déplace quelqu'un... jusqu'à ce que quelqu'un prenne l'**ancienne** valeur de la case : un cycle de déplacements.

On le représente avec un graphe orienté (des **flèches**, qui se suivent dans un seul sens) sur les valeurs : de la valeur `v`, une flèche part vers chaque valeur du domaine de la case qui détient `v`. Dans l'exemple, le couplage trouvé est X2=1, X1=2, X4=3, X3=4, X5=5 :

```
valeur 5  ──▶  3, 4           (X5 détient 5 et accepte 3, 4, 5)
valeur 4  ──▶  1, 2, 3, 4     (X3 détient 4)
valeur 3  ──▶  3, 4           (X4 détient 3)
valeur 2  ──▶  1, 2           (X1 détient 2)
valeur 1  ──▶  1, 2           (X2 détient 1)
```

Une **composante fortement connexe** est un groupe de points tels que, de chacun, on peut atteindre tous les autres en suivant les flèches. Ici : {1, 2}, {3, 4} et {5}. Les flèches descendent de {5} vers {3, 4} puis vers {1, 2}, mais jamais en sens inverse. La règle de Régin :

> Une valeur `k` du domaine de la case `i` (autre que sa valeur couplée `m`) est possible **si et seulement si** `k` et `m` sont dans la même composante fortement connexe : un cycle existe alors.

| Candidate | Case (valeur couplée) | Revient-on à la valeur couplée ? | Verdict |
|---|---|---|---|
| 1 ou 2 | X3 (4) | 1 et 2 ne mènent qu'à {1, 2} : jamais à 4 | Retirée |
| 3 | X3 (4) | 3 mène à 4 : X3 prend 3, X4 prend 4 | Gardée |
| 3 ou 4 | X5 (5) | 3 et 4 ne mènent pas à 5 | Retirée |
| 4 | X4 (3) | 4 mène à 3 | Gardée |

Les composantes se calculent en une seule traversée du graphe avec l'**algorithme de [Tarjan (1972)](https://doi.org/10.1137/0201010)**, qui empile les points visités et dépile un groupe complet quand il en referme la boucle. Avec des masques de bits, les flèches partant d'une valeur tiennent dans un seul `uint64_t`.

```c
/* Composantes fortement connexes (Tarjan) du graphe des valeurs : de la valeur v on peut
   aller vers toutes les valeurs possibles de la case qui détient v. */
typedef struct {
    const uint64_t *succ;
    int rang[64], bas[64], comp[64], pile[64], sp, compte;
    uint64_t sur_la_pile;
    int ncomp;
} tarjan;

static inline void visiter(tarjan *t, int v)
{
    t->rang[v] = t->bas[v] = t->compte++;
    t->pile[t->sp++] = v;
    t->sur_la_pile |= 1ull << v;
    for (uint64_t m = t->succ[v]; m; m &= m - 1) {
        int w = __builtin_ctzll(m);

        if (t->rang[w] < 0) {
            visiter(t, w);
            if (t->bas[w] < t->bas[v])
                t->bas[v] = t->bas[w];
        } else if ((t->sur_la_pile >> w & 1) && t->rang[w] < t->bas[v]) {
            t->bas[v] = t->rang[w];
        }
    }
    if (t->bas[v] != t->rang[v])
        return;
    int w;                                      /* v est la racine d'une composante */
    do {
        w = t->pile[--t->sp];
        t->sur_la_pile &= ~(1ull << w);
        t->comp[w] = t->ncomp;
    } while (w != v);
    t->ncomp++;
}

/* Filtrage de Régin : retire de chaque domaine les valeurs qui n'appartiennent à aucun
   couplage complet. Suppose un couplage complet dans proprio (n cases, n valeurs 0..n-1).
   Renvoie le nombre de valeurs retirées. */
static inline int filtrer(int n, uint64_t *domaine, const int *proprio)
{
    uint64_t succ[64];
    int case_de[64], retires = 0;
    tarjan t = { .succ = succ };

    for (int v = 0; v < n; v++) {
        succ[v] = domaine[proprio[v]];          /* de v vers les valeurs de sa case */
        case_de[proprio[v]] = v;                /* la valeur couplée à chaque case */
        t.rang[v] = -1;
    }
    for (int v = 0; v < n; v++)
        if (t.rang[v] < 0)
            visiter(&t, v);
    for (int i = 0; i < n; i++)
        for (uint64_t m = domaine[i] & ~(1ull << case_de[i]); m; m &= m - 1) {
            int v = __builtin_ctzll(m);

            if (t.comp[v] != t.comp[case_de[i]]) {  /* v ne revient jamais à la valeur de i */
                domaine[i] &= ~(1ull << v);
                retires++;
            }
        }
    return retires;
}
```

```c
#include <stdio.h>
#include "couplage.h"

static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void afficher(const char *titre, int n, const uint64_t *domaine)
{
    printf("%s\n", titre);
    for (int i = 0; i < n; i++) {
        printf("  X%d :", i + 1);
        for (uint64_t m = domaine[i]; m; m &= m - 1)
            printf(" %d", __builtin_ctzll(m) + 1);
        printf("\n");
    }
}

int main(void)
{
    uint64_t domaine[5] = { M(1, 2, 0, 0), M(1, 2, 0, 0), M(1, 2, 3, 4),
                            M(3, 4, 0, 0), M(3, 4, 5, 0) };
    int proprio[64];
    uint64_t vues;

    afficher("Avant :", 5, domaine);
    if (coupler(5, domaine, proprio, &vues) >= 0) {
        printf("pas de couplage\n");
        return 1;
    }
    printf("Un couplage complet existe : le test de Hall ne voit rien à redire.\n");
    printf("couplage trouvé :");
    for (int v = 0; v < 5; v++)
        printf(" X%d=%d", proprio[v] + 1, v + 1);
    printf("\n");
    int retires = filtrer(5, domaine, proprio);

    afficher("Après le filtrage de Régin :", 5, domaine);
    printf("%d valeurs retirées\n", retires);
    return 0;
}
```

```
Avant :
  X1 : 1 2
  X2 : 1 2
  X3 : 1 2 3 4
  X4 : 3 4
  X5 : 3 4 5
Un couplage complet existe : le test de Hall ne voit rien à redire.
couplage trouvé : X2=1 X1=2 X4=3 X3=4 X5=5
Après le filtrage de Régin :
  X1 : 1 2
  X2 : 1 2
  X3 : 3 4
  X4 : 3 4
  X5 : 5
4 valeurs retirées
```

Le test de Hall n'a rien vu à redire (un couplage existe), et le filtrage retire 4 valeurs : 1 et 2 de X3 (partagées par X1 et X2), 3 et 4 de X5 (partagées par X3 et X4 une fois X3 réduit à {3, 4}). Le raisonnement de Régin va donc **en cascade** sans qu'on l'ait demandé.

## Justifier chaque retrait : les explications

Un solveur SAT à apprentissage doit pouvoir **expliquer** chaque valeur qu'il retire : sans raison, l'analyse d'un conflit ne sait pas remonter jusqu'à la cause (voir [le conflit et l'apprentissage](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#le-conflit-et-l-apprentissage-de-clause-cdcl)). L'explication d'un retrait par le filtrage de Régin est un ensemble de Hall : les cases qui détiennent les valeurs atteignables n'ont pas d'autre choix que ces valeurs, qu'aucune autre case ne peut donc prendre.

Première version du solveur : chaque retrait était **appris comme une clause**. Résultat sur la grille 64 × 64 n° 4, résolue en 98 millions de propagations sans filtrage :

| | Sans filtrage | Premier filtrage (clauses apprises) | Filtrage à explications empilées |
|---|---|---|---|
| Propagations | 98,4 millions | Pas résolue à 300 millions | 102,5 millions |
| Temps | 7,4 s | | 7,8 s |
| Coût d'une propagation | 75 ns | 156 ns | |
| Retraits, clauses apprises | | 226 000, 58 000 (mémoire ×19) | |

Chaque explication est longue (142 littéraux en moyenne, mesurés sur la version corrigée) : en apprendre des dizaines de milliers fait exploser la mémoire et ralentit chaque propagation. La correction : **empiler** chaque explication dans une pile à part, dépilée au retour arrière comme la trace des affectations, sans jamais en faire une clause. Le blocage venait des clauses d'explication, pas du filtrage lui-même.

## Ce que ça a rapporté sur le solveur

Le filtrage ne s'applique qu'aux lignes et colonnes d'au plus 16 cases libres (le test de Hall, lui, jusqu'à 32). Sur 40 grilles 64 × 64, un seul processus, budget de 400 millions de propagations :

| | Sans Régin | Avec Régin (16 cases libres) |
|---|---|---|
| Grilles résolues | 28 sur 40 | 39 sur 40 |
| Propagations moyennes | 187 millions | 97 millions |
| Coût d'une propagation | 107 ns | 91 ns |

(Les moyennes comptent un échec comme le budget entier.) 12 grilles ne sont résolues qu'avec le filtrage, une seule seulement sans lui : un écart aussi net a environ 3 chances sur 1 000 d'arriver par hasard (test du signe bilatéral). Ces 40 grilles comprennent les 20 qui ont servi à choisir ce seuil ; sur les 20 autres seules, le résultat est de 8 contre 1 (voir [comparer deux réglages](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages)). Avec un seuil de 24 cases libres, 17 grilles sur 20 sont résolues (contre 20 sur 20 à 16) : filtrer plus de lignes coûte plus qu'il ne rapporte.

À 108 × 108, sur les 100 grilles (4 copies en parallèle) :

| | Moyenne | Grilles au-delà de 90 s |
|---|---|---|
| Test de Hall seul | 56,8 s | 4 |
| Avec filtrage de Régin | 49,3 s (pire grille 64,1 s) | 0 |

À 112 × 112, ce solveur reste hors d'atteinte : 59,1 s de moyenne simulée sur les 20 premières grilles, et déjà un dépassement.

## Vérifier le code : la force brute

Un raisonnement aussi subtil se trompe facilement : un trait oublié et une valeur utile disparaît sans aucun message. Le programme ci-dessous compare le code à une référence qui essaie **toutes** les façons de remplir les cases (de 2 à 8 cases, domaines aléatoires) :

```c
#include <stdio.h>
#include <stdlib.h>
#include "couplage.h"

/* Référence : essaie toutes les permutations, et note pour chaque case
   les valeurs qu'elle prend dans au moins un couplage complet. */
static void permuter(int n, int k, int *p, int *utilise, const uint64_t *dom,
                     uint64_t *possibles, long *nb)
{
    if (k == n) {
        (*nb)++;
        for (int i = 0; i < n; i++)
            possibles[i] |= 1ull << p[i];
        return;
    }
    for (int v = 0; v < n; v++)
        if (!utilise[v] && (dom[k] >> v & 1)) {
            utilise[v] = 1;
            p[k] = v;
            permuter(n, k + 1, p, utilise, dom, possibles, nb);
            utilise[v] = 0;
        }
}

int main(void)
{
    long avec_couplage = 0, filtres = 0, hall_ok = 0, hall_total = 0, desaccords = 0;

    srand(42);
    for (int tour = 0; tour < 300000; tour++) {
        int n = 2 + rand() % 7;                         /* de 2 à 8 cases */
        uint64_t dom[64], ref[64] = {0}, vues;
        int p[64], utilise[64] = {0}, proprio[64], echec;
        long nb = 0;

        for (int i = 0; i < n; i++) {                   /* domaines aléatoires, clairsemés */
            dom[i] = 0;
            for (int v = 0; v < n; v++)
                if (rand() % 100 < 35)
                    dom[i] |= 1ull << v;
        }
        permuter(n, 0, p, utilise, dom, ref, &nb);
        echec = coupler(n, dom, proprio, &vues);
        if ((nb > 0) != (echec < 0))
            desaccords++;                               /* désaccord sur l'existence */
        if (echec >= 0) {                               /* contrôle de l'ensemble de Hall */
            uint64_t union_des_domaines = dom[echec];
            int ncases = 1;

            for (uint64_t m = vues; m; m &= m - 1) {
                union_des_domaines |= dom[proprio[__builtin_ctzll(m)]];
                ncases++;
            }
            hall_total++;
            if (union_des_domaines == vues && ncases == __builtin_popcountll(vues) + 1)
                hall_ok++;
            continue;
        }
        avec_couplage++;
        filtres += filtrer(n, dom, proprio);
        for (int i = 0; i < n; i++)
            if (dom[i] != ref[i])                       /* retire exactement l'inutile ? */
                desaccords++;
    }
    printf("300000 tirages : %ld avec couplage complet, %ld sans\n",
           avec_couplage, hall_total);
    printf("valeurs retirées par le filtre : %ld\n", filtres);
    printf("ensembles de Hall corrects : %ld sur %ld\n", hall_ok, hall_total);
    printf("désaccords avec la force brute : %ld\n", desaccords);
    return desaccords != 0;
}
```

```
300000 tirages : 96500 avec couplage complet, 203500 sans
valeurs retirées par le filtre : 391264
ensembles de Hall corrects : 203500 sur 203500
désaccords avec la force brute : 0
```

| Vérification | Résultat |
|---|---|
| Un couplage complet existe-t-il ? | Même réponse que la force brute, sur les 300 000 tirages |
| Quand il n'existe pas, l'ensemble de Hall est-il correct ? | 203 500 sur 203 500 : ses cases ont pour domaines réunis exactement les valeurs atteintes, avec une case de plus |
| Après le filtrage, le domaine de chaque case est-il exactement l'ensemble des valeurs qu'elle prend dans au moins un couplage complet ? | Oui pour les 96 500 tirages avec couplage : le filtrage ne retire que l'inutile et retire tout l'inutile |

## Les pièges

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Filtrer sans couplage complet | Le résultat n'a aucun sens : le graphe des valeurs suppose que chaque valeur a un détenteur | Lancer d'abord la recherche de couplage, ne filtrer que si elle réussit |
| Nombre de cases différent du nombre de valeurs | Le graphe est mal formé | Sur une ligne, les cases libres reçoivent les valeurs manquantes : leurs nombres sont égaux ou le conflit est déjà là |
| Flèches dans le mauvais sens | On retire des valeurs utiles : le résultat paraît plausible mais faux | Vérifier à la force brute sur de petits cas, comme plus haut |
| Plus de 64 cases libres ou 64 valeurs | Un masque `uint64_t` ne suffit plus | Limiter le test aux lignes presque remplies, ou passer à des masques plus larges |
| Apprendre chaque retrait comme une clause | La mémoire explose, la recherche se bloque (arène ×19 mesurée) | Empiler les explications à part, les dépiler au retour arrière |
| Filtrer toutes les lignes | Le coût dépasse le gain (24 cases libres : 17 grilles sur 20 résolues contre 20 sur 20) | Régler le seuil de cases libres par la mesure |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Des cases qui doivent prendre des valeurs toutes différentes se modélisent par un graphe biparti ; un couplage complet est une façon valide de les remplir. L'algorithme de Kuhn le cherche par chemins augmentants ; son échec produit un ensemble de Hall qui explique l'impossibilité. Le filtrage de Régin va plus loin : à partir d'un couplage complet, il retire toute valeur qui n'appartient à aucun couplage complet, grâce aux composantes fortement connexes du graphe des valeurs. |
| **Outils utilisables** | Les masques de bits (`uint64_t`, `__builtin_ctzll`) pour des domaines de moins de 64 valeurs, l'algorithme de Tarjan pour les composantes, une référence par force brute pour valider le code, le [papier de Régin](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf) pour la preuve. |
| **Pièges à éviter** | Filtrer sans couplage complet, inverser le sens des flèches, dépasser 64 valeurs avec un seul masque, apprendre chaque retrait comme une clause, appliquer le filtrage à toutes les lignes sans mesurer. |
| **Bonnes pratiques** | Lancer le test sur les lignes presque remplies seulement ; reprendre le couplage précédent plutôt que de repartir de zéro ; empiler les explications à part ; valider chaque algorithme sur de petits cas contre une énumération exhaustive ; régler les seuils par mesure. |
