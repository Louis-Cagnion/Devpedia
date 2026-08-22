---
order: 4
---

# Volúmenes y redes

## El sistema de archivos de un contenedor es efímero

La capa escribible de un contenedor (ver [Los conceptos básicos](/?c=docker&p=concepts-de-base)) desaparece con él: eliminar un contenedor pierde todos los datos que escribió, a menos que vivan en un **volumen**.

```bash
docker run -v mis-datos:/var/lib/mysql mysql:8
```

Aquí, `mis-datos` es un **volumen nombrado**, gestionado por Docker y almacenado independientemente de cualquier contenedor: eliminar el contenedor no elimina el volumen, y un nuevo contenedor puede vincularse al mismo volumen para recuperar los datos.

## Volúmenes nombrados vs bind mounts

| | Volumen nombrado | Bind mount |
|---|---|---|
| Ubicación | Gestionado por Docker, ruta interna no relevante | Una ruta **precisa** de la máquina host |
| Sintaxis | `-v mis-datos:/ruta` | `-v /ruta/host:/ruta` (la ruta del host empieza por `/` o `./`) |
| Uso típico | Datos persistentes de una base de datos, de un servicio | Montar el código fuente en desarrollo para ver los cambios sin reconstruir la imagen |

```bash
# Bind mount: la carpeta actual del host se convierte en /app en el contenedor
docker run -v $(pwd):/app mi-app:1.0
```

> **Trampa frecuente en desarrollo:** un bind mount sobre `/app` oculta por completo lo que la imagen había copiado en ese lugar durante el build: si la imagen instala dependencias en `/app/node_modules` y el bind mount sobrescribe todo `/app` con la carpeta del host (donde `node_modules` no necesariamente existe), el contenedor arranca sin sus dependencias.

## Redes: los contenedores se ven por su nombre

Por defecto, Docker crea una red **bridge**: cada contenedor recibe ahí su propia dirección IP interna, y dos contenedores en la misma red pueden alcanzarse directamente **por su nombre**, sin configuración manual: Docker resuelve ese nombre internamente, con el mismo principio que el [DNS](/?c=langages-de-programmation&s=php&p=securite) que traduce un nombre de dominio en una dirección IP en Internet.

```bash
docker network create mi-red
docker run --network mi-red --name base mysql:8
docker run --network mi-red --name api mi-app:1.0
```

Desde el contenedor `api`, conectarse a la base de datos se hace apuntando al host `base` (ej. `mysql://base:3306`), no a una dirección IP: esa dirección cambiaría en cada reinicio, el nombre, en cambio, permanece estable.

## Publicar un puerto hacia el exterior

`EXPOSE` en un [Dockerfile](/?c=docker&p=dockerfile) solo **documenta** un puerto; únicamente `-p` en `docker run` lo hace realmente accesible desde fuera del contenedor:

```bash
docker run -p 8080:80 mi-app:1.0
# host:8080  -->  contenedor:80
```

Dos contenedores en la misma red ya se comunican entre sí sin `-p` (se ven directamente en la red interna); `-p` solo es necesario para exponer un servicio **fuera** de Docker, hacia la máquina host o el exterior.

## El modo `host`: compartir directamente la red del host

```bash
docker run --network host mi-app:1.0
```

Este modo no crea ninguna interfaz de red propia del contenedor: reutiliza directamente la de la máquina host, sin pasar por el [namespace de red](/?c=docker&p=concepts-de-base) que normalmente aísla cada contenedor. Un puerto abierto por la aplicación en su interior es entonces inmediatamente un puerto abierto en el host mismo, sin mapping `-p` ni traducción de dirección.

> **Nota:** esta ganancia en simplicidad (y algo de rendimiento de red) se paga con la pérdida de una de las dos barreras de aislamiento vistas en [Los conceptos básicos](/?c=docker&p=concepts-de-base): un contenedor comprometido en modo `host` ve y potencialmente puede alcanzar todo lo que escucha en la red del host, exactamente como un proceso clásico de ese mismo host. Por eso este modo generalmente se evita para un servicio expuesto públicamente, en favor de la red bridge por defecto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El sistema de archivos de un contenedor es efímero: solo un volumen (nombrado o bind mount) persiste tras su eliminación. Los contenedores de una misma red Docker se alcanzan directamente por su nombre. |
| **Herramientas utilizables** | `-v` (volumen/bind mount), `docker network create`, `-p` para publicar un puerto hacia el exterior. |
| **Trampas a evitar** | Un bind mount que oculta una carpeta ya poblada por la imagen (ej. `node_modules` instalado en el build, sobrescrito por el bind mount); el modo `--network host` que elimina el aislamiento de red del contenedor. |
| **Buenas prácticas** | Usar un volumen nombrado para datos persistentes (base de datos), un bind mount para el código fuente en desarrollo; evitar `--network host` para un servicio expuesto públicamente. |
