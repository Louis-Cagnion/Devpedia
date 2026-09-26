---
order: 9
---

# Encoder un problème en SAT

Un [solveur SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) ne connaît que des variables vrai/faux et des clauses. **Encoder** un problème, c'est le traduire dans ce langage. Il existe presque toujours plusieurs traductions correctes, et le choix change la vitesse de résolution d'un facteur 10 ou plus.

Exemple fil rouge : le puzzle **Skyscraper**. Une grille n × n contient des immeubles de hauteur 1 à n, chaque hauteur une seule fois par ligne et par colonne. Un indice au bord d'une ligne dit combien d'immeubles on voit depuis ce côté : un immeuble cache tous les plus petits situés derrière lui.

```
indice 3 ->  1  2  4  3      on voit 1, puis 2, puis 4 (3 est caché par 4) : 3 immeubles
```

## Encodage direct ou encodage par ordre

| Encodage | Variables pour une case de hauteur 1 à 4 | Ce qu'une variable affirme |
|---|---|---|
| **Direct** | `x1, x2, x3, x4` | `x3` : « la case vaut exactement 3 » |
| **Par ordre** | `y2, y3, y4` | `y3` : « la case vaut **au moins** 3 » |

L'encodage par ordre a besoin de clauses « échelle » : si la case vaut au moins 4, elle vaut au moins 3 (`¬y4 ∨ y3`), et ainsi de suite. Les deux encodages peuvent cohabiter, reliés par des **clauses de canal** (*channeling*) : `x3` est vrai exactement quand `y3` est vrai et `y4` faux.

Pourquoi c'est utile ici : la visibilité est une affaire de **comparaisons** (« cet immeuble est-il plus haut que tous ceux d'avant ? »). Avec l'encodage par ordre, « plus haut que 3 » est une seule variable, partagée par les quatre directions de vue au lieu d'être recalculée par chacune.

| Encodage de la visibilité | Grille 16 × 16 |
|---|---|
| Direct | 0,42 s |
| Par ordre, partagé par les 4 directions | 0,03 s (13 fois plus rapide) |

## « Au moins un » et « au plus un »

Dans une ligne, chaque hauteur apparaît **au moins une fois** (ALO, *at least one*) et **au plus une fois** (AMO, *at most one*). « Au moins un » tient en une seule clause : `(a ∨ b ∨ c ∨ d)`. « Au plus un » se traduit de plusieurs façons :

```python
from itertools import combinations

def au_plus_un_paires(xs):
    """Une clause (¬a ∨ ¬b) pour chaque paire de variables."""
    return [[-a, -b] for a, b in combinations(xs, 2)]  # -a : littéral ¬a, comme en DIMACS

print(au_plus_un_paires([1, 2, 3]))  # [[-1, -2], [-1, -3], [-2, -3]]
```

| Encodage de « au plus un » | Clauses pour 100 variables | Propagation |
|---|---|---|
| Par paires | 4 950 (n(n-1)/2) | Maximale : dès qu'une variable devient vraie, toutes les autres sont forcées à faux en une étape |
| Compact (échelle, compteur) | environ 300 | Passe par des variables auxiliaires : plusieurs étapes de propagation |

Plus compact ne veut pas dire plus rapide : sur le solveur Skyscraper, l'encodage compact était **50 % plus lent** que les paires, parce que chaque déduction demandait plus d'étapes. La bonne réponse dépend du problème : il faut mesurer.

## Compter : le compteur séquentiel

« Exactement k immeubles visibles » est une **contrainte de cardinalité** : exactement k variables vraies parmi n. Le **compteur séquentiel** (Sinz, 2005) ajoute des variables auxiliaires `s[i][j]` = « parmi les i premières variables, au moins j sont vraies », comme un compteur qu'on fait avancer case après case :

