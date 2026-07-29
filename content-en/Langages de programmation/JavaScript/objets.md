---
order: 6
---

# Objects

A JavaScript object is a structure used to store data as key-value pairs. Unlike an array, the order is not important: a value is accessed by its name (the key), not by a numeric index.

It can be created in two different ways:
```javascript
    // literal, the most common
    const obj1 = { nom: 'Jean', age: 25 };

    // using the Object constructor
    const obj2 = new Object();
    obj2.nom = 'Jean';

    // A value can be of any type, including a function or another object
    const obj3 = {
        nom: 'Jean',
        adresse: { ville: 'Paris', code: 75000 },
        direBonjour: function () { console.log('bonjour'); }
    };
```

### View and edit properties

There are two ways to access an object's property: dot notation and square bracket notation (useful when the key name is dynamic or contains special characters).
```javascript
    const obj = { nom: 'Jean', age: 25 };

    obj.nom; // 'Jean'
    obj['nom']; // 'Jean', equivalent to obj.nom

    // Adding or modifying a property
    obj.ville = 'Paris';
    obj.age = 26;

    // Deleting a property
    delete obj.age;
```

### Static Methods of Object

Unlike string or array prototypes, these functions are not used directly on the object but on `Object`, by passing the object as a parameter.

```javascript
    const obj = { nom: 'Jean', age: 25 };
```

**`Object.keys`** Returns an array containing only the object's keys.
```javascript
    Object.keys(obj); // ['name', 'age']
```

**`Object.values`** Returns an array containing only the object's values.
```javascript
    Object.values(obj); // ['Jean', 25]
```

**`Object.entries`** Returns an array of `[clé, valeur]` pairs, which is useful for iterating over an object using a loop or `forEach`.
```javascript
    Object.entries(obj); // [['name', 'Jean'], ['age', 25]]
```

**`Object.assign`** Copies the properties of one or more source objects into a target object and returns that target object. Often used to merge objects or create a copy of them.
```javascript
    const copie = Object.assign({}, obj); // copy of obj
    const fusion = Object.assign({}, obj, { ville: 'Paris' }); // { name: 'Jean', age: 25, city: 'Paris' }
```

**`Object.freeze`** Prevents any modification of the object (adding, removing, or changing ownership). Any attempt to modify it is silently ignored (or causes an error in strict mode).
```javascript
    Object.freeze(obj);
    obj.age = 30; // has no effect; obj.age remains 25
```

**`Object.fromEntries`** does the opposite of `Object.entries`: it converts an array of pairs `[clé, valeur]` into an object.
```javascript
    Object.fromEntries([['nom', 'Jean'], ['age', 25]]); // { name: 'Jean', age: 25 }
```

### Check a property

**`hasOwnProperty`** is a prototype available directly on an object: it returns `true` if the given key exists on the object itself (and is not inherited).
```javascript
    obj.hasOwnProperty('nom'); // true
    obj.hasOwnProperty('inconnu'); // false
```

**The `in` operator** also checks for the existence of a key, but includes inherited properties.
```javascript
    'nom' in obj; // true
```

### Destructuring and Spread

**Destructuring** allows you to directly extract certain properties of an object into variables using key names.
```javascript
    const obj = { nom: 'Jean', age: 25 };
    const { nom, age } = obj; // name = 'Jean', age = 25

    // You can rename a variable during destructuring
    const { nom: prenom } = obj; // first_name = 'Jean'
```

The `...` allows you to "expand" an object, which is useful for copying it or merging multiple objects together.
```javascript
    const copie = { ...obj }; // independent copy of obj
    const fusion = { ...obj, ville: 'Paris' }; // { name: 'Jean', age: 25, city: 'Paris' }
```
