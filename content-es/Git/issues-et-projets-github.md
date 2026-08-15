---
order: 11
---

# Issues y gestión de proyecto en GitHub

Una **issue** es un ticket: un bug reportado, una funcionalidad solicitada, una pregunta, discutida en comentarios adjuntos a ese ticket. A diferencia de una [pull request](/?c=git&p=pull-requests-github), una issue no contiene ningún código: es una discusión estructurada, independiente de cualquier commit.

| | Issue | Pull request |
|---|---|---|
| ¿Contiene código? | No: únicamente texto y comentarios | Sí: una rama con commits reales |
| Sirve para | Reportar, discutir, planificar | Proponer y revisar un cambio concreto |
| Puede vincularse a | Una o varias pull requests que la cierran | Una o varias issues que cierra |

## Organizar las issues: labels, asignados, milestones

En un proyecto activo, decenas de issues abiertas en paralelo se vuelven rápidamente difíciles de seguir sin organización explícita:

| Herramienta | Papel |
|---|---|
| **Label** (etiqueta) | Categoriza una issue por palabra clave coloreada (`bug`, `documentation`, `prioridad alta`...), filtrable en la lista de issues |
| **Asignado** (*assignee*) | Designa quién es responsable de tratar esa issue precisa |
| **Milestone** (hito) | Agrupa varias issues y pull requests en torno a un objetivo común (una versión, una fecha límite), con una barra de progreso basada en las ya cerradas |

> **Buena práctica:** mantener un conjunto de labels reducido y coherente (tipo de problema, prioridad, estado) en lugar de crear uno nuevo para cada necesidad puntual: un label raramente reutilizado pierde su utilidad de filtrado.

## Las plantillas de issue (*issue templates*)

Una plantilla de issue prerellena el formulario de creación con las secciones esperadas (pasos para reproducir un bug, comportamiento esperado vs observado, entorno...), configurada una vez por los mantenedores del repositorio. Sin plantilla, cada persona que abre una issue decide por sí misma qué pone en ella, con un riesgo real de detalles faltantes (versión del software, pasos de reproducción) que ralentiza el tratamiento.

> **Trampa:** dejar un repositorio activo sin plantilla de issue, esperando que cada reporte de bug contenga naturalmente la información necesaria. En la práctica, una issue sin estructura impuesta a menudo olvida la información más útil para diagnosticarla.
>
> **Buena práctica:** configurar al menos una plantilla "reporte de bug" y una plantilla "solicitud de funcionalidad" en cuanto un repositorio acepta contribuciones externas.

## GitHub Projects: una vista Kanban por encima de las issues

**GitHub Projects** es un tablero (a menudo de estilo [**Kanban**](https://en.wikipedia.org/wiki/Kanban_board): columnas como "Por hacer" / "En curso" / "Terminado", cada tarjeta movida de una columna a otra a medida que avanza) que agrupa issues y pull requests de uno o varios repositorios, para una vista de conjunto del avance de un proyecto en lugar de una simple lista plana:

```text
Por hacer            En curso              Terminado
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Issue #12    │     │ Issue #9     │     │ Issue #3     │
│ Issue #15    │     │ PR #14       │     │ PR #7        │
└─────────────┘     └─────────────┘     └─────────────┘
```

Mover una tarjeta de una columna a otra no modifica ni la issue ni la pull request en sí: es una organización visual independiente, que además puede agrupar elementos provenientes de varios repositorios diferentes en un solo tablero.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una issue sigue un bug/una tarea/una discusión, sin código. Labels, asignados y milestones organizan un gran número de issues. GitHub Projects ofrece una vista Kanban por encima de las issues y pull requests, potencialmente de varios repositorios. |
| **Herramientas utilizables** | Labels, asignados, milestones, plantillas de issue, GitHub Projects. |
| **Trampas a evitar** | Multiplicar labels puntuales en lugar de un conjunto reducido y coherente. Dejar un repositorio activo sin plantilla de issue. |
| **Buenas prácticas** | Mantener un conjunto de labels reducido. Configurar plantillas de issue en cuanto un repositorio acepta contribuciones externas. |
