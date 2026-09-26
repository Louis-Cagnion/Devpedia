---
order: 8
---

# Les solveurs SAT et l'algorithme CDCL

Un **solveur SAT** est un programme générique qui répond à une seule question : « peut-on donner une valeur vrai/faux à chaque variable pour que toutes ces règles soient respectées ? ». On y traduit son problème (puzzle, planning, vérification de circuit... : voir [Encoder un problème en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)), puis on laisse le solveur chercher. Il s'appuie sur le [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes), mais **apprend de chaque échec** : c'est l'algorithme **CDCL**.

Exemple mesuré sur un solveur de puzzle *Skyscraper* : le backtracking avec propagation plafonnait à des grilles 11 × 11, un solveur CDCL écrit pour l'occasion résout des grilles 32 × 32 en moins d'une seconde.

## Le problème SAT : des variables vrai/faux et des clauses

| Terme | Définition | Exemple |
|---|---|---|
| Variable booléenne | Une inconnue qui vaut **vrai** ou **faux** | `a` : « la case 1 contient un 3 » |
| Littéral | Une variable ou sa négation (`¬`, « non ») | `a`, `¬a` |
| Clause | Plusieurs littéraux reliés par **OU** : au moins un doit être vrai | `(¬a ∨ b)` : « si `a` est vrai, alors `b` aussi » |
| Formule en **CNF** (*Conjunctive Normal Form*, forme normale conjonctive) | Plusieurs clauses reliées par **ET** : toutes doivent être vraies | `(¬a ∨ b) ∧ (¬b ∨ ¬c)` |

Le symbole `∨` se lit « ou », `∧` se lit « et ». Une clause comme `(¬a ∨ b)` exprime une règle « si... alors » : elle n'est fausse que si `a` est vrai et `b` faux.

Le problème SAT est **NP-complet** : aucun algorithme connu ne le résout rapidement dans tous les cas (voir [Les problèmes NP-complets](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets)). En pratique pourtant, les solveurs modernes traitent des formules de millions de clauses, parce que les problèmes réels sont très structurés.

## Le format DIMACS : la langue commune des solveurs

Tous les solveurs lisent le même format texte, **DIMACS**. Les variables sont numérotées à partir de 1, un nombre négatif est une négation, et chaque clause se termine par `0` :

```
c a=1 b=2 c=3 d=4 x=5 y=6     <- ligne "c" : commentaire
p cnf 6 5                     <- en-tête : 6 variables, 5 clauses
-1 2 0                        <- (¬a ∨ b)
-1 3 0                        <- (¬a ∨ c)
-2 -3 4 0                     <- (¬b ∨ ¬c ∨ d)
-2 -4 0                       <- (¬b ∨ ¬d)
-5 6 0                        <- (¬x ∨ y)
```

