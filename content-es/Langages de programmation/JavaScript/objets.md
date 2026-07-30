---
order: 6
---

# Los objetos

Un objeto en JavaScript es una estructura que permite almacenar datos en forma de pares clave/valor. A diferencia de un array, el orden no es lo importante: se accede a un valor a través de su nombre (la clave), no a través de un índice numérico.

Se puede crear de dos formas diferentes:
```javascript
    // literal, el más habitual
    const obj1 = { número: 'Jean', edad: 25 };

    // con el constructor Object
    const obj2 = new Object();
    obj2.número = 'Jean';

    // Un valor puede ser de cualquier tipo, incluida una función u otro objeto.
    const obj3 = {
        número: 'Jean',
        adresse: { ciudad: 'Paris', code: 75000 },
        direBonjour: function () { console.log('bonjour'); }
    };
```

### Acceder y modificar las propiedades

Hay dos formas de acceder a una propiedad de un objeto: la notación con punto y la notación entre corchetes (útil cuando el nombre de la clave es dinámico o contiene caracteres especiales).
```javascript
    const obj = { número: 'Jean', edad: 25 };

    obj.número; // «Jean»
    obj['nom']; // «Jean», equivalente a obj.nom

    // Añadir o modificar una propiedad
    obj.ciudad = 'Paris';
    obj.edad = 26;

    // Eliminación de una propiedad
    delete obj.edad;
```

### Los métodos estáticos de Object

A diferencia de los prototipos de cadena o matriz, estas funciones no se utilizan directamente sobre el objeto, sino sobre un`Object`o, al que se le pasa el objeto como parámetro.

```javascript
    const obj = { número: 'Jean', edad: 25 };
```

**`Object.keys`** Devuelve un array que contiene únicamente las claves del objeto.
```javascript
    Object.keys(obj); // ['nombre', 'edad']
```

**`Object.values`** Devuelve un array que contiene únicamente los valores del objeto.
```javascript
    Object.values(obj); // ['Jean', 25]
```

**`Object.entries`** Devuelve una matriz de pares «`[clave, valor]`», útil para recorrer un objeto con un bucle o «`forEach`».
```javascript
    Object.entries(obj); // [['nombre', 'Jean'], ['edad', 25]]
```

**`Object.assign`** Copia las propiedades de uno o varios objetos de origen en un objeto de destino y devuelve dicho objeto de destino. Se utiliza a menudo para fusionar objetos o crear una copia de los mismos.
```javascript
    const copie = Object.assign({}, obj); // copia de obj
    const fusion = Object.assign({}, obj, { ciudad: 'Paris' }); // { nombre: 'Jean', edad: 25, ciudad: 'París' }
```

**`Object.freeze`** Impide cualquier modificación del objeto (añadir, eliminar o cambiar una propiedad). Cualquier intento de modificación se ignora sin aviso (o provoca un error en modo estricto).
```javascript
    Object.freeze(obj);
    obj.edad = 30; // No tiene ningún efecto, obj.age sigue siendo 25
```

**`Object.fromEntries`** Hace lo contrario que `Object.entries`: transforma una matriz de pares `[clave, valor]` en un objeto.
```javascript
    Object.fromEntries([['nom', 'Jean'], ['age', 25]]); // { nombre: 'Jean', edad: 25 }
```

### Comprobar una propiedad

**`hasOwnProperty`** Es un prototipo disponible directamente en un objeto: devuelve «`true`» si la clave indicada existe en el propio objeto (y no se ha heredado).
```javascript
    obj.hasOwnProperty('nom'); // true
    obj.hasOwnProperty('inconnu'); // false
```

**El operador «`in`»** también comprueba la existencia de una clave, pero incluyendo las propiedades heredadas.
```javascript
    'nom' in obj; // true
```

### La desestructuración y el operador «spread»

La **desestructuración** permite extraer directamente ciertas propiedades de un objeto en variables, utilizando los nombres de las claves.
```javascript
    const obj = { número: 'Jean', edad: 25 };
    const { número, edad } = obj; // nombre = 'Jean', edad = 25

    // Se puede renombrar una variable durante la desestructuración.
    const { número: prenom } = obj; // nombre = 'Jean'
```

El **«spread»** (`...`) permite «desglosar» un objeto, lo cual resulta útil para copiarlo o fusionar varios entre sí.
```javascript
    const copie = { ...obj }; // Copia independiente de obj
    const fusion = { ...obj, ciudad: 'Paris' }; // { nombre: 'Jean', edad: 25, ciudad: 'París' }
```
