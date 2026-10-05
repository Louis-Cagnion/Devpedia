---
order: 28
---

# Convertir un texto en número sin la trampa de `atoi`

Un número que viene del exterior (argumento de [la línea de comandos](/?c=langages-de-programmation&s=c&p=argc-et-argv), archivo, entrada del usuario) llega siempre como **texto**: hay que convertirlo. `atoi()` y `atof()`, presentadas en [Convertir una cadena en número](/?c=langages-de-programmation&s=c&p=variables#convertir-una-cadena-en-numero-atof-atoi), lo hacen pero no detectan ningún error. Este capítulo muestra cómo validar la conversión con `strtol()` y `strtod()`.

## Lo que `atoi()` deja pasar

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    printf("%d\n", atoi("abc"));          // 0: texto inválido, ninguna señal
    printf("%d\n", atoi("12abc"));        // 12: el texto sobrante se ignora
    printf("%d\n", atoi("4294967297"));   // 1: demasiado grande para un int, ninguna señal
    return 0;
}
```

| Entrada | `atoi()` devuelve | Lo que debería ocurrir |
|---|---|---|
| `"abc"` | `0` | Rechazo: no es un número. |
| `"12abc"` | `12` | Rechazo: hay texto tras el número. |
| `"4294967297"` | `1` | Rechazo: el valor se desborda (2^32 + 1 vuelve a `1` en 32 bits). |
| `"0"` | `0` | Aceptado. Imposible distinguirlo de `"abc"`. |

## `strtol()`: devolver el número **y** el lugar donde se detuvo la lectura

```c
long strtol(const char *texto, char **resto, int base);
double strtod(const char *texto, char **resto);
```

| Parámetro o retorno | Contenido |
|---|---|
| `texto` | El texto que se convierte. |
| `resto` | Dirección de un puntero que la función rellena: designa el **primer carácter no leído**. |
| `base` | `10` para decimal, `16` para hexadecimal, `0` para detectar `0x…` y `0…`. |
| Retorno | El valor leído (`0` si no se pudo leer nada). |

```
texto  ->  "12abc"
            ^ ^
            | resto (primer carácter no leído: 'a')
            texto
