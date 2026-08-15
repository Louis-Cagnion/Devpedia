---
order: 6
---

# El prompt engineering: estructurar una petición para mejores resultados

El capítulo sobre [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) distingue el *prompting* del fine-tuning: sin tocar un solo peso del modelo, la forma de formular la entrada influye fuertemente en la calidad de la salida. El **prompt engineering** es la práctica, en gran parte empírica, que consiste en diseñar esta entrada metódicamente en lugar de improvisarla: algunas técnicas se repiten lo suficiente como para tratarse como un vocabulario básico, no como simples trucos aislados.

## Dar un rol e instrucciones explícitas

Un modelo al que no se le precisa ni rol ni restricciones debe adivinar el registro esperado (tono, nivel de detalle, formato) solo a partir del contenido de la pregunta. Fijarlo explícitamente en las instrucciones (a menudo al inicio del prompt, en un rol "sistema") reduce esta ambigüedad:

```text
Mal prompt:  "Explica los índices en bases de datos."

Mejor prompt:  "Eres un formador que se dirige a desarrolladores junior.
               Explica los índices en bases de datos en 3 frases como máximo,
               con una analogía concreta, sin jerga SQL sin explicar."
```

Ver la configuración de un system prompt en [Construir un chatbot](/?c=ia&s=applications-llm&p=chatbot) para este mismo principio aplicado a un asistente conversacional completo.

### Anticipar la información faltante

Ante una información faltante, un modelo no se detiene por sí mismo para pedirla: rellena el vacío con una hipótesis silenciosa, que puede divergir de lo que realmente se quería sin que nada lo señale. Precisar en las instrucciones la conducta a seguir en este caso quita esta elección implícita al modelo:

```text
Si falta una información necesaria, indícalo explícitamente en lugar
de hacer una hipótesis silenciosa, o haz la pregunta, si el contexto
se presta a ello.
```

La elección entre hacer una pregunta y avanzar con una hipótesis explícita depende del contexto: un uso interactivo (chat) se beneficia de la pregunta directa, mientras que un uso automatizado (pipeline, agente, sin humano para responder en tiempo real) necesita que el modelo avance de todos modos, indicando claramente qué hipótesis se tomó en lugar de dejarla implícita.

> **Trampa:** no precisar nada sobre este caso, suponiendo que el modelo pedirá por sí mismo una aclaración si hace falta. Sin instrucción explícita, la mayoría de las veces completa silenciosamente con la hipótesis más plausible estadísticamente, no necesariamente la que el usuario tenía en mente.
>
> **Buena práctica:** precisar siempre explícitamente la conducta esperada ante una información faltante, en lugar de contar con el sentido común del modelo.

## Detectar un prompt impreciso y proponer una versión refinada

La sección anterior trata el caso en que falta una información *en medio* de la tarea, una vez ya empezada. Un prompt también puede ser impreciso *desde el principio* (un objetivo vago, un formato no precisado, una elección que en realidad pertenece a la persona que pregunta), hasta el punto de que ningún intento, ni siquiera prudente, tiene una buena razón para ir en una dirección más que en otra. En ese caso, la mejor respuesta no es ni adivinar, ni producir un resultado genérico: es devolver una **versión refinada del prompt**, que liste con precisión lo que falta y proponga una reformulación concreta, antes de embarcarse en un trabajo que tiene buenas posibilidades de tener que rehacerse:

```text
Prompt recibido:  "Haz un informe sobre las ventas."

Sin refinar  ->  un informe producido al azar de hipótesis implícitas
                 (¿qué periodo? ¿qué productos? ¿qué formato? ¿para quién?)

Con refinado  ->  "Para este informe, ¿puedes precisar:
                   - el periodo cubierto (¿mes en curso? ¿año? ¿comparación
                     con el año pasado?)
                   - el formato esperado (¿síntesis de una página? ¿tabla
                     detallada?)
                   - el destinatario (¿dirección? ¿equipo comercial?)
                   Si no, parto de: el mes en curso, una síntesis de una
                   página, para la dirección."
```

