---
order: 2
---

# WebSocket: la comunicación en tiempo real

[HTTP](/?c=infrastructure&p=api-et-http) responde bien a una petición puntual, pero está mal adaptado a un flujo continuo en el que el servidor debe poder hablar **sin esperar una pregunta**: un mensaje de chat que llega, la puntuación de una partida que cambia en otro jugador, una notificación en directo. **WebSocket** responde a esta necesidad precisa con una conexión que permanece abierta, en ambos sentidos, en lugar de un ida y vuelta en cada intercambio.

## El problema: HTTP está pensado para una pregunta, no para un flujo

Con [HTTP](/?c=infrastructure&p=api-et-http) solo, el servidor nunca puede iniciar un envío: solo responde a una petición del cliente. Simular un flujo en tiempo real exige entonces **volver a preguntar** en bucle:

```text
Polling (consultar a intervalos regulares):

Cliente -> GET /nuevos-mensajes -> Servidor: nada nuevo
Cliente -> GET /nuevos-mensajes -> Servidor: nada nuevo
Cliente -> GET /nuevos-mensajes -> Servidor: ¡1 mensaje nuevo!
```

Cada petición recrea una conexión, con sus cabeceras y su negociación, para un resultado casi siempre vacío: o bien el intervalo es corto y la mayoría de las peticiones no sirven para nada, o bien es largo y la actualización llega tarde.

## WebSocket: una conexión que permanece abierta

Una conexión WebSocket arranca como una petición [HTTP](/?c=infrastructure&p=api-et-http) normal, con una cabecera `Upgrade: websocket` que pide al servidor hacer evolucionar esa misma conexión TCP hacia un protocolo diferente, en lugar de cerrar una y abrir otra:

```text
Cliente                                    Servidor
  ---- GET /chat  Upgrade: websocket -->
  <--- 101 Switching Protocols ---------

  (a partir de aqui: la conexion permanece abierta, en ambos sentidos)

  ---- mensaje "Hola" ------------------>
  <--- mensaje "¡Hola!" -----------------
  <--- mensaje "Un tercero acaba de llegar" ---   (el servidor toma la iniciativa, sin peticion previa)
```

Una vez establecida la conexión, cada parte puede enviar un mensaje en cualquier momento, sin que la otra haya pedido nada: es precisamente lo que [HTTP](/?c=infrastructure&p=api-et-http) por sí solo no permite.

> **Nota:** el intercambio inicial ("handshake") toma prestado [HTTP](/?c=infrastructure&p=api-et-http), lo que permite a una conexión WebSocket pasar por los mismos puertos (80/443) y la mayor parte de las mismas infraestructuras de red (proxies, cortafuegos) que un tráfico web clásico; solo la conexión, una vez establecida, cambia a un protocolo diferente.

## Socket.IO: una biblioteca por encima del protocolo WebSocket

**Socket.IO** no es un sinónimo de WebSocket, sino una biblioteca construida sobre él, que añade lo que el protocolo puro no ofrece:

| | WebSocket (protocolo puro) | Socket.IO (biblioteca) |
|---|---|---|
| Nivel | Protocolo de red estandarizado | Biblioteca, con un servidor y un cliente dedicados |
| Repliegue si la conexión falla | Ninguno | Recae automáticamente en *long-polling* si WebSocket no está disponible |
| Reconexión | Hay que gestionarla uno mismo | Automática, con reentrega de los eventos perdidos según la configuración |
| Modelo | Enviar/recibir mensajes puros (texto o binario) | Emitir **eventos** con nombre, con datos estructurados, eventualmente agrupados en salas (*rooms*) |

> **Trampa:** suponer que un cliente WebSocket puro puede conectarse directamente a un servidor Socket.IO (o al revés). Socket.IO añade su propia capa de protocolo por encima de WebSocket (identificación de eventos, acuses de recibo): un cliente que solo habla el protocolo WebSocket estándar no entiende estos mensajes, aunque la conexión inicial se establezca sin error.
>
> **Buena práctica:** elegir WebSocket puro para una necesidad simple y un control total del formato de los mensajes; elegir Socket.IO (o una biblioteca equivalente) en cuanto la reconexión automática, el repliegue de compatibilidad o un modelo por eventos con nombre ahorran un tiempo de desarrollo real, aceptando la dependencia de esta biblioteca en ambos lados (servidor y cliente).

## Un caso de uso concreto: el bucle de juego autoritario del lado del servidor

