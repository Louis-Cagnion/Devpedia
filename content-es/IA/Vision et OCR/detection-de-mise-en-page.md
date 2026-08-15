---
order: 18
---

# Detección de maquetación: cajas delimitadoras, score de confianza y eliminación de duplicados

El capítulo [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) presenta el principio general: antes de leer el texto, un modelo primero localiza las regiones de la página (título, párrafo, tabla...). Este capítulo desarrolla el funcionamiento de ese modelo de localización en sí, una **detección de objetos** (*object detection*) en el sentido general del término, aplicada aquí a zonas de página en lugar de a objetos fotografiados.

## La caja delimitadora: representar una zona detectada

Una **caja delimitadora** (*bounding box*) representa la posición de una zona detectada en la página mediante un simple rectángulo, descrito por 4 números:

```text
(x_min, y_min) ●─────────────────────┐
               │                     │
               │   Zona detectada    │
               │   (ej: una tabla)   │
               │                     │
               └─────────────────────● (x_max, y_max)
```

| Representación | Los 4 números |
|---|---|
| Esquinas opuestas | `x_min`, `y_min` (esquina superior izquierda), `x_max`, `y_max` (esquina inferior derecha) |
| Centro + dimensiones | `x_centro`, `y_centro`, `ancho`, `alto` |

Ambas representaciones describen el mismo rectángulo; la elección entre ellas es una convención del modelo usado (a verificar en su documentación), no una diferencia de fondo.

Para cada caja, el modelo también produce una **clase** (el tipo de zona: título, párrafo, tabla, figura...) y un **score de confianza**: una probabilidad, entre 0 y 1, de que esa clase sea la correcta para esa zona (el mismo tipo de salida que una [clasificación por softmax](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), siendo la clase elegida la de mayor probabilidad).

> **Trampa:** conservar todas las cajas devueltas por el modelo, sin mirar su score de confianza. Un modelo de detección propone sistemáticamente numerosas cajas candidatas en toda la imagen; la mayoría tiene un score de confianza muy bajo (un simple bloque de texto alineado confundido con una tabla, por ejemplo) y no corresponden a nada real en la página.
>
> **Buena práctica:** descartar toda caja cuyo score de confianza caiga por debajo de un umbral fijado de antemano (a menudo entre 0.3 y 0.7 según la tolerancia deseada a falsos positivos), antes de cualquier otro procesamiento.

## El problema de los duplicados: IoU (*Intersection over Union*)

Un modelo de detección propone sus cajas candidatas independientemente unas de otras: por eso es habitual que detecte la **misma zona física** varias veces, en forma de varias cajas ligeramente diferentes (una cubriendo toda una tabla, otra cubriendo solo una parte, una tercera ligeramente desplazada):

```text
┌──────────────────┐
│  ┌───────────────┼──┐    <- 3 cajas que se solapan fuertemente,
│  │///////////////│  │       todas candidatas para LA MISMA tabla
└──┼───────────────┘  │
   └───────────────────┘
```

Para decidir si dos cajas designan la misma zona (a deduplicar) o dos zonas realmente distintas (a conservar ambas), hay que medir su solapamiento. La **IoU** (*Intersection over Union*) es esta medida: el área de su intersección, dividida por el área de su unión.

```text
Caja A            Caja B
┌────────┐
│    ┌───┼────┐
│    │###│    │    ### = interseccion (compartida por A y B)
└────┼───┘    │
     └────────┘

IoU = area(###) / area(A union B)
```

```python
def iou(caja_a, caja_b):
    # Coordenadas del rectangulo de interseccion
    x_min = max(caja_a.x_min, caja_b.x_min)
    y_min = max(caja_a.y_min, caja_b.y_min)
    x_max = min(caja_a.x_max, caja_b.x_max)
    y_max = min(caja_a.y_max, caja_b.y_max)

    ancho_interseccion = max(0, x_max - x_min)   # 0 si las cajas no se tocan
    alto_interseccion = max(0, y_max - y_min)
    area_interseccion = ancho_interseccion * alto_interseccion

    area_a = (caja_a.x_max - caja_a.x_min) * (caja_a.y_max - caja_a.y_min)
    area_b = (caja_b.x_max - caja_b.x_min) * (caja_b.y_max - caja_b.y_min)
    area_union = area_a + area_b - area_interseccion

    return area_interseccion / area_union
```

Una IoU de 1 significa dos cajas idénticas; una IoU de 0 significa que no se tocan en absoluto. Dos cajas que designan la misma zona física suelen tener una IoU alta (a menudo por encima de 0.5), incluso si sus coordenadas exactas difieren ligeramente.

