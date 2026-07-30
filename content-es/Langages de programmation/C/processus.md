---
order: 14
---

# La gestión de procesos

Un **proceso** es una instancia de un programa en ejecución, con su propio espacio de memoria, aislado del de los demás procesos. En C, la biblioteca estándar POSIX (`unistd.h`, `sys/wait.h`) permite crear nuevos procesos, ejecutar otros programas y esperar a que finalicen.

> **Nota:** `fork()`, `execve()` (utilizado por `execlp()` y el resto de funciones de la familia `exec`) y `wait()` / `waitpid()` son **llamadas al sistema**; consulta el capítulo dedicado a las llamadas al sistema y a los descriptores de archivos para saber qué implica esto en la práctica (paso al espacio del núcleo, gestión de errores mediante `errno`).

## `fork()` : duplicar el proceso actual

`fork()` crea una copia prácticamente idéntica del proceso que realiza la llamada. Tras la llamada, existen **dos** procesos y ambos continúan la ejecución justo después de la función `fork()`; la única diferencia es el valor devuelto:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Erreur : fork a échoué\n");
    } else if (pid == 0) {
        printf("Je suis l'enfant, mon PID est %d\n", getpid());
    } else {
        printf("Je suis le parent, le PID de mon enfant est %d\n", pid);
    }

    return 0;
}
```

| Valor de retorno | ¿En qué proceso? | Significado |
|---|---|---|
| `< 0` | Solo el elemento principal | El «`fork()`» ha fallado, no se ha creado ningún elemento secundario |
| `0` | El niño | Siempre recibe `0` |
| `> 0` | El proceso padre | Recibe el PID (*identificador de proceso*) del proceso hijo recién creado |

> **Nota:** `pid_t` es el tipo dedicado a los identificadores de proceso. `getpid()` devuelve el PID del proceso actual, `getppid()` el de su proceso padre.

## Sustituir el programa actual: la familia «`exec`»

`fork()` Duplica el proceso actual, pero no modifica el programa que se está ejecutando. Para iniciar **otro** programa en el proceso hijo, se utiliza una función de la familia «`exec`» (p. ej., `execve`, `execlp`), que sustituye por completo el código del proceso actual por el de un nuevo programa:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // remplace le processus enfant par le programme "ls"
        printf("Cette ligne ne s'exécute jamais si execlp réussit\n");
    }

    return 0;
}
```

> **Nota:** si `execlp()` se ejecuta correctamente, nunca «vuelve»: el código del proceso hijo se sustituye por completo, por lo que solo se llega a la línea siguiente en caso de que `execlp()` falle.

## Esperar el nacimiento de un hijo: `wait()` / `waitpid()`

Sin sincronización, el proceso padre continúa su ejecución independientemente del proceso hijo. `wait()` bloquea el proceso padre hasta que uno de sus procesos hijos finalice:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Enfant : je travaille...\n");
        return 42; // code de sortie de l'enfant
    } else {
        int statut;
        wait(&statut); // le parent attend ici que l'enfant se termine

        if (WIFEXITED(statut)) {
            printf("L'enfant s'est terminé avec le code %d\n", WEXITSTATUS(statut));
        }
    }
}
```

- `wait(&statut)` Rellena `statut` con información sobre cómo ha ido la jornada del niño.
- `WIFEXITED(statut)` Comprueba que el proceso secundario haya finalizado correctamente (a través de `return` / `exit()`, no mediante una señal).
- `WEXITSTATUS(statut)` Extrae el código de salida real del proceso hijo.

`waitpid(pid, &statut, 0)` Hace lo mismo que `wait()`, pero permite esperar a un hijo **concreto** (útil cuando un proceso tiene varios hijos).

> **Nota:** un proceso hijo que ha finalizado pero que nunca ha sido «recuperado» por un `wait()` del proceso padre permanece como **proceso zombi** en la tabla de procesos del sistema, hasta que su proceso padre llame a `wait()` (o finalice por sí mismo).

Véase también el capítulo sobre los subprocesos, una alternativa más ligera al`fork()`o cuando las tareas deben compartir la misma memoria.
