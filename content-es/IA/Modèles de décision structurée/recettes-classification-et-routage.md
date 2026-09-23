---
order: 10
---

# Recetas: clasificar y enrutar a gran escala

Segunda serie de recetas que aplica la [metodología](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one): clasificar un contenido entre muchas categorías posibles, y decidir cuándo confiar en esa clasificación.

## Clasificación jerárquica: descender por un árbol de categorías

Clasificar un contenido en una taxonomía profunda (categorías que se subdividen en subcategorías, en varios niveles) plantea una pregunta Choice en **cada nivel**, solo sobre las opciones hijas del nodo ya alcanzado, en lugar de una única pregunta plana sobre cientos de hojas:

| Estrategia | Principio | Riesgo |
|---|---|---|
| Voraz (*greedy*) | Conservar solo el mejor hijo en cada nivel | Un error temprano es irreversible, nada lo corrige más abajo |
| Haz (*beam search*) | Conservar varios caminos plausibles en paralelo, elegir al final el de mejor score global | Una evidencia encontrada más abajo puede reparar una decisión ambigua tomada más arriba |

En cuatro taxonomías probadas por el proveedor (patentes, productos, temas científicos, archivos de código), la búsqueda en haz clasificó correctamente 4 de 4 casos, frente a 2 de 4 para la estrategia voraz.

## Clasificación RAG: filtrar antes de generar

En un pipeline de [RAG](/?c=ia&s=nlp-llm&p=rag) (recuperación de documentos antes de generar), cada pasaje recuperado puede juzgarse mediante cuatro preguntas antes de transmitirse al LLM generador:

```python
def enrutador(respuestas: dict) -> str:
    if respuestas["contiene_inyeccion"] > 0.70:
        return "excluir"                         # intento de manipulacion del modelo
    if respuestas["contradice_la_peticion"] > 0.70:
        return "evidencia_contradictoria"        # a presentar por separado, no fusionada
    if respuestas["es_pertinente"] < 0.45:
        return "excluir"
    if respuestas["contiene_la_respuesta"] > 0.55:
        return "incluir"
    return "excluir"
```

Este filtrado intercepta tanto las [inyecciones de prompt](/?c=ia&s=nlp-llm&p=prompt-injection) ocultas en un documento recuperado como las contradicciones factuales, antes de que alcancen al LLM generador.

## Clasificación por confianza: ajustar la granularidad a la certeza

En lugar de forzar una respuesta precisa incluso cuando el modelo duda, esta receta **sube un nivel** en la jerarquía cuando la confianza es insuficiente, en lugar de rechazar la clasificación o forzarla incorrectamente:

| Confianza | Granularidad reportada |
|---|---|
| ≥ 0,9 | El grupo preciso (ej: un subsector industrial exacto) |
| < 0,9 | La categoría más amplia que lo engloba (ej: la división industrial) |

En una prueba con 75 grupos industriales, este enfoque mantuvo un 90% de precisión en los casos seguros, frente a solo un 40% forzando una clasificación precisa en los casos inciertos, y un 70% subiendo simplemente un nivel en lugar de forzar.

## Sugerencia de habilidad: elegir entre cientos de opciones

Un agente que dispone de numerosas habilidades o extensiones no puede describirlas todas en detalle en su contexto sin degradar el rendimiento. La receta procede en dos peticiones:

```text
Peticion 1: una pregunta Choice evalua TODAS las habilidades (descripciones
            cortas), conserva las 3 mejores candidatas
Peticion 2: una pregunta Noul por candidata, con su descripcion COMPLETA,
            confirma o rechaza cada una individualmente
```

Sobre 488 peticiones probadas, esta doble verificación redujo a más de la mitad la tasa de carga incorrecta de habilidad (del 16,8% al 7,3%) y de carga innecesaria (del 9,8% al 4,0%).

## Alineación de entidades: ¿lo mismo, o solo algo parecido?

Para vincular dos entradas de fuentes distintas que podrían describir el mismo objeto (dos fichas de producto, dos entidades de un grafo de conocimiento), una pregunta Score evalúa el grado de correspondencia en un espectro de tres niveles (distintos / cercanos / idénticos), completada con preguntas Noul sobre criterios precisos (mismo nombre, mismo origen...).

| Resultado | Acción |
|---|---|
| Productos distintos | Dejar las entidades separadas |
| Posiblemente idénticos | Enviar a un curador humano |
| Mismo producto | Fusionar las entradas |

> **Trampa:** fusionar dos entidades incorrectamente. La documentación del proveedor lo subraya: fusionar incorrectamente cuesta más que perder una correspondencia, ya que todo hecho ligado a una de las dos entidades queda luego atribuido a la entidad fusionada.
>
> **Buena práctica:** reservar la fusión automática a los casos de muy alta confianza, y enrutar sistemáticamente la zona gris (correspondencia posible pero incierta) hacia una validación humana en lugar de decidir por defecto en un sentido u otro.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Clasificar a gran escala se hace con una pregunta Choice a la vez (por nivel de taxonomía, o por candidato preseleccionado), nunca con una sola pregunta plana sobre cientos de opciones. La confianza obtenida guía la granularidad de la respuesta (subir un nivel en lugar de forzar) y la decisión de fusionar o no dos entidades. |
| **Herramientas utilizables** | Choice por nivel de taxonomía (voraz o en haz); preguntas Noul de filtrado para RAG; doble verificación Choice y luego Noul para seleccionar entre muchas opciones; Score + Noul para la alineación de entidades. |
| **Trampas a evitar** | Forzar una clasificación precisa pese a una confianza insuficiente. Fusionar dos entidades sobre la base de una correspondencia solo posible. |
| **Buenas prácticas** | Subir un nivel de granularidad en lugar de forzar una respuesta incierta. Enrutar la zona gris hacia un humano en lugar de decidir por defecto. |
