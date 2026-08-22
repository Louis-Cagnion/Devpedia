---
order: 2
---

# El backlog y las user stories

Una vez [elegida una metodología](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban), queda una pregunta concreta: ¿cómo describir el trabajo por hacer para que todo el equipo lo entienda de la misma forma y se pueda priorizar con el tiempo? El **backlog** y las **user stories** responden a esta pregunta, en el corazón de las metodologías ágiles como Scrum.

## El backlog: una lista priorizada, nunca fija

El **backlog** es la lista de todo el trabajo pendiente en un producto: nuevas funcionalidades, corrección de bugs, mejoras técnicas. A diferencia de un pliego de requisitos clásico, nunca está cerrado: los elementos se añaden, se eliminan o cambian de prioridad continuamente, a medida que el producto y sus necesidades evolucionan.

| Característica | Qué implica |
|---|---|
| **Priorizado** | Los elementos más importantes o urgentes están arriba, los menos claros o menos prioritarios abajo |
| **Vivo** | Revisado continuamente (a menudo durante un ritual dedicado, el *backlog refinement*), nunca escrito de una vez para siempre |
| **De granularidad variable** | Los elementos cercanos a la parte superior están detallados y listos para desarrollarse; los de abajo permanecen deliberadamente vagos hasta que están a punto de tomarse |

> **Trampa:** detallar en profundidad cada elemento del backlog desde su creación, incluso los que no se abordarán hasta dentro de varios meses. Una necesidad detallada demasiado pronto tiene buenas probabilidades de haber cambiado antes de ser desarrollada, dejando ese trabajo de redacción inútil.
>
> **Buena práctica:** detallar finamente un elemento del backlog solo justo antes de que se vaya a abordar, manteniendo los elementos lejanos deliberadamente aproximados.

## La user story: describir una necesidad desde el punto de vista del usuario

Una **user story** es una forma corta y estructurada de describir un elemento del backlog, centrada en la necesidad de la persona que usará la funcionalidad en lugar de en los detalles técnicos de su implementación. El formato más extendido:

```text
Como [rol],
quiero [acción o necesidad],
para [beneficio buscado].

Ejemplo:
Como clienta de una tienda online,
quiero recibir un email de confirmación tras mi pedido,
para saber que se ha registrado correctamente.
```

Este formato obliga a vincular siempre una funcionalidad a un beneficio concreto para alguien: una story que no puede expresarse así suele esconder una solución técnica disfrazada de necesidad ("como desarrollador, quiero migrar la base de datos"), en lugar de una necesidad real del usuario.

> **Trampa:** escribir user stories desde el punto de vista del equipo técnico en lugar de la persona que realmente usará el producto. Una tarea puramente técnica (migración, refactorización) no es una user story: se gestiona de otra forma (una tarea técnica en el backlog, sin forzar el formato "como").
>
> **Buena práctica:** si una story no puede escribirse de forma natural desde el punto de vista de un usuario real con un beneficio claro, probablemente no sea una user story.

## Los criterios de aceptación: definir "terminado"

Una user story sola no dice cuándo está realmente terminada. Los **criterios de aceptación** enumeran las condiciones precisas y verificables que deben cumplirse para considerar la story terminada:

```text
User story: "Como clienta, quiero recibir un email de
confirmación tras mi pedido, para saber que se ha registrado
correctamente."

Criterios de aceptación:
- El email se envía en los 5 minutos siguientes al pedido
- El email contiene el número de pedido y el importe total
- Si el envío falla, el pedido no queda bloqueado por ello
```

Estos criterios también sirven de base para las [pruebas](/?c=tests&p=vocabulaire-qa-istqb) que verificarán que la funcionalidad funciona como se espera una vez desarrollada.

## INVEST: seis cualidades de una buena user story

**INVEST** es un acrónimo mnemotécnico que resume las cualidades esperadas de una user story bien formada:

| Letra | Cualidad | Significado |
|---|---|---|
| **I** | Independiente (*Independent*) | Puede desarrollarse sin esperar a que otra story termine primero |
| **N** | Negociable (*Negotiable*) | Describe una necesidad, no una solución impuesta: los detalles de implementación quedan por discutir |
| **V** | Valiosa (*Valuable*) | Aporta un valor claramente identificable para el usuario o el negocio |
| **E** | Estimable (*Estimable*) | Suficientemente clara para que el equipo pueda estimar el esfuerzo que requiere |
| **S** | Pequeña (*Small*) | Lo bastante pequeña para desarrollarse en unos días, no varias semanas |
| **T** | Verificable (*Testable*) | Sus criterios de aceptación permiten comprobar objetivamente si está terminada |

Una story demasiado grande o vaga para cumplir estos criterios generalmente se divide en varias stories más pequeñas, cada una aportando su propio valor independiente.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El backlog es una lista priorizada y viva de todo el trabajo pendiente. Una user story describe una necesidad desde el punto de vista del usuario ("como... quiero... para..."), completada con criterios de aceptación verificables. INVEST resume las cualidades de una buena story. |
| **Herramientas utilizables** | El formato "como / quiero / para" para redactar una story. La checklist INVEST para evaluar su calidad. |
| **Trampas a evitar** | Detallar en profundidad elementos lejanos del backlog. Escribir stories desde el punto de vista del equipo técnico en lugar del usuario. |
| **Buenas prácticas** | Detallar finamente un elemento solo justo antes de abordarlo. Comprobar que una story se escribe de forma natural desde el punto de vista de un usuario real. |
