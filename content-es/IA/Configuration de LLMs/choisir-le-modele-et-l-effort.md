---
order: 2
---

# Elegir el modelo y el nivel de esfuerzo de Claude (11/10/2026)
**Claude** es una familia de [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (modelos de lenguaje de gran tamaño, programas que producen texto). Dos ajustes determinan el resultado y la factura: el **modelo** (qué programa responde) y el **esfuerzo** (cuánto trabajo aporta antes de responder). Una mala elección sale cara en los dos sentidos: si es demasiado débil, la tarea fracasa; si es demasiado fuerte, se pagan [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (los fragmentos de palabras que el modelo lee y escribe, y que se facturan) para nada. Este capítulo ofrece las pautas para elegir y luego muestra dónde fijar cada ajuste en [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) y en la [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (la forma de enviar peticiones a un servicio desde un programa).

## Dos ajustes distintos

| Ajuste | Pregunta | Qué cambia |
|---|---|---|
| Modelo | ¿Qué programa responde? | El precio por token, el tiempo de respuesta (la latencia, ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) y, sobre todo, el **techo de calidad**: lo que Claude sabe y entiende, y la dificultad máxima de las tareas que sabe resolver |
| Esfuerzo | ¿Qué trabajo aporta para esta respuesta? | El número de tokens producidos, por tanto el coste y el tiempo; un esfuerzo bajo también produce menos llamadas a herramientas (acciones como leer un archivo, ver [Agentes](/?c=ia&s=nlp-llm&p=agents)), menos preámbulo (texto introductorio antes de actuar) y confirmaciones más breves |

Una analogía: el modelo es la persona que trabaja (un becario, un ingeniero con experiencia, un experto) y el esfuerzo es el tiempo que dedica al caso. Dedicar más tiempo no aporta los conocimientos ni la intuición que faltan: un becario que le dedica una semana no se convierte en experto, y un experto que le dedica dos minutos puede pasar por alto un detalle.

| Combinación | Efecto |
|---|---|
| Modelo pequeño, esfuerzo alto | Piensa mucho tiempo pero sigue limitado por lo que sabe hacer: tokens gastados sin garantía de éxito si la tarea es demasiado difícil para él |
| Modelo grande, esfuerzo bajo | Responde rápido y con pocos tokens, pero puede pasar por alto un detalle en una tarea sutil |
| Mismo modelo, distinto esfuerzo | Mismo saber, distinta profundidad: más o menos reflexión y acciones antes de responder |
| Mismo esfuerzo, distinto modelo | Misma profundidad de trabajo, pero otro techo de calidad y otro precio por token |

El esfuerzo no es un límite estricto de tokens: es una indicación de profundidad que el modelo sigue.

Ambos se combinan y se eligen juntos, como muestra el árbol de decisión más abajo.

## Los modelos actuales

Cada modelo tiene un **identificador de API**: la cadena exacta que hay que proporcionar cuando un programa llama al servicio mediante la API. Los precios están en dólares por millón de tokens (M). La **entrada** designa los tokens enviados al modelo (el [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), la instrucción y los documentos proporcionados), y la **salida** los que produce (la respuesta), que son más caros. Estos valores evolucionan: hay que releerlos en la documentación oficial de [Anthropic](https://www.anthropic.com), la empresa que desarrolla Claude, en la [página de modelos](https://docs.claude.com/en/docs/about-claude/models) y en la [página de tarifas](https://www.anthropic.com/pricing).

| Modelo | Identificador de API | Entrada ($/M) | Salida ($/M) | Esfuerzo por defecto |
|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0,10 | 0,50 | medium |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2,00 | 10,00 | high |
| Claude Opus 5.5 | `claude-opus-5-5` | 4,00 | 20,00 | medium |
| Claude Fable 5.1 | `claude-fable-5-1` | 10,00 | 50,00 | high |

Una precisión:

- Haiku 5.5 se factura al precio de la tabla para prompts de hasta 100 000 tokens; por encima, 0,50 $ de entrada y 2,50 $ de salida.

## Lo que cambia el modelo, más allá del precio

El precio no es la única diferencia. Según la [comparación oficial](https://platform.claude.com/docs/en/about-claude/models/overview) de Anthropic, los modelos se distinguen por su **rapidez de respuesta** (la latencia) y por la **dificultad de las tareas** a las que están destinados. Una tarea es más difícil cuando exige razonar en varios pasos, tener en cuenta muchas instrucciones a la vez o encontrar una causa oculta.

| Modelo | Rapidez (comparada) | Destinado a (según Anthropic) |
|---|---|---|
| Claude Haiku 5.5 | La más rápida | Tareas numerosas en las que importa la rapidez: clasificar, extraer, encaminar (*routing*: decidir a quién o a qué se envía una petición) |
| Claude Sonnet 5.5 | Rápida | La mejor combinación de rapidez e inteligencia, para el trabajo diario |
| Claude Opus 5.5 | Media | Trabajo largo y autónomo: código agéntico (un agente que lee, modifica y prueba código), trabajo de conocimiento. Su razonamiento no puede desactivarse: el esfuerzo es su único ajuste de profundidad |
| Claude Fable 5.1 | La más lenta | Razonamiento exigente y trabajo autónomo de larga duración; para usar cuando las evaluaciones con Opus 5.5, incluso con un esfuerzo mayor, siguen siendo insuficientes |

Del más pequeño al más grande, la rapidez baja, el precio sube y la capacidad para resolver tareas difíciles sube. La documentación no da una escala numérica de esa capacidad: la diferencia real se mide con las propias tareas.

Lo que **no cambia** de un modelo a otro, según la misma comparación: texto e imágenes como entrada, texto como salida, varios idiomas, uso de herramientas, ventana de contexto de 1 millón de tokens (la cantidad máxima de texto, prompt y respuesta incluidos, que procesan de una vez, ver [la ventana de contexto](/?c=ia&s=nlp-llm&p=llm-en-production)), respuestas de 128 000 tokens como máximo, conocimientos hasta junio de 2026. Elegir un modelo no cambia, por tanto, lo que Claude puede leer o producir, sino la calidad de su razonamiento en las tareas difíciles, su rapidez y su precio.

Ningún modelo es el adecuado por defecto: la elección depende de la tarea (ver « Estimar el modelo y el esfuerzo de una tarea » más abajo). Para un gran volumen en el que importan el precio o la rapidez, se conserva el modelo más pequeño que tenga éxito con una **muestra real** (algunas tareas representativas de su propio trabajo).

## Los niveles de esfuerzo

Los cuatro modelos aceptan los mismos cinco niveles, del más económico al más costoso. Para cada uno se da la referencia oficial, con un ejemplo de tarea.

| Nivel | Referencia oficial | Ejemplo concreto |
|---|---|---|
| `low` | Subagentes, tareas simples, chat, clasificación | Clasificar un mensaje de atención al cliente en una de tres categorías (facturación, error, otra); un [subagente](/?c=ia&s=nlp-llm&p=agents) (agente secundario lanzado por otro agente para una subtarea) que busca en qué archivo está una función |
| `medium` | Escalón de ahorro y punto de partida para código agéntico (un agente que lee, modifica y prueba código) | Modificar una función cuyo comportamiento esperado está descrito con precisión, y después lanzar las pruebas |
| `high` | Buen compromiso calidad/tokens; mínimo para un trabajo en el que la calidad depende directamente de la finura del razonamiento | Hacer una revisión de código (releer modificaciones para encontrar errores) de un módulo de pagos |
| `xhigh` | Recomendado para la mayoría de usos de código y agentes, sobre todo los largos | Añadir una funcionalidad que toca una decena de archivos, en varias etapas encadenadas |
| `max` | Cuando la corrección importa más que el coste, solo si una medición muestra un margen en el nivel inferior | Una anomalía intermitente (que aparece solo de vez en cuando), cuya causa sigue desconocida tras un intento completo con `xhigh` |

## El coste: juzgar por tarea terminada

El coste de una llamada es: tokens de entrada × precio de entrada + tokens de salida × precio de salida. Ejemplo calculado a partir de la tabla de modelos, para una tarea de 100 000 tokens de entrada y 20 000 de salida (sin contar el efecto del esfuerzo, que hace variar la salida):

| Modelo | Entrada (0,1 M) | Salida (0,02 M) | Total |
|---|---|---|---|
| Haiku 5.5 | 0,01 $ | 0,01 $ | 0,02 $ |
| Sonnet 5.5 | 0,20 $ | 0,20 $ | 0,40 $ |
| Opus 5.5 | 0,40 $ | 0,40 $ | 0,80 $ |
| Fable 5.1 | 1,00 $ | 1,00 $ | 2,00 $ |

Subir el esfuerzo hace crecer la salida, y por tanto la factura. Pero el buen indicador no es el precio de una petición, sino el coste por **tarea terminada**. Una petición más barata que obliga a encadenar más turnos (intercambios sucesivos con el modelo) no cuesta menos en total. El seguimiento se hace como para cualquier [coste de LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

El nivel `max` sigue, por tanto, una regla estricta: solo se justifica para un problema de frontera (sin solución conocida), **tras un fallo constatado en `xhigh`**. Nunca por defecto, nunca por precaución.

## Lo que un esfuerzo superior no garantiza

| Límite | Explicación |
|---|---|
| Rendimientos decrecientes | Cada escalón cuesta más tokens y tiempo, para una mejora de calidad cada vez menor, incluso nula en una tarea ya resuelta con el nivel inferior |
| Sobrerreflexión | En una tarea simple, un esfuerzo alto gasta tokens en examinar lo que no necesita serlo |
| Ninguna verdad garantizada | Un esfuerzo alto no elimina las [alucinaciones](/?c=ia&s=nlp-llm&p=llm-en-production) (afirmaciones inventadas, enunciadas con seguridad): el resultado siempre debe verificarse |
| Ningún sustituto de una buena instrucción | Una petición vaga sigue siendo vaga en `max`: la [redacción del prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) es lo primero |

## Estimar el modelo y el esfuerzo de una tarea

Ninguna pareja de modelo y esfuerzo es la adecuada por defecto: se estima según la tarea, con seis preguntas. Las orientaciones son reglas prácticas, no mediciones de Anthropic: una prueba con una muestra real las confirma o las corrige.

| Pregunta sobre la tarea | Si la respuesta es sí | Orientación |
|---|---|---|
| ¿Cabe en un solo paso, con una respuesta fácil de comprobar (clasificar, extraer, reformular)? | Tarea simple | Haiku 5.5, esfuerzo `low` |
| ¿Está bien descrita, con un resultado esperado preciso, pero en varios pasos o archivos (código corriente, redacción, depuración sencilla)? | Tarea corriente | Sonnet 5.5, esfuerzo `medium` |
| ¿Contiene una ambigüedad, una causa desconocida que encontrar o una decisión de arquitectura que tomar? | Tarea difícil | Opus 5.5, esfuerzo `high` |
| ¿Opus 5.5 sigue fallando con un esfuerzo alto? | Límite del modelo | Fable 5.1; `max` solo tras un fallo constatado en `xhigh` |
| ¿Un error cuesta caro o es difícil de deshacer (revisión antes de una acción irreversible, trabajo largo y autónomo)? | Riesgo alto | Subir el esfuerzo (`xhigh`) antes de cambiar de modelo |
| ¿El volumen es grande o la rapidez es esencial? | Restricción de precio o de plazo | Bajar un escalón de modelo y validar con una muestra real |

Cuando una tarea falla, la pregunta es: ¿hace falta un modelo más fuerte o más esfuerzo? Si el modelo hace la tarea a la ligera (olvidos, respuesta superficial, paso omitido), se sube el **esfuerzo**. Si falla a pesar de un esfuerzo alto, porque le falta el razonamiento o el conocimiento para esta tarea, se cambia de **modelo**. El esfuerzo no sustituye lo que le falta al modelo, y un modelo grande con esfuerzo bajo puede pasar por alto un detalle.

## Árbol de decisión

```text
Tarea que confiar a Claude
        │
        ▼
1. MODELO: elegir según la tarea
        │
        ├─ numerosa, corta, rapidez esencial ───────────────► Haiku 5.5
        ├─ trabajo diario, equilibrio rapidez/calidad ──────► Sonnet 5.5
        ├─ trabajo largo y autónomo, caso general ──────────► Opus 5.5
        └─ razonamiento exigente, Opus insuficiente ────────► Fable 5.1
        │
        ▼
2. ESFUERZO: partir del valor por defecto del modelo, subir solo si la tarea
   lo justifica de forma concreta (ambigüedad fuerte, riesgo alto, fallo constatado)
        │
        ├─ simple, subagente, clasificación ───► low
        ├─ código bien especificado ───────────► medium
        ├─ revisión, trabajo sensible ─────────► high
        ├─ código o agente largo ──────────────► xhigh
        └─ fallo constatado en xhigh, problema
           sin solución conocida ──────────────► max
        │
        ▼
3. Medir el coste por tarea terminada: ¿insuficiente? subir un escalón y volver a medir
```

## Pedir un nivel en Claude Code y en la API

[Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) es el asistente de IA que se maneja desde un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Una **sesión** es en él una conversación en curso. La elección se fija en tres lugares:

| Dónde | Ajuste | Alcance |
|---|---|---|
| Sesión de Claude Code | Comandos `/model` y `/effort` | La sesión en curso, y las nuevas sesiones (ajuste guardado por defecto) |
| Definición de agente | Líneas `model:` y `effort:` de la cabecera del archivo | Cada vez que se lanza este [agente](/?c=ia&s=nlp-llm&p=agents) |
| API | Campo `output_config` con `effort` | La petición enviada |

### En la sesión

```text
/model sonnet
```

Un comando que empieza por `/` se escribe en la conversación de Claude Code. `/model <nombre>` cambia el modelo de la sesión y lo guarda por defecto para las nuevas sesiones.

```text
/effort medium
```

`/effort <nivel>` fija el esfuerzo. Respuesta observada: « Set effort level to medium (saved as your default for new sessions): Balanced approach with standard implementation and testing ». El nivel sigue, pues, aplicado a las sesiones siguientes: hay que volver a ponerlo en su valor habitual tras una necesidad puntual.

### En una definición de agente

Una definición de agente es un archivo de la carpeta `~/.claude/agents/` (el `~` designa la carpeta personal del usuario, ver [rutas y árbol de carpetas](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), llamado `<nombre>.md`. Su **cabecera** (*frontmatter*) es un bloque de ajustes encerrado entre dos líneas `---`, en formato [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (líneas `clave: valor`). Extracto del archivo real `builder-sonnet-medium.md` (descripción abreviada y traducida; las líneas `tools` y `color`, sin relación con el tema, se omiten):

```yaml
---
# Inicio de la cabecera
name: builder-sonnet-medium
# Nombre con el que se llama al agente
description: Realiza UNA subtarea de un plan validado (sonnet, effort medium: trabajo diario).
# Papel del agente en una frase
model: sonnet
# Modelo del agente: aquí se acepta un nombre corto
effort: medium
# Nivel de esfuerzo del agente: low, medium, high, xhigh o max
---
# Fin de la cabecera: el texto que sigue en el archivo contiene las instrucciones del agente
```

El archivo `builder-haiku.md` lleva `model: haiku` pero ninguna línea `effort:`: el archivo no fija, pues, ningún esfuerzo. Su descripción dice « sans effort » (sin esfuerzo), lo que aquí significa « ningún ajuste fijado », no « Haiku no gestiona el esfuerzo »: Haiku 5.5 acepta los cinco niveles.

### Lado de la API

Una petición es un mensaje [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un formato de intercambio de datos en texto) enviado al servicio. El esfuerzo se fija en el campo `output_config`:

```text
// Contenido parcial de la petición: los demás campos (los mensajes, en particular) se omiten
{
    // Identificador de API del modelo (ver la tabla de modelos)
    "model": "claude-sonnet-5-5",
    // Ajustes de la salida; "effort" toma uno de los cinco niveles
    "output_config": { "effort": "medium" }
}
```

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Elegir `max` por defecto o por precaución | Coste máximo para una mejora casi siempre nula: se reserva a un fallo constatado en `xhigh` |
| Elegir el modelo solo por su precio | Un modelo demasiado pequeño falla en las tareas difíciles y cuesta reintentos; uno demasiado grande es más lento y más caro de lo necesario |
| Subir el esfuerzo antes de medir | Sin medida sobre una muestra real, no se sabe si el nivel inferior bastaba |
| Juzgar el coste por petición | Una petición más barata que pide más turnos cuesta igual o más por tarea terminada |
| Comparar dos modelos con esfuerzo distinto | Los valores por defecto difieren (Sonnet 5.5 en `high`, Opus 5.5 en `medium`): la comparación ya no mide solo el modelo |
| Olvidar que un ajuste queda guardado | `/model` y `/effort` persisten para las nuevas sesiones: un nivel alto dejado en su sitio encarece cada sesión siguiente |
| Creer que Haiku no gestiona ningún esfuerzo | Cierto para los Haiku 4.5 antiguos, falso para la generación actual: Haiku 5.5 acepta de `low` a `max` |
| Contar con el esfuerzo para compensar una instrucción vaga | Profundiza el razonamiento, pero no adivina la intención: hay que aclarar antes el prompt |
| Fiarse de valores de memoria | Modelos, niveles y tarifas cambian: releer la documentación oficial antes de decidir |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Elegir el modelo según la tarea, conservar el más pequeño que tenga éxito con una muestra real y partir de su esfuerzo por defecto | El precio y la latencia bajan hacia Haiku, la capacidad en tareas difíciles sube hacia Fable; solo se sube si la tarea lo justifica |
| Subir por una razón concreta: ambigüedad fuerte, riesgo alto o fallo constatado | Cada escalón tiene un coste; una razón precisa evita pagarlo sin necesidad |
| Reservar `max` a un fallo constatado en `xhigh` sobre un problema sin solución conocida | Es el único caso en que el margen adicional puede valer su precio |
| Medir con una muestra real antes de subir un valor por defecto | Una medida prevalece sobre la intuición (ver [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Fijar el nivel en la cabecera de cada agente | Cada rol conserva su modelo y su esfuerzo, por ejemplo `low` para un subagente de búsqueda |
| Vigilar el coste por tarea terminada | Es el único indicador que cuenta los turnos adicionales |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Dos ajustes: el modelo (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, del más rápido y barato al más capaz y caro; fija la rapidez, el precio y la dificultad de las tareas que logra resolver) y el esfuerzo (`low`, `medium`, `high`, `xhigh`, `max`). Se empieza por el valor por defecto y solo se sube por una razón concreta. `max` se reserva a un fallo constatado en `xhigh`. En Claude Code: `/model`, `/effort`, las líneas `model:` y `effort:` de un agente; en la API: `output_config`. |
| **Trampas a evitar** | `max` por defecto, subir sin medir, juzgar el coste por petición, comparar con esfuerzo distinto, olvidar que un ajuste queda guardado, creer que Haiku 5.5 no gestiona el esfuerzo, esperar que el esfuerzo corrija una instrucción vaga. |
| **Buenas prácticas** | Modelo elegido según la tarea (el más pequeño que tenga éxito), medir con una muestra real, fijar el nivel en la cabecera de los agentes, juzgar el coste por tarea terminada, verificar la documentación oficial. |
