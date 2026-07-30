---
order: 2
---

# Los bucles

JavaScript ofrece los bucles clásicos (`for`, `while`, `do...while`), además de dos bucles dedicados a recorrer colecciones (`for...of`, `for...in`); y, en la práctica diaria, los métodos funcionales de los arrays (`map`, `filter`...) suelen sustituir a un bucle explícito.

## `for` clásica

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

## `while` y `do...while`

```javascript
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

let j = 0;
do {
    console.log(j);
    j++;
} while (j < 5);   // se ejecuta al menos una vez; la condición se comprueba después de
```

## `for...of` : recorrer los valores de un iterable

```javascript
const frutas = ["pomme", "banane", "cerise"];

for (const fruta of frutas) {
    console.log(fruta);
}

for (const caractere of "abc") {   // También funciona en una cadena
    console.log(caractere);
}
```

## `for...in` : recorrer las claves de un objeto

```javascript
const persona = { número: "Jean", edad: 25 };

for (const clave in persona) {
    console.log(`${clave} : ${persona[clave]}`);
}
```

> **Nota:** `for...in` recorre las **claves enumerables** de un objeto; nunca lo utilices con un array (pues `for...in` recorrería los índices, pero también cualquier propiedad añadida manualmente al array, y no garantiza el orden): `for...of` o `.forEach()` son las herramientas adecuadas para un array.

## `break` y `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Los métodos funcionales de los arrays: la alternativa idiomática

En JavaScript moderno, para transformar o filtrar un array se suelen utilizar estos métodos con más frecuencia que un bucle explícito de tipo «`for`»:

```javascript
const números = [1, 2, 3, 4, 5];

números.forEach(n => console.log(n));            // ejecuta una función para cada elemento
const doubles = números.map(n => n * 2);           // [2, 4, 6, 8, 10] -> transforma cada elemento
const pairs = números.filter(n => n % 2 === 0);      // [2, 4] -> solo se mantiene lo que corresponde
const somme = números.reduce((acc, n) => acc + n, 0); // 15 -> reduce toda la matriz a un único valor
```

> **Nota:** `reduce()` es la más versátil, pero la menos fácil de entender a primera vista: `acc` (el acumulador) parte del valor inicial proporcionado como segundo argumento (en este caso, `0`) y se actualiza en cada elemento según la función proporcionada.

Consulta también el capítulo sobre funciones para conocer la sintaxis de las funciones con flecha (`=>`) que se utilizan aquí.
