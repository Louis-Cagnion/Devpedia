---
order: 12
---

# Gobernanza de datos para un sistema de IA

Enviar un dato a un LLM no es neutro: a diferencia de una base de datos interna, el dato a menudo transita hacia un servicio de terceros alojado en el [cloud](/?c=infrastructure&p=le-cloud), puede aparecer en registros que no se había previsto constituir (ver [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), y puede ser conservado por el proveedor según condiciones contractuales que hay que conocer antes de enviar nada. La gobernanza de datos aplicada a un sistema de IA retoma los principios clásicos ([RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees), el reglamento europeo que regula la recogida y el tratamiento de datos personales, control de acceso, trazabilidad) adaptándolos a este trayecto adicional, unas obligaciones que se acumulan con las propias del sistema de IA en sí, de la [regulación europea de la IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia).

## Clasificar un dato antes de enviarlo a un modelo

Todo dato que entra en un prompt (pregunta del usuario, documento inyectado por un [RAG](/?c=ia&s=nlp-llm&p=rag), resultado de una herramienta llamada por un [agente](/?c=ia&s=nlp-llm&p=agents)) merece clasificarse antes del envío, no después:

| Categoría | Ejemplo | Tratamiento |
|---|---|---|
| Pública | Documentación ya publicada | Ninguna precaución particular |
| Interna | Procedimiento de empresa no confidencial | Verificar las condiciones contractuales del proveedor antes del envío |
| Personal | Nombre, email, número de teléfono de un cliente | Anonimizar o seudonimizar antes del envío si el caso de uso lo permite, si no se requiere un proveedor conforme (alojamiento, contrato) |
| Secreta | Clave de API, contraseña, secreto comercial | Nunca debe transitar por un prompt, sea cual sea el proveedor |

> **Trampa:** clasificar solo lo que el prompt inicial contiene explícitamente. Un agente que llama a herramientas (ver [Agentes](/?c=ia&s=nlp-llm&p=agents)) puede hacer subir al prompt datos que nadie decidió explícitamente poner ahí: el resultado de una consulta SQL devuelta a un modelo, por ejemplo, arrastra todas las columnas de esa consulta, no solo la útil para la respuesta.
>
> **Buena práctica:** hacer que la clasificación recaiga sobre lo que *puede* transitar por una herramienta o una búsqueda, no solo sobre lo que el prompt inicial contiene explícitamente.

## Trazabilidad: reconstruir quién pidió qué

Un sistema de IA en producción debe poder responder después a *"¿quién hizo esta pregunta, con qué datos, y qué respuesta se produjo?"*, la misma exigencia que un sistema de auditoría clásico, pero con dos registros más respecto a un CRUD ordinario: el prompt efectivamente enviado (no solo la pregunta bruta del usuario, sino todo lo que se ensambló alrededor), y la versión exacta del modelo que respondió (ver la deriva de versión en [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)).

> **Nota:** CRUD (*Create, Read, Update, Delete*) designa las cuatro operaciones básicas sobre un dato almacenado: crearlo, leerlo, modificarlo, eliminarlo (los comandos SQL `INSERT`/`SELECT`/`UPDATE`/`DELETE`, ver [SQL](/?c=domain-specific-languages-dsl&p=sql), o los métodos HTTP `POST`/`GET`/`PUT`/`DELETE` de una API REST). Una auditoría "CRUD ordinaria" registra por tanto, para cada una de estas cuatro acciones: quién la disparó, sobre qué fila, en qué momento. Un sistema de IA añade dos más (el prompt ensamblado, la versión del modelo) porque una respuesta depende de mucho más que el solo dato modificado: depende también de todo el contexto proporcionado al modelo y del modelo en sí, dos elementos que no existen en un CRUD clásico.

## Control de acceso: el RAG hereda los permisos, o los elude

Con un [RAG](/?c=ia&s=nlp-llm&p=rag) mal diseñado, la base vectorial indexa documentos de varios niveles de confidencialidad, pero la búsqueda no filtra según los permisos de la persona que hace la pregunta.

> **Trampa:** filtrar por permiso solo **después** de la búsqueda (releer la respuesta a posteriori). Un usuario que nunca habría tenido acceso a un documento directamente puede entonces verse citado su contenido, reformulado por el modelo, porque la búsqueda lo juzgó relevante sin verificar quién tiene derecho a verlo: una vez la información en la respuesta, el daño está hecho.
>
> **Buena práctica:** filtrar por permiso **antes** de la búsqueda (buscar solo en los documentos que el usuario está autorizado a ver), nunca solo después.

## Retención y derecho al olvido

Los registros necesarios para la trazabilidad y la evaluación (ver [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) entran en tensión directa con el derecho al olvido: un prompt que contiene un dato personal, conservado indefinidamente para analizar la calidad del modelo, es una conservación de dato personal como cualquier otra. Una política de retención explícita debe cubrir estos registros al mismo título que una base de datos de negocio: olvidarlos porque son técnicos en lugar de funcionales es una de las formas más comunes de volverse no conforme sin darse cuenta.

| Elemento de la política | Pregunta a la que responde | Ejemplo concreto |
|---|---|---|
| Duración máxima de conservación | ¿Al cabo de cuánto tiempo debe desaparecer o anonimizarse un dato? | Registros de prompts conservados 90 días en claro, luego anonimizados (nombre/email reemplazados por un identificador genérico) |
| Anonimización tras un plazo | ¿Se puede conservar el dato útil para el análisis sin conservar la identidad de la persona? | Tras 90 días, el prompt sigue siendo explotable para medir la calidad de las respuestas, pero ya no permite remontar a un cliente concreto |
| Procedimiento de eliminación bajo petición | ¿Qué pasa si una persona ejerce su derecho al olvido antes del plazo normal? | Una solicitud RGPD dispara la eliminación del prompt, de la respuesta, y de todo rastro en los registros asociados a esa persona |
| Excepciones documentadas | ¿Deben ciertos datos sobrevivir más tiempo por una razón legal (contabilidad, litigio en curso)? | Una conversación citada en un procedimiento judicial en curso se conserva más allá de la duración normal, pero aislada y justificada |

Lo que complica la cuestión respecto a una base de datos de negocio clásica: un dato personal enviado a un LLM puede haberse copiado en varios sitios sin que un solo `DELETE` baste para borrarlo por todas partes.

| Sitio donde el dato pudo haberse copiado | ¿Eliminación disparada por un `DELETE` clásico? |
|---|---|
| Fila en la base de la aplicación | Sí |
| Registro de prompts (ver la trazabilidad más arriba) | Solo si el registro está explícitamente incluido en el procedimiento de eliminación |
| Índice vectorial de un [RAG](/?c=ia&s=nlp-llm&p=rag), si el documento contenía el dato | No: el embedding generado a partir del documento debe encontrarse y eliminarse por separado |
| Registros conservados por el proveedor del modelo (fuera de la infraestructura de la empresa) | Depende únicamente de las condiciones contractuales del proveedor, no de lo que haga la empresa internamente |

> **Trampa:** tratar el derecho al olvido como un simple `DELETE FROM usuarios WHERE id = ...` y considerar el asunto cerrado. Un documento que contiene un dato personal, una vez indexado en un RAG, sigue existiendo en forma de embedding incluso tras la eliminación del documento fuente, y un proveedor de modelo externo puede conservar el prompt según sus propias condiciones contractuales, independientemente de lo que se elimine del lado de la empresa.
>
> **Buena práctica:** hacer de la eliminación un proceso que recorra explícitamente cada sitio donde el dato pudo copiarse (base, registros, índice vectorial), en lugar de una sola consulta sobre la tabla de origen, y verificar, antes de elegir un proveedor, qué prevé su contrato en materia de conservación y eliminación bajo petición.

## Resumen

| | |
|---|---|
| **Para recordar** | Todo dato que entra en un prompt debe clasificarse (público/interno/personal/secreto) antes del envío. Un sistema de IA registra dos elementos más que un CRUD ordinario (el prompt ensamblado, la versión del modelo). Un RAG debe filtrar por permiso antes de la búsqueda, nunca después. El derecho al olvido debe cubrir todos los sitios donde un dato pudo copiarse, no solo la base de origen. |
| **Herramientas utilizables** | Una política de retención explícita (duración, anonimización, procedimiento de eliminación). Un filtrado por permiso previo a la búsqueda RAG. |
| **Trampas a evitar** | Clasificar solo el contenido explícito del prompt inicial, sin contar lo que una herramienta puede hacer subir. Filtrar los permisos de un RAG después de la búsqueda en lugar de antes. Tratar el derecho al olvido como un simple `DELETE` sobre la tabla de origen. |
| **Buenas prácticas** | Clasificar todo dato que *pueda* transitar, no solo lo que el prompt contiene explícitamente. Filtrar por permiso antes de la búsqueda RAG. Hacer de la eliminación un proceso que recorra todos los sitios donde el dato pudo copiarse. |
