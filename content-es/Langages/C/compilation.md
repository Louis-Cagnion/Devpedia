---
order: 8
---

# El proceso de compilación

A diferencia de PHP o JavaScript, que se interpretan directamente en la ejecución, un programa en C debe **traducirse a código máquina** antes de poder ejecutarse. Esta traducción se desarrolla en cuatro etapas distintas, generalmente invisibles detrás de un único comando ([`gcc`](https://gcc.gnu.org) `main.c -o programa`), pero que conviene saber distinguir para comprender ciertos errores.

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
| **Para recordar** | Un programa en C pasa por 4 etapas antes de ejecutarse: preprocesador → compilación (ensamblador) → ensamblado (código máquina, `.o`) → enlazado (ejecutable final). |
| **Herramientas utilizables** | `gcc -E`/`-S`/`-c` para observar cada etapa por separado. |
| **Trampas a evitar** | Confundir un error de compilación (sintaxis) con un error de enlazado (`undefined reference`, función nunca enlazada): el mensaje indica la etapa implicada. |
| **Buenas prácticas** | Compilar cada archivo `.c` en `.o` por separado en un proyecto con varios archivos, para enlazar únicamente lo que ha cambiado en lugar de recompilarlo todo. |
