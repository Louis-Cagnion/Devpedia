---
order: 2
---

# Sockets y E/S no bloqueante

Una vez comprendido [el direccionamiento de red](/?c=reseaux&p=fondamentaux-reseau), queda por saber cómo un **programa** intercambia concretamente datos con otro, potencialmente en una máquina remota. Ese es el papel de un **socket**: un punto de terminación de comunicación de red, manejado por el programa como un [descriptor de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) clásico (se puede leer y escribir en él), pero cuyo otro extremo es una red en lugar de un archivo en disco.

## El ciclo de vida de un socket de servidor

Crear un servidor de red sigue siempre la misma secuencia de llamadas al sistema:

| Etapa | Función | Papel |
|---|---|---|
| 1. Creación | `socket()` | Crea el socket, devuelve un descriptor de archivo |
| 2. Asociación | `bind()` | Asocia el socket a una dirección IP y un puerto concretos de la máquina |
| 3. Escucha | `listen()` | Pone el socket en modo "acepto conexiones entrantes" |
| 4. Aceptación | `accept()` | Bloquea hasta que un cliente se conecta, devuelve un socket **nuevo** dedicado a ese cliente |
| 5. Intercambio | `read()`/`write()` | Lee o escribe datos con ese cliente concreto |
| 6. Cierre | `close()` | Libera el socket |

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main(void)
{
    int servidor = socket(AF_INET, SOCK_STREAM, 0); // AF_INET = IPv4, SOCK_STREAM = TCP

    struct sockaddr_in direccion;
    direccion.sin_family = AF_INET;
    direccion.sin_addr.s_addr = INADDR_ANY;   // acepta conexiones en todas las interfaces
    direccion.sin_port = htons(8080);         // puerto 8080, convertido al orden esperado por la red

    bind(servidor, (struct sockaddr *)&direccion, sizeof(direccion));
    listen(servidor, 10); // 10 = numero de conexiones en espera permitidas antes de rechazar

    int cliente = accept(servidor, NULL, NULL); // bloquea aqui hasta una conexion

    char buffer[1024];
    read(cliente, buffer, sizeof(buffer));
    write(cliente, "OK", 2);

    close(cliente);
    close(servidor);
    return 0;
}
```

> **Nota:** `htons()` (*host to network short*) convierte el número de puerto al **orden de bytes de red**, que puede diferir del usado internamente por el procesador de la máquina. Un detalle que nunca hay que olvidar al manipular una dirección o un puerto.

En el lado del cliente, la secuencia es más corta: `socket()` seguido de `connect()` (el equivalente de `bind()` + `listen()` + `accept()`, pero para unirse a un servidor existente en lugar de esperar uno) bastan antes de intercambiar datos.

## El problema del bloqueo

En el ejemplo anterior, `accept()` y `read()` son **bloqueantes**: el programa se detiene y espera, sin hacer nada más, hasta que ocurre un evento. Un servidor que debe gestionar **varios clientes a la vez** no puede permitirse quedar bloqueado en uno solo de ellos mientras los demás esperan.

```text
Cliente A se conecta -> accept() bloquea en A
Cliente B intenta conectarse... ¡pero el servidor sigue bloqueado en A!
```

## La multiplexión de E/S: vigilar varios sockets a la vez

En lugar de bloquear en un solo socket, un servidor puede pedirle al sistema: "avísame en cuanto uno de **estos** sockets tenga algo listo (una nueva conexión, datos que leer)". Ese es el papel de `select()`, `poll()` y `epoll()`:

| Función | Portabilidad | Límite / ventaja |
|---|---|---|
| `select()` | POSIX (en todas partes) | Limitado a un número pequeño de sockets vigilados (a menudo 1024), recorre toda la lista en cada llamada |
| `poll()` | POSIX (en todas partes) | Sin límite de número, pero también recorre toda la lista en cada llamada: costoso con muchos sockets |
| `epoll()` | Solo Linux | El kernel devuelve **solo** los sockets realmente listos: escalable incluso con decenas de miles de conexiones |

```text
      +-------------------------------------+
      |  select()/poll()/epoll_wait()       |
      |  "que sockets estan listos?"        |
      +-------------------------------------+
             |            |            |
        socket A     socket B     socket C
        (nada)       (datos       (nada)
                       listos)
                |
                v
      el servidor procesa SOLO el socket B, sin bloquear en A ni en C
```

Este enfoque es la base de un **bucle de eventos** (*event loop*): un único bucle que consulta continuamente qué sockets están listos, y procesa solo esos, sin quedar nunca bloqueado en un socket inactivo.

> **Trampa:** usar llamadas bloqueantes clásicas (`accept()`, `read()`) en un servidor que se supone debe gestionar varios clientes simultáneamente, sin multiplexión: el servidor se vuelve de hecho monocliente, aunque técnicamente acepte varias conexiones.
>
> **Buena práctica:** poner los sockets en modo no bloqueante (`fcntl(socket, F_SETFL, O_NONBLOCK)`) como complemento de `select`/`poll`/`epoll`, para que una llamada `read()` sobre un socket anunciado como "listo" pero que se vacía entretanto no bloquee nunca el programa.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un socket de servidor sigue la secuencia `socket()` → `bind()` → `listen()` → `accept()`; las llamadas de red clásicas bloquean, lo que impide gestionar varios clientes con un único bucle simple. |
| **Herramientas utilizables** | `select()`/`poll()` (portables) o `epoll()` (Linux, más escalable) para vigilar varios sockets sin bloquear; `O_NONBLOCK` para asegurar las lecturas. |
| **Trampas a evitar** | Bloquear en un solo socket (`accept()`/`read()`) en un servidor multicliente sin multiplexión. |
| **Buenas prácticas** | Construir el servidor alrededor de un bucle de eventos que solo actúa sobre los sockets realmente listos. |
