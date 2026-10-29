---
order: 30
---

# Filtrar una cadena en el sitio con dos punteros

Retirar caracteres de un texto (espacios de sobra, saltos de línea, todo lo que no sea una letra) parece sencillo mientras se tenga derecho a fabricar un segundo texto. Este capítulo muestra cómo hacerlo **en el sitio**: en la propia memoria del texto original, sin reservar nada, en una sola pasada. La técnica se basa en dos punteros, uno que lee y otro que escribe. Reúne tres nociones que C usa en todas partes: la escritura `*out++ = *p`, la diferencia entre `*p++` y `(*p)++`, y la resta de dos punteros.

Supone conocidos [los punteros](/?c=langages&s=c&p=pointeurs) (una variable que contiene la dirección de otra; `*p` lee o escribe la casilla a la que apunta; `p + 1` designa la casilla siguiente, véase [la aritmética de punteros](/?c=langages&s=c&p=pointeurs#aritmetica-de-punteros)), [las cadenas de caracteres](/?c=langages&s=c&p=variables#las-cadenas-de-caracteres) (un array de `char` terminado por el **carácter nulo** `'\0'`, de código 0, que marca el fin del texto) y [los bucles](/?c=langages&s=c&p=boucles). Un `char` es un entero pequeño que codifica una letra, una cifra o un signo: `'a'` vale 97, y `'a' + 1` vale `'b'`.

## El problema: quitar caracteres sin una segunda cadena

Dos filtros sirven de hilo conductor a todo el capítulo.

| Filtro | Regla | Antes | Después |
|---|---|---|---|
| Espacios de sobra | Una serie de espacios se convierte en un solo espacio | `a   b  c` | `a b c` |
| Líneas cortadas | Una barra invertida `\` seguida de un salto de línea desaparece | `un \` + salto de línea + `deux` | `un deux` |

La **barra invertida** (*backslash*) `\` y el **salto de línea** (el carácter que termina una línea, escrito `'\n'` en C) son dos caracteres como los demás. En un texto escrito entre comillas en C, la `\` introduce un carácter especial (`\n`, `\0`): para designar una `\` real, se escriben dos, `'\\'`.

### Primera idea: desplazar lo que sigue en cada supresión

En cuanto un carácter debe desaparecer, se retrocede una casilla todo lo que lo sigue. `memmove(destino, origen, n)` ([documentación](https://en.cppreference.com/w/c/string/byte/memmove)) copia `n` bytes de una zona a otra, incluso si las dos zonas se solapan (algo que `memcpy` no tiene permitido, véase [copiar y rellenar bytes](/?c=langages&s=c&p=memoire#copiar-y-rellenar-bytes-memcpy-y-memset)). `strlen(t)` ([documentación](https://en.cppreference.com/w/c/string/byte/strlen)) cuenta los caracteres de `t` hasta el `'\0'`. El programa cuenta también los bytes desplazados, para medir el coste. Los elementos que emplea:

| Elemento | Función |
|---|---|
| `size_t` | Entero sin signo pensado para un tamaño o una longitud (el que devuelve `strlen`) |
| `unsigned long` | Entero sin signo, lo bastante grande para un total que supera algunos miles de millones |
| `&movidos` | La dirección de la variable `movidos`, para que la función la modifique (véase [pasar un puntero a una función](/?c=langages&s=c&p=pointeurs#pasar-un-puntero-a-una-funcion-paso-por-direccion)) |
| `%s`, `%zu`, `%lu`, `%c`, `%td` | Marcadores de formato de `printf` para un texto, un `size_t`, un `unsigned long`, un carácter, un `ptrdiff_t` |
| `[%s]` | Los corchetes alrededor del texto muestran dónde empieza y dónde termina (útil para ver los espacios) |

```c
#include <stdio.h>
#include <string.h>

// Reduce cada serie de espacios a uno solo, desplazando lo que sigue del texto.
// Suma a *movidos la cantidad de bytes desplazados, para medir el coste.
void compactar_ingenuo(char *s, unsigned long *movidos)
{
    size_t i = 0;                       // posición actual en s

    while (s[i] != '\0') {              // hasta el final del texto
        if (s[i] == ' ' && s[i + 1] == ' ') {   // dos espacios seguidos: uno sobra
            size_t resto = strlen(s + i + 1) + 1;   // bytes a desplazar, '\0' incluido
            memmove(s + i, s + i + 1, resto);       // retrocede todo lo que sigue una casilla
            *movidos += resto;          // anotamos el coste de este desplazamiento
        } else {
            i++;                        // nada que retirar aquí: avanzamos
        }
    }
}

int main(void)
{
    char          s[] = "a   b  c";     // 3 espacios entre a y b, 2 entre b y c
    unsigned long movidos = 0;          // total de bytes desplazados

    compactar_ingenuo(s, &movidos);     // filtra s en el sitio
    printf("[%s] después de %lu bytes movidos\n", s, movidos);   // [ ] marcan los bordes
    return 0;
}
```

```text
[a b c] después de 16 bytes movidos
```

El resultado es correcto, pero el trabajo se desperdicia: las tres supresiones han desplazado 7, luego 6, luego 3 bytes, es decir, 16. Cada supresión vuelve a copiar **todo lo que queda**: en un texto de `n` caracteres que contiene del orden de `n` supresiones, el total crece como `n × n / 2`. Se habla de coste **cuadrático**, anotado `O(n²)` (véase [la complejidad y la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): un texto diez veces más largo exige cien veces más trabajo. La sección « Medir la diferencia » más abajo lo cuantifica.

### Segunda idea: un único recorrido con dos punteros

En lugar de retroceder lo que sigue cada vez, se recorre el texto **una sola vez** y se copia, a medida que se avanza, únicamente lo que se conserva, hacia el principio del mismo array. Nada que desplazar, nada que reservar.

| Enfoque | Memoria adicional | Trabajo | Defecto |
|---|---|---|---|
| Copiar en una segunda cadena | Una cadena entera ([`malloc` y luego `free`](/?c=langages&s=c&p=memoire#asignacion-dinamica-de-memoria)) | Un recorrido | Puede fallar por falta de memoria; hay que liberarla |
| Desplazar lo que sigue en cada supresión | Ninguna | Cuadrático | Se vuelve lento en un texto largo |
| **Dos punteros, en el sitio** | Ninguna | Un recorrido (**lineal**: el trabajo crece como `n`) | Modifica el texto de quien llama |

## El principio: un puntero que lee, un puntero que escribe

Dos punteros apuntan al **mismo array**, ambos al principio en la primera casilla:

| Puntero | Nombre habitual | Función | ¿Cuándo avanza? |
|---|---|---|---|
| Lectura | `p` | Examina cada carácter, del primero al `'\0'` | En cada vuelta de bucle |
| Escritura | `out` | Señala la casilla donde escribir el siguiente carácter conservado | Solo cuando se conserva un carácter |

Una regla mantiene el conjunto seguro: **`out <= p` en todo momento**. Ambos punteros parten de la misma casilla; en cada vuelta, `p` avanza una casilla (o más) y `out` una casilla como mucho. Así, `out` nunca puede alcanzar y luego superar a `p`, y cada casilla en la que se escribe ya ha sido leída: nunca se sobrescribe un carácter que aún no se ha examinado. El esquema sigue el filtro de espacios de sobra sobre `"a  b"` (el `_` representa un espacio, `^` marca la casilla señalada):

```text
Vuelta 1: lee 'a'  -> conservado, copiado en la casilla 0 (sobre sí mismo)
  casilla:  0   1   2   3   4
  s      :  a   _   _   b   \0
  p      :  ^
  out    :  ^

Vuelta 2: lee '_', el último escrito es 'a'  -> conservado, copiado en la casilla 1
  casilla:  0   1   2   3   4
  s      :  a   _   _   b   \0
  p      :      ^
  out    :      ^

Vuelta 3: lee '_', el último escrito es '_'  -> ignorado, out no se mueve
  casilla:  0   1   2   3   4
  s      :  a   _   _   b   \0
  p      :          ^
  out    :          ^

Vuelta 4: lee 'b'  -> conservado, copiado en la casilla 2 (sobre un espacio ya leído)
  casilla:  0   1   2   3   4
  s      :  a   _   _   b   \0
  p      :              ^
  out    :          ^

Final: p lee '\0', el bucle termina; falta escribir '\0' en la casilla 3
  casilla:  0   1   2   3   4
  s      :  a   _   b   b   \0
  p      :                  ^
  out    :              ^
```

En la vuelta 3 aparece la distancia entre los dos punteros: `p` ha avanzado, `out` no. Después, `out` va una casilla por detrás de `p` hasta el final. La regla `out <= p` vale para los filtros que escriben **como máximo un carácter por cada carácter leído** (suprimir, conservar, sustituir un carácter por otro); un filtro que alargara el texto la incumpliría (véase « Cuando sale mal »).

## `*out++ = *p` desglosado

Esta línea copia el carácter leído en la posición de escritura y después avanza `out`. Combina tres operadores (símbolos que calculan algo):

| Operador | Nombre | Efecto |
|---|---|---|
| `*` delante de un puntero | Desreferenciación | Designa la casilla a la que apunta el puntero, para leerla o escribir en ella |
| `++` después de una variable (`out++`) | Incremento **postfijo** | Avanza la variable un paso **después** de proporcionar su valor anterior |
| `++` antes de una variable (`++out`) | Incremento **prefijo** | Avanza la variable **antes** de proporcionar su valor |

Para un puntero, «un paso» significa una casilla de su tipo (una casilla de `char` aquí, véase [la aritmética de punteros](/?c=langages&s=c&p=pointeurs#aritmetica-de-punteros)). Queda por saber cuál se aplica primero, `*` o `++`. Es la **precedencia** de los operadores (el orden en que el lenguaje los aplica cuando se suceden, véase la [tabla oficial](https://en.cppreference.com/w/c/language/operator_precedence)): el `++` postfijo pasa antes que el `*`. Por tanto `*out++` se lee `*(out++)`:

1. `out++` proporciona la **dirección anterior** de `out`, y `out` avanza una casilla;
2. el `*` se aplica a la dirección anterior: es la casilla donde se escribe.

Dicho de otro modo, `*out++ = *p;` hace exactamente lo que hacen estas dos líneas:

```c
*out = *p;   // escribe en la dirección que contenía out
out++;       // y solo después avanza out
```

| Escritura compacta | Equivalente desarrollado |
|---|---|
| `*out++ = *p;` | `*out = *p; out++;` |
| `*out++ = *p++;` | `*out = *p; out++; p++;` |
| `c = *p++;` | `c = *p; p++;` |
| `*++out = *p;` | `out++; *out = *p;` (avanza **antes** de escribir) |

El mismo razonamiento distingue cuatro expresiones que se parecen. El programa las prueba una a una con el texto `"abc"`; `p - t` es el número de casillas que `p` se ha alejado de `t` (la resta de punteros se detalla más abajo). Los paréntesis de `(*p)++` cuentan: sin ellos, `*p++` se leería `*(p++)`.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char  t[] = "abc";                  // el texto de partida
    char *p = t;                        // p apunta a t[0], que vale 'a'
    char  v;                            // el valor que produce la expresión probada

    v = *p++;                           // lee la casilla apuntada, y después avanza p
    printf("*p++   : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // restablece el texto de partida, '\0' incluido
    p = t;                              // y p en la primera casilla
    v = (*p)++;                         // lee el valor, y luego lo aumenta en 1 en t[0]
    printf("(*p)++ : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // mismo restablecimiento
    p = t;
    v = *++p;                           // avanza p primero, luego lee la casilla alcanzada
    printf("*++p   : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // mismo restablecimiento
    p = t;
    v = ++*p;                           // aumenta t[0] en 1, luego lee el nuevo valor
    printf("++*p   : valor %c, p - t = %td, t = %s\n", v, p - t, t);
    return 0;
}
```

```text
*p++   : valor a, p - t = 1, t = abc
(*p)++ : valor a, p - t = 0, t = bbc
*++p   : valor b, p - t = 1, t = abc
++*p   : valor b, p - t = 0, t = bbc
```

| Expresión | Se lee | Valor producido | Lo que cambia |
|---|---|---|---|
| `*p++` | `*(p++)` | `a`: la casilla apuntada **antes** de avanzar | `p` avanza una casilla; el texto queda intacto |
| `(*p)++` | `(*p)++` | `a`: el valor **antes** del aumento | `t[0]` pasa de `a` a `b`; `p` no se mueve |
| `*++p` | `*(++p)` | `b`: la casilla alcanzada **después** de avanzar | `p` avanza una casilla; el texto queda intacto |
| `++*p` | `++(*p)` | `b`: el valor **después** del aumento | `t[0]` pasa de `a` a `b`; `p` no se mueve |

Para recordarlo: el `++` actúa sobre lo que tiene **pegado**. En `*p++`, está pegado a `p`, así que es el puntero el que avanza. En `(*p)++` y `++*p`, recae sobre `*p`, así que cambia el valor apuntado. En cuanto al prefijo y al postfijo, el segundo proporciona el valor de **antes**, el primero el de **después**.

> **Trampa:** escribir `*p++;` solo, creyendo que aumenta el valor apuntado. Esto avanza `p` y descarta el valor leído; con `-Wall` (la opción que activa las advertencias habituales de [`gcc`](/?c=langages&s=c&p=compilation), el compilador: el programa que traduce C a un programa ejecutable), el compilador avisa: `warning: value computed is not used`. Para aumentar el valor, se escribe `(*p)++`.

Última precaución: en `*out++ = *p++`, se modifican dos variables distintas (`out` y `p`), lo cual no entraña peligro. En cambio, una expresión que **modifica** una variable y además la **lee** en otro lugar, como `*out++ = *out`, tiene un **comportamiento indefinido** (el lenguaje no dice qué ocurre: desde un fallo hasta un resultado falso que parece correcto): no impone el orden en que se ejecutan sus partes (véase [el orden de evaluación](/?c=langages&s=c&p=operateur-virgule#trampa-el-orden-de-evaluacion-de-los-argumentos-no-esta-especificado)). Regla: una variable modificada en una expresión no se lee en otro punto de ella.

## Primer filtro completo: quitar los espacios de sobra

Se aplica el esquema del capítulo al filtro de espacios. En cada vuelta se decide si el carácter leído se conserva: todo carácter que no es un espacio se conserva; un espacio solo se conserva si el último carácter escrito no es un espacio.

```c
#include <stddef.h>
#include <stdio.h>

// Reduce cada serie de espacios a un único espacio, en el sitio.
// Devuelve la nueva longitud de s, sin contar el '\0'.
size_t compactar_espacios(char *s)
{
    const char *p = s;                  // puntero de LECTURA: recorre toda la cadena
    char       *out = s;                // puntero de ESCRITURA: solo sigue lo que se conserva

    while (*p != '\0') {                // hasta el '\0' que termina la cadena
        if (*p != ' ' || out == s || out[-1] != ' ')   // ¿carácter que hay que conservar?
            *out++ = *p;                // lo escribe, luego avanza out
        p++;                            // la lectura avanza en cada vuelta, se conserve o no
    }
    *out = '\0';                        // pone el nuevo fin de cadena
    return (size_t)(out - s);           // número de caracteres conservados
}

int main(void)
{
    char   a[] = "a  b";                // dos espacios entre a y b
    char   b[] = "  un   deux    trois  ";   // series de espacios de tamaños variados
    size_t n;                           // longitud devuelta por compactar_espacios

    n = compactar_espacios(a);          // filtra a en el sitio
    printf("[%s] longitud %zu\n", a, n);
    n = compactar_espacios(b);          // filtra b en el sitio
    printf("[%s] longitud %zu\n", b, n);
    return 0;
}
```

```text
[a b] longitud 3
[ un deux trois ] longitud 15
```

La condición de guarda se lee trozo a trozo. Las tres pruebas están unidas por `||` (« o »), que se detiene en cuanto una prueba es verdadera sin evaluar las siguientes (véase [la evaluación en cortocircuito](/?c=langages&s=c&p=boucles#evaluacion-en-cortocircuito-de)): eso es lo que hace protectora a `out == s`.

| Trozo | Pregunta planteada | Función |
|---|---|---|
| `*p != ' '` | ¿El carácter leído no es un espacio? | Todo otro carácter se conserva |
| `out == s` | ¿Todavía no se ha escrito nada? | Al principio, `out[-1]` sería la casilla **antes** del array: no se lee |
| `out[-1] != ' '` | ¿El último carácter escrito no es un espacio? | Conserva el primer espacio de una serie e ignora los siguientes |

`out[-1]` es `*(out - 1)`: la casilla justo **detrás** de `out`, es decir, el último carácter escrito (véase [`[]` no es más que azúcar sintáctico](/?c=langages&s=c&p=pointeurs#no-es-mas-que-azucar-sintactico) en el capítulo sobre punteros). Un índice negativo es legal en un puntero, siempre que la casilla señalada pertenezca al array.

El puntero de lectura se declara `const char *p`: promete no escribir nunca. Si el código intentara `*p = ...`, el compilador lo rechazaría. Solo `out` escribe. Este reparto de papeles evita equivocarse de puntero.

Nota sobre los bordes: los espacios al principio y al final no desaparecen, se reducen a uno solo (`"  un ... trois  "` pasa a `" un ... trois "`). Si usted quiere quitarlos del todo, necesita otro filtro, que debe conocer el final de la cadena.

## El terminador: escribir el `'\0'` final

Una cadena de C termina en el **primer** `'\0'` que se encuentra. Tras el filtro, el texto es más corto, pero el antiguo `'\0'` se quedó más lejos: sin un nuevo terminador, reaparece el antiguo final del texto. El programa siguiente es el de los espacios, al que se ha quitado la línea `*out = '\0'`:

```c
#include <stdio.h>
#include <string.h>

// Mismo filtro que compactar_espacios, pero OLVIDA terminar la cadena.
void compactar_sin_fin(char *s)
{
    const char *p = s;                  // puntero de lectura
    char       *out = s;                // puntero de escritura

    while (*p != '\0') {                // recorre toda la cadena
        if (*p != ' ' || out == s || out[-1] != ' ')   // ¿carácter que hay que conservar?
            *out++ = *p;                // lo escribe, luego avanza out
        p++;                            // la lectura avanza en cada vuelta
    }
                                        // olvido: aquí no hay *out = '\0'
}

int main(void)
{
    char s[] = "a  b";                  // 4 caracteres, más el '\0' en la casilla 4

    compactar_sin_fin(s);               // filtra s sin terminarla
    printf("[%s] longitud %zu\n", s, strlen(s));   // esperado: [a b] longitud 3
    return 0;
}
```

```text
[a bb] longitud 4
```

```text
casilla 0   1   2   3   4
antes   a   _   _   b   \0
sin     a   _   b   b   \0      <- la 'b' de la casilla 3 quedó: texto « a bb »
con     a   _   b   \0  \0      <- *out = '\0' en la casilla 3: el texto termina aquí
```

Ningún error se señala: todo permanece en el array, el programa «funciona» y muestra un texto falso. Este error no lo detectan los [sanitizers](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) (herramientas de control en tiempo de ejecución); solo un test que compara el resultado esperado lo encuentra. La línea `*out = '\0';` se coloca **siempre** después del bucle, antes de devolver el control.

## Medir la diferencia

Veamos las dos versiones en el peor caso del desplazamiento: `n` espacios seguidos y una `x`. (`sizeof arr` da el tamaño en bytes del array, véase [`sizeof`](/?c=langages&s=c&p=memoire#sizeof); dividir entre el tamaño de una casilla da el número de casillas.) El `main` siguiente supone que `compactar_ingenuo` y `compactar_espacios` están copiadas encima de él, tal como se presentaron más arriba.

```c
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// (aquí: compactar_ingenuo y compactar_espacios, copiadas de las secciones anteriores)

int main(void)
{
    size_t tamanos[] = {1000, 10000, 100000};   // longitudes de series de espacios a probar
    size_t cantidad = sizeof tamanos / sizeof tamanos[0];   // número de ensayos

    for (size_t k = 0; k < cantidad; k++) {   // un ensayo por longitud
        size_t n = tamanos[k];          // número de espacios de este ensayo
        char  *a = malloc(n + 2);       // n espacios, una 'x', un '\0'
        char  *b = malloc(n + 2);       // mismo texto, para la versión de dos punteros
        unsigned long movidos = 0;      // bytes desplazados por la versión ingenua

        if (a == NULL || b == NULL)     // falta de memoria: se abandona
            return 1;
        memset(a, ' ', n);              // n espacios seguidos: peor caso del desplazamiento
        a[n] = 'x';                     // un carácter visible tras los espacios
        a[n + 1] = '\0';                // fin de cadena
        memcpy(b, a, n + 2);            // copia idéntica, '\0' incluido
        compactar_ingenuo(a, &movidos); // versión que desplaza
        compactar_espacios(b);          // versión de dos punteros
        printf("n = %6zu : ingenuo %11lu bytes movidos, ", n, movidos);
        printf("dos punteros %6zu leídos, ", n + 1);   // el texto entero, leído una sola vez
        printf("iguales: %s\n", strcmp(a, b) == 0 ? "sí" : "no");   // ¿mismo resultado?
        free(a);                        // devuelve la memoria
        free(b);
    }
    return 0;
}
```

```text
n =   1000 : ingenuo      501498 bytes movidos, dos punteros   1001 leídos, iguales: sí
n =  10000 : ingenuo    50014998 bytes movidos, dos punteros  10001 leídos, iguales: sí
n = 100000 : ingenuo  5000149998 bytes movidos, dos punteros 100001 leídos, iguales: sí
```

Las dos columnas no cuentan las mismas cosas (bytes desplazados de un lado, caracteres leídos del otro), pero su evolución habla por sí sola: cuando el texto se multiplica por 10, el trabajo del desplazamiento se multiplica por 100, el de los dos punteros por 10.

| Longitud `n` | Desplazamiento (bytes movidos) | Dos punteros (caracteres leídos) | Cociente entre ambos |
|---|---|---|---|
| 1 000 | 501 498 | 1 001 | alrededor de 500 |
| 10 000 | 50 014 998 | 10 001 | alrededor de 5 000 |
| 100 000 | 5 000 149 998 | 100 001 | alrededor de 50 000 |

La proporción se multiplica por 10 en cada fila: la diferencia no deja de crecer con el tamaño del texto.

## La diferencia de dos punteros: la nueva longitud

Al final de `compactar_espacios`, `out` ha avanzado una casilla por cada carácter conservado desde `s`. El número de caracteres conservados es, pues, la distancia entre `out` y `s`, y la **resta de dos punteros** la da directamente: `out - s`. No hace falta llamar a `strlen`, que volvería a recorrer todo el texto.

El resultado tiene el tipo `ptrdiff_t` ([documentación](https://en.cppreference.com/w/c/types/ptrdiff_t)), definido en `<stddef.h>`: un entero **con signo** (el resultado puede ser negativo si el primer puntero está antes que el segundo) pensado para contener una distancia entre punteros. `printf` lo muestra con `%td`. La distancia se cuenta **en casillas del tipo apuntado**, no en bytes, igual que la suma de un entero a un puntero:

```c
#include <stddef.h>
#include <stdio.h>

int main(void)
{
    int       arr[5] = {10, 20, 30, 40, 50};   // 5 enteros uno junto a otro en memoria
    int      *inicio = &arr[1];         // dirección de la casilla 1 (valor 20)
    int      *final = &arr[4];          // dirección de la casilla 4 (valor 50)
    ptrdiff_t casillas = final - inicio;   // distancia en CASILLAS (en int), no en bytes
    ptrdiff_t bytes = (char *)final - (char *)inicio;   // misma distancia, vista byte a byte

    printf("final - inicio = %td casillas\n", casillas);
    printf("en bytes       = %td\n", bytes);
    printf("inicio + casillas == final : %d\n", inicio + casillas == final);  // 1 = verdadero
    return 0;
}
```

```text
final - inicio = 3 casillas
en bytes       = 12
inicio + casillas == final : 1
```

Tres casillas de distancia, es decir 12 bytes porque un `int` ocupa 4 en esta máquina. Para un array de `char`, una casilla vale un byte y ambas cuentas coinciden, pero el principio sigue siendo «en casillas». La resta es la inversa de la suma: `inicio + (final - inicio)` devuelve `final`. Las operaciones permitidas entre punteros:

| Operación | Sentido | ¿Permitida? |
|---|---|---|
| `p + n`, `p - n` | Puntero avanzado o retrocedido `n` casillas | Sí, sin salir del array (la casilla justo después del final está permitida, nada más allá) |
| `p - q` | Número de casillas entre `q` y `p`, de tipo `ptrdiff_t` | Sí, si `p` y `q` apuntan al **mismo** array |
| `p < q`, `p <= q` | Cuál dirección viene antes | Sí, si es el mismo array |
| `p + q` | Ningún sentido | No: el compilador lo rechaza (`invalid operands to binary +`) |
| `p - q` con dos arrays distintos | Distancia sin significado | No: comportamiento indefinido |

En nuestros filtros, `out` y `s` apuntan al mismo array y `out >= s`: la distancia es positiva, y se convierte sin riesgo a `size_t` con `(size_t)(out - s)`. Tras un filtro correcto, `out - s` y `strlen(s)` son iguales; si se olvidó el `'\0'`, difieren (`out - s` vale 3 y `strlen(s)` vale 4 en el programa de la sección anterior).

## Mirar hacia delante: unir las líneas cortadas por `\`

En un archivo de configuración, un script (un archivo de comandos) o un [`Makefile`](/?c=langages&s=c&p=makefiles), una `\` seguida de un salto de línea indica «esta línea continúa en la siguiente». El segundo filtro suprime esos dos caracteres para unir el texto. No puede decidir mirando solo el carácter actual: una `\` solo debe retirarse **si el siguiente es un salto de línea**. Por eso lee `p[1]`, la casilla justo después de la de `p`:

| `*p` | `p[1]` | Acción | Motivo |
|---|---|---|---|
| `\` | `'\n'` | `p += 2`, no se escribe nada | La pareja a suprimir |
| `\` | otro carácter | Copiar la `\` | No es una continuación |
| `\` | `'\0'` | Copiar la `\` | `p[1]` es el fin de la cadena: no se lee nada más allá |
| otra cosa | no leído | Copiar el carácter | `&&` se detiene antes de evaluar `p[1]` |

La lectura de `p[1]` es segura porque el bucle solo gira mientras `*p != '\0'`: la casilla siguiente existe forzosamente, en el peor de los casos es el terminador. Leer `p[2]` sin haber comprobado `p[1]` no lo sería: si `p[1]` es el `'\0'`, `p[2]` ya está fuera del array.

```c
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Suprime cada pareja « \ seguido de salto de línea » de s, en el sitio.
// Devuelve la nueva longitud de s.
size_t unir_lineas(char *s)
{
    const char *p = s;                  // puntero de LECTURA
    char       *out = s;                // puntero de ESCRITURA

    while (*p != '\0') {                // hasta el final de la cadena
        if (*p == '\\' && p[1] == '\n')   // ¿'\' seguido de un salto de línea?
            p += 2;                     // salta los dos caracteres, sin escribir nada
        else
            *out++ = *p++;              // copia un carácter y avanza los dos punteros
    }
    *out = '\0';                        // pone el nuevo fin de cadena
    return (size_t)(out - s);           // nueva longitud
}

int main(void)
{
    char a[] = "un \\\ndeux \\\ntrois\n";   // el texto contiene dos « \ » + salto de línea
    char b[] = "fin\\";                 // una '\' al final del todo, nada detrás
    size_t antes = strlen(a);           // longitud antes del filtro
    size_t despues = unir_lineas(a);    // longitud después del filtro

    printf("%s", a);                    // el texto unido conserva su salto de línea final
    printf("antes %zu, después %zu\n", antes, despues);
    unir_lineas(b);                     // p[1] vale '\0': la '\' se conserva
    printf("[%s]\n", b);
    return 0;
}
```

```text
un deux trois
antes 18, después 14
[fin\]
```

El texto de `a` contiene `un \`, un salto de línea, `deux \`, un salto de línea, `trois` y un último salto de línea: 18 caracteres. Desaparecen dos parejas de dos caracteres, quedan 14. En este filtro, `p` avanza a veces dos casillas mientras `out` no se mueve: la distancia entre los dos punteros crece, algo que la regla `out <= p` permite. El caso de `b` comprueba la lectura al final de la cadena: la `\` final se conserva y nada se lee más allá del `'\0'`.

> **Trampa:** un archivo venido de Windows suele terminar sus líneas con dos caracteres, `\r` (retorno de carro) y luego `\n`. Una `\` seguida de `\r\n` no la reconoce entonces este filtro. Si su texto puede venir de Windows, conviene comprobar también `p[1] == '\r' && p[2] == '\n'`, verificando antes que `p[1]` no es el `'\0'`.

## Una función reutilizable: `filtrar`

Cuando el criterio depende solo del carácter en sí (¿es una letra?, ¿es una cifra?), se escribe el bucle **una sola vez** y se le pasa el criterio como argumento. El criterio es una función, transmitida mediante un [puntero a función](/?c=langages&s=c&p=pointeurs#punteros-a-funciones): `int (*conservar)(int)` se lee «`conservar` es un puntero a una función que recibe un `int` y devuelve un `int`». El carácter se pasa en forma de `int`, la convención de las funciones de `<ctype.h>` (cabecera de la biblioteca estándar que agrupa las pruebas sobre caracteres): `isalpha(c)` ([documentación](https://en.cppreference.com/w/c/string/byte/isalpha)) devuelve un valor distinto de cero si `c` es una letra, `isdigit(c)` si es una cifra de 0 a 9, y 0 en otro caso.

El criterio debe recibir el valor del carácter **sin signo** (de 0 a 255). Un `char` puede ser negativo en muchas máquinas (es el caso de los bytes por encima de 127, que aparecen en las tildes de un texto [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)), y pasar un valor negativo a `isalpha` está prohibido por la norma. De ahí la conversión `(unsigned char)*p` antes de la llamada.

```c
#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Conserva en s los caracteres para los que conservar() devuelve verdadero (no nulo).
// Modifica s en el sitio y devuelve la nueva longitud.
size_t filtrar(char *s, int (*conservar)(int))
{
    const char *p = s;                  // puntero de LECTURA
    char       *out = s;                // puntero de ESCRITURA

    if (s == NULL || conservar == NULL) // nada que filtrar, o sin criterio
        return 0;
    while (*p != '\0') {                // recorre toda la cadena
        if (conservar((unsigned char)*p))   // el criterio juzga el valor sin signo
            *out++ = *p;                // conservado: escribe, luego avanza out
        p++;                            // la lectura avanza en todos los casos
    }
    *out = '\0';                        // pone el nuevo fin de cadena
    return (size_t)(out - s);           // nueva longitud
}

// Una función propia: verdadero para una vocal (letras sin tilde).
int es_vocal(int c)
{
    return c != '\0' && strchr("aeiouyAEIOUY", c) != NULL;   // strchr('\0') sería verdadero
}

int main(void)
{
    char   a[] = "Salut R2-D2, code 42";   // un texto con letras, cifras y signos
    char   b[] = "Salut R2-D2, code 42";   // una copia por filtro: cada uno modifica la suya
    char   c[] = "Salut R2-D2, code 42";
    size_t n;                           // longitud devuelta por filtrar

    n = filtrar(a, isalpha);            // isalpha: verdadero para una letra
    printf("isalpha     : [%s] (%zu)\n", a, n);
    n = filtrar(b, isdigit);            // isdigit: verdadero para una cifra de 0 a 9
    printf("isdigit     : [%s] (%zu)\n", b, n);
    n = filtrar(c, es_vocal);           // nuestro propio criterio
    printf("es_vocal    : [%s] (%zu)\n", c, n);
    return 0;
}
```

```text
isalpha     : [SalutRDcode] (11)
isdigit     : [2242] (4)
es_vocal    : [auoe] (4)
```

`strchr(t, c)` busca el carácter `c` en `t` (véase [buscar una cadena](/?c=langages&s=c&p=variables#buscar-y-comparar-una-cadena-strcmp-strchr-strrchr-strstr)). Considera el `'\0'` final como parte de `t`: `strchr("abc", '\0')` no devuelve `NULL`. En `filtrar`, `es_vocal` nunca recibe `'\0'`, pero la guarda `c != '\0'` evita depender de quien la llama.

| Llamada | Criterio | Texto original | Resultado |
|---|---|---|---|
| `filtrar(a, isalpha)` | Conservar las letras | `Salut R2-D2, code 42` | `SalutRDcode` |
| `filtrar(b, isdigit)` | Conservar las cifras | `Salut R2-D2, code 42` | `2242` |
| `filtrar(c, es_vocal)` | Conservar las vocales | `Salut R2-D2, code 42` | `auoe` |

`filtrar` no sustituye a los bucles anteriores, porque su criterio solo ve **un carácter a la vez**:

| Lo que hay que saber para decidir | Herramienta |
|---|---|
| El carácter solo (letra, cifra, vocal) | `filtrar` con un criterio |
| El último carácter ya escrito (espacios de sobra) | Bucle dedicado con `out[-1]` |
| Los caracteres siguientes (`\` y luego salto de línea) | Bucle dedicado con `p[1]` |

## Cuando sale mal: tres pruebas

### Filtrar un literal de cadena

Un **literal de cadena** es un texto escrito entre comillas dentro del código ([documentación](https://en.cppreference.com/w/c/language/string_literal)). El compilador lo guarda en una zona de la memoria que el programa solo puede leer. Dos declaraciones, que se parecen, no tienen por tanto en absoluto el mismo valor:

| Declaración | Qué es | ¿Modificable? |
|---|---|---|
| `char s[] = "abc";` | Un array de 4 `char`, **copia** del texto | Sí |
| `char *s = "abc";` | Un puntero al literal de solo lectura | No: escribir hace fallar el programa |
| `const char *s = "abc";` | Igual, pero el compilador lo protege | No: escribir se rechaza en la **compilación** |

```c
#include <stdio.h>

int main(void)
{
    char *literal = "abc";              // apunta a un literal, zona de solo lectura
    char  copia[] = "abc";              // array: copia modificable del texto

    copia[0] = 'X';                     // permitido: escribimos en nuestro propio array
    printf("copia : %s\n", copia);
    fflush(stdout);                     // muestra la línea antes de un posible fallo
    literal[0] = 'X';                   // prohibido: escritura en la zona de solo lectura
    printf("literal : %s\n", literal);   // nunca alcanzado
    return 0;
}
```

```text
copia : Xbc
AddressSanitizer:DEADLYSIGNAL
==28957==ERROR: AddressSanitizer: SEGV on unknown address 0x64b4603c5080 ...
==28957==The signal is caused by a WRITE memory access.
```

`fflush(stdout)` fuerza la visualización inmediata del texto pendiente de escribirse. El primer acceso funciona, el segundo hace fallar el programa: el sistema rechaza la escritura en la zona protegida (un **fallo de segmentación**). Sin la opción `-fsanitize=address`, el resultado es el mismo sin el informe: el [shell](/?c=langages&s=bash&p=architecture-dun-shell) indica el fallo de segmentación y el programa termina con el estado 139 (128 más 11, el número de la señal de ese fallo). El lenguaje C solo dice que la escritura tiene un comportamiento indefinido; el fallo es lo que se observa aquí en Linux. Con `const char *`, el mismo `literal[0] = 'X'` se rechaza ya en la compilación (`error: assignment of read-only location`): véase [`const` con punteros](/?c=langages&s=c&p=pointeurs#const-con-punteros). Para filtrar un texto fijo, primero se copia en un array (`char s[] = "..."`).

### Un puntero de escritura que supera al puntero de lectura

Un filtro que escribe **más** caracteres de los que lee hace que `out` pase por delante de `p`, y entonces sobrescribe caracteres que aún no ha leído. Aquí, cada letra debe escribirse dos veces; el bucle se limita a 3 vueltas para que la prueba termine (sin este límite, `p` nunca encontraría el `'\0'` sobrescrito):

```c
#include <stdio.h>

int main(void)
{
    char  b[16] = "abc";                // 3 letras, seguidas de ceros
    char *p;                            // puntero de lectura
    char *out = b;                      // puntero de escritura

    for (p = b; p < b + 3; p++) {       // 3 vueltas: leemos las 3 letras originales
        *out++ = *p;                    // escribe la letra leída...
        *out++ = *p;                    // ...y luego la vuelve a escribir: out supera a p
    }
    printf("[%s]\n", b);                // esperado: [aabbcc]
    return 0;
}
```

```text
[aaaaaa]
```

En la vuelta 2, `p` lee la casilla 1, que la vuelta 1 ya había sustituido por una `a`: las `b` y `c` originales han desaparecido antes de ser leídas. Para agrandar un texto hace falta un destino **separado**, lo bastante grande (véase [asignación dinámica de memoria](/?c=langages&s=c&p=memoire#asignacion-dinamica-de-memoria)), y no el mismo array.

### Leer `out[-1]` antes de haber escrito

Quitemos la guarda `out == s` de `compactar_espacios`, sobre el texto `" a"` (un espacio y luego `a`). En la primera vuelta, la prueba `*p != ' '` es falsa (es un espacio) y el programa evalúa `out[-1]`, la casilla antes del array. Compilado con `-fsanitize=address`, el programa se detiene en:

```text
==29371==ERROR: AddressSanitizer: stack-buffer-underflow on address 0x74f8e130001f ...
READ of size 1 at 0x74f8e130001f thread T0
```

Sin sanitizer, la lectura fuera del array pasa inadvertida: el valor leído es el de una variable vecina, y el resultado del filtro depende del azar. Véase [Sanitizers y pruebas de asignación](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation).

## Las trampas

| Trampa | Por qué | Remedio |
|---|---|---|
| Filtrar un literal (`char *s = "..."`) | Zona de solo lectura: falla al escribir | `char s[] = "..."`, o copiar primero; declarar `const char *` para que el error se detecte en la compilación |
| Olvidar `*out = '\0'` | Reaparece el antiguo final del texto (`a bb`) | Terminar después del bucle, siempre |
| Un filtro que escribe más de lo que lee | `out` supera a `p` y sobrescribe texto no leído | Destino separado de tamaño conocido |
| Leer `out[-1]` sin guarda | Lectura antes del principio del array | Probar `out == s` antes, dentro de un `\|\|` |
| Leer `p[1]` o `p[2]` sin comprobar el final | Lectura después del `'\0'` | Leer `p[1]` solo si `*p` no es `'\0'`, y `p[2]` solo si `p[1]` tampoco lo es |
| Confundir `*p++` y `(*p)++` | Uno avanza el puntero, el otro cambia el valor apuntado | Recordar que el `++` actúa sobre lo que tiene pegado |
| Escribir `*p++;` solo | Advertencia `value computed is not used`: el valor leído se descarta | `(*p)++` para aumentar el valor |
| Modificar la variable del llamador sin decirlo | Quien llama pierde el texto original | Documentarlo encima de la función; copiar el texto antes si todavía se necesita |
| Pasar un `char` negativo a `isalpha` | Comportamiento indefinido según la norma | `(unsigned char)*p` antes de la llamada |
| Filtrar un texto UTF-8 byte a byte | Un carácter acentuado ocupa varios bytes: quitar uno solo rompe el carácter | Filtrar solo texto sin tildes; si no, un tratamiento diseñado para [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes#la-consecuencia-un-caracter-un-byte) |
| Pasar `NULL` | Desreferenciar `NULL` hace fallar | Probar `s == NULL` al principio de la función |
| Modificar y leer una variable en la misma expresión (`*out++ = *out`) | El lenguaje no impone el orden: comportamiento indefinido | Separar en dos instrucciones |
| Llamar a `strlen` en cada vuelta | Vuelve al coste cuadrático, véase [tres trampas de rendimiento](/?c=langages&s=c&p=memoire#tres-trampas-de-rendimiento-y-de-lectura-de-memoria) | Calcular la longitud con `out - s` |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un puntero de lectura `const char *p` y un puntero de escritura `char *out`, llamados así | El compilador impide escribir por el puntero equivocado; el código se lee de un vistazo |
| Tener presente el invariante `out <= p` antes de escribir un filtro | Un filtro que solo suprime o conserva es seguro; más allá, conviene cambiar de método |
| Escribir `*out = '\0'` justo después del bucle | La cadena resultado siempre queda terminada |
| Devolver `(size_t)(out - s)` | Quien llama obtiene la nueva longitud sin volver a recorrer el texto |
| Documentar encima de la función que `s` se modifica | Quien llama sabe que pierde el texto original |
| Probar `s == NULL` y `conservar == NULL` al principio de la función | Ningún fallo ante una entrada ausente |
| Escribir el bucle genérico una vez (`filtrar`) para los criterios de un carácter | Un solo bucle que verificar |
| Probar cada filtro con una cadena vacía, un solo carácter, un texto totalmente suprimido, bajo `-fsanitize=address,undefined` | Los bordes (principio, final, `'\0'`) son donde los filtros fallan |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Filtrar en el sitio consiste en recorrer el texto con un puntero de lectura `p` y recopiar lo que se conserva con un puntero de escritura `out`, hacia el principio del mismo array: un único recorrido, ninguna reserva, coste lineal, frente a un coste cuadrático por el desplazamiento en cada supresión. `out <= p` mientras el filtro no escriba más de lo que lee. `*out++ = *p` escribe y luego avanza `out` (el `++` postfijo pasa antes que el `*`). `*p++` lee y luego avanza el puntero; `(*p)++` aumenta el valor apuntado; `*++p` avanza y luego lee; `++*p` aumenta y luego lee. Hay que poner `*out = '\0'` después del bucle. `out - s` es la nueva longitud, de tipo `ptrdiff_t`, contada en casillas y no en bytes. Un filtro que mira hacia delante lee `p[1]`, sin sobrepasar el terminador. |
| **Trampas a evitar** | Filtrar un literal (`char *s = "..."`); olvidar el `'\0'` final; hacer pasar `out` por delante de `p`; leer `out[-1]` al principio; leer `p[2]` sin haber probado `p[1]`; confundir `*p++` y `(*p)++`; modificar el texto del llamador sin documentarlo; pasar un `char` negativo a `isalpha`; filtrar UTF-8 byte a byte. |
| **Buenas prácticas** | `const char *p` para leer, `char *out` para escribir; `*out = '\0'` justo después del bucle; devolver `(size_t)(out - s)`; `filtrar(s, criterio)` para los criterios de un carácter, un bucle dedicado si no; pruebas en los bordes bajo `-fsanitize=address,undefined`; documentación: [`memmove`](https://en.cppreference.com/w/c/string/byte/memmove), [precedencia de operadores](https://en.cppreference.com/w/c/language/operator_precedence), [`ptrdiff_t`](https://en.cppreference.com/w/c/types/ptrdiff_t), [`isalpha`](https://en.cppreference.com/w/c/string/byte/isalpha). |
