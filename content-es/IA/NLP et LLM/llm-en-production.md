---
order: 3
---

# LLM en producción: casos de uso y límites

Usar un LLM desde una interfaz de chat e integrarlo en un producto son dos ejercicios diferentes. En el primer caso, una respuesta poco convincente se corrige reformulando la pregunta. En el segundo, la misma respuesta parte sin supervisión hacia un usuario o un sistema aguas abajo: lo que cambia por completo lo que hay que verificar antes de elegir esta tecnología para una tarea dada.

## Cuándo un LLM es la herramienta adecuada

Un LLM sobresale en las tareas cuya entrada y salida son **lenguaje**: entender un texto libre, reformularlo, extraer una información de él, traducirlo, clasificarlo, generar uno nuevo a partir de instrucciones. Es precisamente el objetivo para el que fue entrenado (ver [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

| Caso de uso | ¿Adecuado? | Por qué |
|---|---|---|
| Extraer una información de un texto no estructurado (ej: un email) | Sí | Es comprensión de lenguaje natural |
| Resumir un documento largo | Sí | Misma razón, con un compromiso longitud/fidelidad |
| Clasificar un ticket de soporte por categoría | Sí, a menudo excesivo | Un modelo clásico (regresión logística sobre embeddings) lo hace igual de bien, más barato, más rápido |
| Calcular un IVA o una fecha de vencimiento | No | Un LLM predice el token más plausible, no el resultado exacto de un cálculo (ver más abajo) |
| Decidir solo una acción irreversible (enviar una transferencia) | No, no sin salvaguarda humana | Respuesta no determinista, nunca garantizada al 100% |

> **Nota:** para el cálculo exacto, la arquitectura correcta no es prompt-ear mejor al LLM, es darle una herramienta (una función [Python](/?c=langages-de-programmation&s=python&p=python), una consulta [SQL](/?c=domain-specific-languages-dsl&p=sql)) que llame y cuyo resultado transmita (ver el capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents)). El LLM sigue siendo excelente para entender *que hay que* calcular un IVA y *con qué números*, pero nunca debe ser la calculadora en sí.

## Los límites estructurales a conocer antes de diseñar

Estos límites no son bugs que una mejor versión del modelo corregirá algún día: derivan directamente de lo que es un LLM (ver su principio de entrenamiento en el capítulo [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

**Las alucinaciones.** Un LLM no "sabe" nada en el sentido en que lo sabría una base de datos: genera el texto estadísticamente más plausible dado lo que precede. Nada en su entrenamiento lo empuja a decir *"no lo sé"* en lugar de inventar una respuesta plausible: una cita, una referencia legal, una función de una biblioteca que no existe. Es el límite más peligroso en producción, porque una alucinación se redacta con la misma seguridad que una respuesta correcta.

> **Trampa:** confiar en una respuesta generada con seguridad sin verificarla, en particular sobre un hecho verificable (una cita, un número de ley, una función de biblioteca). El tono seguro de una respuesta nunca es un indicador fiable de su exactitud.
>
> **Buena práctica:** verificar sistemáticamente, mediante una fuente independiente o una herramienta (ver [Agentes](/?c=ia&s=nlp-llm&p=agents)), toda afirmación factual verificable producida por un LLM antes de considerarla fiable, sobre todo si el error tiene un coste real.

**La ventana de contexto.** Un LLM no lee un texto indefinidamente largo: está limitado a un número máximo de tokens (el prompt y su propia respuesta incluidos). Más allá, o bien la petición falla, o bien el inicio del contexto se trunca silenciosamente según la implementación. Un documento de 500 páginas no puede pegarse tal cual en un prompt: es uno de los problemas que resuelve el [RAG](/?c=ia&s=nlp-llm&p=rag).

> **Trampa:** superar la ventana de contexto sin darse cuenta: según la implementación, el inicio del prompt puede truncarse silenciosamente, sin aviso explícito. El modelo responde entonces basándose en un contexto parcial, sin que nada lo señale.
>
> **Buena práctica:** medir el tamaño real del prompt en tokens (ver [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) antes del envío, y gestionar explícitamente un exceso (resumen, RAG) en lugar de dejar que la implementación trunque silenciosamente.

**El no determinismo.** El mismo prompt, enviado dos veces, puede producir dos respuestas diferentes: en cada token, el modelo no elige automáticamente el más probable, **sortea** entre los tokens plausibles según la distribución de probabilidad que acaba de calcular (ver [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), un sorteo regulado por un parámetro llamado la **temperatura**, detallado justo debajo. Consecuencia directa: un test automatizado que compara una salida de LLM con una cadena de caracteres exacta es frágil por construcción (ver el capítulo [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) para evaluar una salida de otra manera).

## La temperatura: controlar el azar de generación

La temperatura no cambia las probabilidades calculadas por el modelo para el siguiente token: cambia la forma en que ese sorteo las usa después, estrechando o aplanando la brecha entre el token más probable y los demás:

```text
Distribucion bruta calculada por el modelo para "El gato duerme sobre el ___":
  "sofa" : 45%   "tapete" : 20%   "cama" : 15%   "tejado" : 5%   ...

Temperatura baja (ej. 0.2) -> estrecha la brecha, "sofa" se vuelve casi sistematico
  "sofa" : ~90%   "tapete" : ~7%   "cama" : ~2%   "tejado" : ~0.1%   ...

Temperatura alta (ej. 1.5) -> aplana la brecha, las alternativas vuelven a ser competitivas
  "sofa" : ~30%   "tapete" : ~25%   "cama" : ~20%   "tejado" : ~12%   ...
```

```python
respuesta = client.chat.completions.create(
    model="...",
    messages=[...],
    temperature=0.2,  # estrecha el sorteo: respuestas estables, poca variacion de una llamada a otra
)
```

| Temperatura | Efecto sobre el sorteo | Caso de uso típico |
|---|---|---|
| 0 | (casi) siempre el token más probable | Extracción de información, clasificación, tarea factual |
| 0,2 – 0,5 | Respuestas estables, poca variación de una llamada a otra | Soporte al cliente, documentación, generación de código |
| 0,7 – 1,0 (valor por defecto de la mayoría de las API) | Buen compromiso entre coherencia y variedad | Redacción general, conversación |
| 1,2 y más | Mucha variedad, al precio de la coherencia | Brainstorming, generación creativa |

> **Nota:** una temperatura de 0 reduce el azar a su mínimo, pero no garantiza un determinismo perfecto en todos los casos. En una infraestructura que trata numerosas peticiones en paralelo (el caso de la mayoría de los proveedores en producción), el orden en que se ejecutan los cálculos en coma flotante puede variar ligeramente de una llamada a otra, produciendo ocasionalmente un resultado diferente a pesar de una temperatura nula.

> **Trampa:** usar una temperatura elevada por defecto porque "hace las respuestas más interesantes", incluso en una tarea factual (extracción, clasificación, cálculo delegado a una herramienta, ver más arriba): es uno de los casos donde el azar añadido no aporta nada y solo aumenta el riesgo de una respuesta incoherente o alucinada.
>
> **Buena práctica:** elegir la temperatura según la tarea en lugar de copiar un valor por defecto en todas partes: baja para todo lo que deba seguir siendo fiable y reproducible, más alta solo cuando la variedad de la salida es en sí misma buscada (ver también *"La temperatura según el uso"* en [Construir un chatbot](/?c=ia&s=applications-llm&p=chatbot)).

**El conocimiento fijado a una fecha.** Un LLM solo conoce lo que existía en sus datos de entrenamiento, hasta una fecha de corte (*cutoff*). Ignora todo evento posterior, y no puede adivinarlo: como mucho puede señalarlo si fue entrenado para hacerlo, o alucinar una respuesta si no. El RAG y los agentes (búsqueda web en tiempo real) son las dos formas de sortear este límite.

> **Trampa:** hacer una pregunta sobre un evento reciente sin verificar la fecha de corte del modelo usado: una respuesta segura sobre un tema posterior a esa fecha es casi siempre una alucinación en lugar de un conocimiento real.
>
> **Buena práctica:** verificar la fecha de corte del modelo antes de hacerle una pregunta sensible a la actualidad, y recurrir al RAG o a un agente capaz de buscar información actualizada si es necesario.

**Ninguna acción sobre el mundo real.** Un LLM solo produce texto. Enviar un email, escribir en una base de datos, llamar a una API: nada de esto es posible sin un sistema alrededor de él que interprete su salida y actúe en su lugar: es el papel de los agentes.

## El coste, una restricción de diseño de pleno derecho

A diferencia de un servicio clásico donde el coste marginal de una petición es cercano a cero, cada llamada a un LLM tiene un **coste real y variable**, proporcional al número de tokens leídos (el prompt, a menudo facturado más barato) y generados (la respuesta, más cara porque se calcula token por token, ver el mecanismo de atención). Un prompt que arrastra un largo historial de conversación o un documento entero multiplica este coste en cada turno.

La latencia sigue la misma lógica: un modelo más grande suele responder más lentamente, y una respuesta larga tarda más que una corta: un modelo no puede "pensar en silencio" y luego mostrar el resultado de golpe, produce su respuesta token tras token.

El compromiso que resulta de esto es sistemático en el diseño de un sistema en producción:

| | Modelo más pequeño/rápido | Modelo más grande |
|---|---|---|
| Coste por petición | Más bajo | Más alto |
| Latencia | Más baja | Más alta |
| Capacidad de razonamiento | Limitada en tareas complejas | Mejor |
| Caso de uso típico | Clasificación, extracción simple, primer filtro | Razonamiento multi-etapa, redacción fina |

Una arquitectura habitual hace convivir a ambos: un modelo pequeño filtra o enruta la mayoría de las peticiones simples, y solo las que realmente lo exigen se envían al modelo más costoso.

> **Trampa:** ignorar el coste hasta la factura de fin de mes. A diferencia de un servicio clásico donde el coste marginal de una petición es despreciable, cada llamada a un LLM tiene un coste medible y acumulativo, invisible mientras no se implemente ningún seguimiento.
>
> **Buena práctica:** implementar un seguimiento de coste por funcionalidad o por usuario desde el diseño (ver [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), en lugar de descubrirlo a posteriori.

## Resumen

| | |
|---|---|
| **Para recordar** | Un LLM sobresale en tareas de lenguaje, no en el cálculo exacto ni en la acción autónoma sobre el mundo real. Sus límites estructurales (alucinaciones, ventana de contexto acotada, no determinismo, conocimiento fijado a una fecha) derivan de su propio principio, no de bugs que una mejor versión corregirá. Cada llamada tiene un coste y una latencia reales. |
| **Herramientas utilizables** | El parámetro temperatura para controlar el azar de generación. Una herramienta de tokenización para medir el tamaño real de un prompt. Un modelo más pequeño como primer filtro para reducir el coste medio. |
| **Trampas a evitar** | Confiar en una respuesta segura sin verificarla. Superar silenciosamente la ventana de contexto. Interrogar al modelo sobre un evento posterior a su fecha de corte. Ignorar el coste hasta la factura. |
| **Buenas prácticas** | Verificar toda afirmación factual verificable producida por el modelo. Medir el tamaño del prompt en tokens reales. Verificar la fecha de corte antes de una pregunta sensible a la actualidad. Implementar un seguimiento de coste desde el diseño. |
