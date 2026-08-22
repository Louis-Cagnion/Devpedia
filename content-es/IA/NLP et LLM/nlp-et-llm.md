---
order: 1
---

# Procesamiento del lenguaje natural (NLP) y grandes modelos de lenguaje (LLM)

Una red neuronal (véase el capítulo dedicado a este tema) maneja números, nunca texto directamente. El procesamiento del lenguaje natural (NLP, *Natural Language Processing*) agrupa las técnicas que convierten el texto en representaciones numéricas aprovechables: el paso previo indispensable para cualquier modelo de lenguaje, incluidos los grandes modelos de lenguaje (LLM) modernos.

## La tokenización: dividir el texto

Un modelo nunca procesa una frase completa de un bloque: primero, el texto se divide en unidades más pequeñas, los **tokens**:

```
"Les chats dorment" -> ["Les", "chats", "dorment"]          -> tokenisation par mot
"Les chats dorment" -> ["Les", "chat", "s", "dor", "ment"]   -> tokenisation en sous-mots (plus courant)
```

> **Nota:** la tokenización por palabras completas plantea un problema de vocabulario: cada palabra posible (incluidas las variantes de conjugación, las palabras poco frecuentes, los nombres propios...) requeriría su propia entrada, lo que daría lugar a un vocabulario potencialmente infinito. La tokenización en **subpalabras** (p. ej., el algoritmo *Byte-Pair Encoding*) divide las palabras poco frecuentes en fragmentos más comunes, lo que permite mantener un vocabulario de tamaño fijo y manejable (normalmente unas decenas de miles de entradas) y, al mismo tiempo, representar cualquier palabra, incluso aquellas que nunca se hayan visto tal cual durante el entrenamiento.

## Las representaciones: de las palabras a los vectores

A continuación, cada token se convierte en un vector de números (una **representación**), entrenado de tal forma que las palabras con significados similares tengan vectores similares en este espacio:

```python
# Imagen meramente ilustrativa
embedding("chat")   -> [0.2, -0.5, 0.8, ...]
embedding("chaton")  -> [0.3, -0.4, 0.7, ...]   # similar a «chat» -> significado similar
embedding("voiture")  -> [-0.9, 0.6, -0.1, ...]  # no tiene nada que ver con «chat» -> significado diferente
```

Esta propiedad permite realizar operaciones que se han convertido en clásicas para ilustrar el concepto: `embedding("roi") - embedding("homme") + embedding("femme")` produce un vector cercano a `embedding("reine")`: el sentido queda codificado, al menos parcialmente, como una dirección geométrica en este espacio vectorial.

## La atención prestada al texto

El mecanismo de atención (véase el capítulo sobre las arquitecturas Transformer) permite que cada token «observe» los demás tokens de la secuencia para ajustar su propia representación en función del contexto:

```
"La banque au bord de la rivière"      vs      "La banque a augmenté ses taux"
        ^                                              ^
   "banque" influencée par "rivière"          "banque" influencée par "taux"
   -> sens "berge"                            -> sens "établissement financier"
```

La misma palabra («banco») obtiene una representación numérica **diferente** según el contexto; es esta capacidad la que distingue a un modelo basado en la atención de un simple diccionario fijo «palabra → vector».

## ¿Qué es un modelo de lenguaje grande (LLM)?

Un **LLM** (*Large Language Model*) es, en su forma más sencilla, un modelo Transformer (véase el capítulo dedicado a este tema) entrenado con enormes cantidades de texto, con un objetivo de entrenamiento muy sencillo: **predecir la siguiente palabra (o token)**, a partir de todo lo que la precede.

```
"Le chat dort sur le" -> le modèle prédit une distribution de probabilité sur le token suivant
                          ("canapé" : 45%, "tapis" : 20%, "lit" : 15%, ...)
```

Lo que hace que un LLM sea impresionante no es la simplicidad de este objetivo, sino su escala: miles de millones de parámetros, entrenados con una parte significativa del texto disponible públicamente, con suficiente potencia de cálculo (véase el capítulo sobre PyTorch/GPU) para que esta tarea de predicción, llevada a tal escala, dé lugar a capacidades que no se han programado explícitamente (responder a preguntas, resumir, traducir, razonar paso a paso...): un fenómeno denominado **«capacidades emergentes»**.

## Del modelo en bruto a un asistente utilizable: ajuste fino frente a prompting

Un LLM recién entrenado para «predecir la siguiente palabra» no responde de forma natural como un asistente conversacional; existen dos enfoques (que a menudo se combinan) que permiten orientarlo:

| Enfoque | Principio |
|---|---|
| **Ajuste fino** | Continuar el entrenamiento del modelo con datos específicos (conversaciones ejemplares, instrucciones seguidas de respuestas correctas...), reajustando de nuevo sus pesos |
| **Prompting** | No modifica **ningún** peso del modelo; simplemente se formula la entrada (el *prompt*) de manera que se guíe al modelo ya entrenado hacia el comportamiento deseado (dar ejemplos en el prompt, formular la pregunta de una determinada manera...) |

> **Nota:** el prompting solo aprovecha las capacidades ya adquiridas durante el entrenamiento inicial; por eso, una buena formulación de la pregunta («prompt engineering») puede mejorar considerablemente el resultado, sin que intervengan datos de entrenamiento adicionales ni cálculos de gradiente.

Véanse también los capítulos sobre las arquitecturas Transformer (el mecanismo de atención subyacente) y sobre PyTorch (cómo se entrena concretamente un modelo de este tipo, a una escala mucho más modesta en los ejemplos de este capítulo).
