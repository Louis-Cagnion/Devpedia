---
order: 1
---

# La regex

## ¿Qué es una regex?

Una **regex** (expresión regular, *regular expression*) es un minilenguaje que describe un **patrón** (pattern) de caracteres. Este patrón sirve para buscar, validar o extraer fragmentos de texto que se ajustan a una estructura dada.

No es un lenguaje de programación: sin variables, sin bucles, sin funciones. Una regex necesita ser interpretada por un **motor de regex**, integrado en el lenguaje que uses ([JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), [Python](/?c=langages-de-programmation&s=python&p=python), etc.), a través de métodos como `.test()` o `.match()`.

## Las bases de la sintaxis

### Caracteres literales

Un carácter normal en una regex coincide exactamente consigo mismo:

```text
gato
```

Esta regex coincide con la secuencia de caracteres `gato`, en cualquier parte del texto.

### Las clases de caracteres

| Símbolo | Significado                          |
|---------|-----------------------------------------|
| `.`     | Cualquier carácter (excepto salto de línea) |
| `\d`    | Un dígito (0-9)                        |
| `\D`    | Todo excepto un dígito                    |
| `\w`    | Una letra, un dígito o `_`            |
| `\W`    | Todo excepto una letra/dígito/`_`         |
| `\s`    | Un espacio (espacio, tabulación, salto de línea) |
| `\S`    | Todo excepto un espacio                     |
| `[abc]` | Un solo carácter entre `a`, `b` o `c`  |
| `[^abc]`| Un solo carácter que no sea ni `a`, ni `b`, ni `c` |
| `[a-z]` | Un solo carácter entre `a` y `z`       |

### Los cuantificadores

| Símbolo  | Significado                         |
|----------|----------------------------------------|
| `*`      | 0 o más veces                    |
| `+`      | 1 o más veces                    |
| `?`      | 0 o 1 vez (lo vuelve opcional)           |
| `{n}`    | Exactamente n veces                      |
| `{n,}`   | Mínimo n veces, sin máximo           |
| `{n,m}`  | Entre n y m veces                      |

### Las anclas

| Símbolo | Significado                  |
|---------|----------------------------------|
| `^`     | Inicio de la línea/cadena        |
| `$`     | Fin de la línea/cadena          |

### Los grupos

```text
(abc)
```

Un grupo capturante: aísla una parte del patrón para poder **recuperar** lo que coincidió (`match[1]`, `match[2]`...), y permite aplicar un cuantificador a varios caracteres a la vez.

```text
(?:abc)
```

Un grupo no capturante: agrupa sin crear una entrada recuperable en el resultado de la coincidencia.

### Las aserciones (lookahead / lookbehind)

Verifican qué hay alrededor de una posición, **sin consumir** esos caracteres en la coincidencia.

| Símbolo    | Significado                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Debe estar seguido de `abc`                    |
| `(?!abc)`  | No debe estar seguido de `abc`              |
| `(?<=abc)` | Debe estar precedido de `abc`                  |
| `(?<!abc)` | No debe estar precedido de `abc`            |

## Los flags (opciones globales)

Los flags se colocan después de la última `/` de la regex en JavaScript:

```javascript
/patron/flags
```

| Flag | Efecto                                       |
|------|----------------------------------------------|
| `g`  | Búsqueda **global** (todas las ocurrencias, no solo la primera) |
| `i`  | Insensible a mayúsculas/minúsculas |
| `m`  | Modo multilínea (`^` y `$` se aplican a cada línea) |

## Ejemplo completo, construido paso a paso

Objetivo: reconocer una línea que contenga **únicamente** un enlace Markdown, del tipo `[texto](url)`.

### Paso 1: los corchetes literales

En regex, `[` y `]` son caracteres **especiales** (sirven para escribir una clase de caracteres, como `[abc]` visto más arriba). Para hacer coincidir un corchete **literal** (el verdadero carácter `[` del texto), hay que escaparlo con una barra invertida:

```text
\[
```

```text
\]
```

`\[` coincide con el carácter `[`, y `\]` coincide con el carácter `]`, nada más.

### Paso 2: el texto dentro de los corchetes

