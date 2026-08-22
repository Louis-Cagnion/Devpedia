---
order: 3
---

# La estimación

Una vez lleno el [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) con user stories priorizadas, queda una pregunta abierta: ¿cuánto tiempo llevará cada una? La **estimación** responde a esta pregunta, con métodos distintos según lo que realmente se busca medir.

## Dos formas de estimar, dos problemas distintos

| Enfoque | Qué mide | Problema que plantea |
|---|---|---|
| **Estimación en tiempo** | Una duración precisa ("3 días") | Una estimación en tiempo suele tomarse como un compromiso firme, cuando solo es una previsión |
| **Estimación en puntos de complejidad** | Un tamaño relativo frente a otras tareas ya estimadas | No se convierte directamente en una fecha, requiere un paso adicional (la velocidad, ver más abajo) |

La estimación en tiempo choca con un sesgo humano bien documentado: subestimar sistemáticamente la duración de una tarea, en particular para un trabajo nuevo o poco conocido (la [falacia de planificación](https://es.wikipedia.org/wiki/Falacia_de_planificaci%C3%B3n)). Los puntos de complejidad esquivan en parte este sesgo al evitar pedir una fecha precisa.

## Los puntos de complejidad: comparar en lugar de medir

Un **punto de complejidad** (*story point*) no tiene una unidad de tiempo fija: representa un tamaño relativo, obtenido comparando una user story con otras ya estimadas en el pasado.

```text
Story ya estimada en 3 puntos: "añadir un campo de búsqueda simple"

Nueva story a estimar: "añadir un filtro por categoría con
varios criterios combinables"

-> más compleja que la story de referencia (3 puntos), pero no
   muchísimo más -> estimada en 5 puntos
```

La escala usada más a menudo sigue la secuencia de Fibonacci (1, 2, 3, 5, 8, 13...), con saltos deliberadamente crecientes: forzar una elección entre 5 y 8 en lugar de entre 5 y 6 evita perder tiempo en una precisión ilusoria que el equipo no puede garantizar de todos modos.

> **Trampa:** convertir mentalmente los puntos de complejidad en días nada más asignarlos ("3 puntos = 1 día"). Esta conversión informal reintroduce exactamente el problema que los puntos buscaban evitar: un compromiso de duración disfrazado.
>
> **Buena práctica:** mantener los puntos de complejidad como una medida puramente relativa, y convertirlos en duración solo a través de la velocidad del equipo (ver más abajo), nunca mediante una regla de conversión fija decidida de antemano.

## El planning poker: estimar colectivamente

El **planning poker** es un método de estimación colectiva, pensado para evitar que una sola persona (a menudo la más experimentada, o la más cómoda expresándose) influya en todo el grupo:

```text
1. La story a estimar se presenta al equipo
2. Cada persona elige en secreto una carta (1, 2, 3, 5, 8...)
   que representa su estimación
3. Todas las cartas se revelan al mismo tiempo
4. Si las estimaciones divergen mucho, las personas en los
   extremos explican su razonamiento, y luego hay una nueva ronda
5. Repetir hasta converger en una estimación compartida
```

> **Trampa:** revelar las estimaciones una a una en lugar de simultáneamente. La primera persona en anunciar una cifra ancla inconscientemente las estimaciones siguientes en torno a su valor, lo que anula el sentido del voto secreto.
>
> **Buena práctica:** revelar siempre las cartas al mismo tiempo, y tratar un desacuerdo marcado como una señal útil (la story quizá esconde una complejidad o ambigüedad que no todos identificaron), no como un problema a resolver cuanto antes.

## La velocidad: convertir los puntos en calendario

La **velocidad** de un equipo es el número de puntos de complejidad que logra procesar en promedio por sprint (o por periodo fijo), medida a posteriori sobre varias iteraciones pasadas.

```text
Sprint 1: 18 puntos procesados
Sprint 2: 22 puntos procesados
Sprint 3: 20 puntos procesados

-> velocidad media ≈ 20 puntos por sprint

Backlog restante: 100 puntos
-> previsión: unos 5 sprints para completarlo
```

Es esta velocidad, propia de cada equipo y medida en el tiempo, la que permite traducir puntos de complejidad en una previsión de calendario, sin haber tenido nunca que pedir una duración precisa sobre una story individual.

> **Trampa:** comparar la velocidad de dos equipos distintos, o usarla como medida de rendimiento individual. Dos equipos no asignan los puntos de la misma forma; comparar sus velocidades equivale a comparar unidades distintas pese a una apariencia numérica idéntica.
>
> **Buena práctica:** usar la velocidad únicamente para prever el ritmo de un mismo equipo en el tiempo, nunca para comparar equipos entre sí.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | La estimación en tiempo choca con el sesgo de subestimación sistemática; los puntos de complejidad miden un tamaño relativo en lugar de una duración. El planning poker hace que cada persona estime en secreto antes de revelar simultáneamente, para evitar el sesgo de anclaje. La velocidad (medida a posteriori) convierte los puntos en previsión de calendario. |
| **Herramientas utilizables** | Una escala tipo Fibonacci (1, 2, 3, 5, 8, 13...) para los puntos de complejidad. El planning poker para una estimación colectiva. La velocidad media de los últimos sprints para prever un calendario. |
| **Trampas a evitar** | Convertir mentalmente los puntos en días nada más asignarlos. Revelar las cartas del planning poker una a una. Comparar la velocidad de dos equipos distintos. |
| **Buenas prácticas** | Mantener los puntos como medida puramente relativa. Revelar las cartas simultáneamente y tratar un desacuerdo marcado como una señal útil. Usar la velocidad solo para prever el ritmo de un mismo equipo en el tiempo. |
