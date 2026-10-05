---
order: 2
---

# Les nombres à virgule flottante (IEEE 754)

C'est probablement le comportement le plus déroutant de la programmation, et celui qu'on attribue le plus souvent au mauvais responsable :

```text
0.1 + 0.2   ==>  0.30000000000000004
```

Ce résultat est identique en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), en [Python](/?c=langages-de-programmation&s=python&p=python), en [C](/?c=langages-de-programmation&s=c&p=c), en [PHP](/?c=langages-de-programmation&s=php&p=php), en [Java](https://docs.oracle.com/en/java/) et en [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). Ce n'est donc **pas** un défaut d'un langage : c'est une conséquence de la façon dont le processeur encode les nombres décimaux, décrite par la norme **IEEE 754**, que tous ces langages utilisent parce que c'est le matériel qui l'impose.

## Pourquoi une approximation ?

En base 10, certaines fractions n'ont pas d'écriture décimale finie : `1/3 = 0,333...` : on doit s'arrêter quelque part, donc écrire une approximation.

Le même phénomène existe en base 2, mais **avec d'autres nombres**. Un nombre n'a une écriture binaire finie que si son dénominateur est une puissance de 2 :

| Nombre | En binaire | Exact ? |
|---|---|---|
| `0,5` (= 1/2) | `0,1` | oui |
| `0,25` (= 1/4) | `0,01` | oui |
| `0,75` (= 3/4) | `0,11` | oui |
| `0,1` (= 1/10) | `0,0001100110011...` | **non**, périodique infini |

`0.1` est parfaitement simple en décimal et infini en binaire. La machine doit donc le tronquer : ce qui est réellement stocké est le flottant le plus proche de `0,1`, pas `0,1`. Additionner deux valeurs approchées cumule les écarts, et le résultat de `0.1 + 0.2` tombe sur un flottant très légèrement supérieur à celui qui représente `0.3`.

> Ce qui s'affiche n'est pas une erreur d'affichage : `0.30000000000000004` **est** la valeur stockée, exprimée en décimal.

## Comment un flottant est encodé

Un flottant est stocké en trois parties, comme une notation scientifique en binaire (± mantisse × 2^exposant) :

```text
[ signe : 1 bit ][ exposant ][ mantisse ]
```

| Type | Total | Signe | Exposant | Mantisse | Chiffres décimaux fiables |
|---|---|---|---|---|---|
| `float` (simple précision) | 32 bits | 1 | 8 | 23 | ~7 |
| `double` (double précision) | 64 bits | 1 | 11 | 52 | ~15-16 |

- le **signe** indique positif ou négatif ;
- l'**exposant** donne l'ordre de grandeur : c'est lui qui permet de représenter aussi bien `10⁻³⁰⁰` que `10³⁰⁰` ;
- la **mantisse** porte les chiffres significatifs, et c'est elle qui **limite la précision**.

Ce compromis est le cœur du sujet : un flottant sacrifie la précision pour couvrir une énorme plage de valeurs avec peu de bits. Le nombre de bits de mantisse étant fixe, la précision est **relative** : plus un nombre est grand, plus l'écart entre deux flottants consécutifs est grand.

```text
1.0  et le flottant suivant  : ecart d'environ 2,2e-16
1e9  et le flottant suivant  : ecart d'environ 1,2e-7
1e16 et le flottant suivant  : ecart d'environ 2,0
```

À partir de 2⁵³ (environ 9 × 10¹⁵), l'écart dépasse 1 : des entiers voisins deviennent **indiscernables**, parce que la mantisse de 52 bits ne suffit plus à les distinguer.

## La conséquence pratique : ne jamais tester l'égalité

Puisque deux calculs mathématiquement équivalents peuvent produire des flottants différents, `==` sur des flottants est presque toujours un bug latent. On compare l'**écart** à une marge d'erreur acceptable, appelée epsilon :

```text
si valeur_absolue(a - b) < epsilon  ->  considerer a et b comme egaux
```

En C :

```c
#include <math.h>

double epsilon = 0.0001;
if (fabs(a - b) < epsilon) { /* consideres comme egaux */ }
```

En [Python](/?c=langages-de-programmation&s=python&p=python) :

```python
import math
math.isclose(0.1 + 0.2, 0.3)     # True -> gere la tolerance pour vous
```

En [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) :

```js
Math.abs(a - b) < 0.0001;
```

**Quel epsilon choisir ?** Il dépend du domaine, pas du langage. Pour des prix au centime, `0.001` suffit. Ne prenez pas systématiquement l'« epsilon machine » (le plus petit écart représentable autour de 1, `2,22e-16` en double précision) : il est correct pour des valeurs proches de 1, mais **trop strict** pour de grandes valeurs, où l'écart naturel entre deux flottants le dépasse déjà largement.

## L'absorption et l'annulation : quand un calcul perd ses chiffres

L'écart entre deux flottants consécutifs grandit avec la valeur (voir plus haut). Un résultat exact qui tombe entre deux flottants est **arrondi** au plus proche : ajouter un petit nombre à un grand peut donc ne **rien changer**, c'est l'**absorption**.

| Type | Premier entier qui n'existe plus | Ajouter 1 est toujours perdu à partir de |
|---|---|---|
| `float` | 2²⁴ + 1 = 16 777 217 | 2²⁵ = 33 554 432 |
| `double` | 2⁵³ + 1 = 9 007 199 254 740 993 | 2⁵⁴ = 18 014 398 509 481 984 |

Résultats mesurés en C (`float`, 32 bits) :

```c
float big = 16777216.0f;      /* 2^24 */
big + 1.0f == big;            /* vrai : 16 777 217 n'existe pas, arrondi à 16 777 216 */
big + 2.0f == big;            /* faux : 16 777 218 existe */

float sum = 16777216.0f;
for (int i = 0; i < 1000; i++)
	sum += 1.0f;              /* chaque +1 est perdu : sum vaut toujours 16 777 216, pas 16 778 216 */
```

La parade est d'**additionner d'abord les petites valeurs entre elles** : 1000 additions de `1.0f` donnent 1000 exactement, puis `16777216.0f + 1000.0f` vaut 16 778 216 (un nombre pair, représentable à cette échelle). Passer en `double` repousse seulement le seuil.

L'**annulation** est le piège inverse : soustraire deux grands nombres proches détruit les chiffres fiables. Ici l'erreur est déjà commise à la conversion, la soustraction la rend visible :

```c
float distance = 100000000.0f;    /* 10^8 */
float radius = 99999999.0f;       /* stocké 100 000 000 : l'écart entre deux float vaut 8 à cette taille */
float near = distance - radius;   /* 0.0 au lieu de 1.0 */
```

Un `near` valant 0 là où le calcul en aval exige un nombre strictement positif (division, plan de projection) produit un résultat infini ou absurde, sans message d'erreur. Contrôler le résultat d'une soustraction dont les deux termes sont proches, ou calculer en `double`.

**Comparer avec une marge relative.** Une constante absolue (`0.0001`) dépend de l'unité des valeurs : trop grande pour des objets de 0,001, trop petite pour des valeurs de 10⁸ (où l'écart naturel est de 8). On compare donc à une fraction de la plus grande des deux valeurs :

