---
order: 11
---

# Recetas: verificar, filtrar y fiabilizar

Última serie de recetas: medir la estabilidad de un modelo de decisión estructurada, usarlo como filtro de seguridad, y emplearlo para tareas de búsqueda o de llamada a funciones habitualmente confiadas a un LLM generativo.

## Self-consistency: medir la estabilidad de una respuesta

La [self-consistency](/?c=ia&s=nlp-llm&p=reduire-la-variance-des-reponses#self-consistency-votar-sobre-la-conclusion-de-varios-razonamientos) de un LLM generativo vota sobre la conclusión de varios razonamientos. Para un modelo de decisión estructurada, el equivalente consiste en repetir la misma pregunta varias veces (15 veces en las pruebas del proveedor) y medir la desviación estándar de las probabilidades obtenidas:

| Tipo de pregunta | Resultado medido |
|---|---|
| Noul, repetido 15 veces | Desviación estándar media de 0,0102 (muy estable), frente a LLM generativos que varían incluso a temperatura 0 |
| Choice, repetido 15 veces | 99,2% de acuerdo entre repeticiones con una banda de incertidumbre (probabilidad máxima < 0,60 devuelta como "incierto"), frente a 90,8% sin esa banda |

En lugar de forzar una decisión binaria en 0,5 para un Noul, una **banda de incertidumbre** absorbe los casos límite:

```python
if probabilidad < 0.30:
    decision = "no"
elif probabilidad > 0.70:
    decision = "si"
else:
    decision = "incierto"   # escalar a humano, la probabilidad sigue visible
```

## Re-ranking: reordenar una lista ya preseleccionada

Una búsqueda rápida (por palabras clave) produce primero una lista corta de candidatos; el **re-ranking** reordena luego esta lista juzgando cada candidato individualmente contra la petición, mediante una pregunta Noul repetida sobre cada par petición/candidato. Sobre 40 consultas jurídicas probadas, este paso hizo pasar la precisión del primer resultado del 5% al 18%, y la de los diez primeros del 38% al 62%.

## Búsqueda semántica línea por línea

Para localizar la respuesta a una pregunta en un documento de varios cientos de líneas, cada línea recibe un identificador (`L001`, `L002`...), y luego dos preguntas se ejecutan en una sola petición: un Choice clasifica las líneas por pertinencia, un Noul verifica en paralelo si el documento contiene siquiera una respuesta. Esta segunda pregunta distingue una mala correspondencia (el documento no responde) de una respuesta simplemente mal clasificada.

## Llamada a funciones: transformar una petición en lenguaje natural en una llamada tipada

Una petición en lenguaje natural ("traza la correlación móvil entre NVDA y SPY del último mes") se convierte en una llamada a función tipada, donde cada parámetro solo acepta un conjunto cerrado de valores:

```text
"traza la correlacion movil entre nvda y spy del ultimo mes"
   -> rolling_correlation(symbol='NVDA', benchmark='SPY', window='1mo')
      confianza : 0.91
```

La confianza reportada es la del juicio **menos cierto** de la cadena (ni una media ni un producto de probabilidades): un solo parámetro mal identificado basta para reducir la confianza global de la llamada.

## Verificación de citas: detectar una fuente fabricada

Para verificar que una cita producida por un LLM existe realmente en un documento fuente:

```text
1. Busqueda textual normalizada (espacios, comillas) de la cita en
   la fuente -> ausente = veredicto "fabricada" inmediato, sin necesidad del modelo
2. Si se encuentra, una pregunta Choice juzga la relacion entre la cita
   y la afirmacion: apoya / contradice / no aborda el tema
```

| Veredicto | Significado |
|---|---|
| Verificada | La fuente apoya la afirmación |
| Contradicha | La fuente contradice la afirmación |
| No respaldada | La fuente no aborda el tema |
| Fabricada | La cita no existe en la fuente |

## Barreras de seguridad: una capa de seguridad independiente del modelo principal

En lugar de colocar las reglas de seguridad en las instrucciones de sistema de un LLM (evitables) o hacerlas verificar por un segundo LLM (costoso, también evitable), una sola petición de decisión estructurada evalúa cada mensaje entrante y saliente, con un Noul por riesgo (evasión de instrucciones, ayuda a una actividad ilegal, angustia...) y un Score de gravedad global:

```text
aprobado    <- riesgo por debajo de todos los umbrales
revision    <- al menos un riesgo cercano al umbral, sin superarlo
bloqueado   <- un riesgo supera el umbral de bloqueo
apoyo       <- se detecta un patron de angustia
```

Los umbrales siguen definidos y modificables por la aplicación, en lugar de heredados del comportamiento por defecto de un modelo.

## Descubrimiento de features: transformar texto libre en columnas numéricas

Un modelo de machine learning clásico (ej: CatBoost) necesita una tabla de números, no texto libre. Un bucle automatizado propone preguntas sobre el texto (intensidad de un rasgo, presencia de un hecho), las convierte en columnas mediante probabilidades calibradas, entrena el modelo, y luego usa su error para proponer nuevas preguntas. Sobre 2000 reseñas probadas, el error de predicción (RMSE) pasó de 2,47 (texto bruto) a 1,77 tras cinco iteraciones de este bucle, sin que ninguna de las 38 preguntas finales se escribiera a mano.

> **Trampa común a estas siete recetas:** tratar una sola ejecución como definitivamente fiable, sin medir nunca su estabilidad (self-consistency), sin filtro de seguridad independiente (barreras de seguridad), o sin verificar que una fuente citada existe realmente (verificación de citas).
>
> **Buena práctica común:** añadir un paso de verificación dedicado (repetición y medición de desviación estándar, barrera de seguridad aguas arriba/abajo, búsqueda textual antes del juicio) en lugar de confiar en una sola respuesta bruta, en particular en todo lo que toque a la seguridad o a la exactitud factual.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Siete recetas de fiabilización: medir la estabilidad por repetición (self-consistency), reordenar una lista por juicio individual (re-ranking), localizar una respuesta línea por línea, convertir una petición en llamada a función tipada, verificar que una cita existe realmente, filtrar mensajes entrantes/salientes mediante barreras de seguridad independientes, transformar texto libre en columnas numéricas utilizables por un modelo clásico. |
| **Herramientas utilizables** | Repeticiones y desviación estándar para la self-consistency; preguntas Noul/Choice para re-ranking, búsqueda, llamada a funciones, citas, barreras de seguridad; bucle propuesta/medición para el descubrimiento de features. |
| **Trampas a evitar** | Confiar en una sola ejecución sin verificación de estabilidad ni barrera de seguridad independiente. |
| **Buenas prácticas** | Añadir sistemáticamente un paso de verificación dedicado antes de confiar en una respuesta, en particular en la seguridad y la exactitud factual. |
