---
order: 7
---

# A pesquisa com usuários

Os capítulos anteriores (hierarquia visual, cor, tipografia...) supõem que já se sabe o que o usuário precisa realizar em uma tela. A **pesquisa com usuários** é a etapa que vem antes: entender quem realmente usa o produto, o que está tentando fazer, e onde encontra dificuldades, antes de desenhar qualquer coisa. Sem essa etapa, um designer projeta para um usuário imaginado, não para quem realmente vai usar o produto.

> **Por que isso importa:** uma tela perfeitamente hierarquizada, bem contrastada e acessível continua sendo um fracasso se resolve um problema que ninguém tem. A pesquisa com usuários reduz esse risco confrontando as ideias de projeto com pessoas reais, o mais cedo possível: corrigir uma direção errada custa bem menos antes de codificar a interface do que depois.

## As personas: representar um usuário típico

Uma **persona** é um perfil fictício, mas construído a partir de dados reais (entrevistas, observações, estatísticas de uso), que representa um grupo de usuários compartilhando os mesmos objetivos e frustrações diante do produto:

| Campo | Exemplo |
|---|---|
| Nome e papel | Sofia, 34 anos, responsável contábil em uma PME |
| Objetivo principal | Fechar as contas do mês sem erro, o mais rápido possível |
| Frustração atual | Precisa redigitar os mesmos dados em duas ferramentas diferentes |
| Nível técnico | À vontade com planilhas, pouco à vontade com uma ferramenta que considera "técnica demais" |

Um produto raramente visa uma única persona: 2 a 4 personas distintas geralmente cobrem o essencial dos usos reais, cada uma orientando decisões de projeto diferentes (uma persona pouco à vontade tecnicamente empurra para uma interface mais guiada, por exemplo).

> **Armadilha:** construir uma persona a partir de suposições ("acho que nossos usuários são mais jovens e à vontade com tecnologia") em vez de dados reais. Uma persona imaginária reforça os vieses da equipe de projeto em vez de corrigi-los: dá a ilusão de uma base sólida sem realmente ser uma.
>
> **Boa prática:** construir cada persona a partir de entrevistas ou dados de uso reais (veja a seção seguinte), e atualizá-la se novos dados a contradisserem, em vez de fixá-la de uma vez por todas.

## As entrevistas com usuários: coletar a informação na fonte

