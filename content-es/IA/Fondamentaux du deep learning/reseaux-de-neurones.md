---
order: 1
---

# Las redes neuronales: conceptos básicos

El **machine learning** consiste en hacer que un programa aprenda un comportamiento a partir de datos, en lugar de dictarle cada regla explícitamente (véase [Introducción al machine learning](/?c=data-science&p=machine-learning-scikit-learn) para profundizar). Una **red neuronal artificial** es una familia de modelos de machine learning: una [función matemática](/?c=mathematiques&p=la-fonction-mathematique), compuesta de numerosas unidades de cálculo simples («neuronas») organizadas en capas, cuyos parámetros se ajustan automáticamente a partir de datos en lugar de escribirse a mano.

## La neurona artificial

Una neurona recibe varias entradas, calcula una **suma ponderada** (véase el [producto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire): es exactamente este cálculo, entre el vector de las entradas y el vector de los pesos), le suma un **sesgo**, y a continuación aplica una **función de activación**:

```text
salida = activacion(w1*x1 + w2*x2 + w3*x3 + ... + sesgo)
```

```python
def neurona(entradas, pesos, sesgo, activacion):
    suma_ponderada = sum(e * p for e, p in zip(entradas, pesos)) + sesgo
    return activacion(suma_ponderada)
```

