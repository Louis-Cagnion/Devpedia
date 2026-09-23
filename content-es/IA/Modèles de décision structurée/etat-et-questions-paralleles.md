---
order: 3
---

# El estado y el fan-out especulativo: hacer todas las preguntas de una vez

Las [primitivas Choice, Score y Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#comparar-las-tres-primitivas) siempre se evalúan contra un **estado**: el contenido que el modelo debe juzgar. Este capítulo detalla lo que puede contener un estado, y luego una consecuencia directa de la independencia de las preguntas: plantear muchas preguntas de golpe cuesta apenas más que plantear una sola.

## El estado: el contenido a evaluar

El estado es el dato proporcionado al modelo, contra el cual se plantean una o varias preguntas. Acepta tres formatos:

| Formato | Caso de uso típico |
|---|---|
| Cadena de caracteres simple | Un mensaje único, un pasaje de texto aislado |
| Objeto [JSON](/?c=infrastructure&p=json) | Varios campos nombrados, un estado de aplicación estructurado (ej: `{"ticket": "...", "historial": [...]}`) |
| Array [JSON](/?c=infrastructure&p=json) | Una secuencia de mensajes o registros |

```json
{
  "ticket": {
    "asunto": "Paquete nunca recibido",
    "mensaje": "Pedido realizado hace 12 dias, todavia no recibi nada.",
    "cliente_vip": true
  }
}
```

El objeto estructurado preserva las relaciones entre datos (aquí, el hecho de que `cliente_vip` describe justamente este ticket) mejor que una sola cadena que mezclaría todo en prosa. Solo se acepta texto: ni imagen, ni audio, ni video. El modelo también favorece el inglés, ya que los demás idiomas (incluido el español) tienen actualmente una precisión menor según la documentación del proveedor.

| Trampa | Buena práctica |
|---|---|
| Amontonarlo todo en una sola cadena de texto sin estructurar | Separar el contenido (el estado) de los juicios pedidos (las preguntas), y agrupar en un objeto JSON solo la información realmente ligada a la decisión |

## Preguntas evaluadas independientemente

Punto central del funcionamiento de estos modelos: **todas las preguntas planteadas en una misma petición ven el mismo estado, y se evalúan independientemente unas de otras**. Ninguna pregunta "ve" la respuesta de otra. Esta independencia tiene una consecuencia directa: nada impide plantear varias preguntas a la vez, incluidas preguntas de las que aún no se sabe si la respuesta será útil.

## El patrón del fan-out especulativo

El **fan-out especulativo** (*speculative fan-out*) consiste en enviar de entrada todas las preguntas plausibles para un caso dado, en lugar de encadenar las llamadas una por una a medida que surgen las necesidades, y dejar que el código elija después qué respuestas conservar:

```text
Enfoque secuencial (3 llamadas, una tras otra)
  Llamada 1 -> categoria del ticket = "bug"
  Llamada 2 -> (porque es un bug) severidad = "bloqueante"
  Llamada 3 -> (porque bloqueante) se pide un reembolso?

Fan-out especulativo (1 sola llamada, 5 preguntas en paralelo)
  categoria, severidad_bug, pasos_reproducibles, reembolso_pedido, frustracion
  -> el codigo ignora despues severidad_bug si la categoria no es "bug"
```

Como las preguntas se evalúan en paralelo contra el mismo estado, añadir preguntas adicionales tiene poco efecto sobre el tiempo de respuesta: el coste dominante es la lectura del estado en sí, no el número de preguntas planteadas sobre él.

```python
respuesta = client.system_one(
    state=ticket,
    questions={
        "categoria": Choice(instructions="Categoria del ticket?", criteria=CATEGORIAS),
        "severidad_bug": Score(instructions="Severidad si es un bug?", criteria=NIVELES),
        "pasos_reproducibles": Noul(instructions="Se dan pasos de reproduccion?"),
        "reembolso_pedido": Noul(instructions="Se pide un reembolso?"),
        "frustracion": Score(instructions="Nivel de frustracion expresado?", criteria=NIVELES_FRUSTRACION),
    },
)

# El codigo elige despues que respuestas explotar, segun la categoria obtenida
if respuesta.answers["categoria"].choice == "bug":
    tratar_bug(respuesta.answers["severidad_bug"], respuesta.answers["pasos_reproducibles"])
```

## Lo que esto cambia en coste y velocidad

En un caso medido por el proveedor (13 preguntas regulatorias planteadas sobre un mismo documento), agrupar las preguntas en una sola petición en lugar de 13 peticiones separadas da:

| | 13 peticiones separadas | 1 petición agrupada |
|---|---|---|
| Coste | Referencia | **12,2× más barato** (el documento se transmite una sola vez) |
| Velocidad | Referencia | **10× más rápido** |
| Fiabilidad de las respuestas | Referencia | Idéntica: cada pregunta sigue siendo independiente de las demás |

Esta cifra viene del proveedor y no ha sido verificada de forma independiente; lo que importa aquí es el principio que ilustra (el coste dominante es la lectura del estado, no el número de preguntas), no el benchmark exacto.

> **Trampa:** creer que añadir preguntas especulativas arriesga "contaminar" las respuestas útiles, como lo haría un prompt sobrecargado enviado a un LLM generativo. Aquí, cada pregunta se evalúa independientemente contra el mismo estado: una pregunta innecesaria nunca modifica la respuesta de otra.
>
> **Buena práctica:** en cuanto una decisión depende potencialmente de varios factores, plantear todas las preguntas plausibles en una sola llamada en lugar de encadenar llamadas sobre la marcha, y dejar que el código (no una nueva petición) filtre las respuestas no pertinentes.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | El estado (texto, objeto o array JSON) es el contenido evaluado. Las preguntas planteadas contra un mismo estado son independientes unas de otras, lo que permite el fan-out especulativo: plantear de golpe todas las preguntas plausibles, y luego filtrar las respuestas útiles en código, para un coste y una latencia cercanos a los de una sola pregunta. |
| **Herramientas utilizables** | Un objeto JSON estructurado como estado; varias preguntas Choice/Score/Noul en una sola petición; código de aplicación para filtrar las respuestas especulativas no pertinentes. |
| **Trampas a evitar** | Amontonarlo todo en una sola cadena de texto sin estructurar. Temer que añadir preguntas degrade las demás respuestas (no es el caso, son independientes). |
| **Buenas prácticas** | Separar contenido y preguntas, estructurar el estado en JSON. Agrupar todas las preguntas plausibles de un caso en una sola petición en lugar de encadenar llamadas secuenciales. |
