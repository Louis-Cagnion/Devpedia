---
order: 1
---

# ¿Qué es un pipeline CI/CD?

Después de subir un cambio a un repositorio [Git](/?c=git), alguien todavía debe reconstruir el proyecto, ejecutar sus tests, y luego desplegarlo. Hecho a mano en cada cambio, este trabajo es lento, repetitivo, y basta con olvidar un paso (relanzar los tests, por ejemplo) para dejar pasar un error. Un **pipeline CI/CD** automatiza exactamente esta secuencia de pasos.

## El problema: repetir los mismos pasos, sin olvidar nunca ninguno

```text
Sin automatización, en cada cambio:
desarrollador -> reconstruye el proyecto -> lanza los tests a mano -> despliega a mano

Un olvido en cualquier paso (tests no relanzados, versión equivocada desplegada...)
pasa desapercibido hasta que un usuario se topa con el problema en producción.
```

> **Trampa:** confiar en la disciplina humana para no saltarse nunca un paso. Bajo presión de plazo, un paso saltado "solo esta vez" (los tests, por lo general) es precisamente el que habría detectado el problema.
>
> **Buena práctica:** automatizar la secuencia de pasos de una vez por todas, para que ningún paso dependa ya de la memoria o la disciplina de quien sube el cambio.

## Integración continua (CI): construir y probar en cada cambio

La **integración continua** (*Continuous Integration*, CI) reconstruye el proyecto y ejecuta sus tests automáticamente en cada cambio subido al repositorio, antes de que nadie necesite pedirlo.

```text
push al repositorio -> dispara automaticamente -> construccion -> tests
                                                                     |
                                                    fallo <----------+----------> exito
                                              (el cambio no                 (el cambio se
                                             se integra, el                 integra, listo
                                            autor es avisado)                 para seguir)
```

> **Trampa:** ignorar un pipeline CI que falla pensando "lo corrijo más tarde", y seguir apilando cambios encima. Cada nuevo cambio se apoya entonces en una base ya rota, haciendo que el origen real del problema sea cada vez más difícil de aislar.
>
> **Buena práctica:** tratar un pipeline CI en fallo como bloqueante: corregir antes de añadir código nuevo encima, no después.

## Entrega continua y despliegue continuo (CD): dos niveles de automatización

**CD** designa en realidad dos prácticas diferentes, a menudo confundidas:

| | Entrega continua (*Continuous Delivery*) | Despliegue continuo (*Continuous Deployment*) |
|---|---|---|
| Lo que se automatiza | Preparar una versión lista para desplegar | Preparar **y** desplegar en producción |
| Paso humano restante | Un humano dispara la puesta en producción | Ninguno: la puesta en producción es automática tras un éxito en CI |
| Control | Más control antes de salir a producción | Salida a producción lo más rápida posible |

> **Trampa:** confundir ambas y suponer que un pipeline "CD" despliega automáticamente en producción, cuando quizás solo prepara una versión a la espera de validación humana (entrega continua).
>
> **Buena práctica:** aclarar explícitamente, para cada pipeline, si se detiene en una versión lista para desplegar o si llega hasta la puesta en producción automática, en lugar de suponer una u otra.

## El pipeline completo: una secuencia de pasos que deben tener éxito en orden

```text
commit -> build -> tests -> package -> despliegue (staging) -> despliegue (producción)
```

Cada paso solo se lanza si el anterior tuvo éxito: un fallo detiene el pipeline antes del paso siguiente, en lugar de dejar pasar un problema más adelante en la cadena.

> **Buena práctica:** ordenar los pasos del más rápido/económico al más lento/costoso (un test unitario antes de un despliegue completo, por ejemplo): un pipeline que falla lo hace lo antes posible, sin desperdiciar tiempo en los pasos siguientes.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un pipeline CI/CD automatiza la construcción, los tests y el despliegue de un proyecto en cada cambio. CI construye y prueba; CD (entrega continua o despliegue continuo, dos niveles diferentes) toma el relevo hasta una versión lista para desplegar, o incluso desplegada automáticamente. |
| **Herramientas utilizables** | [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme), [GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions), y otras plataformas equivalentes, para definir y ejecutar estos pasos automáticamente. |
| **Trampas a evitar** | Saltarse un paso "solo esta vez" bajo presión de plazo. Ignorar un pipeline CI en fallo y apilar código nuevo encima. Confundir entrega continua y despliegue continuo. |
| **Buenas prácticas** | Automatizar la secuencia de pasos para dejar de depender de la disciplina humana. Tratar un fallo de CI como bloqueante. Ordenar los pasos del más rápido al más lento. |
