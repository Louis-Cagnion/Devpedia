---
order: 1
---

# Monitorización y gestión operativa de un LLM

Supervisar un servicio clásico se reduce a supervisar un [código de estado HTTP](/?c=infrastructure&p=api-et-http): `200`, bien, `500`, se rompió. Una llamada a un LLM responde casi siempre `200`: la pregunta nunca es *"¿respondió?"* sino *"¿la respuesta es buena, y costó lo que debía costar?"*. Es esta diferencia la que hace que la monitorización de un sistema basado en LLM sea estructuralmente diferente de una monitorización aplicativa clásica.

## Qué hay que registrar

Un sistema en producción debe conservar, para cada llamada, con qué reconstruir y auditar lo que pasó:

| Dato | Por qué |
|---|---|
| Prompt completo enviado (sistema + historial + pregunta) | Reproducir un comportamiento inesperado supone saber exactamente qué recibió el modelo |
| Respuesta producida | Sin ella, ninguna evaluación posterior es posible |
| Número de tokens de entrada y salida | Es la base del coste (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) y un indicador de anomalía (un prompt que crece en tamaño sin razón a menudo señala un bug anterior) |
| Latencia | Detecta una degradación del servicio antes de que un usuario se queje |
| Identificador y versión del modelo | Ver más abajo: esta versión cambia más a menudo de lo que se piensa |

> **Trampa:** registrar el prompt y la respuesta sin precaución. Pueden contener datos personales o sensibles según lo que escribió el usuario: conservarlos tal cual reproduce exactamente el problema que la [gobernanza de datos](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) busca evitar.
>
> **Buena práctica:** cifrar estos registros en reposo y aplicarles una duración de retención limitada, como mínimo; ver la [política de retención](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) detallada en otro sitio.

## La deriva silenciosa de versión

Un proveedor de LLM hace evolucionar su modelo regularmente, a veces bajo el mismo nombre comercial (una actualización menor, un ajuste de seguridad, un cambio de comportamiento por defecto). Un sistema que llama a "el modelo X" sin fijar una versión precisa puede ver así su comportamiento cambiar de un día para otro, sin que ninguna línea de su propio código se haya movido: el bug más difícil de diagnosticar es el que no tiene ningún commit asociado.

> **Trampa:** llamar a "el modelo X" sin fijar una versión precisa, suponiendo que su comportamiento se mantendrá estable en el tiempo.
>
> **Buena práctica:** fijar una versión explícita en lugar de "la última disponible", y migrar a una nueva versión solo tras haberla probado en un conjunto de casos conocidos (ver más abajo), el mismo remedio que para cualquier dependencia externa.

## Evaluar una salida que nunca es idéntica dos veces

El no determinismo de un LLM (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) vuelve inutilizable un test clásico del tipo "la salida debe ser exactamente esta cadena". Dos enfoques se combinan en la práctica:

**Un conjunto de casos de referencia (*golden set*).** Una lista de prompts representativos de los que se conoce la respuesta esperada (o los criterios que una buena respuesta debe cumplir), vuelta a ejecutar en cada cambio: de prompt, de modelo, de versión. Es el equivalente de una suite de tests de no regresión, adaptada a una salida aproximada en lugar de exacta.

**Un segundo LLM como evaluador (*LLM-as-judge*).** El juez recibe la pregunta, la respuesta producida, y a veces una respuesta de referencia, luego puntúa la respuesta según criterios explícitos (exactitud, tono, longitud). Esto permite evaluar miles de casos sin relectura humana sistemática, reservando el ojo humano a los casos que el juez señala como dudosos.

> **Trampa:** tratar el veredicto de un LLM-as-judge como infalible. El juez hereda las mismas limitaciones que un LLM ordinario (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)), incluida la posibilidad de equivocarse con la misma seguridad que un juicio correcto.
>
> **Buena práctica:** reservar la evaluación humana a los casos que el juez señala como dudosos, y verificar periódicamente una muestra de sus veredictos juzgados "buenos", no solo los que él mismo señala como inciertos.

## La caché semántica: evitar recalcular una respuesta ya conocida

