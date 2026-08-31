---
order: 6
---

# La regresión lineal

Este capítulo aplica a un algoritmo concreto el vocabulario planteado en [Introducción al aprendizaje automático](/?c=donnees&s=data-science&p=machine-learning-scikit-learn) (entrenamiento/prueba, `fit`/`predict`). La **regresión lineal** es el más simple de los algoritmos de aprendizaje automático supervisado: predice un **número** (un valor continuo) a partir de una o varias entradas, trazando la recta que mejor se ajusta a ejemplos conocidos.

## La idea: encontrar la mejor recta

Una empresa de reparto quiere estimar la duración de un trayecto a partir de la distancia a recorrer. Sobre trayectos pasados, ya conoce la distancia Y la duración real: son los datos de entrenamiento.

```
duración (min)
   50 |                                    ●
   40 |                          ●      ╱
   30 |                 ●     ╱‾
   20 |        ●     ╱‾
   10 |  ●  ╱‾
    0 +──────────────────────────────── distancia (km)
      0    5    10   15   20
```

Cada punto ● es un trayecto pasado real. La recta es la que pasa **lo más cerca posible del conjunto de puntos**, no necesariamente por uno solo de ellos: es esa recta la que el modelo aprende, y luego reutiliza para predecir la duración de un nuevo trayecto del que solo se conoce la distancia.

## La fórmula de una recta

Una recta con una sola entrada se escribe:

```
predicción = sesgo + peso × entrada
```

Sobre el ejemplo del reparto, el entrenamiento (ver más abajo *cómo* se encuentran estos dos números) da en concreto:

```
duración = 7.6 + 2.52 × distancia
```

- **7.6** (el sesgo, o *intercept*): la duración base, incompresible, incluso para una distancia cercana a 0 (preparación, salida del depósito...).
- **2.52** (el peso, o *coeficiente*): el número de minutos añadidos por kilómetro adicional.

Para un trayecto de 12 km: `duración = 7.6 + 2.52 × 12 = 37.8` minutos.

Con **varias** entradas (distancia, pero también número de semáforos en rojo en el trayecto, hora del día...), la fórmula añade un peso por entrada: `predicción = sesgo + peso1 × entrada1 + peso2 × entrada2 + ...`. Es exactamente la [suma ponderada de un producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) entre el vector de las entradas y el vector de los pesos aprendidos.

## En código

```python
from sklearn.linear_model import LinearRegression

# X: distancia en km (una sola columna aquí); y: duración real en minutos
X = [[2], [5], [9], [14], [20]]
y = [12, 20, 30, 42, 58]

modelo = LinearRegression()
modelo.fit(X, y)          # encuentra el sesgo y el/los peso(s) que minimizan el error (ver más abajo)

modelo.intercept_          # 7.6  -> el sesgo
modelo.coef_                # [2.52] -> un peso por columna de X

modelo.predict([[12]])     # [37.8] -> predicción para una distancia de 12 km
```

## Cómo encuentra el modelo esta recta

Una infinidad de rectas podrían atravesar la nube de puntos; `fit()` elige la que minimiza **el error cuadrático medio** (ver esta métrica en [Introducción al aprendizaje automático](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#medir-la-calidad-de-un-modelo)) entre las duraciones predichas y las duraciones reales de los ejemplos de entrenamiento: la suma de las desviaciones al cuadrado, lo más pequeña posible.

Dos métodos encuentran este mínimo, según el tamaño de los datos:

| Método | Principio | Se usa cuando |
|---|---|---|
| Ecuación normal (forma cerrada) | Calcula directamente el sesgo/peso óptimos mediante una fórmula matemática, de una sola vez | Pocas columnas (unas decenas) |
| Descenso de gradiente | Ajusta progresivamente sesgo/pesos con pequeños pasos, en la dirección que reduce el error (ver [el entrenamiento de un modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) | Muchas columnas o datos: la fórmula directa se vuelve demasiado costosa de calcular |

`LinearRegression` de scikit-learn utiliza la ecuación normal automáticamente; el descenso de gradiente se usa sobre todo para modelos más complejos (redes neuronales).

## Límite: la regresión lineal supone una relación... lineal

El modelo solo puede trazar una recta (o un plano, con varias entradas): si la relación real entre las entradas y la salida es una curva, una recta nunca podrá ajustarse bien a ella, sean cuales sean el sesgo y los pesos elegidos. Es un caso clásico de [subajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-y-subajuste-underfitting) estructural, no un problema de datos insuficientes.

> **Trampa:** aplicar `LinearRegression` a una salida categórica (ej.: "sí"/"no") en lugar de a un número continuo. El modelo no devolverá un error, sino un número sin significado (ej.: 0.73), inutilizable como categoría: para clasificar, ver el capítulo siguiente, la [regresión logística](/?c=donnees&s=data-science&p=regression-logistique).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La regresión lineal predice un número continuo trazando la recta (o el plano) que minimiza el error cuadrático medio sobre los ejemplos de entrenamiento. |
| **Herramientas utilizables** | `sklearn.linear_model.LinearRegression`, `.fit()`, `.predict()`, `.intercept_`, `.coef_`. |
| **Trampas a evitar** | Usarla sobre una salida categórica; aplicarla tal cual a una relación no lineal (subajuste garantizado). |
| **Buenas prácticas** | Verificar visualmente (nube de puntos) que la relación parece efectivamente lineal antes de entrenar el modelo. |
