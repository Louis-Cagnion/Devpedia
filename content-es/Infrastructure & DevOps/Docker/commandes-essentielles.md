---
order: 3
---

# Los comandos esenciales

## Construir y lanzar

```bash
docker build -t mi-app:1.0 .  # construye una imagen llamada "mi-app", tag "1.0", desde el Dockerfile de la carpeta actual (.)
docker run mi-app:1.0         # lanza un contenedor a partir de esta imagen
```

Opciones habituales de `docker run`:

```bash
docker run -d --name servidor -p 8080:80 mi-app:1.0
```

| Opción | Efecto |
|---|---|
| `-d` | Desacoplado (*detached*): el contenedor corre en segundo plano, la terminal sigue disponible, mismo principio que `&` en [Bash](/?c=shells&s=bash&p=bash) |
| `--name` | Da un nombre explícito al contenedor, en lugar de un identificador generado aleatoriamente |
| `-p 8080:80` | Publica el puerto: el puerto `80` del contenedor se vuelve accesible en el puerto `8080` del host (ver [Volúmenes y redes](/?c=docker&p=volumes-et-reseaux)) |
| `-it` | Interactivo + pseudo-terminal (*tty*): necesario para un contenedor con el que se quiere interactuar directamente (ej. un shell) |
| `--rm` | Elimina automáticamente el contenedor en cuanto se detiene: práctico para un uso puntual, sin dejar acumularse contenedores detenidos |
| `-e VAR=valor` | Define una variable de entorno en el contenedor |

## Observar lo que corre

```bash
docker ps               # contenedores en ejecucion
docker ps -a             # todos los contenedores, incluidos los detenidos
docker logs servidor    # salida estandar/error del contenedor "servidor"
docker logs -f servidor # sigue los logs en directo (equivalente a `tail -f`)
```

Un contenedor, desde el punto de vista del sistema host, no es más que un proceso entre otros: `docker ps` es el equivalente de `ps aux` filtrado sobre los procesos lanzados por Docker (cf. capítulo [La gestión de procesos](/?c=shells&s=bash&p=gestion-des-processus), sección Bash).

## Entrar en un contenedor en ejecución

```bash
docker exec -it servidor sh    # abre un shell interactivo dentro del contenedor "servidor"
```

Útil para inspeccionar el estado de un contenedor que ya está corriendo (archivos, variables de entorno, procesos internos) sin tener que relanzarlo.

## Detener y limpiar

```bash
docker stop servidor    # envia SIGTERM, deja que el contenedor se detenga limpiamente (cf. [tabla de señales](/?c=shells&s=bash&p=gestion-des-processus), sección Bash)
docker kill servidor    # envia SIGKILL, parada inmediata e incondicional
docker rm servidor      # elimina un contenedor detenido
docker rmi mi-app:1.0   # elimina una imagen
```

> **Nota:** `docker stop` y luego `docker kill` reproducen exactamente la misma jerarquía SIGTERM → SIGKILL vista en el capítulo sobre la gestión de procesos: Docker no reinventa un mecanismo de parada, pilota el del sistema host.

```bash
docker system prune        # elimina contenedores detenidos, imagenes no usadas, cachés de build sin usar
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `docker build`/`run` construyen y lanzan un contenedor; `docker ps`/`logs`/`exec` permiten observarlo y entrar en él; `docker stop`/`kill`/`rm` lo detienen y lo eliminan. |
| **Herramientas utilizables** | `-d` (desacoplado), `-p` (publicar un puerto), `-e` (variable de entorno), `--rm` (limpieza automática). |
| **Trampas a evitar** | Dejar que se acumulen contenedores detenidos e imágenes no usadas sin hacer nunca un `docker system prune`. |
| **Buenas prácticas** | Usar `--rm` para un contenedor puntual; `docker stop` (parada limpia) antes de `docker kill` (parada forzada). |
