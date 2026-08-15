---
order: 3
---

# Modelos modernos de síntesis: los códecs neuronales

[Tacotron + vocoder](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) trata el texto y el audio como dos mundos separados, unidos por un espectrograma intermedio. Una familia de modelos más reciente, ilustrada por [**VALL-E**](https://arxiv.org/abs/2301.02111), unifica ambos tratando la síntesis de voz como un problema de lenguaje, exactamente como un LLM trata el texto.

## La idea clave: el audio se convierte en una secuencia de tokens

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) predice el siguiente token de texto, a partir de los que lo preceden. VALL-E aplica el mismo principio, pero sobre **tokens de audio** en lugar de tokens de texto:

```text
LLM de texto:
"El gato duerme en el" -> predice el siguiente token de texto ("sofa")

VALL-E (LLM aplicado al audio):
Texto a leer + unos segundos de voz de referencia
      -> predice una secuencia de tokens de audio, uno por uno
      -> esos tokens de audio se decodifican luego en una señal sonora
```

Estos tokens de audio provienen de un **códec neuronal** (*neural codec*): un modelo entrenado por separado para comprimir una señal de audio en una corta secuencia de números discretos (los tokens), y luego reconstruirla a partir de esos mismos tokens, un poco como un archivo de audio comprimido (MP3) representa un sonido mediante una secuencia de números más corta que la onda original, pero aprendida en lugar de diseñada a mano.

> **Trampa:** confundir este enfoque con Tacotron bajo el pretexto de que ambos "generan audio a partir de texto". Tacotron produce un espectrograma continuo (una imagen); en el caso de VALL-E, token por token, es una secuencia discreta de símbolos, predicha exactamente como un LLM predice texto: el objetivo de entrenamiento y la naturaleza de la salida intermedia difieren completamente.
>
> **Buena práctica:** identificar si un modelo produce una representación continua (espectrograma) o una secuencia de tokens discretos antes de compararlo con otro: esta elección estructural explica buena parte de sus fortalezas y límites (ver la clonación de voz más abajo).

## Lo que esta arquitectura permite: la clonación "zero-shot"

Como el modelo recibe "unos segundos de voz de referencia" como parte de su entrada (como un [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) que guía a un LLM), puede imitar una voz que nunca vio en el entrenamiento, a partir de una muestra muy corta, sin ningún reentrenamiento:

| | Voz "fija" (una voz preentrenada) | Clonación zero-shot (VALL-E y equivalentes) |
|---|---|---|
| Nueva voz disponible | No, solo las voces ya entrenadas | Sí, a partir de unos segundos de audio de referencia |
| Reentrenamiento necesario | No (ya entrenado) | No (el modelo generaliza a partir del ejemplo dado en la entrada) |
| Control del resultado | Predecible, la voz fue validada en el entrenamiento | Variable, la fidelidad depende de la calidad y duración de la muestra de referencia |

Este mecanismo se desarrolla con más detalle, con sus implicaciones éticas y legales, en [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix).

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | VALL-E y los modelos similares tratan la síntesis de voz como un problema de lenguaje: un códec neuronal convierte el audio en tokens discretos, que un modelo predice uno por uno como un LLM predice texto. Esta arquitectura permite la clonación de voz "zero-shot" a partir de una muestra corta, sin reentrenamiento. |
| **Herramientas utilizables** | Un códec neuronal para convertir el audio en tokens; un modelo tipo LLM para predecir esos tokens a partir del texto y una muestra de referencia. |
| **Trampas a evitar** | Confundir esta arquitectura con Tacotron porque ambos "generan audio a partir de texto", ignorando la diferencia entre representación continua y tokens discretos. |
| **Buenas prácticas** | Identificar si un modelo produce una representación continua o tokens discretos antes de compararlo con otro. |
