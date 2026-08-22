---
order: 1
---

# Variables y tipos de datos

Recordemos que [una variable es una caja etiquetada que contiene un valor](/?c=bases-de-l-informatique&p=la-variable). En el lenguaje C, cada variable posee además un tipo que determina:

- La cantidad de memoria asignada.
- Los valores que puede contener.
- Las operaciones que se pueden realizar con ella.

Comprender los diferentes tipos de datos es esencial para escribir programas eficientes y comprender mejor la gestión de la memoria.

## Los números enteros (`int`)

El tipo `int` permite almacenar números enteros positivos o negativos.

```c
int edad = 25;
int temperatura = -5;
```

El tamaño de un `int` depende de la arquitectura de la máquina, pero suele ser de 4 bytes (32 bits).

## Los caracteres (`char`)

El tipo `char` permite almacenar un único carácter.

```c
char letra = 'A';
char digito = '5';
```

Un `char` suele ocupar 1 byte en memoria y contiene el valor ASCII del carácter.

> **Trampa:** confundir `'A'` (comillas simples) con `"A"` (comillas dobles). El primero es un único `char` (el valor ASCII 65); el segundo es una **cadena** de dos bytes, `'A'` seguido del carácter nulo `'\0'` (véase la sección dedicada más abajo). Escribir `char letra = "A";` es un error de tipo, no una simple diferencia de estilo.
>
> **Buena práctica:** reservar las comillas simples para un carácter aislado, y las comillas dobles para una cadena, incluso si es de un solo carácter.
>
> **Nota:** el estándar C no fija si un `char` "desnudo" (sin `signed`/`unsigned` explícito) es con signo o sin signo: esta elección depende del compilador y de la arquitectura. Un código que almacena en un `char` algo distinto de texto (un pequeño valor numérico, por ejemplo) debería especificar `signed char` o `unsigned char` en lugar de suponer uno de los dos comportamientos.

## Los valores booleanos (`bool`)

