---
order: 1
---

# Síntese de voz: da concatenação clássica ao deep learning

A **síntese de voz** (*text-to-speech*, TTS) converte texto em áudio. Assim como para o OCR (veja [OCR: do reconhecimento de padrões clássico ao deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning)), as primeiras abordagens se baseavam em regras e fragmentos gravados, antes que o deep learning as substituísse por modelos treinados de ponta a ponta.

## A síntese concatenativa: montar fragmentos gravados

Uma voz humana é gravada em estúdio, e então dividida em pequenos fragmentos sonoros (**difones**: a transição entre dois sons consecutivos, por exemplo o som entre "a" e "b" em "ab"). Para pronunciar uma nova palavra, o sistema seleciona e monta os fragmentos correspondentes em uma grande biblioteca pré-gravada:

```text
Texto: "gato"
        │
        ▼
Divisao em fonemas: g - a - t - o
        │
        ▼
Busca dos difones correspondentes na biblioteca gravada:
  silencio->g, g->a, a->t, t->o, o->silencio
        │
        ▼
Concatenacao dos fragmentos de audio encontrados -> sinal de audio final
```

| | Vantagem | Limite |
|---|---|---|
| Síntese concatenativa | Voz natural nos fragmentos gravados (são gravações reais) | Transições às vezes audíveis entre fragmentos; cobertura limitada às combinações previstas na gravação; uma nova voz exige regravar tudo |

> **Nota:** a **Web Speech API** do navegador (`SpeechSynthesisUtterance`, usada pela própria leitura de áudio do Devpedia) é uma abstração: ela delega a síntese real às vozes instaladas no sistema, que variam de acordo com o dispositivo. Algumas dessas vozes de sistema permanecem próximas do princípio concatenativo descrito aqui; outras, em sistemas mais recentes, já se apoiam em modelos neurais internamente. A própria API não diz nada sobre o motor subjacente, apenas fornece uma interface comum para controlá-lo (texto a ler, idioma, velocidade, altura).

> **Cuidado:** achar que um fragmento gravado pode se combinar com qualquer outro sem perda de qualidade. Dois difones gravados em frases diferentes nunca têm exatamente a mesma intonação, o mesmo volume ou a mesma velocidade: colá-los novamente muitas vezes produz uma transição audível, um artefato característico da síntese concatenativa.
>
> **Boa prática:** para um caso de uso em que a qualidade percebida importa (veja o [capítulo sobre avaliação](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale)), preferir um modelo de deep learning às abordagens concatenativas sempre que possível: ele não sofre desse artefato, ao custo de uma necessidade maior de cálculo.

## A síntese por deep learning: Tacotron e o vocoder

Um modelo de deep learning não cola mais fragmentos existentes: ele **gera** um sinal de áudio, como um [Transformer gera texto token por token](/?c=ia&s=nlp-llm&p=nlp-et-llm). A arquitetura pioneira, **Tacotron** (e depois Tacotron 2), separa o problema em duas etapas:

```text
Texto -> [Tacotron: codificador-decodificador com atencao] -> espectrograma (mel)
                                                                       │
                                                                       ▼
                                              [Vocoder, ex. WaveNet] -> sinal de audio final
```

- O **Tacotron** converte o texto em um **espectrograma mel**: uma representação em forma de tabela da energia sonora por frequência ao longo do tempo, ainda não um sinal de áudio tocável, via um codificador-decodificador com [atenção](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers), o mesmo mecanismo que um LLM usa para o texto.
- O **vocoder** (ex. **WaveNet**) converte esse espectrograma em uma onda sonora de verdade, amostra por amostra.

> **Cuidado:** achar que um espectrograma mel já é um som audível diretamente. É uma representação intermediária (parecida com o que uma partitura musical descreve, com mais detalhe): é preciso o vocoder para transformá-la em onda sonora realmente audível.
>
> **Boa prática:** tratar a geração de espectrograma e a vocodificação como duas etapas distintas, potencialmente substituíveis independentemente (um mesmo Tacotron pode funcionar com vários vocoders diferentes), em vez de um único bloco indivisível.

## Comparativo

| | Concatenativa | Deep learning (Tacotron + vocoder) |
|---|---|---|
| O que produz o som | Montagem de fragmentos realmente gravados | Geração inteiramente calculada pelo modelo |
| Natural nos casos previstos | Sim | Sim, e em uma variedade maior de frases |
| Artefatos típicos | Transições audíveis entre fragmentos | Raros com um modelo bem treinado, mas um vocoder de má qualidade produz um som "metálico" |
| Adicionar uma nova voz | Regravar toda a biblioteca de fragmentos | Retreinar ou fazer fine-tuning com novas gravações (veja [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

Veja também [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) para o mecanismo de atenção reutilizado aqui, e [Controlar a prosódia](/?c=ia&s=voix-ia&p=controler-la-prosodie) para o que o Tacotron só controla implicitamente.

## O que reter

| | |
|---|---|
| **O que reter** | A síntese concatenativa monta fragmentos de áudio realmente gravados (difones), com transições às vezes audíveis. A síntese por deep learning gera o som: o Tacotron converte o texto em espectrograma mel via atenção, um vocoder (WaveNet) o converte então em onda sonora. A Web Speech API do navegador é uma abstração que delega a um ou outro de acordo com o sistema. |
| **Ferramentas úteis** | A Web Speech API para uma síntese simples, sem custo, do lado do cliente. Tacotron 2 + um vocoder neural para uma síntese de melhor qualidade, mais custosa em cálculo. |
| **Armadilhas a evitar** | Supor que dois fragmentos concatenados se montam sem perda de qualidade. Confundir um espectrograma mel com um sinal de áudio diretamente tocável. |
| **Boas práticas** | Preferir o deep learning à concatenação sempre que a qualidade percebida importar. Tratar a geração de espectrograma e a vocodificação como duas etapas distintas. |
