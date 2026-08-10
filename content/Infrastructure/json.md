---
order: 2
---

# Le format JSON

Une [API](/?c=infrastructure&p=api-et-http) répond avec des données — encore faut-il un format commun pour les écrire, que le programme qui les reçoit puisse comprendre sans ambiguïté. **JSON** (*JavaScript Object Notation*) est le format le plus utilisé pour ça : un texte structuré, lisible aussi bien par un humain que par un programme.

## Les types de valeurs en JSON

| Type | Exemple | Remarque |
|---|---|---|
| Texte (*string*) | `"Lyon"` | Toujours entre guillemets doubles |
| Nombre | `18`, `3.14` | Jamais entre guillemets |
| Booléen | `true`, `false` | |
| Valeur absente | `null` | "Aucune valeur", pas la même chose qu'un texte vide `""` ou un `0` |
| Liste (*array*) | `[1, 2, 3]` | Une suite ordonnée de valeurs |
| Objet | `{"cle": valeur}` | Un ensemble de paires clé/valeur |

Texte, nombre et booléen sont les mêmes types de base déjà vus dans [la variable](/?c=bases-de-l-informatique&p=la-variable) — JSON ajoute la liste et l'objet, pour représenter des données composées de plusieurs valeurs.

## Un exemple concret

```json
{
  "ville": "Lyon",
  "temperature": 18,
  "nuageux": true,
  "previsions": [19, 21, 17],
  "station": null
}
```

Un objet (délimité par `{ }`) associe chaque clé (`"ville"`, `"temperature"`...) à une valeur — ici un texte, un nombre, un booléen, une liste de nombres, et une valeur absente.

## Objets et listes peuvent s'imbriquer

Rien n'empêche une liste de contenir des objets, ou un objet de contenir une liste — c'est même la structure la plus courante pour des données réelles :

```json
{
  "clients": [
    {"nom": "Dupont", "age": 34},
    {"nom": "Martin", "age": 28}
  ]
}
```

Ici, `clients` est une liste de deux objets, chacun avec ses propres clés `nom` et `age`.

> **Piège :** perdre le fil de l'imbrication sur un JSON profondément imbriqué (objets dans des listes dans des objets...) et accéder à la mauvaise valeur, en particulier écrit ou relu à la main.
>
> **Bonne pratique :** utiliser un outil qui met en forme et colore le JSON (la plupart des éditeurs de code le font nativement) pour repérer visuellement quelle accolade ou quel crochet correspond à quel autre, plutôt que de le relire comme un texte brut.

## JSON n'accepte pas tout

Contrairement à beaucoup de formats de configuration, JSON est strict : pas de commentaires, pas de virgule après le dernier élément d'une liste ou d'un objet, et les clés doivent être entre guillemets **doubles** (jamais simples).

```json
{
  "nom": "Jean",
  "age": 30,   <- une virgule ici, apres le dernier element, est une erreur de syntaxe
}
```

> **Piège :** ajouter un commentaire (`// ...`) ou une virgule finale par habitude d'un autre langage. Un JSON invalide pour cette raison échoue explicitement à l'analyse (le programme qui tente de le lire lève une erreur), il n'est jamais interprété "à peu près".
>
> **Bonne pratique :** valider un JSON écrit à la main avec un outil dédié (linter, validateur en ligne, ou simplement l'éditeur de code) avant de l'utiliser, plutôt que de découvrir l'erreur de syntaxe une fois le programme lancé.

## Convertir entre JSON et un programme

Un texte JSON reste une simple chaîne de caractères tant qu'il n'a pas été **analysé** (*parsed*) — transformé en structure de données que le langage peut manipuler directement (accéder à une clé, parcourir une liste...). L'opération inverse (reconvertir une structure de données en texte JSON) s'appelle la **génération** ou la **sérialisation** :

```text
texte_json = '{"ville": "Lyon", "temperature": 18}'

donnee = analyser_json(texte_json)     // texte -> structure native du langage
donnee.temperature                       // 18, utilisable comme un nombre normal

nouveau_texte = generer_json(donnee)   // structure -> texte JSON a nouveau
```

> **Piège :** essayer d'extraire une valeur directement dans le texte brut (recherche d'un motif, découpage de chaîne) plutôt que d'analyser le JSON correctement — une valeur qui contient par coïncidence la même suite de caractères que la clé recherchée ailleurs dans le texte peut fausser le résultat.
>
> **Bonne pratique :** toujours passer par une fonction d'analyse JSON dédiée (présente nativement dans la quasi-totalité des langages) plutôt que de traiter le JSON comme du texte ordinaire.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | JSON représente des données structurées en texte, avec des objets (clé/valeur) et des listes, pouvant s'imbriquer librement. C'est le format le plus courant pour les échanges via une API. |
| **Outils utilisables** | Un éditeur de code (coloration syntaxique, mise en forme automatique) ; un validateur JSON en ligne ; la fonction d'analyse JSON native du langage utilisé. |
| **Pièges à éviter** | Ajouter un commentaire ou une virgule après le dernier élément (syntaxe invalide). Manipuler du JSON comme du texte brut plutôt que de l'analyser. |
| **Bonnes pratiques** | Valider un JSON écrit à la main avant de l'utiliser. Toujours passer par une fonction d'analyse dédiée pour en extraire une valeur. |
