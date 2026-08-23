---
order: 5
---

# Introducción al aprendizaje automático (scikit-learn)

El aprendizaje automático (**machine learning**) consiste en enseñar a un programa un comportamiento a partir de **datos**, en lugar de programar explícitamente cada regla. Este capítulo presenta la terminología y el desarrollo general de un proyecto de aprendizaje automático, antes de pasar a los capítulos más avanzados sobre redes neuronales.

## Aprendizaje supervisado frente a aprendizaje no supervisado

| | Aprendizaje supervisado | Aprendizaje no supervisado |
|---|---|---|
| Datos | Etiquetados (ya se conoce la respuesta correcta para cada ejemplo de entrenamiento) | No etiquetados |
| Objetivo | Predecir una etiqueta para nuevos datos | Descubrir una estructura oculta en los datos |
| Ejemplos de tareas | Clasificación (spam/no spam), regresión (predicción de un precio) | Agrupación (agrupar clientes similares), reducción de dimensiones |

```python
# Aprendizaje supervisado: X (los datos) Y y (las respuestas correctas conocidas)
X = [[25, 50000], [45, 80000], [30, 45000]]   # p. ej.: edad, salario
y = ["non", "oui", "non"]                        # p. ej.: ha solicitado un crédito o no

# Aprendizaje no supervisado: solo X, no hay una «respuesta correcta» que aprender
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## El principio fundamental: separar el entrenamiento de las pruebas

Un modelo que «se aprenda de memoria» los datos de entrenamiento (en lugar de aprender el patrón general subyacente) obtendría una puntuación perfecta con esos datos, pero fallaría con datos nuevos, nunca vistos. Para detectar este problema, **siempre** se **separan** los datos disponibles en dos conjuntos distintos:

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# El 80 % se utiliza para entrenar el modelo; el 20 % restante se reserva y no se utiliza nunca durante el entrenamiento.
```

A continuación, el modelo **solo** se evalúa con `X_test` / `y_test`, nunca con los datos que se han utilizado para entrenarlo.

## Sobreaaprendizaje (*overfitting*) y subaprendizaje (*underfitting*)

| | Puntuación en el entrenamiento | Puntuación en la prueba |
|---|---|---|
| **Subajuste** (*underfitting*) | Bajo | Bajo: el modelo es demasiado simple para captar el patrón |
| **Buen ajuste** | Alto | Alto: el modelo generaliza bien |
| **Sobreajuste** (*overfitting*) | Muy alto | Bajo: el modelo ha «memorizado» los datos de entrenamiento en lugar de aprender un patrón general |

> **Nota:** una gran diferencia entre la puntuación del entrenamiento (excelente) y la puntuación de la prueba (mediocre) es el indicio clásico de sobreaprendizaje: el modelo ha memorizado los ejemplos concretos en lugar de la regla general que los sustenta, algo así como un alumno que se hubiera aprendido de memoria las respuestas de un ejercicio concreto sin comprender el método.

## La API unificada de scikit-learn: `fit` / `predict`

Independientemente del algoritmo elegido, scikit-learn ofrece siempre la misma interfaz:

```python
from sklearn.linear_model import LogisticRegression   # Clasificación: «y» es categórica («sí»/«no»)

modelo = LogisticRegression()
modelo.fit(X_entrainement, y_entrainement)   # «aprende» a partir de los datos de entrenamiento

predictions = modelo.predict(X_test)           # aplica lo aprendido a nuevos datos

modelo.score(X_test, y_test)                    # evalúa la calidad de las predicciones en la prueba
```

- `fit(X, y)` : ajusta los parámetros internos del modelo para que se adapte lo mejor posible a los datos proporcionados.
- `predict(X)` : utiliza estos parámetros aprendidos para generar una predicción sobre nuevos datos.
- Esta interfaz (`fit` / `predict`) permanece idéntica al sustituir simplemente `LogisticRegression()` por otro algoritmo (`RandomForestClassifier()`, `KMeans()`...), lo que facilita mucho probar rápidamente varios enfoques para resolver el mismo problema.

> **Nota:** la elección del algoritmo depende del tipo de `y`. En este caso, `y` es **categórico** (`"oui"` / `"non"`): se trata de un problema de clasificación, de ahí que se utilice `LogisticRegression` (a pesar de su nombre, es un algoritmo de clasificación, no de regresión). `LinearRegression` se utiliza cuando `y` es un valor **numérico continuo** que se va a predecir (un precio, una temperatura...); utilizarlo con etiquetas de texto, como en este caso, provocaría un error.

## Medir la calidad de un modelo

```python
from sklearn.metrics import accuracy_score, mean_squared_error

accuracy_score(y_test, predictions)       # % de predicciones correctas -> para la clasificación
mean_squared_error(y_test, predictions)    # error cuadrático medio -> para la regresión
```

## El desarrollo típico de un proyecto de aprendizaje automático

1. Recopilar y limpiar los datos (valores que faltan; véase el capítulo sobre [pandas](/?c=data-science&p=pandas)).
2. Dividir en conjuntos de entrenamiento y de prueba.
3. Elegir uno o varios algoritmos candidatos y entrenarlos (`fit`).
4. Evaluar en el conjunto de pruebas (`predict` + una métrica adecuada al problema).
5. Ajustar (otro algoritmo, otros parámetros, más datos...) y volver a empezar.

Véase también el capítulo sobre redes neuronales: una familia concreta de modelos, más compleja que la de scikit-learn, pero basada exactamente en los mismos principios básicos (datos de entrenamiento/prueba, aprendizaje, generalización).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un modelo se entrena sobre un conjunto de datos separado del conjunto de prueba, para detectar si generaliza o "memoriza" (sobreajuste). La API de scikit-learn es uniforme: `fit()` y luego `predict()`, sea cual sea el algoritmo. |
| **Herramientas utilizables** | `train_test_split`, `cross_val_score`, matriz de confusión, `precision_score`/`recall_score`/`f1_score`. |
| **Trampas a evitar** | Evaluar y ajustar un modelo sobre el mismo conjunto de prueba, repetidamente: equivale a hacer trampa indirectamente; fiarse solo de la exactitud en clases desequilibradas. |
| **Buenas prácticas** | Reservar un conjunto de validación para ajustar los hiperparámetros, usando el conjunto de prueba final una sola vez; usar el F1-score para resumir el compromiso precisión/exhaustividad. |
