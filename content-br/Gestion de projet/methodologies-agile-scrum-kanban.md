---
order: 1
---

# Metodologias: Agile, Scrum, Kanban

Uma vez definidos os [papéis de uma equipe](/?c=organisation-en-entreprise&p=roles-equipe-developpement), resta organizar concretamente o trabalho no tempo. Várias metodologias respondem a essa questão, com compromissos diferentes.

## O ciclo em cascata: planejar tudo antes de começar

O **ciclo em cascata** (*waterfall*) encadeia fases completas uma após a outra: especificação inteira, depois desenvolvimento inteiro, depois testes inteiros, depois implantação.

```text
Especificacao -> Desenvolvimento -> Testes -> Implantacao
   (100%)            (100%)          (100%)      (100%)
```

> **Armadilha:** descobrir uma necessidade mal compreendida durante os testes, bem no final do projeto. Como o desenvolvimento inteiro já foi feito com base nela, corrigir significa refazer boa parte do trabalho já realizado.
>
> **Boa prática:** entregar em pequenos incrementos em vez de em um único bloco, para detectar uma necessidade mal compreendida depois de alguns dias de trabalho, não depois de vários meses: é exatamente o princípio que a agilidade generaliza.

## A agilidade: entregar pouco e com frequência

A **agilidade** (*Agile*) divide o trabalho em incrementos curtos, cada um entregando algo utilizável, para detectar problemas cedo em vez de no final de um ciclo longo. Scrum e Kanban são duas formas concretas de estruturar essa ideia.

## Scrum: sprints de duração fixa

O **Scrum** organiza o trabalho em **sprints**: períodos de duração fixa (frequentemente duas semanas), cada um terminando com um incremento entregável. Quatro rituais marcam cada sprint:

| Ritual | Momento | Objetivo |
|---|---|---|
| **Sprint planning** | Início do sprint | Escolher o que será feito durante esse sprint |
| **Daily standup** | Todo dia | Sincronizar a equipe em poucos minutos (feito ontem, previsto hoje, bloqueios) |
| **Sprint review** | Fim do sprint | Mostrar o que foi entregue, coletar um retorno |
| **Retrospectiva** | Fim do sprint | Ajustar a forma de trabalhar para o próximo sprint |

## Kanban: um fluxo contínuo, sem sprint

O **Kanban** não tem período fixo: o trabalho avança em fluxo contínuo em um quadro de colunas (A fazer / Em andamento / Feito), com um **limite de trabalho em andamento** (*WIP limit*): um número máximo de tarefas permitidas simultaneamente em uma mesma coluna.

```text
A fazer          Em andamento (max 2)  Feito
---------        -----------------     --------
Tarefa C         Tarefa A               Tarefa X
Tarefa D         Tarefa B               Tarefa Y
Tarefa E
```

> **Armadilha:** deixar cada um começar uma nova tarefa assim que tiver um momento livre, sem limite de trabalho em andamento. Dez tarefas começadas e nenhuma terminada não avançam mais rápido do que uma única tarefa por vez: elas se bloqueiam mutuamente (espera de retorno, dependências cruzadas) sem que nenhuma progrida até o fim.
>
> **Boa prática:** fixar um limite de trabalho em andamento por coluna, e respeitá-lo mesmo quando alguém fica sem tarefa: terminar o que já foi começado antes de iniciar uma nova.

## Comparativo

| | Cascata | Scrum | Kanban |
|---|---|---|---|
| Planejamento | Inteiro, antecipado | Por sprint | Contínuo, tarefa por tarefa |
| Ritmo de entrega | Uma vez, no fim do projeto | Regular (fim de cada sprint) | Contínuo, ao longo do tempo |
| Adequado a | Necessidade já totalmente conhecida e estável | Um produto com entregas regulares planejáveis | Um fluxo de demandas irregular (suporte, manutenção) |

> **Armadilha:** adotar o vocabulário Scrum (sprint, daily) sem os rituais que lhe dão sentido, apenas renomeando as reuniões já existentes. O vocabulário sozinho não muda em nada a forma real de trabalhar.
>
> **Boa prática:** escolher uma metodologia de acordo com a natureza do trabalho (Scrum para entregas regulares planejadas, Kanban para um fluxo irregular), não por modismo, e aplicar seus rituais de verdade em vez de manter apenas os nomes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O ciclo em cascata planeja tudo com antecedência; a agilidade entrega em pequenos incrementos para detectar problemas mais cedo. O Scrum estrutura esses incrementos em sprints com rituais fixos; o Kanban organiza um fluxo contínuo limitado por um teto de trabalho em andamento. |
| **Ferramentas utilizáveis** | Um quadro Kanban (colunas A fazer / Em andamento / Feito); os quatro rituais Scrum (planning, daily, review, retrospectiva). |
| **Armadilhas a evitar** | Descobrir uma necessidade mal compreendida no final de um ciclo em cascata. Deixar o trabalho em andamento se acumular sem limite. Adotar o vocabulário Agile sem seus rituais reais. |
| **Boas práticas** | Entregar em pequenos incrementos para detectar problemas cedo. Fixar e respeitar um limite de trabalho em andamento. Escolher a metodologia de acordo com a natureza do trabalho, não por modismo. |
