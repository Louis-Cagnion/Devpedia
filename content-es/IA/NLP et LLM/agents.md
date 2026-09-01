---
order: 5
---

# Agentes: bucle herramienta/reflexión y orquestación

Un LLM solo produce texto a partir de texto (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)): no puede ni consultar una base de datos actualizada, ni ejecutar un cálculo fiable, ni enviar un email. Un **agente** es la forma de levantar esta limitación: se le dan al modelo **herramientas** que puede decidir invocar, y un bucle que repite la operación hasta que tenga con qué responder.

## Dar una herramienta a un modelo: el function calling

El mecanismo básico se llama *function calling* (o *tool use*): el modelo recibe, además del prompt, la descripción estructurada de una o varias funciones disponibles (su nombre, qué hacen, los parámetros que esperan), un simple documento [JSON](/?c=infrastructure&p=json):

```json
{
  "name": "obtener_tiempo",
  "description": "Devuelve el tiempo actual para una ciudad dada",
  "parameters": {
    "ciudad": { "type": "string", "description": "Nombre de la ciudad" }
  }
}
```

El modelo no puede ejecutar esta función él mismo; solo **decide** que sería útil aquí, y produce los argumentos a pasarle, también en JSON:

```json
{ "llamada": "obtener_tiempo", "argumentos": { "ciudad": "Montpellier" } }
```

Es el código que rodea al modelo el que recibe esta decisión, ejecuta realmente la función correspondiente (Python, la llamada [HTTP](/?c=infrastructure&p=api-et-http), la consulta [SQL](/?c=domain-specific-languages-dsl&p=sql)...), y devuelve su resultado al modelo para que continúe.

> **Trampa:** confiar ciegamente en los argumentos producidos por el modelo antes de pasarlos a la función real: el modelo nunca "sabe" realmente qué hace una función más allá de su descripción de texto, una descripción imprecisa o ambigua produce llamadas con los argumentos equivocados tan seguro como una función mal documentada engaña a un desarrollador humano que solo leyera su firma.
>
> **Buena práctica:** validar los argumentos recibidos (tipos, valores esperados) antes de ejecutar la función real, exactamente como se validaría una entrada venida de cualquier fuente no fiable.

## JSON Schema: un sistema de tipos para los argumentos de una herramienta

La sección `parameters` del ejemplo anterior sigue una convención estándar llamada **JSON Schema**: cumple el mismo papel que un sistema de tipos en un lenguaje clásico, expresado en JSON en lugar de en sintaxis de lenguaje.

| JSON Schema | Equivalente en un lenguaje tipado clásico |
|---|---|
| `type: "string"` / `"integer"` / `"boolean"` | `string` / `int` / `bool` |
| `type: "array", items: {...}` | Un array/lista tipada |
| `type: "object", properties: {...}, required: [...]` | Una estructura/clase con campos obligatorios |
| `enum: ["fr", "en", "es"]` | Un tipo enumerado |

Un lenguaje tipado clásico valida una llamada descrita en JSON Schema con sus propias herramientas: en [Python](/?c=langages-de-programmation&s=python&p=python), la biblioteca **Pydantic** convierte directamente un esquema en una clase validada; en Node.js, la biblioteca **Ajv** valida un objeto JSON contra un esquema; en Go, las etiquetas `json` en los campos de una estructura cumplen un papel similar, sin una biblioteca de validación JSON Schema tan estándar como las dos anteriores.

## Un parámetro libre en lugar de un valor fijo: de dónde viene la variación

El parámetro `ciudad` del ejemplo anterior solo toma sus valores de un conjunto limitado y previsible (nombres de ciudades). Nada obliga a que un parámetro esté tan limitado: puede igualmente ser un **texto libre que el propio modelo redacta**, como un comando shell, una consulta SQL o un fragmento de código:

```json
{
  "name": "ejecutar_bash",
  "description": "Ejecuta un comando shell y devuelve su salida estándar",
  "parameters": {
    "comando": { "type": "string", "description": "El comando a ejecutar" }
  }
}
```

