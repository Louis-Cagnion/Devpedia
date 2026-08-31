---
order: 1
---

# Los hooks: automatizar un agente LLM en puntos precisos de su ciclo de vida

Un [asistente agéntico](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) funciona, turno tras turno, sobre un [bucle herramienta/reflexión](/?c=ia&s=nlp-llm&p=agents): recibe una petición, decide llamar o no a una herramienta, recibe un resultado, vuelve a empezar. Este bucle lo ejecuta un programa (la aplicación o la herramienta de línea de comandos que aloja al agente), no el propio modelo: ese programa es el **harness**. Un **hook** es un fragmento de código que el harness ejecuta él mismo en un punto preciso de este bucle, sin pasar nunca por el modelo: siempre se ejecuta, piense en ello el modelo o no. Este capítulo explica este mecanismo como un patrón general de configuración de LLM, con un agente en línea de comandos como ilustración concreta (Claude Code sirve de ejemplo, pero el principio se encuentra, con otros nombres, en la mayoría de las herramientas agénticas).

## El problema: una instrucción en el prompt nunca está garantizada

Pedir al modelo que haga algo sistemáticamente ("relee siempre el archivo antes de modificarlo", "avísame antes de cualquier eliminación") sigue siendo una simple petición dirigida a un sistema probabilístico (ver los [límites de un LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)): nada obliga a su ejecución.

| | Instrucción en el prompt | Hook |
|---|---|---|
| Quién lo ejecuta | El modelo, si decide seguirla | El harness, fuera del modelo |
| Garantía de ejecución | Ninguna: puede olvidarse, eludirse, diluirse en un contexto largo | Sistemática: el código se ejecuta en cada ocurrencia del punto de anclaje |
| Puede ser ignorada por un dato manipulado (*[prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)*) | Sí | No: nunca pasa por el razonamiento del modelo |

## El principio: un disparador, una acción, fuera del control del modelo

El mecanismo retoma la idea de un [disparador que inicia una acción](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) (un correo recibido dispara un flujo de trabajo) o de un [`addEventListener` en una página web](/?c=langages&s=javascript&p=dom-et-evenements) (un clic dispara una función): ocurre un evento, una función se ejecuta en reacción. Aquí, el evento ya no es una acción del usuario ni un correo, sino un punto preciso del ciclo de vida del agente.

```text
Evento del ciclo de vida del agente
        │
        ▼
   ┌─────────┐
   │  Hook   │  ← código escrito por el desarrollador, no por el modelo
   └─────────┘
        │
        ▼
Decisión: dejar pasar / bloquear / modificar / añadir contexto
```

## Los puntos de anclaje típicos de un agente

Los nombres exactos varían de una herramienta a otra, pero los mismos momentos se repiten en todas partes:

| Punto de anclaje (nombre genérico) | Se dispara | Ejemplo de uso |
|---|---|---|
| Inicio de sesión | Al arrancar o reanudar una conversación | Cargar un contexto de proyecto, verificar un estado externo |
| Antes de llamar a una herramienta | Justo antes de que el agente ejecute una acción (comando, escritura de archivo...) | Bloquear un comando peligroso, pedir una confirmación |
| Después de llamar a una herramienta | Justo después del resultado de una acción | Formatear automáticamente un archivo que acaba de modificarse |
| Antes de enviar al modelo | Justo antes de que el prompt parta hacia el modelo | Inyectar una información actualizada (fecha, estado de un sistema) |
| Fin de turno / de sesión | Cuando el agente se detiene o termina una respuesta | Registrar, notificar, guardar un resumen |

## Anatomía de un hook: entrada, decisión, salida

Un hook recibe datos estructurados ([JSON](/?c=infrastructure-devops&s=infrastructure&p=json)) que describen el evento, y responde del mismo modo: es esta respuesta la que dirige lo que sigue.

```text
// Entrada recibida por el hook (ejemplo: antes de llamar a una herramienta)
{ "tool_name": "delete_file", "tool_input": { "path": "config/prod.yaml" } }

// Salida posible del hook: bloquea la acción y explica por qué
{ "decision": "block", "reason": "Eliminación de un archivo de configuración sin confirmación explícita" }
```

| Decisión posible | Efecto |
|---|---|
| Dejar pasar | El agente continúa con normalidad, nada cambia |
| Bloquear | La acción nunca se produce, el agente recibe el motivo del rechazo |
| Modificar | La entrada de la acción se reescribe antes de ejecutarse |
| Añadir contexto | Se inyecta una información en lo que ve el modelo, sin pasar por una acción del agente |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Hook lento y síncrono | Cada ocurrencia del punto de anclaje espera a que termine el hook: un hook mal escrito ralentiza todo el agente |
| Fallo silencioso | Un hook que falla sin propagar un error hace creer que la automatización ha tenido lugar, cuando en realidad no ha pasado nada |
| Ejecutar un dato no fiable | Un hook que construye un comando a partir de un dato venido del exterior (archivo, página web, resultado de herramienta) abre la misma brecha que una [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection): el dato puede pilotar el propio hook |
| Confundir garantía de hook e instrucción de prompt | Creer que escribir una regla en el prompt de sistema ofrece la misma fiabilidad que un hook, cuando solo el segundo se ejecuta realmente siempre |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Fijar un límite de tiempo máximo (*timeout*) corto | Evita que un hook bloqueado congele todo el agente |
| Fallar de forma ruidosa, nunca en silencio | Un error de hook debe ser visible, como cualquier [error que se registra](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Limitar el hook a lo estrictamente necesario | Cuantas menos cosas haga un hook, menor [superficie de ataque](/?c=ia&s=nlp-llm&p=prompt-injection) ofrece ante un dato manipulado, y menos formas distintas tiene de fallar |
| Probar el hook de forma aislada antes de conectarlo | Verificar su comportamiento con una entrada simulada, sin depender de un turno real del agente para dispararlo |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un hook es código ejecutado por el harness, no por el modelo, en un punto preciso del ciclo de vida de un agente: siempre se ejecuta, a diferencia de una instrucción de prompt. |
| **Trampas a evitar** | Hook lento y bloqueante, fallo silencioso, ejecución de un dato no fiable, confundir garantía de hook con simple instrucción. |
| **Buenas prácticas** | Timeout corto, fallo visible, alcance mínimo, prueba aislada antes de la integración. |
