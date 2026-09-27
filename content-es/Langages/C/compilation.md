---
order: 11
---

# El proceso de compilación

A diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), que se interpretan directamente en la ejecución, un programa en C debe **traducirse a código máquina** antes de poder ejecutarse. Esta traducción se desarrolla en cuatro etapas distintas, generalmente invisibles detrás de un único comando ([`gcc`](https://gcc.gnu.org) `main.c -o programa`), pero que conviene saber distinguir para comprender ciertos errores.

## Las cuatro etapas

```text
main.c --[1. preprocesador]--> main.i --[2. compilación]--> main.s --[3. ensamblado]--> main.o --[4. enlazado]--> programa
```

### 1. El preprocesador

Trata todo lo que empieza por `#` **antes** de que el compilador vea el código: sustituye los `#include` por el contenido real del archivo incluido, sustituye las macros `#define`, resuelve los `#ifdef`/`#ifndef`. El resultado es un único archivo fuente "aplanado", sin ninguna directiva `#`.

```bash
gcc -E main.c -o main.i
```

### 2. La compilación propiamente dicha

Traduce el código fuente (C) a **ensamblador**, un lenguaje todavía legible por un humano pero muy cercano a las instrucciones del procesador.

```bash
gcc -S main.i -o main.s
```

### 3. El ensamblado

Traduce el ensamblador a **código máquina binario**, reunido en un archivo objeto (`.o`). Este archivo ya contiene instrucciones ejecutables, pero todavía no es un programa completo: las llamadas a funciones externas (como `printf`) aún no están resueltas.

```bash
gcc -c main.s -o main.o
```

### 4. El enlazado (*linking*)

Ensambla uno o varios archivos `.o` entre sí, y resuelve las referencias a funciones definidas en otro lugar (en otros archivos `.o`, o en [bibliotecas](/?c=langages-de-programmation&s=c&p=bibliotheques)) para producir un ejecutable final completo.

```bash
gcc main.o -o programa
```

## Por qué separar compilación y enlazado

Un proyecto con varios archivos fuente puede compilar cada `.c` en `.o` de forma independiente, y luego enlazar (*link*) solo los archivos que hayan cambiado: más rápido que una recompilación completa a cada modificación. Es exactamente lo que automatiza un [**Makefile**](/?c=langages-de-programmation&s=c&p=makefiles):

```bash
gcc -c archivo1.c -o archivo1.o
gcc -c archivo2.c -o archivo2.o
gcc archivo1.o archivo2.o -o programa
```

## Los niveles de optimización (`-O0` a `-O3`, `-Os`)

Una vez que el programa compila, `gcc`/[Clang](https://clang.llvm.org) pueden reescribir el código máquina producido en la etapa 2 para hacerlo más rápido, sin cambiar su comportamiento observable. Este ajuste se hace con la opción `-O`:

| Nivel | Efecto |
|---|---|
| `-O0` | Sin optimización (comportamiento por defecto): compilación rápida, código máquina que sigue el código fuente paso a paso -- el más fácil de seguir en un depurador |
| `-O1` | Optimizaciones básicas, ganancia modesta, compilación aún rápida |
| `-O2` | Nivel recomendado en producción: inlining, eliminación de código muerto, desenrollado de bucles (véase más abajo), sin disparar el tamaño del binario |
| `-O3` | Lleva `-O2` más lejos (vectorización agresiva, inlining más amplio): ganancia a veces marginal según el programa, binario más grande, compilación más larga |
| `-Os` | Optimiza el tamaño del binario en lugar de la velocidad (útil en entornos embebidos, con espacio en disco limitado) |

Tres técnicas comunes explican la ganancia:

- **Inlining**: el cuerpo de una función pequeña se copia directamente en cada lugar donde se la llama, evitando el coste de una llamada real (guardar contexto, salto, retorno).
- **Eliminación de código muerto**: cualquier cálculo cuyo resultado nunca se usa se retira del binario final.
- **Desenrollado de bucles** (*loop unrolling*): el cuerpo de un bucle se duplica varias veces para reducir el número de iteraciones (y por tanto de comprobaciones de condición), a costa de un binario más grande.

```bash
gcc -O2 main.c -o programme
```

> **Trampa:** el inlining puede hacer aparecer un aviso invisible en `-O0`. Ejemplo: una función que devuelve `-1` en caso de error, cuyo resultado se usa después para calcular un tamaño pasado a `malloc()`. En `-O0`, el compilador ve dos funciones separadas y no puede relacionar ambos valores. Una vez inlineada por `-O2`, ve el cálculo completo de una vez y puede detectar que `malloc()` recibiría un tamaño negativo (por tanto gigantesco al convertirlo a `size_t`) -- señalado por `-Walloc-size-larger-than=` (incluido en `-Wall -Wextra`, véase [Los Makefiles](/?c=langages-de-programmation&s=c&p=makefiles)), que se convierte en error bloqueante si `-Werror` está activo. Un código sin avisos en `-O0` puede por tanto fallar al compilar en `-O2`: siempre probar la compilación en el nivel de optimización realmente usado en producción, no solo en `-O0`.

## Apuntar al procesador (`-march=native`) y compilar con hilos (`-pthread`)

Por defecto, el compilador produce un programa que funciona en **todos** los procesadores de la misma familia, incluidos los más antiguos: se prohíbe las instrucciones recientes. `-march=native` le permite usar todas las instrucciones del procesador **de la máquina que compila**.

```bash
gcc -O2 -march=native -c contar.c    # contar.c: return __builtin_popcount(x);
```

| Compilación | Código producido para `__builtin_popcount(x)` (comprobado con `objdump -d`) |
|---|---|
| `gcc -O2` | Una llamada a una función auxiliar que cuenta los bits en varios pasos |
| `gcc -O2 -march=native` | Una sola instrucción del procesador, `popcnt` |

> **Trampa:** un programa compilado con `-march=native` puede detenerse con el error `Illegal instruction` en una máquina con un procesador más antiguo. Reservarlo a los programas que se ejecutan en la máquina donde se compilan (cálculo, mediciones), nunca a un ejecutable distribuido.

Para un programa que usa [hilos](/?c=langages&s=c&p=threads), se pasa `-pthread` **en la compilación y en el enlazado**:

```bash
gcc -Wall -pthread -o programa programa.c
```

| Opción | Efecto |
|---|---|
| `-pthread` | Define los ajustes que necesitan los hilos (la macro `_REENTRANT`) **y** añade la biblioteca de hilos en el enlazado |
| `-lpthread` | Solo añade la biblioteca, sin los ajustes de compilación |

Desde la versión 2.34 de la biblioteca C de Linux (glibc), las funciones de hilos forman parte de la propia biblioteca C: un programa a menudo se enlaza incluso sin opción. `-pthread` sigue siendo la forma portable de compilar, válida también en sistemas más antiguos.

## Varios archivos e inlining: unidad de traducción, `static inline`, `-flto`

Una **unidad de traducción** es un archivo `.c` tal como lo ve la etapa 2: su propio código, más todo lo que sus `#include` copiaron en él en la etapa 1. El compilador trata **una sola unidad a la vez**: nunca ve el contenido de los demás `.c` del proyecto.

Consecuencia directa para el [inlining](#los-niveles-de-optimizacion-o0-a-o3-os): el compilador solo puede copiar el cuerpo de una función si lo ve. Una función definida en otro `.c` sigue siendo una llamada real, incluso en `-O3`.

```c
/* cuadrado.h */
int cuadrado(int x);                    // solo la declaración: el cuerpo está en otra parte

/* cuadrado.c */
#include "cuadrado.h"
int cuadrado(int x) { return x * x; }   // la definición, en otra unidad

/* main.c */
#include <stdio.h>
#include "cuadrado.h"
int main(void) {
    long suma = 0;
    for (int i = 0; i < 1000; i++)
        suma += cuadrado(i);            // main.c solo ve la declaración
    printf("%ld\n", suma);              // muestra 332833500
    return 0;
}
```

Tres formas de obtener el inlining pese a la división en archivos, comprobadas con [`objdump -d`](https://sourceware.org/binutils/docs/binutils/objdump.html) sobre el ejecutable final:

| Forma de compilar | ¿`call cuadrado` en `main`? | Principio |
|---|---|---|
| `cuadrado.c` y `main.c` compilados por separado (`-O2`) | Sí | Cada unidad se optimiza sola: la llamada se queda |
| `static inline int cuadrado(int x) { return x * x; }` escrito en `cuadrado.h` | No | El cuerpo se copia en cada unidad que incluye el [archivo de cabecera](/?c=langages&s=c&p=headers) |
| `-flto` en la compilación **y** en el enlazado | No | *Link-Time Optimization*: los `.o` conservan una forma intermedia del código, y el enlazado optimiza todo el programa de una vez |
| `-flto` olvidado solo para `main.c` | Sí | Una unidad compilada sin `-flto` solo contiene código máquina: nada que reoptimizar |

```bash
gcc -O2 -flto -c main.c -o main.o           # -flto al compilar CADA archivo
gcc -O2 -flto -c cuadrado.c -o cuadrado.o
gcc -O2 -flto main.o cuadrado.o -o prog     # ... y al enlazar
```

| Método | Ventaja | Inconveniente |
|---|---|---|
| Todo en un solo `.c` | Ninguna opción que recordar | Archivo largo, difícil de leer |
| `static inline` en un archivo de cabecera | Funciona con cualquier compilación | Reservado a funciones pequeñas; una copia por unidad que la usa |
| `-flto` | Inlining entre todos los archivos, sin cambiar el código | Enlazado más lento; olvidarlo en un solo archivo pasa desapercibido |

> **Trampa:** una función ordinaria (sin `static`) definida en un archivo de cabecera incluido por dos `.c` provoca el error `multiple definition of 'cuadrado'` en el enlazado: cada unidad contiene una copia pública. E `inline` solo, sin `static`, sigue en C reglas sutiles (hace falta además una definición no `inline` en un único `.c`): `static inline` es la forma segura.

**Lo que cambia en la práctica.** El [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) del proyecto del que proceden estas mediciones pasó de un único archivo de 1 424 líneas a 7 archivos `.c`. Las funciones llamadas en cada paso del cálculo (cientos de millones de veces por cuadrícula) se quedaron todas en la misma unidad, o pasaron a `static inline` en los archivos de cabecera. Resultado: ninguna ralentización (incluso un 2,7 % más rápido), y `-flto` no aportó nada más (+0,9 %). Dividir un programa no cuesta nada, siempre que se mantenga junto lo que se llama muy a menudo: [medir](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) antes y después de la división.

## La optimización guiada por perfil (PGO)

Al compilar, `gcc` no sabe qué ramas de un `if` se tomarán más a menudo: lo adivina. La **optimización guiada por perfil** (*Profile-Guided Optimization*, PGO) sustituye esa suposición por recuentos reales, medidos en una ejecución de prueba, para ordenar mejor el código: los caminos frecuentes de una pieza, los caminos raros apartados.

```text
rama.c --[gcc -fprofile-generate]--> rama (instrumentado, cuenta sus pasos)
rama   --[ejecución de entrenamiento]--> rama.gcda (el perfil: los recuentos)
rama.c + rama.gcda --[gcc -fprofile-use]--> rama (optimizado según los recuentos)
```

```c
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    int n = argc > 1 ? atoi(argv[1]) : 1000, pequenos = 0, grandes = 0;
    for (int i = 0; i < n; i++) {
        if (i % 100 == 0) grandes++;    // rama rara: 1 vez de cada 100
        else pequenos++;                // rama frecuente
    }
    printf("%d pequeños, %d grandes\n", pequenos, grandes);
    return 0;
}
```

```bash
gcc -O2 -fprofile-generate rama.c -o rama   # 1. versión instrumentada
./rama 1000000                              # 2. entrenamiento: escribe rama.gcda al salir
gcc -O2 -fprofile-use rama.c -o rama        # 3. recompilación según el perfil
```

Las opciones se describen en la [documentación de GCC](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html). En el solucionador SAT citado arriba, la PGO ganó un 3,4 %, con exactamente el mismo trabajo realizado (mismos contadores de cálculo): una ganancia modesta, pero gratuita una vez automatizada en un [Makefile](/?c=langages&s=c&p=makefiles).

| Trampa | Lo que pasa | Solución |
|---|---|---|
| Nombre de salida distinto entre las etapas 1 y 3 (`-o rama_instr`, luego `-o rama`) | El perfil se llama `rama_instr-rama.gcda`, la etapa 3 busca `rama.gcda`: un simple **aviso** `profile count data file not found`, y el programa se compila **sin** PGO | Mismo nombre de salida (o mismos archivos `.o`) en las dos etapas, y comprobar la ausencia de ese aviso |
| Fuentes modificadas después del entrenamiento | Error `coverage-mismatch`: el perfil ya no corresponde al código | Rehacer las tres etapas tras cada modificación |
| Programa terminado por `_exit()`, matado por una señal, o proceso hijo que sale por `_exit()` | Ningún `.gcda` escrito: el perfil lo guarda la salida normal ([`exit()` o `return` en `main`](/?c=langages&s=c&p=exit-et-codes-de-retour)), que `_exit()` se salta | Entrenar con una ejecución que termine normalmente (en el solucionador: en un solo proceso, sin los [procesos hijos](/?c=langages&s=c&p=processus) del modo paralelo) |
| Entrenar con los mismos datos que la medición de velocidad | El programa se optimiza para la propia prueba: ganancia sobrestimada | Entrenar con entradas distintas de las de la medición |

## El canario de pila (`-fstack-protector`)

Un [desbordamiento de búfer](/?c=securite&s=securite-offensive&p=corruption-memoire#el-buffer-overflow-escribir-mas-alla-del-espacio-reservado) en la pila puede sobrescribir la dirección a la que la función debe volver. El **canario** es un valor secreto que el compilador coloca entre los arrays locales y esa dirección, y comprueba justo antes de volver: si ha cambiado, el programa se detiene en el acto (el nombre viene de los canarios que los mineros llevaban para detectar el gas antes de que fuera demasiado tarde).

```c
#include <stdio.h>
__attribute__((noinline)) static void copiar(const char *texto) {
    char bufer[8];                      // 8 bytes reservados en la pila
    for (int i = 0; texto[i]; i++)      // copia sin comprobar la longitud
        bufer[i] = texto[i];
    printf("copiado: %.8s\n", bufer);
}
int main(int argc, char **argv) {
    copiar(argc > 1 ? argv[1] : "corto");
    return 0;
}
```

Con un argumento de 40 caracteres (el búfer solo admite 8):

| Compilación | Salida | Código de salida |
|---|---|---|
| `gcc -O2` (ajuste por defecto de Ubuntu y Debian: `-fstack-protector-strong`) | `copiado: AAAAAAAA` y después `*** stack smashing detected ***: terminated` | 134: parada voluntaria ([señal](/?c=langages&s=c&p=signaux-unix#las-senales-comunes) `SIGABRT`, 128 + 6) |
| `gcc -O2 -fno-stack-protector` | `copiado: AAAAAAAA` y después un fallo | 139: violación de segmento (`SIGSEGV`, 128 + 11), más tarde y de forma menos clara |

El coste: tres instrucciones en cada función que tiene un array local (`objdump -d` muestra la lectura del valor secreto, `mov %fs:0x28`, su comparación al volver y la llamada a `__stack_chk_fail`). En el solucionador SAT, `-fno-stack-protector` ganó alrededor de un 1 %.

> **Trampa:** con `strcpy()` en lugar del bucle, el mensaje pasa a ser `*** buffer overflow detected ***`, incluso con `-fno-stack-protector`. Es **otra** protección de Ubuntu, [`_FORTIFY_SOURCE`](https://man7.org/linux/man-pages/man7/feature_test_macros.7.html), que en `-O2` sustituye las funciones de copia conocidas por versiones comprobadas. Quitar el canario no quita por tanto todas las protecciones, y una copia escrita a mano solo la cubre el canario.

| Situación | Canario |
|---|---|
| Programa que lee datos externos (archivos recibidos, red, entrada de un usuario) | Mantenerlo, siempre |
| Programa de cálculo con entradas ya validadas, en el que cada punto porcentual cuenta | Quitarlo es aceptable, **después** de medir la ganancia |

## Errores de compilación frente a errores de enlazado

Saber en qué etapa se produce un error ayuda a diagnosticarlo:

| Mensaje típico | Etapa implicada | Causa frecuente |
|---|---|---|
| `error: expected ';' before...` | Compilación | Error de sintaxis en el código fuente |
| `fatal error: xxx.h: No such file or directory` | Preprocesador | Archivo de cabecera no encontrado (véase [Los archivos de cabecera](/?c=langages-de-programmation&s=c&p=headers)) |
| `undefined reference to 'mi_funcion'` | Enlazado | Función declarada pero nunca definida/enlazada (archivo `.o` o biblioteca faltante) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un programa en C pasa por 4 etapas antes de ejecutarse: preprocesador → compilación (ensamblador) → ensamblado (código máquina, `.o`) → enlazado (ejecutable final). El nivel de optimización (`-O0` a `-O3`, `-Os`) se ajusta en la etapa de compilación. El compilador solo ve una unidad de traducción a la vez: sin `static inline` ni `-flto`, una función de otro `.c` nunca se inlinea. La PGO optimiza según una ejecución de prueba; el canario de pila detiene un programa cuyo búfer local se ha desbordado. |
| **Herramientas utilizables** | `gcc -E`/`-S`/`-c` para observar cada etapa por separado; `-O0` a `-O3`/`-Os` para ajustar el nivel de optimización; `-march=native` para el procesador de la máquina; `-pthread` para un programa con hilos; `static inline` y `-flto` para el inlining entre archivos; `-fprofile-generate`/`-fprofile-use` para la PGO; `objdump -d` para comprobar el código generado. |
| **Trampas a evitar** | Confundir un error de compilación (sintaxis) con un error de enlazado (`undefined reference`, función nunca enlazada): el mensaje indica la etapa implicada. Un aviso invisible en `-O0` (oculto por dos funciones no inlineadas) puede aparecer, o incluso bloquear la compilación con `-Werror`, ya desde `-O2`. Olvidar `-flto` en un solo archivo, o cambiar el nombre de salida entre las dos etapas de la PGO: la optimización desaparece sin ningún error. Quitar el canario de un programa que lee datos externos. |
| **Buenas prácticas** | Compilar cada archivo `.c` en `.o` por separado en un proyecto con varios archivos, para enlazar únicamente lo que ha cambiado en lugar de recompilarlo todo. Probar la compilación en el nivel de optimización realmente usado en producción, no solo en `-O0`. Mantener en una misma unidad (o en `static inline`) las funciones llamadas muy a menudo, y medir antes y después de cualquier división o cambio de opción. |
