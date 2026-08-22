---
order: 9
---

# Les regex

Une regex (expression régulière) est un modèle utilisé pour rechercher, valider ou remplacer des portions de texte dans une string.

Elle peut être écrite de 2 manières différentes :

```javascript
// littéral, la plus courante
const re1 = /hello/;

// avec le constructeur RegExp, utile quand le motif est dynamique
const re2 = new RegExp('hello');
```

### Les flags

Les flags se placent après le dernier slash et modifient le comportement de la regex ; on peut en combiner plusieurs (`/hello/gi`) :

| Flag | Nom | Effet |
|---|---|---|
| `g` | *global* | Recherche **toutes** les occurrences dans la string, pas seulement la première |
| `i` | *insensitive* | Ignore la casse : ne distingue pas majuscules et minuscules |
| `m` | *multiline* | `^`/`$` correspondent au début/à la fin de **chaque ligne**, pas seulement de toute la string |

### Les prototypes de regex

Les prototypes sont des fonctions intégrées à l'objet RegExp par défaut, permettant d'effectuer certaines actions avec la regex :

| Méthode | Renvoie |
|---|---|
| `regex.test(str)` | `true`/`false` selon que la string correspond à la regex |
| `regex.exec(str)` | Détails de la première correspondance (ou `null`) : index 0 = correspondance complète, index suivants = groupes capturés |

```javascript
const re = /wor(l)d/;
const str = 'hello world';

re.test(str);  // true
re.exec(str);  // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Les prototypes de strings utilisant des regex

Certains prototypes de l'objet string acceptent une regex en paramètre pour effectuer des recherches ou remplacements plus avancés :

| Méthode | Renvoie |
|---|---|
| `str.match(regex)` | Première correspondance (ou `null`) ; avec le flag `g`, toutes les correspondances mais sans détail des groupes |
| `str.matchAll(regex)` | Itérateur de toutes les correspondances, avec leurs groupes ; flag `g` **obligatoire** |
| `str.search(regex)` | Index de la première correspondance, `-1` si absente |
| `str.replace(regex, x)` | Remplace la première occurrence (ou toutes, avec le flag `g`) |
| `str.replaceAll(regex, x)` | Remplace toutes les occurrences ; flag `g` **obligatoire**, sinon erreur |
| `str.split(regex)` | Découpe en tableau de sous-chaînes, la regex servant de séparateur |

```javascript
const str = 'hello world';

str.match(/o/g);         // ['o', 'o']
str.search(/world/);     // 6
str.replace(/o/g, '0');  // 'hell0 w0rld'
str.split(/\s/);         // ['hello', 'world']
```

`matchAll` donne accès au détail de chaque correspondance (groupes inclus), là où `match` avec `g` ne renvoie que les correspondances brutes :

```javascript
const str2 = "Jean:25 Marie:30";
const resultat = [...str2.matchAll(/(\w+):(\d+)/g)];

console.log(resultat);
/*
[
    ["Jean:25", "Jean", "25", index: 0, input: "Jean:25 Marie:30", groups: undefined],
    ["Marie:30", "Marie", "30", index: 8, input: "Jean:25 Marie:30", groups: undefined]
]
-> pour chaque correspondance : la chaîne complète, puis chaque groupe capturé (\w+ et \d+)
*/
```

### Les groupes de capture

Les parenthèses dans une regex permettent de capturer une partie précise de la correspondance. Ces parties capturées sont ensuite récupérables via `exec` ou `match` :

```javascript
const re = /(\d{4})-(\d{2})-(\d{2})/;
const date = '2024-06-15';

const result = date.match(re);
result[1];  // '2024' (année)
result[2];  // '06' (mois)
result[3];  // '15' (jour)
```

On peut aussi nommer les groupes pour les rendre plus lisibles, et y accéder par leur nom via la propriété `groups` :

```javascript
const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
const resultNamed = reNamed.exec(date);
resultNamed.groups.annee; // '2024'
```

> **Piège :** une regex littérale avec le flag `g`, réutilisée plusieurs fois avec `.test()` ou `.exec()`, conserve un état interne (`lastIndex`) entre les appels : un second `.test()` sur la même regex peut renvoyer `false` alors que le texte correspond, simplement parce que la recherche reprend après la position de la correspondance précédente. Créer une nouvelle regex (ou réinitialiser `lastIndex = 0`) évite ce piège.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une regex décrit un motif de recherche/validation/remplacement dans une string. `test()` renvoie un booléen, `exec()`/`match()`/`matchAll()` donnent accès aux détails de la correspondance (dont les groupes capturés). |
| **Outils utilisables** | Flags `g`/`i`/`m`, groupes nommés (`(?<nom>...)`), `replace`/`replaceAll`/`split` sur une string avec une regex. |
| **Pièges à éviter** | Réutiliser une regex `g` avec `.test()`/`.exec()` dans une boucle sans tenir compte de son état interne (`lastIndex`). |
| **Bonnes pratiques** | Nommer les groupes de capture dès qu'une regex en a plusieurs, pour un accès plus lisible que par index numérique. |
