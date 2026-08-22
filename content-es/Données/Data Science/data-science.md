---
order: 2
---

# Data Science

Esta sección cubre las herramientas Python de la ciencia de datos: manipular grandes volúmenes de datos eficazmente (NumPy, pandas), explorarlos visualmente (Matplotlib, Jupyter), y construir modelos de machine learning clásicos (scikit-learn), en contraposición a las redes neuronales y los LLM, tratados en la sección [IA](/?c=ia).

El hilo conductor es el rendimiento: estas bibliotecas existen porque un bucle Python puro sobre millones de líneas es demasiado lento para un uso real (véase [Caché de CPU y vectorización (SIMD)](/?c=performance&p=cache-cpu-et-simd)); cada una delega el cálculo pesado a código compilado, a cambio de una forma particular de escribir ese cálculo (vectorizado en lugar de en bucle explícito).

A continuación encontrarás las distintas nociones:
