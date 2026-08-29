---
order: 10
---

# Los k vecinos más próximos (k-NN)

A diferencia de la [regresión lineal](/?c=donnees&s=data-science&p=regression-lineaire), la [regresión logística](/?c=donnees&s=data-science&p=regression-logistique), los [árboles de decisión](/?c=donnees&s=data-science&p=arbres-de-decision) o los [SVM](/?c=donnees&s=data-science&p=svm), el algoritmo de los **k vecinos más próximos** (*k-Nearest Neighbors*, k-NN) no aprende ninguna fórmula, ninguna frontera, ninguna regla: en el entrenamiento, se limita a **memorizar** todos los datos. Todo el trabajo se hace en el momento de la predicción.

## La idea: pedir la opinión de los vecinos más cercanos

Un servicio de streaming quiere clasificar una nueva película por género, basándose en las películas ya catalogadas. Para una nueva película, k-NN:

1. Calcula la **distancia** entre esta película y cada una de las películas ya conocidas (a partir de características numéricas: duración, presupuesto, número de escenas de acción detectadas...).
2. Retiene las **k** películas más cercanas (ej.: k = 5).
3. Vota: la categoría mayoritaria entre estos k vecinos se convierte en la predicción.

```
    ○ ○
  ○   ○  ×?          × : nueva película a clasificar
    ○   ●            k = 5 vecinos más cercanos rodeados
  ●   ○
```

Si 4 de los 5 vecinos más cercanos son "ciencia ficción", la nueva película se clasifica como "ciencia ficción". No se ha calculado ninguna línea, ninguna curva, ningún árbol: solo distancias y un voto.

## En código

```python
from sklearn.neighbors import KNeighborsClassifier

modelo = KNeighborsClassifier(n_neighbors=5)   # k = 5
modelo.fit(X_entrenamiento, y_entrenamiento)   # no calcula nada: simplemente almacena los datos

modelo.predict([[pelicula_nueva]])                # calcula las distancias AHORA, sobre la marcha
```

## La trampa de rendimiento: todo el trabajo llega en la predicción

Para los algoritmos anteriores, `fit()` hace todo el trabajo costoso una sola vez, y `predict()` aplica luego una fórmula ya lista (rápida, incluso con muchos datos nuevos). Para k-NN, es al revés: `fit()` es instantáneo (solo almacena los datos), pero cada llamada a `predict()` debe recalcular la distancia entre el nuevo punto y **todos** los ejemplos conocidos.

| Tamaño del catálogo | Tiempo por predicción |
|---|---|
| 68 películas | Instantáneo |
| 4 200 000 películas | Claramente más lento: cada predicción vuelve a comparar la nueva película con las otras 4,2 millones |

Este compromiso (ningún entrenamiento, pero una predicción cada vez más costosa a medida que crecen los datos) le da a k-NN el nombre de algoritmo "perezoso" (*lazy learning*), en contraposición a los algoritmos "eager" (SVM, árboles, regresiones), que invierten todo el coste de cálculo en `fit()`.

## Elegir k

| k | Efecto |
|---|---|
| Demasiado pequeño (ej.: 1) | Muy sensible al ruido: un solo vecino atípico cambia la predicción ([sobreajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-y-subajuste-underfitting)) |
| Demasiado grande | Suaviza demasiado la frontera entre categorías, hasta ignorar los patrones locales reales ([subajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-y-subajuste-underfitting)) |
| Equilibrado | Elegido por [validación cruzada](/?c=donnees&s=data-science&p=machine-learning-scikit-learn) probando varios valores |

> **Trampa:** como el [SVM](/?c=donnees&s=data-science&p=svm#trampa-las-entradas-sin-escalar-distorsionan-el-margen), k-NN se basa por completo en distancias: entradas no escaladas a la misma escala (`StandardScaler`) distorsionan las distancias calculadas, exactamente por la misma razón.

## Comparativa de los 5 algoritmos

| Algoritmo | Qué aprende | Qué traza | Tipo de salida |
|---|---|---|---|
| [Regresión lineal](/?c=donnees&s=data-science&p=regression-lineaire) | Un peso por entrada | Una recta (o un plano) | Un número continuo |
| [Regresión logística](/?c=donnees&s=data-science&p=regression-logistique) | Un peso por entrada + umbral | Una curva en S (probabilidad) | Una categoría, con probabilidad |
| [Árbol de decisión](/?c=donnees&s=data-science&p=arbres-de-decision) | Una serie de preguntas | Rectángulos (cortes rectos) | Una categoría (o un número) |
| [SVM](/?c=donnees&s=data-science&p=svm) | La frontera de margen máximo | Un margen entre categorías | Una categoría |
| k-NN | Nada (memoriza los datos) | Un voto entre vecinos | Una categoría (o una media) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | k-NN clasifica un nuevo ejemplo por voto mayoritario entre sus k vecinos más próximos, sin construir nunca un modelo explícito: todo el cálculo ocurre en la predicción, no en el entrenamiento. |
| **Herramientas utilizables** | `sklearn.neighbors.KNeighborsClassifier`, `n_neighbors`, `StandardScaler`. |
| **Trampas a evitar** | Usarlo en un catálogo muy grande sin prever el coste por predicción; olvidar escalar las entradas. |
| **Buenas prácticas** | Elegir k por validación cruzada en lugar de al azar; reservar k-NN para volúmenes de datos donde una predicción lenta siga siendo aceptable. |
