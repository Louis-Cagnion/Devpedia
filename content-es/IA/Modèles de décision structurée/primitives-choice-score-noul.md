---
order: 2
---

# Las tres primitivas de pregunta: Choice, Score y Noul

El [capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm) explica que un modelo de decisión estructurada nunca responde con texto libre: responde a una **pregunta cerrada**, planteada contra un **estado** (el contenido a evaluar, un mensaje, un documento...). En concreto, esta pregunta cerrada toma siempre una de estas tres formas, llamadas **primitivas**:

| Primitiva | La pregunta que plantea | Lo que devuelve |
|---|---|---|
| **Choice** | "¿Cuál de estas opciones?" | La opción elegida, una probabilidad por opción, una confianza |
| **Score** | "¿A qué nivel, en esta escala?" | Una posición en la escala, una probabilidad por nivel, una confianza |
| **Noul** | "¿Es cierta esta afirmación?" | Una sola probabilidad, entre 0 y 1 |

Cada pregunta lleva un identificador, un tipo (`choice`, `score` o `noul`) e instrucciones. Se pueden plantear varias preguntas en una sola petición contra el mismo estado: cada una se evalúa **independientemente**, sin ver la respuesta de las demás.

## Choice: elegir entre opciones sin orden

**Choice** sirve para seleccionar una categoría entre un conjunto conocido de antemano, sin jerarquía entre las opciones (a diferencia de Score, ver más abajo). Ejemplo: enrutar un ticket de soporte al equipo correcto.

```json
{
  "departamento": {
    "type": "choice",
    "instructions": "¿Que equipo debe atender este ticket?",
    "criteria": {
      "devoluciones": "Cambios, articulos faltantes o danados",
      "envio": "Estado de envio, retrasos, paquetes perdidos",
      "facturacion": "Facturacion, facturas, problemas de pago"
    }
  }
}
```

La respuesta contiene tres elementos:

```json
{
  "choice": "devoluciones",
  "confidence": 1.0,
  "probabilities": { "devoluciones": 1.0, "envio": 0.0, "facturacion": 0.0 }
}
```

`probabilities` siempre suma 1 (es una distribución); `choice` es la opción que recibió la mayor probabilidad; `confidence` (entre 0 y 1) mide en qué medida esa probabilidad domina a las demás.

| Trampa | Buena práctica |
|---|---|
| Proponer opciones que se solapan (ej: "devoluciones" y "cambios" como dos opciones distintas cuando un mismo caso corresponde a ambas) | Redactar criterios mutuamente excluyentes, con descripciones que listen explícitamente lo que cubre una opción (y lo que excluye) |
| No prever ninguna opción para un caso fuera de alcance | Añadir sistemáticamente una opción "otro", para no forzar nunca una elección que no corresponda a nada |

Una petición acepta hasta 255 opciones por pregunta Choice.

## Score: puntuar en una escala ordenada

**Score** sirve para posicionar una evaluación en un continuo, cuando los niveles tienen un orden natural (severidad, satisfacción, competencia). Los niveles se numeran del `0` a su posición en la lista:

```json
{
  "severidad_bug": {
    "type": "score",
    "instructions": "Cual es la severidad del problema?",
    "criteria": [
      "Sin impacto funcional",
      "Funcionalidad degradada pero existe una solucion alternativa",
      "Bloqueo completo"
    ]
  }
}
```

La respuesta devuelve una posición **ponderada**, no necesariamente un entero:

```json
{
  "score": 1.43,
  "confidence": 0.35,
  "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 },
  "legend": { "0": "Sin impacto", "1": "Existe solucion alternativa", "2": "Bloqueo completo" }
}
```

`score` se calcula como una media ponderada por las probabilidades de cada nivel:

```python
# score = suma, sobre cada nivel, de (numero_del_nivel x probabilidad_del_nivel)
niveles        = [0, 1, 2]
probabilidades = [0.0, 0.57, 0.43]
score = sum(nivel * proba for nivel, proba in zip(niveles, probabilidades))
# -> 0*0.0 + 1*0.57 + 2*0.43 = 1.43
```

Una escala Score acepta entre 2 y 10 niveles.

| Trampa | Buena práctica |
|---|---|
| Describir grados abstractos ("moderadamente grave") en lugar de situaciones concretas | Describir lo que es observable ("funcionalidad rota con solución alternativa"), más fácil de evaluar de forma coherente |
| Evaluar varias dimensiones en una sola pregunta ("rápido Y experimentado") | Una dimensión por pregunta Score; combinar después varios scores en código (media ponderada, umbrales) |