La función que realmente ejecuta esta herramienta (del lado del código, no del modelo) es tan básica como parece: casi siempre un simple `subprocess.run(comando)` que lanza la cadena recibida sin entenderla en absoluto. Nunca cambia entre dos llamadas. Lo que varía es el **contenido de `comando`**, compuesto de nuevo por el modelo en cada llamada según lo que acaba de aprender:

```text
Turno 1 -> el modelo genera: { "comando": "ls -la /var/log" }
        -> resultado: la lista de archivos de log
Turno 2 -> el modelo genera: { "comando": "grep ERROR /var/log/app.log | tail -20" }
        -> misma herramienta, misma función Python detrás, comando totalmente diferente
```

Es exactamente esto lo que permite a un agente producir comandos bash diferentes cada vez para una misma herramienta: la función ejecutada no cambia (solo obedece), pero el texto que recibe lo redacta el modelo sobre la marcha, como un humano que escribiría un comando diferente según lo que acaba de ver mostrarse en su terminal.

> **Trampa:** un parámetro libre lleva un riesgo mucho más alto que un parámetro restringido: nada garantiza que el texto generado por el modelo sea correcto, ni siquiera inofensivo. Un comando shell generado por el modelo puede contener, por accidente o por manipulación (ver la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)), los mismos caracteres especiales que hacen posible una [inyección de comandos](/?c=shells&s=bash&p=variables).
>
> **Buena práctica:** tratar todo parámetro libre generado por un modelo con la misma desconfianza que una entrada de usuario no controlada: nunca interpolarlo ciegamente en un comando o una consulta sin las mismas precauciones que en cualquier otro sitio.

## El bucle reflexión / acción (ReAct)

Tener herramientas disponibles (la sección anterior) no basta, por sí solo, para hacer un agente: un programa que llama a una lista fija de funciones en un orden escrito de antemano por un desarrollador sigue siendo un script clásico, incluso si consulta a un LLM en una etapa. Lo que hace que se hable de un agente es que **el modelo decide él mismo, en cada etapa, qué hacer a continuación** (qué herramienta llamar, con qué argumentos, o si ha terminado), según el resultado de las etapas anteriores, sin que ningún humano haya escrito ese desarrollo de antemano. Un agente es por tanto esta secuencia repetida hasta que el modelo juzga tener suficientes elementos para responder, en lugar de un simple ida y vuelta pregunta/respuesta, o un script de secuencia fija:

```text
1. El modelo recibe la pregunta y el historial
2. Decide: responder directamente, O llamar a una herramienta
3. Si herramienta: el código la ejecuta, el resultado se añade al historial
4. Vuelta al paso 1, con este nuevo elemento de contexto
```

