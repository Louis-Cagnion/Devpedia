---
order: 2
---

# El asistente de IA agéntico en terminal: más allá del prompt simple

Los capítulos anteriores cubren por separado los bloques de un asistente LLM moderno: las [herramientas y el bucle de agente](/?c=ia&s=nlp-llm&p=agents), el [RAG](/?c=ia&s=nlp-llm&p=rag), el [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering), los [límites de producción](/?c=ia&s=nlp-llm&p=llm-en-production). Este capítulo no los repite: ensambla lo que aún falta para entender cómo funciona realmente, de un turno a otro, un asistente que trabaja en una terminal (capaz de leer y modificar archivos, ejecutar comandos, buscar en la web). Claude en línea de comandos sirve aquí de ilustración concreta, pero nada es propio de un proveedor concreto: cada mecanismo descrito está documentado públicamente y se encuentra, bajo nombres a veces diferentes, en la mayoría de los asistentes agénticos actuales.

## Generación pura vs dato realmente recuperado

Sin herramientas, un LLM solo **genera texto plausible** a partir de lo que aprendió durante el entrenamiento (ver su definición en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): no tiene ningún medio de consultar nada externo. Dos peticiones que producen, en apariencia, el mismo tipo de respuesta son en realidad muy diferentes:

| Petición | Qué ocurre | Fiabilidad |
|---|---|---|
| "Dame un ejemplo de JSON que represente a un usuario" | El modelo **inventa** valores plausibles (nombre, email, id): es exactamente lo que se le pide | Fiable para el uso: ningún valor pretende ser real |
| "¿Cuál es el número de versión actual de la biblioteca X?" | Sin herramienta para verificar, el modelo produce una respuesta igual de plausible **en apariencia**, pero que puede ser falsa, una alucinación (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) | No fiable sin verificación |

La diferencia nunca se ve en la forma de la respuesta: un texto inventado y un texto exacto se escriben con la misma seguridad. Depende únicamente de si realmente se usó una herramienta para recuperar el dato, o si el modelo lo produjo de memoria.

> **Trampa:** pedir una información factual verificable sin dar al asistente (ni verificar que haya usado) una herramienta capaz de recuperarla realmente: nada en el tono de la respuesta distingue un dato recuperado de uno inventado.
>
> **Buena práctica:** para todo dato que pueda cambiar o deba ser exacto, asegurarse de que realmente se llamó a una herramienta (búsqueda web, RAG, llamada de API) en lugar de confiar en la memoria del modelo (ver las categorías de herramientas más abajo).

## El razonamiento interno extendido

Algunos modelos generan, antes de la respuesta final, una fase de **razonamiento interno extendido**: una secuencia de tokens que explora el problema, prueba caminos, se corrige, sin formar parte de la respuesta destinada al usuario (puede ocultarse, resumirse, o mostrarse aparte según la interfaz).

No hay que confundir este mecanismo con el [*chain-of-thought* del prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering): ahí, el razonamiento detallado es una **técnica de prompt**, pedida explícitamente por el usuario en su pregunta. El razonamiento interno extendido, en cambio, es una **fase de generación distinta y nativa**, que existe independientemente de cualquier instrucción del prompt al respecto:

```text
Chain-of-thought (prompteado)    Razonamiento interno extendido (nativo)
-------------------------------  -------------------------------------
Pedido explícitamente por el     Generado por defecto según el modelo,
prompt ("piensa paso a paso")    incluso antes de empezar a redactar la
                                  respuesta destinada al usuario
       |                                  |
Forma parte de la respuesta      Puede ocultarse, resumirse, o mostrarse
visible                          por separado de la respuesta final
```

Se aplica la misma advertencia que para el chain-of-thought prompteado, aún más marcada: un razonamiento mostrado o resumido no garantiza que corresponda fielmente al mecanismo interno que realmente produjo la respuesta (ver [esta trampa detallada en el prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering)).

## Categorías concretas de herramientas

El capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents) presenta el mecanismo genérico del function calling con un solo ejemplo (el tiempo). En la práctica, un asistente que trabaja sobre código o información se apoya en categorías de herramientas recurrentes, cada una con su propio compromiso.

### Editar un archivo: diff/patch vs reescritura completa

| | Diff / patch | Reescritura completa |
|---|---|---|
| Lo que recibe la herramienta | Las líneas a reemplazar, más su contexto inmediato | El contenido íntegro del nuevo archivo |
| Coste en tokens | Bajo, proporcional a lo que cambia | Alto, proporcional al tamaño total del archivo |
| Fragilidad | Falla si el contexto esperado ya no corresponde exactamente al archivo real (modificado desde la última lectura) | Insensible a este problema: el archivo entero se reemplaza tal cual se proporciona |

