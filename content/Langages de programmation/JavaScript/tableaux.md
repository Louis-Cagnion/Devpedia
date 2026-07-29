---
order: 5
---

# Les tableaux

Un tableau (array) en JavaScript est une structure permettant de stocker plusieurs valeurs dans une seule variable, sous forme de liste ordonnée. Chaque valeur est accessible via son index, qui commence toujours à 0.

Il peut être créé de 2 manières différentes :
```javascript
    //littéral, la plus courante
    const arr1 = [1, 2, 3];

    //avec le constructeur Array
    const arr2 = new Array(1, 2, 3);

    //un tableau peut contenir des types differents, y compris d'autres tableaux ou objets
    const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Les prototypes de tableaux

Les prototypes sont des fonctions intégrées à l'objet array par défaut, permettant d'effectuer certaines actions sur le tableau (ajouter, retirer, transformer, parcourir des éléments...).

```javascript
    const arr = [1, 2, 3, 4, 5];
```

**`includes`** vérifie si une valeur est présente dans le tableau et renvoie `true` ou `false`.
```javascript
    arr.includes(3); // true
```

**`length`** n'est pas une fonction mais une propriété : elle renvoie le nombre d'éléments du tableau.
```javascript
    arr.length; // 5
```

**`push`** et **`pop`** modifient le tableau à sa fin : `push` ajoute un élément, `pop` retire le dernier élément et le renvoie.
```javascript
    arr.push(6); // arr devient [1, 2, 3, 4, 5, 6]
    arr.pop(); // retire 6 et le renvoie, arr redevient [1, 2, 3, 4, 5]
```

**`unshift`** et **`shift`** font la même chose que `push`/`pop`, mais au début du tableau.
```javascript
    arr.unshift(0); // arr devient [0, 1, 2, 3, 4, 5]
    arr.shift(); // retire 0 et le renvoie, arr redevient [1, 2, 3, 4, 5]
```

**`slice`** renvoie une copie d'une portion du tableau, entre un index de début (inclus) et un index de fin (exclu), sans modifier le tableau d'origine.
```javascript
    arr.slice(0, 2); // [1, 2]
```

**`splice`** modifie directement le tableau : elle retire un certain nombre d'éléments à partir d'un index donné, et peut aussi en insérer de nouveaux à la même place.
```javascript
    arr.splice(1, 2); // retire 2 elements a partir de l'index 1, arr devient [1, 4, 5]
```

**`indexOf`** cherche une valeur dans le tableau et renvoie son index. Si la valeur n'existe pas, elle renvoie `-1`.
```javascript
    arr.indexOf(3); // 2
```

**`map`** crée un nouveau tableau en appliquant une fonction à chaque élément. Le tableau d'origine n'est pas modifié.
```javascript
    arr.map(n => n * 2); // [2, 4, 6, 8, 10]
```

**`filter`** crée un nouveau tableau contenant uniquement les éléments qui valident une condition (une fonction qui renvoie `true` ou `false`).
```javascript
    arr.filter(n => n > 2); // [3, 4, 5]
```

**`forEach`** exécute une fonction pour chaque élément du tableau, mais ne renvoie rien. Elle sert surtout à effectuer une action (par exemple un affichage), pas à transformer des données.
```javascript
    arr.forEach(n => console.log(n));
```

**`some`** renvoie `true` si au moins un élément du tableau valide une condition.
```javascript
    arr.some(n => n > 4); // true
```

**`every`** renvoie `true` uniquement si tous les éléments du tableau valident une condition.
```javascript
    arr.every(n => n > 0); // true
```

**`find`** renvoie le premier élément qui valide une condition, ou `undefined` si aucun élément ne correspond.
```javascript
    arr.find(n => n > 2); // 3
```

**`findIndex`** fonctionne comme `find`, mais renvoie l'index de l'élément trouvé (ou `-1` si aucun).
```javascript
    arr.findIndex(n => n > 2); // 2
```

**`reduce`** parcourt le tableau pour le réduire à une seule valeur, en accumulant un résultat à chaque étape. Le premier paramètre est la fonction d'accumulation, le second est la valeur de départ de l'accumulateur.
```javascript
    arr.reduce((acc, n) => acc + n, 0); // 15
```

**`join`** transforme le tableau en une seule string, en séparant chaque élément par le caractère donné en paramètre.
```javascript
    arr.join(', '); // '1, 2, 3, 4, 5'
```

**`reverse`** inverse l'ordre des éléments du tableau, et modifie directement le tableau d'origine.
```javascript
    arr.reverse(); // [5, 4, 3, 2, 1]
```

**`sort`** trie les éléments du tableau. Par défaut, le tri se fait en convertissant les éléments en string (ce qui pose problème avec les nombres), il faut donc fournir une fonction de comparaison pour trier des nombres correctement.
```javascript
    arr.sort((a, b) => a - b);
```

**`concat`** assemble plusieurs tableaux en un seul nouveau tableau, sans modifier les tableaux d'origine.
```javascript
    arr.concat([6, 7]); // [1, 2, 3, 4, 5, 6, 7]
```

### Le destructuring et le spread

Le **destructuring** permet d'extraire directement des valeurs d'un tableau dans des variables, dans l'ordre des éléments.
```javascript
    const arr = [1, 2, 3];
    const [premier, deuxieme] = arr; // premier = 1, deuxieme = 2
```

Le **spread** (`...`) permet de "déplier" un tableau, ce qui est utile pour le copier ou en fusionner plusieurs entre eux.
```javascript
    const copie = [...arr]; // copie independante de arr
    const fusion = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```
