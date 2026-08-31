---
order: 9
---

# Los SVM (separadores de margen máximo)

Un **SVM** (*Support Vector Machine*, separador de margen máximo) es un algoritmo de clasificación que, como los [árboles de decisión](/?c=donnees&s=data-science&p=arbres-de-decision), traza una frontera entre categorías, pero elige esa frontera según un criterio distinto: el mayor **margen** posible entre las dos categorías.

## La idea: la frontera más ancha posible

Para separar dos especies de flores (iris) a partir del largo y el ancho de sus pétalos, **varias rectas** pueden separar perfectamente los ejemplos de entrenamiento:

```
ancho pétalo
   |     ● ●
   |   ●   ●  ╲
   |  ●         ╲←── varias rectas posibles
   |       ○   ○  ╲
   |     ○   ○      ╲
   +──────────────────── largo pétalo
   ● especie A    ○ especie B
```

Un SVM no elige cualquiera de ellas: busca la que deja más espacio vacío a ambos lados, el **margen máximo**. En datos reales de iris, este margen mide por ejemplo 1.397 cm: la distancia entre la frontera y el ejemplo más cercano de cada lado.

## Los vectores de soporte: solo importan unos pocos puntos

Una vez encontrada la frontera de margen máximo, **solo los ejemplos situados exactamente sobre los bordes del margen** han influido en su ubicación: son los **vectores de soporte** (*support vectors*), que dan nombre al algoritmo. Todos los demás ejemplos, más alejados de la frontera, podrían haberse desplazado o eliminado sin cambiar en nada el resultado.

```python
from sklearn.svm import SVC

modelo = SVC(kernel="linear")
modelo.fit(X_entrenamiento, y_entrenamiento)

modelo.support_vectors_    # los únicos ejemplos que determinan la frontera (a menudo un puñado, entre cientos)
```

## El *kernel trick*: cuando una recta no basta

Si las dos categorías no son separables por una línea recta, un SVM con núcleo lineal (`kernel="linear"`) se estanca (ej.: 60% de clasificaciones correctas en un conjunto de datos no separable linealmente). El **kernel trick** cambia de núcleo (ej.: `kernel="rbf"`) para transformar implícitamente los datos hacia un espacio donde una separación se vuelve posible, produciendo una frontera curva en el espacio original:

```python
modelo_curvo = SVC(kernel="rbf")   # núcleo RBF: permite una frontera curva
modelo_curvo.fit(X_entrenamiento, y_entrenamiento)
# puede alcanzar el 100% donde kernel="linear" se estancaba en el 60%, en un problema no separable linealmente
```

Técnicamente, el núcleo evita calcular explícitamente las coordenadas en ese espacio transformado (potencialmente de muy alta dimensión): calcula directamente, mediante una fórmula matemática, hasta qué punto dos puntos estarían "cerca" una vez transformados, lo cual basta para el algoritmo sin construir nunca el espacio transformado en sí.

## Trampa: las entradas sin escalar distorsionan el margen

Un SVM mide **distancias** entre puntos para encontrar el margen máximo: una característica en millones (ej.: un salario) aplastaría por completo una característica en unidades (ej.: una edad) en ese cálculo de distancia, aunque la edad sea igual de relevante. A diferencia de los árboles de decisión, un SVM necesita entonces que todas las entradas estén en la misma escala antes del entrenamiento:

```python
from sklearn.preprocessing import StandardScaler

escalador = StandardScaler()
X_escalado = escalador.fit_transform(X_entrenamiento)   # centra y reduce cada columna (media 0, desviación típica 1)
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un SVM traza la frontera de clasificación que maximiza el margen entre categorías; solo los vectores de soporte (los puntos más cercanos a la frontera) determinan su ubicación. |
| **Herramientas utilizables** | `sklearn.svm.SVC`, `kernel="linear"`/`"rbf"`, `.support_vectors_`, `StandardScaler`. |
| **Trampas a evitar** | Entrenar sin escalar las entradas (distancias distorsionadas); mantener un núcleo lineal en datos no separables linealmente. |
| **Buenas prácticas** | Escalar sistemáticamente las entradas antes de un SVM; probar `kernel="rbf"` si `kernel="linear"` se estanca. |
