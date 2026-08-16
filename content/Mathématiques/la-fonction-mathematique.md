---
order: 1
---

# La fonction mathématique

Ce chapitre pose une notion reprise dans les statistiques, le machine learning et l'intelligence artificielle : la fonction, au sens mathématique, à ne pas confondre avec la [fonction en programmation](/?c=shells&s=bash&p=fonctions), qui lui emprunte son nom sans toujours en respecter la règle (voir le piège plus bas).

Une **fonction mathématique** est une règle qui associe, à chaque entrée, **toujours la même** sortie.

```text
f(x) = x * 2

f(3)  -> 6   (toujours 6, à chaque fois qu'on appelle f avec 3)
f(3)  -> 6   (rappelée avec la même entrée : même résultat, sans exception)
f(5)  -> 10
```

> **Analogie :** un distributeur automatique de boissons bien réglé : appuyer sur le bouton "A1" donne toujours la même boisson. Si un jour le même bouton donnait tantôt un jus de fruit, tantôt un café, ce ne serait plus une fonction au sens mathématique : le résultat ne dépendrait plus uniquement de l'entrée.

> **Piège :** une fonction en programmation (voir [Les fonctions](/?c=shells&s=bash&p=fonctions) en [Bash](/?c=shells&s=bash&p=bash), ou son équivalent dans n'importe quel autre langage) n'a **pas** cette garantie : une fonction qui lit l'heure courante, tire un nombre [aléatoire](/?c=representation-des-donnees&p=aleatoire-et-generateurs), ou lit un fichier peut renvoyer un résultat différent à chaque appel, avec la même entrée. On l'appelle alors une fonction **non déterministe** : un terme qui reviendra pour expliquer pourquoi certains systèmes (dont un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) ne répondent jamais deux fois exactement la même chose.
>
> **Bonne pratique :** en programmation, préférer une fonction déterministe (même entrée → toujours même sortie) chaque fois que c'est possible : un même appel donne alors un résultat prévisible, donc plus simple à tester et à déboguer.

## Une fonction peut recevoir plusieurs entrées

Rien n'oblige une fonction à n'avoir qu'une seule entrée :

```text
f(x, y) = x + y

f(2, 3)   -> 5
f(10, 1)  -> 11
```

Chaque entrée supplémentaire est un nouveau paramètre de la fonction, exactement comme une fonction en programmation peut recevoir plusieurs arguments. Cette forme à plusieurs entrées est la plus fréquente en pratique : un modèle de machine learning combine presque toujours plusieurs entrées (âge, salaire, historique...) pour produire une seule sortie.

> **Piège :** oublier qu'une entrée manquante n'a pas de sortie définie. `f(x, y) = x / y` n'a pas de résultat pour `y = 0` : la fonction n'est tout simplement pas définie à cet endroit, ce n'est pas une valeur particulière du type "zéro" ou "vide".
>
> **Bonne pratique :** identifier, avant de coder une fonction, les entrées pour lesquelles elle n'a pas de sortie sensée (division par zéro, racine carrée d'un nombre négatif...), et décider explicitement quoi faire dans ces cas (erreur, valeur par défaut) plutôt que de laisser le langage réagir à sa façon.

## Représenter une fonction par une courbe

Sur un graphique, chaque paire (entrée, sortie) devient un point : relier tous ces points dessine la **courbe** de la fonction, ici pour `f(x) = x²` :

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x²
```

Une courbe qui monte signifie que la sortie augmente avec l'entrée ; une courbe qui redescend signifie l'inverse : ici, la courbe descend jusqu'à `x = 0` puis remonte, exactement le genre de creux que le chapitre sur [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient) apprend à repérer, pour expliquer comment un ordinateur "descend" une courbe afin de trouver son point le plus bas.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une fonction mathématique associe à chaque entrée toujours la même sortie (`f(x)`), peut recevoir plusieurs entrées (`f(x, y)`), et se représente visuellement par une courbe. |
| **Outils utilisables** | Aucun outil spécifique : la notation `f(x) = ...` suffit à décrire une fonction sur le papier. |
| **Pièges à éviter** | Confondre une fonction mathématique (toujours déterministe) avec une fonction en programmation, qui peut ne pas l'être (heure courante, aléatoire, lecture de fichier). Oublier qu'une entrée peut n'avoir aucune sortie définie (division par zéro). |
| **Bonnes pratiques** | Vérifier qu'une fonction en programmation censée être "pure" (même entrée → même sortie) ne dépend d'aucune source externe changeante. Décider explicitement quoi faire des entrées sans sortie définie plutôt que de laisser le langage réagir à sa façon. |
