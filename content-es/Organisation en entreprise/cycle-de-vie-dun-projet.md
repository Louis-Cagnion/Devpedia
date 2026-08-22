---
order: 2
---

# El ciclo de vida de un proyecto

Un proyecto siempre atraviesa las mismas grandes etapas, desde la idea inicial hasta su uso real, ya sea que el equipo trabaje en [cascada o en ágil](/?c=gestion-de-projet&p=methodologies-agile-scrum-kanban).

## Las etapas

```text
Recogida de necesidades -> Especificación -> Desarrollo -> Tests -> Despliegue -> Mantenimiento
```

- **Recogida de necesidades**: entender qué quiere el cliente o el negocio, a menudo vago al principio ("facilitar el seguimiento de pedidos") antes de precisarse.
- **Especificación**: formalizar esta necesidad en tickets o user stories explotables (ver [Documentación y comunicación en equipo](/?c=organisation-en-entreprise&p=documentation-et-communication-equipe)).
- **Desarrollo**: escribir el código que responde a la especificación.
- **Tests**: verificar que el comportamiento obtenido corresponde bien a la necesidad, no solo que el código se ejecuta sin error.
- **Despliegue**: poner la versión en producción, a menudo automatizado por un [pipeline CI/CD](/?c=ci-cd&p=pipeline-cicd).
- **Mantenimiento**: corregir los bugs descubiertos en uso real, hacer evolucionar el producto; generalmente la fase más larga del ciclo de vida completo.

## En cascada contra en ágil: una vez, o en bucle

En cascada, estas etapas se desarrollan una sola vez, en orden, sobre el conjunto del proyecto. En ágil (Scrum o Kanban), se repiten en cada incremento: cada sprint (o cada tarea, en Kanban) atraviesa su propia mini-especificación, desarrollo, tests y despliegue.

> **Trampa:** subestimar el mantenimiento tratándolo como un imprevisto una vez el proyecto "entregado". Un producto realmente usado genera bugs descubiertos en uso real y solicitudes de evolución continuamente: no es una anomalía, es la continuación normal y esperada del ciclo de vida.
>
> **Buena práctica:** presupuestar tiempo de mantenimiento desde la planificación inicial (una parte de capacidad del equipo reservada de forma continua, por ejemplo), en lugar de descubrirlo como una sorpresa después de la puesta en producción.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un proyecto siempre atraviesa recogida de necesidades, especificación, desarrollo, tests, despliegue y mantenimiento, una sola vez en cascada o en bucle en cada incremento en ágil. |
| **Herramientas utilizables** | Un pipeline CI/CD para automatizar el despliegue; tickets/user stories para formalizar la especificación. |
| **Trampas a evitar** | Tratar el mantenimiento como un imprevisto tras la puesta en producción en lugar de como una fase normal del ciclo de vida. |
| **Buenas prácticas** | Presupuestar tiempo de mantenimiento desde la planificación inicial. |
