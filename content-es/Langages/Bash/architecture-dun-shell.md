---
order: 13
---

# Cómo funciona un shell (arquitectura interna)

Todo lo que Bash hace en superficie (variables, bucles, pipes, redirecciones) se basa en un mecanismo bastante sencillo de describir: un bucle que lee una línea, la divide, la interpreta, y luego lanza procesos vía las llamadas al sistema estándar del [capítulo sobre la gestión de procesos en C](/?c=langages-de-programmation&s=c&p=processus) (`fork`, `execve`, `wait`). Este capítulo describe este mecanismo, con el objetivo de entender (o incluso reconstruir) un shell mínimo.

> **Requisito previo:** este capítulo asume ya conocido qué es una **llamada al sistema** y un **descriptor de archivo** (`STDIN_FILENO`, `dup2()`...). Ver [el capítulo dedicado](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) en la sección C si estos conceptos aún no están claros.

## El bucle principal (REPL)

Un shell interactivo es fundamentalmente un bucle infinito:

```text
mientras verdadero:
    mostrar el prompt
    leer una línea de comando
    dividir la línea en palabras (tokenización)
    aplicar las expansiones (variables, comodines, sustituciones...)
    ejecutar el comando resultante
    esperar a que termine si está en primer plano
```

*Read-Eval-Print Loop* (REPL): leer, evaluar, (implícitamente) mostrar el resultado vía la salida estándar del comando, repetir.

## El orden preciso de las expansiones

Una línea escrita **no** se ejecuta tal cual: Bash aplica varias pasadas de expansión, en un orden fijo y no negociable, antes de lanzar nada:

1. **Expansión de llaves** (`{1,2,3}` → `1 2 3`)
2. **Expansión de la tilde** (`~` → `/home/usuario`)
3. **Expansión de parámetros/variables, sustitución de comandos y aritmética** (`$var`, `$(comando)`, `$((1+1))`), evaluadas de izquierda a derecha
4. **División en palabras** (*word splitting*): el resultado de las expansiones anteriores se vuelve a dividir según los espacios, salvo si estaba entre comillas dobles
5. **Expansión de rutas** (*globbing*: `*.txt` → lista real de archivos)
6. **Eliminación de comillas** (las comillas en sí nunca se transmiten al comando final)

> **Nota:** es este orden preciso el que explica por qué `"$var"` (con comillas) protege de la división en palabras (paso 4) mientras que `$var` solo está expuesto a ella: las comillas solo se retiran en el último paso, después de que la división ya haya tenido lugar (o no) sobre el contenido que protegían.

## Cómo reconoce el globbing un patrón (`*.txt`): el algoritmo recursivo de `fnmatch`

El paso 5 de las expansiones anteriores (*globbing*) reemplaza un patrón como `*.txt` por la lista real de archivos que coinciden con él. El núcleo de este mecanismo es un algoritmo recursivo de comparación de patrones (el mismo principio que la función estándar `fnmatch()`): `*` puede representar cualquier subsecuencia de caracteres, incluida una vacía.

```text
coincide("*.txt", "informe.txt")
  '*' encontrado -> dos intentos:
    1. "*" coincide con 0 caracteres -> comparar ".txt" con "informe.txt" (falla)
    2. "*" consume 1 carácter más -> comparar "*.txt" con "nforme.txt" (reintentar)
  ... repetido hasta que ".txt" coincida con el final de "informe.txt" -> éxito
```

Ante cada `*` encontrado en el patrón, el algoritmo intenta primero hacerlo coincidir con cero caracteres (avanzando solo en el patrón), y si no con un carácter más de la cadena probada (avanzando en la cadena mientras mantiene el `*` actual): la recursión se detiene en cuanto uno de los dos textos se agota. Fuera de un `*`, una coincidencia exige una igualdad estricta carácter a carácter.

> **Buena práctica:** este mismo algoritmo (recursión sobre `*`) sirve de base a cualquier búsqueda por patrón con comodines, no solo a la expansión de rutas: entenderlo permite predecir el comportamiento de un `*` en cualquier herramienta que acepte comodines (búsqueda de archivos, filtro de logs...).

## Representar la línea: un árbol de sintaxis (AST)

Una línea como `cmd1 && cmd2 || cmd3` combina varios comandos con operadores (`&&`, `||`, `|`) que no tienen todos la misma prioridad ni el mismo sentido: ejecutarla palabra por palabra, en el orden de lectura, no basta para respetar esa prioridad. El shell construye primero un **árbol de sintaxis abstracta** (AST): un árbol binario cuyos nodos internos son los operadores y cuyas hojas son los comandos.

```text
cmd1 && cmd2 || cmd3

        OR
       /  \
     AND   cmd3
    /   \
 cmd1   cmd2
```

Ejecutar la línea se convierte entonces en un simple recorrido recursivo de ese árbol:

- una hoja (un comando) se lanza normalmente (`fork`/`execve`/`waitpid`, ver más arriba);
- un nodo `AND` solo ejecuta su rama derecha si la izquierda tuvo éxito (código de salida `0`);
- un nodo `OR` solo ejecuta su rama derecha si la izquierda falló.

Los paréntesis (`(cmd1 && cmd2) || cmd3`) crean un subárbol evaluado primero, exactamente igual que en matemáticas: es la estructura del árbol misma la que codifica la prioridad y la asociatividad de los operadores, no una comprobación repetida sobre el texto de la línea.

> **Nota:** este mismo principio (parsing → AST → evaluación recursiva) es el de un intérprete de calculadora o un motor de reglas: en cuanto una sintaxis combina elementos con operadores de distinta prioridad, un árbol en lugar de una lectura lineal simplifica la ejecución.

## Los subshells: fork() sin execve()

En el ejemplo de comando externo de más abajo, el hijo salido de `fork()` llama a `execve()`: reemplaza de inmediato su imagen de memoria por otro programa y deja de ser un shell. Un **subshell** es el otro caso: un hijo que **sigue siendo** un shell y continúa interpretando comandos, sin llamar nunca a `execve()`. Bash crea uno automáticamente para:

- un comando entre paréntesis: `(cd /tmp && ls)`
- cada etapa de un pipeline (cf. sección siguiente)
- una sustitución de comandos: `resultado=$(comando)`
- un comando en segundo plano: `comando &`

Un subshell hereda una **copia** de las variables del shell padre en el momento en que arranca, pero es una copia de sentido único, como para el export de una [variable de entorno](/?c=shells&s=bash&p=variables-denvironnement): cualquier modificación que haga (`cd`, variable...) desaparece con él al terminar, sin llegar nunca al padre.

```bash
cd /tmp
(cd /var && pwd)  # muestra /var, dentro del subshell
pwd               # sigue mostrando /tmp: el cd del subshell no sobrevivió
```

## Agrupar comandos sin subshell: `{ ; }`

`{ comando1; comando2; }` produce un efecto parecido a `(comando1; comando2)` visto antes, pero **sin** crear un subshell: los comandos se ejecutan directamente en el shell actual, con las mismas consecuencias que escribir un `cd` o una variable normalmente.

```bash
cd /tmp
{ cd /var; pwd; }   # muestra /var
pwd                 # sigue mostrando /var: no hay subshell, el cd ocurrió realmente aquí
```

| | `( ; )` | `{ ; }` |
|---|---|---|
| Crea un subshell | Sí | No |
| Los cambios de `cd`/variable sobreviven después | No | Sí |
| Espacio tras el símbolo de apertura | No necesario | **Obligatorio** |
| `;` antes del símbolo de cierre | No necesario | **Obligatorio** |

> **Trampa:** `{ls;}` (sin espacios) es un error de sintaxis. `{` y `}` son aquí **palabras clave** del shell, no operadores como `(`/`)`: deben por tanto separarse del resto con un espacio, exactamente igual que cualquier otra palabra de la línea de comandos.

## Colorear la salida de una terminal: los códigos ANSI

Una terminal no solo muestra texto plano: también interpreta ciertas secuencias de bytes como instrucciones de formato (color, negrita...), los **códigos de escape ANSI**. Una secuencia empieza con el carácter `ESC` (`\033` en octal), seguido de `[`, un código, y una letra final:

```bash
printf '\033[31mTexto en rojo\033[0m\n'
```

| Código | Efecto |
|---|---|
| `\033[31m` | Texto rojo |
| `\033[32m` | Texto verde |
| `\033[36m` | Texto cian |
| `\033[0m` | Reinicia todo (color, negrita...) |

> **Trampa:** `echo '\033[31mTexto\033[0m'` (sin `-e`) casi siempre muestra la secuencia **tal cual**, como texto plano, en lugar de interpretarla. El comportamiento por defecto de `echo` ante una secuencia de escape depende en realidad del shell que lo ejecuta: el `echo` interno de Bash solo la interpreta si se pasa `-e`, mientras que el `echo` interno de `dash` (el `/bin/sh` por defecto en muchas distribuciones Linux) la interpreta de forma nativa, sin `-e`. Una misma línea puede por tanto mostrar colores dentro de un Makefile (cuyas recetas se ejecutan vía `/bin/sh`) y fallar tal cual al copiarla en un prompt de Bash interactivo.
>
> **Buena práctica:** preferir `printf`, cuyo comportamiento es constante entre shells (siempre interpreta `\033` en su cadena de formato), en lugar de confiar en el de `echo`, que varía.

