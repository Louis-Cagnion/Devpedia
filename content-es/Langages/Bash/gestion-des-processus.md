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
top                # vista interactiva, actualizada en vivo, ordenada por consumo de CPU por defecto
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
pkill -f "procesamiento_largo.sh"  # encuentra Y termina en un solo comando (envía SIGTERM por defecto)
```

> **`kill` vs `pkill`**: `kill` necesita un **PID** ya conocido (`kill 1234`): es la única forma de enviar una señal a un proceso preciso sin equivocarse de objetivo. `pkill` evita tener que buscar ese PID a mano: envía la señal a todo proceso cuyo nombre (o línea de comando completa con `-f`) corresponda al patrón dado, lo que equivale a encadenar `pgrep` y luego `kill` sobre cada PID encontrado. El riesgo de `pkill` es por tanto apuntar a más procesos de lo previsto si el patrón es demasiado amplio (ej. `pkill -f script.sh` en una máquina donde varios scripts contienen "script.sh" en su nombre).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `&` final lanza un comando en segundo plano. `kill` envía una señal (SIGTERM por defecto, SIGKILL como último recurso); `trap` permite interceptar una señal para una limpieza ordenada. |
| **Herramientas utilizables** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Trampas a evitar** | Usar `kill -9` (SIGKILL) por reflejo: el proceso no tiene entonces ninguna oportunidad de limpiar tras de sí. |
| **Buenas prácticas** | Probar siempre `kill` (SIGTERM) antes de `kill -9`; comprobar el patrón de `pkill` antes de ejecutarlo, para no apuntar a más procesos de lo previsto. |
