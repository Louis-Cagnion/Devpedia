---
order: 8
---

# Gobernanza de un pipeline de voz IA

[Gobernanza de datos para un sistema de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) plantea los principios generales (clasificar un dato, rastrear quién pidió qué, respetar el derecho al olvido). Este capítulo los retoma para un pipeline de síntesis de voz, donde el dato en juego, una **voz**, tiene un estatus particular ya señalado en [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix): es un dato biométrico, identificante por naturaleza.

## La voz como dato biométrico

A diferencia de un prompt de texto, una voz identifica directamente a una persona, al mismo título que una huella digital o un rostro: clasificar una voz como dato "personal" en el sentido más corriente (ver el [capítulo general](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) subestima su nivel de sensibilidad real.

| | Dato personal "clásico" (nombre, email) | Voz |
|---|---|---|
| Puede cambiarse si se compromete | Sí (cambiar de email) | No (imposible "cambiar" la propia voz) |
| Reutilizable para usurpar una identidad | Limitado (un nombre solo generalmente no basta) | Sí, directamente (ver el riesgo de fraude ya señalado en [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

> **Trampa:** aplicar a una muestra vocal las mismas reglas de clasificación que a un dato personal "clásico" (nombre, email), sin tener en cuenta que una voz comprometida nunca puede "cambiarse" como una contraseña o un email.
>
> **Buena práctica:** tratar toda muestra vocal identificable como un dato biométrico de pleno derecho, con un nivel de protección al menos equivalente al de una huella digital o una foto de rostro.

## Trazabilidad: qué muestra produjo qué voz clonada

Un pipeline de clonación de voz debe poder responder a posteriori a *"¿qué muestra de referencia sirvió para producir este audio, con el consentimiento de quién?"*, la misma exigencia de trazabilidad que para un LLM (ver [Monitoreo y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), con un registro adicional propio de la voz: la prueba del consentimiento obtenido (ver [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix)), conservada por separado del audio generado en sí.

> **Trampa:** conservar el audio de referencia y el audio generado, pero no la prueba del consentimiento obtenido en el momento de la clonación. Sin esta prueba, se vuelve imposible demostrar a posteriori que esa clonación estaba autorizada, en particular en caso de disputa.
>
> **Buena práctica:** registrar la prueba de consentimiento como un elemento de trazabilidad de pleno derecho, distinto del audio en sí, con el mismo rigor que la versión de un modelo o el prompt enviado a un LLM.

## Retención y derecho al olvido: varias copias de una misma voz

El principio ya visto (un dato puede copiarse en varios lugares sin que un solo `DELETE` baste, ver el [capítulo general](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) se aplica a una voz con una variante adicional: un **embedding de locutor** (ver [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) es en sí mismo una representación compacta, pero siempre identificante, de esa voz.

| Lugar donde la voz pudo haberse copiado | ¿Eliminación desencadenada por la eliminación de la muestra de audio original? |
|---|---|
| Archivo de audio de referencia, almacenado tal cual | Sí |
| Embedding de locutor, extraído de esa muestra | No: el embedding sigue existiendo y sigue siendo utilizable para clonación, incluso tras eliminar el audio fuente |
| Audio ya generado a partir de esa voz | No: cada audio generado es una copia independiente |

> **Trampa:** responder a una solicitud de eliminación borrando únicamente el archivo de audio de referencia, dejando intactos el embedding de locutor ya extraído y todo audio ya generado: la voz sigue entonces siendo clonable o ya presente en contenidos existentes.
>
> **Buena práctica:** hacer que el procedimiento de eliminación cubra la muestra fuente, el embedding de locutor extraído de ella, y los contenidos ya generados que dependen de él, exactamente el mismo reflejo que para un embedding vectorial de RAG ya señalado en el capítulo general.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una voz es un dato biométrico, nunca "cambiable" una vez comprometido, a proteger como una huella o un rostro. La trazabilidad de un pipeline de clonación debe incluir la prueba de consentimiento, no solo el audio. La eliminación debe cubrir la muestra fuente, el embedding de locutor extraído de ella, y los contenidos ya generados a partir de él. |
| **Herramientas utilizables** | Un registro de consentimiento distinto del audio generado. Un procedimiento de eliminación que recorre muestra, embedding y contenidos generados. |
| **Trampas a evitar** | Clasificar una voz como un dato personal "clásico". No registrar la prueba de consentimiento. Eliminar únicamente la muestra fuente sin el embedding ni los contenidos ya generados. |
| **Buenas prácticas** | Tratar toda voz identificable como un dato biométrico de pleno derecho. Registrar la prueba de consentimiento por separado. Extender la eliminación al embedding y a los contenidos ya generados. |
