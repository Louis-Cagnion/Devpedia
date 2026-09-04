---
order: 6
---

# Metadatos EXIF y formato RAW: lo que contiene una foto más allá de la imagen

Una foto digital no es solo una rejilla de píxeles. Como [cualquier archivo](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire), es una sucesión de bytes, pero esta está organizada en dos partes distintas: los datos de la imagen en sí, y un bloque de **metadatos** (información sobre la foto, no la foto) insertado en el mismo archivo.

## JPEG vs RAW: dos formas de almacenar la imagen en sí

| | JPEG | RAW |
|---|---|---|
| Contenido | Imagen ya **procesada** (balance de blancos, nitidez, contraste aplicados) y **comprimida** (con pérdida) por el dispositivo | Datos casi brutos del sensor, antes de cualquier procesamiento, sin comprimir o comprimidos sin pérdida |
| Tamaño de archivo | Pequeño (unos pocos MB) | Grande (varias decenas de MB) |
| Modificable después | Limitado: las decisiones del dispositivo (balance de blancos, etc.) ya están fijadas en los píxeles | Amplio: todas las decisiones siguen siendo ajustables en el posprocesamiento, sin pérdida de calidad |
| Extensión típica | `.jpg` | `.cr2` (Canon), `.nef` (Nikon), `.arw` (Sony), o el formato abierto `.dng` ([Adobe DNG](https://helpx.adobe.com/camera-raw/digital-negative.html)) |

> **Analogía:** el JPEG es una foto ya revelada y recortada por el fotógrafo; el RAW es la película bruta, que contiene todo lo que captó el sensor, para revelar uno mismo después.

## EXIF: un bloque de metadatos insertado en el archivo

El formato **EXIF** (*Exchangeable Image File Format*, un [estándar técnico](https://www.cipa.jp/e/std/std-sec.html) común a la mayoría de cámaras y smartphones) define un bloque de metadatos insertado al principio del archivo de imagen (tanto JPEG como RAW), además de los propios píxeles:

| Campo EXIF típico | Ejemplo de valor |
|---|---|
| Modelo de dispositivo | iPhone 15 Pro |
| Fecha y hora de la toma | 2026-08-22 14:32:07 |
| Tiempo de exposición, apertura, ISO | 1/125s, f/2.8, ISO 100 |
| Coordenadas GPS (si están activadas) | 48.8566° N, 2.3522° E |
| Orientación del dispositivo | Retrato |

Este bloque es legible por cualquier software que sepa leerlo (visor de imágenes, red social, editor), independientemente de los píxeles de la foto.

> **Trampa:** compartir una foto en línea sin saber que todavía contiene sus coordenadas GPS EXIF. Una foto tomada en casa y publicada públicamente puede revelar así una dirección precisa a cualquiera que inspeccione el archivo, aunque nada en la imagen misma lo sugiera.
>
> **Buena práctica:** la mayoría de las redes sociales eliminan automáticamente el EXIF de las fotos publicadas, pero un archivo enviado directamente (correo, mensajería, subida a un sitio) lo conserva tal cual: conviene verificarlo antes de enviar cualquier foto cuya ubicación no deba compartirse, con la herramienta del propio sistema operativo o una utilidad dedicada a eliminar EXIF.

## Resumen

| | |
|---|---|
| **Para recordar** | Un archivo de imagen contiene dos cosas distintas: los píxeles (JPEG procesado/comprimido, o RAW casi bruto) y un bloque de metadatos EXIF (dispositivo, ajustes, fecha, a veces GPS), legible independientemente de la imagen. |
| **Herramientas utilizables** | El formato abierto [DNG de Adobe](https://helpx.adobe.com/camera-raw/digital-negative.html) para un RAW legible por varios programas; una utilidad de eliminación de EXIF antes de compartir una foto sensible. |
| **Trampas a evitar** | Compartir una foto pensando que solo revela lo que es visible en la imagen, olvidando sus metadatos EXIF (GPS en particular). |
| **Buenas prácticas** | Verificar y retirar el EXIF de una foto antes de cualquier envío directo (fuera de las redes sociales que ya lo hacen) si su ubicación o fecha no deben conocerse. |
