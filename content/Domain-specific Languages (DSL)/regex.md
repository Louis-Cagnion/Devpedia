---
order: 1
---

# La regex

## Qu'est-ce qu'une regex ?

Une **regex** (expression régulière, *regular expression*) est un mini-langage qui décrit un **motif** (pattern) de caractères. Ce motif sert à rechercher, valider ou extraire des portions de texte qui correspondent à une structure donnée.

Ce n'est **pas** un langage de programmation : pas de variables, pas de boucles, pas de fonctions. Une regex a besoin d'être interprétée par un **moteur regex**, intégré au langage que tu utilises (JavaScript, Python, etc.), via des méthodes comme `.test()` ou `.match()`.

## Les bases de la syntaxe

### Caractères littéraux

Un caractère normal dans une regex matche exactement lui-même :

```text
chat
```

Cette regex matche la suite de caractères `chat`, n'importe où dans le texte.

### Les classes de caractères

| Symbole | Signification                          |
|---------|-----------------------------------------|
| `.`     | N'importe quel caractère (sauf retour à la ligne) |
| `\d`    | Un chiffre (0-9)                        |
| `\D`    | Tout sauf un chiffre                    |
| `\w`    | Une lettre, un chiffre ou `_`            |
| `\W`    | Tout sauf une lettre/chiffre/`_`         |
| `\s`    | Un espace (espace, tabulation, retour à la ligne) |
| `\S`    | Tout sauf un espace                     |
| `[abc]` | Un seul caractère parmi `a`, `b` ou `c`  |
| `[^abc]`| Un seul caractère qui n'est ni `a`, `b`, ni `c` |
| `[a-z]` | Un seul caractère entre `a` et `z`       |

### Les quantificateurs

| Symbole  | Signification                         |
|----------|----------------------------------------|
| `*`      | 0 ou plusieurs fois                    |
| `+`      | 1 ou plusieurs fois                    |
| `?`      | 0 ou 1 fois (rend optionnel)           |
| `{n}`    | Exactement n fois                      |
| `{n,}`   | n fois minimum, sans maximum           |
| `{n,m}`  | Entre n et m fois                      |

### Les ancres

| Symbole | Signification                  |
|---------|----------------------------------|
| `^`     | Début de la ligne/chaîne        |
| `$`     | Fin de la ligne/chaîne          |

### Les groupes

```text
(abc)
```

Un groupe capturant : il isole une portion du motif pour pouvoir **récupérer** ce qu'il a matché (`match[1]`, `match[2]`...), et permet d'appliquer un quantificateur à plusieurs caractères à la fois.

```text
(?:abc)
```

Un groupe non-capturant : regroupe sans créer d'entrée récupérable dans le résultat du match.

### Les assertions (lookahead / lookbehind)

Elles vérifient ce qu'il y a autour d'une position, **sans consommer** ces caractères dans le match.

| Symbole    | Signification                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Doit être suivi de `abc`                    |
| `(?!abc)`  | Ne doit pas être suivi de `abc`              |
| `(?<=abc)` | Doit être précédé de `abc`                  |
| `(?<!abc)` | Ne doit pas être précédé de `abc`            |

## Les flags (options globales)

Les flags se placent après le dernier `/` de la regex en JavaScript :

```javascript
/motif/flags
```

