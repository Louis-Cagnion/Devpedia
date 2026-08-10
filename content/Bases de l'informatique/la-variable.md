---
order: 5
---

# La variable

Un [programme](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) exécute des instructions — la plupart d'entre elles manipulent des valeurs qu'il faut pouvoir garder en mémoire d'une ligne à l'autre. C'est le rôle de la variable.

Une **variable** est une boîte étiquetée qui contient une valeur, consultable ou modifiable plus tard.

```text
nom = "Jean"  → crée une boîte nommée "nom", y range la valeur "Jean"
age = 25      → crée une boîte nommée "age", y range la valeur 25
afficher nom  → va lire la boîte "nom", affiche "Jean"
age = 26      → remplace le contenu de la boîte "age" par 26 : la valeur change, la boîte reste la même
```

> **Analogie :** un casier étiqueté dans un vestiaire — on peut changer ce qu'il contient sans jamais changer l'étiquette collée dessus.

> **Piège :** confondre le nom de la variable et sa valeur. `age = 26` ne renomme pas "age" : ça remplace ce que la boîte contient, la boîte elle-même (son nom) ne change jamais.
>
> **Bonne pratique :** choisir un nom de variable qui décrit ce qu'elle contient (`age` plutôt que `x`) — le code se relit ensuite sans avoir à deviner ce qu'il y a dedans.

## Quelques types de valeurs courants

Toute valeur a un **type**, qui détermine ce qu'on peut en faire (additionner deux nombres a un sens, additionner deux textes non — le type décide) :

| Type | Ce que ça stocke | Exemple | Cas d'usage typique |
|---|---|---|---|
| Nombre | Une quantité, entière ou décimale | `25`, `19.99` | Compter, calculer un prix |
| Texte (*string*) | Une suite de caractères | `"Jean"` | Un nom, un message affiché |
| Booléen | Seulement deux valeurs possibles : vrai ou faux | `vrai`, `faux` | Une condition ("l'utilisateur est-il connecté ?") |

> **Approfondir :** un type comme "nombre" a en réalité ses propres limites et subtilités (une taille maximale, un arrondi possible en décimal) — voir [Les entiers, les bits et les débordements](/?c=representation-des-donnees&p=entiers-et-debordements) pour ce qui se passe réellement en mémoire derrière un type.

> **Piège :** mélanger les types dans une même opération, par exemple additionner un nombre et un texte (`5 + "25"`). Le résultat dépend entièrement du langage : certains lèvent une erreur, d'autres convertissent silencieusement l'un des deux, avec un résultat parfois inattendu (concaténer plutôt qu'additionner).
>
> **Bonne pratique :** convertir explicitement une valeur vers le type voulu avant une opération qui mélange les types, plutôt que de compter sur une conversion automatique dont le comportement exact n'est pas garanti d'un langage à l'autre.

La syntaxe exacte pour créer une variable change d'un langage à l'autre (le symbole `=` n'est pas toujours suffisant, certains langages exigent de préciser le type à l'avance) — chaque chapitre de langage sur ce site (Python, C, PHP...) couvre sa propre syntaxe en détail.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une variable associe un nom à une valeur, modifiable plus tard sans changer le nom. Chaque valeur a un **type** (nombre, texte, booléen...), qui détermine les opérations possibles sur elle. |
| **Outils utilisables** | Aucun outil spécifique — la création d'une variable est une instruction du langage lui-même, écrite directement dans le code. |
| **Pièges à éviter** | Confondre le nom de la variable et sa valeur : `age = 26` ne renomme pas "age", il remplace ce que la boîte contient. |
| **Bonnes pratiques** | Choisir un nom de variable qui décrit ce qu'elle contient (`age` plutôt que `x`) — le code se relit ensuite sans avoir à deviner. |
