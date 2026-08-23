---
order: 3
---

# La codificación de textos (ASCII, Unicode, UTF-8)

Un ordenador no almacena letras, solo números. Una **codificación** es la convención que asocia cada carácter a un número, y luego ese número a una secuencia de bytes. Cuando dos programas no coinciden en la convención, se obtienen los famosos `Ã©` en lugar de `é`.

## ASCII: 128 caracteres, 7 bits

**ASCII** (*American Standard Code for Information Interchange*), normalizado en 1963, asocia un número de 0 a 127 a los caracteres del inglés. Cabe por tanto en 7 bits, almacenados en un byte.

| Carácter | [C](/?c=langages-de-programmation&s=c&p=c)ódigo |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| espacio | 32 |

Dos propiedades de esta tabla se explotan constantemente:

```c
// Pasar de minuscula a mayuscula: 32 de diferencia, es decir un solo bit
char mayuscula = minuscula - 32;

// Convertir un caracter-digito a su valor numerico
int valor = caracter - '0';    // '7' - '0' = 55 - 48 = 7
```

Por esta razón, en C un `char` **es** un entero: `'A'` y `65` son el mismo valor. Ver el capítulo [Las variables y tipos de datos](/?c=langages-de-programmation&s=c&p=variables).

Los códigos 0 a 31 no son caracteres imprimibles sino **caracteres de control**, herencia de los teletipos: `\n` (10, salto de línea), `\t` (9, tabulación), `\0` (0, marcador de fin de cadena en C).

## El problema: 128 caracteres no bastan

