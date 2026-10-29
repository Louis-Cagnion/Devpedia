---
order: 29
---

# Llamada al sistema interrumpida por una señal (EINTR)

Una **llamada al sistema** es una petición hecha al núcleo (el corazón del sistema operativo) para una operación que el programa no tiene derecho a hacer por sí mismo: leer un archivo, esperar a un proceso hijo, dormir el programa (véase [las llamadas al sistema y los descriptores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)). Algunas de estas llamadas son **bloqueantes**: no devuelven el control hasta que llega lo que esperan, lo que puede durar segundos o incluso para siempre. ¿Qué ocurre si, durante esa espera, llega una **señal** (una notificación enviada a un proceso por el sistema o por otro proceso, véase [las señales UNIX](/?c=langages&s=c&p=signaux-unix))? La llamada regresa anunciando un fallo que no lo es: `EINTR`. Este capítulo explica qué significa, cómo protegerse de ello y por qué las funciones de `<stdio.h>` no resuelven el problema por usted.

Supone conocidas las señales y su [handler](/?c=langages&s=c&p=signaux-unix) (la función que el núcleo llama al llegar la señal), [`signal()` y `sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-un-handler-enriquecido-con-siginfo-t), [`errno`](/?c=langages&s=c&p=appels-systeme-et-descripteurs#senalar-un-error-errno) (la variable donde la llamada deposita el código de su fallo) y el [descriptor de archivo](/?c=langages&s=c&p=appels-systeme-et-descripteurs#el-descriptor-de-archivo-una-simple-entrada-en-una-tabla) (un entero que designa un recurso abierto: archivo, tubería, terminal...). Todas las observaciones se hicieron bajo Linux con la biblioteca C del proyecto GNU (**glibc**, la biblioteca estándar del lenguaje C que incluyen la mayoría de las distribuciones Linux).

## El escenario: una llamada que espera

Estas son algunas llamadas que pueden esperar mucho tiempo.

| Llamada | Lo que espera |
|---|---|
| `read` | Bytes que leer de un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), una tubería (definida más abajo) o una conexión de red |
| `write` | Espacio en una tubería o en una conexión cuyo **búfer** (la zona de memoria de espera) está lleno |
| `accept` | Que un cliente (programa que pide un servicio) se conecte a un servidor (programa que lo ofrece, véase [los sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)) |
| `waitpid` | Que un proceso hijo termine (véase [la gestión de procesos](/?c=langages&s=c&p=processus)) |
| `sem_wait` | Que un semáforo (un contador que regula el acceso a un recurso) pase a ser positivo (véase [los semáforos](/?c=langages&s=c&p=semaphores)) |
| `nanosleep` | Que transcurra una duración |
| `poll`, `select` | Que al menos un descriptor esté listo, o que venza un plazo |

Una **tubería** (*pipe*) es un canal de sentido único: lo que un proceso escribe en un extremo, otro lo lee en el otro extremo. Eso es lo que fabrica el `|` de la shell (véase [la arquitectura de una shell](/?c=langages&s=bash&p=architecture-dun-shell)). Si hay un handler instalado para una señal y esa señal llega durante la espera, el núcleo interrumpe la espera, ejecuta el handler, y entonces la llamada regresa con `-1` y `errno` igual a `EINTR` (del inglés *interrupted*, «interrumpido»).

```text
Tiempo ----------------------------------------------------------------->

programa  :  read() ........ espera ........ [handler]      ... read() devuelve -1
                                   ^                              errno = EINTR
núcleo    :                        |
                          llega la señal (aquí SIGALRM)
```

Nada ha fallado: la llamada simplemente no pudo llegar hasta el final. Los datos no se han perdido, basta con volver a empezar. Pero todo depende de lo que el programa haya instalado para la señal:

| Situación de la señal | Lo que le ocurre a la llamada bloqueada |
|---|---|
| Comportamiento por defecto que mata el proceso (`SIGALRM`, `SIGTERM`...) | El proceso muere, ya no hay llamada que interrumpir |
| Señal ignorada (`SIG_IGN`) | Nada ocurre, la llamada sigue esperando |
| Handler instalado, sin `SA_RESTART` | La llamada regresa con `-1` y `EINTR` |
| Handler instalado, con `SA_RESTART` | El núcleo relanza la llamada por sí solo (en la mayoría de las llamadas) |

Para provocar la interrupción sin escribir nada, los programas de este capítulo usan `alarm(1)`: el núcleo enviará la señal `SIGALRM` al proceso dentro de 1 segundo. Se lanzan con `(sleep 3; echo bonjour) | ./programa`: la shell ejecuta `sleep 3` (que espera 3 segundos), luego `echo bonjour` escribe «bonjour» en una tubería cuyo otro extremo lee `./programa`. Así, el programa espera durante 3 segundos, y la alarma suena al cabo de solo uno. También usan algunas funciones de instalación:

| Elemento | Función |
|---|---|
| `struct sigaction sa` | Estructura que describe lo que se quiere para una señal (handler, indicadores...) |
| `memset(&sa, 0, sizeof sa)` | Pone a cero todos los bytes de `sa`, para no heredar valores al azar |
| `sigemptyset(&sa.sa_mask)` | Prepara una lista vacía de señales que bloquear durante el handler |
| `sigaction(SIGALRM, &sa, NULL)` | Instala esta descripción para `SIGALRM` |
| `alarm(1)` | Pide al núcleo que envíe `SIGALRM` dentro de 1 segundo ([`alarm`](https://man7.org/linux/man-pages/man2/alarm.2.html)) |
| `ssize_t` | Entero con signo para un número de bytes: puede valer `-1` (`size_t` es su equivalente sin signo; `printf` los muestra con `%zd` y `%zu`) |
| `strerror(errno)` | Traduce el código de error `errno` a texto legible |

## La trampa: tomar EINTR por un error real

Un programa acostumbrado a comprobar «`-1` entonces error» se equivoca aquí (`stderr` es la salida de error del programa, el descriptor 2):

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void al_alarma(int sig)
{
    (void)sig;                          // solo nos interesa que nos hayan llamado
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[64];         // zona de memoria que recibirá los bytes leídos
    ssize_t          n;                 // bytes leídos, o -1 si la llamada falló

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // instala el handler, sin SA_RESTART
    alarm(1);                           // SIGALRM llegará dentro de 1 segundo
    n = read(STDIN_FILENO, bufer, sizeof bufer);   // espera sobre la entrada estándar
    if (n == -1) {                      // -1: la llamada no tuvo éxito
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduce errno a texto
        return 1;                       // el programa abandona sin motivo
    }
    printf("leídos %zd bytes\n", n);    // camino normal: han llegado bytes
    return 0;
}
```

```text
read: Interrupted system call
```

El programa se queja y sale cuando la tubería iba a recibir «bonjour» dos segundos después. La solución clásica es un **bucle de reintento**: mientras la llamada falle por una interrupción, se vuelve a llamar.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void al_alarma(int sig)
{
    (void)sig;                          // nada que hacer: la interrupción basta
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[64];         // zona de memoria que recibirá los bytes leídos
    ssize_t          n;                 // bytes leídos, o -1 si la llamada falló
    int              reintentos = 0;    // número de veces que hubo que reintentar read

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // instala el handler, sin SA_RESTART
    alarm(1);                           // SIGALRM llegará dentro de 1 segundo
    do {
        n = read(STDIN_FILENO, bufer, sizeof bufer);   // espera datos
        if (n == -1 && errno == EINTR)  // interrumpido por la señal, no un error real
            reintentos++;               // contamos la interrupción
    } while (n == -1 && errno == EINTR);   // y volvemos a llamar
    if (n == -1) {                      // aquí sí es un error real (descriptor cerrado...)
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduce errno a texto
        return 1;                       // abandono justificado
    }
    printf("leídos %zd bytes tras %d reintento(s)\n", n, reintentos);   // resultado final
    return 0;
}
```

```text
leídos 8 bytes tras 1 reintento(s)
```

El `-1` solo no dice nada: es `errno` el que distingue las causas. Solo `EINTR` se relanza.

| Valor de `errno` tras `-1` | Significado | Reacción |
|---|---|---|
| `EINTR` | Interrumpido por un handler de señal | Repetir la llamada |
| `EBADF` | El descriptor no está abierto | Error del programa: corregir |
| `EIO` | Error de hardware de entrada-salida | Señalar y abandonar |

> **Trampa:** reintentar ante cualquier `-1`. Un error real (`EBADF`) haría girar el bucle sin fin, a toda velocidad.

## `SA_RESTART`: pedir al núcleo que reintente

Un **indicador** (*flag*) es una opción representada por un bit de un entero, que se combina con las demás mediante el O binario `|` (véase [los operadores binarios](/?c=langages&s=c&p=operateurs-binaires)). `sigaction()` acepta en `sa_flags` el indicador `SA_RESTART` (del inglés «restart», «reiniciar»): pide al núcleo que relance por sí mismo las llamadas interrumpidas por esa señal. El handler se ejecuta igualmente, pero el programa ya no ve ningún `EINTR`.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_alarmas = 0;   // contador modificado por el handler

static void al_alarma(int sig)
{
    (void)sig;                          // el número de la señal no nos sirve
    g_alarmas++;                        // única acción: contar las llegadas
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[64];         // zona de memoria que recibirá los bytes leídos
    ssize_t          n;                 // bytes leídos, o -1 si la llamada falló

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sa.sa_flags = SA_RESTART;           // pide al núcleo que relance read por sí solo
    sigaction(SIGALRM, &sa, NULL);      // instala el handler
    alarm(1);                           // SIGALRM llegará dentro de 1 segundo
    n = read(STDIN_FILENO, bufer, sizeof bufer);   // una sola vez, sin bucle
    if (n == -1) {                      // ya no hay EINTR aquí
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduce errno a texto
        return 1;
    }
    printf("leídos %zd bytes, handler llamado %d vez(ces)\n", n, (int)g_alarmas);
    return 0;
}
```

```text
leídos 8 bytes, handler llamado 1 vez(ces)
```

El handler se ejecutó una vez (el contador lo demuestra), y `read` esperó «bonjour» sin que el programa tuviera que escribir ningún bucle. El tipo `volatile sig_atomic_t` del contador se explica en [escribir un handler seguro](/?c=langages&s=c&p=signaux-unix#escribir-un-handler-seguro).

### `signal()` frente a `sigaction()`

Ambas instalan un handler, pero solo `sigaction()` dice explícitamente lo que se quiere (véase [`sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-un-handler-enriquecido-con-siginfo-t)).

| | `signal()` | `sigaction()` |
|---|---|---|
| Relanzamiento de las llamadas | No especificado: depende del sistema | Explícito: presencia o ausencia de `SA_RESTART` |
| Con glibc (observado) | Relanzamiento automático: `read` no se interrumpe | Según el indicador pedido |
| Portabilidad del comportamiento | Débil: el mismo código puede comportarse de otra forma en otro sitio | Buena |
| Preferible | Nunca para un handler que cuenta | Siempre |

### Los límites de `SA_RESTART`

`SA_RESTART` no cubre todas las llamadas. El manual [`signal(7)`](https://man7.org/linux/man-pages/man7/signal.7.html) enumera las que fallan siempre con `EINTR`, incluso con el indicador, y las que se relanzan. La tabla cruza esa lista con lo observado aquí mediante un programa de prueba para cada llamada, con un handler de `SIGALRM`.

| Llamada | Sin `SA_RESTART` | Con `SA_RESTART` | Observación |
|---|---|---|---|
| `read` (tubería, terminal) | `-1`, `EINTR` | Relanzada | Caso más común |
| `write` (tubería llena) | `-1`, `EINTR` | Relanzada | Véase la escritura parcial más abajo |
| `waitpid` | `-1`, `EINTR` | Relanzada | Espera de un hijo |
| `sem_wait` | `-1`, `EINTR` | Relanzada (observado) | Puede variar de un sistema a otro |
| `nanosleep` | `-1`, `EINTR` | `-1`, `EINTR` | Nunca relanzada |
| `sleep` | Devuelve el tiempo restante | Igual | Nunca relanzada |
| `poll`, `select` | `-1`, `EINTR` | `-1`, `EINTR` | Nunca relanzadas |
| `close` | Véase más abajo | Véase más abajo | No se relanza |

Consecuencia: incluso con `SA_RESTART`, hay que conservar el bucle de reintento para `nanosleep`, `poll` y `select`. Para una espera de duración fija, `nanosleep` acepta un segundo argumento que recibe el tiempo restante: se relanza con ese resto, no con la duración original (para las otras formas de esperar, véase [la medición del tiempo](/?c=langages&s=c&p=mesure-du-temps)).

Otro efecto a conocer: con `SA_RESTART`, el programa ya no es avisado por `EINTR`. Un handler de `SIGINT` (Ctrl-C) que pone a 1 un indicador de parada no tiene efecto mientras el `read` bloqueado se relanza en silencio. Para que una señal despierte de verdad al programa, no hay que poner `SA_RESTART` y hay que comprobar un **indicador** (una variable que vale 0 mientras no ha pasado nada, y 1 después) en cada `EINTR`:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_parada = 0;   // pasa a 1 cuando se pide la parada

static void al_senal(int sig)
{
    (void)sig;                          // el número de la señal no nos sirve
    g_parada = 1;                       // única acción: poner el indicador a 1
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[64];         // zona de memoria que recibirá los bytes leídos
    ssize_t          n = -1;            // bytes leídos, o -1

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_senal;           // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // sin SA_RESTART: read será interrumpido
    alarm(1);                           // simula la petición de parada (aquí un SIGALRM)
    while (!g_parada) {                 // se relanza mientras nadie haya pedido la parada
        n = read(STDIN_FILENO, bufer, sizeof bufer);   // espera datos
        if (n == -1 && errno == EINTR)  // interrumpido: volvemos a mirar el indicador
            continue;
        break;                          // datos, fin o error real: salimos
    }
    if (g_parada)                       // la interrupción es ahora una petición de parada
        printf("parada solicitada, salimos limpiamente\n");
    else
        printf("leídos %zd bytes\n", n);
    return 0;
}
```

```text
parada solicitada, salimos limpiamente
```

Aquí `EINTR` es útil: es la única forma de salir de un `read` que no tiene nada que leer.

## Los casos particulares que engañan

### Una lectura o una escritura parcial no devuelve `-1`

Si la señal llega **después** de que una llamada ya haya transferido una parte de los bytes, no devuelve `-1`: devuelve el número de bytes ya transferidos. Es una **lectura parcial** (o **escritura parcial**): menos bytes de los pedidos, sin que sea un error. El siguiente programa escribe 200 000 bytes en una tubería que nadie lee; la capacidad de una tubería en Linux es de 65 536 bytes por defecto:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void al_alarma(int sig)
{
    (void)sig;                          // la interrupción es el único efecto buscado
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    static char      grande[200000];    // 200 000 bytes: más que la capacidad de una tubería
    int              tuberia[2];        // tuberia[0]: lectura, tuberia[1]: escritura
    ssize_t          n;                 // bytes escritos, o -1

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // sin SA_RESTART: write será interrumpido
    if (pipe(tuberia) == -1)            // crea una tubería que nadie lee
        return 1;
    memset(grande, 'x', sizeof grande); // rellena la zona con 'x'
    alarm(1);                           // SIGALRM llegará cuando la tubería esté llena
    n = write(tuberia[1], grande, sizeof grande);   // se bloquea al llenarse la tubería
    printf("write de %zu bytes: devuelve %zd\n", sizeof grande, n);
    return 0;
}
```

```text
write de 200000 bytes: devuelve 65536
```

| Lo que ocurrió antes de la señal | `write` / `read` devuelve | `errno` |
|---|---|---|
| Ningún byte transferido | `-1` | `EINTR` |
| Una parte de los bytes transferida | El número ya transferido (inferior a lo pedido) | Sin significado: no leerlo |
| Todo transferido | La cantidad pedida | Sin significado |

La trampa: tras un `read` parcial, relanzar con el **mismo** búfer sobrescribiría los primeros bytes. Hay que avanzar en el búfer el número de bytes ya recibidos. Ese es el trabajo de `leer_todo` más abajo.

### `close()` devuelve `EINTR`: no relanzar

[POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html) (el estándar que describe la interfaz de los sistemas tipo Unix) prevé que `close()` interrumpido devuelva `-1` con `EINTR`, y que el estado del descriptor sea entonces **indeterminado**: puede estar cerrado o seguir abierto según el sistema. El manual de Linux precisa que el descriptor ya queda liberado, y que un segundo `close()` sobre ese número podría cerrar un descriptor abierto entretanto por otro [thread](/?c=langages&s=c&p=threads) (un hilo de ejecución del mismo programa). Regla prudente: no relanzar nunca `close()`.

```c
if (close(fd) == -1) {                  // el cierre ha señalado un problema
    if (errno != EINTR)                 // EINTR: sobre todo no volvemos a llamar a close
        fprintf(stderr, "close: %s\n", strerror(errno));   // otra causa: la señalamos
}
```

### `EINTR` solo existe si hay un handler instalado

Una señal ignorada o dejada en su comportamiento por defecto nunca produce `EINTR`: la primera es descartada por el núcleo, la segunda mata el proceso (o es ignorada, según la señal).

El programa lee un argumento de la línea de comandos (véase [`argc` y `argv`](/?c=langages&s=c&p=argc-et-argv)) para elegir entre los dos casos:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    char    bufer[64];                  // zona de memoria que recibirá los bytes leídos
    ssize_t n;                          // bytes leídos, o -1 si la llamada falló

    if (argc > 1 && strcmp(argv[1], "ignorar") == 0)   // argumento "ignorar"
        signal(SIGALRM, SIG_IGN);       // SIG_IGN: el núcleo descarta la señal
    alarm(1);                           // sin argumento: comportamiento por defecto
    n = read(STDIN_FILENO, bufer, sizeof bufer);   // espera datos
    if (n == -1)                        // ningún handler: no hay EINTR
        printf("read: %s\n", strerror(errno));
    else
        printf("leídos %zd bytes\n", n);
    return 0;
}
```

| Lanzamiento (con la misma tubería lenta de antes) | Salida observada |
|---|---|
| `./ignorar ignorar` | `leídos 8 bytes`: la alarma se descarta, `read` sigue esperando al final |
| `./ignorar` | Ninguna salida: el proceso muere. El estado de salida es 142: la shell lo cuenta como «matado por una señal» sumando 128 al número de la señal, aquí 14 para `SIGALRM` |

## `fread` y `fgets`: ¿hace la biblioteca estándar el trabajo?

`fread` y `fgets` (véase [la lectura de archivos](/?c=langages&s=c&p=lecture-de-fichiers)) pertenecen a `<stdio.h>`, la biblioteca de entrada-salida estándar de C. Leen a través de un `FILE *` (un **flujo**, un objeto que agrupa un descriptor y un búfer de memoria). `fread(bufer, 1, n, flujo)` lee hasta `n` bytes; en caso de fallo o de fin, devuelve menos de lo pedido y se consulta `ferror(flujo)` (1 si el flujo está en error) y `feof(flujo)` (1 si se alcanza el fin de los datos). Por debajo, llaman a `read`. Se podría pensar que esta capa oculta la interrupción. Prueba con un `fread` sobre la entrada estándar, un handler de `SIGALRM` sin `SA_RESTART` y una alarma que suena durante la espera:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void al_alarma(int sig)
{
    (void)sig;                          // solo nos interesa que nos hayan llamado
}

int main(int argc, char **argv)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[64];         // zona de memoria que recibirá los bytes leídos
    size_t           n;                 // número de elementos leídos por fread

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    if (argc > 1 && strcmp(argv[1], "restart") == 0)   // "restart" activa SA_RESTART
        sa.sa_flags = SA_RESTART;       // el núcleo relanzará read por sí solo
    sigaction(SIGALRM, &sa, NULL);      // instala el handler
    alarm(1);                           // SIGALRM llegará dentro de 1 segundo
    errno = 0;                          // partimos de un errno limpio para observarlo bien
    n = fread(bufer, 1, sizeof bufer, stdin);   // pide 64 bytes a la entrada estándar
    printf("fread=%zu ferror=%d feof=%d errno=%d (%s)\n",
           n,                           // bytes devueltos realmente
           ferror(stdin) != 0,          // 1 si el indicador de error del flujo está activo
           feof(stdin) != 0,            // 1 si se ha alcanzado el fin del flujo
           errno,                       // 4 vale EINTR en Linux
           strerror(errno));            // el texto correspondiente
    return 0;
}
```

```text
$ (sleep 3; echo bonjour) | ./stdio
fread=0 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (printf abc; sleep 3; echo def) | ./stdio
fread=3 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (sleep 3; echo bonjour) | ./stdio restart
fread=8 ferror=0 feof=1 errno=0 (Success)
```

Observación: `fread` **no relanza**. Se detiene, devuelve lo que ya tenía (0 o 3 bytes), levanta el indicador de error del flujo y deja `errno` en `EINTR` (valor 4 en Linux). La misma prueba con `fgets` devuelve `NULL` con `ferror` a 1 y `errno` a 4. Con `SA_RESTART` todo funciona, pero porque es el núcleo quien relanza el `read` subyacente, no `fread`.

La norma del lenguaje C no dice nada de `EINTR`, y POSIX permite que estas funciones fallen con `EINTR` ([`fread`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fread.html)). El comportamiento observado aquí no es, pues, una garantía: otro sistema podría decidir de otra forma. Para un programa portable, hay que relanzar por cuenta propia. La función `clearerr(flujo)` borra el indicador de error y el de fin del flujo, lo que permite reintentar:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Como fread, pero relanza si la llamada al sistema subyacente es interrumpida.
size_t leer_flujo(void *bufer, size_t tamano, FILE *flujo)
{
    char    *bytes = bufer;             // vista byte a byte de la zona a rellenar
    size_t   total = 0;                 // bytes ya recibidos

    while (total < tamano) {            // mientras falte alguno
        total += fread(bytes + total, 1, tamano - total, flujo);   // lee el resto
        if (total == tamano || feof(flujo))   // terminado, o fin del flujo
            break;
        if (ferror(flujo) && errno == EINTR)   // interrupción, no un fallo real
            clearerr(flujo);            // borra el indicador de error y luego relanzamos
        else
            break;                      // error real: nos detenemos
    }
    return total;
}

static void al_alarma(int sig)
{
    (void)sig;                          // la interrupción es el único efecto buscado
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    char             bufer[8];          // zona que recibirá los bytes leídos
    size_t           n;                 // bytes devueltos por leer_flujo

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // sin SA_RESTART: read será interrumpido
    alarm(1);                           // SIGALRM caerá durante la espera
    n = leer_flujo(bufer, 7, stdin);    // quiere 7 bytes: "abc" llega antes de la alarma
    printf("leídos %zu bytes: %.*s\n", n, (int)n, bufer);
    return 0;
}
```

```text
$ (printf abc; sleep 3; printf defg) | ./leer_flujo
leídos 7 bytes: abcdefg
```

Dos detalles importan. Primero `clearerr`: sin él, el indicador de error quedaría activo y toda llamada siguiente fallaría de inmediato. Después, `errno` solo se consulta tras un fallo comprobado (`ferror`): una llamada exitosa no lo pone a cero, así que puede seguir valiendo `EINTR` por una interrupción pasada.

## ¿Qué hace cada capa?

| Capa | Reacción ante una señal capturada | Lo que debe hacer el programa |
|---|---|---|
| Llamada al sistema en bruto (`read`, `write`) | `-1` y `EINTR` si no se transfirió nada; si no, el número de bytes ya transferidos | Bucle de reintento, y avanzar en el búfer |
| Función de `<stdio.h>` (`fread`, `fgets`) | Observado: se detiene, indicador de error activo, `errno` en `EINTR` | `clearerr` y luego relanzar, o `SA_RESTART` |
| `SA_RESTART` | El núcleo relanza las llamadas que lo permiten | Mantener un bucle para `nanosleep`, `poll`, `select` |
| Bucle de reintento | Absorbe `EINTR` | Comprobar el indicador de parada en cada vuelta si la señal debe despertar |

## Una función reutilizable: `leer_todo`

`leer_todo(fd, bufer, tamano)` combina las dos protecciones: reintenta ante `EINTR` y gestiona la lectura parcial avanzando en el búfer. Se detiene al llegar a `tamano` bytes, o antes si el otro extremo se cierra (`read` devuelve entonces `0`). El `main` simula un escritor lento con algunas funciones ya vistas en el capítulo sobre [los procesos](/?c=langages&s=c&p=processus):

| Función | Papel aquí |
|---|---|
| `pipe(tuberia)` | Crea una tubería: `tuberia[0]` es el extremo de lectura, `tuberia[1]` el de escritura |
| `fork()` | Duplica el proceso; el hijo recibe `0`, el padre recibe el identificador del hijo |
| `sleep(2)` | Duerme el proceso 2 segundos |
| `_exit(0)` | Termina el proceso de inmediato, sin vaciar los búferes de `printf` |
| `close(tuberia[1])` | Cierra un extremo de la tubería: sin esto, el lector nunca vería el fin de los datos |

El escenario: tres bytes de inmediato, una pausa de 2 segundos durante la cual suena la alarma, y luego cinco bytes.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

// Lee exactamente tamano bytes, salvo que el fin de los datos llegue antes.
// Devuelve el número de bytes leídos (0 si ninguno), o -1 en caso de error real.
ssize_t leer_todo(int fd, void *bufer, size_t tamano)
{
    char    *bytes = bufer;             // vista byte a byte de la zona a rellenar
    size_t   total = 0;                 // bytes ya recibidos
    ssize_t  n;                         // resultado de la última lectura (read)

    while (total < tamano) {            // mientras falte alguno
        n = read(fd, bytes + total, tamano - total);   // lee el resto, no desde el principio
        if (n == -1 && errno == EINTR)  // interrupción por una señal
            continue;                   // se relanza sin perder nada
        if (n == -1)                    // error real
            return -1;                  // errno describe la causa, para quien llama
        if (n == 0)                     // fin de los datos: el otro extremo ha cerrado
            break;                      // devolvemos lo que tenemos
        total += (size_t)n;             // lectura completa o parcial: avanzamos
    }
    return (ssize_t)total;
}

static void al_alarma(int sig)
{
    (void)sig;                          // la interrupción es el único efecto buscado
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    int              tuberia[2];        // tuberia[0]: lectura, tuberia[1]: escritura
    char             bufer[9];          // 8 bytes esperados + 1 para el '\0'
    ssize_t          n;                 // bytes devueltos por leer_todo

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // sin SA_RESTART: read será interrumpido
    if (pipe(tuberia) == -1)            // crea la tubería
        return 1;
    if (fork() == 0) {                  // el proceso hijo hace de escritor lento
        if (write(tuberia[1], "abc", 3) == -1)   // envía 3 bytes de inmediato
            _exit(1);
        sleep(2);                       // luego calla durante 2 segundos
        if (write(tuberia[1], "defgh", 5) == -1)   // envía los 5 últimos bytes
            _exit(1);
        _exit(0);                       // el hijo ha terminado
    }
    close(tuberia[1]);                  // el padre solo conserva el extremo de lectura
    alarm(1);                           // SIGALRM caerá mientras el hijo calla
    n = leer_todo(tuberia[0], bufer, 8);   // quiere 8: 3, luego una interrupción, luego 5
    if (n == -1)
        return 1;
    bufer[n] = '\0';                    // termina la cadena para poder mostrarla
    printf("leídos %zd bytes: %s\n", n, bufer);
    return 0;
}
```

```text
leídos 8 bytes: abcdefgh
```

La primera lectura devuelve 3 bytes (parcial), la segunda se interrumpe (`EINTR`, relanzada sin pérdida), la tercera devuelve los 5 últimos. La versión simétrica para la escritura:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

// Escribe exactamente tamano bytes. Devuelve 0 si todo ha salido, -1 en caso de error real.
int escribir_todo(int fd, const void *bufer, size_t tamano)
{
    const char *bytes = bufer;          // vista byte a byte de la zona a enviar
    size_t      total = 0;              // bytes ya salidos
    ssize_t     n;                      // resultado de la última escritura (write)

    while (total < tamano) {            // mientras quede alguno
        n = write(fd, bytes + total, tamano - total);   // envía el resto
        if (n == -1 && errno == EINTR)  // interrupción por una señal
            continue;                   // se relanza sin perder nada
        if (n == -1)                    // error real
            return -1;                  // errno describe la causa
        total += (size_t)n;             // escritura completa o parcial: avanzamos
    }
    return 0;
}

static void al_alarma(int sig)
{
    (void)sig;                          // la interrupción es el único efecto buscado
}

int main(void)
{
    struct sigaction sa;                // descripción del comportamiento para una señal
    static char      grande[200000];    // más que la capacidad de una tubería
    static char      recibido[4096];    // búfer pequeño de lectura para el hijo
    int              tuberia[2];        // tuberia[0]: lectura, tuberia[1]: escritura
    long             cuenta = 0;        // bytes contados por el hijo
    ssize_t          n;                 // bytes leídos por el hijo

    memset(&sa, 0, sizeof sa);          // pone a cero todos los campos de sa
    sa.sa_handler = al_alarma;          // función a llamar cuando llegue la señal
    sigemptyset(&sa.sa_mask);           // no bloquea ninguna otra señal
    sigaction(SIGALRM, &sa, NULL);      // sin SA_RESTART: write será interrumpido
    if (pipe(tuberia) == -1)
        return 1;
    if (fork() == 0) {                  // el hijo hace de lector lento
        close(tuberia[1]);              // solo conserva el extremo de lectura
        sleep(2);                       // no lee nada durante 2 segundos
        while ((n = read(tuberia[0], recibido, sizeof recibido)) > 0)  // vacía la tubería
            cuenta += n;                // contando los bytes recibidos
        printf("el hijo recibió %ld bytes\n", cuenta);
        exit(0);                        // exit vacía los búferes de printf
    }
    close(tuberia[0]);                  // el padre solo conserva el extremo de escritura
    memset(grande, 'x', sizeof grande); // rellena la zona con 'x'
    alarm(1);                           // SIGALRM caerá mientras la tubería esté llena
    if (escribir_todo(tuberia[1], grande, sizeof grande) == -1)
        return 1;
    close(tuberia[1]);                  // el hijo verá el fin de los datos
    wait(NULL);                         // espera el fin del hijo
    return 0;
}
```

```text
el hijo recibió 200000 bytes
```

Los 200 000 bytes llegaron todos, a pesar de una escritura parcial de 65 536 bytes interrumpida por la alarma. Aquí el hijo termina con `exit(0)` y no con `_exit(0)`: `exit` vacía los búferes de `printf`, sin lo cual la frase nunca se mostraría cuando la salida es una tubería.

## Las trampas

| Trampa | Por qué | Remedio |
|---|---|---|
| Tratar cualquier `-1` como un fallo | `EINTR` no es un fallo | Comprobar `errno == EINTR` |
| Relanzar ante cualquier `-1` | Un error real haría girar el bucle sin fin | Relanzar solo ante `EINTR` |
| Creer que `fread` o `fgets` relanzan | Observado: se detienen con `ferror` | `clearerr` y luego relanzar, o `SA_RESTART` |
| Olvidar `clearerr` antes de relanzar | El indicador de error del flujo queda activo | Llamarla en cuanto se decide relanzar |
| Relanzar un `read` parcial desde el inicio del búfer | Los bytes ya recibidos se sobrescriben | Avanzar `total` bytes |
| Relanzar `close()` | Estado del descriptor indeterminado, riesgo de cerrar el descriptor de otro hilo | No relanzar nunca |
| Confiar en `SA_RESTART` para todo | `nanosleep`, `poll`, `select` fallan siempre | Mantener el bucle de reintento |
| Relanzar a ciegas cuando una señal debe detener el programa | El programa se vuelve imposible de detener limpiamente | Comprobar el indicador de parada en cada `EINTR` |
| Usar `signal()` | Comportamiento de relanzamiento variable según el sistema | Usar `sigaction()` |
| Leer `errno` sin fallo comprobado | Una llamada exitosa no lo pone a cero | Leerlo solo justo después de un fallo |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Escribir una vez `leer_todo` y `escribir_todo`, y usarlas en todas partes | Un solo bucle que verificar, en lugar de uno por llamada |
| Instalar los handlers con `sigaction()` y un indicador elegido | El comportamiento es idéntico en todos los sistemas |
| Elegir: `SA_RESTART` para una señal puramente informativa, ningún indicador si la señal debe despertar al programa | El programa conserva el control sobre lo que provoca la interrupción |
| Comprobar el indicador de parada (`volatile sig_atomic_t`) en cada `EINTR` | El programa sigue siendo detenible |
| Para `nanosleep`, relanzar con el tiempo restante | Se respeta la duración total de la espera |
| No relanzar nunca `close()` | Ninguna garantía sobre el estado del descriptor |
| Comprobar el código de retorno de cada llamada al sistema y de cada función de `<stdio.h>` | Un error silencioso se paga más tarde |
| Probar el comportamiento en la propia máquina (alarma de 1 segundo, tubería lenta) | Los documentos dicen «puede», la experiencia dice «ocurre» |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una llamada bloqueante al sistema interrumpida por una señal cuyo handler está instalado devuelve `-1` y `errno` igual a `EINTR`: nada ha fallado, basta con relanzar (`do { n = read(...); } while (n == -1 && errno == EINTR);`). `SA_RESTART` pide al núcleo que relance algunas llamadas, pero no `nanosleep`, `poll` ni `select`. Una lectura o una escritura ya iniciada devuelve el número de bytes transferidos, no `-1`. `close()` no se relanza. `EINTR` solo existe si hay un handler instalado. Observado con glibc: `fread` y `fgets` no relanzan, levantan `ferror` y dejan `errno` en `EINTR`; el estándar de C no dice nada y POSIX permite ese fallo. |
| **Trampas a evitar** | Salir ante `EINTR`; relanzar ante cualquier `-1`; contar con `fread` para relanzar; olvidar `clearerr`; relanzar un `read` parcial desde el inicio del búfer; relanzar `close()`; creer que `SA_RESTART` lo cubre todo; hacer el programa imposible de detener relanzando a ciegas. |
| **Buenas prácticas** | `sigaction()` con un indicador explícito; funciones `leer_todo` y `escribir_todo` que relanzan y avanzan en el búfer; `clearerr` y luego relanzar para `<stdio.h>`; indicador de parada comprobado en cada `EINTR`; nunca relanzar `close()`; documentación: [`read`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/read.html), [`close`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html), [`sigaction`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/sigaction.html), [`nanosleep`](https://man7.org/linux/man-pages/man2/nanosleep.2.html). |
