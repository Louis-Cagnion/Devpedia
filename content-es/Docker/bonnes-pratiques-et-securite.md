---
order: 6
---

# Buenas prácticas y seguridad

## Una imagen mínima

Cada paquete instalado en una imagen es una **superficie de ataque** (un punto de entrada potencial más que un atacante podría explotar: una vulnerabilidad en un paquete nunca usado sigue siendo una vulnerabilidad) y un peso adicional en la descarga. Preferir una imagen base mínima ([`alpine`](https://alpinelinux.org), o una variante `-slim`) y un [build multi-etapa](/?c=docker&p=dockerfile) para entregar solo lo estrictamente necesario en la ejecución, nunca las herramientas de compilación.

## Fijar las versiones, nunca usar `latest` en producción

```dockerfile
FROM node:latest   # a evitar: el contenido real de "latest" cambia con el tiempo, sin avisar
FROM node:20.11.1  # reproducible: el mismo Dockerfile siempre construye lo mismo
```

Una imagen `latest` que cambia silenciosamente bajo un despliegue falla de la peor forma posible: el build tiene éxito, pero con un contenido distinto al de la última vez. Sería mejor que una versión ausente hiciera fallar el build explícitamente en lugar de construir igualmente con un contenido imprevisible.

## Nunca ejecutar un contenedor como `root`

Por defecto, un proceso en un contenedor se ejecuta como `root`; un `USER` explícito en el Dockerfile limita el daño si el contenedor es comprometido:

```dockerfile
RUN adduser -D miapp
USER miapp
```

Esta precaución se relaciona con el [principio del mínimo privilegio](/?c=domain-specific-languages-dsl&p=sql) ya visto para una cuenta de conexión a una base de datos, sección SQL: un proceso nunca debería tener más permisos de los que realmente necesita.

## Nunca embarcar un secreto en una imagen

Un valor pasado por `ENV` o `ARG` sigue siendo legible en los metadatos de la imagen (`docker history`), incluso tras un build multi-etapa que no lo copia en la imagen final: el secreto existió en una capa intermedia, y esa capa sigue siendo inspeccionable.

```dockerfile
# A EVITAR: la contraseña sigue visible en el historial de la imagen
ARG DB_PASSWORD=contrasena123
```

Los secretos deben inyectarse **en la ejecución** (variables de entorno pasadas a `docker run -e`, archivos montados vía un volumen, o un gestor de secretos dedicado), nunca grabados en una capa de la imagen, el mismo principio que nunca commitear una clave de API en el código fuente (cf. capítulo [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite), sección PHP).

### Secretos de Docker Compose vs simples variables de entorno

Una variable de entorno (`environment:` en Compose) sigue siendo legible por cualquiera que pueda inspeccionar el contenedor (`docker inspect`, o leer `/proc/<pid>/environ` desde el host), suficiente para una configuración ordinaria, pero poco adecuado para una contraseña. Los **secretos** de Compose pasan en cambio por un archivo, montado en solo lectura únicamente en los contenedores que lo declaran explícitamente:

```yaml
services:
  base:
    secrets:
      - db_password        # montado en solo lectura en /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt   # nunca commiteado, cf. .gitignore
```

La aplicación lee entonces la contraseña como un archivo ordinario (`cat /run/secrets/db_password`) en lugar de como una variable de entorno: un secreto así montado no aparece ni en `docker inspect`, ni en las variables de entorno del proceso.

## `.dockerignore` sistemático

Sin [`.dockerignore`](/?c=docker&p=dockerfile), un `COPY . .` embarca todo lo que hay en la carpeta, incluido un `.env` local, un `.git/` completo, o credenciales de configuración olvidadas. La lista mínima a excluir: `.git/`, `.env`, `node_modules/` (o equivalente), cualquier archivo de log.

## El aislamiento de un contenedor no es el de una máquina virtual

Un contenedor comparte el kernel de la máquina host (ver [Los conceptos básicos](/?c=docker&p=concepts-de-base)): una falla en ese kernel, o una mala configuración (contenedor lanzado en modo privilegiado `--privileged`, socket de Docker montado dentro de un contenedor) puede permitir salir de él y alcanzar el host directamente. Una VM opone una frontera de hardware mucho más hermética. Para un servicio expuesto públicamente y particularmente sensible, esta diferencia debe pesar en la elección entre contenedor y VM: Docker aísla procesos, no kernels.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una imagen mínima reduce la superficie de ataque. Un contenedor nunca debería ejecutarse como `root`, ni embarcar un secreto en sus capas: los secretos se inyectan en la ejecución, nunca en el Dockerfile. |
| **Herramientas utilizables** | `USER` (usuario no root), secretos de Docker Compose (archivo montado), `.dockerignore`. |
| **Trampas a evitar** | Usar `latest` en producción (contenido imprevisible); pasar un secreto vía `ARG`/`ENV`: sigue siendo legible en el historial de la imagen incluso tras un build multi-etapa. |
| **Buenas prácticas** | Fijar una versión precisa de cada imagen base; inyectar los secretos en la ejecución (variable de entorno al lanzar, archivo montado, gestor dedicado); nunca ejecutar un contenedor como `root`. |