```python
def au_plus_k_compteur(xs, k, prochaine_var):
    """Clauses « au plus k vraies parmi xs », et le prochain numéro de variable libre."""
    n = len(xs)
    # s[i][j] : au moins j+1 vraies parmi x1..x(i+1)
    s = [[prochaine_var + i * k + j for j in range(k)] for i in range(n)]
    clauses = []
    for i in range(n):
        # xi vraie => au moins 1 vraie jusqu'ici
        clauses.append([-xs[i], s[i][0]])
        if i > 0:
            # le compte ne redescend jamais
            for j in range(k):
                clauses.append([-s[i - 1][j], s[i][j]])
            # xi vraie => le compte avance de 1
            for j in range(1, k):
                clauses.append([-xs[i], -s[i - 1][j - 1], s[i][j]])
            # déjà k vraies : xi est interdite
            clauses.append([-xs[i], -s[i - 1][k - 1]])
    return clauses, prochaine_var + n * k
```

Vérifié par force brute sur 5 variables et k = 2 : les 21 clauses produites (avec 10 variables auxiliaires) acceptent exactement les combinaisons où au plus 2 variables sont vraies. Pour « exactement k », on ajoute l'autre sens (« au moins k »). Une alternative connue est le **totalizer** (Bailleux et Boufkhad, 2003), qui compte par un arbre de petits compteurs au lieu d'une chaîne.

## Ajouter des clauses redondantes

Une **clause redondante** (ou *implicite*) se déduit déjà des autres : elle ne change pas l'ensemble des solutions. Elle aide pourtant le solveur, parce qu'elle lui donne directement une déduction qu'il aurait sinon dû redécouvrir par la recherche.

Exemple : les **règles de bord** du Skyscraper. Avec l'indice k sur le bord d'une ligne de n cases, la case à la position d (en partant de ce bord, d = 1 pour la première) vaut au plus n − k + d. Vérifié sur toutes les lignes de 4 cases avec l'indice 3 :

| Case | Hauteurs possibles | Règle : au plus 4 − 3 + d |
|---|---|---|
| 1 | 1, 2 | 2 |
| 2 | 1, 2, 3 | 3 |
| 3 | 1 à 4 | 4 |

Chaque règle devient des **clauses unitaires** (un seul littéral, par exemple « la case 1 ne vaut pas 3 »), vraies avant toute recherche. Mesuré sur le solveur Skyscraper : 2,4 fois plus rapide (grille 13 × 13 : 0,30 → 0,13 s). Autre fait redondant ajouté sans coût : le plus haut immeuble parmi les i premières cases d'une ligne mesure au moins i, puisqu'elles ont toutes des hauteurs différentes.

## Nommer une sous-formule : variables auxiliaires définitionnelles

Une contrainte comme « la case i est visible » se réécrit en une longue formule (elle dépend de toutes les cases situées avant). La recopier telle quelle à chaque fois où elle sert ferait exploser la taille de l'encodage. La **[transformation de Tseitin](https://doi.org/10.1007/978-3-642-81955-1_28)** (1968) évite cela : on invente une nouvelle variable qui **porte le nom** de la sous-formule, avec des clauses qui la forcent à valoir la même chose que ce qu'elle nomme. Ces variables n'existaient pas dans l'énoncé du problème : elles sont **définitionnelles**, ajoutées uniquement pour raccourcir l'encodage.

```python
def clauses_tseitin_et(p, a, b):
    """p <-> (a et b) : 3 clauses qui définissent p, encodage de Tseitin."""
    return [[-p, a], [-p, b], [p, -a, -b]]  # p vraie ssi a et b vraies
```

Vérifié par force brute sur les 8 combinaisons de a, b, p : les 3 clauses acceptent exactement les cas où `p == (a et b)`, sortie réelle `8/8 lignes d'accord entre les clauses et p == (a et b)`. Dans le solveur Skyscraper, deux sous-formules sont nommées ainsi : « maximum des hauteurs vues parmi les i premières cases d'une ligne » et « la case i est visible ». Sans ces deux familles de variables auxiliaires, chaque contrainte de visibilité redeviendrait une formule de taille proportionnelle au nombre de cases avant elle, au lieu d'une poignée de clauses reliées à une variable partagée : à n = 72, ces variables définitionnelles représentent 68 % du total des variables de l'encodage.

