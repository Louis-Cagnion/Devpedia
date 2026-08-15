---
order: 4
---

# Clonar una voz: técnica e implicaciones éticas/legales

El [capítulo anterior](/?c=ia&s=voix-ia&p=modeles-modernes-synthese) menciona que algunos modelos pueden imitar una voz a partir de una muestra corta. Este capítulo desarrolla esta técnica, la **clonación de voz**, y sobre todo sus implicaciones: es la noción más sensible de esta sección, sin un equivalente tan directo del lado del texto o la imagen.

## Cómo un modelo captura "una voz"

Un modelo de clonación extrae, a partir de una muestra de audio de referencia, un **embedding de locutor** (*speaker embedding*): un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de números que resume las características de esa voz (timbre, tono promedio, acento), separadamente del contenido de lo que se dice:

```text
Muestra de referencia (unos segundos) -> extraccion -> embedding de locutor (un vector)
                                                                      │
Texto a leer -> [modelo de sintesis, condicionado por este embedding] -> audio con esta voz
```

El mismo principio que los [embeddings de palabras](/?c=ia&s=nlp-llm&p=nlp-llm): una voz cercana a otra (mismo timbre general) tiene un embedding cercano, dos voces muy diferentes tienen embeddings alejados.

| Cantidad de audio de referencia | Resultado típico |
|---|---|
| Unos segundos (*zero-shot*) | Semejanza general, a veces algunos artefactos en sonidos raros de la muestra |
| Unos minutos | Semejanza claramente mejor, más estable |
| Varias horas (fine-tuning dedicado, ver el capítulo siguiente) | Calidad más cercana a la voz original |

## Las implicaciones éticas y legales: consentimiento y deepfake de audio

Clonar una voz sin el acuerdo de la persona afectada plantea un problema directo, independientemente de la calidad técnica del resultado:

> **Trampa:** tratar la clonación de voz como una simple proeza técnica, sin considerar si la persona cuya voz se clona dio su consentimiento. Un audio generado con la voz de alguien puede servir para un fraude (usurpación en una llamada telefónica, una técnica ya explotada para engañar a empleados o allegados), para desinformación (hacer que una figura pública "diga" cosas que nunca dijo), o para un daño a la imagen sin que ninguna ley de derechos de autor clásica se aplique claramente.
>
> **Buena práctica:** obtener un consentimiento explícito y documentado antes de clonar la voz de una persona identificable, y diseñar el producto final para que quede rastreable hasta su fuente (ver el marcado más abajo), no solo confiar en la ausencia de queja.

La voz de una persona es en sí misma un **dato biométrico**: la [regulación europea de la IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia) impone obligaciones de transparencia específicas sobre el contenido de audio generado o manipulado por IA (señalar que un contenido es artificial); este capítulo no entra en el detalle jurídico ya cubierto por ese capítulo dedicado.

## El marcado del contenido generado (*watermarking*)

Una respuesta técnica al riesgo de desinformación consiste en integrar, en el propio audio generado, una marca inaudible que permite identificarlo posteriormente como producido por IA:

```text
Audio generado por un modelo de clonacion
      │
      ▼
Marcado: una señal inaudible para el oido humano, codificada en el audio
      │
      ▼
Un detector dedicado puede recuperar esta marca y confirmar: "este audio es generado por IA"
```

> **Trampa:** considerar el marcado como una garantía absoluta. Un marcado puede eliminarse o degradarse por una compresión o un procesamiento de audio posterior, voluntario o no; solo es una protección frente a un uso que no busca activamente evitarlo.
>
> **Buena práctica:** tratar el marcado como una capa de trazabilidad adicional, no como una garantía infalible, a combinar con el consentimiento documentado y políticas de uso claras del lado del proveedor.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La clonación de voz extrae un embedding de locutor a partir de una muestra de referencia, que luego condiciona un modelo de síntesis. La calidad mejora con la cantidad de audio de referencia. El consentimiento de la persona clonada es el problema central, distinto de la proeza técnica; la regulación europea de la IA impone obligaciones de transparencia sobre este tipo de contenido. El marcado inaudible ayuda a la trazabilidad, sin garantía absoluta. |
| **Herramientas utilizables** | Un embedding de locutor para capturar una voz a partir de una muestra de referencia. Un marcado inaudible para la trazabilidad del contenido generado. |
| **Trampas a evitar** | Clonar una voz sin consentimiento documentado. Considerar el marcado como una garantía absoluta contra el mal uso. |
| **Buenas prácticas** | Obtener y documentar un consentimiento explícito antes de toda clonación de una voz identificable. Combinar marcado, consentimiento documentado y políticas de uso claras. |
