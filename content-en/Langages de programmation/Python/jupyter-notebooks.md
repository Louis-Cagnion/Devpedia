---
order: 13
---

# Jupyter Notebooks

A **Jupyter notebook** is an interactive document that combines executable code, results (including graphs displayed directly), and explanatory text (Markdown), the dominant working format in data science and machine learning for iterative data exploration.

## Code Cells and Markdown Cells

A notebook (`.ipynb` file) is a collection of **cells** of two types:

- **Code block**: Python code that can be run independently (use `Shift+Enter` to run it).
- **Markdown cell**: formatted text (headings, lists, mathematical formulas using LaTeX) to document the process alongside the code.

```python
# Cell 1 (code)
import pandas as pd
data = pd.read_csv("ventes.csv")
```

```python
# Cell 2 (code)
data.describe()   # The result appears directly below the cell
```

## The kernel: the Python process behind the notebook

The **kernel** is the Python process that actually executes the code in the cells and maintains their state in memory (variables, imports, etc.) between executions: the notebook itself is merely an interface that sends code to the kernel and displays its results.

> **Note:** Restarting the kernel clears **all** variables in memory, as if the program were being restarted from scratch; the displayed cells remain visible on the screen, but their code is not re-executed until explicitly requested.

## The Pitfall of Nonlinear Execution

Unlike a traditional `.py` script (which is executed strictly from top to bottom), the cells in a notebook can be executed **in any order**, and each can be executed multiple times:

```python
# Cell 1
x = 5
```

```python
# Cell 2
x = x * 2
```

If you run cell 2 **several times in a row** without restarting cell 1, `x` doubles with each execution (10, then 20, then 40...), a common pitfall where the kernel’s “invisible” state no longer matches the visual order of the cells on the screen. If you’re unsure whether a result is reproducible, *“Restart Kernel and Run All”* reruns everything in order from top to bottom, ensuring a consistent state.

## Magic Commands (`%`, `%%`)

Special commands unique to Jupyter that are not part of the Python language itself:

```python
%matplotlib inline    # displays Matplotlib plots directly below the cell, without a separate window
%timeit ma_fonction()   # automatically measures the execution time over multiple repetitions
%%time                  # (at the beginning of the cell) times the execution of the entire cell
```

## Why This Format Is Well-Suited for Data Science

- See the result of a transformation (`DataFrame` or graph) immediately after the code that generates it, without having to wait for the entire script to finish.
- Explore in small, incremental steps (load the data, clean it, visualize it, train a model) without having to rerun everything each time you try something new.
- Document the process and results side by side (Markdown cells + charts), which is useful for sharing an analysis with others.

See also the chapters on pandas and Matplotlib, the two most commonly used libraries within a notebook.
