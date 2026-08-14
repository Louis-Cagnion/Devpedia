---
order: 17
---

# OCR: do reconhecimento de padrões clássico ao deep learning

O capítulo [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) define o **OCR** (reconhecimento óptico de caracteres) e cobre o que acontece **em volta** do texto (localizar uma tabela, reconstruir sua grade). Este capítulo foca na etapa que vem antes: como um modelo transforma os pixels de uma área de texto em caracteres, do primeiríssimo OCR (comparação de padrões) até os modelos de deep learning modernos.

## O OCR clássico: reconhecer um caractere como uma imagem de referência

Os primeiros motores de OCR (incluindo as primeiras versões do [**Tesseract**](https://github.com/tesseract-ocr/tesseract), um motor OCR open source) dividem o problema em três etapas estritamente separadas:

```text
Imagem da linha de texto
        │
        ▼
1. Segmentacao: dividir a linha em uma imagem por caractere
        │
        ▼
2. Extracao de caracteristicas: medir tracos do desenho
   (numero de curvas, de tracos verticais, de buracos...)
        │
        ▼
3. Comparacao: qual caractere de referencia tem as caracteristicas mais proximas?
```

Essa abordagem funciona bem em um texto limpo, impresso, com caracteres bem separados: é a **segmentação** da etapa 1 que é o ponto fraco.

> **Cuidado:** uma segmentação que supõe que os caracteres estão sempre separados por um espaço nítido. Duas letras que se tocam (uma fonte fina e apertada, um texto manuscrito cursivo) ou um caractere danificado pelo ruído do escaneamento (imagem um pouco torta, manchada) quebram essa hipótese: a linha então é dividida no lugar errado, e todo o resto (extração de características, comparação) parte de uma imagem de caractere já errada.
>
> **Boa prática:** reservar o OCR clássico para documentos cujo texto seja efetivamente limpo e impresso (formulários padronizados, texto digital renderizado como imagem); para texto manuscrito ou de qualidade variável, preferir uma abordagem de deep learning que não dependa de uma segmentação prévia (veja abaixo).

## O deep learning evita a segmentação caractere por caractere

Um **CRNN** (*Convolutional Recurrent Neural Network*) combina as duas [arquiteturas vistas anteriormente](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) em vez de inventar uma nova:

```text
Imagem da linha inteira
        │
        ▼
CNN: extrai uma coluna de caracteristicas visuais em cada posicao horizontal
     (nenhuma divisao em caracteres individuais)
        │
        ▼
RNN (LSTM/GRU): le essas colunas da esquerda para a direita, como uma sequencia
        │
        ▼
Uma distribuicao de probabilidade sobre os caracteres possiveis, em cada posicao
```

O CNN não "sabe" onde começa nem onde termina cada caractere: ele produz uma sequência de colunas de características, uma por fatia vertical da imagem, sem nunca precisar segmentar a linha antecipadamente. É o RNN, e a etapa seguinte, que dão sentido a essa sequência.

### O problema que o CTC resolve: alinhar uma saída mais longa que o texto

O número de colunas produzidas pelo CNN (uma por fatia da imagem) nunca corresponde exatamente ao número de caracteres do texto: uma letra larga como "M" ocupa várias colunas, uma letra fina como "l" ocupa apenas uma. Sem um mecanismo dedicado, a rede não tem como aprender "quais colunas correspondem a qual caractere", por falta de anotação tão precisa nos dados de treinamento (que dão o texto da linha, não a posição pixel por pixel de cada letra).

O **CTC** (*Connectionist Temporal Classification*) resolve esse problema adicionando um símbolo especial, o **branco** (`Ø`), que o modelo pode produzir livremente entre dois caracteres repetidos ou incertos, e então aplicando uma regra de simplificação fixa para obter o texto final:

```text
Saida bruta do RNN (uma predicao por coluna):
  Ø  Ø  h  h  Ø  e  e  Ø  l  l  l  Ø  Ø  l  o  o  Ø

Regra CTC: fundir os caracteres identicos consecutivos, depois remover os Ø
  h  h  →  h          l  l  l  →  l         (repeticoes fundidas)
  Ø         (removidos)

Resultado: h  e  l  l  o   ->  "hello"
```

| | OCR clássico | CRNN + CTC |
|---|---|---|
| Divisão em caracteres | Obrigatória, antes do reconhecimento | Nunca necessária |
| Dado de treinamento exigido | Imagem de caractere isolado, já rotulado | Imagem de linha inteira + seu texto, sem posição |
| Robustez a texto cursivo/apertado | Baixa (a segmentação falha) | Boa (nenhuma segmentação a fazer) |

> **Cuidado:** repetir um caractere de propósito no texto real (ex.: "book", com dois "o" consecutivos) e achar que a regra de fusão do CTC vai reduzi-lo a um único "o". A regra de fusão só se aplica às repetições consecutivas da saída bruta do modelo, não ao texto final: o modelo aprende a inserir um `Ø` entre duas repetições **desejadas** no texto, precisamente para evitar que sejam fundidas por engano.
>
> **Boa prática:** deixar essa distinção para o treinamento (o modelo aprende, a partir dos exemplos, quando inserir um `Ø` entre dois caracteres idênticos desejados) em vez de tentar codificá-la manualmente no pós-processamento.

## Os modelos baseados em Transformers: substituir o RNN pela atenção

Assim como para o texto puro (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), o RNN de um CRNN pode ser substituído por um mecanismo de **atenção**. Uma arquitetura Transformer para OCR (por exemplo, [TrOCR](https://arxiv.org/abs/2109.10282)) se compõe de dois blocos:

- Um **codificador visual**: divide a imagem em pequenos patches (como uma grade), e calcula uma representação de cada patch considerando todos os outros por atenção, em vez da leitura estritamente esquerda-para-direita de um RNN.
- Um **decodificador de texto**: gera os caracteres um a um, cada um podendo "olhar" para qualquer patch da imagem (não apenas os patches vizinhos do último caractere produzido), e o texto já gerado.

Essa arquitetura não depende mais do CTC: o decodificador gera diretamente uma sequência de caracteres, como um LLM gera uma sequência de palavras (veja [Processamento de linguagem natural (NLP) e grandes modelos de linguagem (LLM)](/?c=ia&s=nlp-llm&p=nlp-et-llm)), sem as restrições de alinhamento coluna por coluna de um CRNN.

> **Cuidado:** supor que um modelo Transformer é automaticamente superior a um CRNN+CTC para qualquer tarefa de OCR. Um Transformer de OCR geralmente é mais exigente em dados de treinamento e cálculo; em um caso de uso restrito (uma única fonte, um formato de documento fixo), um CRNN+CTC mais leve costuma atingir qualidade comparável por um custo bem menor.
>
> **Boa prática:** fazer essa escolha de acordo com a diversidade real dos documentos a processar (veja também [Arbitragem local vs cloud para um modelo de visão](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) para a questão de onde executar o modelo escolhido), não por padrão pela arquitetura mais recente.

## Comparativo das três abordagens

| | OCR clássico | CRNN + CTC | Transformer |
|---|---|---|---|
| Segmentação prévia em caracteres | Necessária | Nenhuma | Nenhuma |
| Robustez a texto cursivo/degradado | Baixa | Boa | Boa a muito boa |
| Volume de dados de treinamento exigido | Baixo (padrões de referência) | Moderado | Alto |
| Custo de cálculo | Muito baixo | Baixo a moderado | Moderado a alto |

Veja também [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) para a etapa que usa esse texto reconhecido (recolocá-lo em uma estrutura de página), e [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) para o detalhe dos blocos (CNN, RNN, atenção) reutilizados aqui.

## O que reter

| | |
|---|---|
| **O que reter** | O OCR clássico segmenta a linha em caracteres e então compara cada um a padrões de referência; frágil assim que os caracteres se tocam ou estão degradados. O CRNN combina CNN (extração visual) e RNN (leitura sequencial), com CTC para alinhar uma saída mais longa que o texto final sem segmentação prévia. Um Transformer de OCR substitui o RNN pela atenção e gera o texto diretamente, sem CTC. |
| **Ferramentas úteis** | Tesseract (motor histórico, OCR clássico e depois LSTM+CTC em suas versões recentes), modelos CRNN+CTC ou Transformer treináveis com [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch). |
| **Armadilhas a evitar** | Aplicar o OCR clássico a um texto cursivo ou degradado. Achar que a regra de fusão do CTC elimina repetições desejadas no texto real. Escolher um Transformer por padrão sem olhar o custo de cálculo e o volume de dados realmente disponíveis. |
| **Boas práticas** | Reservar o OCR clássico para documentos limpos e impressos. Deixar o treinamento gerenciar a distinção entre repetição desejada e repetição a fundir (CTC). Escolher a arquitetura de acordo com a diversidade real dos documentos, não sua novidade. |
