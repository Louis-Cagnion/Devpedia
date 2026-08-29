---
order: 7
---

# La regresión logística

A pesar de su nombre parecido al de la [regresión lineal](/?c=donnees&s=data-science&p=regression-lineaire), la regresión logística no predice un número continuo sino una **categoría**: es un algoritmo de **clasificación**. Responde a preguntas del tipo "¿es este correo un spam?" o "¿va a cancelar este suscriptor su suscripción?", apoyándose en las mismas bases que la regresión lineal (sesgo, peso, `fit`/`predict`, ver [Introducción al aprendizaje automático](/?c=donnees&s=data-science&p=machine-learning-scikit-learn)).

## El problema: una recta no basta para clasificar

Un servicio de suscripción quiere predecir si un usuario va a **cancelar** (*churn*) a partir del número de días desde su última conexión. La salida esperada no es un número cualquiera, sino una **probabilidad**, forzosamente comprendida entre 0 y 1 (0% a 100% de probabilidades de cancelar). Una recta clásica (regresión lineal) puede superar 1 o bajar de 0 para entradas extremas: un resultado que entonces ya no tiene ningún sentido como probabilidad.

## La solución: aplastar la recta en una curva en S

La regresión logística calcula primero una suma ponderada clásica (`sesgo + peso × entrada`, exactamente como la regresión lineal), y luego pasa este resultado por una [función matemática](/?c=fondamentaux&s=mathematiques&p=la-fonction-mathematique) particular, la **función sigmoide**, que comprime cualquier número (por grande o pequeño que sea) en el intervalo ]0, 1[:

```
probabilidad
    1 |                              ●●●●●●
      |                          ●●●
  0.5 |                      ●●
      |                  ●●●
    0 |●●●●●●●●●●●●
      +──────────────────────────────────── días desde la última conexión
```

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))   # aplasta x en el intervalo ]0, 1[, sea cual sea x

sigmoide(-10)   # ≈ 0.00005  -> cerca de 0
sigmoide(0)     # 0.5        -> justo en el medio
sigmoide(10)    # ≈ 0.99995  -> cerca de 1
```

Para un suscriptor que no se ha conectado desde hace 17 días, el modelo entrenado calcula por ejemplo una probabilidad de cancelación del **82%**. Por encima de un **umbral de decisión** (0.5 por defecto), el usuario se clasifica como "en riesgo".

## En código

```python
from sklearn.linear_model import LogisticRegression

# X: días desde la última conexión; y: ha cancelado (1) o no (0)
X = [[2], [5], [10], [15], [25], [30]]
y = [0, 0, 0, 1, 1, 1]

modelo = LogisticRegression()
modelo.fit(X, y)

modelo.predict([[17]])         # [1] -> clasificado "va a cancelar" (probabilidad > umbral)
modelo.predict_proba([[17]])   # [[0.18, 0.82]] -> [probabilidad de 0, probabilidad de 1]
```

`predict()` ya aplica el umbral de 0.5 y devuelve directamente la categoría; `predict_proba()` devuelve la probabilidad bruta, útil cuando el umbral por defecto no conviene (ver la trampa más abajo).

## Cómo encuentra el modelo los pesos

Como en la regresión lineal, `fit()` busca los pesos/sesgo que minimizan un error, pero el error cuadrático medio (adaptado a un número continuo) no conviene a una probabilidad: la regresión logística utiliza la **entropía cruzada** (*cross-entropy*), una función de pérdida que penaliza fuertemente una predicción segura pero errónea (ej.: predecir un 99% de probabilidades de "no cancelación" para un usuario que sí cancela), ya detallada en [el entrenamiento de un modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## Trampa: el umbral de 0.5 no siempre es el correcto

Bajar o subir el umbral de decisión desplaza directamente el compromiso entre precisión y exhaustividad (ver [estas métricas](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#medir-la-calidad-de-un-modelo)): un umbral más bajo clasifica a más usuarios como "en riesgo" (más exhaustividad, menos precisión), un umbral más alto hace lo contrario. En un problema donde los falsos negativos salen caros (ej.: no detectar a un usuario que realmente va a cancelar), bajar el umbral por debajo de 0.5 mediante `predict_proba()` suele ser preferible a `predict()` solo, que impone 0.5 sin discusión.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La regresión logística clasifica una entrada calculando una probabilidad (mediante la función sigmoide), y comparándola luego con un umbral de decisión. A pesar de su nombre, es un algoritmo de clasificación, no de regresión. |
| **Herramientas utilizables** | `sklearn.linear_model.LogisticRegression`, `.predict()` (categoría), `.predict_proba()` (probabilidad bruta). |
| **Trampas a evitar** | Confundirla con la regresión lineal por el nombre; fiarse del umbral 0.5 por defecto sin verificar si conviene al problema. |
| **Buenas prácticas** | Usar `predict_proba()` en lugar de `predict()` en cuanto el coste de un falso negativo y de un falso positivo difieran, para ajustar el umbral en consecuencia. |
