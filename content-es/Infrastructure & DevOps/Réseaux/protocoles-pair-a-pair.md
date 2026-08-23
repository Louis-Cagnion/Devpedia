---
order: 3
---

# Los protocolos entre pares (P2P)

Un sitio web clásico sigue un modelo **cliente-servidor**: un servidor central aloja el recurso, y cada cliente se conecta a él para obtenerlo (véase [Fundamentos de redes](/?c=reseaux&p=fondamentaux-reseau)). Una red **entre pares** (*peer-to-peer*, P2P) funciona de otra forma: cada participante, llamado **par** (*peer*), es a la vez cliente y servidor, sin que sea obligatorio un punto central para intercambiar el propio recurso.

```text
Cliente-servidor :       Cliente A -->\
                          Cliente B --> Servidor (unica fuente) --> cada cliente
                          Cliente C -->/

Entre pares :             Par A <---> Par B
                             ^            ^
                             |            |
                             v            v
                           Par C <---> Par D
                           (cada par puede enviar Y recibir, hacia/desde cualquier otro)
```

## El swarm, seeders y leechers

El conjunto de pares que intercambian actualmente un mismo recurso forma un **swarm** (literalmente «enjambre»). Dos roles conviven en un swarm:

| Rol | Situación |
|---|---|
| **Seeder** | Ya posee el recurso completo, y solo se dedica a enviarlo a los demás |
| **Leecher** | Solo posee una parte del recurso, descarga el resto y a la vez ya puede reenviar los fragmentos que tiene |

## La división en fragmentos

El recurso (a menudo un archivo) nunca se intercambia de un solo bloque: se divide en **fragmentos** (*pieces*) de tamaño fijo, cada uno acompañado de un hash (véase la noción de hash en [Contraseñas y hash seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage) para el principio general) que permite verificar su integridad nada más recibirlo.

```text
Archivo completo :  [ fragmento 1 | fragmento 2 | fragmento 3 | fragmento 4 | ... ]

Un par puede descargar el fragmento 3 desde el par A,
el fragmento 1 desde el par B, en paralelo,
y luego reenviar de inmediato el fragmento 3 a un par C que aun no lo tiene.
```

Esta división permite dos cosas a la vez: descargar varios fragmentos en paralelo desde pares distintos (más rápido que una sola fuente), y detectar de inmediato un fragmento corrupto o modificado gracias a su hash, sin esperar al final de la descarga completa.

## Encontrar pares: tracker y DHT

Un par que se une a un swarm primero debe saber qué otros pares lo componen:

| Mecanismo | Principio |
|---|---|
| **Tracker** | Un servidor central que cada par contacta para obtener la lista de pares activos del swarm; sigue siendo un paso obligado, aunque nunca aloje el propio recurso |
| **DHT** (*Distributed Hash Table*) | Una tabla de correspondencia distribuida entre los propios pares, que permite encontrar a los pares de un swarm sin depender de un tracker central |

Un **magnet link** es una simple referencia (un identificador único del recurso) que permite unirse directamente a un swarm a través del DHT, sin tener que descargar antes un archivo que describa el recurso.

## El incentivo para devolver: choke/unchoke

Nada obliga a un par a reenviar lo que descarga. Para evitar que todo el mundo se limite a recibir sin devolver nunca nada, cada par limita el número de pares a los que envía datos en un momento dado (*choke* = bloqueado, *unchoke* = autorizado), priorizando a quienes ya más le devuelven. Un par que nunca reenvía nada acaba así siendo *choke* por la mayoría de los demás.

## Más allá del reparto de archivos entre particulares

El principio P2P también sirve para necesidades de distribución a gran escala: repartir una actualización voluminosa (ej.: un videojuego) a millones de jugadores al mismo tiempo sin saturar un único servidor, ya que cada jugador que ya descargó una parte de la actualización la redistribuye a los demás. Es una alternativa descentralizada a un [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), que reparte la carga entre servidores dedicados en lugar de entre los propios usuarios.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una red entre pares convierte a cada participante en cliente y servidor a la vez. El swarm agrupa a los pares que intercambian un recurso dividido en fragmentos verificados por hash; un tracker o un DHT permite encontrar a esos pares. |
| **Herramientas utilizables** | Un tracker para un swarm sencillo de administrar; un DHT para no depender de ningún servidor central. |
| **Trampas a evitar** | Confundir el rol del tracker (que solo pone en contacto) con el de un alojamiento clásico (que sirve él mismo el recurso). |
| **Buenas prácticas** | Verificar el hash de cada fragmento recibido antes de redistribuirlo, para no propagar nunca un dato corrupto. |
