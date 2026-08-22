---
order: 7
---

# Puesta en producción y monitoreo de un pipeline OCR

Los capítulos anteriores cubren el reconocimiento en sí (modelo, evaluación, corrección). Este cubre lo que cambia una vez que este pipeline se despliega de forma continua, sobre un flujo real de documentos en lugar de un conjunto de test fijo: las mismas preguntas que un [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production), con respuestas a veces diferentes.

## Costo, latencia, exposición de datos: ya tratado, no repetir

El arbitraje entre API alojada y modelo autoalojado para un pipeline OCR (costo por página, exposición de la imagen completa a un tercero, tolerancia a la latencia en procesamiento por lotes) ya está detallado en [Arbitraje local vs cloud para un modelo de visión](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): este capítulo no lo repite, supone esa elección ya hecha.

## La deriva silenciosa de versión, versión OCR

El mismo riesgo ya visto para un LLM (ver [Monitoreo y gestión operativa de un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) se aplica a un OCR provisto por un tercero: el proveedor puede actualizar su modelo silenciosamente, cambiando el comportamiento de reconocimiento sobre documentos idénticos, sin que ninguna línea del pipeline haya cambiado.

> **Trampa:** detectar esta deriva solo después de que haya producido errores visibles en etapas posteriores (un monto mal extraído en una factura real, por ejemplo), en lugar de monitorearla directamente.
>
> **Buena práctica:** reproducir regularmente el conjunto de test anotado (ver el [golden set de evaluación OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) sobre el pipeline en producción, a intervalo regular y en cada cambio anunciado por el proveedor, para detectar una deriva de versión antes de que afecte documentos reales.

## Monitorear un CER/WER de forma continua, no solo en el entrenamiento

El CER/WER (ver el [capítulo dedicado](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) no está destinado a medirse una sola vez antes de la puesta en producción: seguido en el tiempo sobre el golden set, detecta una degradación antes de que se acumule silenciosamente:

```text
CER sobre el golden set, medido cada semana:

Semana 1 : 2,1%
Semana 2 : 2,3%
Semana 3 : 2,0%
Semana 4 : 6,8%   <- pico repentino: alerta (¿cambio de proveedor? ¿nuevo formato de documento?)
```

> **Trampa:** seguir solo un CER/WER global agregado sobre el conjunto de documentos procesados, sin desglosarlo por tipo de documento o por campo. Una degradación que solo afecta a un tipo de documento (un nuevo formato de factura de un proveedor dado, por ejemplo) puede quedar ahogada en un promedio global estable, exactamente la misma trampa que el score global ya señalada en el capítulo sobre la evaluación.
>
> **Buena práctica:** desglosar el seguimiento por tipo de documento y por campo, no solo por un promedio global, para detectar una degradación localizada antes de que se extienda.

## Enrutar los casos inciertos hacia una relectura humana

El [score de confianza](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) ya visto para la detección de maquetación tiene un equivalente para el reconocimiento de texto en sí: la mayoría de los motores de OCR devuelven, además del texto, un score de confianza por palabra o por carácter reconocido.

```text
Documento procesado
      │
      ▼
Score de confianza promedio del documento
      │
      ├── por encima del umbral ──> procesamiento automatico, sin intervencion
      │
      └── por debajo del umbral ──> puesto en cola para relectura humana
```

> **Trampa:** tratar todo documento por debajo de cierto umbral de confianza como un error bloqueante, sin alternativa, o al contrario aceptarlo tal cual sin ninguna verificación para no ralentizar el pipeline.
>
> **Buena práctica:** prever una cola de relectura humana para los documentos bajo el umbral de confianza, en lugar de una elección binaria entre bloquear y aceptar ciegamente: el pipeline sigue estando ampliamente automatizado, la relectura humana solo recae en los casos realmente inciertos.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El costo, la latencia y la exposición de datos ya están tratados en el arbitraje local/cloud; este capítulo añade lo propio del funcionamiento continuo: deriva de versión silenciosa de un OCR de terceros, seguimiento del CER/WER en el tiempo (desglosado por tipo de documento y por campo), y enrutamiento de los documentos de baja confianza hacia una relectura humana en lugar de un procesamiento ciego. |
| **Herramientas utilizables** | Un golden set reproducido regularmente en producción. Un tablero de seguimiento del CER/WER en el tiempo, desglosado por tipo de documento. Una cola de relectura humana para los documentos bajo un umbral de confianza. |
| **Trampas a evitar** | Detectar una deriva de versión solo después de errores visibles en etapas posteriores. Seguir solo un CER/WER global sin desglose. Tratar los documentos de baja confianza de forma únicamente binaria (bloquear o aceptar ciegamente). |
| **Buenas prácticas** | Reproducir el golden set a intervalo regular y en cada cambio de proveedor. Desglosar el seguimiento por tipo de documento y por campo. Enrutar los documentos de baja confianza hacia una relectura humana. |
