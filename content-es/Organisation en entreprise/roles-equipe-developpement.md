---
order: 1
---

# Los roles en un equipo de desarrollo

Un proyecto en empresa rara vez implica un solo tipo de persona: cada una de las preguntas "qué construir", "cómo construirlo" y "cuándo entregarlo" corresponde a un rol diferente, y confundir estos roles es una fuente frecuente de bloqueo.

## Quién hace qué

| Rol | Responde a la pregunta | Responsabilidad |
|---|---|---|
| **Product Owner (PO)** | ¿Qué construir? | Prioriza el backlog (la lista de necesidades a tratar), representa la necesidad de negocio o cliente |
| **Jefe de proyecto / Project Manager** | ¿Cuándo entregarlo? | Planificación, presupuesto, plazos, coordinación entre equipos |
| **Tech Lead** | ¿Cómo construirlo? | Referencia técnica, decide las elecciones de arquitectura |
| **Desarrollador** | - | Diseña y escribe el código |
| **QA / Tester** | ¿Funciona realmente? | Verifica el comportamiento antes de la puesta en producción |
| **Scrum Master / Agile coach** | - | Facilita el proceso, levanta bloqueos, sin autoridad jerárquica sobre el equipo |

> **Analogía:** construir una casa también separa a quien decide qué debe permitir hacer la casa (el futuro habitante, como el PO), a quien planifica los plazos y el presupuesto de la obra (el jefe de proyecto), y a quien decide cómo se sostiene la estructura (el arquitecto, como el Tech Lead). Confundir estos tres roles lleva a decisiones tomadas por la persona que no tiene la información para tomarlas.

## Quién decide en caso de desacuerdo

Cada rol tiene la última palabra en su propio dominio: el PO prioriza el "qué" (una funcionalidad puede esperar), el Tech Lead decide el "cómo" (tal enfoque técnico en lugar de otro), el jefe de proyecto gestiona el "cuándo" (un plazo se negocia o se desplaza).

> **Trampa:** dejar la ambigüedad sobre "quién decide qué" hasta que estalla un desacuerdo. Descubrir en pleno conflicto que nadie sabe quién tiene la última palabra alarga la resolución del propio desacuerdo.
>
> **Buena práctica:** aclarar explícitamente, desde la formación del equipo, quién decide sobre las decisiones de negocio, técnicas y de planificación, en lugar de dejar esta cuestión abierta hasta el primer desacuerdo.

## El Scrum Master no es un jefe

> **Trampa:** confundir al Scrum Master con un responsable que reparte tareas o evalúa el rendimiento. Su papel es facilitar el proceso (animar los rituales, retirar bloqueos), no mandar al equipo: en general no tiene ninguna autoridad jerárquica sobre él.
>
> **Buena práctica:** dirigirse al Scrum Master para desbloquear un obstáculo de proceso (una reunión que no sirve para nada, una dependencia que se alarga), no para obtener una decisión que corresponde al PO o al Tech Lead.

## QA y desarrollador: verificaciones complementarias, no redundantes

> **Trampa:** un desarrollador que entrega sin involucrar nunca a la QA, pensando "compila y los tests unitarios pasan, así que funciona". Los tests automatizados verifican lo que se escribieron para verificar; la QA (o tests más amplios) cubre también escenarios de uso real que el desarrollador no pensó en probar él mismo.
>
> **Buena práctica:** tratar la validación automatizada y la validación QA como dos redes complementarias, no como dos versiones de la misma red.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Product Owner (qué), jefe de proyecto (cuándo), Tech Lead (cómo), desarrollador (construye), QA (verifica), Scrum Master (facilita): roles distintos que responden a preguntas diferentes sobre un mismo proyecto. |
| **Herramientas utilizables** | Ninguna herramienta específica: la claridad viene de definir explícitamente quién decide qué. |
| **Trampas a evitar** | Dejar la ambigüedad sobre quién decide qué hasta el primer desacuerdo. Confundir al Scrum Master con un jefe. Saltarse la validación QA confiando únicamente en los tests automatizados. |
| **Buenas prácticas** | Aclarar desde el principio quién tiene la última palabra sobre las decisiones de negocio, técnicas y de planificación. Tratar tests automatizados y validación QA como complementarios. |
