---
order: 8
---

# La arquitectura ARM

Los capítulos anteriores de esta categoría se basan en x86-64, la arquitectura más habitual en PC. **ARM** es una arquitectura distinta, hoy omnipresente en otros ámbitos: la práctica totalidad de los smartphones, los chips Apple Silicon (M1 y siguientes) en Mac, buena parte de los dispositivos conectados. Entender sus diferencias es necesario en cuanto el objetivo deja de ser un PC clásico.

## RISC frente a CISC

| | x86 (CISC) | ARM (RISC) |
|---|---|---|
| Filosofía | *Complex Instruction Set Computer*: instrucciones ricas, que a veces realizan varias operaciones a la vez | *Reduced Instruction Set Computer*: instrucciones deliberadamente simples y uniformes |
| Consecuencia | Un programa puede caber en menos instrucciones, cada una más compleja de decodificar para el procesador | Un programa necesita más instrucciones, pero cada una se ejecuta más rápido y de forma más previsible |

Esta diferencia de filosofía explica en gran parte por qué ARM domina en dispositivos con batería (móvil, embebido): unas instrucciones más simples consumen menos energía por instrucción ejecutada.

## Registros con otro nombre, mismos papeles

Los registros vistos en [Cómo se ejecuta realmente un programa](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) también existen en ARM, con otros nombres:

| Papel | x86-64 | ARM (64 bits) |
|---|---|---|
| Siguiente instrucción | `rip` | `pc` |
| Cima de la pila | `rsp` | `sp` |
| Dirección de retorno | Guardada en la pila por `call` | Guardada directamente en un registro dedicado, `lr` (*link register*), antes de copiarse en la pila si hace falta |
| Registros generales | `rax`, `rbx`, `rcx`... | `x0` a `x30` |

La diferencia más notable para la explotación: en x86, la dirección de retorno va directamente a la pila en el momento de la llamada (`call`), quedando así directamente expuesta a un [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) vecino. En ARM, pasa primero por `lr`, un registro separado de la pila: un desbordamiento de búfer simple no la alcanza, por tanto, de forma automática, lo que cambia la manera de construir una explotación, sin alterar el principio de fondo.

## Por qué importa cada vez más

Un binario compilado para x86 no se ejecuta tal cual en ARM (y viceversa): cada arquitectura tiene su propio juego de instrucciones, y por tanto su propio ensamblador que leer durante una [ingeniería inversa](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie). Con el peso creciente de ARM (móvil, Apple Silicon, cloud de bajo coste), un objetivo real tiene hoy una probabilidad significativa de no ser x86 en absoluto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | ARM (RISC, instrucciones simples y uniformes) difiere de x86 (CISC, instrucciones ricas) y domina en dispositivos con batería. Los registros cambian de nombre (`pc`/`sp`/`lr`/`x0`-`x30` frente a `rip`/`rsp`/`rax`...) y la dirección de retorno pasa por un registro dedicado (`lr`) en lugar de ir directamente a la pila. |
| **Herramientas utilizables** | Ghidra y `gdb` (capítulo de ingeniería inversa) admiten ambos ARM, con el mismo flujo de trabajo que en x86. |
| **Errores a evitar** | Suponer que una técnica de explotación de x86 funciona tal cual en ARM sin tener en cuenta `lr`. |
| **Buenas prácticas** | Identificar la arquitectura objetivo antes de cualquier análisis (`file` sobre un binario Linux lo indica directamente), para elegir de entrada la referencia de ensamblador correcta. |
