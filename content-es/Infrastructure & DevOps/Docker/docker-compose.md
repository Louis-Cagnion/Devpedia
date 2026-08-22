---
order: 5
---

# Docker Compose

Un proyecto real rara vez implica un solo contenedor: una API, su base de datos, una caché, un **reverse proxy** (un servidor que recibe todas las peticiones entrantes y las redirige al servicio interno correcto, [Nginx](https://nginx.org) o [Traefik](https://doc.traefik.io/traefik/) por ejemplo, sirviendo como punto de entrada único)... Encadenar `docker run` a mano rápidamente se vuelve inmanejable. **Docker Compose** describe todos estos servicios en un único archivo declarativo en formato [**YAML**](https://yaml.org/spec/1.2.2/) (*YAML Ain't Markup Language*: un formato de texto estructurado por indentación, ampliamente usado para configuración), `docker-compose.yml`, y los arranca juntos.

## Un ejemplo completo

```yaml
services:
  api:
    build: .                    # construye la imagen desde el Dockerfile de la carpeta actual
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=mysql://base:3306/app
    depends_on:
      - base

  base:
    image: mysql:8               # usa directamente una imagen existente, sin build
    volumes:
      - datos-mysql:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=changeme

volumes:
  datos-mysql:
```

```bash
docker compose up -d        # construye (si es necesario) y arranca todos los servicios en segundo plano
docker compose logs -f api  # sigue los logs de un servicio concreto
docker compose down         # detiene y elimina los contenedores (los volumenes con nombre sobreviven)
```

> **YAML es sensible a la indentación**, exactamente como [Python](/?c=langages-de-programmation&s=python&p=python): dos líneas al mismo nivel deben tener la misma indentación, y una tabulación suele ser inválida ahí (YAML solo acepta espacios). Un error de indentación cambia silenciosamente la estructura del documento en lugar de provocar un error explícito: es lo primero a verificar ante un comportamiento inesperado.

## Lo que Compose automatiza

- **La red**: todos los servicios de un mismo archivo se colocan automáticamente en una red común: `base` ya es accesible por su nombre desde `api`, sin `docker network create` manual (ver [Volúmenes y redes](/?c=docker&p=volumes-et-reseaux)).
- **El orden de arranque**: `depends_on` arranca `base` antes que `api`. Esto garantiza el orden de **arranque** del contenedor, no que el servicio interno (aquí [MySQL](https://dev.mysql.com/doc/)) ya esté listo para aceptar conexiones: una aplicación que se conecta demasiado pronto debe prever aun así un reintento (cf. [Esperar sin perder tiempo](/?c=performance&p=attentes-et-temps-morts), sección Rendimiento) en lugar de suponer que la base responde desde el primer instante.
- **Los volúmenes declarados una vez**: `datos-mysql` definido al final del archivo se crea automáticamente si aún no existe.

## Reconstruir tras un cambio en el Dockerfile

Compose no reconstruye una imagen automáticamente en cada `up` si ya existe en caché:

```bash
docker compose up -d --build   # fuerza la reconstruccion de las imagenes antes de arrancar
```

## Reinicio automático en caso de caída

Por defecto, un contenedor que falla queda detenido; `restart` define la conducta a seguir:

| Valor | Comportamiento |
|---|---|
| `no` (por defecto) | No reinicia nunca automáticamente |
| `on-failure` | Reinicia solo si el proceso principal termina con un código de error |
| `always` | Reinicia siempre, incluso tras un `docker stop` seguido de un reinicio del daemon Docker |
| `unless-stopped` | Como `always`, salvo si el contenedor fue detenido explícitamente (`docker stop`) antes del reinicio del daemon |

```yaml
services:
  api:
    build: .
    restart: unless-stopped   # reinicia tras una caida o un reinicio de la maquina host
```

## Declarar explícitamente su red

Compose crea una red por defecto incluso sin sección `networks:` (ver más arriba); declararla explícitamente sigue siendo preferible en cuanto se quiere darle un nombre claro o varias redes distintas (ej. aislar la base de datos del resto):

```yaml
services:
  api:
    networks:
      - mi-red
  base:
    networks:
      - mi-red

networks:
  mi-red:
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Docker Compose describe varios servicios en un único archivo YAML y los arranca juntos, con una red común automática. `depends_on` ordena el arranque, sin garantizar que un servicio interno ya esté listo. |
| **Herramientas utilizables** | `docker compose up -d`/`logs -f`/`down`, `restart: unless-stopped`, secretos de Compose (archivo montado, no una variable de entorno). |
| **Trampas a evitar** | Un error de indentación YAML, que cambia silenciosamente la estructura sin error explícito; suponer que un servicio dependiente ya está listo desde su arranque. |
| **Buenas prácticas** | Prever un reintento de conexión en la aplicación en lugar de suponer que un servicio dependiente responde desde el primer instante; declarar explícitamente las redes en cuanto se quieren nombrar o aislar algunas. |
