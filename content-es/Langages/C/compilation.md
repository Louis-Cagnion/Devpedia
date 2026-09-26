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
| **Para recordar** | Un programa en C pasa por 4 etapas antes de ejecutarse: preprocesador → compilación (ensamblador) → ensamblado (código máquina, `.o`) → enlazado (ejecutable final). El nivel de optimización (`-O0` a `-O3`, `-Os`) se ajusta en la etapa de compilación. |
| **Herramientas utilizables** | `gcc -E`/`-S`/`-c` para observar cada etapa por separado; `-O0` a `-O3`/`-Os` para ajustar el nivel de optimización; `-march=native` para el procesador de la máquina; `-pthread` para un programa con hilos. |
| **Trampas a evitar** | Confundir un error de compilación (sintaxis) con un error de enlazado (`undefined reference`, función nunca enlazada): el mensaje indica la etapa implicada. Un aviso invisible en `-O0` (oculto por dos funciones no inlineadas) puede aparecer, o incluso bloquear la compilación con `-Werror`, ya desde `-O2`. |
| **Buenas prácticas** | Compilar cada archivo `.c` en `.o` por separado en un proyecto con varios archivos, para enlazar únicamente lo que ha cambiado en lugar de recompilarlo todo. Probar la compilación en el nivel de optimización realmente usado en producción, no solo en `-O0`. |