En un juego multijugador en tiempo real (un juego de pelota tipo Pong, por ejemplo), el servidor no se limita a retransmitir mensajes: hace correr su propia simulación del juego (posición de la pelota, colisiones, puntuación) a intervalos regulares, y solo acepta de los clientes sus **entradas** (teclas pulsadas), nunca su posición. Es el modelo de **servidor autoritario**: la posición real del juego solo existe en un único lugar (el servidor), lo que impide que un cliente haga trampa anunciando él mismo una posición falsa.

```text
Cliente A -- entradas (arriba/abajo) -->
Cliente B -- entradas (arriba/abajo) -->   Servidor: simula el juego a un ritmo fijo (ej. 60 Hz)
                                            (posicion, colisiones, puntuacion...), luego
                                            difunde el estado obtenido via WebSocket

Los clientes nunca envian su propia posicion: reciben el estado y solo lo muestran.
```

## El ritmo de simulación (tick rate) puede diferir del ritmo de emisión

El bucle de simulación corre a un intervalo fijo (el **tick**, por ejemplo cada 1/60 de segundo, es decir 60 Hz), típicamente mediante un temporizador repetido (`setInterval`). Pero nada obliga a enviar el estado del juego en cada tick: difundir uno de cada dos ticks, por ejemplo, reduce a la mitad el ancho de banda de red sin perder precisión de cálculo, ya que la simulación sigue corriendo a pleno rendimiento.

| | Tick rate (simulación) | Emit rate (difusión de red) |
|---|---|---|
| Rol | Calcular el siguiente estado del juego | Enviar ese estado a los clientes por WebSocket |
| ¿Puede ser más rápido que el otro? | Sí, siempre al menos igual de rápido | No, nunca más rápido que el tick rate |
| Coste si es demasiado alto | Carga de CPU del servidor | Ancho de banda de red |

> **Trampa:** calcular el desplazamiento de un tick a partir de un tiempo transcurrido (`dt`) sin límite. Si el servidor se ralentiza puntualmente (un pico de carga, una pausa del recolector de basura), el `dt` del siguiente tick puede volverse anormalmente grande, haciendo que un objeto atraviese una pared que, a un ritmo normal, habría sido detenido por la colisión en un tick intermedio.
>
> **Buena práctica:** limitar `dt` a un valor máximo razonable (por ejemplo nunca más de 50 ms simulados de una vez, aunque el tick real haya tardado más), para que la simulación se mantenga coherente incluso tras una ralentización puntual del servidor.

## Cuándo WebSocket es la respuesta correcta, cuándo otra cosa basta

| Necesidad | Solución adaptada |
|---|---|
| El cliente pregunta, el servidor responde una vez | [HTTP](/?c=infrastructure&p=api-et-http) clásico |
| Un servicio externo debe notificar al suyo un evento puntual, servidor a servidor | Un *webhook* ([HTTP](/?c=infrastructure&p=api-et-http) simple, disparado por el evento) |
| Ambas partes deben poder enviarse mensajes de forma continua, sin latencia de espera | WebSocket |

Un *webhook* se parece al tiempo real del lado del servidor (notifica sin petición explícita), pero sigue siendo una petición [HTTP](/?c=infrastructure&p=api-et-http) puntual y de un solo sentido: no mantiene ninguna conexión abierta, a diferencia de WebSocket.

## Resumen

| | |
|---|---|
| **Para recordar** | WebSocket transforma una conexión HTTP inicial en una conexión bidireccional que permanece abierta, permitiendo al servidor enviar un mensaje sin petición previa del cliente. Socket.IO es una biblioteca construida sobre este protocolo, que añade repliegue automático, reconexión y un modelo por eventos con nombre. |
| **Herramientas utilizables** | WebSocket puro para un control total y una necesidad simple; Socket.IO (o equivalente) cuando la reconexión automática y el repliegue de compatibilidad valen la dependencia añadida. |
| **Trampas a evitar** | Simular tiempo real mediante polling repetido, costoso y con retraso. Conectar un cliente WebSocket puro a un servidor Socket.IO esperando que se entiendan de forma nativa. Calcular un tick de simulación con un `dt` sin límite. |
| **Buenas prácticas** | Reservar WebSocket para los intercambios realmente bidireccionales y continuos; un webhook HTTP simple basta para una notificación puntual servidor a servidor. En un juego o simulación multijugador, mantener el servidor autoritario y desacoplar el tick rate del emit rate. |
