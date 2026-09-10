---
order: 7
---

# Dividir un proyecto en un grafo de dependencias

Una vez lleno un [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) de tareas, queda una pregunta abierta antes incluso de [estimarlas](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation): ¿en qué orden hacerlas? Una tarea no siempre puede empezar en cualquier momento: a veces depende del resultado de otra.

## El grafo de dependencias (DAG)

Un **grafo dirigido acíclico** (*DAG*, *Directed Acyclic Graph*) modela estas dependencias: cada tarea es un nodo, y una flecha conecta una tarea con la que debe terminarse antes de que pueda empezar. Es exactamente la estructura que una herramienta como `make` construye a partir de un Makefile, para saber qué archivos compilar antes que otros, y cuáles pueden compilarse en paralelo.

Ordenar este grafo para deducir un orden de ejecución válido se llama un **orden topológico** (*topological sort*): un orden en el que cada tarea aparece después de todas aquellas de las que depende.

## No todas las tareas están en una sola línea

El error más frecuente al construir este grafo a mano es imaginar una única lista lineal ("primero A, luego B, luego C...") cuando en realidad algunas tareas no tienen ninguna dependencia entre sí.

```text
Modelo en una sola linea (a menudo incorrecto):
A -> B -> C -> D

Modelo en grafo (a menudo mas cercano a la realidad):
A -> C -> D
B -> C
(A y B son independientes, ejecutables en paralelo;
 solo convergen a nivel de C)
```

Dos tareas sin dependencia entre sí pueden realizarse en cualquier orden, incluso en paralelo si varias personas trabajan en ellas: considerarlas erróneamente como secuenciales infla artificialmente la duración percibida del proyecto y oculta el trabajo que realmente se podría paralelizar.

Para identificar estas ramas, la pregunta que hay que hacerse para cada tarea es: *"¿qué debe existir ya o estar terminado antes de que pueda siquiera empezar esta tarea?"*, en lugar de *"¿qué prefiero hacer antes?"* (una cuestión de preferencia, no de dependencia real).

> **Trampa:** confundir una dependencia real (la tarea B necesita el resultado producido por A para funcionar) con un simple orden de preferencia (hacer A antes que B "porque parece más lógico"). Solo la primera justifica bloquear B mientras A no esté terminada.
>
> **Buena práctica:** identificar explícitamente los puntos de convergencia, las tareas que necesitan el resultado de varias ramas independientes a la vez. Son ellas las que indican dónde deben reunirse las ramas llevadas en paralelo.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un grafo dirigido acíclico (DAG) modela las dependencias reales entre tareas; un orden topológico deduce a partir de él un orden de ejecución válido. Varias tareas independientes forman ramas paralelas que solo convergen más tarde en una tarea común. |
| **Herramientas utilizables** | El DAG y el orden topológico, la misma estructura que usa `make` para planificar una compilación. |
| **Trampas a evitar** | Modelar todo el proyecto como una sola línea secuencial cuando algunas tareas son independientes. Confundir una dependencia real con un simple orden de preferencia. |
| **Buenas prácticas** | Preguntarse, por tarea, qué debe estar realmente terminado antes de poder empezar. Identificar explícitamente los puntos de convergencia entre ramas paralelas. |
