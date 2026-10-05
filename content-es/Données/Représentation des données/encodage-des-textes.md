---
order: 3
---

# La codificación de textos (ASCII, Unicode, UTF-8)

Un ordenador no almacena letras, solo números. Una **codificación** es la convención que asocia cada carácter a un número, y luego ese número a una secuencia de bytes. Cuando dos programas no coinciden en la convención, se obtienen los famosos `Ã©` en lugar de `é`.

## ASCII: 128 caracteres, 7 bits

**ASCII** (*American Standard Code for Information Interchange*), normalizado en 1963, asocia un número de 0 a 127 a los caracteres del inglés. Cabe por tanto en 7 bits, almacenados en un byte.

| Carácter | Código |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| espacio | 32 |

Dos propiedades de esta tabla se explotan constantemente:

```c
// Pasar de minúscula a mayuscula: 32 de diferencia, es decir un solo bit
char mayuscula = minuscula - 32;

// Convertir un carácter-digito a su valor numerico
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

## Un BOM en un archivo leído por un programa: dos fallos silenciosos

Un programa en C que [lee un archivo de texto línea a línea](/?c=langages&s=c&p=lecture-de-fichiers) (con `fgets`) supone dos cosas: que un carácter cabe en un byte, y que el texto empieza por su primer carácter visible. Un [BOM](#el-bom) desmiente una u otra, **sin producir ningún error**. Cada codificación tiene el suyo, escrito con sus propios bytes:

| Codificación | Bytes del BOM | Observación |
|---|---|---|
| UTF-8 | `EF BB BF` | Opcional; 3 bytes al principio, luego el texto |
| UTF-16 little-endian | `FF FE` | El byte menos significativo de cada unidad primero (véase [la organización en memoria](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)) |
| UTF-16 big-endian | `FE FF` | El byte más significativo primero |
| UTF-32 little-endian | `FF FE 00 00` | Empieza como el UTF-16 little-endian |
| UTF-32 big-endian | `00 00 FE FF` | |

Seis archivos con las mismas dos líneas (`title Mi texto` y `size 12`) en las distintas codificaciones, con el comando [`file`](https://man7.org/linux/man-pages/man1/file.1.html) para identificarlos y [`iconv`](https://man7.org/linux/man-pages/man1/iconv.1.html) para convertir de una codificación a otra:

```bash
printf 'title Mi texto\nsize 12\n' > utf8.txt                          # UTF-8 sin BOM
printf '\xef\xbb\xbftitle Mi texto\nsize 12\n' > utf8bom.txt           # UTF-8 con BOM
iconv -f UTF-8 -t UTF-16LE utf8.txt > cuerpo16.bin                         # UTF-16 little-endian, sin BOM
printf '\xff\xfe' | cat - cuerpo16.bin > utf16.txt                         # se añade delante el BOM FF FE
iconv -f UTF-8 -t UTF-16BE utf8.txt > cuerpo16be.bin
printf '\xfe\xff' | cat - cuerpo16be.bin > utf16be.txt
iconv -f UTF-8 -t UTF-32LE utf8.txt > cuerpo32le.bin
printf '\xff\xfe\x00\x00' | cat - cuerpo32le.bin > utf32le.txt
iconv -f UTF-8 -t UTF-32BE utf8.txt > cuerpo32be.bin
printf '\x00\x00\xfe\xff' | cat - cuerpo32be.bin > utf32be.txt
iconv -f UTF-16 -t UTF-8 utf16.txt > utf16_convertido.txt                   # de vuelta a UTF-8: el BOM desaparece
file utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_convertido.txt
```

```
utf8.txt:             ASCII text
utf8bom.txt:          Unicode text, UTF-8 (with BOM) text
utf16.txt:            Unicode text, UTF-16, little-endian text
utf16be.txt:          Unicode text, UTF-16, big-endian text
utf32le.txt:          Unicode text, UTF-32, little-endian
utf32be.txt:          Unicode text, UTF-32, big-endian
utf16_convertido.txt: ASCII text
```

Los bytes de `utf8bom.txt` (tres bytes de más) y de `utf16.txt` (cada letra seguida de un byte `00`), con [`xxd`](https://manpages.debian.org/xxd), que muestra un archivo en hexadecimal:

```bash
xxd utf8bom.txt | head -1
xxd utf16.txt | head -2
```

```
00000000: efbb bf74 6974 6c65 204d 6920 7465 7874  ...title Mi text
00000000: fffe 7400 6900 7400 6c00 6500 2000 4d00  ..t.i.t.l.e. .M.
00000010: 6900 2000 7400 6500 7800 7400 6f00 0a00  i. .t.e.x.t.o...
```

### Un lector ingenuo y un lector que mira el principio del archivo

El programa lee **directivas** (una línea `palabra valor`: aquí `title` seguido de un texto, `size` seguido de un número). El lector ingenuo compara cada línea con la palabra esperada e **ignora sin ruido** toda línea desconocida; el lector seguro lee primero los cuatro primeros bytes (`skip_bom`), salta un BOM UTF-8, rechaza expresamente un UTF-16 o un UTF-32, y señala las líneas desconocidas.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Lee un archivo de directivas «title texto» y «size número», sin ocuparse del BOM. */
static void	parse_naive(const char *path)
{
	FILE	*f = fopen(path, "r");
	char	line[128], title[64] = "(ausente)";
	int		size = -1, ignored = 0;

	if (!f)
		return ;
	while (fgets(line, sizeof line, f))
	{
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			ignored++;                              /* directiva desconocida: ignorada sin ruido */
	}
	fclose(f);
	printf("ingenuo %-12s : título=%s, tamaño=%d, líneas ignoradas=%d\n", path, title, size, ignored);
}

/* Lee los 4 primeros bytes: salta el BOM UTF-8, rechaza UTF-16 y UTF-32. Devuelve 0 o -1. */
static int	skip_bom(FILE *f, const char *path)
{
	unsigned char	b[4] = {0};
	size_t			n = fread(b, 1, 4, f);

	if (n >= 4 && b[0] == 0xFF && b[1] == 0xFE && b[2] == 0 && b[3] == 0)
		return (fprintf(stderr, "%s : UTF-32 (BOM FF FE 00 00) no admitido\n", path), -1);
	if (n >= 4 && b[0] == 0 && b[1] == 0 && b[2] == 0xFE && b[3] == 0xFF)
		return (fprintf(stderr, "%s : UTF-32 (BOM 00 00 FE FF) no admitido\n", path), -1);
	if (n >= 2 && b[0] == 0xFF && b[1] == 0xFE)
		return (fprintf(stderr, "%s : UTF-16 (BOM FF FE) no admitido\n", path), -1);
	if (n >= 2 && b[0] == 0xFE && b[1] == 0xFF)
		return (fprintf(stderr, "%s : UTF-16 (BOM FE FF) no admitido\n", path), -1);
	if (n >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF)
		return (fseek(f, 3, SEEK_SET), 0);          /* BOM UTF-8: se reanuda justo después */
	return (fseek(f, 0, SEEK_SET), 0);              /* sin BOM: se reanuda al principio */
}

/* Misma lectura, pero se trata el BOM y se señala una directiva desconocida. */
static void	parse_safe(const char *path)
{
	FILE	*f = fopen(path, "rb");
	char	line[128], title[64] = "(ausente)";
	int		size = -1, line_no = 0, unknown = 0;

	if (!f || skip_bom(f, path) != 0)
		return ((void)(f && fclose(f)));
	while (fgets(line, sizeof line, f))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			unknown += fprintf(stderr, "%s:%d : directiva desconocida\n", path, line_no) > 0;
	}
	fclose(f);
	printf("seguro  %-12s : título=%s, tamaño=%d, directivas desconocidas=%d\n", path, title, size, unknown);
}

int	main(int argc, char **argv)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* mensajes y resultados en orden */
	for (int i = 1; i < argc; i++)
		parse_naive(argv[i]);
	for (int i = 1; i < argc; i++)
		parse_safe(argv[i]);
	return (0);
}
```

