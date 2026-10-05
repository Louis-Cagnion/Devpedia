---
order: 20
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

La mayoría de las llamadas al sistema indican un fallo devolviendo `-1` (o `NULL` para las que devuelven un puntero), y estableciendo la variable global `errno` con un código que describe la causa precisa: el mismo principio que las funciones históricas de C mencionadas en el capítulo sobre funciones (`@` en [PHP](/?c=langages-de-programmation&s=php&p=php) responde al mismo tipo de convención de error "al estilo C"):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("archivo_inexistente.txt", O_RDONLY);

if (fd == -1) {
    printf("Error: %s\n", strerror(errno)); // traduce el código errno a un mensaje legible
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
// devuelve por ej. 3: el siguiente espacio libre de ESTE proceso
int fd = open("archivo.txt", O_RDONLY);
read(fd, buffer, tamano);
close(fd);
```

> **Nota:** estos tres números (`0`/`1`/`2`) son exactamente los "flujos" (*stdin*/*stdout*/*stderr*) mencionados en el capítulo sobre redirecciones de [Bash](/?c=shells&s=bash&p=bash): una redirección como `2>` no hace otra cosa, por debajo, que manipular este descriptor número `2` del proceso en cuestión.

## Los flags de apertura de `open()`

```c
open(ruta, O_RDONLY);                            // solo lectura
open(ruta, O_WRONLY);                            // solo escritura
open(ruta, O_RDWR);                              // lectura Y escritura

open(ruta, O_WRONLY | O_CREAT, 0644);            // crea el archivo si aún no existe
open(ruta, O_WRONLY | O_CREAT | O_TRUNC, 0644);  // + vacía el archivo si ya existia
// + escribe siempre al FINAL, sin sobrescribir
open(ruta, O_WRONLY | O_CREAT | O_APPEND, 0644);
```

| Flag | Efecto |
|---|---|
| `O_RDONLY`/`O_WRONLY`/`O_RDWR` | Modo de acceso (solo uno de los tres, mutuamente excluyentes) |
| `O_CREAT` | Crea el archivo si aún no existe (si no, `open()` falla sobre un archivo ausente) |
| `O_TRUNC` | Vacía el archivo existente antes de escribir (si no, el contenido antiguo permanecería tras la posición de escritura) |
| `O_APPEND` | Sitúa siempre la escritura al final del archivo, nunca en el punto alcanzado por un `write()` anterior |

Estos flags se combinan con `|` (OR a nivel de bits, ver [Los operadores a nivel de bits](/?c=langages-de-programmation&s=c&p=operateurs-binaires)): cada uno ocupa un bit distinto del mismo entero, así que `O_CREAT` y `O_TRUNC` pueden pedirse juntos sin excluirse mutuamente.

> **Nota:** el último argumento (`0644` arriba) fija los **permisos** del archivo, pero solo si `O_CREAT` lo crea efectivamente (un archivo ya existente conserva sus permisos actuales, este argumento se ignora entonces): ver [Permisos y archivos](/?c=shells&s=bash&p=permissions-et-fichiers) para el significado de este modo octal.

## `dup2()`: hacer que un descriptor apunte a otro recurso

`dup2(origen, destino)` hace que el descriptor número `destino` apunte al mismo recurso abierto que `origen`, cerrando de paso aquello a lo que `destino` apuntaba anteriormente:

```c
int fd = open("salida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
// a partir de ahora, escribir en "stdout" (1) escribe en realidad en "salida.txt"
dup2(fd, STDOUT_FILENO);
// el original puede cerrarse: el destino (1) sigue siendo válido, apuntando al mismo recurso
close(fd);
```

Es exactamente este mecanismo el que usa el capítulo sobre la arquitectura de un shell para implementar tanto las redirecciones (`>`, `<`) como las tuberías (`|`): en ambos casos, se hace que un descriptor estándar (`0`, `1`, `2`) apunte a un recurso diferente justo antes de ejecutar el programa de destino.

## Por qué `fork()` también duplica la tabla de descriptores

Cuando [`fork()`](/?c=langages-de-programmation&s=c&p=processus) crea un proceso hijo, este recibe una **copia** de la tabla de descriptores de su padre: los mismos números, apuntando a los mismos recursos abiertos. Esto es precisamente lo que permite a un shell hacer un `dup2()` sobre un descriptor de tubería **en el hijo**, justo antes de la llamada a `execve()`: el nuevo programa hereda ese descriptor ya redirigido, sin saber nada del mecanismo que lo puso en marcha.

## Archivos especiales: cuando `open()` no encuentra un archivo ordinario

En Unix (Linux, macOS), `open()` acepta todo lo que tiene una ruta, no solo los archivos de datos almacenados en el disco (los archivos **ordinarios**). El tipo de lo que se ha abierto realmente se lee con `fstat()`, que rellena una estructura `struct stat` que describe el descriptor (tipo, tamaño, permisos):

| Tipo | Prueba sobre `info.st_mode` | Ejemplo | Comportamiento de `read()` |
|---|---|---|---|
| Archivo ordinario | `S_ISREG` | `notes.txt` | Lee el contenido y luego `0` al final |
| Directorio | `S_ISDIR` | `/tmp` | Falla (`EISDIR`) |
| Dispositivo de «caracteres» | `S_ISCHR` | `/dev/zero`: entrega bytes nulos **sin fin** | Nunca devuelve `0`: la lectura no termina |
| Tubería con nombre (FIFO) | `S_ISFIFO` | `canal` creado con `mkfifo` | Espera a que otro proceso escriba |

### La tubería con nombre (FIFO)

Una [tubería](/?c=shells&s=bash&p=architecture-dun-shell) anónima (el `|` del shell, o `pipe()` más arriba) no tiene nombre: solo existe para los procesos que la han heredado por `fork()`. Una **tubería con nombre** (*named pipe*, o **FIFO**, de *First In, First Out*, «primero en entrar, primero en salir»: el orden de una [cola](/?c=fondamentaux&s=algorithmes&p=pile-et-file)) es el mismo mecanismo con un nombre en el árbol de archivos, por lo que dos programas sin parentesco pueden usarla. Los bytes escritos por un lado salen en el mismo orden por el otro, sin almacenarse nunca en el disco.

```bash
mkfifo canal              # crea la tubería con nombre "canal" (la función C del mismo nombre hace lo mismo)
ls -l canal               # el primer carácter es "p" (pipe): prw-r--r-- ...
echo "bonjour" > canal &  # escritor lanzado en segundo plano (&): espera a que llegue un lector
cat canal                 # lector: muestra "bonjour"; ambos lados se desbloquean
```

> **Nota:** un FIFO no se puede crear en cualquier disco. En WSL (Linux dentro de Windows), la carpeta `/mnt/c` falla; hay que usar una carpeta del sistema Linux, como `/tmp`.

### La trampa: la apertura se bloquea

Por defecto, `open()` sobre un FIFO es **bloqueante**: el núcleo detiene el programa hasta que ocurre un evento (véase [el bloqueo y la E/S no bloqueante](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Abrir para lectura espera a que un escritor abra el otro extremo, y viceversa. Un programa que cree recibir un archivo ordinario se queda, por tanto, congelado sin ningún mensaje si se le pasa un FIFO. Mismo efecto con `/dev/zero`: una lectura «hasta el final del archivo» no se detiene nunca y llena la memoria.

| Lo que se pasa al programa | `open()` simple | Resultado |
|---|---|---|
| `notes.txt` | Devuelve el control enseguida | Lectura normal |
| `canal` (FIFO sin escritor) | **Se bloquea para siempre** | Programa congelado |
| `/dev/zero` | Devuelve el control | La lectura no termina, memoria saturada |
| `/tmp` (directorio) | Devuelve el control | `read()` falla más tarde, lejos de la causa real |

### El remedio: abrir sin bloquear, comprobar el tipo y pasar a `FILE *`

La opción `O_NONBLOCK` pide a `open()` que devuelva el control enseguida en lugar de esperar. Después se comprueba el tipo con `fstat()`, y `fdopen()` convierte el descriptor validado en un `FILE *`, el objeto de las funciones de [lectura de archivos](/?c=langages-de-programmation&s=c&p=lecture-de-fichiers) (`fgets`, `fread`...):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

FILE *open_regular_file(const char *path)
{
    struct stat info;                                  // recibe tipo, tamaño, permisos
    int         fd;
    FILE       *file;

    fd = open(path, O_RDONLY | O_NONBLOCK);            // nunca bloquea, ni siquiera en un FIFO
    if (fd == -1) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));   // la causa real
        return (NULL);
    }
    if (fstat(fd, &info) == -1) {                      // consulta el descriptor ya abierto
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
        return (NULL);
    }
    if (!S_ISREG(info.st_mode)) {                     // FIFO, /dev/zero, directorio: rechazado
        fprintf(stderr, "%s : no es un archivo ordinario\n", path);
        close(fd);                                     // liberar el descriptor en cada fallo
        return (NULL);
    }
    file = fdopen(fd, "r");                            // el FILE * pasa a ser dueño de fd
    if (file == NULL) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
    }
    return (file);                                     // cerrar con fclose(), no con close()
}
```

Resultado comprobado con un pequeño `main` que llama a esta función con cada argumento de la línea de comandos (un archivo ordinario, un FIFO, `/dev/zero`, un directorio y una ruta inexistente):

```text
reg.txt : abierto
canal : no es un archivo ordinario
/dev/zero : no es un archivo ordinario
. : no es un archivo ordinario
absent : No such file or directory
```

Dos detalles importan. Primero, se llama a `fstat()` sobre el **descriptor** y no a `stat()` sobre la ruta: entre las dos llamadas, alguien podría sustituir el archivo por un FIFO, mientras que el descriptor sigue designando lo que realmente se abrió. Segundo, cada causa de fallo tiene su propio mensaje (archivo inexistente, tipo incorrecto, fallo de `fdopen()`), para que el usuario sepa qué corregir.

## Encontrar la ubicación de su propio ejecutable

Un programa que se entrega con archivos propios (por ejemplo los [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), los pequeños programas de una aplicación gráfica, guardados en una carpeta `shaders/` junto al ejecutable) debe encontrarlos desde cualquier lugar donde se lance. Escribir `fopen("shaders/basic.vert", "r")` solo funciona si el programa se lanza **desde su propia carpeta**, porque una ruta sin `/` inicial es relativa al **directorio actual** (la carpeta en la que está la terminal en el momento del lanzamiento, véase [`cd` en la arquitectura de un shell](/?c=shells&s=bash&p=architecture-dun-shell)) y no al ejecutable.

```text
~/proyecto/
├── scop              <- el ejecutable
└── shaders/basic.vert

cd ~/proyecto && ./scop     ->  "shaders/basic.vert" encontrado
cd ~ && proyecto/scop       ->  "shaders/basic.vert" buscado en ~/shaders: no se encuentra
```

### Por qué `argv[0]` no basta

[`argv[0]`](/?c=langages-de-programmation&s=c&p=argc-et-argv) contiene el nombre **tal como lo escribió el usuario**, no una ruta verificada:

| Lanzamiento | `argv[0]` | Problema |
|---|---|---|
| `./scop` | `./scop` | Relativo al directorio actual, utilizable mientras no cambie |
| `scop` (encontrado mediante la variable [`PATH`](/?c=shells&s=bash&p=variables-denvironnement)) | `scop` | Ninguna carpeta en el valor: imposible saber dónde está |
| `enlace` (enlace simbólico a `scop`) | `enlace` | Designa el enlace, no la carpeta real del ejecutable |
| Lanzado por `execve()` con un `argv[0]` cualquiera | cualquier cosa | El programa que llama elige libremente este valor |

### La solución en Linux: `/proc/self/exe`

En Linux, `/proc` es una carpeta **virtual**: ninguno de sus archivos está en el disco, el núcleo los fabrica al leerlos para describir los procesos en ejecución. `/proc/self` designa siempre al proceso que lo abre, y `/proc/self/exe` es un **enlace simbólico** (un archivo especial que solo contiene una ruta hacia otro archivo, como un acceso directo) que el núcleo hace apuntar al ejecutable real del proceso, ya limpio de `./`, `..` y otros enlaces. La llamada al sistema `readlink()` lee la ruta contenida en un enlace simbólico:

```c
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Escribe en dir la carpeta del ejecutable. Devuelve 0, o -1 (mensaje ya mostrado).
int get_exe_dir(char *dir, size_t size)
{
    ssize_t len;                                           // entero con signo: número de bytes, o -1
    char   *slash;

    len = readlink("/proc/self/exe", dir, size - 1);      // copia la ruta, sin '\0' final
    if (len == -1) {
        fprintf(stderr, "/proc/self/exe: %s\n", strerror(errno));   // ¿falta /proc?
        return (-1);
    }
    if ((size_t)len == size - 1) {                         // búfer lleno: ruta quizá cortada
        fprintf(stderr, "ruta del ejecutable demasiado larga para %zu bytes\n", size);
        return (-1);
    }
    dir[len] = '\0';                                       // readlink() nunca termina la cadena
    slash = strrchr(dir, '/');                             // último '/': separa carpeta y nombre
    if (slash == dir)                                      // ejecutable en la raíz: "/scop"
        slash++;                                           // conservar el "/" mismo
    *slash = '\0';                                         // corta el nombre del archivo
    return (0);
}
```

El **búfer** (*buffer*) es la zona de memoria reservada para recibir el resultado, aquí el arreglo `dir`, cuyo tamaño en bytes lo da `size` (véase [el búfer de duplicación](/?c=langages-de-programmation&s=c&p=memoire)). La función se usa para construir la ruta de un archivo entregado con el programa:

```c
char dir[4096];                                            // 4096: longitud máxima de una ruta en Linux
char path[4200];                                           // suficiente para dir + "/shaders/basic.vert"

if (get_exe_dir(dir, sizeof dir) == -1)                    // sizeof dir: tamaño del arreglo, 4096 bytes
    return (1);
// snprintf() escribe en path y se detiene en sizeof path bytes, por tanto sin desbordar
snprintf(path, sizeof path, "%s/shaders/basic.vert", dir);
```

Resultado comprobado en Linux con un pequeño `main` que muestra `argv[0]` y la carpeta encontrada, lanzado de cuatro maneras:

```text
(lanzado desde /)        /tmp/exetest/where  ->  carpeta = /tmp/exetest
(mediante enlace /tmp/lien) argv[0] = /tmp/lien ->  carpeta = /tmp/exetest
(mediante PATH)          argv[0] = where     ->  carpeta = /tmp/exetest
(sin /proc)              /proc/self/exe : No such file or directory
```

Solo el último caso falla, con un mensaje que nombra la causa real: se sabe qué corregir en lugar de ver fallar `fopen()` más adelante con una ruta inventada.

### Las trampas

| Trampa | Por qué | Remedio |
|---|---|---|
| Olvidar el `'\0'` tras `readlink()` | Copia los caracteres de la ruta sin terminar la cadena: el resto del búfer se lee como texto | Poner `dir[len] = '\0'` uno mismo |
| Pasar `sizeof dir` a `readlink()` en lugar de `sizeof dir - 1` | No queda sitio para el `'\0'` | Reservar un byte |
| Ruta más larga que el búfer | `readlink()` **trunca en silencio** y devuelve el tamaño del búfer | Rechazar un resultado que llena todo el búfer |
| Ejecutable borrado durante la ejecución | Linux añade ` (deleted)` al final de la ruta leída | Raro; comprobar que el archivo existe antes de usarlo |
| `/proc` ausente (sistema mínimo, algunos contenedores o entornos aislados) | El enlace no existe | Mensaje explícito, o ruta dada por el usuario (variable de entorno, opción) |
| Sistema distinto de Linux | `/proc/self/exe` es propio de Linux | Véase la tabla siguiente |

| Sistema | Medio de encontrar su propio ejecutable |
|---|---|
| Linux | `readlink("/proc/self/exe", ...)` |
| macOS | `_NSGetExecutablePath()` (declarada en `<mach-o/dyld.h>`) |
| Windows | `GetModuleFileNameA()` |
| FreeBSD | `sysctl` con `KERN_PROC_PATHNAME` |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una llamada al sistema solicita al núcleo que actúe en lugar del programa (archivos, procesos, red): un cambio controlado del espacio de usuario al espacio del núcleo. Un descriptor de archivo es un simple entero, índice de una tabla por proceso. Una ruta no es siempre un archivo ordinario: también se abren FIFO, dispositivos y directorios. Para encontrar los archivos entregados con el programa, partir de la ubicación real del ejecutable (`/proc/self/exe` en Linux), nunca del directorio actual ni de `argv[0]`. |
| **Herramientas utilizables** | `open`/`close`/`read`/`write`, flags `O_CREAT`/`O_TRUNC`/`O_APPEND`/`O_NONBLOCK` de `open()`, `dup2`, `errno`/`strerror` para diagnosticar un fallo, `mkfifo`, `fstat` + `S_ISREG`, `fdopen`, `readlink`. |
| **Trampas a evitar** | Confundir una función de biblioteca (`printf`) con una llamada al sistema real (`write`): la primera encapsula la segunda. Abrir sin comprobar una ruta dada por el usuario: un FIFO congela el programa, `/dev/zero` satura la memoria. Usar el resultado de `readlink()` sin poner el `'\0'` final. |
| **Buenas prácticas** | Comprobar siempre el valor de retorno de una llamada al sistema (`-1` o `NULL`) y consultar `errno`/`strerror()` para diagnosticar un fallo. Abrir con `O_NONBLOCK`, comprobar con `fstat()` + `S_ISREG()` y después `fdopen()`. |
