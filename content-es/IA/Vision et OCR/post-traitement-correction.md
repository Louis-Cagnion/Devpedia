---
order: 6
---

# Post-procesamiento y corrección de un OCR

El [capítulo sobre la evaluación](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) mide los errores de un OCR; este capítulo cubre la etapa que viene justo después, antes de usar el texto reconocido: intentar **corregir** automáticamente los errores más probables, sin volver a pasar por el modelo de reconocimiento en sí.

## Corrección por diccionario

La corrección por diccionario compara cada palabra reconocida con una lista de palabras válidas (un **léxico**): si la palabra reconocida no figura ahí, se reemplaza por la entrada del léxico más cercana, medida por la [distancia de Levenshtein](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) ya vista para la evaluación:

```python
def corregir_por_diccionario(palabra, lexico, distancia_max=2):
    if palabra in lexico:
        return palabra   # ya es una palabra valida, nada que corregir

    candidatos = [(entrada, distancia_levenshtein(palabra, entrada)) for entrada in lexico]
    mejor_entrada, mejor_distancia = min(candidatos, key=lambda c: c[1])

    if mejor_distancia <= distancia_max:
        return mejor_entrada   # suficientemente cercana: se corrige
    return palabra             # demasiado diferente de toda palabra conocida: no se toca nada
```

> **Trampa:** usar un diccionario de idioma genérico (las palabras del español corriente) en un documento de negocio. Un nombre propio, una referencia de producto o un identificador técnico (`CIF`, una referencia de pedido) no pertenece a ningún diccionario generalista: el mecanismo de corrección los "corregiría" hacia la palabra del diccionario más cercana, a menudo una palabra totalmente diferente de la correcta.
>
> **Buena práctica:** construir o completar el léxico a partir del vocabulario realmente encontrado en el dominio de negocio (nombres de clientes, referencias de producto, terminología del sector), no solo de un diccionario de idioma genérico.

## Corrección contextual: más allá de la palabra aislada

Una corrección por diccionario trata cada palabra de forma aislada, sin tener en cuenta lo que la rodea. Una confusión frecuente en OCR (el dígito `0` leído como la letra `O`, o al revés) a menudo da lugar a una palabra que efectivamente existe en un diccionario, pero errónea en su contexto:

```text
"Monto total: 1O0 EUR"
              ^
        "1O0" no es reconocido como sospechoso por NINGUN diccionario de palabras
        (no es una palabra); hace falta el contexto ("Monto", "EUR")
        para saber que aqui se espera una secuencia de digitos, no una letra
```

La corrección contextual se apoya en un modelo que evalúa la **plausibilidad** de una secuencia completa, no de una palabra aislada: exactamente el principio ya visto en [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), donde un modelo de lenguaje asigna una distribución de probabilidad al siguiente token dado lo que precede. Aplicado aquí, un modelo de lenguaje evalúa cuál de las lecturas candidatas (`1O0` vs `100`) es más probable dado el contexto ("Monto total:", seguido de "EUR") en lugar de juzgar el token solo.

> **Trampa:** aplicar una corrección contextual uniforme, con la misma confianza, a todo el documento. Una corrección basada en la plausibilidad **estadística** puede, a diferencia de un error de OCR real, "corregir" un valor raro pero perfectamente exacto (un monto inusual, un nombre poco común) hacia un valor más frecuente pero falso.
>
> **Buena práctica:** reservar la corrección contextual automática para los campos de texto libre, y desactivarla (o usarla solo como señalización, no como reemplazo automático) en los campos de alta restricción de formato (montos, identificadores), tratados por validación de formato (ver más abajo), más fiable para este tipo de dato.

## Validación por formato: aprovechar lo que ya se sabe del campo esperado

Muchos campos de un documento estructurado siguen un formato conocido de antemano (una fecha, un número de CIF con un formato fijo, un código postal de 5 dígitos): una restricción que una [expresión regular](/?c=domain-specific-languages-dsl&p=regex) basta para verificar, sin diccionario ni modelo de lenguaje:

```python
import re

def formato_codigo_postal_valido(texto):
    return re.fullmatch(r"\d{5}", texto) is not None

formato_codigo_postal_valido("2801 8")  # False -> un espacio de mas, señala un error probable de OCR
formato_codigo_postal_valido("28018")   # True
```

