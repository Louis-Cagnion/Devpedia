---
order: 1
---

# Processamento de linguagem natural (NLP) e grandes modelos de linguagem (LLM)

Uma [rede neural](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) manipula números, nunca diretamente texto. O processamento de linguagem natural (NLP, *Natural Language Processing*) reúne as técnicas que convertem texto em representações numéricas utilizáveis, a etapa prévia indispensável para qualquer modelo de linguagem, até os grandes modelos de linguagem (LLM) modernos.

## A tokenização: dividir o texto

Um modelo nunca processa uma frase inteira de uma vez: o texto é primeiro dividido em unidades menores, os **tokens**:

```text
"Os gatos dormem" -> ["Os", "gatos", "dormem"]           -> tokenização por palavra
"Os gatos dormem" -> ["Os", "gat", "os", "dor", "mem"]    -> tokenização em subpalavras (mais comum)
```

A tokenização por palavra inteira gera um problema de vocabulário: cada palavra possível (incluindo variantes de conjugação, palavras raras, nomes próprios...) exigiria sua própria entrada, um vocabulário potencialmente infinito. A tokenização em **subpalavras** (ex. o algoritmo [*Byte-Pair Encoding*](https://en.wikipedia.org/wiki/Byte_pair_encoding)) divide as palavras raras em fragmentos mais comuns, mantendo um vocabulário de tamanho fixo e gerenciável (tipicamente algumas dezenas de milhares de entradas) e ainda conseguindo representar qualquer palavra, mesmo nunca vista assim no treinamento.

> **Cuidado:** confundir número de tokens com número de palavras. Com a tokenização em subpalavras, uma única palavra pode ser dividida em vários tokens (veja o exemplo acima): estimar o tamanho de um texto ou um custo (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) contando palavras em vez de tokens reais dá um resultado aproximado, às vezes bem distante.
>
> **Boa prática:** sempre medir o tamanho de um texto em tokens reais (via a ferramenta de tokenização do modelo usado), nunca contando palavras visualmente.

## Os embeddings: de palavras a vetores

Cada token é então convertido em um [vetor](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de números (um **embedding**), aprendido de forma que palavras com sentido próximo tenham vetores próximos nesse espaço:

```python
# Representação puramente ilustrativa
embedding("gato")    -> [0.2, -0.5, 0.8, ...]
embedding("gatinho")  -> [0.3, -0.4, 0.7, ...]   # próximo de "gato" -> sentido semelhante
embedding("carro")    -> [-0.9, 0.6, -0.1, ...]  # distante de "gato" -> sentido diferente
```

"Próximo" ou "distante" se mede exatamente como visto no capítulo sobre [vetores e produto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire): pela norma da diferença entre eles, ou pelo produto escalar depois de normalizados. Essa propriedade permite operações que se tornaram clássicas para ilustrar o conceito: `embedding("rei") - embedding("homem") + embedding("mulher")` produz um vetor próximo de `embedding("rainha")`: o sentido se encontra codificado, ao menos parcialmente, como uma direção geométrica nesse espaço vetorial.

> **Cuidado:** comparar dois embeddings produzidos por **modelos diferentes**. Cada modelo constrói seu próprio espaço vetorial durante seu treinamento: dois modelos não têm motivo algum para colocar a palavra "gato" no mesmo lugar em seus respectivos espaços. Uma distância entre dois embeddings só faz sentido entre embeddings vindos do **mesmo** modelo.
>
> **Boa prática:** sempre produzir os embeddings a comparar com um único e mesmo modelo, nunca misturando as saídas de dois modelos diferentes.

## A atenção aplicada ao texto

O mecanismo de atenção (veja [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)) permite que cada token "olhe" para os outros tokens da sequência para ajustar sua própria representação de acordo com o contexto:

```text
"O banco à margem do rio"              vs      "O banco aumentou suas taxas"
        ^                                              ^
   "banco" influenciado por "rio"             "banco" influenciado por "taxas"
   -> sentido "margem"                        -> sentido "instituição financeira"
```

A mesma palavra ("banco") obtém uma representação numérica **diferente** dependendo do seu contexto: é essa capacidade que distingue um modelo baseado em atenção de um simples dicionário fixo "palavra → vetor".

## O que é um grande modelo de linguagem (LLM)?

Um **LLM** (*Large Language Model*) é, em seu princípio mais simples, um modelo [Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) treinado em quantidades enormes de texto, com um objetivo de treinamento notavelmente simples: **prever a próxima palavra (ou token)**, dado tudo o que vem antes.

```text
"O gato dorme no" -> o modelo prevê uma distribuição de probabilidade sobre o próximo token
                      ("sofá": 45%, "tapete": 20%, "cama": 15%, ...)
```

Essa saída é exatamente uma [distribuição de probabilidade](/?c=mathematiques&p=les-probabilites-de-base) no sentido visto anteriormente: cada token possível do vocabulário recebe uma probabilidade, e o conjunto soma 1.

O que torna um LLM impressionante não é a simplicidade desse objetivo, mas a **escala**: bilhões de parâmetros, treinados em uma fração significativa do texto disponível publicamente, com poder de computação suficiente (veja [Deep learning com PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) para que essa tarefa de predição, levada a essa escala, faça emergir capacidades que não foram explicitamente programadas (responder perguntas, resumir, traduzir, raciocinar passo a passo...), um fenômeno chamado **capacidades emergentes**.

> **Cuidado:** deduzir daí que o modelo "compreende" ou "raciocina" no sentido humano do termo. O mecanismo permanece, do início ao fim, uma predição estatística do próximo token, um comportamento que *parece* compreensão, sem que exista garantia alguma de que compartilhe suas propriedades (veja os limites detalhados em [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)).
>
> **Boa prática:** avaliar um LLM pelo que ele realmente produz (saídas verificadas, testadas) em vez de uma intuição sobre o que ele "deveria" compreender por causa de seu tamanho ou da fluidez de suas respostas.

## Do modelo bruto a um assistente utilizável: fine-tuning vs prompting

Um LLM recém-treinado para "prever a próxima palavra" não responde naturalmente como um assistente conversacional; duas abordagens (frequentemente combinadas) permitem orientá-lo:

| Abordagem | Princípio |
|---|---|
| **Fine-tuning** | Continuar o treinamento do modelo com dados específicos (conversas exemplares, instruções seguidas de boas respostas...), ajustando novamente seus pesos |
| **Prompting** | Não modifica **nenhum** peso do modelo: apenas formula-se a entrada (o *prompt*) de forma a guiar o modelo já treinado para o comportamento desejado (dar exemplos no prompt, formular a pergunta de certa maneira...) |

O prompting explora unicamente as capacidades já adquiridas durante o treinamento inicial: por isso uma boa formulação de pergunta (o **prompt engineering**, veja o capítulo dedicado logo depois) pode melhorar consideravelmente um resultado, sem que nenhum dado de treinamento adicional nem nenhum cálculo de gradiente entre em jogo.

> **Cuidado:** esperar do prompting que ele ensine uma habilidade totalmente ausente do treinamento inicial do modelo: reformular uma pergunta de forma diferente apenas explora o que o modelo já adquiriu, isso não lhe ensina nada de novo.
>
> **Boa prática:** reservar o fine-tuning para os casos em que o comportamento buscado vai além do que o prompting pode explorar (um estilo muito específico, uma habilidade ausente dos dados de treinamento originais): o prompting continua mais rápido e mais barato sempre que for suficiente.

Veja também [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (o mecanismo de atenção subjacente), [Deep learning com PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch) (como esse tipo de modelo é concretamente treinado, em uma escala bem mais modesta nos exemplos deste capítulo) e [O prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) (como formular concretamente um bom prompt).

## O que reter

| | |
|---|---|
| **O que reter** | O texto é dividido em tokens, e então convertido em vetores (embeddings) cuja proximidade reflete a proximidade de sentido. Um LLM é um Transformer treinado para prever uma distribuição de probabilidade sobre o próximo token, em escala muito grande. O prompting explora as capacidades já adquiridas; o fine-tuning adiciona novas retreinando o modelo. |
| **Ferramentas úteis** | A ferramenta de tokenização do modelo usado, para medir um tamanho real em tokens em vez de palavras. |
| **Armadilhas a evitar** | Confundir número de tokens com número de palavras. Comparar embeddings vindos de modelos diferentes. Atribuir uma compreensão verdadeira a um LLM. Esperar do prompting que ele ensine uma habilidade ausente do treinamento inicial. |
| **Boas práticas** | Medir o tamanho de um texto em tokens reais. Só comparar embeddings vindos de um mesmo modelo. Avaliar um LLM por suas saídas reais em vez de uma intuição sobre o que ele "deveria" compreender. Reservar o fine-tuning para os casos em que o prompting não é suficiente. |
