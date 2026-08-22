---
order: 18
---

# Los subprocesos (pthread)

Un **hilo** (*thread*, hilo de ejecución) es, como un proceso, una secuencia de instrucciones que se ejecuta de forma independiente, pero a diferencia de [`fork()`](/?c=langages-de-programmation&s=c&p=processus), varios hilos de un mismo programa **comparten la misma memoria**. Es más ligero de crear que un proceso, pero introduce un riesgo nuevo: dos hilos pueden modificar el mismo dato al mismo tiempo.

## Crear y esperar un hilo

La biblioteca POSIX threads (`pthread`) proporciona las funciones básicas; la compilación requiere la opción `-pthread` ([`gcc`](https://gcc.gnu.org) `-pthread main.c -o programa`). La norma **POSIX** se presenta en el capítulo [Escribir un script](/?c=shells&s=bash&p=scripts-et-shebang) de Bash.

```c
#include <pthread.h>
#include <stdio.h>

void *tarea(void *argumento)
{
    int *numero = (int *)argumento;
    printf("Hilo: recibo %d\n", *numero);
    return NULL;
}

int main(void)
{
    pthread_t hilo;
    int valor = 42;

    pthread_create(&hilo, NULL, tarea, &valor);  // lanza el hilo, ejecuta "tarea" en paralelo
    pthread_join(hilo, NULL);                    // espera a que este hilo termine

    return 0;
}
```

- `pthread_create()` toma: un puntero al identificador de hilo que se debe rellenar, unos atributos (`NULL` = por defecto), la función que se debe ejecutar, y el argumento que se le pasa (un único puntero `void *`, que se convierte al tipo real dentro de la función).
- `pthread_join()` bloquea la ejecución hasta que el hilo indicado termine: equivalente a `wait()` para un proceso.

## Memoria compartida: una ventaja y un peligro

A diferencia de dos procesos surgidos de un `fork()` (memorias separadas), dos hilos del mismo programa ven y modifican las **mismas variables globales**:

```c
#include <pthread.h>

int contador = 0; // compartido por todos los hilos

void *incrementar(void *argumento)
{
    for (int i = 0; i < 1000000; i++) {
        contador++; // PELIGRO: varios hilos modifican la misma variable al mismo tiempo
    }
    return NULL;
}
```

Si dos hilos ejecutan `incrementar()` en paralelo, el resultado final de `contador` es **impredecible**: `contador++` no es una única operación atómica a nivel del procesador (se descompone en leer, sumar, reescribir), y dos hilos pueden leer el mismo valor antes de que uno de los dos haya tenido tiempo de reescribirlo: uno de los dos incrementos se pierde entonces de forma silenciosa. Este fenómeno se llama **race condition** (situación de competencia).

## Proteger un dato compartido con un mutex

Un **mutex** (*mutual exclusion*) garantiza que una sola sección de código a la vez pueda manipular un dato compartido: el primer hilo que llega lo **bloquea**, los demás esperan a que lo **desbloquee**:

```c
#include <pthread.h>

int contador = 0;
pthread_mutex_t candado = PTHREAD_MUTEX_INITIALIZER;

void *incrementar(void *argumento)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&candado);
        contador++;                    // un solo hilo a la vez puede ejecutar esta linea
        pthread_mutex_unlock(&candado);
    }
    return NULL;
}
```

> **Nota:** un mutex bloqueado y nunca desbloqueado (olvido de `pthread_mutex_unlock()`, o `return`/excepción antes de llegar a él) bloquea **definitivamente** a todos los demás hilos que esperan ese candado: un error clásico llamado **deadlock**, que ocurre cuando dos hilos se esperan mutuamente, cada uno reteniendo un candado que el otro necesita.

## Hilos frente a procesos

| | Proceso (`fork`) | Hilo (`pthread`) |
|---|---|---|
| Memoria | Separada (copia) | Compartida |
| Coste de creación | Más elevado | Más ligero |
| Comunicación entre unidades | Requiere un mecanismo explícito (tubería, memoria compartida...) | Directa (variables globales), pero requiere protección (mutex) |
| ¿Un fallo afecta a los demás? | No (aislado) | Sí (un hilo que falla puede corromper todo el proceso) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un hilo comparte la memoria con los demás hilos del mismo programa (a diferencia de un proceso surgido de `fork()`), es más ligero, pero expone a *race conditions* sobre los datos compartidos. |
| **Herramientas utilizables** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`. |
| **Trampas a evitar** | Modificar una variable compartida sin protección (*race condition*); olvidar desbloquear un mutex (*deadlock* si otro hilo espera indefinidamente). |
| **Buenas prácticas** | Proteger todo dato compartido entre hilos con un mutex, incluso para una operación que parece simple (`contador++` no es atómica). |
