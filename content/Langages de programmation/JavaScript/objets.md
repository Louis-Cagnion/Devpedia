---
order: 7
---

# Les objets

Un objet en JavaScript est une structure permettant de stocker des données sous forme de paires clé/valeur. Contrairement au tableau, l'ordre n'est pas l'élément important : on accède à une valeur via son nom (la clé), pas via un index numérique.

Il peut être créé de 2 manières différentes :
```javascript
    //littéral, la plus courante
    const obj1 = { nom: 'Jean', age: 25 };

    //avec le constructeur Object
    const obj2 = new Object();
    obj2.nom = 'Jean';

    //une valeur peut être de n'importe quel type, y compris une fonction ou un autre objet
    const obj3 = {
        nom: 'Jean',
        adresse: { ville: 'Paris', code: 75000 },
        direBonjour: function () { console.log('bonjour'); }
    };
```

### Accéder et modifier les propriétés

Il existe 2 façons d'accéder à une propriété d'un objet : la notation par point, et la notation par crochets (utile quand le nom de la clé est dynamique ou contient des caractères spéciaux).
```javascript
    const obj = { nom: 'Jean', age: 25 };

    obj.nom; // 'Jean'
    obj['nom']; // 'Jean', equivalent a obj.nom

    //ajout ou modification d'une propriete
    obj.ville = 'Paris';
    obj.age = 26;

    //suppression d'une propriete
    delete obj.age;
```

### Les méthodes statiques d'Object

Contrairement aux prototypes de string ou d'array, ces fonctions ne s'utilisent pas directement sur l'objet mais sur `Object`, en lui passant l'objet en paramètre.

```javascript
    const obj = { nom: 'Jean', age: 25 };
```

**`Object.keys`** renvoie un tableau contenant uniquement les clés de l'objet.
```javascript
    Object.keys(obj); // ['nom', 'age']
```

**`Object.values`** renvoie un tableau contenant uniquement les valeurs de l'objet.
```javascript
    Object.values(obj); // ['Jean', 25]
```

**`Object.entries`** renvoie un tableau de paires `[clé, valeur]`, utile pour parcourir un objet avec une boucle ou `forEach`.
```javascript
    Object.entries(obj); // [['nom', 'Jean'], ['age', 25]]
```

**`Object.assign`** copie les propriétés d'un ou plusieurs objets source dans un objet cible, et renvoie cet objet cible. Souvent utilisé pour fusionner des objets ou en faire une copie.
```javascript
    const copie = Object.assign({}, obj); // copie de obj
    const fusion = Object.assign({}, obj, { ville: 'Paris' }); // { nom: 'Jean', age: 25, ville: 'Paris' }
```

**`Object.freeze`** empêche toute modification de l'objet (ajout, suppression ou changement de propriété). Toute tentative de modification est ignorée silencieusement (ou provoque une erreur en mode strict).
```javascript
    Object.freeze(obj);
    obj.age = 30; // n'a aucun effet, obj.age reste 25
```

**`Object.fromEntries`** fait l'inverse d'`Object.entries` : elle transforme un tableau de paires `[clé, valeur]` en objet.
```javascript
    Object.fromEntries([['nom', 'Jean'], ['age', 25]]); // { nom: 'Jean', age: 25 }
```

### Vérifier une propriété

**`hasOwnProperty`** est un prototype disponible directement sur un objet : il renvoie `true` si la clé donnée existe sur l'objet lui-même (et non héritée).
```javascript
    obj.hasOwnProperty('nom'); // true
    obj.hasOwnProperty('inconnu'); // false
```

**L'opérateur `in`** vérifie aussi l'existence d'une clé, mais en incluant les propriétés héritées.
```javascript
    'nom' in obj; // true
```

### Le destructuring et le spread

Le **destructuring** permet d'extraire directement certaines propriétés d'un objet dans des variables, en utilisant le nom des clés.
```javascript
    const obj = { nom: 'Jean', age: 25 };
    const { nom, age } = obj; // nom = 'Jean', age = 25

    //on peut renommer une variable lors du destructuring
    const { nom: prenom } = obj; // prenom = 'Jean'
```

Le **spread** (`...`) permet de "déplier" un objet, ce qui est utile pour le copier ou en fusionner plusieurs entre eux.
```javascript
    const copie = { ...obj }; // copie independante de obj
    const fusion = { ...obj, ville: 'Paris' }; // { nom: 'Jean', age: 25, ville: 'Paris' }
```

> **Piège :** `{ ...obj }` et `Object.assign({}, obj)` ne font qu'une copie **superficielle** (*shallow copy*) : si une propriété est elle-même un objet ou un tableau, la copie et l'original continuent de partager la **même** référence à cet objet imbriqué : le modifier depuis l'un le modifie aussi depuis l'autre.
>
> **Bonne pratique :** pour une copie vraiment indépendante d'un objet aux propriétés imbriquées, utiliser `structuredClone(obj)` (natif, moderne) ou reconstruire manuellement les niveaux imbriqués.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un objet stocke des paires clé/valeur, accessibles par notation pointée ou par crochets. `Object.keys`/`values`/`entries` exposent son contenu ; le spread et le destructuring copient ou extraient des propriétés. |
| **Outils utilisables** | `Object.keys`/`values`/`entries`/`assign`/`freeze`/`fromEntries`, `hasOwnProperty`, l'opérateur `in`. |
| **Pièges à éviter** | Croire qu'une copie par spread ou `Object.assign` est profonde : elle ne l'est pas pour les propriétés imbriquées. |
| **Bonnes pratiques** | Utiliser `structuredClone()` pour une copie réellement indépendante d'un objet imbriqué ; `Object.freeze()` pour empêcher toute modification accidentelle d'un objet censé rester constant. |
