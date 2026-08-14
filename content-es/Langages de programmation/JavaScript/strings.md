---
order: 4
---

# Las strings

Una string es una sucesión de caracteres, utilizada para representar texto. En JavaScript, se puede escribir de 3 formas diferentes:

```javascript
// comillas simples
const str1 = 'Hello world';

// comillas dobles: estrictamente equivalentes a las comillas simples
const str2 = "Hello world";

// backticks (template literals): las únicas que permiten la interpolación y el multilínea
const nombre = 'Juan';
const str3 = `¡Hola ${nombre}!`;   // '¡Hola Juan!' -> ${...} inserta directamente una variable

const str4 = `Línea 1
Línea 2`;                          // los saltos de línea del código fuente se conservan tal cual
```

### Los prototipos de strings

Los prototipos son funciones integradas por defecto en el objeto string, que permiten realizar determinadas acciones sobre la string. Una string es **inmutable** en JavaScript: ninguno de estos métodos la modifica, cada uno siempre devuelve un nuevo valor.

| Método | Efecto |
|---|---|
| `includes(subcadena)` | Comprueba la presencia de una subcadena (`true`/`false`) |
| `length` | Propiedad (no un método): número de caracteres |
| `slice(inicio, fin)` | Extrae una porción (`fin` excluido) |
| `toUpperCase()` / `toLowerCase()` | Copia completamente en mayúsculas / minúsculas |
| `trim()` | Copia sin los espacios innecesarios al principio y al final |
| `replace(a, b)` / `replaceAll(a, b)` | Reemplaza la primera ocurrencia / todas las ocurrencias |
| `split(separador)` | Divide en un array de subcadenas |
| `indexOf(subcadena)` | Índice de la primera ocurrencia, `-1` si no está presente |
| `startsWith(x)` / `endsWith(x)` | Comprueba si la cadena empieza / termina con `x` |
| `repeat(n)` | Repite la cadena `n` veces |
| `concat(otra)` | Une varias cadenas |

```javascript
const str = 'hello world';

str.includes('hello');       // true
str.slice(0, 5);             // 'hello'
str.toUpperCase();           // 'HELLO WORLD'
str.trim();                  // copia sin espacios superfluos
str.replace('hello', 'hi');  // 'hi world', una sola ocurrencia
str.replaceAll('o', '0');    // 'hell0 w0rld', todas las ocurrencias
str.split(' ');              // ['hello', 'world']
str.startsWith('hello');     // true
str.repeat(2);                // 'hello worldhello world'
```

> **Trampa:** todos estos métodos devuelven una **nueva** string, sin modificar nunca la original. `str.toUpperCase();` por sí sola no cambia nada en `str`; hay que reasignar: `str = str.toUpperCase();`.
>
> **Buena práctica:** reasignar siempre (o usar directamente) el resultado de un método de string, sin suponer nunca que modificó la variable original.

### Las expresiones regulares

Se pueden usar [las expresiones regulares](/?c=langages-de-programmation&s=javascript&p=regex) para buscar o recopilar información en strings.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una string se declara con comillas simples, dobles o backticks (*template literals*, para la interpolación y el multilínea). Es inmutable: cada método devuelve una nueva string. |
| **Herramientas utilizables** | `includes`, `slice`, `toUpperCase`/`toLowerCase`, `trim`, `replace`/`replaceAll`, `split`, `indexOf`, `startsWith`/`endsWith`. |
| **Trampas a evitar** | Llamar a un método de transformación (`toUpperCase`, `trim`...) sin reasignar el resultado, pensando que la string original ha cambiado. |
| **Buenas prácticas** | Usar backticks para toda string que interpole una variable o se extienda en varias líneas, en lugar de una concatenación con `+`. |
