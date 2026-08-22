---
order: 3
---

# Modelos "Document AI": entender um documento além do texto puro

Os dois capítulos anteriores tratam a leitura de um documento como um **pipeline**: primeiro [detectar o layout](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (onde estão as áreas), depois [reconhecer o texto](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) de cada área, separadamente. Este capítulo apresenta uma família de modelos mais recente, chamada **Document AI**, que trata um documento como um objeto por si só (texto, posição, aparência visual reunidos), em vez de como texto puro depois que o OCR termina.

## O que um LLM de texto puro não vê

Um [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) clássico recebe uma sequência de [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm), sem nenhuma noção de **onde** cada palavra estava na página de origem. Mas, em um documento real, a posição carrega sentido por si só:

```text
Nota fiscal n°2024-118      <- no topo da pagina, em negrito: um titulo/referencia
                             
Cliente       Valor         <- alinhados em colunas: uma tabela
Souza SA      R$ 1.250
```

A mesma palavra ("Valor") tem um papel diferente dependendo de aparecer como cabeçalho de coluna ou em uma frase de parágrafo: um modelo que ignora a posição precisa adivinhar esse papel só a partir do texto ao redor, com mais risco de confusão que um modelo que vê a posição diretamente.

## LayoutLM: fundir texto, posição e imagem

O [**LayoutLM**](https://arxiv.org/abs/1912.13318) retoma a arquitetura Transformer de um LLM de texto, mas constrói o [embedding](/?c=ia&s=nlp-llm&p=nlp-et-llm) de cada token a partir de **três** fontes combinadas, em vez de apenas uma:

```text
Para cada palavra reconhecida pelo OCR:

  embedding(texto da palavra)  +  embedding(posicao x,y da palavra)  +  embedding(imagem da area da palavra)
         |                                |                                       |
   como em um LLM              coordenadas normalizadas                  extraido por um CNN
   de texto classico           na pagina (0 a 1000)                      (fonte, estilo...)

                    = embedding final, enviado ao Transformer
```

- **Texto**: a própria palavra, como em qualquer LLM.
- **Posição**: as coordenadas da caixa delimitadora da palavra (veja [Detecção de layout](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page)), também convertidas em vetor.
- **Imagem**: uma representação visual da área (extraída por um [CNN](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)), que captura indícios que o texto só não carrega (negrito, tamanho de fonte, moldura).

Esses três vetores são somados para formar um único embedding por palavra, exatamente como um LLM de texto já soma o embedding de um token e seu embedding de posição na sequência: o LayoutLM apenas adiciona duas dimensões extras (posição **espacial** 2D, e imagem) a esse mecanismo já conhecido.

> **Cuidado:** achar que o LayoutLM dispensa um OCR. O LayoutLM sempre precisa que um OCR já tenha extraído o texto de cada palavra e sua posição: ele enriquece o que o OCR produziu, não o substitui.
>
> **Boa prática:** situar o LayoutLM como uma etapa **depois** do OCR clássico (reconhecimento de texto), não como uma alternativa a essa etapa.

## Donut: dispensar completamente o OCR

O [**Donut**](https://arxiv.org/abs/2111.15664) (*Document understanding transformer*) encara o problema de forma inversa: em vez de adicionar informação a um texto já extraído por OCR, ele parte diretamente da **imagem bruta** do documento e gera diretamente a saída desejada (por exemplo, uma estrutura JSON com os campos de uma nota fiscal), sem nunca rodar um OCR separado:

```text
Pipeline classico (LayoutLM):
Imagem -> OCR (texto + posicao) -> LayoutLM (texto+posicao+imagem) -> resultado estruturado

Donut (ponta a ponta, sem OCR):
Imagem -> codificador visual -> decodificador -> resultado estruturado diretamente
```

A arquitetura retoma o mesmo princípio codificador/decodificador de um [Transformer de OCR](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning): um codificador visual lê a imagem, um decodificador gera a saída token por token. A diferença é que a saída não é mais o texto bruto da imagem, mas diretamente a estrutura final desejada (os campos já extraídos e nomeados).

| | Pipeline clássico (OCR + LayoutLM) | Ponta a ponta (Donut) |
|---|---|---|
| Etapas | Vários modelos especializados encadeados | Um único modelo, entrada imagem, saída estrutura |
| Cada etapa inspecionável separadamente | Sim (o texto reconhecido, a posição, a estrutura final são cada um visíveis) | Não (só a saída final é visível; impossível saber "onde" um erro foi introduzido) |
| Sensível a erros de OCR clássico | Sim (um erro de reconhecimento de caractere se propaga) | Menos diretamente, mas seus próprios erros são mais difíceis de diagnosticar |
| Volume de dados de treinamento exigido | Moderado (cada modelo especializado treina em uma tarefa restrita) | Alto (o modelo precisa aprender a tarefa completa de uma vez) |

> **Cuidado:** escolher o Donut por padrão porque é mais recente e mais simples de chamar (uma única etapa). Um pipeline clássico continua mais fácil de depurar (cada etapa produz um resultado intermediário verificável) e exige menos dados de treinamento para um caso de uso restrito.
>
> **Boa prática:** escolher uma arquitetura ponta a ponta quando a simplicidade operacional (um único modelo a manter) importar mais que a capacidade de diagnosticar precisamente um erro; manter um pipeline clássico quando a rastreabilidade de cada etapa for importante (um contexto regulamentado, por exemplo), ou quando o volume de dados de treinamento disponível permanecer limitado.

## PP-StructureV3: um pipeline clássico completo e pronto para uso

O capítulo [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) já menciona o [**PP-StructureV3**](https://github.com/PaddlePaddle/PaddleOCR): é um exemplo concreto de pipeline clássico (no sentido da linha "Pipeline clássico" da tabela acima), que encadeia detecção de layout, OCR, e reconstrução de tabelas como etapas separadas, mas já fornecidas montadas e prontas para uso em vez de construídas modelo por modelo.

Veja também [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) para o detalhe da reconstrução de grade posterior a este capítulo, e [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) para o mecanismo de embedding e atenção reutilizado aqui.

## O que reter

| | |
|---|---|
| **O que reter** | Um LLM de texto puro ignora a posição de uma palavra na página, uma informação que carrega sentido em um documento real. O LayoutLM funde texto, posição e imagem em um único embedding, mas sempre precisa de um OCR antes. O Donut dispensa completamente o OCR gerando diretamente uma saída estruturada a partir da imagem, ao custo de perder a rastreabilidade etapa por etapa. O PP-StructureV3 é um exemplo de pipeline clássico completo, pronto para uso. |
| **Ferramentas úteis** | LayoutLM e Donut como modelos pré-treinados reutilizáveis; PP-StructureV3 como pipeline clássico já montado. |
| **Armadilhas a evitar** | Achar que o LayoutLM substitui o OCR. Escolher uma arquitetura ponta a ponta por padrão sem considerar a perda de rastreabilidade e o volume de dados exigido. |
| **Boas práticas** | Situar o LayoutLM depois do OCR, não em seu lugar. Reservar o ponta a ponta para os casos em que a simplicidade operacional prevalece sobre a rastreabilidade, e manter um pipeline clássico em um contexto regulamentado ou com dados limitados. |
