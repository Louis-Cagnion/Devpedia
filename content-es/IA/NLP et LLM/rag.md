---
order: 10
---

# RAG: aumentar un LLM con datos externos

Un LLM solo conoce lo que vio durante el entrenamiento, hasta una fecha de corte (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)): ignora tus documentos internos, tu base de conocimiento, o todo lo que ocurrió después de esa fecha. El **RAG** (*Retrieval-Augmented Generation*, generación aumentada por recuperación) responde a este problema yendo a buscar, en el momento de la pregunta, los documentos relevantes e inyectándolos en el prompt antes de pedir la respuesta.

## ¿Por qué no simplemente reentrenar el modelo?

Reentrenar o afinar (*fine-tuning*) un modelo con sus propios datos es una alternativa, pero con un coste y un plazo que el RAG evita:

| | Fine-tuning | RAG |
|---|---|---|
| Actualizar un dato | Requiere un nuevo entrenamiento | Basta con modificar el documento fuente |
| Coste | Elevado (cálculo, tiempo) | Coste de una búsqueda + de un prompt más largo |
| Trazabilidad de la respuesta | Difusa (diluida en los pesos del modelo) | Explícita: los documentos usados son identificables |
| Adecuado para | Cambiar el *estilo* o el comportamiento del modelo | Darle acceso a *hechos* cambiantes o privados |

El RAG y el fine-tuning no se excluyen: un modelo puede afinarse para explotar mejor los documentos recuperados, mientras sigue alimentado por RAG para el contenido factual.

## El pipeline en cuatro etapas

```text
1. División (chunking)     : cada documento fuente se divide en fragmentos
2. Indexación               : cada fragmento se convierte en embedding (ver
                              NLP y LLM) y se almacena en una base vectorial
3. Búsqueda (retrieval)     : la pregunta formulada también se convierte en
                              embedding, luego se compara con todos los
                              fragmentos indexados
4. Generación                : los fragmentos más cercanos se pegan en el
                              prompt, y el LLM responde apoyándose en ellos
```

La comparación en la etapa 3 se hace mediante una medida de similitud entre vectores, casi siempre exactamente el [producto escalar entre vectores normalizados](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (el coseno del ángulo que los separa): dos fragmentos cuyos embeddings están cerca hablan, en principio, de temas cercanos; es exactamente la propiedad de los embeddings detallada en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm).

> **Trampa:** cambiar de modelo de embedding sin reindexar la totalidad de los documentos existentes. Los embeddings producidos por dos modelos diferentes no comparten el mismo espacio vectorial (ver la comparación de embeddings en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): mezclar embeddings antiguos y nuevos en una misma búsqueda no produce ninguna comparación válida, aunque el cálculo se ejecute sin error aparente.
>
> **Buena práctica:** reindexar la totalidad de la base documental en cuanto cambie un modelo de embedding, nunca una mezcla parcial de dos modelos diferentes.

## La división (chunking): una elección que se paga en ambos lados

El tamaño de los fragmentos nunca es neutro:

- **Demasiado pequeños**, un fragmento pierde el contexto que lo rodea (una frase aislada de su párrafo puede volverse ambigua o engañosa una vez buscada sola).
- **Demasiado grandes**, un fragmento diluye su relevancia: en un documento de varias páginas, solo una porción responde realmente a la pregunta, pero todo el fragmento se inyecta en el prompt, al precio (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) y con el riesgo de ahogar la información útil en texto irrelevante.

Un compromiso habitual mantiene un solapamiento entre fragmentos consecutivos (las últimas palabras de un fragmento repetidas al inicio del siguiente), para que una información a caballo entre dos fragmentos nunca se pierda del todo.

> **Trampa:** elegir un tamaño de fragmento por defecto, copiado de otro proyecto, sin probarlo con los propios documentos. El tamaño óptimo depende fuertemente del tipo de documento (artículos cortos, manuales largos...) y de la naturaleza de las preguntas planteadas.
>
> **Buena práctica:** probar varios tamaños de fragmento (y de solapamiento) con preguntas representativas antes de fijar uno, en lugar de elegir uno arbitrariamente de una vez por todas.

## El límite del RAG: un mal retrieval no se ve

El RAG no hace al LLM más honesto, lo rodea de mejores datos: si la etapa de búsqueda no encuentra el fragmento correcto (pregunta mal formulada, embedding que no capta el matiz correcto, información ausente de la base), el modelo responde de todos modos, con los mismos riesgos de alucinación que sin RAG (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)), sin que ninguna alerta señale que el contexto proporcionado era insuficiente o fuera de tema.

> **Trampa:** suponer que una respuesta de un sistema RAG es fiable simplemente porque parece bien documentada. Un mal retrieval (fragmento no relevante) produce una respuesta tan segura como un buen retrieval: nada en la superficie distingue ambos casos.
>
> **Buena práctica:** monitorizar la calidad del retrieval en sí (¿los fragmentos recuperados eran realmente relevantes?), no solo la calidad de la respuesta final; ver [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

## Resumen

| | |
|---|---|
| **Para recordar** | El RAG busca documentos relevantes en el momento de la pregunta y los inyecta en el prompt, en lugar de reentrenar el modelo. La búsqueda compara embeddings por similitud (producto escalar normalizado). Un mal retrieval produce una respuesta tan segura como un buen retrieval, sin distinguirse en la superficie. |
| **Herramientas utilizables** | Una base vectorial para almacenar y buscar embeddings; un modelo de embedding coherente en toda la base documental. |
| **Trampas a evitar** | Mezclar embeddings provenientes de modelos diferentes. Elegir un tamaño de fragmento sin probarlo. Confiar en una respuesta RAG sin verificar la calidad del retrieval. |
| **Buenas prácticas** | Reindexar íntegramente la base tras todo cambio de modelo de embedding. Probar varios tamaños de fragmento con casos representativos. Monitorizar la calidad del retrieval además de la respuesta final. |