> **Trampa:** aplicar un patch calculado sobre una versión del archivo que ya no es la versión real en disco: según la herramienta, esto falla explícitamente, o peor, se aplica sobre las líneas equivocadas sin error visible.
>
> **Buena práctica:** releer un archivo inmediatamente antes de calcular un patch sobre él en lugar de confiar en una lectura antigua.

### Búsqueda web en directo vs RAG

El [RAG](/?c=ia&s=nlp-llm&p=rag) consulta una base **pre-indexada de antemano** y estática entre dos reindexaciones. Una herramienta de búsqueda web en directo, al contrario, envía una petición **en el mismo momento de la solicitud**, sin etapa de indexación previa:

| | RAG | Búsqueda web en directo |
|---|---|---|
| Base consultada | Un índice vectorial construido de antemano (ver [RAG](/?c=ia&s=nlp-llm&p=rag)) | La web tal cual está en el momento de la petición |
| Frescura | Tan reciente como la última reindexación | Siempre actualizada |
| Reproducibilidad | Dos búsquedas idénticas devuelven los mismos fragmentos | Dos búsquedas idénticas pueden devolver resultados diferentes |
| Curaduría de las fuentes | Elegida de antemano (se decide qué indexar) | Depende de lo que devuelva el motor de búsqueda |

> **Trampa:** tratar un resultado de búsqueda web con la misma confianza que una fuente elegida de antemano para ser indexada: una página encontrada en directo no ha pasado ninguna curaduría previa, a diferencia de una base RAG constituida deliberadamente.
>
> **Buena práctica:** citar la fuente de toda información recuperada por búsqueda web, para que un humano pueda verificar el origen en lugar de confiar solo en el asistente.

## El patrón evaluador-optimizador

La tabla de los [patrones de coordinación multi-agente](/?c=ia&s=nlp-llm&p=agents) cubre el encadenamiento secuencial, el orquestador/trabajadores y el estado compartido. Un cuarto patrón, igual de habitual para un asistente que produce contenido (código, texto, plan): el **evaluador-optimizador**.

```text
1. Generación  -> una primera versión de la respuesta/del código
2. Evaluación  -> crítica según criterios explícitos (checklist,
                  tests, formato esperado)
3. Revisión    -> una nueva versión que integra la crítica
4. Vuelta a 2, hasta un criterio de parada (calidad juzgada suficiente,
   número de turnos alcanzado)
```

> **Trampa:** un ciclo sin criterio de parada explícito hereda el mismo riesgo de bucle no acotado que un bucle de agente clásico (ver [Agentes](/?c=ia&s=nlp-llm&p=agents)), salvo que aquí el bucle gira para una sola tarea de calidad discutible, no por falta de información.
>
> **Buena práctica:** definir un criterio de parada medible desde el diseño (una puntuación mínima, un número máximo de turnos) en lugar de dejar que el ciclo gire hasta una interrupción manual.

## Caché de prompt y compactación de contexto

Dos optimizaciones complementarias, distintas de los mecanismos ya vistos.

### Reutilizar un prefijo ya calculado

Una llamada a un LLM recalcula normalmente la totalidad del prompt en cada turno, incluidos los tokens ya enviados en el turno anterior (ver la tokenización en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). Ahora bien, una gran parte de un prompt agéntico permanece idéntica de un turno a otro dentro de una misma sesión: las instrucciones de sistema, la lista de herramientas disponibles, el inicio del historial. La caché de prompt reutiliza el cálculo ya realizado sobre ese prefijo común en lugar de rehacerlo todo desde cero en cada turno: una aplicación concreta del principio [nunca recalcular un resultado que nada ha podido cambiar desde entonces](/?c=performance&p=eviter-le-recalcul-redondant).

> **Trampa:** modificar el mismísimo inicio del prompt (las instrucciones de sistema, por ejemplo) para un solo turno: eso invalida la caché construida sobre ese prefijo para todos los turnos siguientes de la sesión, anulando la ganancia por un cambio que solo concernía a un turno.
>
> **Buena práctica:** mantener estable la parte del prompt destinada a la caché (instrucciones de sistema, descripción de herramientas), y hacer variar únicamente lo que realmente cambia de un turno a otro.

### Compactar el contexto en una sesión larga

La [ventana de contexto](/?c=ia&s=nlp-llm&p=llm-en-production) permanece limitada sea cual sea el modelo. En una sesión agéntica larga, el historial completo crece en cada turno y acaba por acercarse a ese límite. La compactación resume los turnos antiguos en un condensado más corto antes de que se retiren del prompt, en lugar de truncarlos silenciosamente (la trampa ya señalada para la ventana de contexto en [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)).

