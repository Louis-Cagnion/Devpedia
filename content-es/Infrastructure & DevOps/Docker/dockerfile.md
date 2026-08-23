---
order: 2
---

# El Dockerfile

Un **Dockerfile** es una receta en texto: una serie de instrucciones que describe cómo construir una imagen, paso a paso. `docker build` la ejecuta y produce la imagen correspondiente.

## Las instrucciones esenciales

```dockerfile
FROM node:20-alpine        # imagen base: Node.js 20 sobre una distribucion Alpine (minima)
WORKDIR /app                # carpeta de trabajo dentro del contenedor para todas las instrucciones siguientes

COPY package*.json ./       # copia estos archivos desde la maquina host hacia la imagen
RUN npm install              # ejecuta un comando DURANTE la construccion de la imagen

COPY . .                    # copia el resto del codigo fuente

ENV NODE_ENV=production     # variable de entorno, disponible en el build y en la ejecucion
EXPOSE 3000                  # documenta el puerto usado (no abre nada por si sola, cf. capitulo redes)

CMD ["node", "server.js"]   # comando ejecutado cuando el CONTENEDOR arranca, no durante el build
```

| Instrucción | Rol |
|---|---|
| `FROM` | Imagen base sobre la que construir (siempre la primera instrucción) |
| `WORKDIR` | Cambia la carpeta actual para el resto del Dockerfile: evita `cd` repetidos |
| `COPY` | Copia archivos del host hacia la imagen |
| `RUN` | Ejecuta un comando en el momento de la construcción, su resultado queda capturado en una nueva capa |
| `ENV` | Define una variable de entorno, persistente en la imagen y para el contenedor |
| `EXPOSE` | Documenta el puerto en el que escucha la aplicación (solo informativo) |
| `CMD` | Comando por defecto al arrancar el contenedor, reemplazable en línea de comandos |
| `ENTRYPOINT` | Como `CMD`, pero no reemplazable: útil para forzar un ejecutable fijo y dejar que solo varíen sus argumentos |

> **`RUN` vs `CMD`:** `RUN` se ejecuta una vez, **durante** la construcción de la imagen (instalar paquetes, compilar código) y su resultado queda fijado en una capa. `CMD` nunca se ejecuta durante el build: solo registra el comando a lanzar **en cada arranque** de un contenedor a partir de esa imagen.

`RUN` ejecuta su comando a través de un shell (cf. capítulo [Scripts y shebang](/?c=shells&s=bash&p=scripts-et-shebang)): se aplican las mismas trampas, en particular la inyección de comandos si un valor externo se interpola sin cuidado en una instrucción `RUN`.

## El contenedor vive exactamente lo mismo que su proceso principal (PID 1)

El proceso lanzado por `CMD`/`ENTRYPOINT` recibe el PID 1 dentro del contenedor (cf. los [namespaces](/?c=docker&p=concepts-de-base)): en cuanto termina, el contenedor se detiene, sin importar cuántos otros procesos sigan activos dentro.

Por eso un comando que nunca termina pero por lo demás no hace **nada** (`tail -f /dev/null`, `sleep infinity`, `while true; do sleep 1; done`) es un mal reflejo para "mantener vivo el contenedor": eso enmascara el verdadero problema (el servicio que realmente se quiere ejecutar se detuvo, o nunca se lanzó) en lugar de resolverlo. La buena práctica es lanzar directamente, como PID 1, el servicio deseado **en primer plano** (*foreground*); la mayoría de los daemons tienen una opción dedicada para esto, que les impide desprenderse en segundo plano como harían de forma nativa (`nginx -g 'daemon off;'`, por ejemplo):

```dockerfile
CMD ["nginx", "-g", "daemon off;"]   # nginx permanece en primer plano: Docker tiene un proceso que vigilar
```

> **Nota:** el PID 1 tiene un rol particular en Linux, independiente de Docker (cf. capítulo [La gestión de procesos](/?c=shells&s=bash&p=gestion-des-processus), sección [Bash](/?c=shells&s=bash&p=bash)): el kernel no le aplica la acción por defecto de una señal como `SIGTERM` si no ha instalado explícitamente su propio manejador: `docker stop` puede entonces parecer no hacer nada sobre un proceso que no gestiona esa señal por sí mismo. También es el PID 1 quien debe recuperar (*reap*) los procesos zombis que lanza; un punto a vigilar si la imagen lanza ella misma varios subprocesos.

## Cada instrucción crea una capa, y el orden importa

Cada `RUN`/`COPY`/`ADD` añade una capa, guardada en caché: si una instrucción y todo lo que la precede no ha cambiado desde el último build, Docker reutiliza la capa en caché en lugar de reconstruirla.

```dockerfile
# Mal orden: el menor cambio en el codigo fuente invalida la cache de `npm install`
COPY . .
RUN npm install

# Buen orden: `npm install` solo se rehace si package.json cambia realmente
COPY package*.json ./
RUN npm install
COPY . .
```

Por eso los archivos que cambian con menos frecuencia (dependencias) se copian e instalan **antes** que el código fuente, que cambia en cada commit.

## Los builds multi-etapa

Un build multi-etapa separa el entorno de **compilación** (pesado: compilador, herramientas de build) del entorno de **ejecución** (ligero: solo el binario final), el mismo principio que separar compilación y enlazado en [C](/?c=langages-de-programmation&s=c&p=c) (cf. capítulo [El proceso de compilación](/?c=langages-de-programmation&s=c&p=compilation)): el resultado final no necesita la cadena de herramientas que lo produjo.

```dockerfile
# Etapa 1: compilacion, con toda la toolchain de Go
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o servidor

# Etapa 2: ejecucion, imagen minima sin ninguna herramienta de compilacion
FROM alpine:3.19
COPY --from=builder /app/servidor /usr/local/bin/servidor
CMD ["servidor"]
```

Solo el binario `servidor` se copia de la etapa `builder` hacia la imagen final: el compilador de [Go](https://go.dev) (varios cientos de MB) nunca forma parte de la imagen entregada.

## `.dockerignore`

Funciona como [`.gitignore`](/?c=git&p=gitignore) pero para `docker build`: los archivos listados nunca se envían al motor Docker para la construcción de la imagen, los hubiera copiado o no un `COPY . .`.

```text
node_modules/
.git/
*.log
.env
```

Excluir `node_modules/` acelera el build (menos datos que transmitir); excluir `.env` evita que un secreto local termine embarcado en una imagen (ver [Buenas prácticas y seguridad](/?c=docker&p=bonnes-pratiques-et-securite)).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un Dockerfile describe la construcción de una imagen, instrucción por instrucción. Cada instrucción crea una capa guardada en caché; el orden importa para maximizar la reutilización de la caché. El contenedor vive exactamente lo mismo que su proceso PID 1. |
| **Herramientas utilizables** | `FROM`/`WORKDIR`/`COPY`/`RUN`/`CMD`, builds multi-etapa, `.dockerignore`. |
| **Trampas a evitar** | Copiar todo el código antes de instalar las dependencias (invalida la caché en cada commit); mantener un contenedor "vivo" con un comando que no hace nada (`sleep infinity`) en lugar de lanzar el servicio real en primer plano. |
| **Buenas prácticas** | Copiar los archivos de dependencias antes que el resto del código fuente; usar un build multi-etapa para entregar solo el binario final, sin la cadena de compilación. |
