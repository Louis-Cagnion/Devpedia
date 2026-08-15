---
order: 21
---

# Evaluar un OCR: CER, WER y tasa de reconocimiento por campo

El principio general de evaluación (separar un conjunto de test, comparar una predicción con la respuesta verdadera) ya se plantea en [Introducción al machine learning](/?c=data-science&p=machine-learning-scikit-learn). Un OCR sin embargo tiene una ventaja que un LLM no tiene: su salida se compara directamente con una **respuesta verdadera conocida** (el texto real de la imagen), sin el no-determinismo que obliga a métodos como el golden set o el LLM-as-judge (ver [Monitoreo y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)). Este capítulo cubre las métricas específicas de esta comparación directa.

## Medir la diferencia entre dos textos: la distancia de edición

Comparar dos textos carácter por carácter en una posición fija fallaría desde el primer carácter faltante o añadido: todo lo demás se desplazaría, un desacuerdo artificial en cada posición siguiente. La [**distancia de Levenshtein**](https://es.wikipedia.org/wiki/Distancia_de_Levenshtein) resuelve este problema: el número mínimo de operaciones (sustituir, insertar, eliminar un carácter) para transformar un texto en otro.

```text
Texto reconocido: "Ios gatos duermen"
Texto real:       "Los gatos duermen"
                    ^
              1 sustitucion (I -> L) -> distancia de Levenshtein = 1
```

```python
def distancia_levenshtein(a, b):
    # tabla[i][j] = distancia entre los i primeros caracteres de a y los j primeros de b
    tabla = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        tabla[i][0] = i   # transformar a[:i] en "" cuesta i eliminaciones
    for j in range(len(b) + 1):
        tabla[0][j] = j   # transformar "" en b[:j] cuesta j inserciones

    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                tabla[i][j] = tabla[i - 1][j - 1]              # caracteres identicos, nada que hacer
            else:
                tabla[i][j] = 1 + min(
                    tabla[i - 1][j],      # eliminacion
                    tabla[i][j - 1],      # insercion
                    tabla[i - 1][j - 1],  # sustitucion
                )
    return tabla[len(a)][len(b)]
```

## CER (*Character Error Rate*): la distancia de edición, en proporción

Una distancia bruta de 5 no tiene el mismo peso en una palabra de 6 letras que en una página de 2000 caracteres: el **CER** relaciona esta distancia con la longitud del texto de referencia, para obtener una proporción comparable entre documentos de tamaños diferentes.

```python
def cer(texto_reconocido, texto_real):
    return distancia_levenshtein(texto_reconocido, texto_real) / len(texto_real)

cer("Ios gatos duermen", "Los gatos duermen")  # 1 / 18 ~= 0.056 -> 5,6% de caracteres erroneos
```

Un CER de 0 significa un reconocimiento perfecto; un CER de 0,05 (5%) significa que, en promedio, 5 caracteres de cada 100 están mal reconocidos.

## WER (*Word Error Rate*): la misma idea, a nivel de palabra

El **WER** aplica el mismo cálculo (distancia de edición, relacionada con la longitud de referencia), pero sobre la secuencia de **palabras** en lugar de caracteres:

```python
def wer(texto_reconocido, texto_real):
    return distancia_levenshtein(texto_reconocido.split(), texto_real.split()) / len(texto_real.split())
```

| | CER | WER |
|---|---|---|
| Unidad comparada | Carácter | Palabra |
| Sensibilidad | Una sola letra errónea en una palabra de 10 letras pesa poco | El mismo error invalida la palabra entera: más cercano a la legibilidad humana |
| Caso de uso típico | Escrituras sin separador de palabra claro, o evaluación fina de un motor de reconocimiento | Evaluación orientada al uso final (una palabra mal reconocida sigue siendo una palabra a corregir, sea cual sea la magnitud del error) |

> **Trampa:** seguir solo una de estas dos métricas y sacar una conclusión general sobre "la calidad" del modelo. Un CER bajo puede ocultar un WER alto (muchas palabras ligeramente desplazadas, cada una contada como errónea a nivel de palabra): las dos métricas responden a preguntas diferentes, no a la misma pregunta con más o menos precisión.
>
> **Buena práctica:** seguir ambas métricas en paralelo, y elegir la que prime según el uso real (WER si un humano debe releer y corregir palabra por palabra, CER para un diagnóstico más fino del comportamiento del modelo).

## La trampa del score global: la tasa de reconocimiento por campo

En un documento estructurado (una factura, un formulario), un CER o un WER calculado sobre la totalidad del texto oculta **dónde** se concentran los errores:

```text
Factura con CER global de 2% (excelente en apariencia):

  Direccion del cliente: "12 calle de la Paz, 750O8 Madrid"   <- error en 1 caracter del codigo postal (O en lugar de 0)
  Monto total           : "1 250,00 EUR"                       <- perfectamente reconocido

  El CER global (2%) ahoga el error en el codigo postal (un campo critico para la entrega)
  en la masa del texto correctamente reconocido alrededor.
```

> **Trampa:** conformarse con un CER o WER global bajo sin verificar la distribución de errores por campo. Un solo error en un campo crítico (un monto, una fecha de vencimiento, un número de cuenta) puede tener consecuencias mucho más graves de lo que un CER global agregado sugiere, sobre todo si ese error se concentra sistemáticamente en el mismo tipo de campo (una confusión recurrente O/0 en los códigos postales, por ejemplo).
>
> **Buena práctica:** calcular un CER/WER **por campo** identificado (monto, fecha, referencia de cliente...) además del score global, sobre un conjunto de documentos representativo, para detectar un campo sistemáticamente más frágil que los demás antes de la puesta en producción.

Un conjunto de test anotado (imágenes acompañadas de su transcripción exacta, verificada a mano) reproducido en cada cambio de modelo o de versión retoma exactamente el principio del **golden set** ya visto para un LLM (ver [Monitoreo y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), aplicado aquí a una salida determinista en lugar de a una salida que varía de una llamada a otra.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La distancia de Levenshtein mide el número mínimo de operaciones para transformar un texto en otro. El CER la relaciona con la longitud del texto a nivel carácter, el WER a nivel palabra; ambos responden a preguntas diferentes y se siguen en paralelo. Un score global oculta la distribución real de los errores: medir también por campo en un documento estructurado. |
| **Herramientas utilizables** | Un conjunto de test anotado (golden set), reproducido en cada cambio de modelo. Bibliotecas dedicadas (`jiwer`, por ejemplo) calculan CER/WER sin reimplementar la distancia de edición a mano. |
| **Trampas a evitar** | Seguir solo una de las dos métricas. Conformarse con un score global sin verificar la distribución de errores por campo. |
| **Buenas prácticas** | Seguir CER y WER en paralelo. Calcular un score por campo además del score global sobre un documento estructurado. |
