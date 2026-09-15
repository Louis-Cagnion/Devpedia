---
order: 3
---

# Arquitecturas: CNN, RNN y Transformers

La red «totalmente conectada» del [capítulo sobre los fundamentos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) (cada neurona conectada con todas las de la capa siguiente) no es la única forma de organizar las capas. Dependiendo del tipo de datos que se procesen (imagen, secuencia, texto), algunas arquitecturas resultan mucho más eficaces. Este capítulo presenta las tres familias más influyentes.

## Las redes convolucionales (CNN): para imágenes

Una red totalmente conectada que procesara una imagen de 1000 x 1000 píxeles requeriría un número enorme de pesos (un peso por píxel, por neurona de la capa siguiente), lo cual es inviable y pasa por alto una propiedad esencial de las imágenes: un motivo (un borde, un ojo, una textura) conserva el mismo significado **independientemente de dónde aparezca** en la imagen.

Una **CNN** (*red neuronal convolucional*) desliza un pequeño **filtro** (una matriz de pesos, p. ej., 3x3) por toda la imagen, reutilizando **los mismos pesos** en cada posición:

```text
Imagen (extracto)       Filtro (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> un único valor de salida, por posición del filtro
2  0  1  1                0  1  0
```

- El mismo filtro detecta el mismo patrón (por ejemplo, un borde vertical) **en cualquier parte** de la imagen, una propiedad denominada invariancia por traslación.
- El número de pesos que hay que aprender sigue siendo reducido (el tamaño del filtro), independientemente del tamaño de la imagen.
- Las capas de **pooling** (por ejemplo, *max pooling*) reducen a continuación la resolución conservando únicamente el valor máximo de una zona pequeña, lo que disminuye el volumen de cálculo y hace que la red sea más robusta ante pequeños desfases.

Al apilar varias capas convolucionales, las primeras detectan patrones sencillos (bordes, esquinas) y las siguientes los combinan para formar patrones cada vez más abstractos (formas y, posteriormente, objetos completos).

> **Trampa:** usar un CNN con datos sin estructura espacial local (un dato tabular clásico, por ejemplo, donde cada columna tiene un significado fijo y distinto de las demás): la hipótesis central del CNN (un patrón conserva el mismo significado dondequiera que aparezca) carece entonces de fundamento.
>
> **Buena práctica:** reservar el CNN a datos donde la posición **relativa** importa pero la posición **absoluta** no (imágenes, cuadrículas, sonidos representados en espectrograma), no a datos donde cada posición tiene un significado fijo y no intercambiable.

## Las redes recurrentes (RNN): para secuencias

Una frase, una serie temporal, una señal de audio: estos datos tienen un orden significativo que ni una red totalmente conectada ni una CNN procesan de forma natural. Una **RNN** (*red neuronal recurrente*) procesa una secuencia elemento por elemento, conservando un **estado oculto** que resume lo que se ha visto hasta ese momento:

```text
palabra1 -> [RNN] -> estado1 --\
                           +-> palabra2 -> [RNN] -> estado2 --\
                                                           +-> palabra3 -> [RNN] -> estado3 -> salida
```

Cada etapa recibe tanto el elemento actual **como** el estado oculto de la etapa anterior; esto es lo que permite a la red «recordar» el contexto anterior al procesar una frase, por ejemplo.

### El problema del gradiente que se desvanece

En el caso de una secuencia larga, la retropropagación (véase [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) debe remontarse a través de **todas** las etapas anteriores; el gradiente puede volverse extremadamente pequeño (o extremadamente grande) a medida que avanza, lo que dificulta mucho el aprendizaje de dependencias **lejanas** en la secuencia. Variantes como **[LSTM](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)** y **GRU** añaden mecanismos de puertas (*gates*) para controlar mejor qué información conservar u olvidar, lo que mitiga este problema.

> **Trampa:** usar un RNN «simple» (sin puertas) con secuencias largas donde las dependencias lejanas importan (el inicio de un párrafo influye en su conclusión, por ejemplo): el gradiente que se desvanece hace este aprendizaje poco fiable en la práctica.
>
> **Buena práctica:** preferir una variante con puertas (LSTM, GRU) en cuanto la secuencia es larga y las dependencias lejanas pueden ser importantes para la tarea.

## Los Transformers: el mecanismo de atención

Una RNN procesa una secuencia **de forma secuencial** (es imposible calcular el paso 5 antes del paso 4), lo que supone un importante obstáculo para la paralelización en secuencias largas y grandes volúmenes de datos (véase el cálculo en paralelo en [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)). El **Transformer** (2017) sustituye la recurrencia por un mecanismo de atención: cada elemento de la secuencia «observa» directamente a todos los demás (incluido él mismo), ponderando su importancia relativa, sin depender de un estado que se propaga paso a paso.

```text
"El gato que duerme en el sofá es negro"
                                  ^
                   la atención permite que "es negro" se relacione directamente con "gato",
                   pese a la distancia en la frase, sin pasar por todas las palabras intermedias
```

- La atención se puede calcular **en paralelo** para toda la secuencia (a diferencia de una RNN), lo que ha permitido entrenar modelos mucho más grandes, con una cantidad de datos mucho mayor.
- Esta arquitectura constituye la base de los grandes modelos de lenguaje (LLM) modernos (véase [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

> **Trampa:** aplicar un Transformer estándar a una secuencia extremadamente larga sin prestarle atención: el coste de cálculo de la atención aumenta más rápido que la propia longitud de la secuencia (cada elemento observa a todos los demás), al contrario que una RNN cuyo coste por etapa permanece constante.
>
> **Buena práctica:** para una secuencia muy larga, comprobar los límites de contexto del modelo utilizado (véase [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) en lugar de suponer que un Transformer absorbe cualquier longitud sin coste adicional.

## Comparativa rápida

| Arquitectura | Tipo de datos adecuado | Ventaja | Limitación |
|---|---|---|---|
| **CNN** | Imágenes, cuadrículas espaciales | Peso reducido, detecta patrones locales | Menos natural en secuencias largas |
| **RNN** (LSTM/GRU) | Secuencias (texto, series temporales) | Modela el orden y la memoria a corto plazo | Difícil de paralelizar, dependencias lejanas frágiles |
| **Transformer** | Secuencias, texto y, cada vez más, también imágenes | Se puede ejecutar en paralelo; detecta las dependencias prolongadas mediante la atención | Alto coste de memoria y cálculo en secuencias muy largas |

Véase también [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) para conocer la aplicación de la arquitectura Transformer al procesamiento del lenguaje.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El CNN explota la estructura espacial local de las imágenes mediante filtros de pesos compartidos. El RNN procesa una secuencia paso a paso conservando un estado oculto, pero sufre el problema del gradiente que se desvanece en las dependencias lejanas. El Transformer sustituye la recurrencia por la atención, paralelizable y en la base de los LLM modernos. |
| **Herramientas utilizables** | Las bibliotecas de deep learning proporcionan capas listas para usar para cada arquitectura (véase [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Trampas a evitar** | Usar un CNN con datos sin estructura espacial local. Usar un RNN simple con secuencias largas de dependencias lejanas. Subestimar el coste de la atención en una secuencia muy larga. |
| **Buenas prácticas** | Elegir la arquitectura según la estructura real de los datos (espacial, secuencial corta, secuencial larga), no por costumbre. Preferir LSTM/GRU a un RNN simple en cuanto las dependencias lejanas importan. Comprobar los límites de contexto antes de someter una secuencia muy larga a un Transformer. |
