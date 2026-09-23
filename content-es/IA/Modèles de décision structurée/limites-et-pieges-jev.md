---
order: 8
---

# Los límites documentados de un modelo de decisión estructurada

El capítulo [Los modelos de decisión estructurada](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#para-que-sirve-y-para-que-no) ya lista, en una tabla, los usos adecuados o no para esta familia de modelos. TypeSafe AI documenta, para su modelo Jev en la versión 1.13, nueve modos de fallo concretos, que ilustran todos la misma idea de fondo: un modelo entrenado para un juicio rápido de "sistema 1" (ver el [capítulo introductorio](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#de-donde-viene-la-idea-sistema-1-y-sistema-2)) falla en todo lo que exige un razonamiento construido en varios pasos explícitos ("sistema 2").

| # | Modo de fallo | Qué significa concretamente |
|---|---|---|
| 1 | Lectura literal | Responde a lo que la pregunta dice palabra por palabra, sin inferir una condición implícita que un humano deduciría del contexto |
| 2 | Cálculos y números | No cuenta de forma fiable (caracteres, ocurrencias en una lista larga): no es una calculadora. Tampoco juzga bien valores numéricos cercanos entre sí (ej: dos colores RGB vecinos); prefiere una descripción en palabras ("rojo brillante") a un número bruto |
| 3 | Fechas y horarios | Lee una fecha como texto, no como una cantidad ordenada: comparaciones temporales poco fiables, sobre todo con formatos mixtos o expresiones relativas ("la semana que viene") |
| 4 | Indirección compleja | Una doble negación o un razonamiento con varios niveles de indirección hace caer la precisión |
| 5 | Estados voluminosos | Un estado con detalles irrelevantes para la pregunta planteada distrae al modelo y degrada la respuesta |
| 6 | Contenido adversarial | Instrucciones inyectadas en el contenido evaluado, o un contenido formulado para engañar, pueden influir en la respuesta (ver el [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), un riesgo de la misma naturaleza ya cubierto para los LLM generativos) |
| 7 | Instrucciones contradictorias | Criterios e instrucciones que piden cosas distintas crean confusión en lugar de un arbitraje coherente |
| 8 | Invariantes lógicos no garantizados | Dos formulaciones supuestamente equivalentes en rigor (ej: la probabilidad de un Noul y 1 menos la probabilidad de su negación) no dan necesariamente el mismo resultado: no confiar en una identidad lógica supuesta, formular cada pregunta para que diga directamente lo que se quiere saber |
| 9 | Generación de texto | El modelo no está entrenado para redactar texto libre (ver el [capítulo sobre el entrenamiento](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd#rlcd-optimizar-para-una-probabilidad-fiable-no-para-un-texto)): pedírselo es a la vez lento y poco fiable |

## El hilo conductor: sentido común rápido, no razonamiento construido

Estos nueve límites no son bugs aislados sino la consecuencia directa de aquello para lo que este tipo de modelo fue entrenado: responder rápido a un juicio estrecho, nunca desplegar un razonamiento explícito. Un modelo de decisión estructurada sobresale en juicios de sentido común inmediato, y falla en todo lo que exigiría varios pasos de razonamiento encadenados.

> **Trampa:** pedir al modelo una tarea que coincide con uno o varios de estos nueve puntos (contar ocurrencias, comparar fechas relativas, decidir en base a una doble negación) esperando la misma fiabilidad que en un juicio simple.
>
> **Buena práctica:** pre-procesar en código todo lo que corresponda a un cálculo exacto (conteo, aritmética, comparación de fechas, ver el patrón de resolución en código visto para la [extracción de fechas](/?c=ia&s=modeles-de-decision-structuree&p=recettes-extraction-et-structuration#extraccion-de-fechas-leer-y-luego-resolver-en-codigo) más adelante en esta parte), y confiar al modelo solo el juicio que sigue siendo realmente subjetivo o contextual una vez aislado ese cálculo.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Un modelo de decisión estructurada como Jev falla de forma documentada en nueve tipos de tareas (lectura literal, cálculos y números, fechas relativas, indirección compleja, estados voluminosos, contenido adversarial, instrucciones contradictorias, invariantes lógicos no garantizados, generación de texto), todos ligados a su entrenamiento para un juicio rápido más que a un razonamiento construido. |
| **Herramientas utilizables** | Ninguna herramienta correctiva directa: la solución es arquitectónica (trasladar el cálculo exacto a código). |
| **Trampas a evitar** | Confiar al modelo un cálculo exacto, una comparación de fechas relativas, o un razonamiento con varios niveles de indirección. |
| **Buenas prácticas** | Aislar en código todo lo que corresponda a un cálculo verificable, reservar el modelo solo al juicio realmente contextual que queda una vez extraído ese cálculo. |