```

El puntero `resto` permite tres comprobaciones que `atoi()` nunca ofrece:

| Comprobación | Prueba |
|---|---|
| Ningún dígito leído | `resto == texto` |
| Texto sobrante tras el número | `*resto != '\0'` |
| Texto vacío | `*texto == '\0'` (cubierto por la primera prueba) |

## Los desbordamientos: `errno` y `ERANGE`

Cuando el valor no cabe en un `long`, `strtol()` devuelve `LONG_MAX` o `LONG_MIN` y pone [`errno`](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#senalar-un-error-errno) a `ERANGE`. Como las funciones que tienen éxito nunca ponen `errno` a cero, se **pone a cero uno mismo antes de la llamada**; de lo contrario, un error antiguo se tomaría por el nuevo.

## Una función de conversión completa

```c
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* Convierte texto a entero en [min, max]. Devuelve 0 si es válido, -1 si no. */
int parse_long(const char *texto, long min, long max, long *resultado)
{
    char *resto;
    long valor;

    errno = 0;                                     // puesta a cero antes de la llamada
    valor = strtol(texto, &resto, 10);
    if (resto == texto)                            // ningún dígito leído (texto vacío incluido)
        return (fprintf(stderr, "\"%s\": ningún dígito\n", texto), -1);
    if (*resto != '\0')                            // queda texto tras el número
        return (fprintf(stderr, "\"%s\": texto sobrante \"%s\"\n", texto, resto), -1);
    if (errno == ERANGE)                           // no cabe en un long
        return (fprintf(stderr, "\"%s\": fuera del rango de un long\n", texto), -1);
    if (valor < min || valor > max)                // fuera del dominio del programa
        return (fprintf(stderr, "\"%s\": fuera de [%ld, %ld]\n", texto, min, max), -1);
    *resultado = valor;
    return (0);
}
```

Cada causa de fallo tiene **su propio mensaje**, que nombra el texto erróneo: el usuario sabe qué corregir.

Resultado con algunas entradas, para un rango de 0 a 100:

| Entrada | Resultado |
|---|---|
| `"42"` | `42` |
| `"abc"` | `ningún dígito` |
| `"12abc"` | `texto sobrante "abc"` |
| `"4294967297"` | `fuera de [0, 100]` (cabe en un `long` de 64 bits, pero no en el dominio) |
| `"99999999999999999999"` | `fuera del rango de un long` |
| `""` | `ningún dígito` |
| `"-3"` | `fuera de [0, 100]` |

## Los números decimales: `strtod()`, `NaN` e `inf`

`strtod()` sigue el mismo esquema, con dos trampas más.

```c
/* Convierte texto a double finito en [min, max]. Devuelve 0 si es válido, -1 si no. */
int parse_double(const char *texto, double min, double max, double *resultado)
{
    char *resto;
    double valor;

    errno = 0;
    valor = strtod(texto, &resto);
    if (resto == texto)
        return (fprintf(stderr, "\"%s\": ningún número\n", texto), -1);
    if (*resto != '\0')
        return (fprintf(stderr, "\"%s\": texto sobrante \"%s\"\n", texto, resto), -1);
    if (errno == ERANGE || !isfinite(valor))       // 1e999 -> inf; "nan" e "inf" se aceptan
        return (fprintf(stderr, "\"%s\": valor no finito o fuera de rango\n", texto), -1);
    if (valor < min || valor > max)
        return (fprintf(stderr, "\"%s\": fuera de [%g, %g]\n", texto, min, max), -1);
    *resultado = valor;
    return (0);
}
```

| Trampa | Explicación |
|---|---|
| `"nan"` e `"inf"` | `strtod()` los acepta como números válidos. Un `NaN` pasa después **todas las comparaciones sin error** (`NaN < 0` y `NaN > 1` son falsas), así que la prueba de rango no lo ve: `isfinite()` (`<math.h>`) es indispensable. |
| `"1e999"` | Se desborda hacia `inf`: `errno` vale `ERANGE`. |
| `"0,5"` | Con la configuración regional por defecto del programa (`"C"`), la coma no es un separador decimal: `strtod()` lee `0` y `resto` designa `",5"`, que la prueba `*resto != '\0'` detecta. |
| Valor para un `float` | Un `double` finito puede superar un `float` (`1e39`): acotar al rango real del tipo de destino. |

## Acotar cada valor a su dominio

El tipo no dice lo que el programa acepta. Una transparencia va de `0` a `1`, un número de hilos de `1` a unas decenas, el tamaño de un array no puede ser negativo: el rango `[min, max]` pasado a la función lo comprueba en la propia conversión, con un mensaje específico, en lugar de dejar que un valor absurdo se propague por el programa.

Otros comportamientos que conviene conocer:

| Comportamiento | Consecuencia |
|---|---|
| `strtol()` salta los espacios **al principio** (`"  7"` da `7`) | Aceptado. Para rechazarlo, probar `isspace(*texto)` antes de la llamada. |
| `strtol()` acepta un signo `+` o `-` | `"-3"` es válido: solo el rango lo rechaza. |
| Base `0` | `"010"` vale `8` (octal) y `"0x1F"` vale `31`: evitarlo con una entrada del usuario. |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `atoi()`/`atof()` devuelven `0` ante un texto inválido, ignoran el texto sobrante y se desbordan sin avisar. `strtol()`/`strtod()` entregan un puntero `resto` al primer carácter no leído y ponen `errno` a `ERANGE` en caso de desbordamiento. |
| **Herramientas utilizables** | `strtol()`, `strtod()` (`<stdlib.h>`), `errno` y `ERANGE` (`<errno.h>`), `isfinite()` (`<math.h>`). |
| **Trampas a evitar** | Olvidar `errno = 0` antes de la llamada. No probar `resto == texto` (texto vacío o sin dígito) ni `*resto != '\0'` (texto sobrante). Aceptar `NaN` e `inf`: pasan todas las pruebas de rango. Convertir con `atoi()` un dato venido del exterior. |
| **Buenas prácticas** | Aislar la conversión en una única función que devuelva un estado y reciba el rango del dominio como parámetros. Un mensaje de error por causa, que nombre el texto erróneo. Rechazar el valor en lugar de corregirlo en silencio. |
