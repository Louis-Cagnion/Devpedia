---
order: 3
---

# Arbitraje local vs cloud para un modelo de visión

El capítulo [El stack de IA](/?c=ia&s=production-et-gouvernance&p=stack-ia) detalla la elección entre API alojada y modelo autoalojado para un **LLM**. Un modelo de [visión por computador](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (un OCR estructurado, por ejemplo) plantea la misma cuestión de fondo, pero con respuestas a veces invertidas: este capítulo retoma los mismos criterios (exposición de los datos, coste, latencia) recalculándolos para este caso preciso, sin repetir el principio ya planteado para los LLM.

## Lo que cambia respecto a un LLM

| Criterio | LLM (recordatorio) | Modelo de visión/OCR |
|---|---|---|
| Tamaño típico del modelo | A menudo decenas de miles de millones de parámetros: autoalojar un modelo competitivo exige una [GPU](/?c=infrastructure&p=cpu-vs-gpu) considerable, a veces varias | A menudo mucho más pequeño (unos cientos de millones de parámetros para un pipeline de OCR estructurado): funciona sin dificultad en una GPU modesta, a veces incluso en CPU para un volumen razonable |
| Facturación de una API alojada | Por token, leído y generado | Por página o por imagen procesada, un modelo de coste diferente (sin noción de longitud de texto generado) |
| Naturaleza del dato expuesto | El prompt (texto, potencialmente confidencial) | La imagen enviada (un documento escaneado entero), que puede contener mucha más información que la realmente útil (toda la página, no solo la tabla a leer) |
| Tolerancia a la latencia | A menudo interactiva (un usuario espera una respuesta) | A menudo un procesamiento por lotes (*batch*), en segundo plano, sobre un conjunto de documentos: unos segundos más por página tienen poco impacto real |

Estas diferencias desplazan el punto de equilibrio: el tamaño de modelo más pequeño hace el autoalojamiento accesible a un equipo que nunca habría contemplado autoalojar un LLM, y una latencia tolerante reduce la ventaja habitual de una API alojada (respuesta rápida, sin inversión en hardware).

## La exposición de los datos: el criterio que a menudo decide solo

Enviar un documento a una API de visión alojada significa transmitir la **imagen completa** de la página a un tercero, no solo la información que se busca extraer de ella. Para un documento interno o confidencial (un contrato, una ficha técnica propietaria), esta exposición puede por sí sola descalificar una API alojada, independientemente de su coste o de su calidad:

> **Trampa:** evaluar una API de visión alojada únicamente por su precio por página y su calidad de reconocimiento, sin haber verificado de antemano si el tipo de documento tratado está autorizado a transitar por un tercero (ver los principios de [gobernanza de datos](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees), aplicables aquí de la misma forma que para un LLM).
>
> **Buena práctica:** zanjar la cuestión de la exposición de los datos **antes** de comparar los costes: si la naturaleza de los documentos tratados lo prohíbe, el autoalojamiento se convierte en la única opción válida, sea cual sea el resultado de un cálculo de coste por lo demás favorable al cloud.

## El coste, recalculado para un procesamiento por lotes

Un pipeline que procesa rutinariamente un gran volumen de documentos (cientos de PDF al día, por ejemplo) acumula un coste por página que crece linealmente con el volumen, sin detenerse nunca mientras el servicio funcione. Un modelo autoalojado, una vez amortizado el hardware, procesa un volumen adicional a un coste marginal casi nulo:

| | API alojada | Modelo autoalojado |
|---|---|---|
| Coste a bajo volumen | Competitivo: ninguna inversión en hardware | Coste fijo del hardware a amortizar, desventajoso mientras el volumen siga siendo bajo |
| Coste a alto volumen, regular | Crece indefinidamente con el volumen procesado | Se vuelve rentable: el hardware ya amortizado absorbe un volumen creciente sin coste marginal significativo |

> **Trampa:** proyectar el coste de una API alojada sobre su volumen actual, sin anticipar su crecimiento. Un pipeline de procesamiento documental tiende a ver crecer su volumen con el tiempo (más documentos, más fuentes), desplazando progresivamente el equilibrio hacia el autoalojamiento.
>
> **Buena práctica:** calcular ambas opciones sobre una proyección de volumen a medio plazo, no solo sobre el volumen del día, antes de decidir una elección que será costosa de cambiar una vez construido el pipeline en torno a ella.

## La latencia: una ventaja que se desvanece en procesamiento por lotes

Una API alojada gana en general en la latencia de una petición aislada, un criterio decisivo para un uso interactivo. Un pipeline documental que procesa documentos en segundo plano, sin usuario esperando un resultado de forma inmediata, aprovecha mucho menos esta ventaja: unos segundos más por página, multiplicados por un procesamiento asíncrono, tienen un impacto insignificante en la experiencia real.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La elección API alojada / autoalojado para un modelo de visión retoma los criterios ya vistos para un LLM, pero recalculados: modelos más pequeños (autoalojamiento más accesible), facturación por página en lugar de por token, imagen completa expuesta en lugar de un prompt de texto, tolerancia a la latencia más alta en procesamiento por lotes. |
| **Herramientas utilizables** | Una proyección de volumen a medio plazo para calcular el coste de ambas opciones; una clasificación previa de los documentos tratados (ver la gobernanza de datos) para zanjar la cuestión de la exposición antes que la del coste. |
| **Trampas a evitar** | Comparar las opciones solo por el precio sin haber verificado si la exposición de los documentos es aceptable. Calcular una API alojada sobre el volumen actual sin anticipar su crecimiento. |
| **Buenas prácticas** | Zanjar la exposición de los datos antes que el coste. Proyectar el coste sobre un volumen a medio plazo. No sobrestimar la ventaja de latencia de una API alojada para un procesamiento por lotes. |