Una pregunta concreta, formulada en opciones identificables (como arriba), obtiene una respuesta más rápida y más útil que una pregunta abierta del tipo "¿puedes precisar?", que deja a la persona la carga de adivinar ella misma qué faltaba.

> **Trampa:** pedir un refinado sobre un prompt ya suficientemente preciso como para ejecutarse sin ambigüedad real. Sistematizar la pregunta en lugar de reservarla a los casos que lo justifican ralentiza el intercambio y da la impresión de que el modelo esquiva la tarea en lugar de buscar hacerla bien.
>
> **Buena práctica:** reservar el refinado a los casos donde varias interpretaciones siguen siendo igual de plausibles, o donde una elección (alcance, formato, restricción) pertenece claramente a la persona que pregunta; y proponer siempre, junto con la pregunta, una hipótesis por defecto razonable para no bloquear totalmente el avance si no responde.

### Proponer varias pistas en lugar de una sola pregunta

La pregunta de arriba funciona bien cuando la información faltante es un parámetro factual (un periodo, un destinatario): la persona sabe inmediatamente qué responder. Funciona peor cuando la incertidumbre recae sobre una dirección estilística o creativa (un tono, una estructura, un ángulo), difícil de zanjar en abstracto, sin nada concreto ante los ojos. En ese caso, en lugar de una pregunta abierta, esbozar directamente dos o tres pistas cortas y claramente diferentes deja a la persona reaccionar ante algo tangible, en lugar de tener que proyectarse sobre una descripción verbal:

```text
Prompt recibido:  "Escribe un eslogan para nuestra nueva app de fitness."

Sin pistas  ->  un solo eslogan, en un tono elegido arbitrariamente
                por el modelo

Con pistas  ->  "Tres direcciones posibles, dime cuál desarrollar:
                 1. Humorística: 'Tu sofá va a tener que buscarse
                    un nuevo mejor amigo.'
                 2. Factual: 'Sigue tu progreso, día tras día.'
                 3. Premium: 'El rendimiento, sin concesiones.'"
```

Cada pista debe seguir siendo corta (una línea, no un párrafo): el objetivo es hacer elegir una dirección, no entregar un trabajo terminado en varios ejemplares: el desarrollo completo llega después de la elección, una vez validada la dirección.

> **Trampa:** multiplicar las pistas más allá de 3-4, o proponer variantes que solo se distinguen por detalles de formulación en lugar de por un eje realmente diferente (tono, estructura, ángulo). Más allá de cierto número, o sin diferencia clara entre ellas, la persona pierde más tiempo comparando del que habría tardado en responder a una pregunta directa.
>
> **Buena práctica:** limitar las pistas a 2-3 opciones realmente distintas en el eje que plantea el problema, cada una lo bastante corta como para seguir siendo barata de producir; y reservar la técnica a los casos donde la diferencia se juzga mejor sobre un ejemplo concreto que sobre una descripción abstracta.

## El few-shot prompting: mostrar en lugar de describir

En lugar de describir abstractamente el formato o el estilo esperado, dar directamente uno o varios ejemplos entrada → salida en el prompt (el *few-shot prompting*) explota la capacidad del modelo para detectar un patrón y reproducirlo:

```text
Clasifica el sentimiento de cada reseña en positivo/negativo/neutro.

Reseña: "Entrega rápida, producto conforme."          -> positivo
Reseña: "Correcto sin más, nada excepcional."          -> neutro
Reseña: "Paquete llegó dañado, ninguna respuesta del SAT." -> negativo

Reseña: "El producto funciona pero el embalaje estaba roto." -> ?
```

Un prompt sin ejemplo (*zero-shot*) funciona para tareas simples o ya bien representadas en el entrenamiento del modelo; añadir de 2 a 5 ejemplos bien elegidos mejora notablemente la fiabilidad sobre un formato o un estilo específico, sin costar el tiempo ni los datos de un fine-tuning.

