---
order: 2
---

# La pirámide de pruebas

Un programa puede probarse en varios niveles: una única función aislada, varios componentes que trabajan juntos, o la aplicación entera desde la pantalla del usuario. Estos tres niveles no tienen el mismo coste ni la misma velocidad de ejecución, lo que plantea una pregunta real de organización: ¿cuántas pruebas escribir en cada nivel? La **pirámide de pruebas** es el modelo que responde a esta pregunta.

## Tres niveles, tres compromisos

| Nivel | Qué verifica | Velocidad | Coste de mantenimiento |
|---|---|---|---|
| **Prueba unitaria** | Una sola función o clase, aislada del resto del programa | Muy rápida (milisegundos) | Bajo: poco código que ajustar si la prueba se rompe |
| **Prueba de integración** | Varios componentes que interactúan (ej. el código y una base de datos) | Media (depende de los componentes reales implicados) | Medio: depende de componentes externos que pueden cambiar por su cuenta |
| **Prueba end-to-end** (*E2E*) | La aplicación entera, desde el punto de vista del usuario (ej. un navegador que hace clic realmente en los botones) | Lenta (segundos a minutos) | Alto: se rompe con el más mínimo cambio de interfaz, a menudo inestable (*flaky*) |

Una prueba unitaria aísla la función probada del resto del programa mediante **mocks** o **stubs** (sustitutos ficticios de las dependencias externas, detallados en el capítulo sobre arquitectura de pruebas): eso es lo que la hace rápida y fiable, pero no garantiza que las distintas partes del programa funcionen correctamente una vez ensambladas.

## La forma piramidal: mucho de rápido, poco de lento

```text
        /\
       /E2E\          <- pocas (lentas, caras de mantener)
      /------\
     /Integra-\       <- cantidad media
    /  ción    \
   /------------\
  /  Unitarias   \    <- muy numerosas (rápidas, baratas)
 /----------------\
```

Esta distribución no es arbitraria: viene directamente de la tabla anterior. Como las pruebas unitarias son rápidas y baratas, se puede permitir escribir muchas, lo que permite verificar un gran número de casos precisos. Como las pruebas E2E son lentas y frágiles, se mantienen pocas, reservadas a los flujos realmente críticos (ej. "un cliente puede completar un pedido de principio a fin") en lugar de a cada detalle.

> **Trampa:** el antipatrón del "cono de helado" invertido, una pirámide al revés donde la mayoría de las pruebas son E2E lentas y existen pocas pruebas unitarias. Resultado: una suite de pruebas que tarda horas en ejecutarse, falla a menudo por razones sin relación con un bug real (un retraso de red, un elemento de interfaz que se movió), y que el equipo termina ignorando o desactivando.
>
> **Buena práctica:** antes de añadir una prueba E2E, preguntarse si una prueba unitaria o de integración, más rápida y más estable, no cubriría ya el mismo riesgo.

## Lo que la pirámide no dice

La pirámide da una proporción a la que aspirar, no un número absoluto ni un orden de escritura obligatorio. Tampoco dice que un nivel reemplace a otro: una prueba unitaria que verifica que una función calcula correctamente un total, y una prueba E2E que verifica que ese total se muestra bien en pantalla tras un clic real, no prueban lo mismo y son complementarias. Los capítulos siguientes detallan cada nivel, así como la organización concreta de una suite de pruebas.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Tres niveles de prueba (unitaria, integración, end-to-end) tienen costes y velocidades muy distintos. La pirámide de pruebas recomienda muchas pruebas unitarias rápidas, menos pruebas de integración, y pocas pruebas E2E lentas reservadas a los flujos críticos. |
| **Herramientas utilizables** | Ninguna herramienta concreta en esta etapa: los capítulos siguientes cubrirán las herramientas propias de cada nivel. |
| **Trampas a evitar** | El "cono de helado" invertido: mayoría de pruebas E2E lentas y frágiles, pocas pruebas unitarias. |
| **Buenas prácticas** | Antes de añadir una prueba E2E, comprobar si un nivel más rápido no cubre ya el mismo riesgo. |
