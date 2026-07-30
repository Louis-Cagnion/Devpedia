---
order: 8
---

# Las expresiones regulares

Una expresión regular (regex) es un patrón que se utiliza para buscar, validar o sustituir fragmentos de texto en una cadena.

Puede redactarse de dos formas diferentes:
```javascript
    // literal, el más habitual
    const re1 = /hello/;

    // con el constructor RegExp, útil cuando el patrón es dinámico
    const re2 = new RegExp('hello');
```

### Los indicadores

Los indicadores se colocan después de la última barra y modifican el comportamiento de la expresión regular.

**`g`** (global) busca todas las apariciones en la cadena, y no solo la primera.
```javascript
    const re1 = /hello/g;
```

**`i`** (insensible a mayúsculas y minúsculas) no distingue entre mayúsculas y minúsculas.
```javascript
    const re2 = /hello/i;
```

**`m`** (multiline) activa el modo multilínea, lo que cambia el comportamiento de `^` y `$`: ahora corresponden al inicio y al final de cada línea, y ya no solo al de toda la cadena.
```javascript
    const re3 = /hello/m;
```

Se pueden combinar varias opciones entre sí.
```javascript
    const re4 = /hello/gi;
```

### Prototipos de expresiones regulares

Los prototipos son funciones integradas de forma predeterminada en el objeto RegExp, que permiten realizar determinadas acciones con la expresión regular.

```javascript
    const re = /wor(l)d/;
    const str = 'hello world';
```

**`test`** Comprueba si la cadena coincide con la expresión regular y devuelve simplemente «`true`» o «`false`».
```javascript
    re.test(str); // true
```

**`exec`** Devuelve un array con los detalles de la primera coincidencia encontrada, o «`null`» si no se encuentra ninguna coincidencia. En este array, el índice 0 contiene la coincidencia completa, y los índices siguientes contienen los grupos capturados (entre paréntesis en la expresión regular).
```javascript
    re.exec(str); // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Prototipos de cadenas que utilizan expresiones regulares

Algunos prototipos del objeto «string» admiten una expresión regular como parámetro para realizar búsquedas o sustituciones más avanzadas.

```javascript
    const str = 'hello world';
```

**`match`** Devuelve el primer resultado que coincida con la expresión regular (o «`null`» si no hay ninguno). Si la expresión regular utiliza el indicador «`g`», devuelve en su lugar una matriz que contiene todas las coincidencias, pero sin los detalles de los grupos capturados.
```javascript
    str.match(/o/g); // ['o', 'o']
```

**`matchAll`** Funciona igual que `match` con el indicador `g`, pero requiere obligatoriamente dicho indicador. Devuelve un iterador que da acceso a los detalles de cada coincidencia, incluidos los grupos capturados.
```javascript
    const str = "Jean:25 Marie:30";
    const resultado = [...str.matchAll(/(\w+):(\d+)/g)];

    console.log(resultado);
    /*  
    [
        [
            "Jean:25",           // correspondencia completa
            "Jean",              // grupo 1
            "25",                // grupo 2
            índice: 0,
            input: "Jean:25 Marie:30",
            groups: undefined
        ],
        [
            "Marie:30",
            "Marie",
            "30",
            índice: 8,
            input: "Jean:25 Marie:30",
            groups: undefined
        ]
    ]
    */
```

**`search`** Devuelve el índice de la primera coincidencia de la expresión regular en la cadena, o `-1` si no se encuentra ninguna coincidencia.
```javascript
    str.search(/world/); // 6
```

**`replace`** y **`replaceAll`** devuelven una copia de la cadena en la que una parte se ha sustituido por otra: `replace` solo sustituye la primera aparición que coincida con la expresión regular (a menos que se haya activado el indicador `g`), mientras que `replaceAll` requiere obligatoriamente este indicador para sustituir todas las apariciones.
```javascript
    str.replace(/o/g, '0'); // «hell0 w0rld»
    str.replaceAll(/o/g, '0'); // Requiere el indicador «g»; de lo contrario, se producirá un error.
```

**`split`** Divide la cadena en una matriz de subcadenas, utilizando la expresión regular como separador.
```javascript
    str.split(/\s/); // ['hola', 'mundo']
```

### Los grupos de captura

Los paréntesis en una expresión regular permiten capturar una parte concreta de la coincidencia. Estas partes capturadas se pueden recuperar posteriormente mediante `exec` o `match`.

```javascript
    const re = /(\d{4})-(\d{2})-(\d{2})/;
    const date = '2024-06-15';

    const result = date.match(re);
    result[1]; // «2024» (año)
    result[2]; // «06» (mes)
    result[3]; // «15» (día)
```

También se pueden asignar nombres a los grupos para que resulten más legibles, y acceder a ellos por su nombre a través de la propiedad `groups`.
```javascript
    const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
    const resultNamed = reNamed.exec(date);
    resultNamed.groups.annee; // «2024»
```
