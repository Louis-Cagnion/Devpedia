---
order: 5
---

# La destilación de modelos

Un modelo de lenguaje voluminoso es muy capaz, pero lento y costoso de ejecutar. La **destilación** transfiere parte de sus capacidades a un modelo mucho más pequeño, rápido y económico, apoyándose en una analogía profesor/alumno.

## El principio: un profesor que genera los datos de entrenamiento del alumno

En lugar de entrenar el modelo pequeño (el **alumno**) solo con datos brutos encontrados en internet, se usa el modelo grande (el **profesor**) para producir él mismo las respuestas esperadas, razonamiento incluido, paso a paso. Esas respuestas generadas se convierten en los datos de entrenamiento del alumno:

```text
Modelo profesor (grande, lento, caro)
  --> genera respuestas con su razonamiento
  --> esas respuestas sirven como datos de entrenamiento
Modelo alumno (pequeno, rapido, barato)
  --> aprende a reproducir el MISMO tipo de razonamiento
```

El alumno nunca hereda los pesos internos del profesor: aprende un **patrón** de razonamiento a partir de ejemplos producidos por el profesor, igual que un alumno humano aprende un método a partir de ejercicios corregidos por su profesor, sin acceder nunca a su pensamiento.

## El resultado: menos capaz, pero mucho más rápido y barato

Un modelo destilado nunca iguala a su profesor, pero se mantiene sorprendentemente capaz en relación con su tamaño y su coste de ejecución. DeepSeek aplicó este método con su modelo R1: los datos de razonamiento generados por R1 sirvieron para entrenar modelos mucho más pequeños (de 1,5 a 70 mil millones de parámetros), con mejores resultados que si esos modelos pequeños hubieran tenido que descubrir solos ese razonamiento mediante [aprendizaje por refuerzo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## La pregunta que queda abierta: el permiso, no la técnica

La destilación en sí misma no tiene nada problemático: es un método de aprendizaje automático estándar, y muchos proveedores de modelos la permiten explícitamente en su licencia. Lo que distingue un uso legítimo de uno cuestionado nunca es la técnica, sino el **permiso**:

| Situación | Estado |
|---|---|
| Destilar el propio modelo hacia modelos más pequeños | Normal, ampliamente documentado y permitido |
| Destilar a partir de las respuestas de un modelo de terceros, sin autorización, violando sus condiciones de uso | Cuestionado: una cuestión de respeto de las condiciones de uso, no de la técnica en sí |

> **Trampa:** juzgar la destilación "aceptable" o no únicamente por su naturaleza técnica. El mismo método se vuelve legítimo o no según si el propietario del modelo profesor lo permite o lo prohíbe en sus condiciones de uso.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La destilación entrena un modelo pequeño (alumno) con las respuestas generadas por un modelo grande (profesor), sin copiar nunca sus pesos. El resultado es menos capaz que el profesor pero mucho más rápido y económico de ejecutar. |
| **Herramientas utilizables** | Ninguna herramienta específica: la destilación designa un método de entrenamiento, aplicable con cualquier framework de deep learning. |
| **Trampas a evitar** | Confundir la cuestión técnica (cómo destilar) con la cuestión de permiso (si se tiene derecho a destilar a partir de ese modelo concreto). |
| **Buenas prácticas** | Verificar la licencia del modelo profesor antes de cualquier destilación a partir de sus respuestas; destilar el propio modelo sigue siendo inequívoco. |
