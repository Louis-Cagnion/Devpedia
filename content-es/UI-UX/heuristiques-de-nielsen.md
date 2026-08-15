---
order: 5
---

# Heurísticas de usabilidad (Nielsen)

En 1994, el investigador en ergonomía Jakob Nielsen formuló diez reglas empíricas para evaluar si una interfaz es usable: ni un marco teórico, ni una checklist oficial, sino diez observaciones surgidas del análisis de cientos de interfaces defectuosas. Treinta años después, siguen siendo la referencia más citada del campo.

| # | Heurística | Qué exige | Ejemplo concreto | Trampa si se ignora |
|---|---|---|---|---|
| 1 | Visibilidad del estado del sistema | Informar al usuario de lo que está pasando, con una respuesta en un plazo razonable | Una barra de progreso durante una descarga, un mensaje "Guardado" tras un guardado | El usuario no sabe si su acción funcionó: hace clic varias veces, o abandona |
| 2 | Correspondencia entre el sistema y el mundo real | Usar las palabras y conceptos del usuario, no la jerga interna del sistema | Un icono de papelera para "eliminar", en lugar de un código de error técnico | El usuario debe adivinar o traducir mentalmente un lenguaje que no es el suyo |
| 3 | Control y libertad del usuario | Prever una "salida de emergencia" clara en caso de acción activada por error | Un botón "Deshacer" tras una eliminación, un "Anterior" en un formulario por etapas | El usuario se siente atrapado en un estado del que no puede volver |
| 4 | Coherencia y estándares | Nunca hacer que las mismas palabras o elementos digan cosas diferentes; seguir las convenciones de la plataforma | Un botón "Guardar" siempre en el mismo lugar de una pantalla a otra | El usuario debe reaprender la interfaz en cada pantalla en lugar de reutilizar lo que ya sabe |
| 5 | Prevención de errores | Diseñar para impedir un problema en lugar de mostrar un buen mensaje de error después | Deshabilitar un botón "Enviar" mientras un campo obligatorio esté vacío; pedir confirmación antes de eliminar | El usuario descubre el error solo después de haberlo cometido, a veces demasiado tarde para deshacerlo |
| 6 | Reconocimiento en lugar de recuerdo | Hacer visibles los objetos, acciones y opciones disponibles, sin exigir que se recuerden | Un historial de búsquedas recientes propuesto automáticamente | El usuario debe retener una información de una pantalla a otra: carga mental innecesaria |
| 7 | Flexibilidad y eficiencia de uso | Ofrecer atajos para el usuario experimentado, invisibles y sin molestar al principiante | Un atajo de teclado para una acción frecuente, además del botón visible | La interfaz sigue siendo tan lenta para un uso diario intensivo como para la primerísima visita |
| 8 | Estética y diseño minimalista | Mostrar solo la información realmente pertinente: cada elemento superfluo diluye a los demás | Un formulario que solo pide los campos estrictamente necesarios | Se relaciona con la [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle): demasiados elementos anulan la jerarquía deseada |
| 9 | Ayuda para el diagnóstico y la recuperación de errores | Un mensaje de error en lenguaje claro, que precise el problema y sugiera una solución | "La contraseña debe tener al menos 8 caracteres" en lugar de un simple código de error | El usuario sabe que hay un problema, pero no cuál ni cómo resolverlo |
| 10 | Ayuda y documentación | Una ayuda fácil de encontrar, centrada en las tareas reales del usuario, si la interfaz no se basta a sí misma | Una FAQ contextual accesible desde la pantalla en cuestión, no solo un manual genérico | El usuario bloqueado debe buscar ayuda en otro lugar (motor de búsqueda, foro) en lugar de ahí mismo |

> **Tendencia actual (2026):** estas diez reglas tienen treinta años, pero vuelven a estar vigentes frente al cansancio del diseño puramente experimental: el mismo movimiento de regreso a la claridad ya observado para la [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle) y [el espaciado](/?c=ui-ux&p=espacement-et-grille). Una interfaz que respeta estos diez puntos sigue siendo legible y usable incluso sin seguir la tendencia visual del momento.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las 10 heurísticas de Nielsen evalúan la usabilidad de una interfaz: visibilidad del estado, lenguaje familiar, libertad de control, coherencia, prevención de errores, reconocimiento en lugar de recuerdo, flexibilidad, minimalismo, diagnóstico de error claro, ayuda accesible. |
| **Herramientas utilizables** | Ninguna herramienta específica: estas heurísticas se usan como una lista de revisión manual de una interfaz ya diseñada o en curso de diseño. |
| **Trampas a evitar** | Ignorar una de estas reglas pensando que solo se aplica a un caso particular: cada una surge de observaciones repetidas sobre interfaces reales, no de una preferencia teórica. |
| **Buenas prácticas** | Revisar una maqueta o una interfaz existente contra las 10 heurísticas antes de la puesta en producción, anotando explícitamente dónde se respeta o no cada una. |
