---
order: 18
---

# La gestión de procesos

Un **proceso** es una instancia de un programa en ejecución, con su propio espacio de memoria, aislado del de los demás procesos. En C, la biblioteca estándar POSIX (`unistd.h`, `sys/wait.h`) permite crear nuevos procesos, lanzar otros programas y esperar a que finalicen. La norma **POSIX** se presenta en el capítulo [Escribir un script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

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

## Cuando el padre muere antes que sus hijos: los procesos huérfanos

Un **proceso huérfano** es un hijo cuyo padre terminó antes que él. A diferencia de un zombi, **sigue ejecutándose**: el sistema le asigna un nuevo padre (el primer proceso del sistema, `init`, o un proceso de servicio designado para ello, como `systemd`), que lo recuperará cuando termine. Por tanto, matar un programa **no** mata a los hijos que creó con `fork()`.

Caso real: un script de medición detenía a los 90 s un programa que calculaba con 4 hijos; los 4 hijos seguían ejecutándose 30 minutos después, ocupaban el procesador y falseaban todas las mediciones siguientes.

| Lado | Medio | Efecto |
|---|---|---|
| Hijo | [`prctl(PR_SET_PDEATHSIG, SIGKILL)`](https://man7.org/linux/man-pages/man2/prctl.2.html), solo en Linux | El núcleo envía la [señal](/?c=langages&s=c&p=signaux-unix) `SIGKILL` al hijo en cuanto muere su padre |
| Lanzador | Arrancar el programa en su propio **grupo de procesos** (`setsid()`, ver [el control de tareas de un shell](/?c=langages&s=bash&p=architecture-dun-shell#el-control-de-tareas-jobs-ctrl-z-fg-bg)) y luego matar todo el grupo: `kill(-grupo, SIGKILL)` | El programa y todos sus descendientes reciben la señal; en Python, ver [el presupuesto de tiempo de `subprocess`](/?c=langages&s=python&p=sous-processus-et-flux-standard#lanzar-varios-programas-en-paralelo-con-un-presupuesto-de-tiempo) |

Dos hijos, uno protegido por `PR_SET_PDEATHSIG` y el otro no; el padre termina al cabo de un segundo sin esperarlos. Salida de `./huerfanos; sleep 3` (el `sleep` da a los hijos tiempo para escribir):

```c
#include <signal.h>
#include <stdio.h>
#include <sys/prctl.h>
#include <unistd.h>

static void hijo(int protegido, pid_t padre)
{
    if (protegido) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);            /* muere cuando muere el padre */
        if (getppid() != padre)                      /* ¿padre muerto antes de la llamada? */
            _exit(0);
    }
    sleep(2);                                        /* el padre muere mientras tanto */
    printf("hijo %s: sigue vivo, padre %s\n",
           protegido ? "protegido" : "no protegido",
           getppid() == padre ? "sin cambios" : "sustituido");
    fflush(stdout);                                  /* _exit no vacía los búferes */
    _exit(0);
}

int main(void)
{
    pid_t padre = getpid();

    for (int protegido = 0; protegido <= 1; protegido++)
        if (fork() == 0)
            hijo(protegido, padre);                  /* el hijo nunca vuelve aquí */
    sleep(1);
    printf("padre: termino sin esperar a mis hijos\n");
    return 0;
}
```

```
padre: termino sin esperar a mis hijos
hijo no protegido: sigue vivo, padre sustituido
```

El hijo protegido murió con el padre y no escribe nada; el otro sigue ejecutándose, vinculado a un nuevo padre. La comprobación `getppid() != padre` cubre el caso en que el padre muere entre `fork()` y `prctl()`: de lo contrario, el hijo nunca sería avisado.

> **Trampa:** un programa que se relanza a sí mismo con `execv("/proc/self/exe", ...)` (la ruta especial de su propio ejecutable, ver [la familia `exec`](/?c=langages&s=c&p=processus#reemplazar-el-programa-en-ejecucion-la-familia-exec)) aparece después con el nombre `exe` en `ps` o `pgrep`. Caso real: un huérfano renombrado así se tomó primero por una aplicación del usuario. Relanzar por la ruta real, obtenida con `readlink("/proc/self/exe", ...)`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `fork()` duplica el proceso actual (dos procesos continúan tras la llamada); `exec*()` reemplaza el programa del proceso actual; `wait()`/`waitpid()` esperan a que un hijo termine. Un hijo cuyo padre muere se vuelve huérfano y sigue ejecutándose. |
| **Herramientas utilizables** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`; `prctl(PR_SET_PDEATHSIG, SIGKILL)`, `setsid()` y `kill(-grupo, SIGKILL)` contra los huérfanos. |
| **Trampas a evitar** | Olvidar llamar a `wait()` sobre un hijo terminado: permanece "zombi" en la tabla de procesos hasta que el padre lo recupera o termina él mismo; creer que matar un programa también mata a sus hijos. |
| **Buenas prácticas** | Comprobar siempre el valor de retorno de `fork()` (`< 0` = fallo) antes de bifurcar según el caso padre/hijo. |
