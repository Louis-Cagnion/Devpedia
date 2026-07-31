---
order: 2
---

# Les nombres à virgule flottante (IEEE 754)

C'est probablement le comportement le plus déroutant de la programmation, et celui qu'on attribue le plus souvent au mauvais responsable :

```
0.1 + 0.2   ==>  0.30000000000000004
```

Ce résultat est identique en JavaScript, en Python, en C, en PHP, en Java et en C#. Ce n'est donc **pas** un défaut d'un langage : c'est une conséquence de la façon dont le processeur encode les nombres décimaux, décrite par la norme **IEEE 754**, que tous ces langages utilisent parce que c'est le matériel qui l'impose.

## Pourquoi une approximation ?

En base 10, certaines fractions n'ont pas d'écriture décimale finie : `1/3 = 0,333...` — on doit s'arrêter quelque part, donc écrire une approximation.

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

```
[ signe : 1 bit ][ exposant ][ mantisse ]
```

| Type | Total | Signe | Exposant | Mantisse | Chiffres décimaux fiables |
|---|---|---|---|---|---|
| `float` (simple précision) | 32 bits | 1 | 8 | 23 | ~7 |
| `double` (double précision) | 64 bits | 1 | 11 | 52 | ~15-16 |

- le **signe** indique positif ou négatif ;
- l'**exposant** donne l'ordre de grandeur — c'est lui qui permet de représenter aussi bien `10⁻³⁰⁰` que `10³⁰⁰` ;
- la **mantisse** porte les chiffres significatifs, et c'est elle qui **limite la précision**.

Ce compromis est le cœur du sujet : un flottant sacrifie la précision pour couvrir une énorme plage de valeurs avec peu de bits. Le nombre de bits de mantisse étant fixe, la précision est **relative** : plus un nombre est grand, plus l'écart entre deux flottants consécutifs est grand.

```
1.0  et le flottant suivant  : ecart d'environ 2,2e-16
1e9  et le flottant suivant  : ecart d'environ 1,2e-7
1e16 et le flottant suivant  : ecart d'environ 2,0
```

À partir de 2⁵³ (environ 9 × 10¹⁵), l'écart dépasse 1 : des entiers voisins deviennent **indiscernables**, parce que la mantisse de 52 bits ne suffit plus à les distinguer.

## La conséquence pratique : ne jamais tester l'égalité

Puisque deux calculs mathématiquement équivalents peuvent produire des flottants différents, `==` sur des flottants est presque toujours un bug latent. On compare l'**écart** à une marge d'erreur acceptable, appelée epsilon :

```
si valeur_absolue(a - b) < epsilon  ->  considerer a et b comme egaux
```

En C :

```
#include <math.h>

double epsilon = 0.0001;
if (fabs(a - b) < epsilon) { /* consideres comme egaux */ }
```

En Python :

```python
import math
math.isclose(0.1 + 0.2, 0.3)     # True -> gere la tolerance pour vous
```

En JavaScript :

```js
Math.abs(a - b) < 0.0001;
```

**Quel epsilon choisir ?** Il dépend du domaine, pas du langage. Pour des prix au centime, `0.001` suffit. Ne prenez pas systématiquement l'« epsilon machine » (le plus petit écart représentable autour de 1, `2,22e-16` en double précision) : il est correct pour des valeurs proches de 1, mais **trop strict** pour de grandes valeurs, où l'écart naturel entre deux flottants le dépasse déjà largement.

## Le cas de l'argent : ne pas utiliser de flottants

Pour des montants, la bonne réponse n'est pas d'ajuster l'epsilon mais de **changer de représentation** : compter en centimes, avec des entiers.

```
prix_en_centimes = 1999      // 19,99 EUR
total = prix_en_centimes * 3 // 5997, exact
```

C'est aussi la raison pour laquelle les bases de données distinguent `DECIMAL` (exact, en base 10) de `FLOAT` (approché) : un montant se stocke en `DECIMAL`. Voir le chapitre [SQL](/?c=domain-specific-languages-dsl&p=sql).

## Valeurs particulières

La norme réserve certaines combinaisons de bits à des valeurs spéciales, présentes dans tous les langages :

- **infinis** : produits par un débordement ou une division par zéro (`1.0 / 0.0`) ;
- **NaN** (*Not a Number*) : résultat d'une opération invalide (`0.0 / 0.0`, racine d'un nombre négatif).

`NaN` a une propriété volontairement surprenante : **il n'est égal à rien, pas même à lui-même**. `NaN == NaN` est faux. C'est cohérent — deux résultats invalides n'ont aucune raison d'être "le même nombre" — mais cela impose d'utiliser une fonction dédiée pour le détecter (`isnan()` en C, `math.isnan()` en Python, `Number.isNaN()` en JavaScript).

## Ce que chaque langage y ajoute

Le socle est commun ; les langages diffèrent seulement sur l'emballage :

| Langage | Spécificités |
|---|---|
| C | `float` / `double` / `long double` explicites, `fabs()`, `isnan()` |
| JavaScript | un seul type `number` (toujours un double), `BigInt` pour les grands entiers — voir [Les nombres](/?c=langages-de-programmation&s=javascript&p=nombres) |
| Python | `float` = double, entiers de taille arbitraire nativement, `math.isclose()`, module `decimal` |
| PHP | `float` = double, `PHP_FLOAT_EPSILON` |

Retenez surtout que ces différences ne changent rien au fond : c'est le matériel qui décide, et il décide pareil pour tout le monde.

## Résumé

| À retenir | Pourquoi |
|---|---|
| `0.1 + 0.2 != 0.3` dans tous les langages | Encodage binaire, pas un bug du langage |
| Ne jamais comparer deux flottants avec `==` | Deux calculs équivalents donnent des bits différents |
| Comparer via un epsilon adapté au domaine | La précision est relative à l'ordre de grandeur |
| Montants monétaires en entiers ou `DECIMAL` | Aucune approximation tolérable sur de l'argent |
| Entiers exacts jusqu'à 2⁵³ en double précision | La mantisse fait 52 bits |
| `NaN != NaN` | Une valeur invalide n'égale rien, y compris elle-même |
