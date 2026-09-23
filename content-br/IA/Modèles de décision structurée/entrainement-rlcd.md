---
order: 7
---

# RLHF, RLVR, RLCD: treinar um modelo para algo além de escrever bem

A [metodologia](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) e as propriedades calibradas vistas até aqui não surgem de um treinamento clássico: vêm de uma escolha deliberada, feita *depois* do treinamento base do modelo, sobre o que se busca otimizar. Este capítulo apresenta três abordagens dessa fase de treinamento, chamada **pós-treinamento** (ela ocorre depois do treinamento principal detalhado em [Treinamento e gradiente descendente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).

## O princípio comum: ajustar um modelo a partir de um sinal de retorno

As três abordagens abaixo se apoiam no **aprendizado por reforço** (*reinforcement learning*): em vez de aprender a reproduzir um exemplo exato (como o treinamento supervisionado clássico), o modelo produz uma saída, recebe um **sinal de retorno** (uma recompensa) que julga essa saída, e ajusta seus parâmetros para obter recompensas melhores na próxima vez. É o mesmo princípio usado para adestrar um animal com petiscos: nenhuma instrução explícita do gesto a fazer, apenas um sinal de "bom" ou "ruim" depois do fato, repetido até que o comportamento buscado emerja. O que distingue RLHF, RLVR e RLCD é **de onde vem esse sinal de recompensa**.

| Abordagem | De onde vem a recompensa | Otimiza para |
|---|---|---|
| **RLHF** (*Reinforcement Learning from Human Feedback*) | Humanos que comparam respostas e dizem qual preferem | Respostas apreciadas por humanos (chatbots, assistentes conversacionais) |
| **RLVR** (*Reinforcement Learning with Verifiable Rewards*) | Um verificador automático (ex: um teste unitário que passa, um cálculo com resultado conhecido) | Raciocínios corretos em tarefas com resposta verificável (matemática, código) |
| **RLCD** (*Reinforcement Learning for Calibrated Decisions*) | A diferença entre a probabilidade anunciada e a frequência real do resultado correto | Probabilidades confiáveis em vez de texto gerado |

## RLHF: otimizar para a preferência humana

O **RLHF** é a abordagem mais difundida para os [LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm) conversacionais atuais: avaliadores humanos comparam pares de respostas a um mesmo prompt e indicam qual preferem, e esse sinal serve depois para treinar o modelo a produzir esse tipo de resposta com mais frequência.

## RLVR: otimizar para um resultado verificável

O **RLVR** substitui o julgamento humano por uma verificação automática e objetiva: um teste unitário passa ou falha, um resultado de cálculo está certo ou errado. Essa abordagem produz modelos de raciocínio eficazes em tarefas com resposta verificável (matemática, geração de código testável), ao custo de uma inferência mais lenta e mais cara (o modelo "pensa" mais tempo antes de responder).

## RLCD: otimizar para uma probabilidade confiável, não para um texto

O **RLCD**, a abordagem usada para treinar os [modelos de decisão estruturada](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm), não busca nem agradar um humano nem produzir um raciocínio textual: a recompensa mede se a **probabilidade anunciada pelo modelo corresponde à frequência real** do resultado correto em muitos casos semelhantes (esta é a própria definição da [confiança calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree) vista no capítulo anterior). Um modelo treinado por RLCD nunca escreve uma resposta aberta: ele nem sequer tem essa capacidade, já que nada em seu treinamento o empurra nessa direção.

## Um risco próprio do RLHF: o estreitamento da distribuição

A documentação do fornecedor ilustra um risco do RLHF por meio de uma analogia tomada de outra família de modelos generativos (as redes adversárias generativas, ou GANs, detalhadas no [artigo de pesquisa original](https://arxiv.org/abs/1406.2661) se o tema merecer ser aprofundado): o **mode collapse**, quando um gerador passa a produzir repetidamente a mesma saída em vez de cobrir toda a diversidade possível. Um treinamento RLHF excessivo pode produzir um efeito semelhante: ao otimizar fortemente para o que um humano prefere, o modelo estreita o leque de suas respostas possíveis em torno do que "agrada", em detrimento da diversidade e, potencialmente, da confiabilidade em casos que se afastam do que foi julgado preferível.

> **Armadilha:** supor que um modelo otimizado por RLHF (e portanto julgado "bom" por humanos em conversa) é automaticamente confiável para decisões automatizadas máquina a máquina. A documentação do fornecedor resume a distinção: *"habilidade interpessoal e confiabilidade de máquina são alvos de otimização diferentes"*. Um modelo treinado para agradar não é treinado para ser exato nem previsível.
>
> **Boa prática:** fazer o método de treinamento corresponder ao uso real pretendido: RLHF para uma interface conversacional onde a qualidade percebida por um humano importa, RLVR para um raciocínio verificável, RLCD para decisões estruturadas consumidas diretamente por código, sem passar de novo por um julgamento humano a cada vez.

## Interface de máquina ou interface conversacional

Essa distinção reflete uma escolha de design mais ampla: um LLM clássico visa uma **interface conversacional** (fluidez narrativa, tom adaptado a um humano) enquanto um modelo de decisão estruturada visa uma **interface de máquina** (previsibilidade, saída diretamente utilizável por código, sendo a maioria das interações na realidade máquina a máquina em vez de um diálogo com um humano).

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | RLHF, RLVR e RLCD são três formas de treinar um modelo depois de seu treinamento base, que diferem na fonte do sinal de recompensa: a preferência humana (RLHF), um verificador automático (RLVR), ou a diferença entre probabilidade anunciada e frequência real (RLCD). Um RLHF excessivo pode estreitar a diversidade das respostas (mode collapse), e otimizar para a preferência humana não otimiza para a confiabilidade de máquina. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta a manipular diretamente; essa distinção guia a escolha de um modelo segundo o uso pretendido (conversa, raciocínio verificável, decisão automatizada). |
| **Armadilhas a evitar** | Supor que um modelo RLHF, julgado "bom" por humanos, é confiável para decisões automatizadas máquina a máquina. |
| **Boas práticas** | Escolher o método de treinamento (e portanto o modelo) segundo a interface realmente visada: conversacional (RLHF), raciocínio verificável (RLVR), ou decisão estruturada consumida por código (RLCD). |
