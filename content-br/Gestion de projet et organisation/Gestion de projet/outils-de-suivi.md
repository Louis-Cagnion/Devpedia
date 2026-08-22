---
order: 4
---

# As ferramentas de acompanhamento

Um [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) priorizado e [estimado](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) precisa de um lugar para existir concretamente, visível para toda a equipe e atualizado conforme o trabalho avança. Esse é o papel de uma ferramenta de acompanhamento, seja ela digital ou inteiramente física.

## O ticket: a unidade básica

Um **ticket** representa uma unidade de trabalho identificável: uma user story, um bug, uma tarefa técnica. Cada ticket carrega um título, uma descrição, um status (a fazer / em andamento / concluído, ou mais status conforme o fluxo da equipe), e geralmente uma pessoa responsável.

```text
Ticket #142
Título       : Adicionar um email de confirmação após o pedido
Status       : Em andamento
Responsável  : Alice
Pontos       : 5
```

Esse vocabulário ("ticket") vem originalmente das ferramentas de suporte técnico (um problema reportado = um ticket), adotado depois pelas ferramentas de gestão de projetos para designar qualquer unidade de trabalho acompanhada individualmente.

## O epic: agrupar tickets relacionados

Um **epic** agrupa vários tickets que contribuem juntos para um objetivo comum grande demais para ser um único ticket: por exemplo, "Reformulação do fluxo de pagamento" pode agrupar os tickets "Adicionar pagamento por transferência", "Simplificar o formulário de endereço", "Adicionar um resumo antes da confirmação".

```text
Epic: Reformulação do fluxo de pagamento
  ├── Ticket #140: Adicionar pagamento por transferência
  ├── Ticket #141: Simplificar o formulário de endereço
  └── Ticket #142: Adicionar um resumo antes da confirmação
```

Um epic dá uma visão de conjunto ("como está esse objetivo mais amplo?") sem precisar abrir cada ticket individualmente, e ajuda a decompor um objetivo ainda difuso em tickets pequenos o suficiente para serem estimados e desenvolvidos (ver o critério **S** da checklist [INVEST](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories)).

## O quadro (board): visualizar o fluxo de trabalho

Um **quadro** (*board*) exibe os tickets em colunas que representam as etapas do fluxo de trabalho, cada ticket avançando de coluna em coluna à medida que progride. É a representação visual direta do princípio já visto no capítulo sobre [metodologias](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) (quadro Kanban: A fazer / Em andamento / Concluído).

```text
┌─────────────┬─────────────┬─────────────┐
│   A fazer   │ Em andamento│  Concluído  │
├─────────────┼─────────────┼─────────────┤
│ Ticket #143 │ Ticket #142 │ Ticket #140 │
│ Ticket #144 │             │ Ticket #141 │
└─────────────┴─────────────┴─────────────┘
```

Um quadro pode ser inteiramente **físico** (post-its em uma parede, uma prática ainda comum em algumas equipes presenciais) ou **digital**, em uma ferramenta dedicada.

## As ferramentas digitais mais usadas

| Ferramenta | Particularidade |
|---|---|
| **Jira** | Muito configurável (tipos de ticket, fluxos personalizados), difundida em equipes grandes; fama de mais pesada para aprender |
| **Trello** | Simples, centrada no quadro Kanban, adequada a equipes pequenas ou necessidades pouco estruturadas |
| **Linear** | Pensada para a rapidez de uso e o teclado, popular em equipes de produto/desenvolvimento |
| **Azure Boards** | Integrada à suíte Azure DevOps (ver o [capítulo dedicado](/?c=infrastructure-devops&s=ci-cd&p=azure-devops-plateforme)), prática quando o resto da cadeia (código, CI/CD) já está nessa plataforma |

Nenhuma dessas ferramentas impõe uma metodologia: a mesma ferramenta pode exibir um quadro Kanban simples ou sprints Scrum completos, conforme a configuração escolhida pela equipe.

> **Cilada:** escolher uma ferramenta muito rica em funcionalidades (Jira, por exemplo) para uma equipe pequena que só precisa de um quadro simples. Configurar e manter uma ferramenta mais complexa do que o necessário se torna, em si, uma carga de trabalho.
>
> **Boa prática:** escolher uma ferramenta adequada ao tamanho e à maturidade da equipe em vez da mais completa disponível; um quadro físico ou uma ferramenta simples já basta para uma equipe pequena em início de jornada.

## Um quadro é um reflexo, não a realidade

Um ticket marcado como "Concluído" só está de fato assim se a equipe mantiver o quadro atualizado de forma confiável e regular; um quadro que não reflete mais o estado real do trabalho perde toda a sua utilidade (ninguém mais pode confiar nele para saber como o projeto realmente está).

> **Boa prática:** atualizar o status de um ticket no momento em que o trabalho realmente muda de estado, não de forma adiada ou em lote no final do dia, para que o quadro continue sendo uma fonte confiável a qualquer momento.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um ticket é a unidade de trabalho básica (título, status, responsável); um epic agrupa vários tickets ligados a um objetivo comum grande demais para um único ticket. Um quadro visualiza o fluxo de trabalho em colunas, físico ou digital (Jira, Trello, Linear, Azure Boards). |
| **Ferramentas utilizáveis** | Um quadro físico (post-its) para uma equipe pequena presencial. Jira, Trello, Linear ou Azure Boards para um acompanhamento digital, conforme o tamanho e as necessidades da equipe. |
| **Ciladas a evitar** | Escolher uma ferramenta rica demais em funcionalidades para uma equipe pequena. Deixar um quadro se dessincronizar do estado real do trabalho. |
| **Boas práticas** | Escolher uma ferramenta adequada ao tamanho e à maturidade da equipe. Atualizar o status de um ticket no momento em que o trabalho realmente muda de estado. |
