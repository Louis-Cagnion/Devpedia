---
order: 5
---

# Transmisión en directo y chat a gran escala

El capítulo [CDN y transmisión adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) cubre un vídeo que ya existe por completo antes de verse (una película de Netflix, codificada y almacenada de antemano). Un directo (Twitch, pero el principio se aplica a cualquier live streaming) plantea un problema diferente: el vídeo aún no existe cuando el espectador lo solicita, se produce **en este mismo momento**, y debe llegar a decenas de miles de espectadores solo unos segundos después de haber sido filmado.

## El camino de un directo: ingestión, transcodificación, distribución

```text
Streamer (software de captura)
   |  envia un flujo de video continuo
   v
Servidor de ingestion (lo mas cerca posible del streamer)
   |  transcodifica en directo, en varias calidades
   v
Red CDN (los mismos nodos que para un video bajo demanda)
   |  transmision adaptativa, como se vio en el capitulo anterior
   v
Espectadores (decenas de miles, cada uno eligiendo su calidad)
```

La diferencia con un vídeo bajo demanda se juega en las dos primeras etapas: un **servidor de ingestión** recibe en continuo el flujo bruto enviado por el streamer, y la **transcodificación** (recodificación en varias calidades, como en Netflix) debe hacerse en pocos segundos, de forma continua, en lugar de una sola vez de antemano sobre un archivo ya completo.

## El precio del directo: un retraso incompresible

Cada etapa (transcodificación, división en segmentos, propagación hasta el nodo CDN más cercano al espectador) toma algo de tiempo. Sumadas, estas etapas crean un **retraso de transmisión** (*stream delay*) de varios segundos entre el instante real y lo que ve el espectador, incluso en las mejores condiciones.

> **Trampa:** esperar de un directo una latencia nula, idéntica a una conversación cara a cara. El paso por la transcodificación y el CDN, indispensable para servir a decenas de miles de espectadores a la vez, añade mecánicamente varios segundos de retraso: por eso un mensaje de chat puede parecer reaccionar a un evento "antes" de que el espectador lo vea él mismo en la pantalla.
>
> **Buena práctica:** para una interacción que exige una latencia mínima entre un pequeño número de participantes (dos jugadores en una misma partida, por ejemplo), pasar por una conexión directa de tipo [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) en lugar de por el pipeline de vídeo, sin por ello buscar eliminar el retraso del propio vídeo, estructuralmente incompresible a esta escala.

## El chat: difundir el mismo mensaje a todos, no un flujo personalizado

El [feed de noticias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out) construye un contenido **diferente para cada usuario** (las publicaciones de las cuentas que sigue). El chat de un directo resuelve un problema inverso: cientos de miles de mensajes por segundo, pero **todos los espectadores de un mismo canal deben recibir exactamente los mismos mensajes**, en el mismo orden, al mismo tiempo.

```text
Espectador 1 ─┐
Espectador 2 ─┼── todos suscritos al mismo canal
Espectador 3 ─┘

Mensaje enviado -> publicado una sola vez -> difundido a todos los suscriptores del canal simultaneamente
```

Este modelo se llama **publicación/suscripción** (*publish/subscribe*, o *pub/sub*): cada espectador se suscribe al canal del directo que está viendo, y cada mensaje se procesa una sola vez en el servidor y luego se reenvía a todos los suscriptores, en lugar de recalcularse individualmente para cada uno.

| | Feed de noticias (fan-out) | Chat de un directo (pub/sub) |
|---|---|---|
| Contenido recibido | Diferente para cada usuario (según a quién sigue) | Idéntico para todos los suscriptores de un mismo canal |
| Lo que varía | La lista de cuentas seguidas | Nada: todo el mundo recibe todo |

## Resumen

| | |
|---|---|
| **Para recordar** | Un directo añade una etapa de ingestión y una transcodificación en continuo antes de unirse al mismo CDN que un vídeo bajo demanda, lo que crea un retraso de transmisión incompresible de unos segundos. El chat asociado difunde el mismo mensaje a todos los suscriptores de un canal (pub/sub), al contrario que un feed de noticias que personaliza el contenido por usuario (fan-out). |
| **Herramientas utilizables** | Un WebSocket para una interacción que exige una latencia mínima, independiente del retraso del vídeo. |
| **Trampas a evitar** | Esperar una latencia nula de un directo difundido a gran escala. |
| **Buenas prácticas** | Separar las interacciones de baja latencia (WebSocket directo) del pipeline de vídeo, sin buscar reducir el retraso estructural de este último. |
