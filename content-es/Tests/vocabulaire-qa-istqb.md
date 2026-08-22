---
order: 1
---

# Vocabulario de las pruebas de software (QA, ISTQB)

Antes de escribir la más mínima prueba, hace falta un vocabulario común: sin él, "probar el código" puede significar diez cosas distintas según quién hable. Este capítulo sienta los términos que el resto de la sección reutilizará, apoyándose en los normalizados por el **ISTQB** (*International Software Testing Qualifications Board*), el organismo de referencia que certifica a los testers y armoniza este vocabulario en la industria. **QA** (*Quality Assurance*, aseguramiento de la calidad) designa, de forma más amplia, el conjunto de actividades destinadas a garantizar la calidad de un software, del cual las pruebas son solo una parte.

## Las piezas básicas de una prueba

| Término | Definición |
|---|---|
| **Caso de prueba** (*test case*) | Una situación precisa a verificar: una entrada dada, una acción, y el resultado esperado |
| **Plan de pruebas** (*test plan*) | El documento que describe la estrategia global de pruebas: qué probar, con qué medios, en qué orden |
| **Datos de prueba** (*test data*) | Los valores concretos usados para ejecutar un caso de prueba (ej. un email válido, uno mal formado) |
| **Resultado esperado** (*expected result*) | Lo que el programa debe producir si todo funciona correctamente, definido antes de ejecutar la prueba |
| **Resultado obtenido** (*actual result*) | Lo que el programa produce realmente al ejecutarse, comparado con el resultado esperado para juzgar si la prueba pasa |

```text
Caso de prueba: "Inicio de sesión con contraseña correcta"
  Datos de prueba: email="alicia@ejemplo.es", contraseña="buenaContraseña123"
  Acción: enviar el formulario de inicio de sesión
  Resultado esperado: redirección al panel de control
  Resultado obtenido: (observado en la ejecución, comparado con el esperado)
```

> **Trampa:** escribir un caso de prueba sin un resultado esperado preciso ("comprobar que funciona"). Sin una referencia clara, es imposible decir objetivamente si la prueba tuvo éxito o falló.
>
> **Buena práctica:** formular siempre el resultado esperado antes de ejecutar la prueba, nunca después de haber visto lo que produjo el programa.

## Pasar o fallar, y lo que sigue

Un caso de prueba **pasa** (*pass*) cuando el resultado obtenido coincide con el resultado esperado, y **falla** (*fail*) en caso contrario. Un fallo no significa automáticamente "bug en el programa": la propia prueba puede estar mal escrita (resultado esperado incorrecto, datos de prueba no válidos).

| Término | Definición |
|---|---|
| **Anomalía / bug** (*defect*) | Una discrepancia confirmada entre el comportamiento del programa y su comportamiento deseado, generalmente registrada en una herramienta de seguimiento (un ticket) |
| **No regresión** (*regression*) | El hecho de que una modificación del código rompa un comportamiento que antes funcionaba; una **prueba de no regresión** es una prueba que se vuelve a ejecutar tras cada cambio para detectar este caso |
| **Criterio de salida** (*exit criteria*) | La condición que define que una fase de pruebas ha terminado (ej. "el 100% de los casos de prueba críticos pasan", "cobertura de código ≥ 80%") |

> **Trampa:** dar por hecho que una prueba que falla es forzosamente un bug a corregir en el programa. La propia prueba puede estar en falta (resultado esperado erróneo, datos de prueba mal elegidos).
>
> **Buena práctica:** antes de corregir el programa, verificar que la prueba falla por el motivo correcto releyendo su resultado esperado y sus datos de prueba.

## Quién escribe y ejecuta las pruebas

| Término | Definición |
|---|---|
| **Prueba manual** | Una persona ejecuta a mano los pasos del caso de prueba y compara ella misma el resultado |
| **Prueba automatizada** | Un programa ejecuta el caso de prueba y compara automáticamente el resultado obtenido con el esperado |
| **Tester** | La persona (o el equipo) responsable de diseñar y ejecutar las pruebas, distinta de los desarrolladores en los proyectos que tienen este rol dedicado |

En muchos equipos actuales, los propios desarrolladores escriben buena parte de las pruebas automatizadas (en particular las pruebas unitarias, vistas en un capítulo posterior); el rol de tester dedicado se centra entonces en las pruebas que requieren una mirada externa o una visión de conjunto del producto.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El ISTQB normaliza el vocabulario de las pruebas de software; QA designa de forma más amplia el conjunto de actividades de aseguramiento de la calidad. Un caso de prueba compara un resultado obtenido con un resultado esperado definido de antemano. Una prueba que falla no es forzosamente un bug en el programa. |
| **Herramientas utilizables** | Ninguna herramienta práctica en esta etapa: este capítulo sienta el vocabulario, los capítulos siguientes abordarán la pirámide de pruebas y la arquitectura de pruebas. |
| **Trampas a evitar** | Escribir un caso de prueba sin un resultado esperado preciso. Corregir el programa antes de haber verificado que la propia prueba es correcta. |
| **Buenas prácticas** | Formular el resultado esperado antes de ejecutar la prueba. Verificar la prueba antes de corregir el programa en caso de fallo. |