Un campo que falla esta verificación se marca como sospechoso, incluso sin saber precisamente *qué* corrección aplicar: una información ya útil en sí misma para priorizar una relectura humana.

## Detección por forma estadística: señalar sin corregir

Los tres enfoques anteriores tienen todos un punto en común: saben, o intentan adivinar, **qué** valor sería el correcto. Un campo de texto libre, sin léxico de negocio ni formato conocido, no se presta a ninguno de los tres: queda la posibilidad de detectar que **un valor tiene una forma estadísticamente sospechosa**, sin pretender saber corregirlo.

Dos señales frecuentes en la práctica:

- **Un ratio de letras aisladas anormalmente elevado**: una letra única rodeada de dígitos (`"12A34"`) es rara en un texto real bien reconocido; una tasa elevada de este patrón en un documento a menudo delata una confusión dígito/letra sistemática del modelo de OCR en ese documento concreto.
- **Un patrón de sustitución restringido a un subconjunto confundible**: `0`/`O`, `1`/`l`/`I`, `5`/`S`, `8`/`B` se parecen visualmente y a menudo se confunden entre sí; una sustitución fuera de este subconjunto (un `7` leído como `K`, por ejemplo) es estadísticamente mucho más rara y merece una vigilancia distinta.

> **Trampa:** confundir este enfoque con la corrección contextual (vista más arriba): la detección estadística no propone **ningún** valor de reemplazo, se limita a señalar un campo como sospechoso. Tratarla como una corrección (reemplazar automáticamente) equivale a adivinar un valor sin ninguna base real, peor que una corrección contextual mal calibrada.
>
> **Buena práctica:** reservar esta detección a los campos que escapan a los tres enfoques anteriores (sin léxico de negocio, sin formato conocido, contexto insuficiente para un modelo de lenguaje), y hacer que siempre desemboque en una relectura humana, nunca en un reemplazo automático.

## Nunca perder el rastro del texto bruto

Sea cual sea el método de corrección aplicado, el texto reconocido **antes** de la corrección sigue siendo una información valiosa: sin él, se vuelve imposible saber a posteriori si un valor proviene del modelo de OCR o de una corrección automática, ni medir el efecto real de esa corrección sobre la calidad global (ver el [CER/WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)).

> **Trampa:** sobrescribir el texto bruto reconocido con su versión corregida, sin conservar el original. Una auditoría posterior, o un futuro cambio de estrategia de corrección, pierde entonces toda posibilidad de comparar antes/después.
>
> **Buena práctica:** conservar siempre el texto bruto junto al texto corregido (dos campos distintos, nunca un solo campo sobrescrito), con si es posible el método de corrección aplicado a cada campo.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La corrección por diccionario reemplaza una palabra ausente de un léxico por su entrada más cercana (distancia de Levenshtein). La corrección contextual juzga la plausibilidad de una secuencia completa vía un modelo de lenguaje, útil frente a confusiones que la palabra aislada no revela. La validación por formato (regex) detecta una anomalía en un campo de estructura conocida, sin diccionario ni modelo. La detección por forma estadística señala un campo sospechoso sin proponer corrección, para los casos que los tres anteriores no cubren. |
| **Herramientas utilizables** | Un léxico de negocio construido sobre el vocabulario realmente encontrado. Un modelo de lenguaje para la corrección contextual. Expresiones regulares para validar un campo de formato conocido. Un ratio de letras aisladas o un patrón de sustitución restringido para la detección estadística. |
| **Trampas a evitar** | Usar un diccionario de idioma genérico sobre vocabulario de negocio. Aplicar una corrección contextual automática en campos de alta restricción de formato. Sobrescribir el texto bruto con su versión corregida. Tratar una detección estadística como una corrección, reemplazando automáticamente el valor señalado. |
| **Buenas prácticas** | Construir el léxico a partir del vocabulario de negocio real. Reservar la corrección contextual al texto libre, validar los campos de formato conocido por regex. Conservar siempre el texto bruto junto al texto corregido. Hacer que toda detección estadística desemboque en una relectura humana, nunca un reemplazo automático. |