```c
/* Vrai si a et b diffèrent d'au plus la fraction rel de la plus grande des deux (valeur absolue). */
static int close_enough(double a, double b, double rel)
{
	return fabs(a - b) <= rel * fmax(fabs(a), fabs(b));   /* fabs : valeur absolue ; fmax : le plus grand des deux */
}
```

Pour comparer à 0 exactement, cette formule ne convient pas (la marge devient nulle) : ajouter alors un plancher absolu choisi selon l'unité du domaine.

**`NaN` et l'infini traversent les comparaisons sans erreur.** Une comparaison avec `NaN` est toujours fausse (voir [valeurs particulières](#valeurs-particulieres)), et l'infini est plus grand que tout :

| Expression | `NaN` | `+inf` (infini positif) |
|---|---|---|
| `x < 0` | faux | faux |
| `x > 10` | faux | vrai |
| `x > 0` | faux | vrai |
| `x == x` | faux | vrai |

Le contrôle habituel « refuser si hors plage » laisse donc passer `NaN` (les deux conditions sont fausses). On écrit le contrôle **dans le sens de l'acceptation** : n'accepter que ce qui est fini et dans la plage.

```c
/* Vrai si x est un nombre fini dans [min, max] ; faux pour NaN, +inf et -inf. */
static int in_range(double x, double min, double max)
{
	return isfinite(x) && x >= min && x <= max;   /* isfinite : faux pour NaN et pour l'infini */
}
```

`inf - inf` donne `NaN` : une seule valeur infinie produit ensuite des `NaN` dans toute la suite du calcul.

> **Piège :** aucun de ces cas ne produit d'erreur ou de plantage : le calcul continue avec une valeur fausse. Vérifier les entrées numériques dès leur arrivée (`isfinite`, plage du domaine) plutôt que de supposer des valeurs saines.

## Le cas de l'argent : ne pas utiliser de flottants

Pour des montants, la bonne réponse n'est pas d'ajuster l'epsilon mais de **changer de représentation** : compter en centimes, avec des entiers.

```text
prix_en_centimes = 1999      // 19,99 EUR
total = prix_en_centimes * 3 // 5997, exact
```

C'est aussi la raison pour laquelle les bases de données distinguent `DECIMAL` (exact, en base 10) de `FLOAT` (approché) : un montant se stocke en `DECIMAL`. Voir le chapitre [SQL](/?c=domain-specific-languages-dsl&p=sql).

## Valeurs particulières

