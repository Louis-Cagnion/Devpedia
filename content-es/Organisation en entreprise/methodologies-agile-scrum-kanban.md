---
order: 2
---

# Metodologías: Agile, Scrum, Kanban

Una vez establecidos los [roles de un equipo](/?c=organisation-en-entreprise&p=roles-equipe-developpement), queda organizar concretamente el trabajo en el tiempo. Varias metodologías responden a esta pregunta, con compromisos diferentes.

## El ciclo en cascada: planificar todo antes de empezar

El **ciclo en cascada** (*waterfall*) encadena fases completas unas tras otras: especificación entera, luego desarrollo entero, luego tests enteros, luego despliegue.

```text
Especificacion -> Desarrollo -> Tests -> Despliegue
   (100%)           (100%)      (100%)     (100%)
```

> **Trampa:** descubrir una necesidad mal entendida durante los tests, al final del todo del proyecto. Habiéndose hecho ya el desarrollo entero sobre esa base, corregir equivale a rehacer una gran parte del trabajo ya realizado.
>
> **Buena práctica:** entregar en pequeños incrementos en lugar de en un solo bloque, para detectar una necesidad mal entendida tras unos días de trabajo, no tras varios meses: es exactamente el principio que la agilidad generaliza.

## La agilidad: entregar poco y a menudo

La **agilidad** (*Agile*) divide el trabajo en incrementos cortos, cada uno entregando algo utilizable, para detectar pronto los problemas en lugar de al final de un ciclo largo. Scrum y Kanban son dos formas concretas de estructurar esta idea.

## Scrum: sprints de duración fija

**Scrum** organiza el trabajo en **sprints**: periodos de duración fija (a menudo dos semanas), cada uno terminando con un incremento entregable. Cuatro rituales marcan el ritmo de cada sprint:

| Ritual | Momento | Objetivo |
|---|---|---|
| **Sprint planning** | Inicio de sprint | Elegir qué se hará durante ese sprint |
| **Daily standup** | Cada día | Sincronizar al equipo en unos minutos (hecho ayer, previsto hoy, bloqueos) |
| **Sprint review** | Fin de sprint | Mostrar lo que se ha entregado, recoger feedback |
| **Retrospectiva** | Fin de sprint | Ajustar la forma de trabajar para el sprint siguiente |

## Kanban: un flujo continuo, sin sprint

**Kanban** no tiene periodo fijo: el trabajo avanza en flujo continuo sobre un tablero de columnas (Por hacer / En curso / Hecho), con un **límite de trabajo en curso** (*WIP limit*): un número máximo de tareas permitidas simultáneamente en una misma columna.

```text
Por hacer        En curso (max 2)     Hecho
---------        -----------------    --------
Tarea C          Tarea A              Tarea X
Tarea D          Tarea B              Tarea Y
Tarea E
```

> **Trampa:** dejar que cada uno empiece una nueva tarea en cuanto tiene un momento libre, sin límite de trabajo en curso. Diez tareas empezadas y ninguna terminada no avanzan más rápido que una sola tarea a la vez: se bloquean mutuamente (espera de retorno, dependencias cruzadas) sin que ninguna progrese hasta el final.
>
> **Buena práctica:** fijar un límite de trabajo en curso por columna, y respetarlo incluso cuando alguien se queda sin tarea: terminar lo que ya está empezado antes de comenzar uno nuevo.

## Comparativa

| | Cascada | Scrum | Kanban |
|---|---|---|---|
| Planificación | Entera, por adelantado | Por sprint | Continua, tarea por tarea |
| Ritmo de entrega | Una vez, al final del proyecto | Regular (fin de cada sprint) | Continuo, sobre la marcha |
| Adecuado para | Necesidad ya completamente conocida y estable | Un producto con entregas regulares planificables | Un flujo de solicitudes irregular (soporte, mantenimiento) |

> **Trampa:** adoptar el vocabulario Scrum (sprint, daily) sin los rituales que le dan su sentido, conformándose con renombrar las reuniones ya existentes. El vocabulario solo no cambia nada en la forma real de trabajar.
>
> **Buena práctica:** elegir una metodología según la naturaleza del trabajo (Scrum para entregas regulares planificadas, Kanban para un flujo irregular), no por moda, y aplicar sus rituales de verdad en lugar de conservar solo los nombres.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El ciclo en cascada planifica todo por adelantado; la agilidad entrega en pequeños incrementos para detectar los problemas antes. Scrum estructura estos incrementos en sprints con rituales fijos; Kanban organiza un flujo continuo limitado por un tope de trabajo en curso. |
| **Herramientas utilizables** | Un tablero Kanban (columnas Por hacer / En curso / Hecho); los cuatro rituales Scrum (planning, daily, review, retrospectiva). |
| **Trampas a evitar** | Descubrir una necesidad mal entendida al final del todo de un ciclo en cascada. Dejar que el trabajo en curso se acumule sin límite. Adoptar el vocabulario Agile sin sus rituales reales. |
| **Buenas prácticas** | Entregar en pequeños incrementos para detectar los problemas pronto. Fijar y respetar un límite de trabajo en curso. Elegir la metodología según la naturaleza del trabajo, no por moda. |
