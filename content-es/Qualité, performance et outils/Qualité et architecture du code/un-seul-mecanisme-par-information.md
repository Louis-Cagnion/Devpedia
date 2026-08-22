---
order: 7
---

# Un solo mecanismo por información

Cuando una misma información puede representarse mediante dos mecanismos diferentes que se superponen, el código encargado de interpretarla debe gestionar ambos, y rara vez gestiona bien el caso en que se contradicen. No es solo una cuestión de estilo: es una fuente directa de incoherencia silenciosa.

## Un ejemplo concreto

Un archivo [Markdown](https://commonmark.org) podría, en teoría, declarar su título de dos formas a la vez:

```markdown
---
title: Los punteros
order: 5
---

# Los punteros en C
```

El frontmatter dice "Los punteros", el cuerpo del archivo dice "Los punteros en C". ¿Cuál es el título verdadero? El generador del sitio debe elegir una regla de prioridad (¿gana el frontmatter? ¿gana el heading? ¿gana el último escrito?), y esa regla se convierte a su vez en una fuente de bugs: alguien modifica el heading pensando que cambia el título mostrado, sin saber que el frontmatter (invisible en una lectura rápida del archivo) prevalece.

Este sitio evita deliberadamente el problema: el frontmatter de un capítulo **nunca** lleva un campo `title`, solo metadatos de construcción (`order`, para el orden pedagógico). El título mostrado proviene únicamente del primer `# Heading` del cuerpo: una sola fuente, un solo lugar que modificar, ninguna regla de prioridad que documentar ni recordar.

## Por qué esto siempre complica el código, no solo el dato

El costo no se limita al riesgo de incoherencia en los datos: el código que **lee** ambos mecanismos debe él mismo contener la lógica de prioridad, lo que lo hace más pesado para un caso que nunca debió existir. Un parser que debe verificar "¿hay un frontmatter con un título? si no, buscar un heading" es más complejo, más difícil de testear, y más propenso a tratar un caso límite de forma distinta al otro mecanismo, que si una sola regla, sin excepción, se aplicara siempre.

## Cómo detectarlo

La señal aparece cada vez que dos mecanismos independientes pueden, tanto uno como el otro, producir o representar la misma información: un identificador derivado de un nombre de archivo Y almacenado por separado en base de datos; una configuración leída desde un archivo Y redefinida por una variable de entorno, sin que ninguno de los dos tenga prioridad clara por construcción; un estado calculado al vuelo Y guardado en caché, sin invalidación garantizada entre ambos.

En cada caso, la pregunta a resolver es la misma: **¿cuál de los dos mecanismos es la fuente, y cuál puede eliminarse o reducirse a una simple derivación del primero?** Mantener ambos "por si acaso" nunca elimina el riesgo: solo lo desplaza al momento, inevitable, en que terminarán divergiendo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Dos mecanismos capaces de representar la misma información (frontmatter + heading, archivo + variable de entorno...) obligan al código a elegir una regla de prioridad: una fuente de bugs en sí misma, no solo un estilo. |
| **Herramientas utilizables** | Una sola regla simple sin excepción (ej: el título siempre viene del `# Heading`, nunca de un campo `title` separado). |
| **Trampas a evitar** | Mantener dos mecanismos "por si acaso" pensando que se elimina el riesgo de incoherencia: eso solo lo desplaza al momento en que divergirán. |
| **Buenas prácticas** | Identificar cuál de los dos mecanismos es la verdadera fuente, y reducir el otro a una simple derivación del primero, o eliminarlo. |
