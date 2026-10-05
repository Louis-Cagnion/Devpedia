---
order: 11
---

# Comparer deux réglages : appariement, test du signe et comparaisons multiples

« Ce réglage est-il meilleur que l'autre ? » La question paraît simple, mais un chronomètre ou un compteur ne répond que sur **un cas** : une grille, une graine, une exécution. Ce chapitre montre comment conclure honnêtement à partir de plusieurs cas, avec les mesures réelles de la recherche sur le [solveur Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) : comparer chaque cas avec lui-même, mesurer l'écart avec le test du signe, ne pas se laisser tromper par un grand nombre de comparaisons, et ne pas juger un réglage sur les cas qui ont servi à le choisir.

Vocabulaire : un **réglage** est une façon de lancer le programme (une option, un seuil) ; une **grille** est un cas de test ; une **graine** est le nombre qui initialise le hasard du solveur : deux graines donnent deux parcours différents de la même grille.

## Pourquoi une moyenne ne suffit pas

| Source de variation | Ordre de grandeur mesuré |
|---|---|
| Même programme, même grille, deux chronométrages | ±15 % de temps |
| Deux tours de mesure alternés du même binaire | Jusqu'à 3,6 % d'écart |
| Même grille, deux graines | Résolue dans un cas, bloquée dans l'autre |
| Compteur de propagations, même programme et même graine | Identique à chaque exécution |

Deux conséquences :

