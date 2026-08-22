---
order: 2
---

# Los bucles

JavaScript ofrece los bucles clásicos (`for`, `while`, `do...while`), además de dos bucles dedicados a recorrer colecciones (`for...of`, `for...in`); y, en la práctica diaria, los métodos funcionales de los arrays (`map`, `filter`...) suelen sustituir a un bucle explícito.

## `for` clásico

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
} while (j < 5);   // se ejecuta al menos una vez, la condición se comprueba después
```

## `for...of`: recorrer los valores de un iterable

```javascript
const frutas = ["manzana", "plátano", "cereza"];

for (const fruta of frutas) {
    console.log(fruta);
}

for (const caracter of "abc") {   // también funciona con una cadena
    console.log(caracter);
}
```

## `for...in`: recorrer las claves de un objeto

```javascript
const persona = { nombre: "Juan", edad: 25 };

for (const clave in persona) {
    console.log(`${clave}: ${persona[clave]}`);
}
```

> **Nota:** `for...in` recorre las **claves enumerables** de un objeto: nunca lo utilices con un array (`for...in` recorrería los índices, pero también cualquier propiedad añadida manualmente al array, y no garantiza el orden): `for...of` o `.forEach()` son las herramientas adecuadas para un array.

## `break` y `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Los métodos funcionales de los arrays: la alternativa idiomática

En JavaScript moderno, transformar o filtrar un array pasa más a menudo por estos métodos que por un bucle `for` explícito:

```javascript
const numeros = [1, 2, 3, 4, 5];

numeros.forEach(n => console.log(n));                // ejecuta una función para cada elemento
const dobles = numeros.map(n => n * 2);               // [2, 4, 6, 8, 10] -> transforma cada elemento
const pares = numeros.filter(n => n % 2 === 0);       // [2, 4] -> solo conserva lo que corresponde
const suma = numeros.reduce((acc, n) => acc + n, 0);  // 15 -> reduce todo el array a un único valor
```

> **Nota:** `reduce()` es la más versátil pero la menos legible de inmediato: `acc` (el acumulador) parte del valor inicial proporcionado como segundo argumento (`0` aquí), y se actualiza en cada elemento según la función proporcionada.

Ver también [Las funciones](/?c=langages-de-programmation&s=javascript&p=fonctions) para la sintaxis de las funciones flecha (`=>`) utilizadas aquí.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `for`/`while`/`do...while` son los bucles clásicos; `for...of` recorre los valores de un iterable, `for...in` las claves de un objeto. Los métodos funcionales (`map`/`filter`/`reduce`) suelen sustituir a un bucle explícito. |
| **Herramientas utilizables** | `break`/`continue`, `forEach`/`map`/`filter`/`reduce`. |
| **Trampas a evitar** | Usar `for...in` en un array: también recorre propiedades añadidas manualmente, sin garantizar el orden. |
| **Buenas prácticas** | `for...of` o `.forEach()` para un array; los métodos funcionales para transformar/filtrar en lugar de un bucle manual. |
