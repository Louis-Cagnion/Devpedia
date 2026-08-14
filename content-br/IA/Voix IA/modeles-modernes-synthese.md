---
order: 3
---

# Modelos modernos de síntese: os codecs neurais

[Tacotron + vocoder](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) trata o texto e o áudio como dois mundos separados, ligados por um espectrograma intermediário. Uma família de modelos mais recente, ilustrada pelo [**VALL-E**](https://arxiv.org/abs/2301.02111), unifica os dois tratando a síntese de voz como um problema de linguagem, exatamente como um LLM trata o texto.

## A ideia central: o áudio se torna uma sequência de tokens

Um [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) prediz o próximo token de texto, a partir dos que vieram antes. O VALL-E aplica o mesmo princípio, mas em **tokens de áudio** em vez de tokens de texto:

```text
LLM de texto:
"O gato dorme no" -> prediz o proximo token de texto ("sofa")

VALL-E (LLM aplicado ao audio):
Texto a ler + alguns segundos de voz de referencia
      -> prediz uma sequencia de tokens de audio, um a um
      -> esses tokens de audio sao entao decodificados em um sinal sonoro
```

Esses tokens de áudio vêm de um **codec neural** (*neural codec*): um modelo treinado separadamente para comprimir um sinal de áudio em uma sequência curta de números discretos (os tokens), e então reconstruí-lo a partir desses mesmos tokens, um pouco como um arquivo de áudio comprimido (MP3) representa um som por uma sequência de números mais curta que a onda original, mas aprendido em vez de projetado manualmente.

> **Cuidado:** confundir essa abordagem com o Tacotron sob o pretexto de que os dois "geram áudio a partir de texto". O Tacotron produz um espectrograma contínuo (uma imagem); no caso do VALL-E, token por token, é uma sequência discreta de símbolos, predita exatamente como um LLM prediz texto: o objetivo de treinamento e a natureza da saída intermediária diferem completamente.
>
> **Boa prática:** identificar se um modelo produz uma representação contínua (espectrograma) ou uma sequência de tokens discretos antes de compará-lo a outro: essa escolha estrutural explica boa parte de suas forças e limitações (veja a clonagem de voz abaixo).

## O que essa arquitetura permite: a clonagem "zero-shot"

Porque o modelo recebe "alguns segundos de voz de referência" como parte de sua entrada (como um [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) que guia um LLM), ele pode imitar uma voz que nunca viu no treinamento, a partir de uma amostra bem curta, sem nenhum retreinamento:

| | Voz "fixa" (uma voz pré-treinada) | Clonagem zero-shot (VALL-E e equivalentes) |
|---|---|---|
| Nova voz disponível | Não, apenas as vozes já treinadas | Sim, a partir de alguns segundos de áudio de referência |
| Retreinamento necessário | Não (já treinado) | Não (o modelo generaliza a partir do exemplo dado na entrada) |
| Controle do resultado | Previsível, a voz foi validada no treinamento | Variável, a fidelidade depende da qualidade e da duração da amostra de referência |

Esse mecanismo é desenvolvido em mais detalhe, com suas questões éticas e legais, em [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix).

## O que reter

| | |
|---|---|
| **O que reter** | O VALL-E e modelos similares tratam a síntese de voz como um problema de linguagem: um codec neural converte o áudio em tokens discretos, que um modelo prediz um a um como um LLM prediz texto. Essa arquitetura permite a clonagem de voz "zero-shot" a partir de uma amostra curta, sem retreinamento. |
| **Ferramentas úteis** | Um codec neural para converter o áudio em tokens; um modelo do tipo LLM para prever esses tokens a partir do texto e de uma amostra de referência. |
| **Armadilhas a evitar** | Confundir essa arquitetura com o Tacotron porque os dois "geram áudio a partir de texto", ignorando a diferença entre representação contínua e tokens discretos. |
| **Boas práticas** | Identificar se um modelo produz uma representação contínua ou tokens discretos antes de compará-lo a outro. |
