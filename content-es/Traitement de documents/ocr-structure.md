---
order: 2
---

# El OCR estructurado y el análisis de maquetación

El **OCR** (*Optical Character Recognition*, reconocimiento óptico de caracteres) es la familia de modelos que convierten píxeles en texto: la operación necesaria en cuanto un contenido solo existe en forma de imagen en lugar de [texto nativo](/?c=traitement-de-documents&p=extraction-pdf) (un escaneo, una tabla maquetada como una imagen). Un OCR "texto plano" se detiene ahí: devuelve una secuencia de palabras encontradas en la imagen, con su posición, sin ninguna noción de lo que las relaciona entre sí.

## Lo que el OCR "texto plano" no captura

Una tabla no es solo una lista de palabras dispersas en una página: es una **cuadrícula**, con filas y columnas que dan su sentido a los valores que contiene. Un OCR de texto plano, sobre una tabla, devuelve cada celda como una palabra aislada entre otras, sin indicar en qué fila ni en qué columna se encuentra:

| | OCR texto plano | OCR estructurado |
|---|---|---|
| Salida | Una lista de palabras, cada una con su posición en la imagen | Una estructura (filas, columnas, celdas), con el texto de cada celda en su lugar correcto |
| Suficiente para | Un párrafo de texto simple | Una tabla, un formulario con campos alineados |
| Lo que le falta al texto plano | Ningún medio de saber que dos palabras pertenecen a la misma fila de una tabla, en lugar de a dos lugares sin relación de la página | - |

El **OCR estructurado** añade una etapa de **análisis de maquetación** (*layout analysis*) incluso antes de leer el texto: localizar primero las regiones de la página (un título, un párrafo, una tabla...), y luego, para cada región reconocida como una tabla, reconstruir su cuadrícula en lugar de devolver un simple montón de palabras.

## Dos modelos, dos costes: filtrar antes de estructurar

Un modelo que localiza regiones (responder a "¿hay una tabla en esta página?") es mucho menos costoso de ejecutar que un modelo que, además, reconstruye por completo la estructura de esa tabla (filas, columnas, texto de cada celda). Lanzar sistemáticamente el modelo completo en cada página, incluidas las que visiblemente no contienen ninguna tabla, desperdicia la mayor parte del tiempo de cálculo:

```text
Página renderizada como imagen
        │
        ▼
Modelo de deteccion de maquetacion (rapido, ~40x mas rapido que el pipeline completo)
        │
        ├── ninguna zona "tabla" encontrada ──> pagina ignorada, nada mas que hacer
        │
        └── al menos una zona "tabla" ──> pipeline completo de estructuracion
                                            (localizacion precisa + reconstruccion
                                            de la cuadricula, mas lento)
```

> **Trampa:** ejecutar el modelo más completo (y más lento) en cada página de un documento, por simplicidad de implementación, cuando la mayoría de las páginas solo necesitan una respuesta a "¿hay una tabla aquí?".
>
> **Buena práctica:** intercalar un modelo de prefiltrado rápido que elimine los casos negativos evidentes, y reservar el modelo costoso solo a las regiones que realmente lo necesitan. El mismo principio que un [índice que evita recorrer una tabla entera](/?c=domain-specific-languages-dsl&p=sql): responder rápido a "¿hay que buscar aquí?" antes de hacer el trabajo completo.

## Reconstruir la cuadrícula: filas, columnas, celdas fusionadas

Una tabla detectada no se limita a una cuadrícula rectangular uniforme: una celda de encabezado puede extenderse sobre varias columnas, o una celda de la primera columna puede cubrir varias filas. Dos nociones describen estas fusiones, heredadas directamente del vocabulario HTML de las tablas:

```text
+----------+----------------------+
|          |      Trimestre 1     |   <- "colspan" 2: una celda que cubre 2 columnas
+----------+-----------+----------+
|          |   Enero   | Febrero  |
+----------+-----------+----------+
| Region A |    120    |   135    |
+          +-----------+----------+   <- "rowspan" 2: "Region A" cubre estas 2 filas
|          |    98     |   110    |
+----------+-----------+----------+
```

| Término | Significa |
|---|---|
| `colspan` (*column span*) | Una celda ocupa varias columnas en la misma fila |
| `rowspan` (*row span*) | Una celda ocupa varias filas en la misma columna |

Un modelo de OCR estructurado (como [PP-StructureV3](/?c=ia&s=vision-et-ocr&p=modeles-document-ai), usado en el proyecto fuente de este capítulo) devuelve típicamente esta cuadrícula en formato **HTML** (`<table>`, `<tr>`, `<td colspan="...">`), el mismo formato que el de una página web: reconstruir, a partir de este HTML, la posición exacta (fila, columna) de cada celda teniendo en cuenta las fusiones en curso, es un ejercicio de [parsing incremental](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) de pleno derecho.

> **Trampa:** ignorar las fusiones y suponer que una tabla reconstruida siempre tiene el mismo número de celdas en cada fila. Una fila donde una columna se "salta" debido a un `rowspan` iniciado más arriba tendría, sin tenerlo en cuenta, un desfase silencioso entre el contenido y la columna a la que realmente está asociado.
>
> **Buena práctica:** seguir explícitamente, columna por columna, cuántas filas restantes debe ocupar aún una fusión vertical, antes de colocar la celda siguiente de una fila.

## Los resultados de un modelo de detección nunca son perfectos

Un modelo que localiza zonas (aquí, tablas) proporciona una **puntuación de confianza** por zona detectada, y también puede detectar dos veces la misma zona física bajo dos cajas ligeramente diferentes (una que cubre toda la tabla, otra que solo cubre una parte): ver [Detección de maquetación: cajas delimitadoras, puntuación de confianza y eliminación de duplicados](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) para el detalle del filtrado por puntuación de confianza y la deduplicación por IoU/NMS, directamente aplicable aquí.

Ver también [Extraer el texto y las páginas de un PDF](/?c=traitement-de-documents&p=extraction-pdf) para la etapa que precede (obtener la imagen de la página a analizar), y [Arbitraje local vs cloud para un modelo de visión](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) para la cuestión de dónde ejecutar este tipo de modelo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un OCR de texto plano devuelve palabras aisladas con su posición; un OCR estructurado añade un análisis de maquetación (localizar títulos, párrafos, tablas) y reconstruye la cuadrícula de una tabla (filas, columnas, celdas fusionadas vía `rowspan`/`colspan`). |
| **Herramientas utilizables** | Un modelo de detección de maquetación ligero como prefiltro, un pipeline completo de estructuración reservado a las zonas que lo necesitan. |
| **Trampas a evitar** | Lanzar sistemáticamente el modelo más costoso en cada página. Ignorar las fusiones de celdas al reconstruir una cuadrícula. Conservar sin filtrar detecciones con baja puntuación o zonas casi duplicadas. |
| **Buenas prácticas** | Prefiltrar con un modelo rápido antes del pipeline completo. Seguir explícitamente las fusiones columna por columna. Filtrar por puntuación de confianza y deduplicar las zonas que se solapan fuertemente. |