## Ejecutar un comando: builtin vs externo

Una vez dividida y expandida la línea, el shell debe distinguir dos casos:

### Los comandos internos (*builtins*)

`cd`, `export`, `echo` (a menudo), `read`, `exit`... se ejecutan **directamente por el propio proceso shell**, sin lanzar un nuevo proceso. Es una necesidad, no una elección de estilo: `cd` debe cambiar el directorio actual **del shell**, no el de un subproceso efímero que desaparecería de inmediato junto con su cambio de directorio.

### Los comandos externos

Para un programa como `ls` o `grep`, el shell reproduce exactamente el mecanismo del capítulo sobre la gestión de procesos en C:

```c
pid_t pid = fork();

if (pid == 0) {
    // proceso hijo: reemplaza su imagen de memoria por el programa solicitado
    execve("/bin/ls", argumentos, entorno);
    _exit(127); // solo se alcanza si execve falló (comando no encontrado, por ejemplo)
} else {
    // proceso padre (el shell mismo): espera el fin del hijo
    int estado;
    waitpid(pid, &estado, 0);
}
```

## El código de salida de un proceso matado por una señal

`waitpid()` (más arriba) no devuelve directamente un simple código de salida: es un estado a decodificar vía las macros `WIFEXITED`/`WEXITSTATUS` (salida normal) o `WIFSIGNALED`/`WTERMSIG` (terminado por una señal, ver [Señales UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)). Cuando un proceso es matado por una señal (`Ctrl+C` envía `SIGINT`, por ejemplo) en lugar de terminar normalmente vía `exit()`, la convención POSIX seguida por todos los shells consiste en exponer `128 + número_de_señal` como código de salida aparente:

| Señal | Número | Código de salida (`$?`) |
|---|---|---|
| `SIGINT` (Ctrl+C) | 2 | 130 |
| `SIGQUIT` (Ctrl+\\) | 3 | 131 |
| `SIGKILL` | 9 | 137 |

```bash
sleep 100
# Ctrl+C durante la ejecución
echo $?   # muestra 130 (128 + 2)
```

> **Trampa:** creer que `$?` solo puede valer entre 0 y 255 por razones arbitrarias. Es precisamente ese rango (un byte) el que explica la convención `128 + señal`: más allá de 128, `$?` en realidad codifica "matado por la señal `$? - 128`", nunca un valor de retorno elegido por el programa.

## Cómo reconoce el kernel un script ejecutable (el shebang)

Cuando `execve()` recibe la ruta de un archivo, el kernel lee sus primerísimos bytes para saber cómo lanzarlo. Si valen `#!` (el [shebang](/?c=shells&s=bash&p=scripts-et-shebang)), el kernel no intenta ejecutar el archivo como código máquina: relanza él mismo `execve()`, esta vez sobre el intérprete indicado después de `#!`, pasándole la ruta del script original como primer argumento.

```text
./script.sh
      │
      ▼
execve("./script.sh", ...)
      │
      ▼
El kernel lee los 2 primeros bytes del archivo: "#!"
      │
      ▼
Relanza: execve("/bin/bash", ["/bin/bash", "./script.sh", ...], ...)
```

Por eso un script sin permiso de ejecución (`chmod +x`, ver [Permisos y manipulación de archivos](/?c=shells&s=bash&p=permissions-et-fichiers)) no puede lanzarse directamente (`./script.sh` falla), pero sigue siendo ejecutable invocando el intérprete explícitamente (`bash script.sh`): en este segundo caso, es `bash` mismo (ya ejecutable) el que es lanzado por `execve()`: es él, y no el kernel, quien abre después el script como un simple archivo de texto a leer línea por línea.

## Cómo encuentra el shell qué ejecutable lanzar

Si el comando escrito contiene una `/` (ej. `./script.sh`, `/bin/ls`), el shell lo usa directamente. Si no, recorre cada carpeta listada en [`$PATH`](/?c=shells&s=bash&p=variables-denvironnement), en orden, y se detiene en el **primer** archivo ejecutable encontrado con ese nombre: es una simple prueba `access(ruta, X_OK)` repetida sobre cada candidato.

## Implementar un pipe (`cmd1 | cmd2`)

Un pipe se apoya en la llamada al sistema `pipe()`, que crea dos descriptores de archivo conectados (un extremo de lectura, un extremo de escritura), combinada con `fork()` y `dup2()`:

