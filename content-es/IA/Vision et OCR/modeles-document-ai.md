---
order: 3
---

# Modelos "Document AI": comprender un documento más allá del texto puro

Los dos capítulos anteriores tratan la lectura de un documento como un **pipeline**: primero [detectar la maquetación](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (dónde están las zonas), luego [reconocer el texto](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) de cada zona, por separado. Este capítulo presenta una familia de modelos más reciente, llamada **Document AI**, que trata un documento como un objeto de pleno derecho (texto, posición, apariencia visual reunidos), en lugar de como texto puro una vez terminado el OCR.

## Lo que un LLM de texto puro no ve

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) clásico recibe una serie de [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm), sin ninguna noción de **dónde** se encontraba cada palabra en la página de origen. Sin embargo, en un documento real, la posición porta significado por sí sola:

```text
Factura n°2024-118          <- arriba de la pagina, negrita: un titulo/referencia
                             
Cliente       Monto         <- alineados en columnas: una tabla
Perez SA      1 250 EUR
```

La misma palabra ("Monto") tiene un rol diferente según aparezca como encabezado de columna o dentro de una frase de párrafo: un modelo que ignora la posición debe adivinar este rol únicamente a partir del texto circundante, con más riesgo de confusión que un modelo que ve directamente la posición.

## LayoutLM: fusionar texto, posición e imagen

[**LayoutLM**](https://arxiv.org/abs/1912.13318) retoma la arquitectura Transformer de un LLM de texto, pero construye el [embedding](/?c=ia&s=nlp-llm&p=nlp-et-llm) de cada token a partir de **tres** fuentes combinadas, en lugar de una sola:

```text
Para cada palabra reconocida por el OCR:

  embedding(texto de la palabra) + embedding(posicion x,y de la palabra) + embedding(imagen de la zona de la palabra)
         |                            |                                    |
   como un LLM              coordenadas normalizadas               extraido por un CNN
   de texto clasico         en la pagina (0 a 1000)                 (fuente, estilo...)

                    = embedding final, enviado al Transformer
```

- **Texto**: la palabra en sí, como en cualquier LLM.
- **Posición**: las coordenadas de la caja delimitadora de la palabra (ver [Detección de maquetación](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page)), convertidas también en vector.
- **Imagen**: una representación visual de la zona (extraída por un [CNN](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)), que capta indicios que el texto solo no aporta (negrita, tamaño de fuente, recuadro).

Estos tres vectores se suman para formar un solo embedding por palabra, exactamente como un LLM de texto ya suma el embedding de un token y su embedding de posición en la secuencia: LayoutLM simplemente añade dos dimensiones adicionales (posición **espacial** 2D, e imagen) a este mecanismo ya conocido.

> **Trampa:** creer que LayoutLM prescinde de un OCR. LayoutLM siempre necesita que un OCR haya extraído primero el texto de cada palabra y su posición: enriquece lo que el OCR produjo, no lo reemplaza.
>
> **Buena práctica:** situar LayoutLM como una etapa **posterior** al OCR clásico (reconocimiento de texto), no como una alternativa a esa etapa.

## Donut: prescindir completamente del OCR

[**Donut**](https://arxiv.org/abs/2111.15664) (*Document understanding transformer*) toma el problema al revés: en lugar de añadir información a un texto ya extraído por OCR, parte directamente de la **imagen bruta** del documento y genera directamente la salida deseada (por ejemplo, una estructura JSON con los campos de una factura), sin ejecutar nunca un OCR separado:

```text
Pipeline clasico (LayoutLM):
Imagen -> OCR (texto + posicion) -> LayoutLM (texto+posicion+imagen) -> resultado estructurado

Donut (extremo a extremo, sin OCR):
Imagen -> codificador visual -> decodificador -> resultado estructurado directamente
```

La arquitectura retoma el mismo principio codificador/decodificador que un [Transformer de OCR](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning): un codificador visual lee la imagen, un decodificador genera la salida token por token. La diferencia es que la salida ya no es el texto bruto de la imagen, sino directamente la estructura final deseada (los campos ya extraídos y nombrados).

| | Pipeline clásico (OCR + LayoutLM) | Extremo a extremo (Donut) |
|---|---|---|
| Etapas | Varios modelos especializados encadenados | Un solo modelo, entrada imagen, salida estructura |
| Cada etapa inspeccionable por separado | Sí (el texto reconocido, la posición, la estructura final son cada uno visibles) | No (solo la salida final es visible; imposible saber "dónde" se introdujo un error) |
| Sensible a errores del OCR clásico | Sí (un error de reconocimiento de carácter se propaga) | Menos directamente, pero sus propios errores son más difíciles de diagnosticar |
| Volumen de datos de entrenamiento requerido | Moderado (cada modelo especializado se entrena en una tarea acotada) | Alto (el modelo debe aprender la tarea completa de una sola vez) |

> **Trampa:** elegir Donut por defecto porque es más reciente y más simple de invocar (una sola etapa). Un pipeline clásico sigue siendo más fácil de depurar (cada etapa produce un resultado intermedio verificable) y requiere menos datos de entrenamiento para un caso de uso acotado.
>
> **Buena práctica:** elegir una arquitectura extremo a extremo cuando la simplicidad operativa (un solo modelo que mantener) importa más que la capacidad de diagnosticar con precisión un error; mantener un pipeline clásico cuando la trazabilidad de cada etapa es importante (un contexto regulado, por ejemplo), o cuando el volumen de datos de entrenamiento disponible sigue siendo limitado.

## PP-StructureV3: un pipeline clásico completo y listo para usar

El capítulo [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) ya menciona [**PP-StructureV3**](https://github.com/PaddlePaddle/PaddleOCR): es un ejemplo concreto de pipeline clásico (en el sentido de la fila "Pipeline clásico" de la tabla de arriba), que encadena detección de maquetación, OCR y reconstrucción de tablas como etapas separadas, pero provistas ya ensambladas y listas para usar en lugar de construirlas uno mismo modelo por modelo.

Ver también [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) para el detalle de la reconstrucción de cuadrícula posterior a este capítulo, y [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) para el mecanismo de embedding y atención reutilizado aquí.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un LLM de texto puro ignora la posición de una palabra en la página, una información portadora de sentido en un documento real. LayoutLM fusiona texto, posición e imagen en un solo embedding, pero siempre necesita un OCR previo. Donut prescinde completamente del OCR generando directamente una salida estructurada desde la imagen, al precio de perder la trazabilidad etapa por etapa. PP-StructureV3 es un ejemplo de pipeline clásico completo, listo para usar. |
| **Herramientas utilizables** | LayoutLM y Donut como modelos preentrenados reutilizables; PP-StructureV3 como pipeline clásico ya ensamblado. |
| **Trampas a evitar** | Creer que LayoutLM reemplaza al OCR. Elegir una arquitectura extremo a extremo por defecto sin considerar la pérdida de trazabilidad y el volumen de datos requerido. |
| **Buenas prácticas** | Situar LayoutLM después del OCR, no en su lugar. Reservar el extremo a extremo para los casos donde la simplicidad operativa prima sobre la trazabilidad, y mantener un pipeline clásico en un contexto regulado o con datos limitados. |
