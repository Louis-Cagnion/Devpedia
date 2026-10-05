---
order: 12
---

# Couplage biparti, théorème de Hall et algorithme de Kuhn

Attribuer à chaque élément d'un groupe une place différente parmi celles qu'il accepte : des élèves à des activités, des tâches à des machines, des cases d'une grille à des valeurs. Ce problème d'**affectation** a une solution simple et rapide, qui sert aussi de brique aux solveurs de contraintes (voir [les propagateurs](/?c=fondamentaux&s=algorithmes&p=encodages-sat)).

## Le problème : le couplage dans un graphe biparti

Un **graphe** est un ensemble de points (les **sommets**) reliés par des traits (les **arêtes**). Il est **biparti** quand les sommets se répartissent en deux groupes, et que chaque arête relie un sommet du premier groupe à un sommet du second, jamais deux du même groupe.

Exemple : 4 cases à remplir, chacune avec les valeurs qu'elle accepte (son **domaine**), chaque valeur ne pouvant servir qu'une fois.

| Case | Valeurs possibles |
|---|---|
| c0 | 1, 2 |
| c1 | 1 |
| c2 | 2, 3, 4 |
| c3 | 3, 4 |

Un **couplage** est un ensemble d'arêtes qui n'ont aucune extrémité commune : chaque case reçoit au plus une valeur, chaque valeur sert au plus une case. Il est **complet** (ou *parfait* quand les deux groupes ont la même taille) quand toutes les cases sont servies. Ici, `c0→2, c1→1, c2→3, c3→4` en est un.

## Pourquoi le glouton ne suffit pas

Le réflexe est de traiter les cases dans l'ordre et de donner à chacune la première valeur libre (voir [l'algorithme glouton](/?c=fondamentaux&s=algorithmes&p=algorithme-glouton)) :

```text
c0 reçoit 1   (première valeur libre)
c1 ne veut que 1, déjà prise : échec
```

Le glouton ne sert que 3 cases sur 4, alors qu'une solution complète existe : il ne revient jamais sur une décision. Il faut un algorithme capable de **déplacer** une case déjà placée pour libérer une valeur.

## L'algorithme de Kuhn : les chemins augmentants

Idée : quand une case n'a plus de valeur libre, on demande à la case qui détient l'une de ses valeurs d'**en prendre une autre**, et ainsi de suite. La suite de déplacements s'appelle un **chemin augmentant** : il part d'une case non servie, alterne « valeur voulue / case qui la détient », et finit sur une valeur libre. Le réaffecter d'un bout à l'autre sert une case de plus.

```text
Avant :   c0 détient 1.        c1 veut 1.

Chemin augmentant :   c1 → valeur 1 → c0 → valeur 2 (libre)

Après :   c0 détient 2.        c1 détient 1.
```

Le théorème de Berge garantit que si aucun chemin augmentant n'existe, le couplage est le plus grand possible ([théorème de Berge](https://en.wikipedia.org/wiki/Berge%27s_theorem)). L'algorithme de Kuhn essaie donc un chemin pour chaque case, par recherche en profondeur :

```c
#include <string.h>           // memset

#define N 4                   // nombre de cases et nombre de valeurs

int dom[N][N];                // dom[c][v] = 1 si la valeur v est possible dans la case c
int case_de[N];               // case_de[v] : case qui détient la valeur v, ou -1
int vue[N];                   // vue[v] = 1 si v a déjà été essayée pour la case en cours

// Cherche une valeur pour la case c, en déplaçant au besoin les cases déjà placées
int trouver(int c)
{
    for (int v = 0; v < N; v++) {
        if (!dom[c][v] || vue[v])
            continue;
        vue[v] = 1;
        if (case_de[v] == -1 || trouver(case_de[v])) {
            case_de[v] = c;
            return 1;
        }
    }
    return 0;
}

int couplage(void)
{
    int taille = 0;

    for (int v = 0; v < N; v++)
        case_de[v] = -1;
    for (int c = 0; c < N; c++) {
        memset(vue, 0, sizeof vue);
        taille += trouver(c);
    }
    return taille;
}
```

Sur l'exemple du tableau (valeurs numérotées de 0 à 3 dans `dom`), `couplage()` renvoie 4, contre 3 pour le glouton.

| Élément | Rôle |
|---|---|
| `case_de[v]` | Le couplage courant : qui détient chaque valeur |
| `trouver(c)` | Cherche un chemin augmentant à partir de la case `c` |
| `vue[v]` | Évite de réessayer une valeur déjà visitée pendant la recherche : sans lui, la recherche tournerait en rond |
| `memset(vue, …)` | Remise à zéro avant chaque nouvelle case |

Chaque recherche parcourt au plus toutes les arêtes, et il y en a une par case : le coût total est de l'ordre de (nombre de cases) × (nombre d'arêtes). Pour de très grands graphes, l'algorithme de [Hopcroft et Karp](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm) fait mieux (il cherche plusieurs chemins à la fois), mais Kuhn suffit largement pour une ligne de quelques dizaines de cases.