```bash
gcc -Wall -Wextra -g -fsanitize=address,undefined directives.c -o directives
./directives utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_convertido.txt
```

```
ingenuo utf8.txt     : título=Mi texto, tamaño=12, líneas ignoradas=0
ingenuo utf8bom.txt  : título=(ausente), tamaño=12, líneas ignoradas=1
ingenuo utf16.txt    : título=(ausente), tamaño=-1, líneas ignoradas=3
ingenuo utf16be.txt  : título=(ausente), tamaño=-1, líneas ignoradas=2
ingenuo utf32le.txt  : título=(ausente), tamaño=-1, líneas ignoradas=3
ingenuo utf32be.txt  : título=(ausente), tamaño=-1, líneas ignoradas=2
ingenuo utf16_convertido.txt : título=Mi texto, tamaño=12, líneas ignoradas=0
seguro  utf8.txt     : título=Mi texto, tamaño=12, directivas desconocidas=0
seguro  utf8bom.txt  : título=Mi texto, tamaño=12, directivas desconocidas=0
utf16.txt : UTF-16 (BOM FF FE) no admitido
utf16be.txt : UTF-16 (BOM FE FF) no admitido
utf32le.txt : UTF-32 (BOM FF FE 00 00) no admitido
utf32be.txt : UTF-32 (BOM 00 00 FE FF) no admitido
seguro  utf16_convertido.txt : título=Mi texto, tamaño=12, directivas desconocidas=0
```

