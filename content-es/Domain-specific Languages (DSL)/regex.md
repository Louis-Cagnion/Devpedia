# La expresión regular

## ¿Qué es una expresión regular?

Una expresión regular (**regex**) es un minilenguaje que describe un patrón de caracteres. Este patrón sirve para buscar, validar o extraer fragmentos de texto que se ajusten a una estructura determinada.

No es un lenguaje de programación: no tiene variables, ni bucles, ni funciones. Una expresión regular debe ser interpretada por un **motor de expresiones regulares**, integrado en el lenguaje que utilices (JavaScript, Python, etc.), a través de métodos como `.test()` o `.match()`.

## Fundamentos de la sintaxis

### Caracteres literales

Un carácter normal en una expresión regular coincide exactamente consigo mismo:

```regex
chat
```

Esta expresión regular coincide con la secuencia de caracteres «`chat`», en cualquier parte del texto.

### Las clases de caracteres

| Símbolo | Significado                          |
|---------|-----------------------------------------|
| `.`     | Cualquier carácter (excepto salto de línea) |
| `\d`    | Un dígito (0-9)                        |
| `\D`    | Todo menos un número                    |
| `\w`    | Una letra, un número o `_`            |
| `\W`    | Cualquier carácter que no sea una letra, un número o un`_`         |
| `\s`    | Un espacio (espacio, tabulación, salto de línea) |
| `\S`    | Cualquier carácter excepto un espacio                     |
| `[abc]` | Un solo carácter de entre `a`, `b` o `c`  |
| `[^abc]`| Un único carácter que no es ni `a`, ni `b`, ni `c` |
| `[a-z]` | Solo hay un carácter de diferencia entre `a` y `z`       |

### Los cuantificadores

| Símbolo  | Significado                         |
|----------|----------------------------------------|
| `*`      | 0 o más veces                    |
| `+`      | Una o varias veces                    |
| `?`      | 0 o 1 vez (lo convierte en opcional)           |
| `{n}`    | Exactamente n veces                      |
| `{n,}`   | un mínimo de n veces, sin máximo           |
| `{n,m}`  | Entre n y m veces                      |

### Los enlaces

| Símbolo | Significado                  |
|---------|----------------------------------|
| `^`     | Inicio de la línea/cadena        |
| `$`     | Fin de la línea/cadena          |

### Los grupos

```regex
(abc)
```

Un grupo de captura: aísla una parte del patrón para poder **recuperar** lo que ha coincidido (`match[1]`, `match[2]`...), y permite aplicar un cuantificador a varios caracteres a la vez.

```regex
(?:abc)
```

Un grupo que no genera resultados: agrupa sin crear ninguna entrada recuperable en el resultado de la coincidencia.

### Las aserciones (lookahead / lookbehind)

Comprueban qué hay alrededor de una posición, **sin consumir** esos caracteres en la coincidencia.

| Símbolo    | Significado                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Debe ir seguido de `abc`                    |
| `(?!abc)`  | No debe ir seguido de `abc`              |
| `(?<=abc)` | Debe ir precedido de `abc`                  |
| `(?<!abc)` | No debe ir precedido de `abc`            |

## Los indicadores (opciones globales)

Los indicadores se colocan después del último «`/`» de la expresión regular en JavaScript:

```javascript
/motif/flags
```

| Indicador | Efecto                                       |
|------|----------------------------------------------|
| `g`  | Búsqueda **global** (todas las ocurrencias, no solo la primera) |
| `i`  | No distingue entre mayúsculas y minúsculas |
| `m`  | Modo multilínea (se aplican `^` y `$` a cada línea) |

## Ejemplo completo, elaborado paso a paso

Objetivo: identificar una línea que contenga **únicamente** un enlace Markdown, del tipo `[texto](url)`.

### Paso 1: los corchetes literales

En expresiones regulares, `[` y `]` son caracteres **especiales** (sirven para definir una clase de caracteres, como `[abc]`, tal y como se ha visto anteriormente). Para hacer coincidir un corchete **literal** (el carácter real `[` del texto), hay que escapar con una barra invertida:

```regex
\[
```

```regex
\]
```

`\[` coincide con el carácter `[`, y `\]` coincide con el carácter `]` — nada más.

### Paso 2: el texto entre corchetes

Entre los dos corchetes, queremos aceptar **cualquier carácter, excepto** un corchete de cierre (de lo contrario, la expresión regular podría detenerse demasiado pronto o coincidir con varios enlaces a la vez). Se utiliza una clase de caracteres **negativa**:

```regex
[^\]]
```

- Los «`[ ]`» que aparecen aquí son la sintaxis real de las clases de caracteres (no son literales, a diferencia del paso 1).
- `^` En primera posición **dentro de** una clase significa «todo menos»; por lo tanto, «`[^\]]`» significa «cualquier carácter menos `]`».
- Añade «`*`» para repetir esto «0 o más veces» (un texto de cualquier longitud, o incluso vacío):

```regex
[^\]]*
```

También queremos **recuperar** este texto más adelante (para saber qué hay entre corchetes) → lo rodeamos con un grupo de captura con «`( )`»:

```regex
([^\]]*)
```

### Paso 3: montar los ganchos y el conjunto

```regex
\[([^\]]*)\]
```

El resultado es: un «`[`» literal, seguido del texto capturado y, a continuación, un «`]`» literal. Coincide, por ejemplo, con `[texto]`, `[]` (texto vacío), `[mon super lien]`...

### Paso 4: la misma lógica para los paréntesis

El mismo principio, pero para `(url)`:

- `\(` y `\)` → paréntesis literales escapados (también especiales en expresiones regulares, que se utilizan normalmente para los grupos).
- En el interior, queremos el contenido de la URL: cualquier carácter excepto un espacio (`\s`) y excepto un paréntesis de cierre (`)`); de lo contrario, la expresión regular podría incluir por error texto situado después del enlace.

```regex
[^\s)]+
```

Aquí se utiliza `+` (al menos una vez) en lugar de `*`, ya que una URL vacía no tiene sentido.

También se incluye este grupo:

```regex
\(([^\s)]+)\)
```

### Paso 5: exigir que sea toda la línea

Por ahora, la expresión regular podría coincidir con un enlace **situado en medio** de una frase más larga. Si quieres que solo coincida cuando **toda la línea** sea exactamente ese enlace (sin nada antes ni después), hay que añadir los anclajes que hemos visto anteriormente:

```regex
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → La línea debe comenzar exactamente aquí
- `$` → la línea debe terminar exactamente aquí

### Resultado final

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Resumen de las secciones:

- `^` → Es obligatorio comenzar la línea con un espacio.
- `\[` → un «`[`» literal
- `([^\]]*)` → grupo 1: el texto del enlace (todo excepto `]`)
- `\]` → un «`]`» literal
- `\(` → una «`(`» literal
- `([^\s)]+)` → grupo 2: la URL (todo excepto espacios y `)`)
- `\)` → una «`)`» literal
- `$` → fin de línea obligatorio

Con `"[mon lien](https://exemple.com)".match(regex)`, obtienes `match[1] = "mon lien"` y `match[2] = "https://exemple.com"`.

## Para profundizar en el tema

- [MDN — Expresiones regulares](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com) — probador interactivo de expresiones regulares con explicaciones en tiempo real