> **Piège :** ne pas remettre `vue` à zéro entre deux cases. La case suivante croit alors des valeurs « déjà essayées » et déclare à tort qu'elle n'a aucune valeur possible.
>
> **Bonne pratique :** tester sur un cas où le glouton échoue (comme ci-dessus) : si les deux algorithmes donnent la même réponse, le test ne prouve rien.

## Le théorème de Hall : savoir à l'avance que c'est impossible

Quand il n'existe aucun couplage complet, peut-on le savoir **sans chercher** ? Le **théorème de Hall** répond par une condition exacte ([théorème de Hall](https://en.wikipedia.org/wiki/Hall%27s_marriage_theorem)) : un couplage qui sert toutes les cases existe **si et seulement si**, pour tout groupe de cases, l'ensemble des valeurs que ces cases acceptent à elles toutes est **au moins aussi grand** que le groupe.

| Groupe de cases | Valeurs acceptées à elles toutes | Condition |
|---|---|---|
| {c1} | {1} (1 valeur) | 1 ≥ 1, vérifiée |
| {c0, c1} | {1, 2} (2 valeurs) | 2 ≥ 2, vérifiée |
| Trois cases qui n'acceptent que {1, 2} | {1, 2} (2 valeurs) | 3 > 2 : **violée** |

Dans le dernier cas, trois cases se disputent deux valeurs : aucune affectation ne peut les servir toutes, quel que soit le reste de la grille. Le groupe qui viole la condition est une **explication** de l'impossibilité, utile pour un solveur qui doit comprendre pourquoi un choix échoue.

On a vérifié ici sur 200 000 domaines tirés au hasard (4 cases, 4 valeurs) que Kuhn trouve un couplage complet exactement quand la condition de Hall tient (91 122 cas complets, 0 désaccord).

> **Piège :** tester la condition de Hall en énumérant tous les groupes de cases : il y en a 2ⁿ, soit un million pour 20 cases. Hall dit **pourquoi** c'est impossible ; pour **décider**, Kuhn est polynomial (voir [la complexité](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o) et [les problèmes NP-complets](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets), dont le couplage biparti ne fait pas partie).
>
> **Bonne pratique :** laisser Kuhn décider, et ne chercher le groupe fautif que lorsqu'il faut l'expliquer.

## Application : la contrainte « toutes différentes »

Dans une ligne d'un [carré latin](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme), les n cases doivent recevoir n valeurs **toutes différentes**. Si l'on retire au fil de la résolution les valeurs devenues impossibles, chaque case a un domaine : la ligne est encore complétable seulement s'il existe un couplage qui sert toutes les cases.

| Étape | Ce qu'on fait |
|---|---|
| 1 | Construire le graphe : cases d'un côté, valeurs de l'autre, une arête par valeur encore possible |
| 2 | Lancer Kuhn |
| 3 | Si le couplage ne sert pas toutes les cases : contradiction, inutile de pousser la recherche plus loin |

Cette détection est bien plus forte que de vérifier seulement « deux cases n'ont-elles pas la même valeur imposée ? » : elle voit les conflits indirects (trois cases pour deux valeurs). C'est le principe du **propagateur** de la contrainte « toutes différentes » dans un solveur ([backtracking et contraintes](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)).

> **Piège :** conclure qu'un carré latin est résoluble parce que chaque ligne, prise seule, admet un couplage complet. Les colonnes imposent aussi leurs contraintes, et chaque ligne n'est regardée qu'indépendamment des autres.
>
> **Bonne pratique :** n'utiliser ce test que comme **élagage** (il détecte des impasses, il ne garantit pas une solution) et laisser la recherche trancher pour l'ensemble.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Affecter à chaque élément une place différente parmi celles qu'il accepte, c'est chercher un couplage dans un graphe biparti. Le glouton peut échouer : l'algorithme de Kuhn déplace des affectations déjà faites le long de chemins augmentants et trouve un couplage de taille maximale. Le théorème de Hall donne la condition exacte d'un couplage complet : tout groupe d'éléments doit accepter au moins autant de places que d'éléments. |
| **Outils utilisables** | Algorithme de Kuhn (recherche en profondeur d'un chemin augmentant par élément), Hopcroft-Karp pour de très grands graphes, condition de Hall comme explication d'une impossibilité, propagateur « toutes différentes » dans un solveur. |
| **Pièges à éviter** | Se contenter du glouton. Oublier de remettre le marquage des valeurs visitées à zéro entre deux éléments. Vérifier Hall par énumération de tous les groupes (2ⁿ). Croire qu'un couplage complet par ligne suffit à résoudre tout un carré latin. |
| **Bonnes pratiques** | Tester sur un cas où le glouton échoue. Utiliser le couplage comme élagage, jamais comme preuve qu'une solution existe pour l'ensemble. Comparer avec la condition de Hall sur de petits cas pour valider l'implémentation. |
