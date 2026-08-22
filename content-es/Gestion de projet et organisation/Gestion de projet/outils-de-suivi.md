---
order: 4
---

# Las herramientas de seguimiento

Un [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) priorizado y [estimado](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) necesita un lugar donde vivir concretamente, visible para todo el equipo y actualizado a medida que avanza el trabajo. Ese es el papel de una herramienta de seguimiento, ya sea digital o completamente física.

## El ticket: la unidad básica

Un **ticket** representa una unidad de trabajo identificable: una user story, un bug, una tarea técnica. Cada ticket lleva un título, una descripción, un estado (por hacer / en curso / terminado, o más estados según el flujo del equipo), y generalmente una persona asignada.

```text
Ticket #142
Título    : Añadir un email de confirmación tras el pedido
Estado    : En curso
Asignado a: Alicia
Puntos    : 5
```

Este vocabulario ("ticket") viene originalmente de las herramientas de soporte técnico (un problema notificado = un ticket), adoptado después por las herramientas de gestión de proyectos para designar cualquier unidad de trabajo seguida individualmente.

## El epic: agrupar tickets relacionados

Un **epic** agrupa varios tickets que contribuyen juntos a un objetivo común demasiado grande para ser un solo ticket: por ejemplo, "Rediseño del flujo de pago" puede agrupar los tickets "Añadir el pago por transferencia", "Simplificar el formulario de dirección", "Añadir un resumen antes de confirmar".

```text
Epic: Rediseño del flujo de pago
  ├── Ticket #140: Añadir el pago por transferencia
  ├── Ticket #141: Simplificar el formulario de dirección
  └── Ticket #142: Añadir un resumen antes de confirmar
```

Un epic da una visión de conjunto (« ¿cómo va este objetivo más amplio? ») sin tener que abrir cada ticket individualmente, y ayuda a descomponer un objetivo aún difuso en tickets lo bastante pequeños para ser estimados y desarrollados (ver el criterio **S** de la checklist [INVEST](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories)).

## El tablero (board): visualizar el flujo de trabajo

Un **tablero** (*board*) muestra los tickets en columnas que representan las etapas del flujo de trabajo, avanzando cada ticket de columna en columna a medida que progresa. Es la representación visual directa del principio ya visto en el capítulo sobre [metodologías](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) (tablero Kanban: Por hacer / En curso / Hecho).

```text
┌─────────────┬─────────────┬─────────────┐
│  Por hacer  │  En curso   │   Hecho     │
├─────────────┼─────────────┼─────────────┤
│ Ticket #143 │ Ticket #142 │ Ticket #140 │
│ Ticket #144 │             │ Ticket #141 │
└─────────────┴─────────────┴─────────────┘
```

Un tablero puede ser completamente **físico** (post-its en una pared, una práctica todavía habitual en algunos equipos presenciales) o **digital**, en una herramienta dedicada.

## Las herramientas digitales más extendidas

| Herramienta | Particularidad |
|---|---|
| **Jira** | Muy configurable (tipos de ticket, flujos personalizados), extendida en equipos grandes; fama de más pesada de aprender |
| **Trello** | Simple, centrada en el tablero Kanban, adecuada para equipos pequeños o necesidades poco estructuradas |
| **Linear** | Pensada para la rapidez de uso y el teclado, popular en equipos de producto/desarrollo |
| **Azure Boards** | Integrada en la suite Azure DevOps (ver el [capítulo dedicado](/?c=infrastructure-devops&s=ci-cd&p=azure-devops-plateforme)), práctica cuando el resto de la cadena (código, CI/CD) ya está en esa plataforma |

Ninguna de estas herramientas impone una metodología: la misma herramienta puede mostrar un tablero Kanban simple o sprints Scrum completos, según la configuración elegida por el equipo.

> **Trampa:** elegir una herramienta muy rica en funcionalidades (Jira, por ejemplo) para un equipo pequeño que solo necesita un tablero simple. Configurar y mantener una herramienta más compleja de lo necesario se convierte en una carga de trabajo en sí misma.
>
> **Buena práctica:** elegir una herramienta adaptada al tamaño y la madurez del equipo en lugar de la más completa disponible; un tablero físico o una herramienta simple basta de sobra para un equipo pequeño que empieza.

## Un tablero es un reflejo, no la realidad

Un ticket marcado como "Hecho" solo lo está realmente si el equipo mantiene el tablero actualizado de forma fiable y regular; un tablero que ya no refleja el estado real del trabajo pierde toda su utilidad (nadie puede confiar en él para saber cómo va realmente el proyecto).

> **Buena práctica:** actualizar el estado de un ticket en el momento en que el trabajo realmente cambia de estado, no de forma diferida o en bloque al final del día, para que el tablero siga siendo una fuente fiable en todo momento.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un ticket es la unidad de trabajo básica (título, estado, asignación); un epic agrupa varios tickets ligados a un objetivo común demasiado grande para un solo ticket. Un tablero visualiza el flujo de trabajo en columnas, físico o digital (Jira, Trello, Linear, Azure Boards). |
| **Herramientas utilizables** | Un tablero físico (post-its) para un equipo pequeño presencial. Jira, Trello, Linear o Azure Boards para un seguimiento digital, según el tamaño y las necesidades del equipo. |
| **Trampas a evitar** | Elegir una herramienta demasiado rica en funcionalidades para un equipo pequeño. Dejar que un tablero se desincronice del estado real del trabajo. |
| **Buenas prácticas** | Elegir una herramienta adaptada al tamaño y la madurez del equipo. Actualizar el estado de un ticket en el momento en que el trabajo realmente cambia de estado. |