## Clauses implicites : retrouvées par calcul plutôt que stockées

Certaines familles de clauses ont une **structure régulière** : leurs littéraux se déduisent d'un indice (numéro de case, hauteur, position dans la ligne) par une formule simple. Les stocker une par une gaspille de la mémoire pour une information qui pourrait se recalculer. Une **clause implicite** n'est donc jamais écrite dans un tableau : elle est reconstruite au moment où le solveur en a besoin, par calcul d'indices.

Cela complique un point précis : quand le solveur déduit qu'une variable est vraie, il doit retenir **pourquoi** (la clause qui l'a forcée), pour reconstruire ce raisonnement plus tard pendant l'analyse du conflit. Si la clause n'est pas stockée, cette raison doit elle aussi se coder de façon compacte : sur 32 bits, quelques bits de poids fort désignent la **famille** de clause concernée et les bits restants portent le numéro d'une **variable d'ancrage**, à partir de laquelle toute la clause se recalcule.

| Approche | Ce qui est stocké | Mémoire à n = 72 | Vitesse |
|---|---|---|---|
| Clauses énumérées | Chaque littéral de chaque clause régulière | 674 Mo | référence |
| Clauses implicites (famille + ancrage) | Un code sur 32 bits par raison, la clause se recalcule | 263 Mo | 1,5 fois plus rapide |

## Propagateurs et génération paresseuse de clauses

Un **propagateur** est du code dédié à une contrainte globale (par exemple « toutes ces variables prennent des valeurs différentes ») : au lieu de traduire la contrainte en clauses à l'avance, le solveur exécute directement l'algorithme qui sait en déduire des conséquences. Le propagateur ne produit une **clause d'explication** (pourquoi telle variable a été forcée) que si l'[analyse du conflit](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) en a besoin : la traduction en clauses se fait donc à la demande plutôt que d'un coup au départ, d'où le nom de **génération paresseuse de clauses** (*[Lazy Clause Generation](https://doi.org/10.1007/s10601-008-9064-x)*, Ohrimenko, Stuckey et Codish, 2009). Les clauses implicites de la section précédente en sont une forme simple, écrite à la main pour une seule contrainte ; la génération paresseuse de clauses généralise l'idée à n'importe quelle contrainte globale via un propagateur. C'est le principe des solveurs hybrides qui combinent SAT et programmation par contraintes, comme [Chuffed](https://github.com/chuffed/chuffed) ou le solveur CP-SAT d'[OR-Tools](https://github.com/google/or-tools).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un même problème s'encode de plusieurs façons correctes, avec des écarts de vitesse d'un facteur 10 ou plus. L'encodage par ordre (« au moins v ») convient aux comparaisons ; « au plus un » et les comptages ont chacun plusieurs encodages. Une variable auxiliaire peut nommer une sous-formule (Tseitin) ; une clause à structure régulière peut rester implicite (retrouvée par calcul) ; un propagateur peut différer la traduction en clauses jusqu'à ce qu'une explication soit demandée (génération paresseuse de clauses). |
| **Outils utilisables** | Encodage direct et par ordre, clauses de canal ; « au plus un » par paires ou compact ; compteur séquentiel et totalizer pour les cardinalités ; clauses redondantes (unitaires si possible) ; variables auxiliaires définitionnelles ; clauses implicites (raison codée famille + ancrage) ; propagateurs et génération paresseuse de clauses. |
| **Pièges à éviter** | Choisir l'encodage le plus compact sans mesurer (propagation plus lente) ; recalculer dans chaque contrainte une information qu'une variable partagée pourrait porter ; stocker une clause à structure régulière plutôt que de la recalculer. |
| **Bonnes pratiques** | Vérifier un encodage par force brute sur de petites tailles ; ajouter les déductions faciles sous forme de clauses unitaires ; comparer les encodages sur de nombreuses instances ; réserver les clauses implicites et les propagateurs aux familles vraiment régulières, mesurées avant et après. |
