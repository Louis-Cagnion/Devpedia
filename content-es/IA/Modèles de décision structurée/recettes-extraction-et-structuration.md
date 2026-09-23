---
order: 9
---

# Recetas: extraer y reestructurar texto libre

Este capítulo y los dos siguientes aplican la [metodología](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) a problemas concretos, documentados por TypeSafe AI en forma de recetas ("cookbooks"). Esta primera serie trata sobre la extracción: encontrar un valor preciso, o una estructura, en un texto que no la tiene.

## Recuperación de estructura: reconstruir un documento mal formateado

Un texto pegado sin formato (títulos, listas, citas perdidas) se reestructura en dos pasadas, sin reescribir nunca un solo carácter del texto fuente:

| Pasada | Pregunta planteada | Propósito |
|---|---|---|
| 1. Recosido (*stitching*) | Un Noul por par de líneas vecinas: "¿esta línea continúa la frase anterior?" | Fusionar líneas cortadas por error |
| 2. Clasificación | Un Choice por bloque fusionado: título, párrafo, elemento de lista, cita, código, recuadro | Recuperar la estructura lógica del documento |

El modelo solo responde a preguntas factuales estrechas; es el código quien gestiona la puntuación y los espacios, eliminando todo riesgo de reescritura involuntaria del texto original.

## Cascada de extracción estructurada: ahorrar sin perder calidad

La **cascada SDE** (*structured-data-extraction cascade*) procesa un documento en varias etapas de coste creciente, escalando a la siguiente etapa solo si es necesario:

```text
1. Un modelo economico extrae los campos (rapido, barato)
        |
        v
2. El modelo de decision estructurada VERIFICA cada campo (un Noul por campo,
   detecta una extraccion dudosa o alucinada)
        |
        v
3. Solo los campos juzgados dudosos (confianza por encima de un umbral) son
   reprocesados por un modelo potente (costoso, reservado a los casos dificiles)
```

El modelo económico puede alucinar un valor plausible pero falso (ej: inventar una fecha de registro ausente de una página); el papel del modelo de decisión estructurada es precisamente detectar este tipo de desvío antes de que se propague, sin recurrir al modelo potente para los campos ya correctos.

## Extracción de fechas: leer y luego resolver en código

Consecuencia directa de la [trampa n.º 3 del capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=limites-et-pieges-jev) (el modelo calcula mal las fechas): nunca se le pide calcular una fecha, solo **leer cómo está escrita**.

```text
1. El modelo responde a preguntas Choice: fecha absoluta o relativa?
   que componentes se nombran (mes, dia, ano, dia de la semana)?
2. El CODIGO convierte estas respuestas en una fecha real (ej: que jueves para
   "el jueves que viene"), deduciendo el ano faltante si hace falta
```

| Trampa | Buena práctica |
|---|---|
| Preguntar directamente al modelo "¿cuál es la fecha exacta?" | Preguntarle cómo lo expresa el texto, resolver el cálculo en código |

## Extracción de valores pre-localizados: el regex encuentra, el modelo elige

Para valores con un patrón reconocible (email, teléfono, monto), una expresión regular localiza primero todos los candidatos plausibles (aunque sea a costa de encontrar de más), y luego una pregunta Choice selecciona el que realmente corresponde a lo pedido:

```text
Texto -> regex (patrones email/telefono/monto) -> N candidatos
Candidatos + pregunta -> Choice -> el candidato pertinente
Candidato elegido -> codigo -> copia verbatim + normalizacion (ej: formato E.164)
```

El modelo nunca copia él mismo un valor: **designa** un candidato ya encontrado por el regex, que el código copia tal cual. Por tanto no puede ni inventar un valor, ni transponer una cifra por error, a diferencia de un LLM generativo que retecleará el valor él mismo.

> **Trampa común a estas cuatro recetas:** dejar que el modelo produzca o calcule directamente un valor exacto (una fecha resuelta, un monto copiado), en lugar de confinarlo a un juicio (¿cuál? ¿de qué tipo? ¿parece coherente?) y dejar que el código haga el cálculo o la copia exacta.
>
> **Buena práctica común:** repartir siempre el trabajo según las fortalezas de cada uno: al modelo, el juicio contextual (¿cuál de estos candidatos? ¿qué tipo de bloque? ¿esta extracción parece correcta?); al código, todo cálculo o copia que deba ser exacto al 100%.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Cuatro recetas de extracción comparten el mismo principio: el modelo de decisión estructurada nunca hace el cálculo o la copia exacta él mismo, juzga (¿esta línea continúa? ¿este campo parece correcto? ¿cómo está escrita esta fecha? ¿qué candidato corresponde?), y el código ejecuta la parte que debe ser exacta. |
| **Herramientas utilizables** | Preguntas Noul/Choice en cascada o en pasadas sucesivas; una expresión regular aguas arriba para localizar candidatos; código de resolución/normalización aguas abajo. |
| **Trampas a evitar** | Hacer que el modelo calcule o copie un valor exacto en lugar del código. |
| **Buenas prácticas** | Reservar el modelo al juicio contextual, confiar al código todo cálculo o copia que deba permanecer exacto. |
