---
order: 1
---

# Síntesis de voz: de la concatenación clásica al deep learning

La **síntesis de voz** (*text-to-speech*, TTS) convierte texto en audio. Como con el OCR (ver [OCR: del reconocimiento de patrones clásico al deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning)), los primeros enfoques se basaban en reglas y fragmentos grabados, antes de que el deep learning los reemplazara por modelos entrenados de punta a punta.

## La síntesis concatenativa: ensamblar fragmentos grabados

Una voz humana se graba en estudio, y luego se divide en pequeños fragmentos sonoros (**difonos**: la transición entre dos sonidos consecutivos, por ejemplo el sonido entre "a" y "b" en "ab"). Para pronunciar una nueva palabra, el sistema selecciona y ensambla los fragmentos correspondientes en una gran biblioteca pregrabada:

```text
Texto: "gato"
        │
        ▼
Division en fonemas: g - a - t - o
        │
        ▼
Busqueda de los difonos correspondientes en la biblioteca grabada:
  silencio->g, g->a, a->t, t->o, o->silencio
        │
        ▼
Concatenacion de los fragmentos de audio encontrados -> señal de audio final
```

| | Ventaja | Límite |
|---|---|---|
| Síntesis concatenativa | Voz natural en los fragmentos grabados (son grabaciones reales) | Transiciones a veces audibles entre fragmentos; cobertura limitada a las combinaciones previstas en la grabación; una nueva voz requiere volver a grabar todo |

> **Nota:** la **Web Speech API** del navegador (`SpeechSynthesisUtterance`, usada por la propia lectura de audio de Devpedia) es una abstracción: delega la síntesis real a las voces instaladas en el sistema, que varían según el dispositivo. Algunas de estas voces del sistema siguen cercanas al principio concatenativo descrito aquí; otras, en sistemas más recientes, ya se apoyan en modelos neuronales internamente. La API en sí no dice nada del motor subyacente, solo provee una interfaz común para pilotarlo (texto a leer, idioma, velocidad, tono).

> **Trampa:** creer que un fragmento grabado puede combinarse con cualquier otro sin pérdida de calidad. Dos difonos grabados en frases diferentes nunca tienen exactamente la misma entonación, el mismo volumen o la misma velocidad: pegarlos a menudo produce una transición audible, un artefacto característico de la síntesis concatenativa.
>
> **Buena práctica:** para un caso de uso donde la calidad percibida importa (ver el [capítulo sobre la evaluación](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale)), preferir un modelo de deep learning a los enfoques concatenativos siempre que sea posible: no sufre este artefacto, al precio de una necesidad de cómputo mayor.

## La síntesis por deep learning: Tacotron y el vocoder

Un modelo de deep learning ya no vuelve a pegar fragmentos existentes: **genera** una señal de audio, como un [Transformer genera texto token por token](/?c=ia&s=nlp-llm&p=nlp-et-llm). La arquitectura pionera, **Tacotron** (luego Tacotron 2), separa el problema en dos etapas:

```text
Texto -> [Tacotron: codificador-decodificador con atencion] -> espectrograma (mel)
                                                                  │
                                                                  ▼
                                              [Vocoder, ej. WaveNet] -> señal de audio final
```

- **Tacotron** convierte el texto en un **espectrograma mel**: una representación tipo imagen-tabla de la energía sonora por frecuencia a lo largo del tiempo, todavía no una señal de audio reproducible, vía un codificador-decodificador con [atención](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers), el mismo mecanismo que un LLM usa para el texto.
- El **vocoder** (ej. **WaveNet**) convierte este espectrograma en una onda sonora real, muestra por muestra.

> **Trampa:** creer que un espectrograma mel es directamente un sonido escuchable. Es una representación intermedia (cercana a lo que describe una partitura musical, en más detalle): hace falta el vocoder para transformarla en una onda sonora realmente audible.
>
> **Buena práctica:** tratar la generación de espectrograma y el vocoding como dos etapas distintas, potencialmente reemplazables de forma independiente (un mismo Tacotron puede funcionar con varios vocoders diferentes), en lugar de como un solo bloque indivisible.

## Comparativa

| | Concatenativa | Deep learning (Tacotron + vocoder) |
|---|---|---|
| Lo que produce el sonido | Ensamblaje de fragmentos realmente grabados | Generación completamente calculada por el modelo |
| Naturalidad en los casos previstos | Sí | Sí, y sobre una variedad más amplia de frases |
| Artefactos típicos | Transiciones audibles entre fragmentos | Raros con un modelo bien entrenado, pero un vocoder de mala calidad produce un sonido "metálico" |
| Añadir una nueva voz | Volver a grabar toda la biblioteca de fragmentos | Reentrenar o hacer fine-tuning con nuevas grabaciones (ver [Clonar una voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

Ver también [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) para el mecanismo de atención reutilizado aquí, y [Controlar la prosodia](/?c=ia&s=voix-ia&p=controler-la-prosodie) para lo que Tacotron solo controla implícitamente.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La síntesis concatenativa ensambla fragmentos de audio realmente grabados (difonos), con transiciones a veces audibles. La síntesis por deep learning genera el sonido: Tacotron convierte el texto en espectrograma mel vía atención, un vocoder (WaveNet) lo convierte luego en onda sonora. La Web Speech API del navegador es una abstracción que delega a uno u otro según el sistema. |
| **Herramientas utilizables** | La Web Speech API para una síntesis simple, sin costo, del lado del cliente. Tacotron 2 + un vocoder neuronal para una síntesis de mejor calidad, más costosa en cómputo. |
| **Trampas a evitar** | Suponer que dos fragmentos concatenados se ensamblan sin pérdida de calidad. Confundir un espectrograma mel con una señal de audio directamente reproducible. |
| **Buenas prácticas** | Preferir el deep learning a la concatenación en cuanto la calidad percibida importe. Tratar generación de espectrograma y vocoding como dos etapas distintas. |
