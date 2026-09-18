---
order: 1
---

# Procesamiento del lenguaje natural (NLP) y grandes modelos de lenguaje (LLM)

Una [red neuronal](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) maneja números, nunca texto directamente. El procesamiento del lenguaje natural (NLP, *Natural Language Processing*) agrupa las técnicas que convierten texto en representaciones numéricas aprovechables: el paso previo indispensable para cualquier modelo de lenguaje, hasta los grandes modelos de lenguaje (LLM) modernos.

## La tokenización: dividir el texto

Un modelo nunca procesa una frase entera de un bloque: el texto se divide primero en unidades más pequeñas, los **tokens**:

```text
"Los gatos duermen" -> ["Los", "gatos", "duermen"]        -> tokenización por palabra
"Los gatos duermen" -> ["Los", "gat", "os", "duer", "men"] -> tokenización en subpalabras (más habitual)
```

La tokenización por palabra completa plantea un problema de vocabulario: cada palabra posible (incluidas las variantes de conjugación, las palabras raras, los nombres propios...) necesitaría su propia entrada, un vocabulario potencialmente infinito. La tokenización en **subpalabras** (ej. el algoritmo [*Byte-Pair Encoding*](https://es.wikipedia.org/wiki/Codificaci%C3%B3n_por_pares_de_bytes)) divide las palabras raras en fragmentos más comunes, manteniendo un vocabulario de tamaño fijo y manejable (típicamente unas decenas de miles de entradas) y a la vez capaz de representar cualquier palabra, incluso nunca vista tal cual durante el entrenamiento.

> **Trampa:** confundir número de tokens y número de palabras. Con la tokenización en subpalabras, una sola palabra puede dividirse en varios tokens (véase el ejemplo anterior): estimar la longitud de un texto o un coste (véase [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) contando palabras en lugar de tokens reales da un resultado aproximado, a veces muy alejado.
>
> **Buena práctica:** medir siempre la longitud de un texto en tokens reales (con la herramienta de tokenización del modelo utilizado), nunca contando las palabras a ojo.

## Los embeddings: de las palabras a los vectores

Cada token se convierte a continuación en un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de números (un **embedding**), aprendido de forma que las palabras de sentido cercano tengan vectores cercanos en ese espacio:

```python
# Representación puramente ilustrativa
embedding("gato")   -> [0.2, -0.5, 0.8, ...]
embedding("gatito")  -> [0.3, -0.4, 0.7, ...]    # cercano a "gato" -> sentido similar
embedding("coche")   -> [-0.9, 0.6, -0.1, ...]   # lejos de "gato" -> sentido diferente
```

"Cercano" o "lejano" se mide exactamente como se vio en el capítulo sobre [vectores y producto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire): mediante la norma de su diferencia, o mediante su producto escalar una vez normalizados. Esta propiedad permite operaciones que se han vuelto clásicas para ilustrar el concepto: `embedding("rey") - embedding("hombre") + embedding("mujer")` produce un vector cercano a `embedding("reina")`: el sentido queda codificado, al menos parcialmente, como una dirección geométrica en ese espacio vectorial.

> **Trampa:** comparar dos embeddings producidos por **modelos diferentes**. Cada modelo construye su propio espacio vectorial durante su entrenamiento: dos modelos no tienen ninguna razón para situar la palabra "gato" en el mismo lugar de sus espacios respectivos. Una distancia entre dos embeddings solo tiene sentido entre embeddings procedentes del **mismo** modelo.
>
> **Buena práctica:** producir siempre los embeddings a comparar con un único modelo, nunca mezclando las salidas de dos modelos diferentes.

## La atención aplicada al texto

El mecanismo de atención (véase [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)) permite que cada token "observe" a los demás tokens de la secuencia para ajustar su propia representación según el contexto:

```text
"El banco a orillas del río"           vs      "El banco subió sus tipos de interés"
        ^                                              ^
   "banco" influido por "río"                  "banco" influido por "tipos de interés"
   -> sentido "orilla"                          -> sentido "entidad financiera"
```

La misma palabra ("banco") obtiene una representación numérica **diferente** según su contexto: es esta capacidad la que distingue a un modelo basado en la atención de un simple diccionario fijo "palabra → vector".

## ¿Qué es un gran modelo de lenguaje (LLM)?

Un **LLM** (*Large Language Model*) es, en su principio más simple, un modelo [Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) entrenado con cantidades inmensas de texto, con un objetivo de entrenamiento extraordinariamente simple: **predecir la palabra (o token) siguiente**, dado todo lo que la precede.

```text
"El gato duerme en el" -> el modelo predice una distribución de probabilidad sobre el token siguiente
                           ("sofá": 45%, "tapete": 20%, "cama": 15%, ...)
```

Esta salida es exactamente una [distribución de probabilidad](/?c=mathematiques&p=les-probabilites-de-base) en el sentido visto anteriormente: cada token posible del vocabulario recibe una probabilidad, y el conjunto suma 1.

Lo que hace impresionante a un LLM no es la simplicidad de este objetivo, sino la **escala**: miles de millones de parámetros, entrenados con una fracción significativa del texto disponible públicamente, con suficiente potencia de cálculo (véase [Deep learning con PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) para que esta tarea de predicción, llevada a esa escala, haga emerger capacidades que no se programaron explícitamente (responder preguntas, resumir, traducir, razonar paso a paso...), un fenómeno calificado de **capacidades emergentes**.

> **Trampa:** deducir de ello que el modelo "comprende" o "razona" en el sentido humano del término. El mecanismo sigue siendo, de principio a fin, una predicción estadística del token siguiente, un comportamiento que *se parece* a la comprensión, sin ninguna garantía de que comparta sus propiedades (véanse los límites detallados en [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)).
>
> **Buena práctica:** evaluar un LLM por lo que realmente produce (salidas verificadas, probadas) en lugar de por una intuición de lo que "debería" comprender por su tamaño o la fluidez de sus respuestas.

## Del modelo bruto a un asistente utilizable: ajuste fino frente a prompting

Un LLM recién entrenado para "predecir la palabra siguiente" no responde de forma natural como un asistente conversacional; dos enfoques (a menudo combinados) permiten orientarlo:

| Enfoque | Principio |
|---|---|
| **Ajuste fino (fine-tuning)** | Continuar el entrenamiento del modelo con datos específicos (conversaciones ejemplares, instrucciones seguidas de buenas respuestas...), reajustando de nuevo sus pesos |
| **Prompting** | No modifica **ningún** peso del modelo: simplemente se formula la entrada (el *prompt*) de forma que guíe al modelo ya entrenado hacia el comportamiento deseado (dar ejemplos en el prompt, formular la pregunta de cierta manera...) |

El prompting solo aprovecha las capacidades ya adquiridas durante el entrenamiento inicial: por eso una buena formulación de la pregunta (el **prompt engineering**, véase el capítulo dedicado justo después) puede mejorar considerablemente un resultado, sin que intervenga ningún dato de entrenamiento adicional ni ningún cálculo de gradiente.

> **Trampa:** esperar que el prompting enseñe una habilidad totalmente ausente del entrenamiento inicial del modelo: reformular una pregunta de otra manera solo aprovecha lo que el modelo ya adquirió, no le enseña nada nuevo.
>
> **Buena práctica:** reservar el ajuste fino para los casos en que el comportamiento buscado supera lo que el prompting puede aprovechar (un estilo muy específico, una habilidad ausente de los datos de entrenamiento originales): el prompting sigue siendo más rápido y menos costoso en cuanto basta con él.

Véase también [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (el mecanismo de atención subyacente), [Deep learning con PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch) (cómo se entrena concretamente un modelo de este tipo, a una escala mucho más modesta en los ejemplos de este capítulo) y [El prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) (cómo formular concretamente un buen prompt).

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El texto se divide en tokens, y luego se convierte en vectores (embeddings) cuya cercanía refleja la cercanía de sentido. Un LLM es un Transformer entrenado para predecir una distribución de probabilidad sobre el token siguiente, a muy gran escala. El prompting aprovecha las capacidades ya adquiridas; el ajuste fino añade otras nuevas reentrenando el modelo. |
| **Herramientas utilizables** | La herramienta de tokenización del modelo utilizado, para medir una longitud real en tokens en lugar de en palabras. |
| **Trampas a evitar** | Confundir número de tokens y número de palabras. Comparar embeddings procedentes de modelos diferentes. Atribuir una comprensión real a un LLM. Esperar que el prompting enseñe una habilidad ausente del entrenamiento inicial. |
| **Buenas prácticas** | Medir la longitud de un texto en tokens reales. Comparar embeddings solo si proceden del mismo modelo. Evaluar un LLM por sus salidas reales en lugar de por una intuición de lo que "debería" comprender. Reservar el ajuste fino para los casos en que el prompting no basta. |
