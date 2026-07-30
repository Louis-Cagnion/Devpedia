---
order: 16
---

# Matplotlib: visualización de datos

**Matplotlib** es la biblioteca de visualización más extendida en Python; la mayoría de las demás bibliotecas de gráficos (seaborn, pandas`.plot()` etc.) se basan en ella o se inspiran directamente en ella.

## Las dos formas de utilizar Matplotlib

```python
import matplotlib.pyplot as plt

# API «pyplot» (estado implícito, rápida de escribir):
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("Un graphique simple")
plt.show()

# API orientada a objetos (explícita, recomendada en cuanto el gráfico se vuelve más complejo):
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("Un graphique simple")
plt.show()
```

> **Nota:** la API `pyplot` mantiene un estado global implícito (la «figura actual»), lo cual resulta práctico para crear rápidamente un gráfico de una sola línea, pero puede generar confusión cuando se manipulan varios gráficos a la vez. `fig, ax = plt.subplots()` especifica explícitamente sobre qué actúa cada comando (`ax`), lo cual es preferible para cualquier código destinado a ser reutilizado.

## `Figure` y `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figura*): la ventana o la imagen completa, que puede contener varios gráficos.
- `ax` (*Ejes*): una zona de trazado precisa dentro de la figura, sobre la que se dibuja.

## Tipos de gráficos habituales

```python
ax.plot(x, y)              # curva (línea continua)
ax.scatter(x, y)            # nube de puntos
ax.bar(categories, valores)  # diagrama de barras
ax.hist(datos, bins=20)     # histograma (distribución de una variable)
ax.boxplot(datos)            # diagrama de caja y bigotes (mediana, cuartiles, valores extremos)
```

## Maquetar un gráfico

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Ventes 2025", color="blue")
ax.set_xlabel("Mois")
ax.set_ylabel("Ventes (€)")
ax.set_title("Évolution des ventes")
ax.legend()             # muestra la leyenda (a partir de los «label=» proporcionados)
ax.grid(True)             # Añade una tabla, que suele resultar útil para leer valores precisos.
```

## Varios gráficos en una misma figura

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 línea, 2 columnas -> 2 áreas de trazado

axes[0].plot(x, y)
axes[0].set_title("Courbe")

axes[1].hist(datos)
axes[1].set_title("Distribution")

plt.tight_layout()   # ajusta automáticamente los espacios para evitar solapamientos
```

## Guardar un gráfico

```python
fig.savefig("graphique.png", dpi=300)   # dpi: resolución de la imagen exportada
```

## Enlace a pandas

```python
datos["age"].plot(kind="hist")   # pandas recurre directamente a Matplotlib de forma interna
```

El «`.plot()`» de pandas (véase el capítulo dedicado) no es más que un atajo práctico sobre Matplotlib; comprender este último permite personalizar cualquier gráfico generado con él.
