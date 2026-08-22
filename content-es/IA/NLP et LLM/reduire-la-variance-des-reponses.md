---
order: 4
---

# Reducir la varianza de las respuestas: self-consistency, voto mayoritario y ensembling

El capítulo [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production#la-temperatura-controlar-el-azar-de-generacion) muestra que la temperatura estrecha o aplana el sorteo de un LLM, pero nunca garantiza que una sola llamada produzca la respuesta correcta: una temperatura baja limita el azar, no lo suprime, y un razonamiento de varias etapas siempre puede partir por un mal camino desde el primer token. Otra familia de técnicas ataca el problema de forma diferente: en lugar de cambiar *cómo* una generación hace su sorteo, genera **varias respuestas independientes** y las combina para obtener un resultado más fiable que un solo intento.

## Voto mayoritario: preguntar varias veces, quedarse con la respuesta más frecuente

El **voto mayoritario** (*majority voting*) envía el mismo prompt *N* veces con una temperatura distinta de cero (a temperatura 0, las *N* respuestas serían casi siempre idénticas, ver la nota sobre el determinismo imperfecto en [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production#la-temperatura-controlar-el-azar-de-generacion)), y luego se queda con la respuesta que aparece más veces entre las *N*:

```python
from collections import Counter

def votar_mayoria(prompt, n=5, temperatura=0.7):
    respuestas = [
        client.chat.completions.create(
            model="...",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperatura,
        ).choices[0].message.content
        for _ in range(n)
    ]
    mas_frecuente, numero_de_votos = Counter(respuestas).most_common(1)[0]
    return mas_frecuente, numero_de_votos / n  # respuesta retenida + puntaje de confianza
```

El cociente `numero_de_votos / n` sirve como puntaje de confianza: 5 respuestas idénticas sobre 5 inspiran más confianza que 3 sobre 5, aunque el voto mayoritario retenga la respuesta ganadora en ambos casos.

| Adecuado para | No adecuado para |
|---|---|
| Respuesta discreta y verificable: clasificación, extracción de un campo, opción múltiple, cálculo delegado a una herramienta | Generación abierta: redacción, resumen, lluvia de ideas creativa |
| Rara vez existen varias formulaciones válidas de una misma respuesta | Dos redacciones diferentes no "votan" la una por la otra: no hay mayoría que extraer |

> **Trampa:** comparar respuestas de texto libre para un voto sin normalizarlas antes (ej: "París" y "paris." contadas como dos respuestas diferentes por la mayúscula o la puntuación). El voto subestima entonces artificialmente la verdadera mayoría.
>
> **Buena práctica:** normalizar cada respuesta (minúsculas, puntuación retirada, formato unificado) antes de compararlas entre sí, en particular para una respuesta que debería ser un valor exacto más que un texto libre.

## Self-consistency: votar sobre la conclusión de varios razonamientos

La **self-consistency** aplica el mismo principio de voto, pero al resultado final de varios [razonamientos chain-of-thought](/?c=ia&s=nlp-llm&p=prompt-engineering#el-razonamiento-paso-a-paso-chain-of-thought) independientes en lugar de a una respuesta producida directamente. Cada ejecución puede tomar un camino de razonamiento diferente (un cálculo intermedio planteado de otra forma, un orden de pasos distinto), pero si la mayoría de los caminos convergen hacia la misma conclusión, esa conclusión es notablemente más fiable que un razonamiento aislado, aunque sea detallado:

```text
Pregunta: "Un tren sale a las 14:12 a 80km/h, otro a las 14:27 a 100km/h
por la misma via. A que hora el segundo alcanza al primero ?"

5 razonamientos chain-of-thought independientes (temperatura > 0):

Ejecucion 1 -> camino de calculo A -> conclusion: 15:39
Ejecucion 2 -> camino de calculo B -> conclusion: 15:39
Ejecucion 3 -> camino de calculo A -> conclusion: 15:39
Ejecucion 4 -> camino de calculo C -> conclusion: 15:42   (error de redondeo)
Ejecucion 5 -> camino de calculo A -> conclusion: 15:39

Voto sobre la CONCLUSION (no sobre el camino): 15:39 retenida (4 votos de 5)
```

La técnica viene de un artículo de investigación dedicado: [*Self-Consistency Improves Chain of Thought Reasoning in Language Models*](https://arxiv.org/abs/2203.11171) (Wang et al., 2022), que muestra ganancias de fiabilidad medibles en tareas de cálculo y razonamiento lógico respecto a un chain-of-thought ejecutado una sola vez.

> **Trampa:** aplicar la self-consistency a una tarea que no se beneficia ya del chain-of-thought (una extracción directa, una clasificación simple): el sobrecosto (varios razonamientos completos que generar, no solo varias respuestas cortas) no aporta entonces nada que un simple voto mayoritario no hubiera dado ya por mucho menos.
>
> **Buena práctica:** reservar la self-consistency para las tareas que ya se benefician del chain-of-thought (cálculo de varias etapas, lógica, descomposición de un problema), y el voto mayoritario simple para todo lo demás.

## Ensembling: combinar modelos o configuraciones diferentes

En lugar de volver a muestrear el mismo modelo con el mismo prompt, el **ensembling** combina las respuestas de varios modelos diferentes (por ejemplo dos proveedores distintos) o de varias variantes de un mismo prompt (reformulación, ejemplos few-shot diferentes), y luego agrega todo por voto o mediante un modelo "juez" encargado de comparar las respuestas y elegir la mejor o sintetizar una nueva.

| Técnica | Qué varía entre los *N* intentos | Qué permanece idéntico |
|---|---|---|
| Voto mayoritario | El sorteo aleatorio (temperatura) | El modelo, el prompt |
| Self-consistency | El sorteo aleatorio, el camino de razonamiento | El modelo, el prompt |
| Ensembling | El modelo y/o el prompt en sí | Nada es necesariamente fijo |

El ensembling ayuda más cuando los errores de los distintos intentos son realmente independientes: modelos de proveedores diferentes, entrenados con datos y decisiones de arquitectura distintas, no tienen los mismos puntos ciegos, así que sus errores respectivos tienen menos probabilidad de coincidir. Es el mismo principio que un conjunto de modelos clásicos en machine learning (varios predictores independientes que votan), trasladado a los LLM.

> **Trampa:** hacer ensembling con varias instancias de un mismo modelo subyacente (solo prompts ligeramente reformulados, por ejemplo), esperando la misma ganancia que con modelos realmente diferentes. Si los intentos comparten el mismo sesgo de fondo, sus errores también coinciden, y el ensembling pierde gran parte de su interés.
>
> **Buena práctica:** privilegiar fuentes de error realmente independientes (proveedores o arquitecturas diferentes) en lugar de variaciones superficiales de un mismo modelo, cuando el riesgo justifica el costo del ensembling.

## El compromiso entre costo, latencia y fiabilidad

Estas tres técnicas comparten el mismo compromiso: la fiabilidad ganada se paga con llamadas multiplicadas por *N*, nunca gratis (ver también [el costo como restricción de diseño](/?c=ia&s=nlp-llm&p=llm-en-production) para una única llamada).

| | Costo (número de llamadas) | Latencia si es secuencial | Ganancia de fiabilidad |
|---|---|---|---|
| Un solo intento | 1× | Referencia | Ninguna |
| Voto mayoritario | *N*× | *N*× | Moderada, sobre respuesta discreta |
| Self-consistency | *N*× (razonamientos completos) | *N*× | Alta, sobre tarea de razonamiento |
| Ensembling | *N*× (a menudo más caro: modelos diferentes) | *N*× | Alta, si los errores son independientes |

Las *N* llamadas pueden ejecutarse en paralelo (peticiones API simultáneas) para limitar el impacto en la latencia percibida por el usuario, pero el costo de cálculo, en cambio, sigue multiplicado por *N* aunque el tiempo de espera no lo esté.

> **Trampa:** multiplicar las muestras por reflejo en una tarea donde la latencia es crítica (un chatbot conversacional en tiempo real) sin haber medido la ganancia real de fiabilidad aportada. El sobrecosto es sistemático, el beneficio no siempre lo es.
>
> **Buena práctica:** reservar estas técnicas para las decisiones cuyo error cuesta realmente más caro que *N* llamadas adicionales (cálculo crítico, clasificación de alto riesgo, etapa clave de un [agente](/?c=ia&s=nlp-llm&p=agents)), no como reflejo sistemático en cada petición.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Bajar la temperatura reduce el azar de una sola llamada pero no lo suprime. El voto mayoritario, la self-consistency (voto sobre la conclusión de varios chain-of-thought) y el ensembling (modelos o prompts diferentes) generan varias respuestas independientes y las combinan para obtener un resultado más fiable que un solo intento. |
| **Herramientas utilizables** | Varias llamadas API en paralelo con temperatura distinta de cero, un contador de ocurrencias para el voto, un modelo "juez" para agregar respuestas de ensembling. |
| **Trampas a evitar** | Comparar respuestas de texto no normalizadas para un voto. Aplicar la self-consistency a una tarea que no necesita chain-of-thought. Hacer ensembling con variantes demasiado próximas de un mismo modelo. Multiplicar las muestras sin medir la ganancia real de fiabilidad. |
| **Buenas prácticas** | Normalizar las respuestas antes de votar. Reservar la self-consistency para las tareas de razonamiento de varias etapas. Privilegiar modelos realmente independientes para el ensembling. Reservar estas técnicas para las decisiones donde el riesgo justifica el costo multiplicado por *N*. |
