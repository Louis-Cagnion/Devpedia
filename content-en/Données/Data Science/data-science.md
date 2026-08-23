---
order: 2
---

# Data Science

This section covers [Python](/?c=langages-de-programmation&s=python&p=python) tools for data science: efficiently handling large volumes of data (NumPy, pandas), visualizing it (Matplotlib, Jupyter), and building classical machine learning models (scikit-learn), as opposed to neural networks and LLMs, which are covered in the [AI](/?c=ia) section.

The common thread is performance: these libraries exist because a pure Python loop processing millions of lines is too slow for real-world use (see [CPU Cache and Vectorization (SIMD)](/?c=performance&p=cache-cpu-et-simd)); each one delegates the heavy computation to compiled code, in exchange for a specific way of writing that computation (vectorized rather than as an explicit loop).

You will find the various concepts below:
