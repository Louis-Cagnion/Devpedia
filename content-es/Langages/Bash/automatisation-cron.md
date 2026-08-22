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

[`systemd`](https://www.freedesktop.org/software/systemd/man/systemd.html) es el sistema de inicialización usado por la mayoría de las distribuciones Linux modernas (Ubuntu, Debian, Fedora...): es él quien arranca y supervisa todos los servicios en segundo plano de la máquina — `cron` mismo forma parte de esos servicios en estas distribuciones. En un sistema basado en `systemd`, los **timers** cubren la misma necesidad que una línea de crontab, con una configuración más verbosa pero más explícita.

### Dos archivos en lugar de una línea

`systemd` configura cada comportamiento en una **unit** (unidad), un archivo de texto que describe *qué hacer* o *cuándo hacerlo*. Una tarea planificada necesita dos, vinculadas por su nombre de archivo:

```text
backup.service   ┐
                 ├─ mismo nombre, extensión diferente
backup.timer     ┘
```

El archivo `.service` describe el comando a ejecutar:

```ini
[Unit]
Description=Copia de seguridad nocturna de documentos   # texto mostrado en los registros/el estado

[Service]
Type=oneshot                                        # se ejecuta una vez y luego se detiene (no un servicio que sigue corriendo)
WorkingDirectory=/home/usuario/scripts              # directorio de trabajo antes de lanzar el comando
ExecStart=/usr/bin/python3 backup.py                # ruta absoluta, misma trampa del entorno mínimo que cron
```

El archivo `.timer` describe cuándo activar el servicio del mismo nombre:

```ini
[Unit]
Description=Planifica backup.service todos los días

[Timer]
OnCalendar=daily                                    # equivalente de @daily en cron
Persistent=true                                     # recupera la ejecución perdida si la máquina estaba apagada (ver más abajo)

[Install]
WantedBy=timers.target                              # necesario para que "enable" active realmente el timer
```

Ambos archivos van en `/etc/systemd/system/` (alcance del sistema, requiere permisos de root) o en `~/.config/systemd/user/` (alcance del usuario, ver más abajo). Una vez colocados:

```bash
systemctl daemon-reload              # relee los archivos de unidad tras crear/modificar uno
systemctl enable --now backup.timer  # activa el timer al arrancar Y lo inicia de inmediato
systemctl list-timers                # lista los timers activos y su próxima ejecución
journalctl -u backup.service         # consulta los registros de este servicio (reemplaza la redirección manual a un archivo de log)
```

### `Persistent=true`: la recuperación no es automática

Este es el matiz más importante a recordar: sin `Persistent=true`, un timer se comporta exactamente como `cron` — si la máquina está apagada en el momento previsto (ej. `OnCalendar=daily` a medianoche en un portátil apagado por la noche), la ejecución simplemente se pierde, no se recupera. `Persistent=true` cambia esto: `systemd` anota en disco la fecha de la última ejecución, y si el timer descubre en el siguiente arranque que se perdió una ejecución, la dispara de inmediato en lugar de esperar a la siguiente hora planificada.

| | Solo `OnCalendar` | `OnCalendar` + `Persistent=true` |
|---|---|---|
| Máquina encendida a la hora prevista | Se ejecuta a la hora prevista | Se ejecuta a la hora prevista |
| Máquina apagada a la hora prevista | Ejecución perdida (como `cron`) | Se ejecuta en el siguiente arranque del timer |

### Alcance de sistema o de usuario (`--user`)

Un timer colocado en `/etc/systemd/system/` corre independientemente de cualquier sesión abierta, pero requiere permisos de root para crearse. Un timer colocado en `~/.config/systemd/user/` no requiere permisos especiales, pero depende de una instancia de `systemd` propia del usuario (comandos con el prefijo `--user`: `systemctl --user enable --now ...`) — instancia que, por defecto, solo arranca cuando ese usuario abre una sesión, y se detiene al cerrarla.

Este último punto importa para la recuperación: un timer `--user` con `Persistent=true` solo puede recuperar una ejecución perdida en el siguiente inicio de sesión, no en el simple arranque de la máquina, si nadie se conecta enseguida. [`loginctl`](https://www.freedesktop.org/software/systemd/man/loginctl.html) permite levantar este límite para un usuario dado:

```bash
loginctl enable-linger usuario   # la instancia systemd --user de "usuario" arranca desde el boot, sesión abierta o no
```

### ¿`cron` o `systemd timer`?

| | `cron` | `systemd timer` |
|---|---|---|
| Rattrapaje si la máquina estaba apagada | No | Sí, con `Persistent=true` |
| Registro | Email (rara vez configurado) o redirección manual | Integrado (`journalctl`) |
| Dependencias entre tareas | No gestionadas nativamente | Sí (una unit puede depender de otra) |
| Configuración | Una línea en el crontab | Dos archivos por tarea |
| Alcance de usuario sin permisos de root | Sí, nativamente | Sí, vía `--user` (+ `loginctl enable-linger` para correr fuera de sesión) |

`cron` sigue siendo ampliamente suficiente para un uso personal o puntual sin necesidad de recuperación; los timers `systemd` se vuelven preferibles en cuanto una ejecución perdida deba recuperarse automáticamente, o en entornos de servidor modernos que ya se apoyan en `systemd` para todo lo demás.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `cron` ejecuta comandos a intervalos regulares definidos en un crontab (5 campos de tiempo). Corre en un entorno mínimo (sin `.bashrc`, `PATH` reducido): muy diferente de una terminal abierta manualmente. Los timers de `systemd` cubren la misma necesidad con la capacidad de recuperar ejecuciones perdidas. |
| **Herramientas utilizables** | `crontab -e`/`-l`, cadenas especiales (`@daily`, `@reboot`...), `flock` para evitar ejecuciones concurrentes; `.service`/`.timer` + `systemctl (--user) enable --now` + `journalctl` del lado de `systemd`. |
| **Trampas a evitar** | Suponer que el `PATH`/entorno de cron es idéntico al de una terminal interactiva; dejar que una tarea falle silenciosamente sin redirección de salida; creer que un `.timer` recupera automáticamente una ejecución perdida sin `Persistent=true`; olvidar que un timer `--user` solo corre durante una sesión abierta, salvo `loginctl enable-linger`. |
| **Buenas prácticas** | Usar rutas absolutas en un comando cron; redirigir sistemáticamente la salida a un archivo de log; añadir `Persistent=true` a todo `.timer` donde la recuperación sea necesaria. |