Una confianza baja suele señalar un solape entre niveles vecinos o una pregunta que mezcla varias dimensiones.

## Noul: verificar una afirmación binaria

**Noul** responde a una pregunta sí/no, o juzga la veracidad de una afirmación, mediante una sola probabilidad:

```json
{
  "pide_humano": {
    "type": "noul",
    "instructions": "Pide el cliente hablar con un humano?"
  }
}
```

```json
{ "noul": 0.92 }
```

Un valor cercano a 1 significa sí con casi certeza, cercano a 0 significa no con casi certeza, cercano a 0,5 significa incertidumbre. No hay un campo `confidence` separado: la probabilidad misma lleva a la vez la respuesta y el grado de certeza.

En código, se aplica un umbral a esta probabilidad en lugar de tratarla como un booleano bruto:

```python
UMBRAL_SI = 0.8
UMBRAL_NO = 0.2

probabilidad = respuesta["noul"]
if probabilidad > UMBRAL_SI:
    decision = "si"
elif probabilidad < UMBRAL_NO:
    decision = "no"
else:
    decision = "incierto"   # escalar a un humano
```

| Trampa | Buena práctica |
|---|---|
| Combinar dos condiciones en una sola afirmación ("el cliente está enfadado Y pide un reembolso") | Una afirmación por Noul; plantear dos Noul distintos si realmente hay que verificar dos condiciones |
| Tratar la probabilidad como un booleano estricto (`> 0.5`) sin zona de incertidumbre | Adaptar ambos umbrales al coste de un error: un umbral más amplio para una acción reversible, más estrecho para una acción de alto riesgo |

## Comparar las tres primitivas

| | Choice | Score | Noul |
|---|---|---|---|
| Naturaleza de las respuestas posibles | Categorías sin orden | Niveles ordenados | Verdadero/falso |
| Número de opciones | Hasta 255 | 2 a 10 | Siempre 2 (implícito) |
| Respuesta devuelta | Una categoría + distribución | Una posición ponderada + distribución | Una sola probabilidad |
| Campo de confianza separado | Sí | Sí | No (la probabilidad hace ese papel) |
| Ejemplo de uso | Enrutar, clasificar | Puntuar una severidad, una calidad | Verificar una afirmación, filtrar |

## Estructurar los criterios en JSON en lugar de texto libre

Los campos `instructions` y `criteria` de las tres primitivas aceptan tanto una simple cadena como una estructura [JSON](/?c=infrastructure&p=json) (objeto o array). Estructurar resulta útil en dos casos: una pregunta con varios aspectos (las claves nombran cada aspecto, cosa que una frase no hace con la misma claridad) y un dato ya estructurado a reutilizar tal cual (un esquema, una taxonomía), en lugar de transcribirlo en prosa.

```json
{
  "type": "noul",
  "instructions": "Menciona este comentario un problema ya reportado?",
  "criteria": {
    "true": "Menciona un intento, un ticket o un reporte anterior preciso",
    "false": "Ningun rastro de un contacto o reporte anterior"
  }
}
```

Esta forma estructurada (`true`/`false` detallados, o `what`/`examples` para una opción Choice o un nivel Score) desambigua los casos límite, donde una sola frase de criterio seguiría siendo vaga sobre la frontera exacta entre dos respuestas posibles.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Un modelo de decisión estructurada solo conoce tres formas de pregunta: Choice (elegir una categoría sin orden), Score (posicionar en una escala ordenada) y Noul (juzgar una afirmación verdadero/falso). Cada pregunta devuelve una respuesta tipada acompañada de una probabilidad, nunca texto libre que interpretar. |
| **Herramientas utilizables** | Las tres primitivas Choice/Score/Noul, expresadas en JSON (petición) e interpretadas en código (umbrales, medias ponderadas, enrutamiento). |
| **Trampas a evitar** | Opciones Choice que se solapan, sin opción "otro". Niveles Score descritos en grados abstractos, o pregunta Score que mezcla varias dimensiones. Noul que combina dos condiciones, o tratado como booleano estricto sin zona de incertidumbre. |
| **Buenas prácticas** | Criterios mutuamente excluyentes más opción "otro" para Choice. Niveles Score descritos por situaciones observables, una dimensión por pregunta. Umbrales Noul adaptados al coste de un error. Criterios estructurados en JSON para desambiguar los casos límite. |
