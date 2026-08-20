---
order: 14
---

# Marcado del contenido generado por IA

Distinguir un contenido producido por una IA de un contenido humano se convierte en un problema directo a medida que los modelos progresan: trazabilidad para una empresa que debe auditar sus propias salidas, obligación legal a través de la [regulación europea de la IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia) (transparencia exigida para todo contenido de riesgo limitado, deepfakes en particular), y lucha contra la desinformación a gran escala. El **marcado** (*watermarking*) responde a esta necesidad integrando, en el propio contenido generado, una señal que permite identificarlo después, pero la técnica difiere radicalmente según se marque texto, una imagen o audio.

## Marcado de texto: un sesgo estadístico, no un carácter oculto

No hay nada que ocultar en un texto: a diferencia de una imagen, no hay ningún píxel superfluo donde alojar una señal invisible. La técnica se apoya por tanto en otra cosa: influir ligeramente en las elecciones del modelo durante la propia generación.

Un LLM elige cada token siguiente a partir de una [distribución de probabilidad sobre todo el vocabulario](/?c=ia&s=nlp-llm&p=nlp-et-llm): varios tokens candidatos tienen una probabilidad no nula en un mismo punto del texto, y todos formarían una frase correcta. Una clave secreta, conocida solo por el proveedor del modelo, hace que algunos de estos candidatos sean ligeramente más probables que otros en cada etapa de generación:

```text
Distribucion de probabilidad sobre el vocabulario, en una posicion dada
      │
      ▼
Clave secreta -> favorece ligeramente ciertos tokens candidatos
      │
      ▼
Token elegido (el sesgo permanece invisible a la lectura)
```

Tomada de forma aislada, una sola palabra no prueba nada: cualquier humano podría haber hecho la misma elección. Repetido a lo largo de cientos o miles de tokens, este ligero sesgo forma en cambio un patrón estadístico que un detector que posea la clave puede medir, sin necesidad de acceder al modelo en sí.

> **Trampa:** buscar una palabra considerada "típica de la IA" (como *delve*, muy citada como supuesto marcador) y ver en ella una prueba de generación por IA. No existe ninguna lista secreta de palabras prohibidas: la preferencia del modelo por ciertas palabras viene de su entrenamiento, no de un mecanismo de marcado, y un texto marcado no necesita contener ninguna palabra en particular.
>
> **Buena práctica:** tratar este marcado como una prueba estadística probabilística, nunca como un veredicto binario: un detector devuelve una puntuación de confianza, no una certeza.

### Los límites propios del texto

La señal estadística es frágil por razones propias del texto, independientes de cualquier intento de eludirla:

| Situación | Efecto sobre la señal |
|---|---|
| Texto muy corto (unas pocas frases) | Demasiado pocos tokens para que emerja un patrón estadístico: la detección no es fiable |
| Reescritura o paráfrasis | Cada palabra reformulada es una nueva elección, independiente del sesgo de origen: la señal se borra progresivamente |
| Resumen | El resumen es una nueva generación de tokens, no una copia: la señal del texto fuente no se conserva en él |
| Traducción | Cambia por completo el espacio de tokens candidatos (otro idioma): la señal no sobrevive al paso |

> **Trampa:** presentar un marcado de texto como una garantía contra todo uso abusivo. Una señal tan frágil como un sesgo estadístico solo es realmente fiable en un texto largo, no retocado, en su idioma de origen, y una buena parte de los usos reales (copiar y pegar parcial, reformulación, traducción) ya la hace desaparecer.
>
> **Buena práctica:** comunicar honestamente sobre esta limitación en lugar de presentar el marcado de texto como una solución robusta: es un indicio estadístico más, no una prueba de autenticidad en el sentido criptográfico.

## Marcado de imagen y audio: una marca insertada en la señal

A diferencia del texto, una imagen o un flujo de audio dispone de un espacio físico donde alojar una señal sin alterar su percepción: un píxel tiene varios matices posibles, una muestra de audio varios valores próximos, todos percibidos de forma idéntica por el ojo o el oído humano.

| Enfoque | Principio | Ejemplo |
|---|---|---|
| Marca imperceptible | Un patrón codificado en los píxeles o el muestreo, invisible/inaudible para un humano pero legible por un detector dedicado | El marcado de audio mencionado en [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix) |
| Marca perceptible | Una marca visible o audible directamente | Una filigrana "generado por IA" superpuesta a una imagen |
| Metadatos de procedencia ([C2PA](https://c2pa.org)/*Content Credentials*) | Una cadena de metadatos firmados criptográficamente, adjunta al archivo, que traza cada etapa de creación/modificación | Una imagen cuyos metadatos indican: generada por tal modelo, luego modificada por tal software |

El estándar [C2PA](https://c2pa.org) (*Coalition for Content Provenance and Authenticity*) difiere de los dos primeros enfoques: no modifica el contenido en sí, le adjunta un historial verificable. Su punto débil está justo ahí: estos metadatos desaparecen con una simple exportación o una captura de pantalla, sin tocar el contenido visual/audio en sí, mientras que una marca imperceptible correctamente diseñada resiste mejor.

> **Trampa:** considerar una marca imperceptible como definitivamente indestructible. Una compresión agresiva, un recorte o un procesamiento de audio voluntario puede degradar o borrar la marca, un punto ya señalado del lado del audio en [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix).
>
> **Buena práctica:** combinar varias capas (marca imperceptible y metadatos C2PA) en lugar de apoyarse en una sola, cada una con un punto de ruptura diferente.

## Un límite común a todas las técnicas: detectar, no impedir

Ya sea texto, imagen o audio, el marcado responde a una sola pregunta, *a posteriori*: ¿ha sido generado este contenido por IA? No responde a ninguna otra: no impide que un modelo genere un contenido problemático, no bloquea nada en el momento de la generación, y solo sirve si efectivamente se consulta un detector después.

> **Trampa:** presentar el marcado como una medida de seguridad que impide un mal uso. Es una herramienta de trazabilidad a posteriori, no un mecanismo de prevención: un contenido marcado puede circular libremente, servir para un fraude o para desinformación, sin que ningún mecanismo intervenga antes de que el daño esté hecho.
>
> **Buena práctica:** situar el marcado en una cadena más amplia de trazabilidad y responsabilización (obligaciones de transparencia de la [regulación europea de la IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia), políticas de uso, moderación), nunca como una solución aislada suficiente.

## Resumen

| | |
|---|---|
| **Para recordar** | El marcado de texto sesga estadísticamente la elección de los tokens gracias a una clave secreta; pierde su fiabilidad en un texto corto, reescrito, resumido o traducido. El marcado de imagen/audio aloja una señal imperceptible en el contenido, o se apoya en metadatos de procedencia firmados (C2PA). En todos los casos, el marcado detecta después, no impide nada en el momento de la generación. |
| **Herramientas utilizables** | Un detector estadístico que posee la clave secreta, para el texto. Una marca imperceptible o metadatos C2PA, para la imagen y el audio. |
| **Trampas a evitar** | Confundir una palabra considerada "típica de la IA" con una prueba de marcado. Presentar una marca como una garantía infalible o como un mecanismo de prevención en lugar de detección. |
| **Buenas prácticas** | Tratar el resultado de un detector como una puntuación probabilística, nunca un veredicto tajante. Combinar varias capas de marcado (imperceptible y metadatos) en lugar de una sola. Situar el marcado en una cadena más amplia de trazabilidad, no como solución aislada. |
