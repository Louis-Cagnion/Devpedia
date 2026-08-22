---
order: 7
---

# El TDD (Test-Driven Development)

Hasta ahora, cada tipo de prueba se ha presentado como una verificación escrita **después** del código, para asegurarse de que funciona. El **TDD** (*Test-Driven Development*, desarrollo guiado por pruebas) invierte ese orden: la prueba se escribe **antes** del código que verifica, y es esa prueba la que guía la escritura del código, no al revés.

## El ciclo rojo / verde / refactor

El TDD se organiza en un ciclo corto, repetido para cada pequeño fragmento de comportamiento a añadir:

| Etapa | Color | Qué ocurre |
|---|---|---|
| **1. Escribir una prueba que falla** | 🔴 Rojo | La prueba describe un comportamiento que aún no existe; falla forzosamente, ya que el código no existe |
| **2. Escribir el código mínimo que la hace pasar** | 🟢 Verde | Solo lo justo de código para que la prueba pase, sin anticipar necesidades futuras |
| **3. Mejorar el código sin cambiar su comportamiento** | 🔵 Refactor | Limpiar, clarificar, eliminar duplicación; las pruebas ya escritas garantizan que el comportamiento sigue siendo idéntico |

```text
Ciclo TDD para "calcularDescuento(precio, porcentaje)":

1. Rojo     : escribir test_calcularDescuento_aplica_10_porciento()
              -> falla, la función aún no existe

2. Verde    : escribir calcularDescuento() con lo estrictamente
              necesario para hacer pasar ESTA prueba concreta
              -> la prueba pasa

3. Refactor : limpiar el código si hace falta (renombrar una
              variable, simplificar un cálculo), relanzando la
              prueba en cada cambio para verificar que sigue pasando
```

Este ciclo se repite después para el siguiente comportamiento a añadir (por ejemplo, gestionar un porcentaje a cero), manteniendo cada iteración deliberadamente corta.

> **Trampa:** escribir, en la etapa verde, más código del estrictamente necesario para hacer pasar la prueba en curso (anticipar un caso aún no probado). El código no cubierto por una prueba en esta etapa sigue sin verificar, pese a la apariencia de rigor del TDD.
>
> **Buena práctica:** en la etapa verde, escribir el código más simple posible que haga pasar la prueba, generalizándolo más tarde solo cuando una nueva prueba lo exija realmente.

## Por qué escribir la prueba primero cambia algo

Escribir la prueba antes del código obliga a responder una pregunta precisa antes de codificar nada: ¿cuál es el resultado esperado, exactamente, para esta entrada concreta? Esta clarificación tiene un efecto directo en el diseño del código: una función pensada para probarse fácilmente (entradas y salidas claras, pocas dependencias ocultas) es también, en general, una función más simple de entender y reutilizar.

> **Trampa:** creer que el TDD garantiza por sí solo un código de buena calidad, independientemente de la reflexión de diseño. El TDD estructura el ritmo de escritura, pero no reemplaza los [criterios de calidad de código](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) habituales (responsabilidad única, bajo acoplamiento).
>
> **Buena práctica:** usar el TDD como una herramienta más entre otras para llegar a un código probable y bien diseñado, no como una garantía automática que exima de pensar en la arquitectura.

## El TDD no es obligatorio para tener pruebas

Escribir las pruebas después del código (el orden más habitual, y el seguido implícitamente en los capítulos anteriores de esta sección) sigue siendo perfectamente válido: el TDD es una **disciplina de escritura**, no una condición para que una prueba tenga valor. Algunas situaciones se prestan mejor a ello que otras: una regla de negocio bien entendida desde el principio se presta bien al TDD; un problema aún difuso, donde la exploración precede a la comprensión de la necesidad, suele prestarse mejor a escribir primero un borrador de código, y las pruebas después, una vez estabilizado el comportamiento.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El TDD escribe la prueba antes del código, siguiendo un ciclo corto rojo (prueba que falla) / verde (código mínimo que la hace pasar) / refactor (limpieza sin cambiar el comportamiento). Estructura el diseño pero no reemplaza los criterios de calidad de código habituales. |
| **Herramientas utilizables** | El ciclo rojo/verde/refactor como ritmo de escritura. |
| **Trampas a evitar** | Escribir más código del necesario en la etapa verde. Creer que el TDD garantiza por sí solo un código bien diseñado. |
| **Buenas prácticas** | En la etapa verde, escribir el código más simple que haga pasar la prueba. Usar el TDD como una herramienta más entre otras, no una garantía automática de calidad. |
