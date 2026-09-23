---
order: 6
---

# Construir con un modelo de decisión estructurada: el método en siete pasos

Los capítulos anteriores detallan cada pieza ([primitivas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), [estado y fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles), [confianza](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree), [puntuación compuesta y enrutamiento](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition)). Este capítulo las ensambla en un método ordenado para diseñar un sistema completo.

## El principio rector: el código mantiene el control

La idea central: **el código conserva el control del flujo**, y el modelo de decisión estructurada solo trata decisiones estrechas dentro de ese flujo. Esto difiere de un [agente](/?c=ia&s=nlp-llm&p=agents) autónomo, donde es el propio modelo el que decide el encadenamiento de los pasos: aquí, el encadenamiento sigue escrito de antemano en código, solo el contenido de cada decisión puntual se confía al modelo.

## Los siete pasos

```text
1. Codigo para lo    2. Descomponer     3. Estructurar      4. Descomponer
   deterministico ->    el estado      ->   el estado      ->   las preguntas
                                                                      |
                                                                      v
7. Combinar en  <- 6. Plantear todo  <- 5. Estructurar las <--------+
   codigo             en paralelo       preguntas
```

| Paso | Qué hace |
|---|---|
| 1. Priorizar el código para lo determinístico | Mantener en software clásico toda regla ya fiable; confiar al modelo solo el juicio que realmente necesita contexto |
| 2. Descomponer el estado de entrada | Transmitir solo el contexto pertinente al juicio pedido, nunca todo lo disponible |
| 3. Estructurar el estado de entrada | Usar un JSON anidado para el estado, con rutas explícitas entre comillas invertidas si el estado está anidado (ej: `` `ticket.mensajes[0].texto` ``) |
| 4. Descomponer las preguntas | Fragmentar un juicio amplio en varias preguntas atómicas y explícitas en lugar de una sola pregunta que esconda varias decisiones: el concepto más importante del método |
| 5. Estructurar las preguntas | Añadir estructura a las instrucciones y criterios (en lugar de una simple cadena) en cuanto una consigna merezca descomponerse, por ejemplo criterios contrastados para una pregunta Choice |
| 6. Plantear todas las preguntas en paralelo | Ver el [fan-out especulativo](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#el-patron-del-fan-out-especulativo) |
| 7. Combinar las respuestas en código | Mediante una fórmula ponderada (ver la [puntuación compuesta](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition#puntuacion-compuesta-combinar-dimensiones-independientes)) o mediante un enrutamiento según la confianza (ver la [confianza calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-umbrales-tres-comportamientos)) |

### Paso 1: lo que queda en código, lo que va al modelo

| Queda en código (determinístico) | Va al modelo (juicio contextual) |
|---|---|
| Una regla de negocio fija ("si el monto supera X, bloquear") | Estimar si un texto expresa frustración |
| Un cálculo, una búsqueda en base de datos | Clasificar una intención a partir de un mensaje en lenguaje natural |
| El encadenamiento de los pasos del programa | Una decisión que depende de matices de lenguaje |

> **Trampa:** confiar al modelo una regla que podría expresarse como una condición simple en código (ej: comparar dos números). Un modelo de decisión estructurada no es ni más fiable ni más rápido que una comparación directa para este tipo de caso, y cuesta innecesariamente una llamada de red.
>
> **Buena práctica:** reservar el modelo solo a los juicios que realmente requieren comprender el contenido (lenguaje natural, matiz contextual), nunca a una regla ya expresable directamente en código.

### Pasos 2 y 3: descomponer el estado, estructurarlo

Transmitir solo el contexto pertinente al juicio pedido (paso 2), y luego estructurar ese estado en JSON anidado con una ruta explícita (`` `soporte.tickets[0].mensaje` ``) en cuanto eso elimina una ambigüedad sobre lo que evalúa exactamente una pregunta (paso 3).

### Paso 4: descomponer las preguntas, el concepto más importante

"Plantear un solo juicio rápido por pregunta" sigue siendo la regla central de todo el método: una tarea multifactorial se descompone en varias preguntas atómicas, combinadas después en código (paso 7), nunca en una sola pregunta que lo decidiera todo a la vez. Una pregunta amplia ("¿este mensaje es spam?") esconde varios juicios distintos; hacerlos explícitos (¿pide una credencial? ¿promete una recompensa inesperada? ¿crea una urgencia artificial?) permite luego inspeccionarlos y ponderarlos por separado en código.

## Las propiedades esperadas de un modelo de decisión estructurada

Una vez aplicado el método, un sistema construido así hereda propiedades propias de esta familia de modelos:

| Propiedad | Qué significa |
|---|---|
| Tipado | La salida siempre respeta el esquema proporcionado, nunca un formato inválido que corregir después |
| Paralelo | Cada pregunta se evalúa independientemente, sin contexto oculto entre ellas |
| Comparable | Las respuestas son ordenables y permiten condiciones, umbrales y comparaciones directamente en código |
| Rápido | Del orden de 100 ms por petición, muy por debajo de un LLM generativo comparable |
| Calibrado | Las probabilidades reflejan una frecuencia real en lugar de una confianza excesiva, gracias a un entrenamiento dedicado (el [capítulo siguiente](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd) detalla este método de entrenamiento) |
| Estable | Respuestas coherentes de una ejecución a otra sobre un mismo estado |

## Ejemplo integrado: el triaje de tickets

El flujo de trabajo que atraviesa todos los capítulos de esta parte: un ticket de soporte (estado estructurado y rutas explícitas, pasos 2 y 3) da lugar a siete preguntas independientes y atómicas de tipo Choice/Score/Noul (paso 4), planteadas en una sola petición (paso 6). El código combina luego estas señales (paso 7, ej: un score compuesto de spam) y enruta la decisión final según la categoría y la confianza obtenidas (paso 7 también), sin confiar nunca al modelo la decisión de encadenamiento en sí (paso 1).

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Construir con un modelo de decisión estructurada sigue siete pasos ordenados: mantener lo determinístico en código, descomponer y luego estructurar el estado, descomponer y luego estructurar las preguntas, agruparlas en paralelo, combinar las respuestas en código. El resultado es tipado, paralelo, comparable, rápido, calibrado y estable. |
| **Herramientas utilizables** | Un estado JSON con rutas explícitas; preguntas Choice/Score/Noul atómicas y estructuradas; código de combinación y enrutamiento. |
| **Trampas a evitar** | Confiar al modelo una regla ya expresable como una condición simple en código. Plantear una pregunta amplia que esconde varios juicios distintos. |
| **Buenas prácticas** | Reservar el modelo a los juicios que requieren comprender el lenguaje o el contexto; mantener toda regla determinística en código clásico; descomponer cada juicio amplio en preguntas atómicas. |