> **Trampa:** restar la intersección una segunda vez al calcular la unión (`area_a + area_b`, sin el `- area_interseccion`). La intersección pertenece a ambas áreas individuales: sumarla sin restarla una vez la cuenta dos veces, lo que infla artificialmente la unión y subestima la IoU.
>
> **Buena práctica:** verificar siempre la fórmula `union = area_a + area_b - interseccion` (el caso más simple del [principio de inclusión-exclusión](https://es.wikipedia.org/wiki/Principio_de_inclusi%C3%B3n-exclusi%C3%B3n), una regla general de conteo para no contar dos veces una parte común a dos conjuntos) en lugar de improvisarla de memoria.

## NMS (*Non-Maximum Suppression*): conservar una sola caja por zona

La **NMS** (supresión de no-máximos) usa la IoU para conservar solo una caja por zona física, entre todos los duplicados candidatos:

```text
1. Ordenar todas las cajas por score de confianza decreciente
2. Tomar la caja de mayor score -> conservarla definitivamente
3. Eliminar todas las cajas restantes cuya IoU con ella supere un umbral
   (ej: 0.5) -> son duplicados de la caja que se acaba de conservar
4. Repetir los pasos 2 y 3 sobre las cajas restantes, hasta que no quede ninguna
```

```python
def nms(cajas, umbral_iou=0.5):
    cajas_ordenadas = sorted(cajas, key=lambda b: b.score, reverse=True)
    conservadas = []
    while cajas_ordenadas:
        mejor = cajas_ordenadas.pop(0)   # score mas alto restante
        conservadas.append(mejor)
        cajas_ordenadas = [
            b for b in cajas_ordenadas
            if iou(mejor, b) <= umbral_iou   # descarta los duplicados de "mejor"
        ]
    return conservadas
```

En cada ronda, se supone que la caja de mejor score restante es la mejor estimación de la zona real: todas las que se solapan fuertemente con ella son entonces sus duplicados, no zonas distintas.

> **Trampa:** aplicar la NMS a todas las cajas a la vez, sin distinguir su clase predicha. Una caja "título" y una caja "tabla" pueden solaparse por coincidencia geométrica (un título justo encima de una tabla, cuyas cajas se tocan ligeramente) sin designar la misma zona: tratarlas juntas arriesgaría eliminar erróneamente una de las dos.
>
> **Buena práctica:** aplicar la NMS por separado para cada clase (comparar las cajas "tabla" entre sí, las cajas "título" entre sí, etc.), nunca entre clases diferentes.

## El umbral IoU: un compromiso, no un valor universal

| Umbral IoU elegido | Efecto |
|---|---|
| Demasiado bajo (ej. 0.1) | Zonas realmente distintas pero cercanas (dos tablas pequeñas una al lado de la otra) corren el riesgo de fusionarse en una sola |
| Demasiado alto (ej. 0.9) | Duplicados evidentes de la misma zona, con coordenadas ligeramente diferentes, no se eliminan |

> **Buena práctica:** ajustar este umbral sobre documentos representativos del caso de uso real (tablas densas y cercanas requieren un umbral más alto que una maquetación despejada), en lugar de mantener un valor por defecto sin haberlo verificado sobre los propios documentos.

Ver también [El OCR estructurado y el análisis de maquetación](/?c=traitement-de-documents&p=ocr-structure) para la continuación del pipeline (reconstruir la cuadrícula de una tabla una vez localizada y deduplicada su zona), y [Las redes neuronales: los fundamentos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) para la clasificación por score de confianza en la que se apoya este capítulo.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un modelo de detección produce cajas delimitadoras (4 coordenadas), cada una con una clase y un score de confianza. Detecta a menudo la misma zona varias veces: la IoU (área de intersección / área de unión) mide el solapamiento entre dos cajas, y la NMS solo conserva la caja de mejor score entre las que se solapan fuertemente, clase por clase. |
| **Herramientas utilizables** | Las bibliotecas de visión por computadora ([torchvision](https://pytorch.org/vision/stable/index.html), por ejemplo) proveen implementaciones de NMS listas para usar, más rápidas que código Python puro sobre un gran número de cajas. |
| **Trampas a evitar** | Conservar cajas con score de confianza bajo sin filtrado. Calcular mal la unión contando la intersección dos veces. Aplicar la NMS entre clases diferentes en lugar de por separado por clase. Mantener un umbral IoU por defecto sin validarlo sobre los propios documentos. |
| **Buenas prácticas** | Filtrar por score de confianza antes de cualquier procesamiento. Verificar la fórmula de la unión (inclusión-exclusión). Aplicar la NMS por separado por clase. Ajustar el umbral IoU sobre documentos representativos del caso de uso real. |
