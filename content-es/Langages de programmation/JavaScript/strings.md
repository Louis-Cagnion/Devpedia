---
order: 4
---

# Las cadenas de caracteres

Una cadena es una sucesión de caracteres que se utiliza para representar texto. En JavaScript, se puede escribir de tres formas diferentes:
```javascript
    // comillas simples
    const st1 = 'Hello world';

    // comillas dobles
    const str2 = "Hello world";

    // Las comillas invertidas, útiles para escribir en varias líneas o insertar variables (literales de plantilla).
    const str3 = `
    Ce format
    permet d'écrire
    une string sur
    plusieurs lignes
    `;
```

### Los prototipos de cadenas

Los prototipos son funciones integradas de forma predeterminada en el objeto «string», que permiten realizar determinadas acciones sobre la cadena. Una cadena es inmutable: estas funciones nunca la modifican, sino que siempre devuelven un nuevo valor.

```javascript
    const str = 'hello world';
```

**`includes`** Comprueba si la cadena contiene una subcadena determinada y devuelve «`true`» o «`false`».
```javascript
    str.includes('hello'); // true
```

**`length`** No es una función, sino una propiedad: devuelve el número de caracteres de la cadena.
```javascript
    str.length; // 11
```

**`slice`** Devuelve una parte de la cadena, comprendida entre un índice inicial (incluido) y un índice final (excluido).
```javascript
    str.slice(0, 5); // «hello»
```

**`toUpperCase`** y **`toLowerCase`** devuelven una copia de la cadena escrita íntegramente en mayúsculas o en minúsculas.
```javascript
    str.toUpperCase(); // «HELLO WORLD»
    str.toLowerCase(); // «hello world»
```

**`trim`** Devuelve una copia de la cadena sin los espacios innecesarios al principio y al final.
```javascript
    str.trim();
```

**`replace`** y **`replaceAll`** devuelven una copia de la cadena en la que una parte se ha sustituido por otra: `replace` solo sustituye la primera aparición, mientras que `replaceAll` sustituye todas las apariciones.
```javascript
    str.replace('hello', 'hi'); // «hola mundo»
    str.replaceAll('o', '0'); // «hell0 w0rld»
```

**`split`** Divide la cadena en una matriz de subcadenas, según un separador indicado como parámetro.
```javascript
    str.split(' '); // ['hola', 'mundo']
```

**`indexOf`** Busca una subcadena en la cadena y devuelve el índice de su primera aparición. Si no existe, devuelve «`-1`».
```javascript
    str.indexOf('world'); // 6
```

**`startsWith`** y **`endsWith`** comprueban si la cadena comienza o termina con un valor determinado, y devuelven `true` o `false`.
```javascript
    str.startsWith('hello'); // true
    str.endsWith('world'); // true
```

**`repeat`** Devuelve una nueva cadena, repitiendo la cadena original un número determinado de veces.
```javascript
    str.repeat(2); // «hello worldhello world»
```

**`concat`** Une varias cadenas entre sí y devuelve el resultado, sin modificar las cadenas originales.
```javascript
    str.concat(' !'); // «¡Hola, mundo!»
```

### Las expresiones regulares

Se pueden utilizar expresiones regulares para buscar o recopilar información en cadenas de caracteres (véase expresiones regulares).
