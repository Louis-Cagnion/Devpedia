---
order: 1
---

# Jupyter notebooks

A **Jupyter notebook** is an interactive document that combines executable code, results (including graphics displayed directly), and explanatory text (Markdown), the dominant working format in data science and machine learning for iterative data exploration.

## Code blocks and Markdown blocks

A notebook (`.ipynb` file) is a collection of **cells** of two types:

- **Code snippet**: written in [Python](/?c=langages-de-programmation&s=python&p=python), executable on its own (use `Shift+Input` to run it).
- **Markdown section**: formatted text (headings, lists, mathematical formulas using [LaTeX](https://www.latex-project.org)) to document the process alongside the code.

```python
# Cell 1 (code)
import pandas as pd
data = pd.read_csv("sales.csv")
```

```python
# Cell 2 (code)
data.describe()   # The result is displayed directly below the cell
```

## The kernel: the Python process behind the notebook

The **kernel** is the Python process that actually executes the code in the cells and maintains their state in memory (variables, imports, etc.) between executions: the notebook itself is merely an interface that sends code to the kernel and displays its results.

> **Note:** Restarting the kernel clears **all** variables in memory, as if the program were being restarted from scratch: the displayed cells remain visible on the screen, but their code is not re-executed until explicitly requested.

## The Pitfall of Nonlinear Execution

Unlike a traditional `.py` script (which is executed strictly from top to bottom), cells in a notebook can be executed **in any order**, and each can be executed multiple times:

```python
# Cell 1
x = 5
```

```python
# Cell 2
x = x * 2
```

If cell 2 is executed **several times in a row** without restarting cell 1, `x` doubles with each execution (10, then 20, then 40...): a common pitfall where the kernel’s “invisible” state no longer matches the visual order of the cells on the screen. If you have any doubts about the reproducibility of a result, *“Restart Kernel and Run All”* re-runs everything in order from top to bottom, ensuring a consistent state.

## Magic Commands (`%`, `%%`)

Special commands unique to Jupyter that are not part of the Python language itself:

```python
%matplotlib inline    # Displays Matplotlib plots directly below the cell, without a separate window
%timeit ma_fonction()   # automatically measures execution time over multiple iterations
%%time                  # (at the beginning of the cell) times the execution of the entire cell
```

## Why this format is suitable for data science

- See the result of a transformation (`DataFrame` or graph) immediately after the code that generates it, without having to wait for the entire script to finish.
- Explore in small, successive steps (load data, clean it, visualize it, train a model) without having to rerun everything each time you test.
- Document the process and results side by side (Markdown cells + charts), which is useful for sharing an analysis with others.

See also the chapters on [pandas](/?c=data-science&p=pandas) and [Matplotlib](/?c=data-science&p=matplotlib), the two most commonly used libraries within a notebook.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A notebook combines code cells and Markdown cells, which are executed in a potentially non-linear order: the kernel preserves state between executions, regardless of the visual order of the cells. |
| **Available tools** | `%matplotlib inline` (`%timeit`), *Restart Kernel*, *and Run All* to ensure a consistent state. |
| **Pitfalls to Avoid** | Executing cells out of order and assuming that the displayed result reflects the kernel's actual state. |
| **Best Practices** | If you are unsure whether a result is reproducible, *restart the kernel and run all processes* again. |