Ni `é`, ni `ñ`, ni `京`, ni `😀` entran en ASCII. Cada región creó por tanto su propia extensión sobre el 8º bit (códigos 128–255): [`ISO-8859-1`](https://en.wikipedia.org/wiki/ISO/IEC_8859-1) (Latin-1) para Europa Occidental, `ISO-8859-5` para el cirílico, [`Windows-1252`](https://en.wikipedia.org/wiki/Windows-1252)...

De ahí el problema estructural: **el mismo byte designaba caracteres diferentes según la tabla usada**, y nada en el archivo indicaba cuál. Un texto francés leído con una tabla cirílica daba galimatías.

## Unicode: separar el carácter de su almacenamiento

Unicode resuelve el problema distinguiendo dos preguntas que se confundían:

1. **¿Qué carácter?** Cada carácter recibe un número único y definitivo, llamado **punto de código**, anotado `U+XXXX`. `é` es `U+00E9`, `京` es `U+4EAC`, `😀` es `U+1F600`. Hay más de 150 000.
2. **¿Cómo almacenarlo en bytes?** Ese es el papel de un **formato de transformación**: UTF-8, UTF-16 o UTF-32.

Unicode no es por tanto una codificación: es un catálogo. UTF-8 es una codificación de ese catálogo.

## UTF-8: la longitud variable

UTF-8 codifica un punto de código en **1 a 4 bytes**, según su valor:

| Rango de puntos de código | Bytes | Contenido |
|---|---|---|
| `U+0000` → `U+007F` | 1 | idéntico a ASCII |
| `U+0080` → `U+07FF` | 2 | latín acentuado, griego, cirílico, árabe, hebreo |
| `U+0800` → `U+FFFF` | 3 | chino, japonés, coreano |
| `U+10000` → `U+10FFFF` | 4 | emojis, escrituras raras |

Su cualidad decisiva es la **compatibilidad ascendente con ASCII**: un archivo ASCII ya es un archivo UTF-8 válido, sin conversión. Esto es lo que permitió su adopción universal: hoy representa más del 98% de la web.

```text
"A"  -> 1 byte  : 41
"é"  -> 2 bytes : C3 A9
"京" -> 3 bytes : E4 BA AC
"😀" -> 4 bytes : F0 9F 98 80
```

La codificación está diseñada para ser **autodescriptiva**: los bits de mayor peso del primer byte anuncian la longitud de la secuencia, y los bytes siguientes empiezan todos por `10`. Se puede por tanto resincronizar en medio de un flujo, y un byte de continuación nunca se confunde con un inicio de carácter.

## La consecuencia: un carácter ≠ un byte

Es la trampa práctica más común. En UTF-8, la longitud en bytes ya no corresponde al número de caracteres:

```python
texto = "café"
len(texto)                  # 4 -> Python cuenta los caracteres
len(texto.encode("utf-8"))  # 5 -> la "é" ocupa 2 bytes
```

En C, donde una cadena es un array de bytes, `strlen("café")` devuelve **5**. Dividir una cadena así al byte exacto puede cortar un carácter en dos y producir datos inválidos.

Peor aún, "un carácter" es en sí mismo ambiguo: ciertos signos visibles se componen de **varios** puntos de código (una letra más un acento combinante, un emoji de bandera, un emoji con modificador de tono de piel). La unidad que percibe un humano se llama un **grafema**, y contar grafemas requiere una biblioteca dedicada.

## El mojibake: diagnosticar los caracteres rotos

Cuando un texto codificado en UTF-8 se lee como Latin-1, cada byte se interpreta por separado:

```text
"é" en UTF-8    = bytes C3 A9
leidos en Latin-1  : C3 -> "Ã"   A9 -> "©"
resultado          : "Ã©"
```

Este síntoma es muy reconocible y permite remontar a la causa:

| Síntoma | Diagnóstico probable |
|---|---|
| `Ã©`, `Ã¨`, `Ã ` | UTF-8 leído como Latin-1 |
| `?` o `�` | Carácter ausente de la codificación destino, reemplazado |
| Acentos correctos salvo en una hoja de cálculo | Separador o BOM faltante al abrir |

La corrección nunca es "reemplazar los caracteres" sino **declarar la codificación correcta** en el punto de lectura. Cada capa debe ser coherente: la etiqueta [HTML](/?c=langages-de-balisage&s=html&p=html) (`<meta charset="utf-8">`, ver el capítulo [Estructura de un documento](/?c=langages-de-balisage&s=html&p=structure-dun-document)), [la cabecera HTTP](/?c=infrastructure&p=api-et-http), la codificación de los archivos fuente, y el juego de caracteres de la base de datos (`utf8mb4` para [MySQL](https://dev.mysql.com/doc/): `utf8` solo es ahí un falso amigo limitado a 3 bytes, que rechaza los emojis).

## El BOM

El **BOM** (*Byte Order Mark*, `U+FEFF`) es una marca opcional al inicio del archivo que señala la codificación. Es indispensable en UTF-16 para indicar el orden de los bytes, pero **inútil en UTF-8**, donde el orden es fijo.

Sigue siendo no obstante común en Windows, donde algunas herramientas (entre ellas [Excel](https://www.microsoft.com/microsoft-365/excel)) lo usan para reconocer un archivo UTF-8. De ahí un arbitraje clásico: un CSV destinado a Excel necesita el BOM para mostrar correctamente los acentos, mientras que un archivo fuente [PHP](/?c=langages-de-programmation&s=php&p=php) con BOM provoca un envío prematuro de contenido y rompe las cabeceras HTTP.

## UTF-16 y UTF-32

- **UTF-16**: 2 o 4 bytes por carácter. Usado internamente por Java, C#, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) y Windows. Los caracteres fuera del plano base (los emojis) ocupan ahí dos unidades de 16 bits, llamadas *surrogate pair*: de ahí que en JavaScript, `"😀".length` devuelva **2**.
- **UTF-32**: 4 bytes por carácter, tamaño fijo. Simple de indexar, pero desperdicia mucho espacio; raramente usado para almacenamiento.

## Resumen

| Noción | A recordar |
|---|---|
| ASCII | 128 caracteres, 7 bits, base de todo lo demás |
| Unicode | Un catálogo de puntos de código, **no** una codificación |
| UTF-8 | 1 a 4 bytes, compatible con ASCII, estándar de facto de la web |
| Carácter ≠ byte | `strlen` en C cuenta bytes, no letras |
| Mojibake `Ã©` | UTF-8 leído como Latin-1: corregir la declaración, no el texto |
| BOM | Inútil en UTF-8, pero esperado por Excel, nocivo al inicio de un fuente PHP |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una codificación asocia cada carácter a un número (Unicode: el catálogo) y luego a bytes (UTF-8: el formato). UTF-8 es compatible con ASCII y codifica un carácter en 1 a 4 bytes: un carácter por tanto no es necesariamente un byte. |
| **Herramientas utilizables** | `<meta charset="utf-8">`, `utf8mb4` para MySQL, una biblioteca dedicada para contar grafemas. |
| **Trampas a evitar** | Leer un archivo UTF-8 con la codificación equivocada declarada (mojibake, `Ã©`); dividir una cadena al byte exacto sin tener en cuenta los caracteres multibyte. |
| **Buenas prácticas** | Declarar la codificación correcta en cada capa (archivo, HTTP, base de datos) en lugar de "reparar" caracteres ya corruptos. |
