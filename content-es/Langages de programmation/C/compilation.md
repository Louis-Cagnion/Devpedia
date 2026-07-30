---
order: 7
---

# El proceso de compilación

A diferencia de PHP o JavaScript, que se interpretan directamente durante la ejecución, un programa en C debe **traducirse a código máquina** antes de poder ejecutarse. Esta traducción se lleva a cabo en cuatro etapas distintas, que suelen quedar ocultas tras un único comando (`gcc main.c -o programa`), pero que conviene saber distinguir para comprender ciertos errores.

## Las cuatro etapas

```
main.c --[1. préprocesseur]--> main.i --[2. compilation]--> main.s --[3. assemblage]--> main.o --[4. édition de liens]--> programme
```

### 1. El preprocesador

Aborda todo lo que comienza por `#` **antes** de que el compilador vea el código: sustituye los `#include` por el contenido real del archivo incluido, sustituye las macros `#define` y resuelve los `#ifdef` / `#ifndef`. El resultado es un único archivo fuente «aplanado», sin ninguna directiva `#`.

```bash
gcc -E main.c -o main.i
```

### 2. La compilación propiamente dicha

Traduce el código fuente (C) a **ensamblador**, un lenguaje que sigue siendo legible para los humanos, pero muy cercano a las instrucciones del procesador.

```bash
gcc -S main.i -o main.s
```

### 3. El ensamblaje

Traduce el ensamblador a **código máquina binario**, agrupado en un archivo objeto (`.o`). Este archivo ya contiene instrucciones ejecutables, pero aún no es un programa completo: las llamadas a funciones externas (como `printf`) aún no se han resuelto.

```bash
gcc -c main.s -o main.o
```

### 4. La creación de enlaces (*linking*)

Combina uno o varios archivos «`.o`» entre sí y resuelve las referencias a funciones definidas en otros lugares (en otros archivos «`.o`» o en bibliotecas; véase el capítulo correspondiente) para generar un ejecutable final completo.

```bash
gcc main.o -o programa
```

## ¿Por qué separar la compilación y la vinculación?

Un proyecto con varios archivos fuente puede compilar cada `.c` en `.o` de forma independiente y, a continuación, enlazar (*link*) únicamente los archivos que hayan cambiado, lo cual es más rápido que realizar una recompilación completa cada vez que se produce una modificación. Esto es precisamente lo que automatiza un **Makefile** (véase el capítulo dedicado a este tema):

```bash
gcc -c fichier1.c -o fichier1.o
gcc -c fichier2.c -o fichier2.o
gcc fichier1.o fichier2.o -o programa
```

## Errores de compilación frente a errores de enlace

Saber en qué fase se produce un error ayuda a diagnosticarlo:

| Mensaje típico | Paso afectado | Causa frecuente |
|---|---|---|
| `error: expected ';' before...` | Compilación | Error de sintaxis en el código fuente |
| `fatal error: xxx.h: No such file or directory` | Preprocesador | No se ha encontrado el archivo de cabecera (véase el capítulo sobre los headers) |
| `undefined reference to 'ma_fonction'` | Edición de enlaces | Función declarada pero nunca definida/enlazada (archivo «`.o`» o biblioteca que falta) |
