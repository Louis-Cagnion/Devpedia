---
order: 12
---

# La gestión de procesos

Cada comando lanzado en una terminal inicia un **proceso**. Bash permite lanzar comandos en segundo plano, vigilar los procesos en curso, y detenerlos limpiamente (o no) cuando sea necesario.

> Las herramientas de este capítulo muestran el consumo **CPU** (*Central Processing Unit*, el procesador) de cada proceso, en porcentaje de un núcleo. Un valor superior al 100 % no es por tanto una anomalía: significa que el proceso ocupa varios núcleos en paralelo.

## Primer plano vs segundo plano

Por defecto, un comando se ejecuta en **primer plano**: la terminal espera a que termine antes de aceptar un nuevo comando.

```bash
procesamiento_largo.sh &   # el '&' final lanza el comando en SEGUNDO PLANO
echo "La terminal queda disponible inmediatamente"
```

## Gestionar las tareas en segundo plano (`jobs`, `fg`, `bg`)

```bash
procesamiento_largo.sh &
jobs   # lista las tareas en segundo plano de la sesión actual
fg %1  # trae la tarea número 1 al primer plano
# Ctrl+Z suspende una tarea en primer plano (sin detenerla)
bg %1          # relanza en segundo plano una tarea suspendida con Ctrl+Z
```

