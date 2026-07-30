---
order: 5
---

# Las tablas

Un array en JavaScript es una estructura que permite almacenar varios valores en una sola variable, en forma de lista ordenada. Se puede acceder a cada valor a través de su índice, que siempre comienza en 0.

Se puede crear de dos formas diferentes:
```javascript
    // literal, el más habitual
    const arr1 = [1, 2, 3];

    // con el operador «Array»
    const arr2 = new Array(1, 2, 3);

    // Un array puede contener diferentes tipos, incluidos otros arrays u objetos.
    const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Prototipos de matrices

Los prototipos son funciones integradas de forma predeterminada en el objeto «array», que permiten realizar determinadas acciones sobre la matriz (añadir, eliminar, transformar, recorrer elementos, etc.).

```javascript
    const arr = [1, 2, 3, 4, 5];
```

**`includes`** Comprueba si un valor está presente en el array y devuelve «`true`» o «`false`».
```javascript
    arr.includes(3); // true
```

**`length`** No es una función, sino una propiedad: devuelve el número de elementos del array.
```javascript
    arr.length; // 5
```

**`push`** y **`pop`** modifican el array al final: `push` añade un elemento, `pop` elimina el último elemento y lo devuelve.
```javascript
    arr.push(6); // arr se convierte en [1, 2, 3, 4, 5, 6]
    arr.pop(); // elimina el 6 y lo devuelve; arr vuelve a ser [1, 2, 3, 4, 5]
```

**`unshift`** y **`shift`** hacen lo mismo que `push` / `pop`, pero al principio de la tabla.
```javascript
    arr.unshift(0); // arr se convierte en [0, 1, 2, 3, 4, 5]
    arr.shift(); // elimina el 0 y lo devuelve; arr vuelve a ser [1, 2, 3, 4, 5]
```

**`slice`** Devuelve una copia de una parte del array, comprendida entre un índice inicial (incluido) y un índice final (excluido), sin modificar el array original.
```javascript
    arr.slice(0, 2); // [1, 2]
```

**`splice`** Modifica directamente el array: elimina una serie de elementos a partir de un índice determinado y también puede insertar otros nuevos en el mismo lugar.
```javascript
    arr.splice(1, 2); // Elimina dos elementos a partir del índice 1; arr pasa a ser [1, 4, 5]
```

**`indexOf`** Busca un valor en el array y devuelve su índice. Si el valor no existe, devuelve «`-1`».
```javascript
    arr.indexOf(3); // 2
```

**`map`** Crea un nuevo array aplicando una función a cada elemento. El array original no se modifica.
```javascript
    arr.map(n => n * 2); // [2, 4, 6, 8, 10]
```

**`filter`** Crea un nuevo array que contiene únicamente los elementos que cumplen una condición (una función que devuelve `true` o `false`).
```javascript
    arr.filter(n => n > 2); // [3, 4, 5]
```

**`forEach`** Ejecuta una función para cada elemento de la matriz, pero no devuelve ningún valor. Se utiliza principalmente para realizar una acción (por ejemplo, mostrar algo en pantalla), no para transformar datos.
```javascript
    arr.forEach(n => console.log(n));
```

**`some`** Devuelve «`true`» si al menos un elemento de la matriz cumple una condición.
```javascript
    arr.some(n => n > 4); // true
```

**`every`** Devuelve «`true`» únicamente si todos los elementos de la matriz cumplen una condición.
```javascript
    arr.every(n => n > 0); // true
```

**`find`** Devuelve el primer elemento que cumple una condición, o `undefined` si ningún elemento cumple dicha condición.
```javascript
    arr.find(n => n > 2); // 3
```

**`findIndex`** Funciona igual que `find`, pero devuelve el índice del elemento encontrado (o `-1` si no hay ninguno).
```javascript
    arr.findIndex(n => n > 2); // 2
```

**`reduce`** recorre la matriz para reducirla a un único valor, acumulando un resultado en cada paso. El primer parámetro es la función de acumulación, el segundo es el valor inicial del acumulador.
```javascript
    arr.reduce((acc, n) => acc + n, 0); // 15
```

**`join`** Convierte el array en una sola cadena, separando cada elemento mediante el carácter indicado como parámetro.
```javascript
    arr.join(', '); // «1, 2, 3, 4, 5»
```

**`reverse`** Invierte el orden de los elementos del array y modifica directamente el array original.
```javascript
    arr.reverse(); // [5, 4, 3, 2, 1]
```

**`sort`** Ordena los elementos de la matriz. Por defecto, la ordenación se realiza convirtiendo los elementos en cadenas de caracteres (lo que plantea problemas con los números), por lo que es necesario proporcionar una función de comparación para ordenar los números correctamente.
```javascript
    arr.sort((a, b) => a - b);
```

**`concat`** combina varias matrices en una sola matriz nueva, sin modificar las matrices originales.
```javascript
    arr.concat([6, 7]); // [1, 2, 3, 4, 5, 6, 7]
```

### La desestructuración y el operador «spread»

La **desestructuración** permite extraer directamente valores de un array y asignarlos a variables, siguiendo el orden de los elementos.
```javascript
    const arr = [1, 2, 3];
    const [premier, deuxieme] = arr; // primero = 1, segundo = 2
```

La función **«spread»** (`...`) permite «desplegar» una tabla, lo cual resulta útil para copiarla o fusionar varias tablas entre sí.
```javascript
    const copie = [...arr]; // Copia independiente de arr
    const fusion = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```