> **Trampa:** elegir ejemplos no representativos o sesgados (todos positivos, todos escritos en el mismo tono, todos muy cortos). El modelo reproduce fielmente el patrón de los ejemplos proporcionados, incluidos sus sesgos, no solo su formato.
>
> **Buena práctica:** elegir ejemplos que cubran la diversidad real de los casos esperados (estilos, longitudes, casos límite), no solo casos fáciles o similares entre sí.

## El razonamiento paso a paso (*chain-of-thought*)

Un LLM genera su respuesta token por token, apoyándose cada token en todos los ya producidos (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)), incluidos los de su propia respuesta en curso de escritura. Pedir explícitamente al modelo que detalle su razonamiento antes de concluir ("piensa paso a paso antes de responder") le da así, concretamente, más tokens intermedios sobre los que apoyarse para construir una conclusión: una ganancia sobre todo clara en tareas de varias etapas (cálculo, lógica, descomposición de un problema):

```text
Sin chain-of-thought:  "Un tren sale a las 14:12 a 80km/h, otro a las 14:27
                        a 100km/h por la misma vía. ¿A qué hora el segundo
                        alcanza al primero?"
                        -> riesgo de dar un resultado directamente, sin verificarlo

Con chain-of-thought:  "... Detalla tu razonamiento paso a paso,
                        luego da la respuesta final en la última línea."
                        -> el modelo plantea los cálculos intermedios antes de concluir
```

Pedir además una etapa de verificación antes de concluir ("relee tu respuesta y verifica que respeta bien [restricción]") prolonga el mismo principio: da al modelo la ocasión de detectar él mismo una restricción no respetada antes de que llegue a la salida final, en lugar de descubrir la desviación solo al releerla después uno mismo.

> **Trampa:** tomar el razonamiento mostrado por el modelo como un relato fiel de lo que realmente produjo la respuesta. Nada garantiza que las etapas mostradas correspondan exactamente al mecanismo interno que llevó a la conclusión: un razonamiento que *parece* coherente puede acompañar a una conclusión falsa, o al revés.
>
> **Buena práctica:** tratar un razonamiento chain-of-thought como una ayuda a la fiabilidad de la respuesta (y a su relectura por un humano), no como una prueba garantizada de su exactitud.

## Estructurar el prompt: separar instrucciones, contexto y datos

Un prompt que mezcla instrucciones, contexto y datos a tratar en un solo bloque de texto deja al modelo la carga de adivinar dónde termina uno y dónde empieza el otro. Delimitar claramente cada parte (etiquetas, comillas triples, títulos) reduce esta ambigüedad, y hace también más difícil que un dato inyectado en el contexto se interprete como una instrucción (ver la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)):

```text
### Instrucciones
Resume el texto de abajo en 2 frases, en español.

### Texto a resumir
"""
{texto_usuario}
"""
```

Precisar el formato de salida esperado (JSON con claves nombradas, una lista con viñetas, una tabla) en las propias instrucciones evita además tener que re-parsear una respuesta en lenguaje libre.

> **Trampa:** mezclar en un solo bloque de texto las instrucciones y un dato externo (entrada de usuario, contenido de un archivo o de un sitio recuperado automáticamente...) sin ninguna separación visual: el modelo no tiene entonces ningún medio fiable de distinguir una instrucción legítima de un texto que, dentro del propio dato, se hiciera pasar por una instrucción (ver la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)).
>
> **Buena práctica:** delimitar siempre explícitamente cada parte (etiquetas, comillas triples, títulos) y precisar en las instrucciones que el contenido así delimitado es un dato a tratar, nunca una orden a ejecutar.

## Plantilla: un prompt único para una tarea simple

El esqueleto de abajo reúne todas las técnicas anteriores en un solo modelo reutilizable, a adaptar tarea por tarea: cada sección corresponde a una técnica vista más arriba (rol, gestión de la ambigüedad, few-shot, verificación, formato):

