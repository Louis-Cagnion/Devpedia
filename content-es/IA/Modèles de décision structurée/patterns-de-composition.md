---
order: 5
---

# Componer decisiones: puntuación compuesta y enrutamiento de intención

Un modelo de decisión estructurada nunca responde más que a preguntas estrechas y atómicas ([Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Componer un comportamiento más rico (una decisión final, un enrutamiento) es tarea del **código que llama**, no del modelo. Cuatro patrones aparecen con más frecuencia para esta composición:

| Patrón | Principio | Dónde se cubre |
|---|---|---|
| Fan-out especulativo | Plantear de golpe todas las preguntas plausibles, filtrar en código | [Estado y preguntas paralelas](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#el-patron-del-fan-out-especulativo) |
| Enrutamiento por confianza | Actuar, confirmar o escalar según el nivel de confianza | [Confianza calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-umbrales-tres-comportamientos) |
| **Puntuación compuesta** | Combinar varios scores independientes en una decisión única | Este capítulo |
| **Enrutamiento de intención** | Clasificar una petición y luego dirigirla al tratamiento correcto | Este capítulo |

## Puntuación compuesta: combinar dimensiones independientes

La **puntuación compuesta** descompone un juicio complejo en dimensiones separadas, puntúa cada una independientemente (una pregunta Score por dimensión, planteadas en una sola petición gracias al [fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#el-patron-del-fan-out-especulativo)), y luego las combina mediante una fórmula ponderada que el código controla por completo.

```text
1. Plantear una pregunta Score por dimension (en paralelo, misma peticion)
2. Normalizar cada score entre 0 y 1 (dividir por el nivel maximo)
3. Combinar mediante una suma ponderada, con pesos fijos en codigo
```

Ejemplo: evaluar un currículum según varios ejes, con pesos que cambian según el puesto buscado.

```python
# Cada score se normaliza entre 0 y 1 antes de ponderarse
def puntuar_candidato(respuestas, pesos: dict[str, float]) -> float:
    total = 0.0
    for dimension, peso_dimension in pesos.items():
        score_bruto   = respuestas[dimension].score                # ej: 3 en una escala 0-4
        nivel_maximo  = len(respuestas[dimension].legend) - 1      # 4
        score_normalizado = score_bruto / nivel_maximo
        total += peso_dimension * score_normalizado
    return total

# Un puesto de manager pesa mas la dimension "liderazgo" que un puesto de IC senior
pesos_ic_senior = {"profundidad_python": 0.5, "liderazgo": 0.1, "diseno_de_sistemas": 0.4}
pesos_manager    = {"profundidad_python": 0.2, "liderazgo": 0.5, "diseno_de_sistemas": 0.3}
```

Este enfoque preserva la granularidad de cada dimensión (se puede inspeccionar por qué un candidato obtiene tal score global) permitiendo a la vez ajustar rápidamente las prioridades (cambiar los pesos) sin reconstruir todo el sistema de evaluación.

> **Trampa:** puntuar directamente una impresión global ("buen candidato" en una sola pregunta Score), que mezcla varias dimensiones sin poder luego ajustar su importancia relativa por separado.
>
> **Buena práctica:** una pregunta Score por dimensión realmente independiente, combinada en código con pesos explícitos y modificables, sin tocar las preguntas en sí.

## Enrutamiento de intención: clasificar antes de tratar

El **enrutamiento de intención** (*intent routing*) coloca un modelo de decisión estructurada aguas arriba de varios tratamientos posibles, para dirigir cada petición hacia el tratamiento correcto sin pasar siempre por el tratamiento más costoso (un LLM, un humano).

```text
Mensaje del cliente
     |
     v
Modelo de decision estructurada (2 preguntas en paralelo: Choice + Score)
     |
     v
Respuestas + confianza
     |
     +-- confianza intencion < 0.5 -----------------> Agente humano
     +-- intencion = "estado_pedido" ----------------> Busqueda deterministica (sin LLM)
     +-- intencion = "pregunta_producto" ------------> LLM especializado en producto
     +-- intencion = "reclamo" + complejidad > 1 ----> Agente humano
     +-- intencion = "reclamo" + complejidad <= 1 ---> LLM de resolucion
```

```python
respuesta = client.system_one(
    state=mensaje_cliente,
    questions={
        "intencion":  Choice(instructions="Categoria de la peticion?", criteria=CATEGORIAS),
        "complejidad": Score(instructions="Complejidad de la peticion?", criteria=NIVELES_COMPLEJIDAD),
    },
)

if respuesta.answers["intencion"].confidence < 0.5:
    enrutar_a("agente_humano")
elif respuesta.answers["intencion"].choice == "estado_pedido":
    enrutar_a("busqueda_deterministica")
elif respuesta.answers["intencion"].choice == "reclamo" and respuesta.answers["complejidad"].score > 1:
    enrutar_a("agente_humano")
else:
    enrutar_a("llm_especializado")
```

La ganancia principal es económica: los recursos costosos (un LLM de razonamiento, un humano) solo se movilizan para los casos que realmente lo justifican, tratándose el resto mediante lógica determinística o un modelo más ligero.

> **Trampa:** enrutar únicamente según la intención elegida, sin tener en cuenta la confianza asociada: una intención mal clasificada pero tratada como cierta puede enviar una petición al tratamiento equivocado sin que ninguna señal lo revele.
>
> **Buena práctica:** verificar siempre la confianza de la intención antes de enrutar sobre ella (ver el [enrutamiento por confianza](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-umbrales-tres-comportamientos)), y combinar intención con otras señales (aquí, la complejidad) en lugar de enrutar sobre un único criterio aislado.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Componer una decisión rica a partir de preguntas atómicas sigue siendo tarea del código, no del modelo. La puntuación compuesta combina varios scores independientes mediante una fórmula ponderada; el enrutamiento de intención clasifica una petición y luego la dirige hacia el tratamiento menos costoso que corresponda, sujeto a una confianza suficiente. |
| **Herramientas utilizables** | Varias preguntas Score en paralelo, una fórmula de ponderación en código, una pregunta Choice para clasificar una intención antes de enrutar. |
| **Trampas a evitar** | Una sola pregunta Score que mezcla varias dimensiones. Enrutar sobre una intención sin verificar su confianza. |
| **Buenas prácticas** | Una dimensión por pregunta Score, pesos explícitos y ajustables en código. Verificar la confianza antes de enrutar, combinar varias señales en lugar de una sola. |
