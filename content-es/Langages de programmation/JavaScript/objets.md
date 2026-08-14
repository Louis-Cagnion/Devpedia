---
order: 7
---

# Los objetos

Un objeto en JavaScript es una estructura que permite almacenar datos en forma de pares clave/valor. A diferencia del array, el orden no es lo importante: se accede a un valor a través de su nombre (la clave), no a través de un índice numérico.

Se puede crear de 2 formas diferentes:

```javascript
// literal, la más habitual
const obj1 = { nombre: 'Juan', edad: 25 };

// con el constructor Object
const obj2 = new Object();
obj2.nombre = 'Juan';

// un valor puede ser de cualquier tipo, incluida una función u otro objeto
const obj3 = {
    nombre: 'Juan',
    direccion: { ciudad: 'Madrid', codigo: 28001 },
    decirHola: function () { console.log('hola'); }
};
```

### Acceder y modificar las propiedades

Existen 2 formas de acceder a una propiedad de un objeto: la notación con punto, y la notación con corchetes (útil cuando el nombre de la clave es dinámico o contiene caracteres especiales).

```javascript
const obj = { nombre: 'Juan', edad: 25 };

obj.nombre;     // 'Juan'
obj['nombre'];  // 'Juan', equivalente a obj.nombre

obj.ciudad = 'Madrid';  // añadir una propiedad
obj.edad = 26;          // modificar una propiedad

delete obj.edad;                // eliminar una propiedad
```

### Los métodos estáticos de Object

A diferencia de los prototipos de string o de array, estas funciones no se usan directamente sobre el objeto sino sobre `Object`, pasándole el objeto como parámetro:

| Método | Efecto |
|---|---|
| `Object.keys(obj)` | Array que contiene únicamente las claves |
| `Object.values(obj)` | Array que contiene únicamente los valores |
| `Object.entries(obj)` | Array de pares `[clave, valor]`, útil para recorrer con un bucle o `forEach` |
| `Object.assign(destino, ...fuentes)` | Copia las propiedades de los objetos fuente en el objeto destino, devuelve el destino; suele usarse para fusionar o copiar |
| `Object.freeze(obj)` | Impide cualquier modificación (añadir, eliminar, cambiar): se ignora en silencio, o error en modo estricto |
| `Object.fromEntries(pares)` | Inverso de `Object.entries`: transforma un array de pares `[clave, valor]` en un objeto |

```javascript
const obj = { nombre: 'Juan', edad: 25 };

Object.keys(obj);     // ['nombre', 'edad']
Object.values(obj);   // ['Juan', 25]
Object.entries(obj);  // [['nombre', 'Juan'], ['edad', 25]]

const copia = Object.assign({}, obj);                        // copia de obj
const fusion = Object.assign({}, obj, { ciudad: 'Madrid' });  // { nombre: 'Juan', edad: 25, ciudad: 'Madrid' }

Object.freeze(obj);
obj.edad = 30;                    // no tiene ningún efecto, obj.edad sigue siendo 25

Object.fromEntries([['nombre', 'Juan'], ['edad', 25]]); // { nombre: 'Juan', edad: 25 }
```

### Comprobar una propiedad

```javascript
const obj = { nombre: 'Juan', edad: 25 };

obj.hasOwnProperty('nombre');       // true -> clave presente en el propio objeto
obj.hasOwnProperty('desconocida');  // false

'nombre' in obj;                      // true -> también comprueba las propiedades heredadas, a diferencia de hasOwnProperty
```

`hasOwnProperty` es un prototipo disponible directamente en un objeto; `in` también comprueba la existencia de una clave, pero incluyendo las propiedades heredadas.

### El destructuring y el spread

El **destructuring** permite extraer directamente ciertas propiedades de un objeto en variables, usando el nombre de las claves.

```javascript
const obj = { nombre: 'Juan', edad: 25 };
const { nombre, edad } = obj;   // nombre = 'Juan', edad = 25

const { nombre: alias } = obj; // renombra la variable durante el destructuring -> alias = 'Juan'
```

El **spread** (`...`) permite "desplegar" un objeto, lo cual resulta útil para copiarlo o fusionar varios entre sí.

```javascript
const copia = { ...obj };                    // copia independiente de obj
const fusion = { ...obj, ciudad: 'Madrid' };  // { nombre: 'Juan', edad: 25, ciudad: 'Madrid' }
```

> **Trampa:** `{ ...obj }` y `Object.assign({}, obj)` solo hacen una copia **superficial** (*shallow copy*): si una propiedad es a su vez un objeto o un array, la copia y el original siguen compartiendo la **misma** referencia a ese objeto anidado: modificarlo desde uno lo modifica también desde el otro.
>
> **Buena práctica:** para una copia realmente independiente de un objeto con propiedades anidadas, usar `structuredClone(obj)` (nativo, moderno) o reconstruir manualmente los niveles anidados.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un objeto almacena pares clave/valor, accesibles mediante notación con punto o con corchetes. `Object.keys`/`values`/`entries` exponen su contenido; el spread y el destructuring copian o extraen propiedades. |
| **Herramientas utilizables** | `Object.keys`/`values`/`entries`/`assign`/`freeze`/`fromEntries`, `hasOwnProperty`, el operador `in`. |
| **Trampas a evitar** | Creer que una copia mediante spread u `Object.assign` es profunda: no lo es para las propiedades anidadas. |
| **Buenas prácticas** | Usar `structuredClone()` para una copia realmente independiente de un objeto anidado; `Object.freeze()` para impedir cualquier modificación accidental de un objeto que debe permanecer constante. |
