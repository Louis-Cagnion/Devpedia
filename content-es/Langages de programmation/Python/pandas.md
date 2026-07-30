---
order: 15
---

# pandas: manipulación de datos tabulares

**pandas** ofrece dos estructuras para manipular datos tabulares: la «`Series`» (una sola columna, indexada) y el «`DataFrame`» (una matriz bidimensional con columnas con nombre), que es el equivalente en Python a una tabla SQL (véase el capítulo dedicado a ello) o a una hoja de cálculo, pero que se puede manipular mediante código.

## Crear un DataFrame

```python
import pandas as pd

datos = pd.DataFrame({
    "nom": ["Jean", "Marie", "Ali"],
    "age": [25, 30, 22],
    "ville": ["Lyon", "Paris", "Lyon"],
})
```

```
    nom  age  ville
0  Jean   25   Lyon
1 Marie   30  Paris
2   Ali   22   Lyon
```

## Cargar e inspeccionar datos

```python
datos = pd.read_csv("clients.csv")

datos.head()        # Las primeras 5 líneas
datos.info()          # tipos de columnas, valores perdidos, memoria utilizada
datos.describe()       # Estadísticas (media, desviación típica, mínimo/máximo) de las columnas numéricas
datos.shape             # (número_de_líneas, número_de_columnas)
datos.columns            # Lista de nombres de columnas
```

## Seleccionar columnas y filas

```python
datos["age"]             # una sola columna -> una serie
datos[["nom", "age"]]     # varias columnas -> un DataFrame

datos.loc[0]              # línea de ÍNDICE 0 (el índice que aparece a la izquierda de la tabla)
datos.iloc[0]              # línea de POSICIÓN 0 (siempre la primera, aunque se haya modificado el índice)
datos.loc[0, "nom"]         # valor exacto: fila 0, columna «nombre»
```

> **Nota:** `loc` selecciona por **etiqueta** (la etiqueta del índice, que puede ser un nombre, una fecha...), `iloc` por **posición numérica**; ambas coinciden por defecto (índice numérico de 0 a n), pero divergen en cuanto el índice se ha personalizado (p. ej., ordenado, filtrado o basado en fechas).

## Filtrar con una máscara booleana

```python
datos[datos["age"] > 25]
# solo conserva las líneas en las que la condición es verdadera -> equivalente a un «WHERE» en SQL

datos[(datos["age"] > 20) & (datos["ville"] == "Lyon")]
# Combinar varias condiciones: & (y), | (o) — NO «and»/«or», reservados para los booleanos simples
```

## `groupby` : agrupar por categoría

Equivalente directo del «`GROUP BY`» en SQL (véase el capítulo correspondiente):

```python
datos.groupby("ville")["age"].mean()
# ciudad
# Lyon     23,5
# París    30,0
```

```python
datos.groupby("ville").agg({"age": "mean", "nom": "count"})
# varias agregaciones a la vez, una por columna
```

## Fusionar dos DataFrames (`merge`)

Equivalente al lenguaje SQL «`JOIN`» (véase el capítulo correspondiente):

```python
commandes = pd.DataFrame({"client_id": [1, 2], "produit": ["Vélo", "Trottinette"]})
clients = pd.DataFrame({"id": [1, 2, 3], "nom": ["Jean", "Marie", "Ali"]})

pd.merge(commandes, clients, left_on="client_id", right_on="id")
# fusiona las dos tablas según la correspondencia client_id <-> id, como un INNER JOIN
```

## Añadir/modificar una columna

```python
datos["age_dans_10_ans"] = datos["age"] + 10   # nueva columna, calculada a partir de otra

datos["categorie"] = datos["age"].apply(lambda edad: "jeune" if edad < 30 else "senior")
# apply(): ejecuta una función sobre cada valor de la columna
```

> **Nota (rendimiento):** `.apply()` ejecuta la función de Python línea por línea, sin aprovechar la vectorización de NumPy (véase el capítulo dedicado a ello); para una condición sencilla como esta, `np.where(datos["edad"] < 30, "jeune", "senior")` hace exactamente lo mismo, pero mucho más rápido con un conjunto de datos grande. `.apply()` sigue siendo útil cuando la lógica es demasiado compleja para expresarla con las funciones vectorizadas de pandas/NumPy.

## Valores que faltan

```python
datos.isna()              # tabla de «True/False», «True» donde falta el valor (NaN)
datos.dropna()              # elimina las líneas que contengan al menos un valor que falte
datos.fillna(0)               # sustituye los valores que faltan por un valor por defecto
```

Véase también el capítulo sobre NumPy (las columnas de un DataFrame son, en realidad, «`ndarray`») y sobre SQL, cuyos conceptos (`WHERE`, `GROUP BY`, `JOIN`) se recogen aquí de forma prácticamente idéntica.