Réponse du solveur [kissat](https://github.com/arminbiere/kissat) sur ce fichier :

```
s SATISFIABLE                 <- une solution existe
v -1 -2 -3 -4 -5 -6 0         <- la solution : toutes les variables à faux
```

Le code de sortie du programme vaut `10` si une solution existe, `20` sinon (`s UNSATISFIABLE`), ce qui permet de l'utiliser depuis un script.

## La propagation unitaire, les niveaux et la trace

Quand tous les littéraux d'une clause sont faux sauf un, ce dernier est **forcé** à vrai : c'est la **propagation unitaire**. Chaque choix libre (une *décision*) ouvre un nouveau **niveau**. La **trace** (*trail*) note chaque affectation, son niveau et sa **raison** (la clause qui l'a forcée).

Sur la formule ci-dessus, le solveur décide d'abord `x = vrai`, puis `a = vrai` :

| Niveau | Affectation | Raison |
|---|---|---|
| 1 | `x = vrai` | décision |
| 1 | `y = vrai` | `(¬x ∨ y)` : `¬x` est faux, donc `y` est forcé |
| 2 | `a = vrai` | décision |
| 2 | `b = vrai` | `(¬a ∨ b)` |
| 2 | `c = vrai` | `(¬a ∨ c)` |
| 2 | `d = vrai` | `(¬b ∨ ¬c ∨ d)` : `¬b` et `¬c` sont faux |
| 2 | **conflit** | `(¬b ∨ ¬d)` : `¬b` et `¬d` sont tous les deux faux |

## Le conflit et l'apprentissage de clause (CDCL)

Un simple backtracking reviendrait au niveau précédent et essaierait `a = faux`. Le **CDCL** (*Conflict-Driven Clause Learning*, apprentissage de clauses dirigé par les conflits) cherche d'abord **pourquoi** le conflit a eu lieu, en remontant les raisons de la trace. À chaque étape, on combine la clause courante avec la raison d'une de ses variables (on appelle cette combinaison une *résolution*) :

| Étape | Clause courante | Remplacée grâce à la raison de... |
|---|---|---|
| Départ | `(¬b ∨ ¬d)` (la clause en conflit) | |
| 1 | `(¬b ∨ ¬c)` | `d`, forcé par `(¬b ∨ ¬c ∨ d)` |
| 2 | `(¬b ∨ ¬a)` | `c`, forcé par `(¬a ∨ c)` |
| 3 | `(¬a)` | `b`, forcé par `(¬a ∨ b)` |

On s'arrête dès qu'il ne reste qu'**un seul** littéral du niveau du conflit : c'est le **premier point d'implication unique** (*1UIP*). La clause obtenue, `(¬a)`, est **apprise** : ajoutée à la formule, elle dit « `a` ne peut jamais être vrai ».

Le solveur revient alors au plus haut niveau qui reste dans la clause apprise, ici le niveau 0 : il annule aussi la décision `x = vrai`, qui n'avait rien à voir avec le conflit. C'est le **retour arrière non chronologique** (*backjumping*). Puis `(¬a)` force immédiatement `a = faux`.

| | Backtracking | CDCL |
|---|---|---|
| Après un échec | Essaie la valeur suivante au niveau précédent | Apprend une clause, puis saute au niveau utile |
| Mémoire des échecs | Aucune : la même impasse peut être revisitée ailleurs | Chaque clause apprise élague toutes les branches où la même cause se reproduirait |
| Retour arrière | Un niveau à la fois | Directement au bon niveau, en sautant les décisions sans rapport |

Les solveurs réels **minimisent** ensuite la clause apprise, en retirant les littéraux déjà impliqués par les autres (technique introduite par MiniSat).

## Deux littéraux surveillés : propager sans tout relire

Sur des millions de clauses, relire chaque clause à chaque affectation serait beaucoup trop lent. Chaque clause **surveille seulement deux** de ses littéraux (*two watched literals*) :

```
Clause (¬b ∨ ¬c ∨ d ∨ e)      surveillés : ¬b et ¬c
  b devient vrai (¬b faux)  -> chercher un autre littéral non faux à surveiller : d
  c devient vrai (¬c faux)  -> chercher un remplaçant : e
  d devient faux            -> plus de remplaçant : e est forcé à vrai
```

Tant qu'aucun des deux littéraux surveillés n'est faux, la clause ne peut ni forcer quoi que ce soit ni être en conflit : on ne la regarde pas. Et au retour arrière, il n'y a **rien à défaire** : des littéraux qui redeviennent libres restent de bons candidats à surveiller.

## Choisir la variable : VSIDS et sauvegarde de phase

| Mécanisme | Principe | Pourquoi |
|---|---|---|
| **VSIDS** (*Variable State Independent Decaying Sum*) | Chaque variable a une **activité**, augmentée quand elle participe à un conflit, puis qui « s'use » avec le temps. On décide toujours sur la plus active. | Concentre la recherche sur la partie difficile du problème, celle qui produit des conflits en ce moment. |
| Décroissance par l'incrément | Au lieu de diminuer toutes les activités à chaque conflit, on **augmente** la valeur ajoutée aux suivants (×1,05 par conflit), et on remet tout à l'échelle avant de dépasser la capacité d'un nombre flottant. | Même effet, pour un coût constant par conflit. |
| Tas binaire | Structure qui donne la variable la plus active en temps logarithmique. | Évite de parcourir toutes les variables à chaque décision. |
| **Sauvegarde de phase** (*phase saving*) | Une variable reprend la dernière valeur qu'elle avait avant d'être annulée. | Après un retour arrière, le solveur reconstruit vite les parties déjà cohérentes. |

## Redémarrer et oublier : Luby et LBD

Un **redémarrage** annule toutes les décisions et repart du niveau 0, **en gardant** les clauses apprises et les activités. Il évite de rester coincé longtemps dans une mauvaise région de l'arbre.

| Stratégie | Quand redémarrer | Mesuré sur le solveur Skyscraper |
|---|---|---|
| **Suite de Luby** | Après 1, 1, 2, 1, 1, 2, 4, 1, 1, 2... fois une unité de conflits (ici 300) | Retenue |
| Glucose | Quand la qualité récente des clauses apprises se dégrade | 2 fois plus lente |
| Aucun redémarrage | Jamais | Toutes les grilles 56 × 56 testées dépassent 90 s |

Les clauses apprises s'accumulent : on en supprime régulièrement la moitié, en gardant les meilleures selon leur **LBD** (*Literal Block Distance*) : le nombre de niveaux différents parmi leurs littéraux. Une clause de LBD 2 relie deux décisions seulement : elle resservira souvent.

## Heuristiques avancées : mesurer avant d'adopter

Les solveurs de pointe ajoutent des dizaines de mécanismes à ceux vus plus haut. Leur effet dépend du problème : un mécanisme qui fait gagner les compétitions SAT peut ralentir un encodage particulier. Voici ceux testés sur le solveur Skyscraper, avec leur effet mesuré.

### Ne décider que sur certaines variables : le branchement restreint

L'[encodage par ordre](/?c=fondamentaux&s=algorithmes&p=encodages-sat#encodage-direct-ou-encodage-par-ordre) du Skyscraper a deux familles de variables par case, `x` (« la case vaut v ») et `y` (« la case vaut au moins v »), plus des variables auxiliaires pour la visibilité. Le **branchement restreint** (*restricted branching*) ne laisse le solveur **décider** que sur les `y` : toutes les autres variables sont fixées par la propagation. C'est la version SAT du choix de [la variable sur laquelle brancher](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#sur-quoi-brancher-une-petite-variable-plutot-qu-une-contrainte-entiere).

| Décisions permises | Grilles 56 × 56 (5 grilles) |
|---|---|
| Sur toutes les variables | 1 grille sur 5 au-delà de 90 s |
| Sur les seules `y` | 7,9 s de moyenne, pire 10 s |
| Sur les `x` et les `y` | 4 fois plus lent que sur les seules `y` |

### VMTF : le dernier conflit en tête de file

**VMTF** (*Variable Move-To-Front*, [Ryan, 2004](https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/2725/b35038871.pdf)) remplace les activités de VSIDS par une **file** : une [liste doublement chaînée](/?c=langages&s=c&p=listes-chainees) de toutes les variables. Après chaque conflit, les variables qui y ont participé passent **en tête**, marquées d'un **horodatage** (un compteur qui augmente à chaque déplacement, pour savoir vite laquelle a bougé le plus récemment). Pour décider, le solveur prend la première variable libre en partant de la tête.

```
tête                                    fin
 x7 <-> x2 <-> x9 <-> x4 <-> x1          avant le conflit
 x1 <-> x4 <-> x7 <-> x2 <-> x9          après un conflit impliquant x4 et x1
```

| | VSIDS | VMTF |
|---|---|---|
| Ce qui est retenu | Une activité par variable, qui s'use avec le temps | L'ordre des derniers conflits |
| Trouver la variable à décider | [Tas binaire](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire) : temps logarithmique | Parcours depuis la tête, repris là où il s'était arrêté |
| Mise à jour après un conflit | Augmenter des activités, réordonner le tas | Déplacer en tête : temps constant |
| Mesuré (grille 48 × 48, un seul processus) | 1,47 s | 1,31 s |

VMTF est le mode « focalisé » des solveurs [kissat](https://github.com/arminbiere/kissat) et CaDiCaL. Dans un portfolio de processus, ce sont presque toujours les copies VMTF qui gagnent (voir la section sur les queues lourdes, plus bas).

### Ce qui a nui ici

| Mécanisme | Idée | Référence | Mesuré ici |
|---|---|---|---|
| Retour arrière chronologique | Après un conflit, ne remonter que d'un niveau au lieu de sauter loin, pour ne pas refaire des dizaines de décisions (ici, 66 à 93 niveaux sautés en moyenne) | Nadel et Ryvchin, [*Chronological Backtracking*](https://doi.org/10.1007/978-3-319-94144-8_7) (2018) | Plus lent (testé avec kissat) |
| Réutilisation de la trace | Au redémarrage, garder les décisions que le solveur reprendrait de toute façon | van der Tak, Ramos et Heule, [*Reusing the Assignment Trail in CDCL Solvers*](https://doi.org/10.3233/sat190082) (2011) | Nulle avec VMTF (rien de réutilisable), neutre à pire avec VSIDS |
| Phases cibles et *rephasing* | Retenir la meilleure affectation partielle rencontrée et y revenir régulièrement | [kissat](https://github.com/arminbiere/kissat) (Biere, 2020) | Grilles 56 × 56 : de 6,8 s à 25 s de moyenne, une grille au-delà de 90 s |
| *Shrinking* | Raccourcir encore les clauses apprises, après la minimisation | [kissat](https://github.com/arminbiere/kissat) | +15 % de temps |

### Simplifier à la racine

Une affectation du niveau 0 n'est jamais annulée : une clause qui contient un littéral vrai au niveau 0 est satisfaite pour toujours, et la garder ne sert qu'à la relire. La **simplification à la racine** (fonction `simplify` de [MiniSat](http://minisat.se/)) retire ces clauses, ainsi que les implications vers un littéral déjà vrai.

| Clause | Au niveau 0, `a` est vrai | Après simplification |
|---|---|---|
| `(a ∨ b)` | Satisfaite pour toujours | Supprimée |
| `(¬a ∨ c)` | La propagation force `c` au niveau 0 : satisfaite aussi | Supprimée |
| `(b ∨ d)` | Ni `b` ni `d` n'est encore fixé | Gardée |

Mesuré avec deux autres retouches du même type : quelques pour cent de temps gagnés, à compteurs de travail identiques.

## Les queues lourdes : quelques instances catastrophiques

Sur des grilles de même taille, la plupart se résolvent vite, mais quelques-unes prennent 100 fois plus de temps : leur temps de résolution suit une distribution **à queue lourde** (*heavy-tailed*). Mesuré sur le solveur Skyscraper en grille 72 × 72, sur 100 grilles :

| Version | Temps médian | Grilles au-delà de 90 s |
|---|---|---|
| Un seul solveur | 13,4 s | 7 |
| 4 copies du solveur lancées en parallèle, chacune avec une part de hasard différente ; la première qui trouve gagne | 9,3 s | 0 |

Redémarrages et hasard contrôlé servent justement à sortir de ces mauvaises trajectoires.

### Le hasard déplace la queue, il ne la réduit pas

Une décision aléatoire consiste à tirer une variable au hasard au lieu de la plus active, avec une petite probabilité fixée (paramètre `random_var_freq` de [MiniSat](http://minisat.se/)). Mesuré sur le solveur Skyscraper en grille 72 × 72, sur 100 grilles :

| Configuration | Grilles au-delà de 90 s |
|---|---|
| Sans randomisation | 4 |
| Avec 3 % de décisions aléatoires | 8, mais pas les 4 mêmes grilles |

Les 4 grilles qui bloquaient sans randomisation se résolvent avec elle, mais 8 autres bloquent à leur tour : une même grille passe ou bloque selon le tirage aléatoire. La queue lourde tient à la trajectoire parcourue, pas à la difficulté intrinsèque de l'instance ; ajouter du hasard la déplace, il ne la réduit pas.

### Le piège d'évaluation : biais de sélection et régression vers la moyenne

Tester une nouvelle heuristique seulement sur les grilles qui bloquaient la configuration de référence la favorise mécaniquement : ces grilles ont été retenues pour leur malchance avec la référence, une configuration différente a statistiquement moins de raisons de subir la même malchance. Ce piège porte un nom en statistiques : la [régression vers la moyenne](https://fr.wikipedia.org/wiki/R%C3%A9gression_vers_la_moyenne) (un échantillon choisi pour un résultat extrême se rapproche de la moyenne quand on le remesure, même sans aucun changement réel).

| Ensemble de test | Résultat mesuré |
|---|---|
| 8 grilles difficiles, choisies parmi celles qui bloquaient la référence | Toutes résolues : la variante paraît excellente |
| 100 grilles, l'ensemble complet | Deux fois plus de dépassements de 90 s qu'avant |

Bonne pratique : toujours revalider une heuristique sur l'ensemble complet des instances, jamais seulement sur le sous-ensemble qui a motivé le changement.

### Diversifier sans détruire l'apprentissage

Deux façons de diversifier cassent ce que le solveur a appris : ajouter du bruit sur les activités VSIDS à chaque redémarrage, ou revenir aux phases initiales au lieu de garder la sauvegarde de phase (voir plus haut). Les deux font bloquer même les grilles faciles, qui n'avaient pourtant besoin d'aucune diversification. La diversification doit porter sur quelques décisions ponctuelles (comme `random_var_freq`), jamais sur ce que le solveur a déjà appris (activités, clauses, phases).

### Portfolio de trajectoires indépendantes : la loi de p^k

Autre remède : lancer plusieurs trajectoires en parallèle avec des graines différentes et garder le résultat du premier processus qui termine (portfolio de processus, [Gomes, Selman & Kautz, *Boosting Combinatorial Search Through Randomization*, AAAI 1998](https://www.cs.cornell.edu/selman/papers/pdf/98.aaai.boost.pdf), mesuré à l'origine sur la complétion de carrés latins). Si chaque exécution bloque indépendamment avec une probabilité *p*, *k* exécutions bloquent toutes ensemble avec une probabilité *p^k* : le risque chute très vite avec le nombre de processus. Avec p = 7/100 (mesuré ici) :

```python
# p : probabilité qu'UNE exécution dépasse 90 s (mesurée : 7 grilles sur 100)
p = 7 / 100
for k in range(1, 5):
    # probabilité que les k processus dépassent TOUS 90 s (indépendants)
    print(f"k={k} processus : p^k = {p ** k:.6f}")
```

```
k=1 processus : p^k = 0.070000
k=2 processus : p^k = 0.004900
k=3 processus : p^k = 0.000343
k=4 processus : p^k = 0.000024
```

Mesuré en grille 72 × 72 sur 100 grilles : 4 processus ([`fork`](/?c=langages&s=c&p=processus), résultat du premier processus reçu par un [tube](/?c=langages&s=c&p=appels-systeme-et-descripteurs) et `poll`, qui attend plusieurs tubes à la fois) passent de 7 dépassements de 90 s à aucun, avec une moyenne de 9,6 s et un pire cas de 16,8 s. À comparer avec une seule réinitialisation complète périodique, dans un seul processus, qui n'en retire que 3 sur 7 : une seule trajectoire reste une seule trajectoire, quel que soit le nombre de redémarrages, alors que des processus réellement indépendants suivent la loi *p^k*.

### Portfolio hétérogène et rendements décroissants

Diversifier aussi les heuristiques de décision, pas seulement les graines aléatoires, renforce encore le portfolio. Mesuré en grille 96 × 96, sur 4 processus :

| Portfolio | Temps moyen (5 grilles 96 × 96) |
|---|---|
| 4 × VSIDS | 67 s |
| 1 × VSIDS + 3 × VMTF (voir plus haut) | 32 s |

Les processus VMTF gagnent de façon très régulière, entre 25 000 et 30 000 conflits. Grâce à ce portfolio hétérogène, la frontière d'une minute de calcul passe de la grille 72 × 72 (avec encore 4 % de blocages) à environ 100 × 100.

Au-delà de 4 à 6 processus, les gains ralentissent puis s'inversent : la bande passante mémoire partagée entre processus finit par coûter plus qu'elle ne rapporte en diversité (8 processus plus lents que 6). Le partage des clauses apprises entre processus (ManySAT, [Hamadi, Jabbour & Sais, 2009](http://www.cril.univ-artois.fr/~jabbour/manysat.htm)) n'aide que si les clauses apprises sont courtes : ici, une résolution complète n'apprend que 2 à 7 clauses unitaires et 11 à 34 clauses binaires (grille 56 × 56) ; les autres clauses apprises sont longues, sans intérêt à les partager.

## Les solveurs de référence

| Solveur | Apport | Lien |
|---|---|---|
| MiniSat (Eén et Sörensson, 2003) | Implémentation courte et claire de tout ce chapitre, la référence pour apprendre | [minisat.se](http://minisat.se/) |
| Glucose (Audemard et Simon, 2009) | Mesure LBD et redémarrages associés | [github.com/audemard/glucose](https://github.com/audemard/glucose) |
| kissat (Armin Biere) | Parmi les meilleurs des compétitions SAT actuelles | [github.com/arminbiere/kissat](https://github.com/arminbiere/kissat) |

Mesuré sur l'encodage du puzzle (grille 48 × 48, 8 millions de clauses) : la configuration par défaut de kissat dépasse le budget, parce que ses simplifications préalables coûtent plus qu'elles ne rapportent sur ce problème volumineux mais facile ; avec l'option `--plain`, qui les désactive, il résout en 2,2 s.

Sources : Marques-Silva et Sakallah, *GRASP* (1996) ; Moskewicz et al., *Chaff* (2001) ; Eén et Sörensson, *An Extensible SAT-solver* (MiniSat, 2003) ; Audemard et Simon, *Predicting Learnt Clauses Quality in Modern SAT Solvers* (Glucose, 2009) ; *Handbook of Satisfiability*, 2ᵉ édition (2021).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un solveur SAT cherche des valeurs vrai/faux qui satisfont une formule en CNF (des clauses OU reliées par ET). Le CDCL ajoute au backtracking l'analyse de chaque conflit : une clause apprise et un retour arrière direct au niveau utile. |
| **Outils utilisables** | Format DIMACS ; solveurs MiniSat, Glucose, kissat ; propagation unitaire avec deux littéraux surveillés ; VSIDS et sauvegarde de phase ; redémarrages de Luby ; tri des clauses apprises par LBD ; branchement restreint, VMTF, simplification à la racine. |
| **Pièges à éviter** | Supprimer les redémarrages (instances bloquées) ; garder toutes les clauses apprises (mémoire et propagation ralenties) ; supposer que les réglages par défaut d'un solveur conviennent à tout problème ; adopter un mécanisme d'un solveur de pointe (phases cibles, retour arrière chronologique) sans le mesurer sur son propre problème. |
| **Bonnes pratiques** | Commencer par un solveur existant sur un fichier DIMACS avant d'écrire le sien ; mesurer sur de nombreuses instances, pas sur une seule, à cause des queues lourdes. |
