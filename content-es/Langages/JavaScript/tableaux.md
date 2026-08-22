---
order: 5
---

# Los arrays

Un array en JavaScript es una estructura que permite almacenar varios valores en una sola variable, en forma de lista ordenada. Cada valor es accesible mediante su índice, que siempre empieza en 0.

Se puede crear de 2 formas diferentes:

```javascript
// literal, la más habitual
const arr1 = [1, 2, 3];

// con el constructor Array
const arr2 = new Array(1, 2, 3);

// un array puede contener tipos diferentes, incluidos otros arrays u objetos
const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Los prototipos de arrays

Los prototipos son funciones integradas por defecto en el objeto array, que permiten realizar determinadas acciones sobre el array (añadir, eliminar, transformar, recorrer elementos...). Una parte modifica el array original (lo **mutan**), la otra siempre devuelve una copia sin tocarlo:

| Método | Efecto | ¿Muta el array original? |
|---|---|---|
| `includes(valor)` | Comprueba la presencia de un valor (`true`/`false`) | No |
| `length` | Propiedad (no un método): número de elementos | - |
| `push(x)` / `pop()` | Añade / elimina un elemento al **final** del array | Sí |
| `unshift(x)` / `shift()` | Añade / elimina un elemento al **principio** del array | Sí |
| `slice(inicio, fin)` | Copia una porción (`fin` excluido) | No |
| `splice(indice, n)` | Elimina (y puede insertar) elementos en un índice dado | Sí |
| `indexOf(valor)` | Índice de la primera ocurrencia, `-1` si no está presente | No |
| `map(fn)` | Nuevo array transformado | No |
| `filter(fn)` | Nuevo array filtrado | No |
| `forEach(fn)` | Ejecuta una acción por elemento, no devuelve nada | No |
| `some(fn)` / `every(fn)` | Al menos uno / todos los elementos cumplen la condición | No |
| `find(fn)` / `findIndex(fn)` | Primer elemento (o su índice) que cumple la condición | No |
| `reduce(fn, inicial)` | Reduce el array a un único valor acumulado | No |
| `join(separador)` | Concatena los elementos en una sola cadena | No |
| `reverse()` | Invierte el orden de los elementos | Sí |
| `sort(fn)` | Ordena los elementos (ver la nota más abajo) | Sí |
| `concat(otro)` | Une varios arrays en un nuevo array | No |

```javascript
const arr = [1, 2, 3, 4, 5];

arr.includes(3);                     // true
arr.push(6);                         // arr pasa a ser [1, 2, 3, 4, 5, 6]
arr.pop();                           // elimina 6 y lo devuelve, arr vuelve a ser [1, 2, 3, 4, 5]
arr.slice(0, 2);                     // [1, 2], copia -> arr sin cambios
arr.map(n => n * 2);                 // [2, 4, 6, 8, 10], copia -> arr sin cambios
arr.filter(n => n > 2);              // [3, 4, 5]
arr.find(n => n > 2);                // 3, el primer elemento que coincide
arr.reduce((acc, n) => acc + n, 0);  // 15, acumulador partiendo de 0
arr.join(', ');                      // '1, 2, 3, 4, 5'
```

> **Nota:** por defecto, `sort()` ordena convirtiendo los elementos en **cadenas** (lo cual plantea un problema con los números, por ejemplo `10` pasa antes que `2`): hay que proporcionar una función de comparación (`arr.sort((a, b) => a - b)`) para ordenar números correctamente.

> **Trampa:** confundir un método que muta el array original (`push`, `splice`, `sort`, `reverse`) con un método que devuelve una copia (`slice`, `map`, `filter`): `arr.sort()` cambia silenciosamente el propio `arr`, cuando a veces se espera obtener una copia ordenada.
>
> **Buena práctica:** comprobar la columna "¿Muta el array original?" de arriba antes de usar un método poco familiar; copiar el array (`[...arr]` o `slice()`) antes de una operación mutante si el original debe permanecer intacto.

### La desestructuración y el spread

La **desestructuración** permite extraer directamente valores de un array en variables, según el orden de los elementos.

```javascript
const arr = [1, 2, 3];
const [primero, segundo] = arr; // primero = 1, segundo = 2
```

El **spread** (`...`) permite "desplegar" un array, lo cual resulta útil para copiarlo o fusionar varios entre sí.

```javascript
const copia = [...arr];         // copia independiente de arr
const fusion = [...arr, 4, 5];  // [1, 2, 3, 4, 5]
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un array almacena una lista ordenada de valores, indexada desde 0, que puede mezclar cualquier tipo. Algunos métodos lo modifican directamente, otros devuelven una copia transformada. |
| **Herramientas utilizables** | `push`/`pop`/`shift`/`unshift`, `map`/`filter`/`reduce`, `find`/`findIndex`, `sort`, desestructuración y spread (`...`). |
| **Trampas a evitar** | Confundir un método que muta el array original (`sort`, `splice`, `reverse`) con un método que devuelve una copia (`slice`, `map`, `filter`). |
| **Buenas prácticas** | Usar `[...arr]` o `slice()` antes de una operación mutante si el original debe permanecer intacto; proporcionar una función de comparación a `sort()` para ordenar números correctamente. |
