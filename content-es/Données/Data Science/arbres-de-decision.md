---
order: 8
---

# Los árboles de decisión

Un **árbol de decisión** clasifica (o predice un número, ver más abajo) planteando una **serie de preguntas simples** sobre las entradas, cada una con una respuesta binaria, hasta llegar a una decisión final. A diferencia de la [regresión logística](/?c=donnees&s=data-science&p=regression-logistique), que combina todas las entradas en una sola fórmula, un árbol las examina una por una, en un orden aprendido automáticamente.

## La idea: una serie de preguntas

Una aplicación de streaming musical quiere clasificar una canción en una lista de reproducción "Deporte" o no, a partir de 3 características (¿hip-hop? ¿enérgica? ¿tarde por la noche?).

```
                    ¿Hip-hop?
                   /          \
                  Sí           No
                   |             |
             ¿Enérgica?    (no Deporte)
              /       \
            Sí          No
             |            |
     ¿Tarde por la noche?  (no Deporte)
        /        \
      Sí          No
       |            |
   (no Deporte)   Deporte
```

Cada nodo plantea una pregunta sobre **una sola** característica; cada rama lleva a una nueva pregunta o a una **hoja**: la decisión final.

## Lo que hace realmente una pregunta: dividir el espacio en rectángulos

Cada pregunta del árbol es literalmente un corte recto en el espacio de los datos: "¿hip-hop?" separa todas las canciones en dos grupos según una sola característica, "¿enérgica?" vuelve a dividir uno de esos dos grupos según otra. Apilar varias preguntas equivale, por tanto, a dividir el espacio en **rectángulos** (un rectángulo por hoja), cada uno correspondiente a una combinación precisa de respuestas:

```
energía
   |  No-Deporte │  No-Deporte
   |             │
   |─────────────┼─────────────
   |  No-Deporte │   Deporte
   |             │
   +──────────────────────────── hip-hop (0 = no, 1 = sí)
```

El árbol y esta división en rectángulos son **el mismo objeto** visto de dos formas distintas: leer el árbol de arriba a abajo equivale a recorrer los rectángulos.

## En código

```python
from sklearn.tree import DecisionTreeClassifier

# X: [hip-hop (0/1), enérgica (0/1), tarde por la noche (0/1)]; y: lista Deporte (1) o no (0)
X = [[1, 1, 0], [1, 1, 1], [0, 1, 0], [1, 0, 0], [0, 0, 1]]
y = [1, 0, 0, 0, 0]

modelo = DecisionTreeClassifier(max_depth=3)   # max_depth: limita el número de preguntas en cascada
modelo.fit(X, y)

modelo.predict([[1, 1, 0]])           # [1] -> clasificado "Deporte"
modelo.feature_importances_            # importancia relativa de cada característica en las decisiones del árbol
```

## Cómo elige el árbol sus preguntas

En cada nodo, el algoritmo prueba todas las características y todos los umbrales posibles, y retiene la pregunta que hace que los dos grupos resultantes sean lo más **puros** posible (cada grupo contiene, en la medida de lo posible, una sola categoría, no una mezcla). Esta pureza se mide con la **impureza de Gini** o la **entropía**, dos fórmulas basadas en las [probabilidades](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base) de cada categoría en un grupo: cuanto más mezclado está un grupo (probabilidades cercanas entre categorías), más alta es su impureza. El algoritmo repite esta elección recursivamente en cada nuevo grupo, hasta una profundidad máxima (`max_depth`) o hasta llegar a hojas ya puras.

## Trampa: un árbol demasiado profundo memoriza en lugar de aprender

Sin límite de profundidad, un árbol puede seguir haciendo preguntas hasta aislar cada ejemplo de entrenamiento en su propia hoja: una puntuación perfecta en el entrenamiento, pero un [sobreajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-y-subajuste-underfitting) severo, ya que el árbol ha aprendido los ejemplos concretos en lugar de un patrón general. `max_depth`, o un número mínimo de ejemplos requerido por hoja (`min_samples_leaf`), limitan este riesgo.

> **Ventaja a destacar:** a diferencia de la regresión lineal/logística, un árbol de decisión no necesita ningún escalado previo de las entradas (una característica en decenas y otra en millones no lo perturban): siempre compara una sola característica con un umbral a la vez, nunca una suma ponderada entre ellas.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un árbol de decisión clasifica mediante una serie de preguntas binarias, cada una un corte recto en el espacio de los datos; el conjunto de las hojas forma una división en rectángulos. |
| **Herramientas utilizables** | `sklearn.tree.DecisionTreeClassifier`, `max_depth`, `min_samples_leaf`, `.feature_importances_`. |
| **Trampas a evitar** | Dejar que el árbol crezca sin límite (sobreajuste casi garantizado). |
| **Buenas prácticas** | Fijar `max_depth`/`min_samples_leaf` desde el principio; aprovechar que este tipo de modelo no necesita escalado. |
