---
order: 9
---

# Las expresiones regulares

Una regex (expresión regular) es un patrón que se utiliza para buscar, validar o sustituir fragmentos de texto en una string.

Se puede escribir de dos maneras distintas:

```javascript
// literal, la más habitual
const re1 = /hello/;

// con el constructor RegExp, útil cuando el patrón es dinámico
const re2 = new RegExp('hello');
```

### Los flags

Los flags se colocan después de la última barra y modifican el comportamiento de la regex; se pueden combinar varios (`/hello/gi`):

| Flag | Nombre | Efecto |
|---|---|---|
| `g` | *global* | Busca **todas** las coincidencias en la string, no solo la primera |
| `i` | *insensitive* | Ignora las mayúsculas y minúsculas: no distingue entre unas y otras |
| `m` | *multiline* | `^`/`$` corresponden al inicio/final de **cada línea**, no solo de toda la string |

### Los prototipos de regex

Los prototipos son funciones integradas de forma predeterminada en el objeto RegExp, que permiten realizar ciertas acciones con la regex:

| Método | Devuelve |
|---|---|
| `regex.test(str)` | `true`/`false` según si la string coincide con la regex |
| `regex.exec(str)` | Detalles de la primera coincidencia (o `null`): índice 0 = coincidencia completa, índices siguientes = grupos capturados |

```javascript
const re = /wor(l)d/;
const str = 'hello world';

re.test(str);  // true
re.exec(str);  // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Los prototipos de strings que utilizan regex

Algunos prototipos del objeto string aceptan una regex como parámetro para realizar búsquedas o sustituciones más avanzadas:

| Método | Devuelve |
|---|---|
| `str.match(regex)` | Primera coincidencia (o `null`); con el flag `g`, todas las coincidencias pero sin detalle de los grupos |
| `str.matchAll(regex)` | Iterador de todas las coincidencias, con sus grupos; flag `g` **obligatorio** |
| `str.search(regex)` | Índice de la primera coincidencia, `-1` si no hay ninguna |
| `str.replace(regex, x)` | Sustituye la primera ocurrencia (o todas, con el flag `g`) |
| `str.replaceAll(regex, x)` | Sustituye todas las ocurrencias; flag `g` **obligatorio**, si no, error |
| `str.split(regex)` | Divide en un array de subcadenas, usando la regex como separador |

```javascript
const str = 'hello world';

str.match(/o/g);         // ['o', 'o']
str.search(/world/);     // 6
str.replace(/o/g, '0');  // 'hell0 w0rld'
str.split(/\s/);         // ['hello', 'world']
```

`matchAll` da acceso al detalle de cada coincidencia (grupos incluidos), mientras que `match` con `g` solo devuelve las coincidencias en bruto:

```javascript
const str2 = "Jean:25 Marie:30";
const resultado = [...str2.matchAll(/(\w+):(\d+)/g)];

console.log(resultado);
/*
[
    ["Jean:25", "Jean", "25", index: 0, input: "Jean:25 Marie:30", groups: undefined],
    ["Marie:30", "Marie", "30", index: 8, input: "Jean:25 Marie:30", groups: undefined]
]
-> para cada coincidencia: la cadena completa, y luego cada grupo capturado (\w+ y \d+)
*/
```

### Los grupos de captura

Los paréntesis en una regex permiten capturar una parte concreta de la coincidencia. Estas partes capturadas se pueden recuperar después mediante `exec` o `match`:

```javascript
const re = /(\d{4})-(\d{2})-(\d{2})/;
const date = '2024-06-15';

const result = date.match(re);
result[1];  // '2024' (año)
result[2];  // '06' (mes)
result[3];  // '15' (día)
```

También se pueden nombrar los grupos para que sean más legibles, y acceder a ellos por su nombre mediante la propiedad `groups`:

```javascript
const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
const resultNamed = reNamed.exec(date);
resultNamed.groups.annee; // '2024'
```

> **Trampa:** una regex literal con el flag `g`, reutilizada varias veces con `.test()` o `.exec()`, conserva un estado interno (`lastIndex`) entre llamadas: un segundo `.test()` sobre la misma regex puede devolver `false` aunque el texto coincida, simplemente porque la búsqueda continúa después de la posición de la coincidencia anterior. Crear una nueva regex (o reiniciar `lastIndex = 0`) evita esta trampa.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una regex describe un patrón de búsqueda/validación/sustitución en una string. `test()` devuelve un booleano, `exec()`/`match()`/`matchAll()` dan acceso a los detalles de la coincidencia (incluidos los grupos capturados). |
| **Herramientas utilizables** | Flags `g`/`i`/`m`, grupos con nombre (`(?<nombre>...)`), `replace`/`replaceAll`/`split` sobre una string con una regex. |
| **Trampas a evitar** | Reutilizar una regex `g` con `.test()`/`.exec()` en un bucle sin tener en cuenta su estado interno (`lastIndex`). |
| **Buenas prácticas** | Nombrar los grupos de captura en cuanto una regex tenga varios, para un acceso más legible que por índice numérico. |