La norme réserve certaines combinaisons de bits à des valeurs spéciales, présentes dans tous les langages :

- **infinis** : produits par un débordement ou une division par zéro (`1.0 / 0.0`) ;
- **NaN** (*Not a Number*) : résultat d'une opération invalide (`0.0 / 0.0`, racine d'un nombre négatif).

`NaN` a une propriété volontairement surprenante : **il n'est égal à rien, pas même à lui-même**. `NaN == NaN` est faux. C'est cohérent (deux résultats invalides n'ont aucune raison d'être "le même nombre"), mais cela impose d'utiliser une fonction dédiée pour le détecter (`isnan()` en [C](/?c=langages-de-programmation&s=c&p=c), `math.isnan()` en [Python](/?c=langages-de-programmation&s=python&p=python), `Number.isNaN()` en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)).

## Une alternative : la représentation en virgule fixe

Plutôt que de sacrifier la précision pour couvrir une immense plage de valeurs (comme le fait un flottant), la **représentation en virgule fixe** (*fixed-point*) stocke un nombre décimal comme un entier ordinaire, dont les derniers bits représentent conventionnellement la partie fractionnaire :

```text
Avec 8 bits fractionnaires :
  valeur reelle = entier_stocke / 2^8

  entier_stocke = 2560  ->  2560 / 256 = 10.0
  entier_stocke = 2688  ->  2688 / 256 = 10.5
```

Convertir un entier classique en virgule fixe revient à le multiplier par `2^bits_fractionnaires` (`10 * 256 = 2560`) ; convertir en sens inverse (vers un entier ou un flottant) revient à diviser par cette même valeur.

| | Flottant (IEEE 754) | Virgule fixe |
|---|---|---|
| Stockage | Signe + exposant + mantisse | Un entier ordinaire |
| Précision | Relative (dépend de l'ordre de grandeur) | Fixe et constante (toujours le même nombre de décimales) |
| Calcul | Nécessite une unité de calcul flottant (FPU) | De simples opérations entières, plus rapides et déterministes |
| Usage typique | Calcul scientifique, plage de valeurs très large | Embarqué sans FPU, jeux vidéo rétro, signal audio/DSP |

> **Bonne pratique :** la virgule fixe garantit un résultat strictement identique sur toute machine (contrairement à un flottant, dont l'arrondi peut varier légèrement selon le compilateur ou le processeur) : utile dès qu'un calcul doit rester reproductible bit à bit, par exemple dans un jeu multijoueur où chaque client doit obtenir exactement le même résultat.

C'est la technique à la base du format **Q** (*Q number format*), encore utilisé aujourd'hui par certains processeurs de signal numérique (DSP) qui n'embarquent pas d'unité de calcul flottant.

## Ce que chaque langage y ajoute

Le socle est commun ; les langages diffèrent seulement sur l'emballage :

| Langage | Spécificités |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | `float` / `double` / `long double` explicites, `fabs()`, `isnan()` |
| [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) | un seul type `number` (toujours un double), `BigInt` pour les grands entiers, voir [Les nombres](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, entiers de taille arbitraire nativement, `math.isclose()`, module `decimal` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Retenez surtout que ces différences ne changent rien au fond : c'est le matériel qui décide, et il décide pareil pour tout le monde.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un flottant (norme IEEE 754) stocke une approximation, pas une valeur exacte : `0.1 + 0.2 != 0.3` dans tous les langages, sans exception. La précision est relative : plus un nombre est grand, plus l'écart entre deux flottants consécutifs grandit. Les entiers restent exacts jusqu'à 2⁵³ en double précision (52 bits de mantisse) ; au-delà, des entiers voisins deviennent indiscernables ; en `float`, dès 2²⁴. Un petit nombre ajouté à un grand peut être absorbé, et une soustraction de grands nombres proches peut donner 0. |
| **Outils utilisables** | Comparaison par epsilon (`math.isclose`, `fabs(a-b) < epsilon`), types `DECIMAL` pour des montants exacts. La virgule fixe pour un résultat reproductible bit à bit sans FPU. |
| **Pièges à éviter** | Comparer deux flottants avec `==` (y compris `NaN`, qui n'égale jamais rien, pas même lui-même) ; stocker un montant monétaire en flottant plutôt qu'en entiers (centimes) ou `DECIMAL`. Contrôler une entrée par « refuser si hors plage » : `NaN` passe, et l'infini passe un test `x > 0`. Ajouter un à un de petits termes à un grand total. |
| **Bonnes pratiques** | Choisir un epsilon adapté à l'ordre de grandeur manipulé, jamais l'epsilon machine par défaut pour de grandes valeurs. Comparer avec une marge relative plutôt qu'une constante absolue. Additionner les petites valeurs entre elles avant de les ajouter au grand total. N'accepter une entrée que si `isfinite(x)` et dans la plage du domaine. |
