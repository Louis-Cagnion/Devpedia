---
order: 2
---

# Sessions et tokens

Una vez verificada la identidad (ver [Fundamentos](/?c=authentification&s=fondamentaux&p=fondamentaux)), surge un problema concreto: ¿cómo recuerda el servidor que un usuario sigue conectado de una petición HTTP a otra? Este subject cubre las dos respuestas clásicas a esta pregunta: la **sesión**, donde el servidor guarda el estado de conexión de su lado, y el **token**, donde ese estado lo lleva directamente el cliente en cada petición.

A continuación encontrarás las distintas nociones:
