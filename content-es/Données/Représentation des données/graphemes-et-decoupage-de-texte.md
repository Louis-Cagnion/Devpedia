---
order: 9
---

# Grafemas, puntos de código y unidades UTF-16: trocear un texto sin romperlo (11/10/2026)

¿Cuántos "caracteres" tiene `"👨‍👩‍👧"`? Un lector ve un solo dibujo (una familia), pero [JavaScript](/?c=langages&s=javascript&p=javascript) cuenta **8**. Esta diferencia rompe los contadores de caracteres, los textos cortados, las inversiones y los cursores. Un **emoji** es un pequeño dibujo (una cara, una bandera, una mano...) que se escribe como una letra. Este capítulo explica las tres formas de contar un texto y cómo trocearlo sin romper un emoji. Complementa [la codificación de los textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), que explica cómo se guarda un carácter en memoria o en disco: aquí se trata el troceado de lo que se ve.

Supone conocidos [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las cadenas](/?c=langages&s=javascript&p=strings) (una **cadena** es un texto, sucesión de caracteres), [los arrays](/?c=langages&s=javascript&p=tableaux) (una lista ordenada en la que cada valor tiene un **índice**, su posición, que empieza en 0), [los bucles](/?c=langages&s=javascript&p=boucles) (entre ellos `for...of`), [las funciones](/?c=langages&s=javascript&p=fonctions) (entre ellas las funciones flecha `=>`), [las condiciones](/?c=langages&s=javascript&p=conditions) y [los objetos](/?c=langages&s=javascript&p=objets). Los ejemplos se ejecutan con [Node.js](https://nodejs.org), un programa que ejecuta [JavaScript](/?c=langages&s=javascript&p=javascript) fuera de un navegador, lanzado desde [una terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), o en la consola de un navegador (el programa que muestra las páginas web). `console.log(x)` muestra el valor `x`. Los resultados se verificaron con Node.js 22.22.3 (Unicode 17.0).

## Tres formas de contar un "carácter"

La palabra "carácter" designa tres cosas distintas según quien hable. Un **bit** vale 0 o 1 (ver [los enteros y los bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)), un **octeto** agrupa ocho.

| Nivel | Término | Definición | Quién lo usa |
|---|---|---|---|
| Lo que ve el ojo | **grafema** (*grapheme cluster*) | La unidad percibida como un solo carácter: una letra con sus acentos, un emoji completo | El usuario, el cursor (la línea parpadeante de escritura), los límites de escritura |
| Lo que Unicode numera | **punto de código** (*code point*) | El número `U+XXXX` de un elemento del catálogo [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Un grafema cuenta uno o varios | `for...of`, `codePointAt`, el propio catálogo |
| Lo que JavaScript almacena | **unidad de código UTF-16** (*code unit*) | Un bloque de 16 bits (2 octetos) de la codificación [UTF-16](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Un punto de código ocupa una o dos | `length`, `[i]`, `slice`, `charAt` |
| Lo que almacena el disco | **octeto** (*byte*) | Un grupo de 8 bits. En [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), un punto de código ocupa de 1 a 4 | Archivos e intercambios de datos |

Aquí está la familia `"👨‍👩‍👧"` en los tres primeros niveles (los números se escriben en **hexadecimal**, o base 16: los dígitos 0 a 9 y luego `a` a `f`, donde `a` vale 10 y `f` vale 15):

```text
grafema          1 solo dibujo: 👨‍👩‍👧
                      |
puntos de código U+1F468    U+200D    U+1F469    U+200D    U+1F467     (5)
                   |          |         |          |         |
unidades UTF-16  D83D DC68   200D    D83D DC69    200D    D83D DC67    (8)
```

`U+200D` es el **unificador de ancho cero** (*zero width joiner*, ZWJ): un carácter invisible que indica "une lo que va antes con lo que va después". Los tres personajes se funden entonces en un dibujo único, si la tipografía lo permite (ver [los límites](#los-limites-honestos)). Aquí están los nueve ejemplos del capítulo, medidos con las herramientas vistas más abajo:

| Texto | Puntos de código | `length` (unidades UTF-16) | `[...s].length` (puntos de código) | Grafemas | Octetos UTF-8 |
|---|---|---|---|---|---|
| `"a"` | `U+0061` | 1 | 1 | 1 | 1 |
| `"é"` en una forma (U+00E9) | `U+00E9` | 1 | 1 | 1 | 2 |
| `"é"` en dos formas (e + acento combinante) | `U+0065` `U+0301` | 2 | 2 | 1 | 3 |
| `"😀"` | `U+1F600` | 2 | 1 | 1 | 4 |
| `"👍🏽"` (emoji + modificador de tono) | `U+1F44D` `U+1F3FD` | 4 | 2 | 1 | 8 |
| `"👨‍👩‍👧"` (tres emojis unidos por ZWJ) | `U+1F468` `U+200D` `U+1F469` `U+200D` `U+1F467` | 8 | 5 | 1 | 18 |
| `"🇫🇷"` (dos letras indicadoras regionales) | `U+1F1EB` `U+1F1F7` | 4 | 2 | 1 | 8 |
| `"한"` en sílaba compuesta | `U+D55C` | 1 | 1 | 1 | 3 |
| `"한"` en tres jamos | `U+1112` `U+1161` `U+11AB` | 3 | 3 | 1 | 9 |

El **modificador de tono** `U+1F3FD` cambia el color de piel del emoji que lo precede. Las **letras indicadoras regionales** son 26 caracteres, de `U+1F1E6` (A) a `U+1F1FF` (Z): dos seguidos forman una bandera (F seguida de R da 🇫🇷). Los **jamos** son las letras del alfabeto coreano (consonantes y vocales), que se agrupan en sílabas: `한` también existe como un solo punto de código. El **acento combinante** `U+0301` se añade a la letra que lo precede, ver [la codificación de los textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Las dos "é" son visualmente idénticas, pero no sus números.

## Las unidades UTF-16: lo que cuentan `length` y `slice`

JavaScript almacena un texto en UTF-16. Un punto de código hasta `U+FFFF` cabe en una unidad. Más allá (la mayoría de los emojis), hacen falta dos, llamadas **par sustituto** (*surrogate pair*): una unidad "alta" seguida de una "baja".

| Unidad | Rango (hexadecimal) | Función |
|---|---|---|
| Fuera de par | `0000` a `D7FF` y `E000` a `FFFF` | Un punto de código por sí solo |
| Alta | `D800` a `DBFF` | Primera mitad de un par |
| Baja | `DC00` a `DFFF` | Segunda mitad de un par |

Estas operaciones trabajan todas en unidades: [`length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) (el número de unidades), `texto[i]` y [`charAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) (la unidad en el índice `i`), [`charCodeAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) (su número), [`slice`](/?c=langages&s=javascript&p=strings) (una porción entre dos índices).

```javascript
const sonrisa = "😀";
// length cuenta las unidades UTF-16: esta sonrisa ocupa dos
console.log(sonrisa.length);   // -> 2
// charCodeAt(i) devuelve el número de la unidad de índice i
console.log(sonrisa.charCodeAt(0));   // -> 55357
console.log(sonrisa.charCodeAt(1));   // -> 56832
// toString(16) escribe ese número en hexadecimal: un par alto (d83d) y luego uno bajo (de00)
console.log(sonrisa.charCodeAt(0).toString(16));   // -> d83d
console.log(sonrisa.charCodeAt(1).toString(16));   // -> de00
// charAt(0) y sonrisa[0] son la misma unidad, una mitad de par
console.log(sonrisa.charAt(0) === sonrisa[0]);   // -> true
// isWellFormed() comprueba que no haya una mitad de par aislada
console.log(sonrisa.charAt(0).isWellFormed());   // -> false
```

[`toString(16)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) escribe un número en base 16, y [`isWellFormed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) vale `false` si el texto contiene una mitad de par sin la otra. Cortar un texto entre esas dos mitades produce exactamente este caso:

```javascript
const saludo = "Salut 😀";
// slice(0, 7) conserva las unidades de índice 0 a 6: "Salut" y la mitad alta del emoji
const corte = saludo.slice(0, 7);
console.log(corte);   // -> Salut �
console.log(corte.length);   // -> 7
console.log(corte.isWellFormed());   // -> false
// TextEncoder convierte un texto en octetos UTF-8
// 6 octetos para "Salut" y el espacio, 3 para la mitad de par, sustituida por U+FFFD
console.log(new TextEncoder().encode(corte).length);   // -> 9
// encodeURIComponent prepara un texto para una dirección web (URL) y rechaza la mitad de par
try {
    encodeURIComponent(corte);
} catch (error) {
    console.log(error.name);   // -> URIError
}
```

El texto cortado ya no es texto válido. Según la herramienta, la mitad aislada es **sustituida en silencio** por el carácter de reemplazo `U+FFFD` (�, 3 octetos en UTF-8: `EF BF BD`, de ahí los 9 octetos, ver [el mojibake](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) o **rechazada con un error** (`URIError`). En el bloque, `try` ejecuta código y `catch` atrapa el error si lanza uno (ver [el manejo de errores](/?c=langages&s=javascript&p=gestion-des-erreurs)). [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) y [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) son herramientas estándar de JavaScript; las URL se explican en [el capítulo sobre HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

## Los puntos de código: un nivel más fino

Para recorrer un texto punto de código por punto de código, JavaScript ofrece:

| Herramienta | Qué hace | Sobre `"a😀é"` |
|---|---|---|
| [`codePointAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt) | El punto de código que empieza en el índice `i` (en unidades) | `codePointAt(1)` devuelve `128512` |
| [`String.fromCodePoint(n)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) | El texto de un punto de código | `fromCodePoint(0x1F600)` devuelve `"😀"` |
| `for (const c of texto)` | Un bucle que entrega un punto de código a la vez | 3 vueltas |
| `[...texto]` | El operador `...` (*spread*, [visto con los arrays](/?c=langages&s=javascript&p=tableaux)) despliega el texto en un array de puntos de código | 3 elementos |
| [`Array.from(texto)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) | Mismo resultado, acepta una función de transformación como segundo argumento | 3 elementos |
| `texto.split("")` | Corta en unidades (a evitar) | 4 elementos |

Una cadena es un **iterable**: un valor que `for...of` o `...` recorren elemento por elemento, gracias a un **iterador**, el objeto que entrega esos elementos uno a uno. El iterador de una cadena entrega puntos de código, no unidades.

```javascript
const mezcla = "a😀é";
// length cuenta las unidades: a (1) + sonrisa (2) + é (1)
console.log(mezcla.length);   // -> 4
// codePointAt(1) lee el punto de código que empieza en el índice 1: la sonrisa entera
console.log(mezcla.codePointAt(1));   // -> 128512
console.log(mezcla.codePointAt(1).toString(16));   // -> 1f600
// el índice 2 cae en medio del par: solo se lee la mitad baja
console.log(mezcla.codePointAt(2));   // -> 56832
// 0x1F600 es un número escrito en hexadecimal en el código
console.log(String.fromCodePoint(0x1F600));   // -> 😀
// el spread y Array.from cuentan puntos de código
console.log([...mezcla]);   // -> [ 'a', '😀', 'é' ]
console.log(Array.from(mezcla).length);   // -> 3
// split("") corta en unidades: el par de la sonrisa queda roto
console.log(mezcla.split(""));   // -> [ 'a', '\ud83d', '\ude00', 'é' ]
```

```javascript
// for...of entrega un punto de código por vuelta, con su longitud en unidades
for (const elemento of mezcla) {
    console.log(elemento, elemento.length);
}
```

```text
a 1
😀 2
é 1
```

Sin embargo, los puntos de código no bastan: `"👍🏽"` cuenta 2 y `"👨‍👩‍👧"` cuenta 5, aunque se muestren como un solo dibujo. Cortar entre dos puntos de código separa un emoji de su modificador o de su ZWJ (ejemplo más abajo).

## Los grafemas con `Intl.Segmenter`

[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) es el conjunto de funciones estándar de JavaScript que dependen del idioma (fechas, números, orden de los textos...), en el centro de la [internacionalización](/?c=ui-ux&p=internationalisation-i18n-et-rtl). Su herramienta [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) trocea un texto según las reglas de Unicode ([UAX #29](https://unicode.org/reports/tr29/), el anexo n.º 29 del estándar, dedicado al troceado de textos). Está disponible en los navegadores recientes desde abril de 2024 ("Baseline 2024" según [MDN](https://developer.mozilla.org/), la documentación de referencia de la web) y en Node.js 22.

| Elemento | Función |
|---|---|
| `new Intl.Segmenter(idioma, opciones)` | Crea un segmentador (`new` crea un objeto a partir de un modelo, ver [las clases](/?c=langages&s=javascript&p=poo)). `idioma` es un código como `"fr"`; `opciones` es un [objeto](/?c=langages&s=javascript&p=objets) |
| `{ granularity: "grapheme" }` | Trocea en grafemas (valor por defecto) |
| `{ granularity: "word" }` / `{ granularity: "sentence" }` | Trocea en palabras / en frases: útil sobre todo para lenguas escritas sin espacios (japonés, chino, tailandés); para las palabras, `isWordLike` distingue una palabra de un signo de puntuación |
| `segmentador.segment(texto)` | Devuelve un iterable de trozos |
| Un trozo | Un objeto `{ segment, index, input }`: el texto del trozo, su índice de inicio (en unidades UTF-16), el texto entero |
| `.containing(indice)` | El trozo que contiene ese índice, `undefined` (el valor que significa "nada") si el índice está fuera del texto |

El siguiente bloque define el segmentador y tres funciones reutilizadas por todos los bloques del resto del capítulo. Cada función tiene un comentario de descripción: `@param` indica la forma del argumento, `@returns` la del resultado (`string[]` significa "array de cadenas").

```javascript
// Un único segmentador, creado una vez y reutilizado: idioma "fr", un trozo por grafema
const segmentador = new Intl.Segmenter("fr", { granularity: "grapheme" });

/**
 * @brief Trocea un texto en grafemas.
 *
 * @param {string} texto
 *
 * @returns {string[]} un elemento por grafema
 */
function grafemas(texto) {
    // Array.from(iterable, función) aplica la función a cada trozo
    return Array.from(segmentador.segment(texto), (trozo) => trozo.segment);
}

/**
 * @brief Cuenta los grafemas de un texto.
 *
 * @param {string} texto
 *
 * @returns {number}
 */
function contarGrafemas(texto) {
    return Array.from(segmentador.segment(texto)).length;
}

/**
 * @brief Cuenta un texto en unidades UTF-16, puntos de código, grafemas y octetos UTF-8.
 *
 * @param {string} texto
 *
 * @returns {{unidades: number, puntosDeCodigo: number, grafemas: number, octetos: number}}
 */
function medir(texto) {
    return {
        unidades: texto.length,
        puntosDeCodigo: [...texto].length,
        grafemas: contarGrafemas(texto),
        octetos: new TextEncoder().encode(texto).length,
    };
}

const ejemplo = "Hé👍🏽🇫🇷";
// cada grafema es un elemento: el tono y la bandera no se separan
console.log(grafemas(ejemplo));   // -> [ 'H', 'é', '👍🏽', '🇫🇷' ]
// un trozo completo, con su índice de inicio (H = 1 unidad, é = 1 unidad)
const segmentos = Array.from(segmentador.segment(ejemplo));
console.log(segmentos[2]);   // -> { segment: '👍🏽', index: 2, input: 'Hé👍🏽🇫🇷' }
console.log(medir("a"));   // -> { unidades: 1, puntosDeCodigo: 1, grafemas: 1, octetos: 1 }
console.log(medir("😀"));   // -> { unidades: 2, puntosDeCodigo: 1, grafemas: 1, octetos: 4 }
const familia = "👨‍👩‍👧";
console.log(medir(familia));   // -> { unidades: 8, puntosDeCodigo: 5, grafemas: 1, octetos: 18 }
console.log(medir("🇫🇷"));   // -> { unidades: 4, puntosDeCodigo: 2, grafemas: 1, octetos: 8 }
```

## Truncar a N grafemas

Truncar "a 20 caracteres" es el uso más habitual. La función siguiente corta en un límite de grafema, así que nunca en medio de un emoji o de una letra acentuada:

```javascript
/**
 * @brief Trunca un texto a max grafemas y añade "…" si se ha cortado.
 *
 * @param {string} texto
 * @param {number} max entero mayor o igual que 0
 *
 * @returns {string}
 */
function truncar(texto, max) {
    const trozos = grafemas(texto);
    if (trozos.length <= max) {
        return texto;
    }
    return trozos.slice(0, max).join("") + "…";
}

const anuncio = "Bravo 👨‍👩‍👧 et 🇫🇷 !";
console.log(anuncio.length);   // -> 24
console.log([...anuncio].length);   // -> 19
console.log(contarGrafemas(anuncio));   // -> 14
// a 7 unidades, el par del hombre se corta en dos
console.log(anuncio.slice(0, 7));   // -> Bravo �
// a 7 puntos de código, el hombre se conserva pero la familia queda rota
console.log([...anuncio].slice(0, 7).join(""));   // -> Bravo 👨
// a 7 grafemas, la familia está entera
console.log(truncar(anuncio, 7));   // -> Bravo 👨‍👩‍👧…
console.log(truncar(anuncio, 8));   // -> Bravo 👨‍👩‍👧 …
// un texto suficientemente corto se devuelve tal cual
console.log(truncar(anuncio, 14) === anuncio);   // -> true
```

| Método (límite 7) | Resultado | Fallo |
|---|---|---|
| `anuncio.slice(0, 7)` | `"Bravo �"` | Mitad de par aislada |
| `[...anuncio].slice(0, 7).join("")` | `"Bravo 👨"` | Familia reducida a un hombre (con 8, queda un ZWJ huérfano) |
| `truncar(anuncio, 7)` | `"Bravo 👨‍👩‍👧…"` | Ninguno |

`truncar` añade "…" tras `max` grafemas: el texto resultante puede tener, pues, `max + 1`.

## La normalización: dos "é" que no son iguales

La "é" existe en dos escrituras: el punto de código único `U+00E9`, o `e` seguida del acento combinante `U+0301`. Se muestran igual, pero el texto no es el mismo. La **normalización** convierte un texto a una forma canónica, para que dos escrituras equivalentes se vuelvan idénticas. En el código, `\u00E9` escribe el punto de código `U+00E9` (cuatro dígitos hexadecimales) y `\u{1F600}` los que superan `U+FFFF`.

| Forma | Efecto | Cuándo usarla |
|---|---|---|
| `"NFC"` | Recompone: un solo punto de código cuando es posible | Comparar y almacenar (la forma más habitual) |
| `"NFD"` | Descompone: letra base + acentos combinantes | Separar los acentos de una letra |
| `"NFKC"` / `"NFKD"` | Como las anteriores, y además unifican las variantes de presentación (la ligadura `ﬁ`, dos letras dibujadas como un solo signo, pasa a `fi`) | Búsqueda tolerante |

[`normalize(forma)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) aplica estas formas, que [la codificación de los textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) detalla; el estándar es [UAX #15](https://unicode.org/reports/tr15/).

```javascript
// \u00E9 : el punto de código U+00E9; e\u0301 : e seguida del acento agudo combinante U+0301
const eUnica = "\u00E9";
const eCombinada = "e\u0301";
console.log(eUnica, eCombinada);   // -> é é
// === compara los dos textos unidad por unidad: son distintos
console.log(eUnica === eCombinada);   // -> false
console.log(eUnica.length, eCombinada.length);   // -> 1 2
// para la vista y para Intl.Segmenter, es un solo grafema en ambos casos
console.log(contarGrafemas(eUnica), contarGrafemas(eCombinada));   // -> 1 1
// tras normalizar en la misma forma, los dos textos son iguales
console.log(eCombinada.normalize("NFC") === eUnica);   // -> true
console.log(eUnica.normalize("NFD") === eCombinada);   // -> true
```

Para comparar dos textos escritos por personas, hay que normalizar ambos en la misma forma antes de `===`:

```javascript
/**
 * @brief Indica si dos textos se escriben igual, sea cual sea su composición.
 *
 * @param {string} textoA
 * @param {string} textoB
 *
 * @returns {boolean}
 */
function mismoTexto(textoA, textoB) {
    return textoA.normalize("NFC") === textoB.normalize("NFC");
}

console.log(mismoTexto(eUnica, eCombinada));   // -> true
// los jamos coreanos se recomponen en sílaba con NFC
console.log("\u1112\u1161\u11AB".normalize("NFC") === "\uD55C");   // -> true
// NFC no siempre da un solo punto de código: q + tilde (˜) no tiene forma compuesta
console.log("q\u0303".normalize("NFC").length);   // -> 2
// NFC conserva la ligadura ﬁ, NFKC la sustituye por fi
console.log("\uFB01".normalize("NFKC"));   // -> fi
// localeCompare compara según el idioma y juzga estos dos textos equivalentes (0)
console.log(eUnica.localeCompare(eCombinada));   // -> 0
```

[`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) compara dos textos según las reglas de un idioma (útil para ordenar), y devuelve un número negativo o positivo según el orden, o 0 si son equivalentes. La normalización también sirve para quitar los acentos:

```javascript
// NFD separa los acentos, \p{M} designa las "marcas" (acentos combinantes)
const frase = "Éléphant à l'été";
console.log(frase.normalize("NFD").replace(/\p{M}/gu, ""));   // -> Elephant a l'ete
```

`replace` y [las expresiones regulares](/?c=langages&s=javascript&p=regex) (con la bandera `g`, "en todas partes", y la bandera `u`, que activa el modo Unicode) se ven en sus capítulos; [`\p{M}`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) es una clase de caracteres Unicode. La normalización no fusiona las secuencias de emojis: `"👍🏽"` sigue siendo dos puntos de código.

## Casos prácticos: el mal código, el buen código

| Necesidad | Mal código | Problema | Buen código |
|---|---|---|---|
| Límite de escritura | `texto.length <= 10` | Cuenta unidades: una familia pesa 8 | `contarGrafemas(texto) <= 10` |
| Invertir | `texto.split("").reverse().join("")` | Pares rotos, acentos delante de su letra | `grafemas(texto).reverse().join("")` |
| Mayúscula inicial | `texto[0].toUpperCase() + texto.slice(1)` | Falla si la primera letra ocupa dos unidades | Poner en mayúscula el primer grafema |
| Borrado hacia atrás | `texto.slice(0, -1)` | Deja la mitad de un emoji | Quitar el último grafema |
| Cursor | `posicion + 1` | El cursor cae en medio de un grafema | Avanzar hasta el final del grafema |

### Limitar la longitud de un campo

El atributo [HTML](/?c=langages&s=html&p=html) `maxlength` de un campo de [formulario](/?c=langages&s=html&p=formulaires) mide en unidades UTF-16 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength)): tres familias seguidas pesan 24 unidades. La norma UAX #29 precisa que un límite en grafemas es un límite "percibido", no un tamaño de datos: recomienda combinarlo con un límite en octetos UTF-8 (por ejemplo 300 grafemas y 3000 octetos) para acotar el almacenamiento.

```javascript
const mensaje = "Salut 👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧";
const LIMITE = 10;
console.log(mensaje.length);   // -> 30
console.log(contarGrafemas(mensaje));   // -> 9
// el límite en unidades rechaza este mensaje por error
console.log(mensaje.length <= LIMITE);   // -> false
console.log(contarGrafemas(mensaje) <= LIMITE);   // -> true

/**
 * @brief Comprueba los dos límites: grafemas (percibido) y octetos UTF-8 (almacenamiento).
 *
 * @param {string} texto
 * @param {number} maxGrafemas
 * @param {number} maxOctetos
 *
 * @returns {boolean}
 */
function respetaLimites(texto, maxGrafemas, maxOctetos) {
    const octetos = new TextEncoder().encode(texto).length;
    return contarGrafemas(texto) <= maxGrafemas && octetos <= maxOctetos;
}

console.log(respetaLimites(mensaje, 10, 100));   // -> true
console.log(respetaLimites(mensaje, 10, 40));   // -> false
```

El mensaje pesa 6 octetos por "Salut" y 3 veces 18 por las familias, es decir 60 octetos: el segundo límite (40) lo rechaza.

### Invertir una cadena

```javascript
const palabra = "Noe\u0301 🇫🇷👍🏽";
// split("") + reverse: las mitades de los pares se pegan de cualquier manera
console.log(palabra.split("").reverse().join(""));   // -> �🁍🗷🇫� ́eoN
// [...palabra] + reverse: el modificador pasa delante del emoji, la bandera se convierte en 🇷🇫
console.log([...palabra].reverse().join(""));   // -> 🏽👍🇷🇫 ́eoN
// grafemas + reverse: cada grafema conserva su integridad
console.log(grafemas(palabra).reverse().join(""));   // -> 👍🏽🇫🇷 éoN
```

`reverse()` invierte el orden de un array en su lugar, y `join("")` pega sus elementos (ver [los arrays](/?c=langages&s=javascript&p=tableaux)). Invertir un texto conserva un límite: en árabe o en hebreo, que se escriben de derecha a izquierda, el orden de visualización no es el orden de almacenamiento (ver [la internacionalización](/?c=ui-ux&p=internationalisation-i18n-et-rtl)).

### Poner en mayúscula la primera letra

Los acentos combinantes van después de la letra: `texto[0]` basta, pues, a menudo. El fallo aparece con una letra fuera de `U+FFFF` (como `U+10428`, una letra minúscula del alfabeto deseret), cuyo `texto[0]` es solo una mitad de par que `toUpperCase` deja intacta. [`toLocaleUpperCase(idioma)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) además tiene en cuenta el idioma (en turco, `i` da `İ`, con punto).

```javascript
/**
 * @brief Pone en mayúscula la primera letra, tomando todo el primer grafema.
 *
 * @param {string} texto
 * @param {string} idioma código de idioma, por ejemplo "fr"
 *
 * @returns {string}
 */
function mayusculaInicial(texto, idioma) {
    if (texto === "") {
        return texto;
    }
    const primero = grafemas(texto)[0];
    return primero.toLocaleUpperCase(idioma) + texto.slice(primero.length);
}

/**
 * @brief Versión ingenua: mayúscula solo en la primera unidad.
 *
 * @param {string} texto
 *
 * @returns {string}
 */
function mayusculaInicialIngenua(texto) {
    return texto[0].toUpperCase() + texto.slice(1);
}

const deseret = "\u{10428}x";
// la versión ingenua deja U+10428 sin cambios
console.log(mayusculaInicialIngenua(deseret).codePointAt(0).toString(16));   // -> 10428
// la versión por grafema obtiene la mayúscula U+10400
console.log(mayusculaInicial(deseret, "fr").codePointAt(0).toString(16));   // -> 10400
// "tr" designa el turco: la i se convierte en una İ con punto
console.log(mayusculaInicial("ilyes", "tr"));   // -> İlyes
console.log(mayusculaInicial("ilyes", "fr"));   // -> Ilyes
```

La longitud también puede cambiar: `"ß".toUpperCase()` da `"SS"`, dos letras.

### Borrado hacia atrás y cursor

Un campo de escritura estándar gestiona su cursor por sí solo; estas funciones sirven cuando uno mismo gestiona el texto y la posición (un editor propio). La **posición del cursor** es un índice en unidades, colocado entre dos unidades.

```javascript
const respuesta = "Oui 👍🏽";
// slice(0, -1) quita la última unidad: queda un trozo del modificador de tono
console.log(respuesta.slice(0, -1).isWellFormed());   // -> false

/**
 * @brief Quita el último grafema (tecla de retroceso).
 *
 * @param {string} texto
 *
 * @returns {string}
 */
function eliminarUltimo(texto) {
    const trozos = grafemas(texto);
    trozos.pop();
    return trozos.join("");
}

// queda "Oui" y su espacio: el pulgar y su tono se van juntos
console.log(eliminarUltimo(respuesta) === "Oui ");   // -> true

/**
 * @brief Devuelve la posición después del grafema que contiene posicion.
 *
 * @param {string} texto
 * @param {number} posicion índice en unidades, de 0 a texto.length
 *
 * @returns {number}
 */
function avanzarCursor(texto, posicion) {
    const trozo = segmentador.segment(texto).containing(posicion);
    if (trozo === undefined) {
        return posicion;
    }
    return trozo.index + trozo.segment.length;
}

/**
 * @brief Devuelve la posición de inicio del grafema que precede a posicion.
 *
 * @param {string} texto
 * @param {number} posicion índice en unidades, de 0 a texto.length
 *
 * @returns {number}
 */
function retrocederCursor(texto, posicion) {
    if (posicion <= 0) {
        return 0;
    }
    return segmentador.segment(texto).containing(posicion - 1).index;
}

const linea = "a👍🏽b";
console.log(linea.length);   // -> 6
// desde 1 (antes del pulgar), el cursor salta a 5 (después de las 4 unidades del pulgar)
console.log(avanzarCursor(linea, 1));   // -> 5
console.log(avanzarCursor(linea, 6));   // -> 6
console.log(retrocederCursor(linea, 5));   // -> 1
console.log(retrocederCursor(linea, 0));   // -> 0
```

`pop()` quita el último elemento de un array.

## Los límites honestos

Contar grafemas es la mejor aproximación del "carácter percibido" que sabemos calcular, pero no es una verdad absoluta.

| Límite | Detalle |
|---|---|
| La definición evoluciona | Cada versión de Unicode puede cambiar las reglas. En UAX #29, la regla GB9c (los grupos de consonantes de las escrituras indias) está ausente de la revisión para [Unicode 15.0](https://www.unicode.org/reports/tr29/tr29-41.html) (2022), presente y modificada en la de [Unicode 15.1](https://www.unicode.org/reports/tr29/tr29-43.html) (2023), y luego modificada de nuevo para [Unicode 18.0](https://www.unicode.org/reports/tr29/tr29-49.html) (2026) |
| El resultado depende del entorno | Node.js 22.22.3 incorpora Unicode 17.0 (valor leído en `process.versions.unicode`). Un navegador u otra versión de Node.js puede contar de otra manera. Ejemplo más abajo |
| Un ancho no es un número de grafemas | En una tipografía de ancho fijo (como la de un terminal), cada letra latina ocupa el mismo ancho, pero los ideogramas y muchos emojis se clasifican como "anchos" (propiedad East Asian Width, [UAX #11](https://unicode.org/reports/tr11/)) y suelen ocupar el doble. Alinear columnas requiere el ancho mostrado, no el número de grafemas |
| La tipografía decide el dibujo | Una **tipografía** (*font*) es el archivo que contiene el dibujo (**glifo**) de cada carácter. Si no tiene el de una secuencia, el sistema puede mostrar los componentes separados (👨 👩 👧 en lugar de 👨‍👩‍👧). El segmentador no mira la tipografía: el número de grafemas no cambia |
| El idioma y el contexto importan | UAX #29 precisa que un carácter percibido puede variar según el idioma, el estilo de escritura o el contexto, y que el algoritmo es una aproximación sin metadatos de idioma |
| Un grafema no tiene tamaño máximo | No hay límite para el tamaño de un grafema: un límite en grafemas no acota ni las unidades ni los octetos |

```javascript
const conjuncion = "\u0915\u094D\u0937";
// tres puntos de código (क, un virama y ष) forman un solo grafema aquí
console.log(conjuncion.length, [...conjuncion].length);   // -> 3 3
console.log(contarGrafemas(conjuncion));   // -> 1
```

Este grupo de consonantes de la escritura devanagari (usada para el hindi) se escribe con tres puntos de código: la consonante क, un **virama** (signo que suprime la vocal de la consonante anterior) y luego la consonante ष. Forman un solo grafema con Unicode 17.0, gracias a la regla GB9c, ausente de la revisión para Unicode 15.0. Otra herramienta, o una versión más antigua, puede contar de forma distinta.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Creer que `length` cuenta caracteres | Cuenta unidades UTF-16: `"😀".length` vale 2 y `"👨‍👩‍👧".length` vale 8 |
| `slice`, `split("")`, `charAt` en medio de un texto | Cortan entre dos unidades: mitad de par aislada, � o error (`URIError`) más adelante |
| Cortar en puntos de código (`[...texto].slice`) | Separa un emoji de su modificador, de su ZWJ o de la segunda letra de una bandera |
| Comparar dos textos con `===` sin normalizar | Dos "é" idénticos en pantalla pueden ser distintos |
| Invertir con `split("").reverse()` | Rompe los pares, coloca los acentos delante de su letra |
| Usar `maxlength` como límite de caracteres | Cuenta en unidades UTF-16 |
| Llamar a `new Intl.Segmenter` sin comprobarlo | Ausente en entornos antiguos: la llamada provoca un error |
| Creer que un número de grafemas acota el tamaño | Un grafema puede pesar muchos octetos (18 para la familia) y su tamaño no está acotado |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Contar y cortar con `Intl.Segmenter` cuando el resultado se muestra al usuario | El grafema es la unidad que él percibe |
| Usar `length` para un cálculo de tamaño interno (índice en `slice`, memoria) | Es la unidad real de JavaScript, leída sin ningún troceado |
| Crear el segmentador una sola vez y reutilizarlo | No hace falta reconstruirlo en cada llamada |
| Combinar un límite en grafemas y un límite en octetos | Acota a la vez la visualización y el almacenamiento |
| Normalizar en NFC antes de comparar o almacenar | Dos escrituras del mismo texto se vuelven iguales |
| Comprobar `typeof Intl.Segmenter === "function"` si el destino es antiguo (`typeof x` da el tipo de `x` en forma de texto) | Evita un error en un entorno sin esta herramienta |
| Llamar a `isWellFormed()` en un texto recibido del exterior | Detecta una mitad de par antes de que rompa un tratamiento |
| Probar con emojis, acentos combinantes, una bandera y coreano | Los casos simples ocultan casi todos los defectos |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un "carácter" se cuenta en tres niveles: el grafema (lo que ve el ojo), el punto de código (lo que Unicode numera), la unidad UTF-16 (lo que cuentan `length` y `slice`). `"👨‍👩‍👧"` vale 1 grafema, 5 puntos de código, 8 unidades y 18 octetos UTF-8. `Intl.Segmenter` trocea en grafemas, `normalize("NFC")` hace comparables dos escrituras del mismo texto. El resultado depende de la versión de Unicode, y el ancho mostrado no es el número de grafemas. |
| **Trampas a evitar** | `length`, `slice` y `split("")` en medio de un texto; cortar en puntos de código; comparar sin normalizar; invertir con `split("").reverse()`; `maxlength` tomado por un recuento de caracteres; `Intl.Segmenter` sin comprobar; confundir límite en grafemas con límite de octetos. |
| **Buenas prácticas** | Contar y cortar en grafemas para lo que ve el usuario, en unidades para los cálculos internos; crear un único segmentador; normalizar en NFC antes de comparar; doblar el límite en grafemas con un límite en octetos; probar con emojis, acentos combinantes, banderas y coreano. |