**Primer caso: el BOM UTF-8 pegado a la primera directiva.** El archivo `utf8bom.txt` se parece a `utf8.txt` en pantalla, pero su primera línea empieza por los bytes `EF BB BF`: vale `\xEF\xBB\xBFtitle Mi texto`, que no es `title `; el lector ingenuo la pone entre las líneas desconocidas, **la primera directiva desaparece** y nada lo dice (`título=(ausente)`, una línea ignorada). El resto del archivo se lee con normalidad, lo que hace difícil relacionar el defecto con su causa.

**Segundo caso: el UTF-16 y los bytes NUL.** Una cadena de caracteres en C termina con un byte de valor 0, el **NUL** (`'\0'`); `strlen` y la mayoría de las funciones de texto se detienen en el primero. En UTF-16 (y en UTF-32), una letra ASCII va seguida de uno o tres bytes NUL: `t` se escribe `74 00`. Medido en la primera línea de `utf16.txt`:

```c
#include <stdio.h>
#include <string.h>

int	main(void)
{
	FILE	*f = fopen("utf16.txt", "rb");
	char	line[128];
	long	start = ftell(f);                       /* posición antes de la lectura */

	fgets(line, sizeof line, f);                    /* lee hasta el primer byte 0x0A */
	printf("bytes leídos: %ld, strlen: %zu\n", ftell(f) - start, strlen(line));
	printf("primeros bytes: %02x %02x %02x %02x\n", (unsigned char)line[0],
		(unsigned char)line[1], (unsigned char)line[2], (unsigned char)line[3]);
	fclose(f);
	return (0);
}
```

```
bytes leídos: 31, strlen: 3
primeros bytes: ff fe 74 00
```

`fgets` ha leído 31 bytes (hasta el primer byte `0A`, un salto de línea: en UTF-16 se escribe `0A 00`, así que su `00` abre la línea siguiente), pero `strlen` solo ve 3: `FF`, `FE`, `74`, y luego el NUL lo detiene todo. Cada línea se ve como un único carácter precedido del BOM: **ninguna directiva coincide**, el lector ingenuo no rellena nada (`título=(ausente), tamaño=-1`, 3 líneas ignoradas) y no señala nada.

El lector seguro no intenta adivinar: lee el BOM y **rechaza expresamente** la codificación (`utf16.txt : UTF-16 (BOM FF FE) no admitido`), indicando el byte que la delató. La conversión se hace en otro sitio, con `iconv -f UTF-16 -t UTF-8`: el archivo convertido se lee con normalidad (`utf16_convertido.txt`).

| Archivo | Lector ingenuo | Lector seguro |
|---|---|---|
| UTF-8 sin BOM | correcto | correcto |
| UTF-8 con BOM | **título perdido**, sin error | correcto (BOM saltado) |
| UTF-16 (LE o BE) | **todo ignorado**, sin error | rechazo expreso |
| UTF-32 (LE o BE) | **todo ignorado**, sin error | rechazo expreso |
| UTF-16 convertido a UTF-8 | correcto | correcto |

