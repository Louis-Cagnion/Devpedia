---
order: 4
---

# Matplotlib: visualizing data

**Matplotlib** is the most widely used visualization library in Python: most other graphics libraries ([seaborn](https://seaborn.pydata.org), pandas`.plot()`, etc.) are built on top of it or are directly inspired by it.

## The Two Ways to Use Matplotlib

```python
import matplotlib.pyplot as plt

# "pyplot" API (implicit state, quick to write):
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("A simple graph")
plt.show()

# Object-oriented API (explicit; recommended as soon as the graphics become more complex):
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("A simple graph")
plt.show()
```

> **Note:** The API `pyplot` maintains an implicit global state (the "current figure"), which is convenient for quickly creating a single-line graph, but can be confusing when working with multiple graphs at once. `fig, ax = plt.subplots()` explicitly specifies what each command acts upon (`ax`), which is preferable for any code intended to be reused.

## `Figure` and `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figure*): the entire window or image; may contain multiple graphics.
- `ax` (*Axes*): a specific drawing area within the figure where you draw.

## Common Types of Charts

```python
ax.plot(x, y)              # curve (solid line)
ax.scatter(x, y)            # point cloud
ax.bar(categories, values)  # bar chart
ax.hist(data, bins=20)     # histogram (distribution of a variable)
ax.boxplot(data)            # box-and-whisker plot (median, quartiles, outliers)
```

## Formatting a chart

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Sales 2025", color="blue")
ax.set_xlabel("Month")
ax.set_ylabel("Sales (€)")
ax.set_title("Sales Trends")
ax.legend()             # Displays the legend (based on the provided "label=" attributes)
ax.grid(True)             # Adds a grid, which is often useful for reading precise values
```

## Multiple graphs in a single figure

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 row, 2 columns -> 2 layout areas

axes[0].plot(x, y)
axes[0].set_title("Curve")

axes[1].hist(data)
axes[1].set_title("Distribution")

plt.tight_layout()   # automatically adjusts spacing to prevent overlap
```

## Saving a graph

```python
fig.savefig("graphic.png", dpi=300)   # dpi: resolution of the exported image
```

## Link to pandas

```python
data["age"].plot(kind="hist")   # pandas delegates directly to Matplotlib internally
```

The [pandas](/?c=data-science&p=pandas) "`.plot()`" is simply a convenient wrapper around Matplotlib: understanding Matplotlib allows you to customize any plot generated with it.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Matplotlib plots graphs using a `Figure` (the entire image) and one or more `Axes` (a plot area). The object-oriented API (`fig, ax = plt.subplots()`) is preferable as soon as the graph becomes more complex. |
| **Tools available** | `plot` / `scatter` / `bar` / `hist` / `boxplot`, `savefig` for exporting. |
| **Pitfalls to Avoid** | Using the implicit `pyplot` API with multiple simultaneous graphs: this can lead to confusion about which graph a command affects. |
| **Best Practices** | Use explicit`fig, ax = plt.subplots()`s for all code intended for reuse. |