```c
int fds[2];
pipe(fds); // fds[0] = extremo de lectura, fds[1] = extremo de escritura

pid_t p1 = fork();
if (p1 == 0) {
    // la salida estándar de cmd1 se convierte en la escritura del pipe
    dup2(fds[1], STDOUT_FILENO);
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    // la entrada estándar de cmd2 se convierte en la lectura del pipe
    dup2(fds[0], STDIN_FILENO);
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(fuente, destino)` hace que el descriptor `destino` (ej. `STDOUT_FILENO`, que vale `1`) apunte al mismo recurso que `fuente`: es exactamente este mecanismo, aplicado al descriptor de un pipe en lugar de a un archivo, el que conecta la salida de un comando con la entrada del siguiente.

## Implementar una redirección (`>`, `<`)

Misma lógica que para un pipe, pero la "fuente" es un archivo abierto con `open()` en lugar de un pipe:

```c
int fd = open("salida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // todo lo que el programa escribe en stdout va ahora a salida.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponde a `>` (sobrescribe el archivo), `O_APPEND` a `>>` (añade al final); ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes) para el comportamiento observado del lado del usuario.

## El here-document (`<<DELIM`): redirigir un bloque de texto sin archivo

A diferencia de `<`, que redirige desde un archivo ya existente, `<<DELIM` hace que el shell lea las siguientes líneas de entrada **directamente desde la terminal** (o el script), hasta encontrar una línea compuesta únicamente por el delimitador elegido:

```bash
cat <<FIN
Primera línea
Segunda línea
FIN
```

El shell entrega todo ese texto como entrada estándar del comando, exactamente como si viniera de un archivo: útil para inyectar un bloque multilínea sin crear un archivo aparte. Una implementación posible (en un mini-shell) escribe cada línea leída en un archivo temporal (`open(".heredoc", O_WRONLY | O_CREAT | O_TRUNC)`) sobre la marcha, y luego reabre ese archivo en lectura como entrada del comando, una vez alcanzado el delimitador.

> **Nota:** poner el delimitador entre comillas (`<<"FIN"` o `<<'FIN'`) desactiva las expansiones de variables dentro del bloque (`$var` permanece literal); sin comillas, las expansiones habituales se aplican normalmente al texto del here-document.

## El control de tareas (jobs): `&`, `Ctrl+Z`, `fg`/`bg`

Cada pipeline lanzado forma un **grupo de procesos**: un identificador compartido (`setpgid()`) que permite al shell y a la terminal tratar todos los procesos de un mismo pipeline como una sola unidad (ej. enviarles una señal a todos a la vez), en lugar de tener que apuntar a cada PID individualmente. La terminal solo da el control del teclado a **un único** grupo a la vez (`tcsetpgrp()`), el que está en primer plano. `Ctrl+Z` envía la señal `SIGTSTP` a ese grupo (lo suspende sin terminarlo), `fg`/`bg` (ver [La gestión de procesos](/?c=shells&s=bash&p=gestion-des-processus)) devuelven respectivamente el control de la terminal o envían `SIGCONT` para reanudar la ejecución en segundo plano.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un shell es un bucle REPL: leer una línea, aplicar las expansiones en un orden fijo, ejecutar (builtin internamente, o `fork`/`execve`/`wait` para un comando externo). `( ; )` crea un subshell, `{ ; }` agrupa comandos sin crear uno. `&&`/`\|\|`/`\|` se representan internamente como un árbol de sintaxis (AST) que codifica su prioridad. |
| **Herramientas utilizables** | `fork()`/`execve()`/`waitpid()`, `pipe()`/`dup2()` para pipes y redirecciones, `<<DELIM` para un here-document, el shebang para que un script sea reconocido como ejecutable, `printf` para códigos ANSI fiables entre shells. |
| **Trampas a evitar** | Confundir el orden de las expansiones: es él quien explica por qué `"$var"` protege de la división en palabras mientras que `$var` solo está expuesto a ella. Omitir los espacios alrededor de `{ ; }`. Confiar en `echo` para interpretar un código ANSI: su comportamiento por defecto varía entre shells. Olvidar que `$?` más allá de 128 codifica una señal (`128 + número`), no un valor de retorno real. |
| **Buenas prácticas** | Construir tu propio mini-shell para verificar tu comprensión: bucle de lectura, analizador, expansiones, `fork`/`execve`/`waitpid`, `pipe`/`dup2`/`open`. Preferir `{ ; }` a un subshell cuando un cambio (`cd`, una variable) debe sobrevivir al grupo de comandos. |

## Construir tu propio mini-shell

En resumen, un shell mínimo en C necesita: un bucle de lectura, un analizador que respete las comillas y los operadores (`|`, `>`, `<`, `&&`), la lógica de expansión en el orden correcto, `fork`/`execve`/`waitpid` para los comandos externos, funciones C llamadas directamente para los builtins, y `pipe()`/`dup2()`/`open()` para los pipes y redirecciones. Es literalmente la arquitectura completa; el resto (autocompletado, historial, coloreado...) no es más que comodidad añadida encima.
