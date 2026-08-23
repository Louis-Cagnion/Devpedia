---
order: 1
---

# Extraer el texto y las páginas de un PDF

Un **PDF** (*Portable Document Format*) es un formato de archivo diseñado para que un documento se muestre idéntico en cualquier dispositivo, a diferencia de un archivo editable ([Word](https://www.microsoft.com/microsoft-365/word), [HTML](/?c=langages-de-balisage&s=html&p=html)) cuya maquetación puede variar según el software que lo abre. Esta portabilidad tiene un coste para quien quiera extraer la información automáticamente: un PDF no contiene "texto" de forma uniforme, mezcla dos naturalezas de contenido muy diferentes en una misma página.

## Dos naturalezas de contenido, en la misma página

| | Texto nativo | Contenido imagen |
|---|---|---|
| Qué es | Caracteres reales almacenados como tales en el archivo (como en un archivo de texto) | Píxeles, exactamente como una foto: ningún carácter está almacenado detrás |
| De dónde viene | Un documento generado desde un software (procesador de texto, exportación web) | Una página escaneada, una captura de pantalla pegada en el documento, una tabla compleja maquetada como una imagen |
| Cómo extraerlo | Leer directamente los caracteres almacenados: rápido, fiable, ningún error de interpretación posible | Imposible "leer" píxeles como texto: hay que o bien interpretarlos visualmente ([OCR estructurado](/?c=traitement-de-documents&p=ocr-structure)), o bien renunciar a esa porción |

> **Trampa:** suponer que un PDF siempre contiene texto nativo explotable. Un documento completamente escaneado (cada página es una simple foto a página completa) no contiene **ningún** texto nativo, aunque el archivo "parezca" un documento de texto al abrirlo: sin una etapa de OCR, ninguna extracción automática encontrará el menor carácter.
>
> **Buena práctica:** verificar concretamente la presencia de texto nativo en una muestra antes de diseñar un pipeline de extracción; nunca suponer que un PDF "se parece" a un documento de texto por el simple hecho de tener esa apariencia visual.

## Extraer el texto nativo: bloques, posiciones, tamaño de fuente

Una biblioteca como [**PyMuPDF**](https://pymupdf.readthedocs.io) (módulo [Python](/?c=langages-de-programmation&s=python&p=python) `pymupdf`) abre un PDF y da acceso, página por página, a su estructura interna: el texto nunca se devuelve como una sola cadena grande, sino dividido en **bloques** (un párrafo, una celda de tabla...), a su vez divididos en líneas y luego en **spans** (una porción de texto que comparte la misma fuente y el mismo tamaño):

```python
import pymupdf

with pymupdf.open("documento.pdf") as documento:
    for numero_pagina, pagina in enumerate(documento, start=1):
        for bloque in pagina.get_text("dict")["blocks"]:
            if bloque["type"] != 0:      # 0 = bloque de texto; 1 = bloque imagen, ignorado aquí
                continue
            spans = [span for linea in bloque["lines"] for span in linea["spans"]]
            texto = "".join(span["text"] for span in spans).strip()
            if not texto:
                continue                # bloque vacío (espaciado, línea en blanco): nada que conservar
            print(numero_pagina, bloque["bbox"], texto)
```

- `pagina.get_text("dict")` devuelve una estructura anidada (diccionario Python) en lugar de una simple cadena: esto es lo que da acceso a la **posición** de cada bloque en la página (`bbox`, la caja delimitadora en coordenadas `x0, y0, x1, y1`) y a su formato, no solo a su contenido textual.
- `bloque["type"]` distingue un bloque de texto (`0`) de un bloque imagen (`1`, cubierto en la sección siguiente): un PDF puede mezclar ambos en una misma página, este filtro solo conserva el texto.
- El **tamaño de fuente** de un span (`span["size"]`) sirve, en un uso real, para detectar un título (fuente más grande que el cuerpo del texto) sin tener que adivinar la maquetación de otra forma que midiéndola.

> **Trampa:** tomar el tamaño de fuente **máximo** de un bloque para caracterizarlo, sin pensar en qué compone ese bloque. Un bloque puede mezclar, por ejemplo, un número de página grande pegado a una pequeña mención de pie de página: el tamaño máximo reflejaría entonces el número de página, no el texto realmente representativo del bloque.
>
> **Buena práctica:** caracterizar un bloque por el tamaño de fuente del span más **largo** (el que tiene más caracteres), no por el tamaño máximo bruto: una elección simple que evita que un elemento corto y aislado (número, viñeta) falsee la medida.

## Renderizar una página como una imagen

Algunos tratamientos (el [OCR estructurado](/?c=traitement-de-documents&p=ocr-structure), una verificación visual) necesitan la página como una **imagen**, independientemente de cualquier texto nativo que ya contenga. PyMuPDF también puede producir este renderizado:

```python
pixmap = pagina.get_pixmap(dpi=200)
```

Un **DPI** (*dots per inch*, puntos por pulgada) mide la resolución del renderizado: cuanto más alto, más detallada (y pesada) es la imagen producida. Es un compromiso directo:

| DPI | Efecto |
|---|---|
| Demasiado bajo (ej. 72, la resolución de pantalla clásica) | Imagen borrosa: un texto pequeño o una tabla densa se vuelve ilegible, incluso para un OCR |
| Demasiado alto (ej. 600) | Imagen muy nítida, pero mucho más pesada en memoria y más lenta de procesar, sin ganancia real más allá de cierto umbral |
| Compromiso habitual (ej. 200) | Suficiente para la mayoría de los OCR modernos, sin disparar el tiempo de procesamiento |

> **Trampa:** elegir un DPI por defecto sin validarlo con los propios documentos. Un DPI demasiado bajo para una tabla densa produce errores de OCR difíciles de diagnosticar (el texto fuente ya era ilegible incluso antes de que interviniera el OCR); nada en el comportamiento del programa señala esta causa precisa.
>
> **Buena práctica:** probar varios valores de DPI en documentos representativos del caso real (texto denso, tabla fina) antes de fijar uno, en lugar de copiar un valor por defecto.

El renderizado producido por `get_pixmap` debe convertirse luego en un array de números para ser explotable por el resto de un pipeline (OCR, visualización):

```python
import numpy as np

imagen = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
```

`pixmap.samples` es una secuencia bruta de bytes (los píxeles, uno tras otro); `reshape` la reorganiza en un [array NumPy](/?c=data-science&p=numpy) de 3 dimensiones (altura, anchura, canales de color), la forma esperada por casi todas las bibliotecas de visión por computador.

## Resultado: una estructura, no solo texto bruto

Un pipeline de extracción completo produce típicamente, para un PDF dado, dos colecciones distintas en lugar de un único bloque de texto: los bloques de texto nativo (con su página y su posición) por un lado, los renderizados de imagen por página por otro. Mantener esta separación (en lugar de fundirlo todo en una única salida de texto) es lo que permite a las etapas siguientes de un pipeline elegir, página por página o incluso bloque por bloque, el método de extracción adecuado.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un PDF mezcla texto nativo (caracteres realmente almacenados) y contenido imagen (píxeles) en una misma página. El texto nativo se extrae directamente, con posición y tamaño de fuente; el contenido imagen debe renderizarse como una imagen (resolución ajustada en DPI) antes de interpretarse de otra forma. |
| **Herramientas utilizables** | `pymupdf`: `pagina.get_text("dict")` para el texto estructurado, `pagina.get_pixmap(dpi=...)` para un renderizado de imagen, convertido a array NumPy con `np.frombuffer`/`reshape`. |
| **Trampas a evitar** | Suponer que un PDF escaneado contiene texto nativo. Caracterizar un bloque por su tamaño de fuente máximo en lugar del span más largo. Elegir un DPI por defecto sin validarlo con documentos reales. |
| **Buenas prácticas** | Verificar la presencia real de texto nativo antes de diseñar un pipeline. Medir un bloque por el span más largo. Probar varios DPI en documentos representativos antes de fijar uno. |