Desde la norma [C99](https://en.wikipedia.org/wiki/C99), el lenguaje proporciona el tipo `bool` mediante la biblioteca `stdbool.h`.

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

Un booleano representa un valor lógico:

- `true`
- `false`

Antes de C99, era habitual utilizar números enteros (`0` para falso, un valor distinto de cero para verdadero).

> **Trampa:** suponer que un `bool` almacena fielmente cualquier entero asignado. `bool b = 5;` no almacena `5`: cualquier valor distinto de cero se reduce a `1` (`true`) en la asignación. Comparar después `b == 5` da entonces falso, un resultado que sorprende a quien esperaba recuperar el valor original.
>
> **Buena práctica:** nunca reutilizar un `bool` como si todavía pudiera contener el valor numérico original; limitarse a `true`/`false` una vez que la variable está declarada como `bool`.

> **Nota:** parte del código C más antiguo (anterior a C99, o que no incluye `stdbool.h`) todavía utiliza un simple `int` para representar un booleano. Leer ese código requiere tener presente la misma convención: `0` es falso, cualquier otro valor es verdadero, incluidos los valores negativos.

## Los números de coma flotante

El C ofrece varios tipos para representar números decimales:

```c
float precio = 9.99f;
double pi = 3.1415926535;
```

- `float`: precisión simple (32 bits)
- `double`: precisión doble (64 bits)

Estos tipos almacenan una **aproximación**, no un valor exacto: `0.1 + 0.2` no vale exactamente `0.3`. Este comportamiento no es propio del C: se debe a la norma IEEE 754 impuesta por el procesador, y se encuentra de forma idéntica en [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) o [PHP](/?c=langages-de-programmation&s=php&p=php) (véase el capítulo [Los números de coma flotante](/?c=representation-des-donnees&p=nombres-flottants) para la explicación de la codificación).

> **Trampa:** comparar dos flotantes con `==`, esperando que `0.1 + 0.2 == 0.3` sea verdadero. Debido a la aproximación, esta prueba falla silenciosamente la mayoría de las veces: ningún error, solo un resultado inesperado.
>
> **Buena práctica:** comparar dos flotantes por su diferencia (`fabs(a - b) < epsilon`, una tolerancia elegida), nunca por igualdad estricta; véase la [forma correcta de comparar](/?c=representation-des-donnees&p=nombres-flottants) para más detalle.

Del mismo modo, el rango de valores de los enteros y su comportamiento en caso de desbordamiento se derivan del número de bits asignados: véase [Los enteros, los bits y los desbordamientos](/?c=representation-des-donnees&p=entiers-et-debordements).

## Las cadenas de caracteres

El lenguaje C no dispone de un tipo "string" nativo. Una cadena de caracteres se representa mediante un array de caracteres terminado por el carácter nulo (`\0`).

```c
char nombre[] = "Devpedia";
```

En memoria:

```text
D e v p e d i a \0
```

Por lo tanto, una cadena es simplemente una sucesión de caracteres almacenados de forma contigua.

> **Trampa:** confundir `sizeof(nombre)` con la longitud real del texto. Aquí, `sizeof(nombre)` vale `9` (8 caracteres + el `\0`), calculado en tiempo de **compilación** a partir del tamaño del array. Pero en cuanto ese mismo array se pasa a una función, se comporta como un simple puntero (véase la [trampa equivalente con los arrays](/?c=langages-de-programmation&s=c&p=boucles)): `sizeof` devuelve entonces el tamaño de un puntero (a menudo `8`), no el de la cadena.
>
> **Buena práctica:** usar `sizeof` únicamente sobre un array todavía declarado como tal en el ámbito actual; usar `strlen()` (que recorre la cadena hasta el `\0`) para obtener su longitud real en cualquier otro contexto, en particular dentro de una función que la recibe como parámetro.

Véase también [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) para conocer las funciones recomendadas (`strncpy`, `snprintf`...) que permiten no escribir nunca más allá del tamaño realmente asignado de una cadena.

## Los punteros

Los punteros son una de las características más importantes del lenguaje C.

Permiten almacenar la dirección de memoria de una variable.

```c
int edad = 25;
int *ptr = &edad;
```

Aquí:

- `edad` contiene un valor.
- `ptr` contiene la dirección de memoria de `edad`.

Los punteros se utilizan para:

- Manipular directamente la memoria.
- Pasar datos a las funciones.
- Construir estructuras de datos complejas.

Esto es solo un vistazo: véase el capítulo dedicado [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs) para la aritmética de punteros, el paso por dirección, y las trampas asociadas (puntero no inicializado, `NULL` no comprobado...).

## Las estructuras (`struct`)

Las estructuras permiten agrupar varios datos en un mismo objeto.

```c
struct User
{
    int id;
    char name[50];
};
```

A menudo se utilizan para representar entidades complejas.

> **Trampa:** comparar dos estructuras con `==`. El C no lo permite para una `struct` (error de compilación), e incluso una comparación byte a byte (`memcmp`) puede equivocarse: el compilador suele insertar bytes de relleno invisibles entre los campos para respetar la alineación en memoria de cada tipo, y su contenido no está garantizado como idéntico entre dos instancias por lo demás iguales.
>
> **Buena práctica:** comparar una estructura campo por campo de forma explícita (`a.id == b.id && strcmp(a.name, b.name) == 0`), nunca por igualdad global ni por `memcmp` sobre la estructura entera.

## Resumen

Los principales tipos de datos en C son:

| Tipo | Descripción |
|--------|-------------|
| `bool` | Valor lógico |
| `char` | Carácter |
| `int` | Entero |
| `float` | Número decimal |
| `double` | Número decimal de alta precisión |
| `char[]` | Cadena de caracteres |
| `struct` | Conjunto de datos personalizados |
| `pointer` | Dirección de memoria |

El dominio de estos tipos es indispensable antes de abordar conceptos más avanzados como las listas enlazadas, los árboles binarios, los hilos o la gestión de procesos (véanse los capítulos dedicados a cada uno de estos temas).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada variable en C tiene un tipo fijo que determina su tamaño en memoria, los valores posibles y las operaciones permitidas: `int`, `char`, `bool` (C99), `float`/`double`, array de `char` (cadena), `struct`, puntero. |
| **Herramientas utilizables** | `stdbool.h` para un verdadero tipo booleano; `sizeof` para el tamaño de un tipo en tiempo de compilación; `strlen()` para la longitud real de una cadena en tiempo de ejecución. |
| **Trampas a evitar** | Confundir `'A'` con `"A"`. Asignar a un `bool` un valor que no devuelve tal cual. Comparar dos flotantes con `==`. Confundir `sizeof` sobre un array y sobre el puntero que lo sustituye una vez pasado a una función. Comparar dos `struct` con `==` o `memcmp` (bytes de relleno). |
| **Buenas prácticas** | Elegir el tipo más estrecho que cubra realmente los valores esperados, en lugar de un `int`/`double` por defecto sistemático. Comparar los flotantes por diferencia, las cadenas con `strcmp`, las estructuras campo por campo. |