```text
## Rol
Eres [rol / experiencia esperada].
Tu misión: [objetivo principal, en una frase].

## Instrucciones
1. [instrucción precisa]
2. [instrucción precisa]

Restricciones: [contenido a respetar]; [qué evitar].
Si falta una información necesaria: [haz una pregunta / señala la hipótesis tomada].

## Contexto
"""
[información necesaria para realizar la tarea]
"""

## Datos a tratar
"""
[texto / código / archivo / problema en cuestión]
"""

## Ejemplo(s)
Entrada: [ejemplo de entrada]  ->  Salida esperada: [ejemplo de salida]

## Método
Antes de concluir, verifica que el resultado respeta bien las restricciones de arriba.

## Formato de salida
[formato exacto esperado: corto / detallado / estructurado / directamente utilizable]
```

No todas estas secciones son sistemáticamente necesarias: una pregunta simple y ya sin ambigüedad no necesita ni ejemplo, ni una rúbrica "Contexto" separada. La plantilla sirve de lista de verificación, no de formulario a rellenar íntegramente cada vez.

## Descomponer una tarea compleja en lugar de un solo prompt monolítico

Un prompt único que pide a la vez analizar, calcular y redactar acumula los riesgos de error de cada subtarea. Dividir en varios prompts más pequeños y encadenados (*prompt chaining*, la salida de uno se convierte en la entrada del siguiente) permite verificar un resultado intermedio antes de continuar, en lugar de descubrir un error solo en el resultado final. Es el mismo principio, no automatizado aquí, que motiva el bucle de los [agentes](/?c=ia&s=nlp-llm&p=agents): un agente no es otra cosa que este encadenamiento convertido en pilotado por el modelo en lugar de por un desarrollador que encadena los prompts a mano.

En un proyecto de tamaño significativo, esta división se estructura en etapas sucesivas, cada una limitada a un objetivo preciso antes de pasar a la siguiente:

1. **Cadrage (encuadre)**: objetivos, restricciones, recursos disponibles; pedir al modelo que identifique las informaciones faltantes y los riesgos, sin producir nada todavía.
2. **Diseño**: división en subtareas, dependencias entre ellas, arquitectura general; siempre sin programar.
3. **Plan de implementación**: para cada subtarea: entradas, salida esperada, criterios de éxito, tests a realizar.
4. **Realización**, una subtarea a la vez, recordando en cada prompt el contexto relevante y la arquitectura validada, para no hacer que el modelo la deduzca de nuevo en cada etapa.
5. **Verificación independiente**: un prompt separado donde el modelo asume un rol de revisor en lugar de autor: esta separación reduce el riesgo de que valide su propio trabajo sin espíritu crítico, un sesgo más marcado cuando redacción y revisión se mezclan en el mismo prompt.
6. **Corrección**, centrada únicamente en los problemas señalados en la etapa anterior.
7. **Tests**, luego **finalización**: una última revisión global que compara el resultado con los requisitos de partida.

> **Trampa:** dejar que el modelo se precipite hacia una implementación antes de que el encuadre y el diseño estén validados: una precipitación frecuente, que produce un resultado técnico incluso antes de que el problema esté correctamente planteado.
>
> **Buena práctica:** pedir explícitamente al modelo que no produzca nada ("no programes todavía") en las etapas de encuadre y diseño, esta instrucción rara vez resulta superflua.

### Plantilla: una cadena de prompts para un proyecto complejo

Cada etapa de abajo se convierte en un prompt separado, cuya salida (validada antes de continuar) alimenta el prompt siguiente:

```text
[1. Encuadre]
Objetivos: [...]  |  Restricciones: [...]  |  Recursos disponibles: """[...]"""
-> No implementes nada: lista riesgos, informaciones faltantes, preguntas a resolver.

[2. Diseño]
Encuadre validado: """[salida de la etapa 1]"""
-> División en subtareas, dependencias entre ellas, arquitectura general. Siempre sin programar.

[3. Plan de implementación]
Diseño validado: """[salida de la etapa 2]"""
-> Para cada subtarea: entradas, salida esperada, archivos afectados, criterios de éxito.

[4. Realización de una subtarea]
Contexto relevante + arquitectura validada: """[...]"""  |  Subtarea actual: """[...]"""
-> Realiza únicamente esta subtarea; señala sin corregir un problema detectado en otro sitio.

[5. Verificación independiente]
Resultado a verificar: """[salida de la etapa 4]"""  |  Criterios de éxito: """[...]"""
-> Actúa como un revisor independiente. No modifiques nada. Clasifica los problemas encontrados
   (CRÍTICO / IMPORTANTE / MENOR), concluye con VALIDADO o A CORREGIR.

[6. Corrección]
Resultado de la verificación: """[salida de la etapa 5]"""
-> Corrige únicamente los problemas listados, sin tocar el resto.

[7. Tests y finalización]
Estado final: """[...]"""  |  Requisitos iniciales: """[salida de la etapa 1]"""
-> Verifica que cada requisito está satisfecho; lista lo que queda, si aplica.
```

