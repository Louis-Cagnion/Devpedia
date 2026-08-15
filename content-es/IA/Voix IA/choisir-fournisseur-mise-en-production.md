---
order: 7
---

# Elegir un proveedor y poner en producción

El arbitraje entre modelo autoalojado y API cloud (costo, exposición de datos, latencia) ya está detallado en [Arbitraje local vs cloud para un modelo de visión](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision); este capítulo lo aplica a la síntesis de voz, donde dos criterios adquieren un peso particular: la latencia en tiempo real y una restricción a veces descuidada, la infraestructura disponible.

## Tres familias de soluciones

| | Web Speech API (navegador) | Autoalojado (ej. [Piper](https://github.com/OHF-Voice/piper1-gpl)) | API cloud (ej. [ElevenLabs](https://elevenlabs.io)) |
|---|---|---|
| Costo de uso | Ninguno (delega a las voces ya instaladas en el dispositivo del usuario) | Costo del servidor que ejecuta el modelo, independiente del volumen | Facturado por carácter o por minuto generado |
| Calidad de voz | Variable según el sistema del usuario, fuera del control del desarrollador | Controlada, depende del modelo elegido | Generalmente la más alta, incluida la clonación de voz |
| Infraestructura requerida | Ninguna (el cómputo ocurre en el navegador del usuario) | Un servidor (con o sin GPU según el modelo) | Ninguna del lado del desarrollador |
| Funciona sin conexión | Sí, una vez instaladas las voces del sistema | Sí | No, requiere conexión de red |

## Un caso concreto: la elección hecha para el propio Devpedia

La [lectura de audio automática de Devpedia](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) ilustra concretamente esta elección. Devpedia es un sitio **100% estático** (alojado en GitHub Pages, sin servidor ni etapa de build): alojar un modelo como Piper habría exigido un servidor de inferencia, incompatible con este alojamiento; una API cloud habría introducido un costo por uso, para un sitio consultado libremente sin modelo de negocio. La **Web Speech API** se eligió precisamente porque no requiere ni servidor ni costo de uso: el cómputo ocurre enteramente en el navegador de cada visitante.

> **Trampa:** elegir un autoalojamiento o una API cloud "por defecto", porque la calidad de voz ahí es superior, sin verificar de antemano si la infraestructura del proyecto realmente permite alojar un servidor de inferencia, o si el modelo de negocio del proyecto soporta un costo recurrente por uso.
>
> **Buena práctica:** partir de las restricciones reales del proyecto (infraestructura disponible, modelo de negocio) antes de comparar las opciones solo por la calidad de voz, exactamente el mismo enfoque que para elegir entre local y cloud para un modelo de visión.

## La latencia en tiempo real, un criterio aparte

Para un uso interactivo (un asistente de voz, una traducción en vivo), el [retraso antes del primer sonido audible](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale) prima sobre la calidad percibida:

| | Web Speech API | Autoalojado | API cloud |
|---|---|---|---|
| Retraso antes del primer sonido | Muy bajo (cómputo local, sin ida y vuelta de red) | Bajo si el servidor está cerca geográficamente del usuario | Variable, depende de la red y la carga del proveedor |

> **Trampa:** ignorar la latencia de red de una API cloud para un uso en tiempo real, basándose únicamente en pruebas realizadas desde una conexión rápida y cercana al servidor del proveedor.
>
> **Buena práctica:** medir la latencia real desde condiciones de red representativas de los usuarios objetivo, no solo desde el entorno de desarrollo.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Existen tres familias de soluciones: la Web Speech API (sin costo ni infraestructura, calidad fuera del control del desarrollador), el autoalojamiento (calidad controlada, costo de infraestructura fijo), la API cloud (calidad más alta, costo variable por uso, requiere conexión de red). La elección debe partir de las restricciones reales del proyecto (infraestructura, modelo de negocio), no solo de la calidad de voz. |
| **Herramientas utilizables** | La Web Speech API para un sitio estático sin costo de uso. Piper para un autoalojamiento ligero. ElevenLabs para una API cloud de alta calidad, incluida la clonación de voz. |
| **Trampas a evitar** | Elegir una opción por defecto sin verificar las restricciones reales de infraestructura y modelo de negocio. Medir la latencia de una API cloud solo en condiciones de red favorables. |
| **Buenas prácticas** | Partir de las restricciones reales del proyecto antes de comparar las opciones. Medir la latencia en condiciones de red representativas de los usuarios objetivo. |