> **Trampa:** compactar perdiendo una información aún necesaria para lo que sigue (un identificador, una restricción dada al inicio de la sesión): un resumen automático no garantiza preservar todo lo que aún importa.
>
> **Buena práctica:** conservar los elementos críticos (identificadores, restricciones explícitas) fuera del resumen compactable, en lugar de confiarlo todo a la compactación automática.

## Las etapas del post-entrenamiento de un asistente moderno

El capítulo [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) distingue, de forma genérica, el fine-tuning (reentrenar) del prompting (no modificar nada). Un asistente conversacional moderno pasa en realidad por varias etapas de fine-tuning distintas, cada una documentada públicamente por los principales proveedores:

```text
1. Pre-entrenamiento   -> predecir la siguiente palabra sobre un inmenso
                          corpus de texto (ver NLP y LLM); el modelo "en bruto"
2. SFT (Supervised     -> fine-tuning sobre ejemplos cuidadosamente
   Fine-Tuning)           redactados (instrucción -> buena respuesta), para
                          orientar el modelo hacia un comportamiento
                          de asistente en lugar de simple completado
3. RLHF (Reinforcement -> humanos comparan pares de respuestas
   Learning from Human    ("¿cuál es mejor?"); estas
   Feedback)              comparaciones entrenan un modelo de
                          recompensa, luego el modelo principal se
                          ajusta mediante aprendizaje por refuerzo
                          para maximizar esa recompensa
4. Constitutional AI   -> variante publicada por Anthropic: el modelo
   (variante)              critica y revisa él mismo sus respuestas a la
                          luz de un conjunto escrito de principios,
                          reduciendo la necesidad de ejemplos humanos
                          explícitamente etiquetados como "dañinos"
```

| Etapa | Para ir más allá |
|---|---|
| Pre-entrenamiento | Ver su definición en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| SFT | [InstructGPT](https://arxiv.org/abs/2203.02155), el artículo que popularizó este pipeline SFT + RLHF para asistentes conversacionales |
| RLHF | [Deep reinforcement learning from human preferences](https://arxiv.org/abs/1706.03741), el artículo fundacional del RLHF |
| Constitutional AI | [La página de investigación de Anthropic sobre Constitutional AI](https://www.anthropic.com/news/claude-s-constitution) |

> **Trampa:** confundir estas etapas con el fine-tuning genérico ya visto en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm): SFT, RLHF y Constitutional AI son cada una un método de fine-tuning entre otros posibles, no sinónimos del término genérico.
>
> **Buena práctica:** distinguir, ante el anuncio de un nuevo modelo, la naturaleza real de su post-entrenamiento (¿solo ejemplos supervisados? ¿un modelo de recompensa aprendido? ¿una fase de autocrítica?) en lugar de suponer un único "fine-tuning" indiferenciado.

Un asistente moderno como el descrito aquí se apoya en un único modelo generalista, que gestiona a la vez la conversación, la generación de código y la llamada a herramientas. Esto no siempre fue así: modelos antiguos como **Codex** (el modelo especializado en código de OpenAI, anterior a esta unificación) se entrenaban por separado para un uso concreto, un enfoque que los asistentes actuales sustituyen por un único modelo post-entrenado para cubrir todos estos casos a la vez.

## Resumen

| | |
|---|---|
| **Para recordar** | Un asistente agéntico combina generación pura (a distinguir de un dato realmente recuperado), razonamiento interno extendido nativo (≠ chain-of-thought prompteado), categorías de herramientas concretas (diff vs reescritura, búsqueda en vivo vs RAG), el patrón evaluador-optimizador, la caché de prompt, la compactación de contexto, y varias etapas de post-entrenamiento (SFT, RLHF, Constitutional AI). |
| **Herramientas utilizables** | Una herramienta de edición por diff/patch para archivos voluminosos, una herramienta de búsqueda web en directo para información fresca, una caché de prompt para prefijos estables, un mecanismo de compactación para sesiones largas. |
| **Trampas a evitar** | Confundir un dato inventado y un dato recuperado. Tomar un razonamiento mostrado por un relato fiel. Aplicar un patch sobre un archivo cambiado desde su última lectura. Confiar en una fuente web sin curaduría. Un bucle evaluador-optimizador sin criterio de parada. Invalidar la caché modificando su prefijo estable. Perder información crítica al compactar. Confundir SFT/RLHF/Constitutional AI con un fine-tuning genérico. |
| **Buenas prácticas** | Verificar que realmente se usó una herramienta para todo dato factual verificable. Releer un archivo justo antes de calcular un patch. Citar la fuente de toda información encontrada por búsqueda web. Definir un criterio de parada medible para un ciclo evaluador-optimizador. Mantener estable el prefijo destinado a la caché. Preservar los elementos críticos fuera del resumen compactable. Identificar la naturaleza real del post-entrenamiento de un modelo en lugar de suponerlo genérico. |
