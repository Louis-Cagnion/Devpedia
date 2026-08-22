---
order: 3
---

# Arquitecturas: CNN, RNN y Transformers

La red «totalmente conectada» del capítulo sobre fundamentos (cada neurona conectada con todas las de la capa siguiente) no es la única forma de organizar las capas. Dependiendo del tipo de datos que se procesen (imagen, secuencia, texto), algunas arquitecturas resultan mucho más eficaces. Este capítulo presenta las tres familias más influyentes.

## Las redes convolucionales (CNN): para imágenes

Una red totalmente conectada que procesara una imagen de 1000 x 1000 píxeles requeriría un número enorme de pesos (un peso por píxel, por neurona de la capa siguiente), lo cual es inviable y pasa por alto una propiedad esencial de las imágenes: un motivo (un borde, un ojo, una textura) conserva el mismo significado **independientemente de dónde aparezca** en la imagen.

Una **CNN** (*red neuronal convolucional*) desliza un pequeño **filtro** (una matriz de pesos, p. ej., 3x3) por toda la imagen, reutilizando **los mismos pesos** en cada posición:

```
Image (extrait)         Filtre (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> une seule valeur en sortie, par position du filtre
2  0  1  1                0  1  0
```

- El mismo filtro detecta el mismo patrón (por ejemplo, un borde vertical) **en cualquier parte** de la imagen, una propiedad denominada invariancia por traslación.
- El número de pesos que hay que aprender sigue siendo reducido (el tamaño del filtro), independientemente del tamaño de la imagen.
- Las capas de **pooling** (por ejemplo, *max pooling*) reducen a continuación la resolución conservando únicamente el valor máximo de una zona pequeña, lo que disminuye el volumen de cálculo y hace que la red sea más robusta ante pequeños desfases.

Al apilar varias capas convolucionales, las primeras detectan patrones sencillos (bordes, esquinas) y las siguientes los combinan para formar patrones cada vez más abstractos (formas y, posteriormente, objetos completos).

## Las redes recurrentes (RNN): para secuencias

Una frase, una serie temporal, una señal de audio: estos datos tienen un orden significativo que ni una red totalmente conectada ni una CNN procesan de forma natural. Una **RNN** (*red neuronal recurrente*) procesa una secuencia elemento por elemento, conservando un **estado oculto** que resume lo que se ha visto hasta ese momento:

```
mot1 -> [RNN] -> état1 --\
                           +-> mot2 -> [RNN] -> état2 --\
                                                           +-> mot3 -> [RNN] -> état3 -> sortie
```

Cada etapa recibe tanto el elemento actual **como** el estado oculto de la etapa anterior; esto es lo que permite a la red «recordar» el contexto anterior al procesar una frase, por ejemplo.

### El problema del gradiente que se desvanece

En el caso de una secuencia larga, la retropropagación (véase el capítulo sobre el descenso del gradiente) debe remontarse a través de **todas** las etapas anteriores; el gradiente puede volverse extremadamente pequeño (o extremadamente grande) a medida que avanza, lo que dificulta mucho el aprendizaje de dependencias **lejanas** en la secuencia. Variantes como **[LSTM](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)** y **GRU** añaden mecanismos de puertas (*gates*) para controlar mejor qué información conservar u olvidar, lo que mitiga este problema.

## Los Transformers: el mecanismo de atención

Una RNN procesa una secuencia **de forma secuencial** (es imposible calcular el paso 5 antes del paso 4), lo que supone un importante obstáculo para la paralelización en secuencias largas y grandes volúmenes de datos. El **Transformer** (2017) sustituye la recurrencia por un mecanismo de atención: cada elemento de la secuencia «observa» directamente a todos los demás (incluido él mismo), ponderando su importancia relativa, sin depender de un estado que se propaga paso a paso.

```
"Le chat qui dort sur le canapé est noir"
                                    ^
                     l'attention permet à "est noir" de se relier directement à "chat",
                     malgré la distance dans la phrase, sans passer par tous les mots intermédiaires
```

- La atención se puede calcular **en paralelo** para toda la secuencia (a diferencia de una RNN), lo que ha permitido entrenar modelos mucho más grandes, con una cantidad de datos mucho mayor.
- Esta arquitectura constituye la base de los grandes modelos de lenguaje (LLM) modernos (véase el capítulo sobre el PLN y los LLM).

## Comparativa rápida

| Arquitectura | Tipo de datos adecuado | Ventaja | Limitación |
|---|---|---|---|
| **CNN** | Imágenes, cuadrículas espaciales | Peso reducido, detecta patrones locales | Menos natural en secuencias largas |
| **RNN** (LSTM/GRU) | Secuencias (texto, series temporales) | Modela el orden y la memoria a corto plazo | Difícil de paralelizar, dependencias lejanas frágiles |
| **Transformar** | Secuencias, texto y, cada vez más, también imágenes | Se puede ejecutar en paralelo; detecta las dependencias prolongadas mediante la atención | Alto coste de memoria y cálculo en secuencias muy largas |

Véase también el capítulo sobre el PLN y los LLM para conocer la aplicación de la arquitectura Transformer al procesamiento del lenguaje.
