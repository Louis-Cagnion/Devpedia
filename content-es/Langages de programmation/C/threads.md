---
order: 16
---

# Los subprocesos (pthread)

Un **hilo** (thread) es, al igual que un proceso, una secuencia de instrucciones que se ejecuta de forma independiente; pero, a diferencia de un`fork()`o (véase el capítulo sobre procesos), varios hilos de un mismo programa **comparten la misma memoria**. Es más ligero de crear que un proceso, pero introduce un nuevo riesgo: dos hilos pueden modificar el mismo dato al mismo tiempo.

## Crear y esperar un hilo

La biblioteca POSIX threads (`pthread`) proporciona las funciones básicas; para la compilación es necesario utilizar la opción «`-pthread`» (`gcc -pthread main.c -o programa`).

```c
#include <pthread.h>
#include <stdio.h>

void *tache(void *argument)
{
    int *número = (int *)argument;
    printf("Thread : je reçois %d\n", *número);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int valor = 42;

    pthread_create(&thread, NULL, tache, &valor); // lance le thread, exécute "tache" en parallèle
    pthread_join(thread, NULL);                    // attend que ce thread se termine

    return 0;
}
```

- `pthread_create()` Toma como parámetros: un puntero al identificador del hilo que se va a rellenar, unos atributos (`NULL` = por defecto), la función que se va a ejecutar y el argumento que se le va a pasar (un único puntero `void *`, que se debe convertir al tipo real dentro de la función).
- `pthread_join()` bloquea la ejecución hasta que finalice el hilo en cuestión —equivalente a «`wait()`» para un proceso—.

## Memoria compartida: una ventaja y un peligro

A diferencia de dos procesos derivados de un «`fork()`» (con memorias separadas), dos subprocesos del mismo programa ven y modifican las **mismas variables globales**:

```c
#include <pthread.h>

int contador = 0; // partagé par tous les threads

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        contador++; // DANGER : plusieurs threads modifient la même variable en même temps
    }
    return NULL;
}
```

Si dos subprocesos ejecutan `incrementer()` en paralelo, el resultado final de `contador` es **impredecible**: `contador++` no es una única operación atómica a nivel del procesador (se descompone en leer, sumar y volver a escribir), y dos subprocesos pueden leer el mismo valor antes de que uno de ellos haya tenido tiempo de volver a escribirlo; en ese caso, uno de los dos incrementos se pierde de forma silenciosa. Este fenómeno se denomina **«condición** de **carrera**» (situación de competencia).

## Proteger datos compartidos con un mutex

Un **mutex** (*exclusión mutua*) garantiza que solo una sección de código a la vez pueda manipular un dato compartido: el primer hilo que llega a él lo **bloquea**, y los demás esperan a que lo **desbloquee**:

```c
#include <pthread.h>

int contador = 0;
pthread_mutex_t verrou = PTHREAD_MUTEX_INITIALIZER;

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&verrou);
        contador++;                    // une seule thread à la fois peut exécuter cette ligne
        pthread_mutex_unlock(&verrou);
    }
    return NULL;
}
```

> **Nota:** un mutex bloqueado y que nunca se desbloquea (por olvido de `pthread_mutex_unlock()`, o por `return` /excepción antes de llegar a ello) bloquea **definitivamente** todos los demás subprocesos que esperan ese bloqueo —un error clásico denominado **«deadlock» (interbloqueo)** que se produce cuando dos subprocesos se esperan mutuamente, cada uno reteniendo un bloqueo que el otro necesita.

## Subprocesos frente a procesos

| | Proceso (`fork`) | Hilo (`pthread`) |
|---|---|---|
| Memoria | Independiente (copia) | Compartida |
| Coste de creación | Más elevado | Más ligero |
| Comunicación entre unidades | Requiere un mecanismo explícito (tubo, memoria compartida...) | Directa (variables globales), pero requiere protección (mutex) |
| ¿Un fallo afecta al resto? | No — aislado | Sí — un hilo que falla puede corromper todo el proceso |
