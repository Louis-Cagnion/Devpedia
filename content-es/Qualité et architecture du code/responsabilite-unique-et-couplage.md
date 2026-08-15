---
order: 1
---

# Responsabilidad única y bajo acoplamiento

Una función, una clase o un archivo que hace "un poco de todo" parece práctico en el momento (todo está en el mismo lugar) pero se convierte en el primer obstáculo en cuanto hay que hacerlo evolucionar: un cambio para una necesidad hace descarrilar involuntariamente otro uso del mismo archivo, porque los dos nunca fueron realmente independientes.

## La verdadera prueba: el motivo del cambio

La pregunta a hacerse no es *"¿este archivo es demasiado largo?"* sino *"si tengo que modificar esto, ¿es por el mismo motivo que aquello?"*. Dos fragmentos de código que cambian por motivos diferentes (uno porque evoluciona la lógica de negocio, el otro porque cambia el formato de visualización) deberían vivir en archivos diferentes, incluso si son cortos y están vinculados en el mismo flujo de ejecución.

Un ejemplo concreto: un módulo que mezclaba la renderización de un informe (formato del texto, tablas, resumen) y la gestión de un estado de reanudación (guardar en qué punto quedó un procesamiento interrumpido, para retomarlo más tarde). Ambos tenían su propio motivo de cambio (uno sigue las solicitudes de presentación, el otro sigue la lógica de recuperación ante errores) y terminaron viviendo en dos archivos separados (`report.py` para la renderización, `resume.py` para el estado de reanudación), cada uno testeable y comprensible sin el otro.

## La señal concreta para dividir un archivo

Dos señales, complementarias, indican que un archivo superó su responsabilidad única:

- **Responsabilidades que no comparten el mismo motivo de cambio**: la prueba de arriba, la más fiable pero también la más subjetiva.
- **Un tamaño que supera un umbral razonable** (a menudo citado alrededor de 700-800 líneas para un archivo de código): una señal más mecánica, que no es una causa en sí misma pero correlaciona fuertemente con un archivo que acumuló varias responsabilidades sin que nadie se diera cuenta.

Un archivo de tests de más de 1200 líneas, que cubre siete módulos distintos de un mismo proyecto, ilustra bien ambas señales a la vez: cada módulo tiene su propio motivo de cambio (una evolución del parsing de especificaciones no debe afectar los tests de gestión del navegador), y el tamaño hacía el archivo difícil de navegar. La división en siete archivos, uno por módulo testeado, hizo cada parte legible y ejecutable de forma independiente.

## El bajo acoplamiento: la contrapartida

La responsabilidad única no basta si las partes, una vez separadas, dependen fuertemente de los detalles internas unas de otras: un archivo "separado" que debe releerse por completo en cada modificación de otro solo está separado en apariencia. El bajo acoplamiento significa que un módulo expone una interfaz clara (funciones, tipos) y que quienes lo llaman solo necesitan conocer esa interfaz, nunca su implementación interna.

> **Señal de alerta:** si modificar un detalle de implementación en un archivo obliga sistemáticamente a modificar otro archivo que solo lo llama, el acoplamiento es demasiado fuerte, incluso si cada archivo, tomado por separado, parece tener una responsabilidad clara.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un archivo que mezcla varios motivos de cambio se vuelve frágil: un cambio para una necesidad hace descarrilar otra. La verdadera prueba: "si modifico esto, ¿es por el mismo motivo que aquello?". |
| **Herramientas utilizables** | La señal de tamaño (~700-800 líneas) como indicio mecánico, complementario a la prueba del motivo de cambio. |
| **Trampas a evitar** | Separar archivos sin reducir el acoplamiento entre ellos: un archivo "separado" que debe releerse por completo en cada modificación de otro sigue acoplado, aunque parezca independiente. |
| **Buenas prácticas** | Dividir un archivo en cuanto dos responsabilidades distintas se mezclan en él, con una interfaz clara entre las partes surgidas de la división. |
