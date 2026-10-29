---
order: 12
---

# `constexpr` y las constantes en C++ (28/10/2026)

Un programa maneja valores que nunca cambian: el tamaño de una casilla en un juego (64 píxeles; un **píxel** es un punto de la pantalla), el número máximo de vidas, el valor de pi. Una **constante** es un valor de este tipo, asociado a un nombre y que ya no cambia, a diferencia de una [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), cuyo valor puede cambiar. C++ ofrece tres herramientas para crear una: `#define`, `const` y [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr). Se usan casi igual y se distinguen por **el momento en que se conoce el valor**, por su **tipo** y por su **ámbito** (la zona del código en la que existe el nombre). Este capítulo las compara sobre un hilo conductor: el tamaño de una casilla, `TILE_SIZE = 64`, guardado en una clase de juego (la palabra inglesa *tile* designa una casilla de tablero).

| Tema | Pregunta a la que responde | Sección |
|---|---|---|
| El problema | ¿Por qué dar nombre a un valor en lugar de escribirlo en todas partes? | [Una constante](#una-constante-dar-un-nombre-a-un-valor) |
| Dos momentos | ¿Qué son la compilación, la ejecución y una expresión constante? | [Compilación y ejecución](#compilacion-y-ejecucion-dos-momentos) |
| Las tres herramientas | ¿Qué hace cada una y qué riesgo tiene? | [`#define`](#define-un-reemplazo-de-texto), [`const`](#const-un-valor-fijado-en-la-inicializacion), [`constexpr`](#constexpr-un-valor-conocido-en-la-compilacion) |
| Comparación | ¿Cuál elegir según la necesidad? | [La tabla comparativa](#comparar-define-const-y-constexpr) |
| En una clase | ¿Dónde guardar `TILE_SIZE` y cómo leerlo desde fuera? | [El ámbito](#el-ambito-de-una-constante), [el miembro `static constexpr`](#el-miembro-static-constexpr-de-una-clase) |
| Según el estándar | ¿Qué cambia en C++17? ¿Qué puede calcular `constexpr`? | [Antes y desde C++17](#antes-y-desde-c-17-la-definicion-fuera-de-la-clase), [funciones y `static_assert`](#lo-que-constexpr-sabe-calcular-funciones-y-static-assert) |

El capítulo supone conocidas [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) y sus tipos, [las clases y los objetos](/?c=langages&s=cpp&p=classes-et-objets) (incluidos `public` y `private`) y [los espacios de nombres](/?c=langages&s=cpp&p=espaces-de-noms). Para el preprocesador y la opción `-D`, se apoya en [el proceso de compilación](/?c=langages&s=c&p=compilation), escrito para C pero válido tal cual en C++. Los valores que dependen de la versión del lenguaje se citan por **estándar** (o **norma**: una versión oficial del lenguaje, C++11, C++14, C++17, C++20). Todos los ejemplos se han compilado con `g++`, el compilador de C++ de GCC (*GNU Compiler Collection*, una suite de compiladores libres), desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal):

```bash
# -std=c++17 elige el estándar; -Wall -Wextra -pedantic muestran las advertencias
# -o programa indica el nombre del archivo producido; ./programa ejecuta ese archivo
g++ -std=c++17 -Wall -Wextra -pedantic archivo.cpp -o programa
./programa
```

## Una constante: dar un nombre a un valor

Un **literal** es un valor escrito directamente en el código: `64`, `3.14`, `'a'`, `"texto"`, `true`. En el programa siguiente, `int` es el **tipo** «número entero» (véase [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)) y `#include <iostream>` inserta la cabecera que proporciona `std::cout` (véanse [los archivos de cabecera](/?c=langages&s=c&p=headers) y [los espacios de nombres](/?c=langages&s=cpp&p=espaces-de-noms) para el prefijo `std::`). El operador `<<` envía un valor hacia `std::cout`, y `"\n"` es un salto de línea.

```cpp
#include <iostream>   // std::cout: muestra texto en la terminal

int main()   // punto de entrada: el programa empieza aquí
{
    int anchura = 10 * 64;         // 10 casillas de ancho: ¿64 es el tamaño de una casilla?
    int altura = 8 * 64;           // 8 casillas de alto: el mismo 64, reescrito
    int inicioCasilla3 = 3 * 64;   // píxel donde empieza la casilla 3: otra vez 64
    std::cout << anchura << " x " << altura << ", casilla 3 en x = "
              << inicioCasilla3 << "\n";
    return 0;   // 0: el programa ha terminado correctamente
}
```

```text
640 x 512, casilla 3 en x = 192
```

El literal `64` aparece tres veces sin nombre: es un **número mágico**, cuyo sentido el lector tiene que adivinar. Si las casillas pasan a medir 48 píxeles, hay que encontrar cada `64` sin confundir los que designan otra cosa. Dar un nombre al valor resuelve los dos problemas: el sentido queda escrito y el cambio se hace en un único lugar. Estas son las tres escrituras posibles, una al lado de otra:

```cpp
#include <iostream>   // std::cout: muestra texto en la terminal

#define TAMANO_MACRO 64      // macro: el preprocesador sustituye este nombre por 64
const int TAMANO_CONST = 64;           // const: variable de tipo int de solo lectura
constexpr int TAMANO_CONSTEXPR = 64;   // constexpr: constante int conocida en la compilación

int main()
{
    // los tres nombres se usan igual y muestran el mismo valor
    std::cout << TAMANO_MACRO << " " << TAMANO_CONST << " " << TAMANO_CONSTEXPR << "\n";
    return 0;
}
```

```text
64 64 64
```

| Escritura | Qué es |
|---|---|
| `#define TAMANO_MACRO 64` | Una **macro**: un texto que el preprocesador reemplazará antes de la compilación |
| `const int TAMANO_CONST = 64;` | Una **variable** a la que se prohíbe modificar |
| `constexpr int TAMANO_CONSTEXPR = 64;` | Una **constante** cuyo valor conoce el compilador |

## Compilación y ejecución: dos momentos

Un programa C++ vive en dos momentos distintos, detallados en [el proceso de compilación](/?c=langages&s=c&p=compilation):

```text
 archivo .cpp --[ compilación: g++ ]--> programa --[ ejecución: ./programa ]--> resultado
 (el texto)      el compilador lee     (un archivo)  el programa se ejecuta;
                 el código; no ve                    lee el teclado, archivos,
                 ninguna entrada                     la red...
```

| Momento | Definición | Qué se conoce en él |
|---|---|---|
| **Compilación** | El **compilador** traduce el texto del código a un programa que el ordenador sabe ejecutar | Lo escrito en el código: literales, constantes, cálculos sobre esos valores |
| **Ejecución** | El programa se ejecuta | Además: lo que escribe el usuario, el contenido de un archivo, la hora |

Una **expresión** es un cálculo escrito en el código (`8 * 8`, `x + 1`). Una **expresión constante** es una expresión que el compilador puede calcular por sí solo, sin ejecutar el programa, porque solo depende de valores conocidos en la compilación. La tabla siguiente cita `leerTamano()`, una **función** (un bloque de código con nombre que se llama para obtener un resultado) que lee un número del teclado; sirve en varios ejemplos del capítulo.

| Expresión | ¿Constante? | Por qué |
|---|---|---|
| `64` | sí | un literal |
| `8 * 8` | sí | un cálculo sobre literales |
| `TILE_SIZE * 10` (con `TILE_SIZE` definido como 64) | sí | un cálculo sobre una constante conocida |
| `leerTamano()` (función que lee el teclado) | no | el resultado depende de lo que escriba el usuario |

Algunos lugares del lenguaje **exigen** una expresión constante: el tamaño de un **arreglo** (una fila de casillas contiguas del mismo tipo, por ejemplo 80 enteros: `casillas[0]` designa la primera, `casillas[1]` la siguiente), el valor escrito entre ángulos en una [plantilla](/?c=langages&s=cpp&p=templates), como el 80 de `std::array<int, 80>`, y la condición de un [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert) (una comprobación hecha en la compilación, vista más abajo). Las tres herramientas del capítulo se juzgan primero por esta exigencia.

## `#define`: un reemplazo de texto

El **preprocesador** es la primera etapa de la compilación: un programa que lee el código antes que el compilador y procesa toda línea que empieza por `#` (véase [el preprocesador](/?c=langages&s=c&p=compilation#1-le-preprocesseur)). La línea `#define NOMBRE texto` crea una **macro**: en todas las partes donde aparece después `NOMBRE`, el preprocesador lo sustituye por `texto`, como la función «buscar y reemplazar» de un editor de texto.

```cpp
#include <iostream>   // std::cout: muestra texto en la terminal

#define TILE_SIZE 64                        // el preprocesador reemplazará TILE_SIZE por 64
#define ANCHURA_VENTANA (TILE_SIZE * 10)    // el nombre de una macro puede contener otro

int main()
{
    std::cout << ANCHURA_VENTANA << "\n";   // el preprocesador lo convierte en (64 * 10)
    return 0;
}
```

```text
640
```

Se puede pedir al preprocesador que se detenga tras su trabajo y muestre el resultado. El archivo anterior se llama aquí `macro.cpp`:

```bash
# -E: se detiene después del preprocesador; -P: no añade líneas de referencia
# |: envía el resultado de g++ al comando siguiente
# tail -n 5: conserva las 5 últimas líneas
g++ -std=c++17 -E -P macro.cpp | tail -n 5
```

```text
int main()
{
    std::cout << (64 * 10) << "\n";
    return 0;
}
```

`ANCHURA_VENTANA` y `TILE_SIZE` han desaparecido: el compilador solo ve `(64 * 10)`. De ello se derivan tres consecuencias.

### Ningún tipo

El compilador solo ve el texto sustituido: el tipo de una macro es simplemente el de ese texto (`64` es un entero, `0.5` un número con decimales), nunca uno elegido. Con `constexpr`, el tipo se escribe:

```cpp
#include <iostream>   // std::cout

#define RATIO_MACRO 0.5                  // ningún tipo escrito: 0.5 es un double
constexpr float RATIO_CONSTEXPR = 0.5;   // el tipo se escribe: float

int main()
{
    // sizeof da el tamaño en bytes (un byte: la unidad de medida de la memoria)
    std::cout << sizeof(RATIO_MACRO) << " " << sizeof(RATIO_CONSTEXPR) << "\n";
    return 0;
}
```

```text
8 4
```

`sizeof` da el tamaño de un valor en bytes. `float` y `double` son dos tipos de números con decimales; el `double`, más preciso, ocupa 8 bytes. El literal `0.5` es un `double`, mientras que la constante declarada `float` solo ocupa 4.

### Ningún ámbito

Una macro existe desde la línea `#define` hasta el final del archivo, sea cual sea el lugar donde se escribió: en una función, en una clase, en un espacio de nombres. Archivo `macro_alcance.cpp`:

```cpp
#include <iostream>   // std::cout

void dibujar()
{
#define MARGEN 8   // definida aquí, en medio de una función...
    std::cout << "dibujar: " << MARGEN << "\n";
}

void mover()
{
    std::cout << "mover: " << MARGEN << "\n";   // ...pero visible aquí: no tiene ámbito
}

int main()
{
    dibujar();   // llama a la primera función
    mover();     // llama a la segunda
    return 0;
}
```

```text
dibujar: 8
mover: 8
```

### Colisiones según el orden de inclusión

Dos archivos de cabecera de [bibliotecas](/?c=langages&s=c&p=bibliotheques) distintas pueden definir una macro con el mismo nombre. El archivo `lib_a.h`, con su **guarda de inclusión** (el `#ifndef`, «si no está definido», cerrado por `#endif`, que impide insertar un archivo dos veces; véase [los archivos de cabecera](/?c=langages&s=c&p=headers)):

```cpp
#ifndef LIB_A_H      // guarda de inclusión: el archivo se inserta una sola vez
#define LIB_A_H
#define ANCHURA 10   // la biblioteca A cuenta 10 casillas de ancho
#endif
```

El archivo `lib_b.h`:

```cpp
#ifndef LIB_B_H
#define LIB_B_H
#define ANCHURA 20   // la biblioteca B cuenta 20 casillas de ancho: mismo nombre, otro valor
#endif
```

Dos programas solo se diferencian en el orden de los `#include`. El primero, `main_ab.cpp`:

```cpp
#include <iostream>   // std::cout
#include "lib_a.h"    // "...": un archivo del proyecto, buscado junto a este archivo
#include "lib_b.h"    // incluido en segundo lugar: su ANCHURA va al final

int main()
{
    std::cout << "ANCHURA = " << ANCHURA << "\n";   // gana la última definición
    return 0;
}
```

```text
lib_b.h:3: warning: "ANCHURA" redefined
lib_a.h:3: note: this is the location of the previous definition
ANCHURA = 20
```

El segundo, `main_ba.cpp`, es idéntico, pero sus dos líneas `#include "lib_..."` están invertidas: `lib_b.h` primero, `lib_a.h` después.

```text
lib_a.h:3: warning: "ANCHURA" redefined
lib_b.h:3: note: this is the location of the previous definition
ANCHURA = 10
```

Gana la última definición, y solo una advertencia lo señala: el programa se compila y se ejecuta. Cambiar el orden de dos `#include`, algo que a veces hace una herramienta de formato, cambia entonces el valor utilizado. Las constantes colocadas en un [espacio de nombres](/?c=langages&s=cpp&p=espaces-de-noms) evitan el problema: `LibA::ANCHURA` y `LibB::ANCHURA` son dos nombres distintos.

```cpp
#ifndef NS_A_H
#define NS_A_H
namespace LibA {
    constexpr int ANCHURA = 10;   // LibA::ANCHURA: 10 casillas de ancho
}
#endif
```

```cpp
#ifndef NS_B_H
#define NS_B_H
namespace LibB {
    constexpr int ANCHURA = 20;   // LibB::ANCHURA: 20 casillas de ancho
}
#endif
```

```cpp
#include <iostream>   // std::cout
#include "ns_a.h"     // el orden de inclusión ya no importa
#include "ns_b.h"

int main()
{
    // cada nombre lleva el prefijo de su espacio de nombres: ninguna colisión
    std::cout << LibA::ANCHURA << " " << LibB::ANCHURA << "\n";
    return 0;
}
```

```text
10 20
```

### Lo que `#define` hace mejor

Una macro es **visible en todas partes** (sin ámbito) y puede **ajustarse desde la línea de comandos** con la opción `-D` del compilador: `-DNOMBRE=valor` actúa como una línea `#define NOMBRE valor` colocada al principio del archivo (véase [el caso de las constantes ajustables con `-D`](/?c=langages&s=c&p=compilation#verificar-en-la-compilacion-static-assert)). Un proyecto lo usa para ajustar un límite sin tocar el código; el `#ifndef` («si no está definido») proporciona el valor por defecto. El archivo siguiente se llama aquí `tamano_casilla.cpp`:

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE     // si la línea de comandos no ha definido TILE_SIZE (opción -D)...
#define TILE_SIZE 64  // ...se toma este valor por defecto
#endif

int main()
{
    std::cout << "Casilla: " << TILE_SIZE << " píxeles\n";   // muestra el valor utilizado
    return 0;
}
```

```bash
# && ejecuta el comando siguiente solo si el anterior ha tenido éxito
# sin -D se aplica el valor por defecto de #define
g++ -std=c++17 tamano_casilla.cpp -o tamano_casilla && ./tamano_casilla
# -DTILE_SIZE=32: el compilador define la macro antes de leer el archivo
g++ -std=c++17 -DTILE_SIZE=32 tamano_casilla.cpp -o tamano_casilla && ./tamano_casilla
```

```text
Casilla: 64 píxeles
Casilla: 32 píxeles
```

| Ventaja de `#define` | Por qué no la tienen `const` ni `constexpr` |
|---|---|
| Visible en todo el archivo, sin prefijo | Su nombre sigue las reglas de ámbito del lenguaje |
| Ajustable con `-D` sin modificar el código | Su valor está escrito en el código |
| Utilizable en `#if` (condición evaluada por el preprocesador) | El preprocesador no conoce las constantes del lenguaje (véanse las trampas) |

## `const`: un valor fijado en la inicialización

`const` (de *constant*, «constante») delante de una variable prohíbe modificarla después de su **inicialización**, es decir, el primer valor que recibe al crearse (dar un valor con `=` se llama una **asignación**). Nada obliga a que ese valor sea conocido en la compilación: puede venir del teclado o de un archivo, y por tanto existir solo en la ejecución.

```cpp
#include <iostream>   // std::cin lee el teclado, std::cout escribe en pantalla

int leerTamano()   // función que devuelve un entero (int) leído del teclado
{
    int valor = 0;       // casilla que recibirá el número escrito
    std::cin >> valor;   // espera a que el usuario escriba un número y pulse Intro
    return valor;        // devuelve ese número a quien llamó a la función
}

int main()
{
    const int tamanoCasilla = leerTamano();   // const: fijada aquí, durante la ejecución
    std::cout << "Tamaño de una casilla: " << tamanoCasilla << "\n";
    return 0;
}
```

```text
Tamaño de una casilla: 48
```

(El programa espera un número: se escribe `48` y después Intro. Leer un archivo en lugar del teclado daría el mismo resultado: el valor solo se conoce en la ejecución.) La variable `tamanoCasilla` es constante, porque ninguna línea puede modificarla después, pero el compilador ignora su valor.

### Caso particular: un `const` entero inicializado con un literal

Cuando una `const` de tipo entero se inicializa con una expresión constante, el compilador conoce su valor y la acepta como constante:

```cpp
#include <array>      // std::array
#include <iostream>   // std::cout

const int ANCHURA = 4;   // const con un literal: el compilador conoce el valor

int main()
{
    int casillas[ANCHURA] = {};         // aceptado: ANCHURA vale 4 desde la compilación
    std::array<int, ANCHURA> otros{};   // aceptado también
    casillas[ANCHURA - 1] = 9;          // la última casilla recibe 9
    std::cout << otros.size() << " " << casillas[3] << "\n";
    return 0;
}
```

```text
4 9
```

Esta regla histórica es limitada: solo vale para los tipos enteros. Con un `double`, el compilador rechaza el código:

```cpp
const double RATIO = 2.0;   // const no entera, inicializada con un literal

// > : «mayor que»; la condición debe ser una expresión constante
static_assert(RATIO > 1.0, "RATIO debe superar 1");

int main()
{
    return 0;
}
```

```text
const_double.cpp:4:21: error: non-constant condition for static assertion
const_double.cpp:4:15: error: the value of ‘RATIO’ is not usable in a constant expression
const_double.cpp:1:14: note: ‘RATIO’ was not declared ‘constexpr’
```

### Una `const` inicializada en ejecución: inutilizable como tamaño

El principal peligro de `const` es que **parece** una constante, pero nada garantiza su valor en la compilación. Con `std::array` (un arreglo de tamaño fijo, escrito entre ángulos), el error es claro:

```cpp
#include <array>      // std::array: arreglo cuyo tamaño se escribe entre ángulos <>
#include <iostream>   // std::cin, std::cout

int leerTamano()   // lee un entero del teclado (véase el ejemplo anterior)
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    const int tamano = leerTamano();   // const, pero su valor solo existe en la ejecución
    // {}: todas las casillas valen 0 al principio
    std::array<int, tamano> casillas{};   // ERROR: tamaño desconocido en la compilación
    std::cout << casillas.size() << "\n";   // size(): el número de casillas
    return 0;
}
```

```text
arreglo_const.cpp:15:27: error: the value of ‘tamano’ is not usable in a constant expression
arreglo_const.cpp:13:15: note: ‘tamano’ was not initialized with a constant expression
```

Con un arreglo «al estilo C», GCC acepta el código mediante una extensión (un **arreglo de tamaño variable**, cuyo tamaño se lee en la ejecución) y solo emite una advertencia:

```cpp
#include <iostream>   // std::cin, std::cout

int leerTamano()   // lee un entero del teclado
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    const int tamano = leerTamano();   // const: valor conocido solo en la ejecución
    int casillas[tamano];              // arreglo al estilo C: GCC lo acepta, la norma C++ no
    casillas[0] = 7;                   // la primera casilla recibe 7
    std::cout << "Casillas: " << tamano << ", primera: " << casillas[0] << "\n";
    return 0;
}
```

```text
arreglo_vla.cpp:13:9: warning: ISO C++ forbids variable length array ‘casillas’ [-Wvla]
Casillas: 5, primera: 7
```

(con la entrada `5`). El programa funciona, pero el C++ estándar no tiene esos arreglos: con la opción `-pedantic-errors`, la advertencia se convierte en `error: ISO C++ forbids variable length array ‘casillas’ [-Wvla]`, y otros compiladores pueden rechazar el código: un mismo programa puede ser válido en uno y no en otro.

## `constexpr`: un valor conocido en la compilación

`constexpr` (de *constant expression*, «expresión constante») declara una constante **tipada** cuyo valor **debe** conocerse en la compilación. El compilador la calcula y rechaza el programa si no lo consigue. `constexpr` existe desde C++11 e implica `const`: después no se modifica la constante.

```cpp
#include <array>      // std::array: arreglo cuyo tamaño se escribe entre ángulos <>
#include <iostream>   // std::cout

constexpr int ANCHURA = 10;                      // 10 casillas de ancho
constexpr int ALTURA = 8;                        // 8 casillas de alto
constexpr int NUM_CASILLAS = ANCHURA * ALTURA;   // calculada en la compilación: 80

int main()
{
    int casillas[NUM_CASILLAS] = {};     // arreglo al estilo C de 80 enteros, a 0
    std::array<int, NUM_CASILLAS> otros{};   // std::array de 80 enteros, aceptado
    casillas[NUM_CASILLAS - 1] = 5;             // la última casilla recibe 5
    std::cout << NUM_CASILLAS << " " << otros.size() << " " << casillas[79] << "\n";
    return 0;
}
```

```text
80 80 5
```

`NUM_CASILLAS` la calcula el compilador (10 x 8), y luego se acepta como tamaño de arreglo, algo que no obtenía la `const` leída del teclado. Si el valor depende de la ejecución, el compilador lo indica de inmediato:

```cpp
#include <iostream>   // std::cin, std::cout

int leerTamano()   // lee un entero del teclado
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    constexpr int tamano = leerTamano();   // ERROR: el valor depende del teclado
    std::cout << tamano << "\n";
    return 0;
}
```

```text
constexpr_entrada.cpp:12:38: error: call to non-‘constexpr’ function ‘int leerTamano()’
constexpr_entrada.cpp:3:5: note: ‘int leerTamano()’ declared here
```

El error aparece en la compilación, antes de que nadie ejecute el programa: ahí está todo su interés. La tabla siguiente resume lo que separa `const` de `constexpr`:

| | `const` | `constexpr` |
|---|---|---|
| Garantiza que el valor ya no cambia | sí | sí |
| Garantiza que el valor se conoce en la compilación | no | sí; si no, error |
| Inicialización por entrada de teclado o de un archivo | permitida | rechazada |
| Tamaño de arreglo, argumento de plantilla, `static_assert` | solo para un entero inicializado con un literal | siempre, para cualquier tipo permitido |
| Se aplica a | cualquier variable | una variable, una función (véase más abajo) |

## Comparar `#define`, `const` y `constexpr`

| Criterio | `#define` | `const` | `constexpr` |
|---|---|---|---|
| Naturaleza | Texto sustituido por el preprocesador | Variable de solo lectura | Constante calculada en la compilación |
| Tipo | Ninguno: el del texto sustituido | Sí | Sí |
| Ámbito | Ninguno: desde la línea `#define` hasta el final del archivo | Sí: bloque, clase, espacio de nombres | Sí: bloque, clase, espacio de nombres |
| Momento del valor | Antes de la compilación (texto) | Inicialización, a veces en ejecución | Compilación, obligatoriamente |
| Tamaño de arreglo | Sí | Solo si el valor es conocido (entero inicializado con un literal) | Sí |
| Ajuste con `-D` | Sí | No | No (salvo leyendo una macro) |
| Utilizable en `#if` | Sí | No | No |
| Mensaje de error | Cita el texto sustituido | Cita el nombre | Cita el nombre |
| Depuración | El nombre desaparece antes de la compilación | El nombre se conserva | El nombre se conserva |

### Los mensajes de error

Modificar la constante por error produce dos tipos de mensajes. Con la macro:

```cpp
#define TILE_SIZE 64   // macro

int main()
{
    TILE_SIZE = 32;   // ERROR: se intenta modificar la constante
    return 0;
}
```

```text
modificar_macro.cpp:1:19: error: lvalue required as left operand of assignment
modificar_macro.cpp:5:5: note: in expansion of macro ‘TILE_SIZE’
```

El compilador habla de un valor a la izquierda de la asignación (`64 = 32` no tiene sentido): ha sustituido el nombre por el número. Si la primera línea pasa a ser `const int TILE_SIZE = 64;` (archivo `modificar_const.cpp`) o `constexpr int TILE_SIZE = 64;` (archivo `modificar_constexpr.cpp`), el mensaje es el mismo en los dos casos y cita el nombre:

```text
modificar_const.cpp:5:15: error: assignment of read-only variable ‘TILE_SIZE’
```

### La depuración

Un **depurador** es una herramienta que ejecuta un programa paso a paso y muestra sus variables (véase [el bug](/?c=fondamentaux&s=bases-de-l-informatique&p=le-bug)). Solo lee lo que el compilador ha dejado en el programa. Archivo `depuracion.cpp`:

```cpp
#define TILE_MACRO 64   // macro: desaparece antes de la compilación propiamente dicha

constexpr int TILE_CONSTEXPR = 64;   // constante: conserva su nombre en el programa compilado

int main()
{
    // %: resto de la división; 128 % 7 vale 2; return devuelve ese número al sistema
    return (TILE_MACRO + TILE_CONSTEXPR) % 7;
}
```

```bash
# -g: el compilador añade al programa los nombres que lee un depurador
# (DWARF: el formato estándar en el que se guardan esos nombres)
# objdump: muestra el contenido de un programa compilado
# grep -c: cuenta las líneas que citan una palabra
g++ -std=c++17 -g depuracion.cpp -o depuracion
objdump --dwarf=info depuracion | grep -c TILE_CONSTEXPR
objdump --dwarf=info depuracion | grep -c TILE_MACRO
# -g3: añade también las macros, legibles con --dwarf=macro
g++ -std=c++17 -g3 depuracion.cpp -o depuracion3
objdump --dwarf=macro depuracion3 | grep -c TILE_MACRO
```

```text
1
0
1
```

Con `-g`, la constante conserva su nombre (1 línea) y la macro no aparece en ninguna parte (0). Solo la opción `-g3` conserva las macros. Sin ella, el depurador muestra `64` donde el código decía `TILE_MACRO`.

## El ámbito de una constante

El **ámbito** de un nombre es la zona del código donde existe. Una constante `const` o `constexpr` sigue las reglas de ámbito de cualquier variable, lo que permite que tres constantes tengan el mismo nombre sin estorbarse:

| ¿Dónde se declara? | Ámbito | Cómo se lee desde fuera |
|---|---|---|
| En una función | Desde su declaración hasta la llave de cierre de la función | Imposible: ya no existe después |
| En un espacio de nombres | En todas partes, con el prefijo y el operador `::` («que pertenece a») | `Config::ANCHURA` |
| En una clase, con `static` | En la clase; fuera de ella si es `public` | `Cuadricula::ANCHURA` |
| `#define` | Desde la línea `#define` hasta el final del archivo, sin prefijo | `ANCHURA` (ningún control) |

```cpp
#include <iostream>   // std::cout

namespace Config {               // un espacio de nombres agrupa nombres bajo un prefijo
    constexpr int ANCHURA = 10;  // se escribe Config::ANCHURA, desde cualquier lugar
}

class Cuadricula {
public:
    static constexpr int ANCHURA = 5;   // Cuadricula::ANCHURA, desde cualquier lugar (public)
};

void dibujar()
{
    constexpr int ANCHURA = 3;   // visible en dibujar(), hasta la llave de cierre
    std::cout << ANCHURA << " " << Config::ANCHURA << " " << Cuadricula::ANCHURA << "\n";
}

int main()
{
    dibujar();   // muestra las tres ANCHURA: ninguna estorba a las otras
    return 0;
}
```

```text
3 10 5
```

En `dibujar`, el nombre `ANCHURA` solo designa la constante local (3); las otras dos se escriben con su prefijo. Fuera de su función, una constante local ya no existe:

```cpp
#include <iostream>   // std::cout

void dibujar()
{
    constexpr int MARGEN = 8;   // visible solo en dibujar()
    std::cout << "dibujar: " << MARGEN << "\n";
}

int main()
{
    dibujar();
    std::cout << "main: " << MARGEN << "\n";   // ERROR: MARGEN no existe aquí
    return 0;
}
```

```text
alcance_local.cpp:12:30: error: ‘MARGEN’ was not declared in this scope
```

Una macro, en cambio, habría sido visible en `main` (véase el ejemplo `macro_alcance.cpp` más arriba, donde `MARGEN` sale de su función). Un ámbito estrecho es una ventaja: un nombre de constante local no puede chocar con otro nombre del programa.

## El miembro `static constexpr` de una clase

Un **miembro estático** (declarado `static`) de una clase no pertenece a cada objeto, sino a la clase: existe en un único ejemplar, compartido (véase [los miembros estáticos](/?c=langages&s=cpp&p=classes-et-objets#miembros-y-metodos-estaticos)). Una constante de clase no tiene motivo para copiarse en cada objeto `Game`: se declara `static constexpr`. Este es el hilo conductor: una clase de juego cuyo tamaño de casilla es un miembro:

```cpp
#include <array>      // std::array: arreglo de tamaño fijo, escrito entre ángulos <>
#include <iostream>   // std::cout

class Game {
public:   // lo que sigue es utilizable desde fuera de la clase
    static constexpr int TILE_SIZE = 64;    // tamaño de una casilla en píxeles
    static constexpr int GRID_WIDTH = 10;   // número de casillas a lo ancho
    static constexpr int GRID_HEIGHT = 8;   // número de casillas a lo alto

    // posición en píxeles de la columna indicada; const: no modifica el objeto
    int pixelX(int columna) const { return columna * TILE_SIZE; }
    // static_cast<int> convierte en int el número de casillas que devuelve size()
    int cellCount() const { return static_cast<int>(cells.size()); }

private:   // lo que sigue solo es utilizable dentro de la clase
    // el tamaño es una expresión constante: las tres constantes se multiplican
    std::array<int, GRID_WIDTH * GRID_HEIGHT> cells{};
};

int main()
{
    Game game;   // un objeto Game
    // Clase::NOMBRE: se usa sin objeto
    std::cout << "Casilla: " << Game::TILE_SIZE << " píxeles\n";
    std::cout << "Columna 3: x = " << game.pixelX(3) << "\n";
    std::cout << "Ventana: " << Game::GRID_WIDTH * Game::TILE_SIZE << " x "
              << Game::GRID_HEIGHT * Game::TILE_SIZE << "\n";
    std::cout << "Casillas: " << game.cellCount() << "\n";
    return 0;
}
```

```text
Casilla: 64 píxeles
Columna 3: x = 192
Ventana: 640 x 512
Casillas: 80
```

Puntos a recordar:

- `Game::TILE_SIZE` se lee con `Clase::NOMBRE` (el operador `::` significa «que pertenece a»): no hace falta ningún objeto, porque la constante pertenece a la clase.
- Las tres constantes sirven para calcular el tamaño de `cells`: el producto `GRID_WIDTH * GRID_HEIGHT` es una expresión constante, aceptada entre los ángulos de `std::array` (véase [las plantillas](/?c=langages&s=cpp&p=templates)).
- `static_cast<int>` convierte un número de un tipo a otro (véase [los cast en C++](/?c=langages&s=cpp&p=cast-cpp)), y `const` después de `pixelX(int columna)` garantiza que el método (una función de la clase) no modifica el objeto.

El acceso desde fuera de la clase depende de la sección donde se declara la constante:

| Declaración | En las funciones de `Game` | Fuera de la clase (`Game::NOMBRE`) |
|---|---|---|
| Sección `public` | sí | sí |
| Sección `private` | sí | no: error de compilación |
| Sección `protected` | sí | no, pero las clases derivadas sí tienen acceso |

```cpp
#include <iostream>   // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // public: legible desde fuera

private:
    static constexpr int MAX_LIVES = 3;    // private: reservada a las funciones de Game
};

int main()
{
    std::cout << Game::TILE_SIZE << "\n";   // aceptado
    std::cout << Game::MAX_LIVES << "\n";   // ERROR: MAX_LIVES es private
    return 0;
}
```

```text
privado.cpp:14:24: error: ‘constexpr const int Game::MAX_LIVES’ is private within this context
privado.cpp:8:26: note: declared private here
```

Una constante útil solo para la clase se coloca en `private`: así no se convierte en una interfaz que haya que mantener.

### Antes y desde C++17: la definición fuera de la clase

Una constante usada como simple **valor** (`TILE_SIZE * 2`, `std::cout << TILE_SIZE`) no necesita existir en memoria: el compilador copia 64. Desde el momento en que se pide su **dirección** (el lugar del valor en la memoria, obtenido mediante un paso por [referencia](/?c=langages&s=cpp&p=references) o con el símbolo `&`), debe existir en un punto preciso de la memoria. Una **declaración** solo anuncia un nombre y su tipo; una **definición** además reserva ese lugar, una sola vez para todo el programa. Un **argumento** es el valor que se pasa a una función al llamarla: `std::min` recibe sus dos argumentos por referencia, es decir, por su dirección:

```cpp
#include <algorithm>   // std::min: devuelve el menor de dos valores
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // tamaño de una casilla en píxeles
};

int main()
{
    int pedido = 100;   // tamaño pedido por el usuario
    // std::min recibe sus argumentos por referencia: usa la dirección de TILE_SIZE
    int tamano = std::min(pedido, Game::TILE_SIZE);
    std::cout << "Tamaño resultante: " << tamano << "\n";
    return 0;
}
```

| Estándar | Dentro de la clase, `static constexpr int TILE_SIZE = 64;` es | La línea `constexpr int Game::TILE_SIZE;` fuera de la clase es |
|---|---|---|
| C++11 y C++14 | Solo una declaración | **Necesaria** si se pide la dirección, en un único archivo `.cpp` |
| C++17 y posteriores | Una declaración y una definición (la constante es implícitamente `inline`: una definición que puede aparecer en varios archivos, y el programa solo conserva un ejemplar) | Innecesaria; sigue aceptada, pero el estándar la declara obsoleta |

En C++17, el programa muestra:

```text
Tamaño resultante: 64
```

En C++11 y C++14, la compilación tiene éxito, pero la **edición de enlaces** (la última etapa, que une las piezas del programa; véase [los errores de edición de enlaces](/?c=langages&s=c&p=compilation#errores-de-compilacion-frente-a-errores-de-enlazado)) falla (`ld` es el programa que realiza esa etapa):

```text
min_direccion.cpp:(.text+0x29): undefined reference to `Game::TILE_SIZE'
collect2: error: ld returned 1 exit status
```

La corrección añade la definición después de la clase:

```cpp
#include <algorithm>   // std::min
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // declaración dentro de la clase
};

// definición fuera de la clase: reserva la dirección de TILE_SIZE (en UN solo archivo .cpp)
constexpr int Game::TILE_SIZE;

int main()
{
    int pedido = 100;   // tamaño pedido por el usuario
    int tamano = std::min(pedido, Game::TILE_SIZE);   // limita a 64
    std::cout << "Tamaño resultante: " << tamano << "\n";
    return 0;
}
```

```text
Tamaño resultante: 64
```

Este programa da el mismo resultado en C++11, C++14 y C++17. Dos detalles de esta trampa:

- Con la opción de [optimización](/?c=langages&s=c&p=compilation#los-niveles-de-optimizacion-o0-a-o3-os) `-O2` (que pide al compilador reescribir el código para hacerlo más rápido), la referencia se sustituye por el valor 64 y el error desaparece (observado con el código del ejemplo en C++11): un programa puede, por tanto, pasar a la versión optimizada y fallar en la versión normal.
- La línea de definición pertenece a **un solo** archivo `.cpp`. Colocada en una cabecera incluida por dos archivos, da en C++14 `multiple definition of ‘Game::TILE_SIZE’`; en C++17 ya no es un problema, porque la constante es `inline`.

## Lo que `constexpr` sabe calcular: funciones y `static_assert`

Declarada `constexpr`, una función puede llamarse en la compilación cuando todos sus argumentos (los valores pasados en la llamada) son conocidos; con un argumento conocido solo en la ejecución, se ejecuta como una función ordinaria. Lo que puede contener depende del estándar:

| Estándar | Contenido permitido en una función `constexpr` |
|---|---|
| C++11 | Una sola sentencia (una instrucción terminada en `;`): `return`; la **recursión** (una función que se llama a sí misma) y el operador ternario `condición ? a : b` reemplazan a variables y bucles |
| C++14 | Variables locales, bucles [`for` y `while`](/?c=langages&s=c&p=boucles), varias sentencias |
| C++20 | La palabra `consteval` impone el cálculo en la compilación (véase más abajo) |

```cpp
#include <iostream>   // std::cin, std::cout

constexpr int cuadrado(int x) { return x * x; }   // un solo return: válido desde C++11

// recursión: la función se llama a sí misma; <= : «menor o igual que»
// «condición ? a : b» vale a si la condición es verdadera, y b en caso contrario
constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }

// SUPERFICIE: calculada en la compilación (64)
constexpr int SUPERFICIE = cuadrado(8);
// == : prueba de igualdad; si falla, se detiene la compilación
static_assert(cuadrado(8) == 64, "cuadrado(8) debe valer 64");
int arreglo[factorial(3)];   // tamaño 3 x 2 x 1 = 6

int main()
{
    int n = 0;       // valor elegido en la ejecución
    std::cin >> n;   // leído del teclado
    // cuadrado(n) se ejecuta como una función ordinaria: n es desconocido en la compilación
    std::cout << SUPERFICIE << " " << factorial(5) << " " << cuadrado(n) << " "
              << arreglo[0] << "\n";
    return 0;
}
```

```text
64 120 49 0
```

(con la entrada `7`). `factorial(5)` vale 5 x 4 x 3 x 2 x 1, es decir, 120. La misma función `cuadrado` sirve en la compilación (`SUPERFICIE`, `static_assert`) y en la ejecución (`cuadrado(n)`), mientras que `factorial(3)` fija el tamaño del arreglo. Con un bucle, la misma idea se escribe más sencillamente, pero solo desde C++14:

```cpp
#include <iostream>   // std::cout

constexpr int suma(int n)   // suma los enteros de 1 a n
{
    int total = 0;                 // variable local: permitida desde C++14
    for (int i = 1; i <= n; ++i)   // bucle: permitido desde C++14; ++i suma 1 a i
        total += i;                // +=: suma i a total
    return total;                  // 1 + 2 + ... + n
}

constexpr int TOTAL = suma(10);   // calculado en la compilación: 55

int main()
{
    std::cout << TOTAL << "\n";
    return 0;
}
```

```text
55
```

En C++11, la misma función se rechaza:

```text
suma.cpp:9:1: error: body of ‘constexpr’ function [...] not a return-statement
```

### `static_assert`: verificar en la compilación

[`static_assert(condición, "mensaje")`](https://en.cppreference.com/w/cpp/language/static_assert) detiene la compilación con el mensaje si la condición es falsa. La condición debe ser una expresión constante. Así se convierte una hipótesis del código («la casilla es un múltiplo de 8») en una regla que el compilador controla:

```cpp
constexpr int TILE_SIZE = 60;   // tamaño de una casilla en píxeles

// la condición es falsa: la compilación se detiene con este mensaje
static_assert(TILE_SIZE % 8 == 0, "TILE_SIZE debe ser un múltiplo de 8");

int main()
{
    return 0;
}
```

```text
assertion.cpp:4:29: error: static assertion failed: TILE_SIZE debe ser un múltiplo de 8
assertion.cpp:4:29: note: the comparison reduces to ‘(4 == 0)’
```

(60 % 8 vale 4, el resto de dividir 60 entre 8.) Desde C++17, el mensaje puede omitirse: `static_assert(TILE_SIZE > 0);`. En C++11, GCC lo acepta pero advierte (`warning: ‘static_assert’ without a message only available with ‘-std=c++17’`).

### `consteval` (C++20)

Una función `constexpr` puede seguir ejecutándose en tiempo de ejecución. Una función `consteval` (véase [la documentación](https://en.cppreference.com/w/cpp/language/consteval)) nunca puede hacerlo: toda llamada debe ser una expresión constante. Con `consteval int cuadrado(int x) { return x * x; }` y un `n` leído del teclado, compilado con `-std=c++20`, la llamada `cuadrado(8)` pasa y `cuadrado(n)` se rechaza:

```text
consteval.cpp:9:43: error: the value of ‘n’ is not usable in a constant expression
```

## Los límites de `constexpr`

`constexpr` solo se aplica a lo que se calcula sin ejecutar el programa:

| Lo que se quisiera | ¿Posible? | Detalle |
|---|---|---|
| Un entero, un número con decimales, un booleano (verdadero o falso), un carácter (`'a'`) | sí | `constexpr double PI = 3.14159265358979;` |
| Un texto constante | sí | Un [puntero](/?c=langages&s=c&p=pointeurs) (la dirección de un valor en memoria) hacia un texto escrito en el código: `constexpr const char *` |
| Un valor leído del teclado, de un archivo o de la red | no | El valor solo existe en la ejecución (véase más arriba el error) |
| Una variable `constexpr` de tipo `std::string` | no (probado en C++11 y C++17) | El tipo no es «literal» (véase más abajo) |
| Una función `constexpr` que llama a una función no `constexpr` | rechazada si se exige su valor en la compilación | `std::cin >> valor` en el cuerpo provoca la advertencia `-Winvalid-constexpr` en C++17 y un error en C++11 |

```cpp
#include <iostream>   // std::cout

// PI: un número con decimales (double)
constexpr double PI = 3.14159265358979;
// TITULO: puntero a un texto escrito en el código
constexpr const char *TITULO = "Juego de casillas";
// MODO_DEBUG: booleano, true (verdadero) o false (falso)
constexpr bool MODO_DEBUG = true;

int main()
{
    std::cout << TITULO << ": " << PI << " " << MODO_DEBUG << "\n";
    return 0;
}
```

```text
Juego de casillas: 3.14159 1
```

(un booleano se muestra `1` para verdadero, `0` para falso.) Para `std::string`, el mensaje cita el tipo:

```cpp
#include <iostream>   // std::cout
#include <string>     // std::string: tipo de texto de la biblioteca estándar

constexpr std::string TITULO = "Juego de casillas";   // ERROR: std::string no es constexpr

int main()
{
    std::cout << TITULO << "\n";
    return 0;
}
```

```text
texto.cpp:4:23: error: the type ‘const std::string’ [...] ‘TITULO’ is not literal
[...] has a non-trivial destructor
```

(`[...]` marca las palabras omitidas del mensaje.) Un **tipo literal** es un tipo que el compilador sabe crear durante la compilación: números, booleanos, caracteres, punteros y clases simples. `std::string` gestiona memoria reservada durante la ejecución (véase [la gestión de la memoria](/?c=langages&s=cpp&p=gestion-memoire-raii)), que un [destructor](/?c=langages&s=cpp&p=classes-et-objets) libera al final de su vida: no es literal. Para un texto constante se escribe `constexpr const char *`.

## Organizar las constantes de un proyecto

Las constantes compartidas se colocan en una cabecera, dentro de un espacio de nombres. Una constante `constexpr` de espacio de nombres existe en **un ejemplar por archivo `.cpp`** que incluye la cabecera (cada archivo tiene su copia, sin conflicto al enlazar). Desde C++17, `inline constexpr` da un único ejemplar, compartido por todo el programa:

```cpp
#ifndef CONSTANTES_H
#define CONSTANTES_H
namespace Config {
    constexpr int TILE_SIZE = 64;           // una copia por archivo .cpp
    inline constexpr int TILE_INLINE = 64;  // una sola copia para todo el programa (C++17)
}
// definidas en otro archivo .cpp: devuelven la dirección vista desde ese archivo
const int *direccionTile();
const int *direccionTileInline();
#endif
```

En un programa de dos archivos `.cpp` que incluyen esta cabecera (uno define las dos funciones, el otro las llama), la dirección de `TILE_SIZE` vista por cada uno es distinta en C++14 y en C++17; la de `TILE_INLINE` es la misma en C++17 (resultado observado). Para un simple número leído por valor, la diferencia no importa: solo se nota si se pide la dirección.

Para conservar el ajuste con `-D` de `#define` con el tipo y el ámbito de `constexpr`, se combinan ambos: la macro solo sirve de punto de entrada, leída una única vez.

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE_PX     // la macro solo sirve de punto de entrada para -D...
#define TILE_SIZE_PX 64  // ...con un valor por defecto
#endif

constexpr int TILE_SIZE = TILE_SIZE_PX;   // el resto del código usa esta constante tipada
// static_assert: detiene la compilación si la condición es falsa
static_assert(TILE_SIZE > 0, "el tamaño de una casilla debe ser positivo");

int main()
{
    std::cout << "Casilla: " << TILE_SIZE << " píxeles\n";
    return 0;
}
```

Este archivo se llama aquí `ajuste.cpp`:

```bash
g++ -std=c++17 ajuste.cpp -o ajuste && ./ajuste
g++ -std=c++17 -DTILE_SIZE_PX=32 ajuste.cpp -o ajuste && ./ajuste
g++ -std=c++17 -DTILE_SIZE_PX=0 ajuste.cpp -o ajuste
```

```text
Casilla: 64 píxeles
Casilla: 32 píxeles
ajuste.cpp:9:25: error: static assertion failed: el tamaño de una casilla debe ser positivo
ajuste.cpp:9:25: note: the comparison reduces to ‘(0 > 0)’
```

El mismo programa también compila en C++11. El resto del código solo usa `TILE_SIZE`: un valor absurdo pasado con `-D` se detiene en la compilación gracias a `static_assert`.

## Las trampas

| Trampa | Síntoma | Corrección |
|---|---|---|
| Usar una `const` inicializada en ejecución como tamaño de arreglo | `the value of ‘tamano’ is not usable in a constant expression`; o, con un arreglo «al estilo C», una advertencia `-Wvla` solo con GCC | Declarar el tamaño `constexpr`; si el tamaño es realmente desconocido en la compilación, usar `std::vector` (véase [los contenedores](/?c=langages&s=cpp&p=stl-conteneurs)) |
| Creer que una función `constexpr` siempre se calcula en la compilación | `cuadrado(n)` con `n` leído del teclado se ejecuta en la ejecución, sin error | Asignar el resultado a una variable `constexpr`, o usar `consteval` (C++20) |
| Macro con **parámetro** (un nombre entre paréntesis, sustituido por el texto pasado en la llamada) sin paréntesis | `CUADRADO_MAL(1 + 2)` da 5 y no 9 | Poner entre paréntesis cada parámetro y el resultado, o usar una función `constexpr` |
| Constante `#define` sin paréntesis | `5120 / ANCHURA_MAL` da 800 y no 8 | Poner entre paréntesis: `#define ANCHURA_BIEN (64 * 10)` |
| Punto y coma al final de un `#define` | `#define TILE_SIZE 64;` y luego `int casillas[TILE_SIZE];` da `expected ‘]’ before ‘;’ token` | Ningún punto y coma en una macro |
| Colisión de macros del mismo nombre | Gana la última definición encontrada; solo `warning: "ANCHURA" redefined` lo señala | Constantes en un espacio de nombres; leer las advertencias del compilador |
| Macro definida en una función | Sigue activa después de la función (ejemplo `macro_alcance.cpp`) | Una `constexpr` local, que desaparece con la función |
| `#if` sobre una constante de C++ | `TILE_SIZE` vale 0 en el `#if`: la rama elegida es falsa, sin ningún error | Conservar una macro para los `#if`; en otros casos, `if` o `static_assert` |
| `static constexpr` usado por dirección en C++11 o C++14 | `undefined reference to ‘Game::TILE_SIZE’` | Añadir `constexpr int Game::TILE_SIZE;` en un `.cpp` |
| `static const double` en una clase | `‘constexpr’ needed for in-class initialization of static data member ‘const double Game::RATIO’ of non-integral type` | Escribir `static constexpr double RATIO = 0.5;` |
| Olvidar `static` delante de un miembro `constexpr` | `non-static data member ‘TILE_SIZE’ declared ‘constexpr’` | Escribir `static constexpr int TILE_SIZE = 64;` |
| `constexpr` sobre un `std::string` | `the type ‘const std::string’ ... is not literal` | `constexpr const char *` para un texto constante |

El error de `#if` se comprueba con este programa (la constante vale 64, pero el `#if` cree que vale 0):

```cpp
#include <iostream>   // std::cout

constexpr int TILE_SIZE = 64;   // una constante de C++, no una macro

// #if prueba una condición antes de la compilación; solo conoce las macros
#if TILE_SIZE > 32              // TILE_SIZE no es una macro: aquí vale 0
const char *tamano = "grande";  // elegida si TILE_SIZE > 32
#else
const char *tamano = "pequeña"; // elegida en caso contrario
#endif

int main()
{
    std::cout << "Casilla " << tamano << " (" << TILE_SIZE << " píxeles)\n";
    return 0;
}
```

```text
Casilla pequeña (64 píxeles)
```

`-Wundef` lo advierte: `warning: "TILE_SIZE" is not defined, evaluates to 0 [-Wundef]`.

El error de los paréntesis se comprueba con este programa:

```cpp
#include <iostream>   // std::cout

#define CUADRADO_MAL(x) x * x               // parámetro sin paréntesis
#define CUADRADO_BIEN(x) ((x) * (x))        // parámetro y resultado entre paréntesis
#define ANCHURA_MAL 64 * 10                 // constante sin paréntesis
#define ANCHURA_BIEN (64 * 10)              // constante entre paréntesis
constexpr int cuadrado(int x) { return x * x; }   // función: x se calcula primero

int main()
{
    // CUADRADO_MAL(1 + 2) se convierte en 1 + 2 * 1 + 2, es decir, 1 + 2 + 2 = 5
    std::cout << CUADRADO_MAL(1 + 2) << " " << CUADRADO_BIEN(1 + 2) << " "
              << cuadrado(1 + 2) << "\n";
    // 5120 / ANCHURA_MAL se convierte en 5120 / 64 * 10, es decir, 80 * 10 = 800
    std::cout << 5120 / ANCHURA_MAL << " " << 5120 / ANCHURA_BIEN << "\n";
    return 0;
}
```

```text
5 9 9
800 8
```

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| `constexpr` por defecto para un valor conocido en la compilación | El compilador verifica la promesa; se respetan el tipo y el ámbito |
| `const` solo para un valor calculado en la ejecución | Indica «fijada aquí, nunca modificada», sin pretender un cálculo en la compilación |
| `#define` reservado a las necesidades que solo cubre el preprocesador: ajuste con `-D`, condición `#if`, guarda de inclusión | En cualquier otro caso, la macro no tiene tipo, ni ámbito, ni nombre en el depurador |
| Una constante de clase como `static constexpr`, puesta en `private` si solo sirve a la clase | Un único ejemplar para todos los objetos; ninguna interfaz pública de más |
| Una constante global en un espacio de nombres (`Config::TILE_SIZE`) | Ninguna colisión; el origen se ve al leer |
| Una constante con nombre en lugar de un número mágico | El sentido queda escrito; el cambio se hace en un solo lugar |
| `static_assert` para cualquier hipótesis sobre una constante | Un valor absurdo detiene la compilación, no el juego |
| Escribir las macros en mayúsculas y ponerlas completamente entre paréntesis | Una macro se reconoce al leer; el orden de las operaciones sigue siendo el deseado |
| Compilar con `-std=c++17` (o posterior) y `-Wall -Wextra -pedantic` | Desde C++17 ya no hace falta escribir la definición fuera de la clase; las advertencias señalan macros redefinidas y arreglos de tamaño variable |

Para profundizar, en cppreference: [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr), [`const`](https://en.cppreference.com/w/cpp/language/cv), [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert), [los miembros estáticos](https://en.cppreference.com/w/cpp/language/static), [el especificador `inline`](https://en.cppreference.com/w/cpp/language/inline), [`consteval`](https://en.cppreference.com/w/cpp/language/consteval), [`std::array`](https://en.cppreference.com/w/cpp/container/array) y [las macros](https://en.cppreference.com/w/cpp/preprocessor/replace).

## Lo que hay que recordar

| Qué recordar | Detalle |
|---|---|
| Una constante nombra un valor fijo | Sustituye a un número mágico: el sentido queda escrito y el cambio se hace en un único lugar |
| Dos momentos | La compilación traduce el código; la ejecución lanza el programa. Una expresión constante se calcula en la compilación |
| `#define` | Sustitución de texto por el preprocesador: sin tipo, sin ámbito, expuesta a colisiones; visible en todas partes, ajustable con `-D`, utilizable en `#if` |
| `const` | Variable que no se modifica tras su inicialización; el valor puede venir de la ejecución (teclado, archivo); en ese caso no sirve como tamaño de arreglo |
| `constexpr` | Constante tipada cuyo valor se conoce en la compilación; si no, error; utilizable como tamaño de arreglo, argumento de plantilla y en `static_assert` |
| Ámbito | Función (local), espacio de nombres (`Config::NOMBRE`), clase (`Clase::NOMBRE`); una macro no tiene ninguno |
| Miembro `static constexpr` | Un ejemplar compartido por la clase; `Game::TILE_SIZE` fuera de la clase si es `public`, error si es `private` |
| Estándar | Antes de C++17, una dirección pedida exige `constexpr int Game::TILE_SIZE;` fuera de la clase; desde C++17, el miembro es `inline`. Funciones `constexpr`: un solo `return` en C++11, bucles desde C++14; `consteval` en C++20 |
| Límites | Solo lo que se calcula sin ejecutar el programa: nada de entrada de teclado, ni de archivos, ni `std::string` constexpr |
| No confundir | `const` (nunca modificada) y `constexpr` (conocida en la compilación); `#define` (texto) y constante (valor tipado) |
