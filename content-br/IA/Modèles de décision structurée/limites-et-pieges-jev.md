---
order: 8
---

# Os limites documentados de um modelo de decisão estruturada

O capítulo [Os modelos de decisão estruturada](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#para-que-serve-e-para-que-nao-serve) já lista, em uma tabela, os usos adequados ou não a essa família de modelos. A TypeSafe AI documenta, para seu modelo Jev na versão 1.13, nove modos de falha concretos, que ilustram todos a mesma ideia de fundo: um modelo treinado para um julgamento rápido de "sistema 1" (ver o [capítulo introdutório](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#de-onde-vem-a-ideia-sistema-1-e-sistema-2)) falha em tudo que exige um raciocínio construído em vários passos explícitos ("sistema 2").

| # | Modo de falha | O que significa concretamente |
|---|---|---|
| 1 | Leitura literal | Responde exatamente ao que a pergunta diz palavra por palavra, sem inferir uma condição implícita que um humano deduziria do contexto |
| 2 | Cálculos e números | Não conta de forma confiável (caracteres, ocorrências em uma lista longa): não é uma calculadora. Também julga mal valores numéricos próximos entre si (ex: duas cores RGB vizinhas); prefere uma descrição em palavras ("vermelho vivo") a um número bruto |
| 3 | Datas e horários | Lê uma data como texto, não como uma quantidade ordenada: comparações temporais pouco confiáveis, sobretudo com formatos mistos ou expressões relativas ("semana que vem") |
| 4 | Indireção complexa | Uma dupla negação ou um raciocínio com vários níveis de indireção faz a precisão cair |
| 5 | Estados volumosos | Um estado com detalhes irrelevantes para a pergunta feita distrai o modelo e degrada a resposta |
| 6 | Conteúdo adversarial | Instruções injetadas no conteúdo avaliado, ou um conteúdo formulado para enganar, podem influenciar a resposta (ver o [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), um risco da mesma natureza já coberto para os LLMs generativos) |
| 7 | Instruções contraditórias | Critérios e instruções que pedem coisas diferentes criam confusão em vez de um desempate coerente |
| 8 | Invariantes lógicos não garantidos | Duas formulações supostamente equivalentes em rigor (ex: a probabilidade de um Noul e 1 menos a probabilidade de sua negação) não dão necessariamente o mesmo resultado: não confiar em uma identidade lógica suposta, formular cada pergunta para que diga diretamente o que se quer saber |
| 9 | Geração de texto | O modelo não é treinado para redigir texto livre (ver o [capítulo sobre o treinamento](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd#rlcd-otimizar-para-uma-probabilidade-confiavel-nao-para-um-texto)): pedir isso a ele é ao mesmo tempo lento e pouco confiável |

## O fio condutor: senso comum rápido, não raciocínio construído

Esses nove limites não são bugs isolados mas a consequência direta daquilo para o qual esse tipo de modelo foi treinado: responder rápido a um julgamento estreito, nunca desenrolar um raciocínio explícito. Um modelo de decisão estruturada se destaca em julgamentos de senso comum imediato, e falha em tudo que exigiria vários passos de raciocínio encadeados.

> **Armadilha:** pedir ao modelo uma tarefa que coincide com um ou vários desses nove pontos (contar ocorrências, comparar datas relativas, decidir com base em uma dupla negação) esperando a mesma confiabilidade que em um julgamento simples.
>
> **Boa prática:** pré-processar em código tudo que corresponda a um cálculo exato (contagem, aritmética, comparação de datas, ver o padrão de resolução em código visto para a [extração de datas](/?c=ia&s=modeles-de-decision-structuree&p=recettes-extraction-et-structuration#extracao-de-datas-ler-e-depois-resolver-em-codigo) mais adiante nesta parte), e confiar ao modelo apenas o julgamento que permanece realmente subjetivo ou contextual uma vez isolado esse cálculo.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Um modelo de decisão estruturada como o Jev falha de forma documentada em nove tipos de tarefas (leitura literal, cálculos e números, datas relativas, indireção complexa, estados volumosos, conteúdo adversarial, instruções contraditórias, invariantes lógicos não garantidos, geração de texto), todos ligados a seu treinamento para um julgamento rápido em vez de um raciocínio construído. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta corretiva direta: a solução é arquitetural (mover o cálculo exato para o código). |
| **Armadilhas a evitar** | Confiar ao modelo um cálculo exato, uma comparação de datas relativas, ou um raciocínio com vários níveis de indireção. |
| **Boas práticas** | Isolar em código tudo que corresponda a um cálculo verificável, reservar o modelo apenas ao julgamento realmente contextual que resta uma vez extraído esse cálculo. |