## Iterar y evaluar en lugar de juzgar sobre un solo intento

El no determinismo de un LLM (ver [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production)) hace que un solo intento sea poco fiable para juzgar que un prompt "funciona": una buena respuesta una vez no garantiza que se repetirá en un caso ligeramente diferente. Volver a ejecutar sistemáticamente un prompt candidato sobre un pequeño conjunto de casos representativos (el mismo *golden set* que el usado para evaluar un sistema en producción, ver [Monitorización y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) antes de considerarlo estable es lo que distingue el prompt engineering de un simple bricolaje por ensayo y error.

> **Trampa:** validar un prompt con un solo intento exitoso, y luego considerarlo fiable. El no determinismo del modelo significa que un mismo prompt puede producir una salida diferente de una llamada a otra: un solo éxito no prueba nada sobre la fiabilidad general.
>
> **Buena práctica:** volver a ejecutar sistemáticamente un prompt candidato sobre varios casos representativos (un *golden set*) antes de considerarlo estable, en lugar de juzgar sobre un solo intento.

## Los límites del prompt engineering

Ninguna de estas técnicas añade conocimiento o capacidad que el modelo no haya adquirido ya durante su entrenamiento: solo explotan lo mejor posible lo que ya existe (ver la distinción fine-tuning vs prompting en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). Un modelo que nunca vio datos relevantes sobre un tema, o que ignora eventos posteriores a su fecha de corte, no producirá una mejor respuesta porque el prompt esté mejor escrito: es el papel del [RAG](/?c=ia&s=nlp-llm&p=rag) (datos externos) o del fine-tuning (nuevas capacidades), no del prompt engineering.

## Resumen

| | |
|---|---|
| **Para recordar** | El prompt engineering formula la entrada de un LLM metódicamente: rol e instrucciones explícitas, detección de un prompt impreciso antes de comprometerse (mediante una pregunta específica o varias pistas concretas), ejemplos (few-shot), razonamiento paso a paso (chain-of-thought), separación instrucciones/contexto/datos, descomposición de una tarea compleja en etapas verificables. No añade ninguna capacidad que el modelo no tenga ya. |
| **Herramientas utilizables** | Una plantilla de prompt reutilizable (ver el modelo de arriba); un *golden set* de casos representativos para evaluar un prompt antes de considerarlo estable. |
| **Trampas a evitar** | No precisar la conducta a seguir ante una información faltante. Sistematizar una petición de refinado incluso sobre un prompt ya preciso. Multiplicar las pistas propuestas o hacerlas demasiado parecidas entre sí. Ejemplos few-shot no representativos o sesgados. Mezclar instrucciones y datos sin delimitarlos. Tomar un razonamiento chain-of-thought por una prueba de exactitud. Precipitarse hacia la implementación antes de haber validado encuadre y diseño. Validar un prompt con un solo intento exitoso. |
| **Buenas prácticas** | Precisar siempre la conducta esperada en caso de ambigüedad. Reservar el refinado a los casos de ambigüedad real, con una hipótesis por defecto además de la pregunta. Ante una incertidumbre estilística o creativa, proponer 2-3 pistas cortas y claramente distintas en lugar de una pregunta abstracta. Elegir ejemplos few-shot representativos de la diversidad real de los casos. Delimitar siempre explícitamente instrucciones, contexto y datos. Volver a ejecutar un prompt sobre varios casos antes de considerarlo fiable. |
