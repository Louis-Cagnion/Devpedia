---
order: 8
---

# Gobernanza de datos para documentos escaneados

[Gobernanza de datos para un sistema de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) plantea los principios generales (clasificar un dato, rastrear quién pidió qué, respetar el derecho al olvido) para un dato que transita por un LLM, esencialmente **texto**. Este capítulo retoma esos mismos principios para una **imagen** de documento escaneado, donde una diferencia lo cambia todo: borrar un dato personal en una imagen no es la misma operación que borrarlo en texto.

## Clasificar un documento antes de enviarlo a un modelo de visión

El principio de clasificación por sensibilidad (pública/interna/personal/secreta, ver el [capítulo general](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) se aplica tal cual a un documento escaneado, con un matiz ya señalado en [el arbitraje local vs cloud para un modelo de visión](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): la imagen completa de un documento a menudo expone **más** información de la que el pipeline realmente busca extraer (toda la página, no solo el campo útil).

> **Trampa:** clasificar un documento según el único campo que se busca extraer de él (un monto, por ejemplo), ignorando el resto de la imagen enviada al modelo. Una factura escaneada en su totalidad puede contener, además del monto buscado, una dirección, un número de cuenta o una firma, igualmente expuestos a un proveedor tercero.
>
> **Buena práctica:** clasificar un documento según **todo** lo que la imagen realmente contiene, no solo el campo apuntado por la extracción.

## Borrar un dato personal en una imagen: una operación diferente

En una base de datos textual, reemplazar un valor equivale a sobrescribir una cadena de caracteres por otra (ver el [`DELETE` clásico](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)). Un dato personal visible en una imagen escaneada (un nombre manuscrito, una firma, un número de documento de identidad) no tiene un equivalente tan simple: debe **localizarse** y luego **enmascararse visualmente**, no simplemente reemplazarse en una base:

| | Dato personal en texto | Dato personal en una imagen escaneada |
|---|---|---|
| Cómo localizarlo | Una búsqueda de cadena, o una columna conocida en base | Una [detección de zona](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (una caja delimitadora alrededor de la zona a enmascarar) |
| Cómo borrarlo | Reemplazar el valor (o eliminarlo) en el campo correspondiente | Cubrir la zona detectada con un relleno opaco (*redaction*), directamente en los píxeles de la imagen |
| Riesgo si se hace mal | Un valor olvidado en un campo anexo | Una zona mal detectada (demasiado pequeña) deja visible parte del dato a pesar de la "corrección" |

> **Trampa:** difuminar una zona que contiene un dato personal en lugar de cubrirla con un relleno opaco. Un difuminado a veces sigue siendo reversible (técnicas de reconstrucción pueden recuperar parte de la información difuminada, en particular sobre un texto impreso con fuente regular): no es una eliminación fiable.
>
> **Buena práctica:** cubrir la zona en cuestión con un relleno opaco que reemplace definitivamente los píxeles originales, nunca un difuminado o un efecto visual reversible.

## Retención: el texto extraído no es el único lugar donde existe el dato

El principio ya visto (un dato personal puede copiarse en varios lugares sin que un solo `DELETE` baste, ver el [capítulo general](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) adquiere una dimensión adicional con un documento escaneado: la **imagen fuente** en sí misma es una copia del dato, distinta del texto que se extrajo de ella.

| Lugar donde el dato pudo haberse copiado | ¿Eliminación desencadenada por la eliminación del texto extraído? |
|---|---|
| Texto extraído, almacenado en base | Sí, por definición |
| Imagen fuente del escaneo (almacenamiento bruto, antes o después del OCR) | No: la imagen permanece intacta, con el dato siempre visible dentro |
| Registros de llamadas a un OCR de terceros (ver la [deriva de versión](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Depende únicamente de las condiciones contractuales del proveedor |
| Copias intermedias (zonas recortadas para la relectura humana, ver [OCR en producción](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | No, salvo que el procedimiento de eliminación las cubra explícitamente |

> **Trampa:** responder a una solicitud de derecho al olvido eliminando únicamente el texto extraído almacenado en base, dejando intacta la imagen fuente del escaneo en algún lugar (un almacenamiento de archivos, una copia de seguridad): el dato personal permanece entonces plenamente visible para cualquiera que acceda a esa imagen.
>
> **Buena práctica:** hacer que el procedimiento de eliminación cubra la imagen fuente tanto como el texto extraído, identificando explícitamente todos los lugares donde la imagen (no solo su texto) pudo haberse copiado o archivado.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Los principios de gobernanza ya vistos para un LLM (clasificación, trazabilidad, retención) se aplican a un documento escaneado, con una diferencia de fondo: un dato personal en una imagen debe localizarse y luego enmascararse visualmente (relleno opaco), no simplemente reemplazarse como una cadena de texto. La imagen fuente es una copia del dato distinta del texto extraído, y debe estar cubierta por todo procedimiento de eliminación. |
| **Herramientas utilizables** | Una detección de zona para localizar el dato a enmascarar. Un relleno opaco aplicado directamente a los píxeles para cubrirlo de forma no reversible. |
| **Trampas a evitar** | Clasificar un documento según el único campo apuntado, ignorando el resto de la imagen. Difuminar una zona sensible en lugar de cubrirla con un relleno opaco. Eliminar el texto extraído sin eliminar la imagen fuente correspondiente. |
| **Buenas prácticas** | Clasificar un documento según todo lo que la imagen realmente contiene. Cubrir una zona sensible con un relleno opaco, nunca un difuminado reversible. Extender todo procedimiento de eliminación a la imagen fuente, no solo al texto extraído. |