> **Trampa:** un editor que guarda «en UTF-8» añade a veces un BOM, que `cat` o un simple `diff` no muestran. Un archivo que parece idéntico en pantalla puede empezar por tres bytes invisibles. El comando `file` (o `xxd | head -1`) lo revela.
>
> **Trampa:** comprobar el BOM UTF-32 little-endian (`FF FE 00 00`) **después** del de UTF-16 (`FF FE`): ambos empiezan por los mismos bytes, el más corto ganaría siempre. En `skip_bom`, la comprobación de cuatro bytes va primero.
>
> **Buena práctica:** leer los primeros bytes antes de analizar un archivo de texto llegado del exterior, saltar un BOM UTF-8, rechazar expresamente las demás codificaciones (con el BOM hallado en el mensaje), y señalar una directiva desconocida en lugar de ignorarla en silencio.

## Quitar los acentos de un texto: la normalización Unicode (NFKD)

Comparar o buscar texto ignorando los acentos (agrupar "café" y "cafe" como una misma entrada, por ejemplo) exige separar cada letra acentuada de su acento. El módulo estándar `unicodedata` ofrece esta descomposición sin reinventar una tabla de correspondencia:

```python
import unicodedata

def quitar_acentos(texto):
    # "é" -> "e" + acento agudo combinante
    descompuesto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in descompuesto if not unicodedata.combining(c))

quitar_acentos("café")   # "cafe"
```

`unicodedata.normalize("NFKD", ...)` descompone cada carácter acentuado en su letra base seguida de un **carácter combinante** aparte (el acento mismo, un punto de código independiente); `unicodedata.combining(c)` devuelve verdadero para esos caracteres combinantes, que basta entonces con filtrar.

NFKD es una de las 4 formas de normalización Unicode estándar:

| Forma | Efecto |
|---|---|
| NFC | Recompone: forma más corta, un punto de código por carácter visible cuando es posible |
| NFD | Descompone: letra base + acentos combinantes separados |
| NFKC | Como NFC, unificando además las variantes de presentación (ej. ligadura `ﬁ` → `fi`) |
| NFKD | Como NFD, con la misma unificación que NFKC |

> **Trampa:** dos textos visualmente idénticos pueden estar compuestos de forma distinta en memoria (`é` en un solo punto de código `U+00E9`, o en dos, `U+0065` + `U+0301`) y por tanto fallar una comparación `==` aunque se muestren igual. Normalizar ambos textos a la misma forma antes de compararlos evita esta trampa.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una codificación asocia cada carácter a un número (Unicode: el catálogo) y luego a bytes (UTF-8: el formato). UTF-8 es compatible con ASCII y codifica un carácter en 1 a 4 bytes: un carácter por tanto no es necesariamente un byte. La normalización Unicode (NFC/NFD/NFKC/NFKD) recompone o descompone un carácter acentuado, en particular para comparar o buscar texto ignorando los acentos. |
| **Herramientas utilizables** | `<meta charset="utf-8">`, `utf8mb4` para MySQL, una biblioteca dedicada para contar grafemas, `unicodedata.normalize()`/`unicodedata.combining()` para normalizar un texto o quitarle los acentos. |
| **Trampas a evitar** | Leer un archivo UTF-8 con la codificación equivocada declarada (mojibake, `Ã©`); dividir una cadena al byte exacto sin tener en cuenta los caracteres multibyte; comparar dos textos visualmente idénticos pero compuestos de forma distinta en memoria sin normalizarlos antes; analizar un archivo que empieza por un BOM sin tratarlo (directiva perdida en UTF-8, todo el texto ignorado en UTF-16). |
| **Buenas prácticas** | Declarar la codificación correcta en cada capa (archivo, HTTP, base de datos) en lugar de "reparar" caracteres ya corruptos. Normalizar dos textos a la misma forma Unicode antes de compararlos o buscarlos. Leer los primeros bytes de un archivo llegado del exterior para detectar un BOM, y señalar una codificación no admitida en lugar de ignorarla. |
