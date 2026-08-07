---
order: 9
---

# Les regex

Une regex (expression régulière) est un modèle utilisé pour rechercher, valider ou remplacer des portions de texte dans une string.

Elle peut être écrite de 2 manières différentes :
```javascript
    //littéral, la plus courante
    const re1 = /hello/;

    //avec le constructeur RegExp, utile quand le motif est dynamique
    const re2 = new RegExp('hello');
```

### Les flags

Les flags se placent après le dernier slash et modifient le comportement de la regex.

**`g`** (global) recherche toutes les occurrences dans la string, et pas seulement la première.
```javascript
    const re1 = /hello/g;
```

**`i`** (insensitive) ignore la casse, donc ne fait pas de différence entre majuscules et minuscules.
```javascript
    const re2 = /hello/i;
```

**`m`** (multiline) active le mode multiligne, ce qui change le comportement de `^` et `$` : ils correspondent alors au début/à la fin de chaque ligne, et non plus seulement à celui de toute la string.
```javascript
    const re3 = /hello/m;
```

On peut combiner plusieurs flags ensemble.
```javascript
    const re4 = /hello/gi;
```

### Les prototypes de regex

Les prototypes sont des fonctions intégrées à l'objet RegExp par défaut, permettant d'effectuer certaines actions avec la regex.

```javascript
    const re = /wor(l)d/;
    const str = 'hello world';
```

**`test`** vérifie si la string correspond à la regex, et renvoie simplement `true` ou `false`.
```javascript
    re.test(str); // true
```

**`exec`** renvoie un tableau avec les détails de la première correspondance trouvée, ou `null` si aucune correspondance n'est trouvée. Dans ce tableau, l'index 0 contient la correspondance complète, et les index suivants contiennent les groupes capturés (entre parenthèses dans la regex).
```javascript
    re.exec(str); // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Les prototypes de strings utilisant des regex

Certains prototypes de l'objet string acceptent une regex en paramètre pour effectuer des recherches ou remplacements plus avancés.

```javascript
    const str = 'hello world';
```

**`match`** renvoie le premier résultat correspondant à la regex (ou `null` si aucun). Si la regex utilise le flag `g`, elle renvoie à la place un tableau contenant toutes les correspondances, mais sans les détails des groupes capturés.
```javascript
    str.match(/o/g); // ['o', 'o']
```

**`matchAll`** fonctionne comme `match` avec le flag `g`, mais nécessite obligatoirement ce flag. Elle renvoie un itérateur donnant accès aux détails de chaque correspondance, y compris les groupes capturés.
```javascript
    const str = "Jean:25 Marie:30";
    const resultat = [...str.matchAll(/(\w+):(\d+)/g)];

    console.log(resultat);
    /*  
    [
        [
            "Jean:25",           // correspondance complète
            "Jean",              // groupe 1
            "25",                // groupe 2
            index: 0,
            input: "Jean:25 Marie:30",
            groups: undefined
        ],
        [
            "Marie:30",
            "Marie",
            "30",
            index: 8,
            input: "Jean:25 Marie:30",
            groups: undefined
        ]
    ]
    */
```

**`search`** renvoie l'index de la première correspondance à la regex dans la string, ou `-1` si aucune correspondance n'est trouvée.
```javascript
    str.search(/world/); // 6
```

**`replace`** et **`replaceAll`** renvoient une copie de la string avec une partie remplacée par une autre : `replace` ne remplace que la première occurrence correspondant à la regex (sauf si elle a le flag `g`), tandis que `replaceAll` nécessite obligatoirement ce flag pour remplacer toutes les occurrences.
```javascript
    str.replace(/o/g, '0'); // 'hell0 w0rld'
    str.replaceAll(/o/g, '0'); // necessite le flag g, sinon erreur
```

**`split`** découpe la string en un tableau de sous-chaînes, en utilisant la regex comme séparateur.
```javascript
    str.split(/\s/); // ['hello', 'world']
```

### Les groupes de capture

Les parenthèses dans une regex permettent de capturer une partie précise de la correspondance. Ces parties capturées sont ensuite récupérables via `exec` ou `match`.

```javascript
    const re = /(\d{4})-(\d{2})-(\d{2})/;
    const date = '2024-06-15';

    const result = date.match(re);
    result[1]; // '2024' (année)
    result[2]; // '06' (mois)
    result[3]; // '15' (jour)
```

On peut aussi nommer les groupes pour les rendre plus lisibles, et y accéder par leur nom via la propriété `groups`.
```javascript
    const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
    const resultNamed = reNamed.exec(date);
    resultNamed.groups.annee; // '2024'
```

> **Piège :** une regex littérale avec le flag `g`, réutilisée plusieurs fois avec `.test()` ou `.exec()`, conserve un état interne (`lastIndex`) entre les appels — un second `.test()` sur la même regex peut renvoyer `false` alors que le texte correspond, simplement parce que la recherche reprend après la position de la correspondance précédente. Créer une nouvelle regex (ou réinitialiser `lastIndex = 0`) évite ce piège.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une regex décrit un motif de recherche/validation/remplacement dans une string. `test()` renvoie un booléen, `exec()`/`match()`/`matchAll()` donnent accès aux détails de la correspondance (dont les groupes capturés). |
| **Outils utilisables** | Flags `g`/`i`/`m`, groupes nommés (`(?<nom>...)`), `replace`/`replaceAll`/`split` sur une string avec une regex. |
| **Pièges à éviter** | Réutiliser une regex `g` avec `.test()`/`.exec()` dans une boucle sans tenir compte de son état interne (`lastIndex`). |
| **Bonnes pratiques** | Nommer les groupes de capture dès qu'une regex en a plusieurs, pour un accès plus lisible que par index numérique. |
