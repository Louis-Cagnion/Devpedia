---
order: 31
---

# Controlar campos por su desplazamiento (offsetof) y el literal compuesto

Una **estructura** (`struct`) agrupa varios valores bajo un solo nombre; cada valor ocupa en ella una casilla con nombre, un **campo** (véase [las estructuras](/?c=langages&s=c&p=variables#las-estructuras-struct)). Este capítulo responde a dos preguntas que surgen en cuanto se rellena una estructura a partir de un archivo de ajustes. ¿Cómo evitar una larga cadena de `if`, una rama por campo? Guardando en un **array** (una secuencia de casillas del mismo tipo) la descripción de cada campo, incluida su **posición en bytes** dentro de la estructura: ese es el papel de `offsetof`. Y ¿cómo fabricar una estructura sobre la marcha, sin variable intermedia, para pasarla a una función? Con el **literal compuesto** de C99 (la revisión de 1999 del lenguaje C), `(Tipo){valores}`.

Supone conocidos [los punteros](/?c=langages&s=c&p=pointeurs) (la dirección de un valor en memoria y la desreferenciación `*`), [los bucles](/?c=langages&s=c&p=boucles) y [las condiciones](/?c=langages&s=c&p=conditions). El **byte** (8 bits) es la unidad de memoria: cada byte tiene su propia dirección (véase [la organización de los datos en memoria](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Todos los programas se compilaron con `gcc -std=c11 -Wall -Wextra` en Linux (véase [el proceso de compilación](/?c=langages&s=c&p=compilation)), y después se ejecutaron; los que usan el literal compuesto también se ejecutaron con `-std=c99`, con el mismo resultado.

## El problema: guardar líneas «nombre valor» en una estructura

Un programa lee un archivo de ajustes. Cada línea es una **directiva**: un nombre, un espacio, un valor (`velocidad 2.5`). El programa debe guardar cada valor en el campo correcto de una estructura `Ajustes`, manteniéndolo entre un límite mínimo y un límite máximo. La versión más directa es una cadena de `if`:

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidad;                    // velocidad de movimiento, de 0 a 10
    float gravedad;                     // intensidad de la gravedad, de 0 a 20
    int   tamano;                       // tamaño en casillas, de 1 a 50
} Ajustes;

// Asigna el valor v al campo que lleva el nombre dado. Devuelve 0, o -1 si es desconocido.
static int aplicar(Ajustes *r, const char *nombre, double v)
{
    if (strcmp(nombre, "velocidad") == 0) {     // primer campo
        if (v < 0.0) v = 0.0;                   // límite inferior copiado aquí
        if (v > 10.0) v = 10.0;                 // límite superior copiado aquí
        r->velocidad = (float)v;                // escritura en el campo
    } else if (strcmp(nombre, "gravedad") == 0) {   // segundo campo: todo empieza de nuevo
        if (v < 0.0) v = 0.0;
        if (v > 20.0) v = 20.0;
        r->gravedad = (float)v;
    } else if (strcmp(nombre, "tamano") == 0) {     // tercer campo: otra vez
        if (v < 1.0) v = 1.0;
        if (v > 50.0) v = 50.0;
        r->tamano = (int)v;
    } else {
        return -1;                              // ningún campo lleva este nombre
    }
    return 0;
}

int main(void)
{
    const char *lineas[] = {"velocidad 2.5", "gravedad 99", "tamano 12", "color 3"};
    Ajustes     r = {0};                // todos los campos a cero
    char        nombre[32];             // el nombre leído en la línea
    double      v;                      // el valor leído en la línea

    for (size_t i = 0; i < 4; i++) {            // una pasada por línea
        if (sscanf(lineas[i], "%31s %lf", nombre, &v) != 2)   // extrae «nombre valor»
            continue;                   // línea mal formada: se ignora
        if (aplicar(&r, nombre, v) == -1)       // ¿campo desconocido?
            printf("directiva desconocida : %s\n", nombre);
    }
    printf("velocidad=%g gravedad=%g tamano=%d\n", r.velocidad, r.gravedad, r.tamano);
    return 0;
}
```

```text
directiva desconocida : color
velocidad=2.5 gravedad=20 tamano=12
```

El programa funciona: `gravedad 99` se ha llevado al límite 20, y `color` se señala como desconocido. Algunos elementos empleados:

| Elemento | Función |
|---|---|
| `static` (delante de una función) | La función solo es visible en este archivo |
| `const` (en `const char *nombre`) | Promete que el valor señalado no se modificará |
| `const char *lineas[] = {...}` | Un array de textos; un texto es una secuencia de `char` (véase [las cadenas de caracteres](/?c=langages&s=c&p=variables#las-cadenas-de-caracteres)) |
| `typedef struct {...} Ajustes;` | Da el nombre corto `Ajustes` a este tipo de estructura, para no escribir `struct` en cada uso ([`typedef`](https://en.cppreference.com/w/c/language/typedef)) |
| `r->velocidad` | El campo `velocidad` de la estructura cuya dirección es `r`; equivale a `(*r).velocidad` |
| `strcmp(a, b) == 0` | Verdadero cuando los dos textos son idénticos (véase [comparar una cadena](/?c=langages&s=c&p=variables#buscar-y-comparar-una-cadena-strcmp-strchr-strrchr-strstr)) |
| `sscanf(linea, "%31s %lf", nombre, &v)` | Extrae una palabra (como máximo 31 caracteres) y después un número de tipo `double`; devuelve el número de valores leídos (véase [`sscanf`](/?c=langages&s=c&p=lecture-formatee-scanf)) |
| `Ajustes r = {0};` | Inicializa la estructura: el primer campo vale 0 y los campos no citados también valen cero |
| `(float)v` | Convierte el `double` en `float` antes de escribirlo (dos tipos de números con coma flotante, siendo el `double` el más preciso: véase [los números de coma flotante](/?c=langages&s=c&p=variables#los-numeros-de-coma-flotante)) |
| `%g`, `%d` | En `printf`: un número decimal sin ceros inútiles, un entero |
| `size_t` | Entero sin signo pensado para contar tamaños y posiciones; `printf` lo muestra con `%zu` |

Sus defectos aparecen en cuanto hay más de tres campos:

| Defecto | Consecuencia |
|---|---|
| Una rama más por campo | Veinte campos dan veinte ramas casi idénticas |
| Los límites se copian en cada rama | Cambiar una regla de límites obliga a tocar cada rama |
| Olvido fácil | Un campo añadido a la estructura sin rama correspondiente se ignora en silencio |
| Los datos están mezclados con el código | Imposible reutilizar la lista de directivas (para mostrar una ayuda, por ejemplo) |

La solución: separar los **datos** (qué directivas existen, con qué límites) del **código** (una sola función que sabe aplicar cualquier directiva). Los datos van en un array, y para que la función sepa dónde escribir, el array debe guardar la posición del campo dentro de la estructura.

## `offsetof`: la posición de un campo en su estructura

El **desplazamiento** (*offset*) de un campo es el número de bytes entre el inicio de la estructura y el inicio de ese campo. El primer campo está en 0. La macro `offsetof(tipo, campo)`, definida en la cabecera `<stddef.h>` (véase [los archivos de cabecera](/?c=langages&s=c&p=headers)), lo calcula y lo devuelve en forma de `size_t` ([`offsetof`](https://en.cppreference.com/w/c/types/offsetof)). Una **macro** es un fragmento de código que el preprocesador sustituye antes de la compilación (véase [el preprocesador](/?c=langages&s=c&p=compilation#1-le-preprocesseur)).

Se podría creer que el desplazamiento de un campo es la suma de los tamaños de los campos anteriores. Es falso en cuanto el compilador inserta **relleno** (*padding*): bytes perdidos, colocados entre dos campos para que cada valor empiece en una dirección múltiplo de su tamaño (véase [el relleno](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#el-relleno-padding-en-las-estructuras) y [la alineación](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#la-alineacion)). Este programa muestra los desplazamientos reales de una estructura de prueba:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    char   activo;                      // 1 byte
    float  velocidad;                   // 4 bytes
    char   nivel;                       // 1 byte
    double masa;                        // 8 bytes
} Demo;

int main(void)
{
    printf("activo    : desplazamiento %zu\n", offsetof(Demo, activo));     // inicio
    printf("velocidad : desplazamiento %zu\n", offsetof(Demo, velocidad));  // tras relleno
    printf("nivel     : desplazamiento %zu\n", offsetof(Demo, nivel));      // tras velocidad
    printf("masa      : desplazamiento %zu\n", offsetof(Demo, masa));       // tras relleno
    printf("tamaño total : %zu bytes\n", sizeof(Demo));  // suma de campos: 14
    return 0;
}
```

```text
activo    : desplazamiento 0
velocidad : desplazamiento 4
nivel     : desplazamiento 8
masa      : desplazamiento 16
tamaño total : 24 bytes
```

Los cuatro campos pesan 1 + 4 + 1 + 8 = 14 bytes, la estructura ocupa 24 ([`sizeof`](/?c=langages&s=c&p=memoire#sizeof) indica el tamaño en bytes de un tipo). Esta es la memoria de la estructura, un byte por columna; bajo cada `^`, el desplazamiento del campo que empieza allí:

```text
byte    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
        a  .  .  .  v  v  v  v  n  .  .  .  .  .  .  .  m  m  m  m  m  m  m  m
        ^           ^           ^                       ^
        0           4           8                       16

a = activo   v = velocidad   n = nivel   m = masa   . = relleno (bytes perdidos)
```

| Campo | Tamaño | Desplazamiento esperado por suma | Desplazamiento real (`offsetof`) | Por qué la diferencia |
|---|---|---|---|---|
| `activo` | 1 | 0 | 0 | Primer campo |
| `velocidad` | 4 | 1 | 4 | Un `float` empieza en un múltiplo de 4: 3 bytes perdidos |
| `nivel` | 1 | 5 | 8 | Sigue a `velocidad`, que termina en el byte 7 |
| `masa` | 8 | 6 | 16 | Un `double` empieza en un múltiplo de 8: 7 bytes perdidos |

Esta diferencia es exactamente la razón de ser de `offsetof`: solo el compilador sabe dónde ha colocado cada campo, y aquí lo dice. El resultado es una **constante** conocida en la compilación, así que puede usarse en un array inicializado fuera de cualquier función. Vale para **cualquier** variable del mismo tipo de estructura: un desplazamiento no depende de un ejemplar concreto.

## La tabla de directivas y la función única

Cada directiva se convierte en una línea `{nombre, desplazamiento, min, max}` de un array. Toda la lógica cabe después en una sola función: buscar la línea por su nombre, acotar el valor, escribir en el campo. Para empezar, la tabla solo contiene los dos campos `float`; `tamano`, de tipo `int`, llega en la sección siguiente.

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidad;                    // velocidad de movimiento
    float gravedad;                     // intensidad de la gravedad
    int   tamano;                       // tamaño en casillas (tratado más adelante)
} Ajustes;

typedef struct {
    const char *nombre;                 // nombre de la directiva en el archivo
    size_t      desplazamiento;         // posición del campo en Ajustes, en bytes
    double      min;                    // valor aceptado más pequeño
    double      max;                    // valor aceptado más grande
} Directiva;

static const Directiva g_tabla[] = {
    {"velocidad", offsetof(Ajustes, velocidad), 0.0, 10.0},   // una línea por campo
    {"gravedad", offsetof(Ajustes, gravedad), 0.0, 20.0},
};
#define NUM_DIRECTIVAS (sizeof g_tabla / sizeof g_tabla[0])     // número de líneas

// Aplica una línea «nombre valor». Devuelve 0 si se aplicó, -1 si no.
static int aplicar_linea(Ajustes *r, const char *linea)
{
    char   nombre[32];                  // el nombre leído
    double v;                           // el valor leído

    if (sscanf(linea, "%31s %lf", nombre, &v) != 2 || !isfinite(v))   // forma y valor
        return -1;
    for (size_t i = 0; i < NUM_DIRECTIVAS; i++) {       // busca la línea en la tabla
        if (strcmp(nombre, g_tabla[i].nombre) != 0)     // no es esta
            continue;
        if (v < g_tabla[i].min) v = g_tabla[i].min;     // límite inferior
        if (v > g_tabla[i].max) v = g_tabla[i].max;     // límite superior
        *(float *)((char *)r + g_tabla[i].desplazamiento) = (float)v;   // escribe en el campo
        return 0;
    }
    return -1;                          // ninguna línea lleva este nombre
}

int main(void)
{
    const char *lineas[] = {"velocidad 2.5", "gravedad 99", "color 3", "velocidad nan"};
    Ajustes     r = {0};                // todos los campos a cero

    for (size_t i = 0; i < 4; i++)      // una pasada por línea
        if (aplicar_linea(&r, lineas[i]) == -1)
            printf("línea rechazada : %s\n", lineas[i]);
    printf("velocidad=%g gravedad=%g\n", r.velocidad, r.gravedad);
    return 0;
}
```

```text
línea rechazada : color 3
línea rechazada : velocidad nan
velocidad=2.5 gravedad=20
```

| Elemento | Función |
|---|---|
| `static const Directiva g_tabla[]` | Array fijo, nunca modificado (`const`), visible solo en este archivo (`static`) |
| `{"velocidad", offsetof(...), 0.0, 10.0}` | Una línea: el nombre, el desplazamiento del campo y luego los dos límites |
| `sizeof g_tabla / sizeof g_tabla[0]` | Bytes del array entero divididos entre los bytes de una línea: el número de líneas, que se actualiza solo con cada adición |
| `continue;` | Pasa directamente a la siguiente vuelta del bucle (véase [`break` y `continue`](/?c=langages&s=c&p=boucles#break-y-continue)) |
| `... != 2 \|\| !isfinite(v)` | `\|\|` significa «o»; `!` invierte una condición: se rechaza si la línea está mal formada o si el valor no es finito |
| `isfinite(v)` | Falso para `NaN` («no es un número») y el infinito, de `<math.h>`: pasarían los límites sin error (véase [`NaN` e `inf`](/?c=langages&s=c&p=convertir-un-texte-en-nombre#los-numeros-decimales-strtod-nan-e-inf)) |
| Los dos `if` sobre `v` | Llevan el valor a `[min, max]` (véase [acotar cada valor](/?c=langages&s=c&p=convertir-un-texte-en-nombre#acotar-cada-valor-a-su-dominio)) |

### Desglose de la escritura en el campo

La línea importante es `*(float *)((char *)r + g_tabla[i].desplazamiento) = (float)v;`. Se lee de dentro hacia fuera:

| Paso | Expresión | Tipo | Qué ocurre |
|---|---|---|---|
| 1 | `r` | `Ajustes *` | La dirección del inicio de la estructura |
| 2 | `(char *)r` | `char *` | Un **cast**: una conversión explícita de un tipo a otro, escrita `(tipo)valor`. La misma dirección, pero vista como la de un `char`, que ocupa 1 byte |
| 3 | `(char *)r + g_tabla[i].desplazamiento` | `char *` | Avanza `desplazamiento` bytes: la dirección del campo buscado |
| 4 | `(float *)(...)` | `float *` | Un segundo cast: la misma dirección, pero se declara que allí hay un `float` |
| 5 | `*(...)` | `float` | La desreferenciación: el propio campo, listo para recibir un valor |
| 6 | `= (float)v` | | El `double` leído se convierte en `float` y se escribe en los 4 bytes del campo |

El `(char *)` del paso 2 es indispensable. En un puntero, la suma cuenta en **elementos** y no en bytes: `r + 8` avanzaría 8 veces el tamaño de `Ajustes` (véase [la aritmética de punteros](/?c=langages&s=c&p=pointeurs#aritmetica-de-punteros)), muy lejos fuera de la estructura. Con un `char *`, cada unidad vale exactamente 1 byte, y el desplazamiento en bytes que da `offsetof` cae justo.

```text
r (Ajustes *)        r + 4 bytes
     |                    |
     v                    v
     +--------------------+--------------------+--------------------+
     | velocidad (4 bytes)| gravedad (4 bytes) | tamano (4 bytes)   |
     +--------------------+--------------------+--------------------+
     0                    4                    8                    12

(char *)r + 4  -->  dirección de gravedad  -->  (float *) y luego *  -->  escritura
```

En C++, este tipo de conversión de punteros se escribe `reinterpret_cast`, justamente para hacerla visible (véase [los cast en C++](/?c=langages&s=cpp&p=cast-cpp)): C solo tiene la sintaxis `(tipo)valor` para todo.

La tabla guarda el desplazamiento y no la dirección del campo, porque la tabla existe antes que cualquier estructura: se escribe una vez, y la misma línea sirve para cualquier ejemplar de `Ajustes`, sea que esté en la pila (la memoria de las variables locales) o en un array. Añadir un campo equivale a **añadir una sola línea** a la tabla: la función no cambia. El parentesco con la tabla de dispatch de PHP es directo (véase [la tabla de dispatch del enrutamiento](/?c=langages&s=php&p=routage#el-front-controller-y-la-tabla-de-dispatch)): se sustituye una serie de comparaciones por una consulta a un array. La variante de C para llamar a una función en lugar de escribir en un campo se apoya en [los punteros a funciones](/?c=langages&s=c&p=pointeurs#punteros-a-funciones) y en el [dispatch por etiqueta de tipo](/?c=langages&s=c&p=generiques-par-etiquette-de-type#despachar-sin-una-cadena-de-if-else-if).

## Límites y trampas de la escritura por desplazamiento

### Varios tipos de campo: una columna «tipo»

El cast `(float *)` supone que **todos** los campos afectados son `float`. En cuanto un campo es un `int`, la función debe saber cuál escribir: la tabla gana una columna `tipo`. Una **enumeración** (`enum`) es una lista de nombres a los que el compilador asigna enteros 0, 1, 2... ([`enum`](https://en.cppreference.com/w/c/language/enum)); aquí sirve de etiqueta.

```c
typedef enum {                          // los tipos de campo que la tabla sabe escribir
    TYPE_FLOAT,                         // el campo es un float
    TYPE_INT                            // el campo es un int
} Tipo;

typedef struct {
    const char *nombre;                 // nombre de la directiva en el archivo
    Tipo        tipo;                   // tipo del campo afectado
    size_t      desplazamiento;         // posición del campo en Ajustes, en bytes
    double      min;                    // valor aceptado más pequeño
    double      max;                    // valor aceptado más grande
} Directiva;

static const Directiva g_tabla[] = {
    {"velocidad", TYPE_FLOAT, offsetof(Ajustes, velocidad), 0.0, 10.0},
    {"gravedad", TYPE_FLOAT, offsetof(Ajustes, gravedad), 0.0, 20.0},
    {"tamano",  TYPE_INT,   offsetof(Ajustes, tamano),  1.0, 50.0},   // la línea añadida
};

// Escribe v en el campo descrito por d, con el tipo correcto.
static void escribir_campo(Ajustes *r, const Directiva *d, double v)
{
    char *byte = (char *)r + d->desplazamiento; // dirección del campo, contada en bytes

    switch (d->tipo) {                  // el tipo decide cómo escribir
    case TYPE_FLOAT:
        *(float *)byte = (float)v;      // 4 bytes, codificados como coma flotante
        break;
    case TYPE_INT:
        *(int *)byte = (int)v;          // 4 bytes, codificados como entero
        break;
    }
}
```

`aplicar_linea` casi no cambia: en lugar de escribir en el campo, llama a `escribir_campo(r, &g_tabla[i], v)`. El `switch` elige entre casos según un valor (véase [el `switch`](/?c=langages&s=c&p=conditions#el-switch)). El programa completo de la última sección reúne todas estas piezas.

### La alineación: por qué la fórmula acierta

La dirección `(char *)r + desplazamiento` está correctamente alineada para el tipo del campo **porque** `desplazamiento` viene de `offsetof`, que tiene en cuenta el relleno. Un desplazamiento calculado a mano (4 + 4 para llegar a `tamano`) fallaría en cuanto un campo va precedido de un tipo más pequeño o más grande: en la estructura de prueba de la sección anterior, la suma daba 1 para `velocidad`, el real es 4. Un acceso desalineado está prohibido en algunos procesadores y es más lento en otros.

### Escribir un tipo de tamaño incorrecto

El compilador no comprueba que el cast corresponda al campo. Escribir un `double` (8 bytes) en la dirección de un `float` (4 bytes) desborda sobre el campo vecino:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float velocidad;                    // bytes 0 a 3
    float gravedad;                     // bytes 4 a 7
    int   tamano;                       // bytes 8 a 11
} Ajustes;

int main(void)
{
    Ajustes r = {5.0f, 9.8f, 12};       // tres valores de partida

    // ERROR intencionado: un double (8 bytes) escrito en un campo de 4 bytes
    *(double *)((char *)&r + offsetof(Ajustes, velocidad)) = 1.0;
    printf("velocidad=%g gravedad=%g tamano=%d\n", r.velocidad, r.gravedad, r.tamano);
    return 0;
}
```

```text
velocidad=0 gravedad=1.875 tamano=12
```

Los 8 bytes del `double` `1.0` han recubierto `velocidad` **y** `gravedad`. Los valores mostrados (0 y luego 1,875) son los de un procesador x86 de prueba, que guarda los bytes de un número empezando por el menos significativo (véase [el orden de los bytes](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#el-orden-de-los-bytes-endianness)); en otra máquina cambiarían. El lenguaje no promete nada aquí: es un **comportamiento indefinido**, un caso en el que la norma del lenguaje C no garantiza ningún resultado (ni fallo ni valor concreto).

### Perder la verificación de tipos

Una escritura normal, `s.tamano = 2.5f`, pasa por el compilador, que conoce el tipo del campo: convierte el valor y, con la opción `-Wconversion`, avisa de la pérdida. Con el desplazamiento, ya no sabe nada:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float velocidad;                    // campo de tipo float
    int   tamano;                       // campo de tipo int
} R;

int main(void)
{
    R r = {0, 0};                       // dos campos a cero
    R s = {0, 0};                       // una segunda estructura, para comparar

    s.tamano = 2.5f;                    // escritura normal: el compilador convierte
    *(float *)((char *)&r + offsetof(R, tamano)) = 2.5f;   // escritura por desplazamiento
    printf("normal : tamano=%d\n", s.tamano);
    printf("por desplazamiento : tamano=%d\n", r.tamano);
    return 0;
}
```

```text
normal : tamano=2
por desplazamiento : tamano=1075838976
```

La segunda escritura compila sin el menor aviso: los 4 bytes del `float` 2,5 se han puesto tal cual en un campo leído después como entero, de ahí 1.075.838.976. Ese es el precio de la tabla dirigida: la seguridad que da un `if` por campo (cada rama está comprobada) se sustituye por la disciplina de una columna `tipo` correcta.

| Enfoque | Comprobación del compilador | Añadir un campo |
|---|---|---|
| Cadena de `if` o `switch` por nombre | Completa: cada asignación está tipada | Una rama entera |
| Tabla `{nombre, desplazamiento, min, max}` | Ninguna sobre el tipo escrito | Una línea |

### Los campos de bits y las otras estructuras

Un **campo de bits** (*bit-field*) es un campo cuyo ancho se fija en bits (`unsigned nivel : 3;`) para agrupar varios valores pequeños en un mismo byte (véase [los operadores binarios](/?c=langages&s=c&p=operateurs-binaires) para las manipulaciones de bits, y [los campos de bits](https://en.cppreference.com/w/c/language/bit_field)). No tiene dirección de byte propia, así que `offsetof` no se le aplica. El compilador lo indica:

```text
error: attempt to take address of bit-field structure member ‘nivel’
```

Por último, la tabla está ligada al tipo de estructura para el que se calcularon sus desplazamientos. Aplicada a otro tipo, compila igualmente y escribe en posiciones que no tienen relación con lo previsto.

## El literal compuesto de C99: un valor fabricado sobre la marcha

Un **literal** es un valor escrito tal cual en el código: `42`, `3.5`, `'a'`, `"abc"`. Los números y los caracteres bastan para los tipos simples, pero ninguna escritura produce una estructura de golpe. Para pasar el punto (4, 6) a una función (como **argumento**: el valor que se da a la función al llamarla, véase [el paso a una función](/?c=langages&s=c&p=pointeurs#pasar-un-puntero-a-una-funcion-paso-por-direccion)), había que declarar una variable, rellenarla y luego pasarla. El **literal compuesto** fabrica ese valor en el lugar donde se necesita: `(Tipo){valores}` ([literal compuesto](https://en.cppreference.com/w/c/language/compound_literal)). La parte `(Tipo)` se parece a un cast, pero las llaves que siguen la convierten en un valor construido.

| Manera de fabricar el punto (4, 6) | Escritura | Variable con nombre |
|---|---|---|
| Declaración con inicialización | `Point p = {4, 6};` | Sí, `p` |
| Asignación campo por campo | `p.x = 4; p.y = 6;` | Sí, `p` |
| Literal compuesto | `(Point){4, 6}` | No |

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscisa
    int y;                              // ordenada
} Point;

static double distance2(Point a, Point b)
{
    int dx = b.x - a.x;                 // diferencia horizontal
    int dy = b.y - a.y;                 // diferencia vertical
    return (double)(dx * dx + dy * dy); // cuadrado de la distancia
}

static int suma(const int *t, int n)
{
    int total = 0;                      // acumulado
    for (int i = 0; i < n; i++)         // recorre n enteros
        total += t[i];
    return total;
}

static void mover(Point *p)
{
    p->x += 10;                         // modifica el punto recibido por dirección
}

int main(void)
{
    Point p = {1, 2};                   // la forma clásica: una variable con nombre

    printf("%.0f\n", distance2(p, (Point){4, 6}));              // un punto sin nombre
    printf("%.0f\n", distance2((Point){0, 0}, (Point){.y = 3, .x = 4}));
    printf("%d\n", suma((int[]){1, 2, 3, 4}, 4));              // un array sin nombre
    printf("%d\n", suma((int[5]){1, 2}, 5));                   // 5 casillas, 3 a cero
    mover(&(Point){7, 7});              // dirección de un literal: se puede escribir
    char *palabra = (char[]){"abc"};    // array de char modificable (copia de "abc")
    palabra[0] = 'X';                   // permitido: no es un literal de cadena
    printf("%s\n", palabra);
    return 0;
}
```

```text
25
25
10
3
Xbc
```

| Forma | Ejemplo | Lo que se obtiene |
|---|---|---|
| Estructura, valores en el orden de los campos | `(Point){4, 6}` | `x` vale 4, `y` vale 6 |
| Estructura, **inicializadores designados** | `(Point){.y = 3, .x = 4}` | `.campo = valor` nombra el campo buscado: el orden es libre y un campo no citado vale cero ([inicialización](https://en.cppreference.com/w/c/language/struct_initialization)) |
| Array, tamaño deducido | `(int[]){1, 2, 3, 4}` | 4 casillas |
| Array, tamaño fijado | `(int[5]){1, 2}` | 5 casillas, las tres últimas a cero |
| Array designado | `(int[]){[2] = 7}` | 3 casillas: `{0, 0, 7}` |
| Texto modificable | `(char[]){"abc"}` | 4 casillas (`a`, `b`, `c` y el `\0` final), copiadas y modificables |

Los valores `25` y `25` son los cuadrados de las distancias de (1, 2) a (4, 6) y de (0, 0) a (4, 3): en ambos casos 3 y 4 (o 4 y 3) de diferencia, es decir, 9 + 16.

### Tiempo de vida: hasta el final del bloque

El **tiempo de vida** de un valor es el período durante el cual existe en memoria. Un **bloque** es el texto comprendido entre una llave de apertura `{` y su llave de cierre `}` (cuerpo de una función, de un bucle...). Un literal compuesto escrito en un bloque se comporta como una variable local de ese bloque:

| Dónde está escrito el literal | Su vida |
|---|---|
| En una función o en un bloque | Hasta la llave de cierre del bloque que lo engloba |
| En el cuerpo de un bucle | Se recrea en cada vuelta |
| Fuera de toda función | Todo el programa (los valores deben ser entonces constantes) |

```c
typedef struct { int x; int y; } Point;

static Point *const g_origen = &(Point){0, 0};     // fuera de función: vive todo el programa
static const int   *g_primeros = (const int[]){2, 3, 5, 7};   // idem

void ejemplo(void)
{
    int *p;                             // un puntero, declarado en el bloque de la función
    {                                   // un bloque interior
        p = (int[]){1, 2, 3};           // el array vive hasta la siguiente }
    }                                   // aquí el array ya no existe
}                                       // y p apuntaría a una zona muerta
```

La consecuencia: **nunca guardar ni devolver la dirección de un literal compuesto local**. Devolverlo por valor, en cambio, no tiene peligro, puesto que es una copia.

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscisa
    int y;                              // ordenada
} Point;

static Point *g_ptr;                    // puntero global, para guardar una dirección

static void guardar(void)
{
    g_ptr = &(Point){3, 4};             // se guarda la dirección de un literal local
}

int main(void)
{
    guardar();                          // la función termina: su literal ya no existe
    printf("%d\n", g_ptr->x);           // lectura de una zona muerta
    return 0;
}
```

Compilado con `-Wall -Wextra -Werror` solamente, este programa lo rechaza GCC: `error: storing the address of local variable ‘({anonymous})’ in ‘g_ptr’ [-Werror=dangling-pointer=]`. Compilado además con `-fsanitize=address,undefined`, pasa la compilación, y la ejecución se detiene con `ERROR: AddressSanitizer: stack-use-after-return`. Estos mensajes son los de la máquina de prueba; otro compilador podría callar durante la compilación, pero el error existe igualmente.

### Modificable, a diferencia de un literal de cadena

El texto `"abc"` escrito en el código suele almacenarse en una zona de memoria de solo lectura: escribir en ella es un comportamiento indefinido, casi siempre un fallo. Un literal compuesto `(char[]){"abc"}`, en cambio, es una **copia** en un array ordinario: se puede modificar (el programa anterior lo hizo: `Xbc`). Para impedirlo, se añade `const`: `(const Point){4, 6}`.

### Un poco de C++

El literal compuesto es una característica de C, no del C++ estándar: un compilador de C++ lo rechaza o, como GCC, lo acepta como extensión avisando con `-pedantic` `ISO C++ forbids compound-literals`. En C++, se escribe `Point{4, 6}` o se usa un constructor (véase [las clases y los objetos](/?c=langages&s=cpp&p=classes-et-objets)). Un archivo destinado a ambos lenguajes evita, por tanto, el literal compuesto.

## Un ejemplo que combina las dos

Las dos nociones se complementan: la tabla rellena la estructura, y un literal compuesto proporciona sus valores por defecto. Estos se guardan en una función que devuelve la estructura por valor; los campos que un archivo de ajustes no menciona conservan así un valor razonable en lugar de cero. El programa reúne la tabla de la sección anterior (con el tipo) y el literal compuesto:

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidad;                    // velocidad de movimiento
    float gravedad;                     // intensidad de la gravedad
    int   tamano;                       // tamaño en casillas
} Ajustes;

typedef enum { TYPE_FLOAT, TYPE_INT } Tipo;   // tipos de campo que la tabla sabe escribir

typedef struct {
    const char *nombre;                 // nombre de la directiva en el archivo
    Tipo        tipo;                   // tipo del campo afectado
    size_t      desplazamiento;         // posición del campo en Ajustes, en bytes
    double      min;                    // valor aceptado más pequeño
    double      max;                    // valor aceptado más grande
} Directiva;

static const Directiva g_tabla[] = {
    {"velocidad", TYPE_FLOAT, offsetof(Ajustes, velocidad), 0.0, 10.0},
    {"gravedad", TYPE_FLOAT, offsetof(Ajustes, gravedad), 0.0, 20.0},
    {"tamano",  TYPE_INT,   offsetof(Ajustes, tamano),  1.0, 50.0},
};
#define NUM_DIRECTIVAS (sizeof g_tabla / sizeof g_tabla[0])     // número de líneas

// Los valores de partida, fabricados sobre la marcha y devueltos por valor (una copia).
static Ajustes ajustes_por_defecto(void)
{
    return (Ajustes){.velocidad = 1.0f, .gravedad = 9.8f, .tamano = 4};
}

static void escribir_campo(Ajustes *r, const Directiva *d, double v)
{
    char *byte = (char *)r + d->desplazamiento; // dirección del campo, contada en bytes

    if (d->tipo == TYPE_FLOAT)          // campo de tipo float
        *(float *)byte = (float)v;
    else                                // campo de tipo int
        *(int *)byte = (int)v;
}

static int aplicar_linea(Ajustes *r, const char *linea)
{
    char   nombre[32];                  // el nombre leído
    double v;                           // el valor leído

    if (sscanf(linea, "%31s %lf", nombre, &v) != 2 || !isfinite(v))   // forma y valor
        return -1;
    for (size_t i = 0; i < NUM_DIRECTIVAS; i++) {       // busca la línea en la tabla
        if (strcmp(nombre, g_tabla[i].nombre) != 0)     // no es esta
            continue;
        if (v < g_tabla[i].min) v = g_tabla[i].min;     // límite inferior
        if (v > g_tabla[i].max) v = g_tabla[i].max;     // límite superior
        escribir_campo(r, &g_tabla[i], v);              // escritura tipada
        return 0;
    }
    return -1;                          // ninguna línea lleva este nombre
}

static void mostrar(const char *titulo, const Ajustes *r)
{
    printf("%-8s velocidad=%g gravedad=%g tamano=%d\n",
           titulo, r->velocidad, r->gravedad, r->tamano);
}

int main(void)
{
    const char *lineas[] = {"velocidad 2.5", "tamano 120", "gravedad -3", "color 3"};
    Ajustes     r = ajustes_por_defecto();      // partimos de los valores por defecto

    mostrar("init", &r);
    for (size_t i = 0; i < 4; i++)      // una pasada por línea del archivo
        if (aplicar_linea(&r, lineas[i]) == -1)
            printf("línea rechazada : %s\n", lineas[i]);
    mostrar("leido", &r);
    mostrar("parcial", &(Ajustes){.tamano = 8});     // solo se da tamano
    return 0;
}
```

```text
init     velocidad=1 gravedad=9.8 tamano=4
línea rechazada : color 3
leido    velocidad=2.5 gravedad=0 tamano=50
parcial  velocidad=0 gravedad=0 tamano=8
```

| Elemento | Función |
|---|---|
| `(Ajustes){.velocidad = 1.0f, .gravedad = 9.8f, .tamano = 4}` | Fabrica la estructura de valores por defecto, con campos nombrados: el orden de la declaración no importa |
| `return (Ajustes){...};` | Devuelve una copia de la estructura: seguro, a diferencia de la dirección de un literal local |
| `mostrar("parcial", &(Ajustes){.tamano = 8})` | Pasa la dirección de una estructura sin nombre; los campos no citados valen cero, de ahí `velocidad=0 gravedad=0` |
| `const Ajustes *r` | Indica que `mostrar` no modificará la estructura recibida |
| `%-8s` | Escribe un texto alineado a la izquierda en 8 caracteres, para que las columnas se alineen |

| Línea del archivo | Lo que hace la tabla | Resultado |
|---|---|---|
| `velocidad 2.5` | Valor en `[0, 10]` | `velocidad` pasa de 1 a 2,5 |
| `tamano 120` | Supera el límite 50 | `tamano` vale 50, escrito como `int` |
| `gravedad -3` | Por debajo del límite 0 | `gravedad` vale 0 |
| `color 3` | Ninguna línea con ese nombre | Rechazada, la estructura no cambia |

Añadir un ajuste (un `color`, un `volumen`) exige un campo en `Ajustes`, un valor en `ajustes_por_defecto` y una línea en `g_tabla`: ninguna función que modificar.

## Las trampas

| Trampa | Por qué | Solución |
|---|---|---|
| Escribir `r + desplazamiento` sin `(char *)` | La suma cuenta en estructuras enteras y no en bytes | Siempre `(char *)r + desplazamiento` |
| Un cast que no corresponde al tipo del campo | Tamaño o codificación incorrectos, sin error ni aviso | Columna `tipo` y un cast por tipo |
| Escribir un `double` en un campo `float` | Desborda sobre el campo vecino (comportamiento indefinido) | Convertir el valor con `(float)v` antes de escribirlo |
| Calcular el desplazamiento sumando tamaños | El relleno desplaza los campos | Solo `offsetof` |
| `offsetof` sobre un campo de bits | No tiene dirección de byte: error de compilación | Campo ordinario, o función de acceso dedicada |
| Una tabla aplicada a otra estructura | Los desplazamientos ya no coinciden, sin error | Una tabla por tipo de estructura, nombrada en consecuencia |
| Dejar pasar `NaN` | Atraviesa todas las comprobaciones de límites | Comprobar `isfinite` antes de acotar |
| Guardar la dirección de un literal compuesto local | Desaparece al final del bloque | Devolver la estructura por valor o copiarla en una variable de vida larga |
| Modificar un literal de cadena `"abc"` | Zona de solo lectura: comportamiento indefinido | Copiar en un array: `char t[] = "abc";` o `(char[]){"abc"}` |
| Valores de un literal compuesto en el orden de los campos | Un campo movido o añadido cambia el sentido sin error | Inicializadores designados `.campo = valor` |
| Usar el literal compuesto en código compartido con C++ | No estándar en C++ | Reservar ese código para C, o escribir `Point{4, 6}` en C++ |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Separar los datos (la tabla) del código (la función única) | Añadir un ajuste solo toca una línea |
| Contar las líneas con `sizeof g_tabla / sizeof g_tabla[0]` | El número se actualiza solo con cada adición |
| Declarar la tabla `static const` | No puede modificarse ni por error ni desde otro archivo |
| Calcular cada desplazamiento con `offsetof`, nunca a mano | El compilador conoce el relleno |
| Mantener una columna `tipo` en cuanto los campos difieren | Cada escritura tiene el cast que le corresponde |
| Acotar y comprobar `sscanf` antes de escribir | Un valor absurdo o una línea mal formada no se inserta |
| Compilar con `-Wall -Wextra` y lanzar una prueba con `-fsanitize=address,undefined` | Las escrituras fuera del campo y las direcciones muertas se detectan en la primera prueba |
| Dar los valores por defecto mediante un literal compuesto con campos nombrados | Los campos olvidados valen cero, y el orden de los campos sigue libre |
| Devolver un literal compuesto por valor, nunca por dirección | Una copia sobrevive a la función |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | `offsetof(tipo, campo)` (de `<stddef.h>`) da el desplazamiento en bytes de un campo dentro de su estructura, incluido el relleno; se guarda en una tabla `{nombre, desplazamiento, min, max}` y una sola función escribe en el campo mediante `*(float *)((char *)r + desplazamiento) = valor`. El `(char *)` hace contar en bytes; el segundo cast indica qué tipo hay allí. Un campo más = una línea más. El literal compuesto `(Tipo){valores}` (C99) fabrica una estructura o un array sobre la marcha, modificable, válido hasta el final del bloque; los inicializadores designados `.campo = valor` nombran los campos. Documentación: [`offsetof`](https://en.cppreference.com/w/c/types/offsetof), [literal compuesto](https://en.cppreference.com/w/c/language/compound_literal). |
| **Trampas a evitar** | Olvidar `(char *)`; un cast que no corresponde al tipo del campo (ninguna comprobación del compilador); escribir un `double` en un `float`; calcular un desplazamiento a mano; `offsetof` sobre un campo de bits; una tabla aplicada a la estructura equivocada; dejar pasar `NaN`; guardar la dirección de un literal compuesto local; modificar un literal de cadena; contar con el literal compuesto en C++. |
| **Buenas prácticas** | Tabla `static const` separada del código; `offsetof` para cada desplazamiento; columna `tipo` en cuanto los campos difieren; límites aplicados en un único lugar; valores por defecto en literal compuesto con inicializadores designados; literal compuesto devuelto por valor, nunca por dirección. |