Entre los dos corchetes, queremos aceptar **cualquier carácter, excepto** un corchete de cierre (si no, la regex podría detenerse demasiado pronto o coincidir con varios enlaces a la vez). Se usa una clase de caracteres **negativa**:

```text
[^\]]
```

- Los `[ ]` aquí son la sintaxis real de clase de caracteres (no literal, a diferencia del paso 1).
- `^` en primera posición **dentro de** una clase significa "todo excepto": entonces `[^\]]` significa "cualquier carácter excepto `]`".
- Añade `*` para repetir esto "0 o más veces" (un texto de cualquier longitud, o incluso vacío):

```text
[^\]]*
```

También queremos **recuperar** este texto después (para saber qué hay entre los corchetes): lo rodeamos con un grupo capturante con `( )`:

```text
([^\]]*)
```

### Paso 3: ensamblar los corchetes y el grupo

```text
\[([^\]]*)\]
```

Esto da: un `[` literal, luego el texto capturado, luego un `]` literal. Coincide por ejemplo con `[texto]`, `[]` (texto vacío), `[mi enlace favorito]`...

### Paso 4: la misma lógica para los paréntesis

Mismo principio, pero para `(url)`:

- `\(` y `\)`: paréntesis literales escapados (también especiales en regex, usados normalmente para los grupos).
- Dentro, queremos el contenido de la URL: cualquier carácter excepto un espacio (`\s`) y excepto un paréntesis de cierre (`)`), si no la regex podría incluir texto después del enlace por error.

```text
[^\s)]+
```

Aquí se usa `+` (1 vez mínimo) en lugar de `*`, ya que una URL vacía no tiene sentido.

También se captura este grupo:

```text
\(([^\s)]+)\)
```

### Paso 5: exigir que sea toda la línea

Por ahora, la regex podría coincidir con un enlace **en medio** de una frase más larga. Si quieres que solo coincida cuando **toda la línea** sea exactamente ese enlace (nada antes, nada después), se añaden las anclas vistas más arriba:

```text
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^`: la línea debe empezar exactamente aquí
- `$`: la línea debe terminar exactamente aquí

### Resultado final

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Resumen de las piezas:

- `^`: inicio de línea obligatorio
- `\[`: un `[` literal
- `([^\]]*)`: grupo 1, el texto del enlace (todo excepto `]`)
- `\]`: un `]` literal
- `\(`: un `(` literal
- `([^\s)]+)`: grupo 2, la URL (todo excepto espacio y `)`)
- `\)`: un `)` literal
- `$`: fin de línea obligatorio

Con `"[mi enlace](https://ejemplo.com)".match(regex)`, obtienes `match[1] = "mi enlace"` y `match[2] = "https://ejemplo.com"`.

> **Trampa:** una regex demasiado permisiva (por ejemplo, olvidar anclar con `^`/`$`) puede coincidir con mucho más de lo previsto: un patrón de validación de email sin anclaje aceptaría "cualquier cosa que contenga un @" en medio de un texto más largo, no solo una dirección de email completa.
>
> **Buena práctica:** probar una regex con casos límite deliberadamente problemáticos (cadena vacía, caracteres especiales, texto más largo de lo previsto) antes de usarla en producción: una herramienta como regex101.com permite hacerlo de forma interactiva.

## Para profundizar

- [Expresiones regulares (MDN, Mozilla Developer Network, la documentación de referencia de la web)](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com): probador de regex interactivo con explicaciones en directo

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una regex describe un patrón de caracteres para buscar, validar o extraer texto, interpretada por un motor de regex integrado en el lenguaje anfitrión, no un lenguaje de programación completo. |
| **Herramientas utilizables** | Clases de caracteres (`\d`, `\w`, `\s`), cuantificadores (`*`, `+`, `?`, `{n,m}`), grupos capturantes, flags (`g`, `i`, `m`). |
| **Trampas a evitar** | Olvidar anclar un patrón (`^`/`$`) que debe corresponder a toda la cadena, no solo a una parte. |
| **Buenas prácticas** | Construir una regex compleja paso a paso, probando cada añadido; verificar su comportamiento con casos límite antes de usarla en producción. |
