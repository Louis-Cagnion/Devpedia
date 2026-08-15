---
order: 1
---

# Las redes neuronales: conceptos básicos

Una **red neuronal artificial** es un modelo de aprendizaje automático (véase el capítulo dedicado a este tema) compuesto por numerosas unidades de cálculo simples («neuronas»), organizadas en capas y conectadas entre sí; una estructura vagamente inspirada en el funcionamiento biológico, pero que sigue siendo, ante todo, un objeto matemático: una función compleja, cuyos parámetros se ajustan automáticamente a partir de los datos.

## La neurona artificial

Una neurona recibe varias entradas, calcula una **suma ponderada**, le suma un sesgo y, a continuación, aplica una **función de activación**:

```
sortie = activation(w1*x1 + w2*x2 + w3*x3 + ... + biais)
```

```python
def neurone(entrees, poids, biais, activation):
    somme_ponderee = sum(e * p for e, p in zip(entrees, poids)) + biais
    return activation(somme_ponderee)
```

- Los **pesos** (`w1`, `w2`...) determinan la importancia de cada entrada; son estos, junto con el sesgo, los que el entrenamiento va a ajustar (véase el capítulo sobre el descenso del gradiente).
- El **sesgo** permite que la salida se desplace incluso cuando todas las entradas son cero (como la ordenada en el origen de una recta).

## ¿Por qué es imprescindible una función de activación?

Sin una función de activación (o con una función lineal), apilar varias capas de neuronas equivaldría matemáticamente a… una única operación lineal: la composición de varias funciones lineales sigue siendo lineal, independientemente del número de capas apiladas. La función de activación introduce una **no linealidad**, indispensable para que la red pueda aprender patrones complejos (una frontera de decisión curva, por ejemplo, en lugar de una simple recta).

| Función de activación | Fórmula (simplificada) | Uso típico |
|---|---|---|
| **Sigmoide** | Aplana cualquier valor entre 0 y 1 | Salida de una clasificación binaria (probabilidad) |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)` — deja pasar los valores positivos y pone a 0 los negativos | Capas ocultas, muy utilizadas en la práctica (sencillas y eficaces de calcular) |
| **Softmax** | Transforma un vector de puntuaciones en probabilidades cuya suma es 1 | Salida de una clasificación en varias categorías |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

## Las capas de una red

```
Entrée -> [Couche cachée 1] -> [Couche cachée 2] -> ... -> Sortie
```

- **Capa de entrada**: recibe los datos sin procesar (los píxeles de una imagen, las palabras de una frase codificadas en números...).
- **Capas ocultas**: cada una transforma la representación recibida de la capa anterior; cuantas más capas haya («*deep* learning»), más capaz será la red de representar patrones abstractos y complejos.
- **Capa de salida**: genera el resultado final (una probabilidad, una categoría, un valor numérico...).

## Un paso hacia adelante (*forward pass*), paso a paso

Para una red mínima con una sola capa oculta de 2 neuronas y una entrada`[1.0, 2.0]`:

```python
entrees = [1.0, 2.0]

# Neurona 1 de la capa oculta
poids_n1 = [0.5, -0.3]
biais_n1 = 0.1
sortie_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # revisado(0,0) = 0

# Neurona 2 de la capa oculta
poids_n2 = [0.2, 0.4]
biais_n2 = 0.0
sortie_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # revisado(1.0) = 1.0

# Capa de salida (1 neurona, a partir de las 2 salidas anteriores)
poids_sortie = [0.6, 0.9]
biais_sortie = 0.05
resultado = sigmoide(sortie_n1 * 0.6 + sortie_n2 * 0.9 + 0.05)  # sigmoide(0,95) ≈ 0,72
```

Este cálculo —multiplicar, sumar, aplicar una activación, capa tras capa— es **todo** lo que hace una red neuronal para generar una predicción. Lo que hace que la red sea «inteligente» nunca es este mecanismo (fijo y puramente aritmético), sino los **valores de los pesos y los sesgos**, ajustados automáticamente mediante el entrenamiento (véase el capítulo sobre el descenso del gradiente) a partir de un gran número de ejemplos.

## Una red = una función de aproximación

Desde este punto de vista, una red neuronal no es más que una función matemática parametrizada (por sus pesos y sesgos), lo suficientemente flexible como para aproximar una relación compleja entre una entrada (una imagen, un texto...) y una salida (una categoría, una secuencia de palabras...) — siempre que se disponga de suficientes datos representativos para ajustar correctamente dichos parámetros.

Véanse también los capítulos sobre el descenso de gradiente (cómo se ajustan concretamente estos pesos) y sobre las arquitecturas CNN/RNN/Transformer (formas específicas de organizar estas capas según el tipo de datos que se procesen).
