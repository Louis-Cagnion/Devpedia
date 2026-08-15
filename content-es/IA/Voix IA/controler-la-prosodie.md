---
order: 2
---

# Controlar la prosodia

Un modelo que produce un audio inteligible no basta: el mismo texto puede leerse de forma monótona y robótica, o con una entonación natural. Este capítulo cubre la **prosodia**: lo que, en una voz, no depende de la elección de las palabras en sí.

## Los tres componentes de la prosodia

| Componente | Lo que controla | Ejemplo |
|---|---|---|
| **Tono** (*pitch*, o F0) | La frecuencia fundamental de la voz, percibida como "grave" o "aguda" | Una entonación ascendente al final de una frase señala una pregunta |
| **Duración** | La velocidad de elocución, y el alargamiento de ciertos sonidos | Una sílaba acentuada dura más que las demás |
| **Energía** | El volumen, y su evolución a lo largo de una frase | Una sílaba acentuada también es más fuerte |

```text
"Vienes?"              vs        "Vienes."
       ↗                                ↘
   tono que sube               tono que baja
   al final de la frase        al final de la frase
   -> percibido como pregunta  -> percibido como afirmacion
```

El mismo texto, con una prosodia diferente, cambia el sentido percibido por el oyente, incluso si las palabras en sí no cambian.

## Dónde se decide la prosodia, según la arquitectura

[Tacotron](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) solo controla la prosodia **implícitamente**: el modelo aprendió, a partir de los ejemplos de entrenamiento, una prosodia plausible para un texto dado, sin que ningún parámetro explícito del modelo represente "el tono" o "la duración" por separado. Arquitecturas más recientes añaden un control **explícito**:

```text
Tacotron (control implicito):
Texto -> [modelo] -> espectrograma (prosodia deducida automaticamente)

Modelo con control explicito de prosodia:
Texto + parametros de prosodia deseados (tono, duracion, energia)
     -> [modelo] -> espectrograma que respeta esos parametros
```

> **Trampa:** esperar de un modelo con control implícito (como un Tacotron estándar) que produzca una prosodia precisa y reproducible bajo demanda (por ejemplo, "insistir en esta palabra precisa"). Sin un parámetro explícito para ello, el resultado depende únicamente de lo que el modelo aprendió a asociar con un texto de esta forma, no de una instrucción directa.
>
> **Buena práctica:** usar una arquitectura con control explícito de prosodia en cuanto el caso de uso exija una entonación precisa (poner énfasis en una palabra, marcar una pausa voluntaria), en lugar de esperar obtenerla indirectamente solo a través del texto de entrada.

## Un control tosco existe incluso en una API simple

La [Web Speech API](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) del navegador, mucho más simple que un modelo neuronal con control explícito, ya expone los tres componentes de arriba, en una forma reducida a un solo ajuste global por frase en lugar de una curva detallada:

```javascript
const enunciado = new SpeechSynthesisUtterance("Hola a todos");
enunciado.pitch = 1.2;   // tono: 0 (grave) a 2 (agudo), 1 por defecto
enunciado.rate = 0.9;    // duracion/velocidad: 0.1 (lento) a 10 (rapido), 1 por defecto
enunciado.volume = 1.0;  // energia/volumen: 0 (silencioso) a 1 (fuerte)
```

A diferencia de un modelo neuronal con control explícito, estos tres ajustes se aplican uniformemente a toda la frase: imposible aumentar el tono en una sola palabra precisa sin dividir la frase en varios enunciados sucesivos.

> **Trampa:** ajustar `pitch`/`rate`/`volume` de oído, frase por frase, sin método. Estos ajustes actúan globalmente sobre todo el enunciado: querer insistir en una sola palabra requiere dividir el texto en varios `SpeechSynthesisUtterance` distintos, uno por segmento con su propio valor, no un solo ajuste sobre la frase entera.
>
> **Buena práctica:** dividir explícitamente un texto en segmentos en cuanto se busque un control de prosodia diferenciado, incluso con una API tan simple como la Web Speech API.

Ver también [Modelos modernos de síntesis](/?c=ia&s=voix-ia&p=modeles-modernes-synthese) para arquitecturas que van más lejos que este control explícito básico.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La prosodia (tono, duración, energía) porta parte del sentido percibido, independientemente de las palabras en sí. Un modelo como Tacotron la controla implícitamente, deducida del entrenamiento; arquitecturas más recientes exponen un control explícito. Incluso una API simple como la Web Speech API expone estas tres palancas, pero globalmente por enunciado. |
| **Herramientas utilizables** | `pitch`/`rate`/`volume` de `SpeechSynthesisUtterance` para un control básico. Una arquitectura con control explícito para una necesidad más precisa. |
| **Trampas a evitar** | Esperar una prosodia precisa y reproducible de un modelo con control implícito. Ajustar los parámetros de una API simple de oído sin dividir el texto por segmento. |
| **Buenas prácticas** | Usar un modelo con control explícito en cuanto se necesite una entonación precisa. Dividir el texto en segmentos para diferenciar la prosodia, incluso con una API simple. |
