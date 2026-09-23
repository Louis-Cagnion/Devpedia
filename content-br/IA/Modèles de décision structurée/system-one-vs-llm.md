---
order: 1
---

# Os modelos de decisão estruturada: uma alternativa aos LLMs generativos

Um [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) sempre responde com texto: mesmo quando se pergunta "urgente ou não urgente?", ele produz uma sequência de palavras que depois precisa ser relida, dividida, validada (tipicamente por um [esquema JSON](/?c=ia&s=nlp-llm&p=agents) que descreve a forma esperada). Nada garante que ele respeite essa forma de primeira, nem que não invente uma resposta plausível mas falsa, uma [alucinação](/?c=ia&s=nlp-llm&p=llm-en-production). Uma família de modelos mais recente, os **modelos de decisão estruturada**, escolhe outro caminho: renunciar a gerar texto livre para responder apenas a perguntas fechadas, com uma saída que sempre tem a forma esperada e uma probabilidade numérica de erro.

## De onde vem a ideia: sistema 1 e sistema 2

O nome vem do livro do psicólogo Daniel Kahneman, [*Rápido e Devagar*](https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/), que distingue duas formas de pensar no ser humano:

| | Sistema 1 | Sistema 2 |
|---|---|---|
| Velocidade | Rápido, automático | Lento, exige esforço |
| Exemplo | Reconhecer um rosto, avaliar uma emoção | Resolver 17 × 24, planejar um trajeto |
| O que produz | Uma resposta imediata, pouco raciocínio explícito | Um raciocínio construído passo a passo |

Um LLM generativo, que desenrola um raciocínio token a token (ver [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) e as cadeias de raciocínio), se aproxima do sistema 2. Os modelos chamados **"System One"** visam o inverso: responder rápido, sem desenrolar raciocínio textual, sobre perguntas deliberadamente estreitas.

## O que um modelo de decisão estruturada responde

Em vez de gerar uma frase, um modelo desse tipo responde a uma pergunta fechada, feita contra um **estado** (o conjunto de dados úteis para a decisão, ex: o conteúdo de um ticket de suporte), e sempre retorna:
- uma resposta em um formato fixado previamente (nunca texto livre);
- uma probabilidade (ou uma distribuição de probabilidades) associada;
- uma pontuação de confiança, distinta dessa probabilidade.

## Comparação com um LLM generativo clássico

| | LLM generativo clássico | Modelo de decisão estruturada |
|---|---|---|
| Saída | Texto livre, a ser parseado depois | Valor tipado fixado previamente (opção, pontuação, sim/não) |
| Entrada | Um prompt textual | Um estado estruturado + uma pergunta fechada |
| Amostragem | Token a token, sequencial | Todas as respostas em uma passagem (paralelo) |
| Pode produzir formato inválido | Sim, exige validação (ver [JSON Schema](/?c=ia&s=nlp-llm&p=agents)) | Não, a saída é restrita por construção |
| Probabilidade reportada | Ausente ou pouco confiável | Calibrada: treinada para refletir a realidade estatística |
| Uso previsto | Redação, raciocínio aberto, conversa | Classificação, pontuação, roteamento, verificação |

## Um exemplo concreto: Jev

**Jev** é um modelo desse tipo publicado pelo laboratório [TypeSafe AI](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (nomeado em referência ao economista William Stanley Jevons), e serve de ilustração no restante desta parte. Ele responde a três formas de pergunta fechada, detalhadas no [capítulo seguinte](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), e reivindica nesse escopo restrito uma latência de 70 a 500 ms (contra vários segundos para um LLM de fronteira comparável) e uma taxa de erro de formato nula. Esses números vêm do fornecedor e não foram verificados de forma independente; o que importa para este curso é o princípio que eles ilustram, não o benchmark em si.

## Para que serve, e para que não serve

| Adequado | Não adequado |
|---|---|
| Classificar uma mensagem em uma categoria fixa | Redigir um texto, uma resposta aberta |
| Pontuar um conteúdo em uma escala conhecida previamente | Explicar um raciocínio em linguagem natural |
| Rotear uma requisição para o tratamento certo | Responder a uma pergunta cujas respostas possíveis não são conhecidas previamente |
| Verificar ou filtrar a saída de outro modelo (barreira de segurança) | Manter uma conversa ou fazer geração criativa |
| Extrair um valor entre candidatos já identificados | Gerar código, um plano, um documento |

> **Armadilha:** acreditar que um modelo de decisão estruturada substitui um LLM. Ele só faz uma coisa: responder a uma pergunta fechada contra um estado dado. Um sistema real quase sempre combina os dois, o LLM para raciocinar e gerar, o modelo de decisão para os pontos de passagem estreitos (classificar, pontuar, verificar) onde uma saída garantida e rápida importa mais que uma resposta aberta.
>
> **Boa prática:** identificar, em um pipeline existente baseado em LLM, as etapas que já apenas escolhem entre opções conhecidas previamente (roteamento, pontuação, validação): são os candidatos naturais para um modelo de decisão estruturada, sem tocar nas etapas que realmente geram texto.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Um modelo de decisão estruturada (categoria "System One", em referência ao sistema 1 de Kahneman) responde a perguntas fechadas contra um estado dado, com uma saída sempre no formato certo e uma probabilidade calibrada, ao contrário de um LLM generativo que produz texto livre a validar depois. Ele complementa um LLM, não o substitui. |
| **Ferramentas utilizáveis** | Jev (TypeSafe AI) como exemplo público desse tipo de modelo. |
| **Armadilhas a evitar** | Confundir "modelo de decisão estruturada" com uma substituição completa de um LLM; pedir a ele uma tarefa aberta (redação, raciocínio livre) para a qual não foi projetado. |
| **Boas práticas** | Reservar esse tipo de modelo para as etapas de um pipeline que já apenas escolhem entre opções conhecidas previamente, combinando-o com um LLM para o resto. |