Uma **entrevista com usuário** consiste em questionar uma pessoa representativa para entender seu contexto, seus objetivos e suas dificuldades, não para pedir que ela avalie uma ideia já projetada (isso é papel do [teste de usabilidade](#testar-a-usabilidade-observar-em-vez-de-perguntar), mais abaixo). A formulação das perguntas influencia fortemente a qualidade das respostas obtidas:

| | Pergunta direcionada | Pergunta aberta |
|---|---|---|
| Exemplo | "Você não gosta de precisar redigitar seus dados, não é?" | "Me conte a última vez que você fechou as contas do mês." |
| Efeito | Sugere a resposta esperada; a pessoa tende a confirmar por educação (*viés de desejabilidade social*) | Deixa a pessoa descrever sua própria experiência, sem direção imposta |

> **Armadilha:** fazer perguntas que já sugerem a resposta desejada, ou que tratam de uma opinião futura hipotética ("você usaria uma funcionalidade que fizesse X?"). As pessoas entrevistadas superestimam sistematicamente seu uso futuro de uma funcionalidade imaginada: o que elas realmente fazem hoje é um indicador bem mais confiável do que o que pensam que fariam.
>
> **Boa prática:** fazer perguntas abertas sobre comportamentos passados e concretos ("me conte a última vez que...") em vez de sobre opiniões ou intenções futuras.

## O mapa de empatia: sintetizar várias entrevistas

Um **mapa de empatia** (*empathy map*) organiza o que se aprendeu sobre um usuário ou uma persona em quatro quadrantes, para evidenciar as tensões entre o que ele diz e o que realmente sente:

```text
+---------------------------+---------------------------+
| O QUE ELE DIZ              | O QUE ELE PENSA           |
| "A ferramenta atual        | Teme perder tempo se       |
|  funciona bem, a gente     | mudar de ferramenta        |
|  se vira"                  |                            |
+---------------------------+---------------------------+
| O QUE ELE FAZ               | O QUE ELE SENTE            |
| Redigita os mesmos          | Frustracao silenciosa,     |
| dados em 2 ferramentas      | nunca expressa em voz alta |
+---------------------------+---------------------------+
```

A diferença entre o quadrante "diz" e os outros três é frequentemente a descoberta mais útil: aqui, a pessoa minimiza oralmente um problema que vive e expressa concretamente (veja também a [armadilha das perguntas direcionadas](#as-entrevistas-com-usuarios-coletar-a-informacao-na-fonte) acima, que produz exatamente esse tipo de descompasso se não se cruzar o que é dito com a observação).

## Testar a usabilidade: observar em vez de perguntar

Um **teste de usabilidade** consiste em observar uma pessoa real tentando realizar uma tarefa precisa no produto (existente ou um protótipo, veja o futuro capítulo sobre prototipagem), sem ajudá-la nem explicar como fazer: suas hesitações e erros revelam os pontos de atrito reais, frequentemente diferentes dos que a equipe de projeto havia previsto.

```text
Tarefa dada    : "Encontre como exportar este relatorio em PDF."
Observacao     : a pessoa procura no menu "Arquivo" por 45 segundos
                 antes de notar o icone de exportacao, isolado
                 na barra lateral sem texto nem tooltip.
Conclusao      : a exportacao existe e funciona, mas sua posicao nao
                 e onde o usuario a procura naturalmente.
```

Esse tipo de constatação se conecta diretamente ao [reconhecimento em vez de lembrança](/?c=ui-ux&p=heuristiques-de-nielsen), uma das dez heurísticas de Nielsen: um teste de usabilidade é um dos meios concretos de verificar se uma interface a respeita de fato, em vez de supor isso.

> **Armadilha:** intervir durante o teste para explicar onde clicar, ou reformular a tarefa se a pessoa parecer travada. Isso mascara exatamente o problema que o teste deveria revelar: uma pessoa testando sozinha o produto em condições reais não terá ninguém para soprar a resposta.
>
> **Boa prática:** permanecer em silêncio enquanto a pessoa tenta, anotar precisamente onde e por que ela hesita, e só fazer perguntas depois que a tarefa terminar (com sucesso ou não).

## Qual método, em qual momento

| Método | Responde à pergunta | Momento do projeto |
|---|---|---|
| Entrevista com usuário | Quem são os usuários, quais seus objetivos e frustrações? | No início, antes de projetar qualquer coisa |
| Persona | Como resumir e compartilhar esses perfis com toda a equipe? | Depois de uma série de entrevistas, para sintetizar |
| Mapa de empatia | Quais tensões entre o discurso e a vivência real de um usuário? | Logo após as entrevistas, durante a síntese |
| Teste de usabilidade | Essa interface (ou protótipo) realmente funciona para uma tarefa dada? | Assim que existe algo para testar, mesmo uma maquete |

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | A pesquisa com usuários precede o projeto: entrevistas para entender os usuários reais, personas para sintetizar perfis típicos, mapa de empatia para evidenciar as tensões dito/pensado/feito/sentido, teste de usabilidade para verificar que uma interface realmente funciona para uma tarefa dada. |
| **Ferramentas utilizáveis** | Um roteiro de entrevista com perguntas abertas; um modelo de persona (nome, objetivo, frustração, nível técnico); um modelo de mapa de empatia de 4 quadrantes; uma tarefa precisa a observar para um teste de usabilidade. |
| **Armadilhas a evitar** | Construir uma persona a partir de suposições em vez de dados reais. Fazer perguntas direcionadas ou sobre intenções futuras hipotéticas. Intervir durante um teste de usabilidade em vez de observar em silêncio. |
| **Boas práticas** | Construir as personas a partir de entrevistas ou dados de uso reais. Fazer perguntas abertas sobre comportamentos passados e concretos. Observar um teste de usabilidade em silêncio, questionar somente depois. |
