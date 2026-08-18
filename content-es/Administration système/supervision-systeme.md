---
order: 6
---

# Leer el estado del sistema

Administrar un servidor supone poder responder en todo momento a preguntas simples: ¿cuánta memoria libre queda? ¿El disco se acerca a la saturación? ¿Quién está conectado en este momento? Este capítulo trata sobre dónde encontrar esta información; su difusión automática (por ejemplo, un mensaje enviado cada 10 minutos) corresponde a [la automatización con cron](/?c=shells&s=bash&p=automatisation-cron), ya tratada por separado.

## `/proc`: el sistema de archivos que no existe realmente

En Linux, `/proc` es un **sistema de archivos virtual**: sus archivos no existen en ningún disco, el núcleo los genera al vuelo en cada lectura para exponer su estado interno (procesos, memoria, hardware detectado). Leerlo funciona exactamente igual que leer un archivo normal (`cat`, `grep`, redirecciones), pero su contenido refleja el estado del sistema **en el momento preciso** de la lectura, nunca un valor almacenado en caché.

```bash
cat /proc/loadavg
# 0.15 0.10 0.05 1/523 12345
```

## Dónde encontrar cada información

| Información | Comando dedicado | Archivo `/proc` equivalente |
|---|---|---|
| Arquitectura y núcleo | `uname -a` | `/proc/version` |
| Número de CPU físicas | `lscpu` | `/proc/cpuinfo` (contar los `physical id` distintos) |
| Número de CPU virtuales (vCPU) | `nproc` | `/proc/cpuinfo` (contar las entradas `processor`) |
| Memoria utilizada (%) | `free -m` | `/proc/meminfo` (`MemTotal` / `MemAvailable`) |
| Espacio en disco utilizado (%) | `df -h` | - (información gestionada por el sistema de archivos montado, no por `/proc`) |
| Carga de CPU | `uptime` | `/proc/loadavg` |
| Fecha del último reinicio | `who -b` o `uptime -s` | `/proc/uptime` (segundos transcurridos desde el arranque) |
| Estado de LVM | `lvs` / `vgs` / `pvs` (véase [Particionamiento y LVM](/?c=administration-systeme&p=partitionnement-et-lvm)) | - |
| Conexiones activas | `ss -t` | `/proc/net/tcp` |
| Usuarios conectados | `who` o `w` | - |
| Dirección IPv4 y MAC | `ip addr` | `/proc/net/dev` (lista las interfaces, sin sus direcciones) |

> **Nota:** hay dos formas de obtener la misma información: un comando dedicado (`free`, `df`, `uptime`...), pensado para ser legible directamente, o el archivo `/proc` correspondiente, que hay que analizar uno mismo. Un comando dedicado sigue siendo preferible en cuanto existe; `/proc` sirve sobre todo cuando no hay ningún comando adaptado disponible, o para un script que necesita un valor bruto preciso en lugar de un texto ya formateado.

## Ejemplo: extraer una métrica precisa

```bash
# porcentaje de memoria utilizada, calculado a partir de /proc/meminfo
total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
disponible=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
echo "$(( (total - disponible) * 100 / total ))% de memoria utilizada"
```

Este tipo de extracción (mediante `awk`, véase [Procesamiento de texto](/?c=shells&s=bash&p=traitement-de-texte)) es la base de un script de supervisión del sistema: cada métrica de la tabla anterior se lee, se formatea y luego se ensambla en un único mensaje, que [`cron`](/?c=shells&s=bash&p=automatisation-cron) puede difundir después periódicamente (por ejemplo mediante `wall`, que muestra un mensaje a todos los usuarios conectados).

> **Trampa:** analizar directamente el formato de un archivo `/proc` (número de columnas, orden de los campos) sin comprobar que se mantiene estable: este formato no está garantizado como idéntico entre todas las versiones del núcleo. Un script que funciona en una máquina puede fallar silenciosamente en otra.
>
> **Buena práctica:** preferir un comando dedicado cuando existe (encapsula él mismo las variaciones de formato), y leer `/proc` directamente solo como último recurso, probando el script en la distribución realmente utilizada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `/proc` es un sistema de archivos virtual generado por el núcleo, que refleja el estado del sistema en tiempo real; cada métrica del sistema habitual (CPU, memoria, red, usuarios) es accesible mediante un comando dedicado o mediante un archivo `/proc` correspondiente. |
| **Herramientas utilizables** | `uname`, `lscpu`, `nproc`, `free`, `df`, `uptime`, `who`/`w`, `ss`, `ip addr`, `lvs`/`vgs`/`pvs`. |
| **Trampas a evitar** | Analizar un archivo `/proc` sin comprobar la estabilidad de su formato entre distribuciones/versiones del núcleo. |
| **Buenas prácticas** | Preferir un comando dedicado a `/proc` cuando existe; probar todo script de supervisión en la distribución realmente utilizada. |