- Los **pesos** (`w1`, `w2`...) determinan la importancia de cada entrada: son estos, junto con el sesgo, los que el entrenamiento va a ajustar (véase [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
- El **sesgo** permite que la salida se desplace incluso cuando todas las entradas valen cero (como la ordenada en el origen de una recta).

> **Trampa:** omitir el sesgo. Sin él, la salida de una neurona siempre vale cero en cuanto todas las entradas valen cero, sean cuales sean los pesos: la neurona nunca puede desplazar su respuesta independientemente de sus entradas, lo que limita fuertemente lo que puede aprender a representar.
>
> **Buena práctica:** incluir sistemáticamente un sesgo en una neurona, salvo razón concreta para forzar una salida nula con entradas nulas.

## ¿Por qué es imprescindible una función de activación?

Sin función de activación (o con una función lineal), apilar varias capas de neuronas equivaldría matemáticamente a... una única operación lineal: la composición de varias funciones lineales sigue siendo lineal, sea cual sea el número de capas apiladas. La función de activación introduce una **no linealidad**, indispensable para que la red pueda aprender patrones complejos (una frontera de decisión curva, por ejemplo, en lugar de una simple recta).

| Función de activación | Fórmula (simplificada) | Uso típico |
|---|---|---|
| **Sigmoide** | Aplasta cualquier valor entre 0 y 1 | Salida de una clasificación binaria (una [probabilidad](/?c=mathematiques&p=les-probabilites-de-base)) |
| **Tanh** | Aplasta cualquier valor entre -1 y 1, centrada en 0 | Capas ocultas de redes más antiguas (RNN en particular); suele converger mejor que sigmoide gracias a este centrado |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)`: deja pasar los valores positivos, aplasta los negativos a 0 | Capas ocultas, muy utilizada en la práctica (sencilla y eficaz de calcular) |
| **Leaky ReLU** | `x` si es positivo, `0.01 * x` si no (en lugar de aplastar a 0) | Capas ocultas, como ReLU, cuando la "neurona muerta" (ver más abajo) es un problema |
| **GELU** | Variante suavizada de ReLU, ponderada por la distribución normal | Capas ocultas de los [Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) modernos |
| **Softmax** | Transforma un vector de puntuaciones en una [distribución de probabilidad](/?c=mathematiques&p=les-probabilites-de-base) cuya suma es 1 | Salida de una clasificación en varias categorías |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

> **Trampa:** usar sigmoide en la salida de una clasificación con **varias** categorías (más de dos). Sigmoide produce una probabilidad independiente por categoría, sin garantía de que su suma sea 1: softmax está construida precisamente para producir una distribución de probabilidad válida sobre varias categorías a la vez (véase la [suma igual a 1 de una distribución](/?c=mathematiques&p=les-probabilites-de-base)).
>
> **Buena práctica:** elegir la función de activación de salida según el número de categorías a distinguir: sigmoide para una elección binaria, softmax en cuanto más de dos categorías se excluyen mutuamente.

> **Trampa: la "neurona muerta" (*dying ReLU*).** Si la entrada ponderada de una neurona ReLU permanece negativa en todos los ejemplos de entrenamiento, su salida siempre vale 0, y su gradiente (véase [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)) también: esta neurona deja entonces de aprender definitivamente, sin que ningún error lo señale.
>
> **Buena práctica:** sustituir ReLU por Leaky ReLU (u otra variante similar) en las capas donde se observa este problema: la pequeña pendiente conservada del lado negativo siempre deja pasar un gradiente no nulo, que permite a la neurona recuperarse.

## Las capas de una red

```text
Entrada -> [Capa oculta 1] -> [Capa oculta 2] -> ... -> Salida
```

- **Capa de entrada**: recibe los datos brutos (los píxeles de una imagen, las palabras de una frase codificadas en números...).
- **Capas ocultas**: cada una transforma la representación recibida de la capa anterior: cuantas más capas haya («*deep* learning»), más podrá la red representar patrones abstractos y complejos.
- **Capa de salida**: produce el resultado final (una probabilidad, una categoría, un valor numérico...).

> **Trampa:** añadir capas sin disponer de suficientes datos para entrenarlas correctamente. Una red demasiado profunda respecto a la cantidad de datos disponible memoriza los ejemplos de entrenamiento en lugar de aprender un patrón general (véase el sobreajuste en [Introducción al machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Buena práctica:** ajustar la profundidad de la red a la cantidad de datos realmente disponible, en lugar de apilar capas esperando una ganancia automática.

## Un paso hacia adelante (*forward pass*), paso a paso

Para una red mínima con una sola capa oculta de 2 neuronas, y una entrada `[1.0, 2.0]`:

```python
entradas = [1.0, 2.0]

# Neurona 1 de la capa oculta
pesos_n1 = [0.5, -0.3]
sesgo_n1 = 0.1
salida_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # relu(0.0) = 0

# Neurona 2 de la capa oculta
pesos_n2 = [0.2, 0.4]
sesgo_n2 = 0.0
salida_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Capa de salida (1 neurona, a partir de las 2 salidas anteriores)
pesos_salida = [0.6, 0.9]
sesgo_salida = 0.05
resultado = sigmoide(salida_n1 * 0.6 + salida_n2 * 0.9 + 0.05)  # sigmoide(0.95) ≈ 0.72
```

Este cálculo (multiplicar, sumar, aplicar una activación, capa tras capa) es **todo** lo que hace una red neuronal para producir una predicción. Lo que hace que la red sea "inteligente" nunca es este mecanismo (fijo, puramente aritmético), sino los **valores de los pesos y los sesgos**, ajustados automáticamente por el entrenamiento (véase [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) a partir de un gran número de ejemplos.

En la práctica, un framework de deep learning nunca calcula neurona por neurona como en el código anterior: los pesos de una capa entera se guardan en una [matriz](/?c=mathematiques&p=matrices-et-produit-matriciel), y un único producto matricial calcula la salida de todas sus neuronas a la vez, mucho más rápido que un bucle en [Python](/?c=langages-de-programmation&s=python&p=python).

En este ejemplo, los pesos ya están fijados en valores precisos para ilustrar el cálculo; al comienzo de un entrenamiento real, parten en cambio de valores aleatorios.

> **Trampa:** inicializar todos los pesos de una capa con el **mismo** valor (a menudo cero). Todas las neuronas de esa capa calcularían entonces exactamente lo mismo en cada etapa, y seguirían aprendiendo de forma idéntica: la red pierde la capacidad de hacer que sus neuronas aprendan roles diferentes.
>
> **Buena práctica:** inicializar los pesos con pequeños valores aleatorios (véase [el azar y los generadores](/?c=representation-des-donnees&p=aleatoire-et-generateurs)), distintos entre sí, para que cada neurona parta de un punto de partida propio.

## Una red = una función de aproximación

Visto desde este ángulo, una red neuronal no es más que una [función matemática](/?c=mathematiques&p=la-fonction-mathematique) parametrizada (por sus pesos y sesgos), lo bastante flexible para aproximar una relación compleja entre una entrada (una imagen, un texto...) y una salida (una categoría, una secuencia de palabras...), a condición de disponer de suficientes datos representativos para ajustar correctamente estos parámetros.

> **Trampa:** confiar en una red con entradas muy diferentes de las vistas durante el entrenamiento. Una función aproximada a partir de ejemplos solo sigue siendo fiable en el dominio cubierto por esos ejemplos; fuera de él, su salida no tiene ninguna garantía de seguir siendo pertinente.
>
> **Buena práctica:** comprobar que los datos realmente sometidos al modelo en uso siguen siendo representativos de los datos de entrenamiento, en lugar de suponer que el modelo "generaliza" indefinidamente más allá.

Véase también [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) (cómo se ajustan concretamente estos pesos) y [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (formas específicas de organizar estas capas según el tipo de datos procesado).

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una neurona artificial calcula una suma ponderada de sus entradas (un producto escalar), le suma un sesgo, y aplica una función de activación no lineal. Una red apila estas neuronas en capas (entrada, ocultas, salida); sus pesos y sesgos se ajustan mediante el entrenamiento. |
| **Herramientas utilizables** | Las funciones de activación habituales (sigmoide, tanh, ReLU, Leaky ReLU, GELU, softmax) las proporcionan directamente las bibliotecas de deep learning (véase [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Trampas a evitar** | Omitir el sesgo. Usar sigmoide para una clasificación con varias categorías. Una neurona ReLU que "muere" (gradiente nulo de forma permanente). Apilar capas sin datos suficientes. Inicializar todos los pesos con el mismo valor. Confiar en el modelo fuera del dominio cubierto por sus datos de entrenamiento. |
| **Buenas prácticas** | Elegir la activación de salida según el número de categorías (sigmoide frente a softmax). Pasar a Leaky ReLU en caso de neuronas muertas. Ajustar la profundidad de la red a la cantidad de datos disponible. Inicializar los pesos con pequeños valores aleatorios distintos. |
