---
order: 4
---

# Túnel SSH y redirección de puertos

Algunos servicios solo son accesibles a propósito desde la máquina en la que se ejecutan: una base de datos, una interfaz de administración, el puerto de depuración de un navegador. Un **túnel SSH** permite alcanzarlos desde otro equipo sin exponerlos a la red, haciendo pasar la conexión por dentro de una conexión [SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*, el protocolo estándar para conectarse de forma segura a una máquina remota) ya cifrada.

## Puerto, `localhost`: dos nociones que conocer

Una máquina recibe las conexiones en **puertos**, números del 1 al 65535 que designan cada uno un programa a la escucha (ver [los sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) para la mecánica del lado del programa). Un servicio elige en qué dirección escucha:

| Dirección de escucha | Quién puede conectarse | Ejemplo |
|---|---|---|
| `0.0.0.0` | Cualquier máquina que llegue a esta por la red | Un sitio web público |
| `127.0.0.1` (llamada `localhost`) | Solo los programas de **la misma máquina** | Una base de datos de desarrollo, un puerto de depuración |

`127.0.0.1` es la dirección de **bucle local** (*loopback*): un paquete enviado a esta dirección nunca sale de la máquina. Un servicio que solo escucha en `127.0.0.1` es por tanto invisible desde la red, incluso sin cortafuegos (ver [el cortafuegos](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld)).

## El principio: una redirección de puerto local

El comando `ssh -L` abre un puerto en **su** máquina y redirige todo lo que llega a él, a través de la conexión SSH, hacia un puerto alcanzable desde el **servidor**:

```text
Su PC                                   Servidor remoto
┌─────────────────┐                     ┌──────────────────────────────┐
│ navegador       │ túnel cifrado       │ sshd (puerto 22, abierto)    │
│ → localhost:9222│  ================>  │   │                          │
└─────────────────┘                     │   ▼                          │
                                        │ servicio en 127.0.0.1:9222   │
                                        │ (invisible desde la red)     │
                                        └──────────────────────────────┘
```

```powershell
ssh -N -L 9222:localhost:9222 usuario@servidor.ejemplo.com
```

| Fragmento | Significado |
|---|---|
| `-L 9222:localhost:9222` | Escuchar en el puerto 9222 de **mi** máquina y redirigir hacia `localhost:9222` **visto desde el servidor** |
| `-N` | No ejecutar ningún comando en el servidor: la sesión solo sirve para el túnel |
| `usuario@servidor.ejemplo.com` | Cuenta y máquina a las que se conecta por SSH (autenticación habitual, por clave o contraseña) |

Mientras este comando se ejecuta, un programa local que se conecta a `localhost:9222` habla en realidad con el servicio del servidor. El cliente `ssh` viene incluido con Windows 10 y 11, Linux y macOS ([manual de ssh](https://man.openbsd.org/ssh)).

> **Trampa:** en `-L 9222:localhost:9222`, la palabra `localhost` del medio designa el **servidor**, no su máquina: el destino se resuelve al otro lado del túnel. Para llegar a un tercer equipo desde el servidor, se pone allí su dirección (`-L 5433:base-interna:5432`).
>
> **Buena práctica:** elegir para el puerto local un número libre (el mismo que el del servicio es el más fácil de recordar) y comprobar el túnel con una petición real (por ejemplo `curl http://localhost:9222/json/version` para la depuración de Chrome) en lugar de suponer que funciona.

## Las tres formas de redirección

| Opción | Sentido | Uso típico |
|---|---|---|
| `-L` (*local*) | Un puerto de **mi** máquina lleva a un puerto del lado del servidor | Alcanzar una base de datos o una interfaz de administración del servidor |
| `-R` (*remote*) | Un puerto del **servidor** lleva a un puerto de mi máquina | Dejar que un servidor llegue a un servicio que corre en mi casa, tras un router |
| `-D` (*dynamic*) | Un puerto local se convierte en un proxy SOCKS, que redirige a cualquier destino | Hacer pasar todo el tráfico de un navegador por el servidor |

## Trampas y límites

Un túnel esquiva a propósito el cortafuegos: el acceso se permite porque SSH lo está, no porque lo esté el servicio.

> **Trampa:** exponer el túnel a la red. Por defecto `-L` solo escucha en `127.0.0.1`; escribir `-L 0.0.0.0:9222:localhost:9222` hace el puerto local accesible desde toda la red de su equipo, y por tanto el acceso al servicio remoto para cualquiera que lo alcance, a menudo sin autenticación (el puerto de depuración de Chrome no tiene ninguna).
>
> **Buena práctica:** dejar la escucha local por defecto (`127.0.0.1`) y no añadir nunca una dirección de escucha sin una razón precisa.

> **Trampa:** un túnel se cae en silencio cuando se corta la conexión SSH (suspensión del equipo, red inestable); el programa que lo usa recibe entonces errores de conexión rechazada, sin vínculo aparente con SSH.
>
> **Buena práctica:** añadir `-o ServerAliveInterval=30` (un mensaje de control cada 30 segundos, que detecta un corte); para un túnel permanente, dejar que una herramienta lo relance (`autossh`, o un servicio del sistema).

> **Trampa:** un error `bind: Address already in use` al arrancar significa que el puerto local ya está ocupado (a menudo por un túnel antiguo que quedó abierto).
>
> **Buena práctica:** listar los puertos en escucha (`netstat -ano` en Windows, `ss -ltn` en Linux), cerrar el túnel antiguo o elegir otro puerto.

Del lado del servidor, el administrador puede prohibir o limitar las redirecciones con `AllowTcpForwarding` y `PermitOpen` en `/etc/ssh/sshd_config` (ver [el endurecimiento de SSH](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe)).

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Un servicio que solo escucha en `127.0.0.1` solo es accesible desde su propia máquina. `ssh -L puerto_local:destino:puerto_destino usuario@servidor` abre un puerto en su máquina y lo une, por SSH, a un destino visto desde el servidor; `-R` hace lo contrario, `-D` crea un proxy SOCKS. Solo el puerto 22 del servidor permanece abierto. |
| **Herramientas utilizables** | `ssh -N -L …` (túnel sin sesión), `-o ServerAliveInterval=30` (detección de cortes), `autossh` (relanzamiento automático), `curl`, `netstat -ano` / `ss -ltn` (comprobar un túnel y los puertos ocupados). |
| **Trampas que evitar** | Creer que el `localhost` del medio designa la propia máquina. Escuchar en `0.0.0.0` y exponer un servicio sin autenticación a toda una red. Olvidar que un túnel se cae en silencio. Un puerto local ya ocupado. |
| **Buenas prácticas** | Mantener la escucha local por defecto (`127.0.0.1`). Probar el túnel con una petición real. Vigilar la conexión (`ServerAliveInterval`). Restringir las redirecciones en el servidor (`AllowTcpForwarding`, `PermitOpen`). |
