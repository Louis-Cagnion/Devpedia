---
order: 21
---

# Los subprocesos (pthread)

Un **hilo** (*thread*, hilo de ejecución) es, como un proceso, una secuencia de instrucciones que se ejecuta de forma independiente, pero a diferencia de [`fork()`](/?c=langages-de-programmation&s=c&p=processus), varios hilos de un mismo programa **comparten la misma memoria**. Es más ligero de crear que un proceso, pero introduce un riesgo nuevo: dos hilos pueden modificar el mismo dato al mismo tiempo.

## Crear y esperar un hilo

La biblioteca POSIX threads (`pthread`) proporciona las funciones básicas; la compilación requiere la opción `-pthread` ([`gcc`](https://gcc.gnu.org) `-pthread main.c -o programa`). La norma **POSIX** se presenta en el capítulo [Escribir un script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

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

## Evitar un deadlock mediante un orden total sobre los candados

El **problema de la cena de los filósofos** (planteado por Dijkstra) ilustra bien este riesgo: N filósofos alrededor de una mesa comparten N tenedores (uno entre cada par de vecinos) y cada uno necesita sostener dos (izquierdo y derecho) para comer. Si todos toman su tenedor izquierdo al mismo tiempo, cada uno espera indefinidamente el tenedor derecho que sostiene su vecino: un deadlock generalizado. Es un caso particular de un problema más general: dos hilos necesitan cada uno **dos** mutex para continuar, pero los bloquean en un orden distinto.

```text
Hilo A:  lock(mutex1) -> espera mutex2 (retenido por B)
Hilo B:  lock(mutex2) -> espera mutex1 (retenido por A)
-> interbloqueo: ni A ni B puede avanzar nunca
```

La solución más simple: imponer un **orden total** arbitrario pero idéntico para todos los hilos sobre el conjunto de candados a adquirir (por ejemplo, comparar la dirección de memoria de los dos mutex y bloquear siempre primero el de dirección más baja):

```c
if (mutex_a < mutex_b) {
    pthread_mutex_lock(mutex_a);
    pthread_mutex_lock(mutex_b);
} else {
    pthread_mutex_lock(mutex_b);
    pthread_mutex_lock(mutex_a);
}
```

No importa qué hilo llegue primero ni en qué orden lógico le sean útiles los dos candados: todos los hilos del programa siguen la misma regla (aquí, dirección más baja primero), así que nunca puede formarse un ciclo de espera circular.

> **Buena práctica:** en cuanto una función deba bloquear varios mutex a la vez, definir una única regla de orden y respetarla en todo el programa, en lugar de bloquear en el orden en que los candados aparecen mencionados localmente en el código.

## Repartir un renderizado entre hilos: dividir la pantalla en bandas

Un caso concreto de paralelismo limitado por el cálculo (a diferencia de un paralelismo que sobre todo espera una red o un disco): repartir un [renderizado por raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) entre varios hilos, cada uno calculando una **banda vertical** de la pantalla en lugar de un pool de tareas genéricas:

```text
Pantalla dividida en N bandas verticales (N = número de hilos):
  Hilo 1: columnas 0 a 199
  Hilo 2: columnas 200 a 399
  Hilo 3: columnas 400 a 599
  Hilo 4: columnas 600 a 799 (recoge el resto si la división no es exacta)
```

En lugar de crear y destruir hilos en cada frame (un coste innecesario), cada hilo se crea **una sola vez** y permanece activo durante todo el programa, reejecutando su banda en cada nuevo frame:

```c
pthread_mutex_t candado_frame = PTHREAD_MUTEX_INITIALIZER;
int siguiente_frame_lista = 0;

void *calcularBanda(void *argumento)
{
    while (1) {
        pthread_mutex_lock(&candado_frame);
        while (!siguiente_frame_lista) {
            pthread_mutex_unlock(&candado_frame);
            usleep(1); // espera activa: ver Medir el tiempo y esperar con precisión
            pthread_mutex_lock(&candado_frame);
        }
        pthread_mutex_unlock(&candado_frame);

        // ... calcular la banda de columnas asignada a este hilo ...
    }
}
```

> **Trampa:** sincronizar el hilo principal y los hilos de renderizado con una espera activa (`usleep()` en bucle sobre un indicador compartido) en lugar de una primitiva dedicada. Funciona, pero desperdicia tiempo de procesador comprobando el indicador en bucle en lugar de dormir hasta que realmente cambie.
>
> **Buena práctica:** preferir una **variable de condición** (`pthread_cond_t`, `pthread_cond_wait()`/`pthread_cond_signal()`) a una espera activa cuando la herramienta esté disponible: el hilo en espera queda entonces realmente suspendido, sin consumir procesador, y se despierta solo cuando el estado cambia.

Este patrón (repartir un cálculo pesado entre hilos persistentes, cada uno sobre una porción fija de los datos) difiere del [paralelismo por workers independientes](/?c=qualite-performance-et-outils&s=performance&p=parallelisme) ya visto para tareas de red/disco: aquí, la restricción es el procesador, los hilos comparten la misma memoria (el frame en construcción), y el número útil de hilos está limitado por el número de núcleos disponibles en lugar de por objetivos externos independientes.

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
| **Herramientas utilizables** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`. Repartir un cálculo pesado (un renderizado) en bandas fijas entre hilos persistentes; `pthread_cond_t` en lugar de una espera activa para sincronizarlos. |
| **Trampas a evitar** | Modificar una variable compartida sin protección (*race condition*); olvidar desbloquear un mutex (*deadlock* si otro hilo espera indefinidamente); bloquear varios mutex en un orden distinto según el hilo. |
| **Buenas prácticas** | Proteger todo dato compartido entre hilos con un mutex, incluso para una operación que parece simple (`contador++` no es atómica). Bloquear varios mutex siempre en el mismo orden (ej. por dirección de memoria) para evitar cualquier deadlock. |
