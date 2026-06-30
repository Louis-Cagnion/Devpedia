---
title: Les strings en Javascript
---

Une string est une suite de caractères, utilisée pour représenter du texte. En JavaScript, elle peut être écrite de 3 manières différentes :
```javascript
    //simple quotes
    const st1 = 'Hello world';

    //double quotes
    const str2 = "Hello world";

    //backticks, utiles pour ecrire sur plusieurs lignes ou inserer des variables (template literals)
    const str3 = `
    Ce format
    permet d'écrire
    une string sur
    plusieurs lignes
    `;
```

### Les prototypes de strings

Les prototypes sont des fonctions intégrées à l'objet string par défaut, permettant d'effectuer certaines actions sur la string. Une string est immuable : ces fonctions ne la modifient jamais, elles renvoient toujours une nouvelle valeur.

```javascript
    const str = 'hello world';
```

**`includes`** vérifie si la string contient une sous-chaîne donnée, et renvoie `true` ou `false`.
```javascript
    str.includes('hello'); // true
```

**`length`** n'est pas une fonction mais une propriété : elle renvoie le nombre de caractères de la string.
```javascript
    str.length; // 11
```

**`slice`** renvoie une portion de la string, entre un index de début (inclus) et un index de fin (exclu).
```javascript
    str.slice(0, 5); // 'hello'
```

**`toUpperCase`** et **`toLowerCase`** renvoient une copie de la string entièrement en majuscules ou en minuscules.
```javascript
    str.toUpperCase(); // 'HELLO WORLD'
    str.toLowerCase(); // 'hello world'
```

**`trim`** renvoie une copie de la string sans les espaces inutiles au début et à la fin.
```javascript
    str.trim();
```

**`replace`** et **`replaceAll`** renvoient une copie de la string avec une partie remplacée par une autre : `replace` ne remplace que la première occurrence, `replaceAll` remplace toutes les occurrences.
```javascript
    str.replace('hello', 'hi'); // 'hi world'
    str.replaceAll('o', '0'); // 'hell0 w0rld'
```

**`split`** découpe la string en un tableau de sous-chaînes, selon un séparateur donné en paramètre.
```javascript
    str.split(' '); // ['hello', 'world']
```

**`indexOf`** cherche une sous-chaîne dans la string et renvoie l'index de sa première occurrence. Si elle n'existe pas, elle renvoie `-1`.
```javascript
    str.indexOf('world'); // 6
```

**`startsWith`** et **`endsWith`** vérifient si la string commence ou finit par une valeur donnée, et renvoient `true` ou `false`.
```javascript
    str.startsWith('hello'); // true
    str.endsWith('world'); // true
```

**`repeat`** renvoie une nouvelle string, en répétant la string d'origine un certain nombre de fois.
```javascript
    str.repeat(2); // 'hello worldhello world'
```

**`concat`** assemble plusieurs strings entre elles et renvoie le résultat, sans modifier les strings d'origine.
```javascript
    str.concat(' !'); // 'hello world !'
```

### Les regex

on peut utiliser les regex pour rechercher ou collecter des informations dans des strings (cf regex).