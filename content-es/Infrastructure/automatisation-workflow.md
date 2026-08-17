---
order: 5
---

# La automatización mediante workflow visual

Consumir una [API](/?c=infrastructure&p=api-et-http) requiere escribir código: una petición, una respuesta, un procesamiento del resultado. Las plataformas de **automatización mediante workflow visual** (n8n, Zapier, Make) proponen otro enfoque para la misma necesidad (conectar servicios entre sí): ensamblar bloques en una pantalla en lugar de escribir líneas de código.

> **Analogía:** una cadena de montaje. Un evento activa la cadena (llega una pieza), luego cada puesto realiza una acción sobre esa pieza antes de transmitirla al siguiente. El workflow visual funciona igual: un evento activa una serie de acciones, sin que un operario (aquí, un desarrollador) tenga que escribir el código de cada puesto.

## Disparador, acciones, conectores

Un workflow siempre se organiza en torno a los mismos tres bloques:

| Bloque | Función | Ejemplo |
|---|---|---|
| **Disparador** (*trigger*) | El evento que inicia el workflow | Un nuevo correo recibido, un formulario completado, cada hora (programado) |
| **Acción** | Un paso realizado tras el disparo | Crear una fila en una hoja de cálculo, enviar un mensaje, llamar a una API |
| **Conector** | El bloque preconfigurado que sabe comunicarse con un servicio concreto | Un conector de Gmail, un conector de Slack, un conector HTTP genérico |

```text
Disparador                  Acción 1                    Acción 2

Nuevo correo   ------->  Extraer el archivo  ------->  Crear una tarea
recibido con PDF            PDF adjunto                 en una herramienta
                                                          de seguimiento
```

Un conector sigue siendo, internamente, una llamada [HTTP](/?c=infrastructure&p=api-et-http) a la API del servicio en cuestión: la plataforma simplemente oculta la petición detrás de una interfaz gráfica, con la autenticación y el formato de datos ya preconfigurados.

> **Trampa:** creer que un workflow visual exime de entender lo que realmente hace. Un conector mal configurado (un campo mal mapeado, un disparador demasiado amplio) falla silenciosamente o desencadena una acción en bucle, exactamente igual que un código mal escrito.
>
> **Buena práctica:** probar un workflow con un disparador manual antes de activarlo sobre un disparador real, y vigilar sus ejecuciones (la mayoría de las plataformas guardan un historial por ejecución, con el detalle de cada paso).

## SaaS o autoalojado: quién aloja el workflow

Ambos se distinguen por quién ejecuta la plataforma, la misma pregunta que para cualquier [servicio cloud](/?c=infrastructure&p=le-cloud):

| | SaaS (Zapier, Make) | Autoalojado (n8n en modo autoalojado) |
|---|---|---|
| Alojamiento | En el proveedor | En un servidor elegido por el usuario |
| Puesta en marcha | Inmediata, sin instalación | Requiere instalar y mantener la plataforma |
| Datos que transitan por el workflow | Pasan por los servidores del proveedor | Permanecen en la infraestructura del usuario |
| Coste | Suscripción, a menudo según el número de ejecuciones | Coste del servidor, sin límite de ejecuciones |

[n8n](https://n8n.io) ofrece ambos modos (SaaS o autoalojado); [Zapier](https://zapier.com) y [Make](https://www.make.com) se mantienen únicamente en SaaS.

## Resumen

| | |
|---|---|
| **Para recordar** | Un workflow visual encadena un disparador y una serie de acciones conectadas por conectores, sin escribir el código de las llamadas API subyacentes. |
| **Herramientas utilizables** | n8n (SaaS o autoalojado), Zapier, Make. |
| **Trampas a evitar** | Activar un workflow sobre un disparador real sin haberlo probado manualmente de antemano. |
| **Buenas prácticas** | Probar con un disparador manual antes de activar. Vigilar el historial de ejecución para detectar fallos silenciosos. |
