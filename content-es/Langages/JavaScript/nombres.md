---
order: 6
---

# Los números

JavaScript se distingue por una elección radical: durante mucho tiempo tuvo **un único tipo numérico**, `number`, que es un flotante de doble precisión (IEEE 754). Por lo tanto, no distingue los enteros de los decimales: `1` y `1.0` son el mismo valor.

> Los comportamientos sorprendentes que de esto se derivan (`0.1 + 0.2 !== 0.3`, el límite de los enteros grandes, `NaN !== NaN`) no son propios de JavaScript: provienen de la codificación de los flotantes, común a todos los lenguajes. Su explicación completa se encuentra en el capítulo [Los números en punto flotante](/?c=representation-des-donnees&p=nombres-flottants). Este capítulo se centra en lo que JavaScript hace con ellos.

## Un solo tipo, por lo tanto enteros flotantes

```js
typeof 42;    // "number"
typeof 42.5;  // "number"
typeof NaN;   // "number"

42 === 42.0;       // true: ninguna distinción
5 / 2;             // 2.5 -> no hay división entera implícita
Math.trunc(5 / 2)  // 2   -> hay que pedirla explícitamente
```

La ausencia de división entera nativa es una trampa frecuente para quien viene de C o de [Python](/?c=langages-de-programmation&s=python&p=python) (`5 // 2`).

## Comparar decimales

Como en todas partes, no se comparan dos flotantes con `===` sino mediante un margen de error:

```js
const epsilon = 0.0001;
if (Math.abs(a - b) < epsilon) { /* consideradas iguales */ }
```

JavaScript proporciona `Number.EPSILON` (≈ `2.22e-16`), que es la diferencia entre `1` y el siguiente flotante. Útil para valores cercanos a 1, pero **demasiado estricto** en cuanto se manipulan números grandes:

```js
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;          // true
Math.abs(1e9 + 0.1 - (1e9 + 0.2)) < Number.EPSILON;  // false, aunque la diferencia es mínima
```

Para importes monetarios, la buena práctica sigue siendo trabajar en **centavos**, con enteros.

## El límite de los enteros exactos

La mantisa de un doble ocupa 52 bits, por lo que los enteros solo son exactos hasta 2⁵³ − 1:

```js
Number.MAX_SAFE_INTEGER;                // 9007199254740991
9007199254740992 === 9007199254740993;  // true! indistinguibles
Number.isSafeInteger(2 ** 53);          // false
```

Es un problema concreto en cuanto se manipulan identificadores provenientes de una base de datos en `BIGINT`: más allá de este límite, JavaScript los redondea silenciosamente. El remedio habitual es transportarlos como **cadena de caracteres** en el JSON.

## `BigInt`: los enteros de tamaño arbitrario

Desde ES2020, `BigInt` elimina este límite. Se escribe con una `n` final:

```js
9007199254740993n === 9007199254740992n;  // false: exacto
2n ** 64n;                                // 18446744073709551616n
```

Dos restricciones que conviene conocer:

```js
1n + 1;         // TypeError: no se mezclan BigInt y number
1n + BigInt(1)  // 2n: conversión explícita obligatoria
5n / 2n;        // 2n: división entera, la parte decimal se trunca
```

`BigInt` sirve para grandes identificadores y para la criptografía, no para cálculos decimales: solo gestiona enteros.

## `NaN` y los infinitos

```js
1 / 0;            // Infinity  (y no un error)
-1 / 0;           // -Infinity
0 / 0;            // NaN
parseInt("abc");  // NaN

NaN === NaN;         // false: NaN no es igual a nada, ni siquiera a sí mismo
Number.isNaN(NaN);   // true  -> la forma correcta de comprobarlo
isNaN("abc");        // true  -> CUIDADO: convierte antes, por lo tanto engañoso
Number.isNaN("abc")  // false -> "abc" no es NaN, es una cadena
```

Prefiere siempre `Number.isNaN()` a la antigua función global `isNaN()`, que convierte su argumento antes de comprobarlo y produce falsos positivos.

## Conversiones desde una cadena

```js
Number("42");        // 42
Number("42px");      // NaN   -> estricto: todo o nada
parseInt("42px");    // 42    -> tolerante: se detiene en el primer carácter inválido
parseFloat("3.9m");  // 3.9
Number("");          // 0     -> trampa clásica: la cadena vacía se convierte en 0
```

`parseInt` acepta un segundo argumento, la base, que conviene precisar siempre por prudencia: `parseInt("08", 10)`.

## Formatear para mostrar

```js
(1234.5678).toFixed(2);          // "1234.57" -> devuelve una CADENA, no un número
(0.000001234).toExponential(2);  // "1.23e-6"

(1234567.891).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
// "1.234.567,89 €"
```

`toLocaleString` se encarga por sí solo de los separadores de miles y de la coma decimal española: no hace falta reconstruirlos a mano.

## Resumen

| Trampa | Reflejo |
|---|---|
| Un solo tipo `number` (flotante) | `Math.trunc()` para una división entera |
| `0.1 + 0.2 !== 0.3` | Comparar mediante un margen de error |
| Importes monetarios | Trabajar en centavos |
| Identificadores > 2⁵³ | Transportarlos como cadena, o usar `BigInt` |
| `NaN !== NaN` | `Number.isNaN()`, nunca `isNaN()` |
| `Number("")` vale `0` | Validar antes de convertir |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | JavaScript solo tiene un tipo numérico (`number`, flotante IEEE 754): no hay distinción nativa entre entero y decimal. `BigInt` elimina el límite de los enteros grandes exactos (2⁵³ − 1). |
| **Herramientas utilizables** | `Math.trunc`, `Number.isNaN`, `Number.isSafeInteger`, `toFixed`/`toLocaleString` para mostrar valores. |
| **Trampas a evitar** | Comparar dos flotantes con `===`; usar el `isNaN()` global (convierte antes de comprobar) en lugar de `Number.isNaN()`. |
| **Buenas prácticas** | Trabajar en centavos para los importes monetarios; transportar un identificador grande como cadena de caracteres en lugar de como `number`. |
