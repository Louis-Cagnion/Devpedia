---
order: 17
---

# OCR: del reconocimiento de patrones clásico al deep learning

El capítulo [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) define el **OCR** (reconocimiento óptico de caracteres) y cubre lo que ocurre **alrededor** del texto (localizar una tabla, reconstruir su cuadrícula). Este capítulo se centra en la etapa que viene antes: cómo un modelo transforma los píxeles de una zona de texto en caracteres, desde el primer OCR (comparación de patrones) hasta los modelos de deep learning modernos.

## El OCR clásico: reconocer un carácter como una imagen de referencia

Los primeros motores de OCR (entre ellos las primeras versiones de [**Tesseract**](https://github.com/tesseract-ocr/tesseract), un motor OCR de código abierto) dividen el problema en tres etapas estrictamente separadas:

```text
Imagen de la linea de texto
        │
        ▼
1. Segmentacion: dividir la linea en una imagen por caracter
        │
        ▼
2. Extraccion de caracteristicas: medir rasgos del trazo
   (numero de bucles, de trazos verticales, de huecos...)
        │
        ▼
3. Comparacion: que caracter de referencia tiene las caracteristicas mas cercanas?
```

Este enfoque funciona bien sobre un texto limpio, impreso, con caracteres bien separados: es la **segmentación** de la etapa 1 la que constituye su punto débil.

> **Trampa:** una segmentación que supone que los caracteres siempre están separados por un espacio neto. Dos letras que se tocan (una fuente fina y apretada, un texto manuscrito cursivo) o un carácter dañado por el ruido del escaneo (imagen un poco inclinada, manchada) rompen esta hipótesis: la línea se divide entonces en el lugar equivocado, y todo lo que sigue (extracción de características, comparación) parte de una imagen de carácter ya errónea.
>
> **Buena práctica:** reservar el OCR clásico para documentos cuyo texto sea efectivamente limpio e impreso (formularios estandarizados, texto digital renderizado como imagen); para un texto manuscrito o de calidad variable, preferir un enfoque de deep learning que no dependa de una segmentación previa (ver más abajo).

## El deep learning evita la segmentación carácter por carácter

Un **CRNN** (*Convolutional Recurrent Neural Network*) combina las dos [arquitecturas vistas anteriormente](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) en lugar de inventar una nueva:

```text
Imagen de la linea completa
        │
        ▼
CNN: extrae una columna de caracteristicas visuales en cada posicion horizontal
      (sin division en caracteres individuales)
        │
        ▼
RNN (LSTM/GRU): lee estas columnas de izquierda a derecha, como una secuencia
        │
        ▼
Una distribucion de probabilidad sobre los caracteres posibles, en cada posicion
```

El CNN no "sabe" dónde empieza ni dónde termina cada carácter: produce una serie de columnas de características, una por franja vertical de la imagen, sin necesitar nunca segmentar la línea previamente. Es el RNN, y luego la siguiente etapa, los que le dan sentido a esta serie.

### El problema que CTC resuelve: alinear una salida más larga que el texto

El número de columnas producidas por el CNN (una por franja de la imagen) nunca corresponde exactamente al número de caracteres del texto: una letra ancha como "M" ocupa varias columnas, una letra fina como "l" ocupa solo una. Sin un mecanismo dedicado, la red no tiene forma alguna de aprender "qué columnas corresponden a qué carácter", a falta de una anotación tan precisa en los datos de entrenamiento (que dan el texto de la línea, no la posición píxel por píxel de cada letra).

La **CTC** (*Connectionist Temporal Classification*) resuelve este problema añadiendo un símbolo especial, el **blanco** (`Ø`), que el modelo puede producir libremente entre dos caracteres repetidos o inciertos, y luego aplicando una regla de simplificación fija para obtener el texto final:

```text
Salida bruta del RNN (una prediccion por columna):
  Ø  Ø  h  h  Ø  e  e  Ø  l  l  l  Ø  Ø  l  o  o  Ø

Regla CTC: fusionar los caracteres identicos consecutivos, luego eliminar los Ø
  h  h  →  h          l  l  l  →  l         (repeticiones fusionadas)
  Ø         (eliminados)

Resultado: h  e  l  l  o   ->  "hello"
```

| | OCR clásico | CRNN + CTC |
|---|---|---|
| División en caracteres | Obligatoria, antes del reconocimiento | Nunca necesaria |
| Dato de entrenamiento requerido | Imagen de carácter aislado, ya etiquetado | Imagen de línea completa + su texto, sin posición |
| Robustez al texto cursivo/apretado | Baja (la segmentación falla) | Buena (no hay segmentación que hacer) |

> **Trampa:** repetir un carácter voluntariamente en el texto real (ej. "book", con dos "o" consecutivas) y creer que la regla de fusión CTC lo va a colapsar en una sola "o". La regla de fusión solo se aplica a las repeticiones consecutivas de la salida bruta del modelo, no al texto final: el modelo aprende a insertar un `Ø` entre dos repeticiones **deseadas** en el texto, precisamente para evitar que se fusionen erróneamente.
>
> **Buena práctica:** dejar esta distinción al entrenamiento (el modelo aprende, a partir de los ejemplos, cuándo insertar un `Ø` entre dos caracteres idénticos deseados) en lugar de intentar codificarla a mano en el post-procesamiento.

## Los modelos basados en Transformers: reemplazar el RNN por la atención

Como con el texto puro (ver [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), el RNN de un CRNN puede reemplazarse por un mecanismo de **atención**. Una arquitectura Transformer para OCR (por ej. [TrOCR](https://arxiv.org/abs/2109.10282)) se compone de dos bloques:

- Un **codificador visual**: divide la imagen en pequeños parches (como una cuadrícula), y calcula una representación de cada parche teniendo en cuenta todos los demás mediante atención, en lugar de la lectura estrictamente izquierda-a-derecha de un RNN.
- Un **decodificador de texto**: genera los caracteres uno por uno, cada uno pudiendo "mirar" cualquier parche de la imagen (no solo los parches vecinos del último carácter producido), y el texto ya generado.

Esta arquitectura ya no depende de CTC: el decodificador genera directamente una serie de caracteres, como un LLM genera una serie de palabras (ver [Procesamiento del lenguaje natural (NLP) y grandes modelos de lenguaje (LLM)](/?c=ia&s=nlp-llm&p=nlp-et-llm)), sin las restricciones de alineación columna por columna de un CRNN.

> **Trampa:** suponer que un modelo Transformer es automáticamente superior a un CRNN+CTC para cualquier tarea de OCR. Un Transformer de OCR generalmente requiere más datos de entrenamiento y más cómputo; en un caso de uso acotado (una sola fuente, un formato de documento fijo), un CRNN+CTC más ligero suele alcanzar una calidad comparable a un costo mucho menor.
>
> **Buena práctica:** tomar esta decisión según la diversidad real de los documentos a procesar (ver también [Arbitraje local vs cloud para un modelo de visión](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) para la cuestión de dónde ejecutar el modelo elegido), no por defecto hacia la arquitectura más reciente.

## Comparativa de los tres enfoques

| | OCR clásico | CRNN + CTC | Transformer |
|---|---|---|---|
| Segmentación previa en caracteres | Necesaria | Ninguna | Ninguna |
| Robustez al texto cursivo/degradado | Baja | Buena | Buena a muy buena |
| Volumen de datos de entrenamiento requerido | Bajo (patrones de referencia) | Moderado | Alto |
| Costo de cómputo | Muy bajo | Bajo a moderado | Moderado a alto |

Ver también [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) para la etapa que usa este texto reconocido (reubicarlo en una estructura de página), y [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) para el detalle de los bloques (CNN, RNN, atención) reutilizados aquí.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El OCR clásico segmenta la línea en caracteres y luego compara cada uno con patrones de referencia; frágil en cuanto los caracteres se tocan o están degradados. El CRNN combina CNN (extracción visual) y RNN (lectura secuencial), con CTC para alinear una salida más larga que el texto final sin segmentación previa. Un Transformer de OCR reemplaza el RNN por la atención y genera el texto directamente, sin CTC. |
| **Herramientas utilizables** | Tesseract (motor histórico, OCR clásico y luego LSTM+CTC en sus versiones recientes), modelos CRNN+CTC o Transformer entrenables con [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch). |
| **Trampas a evitar** | Aplicar el OCR clásico a un texto cursivo o degradado. Creer que la regla de fusión CTC colapsa repeticiones deseadas en el texto real. Elegir un Transformer por defecto sin considerar el costo de cómputo y el volumen de datos realmente disponible. |
| **Buenas prácticas** | Reservar el OCR clásico para documentos limpios e impresos. Dejar que el entrenamiento gestione la distinción entre repetición deseada y repetición a fusionar (CTC). Elegir la arquitectura según la diversidad real de los documentos, no según su novedad. |
