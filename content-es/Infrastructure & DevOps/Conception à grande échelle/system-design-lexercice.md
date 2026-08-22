---
order: 1
---

# El "system design" como tipo de ejercicio

"Diseña Uber." "Diseña LeetCode." Este tipo de consigna, muy habitual en entrevistas técnicas, no pide escribir código: pide razonar sobre los grandes bloques que compondrían el producto, cómo se comunican, y por qué esta elección en lugar de otra a la escala buscada. Es un ejercicio diferente del que cubre [Calidad y arquitectura del código](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=qualite-et-architecture-du-code): este trata sobre la calidad de un código ya escrito, el "system design" trata sobre decisiones tomadas **antes** de escribir una sola línea de código, a un nivel donde solo se dibujan componentes (cliente, servidor, base de datos...) y sus intercambios, en forma de cajas conectadas por flechas.

## La estructura típica de un ejercicio de system design

| Etapa | Pregunta a la que responde |
|---|---|
| 1. Definir la necesidad y la escala | ¿Cuántos usuarios, cuántas peticiones por segundo, qué proporción de lecturas frente a escrituras? |
| 2. Dibujar la arquitectura global | ¿Qué componentes (cliente, servidores, bases de datos, caché...) y cómo se comunican, sin entrar aún en detalle? |
| 3. Profundizar en 1 o 2 componentes críticos | ¿Cuál es el punto más difícil del sistema, y cómo resolverlo con precisión? |
| 4. Discutir los compromisos | ¿Qué sacrifica esta elección (coste, complejidad, coherencia de los datos) a cambio de lo que aporta? |

> **Trampa:** buscar "la" respuesta correcta a un ejercicio de system design. No hay una única: la respuesta correcta depende enteramente de las suposiciones planteadas en la etapa 1 (la escala buscada cambia radicalmente la arquitectura pertinente). Dos respuestas diferentes pueden ser ambas correctas, si cada una asume claramente una escala distinta.
>
> **Buena práctica:** enunciar siempre explícitamente las suposiciones de partida (número de usuarios, de peticiones por segundo) antes de proponer una arquitectura, en lugar de dibujar directamente cajas sin precisar nunca para qué escala están pensadas.

## Ejemplo: "Diseña Uber"

Aplicando las 4 etapas a una necesidad simplificada (localizar a los conductores, poner en contacto con un pasajero):

```text
Pasajero                          Conductor
   |  pide un viaje                   |  envia su posicion
   v                                  v
   Servidor de emparejamiento <----- Posicion actualizada en continuo
   |
   |  busca los conductores mas cercanos
   v
   Base de datos de posiciones (indice geoespacial)
```

Dos puntos merecen profundización (etapa 3):

- **Actualizar la posición de un conductor en continuo**: una conexión clásica petición/respuesta obligaría al teléfono a preguntar sin cesar "¿hay algo nuevo?"; una conexión [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) evita este derroche manteniendo un enlace abierto, en el que el servidor empuja cada actualización en cuanto ocurre.
- **Encontrar los conductores más cercanos a un pasajero**: un [índice](/?c=donnees&s=bases-de-donnees&p=les-index) clásico acelera una búsqueda por igualdad o por rango sobre una columna, pero "los puntos más cercanos a una coordenada" es una pregunta diferente. Un **índice geoespacial** (por ejemplo un [geohash](https://en.wikipedia.org/wiki/Geohash) o una estructura de tipo quadtree) responde específicamente a este tipo de búsqueda, dividiendo el espacio geográfico en zonas para comparar solo un pequeño número de candidatos plausibles en lugar de todas las posiciones conocidas.

## Ejemplo: "Diseña LeetCode"

El mismo método, aplicado a una plataforma que ejecuta código enviado por sus usuarios:

```text
Usuario envia codigo
   |
   v
Cola de envios  <-- mismo principio que "Colas
   |                y procesamiento asincrono" (alto trafico)
   v
Worker: ejecuta el codigo en un entorno aislado
   |
   v
Resultado almacenado, usuario notificado
```

El punto más delicado aquí (etapa 3): **ejecutar código proporcionado por un desconocido sin poner en peligro el resto de la plataforma**. La respuesta se apoya en un principio ya visto en otro lugar de Devpedia: aislar la ejecución en un entorno confinado, como un [contenedor Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) desechable, destruido tras cada ejecución, sin acceso al resto del sistema. La cola que absorbe los picos de envíos retoma exactamente el principio ya detallado en [Bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic): desacoplar la petición de su procesamiento en lugar de hacer esperar al usuario.

## Una vez definida la arquitectura: cómo dividirla en servicios

Una vez identificados los grandes bloques (etapas 1-2), queda abierta una elección: agruparlos en un solo programa, o repartirlos en varios [microservicios](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices) independientes. Esta elección corresponde al capítulo dedicado: el system design identifica **qué** componentes son necesarios y cómo se articulan, no necesariamente **cómo** repartirlos en programas separados.

## Resumen

| | |
|---|---|
| **Para recordar** | El system design razona sobre los grandes bloques de un sistema (componentes, intercambios, escala) antes de escribir código, en 4 etapas: definir la escala, dibujar la arquitectura global, profundizar en los puntos críticos, discutir los compromisos. |
| **Herramientas utilizables** | WebSocket para un flujo de actualizaciones continuo; un índice geoespacial para una búsqueda por proximidad; una cola para absorber picos de peticiones; un contenedor aislado para ejecutar código no confiable. |
| **Trampas a evitar** | Buscar "la" arquitectura correcta sin precisar nunca la escala buscada. |
| **Buenas prácticas** | Enunciar siempre las suposiciones de escala antes de proponer una arquitectura. |
