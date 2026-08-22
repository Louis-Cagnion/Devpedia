---
order: 4
---

# Python

Un [lenguaje de programación](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) es un conjunto de reglas que permite escribir instrucciones que un ordenador puede ejecutar. Python es uno de ellos, conocido por su sintaxis voluntariamente cercana al lenguaje natural.

```python
nombre = "Devpedia"          # una variable, ver el capítulo dedicado
print(f"Hola, {nombre}")     # muestra: Hola, Devpedia
```

| Término | Qué significa |
|---|---|
| Alto nivel | Oculta casi por completo la gestión de la memoria y los detalles del hardware, en favor de la legibilidad |
| Tipado dinámico | Una variable no declara un tipo de antemano: adopta el tipo del valor que se le asigna, y puede cambiar en el transcurso del programa (ver [Las variables](/?c=langages-de-programmation&s=python&p=variables)) |
| Interpretado | El código no se traduce a instrucciones máquina nativas de antemano: un **intérprete** (un programa que lee y ejecuta código sobre la marcha, en lugar de en una única traducción previa) lo lee y lo ejecuta: un compromiso de legibilidad frente al rendimiento bruto de un lenguaje compilado como el [C](/?c=langages-de-programmation&s=c&p=c) |

> El intérprete de referencia de Python se llama **CPython**. Internamente, primero traduce el código a *bytecode* (una forma intermedia, más cercana a la máquina que el código fuente pero aún no instrucciones nativas) antes de ejecutarlo.

Gracias a su sintaxis accesible y su biblioteca estándar muy completa, Python permite avanzar rápido en problemas concretos. Hoy es central en varios ámbitos: el desarrollo web ([Django](https://www.djangoproject.com), [Flask](https://flask.palletsprojects.com)), la automatización, y sobre todo el cálculo científico y la inteligencia artificial ([NumPy](/?c=data-science&p=numpy), [pandas](/?c=data-science&p=pandas), [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)...), ver las categorías [Data Science](/?c=data-science&p=jupyter-notebooks) e [IA](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), que se apoyan casi por completo en este lenguaje.
