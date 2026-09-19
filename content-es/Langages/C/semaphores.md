---
order: 26
---

# Los semáforos POSIX

Un **semáforo** es un contador protegido, compartido entre hilos o entre procesos, que limita el número de accesos simultáneos a un recurso. A diferencia de un [mutex](/?c=langages-de-programmation&s=c&p=threads) (candado binario, limitado a un mismo proceso/mismos hilos), un semáforo cuenta de 0 a N y puede compartirse entre procesos distintos.

## `sem_wait()`/`sem_post()`: decrementar e incrementar

- `sem_wait()` decrementa el contador; si el contador ya está a 0, **bloquea** hasta que otro hilo/proceso lo libere.
- `sem_post()` incrementa el contador, despertando potencialmente a un hilo/proceso en espera.

```c
#include <semaphore.h>

sem_t semaforo;

// contador inicial a 3 (0 = compartido entre hilos del mismo proceso)
sem_init(&semaforo, 0, 3);

sem_wait(&semaforo); // decrementa; bloquea si ya está a 0
// ... sección que no debe superar 3 accesos simultáneos ...
sem_post(&semaforo); // incrementa, despierta a un eventual hilo en espera
```

## Un semáforo con nombre, compartido entre procesos (`sem_open`)

A diferencia de `sem_init()` (limitado a un mismo proceso), `sem_open()` crea o abre un semáforo **con nombre**, visible por cualquier proceso que reabra el mismo nombre:

```c
#include <semaphore.h>
#include <fcntl.h>

sem_t *tenedores = sem_open("/tenedores", O_CREAT, 0644, 5); // 5 tenedores disponibles

sem_wait(tenedores); // toma un tenedor (bloquea si los 5 ya están tomados)
// ... usar el recurso compartido ...
sem_post(tenedores); // devuelve el tenedor

sem_close(tenedores);     // libera el descriptor local a este proceso
// destruye el objeto con nombre del sistema (una sola vez, al final del programa)
sem_unlink("/tenedores");
```

| Función | Rol |
|---|---|
| `sem_open()` | Crea o abre un semáforo con nombre, compartido entre procesos |
| `sem_wait()` | Decrementa el contador, bloquea si ya está a 0 |
| `sem_post()` | Incrementa el contador, despierta a un hilo/proceso en espera |
| `sem_close()` | Libera el descriptor local a este proceso (el semáforo con nombre persiste) |
| `sem_unlink()` | Destruye definitivamente el objeto con nombre del sistema |

> **Trampa:** llamar a `sem_unlink()` desde cada proceso que usa el semáforo. Un semáforo con nombre debe destruirse una sola vez (normalmente el último proceso en detenerse, o un proceso dedicado), si no un proceso aún activo termina usando un nombre que ya no existe.
>
> **Buena práctica:** usar un semáforo contado (`sem_open` con un valor inicial > 1) para representar un pool de recursos limitado (ej. 5 tenedores compartidos entre varios procesos); un semáforo inicializado a 1 sirve como candado de exclusión mutua entre procesos, equivalente a un mutex pero utilizable entre procesos separados (donde un mutex `pthread` clásico no lo es).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un semáforo es un contador protegido (0 a N) que limita el número de accesos simultáneos a un recurso, utilizable entre hilos (`sem_init`) o entre procesos separados vía un nombre compartido (`sem_open`). |
| **Herramientas utilizables** | `sem_wait()`/`sem_post()` para decrementar/incrementar; `sem_open()`/`sem_close()`/`sem_unlink()` para un semáforo con nombre compartido entre procesos. |
| **Trampas a evitar** | Llamar a `sem_unlink()` desde varios procesos, cuando el objeto con nombre solo debe destruirse una vez. |
| **Buenas prácticas** | Un semáforo contado para un pool de recursos limitado; un semáforo a 1 como candado de exclusión mutua entre procesos. |
