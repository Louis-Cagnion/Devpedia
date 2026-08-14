---
order: 11
---

# La gestión de procesos

Cada comando ejecutado en un terminal inicia un **proceso**. Bash permite ejecutar comandos en segundo plano, supervisar los procesos en curso y detenerlos de forma controlada (o no) cuando sea necesario.

## Primer plano frente a fondo

Por defecto, un comando se ejecuta en **primer plano**: el terminal espera a que finalice antes de aceptar un nuevo comando.

```bash
long_traitement.sh &   # El símbolo «&» final ejecuta el comando en SEGUNDO PLANO
echo "Le terminal reste disponible immédiatement"
```

## Gestión de tareas en segundo plano (`jobs`, `fg`, `bg`)

```bash
long_traitement.sh &
jobs           # Enumera las tareas en segundo plano de la sesión actual
fg %1          # trae la tarea número 1 al primer plano
# Ctrl+Z suspende una tarea en primer plano (sin detenerla).
bg %1          # Reanuda en segundo plano una tarea suspendida con Ctrl+Z
```

## Ver los procesos en curso (`ps`, `top`)

```bash
ps aux             # Enumera todos los procesos del sistema, con el usuario, la CPU, la memoria...
ps aux | grep php   # filtro para ver solo los procesos relacionados con «php»
top                 # Vista interactiva, actualizada en tiempo real, ordenada por consumo de CPU de forma predeterminada
```

## Finalizar un proceso (`kill`)

`kill` envía una **señal** a un proceso, identificado por su PID (*Process ID*):

```bash
kill 1234        # envía SIGTERM (15): solicita amablemente al proceso que finalice de forma ordenada
kill -9 1234      # envía SIGKILL (9): fuerza el cierre inmediato, sin permitir que el proceso reaccione
```

| Señal | Número | Efecto |
|---|---|---|
| `SIGTERM` | 15 (por defecto) | Solicitud de cierre ordenado: el proceso puede interceptar esta señal para cerrarse de forma ordenada (cerrar archivos, guardar...) |
| `SIGKILL` | 9 | Parada inmediata e incondicional, imposible de interceptar o ignorar |
| `SIGINT` | 2 | Señal enviada por `Ctrl+C` desde el terminal |
| `SIGTSTP` | 20 | Señal enviada por `Ctrl+Z`: suspende el proceso (de forma controlada, a diferencia de `SIGKILL`) sin terminarlo |
| `SIGCONT` | 18 | Reanuda la ejecución de un proceso suspendido por `SIGTSTP` (esto es lo que envían `bg` / `fg`; véase el capítulo sobre la arquitectura de un shell) |

> **Nota:** «`kill -9`» debe ser siempre el último recurso: un proceso finalizado con «`SIGKILL`» no tiene ninguna posibilidad de limpiar lo que haya dejado atrás (archivos temporales, conexiones abiertas, bloqueos...). Intenta siempre primero «`kill`» (SIGTERM).

## Separar un proceso del terminal (`nohup`)

Un proceso iniciado en segundo plano con «`&`» recibe, no obstante, una señal de parada si se cierra la terminal que lo ha iniciado. «`nohup`» (*sin desconexión*) lo protege de ello:

```bash
nohup long_traitement.sh &
# El proceso continúa incluso después de cerrar el terminal.
# Su salida estándar se redirige por defecto a un archivo llamado nohup.out
```

## Cómo averiguar el PID de un proceso a partir de su nombre

```bash
pgrep -f "long_traitement.sh"   # muestra el PID o los PID correspondientes al motivo indicado
pkill -f "long_traitement.sh"    # Busca y finaliza con un solo comando (envía SIGTERM por defecto)
```