| Règle | Pourquoi |
|---|---|
| Comparer sur des **compteurs de travail** (propagations, conflits) plutôt que sur le temps | Un compteur ne bouge pas d'une exécution à l'autre (voir [comparer sur des compteurs de travail](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparer-sur-des-compteurs-de-travail-pas-seulement-sur-le-temps) et [mesurer en tours alternés](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#mesurer-en-tours-alternes)) |
| Ne pas se fier à une moyenne qui contient des échecs | Une grille non résolue compte pour le budget entier (400 millions de propagations) : la moyenne dépend du budget choisi, pas seulement du solveur. À 64 × 64, 187 millions de propagations en moyenne sans le filtrage de Régin et 97 millions avec, mais 12 grilles sur 40 comptent pour 400 millions dans le premier cas |

## L'appariement : chaque grille contre elle-même

Comparer les moyennes de deux réglages mélange deux choses : la différence entre les réglages et la différence entre les grilles. L'**appariement** retire la seconde : chaque grille est lancée avec les deux réglages et on compare le **couple** de résultats. Pour un résultat « résolue ou non », chaque grille tombe dans l'une de quatre cases :

| | Résolue avec B | Non résolue avec B |
|---|---|---|
| **Résolue avec A** | Concordante : ne dit rien sur le sens de l'écart | **Discordante** : A gagne |
| **Non résolue avec A** | **Discordante** : B gagne | Concordante : ne dit rien |

Seules les grilles **discordantes** informent sur la comparaison.

## Le test du signe

Si les deux réglages étaient équivalents, chaque grille discordante irait d'un côté ou de l'autre comme une pièce de monnaie (voir [les probabilités](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). Le **test du signe** calcule la probabilité d'obtenir, par hasard seul, un écart au moins aussi net que celui observé : c'est la **valeur p**. Elle ne dit pas « B est meilleur avec telle probabilité » : elle dit seulement à quel point les données seraient **surprenantes** si A et B étaient équivalents.

Données réelles : 40 grilles de 64 × 64, sans puis avec le filtrage de Régin (voir [le filtrage de Régin](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin)) :

```python
from math import comb

# Une lettre par grille (64 x 64, mêmes 40 grilles) : 1 = résolue, 0 = non résolue
sans_regin = "1111111110111110101010010011011111010011"
avec_regin = "1111111111111111111111111111111111111101"


def test_du_signe(pour, contre):
    """Probabilité d'un écart au moins aussi net, si les deux réglages étaient équivalents."""
    n = pour + contre                       # seules les grilles discordantes comptent
    k = max(pour, contre)
    unilateral = sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n
    return unilateral, min(1.0, 2 * unilateral)


def comparer(debut, fin):
    """Compare les deux réglages sur les grilles debut à fin (non comprise)."""
    a, b = sans_regin[debut:fin], avec_regin[debut:fin]
    deux = sum(x == "1" and y == "1" for x, y in zip(a, b))
    pour = sum(x == "0" and y == "1" for x, y in zip(a, b))      # seulement avec Régin
    contre = sum(x == "1" and y == "0" for x, y in zip(a, b))    # seulement sans
    aucune = len(a) - deux - pour - contre
    unilateral, bilateral = test_du_signe(pour, contre)
    print(f"grilles {debut + 1:2}-{fin:2} : deux {deux:2}, seulement avec {pour:2}, "
          f"seulement sans {contre}, aucune {aucune} ; "
          f"p = {unilateral:.4f} (unilatéral), {bilateral:.4f} (bilatéral)")


comparer(0, 40)
comparer(0, 20)
comparer(20, 40)
```

```
grilles  1-40 : deux 27, seulement avec 12, seulement sans 1, aucune 0 ; p = 0.0017 (unilatéral), 0.0034 (bilatéral)
grilles  1-20 : deux 16, seulement avec  4, seulement sans 0, aucune 0 ; p = 0.0625 (unilatéral), 0.1250 (bilatéral)
grilles 21-40 : deux 11, seulement avec  8, seulement sans 1, aucune 0 ; p = 0.0195 (unilatéral), 0.0391 (bilatéral)
```

| Lecture | Valeur |
|---|---|
| 40 grilles : 12 gagnées par Régin, 1 perdue | `p = 0,0034` (bilatéral) : très improbable par hasard |
| Grilles 1 à 20 seules : 4 contre 0 | `p = 0,125` : trop peu de grilles pour conclure |
| Grilles 21 à 40 seules : 8 contre 1 | `p = 0,039` : sous 5 %, mais loin de 0,0034 |

Deux précisions :

| Précision | Explication |
|---|---|
| **Unilatéral ou bilatéral** | Le test unilatéral n'attend un écart que dans un sens (Régin meilleur) ; le bilatéral accepte les deux sens. À défaut de raison de prévoir le sens avant de mesurer, le bilatéral (le double) est le choix prudent |
| **Les 40 grilles mélangent deux rôles** | Le seuil de Régin retenu (`REGINK=16`) avait été choisi en regardant les grilles 1 à 20 parmi plusieurs réglages. Pour juger honnêtement, il faut des grilles que le choix n'a pas vues : 8 contre 1 sur les grilles 21 à 40, soit `p = 0,039`, un résultat plus fragile que les `0,0034` des 40 grilles regroupées |

## Plusieurs comparaisons à la fois

Un seuil de 5 % veut dire : une fois sur vingt, un écart « significatif » apparaît **par hasard**. Avec une seule comparaison, c'est acceptable ; avec sept réglages comparés à la même référence, il y a bien plus de chances qu'au moins un paraisse significatif sans l'être. La **correction de Bonferroni** exige alors de chaque comparaison un seuil divisé par le nombre de comparaisons (ici `0,05 / 7 = 0,0071`).

```python
from math import comb

reference = "1111111110111110101010010011011111010011"   # 40 grilles, sans Régin

# Sept variantes du même mécanisme, comparées à la même référence (1 = grille résolue)
variantes = {
    "REGIN=1, toutes les lignes (grilles 1-20)":  ("11111110110111111111", 0),
    "REGINMAX=96 (grilles 1-20)":                 ("11011111111111111111", 0),
    "REGINMAX=128 (grilles 1-20)":                ("11110011111111111001", 0),
    "REGINMAX=192 (grilles 1-20)":                ("11111110111101101111", 0),
    "REGINK=24 (grilles 1-20)":                   ("11101111111111111001", 0),
    "REGINK=16 (grilles 1-20)":                   ("11111111111111111111", 0),
    "REGINK=12 (grilles 21-40)":                  ("11011110111111111111", 20),
}


def p_bilateral(pour, contre):
    n, k = pour + contre, max(pour, contre)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n)


seuil = 0.05 / len(variantes)                                # correction de Bonferroni
print(f"seuil par comparaison : {seuil:.4f}")
for nom, (resultat, debut) in variantes.items():
    ref = reference[debut:debut + 20]                        # mêmes grilles
    pour = sum(r == "0" and v == "1" for r, v in zip(ref, resultat))
    contre = sum(r == "1" and v == "0" for r, v in zip(ref, resultat))
    p = p_bilateral(pour, contre)
    drapeau = "< 0,05" if p < 0.05 else ""
    print(f"{nom:44} {pour} contre {contre}   p = {p:.3f}   {drapeau}")

# Et si les sept variantes étaient toutes équivalentes à la référence ?
import random

random.seed(5)
campagnes, alertes_5, alertes_bonferroni = 2000, 0, 0
for _ in range(campagnes):
    ps = []
    for _ in range(len(variantes)):
        pour = contre = 0
        for _ in range(20):                                  # 20 grilles, même chance
            a, b = random.random() < 0.7, random.random() < 0.7
            pour += b and not a
            contre += a and not b
        ps.append(p_bilateral(pour, contre))
    alertes_5 += min(ps) < 0.05                              # une variante « significative »
    alertes_bonferroni += min(ps) < seuil
print(f"fausses alertes : {alertes_5 / campagnes:.1%} des campagnes à 0,05, "
      f"{alertes_bonferroni / campagnes:.1%} avec le seuil {seuil:.4f}")
```

```
seuil par comparaison : 0.0071
REGIN=1, toutes les lignes (grilles 1-20)    4 contre 2   p = 0.688   
REGINMAX=96 (grilles 1-20)                   4 contre 1   p = 0.375   
REGINMAX=128 (grilles 1-20)                  3 contre 3   p = 1.000   
REGINMAX=192 (grilles 1-20)                  3 contre 2   p = 1.000   
REGINK=24 (grilles 1-20)                     3 contre 2   p = 1.000   
REGINK=16 (grilles 1-20)                     4 contre 0   p = 0.125   
REGINK=12 (grilles 21-40)                    7 contre 1   p = 0.070   
fausses alertes : 13.9% des campagnes à 0,05, 1.2% avec le seuil 0.0071
```

| Observation | Lecture |
|---|---|
| Aucune des sept variantes réelles n'atteint 5 % sur 20 grilles | Pas de différence **prouvée** : ce n'est pas la même chose que « pas de différence ». `REGINK=16` gagne 4 grilles et n'en perd aucune, ce qui est trop peu à 20 grilles ; avec 40 grilles, l'effet est net |
| Si les sept variantes étaient équivalentes, une campagne produirait au moins une fausse alerte à 5 % dans 13,9 % des cas | Le seuil nominal de 5 % ne vaut plus quand on teste plusieurs réglages (le test du signe est prudent, donc l'excès est moins fort que le 30 % du calcul naïf) |
| Avec le seuil de Bonferroni, 1,2 % de fausses alertes | La correction ramène le risque sous 5 %, au prix de repérer moins d'effets modestes |

La vivification des clauses apprises (voir [le chapitre sur les solveurs](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)) a donné 17 grilles gagnées contre 8 perdues (`p` voisin de 0,05) parmi 4 comparaisons faites : avec un seuil de `0,05 / 4 = 0,0125`, ce n'est pas significatif, et le résultat ne s'est pas confirmé à 108 × 108.

## Le biais de sélection : choisir et juger sur les mêmes grilles

Quand on essaie beaucoup de réglages sur les mêmes grilles et qu'on garde le meilleur, **le meilleur est en partie le plus chanceux**. Sur de nouvelles grilles, il retombe vers la moyenne. Simulation : 162 réglages **tous équivalents** (4 grilles sur 100 dépassent le délai pour chacun), mesurés sur les mêmes 100 grilles ; le meilleur est gardé puis re-mesuré sur 100 grilles neuves :

```python
import random

random.seed(3)
P_DEPASSEMENT = 0.04        # tous les réglages sont équivalents : 4 grilles sur 100 dépassent


def depassements(n=100):
    """Nombre de grilles en dépassement parmi n grilles tirées au hasard."""
    return sum(random.random() < P_DEPASSEMENT for _ in range(n))


apparent, reel = 0, 0
for _ in range(1000):                                        # 1000 campagnes de sélection
    mesures = [depassements() for _ in range(162)]           # 162 réglages, mêmes 100 grilles
    apparent += min(mesures)                                 # on garde le meilleur
    reel += depassements()                                   # re-mesuré sur 100 grilles neuves
print(f"meilleur réglage choisi : {apparent / 1000:.2f} dépassements sur les grilles du choix")
print(f"le même réglage, sur de nouvelles grilles : {reel / 1000:.2f} dépassements")
```

```
meilleur réglage choisi : 0.06 dépassements sur les grilles du choix
le même réglage, sur de nouvelles grilles : 3.96 dépassements
```

Le meilleur réglage paraît presque parfait sur les grilles qui l'ont désigné, et retrouve exactement le niveau de tous les autres sur des grilles neuves. Deux cas réels de la recherche :

| Cas | Constat |
|---|---|
| Un réglage choisi sur les 8 grilles où la référence échouait (`RANDFREQ=300`) | 8 grilles sur 8 résolues, mais 8 dépassements sur 100 grilles contre 4 pour la référence (voir [le piège d'évaluation](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#le-piege-d-evaluation-biais-de-selection-et-regression-vers-la-moyenne)) |
| Le meilleur de 162 portfolios classés sur les mêmes 100 grilles | Environ 4 dépassements attendus sur de nouvelles grilles, pas 1 |

Remède : trancher sur des grilles **mises de côté dès le départ** (un jeu de confirmation), et décider du seuil avant de regarder.

## Simuler un portfolio à partir de copies mesurées seules

Un [portfolio](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#portfolio-de-trajectoires-independantes-la-loi-de-p-k) lance 4 copies du solveur en parallèle et garde la première qui termine. Comme chaque copie est déterministe, mesurer chacune **seule** suffit : le temps du portfolio est celui de la copie qui a le moins de propagations, multiplié par le coût d'une propagation (63,6 ns mesurés avec 4 processus), plus 0,4 s de démarrage. On peut alors comparer des centaines de combinaisons sans les relancer :

```python
NS_PAR_PROPAGATION = 63.6e-9      # coût mesuré d'une propagation avec 4 processus
DEMARRAGE = 0.4                   # encodage et lancement, en secondes
PLAFOND = 90                      # une grille au-delà compte pour 90 s

# Propagations de chaque copie lancée seule (None : non résolue), grilles 108 x 108
mesures = {
    "grille 1":  ([1160198340, 1079061713, 965580745, 1121869261],
                  [1161081253, 1080793391, None, 1128429894]),
    "grille 2":  ([935030775, 873949674, None, 1030612002],
                  [935461446, 870245776, None, 1029000510]),
    "grille 36": ([None, None, None, None], [None, None, None, 855762975]),
    "grille 44": ([None, None, None, None], [1164445761, 918386044, 880153114, 900765717]),
    "grille 45": ([None, None, None, None], [930976402, 978540372, 826546571, None]),
}


def temps_du_portfolio(copies):
    """Le premier processus qui finit gagne : le moins de propagations, fois leur coût."""
    resolues = [p for p in copies if p is not None]
    if not resolues:
        return PLAFOND
    return min(PLAFOND, min(resolues) * NS_PAR_PROPAGATION + DEMARRAGE)


print(f"{'grille':12} {'sans Régin':>12} {'avec Régin':>12}")
for nom, (reference, regin) in mesures.items():
    t_ref, t_regin = temps_du_portfolio(reference), temps_du_portfolio(regin)
    print(f"{nom:12} {t_ref:11.1f} s {t_regin:11.1f} s")
```

```
grille         sans Régin   avec Régin
grille 1            61.8 s        69.1 s
grille 2            56.0 s        55.7 s
grille 36           90.0 s        54.8 s
grille 44           90.0 s        56.4 s
grille 45           90.0 s        53.0 s
```

La grille 1 est un rappel utile : Régin y est **plus lent** (69,1 s contre 61,8 s), parce que la trajectoire de recherche est différente. Aucune grille isolée ne tranche. Sur les 100 grilles réelles à 108 × 108, la simulation donne 56,6 s et 4 dépassements sans Régin contre 53,0 s et aucun dépassement avec, Régin étant plus rapide sur 73 grilles contre 27 (test du signe sur ces 100 grilles : `p` inférieur à 0,00001). Elle retrouve exactement les dépassements réels (grilles 36, 44, 45 et 86 à 108 × 108 ; 31, 42 et 76 à 104 × 104) ; la mesure réelle donne 49,3 s : la simulation est légèrement pessimiste.

## Vérifier un tirage uniforme : le test du χ²

Les grilles de test doivent représenter le problème, pas seulement le générateur qui les produit. Pour les [carrés latins](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme#la-chaine-de-jacobson-matthews), le générateur de Jacobson et Matthews doit tirer chaque carré avec la même probabilité. Le **test du χ²** (khi-deux) compare le nombre de fois où chaque carré est sorti à ce qu'on attendrait d'un tirage uniforme. Ci-dessous, un tirage au hasard parmi 576 possibilités (les 576 carrés latins 4 × 4) remplace le générateur, une fois uniforme et une fois biaisé :

```python
import random

CASES = 576                       # les 576 carrés latins 4 x 4
TIRAGES = 57600                   # 100 tirages attendus par carré
random.seed(2)


def khi2(tirages):
    """Somme des (observé - attendu)^2 / attendu sur les 576 cases du tableau de comptage."""
    comptes = [0] * CASES
    for t in tirages:
        comptes[t] += 1
    attendu = len(tirages) / CASES
    return sum((c - attendu) ** 2 / attendu for c in comptes)


uniforme = [random.randrange(CASES) for _ in range(TIRAGES)]
# un tirage biaisé : les 100 premiers carrés sortent un peu plus souvent
biaise = [random.randrange(CASES) if random.random() < 0.9 else random.randrange(100)
          for _ in range(TIRAGES)]
print(f"tirage uniforme : khi2 = {khi2(uniforme):.0f}")
print(f"tirage biaisé   : khi2 = {khi2(biaise):.0f}")
ecart = (2 * (CASES - 1)) ** 0.5
print(f"attendu si uniforme : {CASES - 1} avec un écart d'environ {ecart:.0f}")
```

```
tirage uniforme : khi2 = 556
tirage biaisé   : khi2 = 3466
attendu si uniforme : 575 avec un écart d'environ 34
```

| Résultat | Lecture |
|---|---|
| χ² = 556 pour 576 carrés possibles | Proche de 575 (le nombre de degrés de liberté), à moins d'un écart (environ 34) : compatible avec un tirage uniforme |
| χ² = 3466 pour un tirage biaisé | Très au-dessus : le biais est détecté |

Mesure réelle sur le générateur de la recherche : les 576 carrés 4 × 4 apparaissent tous et χ² = 557 pour 575 ± 34 attendus. Le test ne **prouve** pas l'uniformité : il n'a simplement rien détecté. Il est complété par une vérification sur le problème lui-même : à 104 × 104, le portfolio de référence simulé donne 47,3 s sur 20 grilles uniformes contre 50,4 s sur les 100 grilles officielles, sans dépassement ; à 72 × 72, 6,2 s contre 6,5 s. Le solveur n'est pas réglé sur le seul générateur officiel.

## Les pièges

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Comparer des moyennes sur des grilles différentes | La différence entre les grilles masque (ou fabrique) celle entre les réglages | Apparier : mêmes grilles, mêmes graines |
| Compter les échecs pour le budget dans une moyenne | La moyenne dépend du budget, pas seulement du solveur | Comparer les nombres de grilles résolues et les compteurs sur les grilles résolues par les deux |
| Conclure d'un `p` supérieur à 0,05 qu'il n'y a pas de différence | Trop peu de grilles : un effet réel passe inaperçu (`REGINK=16` à 20 grilles) | Ajouter des grilles neuves, sans retoucher le seuil en cours de route |
| Tester plusieurs réglages au même seuil de 5 % | Des fausses alertes (13,9 % à 7 réglages) | Corriger le seuil (Bonferroni) ou annoncer le nombre de comparaisons faites |
| Garder le meilleur réglage et le juger sur les mêmes grilles | Le résultat est optimiste (0,06 contre 3,96 dépassements dans la simulation) | Un jeu de confirmation mis de côté dès le départ |
| Juger une grille isolée | Un réglage meilleur en moyenne peut perdre sur certaines grilles (la grille 1) | Regarder les 100 grilles et le test du signe |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Pour comparer deux réglages : mêmes grilles pour les deux (appariement), compteurs de travail plutôt que temps, test du signe sur les grilles discordantes. La valeur p mesure à quel point l'écart serait surprenant si les réglages étaient équivalents. Plusieurs comparaisons font monter les fausses alertes ; choisir puis juger sur les mêmes grilles est optimiste. |
| **Outils utilisables** | Le test du signe (`math.comb`), la correction de Bonferroni, un jeu de grilles de confirmation, la simulation d'un portfolio à partir de copies mesurées seules, le test du χ² pour vérifier un tirage uniforme. |
| **Pièges à éviter** | Comparer des moyennes, compter les échecs pour le budget, lire un `p` élevé comme une preuve d'équivalence, multiplier les comparaisons sans corriger le seuil, juger sur les grilles du choix. |
| **Bonnes pratiques** | Décider du nombre de grilles et du seuil avant de mesurer. Réserver des grilles neuves pour confirmer. Annoncer toutes les comparaisons faites. Vérifier le résultat sur plusieurs sources de grilles. |
