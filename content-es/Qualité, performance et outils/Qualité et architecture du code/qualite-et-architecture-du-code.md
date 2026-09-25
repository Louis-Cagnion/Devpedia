---
order: 1
---

# Qualité et architecture du code

Un programa que produce el resultado correcto no es necesariamente un programa fácil de hacer evolucionar. Esta sección reúne principios de calidad y arquitectura que no dependen de un lenguaje en particular: se aplican tanto a un script [Python](/?c=langages-de-programmation&s=python&p=python) como a un proyecto [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) o una base de código C.

El hilo conductor es la **mantenibilidad**: un código que se entiende sin esfuerzo, que no repite la misma información en varios lugares, y donde un cambio permanece localizado en lugar de propagarse en cascada. Estos principios no son reglas estéticas: cada uno evita una categoría precisa de bug o de regresión, ilustrada con un caso concreto. Un último capítulo aborda la robustez de un tratamiento que se ejecuta sin supervisión: reanudar tras una interrupción, un recurso caído, un resultado vacío o un fallo.

A continuación encontrarás las distintas nociones:
