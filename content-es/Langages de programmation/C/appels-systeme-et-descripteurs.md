---
order: 15
---

# Las llamadas al sistema y los descriptores de archivo

Un programa no puede leer un archivo, crear un proceso ni enviar datos a través de la red manipulando directamente el hardware; esto podría resultar catastrófico para la estabilidad y la seguridad del sistema si cualquier programa tuviera libre acceso a él. En su lugar, debe pasar por una vía restringida y controlada: la llamada** al sistema** (*syscall*). Este capítulo explica este mecanismo y el **descriptor de archivo**, el «identificador» que el núcleo proporciona a cambio; ambos se utilizan constantemente en cuanto se manipulan archivos, procesos o tuberías (véanse los capítulos sobre la gestión de procesos, los subprocesos y la arquitectura de un shell).

## Espacio de usuario frente a espacio del núcleo

```
Programme (espace utilisateur)
      |
      | appel système : open(), read(), write(), fork(), pipe()...
      v
Noyau du système d'exploitation (espace noyau)
      |
      v
Matériel (disque, réseau, mémoire physique...)
```

Una llamada a una función C clásica (`addition(2, 3)`) se ejecuta íntegramente en el espacio** de usuario**, sin salir nunca del programa. Una llamada al sistema es diferente: solicita explícitamente al **núcleo** que actúe en lugar del programa, para una operación que este no tiene permiso para realizar por sí mismo. Esta solicitud implica un cambio controlado del modo de ejecución (*modo de usuario* → *modo de núcleo*), verificado por el procesador; es este control el que impide que un programa malicioso o con errores acceda directamente a la memoria o al disco de otro programa.

> **Nota:** una función como `printf()` no es en sí misma una llamada al sistema; se trata de una función de biblioteca que formatea la cadena de caracteres en el espacio de usuario y, a continuación, realiza internamente la verdadera llamada al sistema (`write()`) para enviarla realmente a la salida estándar.

## Algunas llamadas al sistema habituales

| Llamada al sistema | Función |
|---|---|
| `open()` / `close()` | Abrir / cerrar un archivo |
| `read()` / `write()` | Leer y escribir bytes en un descriptor |
| `fork()` / `execve()` / `wait()` | Crear un proceso / sustituir su programa / esperar a que finalice (véase el capítulo sobre la gestión de procesos) |
| `pipe()` | Crear un canal de comunicación entre dos procesos (véase el capítulo sobre la arquitectura de un shell) |
| `dup2()` | Cómo hacer que un descriptor apunte a otro recurso ya abierto |
| `mmap()` / `brk()` | Solicitar memoria al sistema (utilizado internamente por `malloc()`; véase el capítulo sobre gestión de la memoria) |

## Notificar un error: `errno`

La mayoría de las llamadas al sistema indican un error devolviendo `-1` (o `NULL` en el caso de las que devuelven un puntero), y estableciendo la variable global `errno` con un código que describe la causa concreta —el mismo principio que las funciones históricas de C mencionadas en el capítulo sobre funciones (`@` en PHP sigue el mismo tipo de convención de error «al estilo C»):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("fichier_inexistant.txt", O_RDONLY);

if (fd == -1) {
    printf("Erreur : %s\n", strerror(errno)); // traduit le code errno en message lisible
}
```

## El descriptor de archivo: una simple entrada en una tabla

Un **descriptor de archivo** (*file descriptor*) no es ni un puntero ni una ruta: es un simple número entero, el índice de una tabla que mantiene el núcleo **para cada proceso**, que asocia ese número entero a un recurso realmente abierto (archivo, canal, conexión de red, terminal...).

Cada proceso se inicia con tres descriptores ya abiertos:

| Descriptor | Constante C | Función habitual |
|---|---|---|
| `0` | `STDIN_FILENO` | Entrada estándar |
| `1` | `STDOUT_FILENO` | Salida estándar |
| `2` | `STDERR_FILENO` | Salida de error |

```c
int fd = open("fichier.txt", O_RDONLY); // renvoie par ex. 3 : le prochain emplacement libre de CE processus
read(fd, tampon, taille);
close(fd);
```

> **Nota:** estos tres números (`0` / `1` / `2`) son exactamente los «flujos» (*stdin/stdout/stderr*) mencionados en el capítulo sobre redirecciones de Bash; una redirección como `2>` no hace otra cosa, en el fondo, que manipular este descriptor número `2` del proceso en cuestión.

## `dup2()` : hacer que un descriptor apunte a otro recurso

`dup2(fuente, objetivo)` Hace que el descriptor número `objetivo` apunte al mismo recurso abierto que `fuente`, cerrando al mismo tiempo aquello a lo que `objetivo` apuntaba anteriormente:

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // désormais, écrire sur "stdout" (1) écrit en réalité dans "sortie.txt"
close(fd); // l'original peut être fermé : la cible (1) reste valide, pointant vers la même ressource
```

Este es precisamente el mecanismo que utiliza el capítulo sobre la arquitectura de un shell para implementar tanto las redirecciones (`>`, `<`) como las tuberías (`|`); en ambos casos, se hace que un descriptor estándar (`0`, `1`, `2`) apunte a un recurso diferente justo antes de ejecutar el programa de destino.

## ¿Por qué «`fork()`» también duplica la tabla de descriptores?

Cuando `fork()` (véase el capítulo sobre gestión de procesos) crea un proceso hijo, este recibe una **copia** de la tabla de descriptores de su proceso padre: los mismos números, que apuntan a los mismos recursos abiertos. Esto es precisamente lo que permite a un shell realizar un «`dup2()`» sobre un descriptor de tubería **en el proceso hijo**, justo antes de llamar a «`execve()`»: el nuevo programa hereda este descriptor ya redirigido, sin saber nada del mecanismo que lo ha establecido.
