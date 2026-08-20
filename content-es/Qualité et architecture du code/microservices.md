---
order: 2
---

# Microservicios: dividir una aplicación en servicios independientes

[Responsabilidad única y bajo acoplamiento](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) se aplica a una función o un archivo; la arquitectura de **microservicios** aplica la misma idea a la escala de una aplicación entera: en lugar de un único programa que gestiona todos los dominios de negocio, varios **servicios** independientes, cada uno responsable de un solo dominio, que se comunican entre sí por la red en lugar de compartir memoria o una base de datos.

## Del monolito a los servicios separados

Un **monolito** agrupa todo el código de la aplicación (catálogo, carrito, pago, notificaciones...) en un solo programa, desplegado como una única unidad:

```text
Monolito :                              Microservicios :

+------------------+   +----------+   +----------+
|  Catálogo        |   | Catálogo |   | Carrito  |
|  Carrito         |   +----------+   +----------+
|  Pago            |   |          |   |          |
|  Notificaciones  |   +----------+   +----------------+
+------------------+   | Pago     |   | Notificaciones |
   (un solo despliegue)   +----------+   +----------------+
                          (un despliegue por servicio, conectados por la red)
```

Cada servicio puede escribirse en un lenguaje diferente, desplegarse y escalarse independientemente de los demás, y modificarse sin volver a desplegar toda la aplicación: exactamente la misma intención que una [responsabilidad única](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) a nivel de un archivo, trasladada al nivel del despliegue.

## Cada servicio posee sus propios datos

Un servicio nunca debe leer ni escribir directamente en la base de datos de otro: pasa por la [API](/?c=infrastructure&p=api-et-http) que ese otro servicio expone, nunca por un acceso directo a su almacenamiento.

> **Trampa:** dejar que varios servicios accedan directamente a una misma base de datos compartida "para simplificar". Esto recrea exactamente el acoplamiento que un archivo que comparte una [constante entre dos mecanismos independientes](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) ya provoca a pequeña escala: un cambio de esquema en un servicio rompe silenciosamente otro servicio que leía directamente esa tabla, sin que ninguna llamada a la API lo haga visible al leer el código.
>
> **Buena práctica:** cada servicio posee su propia base de datos (o su propio esquema aislado), inaccesible directamente para los demás; cualquier dato necesario para otro servicio pasa por una [API](/?c=infrastructure&p=api-et-http) explícita.

## Comunicarse entre servicios: síncrono o asíncrono

| | Llamada síncrona (HTTP/API) | Mensaje asíncrono (cola de mensajes) |
|---|---|---|
| Principio | El servicio que llama espera la respuesta antes de continuar | El servicio deposita un mensaje y continúa sin esperar a que se procese |
| Acoplamiento de disponibilidad | El servicio de pago indisponible hace fallar el pedido de inmediato | El mensaje espera en la cola hasta que el servicio de pago vuelva a estar disponible |
| Simplicidad | Más simple de seguir y depurar (una llamada, una respuesta) | Consistencia diferida (*eventual consistency*) que hay que gestionar explícitamente |

Véase [WebSocket](/?c=infrastructure&p=websocket-et-temps-reel) para una tercera forma de comunicación, pertinente cuando un servicio debe notificar a un cliente de forma continua en lugar de a otro servicio de forma puntual.

## El beneficio principal: el escalado independiente

En un monolito, una carga elevada sobre una sola funcionalidad (el pago durante un pico de ventas, por ejemplo) obliga a multiplicar la aplicación **entera**, incluidas las partes que no lo necesitan. Con servicios separados, solo se escala el servicio afectado, sin tocar los demás.

## La trampa del monolito distribuido

Dividir el código en varios servicios no basta para obtener los beneficios de los microservicios si el acoplamiento entre ellos sigue siendo fuerte:

> **Trampa:** aplicar la verdadera prueba de la [responsabilidad única](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) ("si modifico esto, ¿es por el mismo motivo que aquello?") únicamente a la división en archivos, nunca a la división en servicios. Unos servicios que deben desplegarse sistemáticamente juntos, o en los que un cambio de contrato de API en uno obliga a modificar de inmediato todos los demás, no son más que un **monolito distribuido**: toda la complejidad operativa de los microservicios, ninguno de sus beneficios de independencia.
>
> **Buena práctica:** dividir los servicios siguiendo las mismas fronteras que las de una responsabilidad única bien planteada (dominios de negocio realmente independientes), nunca por comodidad técnica (un servicio por tipo de archivo, por ejemplo), y verificar regularmente que dos servicios puedan desplegarse realmente el uno sin el otro.

## El coste: una complejidad que no desaparece, se desplaza

Los microservicios no son gratuitos: la complejidad que un monolito gestiona en memoria (una llamada a función, una única transacción de base de datos) debe gestionarse ahora a través de la red (latencia, posible fallo parcial, ya no hay una única transacción que cubra varios servicios). Observar lo que ocurre (véase [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) para un ejemplo de este tipo de supervisión, aplicado a un LLM en lugar de a microservicios) se vuelve indispensable en cuanto varios servicios interactúan: un error puede venir ahora de cualquiera de ellos, o de la comunicación entre ellos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Los microservicios aplican la responsabilidad única a la escala del despliegue: un servicio por dominio de negocio, su propia base de datos, una comunicación por API en lugar de un acceso directo a los datos de otro servicio. El beneficio principal es el escalado independiente de un servicio concreto, sin multiplicar toda la aplicación. |
| **Herramientas utilizables** | Una llamada síncrona (HTTP/API) para una necesidad de respuesta inmediata; una cola de mensajes asíncrona para desacoplar la disponibilidad de dos servicios. |
| **Trampas a evitar** | Compartir una base de datos entre varios servicios. Dividir en servicios sin reducir el acoplamiento entre ellos (monolito distribuido). |
| **Buenas prácticas** | Hacer que cada servicio tenga su propio almacenamiento, nunca compartido. Dividir siguiendo fronteras de dominio de negocio realmente independientes, y verificar regularmente que un servicio pueda desplegarse sin los demás. |