| Flag | Effet                                       |
|------|----------------------------------------------|
| `g`  | Recherche **globale** (toutes les occurrences, pas juste la première) |
| `i`  | Insensible à la casse (majuscules/minuscules) |
| `m`  | Mode multiligne (`^` et `$` s'appliquent à chaque ligne) |

## Exemple complet, construit étape par étape

Objectif : reconnaître une ligne qui contient **uniquement** un lien Markdown, du type `[texte](url)`.

### Étape 1 : les crochets littéraux

En regex, `[` et `]` sont des caractères **spéciaux** (ils servent à écrire une classe de caractères, comme `[abc]` vu plus haut). Pour matcher un crochet **littéral** (le vrai caractère `[` du texte), il faut l'échapper avec un backslash :

```text
\[
```

```text
\]
```

`\[` matche le caractère `[`, et `\]` matche le caractère `]`, rien d'autre.

### Étape 2 : le texte à l'intérieur des crochets

Entre les deux crochets, on veut accepter **n'importe quel caractère, sauf** un crochet fermant (sinon la regex risquerait de s'arrêter trop tôt ou de matcher plusieurs liens d'un coup). On utilise une classe de caractères **négative** :

```text
[^\]]
```

- Les `[ ]` ici sont la vraie syntaxe de classe de caractères (pas littérale, contrairement à l'étape 1).
- `^` en première position **à l'intérieur** d'une classe signifie "tout sauf" : donc `[^\]]` veut dire "n'importe quel caractère sauf `]`".
- Ajoute `*` pour répéter ça "0 ou plusieurs fois" (un texte de n'importe quelle longueur, ou même vide) :

```text
[^\]]*
```

On veut aussi **récupérer** ce texte ensuite (pour savoir ce qu'il y a entre les crochets) → on l'entoure d'un groupe capturant avec `( )` :

```text
([^\]]*)
```

### Étape 3 : assembler les crochets et le groupe

```text
\[([^\]]*)\]
```

Ça donne : un `[` littéral, puis le texte capturé, puis un `]` littéral. Ça matche par exemple `[texte]`, `[]` (texte vide), `[mon super lien]`...

### Étape 4 : la même logique pour les parenthèses

Même principe, mais pour `(url)` :

- `\(` et `\)` → parenthèses littérales échappées (elles aussi spéciales en regex, utilisées normalement pour les groupes).
- À l'intérieur, on veut le contenu de l'URL : n'importe quel caractère sauf un espace (`\s`) et sauf une parenthèse fermante (`)`) : sinon la regex pourrait inclure du texte après le lien par erreur.

```text
[^\s)]+
```

Ici on utilise `+` (1 fois minimum) plutôt que `*`, car une URL vide n'a pas de sens.

On capture aussi ce groupe :

```text
\(([^\s)]+)\)
```

### Étape 5 : exiger que ce soit toute la ligne

Pour l'instant, la regex pourrait matcher un lien **au milieu** d'une phrase plus longue. Si tu veux qu'elle ne matche que lorsque **toute la ligne** est exactement ce lien (rien avant, rien après), on ajoute les ancres vues plus haut :

```text
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → la ligne doit commencer exactement ici
- `$` → la ligne doit se terminer exactement ici

### Résultat final

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Récapitulatif des morceaux :

- `^` → début de ligne obligatoire
- `\[` → un `[` littéral
- `([^\]]*)` → groupe 1 : le texte du lien (tout sauf `]`)
- `\]` → un `]` littéral
- `\(` → une `(` littérale
- `([^\s)]+)` → groupe 2 : l'URL (tout sauf espace et `)`)
- `\)` → une `)` littérale
- `$` → fin de ligne obligatoire

Avec `"[mon lien](https://exemple.com)".match(regex)`, tu obtiens `match[1] = "mon lien"` et `match[2] = "https://exemple.com"`.

> **Piège :** une regex trop permissive (par exemple oublier d'ancrer avec `^`/`$`) peut matcher bien plus que prévu : un motif de validation d'email sans ancrage accepterait "n'importe quoi contenant un @" au milieu d'un texte plus long, pas seulement une adresse email complète.
>
> **Bonne pratique :** tester une regex sur des cas limites volontairement pièges (chaîne vide, caractères spéciaux, texte plus long que prévu) avant de l'utiliser en production : un outil comme regex101.com permet de le faire interactivement.

## Pour aller plus loin

- [Expressions régulières (MDN, Mozilla Developer Network, la documentation de référence du web)](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com) : testeur de regex interactif avec explications en direct

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une regex décrit un motif de caractères pour rechercher, valider ou extraire du texte, interprétée par un moteur regex intégré au langage hôte, pas un langage de programmation à part entière. |
| **Outils utilisables** | Classes de caractères (`\d`, `\w`, `\s`), quantificateurs (`*`, `+`, `?`, `{n,m}`), groupes capturants, flags (`g`, `i`, `m`). |
| **Pièges à éviter** | Oublier d'ancrer un motif (`^`/`$`) qui doit correspondre à la chaîne entière, pas seulement à une partie. |
| **Bonnes pratiques** | Construire une regex complexe étape par étape, en testant chaque ajout ; vérifier son comportement sur des cas limites avant de l'utiliser en production. |