Una caché clásica asocia una respuesta a una **clave exacta**: la misma clave devuelve la misma respuesta, una clave ligeramente distinta (una reformulación) falla la caché y desencadena una nueva llamada, aunque la pregunta planteada fuera en realidad la misma. Una **caché semántica** resuelve este problema comparando las preguntas por **similitud de significado** en lugar de por igualdad de texto, con la misma técnica de búsqueda por embedding que la del [RAG](/?c=ia&s=nlp-llm&p=rag):

```text
Pregunta 1: "¿Cuál es el precio de la suscripcion Pro?"
             -> llamada LLM, respuesta guardada en cache junto con su embedding

Pregunta 2: "¿Cuanto cuesta el plan Pro?"
             -> embedding cercano a la pregunta 1 (similitud > umbral)
             -> respuesta en cache devuelta, NINGUNA llamada LLM
```

| | Caché clásica | Caché semántica |
|---|---|---|
| Correspondencia | Clave exacta (cadena idéntica) | Similitud de embedding por encima de un umbral |
| ¿Falla ante una reformulación? | Sí, sistemáticamente | No, mientras el significado se mantenga cercano |
| Coste evitado | Solo la pregunta exacta ya planteada | Cualquier pregunta semánticamente cercana a una ya planteada |

> **Trampa:** un umbral de similitud demasiado permisivo hace corresponder dos preguntas de significado realmente distinto ("cancelar mi pedido" y "cancelar mi suscripción" pueden estar cerca en el espacio de embeddings), devolviendo entonces una respuesta en caché que no responde a la pregunta real, con la misma seguridad que una respuesta correcta.
>
> **Buena práctica:** ajustar el umbral de similitud de forma conservadora (aunque suponga perder algunas reformulaciones válidas), e invalidar las entradas de la caché cuando la información subyacente cambie, el mismo problema de caducidad que cualquier caché clásica.

Una [pasarela LLM](/?c=ia&s=production-et-gouvernance&p=stack-ia) suele centralizar esta caché a escala de todas las aplicaciones que la usan, en lugar de que cada una reimplemente la suya.

## Las salvaguardas operativas

> **Trampa:** un pico de tráfico (legítimo, o un bucle de agente mal acotado, ver el capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents)) puede disparar una factura en unos minutos sin que se dispare ninguna alerta de "error", ya que cada llamada individual tiene éxito.
>
> **Buena práctica:** implementar un limitador de tasa y de coste, y un panel de coste por funcionalidad, por cliente o por usuario, no un lujo, lo que evita descubrir la factura a fin de mes.

> **Trampa:** si el modelo principal se vuelve indisponible o demasiado lento, devolver directamente un error al usuario en lugar de degradar el servicio.

> **Buena práctica:** prever un repliegue (*fallback*) hacia un modelo más simple en caso de indisponibilidad o lentitud excesiva: degradar el servicio en lugar de interrumpirlo.

El filtrado de entradas y salidas (detectar un intento de instrucción maliciosa, ver la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), y filtrar una salida antes de que llegue al usuario) completa estas salvaguardas.

## Resumen

| | |
|---|---|
| **Para recordar** | La monitorización de un LLM se centra en la calidad y el coste de la respuesta, no en un simple código de estado. Registrar prompt, respuesta, tokens, latencia y versión del modelo permite reconstruir un incidente. Un golden set y un LLM-as-judge reemplazan a un test clásico frente al no determinismo. Una caché semántica evita recalcular una respuesta para una pregunta reformulada pero equivalente. |
| **Herramientas utilizables** | Un panel de coste por funcionalidad/cliente. Un golden set vuelto a ejecutar en cada cambio. Un limitador de tasa y de coste, un repliegue hacia un modelo más simple. Una caché semántica, a menudo centralizada en una pasarela LLM. |
| **Trampas a evitar** | Registrar prompt/respuesta sin cifrado ni retención limitada. Llamar a un modelo sin versión fijada. Tratar un LLM-as-judge como infalible. Dejar que un pico de tráfico o una avería degrade la factura o el servicio sin salvaguarda. Un umbral de similitud de caché semántica demasiado permisivo. |
| **Buenas prácticas** | Cifrar los registros y limitar su retención. Fijar una versión de modelo explícita. Verificar periódicamente una muestra de los veredictos de un LLM-as-judge. Implementar limitador de coste y repliegue automático. Ajustar el umbral de similitud de la caché semántica de forma conservadora. |
