---
order: 16
---

# Matplotlib — Visualizing Data

**Matplotlib** is the most widely used visualization library in Python—most other graphics libraries (Seaborn, Pandas`.plot()`, etc.) are built on top of it or are directly inspired by it.

## The Two Ways to Use Matplotlib

```python
import matplotlib.pyplot as plt

# "pyplot" API (default, quick to write):
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("Un graphique simple")
plt.show()

# Object-oriented API (explicit; recommended as soon as the graph becomes more complex):
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("Un graphique simple")
plt.show()
```

> **Note:** The `pyplot` API maintains an implicit global state (the "current figure")—which is convenient for a quick single-line plot, but can be confusing when working with multiple plots at once. `fig, ax = plt.subplots()` makes it explicit what each command acts on (`ax`), which is preferable for any code intended to be reused.

## `Figure` and `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figure*): The window/entire image may contain multiple graphs.
- `ax` (*Axes*): a specific area within the figure where you draw.

## Common Types of Charts

```python
ax.plot(x, y)              # curve (solid line)
ax.scatter(x, y)            # scatter plot
ax.bar(categories, values)  # bar chart
ax.hist(data, bins=20)     # histogram (distribution of a variable)
ax.boxplot(data)            # box-and-whisker plot (median, quartiles, outliers)
```

## Formatting a Chart

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Ventes 2025", color="blue")
ax.set_xlabel("Mois")
ax.set_ylabel("Ventes (€)")
ax.set_title("Évolution des ventes")
ax.legend()             # displays the legend (based on the provided "label=" attributes)
ax.grid(True)             # adds a grid, which is often useful for reading precise values
```

## Multiple charts in a single figure

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 row, 2 columns -> 2 drawing areas

axes[0].plot(x, y)
axes[0].set_title("Courbe")

axes[1].hist(data)
axes[1].set_title("Distribution")

plt.tight_layout()   # automatically adjusts spacing to prevent overlaps
```

## Save a chart

```python
fig.savefig("graphique.png", dpi=300)   # dpi: resolution of the exported image
```

## Link to pandas

```python
data["age"].plot(kind="hist")   # pandas delegates directly to Matplotlib internally
```

The pandas "`.plot()`" (see the dedicated chapter) is simply a convenient wrapper around Matplotlib—understanding Matplotlib allows you to customize any plot generated in this way.
