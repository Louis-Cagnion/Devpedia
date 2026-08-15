---
order: 6
---

# Evaluar una síntesis de voz: MOS, inteligibilidad, latencia

[Evaluar un OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) compara una salida con una referencia exacta conocida (el texto real de la imagen). Una síntesis de voz no tiene esa suerte: no existe una "respuesta correcta" única para "cómo debe sonar una voz", una pregunta que sigue siendo ampliamente subjetiva.

## El MOS (*Mean Opinion Score*): medir una percepción subjetiva

El [**MOS**](https://es.wikipedia.org/wiki/Mean_opinion_score) hace evaluar una muestra de audio por oyentes humanos, en una escala de 1 (malo) a 5 (excelente), y luego promedia sus notas:

```text
Muestra de audio generada
      │
      ▼
Nota de varios oyentes humanos independientes: 4, 5, 3, 4, 4
      │
      ▼
MOS = promedio de las notas = (4+5+3+4+4) / 5 = 4.0
```

| MOS | Interpretación típica |
|---|---|
| Cerca de 5 | Percibido como una voz humana real, casi indistinguible |
| 3 a 4 | Comprensible, pero indicios delatan un origen sintético |
| Bajo 3 | Artefactos audibles molestos (ver la síntesis concatenativa, ver [Fundamentos](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning)) |

> **Trampa:** comparar puntuaciones MOS obtenidas en condiciones de evaluación diferentes (número de oyentes, instrucciones dadas, equipo de escucha). Un MOS no es una medida física absoluta como una longitud en metros: dos protocolos de evaluación diferentes producen puntuaciones que no se comparan directamente, incluso sobre la misma muestra de audio.
>
> **Buena práctica:** comparar puntuaciones MOS solo si provienen del mismo protocolo de evaluación (mismas instrucciones, panel de oyentes comparable), o usar un mismo predictor automático de MOS para ambas, nunca puntuaciones recogidas en contextos heterogéneos.

## La inteligibilidad: más allá de la naturalidad percibida

Un audio puede sonar "natural" (MOS alto) sin que cada palabra se entienda claramente, y a la inversa, una voz claramente sintética puede entenderse perfectamente. La **inteligibilidad** se mide por separado, a menudo haciendo transcribir el audio por oyentes y comparando su transcripción con el texto original, exactamente el mismo cálculo de [WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) ya visto para el OCR, pero aplicado a lo que un humano entendió al oído en lugar de a lo que un modelo reconoció en una imagen.

> **Trampa:** confiar únicamente en el MOS para un caso de uso donde la comprensión exacta del mensaje importa más que la naturalidad percibida (un anuncio de seguridad, una alerta). Un MOS alto no garantiza que un mensaje crítico siga siendo 100% inteligible.
>
> **Buena práctica:** medir la inteligibilidad por separado del MOS en cuanto un caso de uso exija una comprensión fiable del contenido, no solo una voz agradable de escuchar.

## La latencia: tiempo real vs generación por adelantado

| | Generación por adelantado | Tiempo real |
|---|---|---|
| Caso de uso típico | Audiolibro, narración de video | Asistente de voz, traducción en vivo |
| Lo que importa | El tiempo total de generación (puede tomar varios segundos por frase) | El retraso entre el envío del texto y el primer sonido audible (*time to first audio*) |
| Restricción sobre la arquitectura | Poca restricción: la generación puede correr en segundo plano | Requiere un flujo (*streaming*): generar y reproducir el audio en pequeños segmentos, sin esperar la frase completa |

> **Trampa:** medir únicamente el tiempo total de generación de una frase completa para juzgar si un modelo conviene a un uso en tiempo real. Un modelo puede tardar 2 segundos en generar una frase completa mientras produce el primer segmento audible en 200 ms vía un flujo progresivo: es este retraso inicial el que importa para un uso interactivo, no el tiempo total.
>
> **Buena práctica:** medir específicamente el retraso antes del primer sonido audible para un uso en tiempo real, y verificar que la arquitectura elegida realmente soporte un flujo progresivo en lugar de una generación bloqueante de la frase completa.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El MOS mide una percepción subjetiva de naturalidad vía una puntuación humana promediada, no comparable entre protocolos diferentes. La inteligibilidad se mide por separado (cercana al WER, aplicado a la escucha humana) e importa más que un MOS alto para un mensaje crítico. La latencia pertinente en tiempo real es el retraso antes del primer sonido, no el tiempo de generación total. |
| **Herramientas utilizables** | Un panel de oyentes con un protocolo fijo para el MOS. Una medida de WER sobre la retranscripción humana para la inteligibilidad. Una arquitectura en flujo (*streaming*) para un uso en tiempo real. |
| **Trampas a evitar** | Comparar MOS provenientes de protocolos diferentes. Confiar únicamente en el MOS para un mensaje donde la comprensión exacta importa. Juzgar la latencia por el tiempo de generación total en lugar del retraso antes del primer sonido. |
| **Buenas prácticas** | Comparar MOS solo con un protocolo comparable. Medir la inteligibilidad por separado en cuanto sea crítica. Medir el retraso antes del primer sonido para un uso en tiempo real. |
