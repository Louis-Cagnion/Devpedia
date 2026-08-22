---
order: 2
---

# O backlog e as user stories

Uma vez [escolhida uma metodologia](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban), resta uma pergunta prática: como descrever o trabalho a fazer para que toda a equipe o entenda da mesma forma e ele possa ser priorizado ao longo do tempo? O **backlog** e as **user stories** respondem a essa pergunta, no coração de metodologias ágeis como o Scrum.

## O backlog: uma lista priorizada, nunca fixa

O **backlog** é a lista de todo o trabalho restante em um produto: novas funcionalidades, correções de bugs, melhorias técnicas. Ao contrário de um documento de requisitos clássico, ele nunca é fixo: itens são adicionados, removidos ou reprorizados continuamente, à medida que o produto e suas necessidades evoluem.

| Característica | O que isso implica |
|---|---|
| **Priorizado** | Os itens mais importantes ou urgentes ficam no topo, os menos claros ou de menor prioridade embaixo |
| **Vivo** | Revisado continuamente (frequentemente em um ritual dedicado, o *backlog refinement*), nunca escrito de uma vez por todas |
| **De granularidade variável** | Os itens próximos ao topo estão detalhados e prontos para serem desenvolvidos; os de baixo permanecem deliberadamente vagos até estarem prestes a ser assumidos |

> **Cilada:** detalhar profundamente cada item do backlog assim que criado, incluindo os que só serão tratados daqui a vários meses. Uma necessidade detalhada cedo demais tem boas chances de ter mudado antes de ser desenvolvida, tornando esse trabalho de redação inútil.
>
> **Boa prática:** detalhar minuciosamente um item do backlog apenas pouco antes de ele ser assumido, mantendo os itens distantes deliberadamente aproximados.

## A user story: descrever uma necessidade do ponto de vista do usuário

Uma **user story** é uma forma curta e estruturada de descrever um item do backlog, centrada na necessidade da pessoa que usará a funcionalidade em vez dos detalhes técnicos de sua implementação. O formato mais comum:

```text
Como [papel],
eu quero [ação ou necessidade],
para que [benefício buscado].

Exemplo:
Como cliente de uma loja online,
eu quero receber um email de confirmação após meu pedido,
para que eu saiba que ele foi registrado.
```

Esse formato obriga a sempre ligar uma funcionalidade a um benefício concreto para alguém: uma story que não pode ser expressa assim geralmente esconde uma solução técnica disfarçada de necessidade ("como desenvolvedor, eu quero migrar o banco de dados"), em vez de uma necessidade real do usuário.

> **Cilada:** escrever user stories do ponto de vista da equipe técnica em vez da pessoa que realmente usará o produto. Uma tarefa puramente técnica (migração, refatoração) não é uma user story: ela é tratada de outra forma (uma tarefa técnica no backlog, sem forçar o formato "como").
>
> **Boa prática:** se uma story não pode ser escrita naturalmente do ponto de vista de um usuário real com um benefício claro, provavelmente não é uma user story.

## Os critérios de aceitação: definir "concluído"

Uma user story sozinha não diz quando ela está realmente concluída. Os **critérios de aceitação** listam as condições precisas e verificáveis que devem ser atendidas para considerar a story concluída:

```text
User story: "Como cliente, eu quero receber um email de
confirmação após meu pedido, para que eu saiba que ele foi
registrado."

Critérios de aceitação:
- O email é enviado em até 5 minutos após o pedido
- O email contém o número do pedido e o valor total
- Se o envio falhar, o pedido não fica bloqueado por causa disso
```

Esses critérios também servem de base para os [testes](/?c=tests&p=vocabulaire-qa-istqb) que verificarão se a funcionalidade funciona como esperado depois de desenvolvida.

## INVEST: seis qualidades de uma boa user story

**INVEST** é um acrônimo mnemônico que resume as qualidades esperadas de uma user story bem formulada:

| Letra | Qualidade | Significado |
|---|---|---|
| **I** | Independente (*Independent*) | Pode ser desenvolvida sem esperar que outra story termine primeiro |
| **N** | Negociável (*Negotiable*) | Descreve uma necessidade, não uma solução imposta: os detalhes de implementação ficam em aberto para discussão |
| **V** | Valiosa (*Valuable*) | Traz um valor claramente identificável para o usuário ou o negócio |
| **E** | Estimável (*Estimable*) | Clara o suficiente para que a equipe consiga estimar o esforço que exige |
| **S** | Pequena (*Small*) | Pequena o suficiente para ser desenvolvida em poucos dias, não várias semanas |
| **T** | Testável (*Testable*) | Seus critérios de aceitação permitem verificar objetivamente se ela está concluída |

Uma story grande ou vaga demais para atender a esses critérios geralmente é dividida em várias stories menores, cada uma trazendo seu próprio valor independente.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O backlog é uma lista priorizada e viva de todo o trabalho restante. Uma user story descreve uma necessidade do ponto de vista do usuário ("como... eu quero... para que..."), completada por critérios de aceitação verificáveis. INVEST resume as qualidades de uma boa story. |
| **Ferramentas utilizáveis** | O formato "como / eu quero / para que" para redigir uma story. A checklist INVEST para avaliar sua qualidade. |
| **Ciladas a evitar** | Detalhar profundamente itens distantes do backlog. Escrever stories do ponto de vista da equipe técnica em vez do usuário. |
| **Boas práticas** | Detalhar minuciosamente um item apenas pouco antes de ele ser assumido. Verificar se uma story é escrita naturalmente do ponto de vista de um usuário real. |
