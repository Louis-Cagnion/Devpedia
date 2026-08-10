---
order: 4
---

# Volumes and Networks

## A container's file system is ephemeral

A container’s writable layer (see [Basic Concepts](/?c=docker&p=concepts-de-base)) is deleted along with the container: deleting a container erases all the data it has written, unless that data is stored in a **volume**.

```bash
docker run -v mes-data:/var/lib/mysql mysql:8
```

Here, `mes-data` is a **named volume** managed by Docker and stored independently of any container: deleting the container does not delete the volume, and a new container can be mounted to the same volume to retrieve the data.

## Named volumes vs. bind mounts

| | Volume name | Bind mount |
|---|---|---|
| Location | Managed by Docker; internal path not relevant | A **specific** path on the host machine |
| Syntax | `-v mes-data:/path` | `-v /path/hote:/path` (host path begins with `/` or `./`) |
| Typical use | Persistent data from a database or service | Mount the source code during development to view changes without rebuilding the image |

```bash
# Bind mount: the host's current directory becomes /app in the container
docker run -v $(pwd):/app mon-app:1.0
```

> **A common pitfall in development**: A bind mount on `/app` completely masks what the image had copied to that location at build time—if the image installs dependencies in `/app/node_modules` and the bind mount overwrites everything in `/app` with the host’s directory (where `node_modules` may not exist), the container will start without its dependencies.

## Networking: Containers are identified by their names

By default, Docker creates a **bridge** network: each container is assigned its own internal IP address, and two containers on the same network can communicate directly **using their names**, without any manual configuration — Docker resolves this name internally, using the same principle as [DNS](/?c=langages-de-programmation&s=php&p=securite), which translates a domain name into an IP address on the Internet.

```bash
docker network create mon-reseau
docker run --network mon-reseau --name base mysql:8
docker run --network mon-reseau --name api mon-app:1.0
```

From the `api` container, connect to the database by targeting the host `base` (e.g., `mysql://base:3306`), not an IP address—the IP address would change with every restart, whereas the hostname remains constant.

## Publish a port to the outside world

`EXPOSE` In a [Dockerfile](/?c=docker&p=dockerfile), this simply **documents** a port; only `-p` on `docker run` actually makes it accessible from outside the container:

```bash
docker run -p 8080:80 mon-app:1.0
# host:8080  -->  container:80
```

Two containers on the same network already communicate with each other without `-p` (they can see each other directly on the internal network); `-p` is only necessary to expose a service **outside** of Docker, to the host machine or to the outside world.

## `host`: Directly share the host's network

```bash
docker run --network host mon-app:1.0
```

This mode does not create any container-specific network interface: it directly reuses the host machine’s interface, bypassing the [network namespace](/?c=docker&p=concepts-de-base) that normally isolates each container. A port opened by the application inside the container is therefore immediately an open port on the host itself, without any `-p` mapping or address translation.

> **Note:** This gain in simplicity (and a slight improvement in network performance) comes at the cost of losing one of the two isolation barriers discussed in [Basic Concepts](/?c=docker&p=concepts-de-base) — a compromised container in "`host`" mode can see and potentially reach anything listening on the host’s network, just like a regular process on that same host. This is why this mode is generally avoided for publicly exposed services, in favor of the default bridge network.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A container’s file system is ephemeral—only a volume (named or bind-mounted) persists after the container is deleted. Containers on the same Docker network can connect directly to each other by name. |
| **Tools available** | `-v` (volume/bind mount), `docker network create`, `-p` for publishing a port externally. |
| **Pitfalls to Avoid** | A bind mount that overwrites a folder already populated by the image (e.g., `node_modules` installed during the build, overwritten by the bind mount); the "`--network host`" mode, which removes the container's network isolation. |
| **Best Practices** | Use a named volume for persistent data (database) and a bind mount for source code under development; avoid using `--network host` for a publicly exposed service. |
