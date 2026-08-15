---
order: 14
---

# Automatizar tareas con cron

`cron` es un servicio que corre permanentemente en segundo plano (un **daemon**) y ejecuta comandos a intervalos regulares, definidos de antemano: copias de seguridad nocturnas, purga de archivos temporales, envío de informes periódicos.

## El archivo crontab

Cada usuario tiene su propio **crontab**, una lista de tareas planificadas, editada con:

```bash
crontab -e  # abre el crontab en el editor por defecto
crontab -l  # muestra el crontab actual sin abrirlo
crontab -r  # elimina todo el crontab del usuario actual
```

Cada línea sigue un formato de 5 campos de tiempo, seguidos del comando a ejecutar:

```text
┌───────────── minuto (0-59)
│ ┌─────────── hora (0-23)
│ │ ┌───────── día del mes (1-31)
│ │ │ ┌─────── mes (1-12)
│ │ │ │ ┌───── día de la semana (0-6, 0 = domingo)
│ │ │ │ │
* * * * *  comando_a_ejecutar
```

```bash
0 3 * * *          /home/usuario/scripts/backup.sh        # todos los días a las 3:00
*/15 * * * *       /home/usuario/scripts/verificar-espacio.sh  # cada 15 minutos
0 9 * * 1          /home/usuario/scripts/informe-semanal.sh    # todos los lunes a las 9:00
0 0 1 * *          /home/usuario/scripts/purgar-logs.sh        # el día 1 de cada mes a medianoche
```

Un `*` significa "en cada valor posible de este campo"; `*/15` en el campo de los minutos significa "cada 15 minutos" (0, 15, 30, 45).

## Cadenas especiales

Para las planificaciones habituales, unos atajos evitan tener que contar los campos:

| Cadena | Equivalente |
|---|---|
| `@reboot` | Ejecutada una vez, al arrancar el sistema |
| `@hourly` | `0 * * * *` |
| `@daily` | `0 0 * * *` |
| `@weekly` | `0 0 * * 0` |
| `@monthly` | `0 0 1 * *` |
| `@yearly` | `0 0 1 1 *` |

```bash
@reboot   /home/usuario/scripts/inicializar-cache.sh
@daily    /home/usuario/scripts/backup.sh
```

## La trampa del entorno mínimo

Un comando lanzado por cron no se ejecuta en el mismo contexto que una terminal abierta manualmente: cron arranca un shell **no interactivo**, que no carga ni `.bashrc` ni `.bash_profile`, y su [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) queda reducido a unos pocos directorios básicos del sistema, a menudo sin `/usr/local/bin`, donde se encuentran muchas herramientas instaladas manualmente.

Un script que funciona perfectamente lanzado a mano puede así fallar silenciosamente bajo cron, con un error `command not found` invisible ya que nada muestra esta salida por defecto (cf. sección siguiente). Dos precauciones sistemáticas:

```bash
# A evitar: supone que "python3" está en el PATH de cron
0 3 * * *   python3 backup.py

# Más seguro: ruta absoluta hacia el ejecutable Y el script
0 3 * * *   /usr/bin/python3 /home/usuario/scripts/backup.py
```

Si se necesita una variable de entorno precisa (una clave de API, por ejemplo), debe definirse explícitamente al principio del crontab o en el propio script: el entorno del shell interactivo habitual no existe aquí.

## Nunca dejar que una tarea cron falle en silencio

Por defecto, la salida de un comando cron (si produce alguna) se envía por email al usuario local (rara vez configurado, por tanto generalmente perdida). Redirigir explícitamente a un archivo de log (ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes)) hace la ejecución rastreable:

```bash
0 3 * * *   /home/usuario/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Una tarea cron que falla sin que nadie lo note es un fallo silencioso: una de las trampas más costosas en automatización, ya que el problema solo se descubre cuando su ausencia de resultado se convierte ella misma en un incidente (una copia de seguridad que en realidad no se ha ejecutado nunca desde hace meses). Un comando de repliegue tras un `||` (ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes) para el encadenamiento de comandos), o un servicio de supervisión externo notificado en caso de fallo, transforma ese silencio en una señal explícita.

## Evitar ejecuciones concurrentes con `flock`

Si una tarea puede durar más que el intervalo que la relanza (ej. cada 5 minutos, pero una ejecución que a veces tarda 8 minutos), dos instancias pueden solaparse. `flock` garantiza que solo corra una instancia a la vez, apoyándose en un bloqueo (archivo) en lugar de en una suposición de duración:

```bash
*/5 * * * *   flock -n /tmp/backup.lock /home/usuario/scripts/backup.sh
```

`-n` (*non-blocking*) hace que un nuevo intento falle inmediatamente si el bloqueo ya está tomado, en lugar de acumular ejecuciones en espera.

## `systemd timers`, una alternativa en sistemas basados en systemd

En las distribuciones que usan `systemd`, los **timers** cubren la misma necesidad con además dependencias explícitas entre servicios, un mejor registro (integrado con `journalctl`), y una ejecución garantizada incluso si la máquina estaba apagada en el momento previsto. Más verbosos de configurar que una simple línea de crontab, se prefieren en entornos de servidor modernos por esta razón; `cron` sigue siendo ampliamente suficiente para un uso personal o puntual.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `cron` ejecuta comandos a intervalos regulares definidos en un crontab (5 campos de tiempo). Corre en un entorno mínimo (sin `.bashrc`, `PATH` reducido): muy diferente de una terminal abierta manualmente. |
| **Herramientas utilizables** | `crontab -e`/`-l`, cadenas especiales (`@daily`, `@reboot`...), `flock` para evitar ejecuciones concurrentes. |
| **Trampas a evitar** | Suponer que el `PATH`/entorno de cron es idéntico al de una terminal interactiva; dejar que una tarea falle silenciosamente sin redirección de salida. |
| **Buenas prácticas** | Usar rutas absolutas en un comando cron; redirigir sistemáticamente la salida a un archivo de log. |
