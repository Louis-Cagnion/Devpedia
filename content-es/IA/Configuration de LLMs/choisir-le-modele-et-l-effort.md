---
order: 2
---

# Elegir el modelo y el nivel de esfuerzo de Claude

> **Valores verificados el 11/10/2026.** Los modelos, los niveles de esfuerzo y las tarifas evolucionan: hay que verificar la documentación oficial de [Anthropic](https://www.anthropic.com), la empresa que desarrolla Claude, en la [página de modelos](https://docs.claude.com/en/docs/about-claude/models) y en la [página de tarifas](https://www.anthropic.com/pricing).

**Claude** es una familia de [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (modelos de lenguaje de gran tamaño, programas que producen texto). Dos ajustes determinan el resultado y la factura: el **modelo** (qué programa responde) y el **esfuerzo** (cuánto trabajo aporta antes de responder). Una mala elección sale cara en los dos sentidos: si es demasiado débil, la tarea fracasa; si es demasiado fuerte, se pagan [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (los fragmentos de palabras que el modelo lee y escribe, y que se facturan) para nada. Este capítulo ofrece las pautas para elegir y luego muestra dónde fijar cada ajuste en [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) y en la [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (la forma de enviar peticiones a un servicio desde un programa).

## Dos ajustes distintos

| Ajuste | Pregunta | Qué cambia |
|---|---|---|
| Modelo | ¿Qué programa responde? | El precio por token, la capacidad de razonamiento, el tiempo de respuesta (la latencia, ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) |
| Esfuerzo | ¿Qué trabajo aporta para esta respuesta? | El número de tokens producidos, por tanto el coste y el tiempo; un esfuerzo bajo también produce menos llamadas a herramientas (acciones como leer un archivo, ver [Agentes](/?c=ia&s=nlp-llm&p=agents)), menos preámbulo (texto introductorio antes de actuar) y confirmaciones más breves |

Ambos se combinan y se eligen juntos, como muestra el árbol de decisión más abajo.

## Los modelos actuales

Cada modelo tiene un **identificador de API**: la cadena exacta que hay que proporcionar cuando un programa llama al servicio mediante la API. Los precios están en dólares por millón de tokens (M). La **entrada** designa los tokens enviados al modelo (el [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), la instrucción y los documentos proporcionados), y la **salida** los que produce (la respuesta), que son más caros.

| Modelo | Identificador de API | Entrada ($/M) | Salida ($/M) | Esfuerzo por defecto | Cuándo elegirlo |
|---|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0,10 | 0,50 | medium | Tareas simples y numerosas (clasificar, extraer, conversar), subagentes: el más barato |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2,00 | 10,00 | high | Escalón intermedio: cuando Haiku falla con una muestra real (algunas tareas representativas de su propio trabajo) y el sobrecoste de Opus no está justificado |
| Claude Opus 5.5 | `claude-opus-5-5` | 4,00 | 20,00 | medium | Cuando Sonnet falla con una muestra real; su razonamiento no puede desactivarse, el esfuerzo es su único ajuste de profundidad |
| Claude Fable 5.1 | `claude-fable-5-1` | 10,00 | 50,00 | high | El más caro: solo cuando Opus falla con un esfuerzo adecuado |

Dos precisiones:

- Haiku 5.5 se factura al precio de la tabla para prompts de hasta 100 000 tokens; por encima, 0,50 $ de entrada y 2,50 $ de salida.
- Los cuatro modelos tienen una ventana de contexto de 1 millón de tokens: la cantidad máxima de texto (prompt y respuesta incluidos) que procesan de una vez (ver [la ventana de contexto](/?c=ia&s=nlp-llm&p=llm-en-production)).

La columna « Cuándo elegirlo » aplica una regla sencilla: tomar el modelo más barato que tenga éxito en una muestra real de sus propias tareas, y subir un escalón solo si una medición lo exige.

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

## Árbol de decisión

```text
Tarea que confiar a Claude
        │
        ▼
1. MODELO: partir del más barato (Haiku 5.5) y probarlo con una muestra real
        │
        ├─ tiene éxito ──────────► quedarse con él
        └─ falla ────────────────► Sonnet 5.5, luego Opus 5.5, luego Fable 5.1
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
| Empezar por el modelo más barato y su esfuerzo por defecto | Es el punto de partida más económico; solo se sube si la tarea lo justifica |
| Subir por una razón concreta: ambigüedad fuerte, riesgo alto o fallo constatado | Cada escalón tiene un coste; una razón precisa evita pagarlo sin necesidad |
| Reservar `max` a un fallo constatado en `xhigh` sobre un problema sin solución conocida | Es el único caso en que el margen adicional puede valer su precio |
| Medir con una muestra real antes de subir un valor por defecto | Una medida prevalece sobre la intuición (ver [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Fijar el nivel en la cabecera de cada agente | Cada rol conserva su modelo y su esfuerzo, por ejemplo `low` para un subagente de búsqueda |
| Vigilar el coste por tarea terminada | Es el único indicador que cuenta los turnos adicionales |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Dos ajustes: el modelo (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, del más barato al más caro) y el esfuerzo (`low`, `medium`, `high`, `xhigh`, `max`). Se empieza por el valor por defecto y solo se sube por una razón concreta. `max` se reserva a un fallo constatado en `xhigh`. En Claude Code: `/model`, `/effort`, las líneas `model:` y `effort:` de un agente; en la API: `output_config`. |
| **Trampas a evitar** | `max` por defecto, subir sin medir, juzgar el coste por petición, comparar con esfuerzo distinto, olvidar que un ajuste queda guardado, creer que Haiku 5.5 no gestiona el esfuerzo, esperar que el esfuerzo corrija una instrucción vaga. |
| **Buenas prácticas** | El más barato primero, medir con una muestra real, fijar el nivel en la cabecera de los agentes, juzgar el coste por tarea terminada, verificar la documentación oficial. |