`fg` y `bg` son abreviaturas directas de su sentido en inglés: `fg` = *foreground* (primer plano), `bg` = *background* (segundo plano): cada una trae o devuelve la tarea `%1` al plano correspondiente. Muchos comandos y banderas de [Unix](/?c=shells&s=bash&p=scripts-et-shebang) siguen este mismo principio de abreviatura de una palabra inglesa, lo que ayuda a recordarlos una vez conocida la palabra de origen: por ejemplo, en este capítulo, `-f` (*full*/*format*, para `ps aux -f` o el patrón completo de `pgrep -f`) o `-9` para `SIGKILL`. La tabla de señales de abajo precisa el sentido de cada una.

## Ver los procesos en curso (`ps`, `top`)

```bash
ps aux             # lista todos los procesos del sistema, con usuario, CPU, memoria...
ps aux | grep php  # filtra para ver solo los procesos relacionados con "php"
# vista interactiva, actualizada en vivo, ordenada por consumo de CPU por defecto
top
```

## Terminar un proceso (`kill`)

`kill` envía una **señal** a un proceso, identificado por su PID (*Process ID*):

```bash
kill 1234     # envía SIGTERM (15): pide educadamente al proceso que termine limpiamente
kill -9 1234  # envía SIGKILL (9): fuerza la parada inmediata, sin dejar reaccionar al proceso
```

| Señal | Número | Efecto |
|---|---|---|
| `SIGTERM` | 15 (por defecto) | Solicitud de parada limpia: el proceso puede interceptar esta señal para cerrarse limpiamente (cerrar archivos, guardar...) |
| `SIGKILL` | 9 | Parada inmediata e incondicional, imposible de interceptar o ignorar |
| `SIGINT` | 2 | Señal enviada por `Ctrl+C` desde la terminal |
| `SIGTSTP` | 20 | Señal enviada por `Ctrl+Z`: suspende el proceso (controlable, a diferencia de `SIGKILL`) sin terminarlo |
| `SIGCONT` | 18 | Reanuda la ejecución de un proceso suspendido por `SIGTSTP` (esto es lo que envía `bg`/`fg`, ver [Cómo funciona un shell](/?c=shells&s=bash&p=architecture-dun-shell)) |

> **Nota:** `kill -9` debe seguir siendo un último recurso: un proceso matado con `SIGKILL` no tiene ninguna oportunidad de limpiar tras de sí (archivos temporales, conexiones abiertas, bloqueos...). Probar siempre `kill` (SIGTERM) primero.

## Interceptar una señal (`trap`)

`trap` permite a un script ejecutar código en respuesta a una señal recibida, en lugar de sufrir la parada por defecto:

```bash
trap 'echo "Parada limpia"; rm -f archivo.tmp' SIGTERM
```

Una señal no interceptable como `SIGKILL` ignora totalmente `trap`: es justamente por eso que sigue siendo el último recurso visto más arriba.

## Borrar un archivo temporal sin falta: `mktemp` y `trap`

Un script que crea un archivo temporal debe borrarlo **sea cual sea la forma en que termine**: fin normal, error, Ctrl-C, `kill`. [`mktemp`](https://www.gnu.org/software/coreutils/manual/html_node/mktemp-invocation.html) crea un archivo vacío con un nombre único e impredecible (de la forma `/tmp/tmp.7nzzmlI0bS`) y muestra su ruta; `mktemp -d` crea un directorio de la misma manera.

```bash
tmp=$(mktemp) || exit 1   # archivo con nombre único; se detiene si no puede crearse
trap 'rm -f "$tmp"' EXIT  # borrado en cualquier salida del script
trap 'exit 130' INT       # Ctrl-C: salir, lo que dispara el trap EXIT
trap 'exit 143' TERM      # SIGTERM (enviado por kill): igual
```

Los códigos 130 y 143 siguen la convención «128 + número de la señal» (SIGINT es la señal 2, SIGTERM la 15). Resultado medido: ¿se borra el archivo creado por `mktemp`?

| Intérprete | Fin del script | Ningún `trap` | `EXIT` solo | `EXIT` + `INT` + `TERM` |
|---|---|---|---|---|
| Bash | normal | se queda | borrado | borrado |
| Bash | Ctrl-C | se queda | borrado | borrado |
| Bash | SIGTERM | se queda | borrado | borrado |
| Zsh | normal | se queda | borrado | borrado |
| Zsh | Ctrl-C | se queda | **se queda** | borrado |
| Zsh | SIGTERM | se queda | **se queda** | borrado |

Bash ejecuta el `trap` de `EXIT` incluso cuando una señal lo detiene; zsh no. Escribir los tres `trap` hace que el script sea correcto en ambos shells.

> **Trampa:** un nombre fijo (`/tmp/mi_script.tmp`). Dos ejecuciones simultáneas se pisan, y otro usuario de la máquina que adivine el nombre puede colocar allí un enlace simbólico a un archivo sensible, que el script sobrescribirá.
>
> **Buena práctica:** usar siempre `mktemp` y poner el `trap` antes de crear el archivo (con `tmp=` vacío al principio: `rm -f ""` no hace nada) para no dejar ninguna ventana en la que una señal dejaría el archivo atrás.

> **Nota:** un script lanzado en segundo plano por un shell no interactivo (`script.sh &`) tiene `SIGINT` ignorada desde el principio, y una señal ignorada al entrar no puede interceptarse ([señales en Bash](https://www.gnu.org/software/bash/manual/bash.html#Signals)). Probar la limpieza con Ctrl-C en una terminal real, o con `kill -TERM`. `SIGKILL` sigue sin poder interceptarse: el archivo se queda entonces en su sitio.

## Limitar la duración de un comando: `timeout` y Ctrl-C

`timeout` (GNU coreutils) lanza un comando y lo detiene si supera una duración:

```bash
timeout 30 ./procesamiento.sh               # detenido a los 30 s: código de salida 124
timeout --foreground 30 ./procesamiento.sh  # igual, pero Ctrl-C también lo alcanza
timeout -k 5 30 ./procesamiento.sh          # SIGKILL 5 s después de SIGTERM si hace falta: código 137
```

| Situación | Código de salida de `timeout` |
|---|---|
| El comando termina a tiempo | El suyo |
| Plazo superado: se envía SIGTERM | 124 |
| Plazo superado, SIGTERM ignorada y luego SIGKILL (`-k`) | 137 |

Para poder detener toda la descendencia del comando, `timeout` se coloca en su **propio grupo de procesos** (ver [Cómo funciona un shell](/?c=shells&s=bash&p=architecture-dun-shell)). Ahora bien, la terminal envía Ctrl-C (SIGINT) solo al grupo de **primer plano**: ni `timeout` ni el comando lo reciben.

Medido con `timeout 20 sleep 8` lanzado por un script, con Ctrl-C pulsado 0,8 s después del inicio:

| Opción | Tras Ctrl-C |
|---|---|
| Ninguna | Nada se detiene: el script espera el fin normal de `sleep` (7,2 s después) y continúa como si nada |
| `--foreground` | Parada inmediata |

> **Trampa:** `--foreground` ya no delega la parada en todo un grupo: al superarse el plazo, los **hijos** del comando ya no se detienen ([manual de `timeout`](https://www.gnu.org/software/coreutils/manual/html_node/timeout-invocation.html)).
>
> **Buena práctica:** `--foreground` para un script que una persona lanza en una terminal y debe poder interrumpir; sin la opción para un script sin terminal (tarea programada) que debe cortar toda la descendencia al superarse el plazo.

## Separar un proceso de la terminal (`nohup`)

Un proceso lanzado en segundo plano con `&` recibe de todos modos una señal de parada si se cierra la terminal que lo lanzó. `nohup` (*no hang up*) lo protege de eso:

```bash
nohup procesamiento_largo.sh &
# el proceso continúa incluso tras cerrar la terminal
# su salida estándar se redirige por defecto a un archivo nohup.out
```

## Encontrar el PID de un proceso por su nombre

```bash
pgrep -f "procesamiento_largo.sh"  # muestra el/los PID correspondientes al patrón dado
# encuentra Y termina en un solo comando (envía SIGTERM por defecto)
pkill -f "procesamiento_largo.sh"
```

> **`kill` vs `pkill`**: `kill` necesita un **PID** ya conocido (`kill 1234`): es la única forma de enviar una señal a un proceso preciso sin equivocarse de objetivo. `pkill` evita tener que buscar ese PID a mano: envía la señal a todo proceso cuyo nombre (o línea de comando completa con `-f`) corresponda al patrón dado, lo que equivale a encadenar `pgrep` y luego `kill` sobre cada PID encontrado. El riesgo de `pkill` es por tanto apuntar a más procesos de lo previsto si el patrón es demasiado amplio (ej. `pkill -f script.sh` en una máquina donde varios scripts contienen "script.sh" en su nombre).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `&` final lanza un comando en segundo plano. `kill` envía una señal (SIGTERM por defecto, SIGKILL como último recurso); `trap` permite interceptar una señal para una limpieza ordenada. `mktemp` crea un archivo temporal con nombre único; un `trap` sobre `EXIT`, `INT` y `TERM` lo borra sea cual sea la salida del script (`EXIT` solo basta en Bash, no en zsh). `timeout` detiene un comando demasiado largo (código 124), pero Ctrl-C solo lo alcanza con `--foreground`. |
| **Herramientas utilizables** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Trampas a evitar** | Usar `kill -9` (SIGKILL) por reflejo: el proceso no tiene entonces ninguna oportunidad de limpiar tras de sí. Un nombre de archivo temporal fijo. Confiar solo en `trap … EXIT` en zsh. Probar la limpieza con Ctrl-C en un script lanzado con `&`. Olvidar `--foreground` en un script interactivo, o usarlo donde hay que cortar toda la descendencia. |
| **Buenas prácticas** | Probar siempre `kill` (SIGTERM) antes de `kill -9`; comprobar el patrón de `pkill` antes de ejecutarlo, para no apuntar a más procesos de lo previsto. Poner el `trap` antes de `mktemp` y escribirlo sobre `EXIT`, `INT` y `TERM`; elegir `--foreground` según que el script lo lance una persona o una tarea programada. |