Este patrón, a menudo llamado [*ReAct*](https://arxiv.org/abs/2210.03629) (*Reasoning + Acting*), permite encadenamientos de varias etapas: buscar una información, usarla para refinar una segunda búsqueda, calcular un resultado intermedio, antes de componer la respuesta final, apoyándose cada etapa en el resultado real de la anterior en lugar de en una suposición del modelo.

## Los riesgos propios de un bucle pilotado por un modelo no determinista

Un bucle clásico se detiene con una condición conocida de antemano. Un bucle de agente se detiene cuando el modelo **decide** detenerse, una decisión no garantizada, tomada por un sistema que puede equivocarse (ver los límites del capítulo [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)).

> **Trampa:** un bucle no acotado. Sin un tope explícito sobre el número de turnos, un modelo que no logra concluir puede repetir llamadas indefinidamente.
>
> **Buena práctica:** imponer un tope duro (número de turnos, presupuesto de tokens), igual que un timeout sobre cualquier llamada de red.

> **Trampa:** un coste que se acumula silenciosamente. Cada turno del bucle es una llamada LLM de pleno derecho, facturada independientemente (ver [el coste en producción](/?c=ia&s=nlp-llm&p=llm-en-production)): responder en un solo turno cuesta el precio de una llamada, un agente que necesitó 20 turnos para llegar a su respuesta ha facturado 20, incluso si el usuario solo hizo una pregunta. El multiplicador es en la práctica peor que un simple x20: en cada turno, todo el historial de los turnos anteriores (pregunta inicial, llamadas a herramientas, resultados obtenidos) se reenvía como entrada al modelo para que conserve el contexto: el prompt del turno 20 es por tanto mucho más grande que el del turno 1, de modo que el coste total crece más rápido que el número de turnos en sí.
>
> **Buena práctica:** vigilar el coste acumulado de un bucle de agente en producción (ver la [monitorización de coste](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), no solo el coste medio por pregunta: la ganancia de un agente no siempre es proporcional a este sobrecoste.

> **Trampa:** acciones irreversibles decididas por un sistema falible. Un agente que puede enviar un email o modificar una base de datos también puede hacerlo por error, confiando en un razonamiento equivocado.
>
> **Buena práctica:** exigir una confirmación humana antes de toda acción con consecuencia real (financiera, destructiva, visible públicamente); para un sistema clasificado de riesgo elevado, es una obligación legal explícita de la [regulación europea de la IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia), no solo una buena práctica.

## ¿Un agente, o varios que se reparten el trabajo?

Dos arquitecturas se oponen para tareas complejas:

| | Un agente generalista | Varios agentes especializados |
|---|---|---|
| Principio | Un solo modelo, muchas herramientas disponibles | Cada agente tiene un rol estrecho (búsqueda, redacción, verificación) y transmite su resultado al siguiente |
| Ventaja | Más simple de construir y de seguir | Cada agente permanece concentrado en una tarea que domina mejor, más fácil de evaluar aisladamente |
| Inconveniente | Un prompt de sistema que crece con cada herramienta añadida, hasta diluir la atención del modelo | Coordinación a diseñar explícitamente (quién habla con quién, en qué orden, qué hacer si un agente falla) |

La elección sigue la misma lógica que en cualquier otro sitio en arquitectura de software: un solo agente generalista basta mientras la tarea siga acotada; la especialización se justifica cuando la complejidad (número de herramientas, longitud del razonamiento) empieza a degradar la fiabilidad de un agente único.

## Coordinar varios agentes: los patrones habituales

"Coordinación a diseñar explícitamente" cubre en la práctica algunos patrones recurrentes, no incompatibles entre sí:

| Patrón | Principio | Adecuado cuando |
|---|---|---|
| **Encadenamiento secuencial** (*pipeline*) | La salida del agente A se convierte en la entrada del agente B, en un orden fijo (ej: un agente "búsqueda" luego un agente "redacción") | Las etapas se conocen de antemano y se ejecutan siempre en el mismo orden |
| **Orquestador / trabajadores** | Un agente "orquestador" descompone la tarea, decide qué agente especializado llamar y en qué orden, luego ensambla sus resultados | El orden de las etapas depende de la tarea misma y no puede fijarse de antemano |
| **Estado compartido** (*blackboard*) | Los agentes no se hablan directamente: leen y escriben en un espacio común (una base, un documento compartido), reaccionando cada uno a lo que los demás han depositado ahí | Varios agentes deben colaborar sin dependencia estricta de orden, contribuyendo cada uno cuando tiene con qué hacerlo |
| **Evaluador / optimizador** | Un agente genera una primera versión, un segundo rol (el mismo modelo u otro) la critica según criterios explícitos, luego una nueva versión integra esa crítica, repetido hasta un criterio de parada (ver el detalle en [El asistente de IA agéntico en terminal](/?c=ia&s=applications-llm&p=assistant-agentique-terminal)) | La calidad de salida importa más que la latencia, y existe un criterio de juicio explícito (checklist, tests, formato esperado) |

Sea cual sea el patrón elegido, cada subagente arranca por defecto con un contexto **vacío**: es el prompt redactado por el agente que llama el que constituye todo el contexto transmitido, no una herencia automática del historial del agente padre. Un subagente que necesite una información establecida antes en la conversación debe recibirla explícitamente en ese prompt, salvo mecanismo dedicado de copia completa del historial.

> **Trampa:** con un estado compartido en particular, nada impide que dos agentes actúen basándose en información que se ha vuelto incoherente entre ellos (uno leyó el estado antes de que el otro lo modificara), la misma clase de problema que un acceso concurrente a un recurso compartido en programación clásica.
>
> **Buena práctica:** prever explícitamente, para cada uno de estos tres patrones, qué hacer si un agente falla o produce un resultado inutilizable (un agente "verificador" intercalado, un control de formato a la salida de cada etapa) y quién tiene la última palabra en caso de escritura concurrente, los mismos remedios que un acceso concurrente clásico (bloqueo, un solo agente autorizado a escribir a la vez).

## Sesiones pares asíncronas: cuando ningún agente es el padre del otro

Los cuatro patrones anteriores suponen todos un agente LLAMADOR que descompone una tarea e inicia subagentes con contexto vacío (ver la observación justo encima de la tabla). Existe otro caso: dos sesiones ya en curso, cada una con su propio historial completo (y potencialmente su propio humano en la conversación), sin relación padre/hijo entre ellas.

```text
Sesión A (repo "site-web")                  Sesión B (repo "scraper", ya en curso)
     |                                                |
     | 1. consulta un REGISTRO de sesiones activas    |
     |------------------------------------------------>
     | 2. envía un mensaje asíncrono (buzón)
     |------------------------------------------------>
     |                                                | 3. procesado en el PRÓXIMO turno de herramienta de B, no inmediatamente
     |                                                | 4. B responde, o continúa su propio trabajo
```

Este patrón se apoya en dos mecanismos distintos: el **descubrimiento** (un registro recoge las sesiones activas, para que una pueda encontrar a otra sin configuración previa) y el **mensaje asíncrono** (a diferencia de una llamada a herramienta clásica, bloqueante, se deposita y se procesa en el próximo turno del agente destinatario, sin garantía de plazo ni de respuesta). Un mecanismo complementario suele completar este patrón: la **suscripción** («avísame cuando vuelvas a estar inactivo»), que evita tener que consultar en bucle (*polling*) si un par ha terminado su tarea.

> **Trampa:** tratar un mensaje asíncrono como una llamada síncrona. Nada garantiza que el destinatario lo procese de inmediato (puede estar ocupado con otra cosa), ni siquiera que responda (su sesión pudo haber terminado mientras tanto): un uso que suponga una respuesta rápida y fiable debe prever explícitamente el caso de ausencia de respuesta.
>
> **Buena práctica:** reservar este patrón para avisos puntuales entre tareas por lo demás independientes (ej. dos agentes trabajando cada uno en un repo distinto, pero unidos por una dependencia común), no para una coordinación que exija un orden estricto o una respuesta inmediata: en ese caso, volver al orquestador/trabajadores de arriba, donde el agente llamador realmente espera el resultado.

## Resumen

| | |
|---|---|
| **Para recordar** | Un agente da herramientas a un LLM (function calling) y lo deja decidir él mismo, en cada etapa, qué herramienta llamar y cuándo detenerse (bucle ReAct), a diferencia de un script de secuencia fija escrito de antemano. Varios agentes se coordinan según algunos patrones recurrentes (pipeline, orquestador/trabajadores, estado compartido, evaluador/optimizador, o sesiones pares asíncronas sin relación padre/hijo). |
| **Herramientas utilizables** | Una descripción JSON de cada herramienta disponible (nombre, parámetros, descripción); un tope de turnos/presupuesto para acotar el bucle; un registro de sesiones y una mensajería asíncrona para coordinar agentes pares. |
| **Trampas a evitar** | Confiar ciegamente en los argumentos generados por el modelo. Un parámetro libre (comando, consulta) tratado sin las mismas precauciones que una entrada no fiable. Un bucle no acotado. Un coste que se acumula silenciosamente. Una acción irreversible decidida sin confirmación humana. Tratar un mensaje asíncrono entre sesiones pares como una llamada síncrona garantizada. |
| **Buenas prácticas** | Validar los argumentos recibidos antes de ejecutar una herramienta. Tratar todo parámetro libre generado por el modelo como una entrada no fiable. Imponer un tope duro sobre el número de turnos. Vigilar el coste acumulado de un bucle. Exigir una confirmación humana antes de toda acción con consecuencia real. Reservar las sesiones pares asíncronas para avisos puntuales, no para una coordinación estricta. |
