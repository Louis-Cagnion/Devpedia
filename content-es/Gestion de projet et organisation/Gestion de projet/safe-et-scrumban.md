---
order: 5
---

# SAFe y Scrumban: los casos híbridos

El capítulo sobre las [metodologías](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) presentó Scrum y Kanban como dos enfoques distintos, cada uno adecuado a un tipo de trabajo diferente. Sin embargo, dos necesidades frecuentes no encajan en ninguno de los dos: coordinar Scrum a gran escala, en varios equipos, y gestionar un flujo que mezcla trabajo planificado con urgencias imprevistas. Este capítulo cubre las respuestas más habituales a estas dos necesidades.

## El problema de la escala

Scrum funciona bien para un único equipo, pero un producto complejo suele implicar varios equipos trabajando en el mismo producto, con dependencias entre ellos (un equipo esperando una API que desarrolla otro equipo, por ejemplo). Scrum por sí solo no define nada para coordinar este caso: cada equipo podría tener sus propios sprints, sin ninguna sincronización entre ellos.

## SAFe: sincronizar varios equipos Scrum

**SAFe** (*Scaled Agile Framework*) es un marco que extiende los principios ágiles a varios equipos que trabajan juntos en un mismo producto. Su mecanismo central: sincronizar los sprints de todos los equipos en un ritmo común, llamado **Program Increment** (PI), generalmente de 8 a 12 semanas que agrupan varios sprints.

```text
Program Increment (10 semanas, 5 sprints de 2 semanas):

Equipo A: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Equipo B: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Equipo C: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
          └── todos empiezan y terminan al mismo tiempo ──┘

PI Planning (antes del PI): todos los equipos se reúnen para
identificar las dependencias entre ellos antes de empezar
```

El **PI Planning**, una reunión que junta a todos los equipos antes de que empiece un Program Increment, sirve precisamente para detectar estas dependencias con antelación ("el equipo A necesita que el equipo B entregue tal funcionalidad antes de su propio sprint 3"), en lugar de descubrirlas sobre la marcha.

> **Trampa:** adoptar SAFe para un solo equipo, o para un producto sin dependencia real entre equipos. SAFe añade una capa de coordinación (roles adicionales, reuniones a mayor escala) que no aporta nada sin una necesidad real de sincronizar varios equipos entre sí.
>
> **Buena práctica:** reservar SAFe (o un marco de escalado equivalente) para los casos en que varios equipos trabajan realmente en un mismo producto con dependencias reales entre ellos; un único equipo sigue mejor servido por Scrum o Kanban solos.

## Scrumban: un flujo continuo con hitos de Scrum

**Scrumban** combina el flujo continuo de Kanban (sin sprints fijos, un límite de trabajo en curso) con algunos hitos puntuales tomados de Scrum (una reunión de planificación regular, una retrospectiva periódica), sin forzar una división estricta en sprints.

```text
Kanban puro:           flujo continuo, límite de trabajo en curso,
                        ningún hito temporal impuesto

Scrumban:               flujo continuo (como Kanban), + una
                        planificación y una retrospectiva a
                        intervalo regular (tomadas de Scrum)

Scrum puro:             sprints fijos, todo el ritual Scrum completo
```

Esta mezcla conviene particularmente a un equipo cuyo trabajo combina lo planificado (funcionalidades previstas de antemano) y lo imprevisto (soporte, incidentes urgentes): el flujo continuo de Kanban absorbe naturalmente lo imprevisto, mientras que los hitos puntuales de Scrum mantienen un ritmo regular de reflexión colectiva.

> **Trampa:** creer que Scrumban es una versión "ligera" de Scrum que se puede aplicar por defecto sin pensarlo. Scrumban responde a una necesidad precisa (flujo mixto planificado/imprevisto); aplicarlo a un trabajo enteramente planificable no aporta nada frente al Scrum clásico, con el mismo razonamiento ya visto en el capítulo de metodologías (elegir según la naturaleza del trabajo, no por costumbre).
>
> **Buena práctica:** elegir Scrumban específicamente cuando el trabajo mezcla realmente lo planificado y lo imprevisto; si no, el Scrum puro (todo planificable) o el Kanban puro (flujo enteramente irregular) siguen siendo más simples y suficientes.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | SAFe sincroniza varios equipos Scrum en un ritmo común (Program Increment), con un PI Planning para detectar las dependencias con antelación. Scrumban combina el flujo continuo de Kanban con hitos puntuales tomados de Scrum, adecuado a un trabajo que mezcla lo planificado y lo imprevisto. |
| **Herramientas utilizables** | El Program Increment y el PI Planning para coordinar varios equipos (SAFe). Una planificación y una retrospectiva a intervalo regular sobre un flujo Kanban (Scrumban). |
| **Trampas a evitar** | Adoptar SAFe sin una necesidad real de coordinar varios equipos dependientes. Aplicar Scrumban por defecto a un trabajo enteramente planificable. |
| **Buenas prácticas** | Reservar SAFe a los casos de varios equipos con dependencias reales. Elegir Scrumban solo para un flujo que mezcla realmente lo planificado y lo imprevisto. |
