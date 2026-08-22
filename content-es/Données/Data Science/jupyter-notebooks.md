---
order: 1
---

# Los cuadernos Jupyter

Un **cuaderno de Jupyter** es un documento interactivo que combina código ejecutable, resultados (incluidos gráficos que se muestran directamente) y texto explicativo (Markdown), el formato de trabajo predominante en ciencia de datos y aprendizaje automático para la exploración iterativa de datos.

## Celdas de código y celdas Markdown

Un cuaderno (archivo `.ipynb`) es una secuencia de **celdas** de dos tipos:

- **Bloque de código**: en Python, ejecutable de forma independiente (utiliza `Shift+Entrada` para ejecutarlo).
- **Celdas Markdown**: texto formateado (títulos, listas, fórmulas matemáticas mediante LaTeX), para documentar el proceso junto al código.

```python
# Célula 1 (código)
import pandas as pd
datos = pd.read_csv("ventes.csv")
```

```python
# Célula 2 (código)
datos.describe()   # El resultado se muestra directamente debajo de la celda.
```

## El kernel: el proceso de Python que hay detrás del notebook

El **kernel** es el proceso de Python que ejecuta realmente el código de las celdas y conserva su estado en memoria (variables, importaciones...) entre ejecuciones; el propio cuaderno no es más que una interfaz que envía código al kernel y muestra sus resultados.

> **Nota:** al reiniciar el núcleo (*Restart Kernel*) se borran **todas** las variables de la memoria, como si se reiniciara el programa desde cero; las celdas mostradas siguen siendo visibles en la pantalla, pero su código no se vuelve a ejecutar hasta que se solicite explícitamente.

## La trampa de la ejecución no lineal

A diferencia de un script clásico de`.py`e (que se ejecuta estrictamente de arriba abajo), las celdas de un cuaderno se pueden ejecutar **en cualquier orden**, y cada una de ellas varias veces:

```python
# Célula 1
x = 5
```

```python
# Célula 2
x = x * 2
```

Si se ejecuta la celda 2 **varias veces seguidas** sin volver a ejecutar la celda 1, `x` se duplica en cada ejecución (10, luego 20, luego 40...): una trampa clásica en la que el estado «invisible» del kernel ya no se corresponde con el orden visual de las celdas en pantalla. En caso de duda sobre la reproducibilidad de un resultado, la opción *«Restart Kernel and Run All»* vuelve a ejecutar todo en orden de arriba abajo, lo que garantiza un estado coherente.

## Comandos mágicos (`%`, `%%`)

Comandos especiales, propios de Jupyter, que no están presentes en el propio lenguaje Python:

```python
%matplotlib inline    # muestra los gráficos de Matplotlib directamente debajo de la celda, sin una ventana separada
%timeit ma_fonction()   # mide automáticamente el tiempo de ejecución, tras varias repeticiones
%%time                  # (al principio de la celda) mide el tiempo de ejecución de toda la celda
```

## ¿Por qué este formato es adecuado para la ciencia de datos?

- Ver inmediatamente el resultado de una transformación (un «`DataFrame`», un gráfico) justo después del código que la genera, sin tener que esperar a que termine todo el script.
- Explorar por pequeños pasos sucesivos (cargar los datos, limpiarlos, visualizarlos, entrenar un modelo) sin tener que volver a ejecutar todo el proceso en cada prueba.
- Documentar el proceso y los resultados en paralelo (celdas Markdown + gráficos), lo cual resulta útil para compartir un análisis con otras personas.

Consulta también los capítulos sobre pandas y Matplotlib, las dos bibliotecas más utilizadas en un cuaderno.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un cuaderno mezcla celdas de código y celdas Markdown, ejecutadas en un orden potencialmente no lineal: el kernel conserva el estado entre ejecuciones, independientemente del orden visual de las celdas. |
| **Herramientas utilizables** | Comandos mágicos (`%matplotlib inline`, `%timeit`), *Restart Kernel and Run All* para garantizar un estado coherente. |
| **Trampas a evitar** | Ejecutar las celdas en desorden y creer que el resultado mostrado refleja el estado real del kernel. |
| **Buenas prácticas** | Relanzar *Restart Kernel and Run All* en caso de duda sobre la reproducibilidad de un resultado. |
