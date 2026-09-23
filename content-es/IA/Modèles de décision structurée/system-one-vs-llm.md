---
order: 1
---

# Los modelos de decisión estructurada: una alternativa a los LLM generativos

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) siempre responde con texto: incluso cuando se le pregunta "¿urgente o no urgente?", produce una cadena de palabras que luego hay que releer, trocear y validar (típicamente mediante un [esquema JSON](/?c=ia&s=nlp-llm&p=agents) que describe la forma esperada). Nada garantiza que respete esa forma a la primera, ni que no invente una respuesta plausible pero falsa, una [alucinación](/?c=ia&s=nlp-llm&p=llm-en-production). Una familia de modelos más reciente, los **modelos de decisión estructurada**, elige otro camino: renunciar a generar texto libre para responder solo a preguntas cerradas, con una salida que siempre tiene la forma esperada y una probabilidad numérica de equivocarse.

## De dónde viene la idea: sistema 1 y sistema 2

El nombre viene del libro del psicólogo Daniel Kahneman, [*Pensar rápido, pensar despacio*](https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/), que distingue dos formas de pensar en el ser humano:

| | Sistema 1 | Sistema 2 |
|---|---|---|
| Velocidad | Rápido, automático | Lento, requiere esfuerzo |
| Ejemplo | Reconocer una cara, evaluar una emoción | Resolver 17 × 24, planificar una ruta |
| Lo que produce | Una respuesta inmediata, poco razonamiento explícito | Un razonamiento construido paso a paso |

Un LLM generativo, que despliega un razonamiento token a token (ver [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) y las cadenas de razonamiento), se acerca al sistema 2. Los modelos llamados **"System One"** buscan lo contrario: responder rápido, sin desplegar razonamiento textual, sobre preguntas deliberadamente estrechas.

## Lo que responde un modelo de decisión estructurada

En lugar de generar una frase, un modelo de este tipo responde a una pregunta cerrada, planteada contra un **estado** (el conjunto de datos útiles para la decisión, ej: el contenido de un ticket de soporte), y siempre devuelve:
- una respuesta en un formato fijado de antemano (nunca texto libre);
- una probabilidad (o una distribución de probabilidades) asociada;
- una puntuación de confianza, distinta de esa probabilidad.

## Comparación con un LLM generativo clásico

| | LLM generativo clásico | Modelo de decisión estructurada |
|---|---|---|
| Salida | Texto libre, a parsear después | Valor tipado fijado de antemano (opción, puntuación, sí/no) |
| Entrada | Un prompt textual | Un estado estructurado + una pregunta cerrada |
| Muestreo | Token a token, secuencial | Todas las respuestas en una pasada (paralelo) |
| Puede producir un formato inválido | Sí, requiere validación (ver [JSON Schema](/?c=ia&s=nlp-llm&p=agents)) | No, la salida está restringida por construcción |
| Probabilidad reportada | Ausente o poco fiable | Calibrada: entrenada para reflejar la realidad estadística |
| Uso previsto | Redacción, razonamiento abierto, conversación | Clasificación, puntuación, enrutamiento, verificación |

## Un ejemplo concreto: Jev

**Jev** es un modelo de este tipo publicado por el laboratorio [TypeSafe AI](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (llamado así por el economista William Stanley Jevons), y sirve de ilustración en el resto de esta parte. Responde a tres formas de pregunta cerrada, detalladas en el [capítulo siguiente](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), y reivindica en este ámbito restringido una latencia de 70 a 500 ms (frente a varios segundos para un LLM de frontera comparable) y una tasa de error de formato nula. Estas cifras vienen del proveedor y no han sido verificadas de forma independiente; lo que importa para este curso es el principio que ilustran, no el benchmark en sí.

## Para qué sirve, y para qué no

| Adecuado | No adecuado |
|---|---|
| Clasificar un mensaje en una categoría fija | Redactar un texto, una respuesta abierta |
| Puntuar un contenido en una escala conocida de antemano | Explicar un razonamiento en lenguaje natural |
| Enrutar una petición hacia el tratamiento correcto | Responder a una pregunta cuyas respuestas posibles no se conocen de antemano |
| Verificar o filtrar la salida de otro modelo (barrera de seguridad) | Mantener una conversación o hacer generación creativa |
| Extraer un valor entre candidatos ya identificados | Generar código, un plan, un documento |

> **Trampa:** creer que un modelo de decisión estructurada sustituye a un LLM. Solo hace una cosa: responder a una pregunta cerrada contra un estado dado. Un sistema real casi siempre combina ambos, el LLM para razonar y generar, el modelo de decisión para los puntos de paso estrechos (clasificar, puntuar, verificar) donde una salida garantizada y rápida importa más que una respuesta abierta.
>
> **Buena práctica:** identificar, en un pipeline existente basado en LLM, los pasos que ya solo eligen entre opciones conocidas de antemano (enrutamiento, puntuación, validación): son los candidatos naturales para un modelo de decisión estructurada, sin tocar los pasos que realmente generan texto.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Un modelo de decisión estructurada (categoría "System One", en referencia al sistema 1 de Kahneman) responde a preguntas cerradas contra un estado dado, con una salida siempre en el formato correcto y una probabilidad calibrada, a diferencia de un LLM generativo que produce texto libre a validar después. Complementa a un LLM, no lo sustituye. |
| **Herramientas utilizables** | Jev (TypeSafe AI) como ejemplo público de este tipo de modelo. |
| **Trampas a evitar** | Confundir "modelo de decisión estructurada" con un reemplazo completo de un LLM; pedirle una tarea abierta (redacción, razonamiento libre) para la que no está diseñado. |
| **Buenas prácticas** | Reservar este tipo de modelo para los pasos de un pipeline que ya solo eligen entre opciones conocidas de antemano, combinándolo con un LLM para el resto. |
