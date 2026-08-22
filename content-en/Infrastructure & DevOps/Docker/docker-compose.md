---
order: 5
---

# Docker Compose

A real-world project rarely involves just a single container: an API, its database, a cache, a **reverse proxy** (a server that receives all incoming requests and redirects them to the correct internal service, [Nginx](https://nginx.org) or [Traefik](https://doc.traefik.io/traefik/) for example, acting as a single entry point)... Chaining `docker run` commands manually quickly becomes unmanageable. **Docker Compose** describes all these services in a single declarative file in [**YAML**](https://yaml.org/spec/1.2.2/) format (*YAML Ain’t Markup Language*: a text format structured by indentation, widely used for configuration), `docker-compose.yml`, and starts them all together.

## A complete example

```yaml
services:
  api:
    build: .                    # Builds the image from the Dockerfile in the current directory
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=mysql://base:3306/app
    depends_on:
      - base

  base:
    image: mysql:8               # Uses an existing image directly; no build required
    volumes:
      - data-mysql:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=changeme

volumes:
  data-mysql:
```

```bash
docker compose up -d       # Builds (if necessary) and starts all background services
docker compose logs -f api  # Monitors the logs of a specific service
docker compose down         # Stops and deletes containers (named volumes remain intact)
```

> **YAML is case-sensitive**, just like [Python](/?c=langages-de-programmation&s=python&p=python): two lines at the same level must have the same indentation, and tabs are generally invalid (YAML only accepts spaces). An indentation error silently alters the document’s structure rather than causing an explicit error: this should be checked first in the event of unexpected behavior.

## What Compose automates

- **The network**: All services from the same file are automatically placed on a shared network: `base` is already accessible by name at `api`, without the need for a manual `docker network create` (see [Volumes and Networks](/?c=docker&p=volumes-et-reseaux)).
- **The startup order**: `depends_on` starts `base` before `api`. This guarantees the container’s **startup** order, but does not ensure that the internal service (in this case, [MySQL](https://dev.mysql.com/doc/)) is already ready to accept connections: an application that connects too early must still provide for a retry (see [Waiting Without Wasting Time](/?c=performance&p=attentes-et-temps-morts), under the Performance section) rather than assuming that the database will respond immediately.
- **Volumes declared once**: `data-mysql`, defined at the bottom of the file, is created automatically if it does not yet exist.

## Rebuild after a change to the Dockerfile

Compose does not automatically rebuild an image on every `up` if it already exists in the cache:

```bash
docker compose up -d --build   # Forces the images to be rebuilt before starting
```

## Automatic restart in the event of a crash

By default, a container that crashes remains stopped; `restart` defines the appropriate course of action:

| Value | Behavior |
|---|---|
| `no` (default) | Never restart automatically |
| `on-failure` | Restarts only if the main process terminates with an error code |
| `always` | Always restarts, even after a `docker stop` followed by a restart of the Docker daemon |
| `unless-stopped` | Same as `always`, unless the container was explicitly stopped (`docker stop`) before the daemon restarted |

```yaml
services:
  api:
    build: .
    restart: unless-stopped   # Restarts after a crash or a reboot of the host machine
```

## Explicitly declare your network

Compose creates a default network even without a `networks:` section (see above); it’s still preferable to declare it explicitly if you want to give it a clear name or set up multiple separate networks (e.g., to isolate the database from the rest):

```yaml
services:
  api:
    networks:
      - mon-reseau
  base:
    networks:
      - mon-reseau

networks:
  mon-reseau:
```

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | Docker Compose describes multiple services in a single YAML file and starts them together, automatically providing a shared network. `depends_on` controls the startup process, but does not guarantee that an internal service is already ready. |
| **Tools available** | `docker compose up -d` / `logs -f` / `down`, `restart: unless-stopped`, Compose secrets (mounted file, not an environment variable). |
| **Pitfalls to Avoid** | A YAML indentation error, which silently changes the structure without an explicit error message; assuming that a dependent service is already ready as soon as it starts. |
| **Best Practices** | Plan for a retry on the application side rather than assuming that a dependent service will respond immediately; explicitly declare networks whenever you want to name them or isolate certain ones. |
