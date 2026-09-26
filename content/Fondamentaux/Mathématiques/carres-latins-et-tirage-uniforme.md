---
order: 9
---

# Carrés latins et tirage uniforme par chaîne de Markov

Pour tester un programme, on a souvent besoin d'exemples **tirés au hasard de façon uniforme** : chaque exemple possible doit avoir exactement la même chance de sortir (voir [Les probabilités de base](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). Pour certains objets, c'est étonnamment difficile. Ce chapitre prend l'exemple des carrés latins, utilisés par les puzzles Sudoku ou Skyscraper.

## Le carré latin

Un **carré latin** d'ordre n est une grille n × n remplie avec n symboles, chacun **une seule fois par ligne et par colonne** :

```
1 2 3 4
2 1 4 3
3 4 1 2
4 3 2 1
```

Leur nombre explose (suite [A002860](https://oeis.org/A002860) de l'encyclopédie des suites d'entiers) :

| n | Nombre de carrés latins |
|---|---|
| 3 | 12 |
| 4 | 576 |
| 5 | 161 280 |
| 6 | 812 851 200 |

Les valeurs jusqu'à n = 5 ont été vérifiées ici par énumération complète.

## Le piège du mélange : l'isotopie

Méthode naïve pour « tirer un carré au hasard » : partir du **carré cyclique** (chaque ligne décalée d'un cran), puis mélanger au hasard ses lignes, ses colonnes et ses symboles.

```
carré cyclique        après échange des lignes 1 et 3, puis des symboles 1 et 4
1 2 3 4               3 1 4 2
2 3 4 1               2 3 1 4
3 4 1 2               4 2 3 1
4 1 2 3               1 4 2 3
```

Deux carrés qu'on peut transformer l'un en l'autre par ces permutations sont **isotopes**. Le problème : tous les carrés latins ne sont pas isotopes au carré cyclique. Vérifié en 4 × 4 :

| Carrés 4 × 4 | Nombre | Part |
|---|---|---|
| Isotopes au carré cyclique (atteignables par mélange) | 432 | 75 % |
| Les autres (dont celui du début du chapitre) | 144 | 25 % |
| Total | 576 | 100 % |

Le mélange ne produit donc **jamais** un quart des carrés 4 × 4, et la part inaccessible grandit avec n. Un banc de test construit ainsi ne teste qu'une famille particulière de grilles : ses mesures peuvent être trompeuses.

## La chaîne de Markov : une marche au hasard

Une **chaîne de Markov** est une suite d'états où l'état suivant est tiré au hasard **en ne dépendant que de l'état actuel**, pas du chemin parcouru avant. Exemple avec la météo :

| Aujourd'hui | Demain : soleil | Demain : pluie |
|---|---|---|
| Soleil | 0,8 | 0,2 |
| Pluie | 0,4 | 0,6 |

En laissant tourner la chaîne longtemps, la fréquence de chaque état se stabilise (ici, 2 jours de soleil sur 3), quel que soit le point de départ : c'est la **distribution stationnaire**.

L'idée du **MCMC** (*Markov Chain Monte Carlo*) : pour tirer au hasard un objet difficile à construire directement, on invente une marche aléatoire entre ces objets dont la distribution stationnaire est **uniforme**. Après assez de pas, l'état courant est un tirage (presque) uniforme.

## La chaîne de Jacobson-Matthews

Jacobson et Matthews (1996) ont construit une telle chaîne pour les carrés latins. Un carré est vu comme un **cube** de n × n × n cases `m[ligne][colonne][symbole]`, qui vaut 1 si la case (ligne, colonne) contient ce symbole, 0 sinon.

| Étape | Ce qui se passe |
|---|---|
| Choisir un coin | Une case du cube à 0, au hasard |
| Former un petit cube | Avec les trois cases à 1 alignées avec elle (même colonne et symbole, même ligne et symbole, même ligne et colonne), elle définit un sous-cube 2 × 2 × 2 |
| Modifier ses 8 coins | +1 sur quatre coins, −1 sur les quatre autres, en alternance : chaque ligne du cube garde la même somme |
| Carré « impropre » | Si un coin tombe à −1, le carré est temporairement **impropre** ; le pas suivant part obligatoirement de cette case pour la réparer |

Jacobson et Matthews ont démontré que, en ne regardant que les carrés propres, cette chaîne a une distribution stationnaire uniforme.

## Où lire le tirage : un piège mesuré

Après les pas prévus, la chaîne peut être sur un carré impropre. Solution tentante : continuer jusqu'au premier carré propre, et le renvoyer. C'est **faux** : s'arrêter au premier état « correct » n'équivaut pas à regarder la chaîne à un instant fixe. Il faut soit rejeter le tirage, soit relancer un bloc complet de pas.

```python
# extrait : cube_du_carre_cyclique, un_pas et carre_depuis_cube sont supposées écrites
def tirer_carre(n, rng, pas):
    m = cube_du_carre_cyclique(n)                    # point de départ
    impropre = None
    while True:
        for _ in range(pas):                         # un bloc complet de pas
            impropre = un_pas(m, n, rng, impropre)   # renvoie la case à -1, ou None
        if impropre is None:                         # lu à la fin d'un bloc, jamais avant
            return carre_depuis_cube(m, n)
```

Mesuré sur 5 760 tirages de carrés 4 × 4 (chaque carré devrait sortir environ 10 fois) :

| Méthode | Carrés non isotopes au cyclique (attendu : 25 %) | Carré le plus tiré |
|---|---|---|
| Continuer jusqu'au premier carré propre (64, 256 ou 1 024 pas) | 8 % | 24 fois |
| Relancer un bloc complet si le carré est impropre (64 pas) | 25,5 % | 21 fois |

Le biais ne diminue pas quand on augmente le nombre de pas : il vient de **l'endroit** où l'on lit le résultat, pas d'un manque de mélange. La bonne vérification consiste à comparer les fréquences obtenues aux fréquences attendues sur une petite taille où tout est dénombrable.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un carré latin contient chaque symbole une fois par ligne et par colonne. Mélanger le carré cyclique ne donne que ses isotopes (75 % des carrés 4 × 4). La chaîne de Jacobson-Matthews permet un tirage uniforme, à condition de lire le résultat à un instant fixe. |
| **Outils utilisables** | Chaîne de Markov et MCMC ; représentation d'un carré latin en cube d'incidence ; chaîne de Jacobson-Matthews ; comparaison des fréquences par énumération sur une petite taille. |
| **Pièges à éviter** | Générer des données de test par simple mélange d'un modèle unique ; renvoyer le premier état « correct » d'une chaîne au lieu de l'état à un instant fixe. |
| **Bonnes pratiques** | Vérifier l'uniformité d'un générateur sur une taille où tous les objets se comptent ; varier la source des données d'un banc de test. |
