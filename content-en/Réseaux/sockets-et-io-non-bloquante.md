---
order: 2
---

# Sockets and Non-Blocking I/O

Once [network addressing](/?c=reseaux&p=fondamentaux-reseau) makes sense, the next question is how a **program** actually exchanges data with another one, potentially on a remote machine. That's the job of a **socket**: a network communication endpoint, handled by the program like an ordinary [file descriptor](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) (you can read from it and write to it), except the other end is a network rather than a file on disk.

## The lifecycle of a server socket

Creating a network server always follows the same sequence of system calls:

| Step | Function | Role |
|---|---|---|
| 1. Creation | `socket()` | Creates the socket, returns a file descriptor |
| 2. Binding | `bind()` | Associates the socket with a specific IP address and port on the machine |
| 3. Listening | `listen()` | Puts the socket into "accepting incoming connections" mode |
| 4. Accepting | `accept()` | Blocks until a client connects, returns a **new** socket dedicated to that client |
| 5. Exchange | `read()`/`write()` | Reads or writes data with that specific client |
| 6. Closing | `close()` | Releases the socket |

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main(void)
{
    int server = socket(AF_INET, SOCK_STREAM, 0); // AF_INET = IPv4, SOCK_STREAM = TCP

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;   // accept connections on every interface
    address.sin_port = htons(8080);         // port 8080, converted to network byte order

    bind(server, (struct sockaddr *)&address, sizeof(address));
    listen(server, 10); // 10 = number of pending connections allowed before refusing more

    int client = accept(server, NULL, NULL); // blocks here until a connection comes in

    char buffer[1024];
    read(client, buffer, sizeof(buffer));
    write(client, "OK", 2);

    close(client);
    close(server);
    return 0;
}
```

> **Note:** `htons()` (*host to network short*) converts the port number into **network byte order**, which can differ from the one used internally by the machine's processor. A detail you should never forget when handling an address or a port.

On the client side, the sequence is shorter: `socket()` followed by `connect()` (the equivalent of `bind()` + `listen()` + `accept()`, but for joining an existing server rather than waiting for one) is enough before exchanging data.

## The blocking problem

In the example above, `accept()` and `read()` are **blocking**: the program stops and waits, doing nothing else, until an event occurs. A server that needs to handle **several clients at once** can't afford to stay stuck on a single one while the others wait.

```text
Client A connects -> accept() blocks on A
Client B tries to connect... but the server is still blocked on A!
```

## I/O multiplexing: watching several sockets at once

Instead of blocking on a single socket, a server can ask the system: "let me know as soon as one of **these** sockets has something ready (a new connection, data to read)". That's the role of `select()`, `poll()`, and `epoll()`:

| Function | Portability | Limit / advantage |
|---|---|---|
| `select()` | POSIX (everywhere) | Limited to a small number of watched sockets (often 1024), rescans the entire list on every call |
| `poll()` | POSIX (everywhere) | No number limit, but also rescans the entire list on every call: costly with many sockets |
| `epoll()` | Linux only | The kernel returns **only** the sockets that are actually ready: scales even to tens of thousands of connections |

```text
      +-------------------------------------+
      |  select()/poll()/epoll_wait()       |
      |  "which sockets are ready?"          |
      +-------------------------------------+
             |            |            |
        socket A     socket B     socket C
        (nothing)    (data          (nothing)
                       ready)
                |
                v
      the server handles ONLY socket B, without blocking on A or C
```

This approach is the basis of an **event loop**: a single loop that continuously checks which sockets are ready, and only handles those, without ever staying blocked on an idle socket.

> **Pitfall:** using classic blocking calls (`accept()`, `read()`) in a server meant to handle several clients at once, without multiplexing: the server effectively becomes single-client, even if it technically accepts multiple connections.
>
> **Best practice:** put sockets in non-blocking mode (`fcntl(socket, F_SETFL, O_NONBLOCK)`) alongside `select`/`poll`/`epoll`, so a `read()` call on a socket reported as "ready" but that empties out in the meantime never blocks the program.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A server socket follows the sequence `socket()` → `bind()` → `listen()` → `accept()`; classic network calls block, which makes it impossible to handle several clients with a single simple loop. |
| **Tools you can use** | `select()`/`poll()` (portable) or `epoll()` (Linux, more scalable) to watch several sockets without blocking; `O_NONBLOCK` to make reads safe. |
| **Pitfalls to avoid** | Blocking on a single socket (`accept()`/`read()`) in a multi-client server without multiplexing. |
| **Best practices** | Build the server around an event loop that only acts on sockets that are actually ready. |
