---
order: 16
---

# Las llamadas al sistema y los descriptores de archivo

Un programa no puede leer un archivo, crear un proceso ni enviar datos por la red manipulando directamente el hardware: esto podría ser catastrófico para la estabilidad y la seguridad del sistema si cualquier programa tuviera libre acceso a él. En su lugar, debe pasar por una puerta estrecha y controlada: la **llamada al sistema** (*syscall*). Este capítulo explica este mecanismo y el **descriptor de archivo**, el "identificador" que el núcleo entrega a cambio, ambos usados constantemente en cuanto se tocan archivos, procesos o tuberías (véanse [La gestión de procesos](/?c=langages-de-programmation&s=c&p=processus), [Los subprocesos](/?c=langages-de-programmation&s=c&p=threads), y [Cómo funciona un shell](/?c=shells&s=bash&p=architecture-dun-shell)).

## Espacio de usuario frente a espacio del núcleo

```text
Programa (espacio de usuario)
      |
      | llamada al sistema: open(), read(), write(), fork(), pipe()...
      v
Núcleo del sistema operativo (espacio del núcleo)
      |
      v
Hardware (disco, red, memoria física...)
```

Una llamada a una función C clásica (`suma(2, 3)`) se ejecuta íntegramente en el **espacio de usuario**, sin salir nunca del programa. Una llamada al sistema es diferente: solicita explícitamente al **núcleo** que actúe en lugar del programa, para una operación que este no tiene permiso de realizar por sí mismo. Esta solicitud implica un cambio controlado de modo de ejecución (*user mode* → *kernel mode*), verificado por el procesador: es este control el que impide que un programa malicioso o con errores acceda directamente a la memoria o al disco de otro programa.

> **Nota:** una función como `printf()` no es en sí misma una llamada al sistema: es una función de biblioteca, que da formato a la cadena de caracteres en espacio de usuario, y luego llama internamente a la verdadera llamada al sistema (`write()`) para enviarla realmente a la salida estándar.

## Algunas llamadas al sistema habituales

| Llamada al sistema | Función |
|---|---|
| `open()` / `close()` | Abrir / cerrar un archivo |
| `read()` / `write()` | Leer / escribir bytes en un descriptor |
| `fork()` / `execve()` / `wait()` | Crear un proceso / reemplazar su programa / esperar a que termine (véase [La gestión de procesos](/?c=langages-de-programmation&s=c&p=processus)) |
| `pipe()` | Crear una tubería de comunicación entre dos procesos (véase [Cómo funciona un shell](/?c=shells&s=bash&p=architecture-dun-shell)) |
| `dup2()` | Hacer que un descriptor apunte a otro recurso ya abierto |
| `mmap()` / `brk()` | Solicitar memoria al sistema (usados internamente por `malloc()`, véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)) |

## Señalar un error: `errno`

La mayoría de las llamadas al sistema indican un fallo devolviendo `-1` (o `NULL` para las que devuelven un puntero), y estableciendo la variable global `errno` con un código que describe la causa precisa: el mismo principio que las funciones históricas de C mencionadas en el capítulo sobre funciones (`@` en PHP responde al mismo tipo de convención de error "al estilo C"):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("archivo_inexistente.txt", O_RDONLY);

if (fd == -1) {
    printf("Error: %s\n", strerror(errno)); // traduce el codigo errno a un mensaje legible
}
```

## El descriptor de archivo: una simple entrada en una tabla

Un **descriptor de archivo** (*file descriptor*) no es ni un puntero ni una ruta: es un simple entero, el índice de una tabla que mantiene el núcleo **para cada proceso**, que asocia ese entero a un recurso realmente abierto (archivo, tubería, conexión de red, terminal...).

Cada proceso arranca con tres descriptores ya abiertos:

| Descriptor | Constante C | Función habitual |
|---|---|---|
| `0` | `STDIN_FILENO` | Entrada estándar |
| `1` | `STDOUT_FILENO` | Salida estándar |
| `2` | `STDERR_FILENO` | Salida de error |

```c
int fd = open("archivo.txt", O_RDONLY); // devuelve por ej. 3: el siguiente espacio libre de ESTE proceso
read(fd, buffer, tamano);
close(fd);
```

> **Nota:** estos tres números (`0`/`1`/`2`) son exactamente los "flujos" (*stdin*/*stdout*/*stderr*) mencionados en el capítulo sobre redirecciones de Bash: una redirección como `2>` no hace otra cosa, por debajo, que manipular este descriptor número `2` del proceso en cuestión.

## `dup2()`: hacer que un descriptor apunte a otro recurso

`dup2(origen, destino)` hace que el descriptor número `destino` apunte al mismo recurso abierto que `origen`, cerrando de paso aquello a lo que `destino` apuntaba anteriormente:

```c
int fd = open("salida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // a partir de ahora, escribir en "stdout" (1) escribe en realidad en "salida.txt"
close(fd); // el original puede cerrarse: el destino (1) sigue siendo valido, apuntando al mismo recurso
```

Es exactamente este mecanismo el que usa el capítulo sobre la arquitectura de un shell para implementar tanto las redirecciones (`>`, `<`) como las tuberías (`|`): en ambos casos, se hace que un descriptor estándar (`0`, `1`, `2`) apunte a un recurso diferente justo antes de ejecutar el programa de destino.

## Por qué `fork()` también duplica la tabla de descriptores

Cuando [`fork()`](/?c=langages-de-programmation&s=c&p=processus) crea un proceso hijo, este recibe una **copia** de la tabla de descriptores de su padre: los mismos números, apuntando a los mismos recursos abiertos. Esto es precisamente lo que permite a un shell hacer un `dup2()` sobre un descriptor de tubería **en el hijo**, justo antes de la llamada a `execve()`: el nuevo programa hereda ese descriptor ya redirigido, sin saber nada del mecanismo que lo puso en marcha.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una llamada al sistema solicita al núcleo que actúe en lugar del programa (archivos, procesos, red): un cambio controlado del espacio de usuario al espacio del núcleo. Un descriptor de archivo es un simple entero, índice de una tabla por proceso. |
| **Herramientas utilizables** | `open`/`close`/`read`/`write`, `dup2`, `errno`/`strerror` para diagnosticar un fallo. |
| **Trampas a evitar** | Confundir una función de biblioteca (`printf`) con una llamada al sistema real (`write`): la primera encapsula la segunda. |
| **Buenas prácticas** | Comprobar siempre el valor de retorno de una llamada al sistema (`-1` o `NULL`) y consultar `errno`/`strerror()` para diagnosticar un fallo. |
