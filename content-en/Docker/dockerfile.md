---
order: 2
---

# The Dockerfile

A **Dockerfile** is a text-based recipe: a sequence of instructions describing how to build an image, step by step. `docker build` executes it and produces the corresponding image.

## Essential Instructions

```dockerfile
FROM node:20-alpine        # Base image: Node.js 20 on an Alpine distribution (minimal)
WORKDIR /app                # Working directory in the container for all of the following commands

COPY package*.json ./       # Copy these files from the host machine to the image
RUN npm install              # Executes a command WHILE the image is being built

COPY . .                    # Copy the rest of the source code

ENV NODE_ENV=production      # Environment variable, available during build and runtime
EXPOSE 3000                  # Documents the port used (does not open anything itself; see the "Networks" chapter)

CMD ["node", "server.js"]    # Command executed when the CONTAINER starts, not during the build
```

| Statement | Role |
|---|---|
| `FROM` | Base image to build upon (always the first instruction) |
| `WORKDIR` | Changes the current directory for the rest of the Dockerfile: avoids repeated `cd` |
| `COPY` | Copying files from the host to the image |
| `RUN` | Executes a command at build time; its result is captured in a new layer |
| `ENV` | Defines an environment variable that persists across the image and the container |
| `EXPOSE` | Documents the port on which the application listens (for informational purposes only) |
| `CMD` | Default command when starting the container; can be overridden via the command line |
| `ENTRYPOINT` | Same as `CMD`, but cannot be replaced: useful for forcing a specific executable and allowing only its arguments to vary |

> **`RUN` vs `CMD`**: `RUN` runs once, **during** the image build (installing packages, compiling code), and its result is frozen into a layer. `CMD` never runs during the build: it simply records the command to be executed **each time** a container **is started** from this image.

`RUN` Executes its command via a shell (see the chapter [Scripts and Shebang](/?c=shells&s=bash&p=scripts-et-shebang)): The same pitfalls apply, particularly command injection if an external value is interpolated without caution into a `RUN` statement.

## The container exists for exactly as long as its main process (PID 1).

The process launched by `CMD` / `ENTRYPOINT` is assigned PID 1 inside the container (see [namespaces](/?c=docker&p=concepts-de-base)): as soon as it terminates, the container stops, regardless of how many other processes are still active inside it.

That’s why a command that never terminates but otherwise does **nothing** (`tail -f /dev/null`, `sleep infinity`, `while true; do sleep 1; done`) is a bad habit for “keeping the container alive”: it masks the real problem (the service you actually want to run has stopped or was never started) rather than solving it. The best practice is to launch the desired service directly as PID 1, in the **foreground**; most daemons have a dedicated option for this, which prevents them from detaching to the background as they would by default (e.g., `nginx -g 'daemon off;'`):

```dockerfile
CMD ["nginx", "-g", "daemon off;"]   # nginx remains at the forefront: Docker has a process to monitor
```

> **Note:** PID 1 has a special role in Linux, independent of Docker (see the chapter [Process Management](/?c=shells&s=bash&p=gestion-des-processus), under the Bash section): the kernel does not apply the default action for a signal such as `SIGTERM` to it if it has not explicitly set up its own handler: so `docker stop` may appear to do nothing on a process that does not handle this signal itself. It is also PID 1 that must reclaim (*reap*) the zombie processes it launches; this is something to watch out for if the image itself launches multiple subprocesses.

## Each instruction creates a layer, and the order matters

Each `RUN` / `COPY` / `ADD` adds a cached layer: if an instruction and everything preceding it have not changed since the last build, Docker reuses the cached layer rather than rebuilding it.

```dockerfile
# Incorrect order: even the slightest change to the source code invalidates the `npm install` cache
COPY . .
RUN npm install

# Correct order: `npm install` is only run again if `package.json` actually changes
COPY package*.json ./
RUN npm install
COPY . .
```

That is why the files that change the least often (dependencies) are copied and installed **before** the source code, which changes with every commit.

## Multi-stage builds

A multi-stage build separates the **compilation** environment (heavy: compiler, build tools) from the runtime environment (lightweight: only the final binary), the same principle as separating compilation and linking in C (see the chapter [The Compilation Process](/?c=langages-de-programmation&s=c&p=compilation)): the final result does not require the toolchain that produced it.

```dockerfile
# Step 1: Compilation, using the entire Go toolchain
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o serveur

# Step 2: Execution, minimal image without any compilation tools
FROM alpine:3.19
COPY --from=builder /app/serveur /usr/local/bin/serveur
CMD ["server"]
```

Only the binary `serveur` is copied from the `builder` step to the final image: the [Go](https://go.dev) compiler (several hundred MB) is never included in the delivered image.

## `.dockerignore`

Works like [`.gitignore`](/?c=git&p=gitignore) but for `docker build`: the listed files are never sent to the Docker engine for image building, regardless of whether a `COPY . .` would have copied them or not.

```text
node_modules/
.git/
*.log
.env
```

Excluding `node_modules/` speeds up the build (less data to transfer); excluding `.env` prevents a local secret from being embedded in an image (see [Best Practices and Security](/?c=docker&p=bonnes-pratiques-et-securite)).

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A Dockerfile describes the build of an image, instruction by instruction. Each instruction creates a cached layer; the order matters to maximize cache reuse. The container lives for exactly as long as its PID 1 process. |
| **Tools available** | `FROM` / `WORKDIR` / `COPY` / `RUN` / `CMD`, multi-stage builds, `.dockerignore`. |
| **Pitfalls to Avoid** | Copying all the code before installing dependencies (invalidates the cache with every commit); keeping a container "alive" with a command that does nothing (`sleep infinity`) rather than running the actual service in the foreground. |
| **Best Practices** | Copy dependency files before the rest of the source code; use a multi-stage build to deliver only the final binary, without the build artifacts. |
