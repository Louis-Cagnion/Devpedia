---
order: 3
---

# Essential Commands

## Build and Run

```bash
docker build -t mon-app:1.0 .     # Builds an image named "my-app" with tag "1.0" from the Dockerfile in the current directory (.)
docker run mon-app:1.0             # Launch a container from this image
```

Common options for `docker run`:

```bash
docker run -d --name serveur -p 8080:80 mon-app:1.0
```

| Option | Effect |
|---|---|
| `-d` | Detached: the container runs in the background, and the terminal remains available, same principle as `&` in Bash |
| `--name` | Give the container an explicit name, rather than a randomly generated identifier |
| `-p 8080:80` | Publish the port: the container's port `80` becomes accessible on the host's port `8080` (see [Volumes and Networks](/?c=docker&p=volumes-et-reseaux)) |
| `-it` | Interactive + pseudo-terminal (*tty*): required for a container with which you want to interact directly (e.g., a shell) |
| `--rm` | Automatically deletes the container as soon as it stops: useful for one-time use, preventing stopped containers from piling up |
| `-e VAR=value` | Sets an environment variable in the container |

## Monitor what's running

```bash
docker ps               # running containers
docker ps -a             # All containers, including those that have been stopped
docker logs serveur       # Standard/error output from the "server" container
docker logs -f serveur     # Monitors logs in real time (equivalent to `tail -f`)
```

From the host system’s perspective, a container is just one process among many: `docker ps` is equivalent to `ps aux` filtered to show only processes launched by Docker (see the chapter [Process Management](/?c=shells&s=bash&p=gestion-des-processus), under the Bash section).

## Entering a Running Container

```bash
docker exec -it serveur sh    # Opens an interactive shell inside the "server" container
```

Useful for inspecting the status of a container that is already running (files, environment variables, internal processes) without having to restart it.

## Shut Down and Clean Up

```bash
docker stop serveur       # Sends SIGTERM, allowing the container to shut down properly (see [signal table](/?c=shells&s=bash&p=gestion-des-processus), Bash section)
docker kill serveur        # sends SIGKILL, causing an immediate and unconditional shutdown
docker rm serveur          # Removes a stopped container
docker rmi mon-app:1.0     # removes an image
```

> **Note:** `docker stop` and `docker kill` show exactly the same SIGTERM → SIGKILL hierarchy as described in the chapter on process management: Docker does not reinvent a shutdown mechanism; it controls the host system’s mechanism.

```bash
docker system prune        # Removes stopped containers, unused images, and unused build caches
```

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `docker build` / `run` build and start a container; `docker ps` / `logs` / `exec` allow you to monitor and access it; `docker stop` / `kill` / `rm` stop and delete it. |
| **Available tools** | `-d` (detached), `-p` (publish a port), `-e` (environment variable), `--rm` (automatic cleanup). |
| **Pitfalls to Avoid** | Allowing stopped containers and unused images to accumulate without ever performing a `docker system prune`. |
| **Best Practices** | Use `--rm` for a one-time container; `docker stop` (clean shutdown) before `docker kill` (forced shutdown). |
