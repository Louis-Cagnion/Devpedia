---
order: 6
---

# Construir com um modelo de decisão estruturada: o método em sete etapas

Os capítulos anteriores detalham cada peça ([primitivas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), [estado e fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles), [confiança](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree), [pontuação composta e roteamento](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition)). Este capítulo as reúne em um método ordenado para projetar um sistema completo.

## O princípio norteador: o código mantém o controle

A ideia central: **o código conserva o controle do fluxo**, e o modelo de decisão estruturada trata apenas decisões estreitas dentro desse fluxo. Isso difere de um [agente](/?c=ia&s=nlp-llm&p=agents) autônomo, onde é o próprio modelo que decide o encadeamento das etapas: aqui, o encadeamento continua escrito previamente em código, apenas o conteúdo de cada decisão pontual é confiado ao modelo.

## As sete etapas

```text
1. Codigo para o    2. Decompor o      3. Estruturar o     4. Decompor
   deterministico ->    estado        ->   estado         ->   as perguntas
                                                                     |
                                                                     v
7. Combinar em  <- 6. Fazer tudo em <- 5. Estruturar as    <-------+
   codigo             paralelo          perguntas
```

| Etapa | O que faz |
|---|---|
| 1. Priorizar o código para o determinístico | Manter em software clássico toda regra já confiável; confiar ao modelo apenas o julgamento que realmente precisa de contexto |
| 2. Decompor o estado de entrada | Transmitir apenas o contexto pertinente ao julgamento pedido, nunca tudo o que está disponível |
| 3. Estruturar o estado de entrada | Usar um JSON aninhado para o estado, com caminhos explícitos entre crases se o estado for aninhado (ex: `` `ticket.mensagens[0].texto` ``) |
| 4. Decompor as perguntas | Fragmentar um julgamento amplo em várias perguntas atômicas e explícitas em vez de uma única pergunta que esconda várias decisões: o conceito mais importante do método |
| 5. Estruturar as perguntas | Adicionar estrutura às instruções e critérios (em vez de uma simples string) assim que uma diretriz merecer ser decomposta, por exemplo critérios contrastados para uma pergunta Choice |
| 6. Fazer todas as perguntas em paralelo | Ver o [fan-out especulativo](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#o-padrao-do-fan-out-especulativo) |
| 7. Combinar as respostas em código | Por meio de uma fórmula ponderada (ver a [pontuação composta](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition#pontuacao-composta-combinar-dimensoes-independentes)) ou por meio de um roteamento segundo a confiança (ver a [confiança calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-limiares-tres-comportamentos)) |

### Etapa 1: o que fica no código, o que vai para o modelo

| Fica em código (determinístico) | Vai para o modelo (julgamento contextual) |
|---|---|
| Uma regra de negócio fixa ("se o valor ultrapassar X, bloquear") | Estimar se um texto expressa frustração |
| Um cálculo, uma busca em banco de dados | Classificar uma intenção a partir de uma mensagem em linguagem natural |
| O encadeamento das etapas do programa | Uma decisão que depende de nuances de linguagem |

> **Armadilha:** confiar ao modelo uma regra que poderia ser expressa como uma condição simples em código (ex: comparar dois números). Um modelo de decisão estruturada não é nem mais confiável nem mais rápido que uma comparação direta para esse tipo de caso, e custa desnecessariamente uma chamada de rede.
>
> **Boa prática:** reservar o modelo apenas aos julgamentos que realmente exigem compreender o conteúdo (linguagem natural, nuance contextual), nunca a uma regra já expressável diretamente em código.

### Etapas 2 e 3: decompor o estado, estruturá-lo

Transmitir apenas o contexto pertinente ao julgamento pedido (etapa 2), e depois estruturar esse estado em JSON aninhado com um caminho explícito (`` `suporte.tickets[0].mensagem` ``) assim que isso remove uma ambiguidade sobre o que exatamente uma pergunta avalia (etapa 3).

### Etapa 4: decompor as perguntas, o conceito mais importante

"Fazer um único julgamento rápido por pergunta" continua sendo a regra central de todo o método: uma tarefa multifatorial é decomposta em várias perguntas atômicas, combinadas depois em código (etapa 7), nunca em uma única pergunta que decidiria tudo de uma vez. Uma pergunta ampla ("esta mensagem é spam?") esconde vários julgamentos distintos; torná-los explícitos (pede uma credencial? promete uma recompensa inesperada? cria uma urgência artificial?) permite depois inspecioná-los e ponderá-los separadamente em código.

## As propriedades esperadas de um modelo de decisão estruturada

Uma vez aplicado o método, um sistema construído assim herda propriedades próprias dessa família de modelos:

| Propriedade | O que significa |
|---|---|
| Tipado | A saída sempre respeita o esquema fornecido, nunca um formato inválido a corrigir depois |
| Paralelo | Cada pergunta é avaliada independentemente, sem contexto oculto entre elas |
| Comparável | As respostas são ordenáveis e permitem condições, limiares e comparações diretamente em código |
| Rápido | Da ordem de 100 ms por requisição, muito abaixo de um LLM generativo comparável |
| Calibrado | As probabilidades refletem uma frequência real em vez de uma confiança excessiva, graças a um treinamento dedicado (o [capítulo seguinte](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd) detalha esse método de treinamento) |
| Estável | Respostas coerentes de uma execução para outra sobre um mesmo estado |

## Exemplo integrado: a triagem de tickets

O fluxo de trabalho que atravessa todos os capítulos desta parte: um ticket de suporte (estado estruturado e caminhos explícitos, etapas 2 e 3) dá origem a sete perguntas independentes e atômicas do tipo Choice/Score/Noul (etapa 4), feitas em uma única requisição (etapa 6). O código combina depois esses sinais (etapa 7, ex: um score composto de spam) e roteia a decisão final segundo a categoria e a confiança obtidas (etapa 7 também), sem nunca confiar ao modelo a decisão de encadeamento em si (etapa 1).

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Construir com um modelo de decisão estruturada segue sete etapas ordenadas: manter o determinístico em código, decompor e depois estruturar o estado, decompor e depois estruturar as perguntas, agrupá-las em paralelo, combinar as respostas em código. O resultado é tipado, paralelo, comparável, rápido, calibrado e estável. |
| **Ferramentas utilizáveis** | Um estado JSON com caminhos explícitos; perguntas Choice/Score/Noul atômicas e estruturadas; código de combinação e roteamento. |
| **Armadilhas a evitar** | Confiar ao modelo uma regra já expressável como uma condição simples em código. Fazer uma pergunta ampla que esconde vários julgamentos distintos. |
| **Boas práticas** | Reservar o modelo aos julgamentos que exigem compreender a linguagem ou o contexto; manter toda regra determinística em código clássico; decompor cada julgamento amplo em perguntas atômicas. |
