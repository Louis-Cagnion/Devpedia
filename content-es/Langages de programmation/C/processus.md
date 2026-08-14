---
order: 14
---

# La gestión de procesos

Un **proceso** es una instancia de un programa en ejecución, con su propio espacio de memoria, aislado del de los demás procesos. En C, la biblioteca estándar POSIX (`unistd.h`, `sys/wait.h`) permite crear nuevos procesos, lanzar otros programas y esperar a que finalicen. La norma **POSIX** se presenta en el capítulo [Escribir un script](/?c=shells&s=bash&p=scripts-et-shebang) de Bash.

> **Nota:** `fork()`, `execve()` (utilizado por `execlp()` y el resto de funciones de la familia `exec`) y `wait()`/`waitpid()` son **llamadas al sistema**: consulta el capítulo dedicado a las llamadas al sistema y a los descriptores de archivos para saber qué implica esto en la práctica (paso al espacio del núcleo, gestión de errores mediante `errno`).

## `fork()`: duplicar el proceso actual

`fork()` crea una copia prácticamente idéntica del proceso que hace la llamada. Después de la llamada, existen **dos** procesos y ambos continúan la ejecución justo después del `fork()`: la única diferencia es el valor devuelto:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Error: fork ha fallado\n");
    } else if (pid == 0) {
        printf("Soy el hijo, mi PID es %d\n", getpid());
    } else {
        printf("Soy el padre, el PID de mi hijo es %d\n", pid);
    }

    return 0;
}
```

| Valor de retorno | ¿En qué proceso? | Significado |
|---|---|---|
| `< 0` | Solo el padre | El `fork()` ha fallado, no se ha creado ningún hijo |
| `0` | El hijo | Siempre recibe `0` |
| `> 0` | El padre | Recibe el PID (*process ID*) del proceso hijo recién creado |

> **Nota:** `pid_t` es el tipo dedicado a los identificadores de proceso. `getpid()` devuelve el PID del proceso actual, `getppid()` el de su proceso padre.

## Reemplazar el programa en ejecución: la familia `exec`

`fork()` duplica el proceso actual, pero no cambia el programa que se ejecuta. Para lanzar **otro** programa en el proceso hijo, se utiliza una función de la familia `exec` (por ejemplo, `execve`, `execlp`): esta sustituye por completo el código del proceso actual por el de un nuevo programa:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // sustituye el proceso hijo por el programa "ls"
        printf("Esta línea nunca se ejecuta si execlp tiene éxito\n");
    }

    return 0;
}
```

> **Nota:** si `execlp()` tiene éxito, nunca "vuelve": el código del proceso hijo se sustituye por completo, por lo que la línea siguiente solo se alcanza en caso de fallo del propio `execlp()`.

## Esperar a que un hijo termine: `wait()` / `waitpid()`

Sin sincronización, el proceso padre continúa su ejecución independientemente del hijo. `wait()` bloquea al padre hasta que **uno** de sus hijos termine:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Hijo: estoy trabajando...\n");
        return 42; // código de salida del hijo
    } else {
        int estado;
        wait(&estado); // el padre espera aquí a que el hijo termine

        if (WIFEXITED(estado)) {
            printf("El hijo terminó con el código %d\n", WEXITSTATUS(estado));
        }
    }
}
```

- `wait(&estado)` rellena `estado` con información sobre cómo terminó el hijo.
- `WIFEXITED(estado)` comprueba que el hijo terminó normalmente (mediante `return`/`exit()`, no por una señal).
- `WEXITSTATUS(estado)` extrae el código de salida real del hijo.

`waitpid(pid, &estado, 0)` hace lo mismo que `wait()`, pero permite esperar a un hijo **concreto** (útil cuando un proceso tiene varios hijos).

> **Nota:** un proceso hijo terminado pero nunca "recuperado" por un `wait()` del padre permanece como **proceso zombi** en la tabla de procesos del sistema, hasta que su padre llame a `wait()` (o termine él mismo).

Véase también [Los subprocesos](/?c=langages-de-programmation&s=c&p=threads), una alternativa más ligera a `fork()` cuando las tareas deben compartir la misma memoria.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `fork()` duplica el proceso actual (dos procesos continúan tras la llamada); `exec*()` reemplaza el programa del proceso actual; `wait()`/`waitpid()` esperan a que un hijo termine. |
| **Herramientas utilizables** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`. |
| **Trampas a evitar** | No llamar nunca a `wait()` sobre un hijo terminado: permanece "zombi" en la tabla de procesos hasta que el padre lo recupera o termina él mismo. |
| **Buenas prácticas** | Comprobar siempre el valor de retorno de `fork()` (`< 0` = fallo) antes de bifurcar según el caso padre/hijo. |
