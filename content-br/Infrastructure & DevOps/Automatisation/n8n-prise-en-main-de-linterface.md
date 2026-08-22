---
order: 2
---

# n8n: primeiros passos com a interface

O capítulo sobre a [automação por fluxo de trabalho visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) estabelece o vocabulário comum a essas ferramentas (gatilho, ação, conector). Este capítulo o aplica concretamente à interface do [n8n](https://n8n.io), para saber onde encontrar cada coisa antes de construir um primeiro fluxo de trabalho.

## O canvas: o espaço de trabalho visual

O **canvas** é a área principal do editor n8n: um espaço em branco onde cada **nó** (*node*) aparece como um bloco retangular, posicionado livremente com o mouse. Um nó sempre representa um dos três blocos já vistos (gatilho, ação, ou um nó especial de lógica); seu ícone e seu nome indicam imediatamente o serviço ou a função que ele representa.

```text
Canvas do n8n (visão simplificada):

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Gatilho   │─────▶│   Ação 1     │─────▶│   Ação 2     │
│  (Webhook)   │      │  (HTTP Req.) │      │   (Slack)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

Adicionar um nó é feito pelo botão **+** (no canvas ou na sequência de um nó existente), que abre um painel de busca listando todos os conectores disponíveis (mais de 400 serviços integrados, além de um nó HTTP genérico para qualquer serviço sem conector dedicado).

## As conexões: fazer os dados circularem

Uma **conexão** é o traço que liga a saída de um nó à entrada do seguinte: ela representa ao mesmo tempo a ordem de execução (o nó seguinte roda depois do que o precede) e a passagem de dados entre eles (cada nó recebe como entrada o que o anterior produziu como saída).

> **Cilada:** achar que uma conexão transporta apenas um sinal de "execute agora", sem dado nenhum. Na realidade, cada nó recebe um array de itens de dados (frequentemente em formato JSON) produzido pelo nó anterior, e pode usá-lo em sua própria configuração (ex. reutilizar o endereço de email extraído pelo nó anterior).
>
> **Boa prática:** antes de configurar um nó, verificar no painel de execução (ver mais abaixo) o formato exato dos dados recebidos do nó anterior, em vez de adivinhá-lo.

Um nó pode ter várias conexões de saída: é assim que um **nó condicional** (*IF*, *Switch*) faz o fluxo de trabalho bifurcar de acordo com um critério, cada ramo levando a um conjunto de ações diferente. Esse tipo de nó é detalhado no próximo capítulo sobre o catálogo de funcionalidades.

## Configurar um nó

Clicar duas vezes em um nó abre seu painel de configuração, específico do serviço que representa: credenciais de conexão (frequentemente gerenciadas à parte, como **credentials** reutilizáveis entre fluxos de trabalho), campos a preencher (destinatário de um email, canal do Slack, URL de uma requisição HTTP), e o mapeamento dos dados recebidos do nó anterior para esses campos.

```text
Configuração de um nó "Enviar email":

  Destinatário: {{ $json.email }}      <- valor tirado dos dados
  Assunto     : "Confirmação"             recebidos do nó
  Corpo       : "Olá {{ $json.nome }}"    anterior
```

A sintaxe `{{ ... }}` insere uma **expressão**: em vez de um valor fixo, o campo busca um dado dinâmico (aqui, no JSON recebido como entrada do nó).

## O painel de execução: ver o que realmente aconteceu

Cada execução de um fluxo de trabalho (manual ou realmente disparada) deixa um rastro consultável: o **painel de execução** lista, nó por nó, os dados recebidos como entrada e produzidos como saída, com um código de cor (verde para sucesso, vermelho para erro) que permite localizar imediatamente onde um fluxo de trabalho falhou.

| Informação visível | Utilidade |
|---|---|
| Dados de entrada/saída de cada nó | Verificar se os dados esperados são realmente os recebidos |
| Status (sucesso/erro) por nó | Localizar com precisão onde um fluxo de trabalho parou |
| Histórico de execuções passadas | Comparar uma execução com falha a uma execução bem-sucedida anterior |

## Testar manualmente antes de ativar

Um fluxo de trabalho recém-criado permanece **inativo** por padrão: seu gatilho real (um webhook, um agendamento) só entra em ação depois que o fluxo de trabalho é explicitamente ativado. O botão **"Test workflow"** executa o fluxo de trabalho imediatamente, uma única vez, sem esperar pelo gatilho real, inserindo dados de exemplo se necessário.

> **Cilada:** ativar um fluxo de trabalho logo após construí-lo, sem tê-lo testado manualmente antes. Um webhook mal configurado ou uma ação que realmente envia uma mensagem pode então rodar em condições reais antes de ser verificada, potencialmente de forma repetida se o gatilho ocorrer com frequência.
>
> **Boa prática:** sempre rodar "Test workflow" pelo menos uma vez, verificar cada nó no painel de execução, antes de ligar o interruptor de ativação.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O canvas exibe os nós de um fluxo de trabalho ligados por conexões, que transportam tanto a ordem de execução quanto os dados. Configurar um nó consiste em preencher seus campos, às vezes com expressões dinâmicas (`{{ }}`) tiradas dos dados recebidos. O painel de execução mostra o detalhe de entrada/saída de cada nó, sucesso ou falha. |
| **Ferramentas utilizáveis** | O botão "+" para adicionar um nó; o painel de execução para inspecionar os dados; o botão "Test workflow" para uma execução manual. |
| **Ciladas a evitar** | Achar que uma conexão não transporta nenhum dado. Ativar um fluxo de trabalho sem tê-lo testado manualmente antes. |
| **Boas práticas** | Verificar o formato dos dados recebidos antes de configurar um nó que os usa. Sempre testar manualmente antes de ativar. |
