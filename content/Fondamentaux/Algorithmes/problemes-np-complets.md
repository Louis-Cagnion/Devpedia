---
order: 11
---

# Les problèmes NP-complets : pourquoi un problème « exponentiel » se résout quand même

Certains problèmes n'ont **aucun algorithme rapide connu** pour tous les cas : on les appelle **NP-complets**. Pourtant, des programmes en résolvent tous les jours des **instances** énormes (une instance est un exemplaire précis du problème : une grille donnée, une formule donnée). Ce chapitre explique ce que veut dire « NP-complet », ce que cette étiquette promet vraiment, et pourquoi elle n'empêche pas de résoudre en pratique.

Exemple fil rouge, mesuré sur un solveur du puzzle *Skyscraper* (une grille n × n de hauteurs d'immeubles, voir [Combinatoire des permutations](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations)) : une grille 72 × 72 offre un nombre de remplissages possibles qui s'écrit avec **7 473 chiffres**, et un [solveur CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) la résout pourtant en environ **2 millions de décisions**, c'est-à-dire de choix libres du solveur (médiane sur 100 grilles : 13 secondes).

## Vérifier est facile, trouver est difficile

| Question | Travail nécessaire pour une grille n × n |
|---|---|
| **Vérifier** : cette grille remplie respecte-t-elle les règles ? | Lire chaque case un nombre fixe de fois : `O(n²)` (voir [la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) |
| **Trouver** : quelle grille respecte les règles ? | Aucune méthode connue qui garantisse un temps raisonnable dans tous les cas |

Vérifier qu'une grille est un [carré latin](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) (chaque valeur une seule fois par ligne et par colonne), en [Python](/?c=langages&s=python&p=python) :

```python
def est_carre_latin(grille):
    n = len(grille)                                  # taille : n lignes de n cases
    attendu = set(range(1, n + 1))                   # l'ensemble {1, 2, ..., n}
    for ligne in grille:                             # chaque ligne...
        if set(ligne) != attendu:                    # ...doit contenir 1..n une fois
            return False                             # une seule erreur suffit à refuser
    for c in range(n):                               # chaque colonne...
        colonne = {grille[r][c] for r in range(n)}   # ...rassemble ses n valeurs
        if colonne != attendu:
            return False
    return True                                      # 2 × n × n cases lues : O(n²)


print(est_carre_latin([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 2, 1]]))
print(est_carre_latin([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 1, 2]]))
```

```
True
False
```

La deuxième grille est refusée : sa dernière ligne place 1 et 2 dans les colonnes 3 et 4, où la ligne 3 les a déjà placés. Même pour une grille 1 000 × 1 000, cette vérification reste instantanée. Trouver la grille, c'est une autre histoire.

## Les classes P et NP

Un algorithme est **polynomial** si son coût est au plus `O(nᵏ)` pour un nombre `k` fixé (`O(n)`, `O(n²)`, `O(n³)`...) : il reste utilisable quand `n` grandit. À l'inverse, un coût **exponentiel** comme `O(2ⁿ)` ou [factoriel](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations#la-factorielle-le-nombre-d-ordres-possibles) comme `O(n!)` devient vite impossible.

| Classe | Définition | Exemples |
|---|---|---|
| **P** | Problèmes qu'on sait **résoudre** en temps polynomial | [Trier un tableau](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), chercher un élément |
| **NP** | Problèmes dont une solution proposée se **vérifie** en temps polynomial | Tous ceux de P, plus SAT, le Sudoku, le Skyscraper |

Le nom NP signifie « polynomial non déterministe » : un problème de NP serait résolu en temps polynomial par une machine théorique qui devinerait toujours le bon choix à chaque étape. Pour une vraie machine, il reste à **chercher** ce bon choix.

Tout problème de P est dans NP (si on sait résoudre vite, on sait vérifier vite). La question inverse, **P = NP ?** (tout ce qui se vérifie vite se résout-il vite ?), n'a toujours pas de réponse : c'est l'un des sept [problèmes du millénaire](https://www.claymath.org/millennium/p-vs-np/) de l'institut Clay, doté d'un million de dollars. La plupart des chercheurs pensent que P ≠ NP.

## NP-complet : les problèmes les plus difficiles de NP

Une **réduction** transforme toute instance d'un problème A en instance d'un problème B, en temps polynomial, de façon à ce que la réponse de B donne celle de A. Résoudre B permet alors de résoudre A : B est « au moins aussi difficile » que A.

Exemple déjà vu sur ce site : [encoder un Skyscraper en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat) est une réduction du Skyscraper vers SAT. Un solveur SAT sait donc résoudre des Skyscraper.

| Terme | Définition | Exemples |
|---|---|---|
| **NP-difficile** | Au moins aussi difficile que **tout** problème de NP (tout problème de NP s'y réduit) | Trouver le plus court circuit du [voyageur de commerce](https://fr.wikipedia.org/wiki/Probl%C3%A8me_du_voyageur_de_commerce) (prouver qu'aucun circuit n'est plus court : on ne sait pas le vérifier vite) |
| **NP-complet** | NP-difficile **et** dans NP | SAT, compléter un carré latin, le Skyscraper |

```
+------------------------------ NP --------------------------------+
|  +--------- P ---------+     +--------- NP-complets ---------+   |
|  | trier un tableau    |     | SAT, Skyscraper,              |   |
|  | chercher un élément |     | compléter un carré latin      |   |
|  +---------------------+     +-------------------------------+   |
+------------------------------------------------------------------+
  (schéma valable si P ≠ NP ; les NP-difficiles comprennent les
   NP-complets et d'autres problèmes, hors de NP)
```

| Résultat | Référence |
|---|---|
| SAT est le premier problème démontré NP-complet | Cook, [*The Complexity of Theorem-Proving Procedures*](https://doi.org/10.1145/800157.805047) (1971) |
| 21 problèmes classiques (coloriage de graphe, sac à dos...) sont NP-complets, par réductions depuis SAT | Karp, [*Reducibility Among Combinatorial Problems*](https://doi.org/10.1007/978-1-4684-2001-2_9) (1972) |
| Compléter un carré latin partiellement rempli est NP-complet | Colbourn, [*The Complexity of Completing Partial Latin Squares*](https://doi.org/10.1016/0166-218X(84)90075-1) (1984) |
| Le Skyscraper (aussi appelé *Building puzzle*) est NP-complet | Iwamoto et Matsui, [*Computational Complexity of Building Puzzles*](https://doi.org/10.1587/transfun.E99.A.1145) (2016) |

Conséquence pratique : si l'on trouvait un algorithme polynomial pour **un seul** problème NP-complet, tous les problèmes de NP deviendraient polynomiaux, par réduction.

## Ce que « NP-complet » ne dit pas : pire cas et cas typique

NP-complet parle du **pire cas** (voir la note sur le pire cas dans [la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) : il existe des instances pour lesquelles aucun algorithme connu n'évite une explosion du temps de calcul. Cela ne dit rien des instances qu'on rencontre réellement.

| « NP-complet » dit | « NP-complet » ne dit pas |
|---|---|
| Aucun algorithme connu n'est rapide sur **toutes** les instances ; si P ≠ NP, aucun ne le sera jamais | Que les instances réelles sont difficiles |
| Chaque méthode connue a des instances sur lesquelles son temps explose | Que la recherche doit parcourir tout l'espace des possibilités |

Taille de l'espace brut d'un Skyscraper, en remplissant chaque ligne par une permutation quelconque (`n!` choix par ligne, donc `(n!)ⁿ` grilles) :

```python
import math

for n in (4, 9, 16, 72):
    chiffres = n * math.log10(math.factorial(n))    # log10((n!)^n) = n × log10(n!)
    print(n, math.floor(chiffres) + 1)              # nombre de chiffres de (n!)^n
```

| n | `(n!)ⁿ` grilles | Commentaire |
|---|---|---|
| 4 | 331 776 | Énumérable en une fraction de seconde |
| 9 | environ 1,1 × 10⁵⁰ (51 chiffres) | À un milliard de grilles par seconde : environ 3 × 10³³ années |
| 16 | environ 1,3 × 10²¹³ (214 chiffres) | |
| 72 | environ 4,6 × 10⁷⁴⁷² (7 473 chiffres) | Résolu en environ 2 millions de décisions |

Le nombre de chiffres se calcule avec le [logarithme](/?c=fondamentaux&s=mathematiques&p=le-logarithme) en base 10, sans jamais calculer le nombre lui-même. L'écart entre 10⁷⁴⁷² et 2 millions vient de ce que chaque décision élimine d'un coup des familles entières de grilles :

| Mécanisme | Ce qu'il élimine |
|---|---|
| [Propagation de contraintes](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduire-les-domaines-avant-meme-d-essayer-la-propagation-de-contraintes) | Toutes les valeurs devenues impossibles après une décision, sans les essayer |
| [Clauses apprises du CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) | Toute branche future qui reproduirait la cause d'un échec déjà rencontré |

## Les transitions de phase : où se cachent les instances difficiles

Pour étudier la difficulté « typique », on tire des [formules SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#le-probleme-sat-des-variables-vrai-faux-et-des-clauses) au hasard : des **formules 3-SAT aléatoires**, où chaque clause contient 3 variables choisies au hasard, chacune niée ou non au hasard. Le seul réglage est le nombre de clauses par variable.

Expérience avec 40 variables et 40 formules par réglage, résolues par un [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) simple sur les clauses ([DPLL](https://doi.org/10.1145/368273.368557), l'ancêtre du CDCL, sans apprentissage) :

```python
import random


def dpll(clauses, affect, compteur):
    compteur[0] += 1                                  # un nœud de l'arbre de recherche
    restantes = []                                    # clauses pas encore satisfaites
    for clause in clauses:
        if any(affect.get(abs(lit)) == (lit > 0) for lit in clause):
            continue                                  # un littéral vrai : clause satisfaite
        libres = [lit for lit in clause if abs(lit) not in affect]
        if not libres:
            return False                              # tous ses littéraux faux : impasse
        restantes.append(libres)                      # ne garder que les littéraux libres
    if not restantes:
        return True                                   # plus rien à satisfaire : solution
    v = abs(min(restantes, key=len)[0])               # variable de la plus courte clause
    for valeur in (True, False):                      # essayer vrai, puis faux
        affect[v] = valeur
        if dpll(restantes, affect, compteur):
            return True
        del affect[v]                                 # retour arrière
    return False


rng = random.Random(1)                                # graine fixe : résultats reproductibles
n = 40                                                # 40 variables
for ratio in (2, 3, 4, 4.3, 5, 6, 8):
    sat = noeuds = 0
    for _ in range(40):                               # 40 formules tirées par ratio
        formule = []
        for _ in range(round(ratio * n)):             # ratio × n clauses de 3 littéraux
            variables = rng.sample(range(1, n + 1), 3)        # 3 variables distinctes
            formule.append([v * rng.choice((1, -1)) for v in variables])  # signes au hasard
        compteur = [0]
        sat += dpll(formule, {}, compteur)
        noeuds += compteur[0]
    print(f"{ratio:>3} clauses par variable : {sat * 100 // 40:3d} % satisfiables, "
          f"{noeuds // 40:4d} nœuds en moyenne")
```

```
  2 clauses par variable : 100 % satisfiables,   46 nœuds en moyenne
  3 clauses par variable : 100 % satisfiables,  126 nœuds en moyenne
  4 clauses par variable :  82 % satisfiables,  898 nœuds en moyenne
4.3 clauses par variable :  65 % satisfiables,  920 nœuds en moyenne
  5 clauses par variable :   7 % satisfiables,  948 nœuds en moyenne
  6 clauses par variable :   0 % satisfiables,  621 nœuds en moyenne
  8 clauses par variable :   0 % satisfiables,  296 nœuds en moyenne
```

| Zone | Formules | Difficulté |
|---|---|---|
| Peu de clauses par variable | Presque toujours de nombreuses solutions : on tombe vite sur l'une d'elles | Facile |
| **Transition** | Environ une chance sur deux d'avoir une solution | **Difficile** : ni solution évidente, ni contradiction rapide |
| Beaucoup de clauses par variable | Presque jamais de solution, et la contradiction apparaît vite | Facile à réfuter |

Ce profil « facile, difficile, facile » s'appelle une **transition de phase**, par analogie avec l'eau qui gèle à une température précise. Pour de grandes formules 3-SAT, le seuil est vers 4,3 clauses par variable ; avec seulement 40 variables comme ici, il est flou et le pic de difficulté s'étale de 4 à 5.

| Problème | Seuil de difficulté mesuré | Référence |
|---|---|---|
| Plusieurs problèmes NP-complets (coloriage de graphe, cycles hamiltoniens...) | Pic de difficulté au point où la probabilité d'avoir une solution passe de 1 à 0 | Cheeseman, Kanefsky et Taylor, [*Where the Really Hard Problems Are*](https://www.ijcai.org/Proceedings/91-1/Papers/052.pdf) (1991) |
| 3-SAT aléatoire | Vers 4,3 clauses par variable | Mitchell, Selman et Levesque, [*Hard and Easy Distributions of SAT Problems*](https://cdn.aaai.org/AAAI/1992/AAAI92-071.pdf) (1992) |
| Compléter un carré latin | Vers 42 % de cases déjà remplies, quelle que soit la taille | Gomes et Selman, [*Problem Structure in the Presence of Perturbations*](https://cdn.aaai.org/AAAI/1997/AAAI97-035.pdf) (1997) |

> **Piège :** évaluer un solveur uniquement sur des instances tirées loin du seuil (toutes faciles) ou uniquement au seuil (toutes difficiles) donne une image fausse de ses performances. Varier la source des instances de test, comme pour [les carrés latins](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme).

## Le théorème de Hall : quand des cases se bloquent entre elles

Une **case** qui n'a plus aucune valeur possible est une contradiction facile à voir. Plus traître : plusieurs cases qui ont chacune des valeurs possibles, mais **pas assez à elles toutes**. Exemple sur une ligne où trois cases vides n'acceptent plus, à cause de leurs colonnes, que ces valeurs :

| Case | Valeurs encore possibles |
|---|---|
| A | 2 ou 5 |
| B | 2 ou 5 |
| C | 2 ou 5 |

Chaque case, prise seule, a le choix. Mais trois cases doivent recevoir trois valeurs **différentes**, et elles n'en ont que deux à se partager : c'est impossible.

Le **théorème des mariages de Hall** ([P. Hall, 1935](https://doi.org/10.1112/jlms/s1-10.37.26)) dit exactement quand une telle attribution existe : on peut donner à chaque case une valeur de sa liste, sans que deux cases reçoivent la même, **si et seulement si** tout groupe de k cases dispose, à elles toutes, d'au moins k valeurs différentes. Le nom vient de la version d'origine : former des couples où chacun accepte son partenaire, sans que deux personnes aient le même.

Ce théorème donne un résultat rassurant sur les carrés latins ([M. Hall, 1945](https://projecteuclid.org/journals/bulletin-of-the-american-mathematical-society/volume-51/issue-6.P1/An-existence-theorem-for-latin-squares/bams/1183506980.full)) : si k lignes **complètes** sont déjà remplies sans répétition, on peut **toujours** compléter le carré entier. Le danger vient des cases remplies **éparpillées**. Grille 4 × 4 trouvée par recherche exhaustive (5 cases remplies) :

```
         col 1  col 2  col 3  col 4
ligne 1    2      1      .      .
ligne 2    .      .      .      4
ligne 3    1      3      .      .
ligne 4    .      .      .      .
```

| Étape | Raisonnement |
|---|---|
| 1 | La ligne 1 doit encore placer 3 et 4 en colonnes 3 et 4. La colonne 4 a déjà un 4 : donc 4 en colonne 3. |
| 2 | La ligne 3 doit encore placer 2 et 4 en colonnes 3 et 4. Même raison : 4 en colonne 3. |
| 3 | La colonne 3 recevrait deux 4 : aucune solution. |

Pourtant, chaque case vide a au moins une valeur possible, et chaque ligne et chaque colonne, prise **seule**, peut être complétée (vérifié par programme). La contradiction n'apparaît qu'en combinant deux lignes et deux colonnes.

C'est le blocage observé sur le solveur Skyscraper : certaines exécutions arrivent à 99,8 % des variables fixées, puis restent bloquées plus d'une minute sur 56 cases éparpillées dans 7 lignes. Ajouter au solveur un test de Hall sur les lignes et colonnes presque pleines (au plus 16 cases libres) détecte ces impasses plus tôt : mesuré en grille 104 × 104 sur les mêmes 18 exécutions (9 grilles, 2 réglages du hasard chacune), 15 aboutissent dans le budget fixé avec ce test, contre 8 sans.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | NP regroupe les problèmes dont une solution se vérifie vite ; les NP-complets sont les plus difficiles de NP (SAT, carré latin, Skyscraper). NP-complet décrit le pire cas : les instances réelles se résolvent souvent grâce à la propagation et à l'apprentissage, et les instances aléatoires difficiles se concentrent près d'une transition de phase. |
| **Outils utilisables** | Réduction vers SAT puis solveur SAT ; logarithme pour estimer la taille d'un espace de recherche ; théorème de Hall pour détecter qu'un groupe de cases n'a pas assez de valeurs à se partager. |
| **Pièges à éviter** | Conclure « NP-complet, donc impossible en pratique » ; juger un solveur sur des instances toutes faciles ou toutes au seuil ; ne vérifier les contradictions que case par case. |
| **Bonnes pratiques** | Vérifier une solution avec un programme séparé, simple et polynomial ; mesurer sur des instances de sources variées ; chercher les contradictions entre groupes de cases, pas seulement sur une case isolée. |
