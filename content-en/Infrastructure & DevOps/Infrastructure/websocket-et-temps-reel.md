---
order: 2
---

# WebSocket: real-time communication

[HTTP](/?c=infrastructure&p=api-et-http) handles a one-off request well, but is poorly suited to a continuous stream where the server needs to speak up **without waiting to be asked**: an incoming chat message, another player's score changing, a live notification. **WebSocket** answers this exact need with a connection that stays open, in both directions, rather than a round trip for every exchange.

## The problem: HTTP is built for a question, not a stream

With [HTTP](/?c=infrastructure&p=api-et-http) alone, the server can never initiate a send: it only ever responds to a client request. Simulating a real-time stream therefore means **asking again** in a loop:

```text
Polling (asking again at regular intervals):

Client -> GET /new-messages -> Server: nothing new
Client -> GET /new-messages -> Server: nothing new
Client -> GET /new-messages -> Server: 1 new message!
```

Each request recreates a connection, with its headers and negotiation, for a result that's most often empty: either the interval is short and most requests serve no purpose, or it's long and the update arrives late.

## WebSocket: a connection that stays open

A WebSocket connection starts as a normal [HTTP](/?c=infrastructure&p=api-et-http) request, with an `Upgrade: websocket` header that asks the server to evolve this same TCP connection to a different protocol, rather than closing one and opening another:

```text
Client                                    Server
  ---- GET /chat  Upgrade: websocket -->
  <--- 101 Switching Protocols ---------

  (from here: the connection stays open, in both directions)

  ---- message "Hello" ------------------>
  <--- message "Hi!" ---------------------
  <--- message "Someone else just joined" ---   (the server initiates, with no prior request)
```

Once the connection is established, either side can send a message at any time, without the other having asked for anything: this is exactly what [HTTP](/?c=infrastructure&p=api-et-http) alone can't do.

> **Note:** the initial exchange (the "handshake") borrows [HTTP](/?c=infrastructure&p=api-et-http), which lets a WebSocket connection go through the same ports (80/443) and most of the same network infrastructure (proxies, firewalls) as regular web traffic; only the connection, once established, switches to a different protocol.

## Socket.IO: a library on top of the WebSocket protocol

**Socket.IO** isn't a synonym for WebSocket, but a library built on top of it, which adds what the raw protocol doesn't provide:

| | WebSocket (raw protocol) | Socket.IO (library) |
|---|---|---|
| Level | Standardized network protocol | Library, with a dedicated server and client |
| Fallback if the connection fails | None | Automatically falls back to *long-polling* if WebSocket is unavailable |
| Reconnection | Must be handled manually | Automatic, with redelivery of missed events depending on configuration |
| Model | Send/receive raw messages (text or binary) | Emit named **events**, with structured data, optionally grouped into rooms |

> **Pitfall:** assuming that a raw WebSocket client can connect directly to a Socket.IO server (or the other way around). Socket.IO adds its own protocol layer on top of WebSocket (event identification, acknowledgments): a client that only speaks the standard WebSocket protocol doesn't understand these messages, even if the initial connection is established without error.
>
> **Best practice:** choose raw WebSocket for a simple need and full control over the message format; choose Socket.IO (or an equivalent library) as soon as automatic reconnection, the compatibility fallback, or a named-event model save real development time, while accepting the dependency on this library on both sides (server and client).

## When WebSocket is the right answer, and when something else is enough

| Need | Suitable solution |
|---|---|
| The client asks, the server answers once | Regular [HTTP](/?c=infrastructure&p=api-et-http) |
| A third-party service needs to notify yours of a one-off event, server to server | A *webhook* (plain [HTTP](/?c=infrastructure&p=api-et-http), triggered by the event) |
| Both sides need to send each other messages continuously, with no waiting latency | WebSocket |

A *webhook* looks like real time on the server side (it notifies with no explicit request), but it's still a one-off, one-way [HTTP](/?c=infrastructure&p=api-et-http) request: it keeps no connection open, unlike WebSocket.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | WebSocket upgrades an initial HTTP connection into a bidirectional connection that stays open, letting the server send a message with no prior request from the client. Socket.IO is a library built on this protocol, adding automatic fallback, reconnection, and a named-event model. |
| **Tools you can use** | Raw WebSocket for full control and a simple need; Socket.IO (or equivalent) when automatic reconnection and the compatibility fallback are worth the added dependency. |
| **Pitfalls to avoid** | Simulating real time with repeated polling, which is costly and lags behind. Connecting a raw WebSocket client to a Socket.IO server and expecting them to understand each other natively. |
| **Best practices** | Reserve WebSocket for exchanges that are genuinely bidirectional and continuous; a simple HTTP webhook is enough for a one-off server-to-server notification. |
