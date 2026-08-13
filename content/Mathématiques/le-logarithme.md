---
order: 4
---

# Le logarithme

Ce chapitre présente le logarithme, une notion reprise plus loin pour mesurer à quel point une prédiction est bonne ou mauvaise dans un modèle de machine learning.

## L'inverse de la puissance

Élever un nombre à une puissance (`b^y`) revient à multiplier `b` par lui-même `y` fois : `10^3 = 10 × 10 × 10 = 1000`. Le **logarithme** pose la question inverse : à quelle puissance faut-il élever une base donnée pour obtenir un nombre donné ?

```text
10^2 = 100   ->  log10(100) = 2   ("il faut élever 10 à la puissance 2 pour obtenir 100")
10^3 = 1000  ->  log10(1000) = 3
10^0 = 1     ->  log10(1) = 0
```

> **Analogie :** plier une feuille de papier en deux, répéter l'opération. Après 1 pliage, 2 épaisseurs ; après 2 pliages, 4 ; après 3, 8. `log2(8) = 3` répond exactement à la question "combien de fois faut-il plier la feuille pour obtenir 8 épaisseurs ?".

## Les bases courantes

| Base | Notation | Répond à | Domaine d'usage typique |
|---|---|---|---|
| 10 | `log10(x)` ou `log(x)` | Combien de fois multiplier par 10 ? | Ordres de grandeur, échelles ([Richter](https://en.wikipedia.org/wiki/Richter_magnitude_scale), [décibels](https://en.wikipedia.org/wiki/Decibel)) |
| 2 | `log2(x)` | Combien de fois doubler ? | Informatique (recherche dans un arbre, complexité d'un algorithme) |
| *e* (≈ 2,718) | `ln(x)` | Pas de question aussi intuitive que les deux précédentes : cette base est choisie parce qu'elle simplifie de nombreux calculs mathématiques | La plupart des formules utilisées en statistiques et en machine learning |

> **Piège :** confondre les bases. `log2(8) = 3` mais `log10(8) ≈ 0,9` : le résultat dépend entièrement de la base choisie, deux logarithmes de bases différentes ne se comparent jamais directement sans conversion.
>
> **Bonne pratique :** toujours vérifier quelle base une fonction ou une formule utilise avant d'interpréter son résultat (`log` en [Python](/?c=langages-de-programmation&s=python&p=python), par exemple, désigne le logarithme **naturel** (base *e*), pas base 10, contrairement à ce que le nom pourrait laisser penser).

## La forme de sa courbe : très lente pour les grands x, très rapide près de 0

Le graphique ci-dessous place chaque point `(x, log10(x))` à sa position réelle, sur un axe des `x` **linéaire** (chaque écart horizontal représente le même écart de `x`, contrairement au tableau plus haut) :

```plot-fonction
fn: x => log(x)
domaine: 0.05, 12
label: log10(x)
```

Entre `x = 0,1` et `x = 1` (une toute petite portion de cet axe linéaire), la courbe monte déjà de -1 à 0 : une variation de 1 unité. Entre `x = 1` et `x = 10` (neuf fois plus large), elle ne monte que de 0 à 1 : la **même** variation de 1 unité, mais étalée sur une distance bien plus grande. Le résultat visuel est cette forme dissymétrique : une montée raide sur la gauche (près de 0), puis un aplatissement progressif à mesure que `x` grandit.

Cette compression près de 0 se prolonge sans limite : plus `x` se rapproche de 0, plus `log10(x)` plonge vers de grands nombres négatifs, sur un intervalle de `x` de plus en plus étroit (voir le tableau ci-dessous). Une formule qui applique `-log(x)` à un nombre proche de 0 hérite de cette même compression : le résultat explose sur un tout petit intervalle, une des façons de pénaliser fortement un résultat presque nul.

| x | log10(x) |
|---|---|
| 0,001 | -3 |
| 0,01 | -2 |
| 0,1 | -1 |
| 1 | 0 |
| 10 | 1 |
| 100 | 2 |
| 1 000 | 3 |

## Piège : le logarithme n'est pas défini partout

`log(0)` n'est pas défini : la valeur diminue sans limite à mesure que `x` se rapproche de 0, sans jamais atteindre un résultat fini. Le logarithme d'un nombre négatif n'est pas défini non plus (dans les nombres réels).

> **Piège :** appliquer un logarithme à une valeur qui peut valoir exactement 0 (une probabilité, par exemple) provoque une erreur ou une valeur infinie dans un programme, pas un résultat inhabituel mais valide.
>
> **Bonne pratique :** dans un calcul qui applique un logarithme à une probabilité, ajouter une toute petite valeur avant le calcul (`log(p + 0.0000001)` par exemple) évite ce cas limite, plutôt que de laisser le calcul échouer ou renvoyer une valeur infinie.

## Propriété utile : transformer une multiplication en addition

```text
log(a × b) = log(a) + log(b)
```

Cette propriété permet de remplacer une multiplication par une addition, généralement plus simple à calculer et moins sujette à produire un nombre devenu trop petit ou trop grand pour être représenté correctement en mémoire (voir [les nombres à virgule flottante](/?c=representation-des-donnees&p=nombres-flottants)), utile en particulier quand de très nombreux petits nombres doivent être multipliés entre eux.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le logarithme répond à "à quelle puissance élever cette base pour obtenir ce nombre ?" (l'inverse de la puissance). Il croît très lentement pour les grandes valeurs, et chute vers moins l'infini près de 0. |
| **Outils utilisables** | `log10()`, `log2()`, `log()` (naturel, base *e*) dans la plupart des langages : vérifier systématiquement laquelle est utilisée. |
| **Pièges à éviter** | Confondre deux logarithmes de bases différentes. Appliquer un logarithme à une valeur qui peut être 0 ou négative. |
| **Bonnes pratiques** | Vérifier la base utilisée par une fonction avant d'interpréter son résultat. Ajouter une petite valeur avant un `log()` appliqué à une probabilité, pour éviter `log(0)`. |
