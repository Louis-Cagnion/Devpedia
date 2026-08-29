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

## Un tercer conjunto: la validación

Ajustar un modelo (comparar varios algoritmos, elegir hiperparámetros) basándose en la puntuación obtenida en `X_test` equivale a hacer trampa indirectamente: las decisiones tomadas en este proceso acaban influidas por esa puntuación, que deja entonces de representar un conjunto realmente nunca visto. La práctica correcta introduce un tercer conjunto, la **validación**, utilizado durante el ajuste en lugar de al final:

| Conjunto | Función |
|---|---|
| Entrenamiento | Ajustar los parámetros internos del modelo (`fit`) |
| Validación | Comparar modelos/hiperparámetros entre sí, antes de cualquier prueba final |
| Prueba | Evaluar una sola vez, al final, el modelo elegido |

```python
X_entrainement, X_temp, y_entrainement, y_temp = train_test_split(X, y, test_size=0.4)
X_validacion, X_test, y_validacion, y_test = train_test_split(X_temp, y_temp, test_size=0.5)
# 60% entrenamiento / 20% validación / 20% prueba
```

## Sobreajuste (*overfitting*) y subajuste (*underfitting*)

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

## La validación cruzada (*cross-validation*)

Con pocos datos, reservar un 40 % para validación+prueba (véase más arriba) resulta costoso; la validación cruzada resuelve este problema sin sacrificar tantos datos de entrenamiento:

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(LogisticRegression(), X_entrainement, y_entrainement, cv=5)
# divide X_entrainement en 5 bloques ("folds"); entrena 5 veces, usando cada bloque como validación por turnos
scores.mean()   # media de las 5 puntuaciones -> estimación más fiable que una sola división entrenamiento/validación
```

Así, cada ejemplo sirve tanto para el entrenamiento (4 veces de cada 5) como para la validación (1 vez de cada 5), sin tocar nunca `X_test`: la media de las 5 puntuaciones suaviza el efecto de una división especialmente favorable o desfavorable que una sola partición podría producir por azar.

## Medir la calidad de un modelo

Para la regresión (`y` numérico continuo), el error cuadrático medio basta en la mayoría de los casos:

```python
from sklearn.metrics import mean_squared_error

mean_squared_error(y_test, predictions)   # error cuadrático medio
```

Para la clasificación, la exactitud (`accuracy_score`, % de predicciones correctas) no basta en cuanto las clases están desequilibradas: las métricas siguientes lo tienen en cuenta, a partir de la **matriz de confusión**.

### La matriz de confusión

Para una clasificación binaria (positivo/negativo), cada predicción cae en una de estas cuatro casillas:

| | Predicho positivo | Predicho negativo |
|---|---|---|
| **Realmente positivo** | Verdadero positivo (VP) | Falso negativo (FN) |
| **Realmente negativo** | Falso positivo (FP) | Verdadero negativo (VN) |

```python
from sklearn.metrics import confusion_matrix

confusion_matrix(y_test, predictions)
# [[VN, FP],
#  [FN, VP]]
```

### Las métricas derivadas

| Métrica | Fórmula | Responde a |
|---|---|---|
| Exactitud (*accuracy*) | (VP + VN) / total | Del total de predicciones, ¿qué proporción es correcta? |
| Precisión (*precision*) | VP / (VP + FP) | De los casos predichos como positivos, ¿cuántos lo son realmente? |
| Exhaustividad (*recall*, o sensibilidad) | VP / (VP + FN) | De los casos realmente positivos, ¿cuántos se han detectado? |
| Especificidad (*specificity*) | VN / (VN + FP) | De los casos realmente negativos, ¿cuántos se han descartado correctamente? |
| F1-score | 2 × (precisión × exhaustividad) / (precisión + exhaustividad) | Media armónica de la precisión y la exhaustividad, en una sola cifra |

```python
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report

precision_score(y_test, predictions)
recall_score(y_test, predictions)
f1_score(y_test, predictions)

print(classification_report(y_test, predictions))   # precisión, exhaustividad y F1 a la vez, por clase
```

> **Nota:** la exactitud es engañosa en clases desequilibradas: un detector de fraude que siempre responde "no" alcanza un 99 % de exactitud si el 1 % de las transacciones son fraudulentas, aunque resulte inútil (exhaustividad del 0 %). Precisión y exhaustividad casi siempre se evalúan juntas: mejorar una suele ir en detrimento de la otra (mover el umbral de decisión hacia "positivo" aumenta la exhaustividad pero reduce la precisión, y viceversa); el F1-score resume este compromiso en una sola cifra, útil para comparar modelos sin arbitrar manualmente entre ambas cada vez. La especificidad completa el panorama por el lado negativo: útil cuando un falso positivo sale caro (p. ej.: una prueba médica innecesaria), mientras que la exhaustividad se centra en el coste de un falso negativo (p. ej.: una enfermedad no detectada).

## El desarrollo típico de un proyecto de aprendizaje automático

1. Recopilar y limpiar los datos (valores que faltan; véase el capítulo sobre [pandas](/?c=data-science&p=pandas)).
2. Dividir en conjuntos de entrenamiento y de prueba.
3. Elegir uno o varios algoritmos candidatos y entrenarlos (`fit`).
4. Evaluar en el conjunto de pruebas (`predict` + una métrica adecuada al problema).
5. Ajustar (otro algoritmo, otros parámetros, más datos...) y volver a empezar.

Véase también el capítulo sobre [las redes neuronales](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): una familia concreta de modelos, más compleja que la de scikit-learn, pero basada exactamente en los mismos principios básicos (datos de entrenamiento/prueba, aprendizaje, generalización).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un modelo se entrena sobre un conjunto de datos separado del conjunto de prueba, para detectar si generaliza o "memoriza" (sobreajuste). La API de scikit-learn es uniforme: `fit()` y luego `predict()`, sea cual sea el algoritmo. |
| **Herramientas utilizables** | `train_test_split`, `cross_val_score`, matriz de confusión, `precision_score`/`recall_score`/`f1_score`. |
| **Trampas a evitar** | Evaluar y ajustar un modelo sobre el mismo conjunto de prueba, repetidamente: equivale a hacer trampa indirectamente; fiarse solo de la exactitud en clases desequilibradas. |
| **Buenas prácticas** | Reservar un conjunto de validación para ajustar los hiperparámetros, usando el conjunto de prueba final una sola vez; usar el F1-score para resumir el compromiso precisión/exhaustividad. |
