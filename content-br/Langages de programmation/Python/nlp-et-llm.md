---
order: 22
---

# Processamento de linguagem natural (NLP) e grandes modelos de linguagem (LLM)

Uma rede neural (ver capítulo dedicado) manipula números, nunca texto diretamente. O processamento de linguagem natural (NLP, *Natural Language Processing*) agrupa as técnicas que convertem texto em representações numéricas utilizáveis — o passo prévio indispensável para qualquer modelo de linguagem, incluindo os grandes modelos de linguagem (LLM) modernos.

## A tokenização: dividir o texto

Um modelo nunca processa uma frase inteira de uma só vez — o texto é primeiro dividido em unidades mais pequenas, os **tokens**:

```
"Les chats dorment" -> ["Les", "chats", "dorment"]          -> tokenisation par mot
"Les chats dorment" -> ["Les", "chat", "s", "dor", "ment"]   -> tokenisation en sous-mots (plus courant)
```

> **Nota:** a tokenização por palavra inteira coloca um problema de vocabulário: cada palavra possível (incluindo as variantes de conjugação, as palavras raras, os nomes próprios...) exigiria a sua própria entrada, o que resultaria num vocabulário potencialmente infinito. A tokenização em **subpalavras** (por exemplo, o algoritmo *Byte-Pair Encoding*) divide as palavras raras em fragmentos mais comuns, mantendo um vocabulário de tamanho fixo e gerível (normalmente algumas dezenas de milhares de entradas), ao mesmo tempo que permite representar qualquer palavra, mesmo que nunca tenha sido vista tal como está durante o treino.

## As representações: das palavras aos vetores

Cada token é, em seguida, convertido num vetor de números (um **embedding**), treinado de forma a que palavras com significados semelhantes tenham vetores próximos neste espaço:

```python
# Representação meramente ilustrativa
embedding("chat")   -> [0.2, -0.5, 0.8, ...]
embedding("chaton")  -> [0.3, -0.4, 0.7, ...]   # semelhante a «chat» -> significado semelhante
embedding("voiture")  -> [-0.9, 0.6, -0.1, ...]  # distante de «chat» -> significado diferente
```

Esta propriedade permite operações que se tornaram clássicas para ilustrar o conceito: `embedding("roi") - embedding("homme") + embedding("femme")` produz um vetor próximo de `embedding("reine")` — o sentido encontra-se codificado, pelo menos parcialmente, como uma direção geométrica neste espaço vetorial.

## A atenção dedicada ao texto

O mecanismo de atenção (ver capítulo sobre as arquiteturas Transformer) permite que cada token «observe» os outros tokens da sequência para ajustar a sua própria representação de acordo com o contexto:

```
"La banque au bord de la rivière"      vs      "La banque a augmenté ses taux"
        ^                                              ^
   "banque" influencée par "rivière"          "banque" influencée par "taux"
   -> sens "berge"                            -> sens "établissement financier"
```

A mesma palavra («banco») obtém uma representação numérica **diferente** consoante o contexto — é esta capacidade que distingue um modelo baseado na atenção de um simples dicionário fixo do tipo «palavra → vetor».

## O que é um grande modelo de linguagem (LLM)?

Um **LLM** (*Large Language Model*) é, na sua forma mais simples, um modelo Transformer (ver capítulo dedicado) treinado com enormes quantidades de texto, com um objetivo de treino notavelmente simples: **prever a palavra (ou token) seguinte**, tendo em conta tudo o que a precede.

```
"Le chat dort sur le" -> le modèle prédit une distribution de probabilité sur le token suivant
                          ("canapé" : 45%, "tapis" : 20%, "lit" : 15%, ...)
```

O que torna um LLM impressionante não é a simplicidade desse objetivo, mas sim a escala: milhares de milhões de parâmetros, treinados com base numa fração significativa do texto disponível publicamente, com potência de computação suficiente (ver capítulo sobre PyTorch/GPU) para que esta tarefa de previsão, levada a esta escala, faça emergir capacidades que não foram explicitamente programadas (responder a perguntas, resumir, traduzir, raciocinar passo a passo...) — um fenómeno designado por **«capacidades emergentes**».

## Do modelo bruto a um assistente utilizável: ajuste fino vs. prompts

Um LLM recém-treinado para «prever a próxima palavra» não responde naturalmente como um assistente conversacional — duas abordagens (frequentemente combinadas) permitem orientá-lo:

| Abordagem | Princípio |
|---|---|
| **Ajuste fino** | Continuar a treinar o modelo com dados específicos (conversas exemplares, instruções seguidas de respostas corretas...), reajustando os seus pesos |
| **Prompting** | Não altera **nenhum** peso do modelo — limita-se a formular a entrada (o *prompt*) de forma a orientar o modelo já treinado para o comportamento pretendido (dar exemplos no prompt, formular a pergunta de uma determinada forma...) |

> **Nota:** o prompting recorre apenas às capacidades já adquiridas durante o treino inicial — é por isso que uma boa formulação da pergunta («prompt engineering») pode melhorar consideravelmente um resultado, sem que sejam necessários dados de treino adicionais nem cálculos de gradiente.

Ver também os capítulos sobre as arquiteturas Transformer (o mecanismo de atenção subjacente) e sobre o PyTorch (como um modelo deste tipo é treinado na prática, numa escala muito mais modesta nos exemplos deste capítulo).
