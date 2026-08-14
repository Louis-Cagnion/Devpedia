---
order: 12
---

# Cómo funciona un shell (arquitectura interna)

Todo lo que hace Bash a simple vista (variables, bucles, tuberías, redirecciones) se basa en un mecanismo bastante sencillo de describir: un bucle que lee una línea, la analiza, la interpreta y, a continuación, inicia procesos mediante las llamadas al sistema estándar del capítulo sobre la gestión de procesos en C (`fork`, `execve`, `wait`). Este capítulo describe este mecanismo, con el objetivo de comprender —o incluso reconstruir— un shell mínimo.

> **Requisitos previos:** este capítulo da por supuesto que el lector sabe qué es una **llamada al sistema** y un **descriptor de archivo** (`STDIN_FILENO`, `dup2()`...) —consulte el capítulo dedicado a este tema en la sección C si estos conceptos aún no le resultan claros—.

## El bucle principal (REPL)

Un shell interactivo es, básicamente, un bucle infinito:

```
tant que vrai :
    afficher le prompt
    lire une ligne de commande
    découper la ligne en mots (tokenisation)
    appliquer les expansions (variables, jokers, substitutions...)
    exécuter la commande résultante
    attendre sa fin si elle est au premier plan
```

*Read-Eval-Print Loop* (REPL): leer, evaluar, mostrar (implícitamente) el resultado a través de la salida estándar del comando y repetir el proceso.

## El orden exacto de las expansiones

Una línea escrita no se ejecuta tal cual: Bash aplica varias etapas de expansión, en un orden fijo e inalterable, antes de ejecutar nada:

1. **Expansión de llaves** (`{1,2,3}` → `1 2 3`)
2. **Expansión de la tilde** (`~` → `/home/usuario`)
3. **Expansión de parámetros/variables, sustitución de comandos y operaciones aritméticas** (`$var`, `$(commande)`, `$((1+1))`), evaluadas de izquierda a derecha
4. **División en palabras** (*word splitting*): el resultado de las expansiones anteriores se vuelve a dividir según los espacios, salvo que estuviera entre comillas dobles.
5. **Expansión de rutas** (*globbing*: `*.txt` → lista real de archivos)
6. **Eliminación de las comillas** (las comillas en sí mismas nunca se transmiten al comando final)

> **Nota:** es precisamente este orden el que explica por qué «`"$var"`» (con comillas) evita la división en palabras (paso 4), mientras que `$var` por sí solo sí está expuesto a ello; las comillas solo se eliminan en el último paso, una vez que el segmentado ya se ha producido (o no) sobre el contenido que protegían.

## Ejecutar un comando: integrado frente a externo

Una vez dividida y expandida la línea, el shell debe distinguir entre dos casos:

### Los comandos internos (*builtins*)

`cd`, `export`, `echo` (a menudo), `read`, `exit`... se ejecutan **directamente desde el propio proceso del shell**, sin iniciar ningún proceso nuevo. Se trata de una necesidad, no de una elección de estilo: «`cd`» debe cambiar el directorio actual **del shell**, no el de un subproceso efímero que desaparecería inmediatamente tras el cambio de directorio.

### Los comandos externos

En un programa como `ls` o `grep`, el shell reproduce exactamente el mecanismo descrito en el capítulo sobre la gestión de procesos en C:

```
pid_t pid = fork();

if (pid == 0) {
    // processus enfant : remplace son image mémoire par le programme demandé
    execve("/bin/ls", arguments, environnement);
    _exit(127); // atteint uniquement si execve a échoué (commande introuvable, par exemple)
} else {
    // processus parent (le shell lui-même) : attend la fin de l'enfant
    int statut;
    waitpid(pid, &statut, 0);
}
```

## Cómo determina el shell qué ejecutable debe ejecutar

Si el comando introducido contiene un `/` (p. ej., `./script.sh`, `/bin/ls`), el shell lo utiliza directamente. De lo contrario, recorre cada carpeta que figura en `$PATH` (véase el capítulo sobre variables de entorno), en orden, y se detiene en el **primer** archivo ejecutable que encuentre con ese nombre; se trata de una simple comprobación `access(ruta, X_OK)` que se repite con cada candidato.

## Implementar un pipe (`cmd1 | cmd2`)

Una tubería se basa en la llamada al sistema «`pipe()`», que crea dos descriptores de archivo conectados (uno de lectura y otro de escritura), combinada con «`fork()`» y «`dup2()`»:

```
int fds[2];
pipe(fds); // fds[0] = extrémité de lecture, fds[1] = extrémité d'écriture

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // la sortie standard de cmd1 devient l'écriture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // l'entrée standard de cmd2 devient la lecture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(fuente, objetivo)` hace que el descriptor `objetivo` (p. ej., `STDOUT_FILENO`, cuyo valor es `1`) apunte al mismo recurso que `fuente`; es precisamente este mecanismo, aplicado al descriptor de una tubería en lugar de a un archivo, el que conecta la salida de un comando con la entrada del siguiente.

## Implementar una redirección (`>`, `<`)

La lógica es la misma que en el caso de una tubería, pero la «fuente» es un archivo abierto con `open()` en lugar de una tubería:

```
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // tout ce qu'écrit le programme sur stdout part maintenant dans sortie.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponde a `>` (sobrescribe el archivo), `O_APPEND` a `>>` (añade al final) — véase el capítulo sobre redireccionamientos para conocer el comportamiento observado desde el punto de vista del usuario.

## Control de tareas (jobs): `&`, `Ctrl+Z`, `fg` / `bg`

Cada pipeline que se inicia forma un **grupo de procesos** —un identificador compartido (`setpgid()`) que permite al shell y al terminal tratar todos los procesos de un mismo pipeline como una sola unidad (por ejemplo, enviarles una señal a todos a la vez), en lugar de tener que dirigirse a cada PID individualmente. El terminal solo concede el control del teclado a **un único** grupo a la vez (`tcsetpgrp()`), el que se encuentra en primer plano. `Ctrl+Z` envía la señal «`SIGTSTP`» a este grupo (lo suspende sin terminarlo), «`fg`» / «`bg`» (véase el capítulo sobre la gestión de procesos) devuelven, respectivamente, el control del terminal o devuelven «`SIGCONT`» para reanudar la ejecución en segundo plano.

## Crear tu propio mini-shell

En resumen, un shell mínimo en C necesita: un bucle de lectura, un analizador que respete las comillas y los operadores (`|`, `>`, `<`, `&&`), la lógica de expansión en el orden correcto, `fork` / `execve` / `waitpid` para los comandos externos, funciones de C llamadas directamente para los comandos integrados, y `pipe()` / `dup2()` / `open()` para las tuberías y las redirecciones. Es, literalmente, la arquitectura completa; el resto (autocompletado, historial, coloración...) no es más que comodidades añadidas.
