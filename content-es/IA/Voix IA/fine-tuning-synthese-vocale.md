---
order: 5
---

# Entrenar y hacer fine-tuning de un modelo de síntesis de voz

El [fine-tuning de un modelo de visión](/?c=ia&s=vision-et-ocr&p=fine-tuning-modele-vision) ya aplica los principios genéricos (transfer learning, congelamiento de capas, tasa de aprendizaje reducida) que se aplican tal cual a un modelo de síntesis de voz. Este capítulo cubre lo específico de la voz.

## Dos necesidades diferentes, dos enfoques diferentes

| Necesidad | Enfoque | Cantidad de datos necesaria |
|---|---|---|
| Usar una voz existente, puntualmente | [Clonación zero-shot](/?c=ia&s=voix-ia&p=cloner-une-voix) | Unos segundos, sin reentrenamiento |
| Una voz de calidad estable, reutilizada masivamente en producción | Fine-tuning dedicado | Varias horas de grabaciones de esa voz |

La clonación zero-shot (ver el capítulo anterior) sigue siendo una aproximación rápida; un fine-tuning dedicado, partiendo de un modelo preentrenado y continuando su entrenamiento específicamente con horas de grabación de una voz dada, produce un resultado más estable y de mejor calidad, al precio de un trabajo de recolección de datos mucho más pesado.

> **Trampa:** elegir un fine-tuning dedicado para una necesidad puntual (una sola frase, un uso ocasional), cuando el costo de recolectar varias horas de grabaciones supera ampliamente el beneficio para ese caso de uso.
>
> **Buena práctica:** reservar el fine-tuning dedicado para las voces realmente reutilizadas a gran escala (un asistente de voz de producto, un narrador recurrente), y la clonación zero-shot para cualquier uso más puntual.

## La calidad de los datos de entrenamiento, un problema propio del audio

A diferencia de una imagen, cuya calidad se juzga bastante directamente a simple vista, la calidad de una grabación de audio de entrenamiento depende de factores fáciles de ignorar:

| Factor | Problema si se descuida |
|---|---|
| Ruido de fondo | El modelo aprende a reproducir el ruido además de la voz |
| Variación de volumen entre grabaciones | El modelo produce una voz con intensidad incoherente de una frase a otra |
| Diversidad de las frases grabadas (fonemas cubiertos) | Un fonema raro, nunca escuchado en el entrenamiento, se reproduce mal en la generación |

> **Trampa:** usar grabaciones de calidad desigual (ruido de fondo variable, volúmenes diferentes) suponiendo que el modelo "hará un promedio" y de todos modos producirá un resultado limpio. El modelo aprende fielmente lo que ve, incluidos sus defectos, exactamente como un modelo entrenado con datos no representativos (ver [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
>
> **Buena práctica:** normalizar el volumen de todas las grabaciones antes del entrenamiento, y limpiar en lo posible el ruido de fondo, en lugar de contar con que el modelo compense datos de calidad desigual.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La clonación zero-shot conviene para un uso puntual; un fine-tuning dedicado, sobre varias horas de grabación, produce una voz más estable para un uso masivo en producción. El ruido de fondo y las variaciones de volumen en los datos de entrenamiento se reproducen fielmente en la voz generada. |
| **Herramientas utilizables** | Los principios genéricos de fine-tuning ya vistos para la visión (transfer learning, congelamiento de capas). Herramientas de limpieza y normalización de audio previas al entrenamiento. |
| **Trampas a evitar** | Elegir un fine-tuning dedicado para una necesidad puntual. Usar grabaciones de calidad desigual esperando que el modelo compense. |
| **Buenas prácticas** | Reservar el fine-tuning dedicado para las voces reutilizadas a gran escala. Normalizar y limpiar las grabaciones antes del entrenamiento. |
