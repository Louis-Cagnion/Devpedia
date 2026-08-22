---
order: 5
---

# SAFe e Scrumban: os casos híbridos

O capítulo sobre as [metodologias](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) apresentou Scrum e Kanban como duas abordagens distintas, cada uma adequada a um tipo de trabalho diferente. Duas necessidades frequentes, porém, não se encaixam em nenhuma das duas: coordenar o Scrum em grande escala, em várias equipes, e gerenciar um fluxo que mistura trabalho planejado com urgências imprevistas. Este capítulo cobre as respostas mais comuns a essas duas necessidades.

## O problema da escala

O Scrum funciona bem para uma única equipe, mas um produto complexo geralmente envolve várias equipes trabalhando no mesmo produto, com dependências entre elas (uma equipe esperando uma API que outra equipe está desenvolvendo, por exemplo). O Scrum sozinho não define nada para coordenar esse caso: cada equipe poderia ter seus próprios sprints, sem nenhuma sincronização entre elas.

## SAFe: sincronizar várias equipes Scrum

O **SAFe** (*Scaled Agile Framework*) é um framework que estende os princípios ágeis a várias equipes trabalhando juntas em um mesmo produto. Seu mecanismo central: sincronizar os sprints de todas as equipes em um ritmo comum, chamado **Program Increment** (PI), geralmente de 8 a 12 semanas agrupando vários sprints.

```text
Program Increment (10 semanas, 5 sprints de 2 semanas):

Equipe A: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Equipe B: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Equipe C: Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
          └── todas começam e terminam ao mesmo tempo ──┘

PI Planning (antes do PI): todas as equipes se reúnem para
identificar as dependências entre elas antes de começar
```

O **PI Planning**, uma reunião que junta todas as equipes antes do início de um Program Increment, serve precisamente para detectar essas dependências com antecedência ("a equipe A precisa que a equipe B entregue tal funcionalidade antes do seu próprio sprint 3"), em vez de descobri-las ao longo do caminho.

> **Cilada:** adotar o SAFe para uma única equipe, ou para um produto sem dependência real entre equipes. O SAFe adiciona uma camada de coordenação (papéis adicionais, reuniões em maior escala) que não traz nada sem uma necessidade real de sincronizar várias equipes entre si.
>
> **Boa prática:** reservar o SAFe (ou um framework de escalonamento equivalente) para os casos em que várias equipes realmente trabalham no mesmo produto com dependências reais entre elas; uma única equipe continua melhor atendida por Scrum ou Kanban sozinhos.

## Scrumban: um fluxo contínuo com marcos do Scrum

O **Scrumban** combina o fluxo contínuo do Kanban (sem sprints fixos, um limite de trabalho em andamento) com alguns marcos pontuais emprestados do Scrum (uma reunião de planejamento regular, uma retrospectiva periódica), sem forçar uma divisão estrita em sprints.

```text
Kanban puro:            fluxo contínuo, limite de trabalho em
                         andamento, nenhum marco temporal imposto

Scrumban:                fluxo contínuo (como o Kanban), + um
                         planejamento e uma retrospectiva em
                         intervalo regular (emprestados do Scrum)

Scrum puro:              sprints fixos, todo o ritual Scrum completo
```

Essa mistura convém particularmente a uma equipe cujo trabalho combina o planejado (funcionalidades previstas com antecedência) e o imprevisto (suporte, incidentes urgentes): o fluxo contínuo do Kanban absorve naturalmente o imprevisto, enquanto os marcos pontuais do Scrum mantêm um ritmo regular de reflexão coletiva.

> **Cilada:** achar que o Scrumban é uma versão "leve" do Scrum que pode ser aplicada por padrão sem pensar. O Scrumban responde a uma necessidade precisa (fluxo misto planejado/imprevisto); aplicá-lo a um trabalho inteiramente planejável não traz nada em relação ao Scrum clássico, com o mesmo raciocínio já visto no capítulo de metodologias (escolher conforme a natureza do trabalho, não por hábito).
>
> **Boa prática:** escolher o Scrumban especificamente quando o trabalho realmente mistura planejado e imprevisto; caso contrário, o Scrum puro (tudo planejável) ou o Kanban puro (fluxo inteiramente irregular) continuam mais simples e suficientes.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O SAFe sincroniza várias equipes Scrum em um ritmo comum (Program Increment), com um PI Planning para detectar as dependências com antecedência. O Scrumban combina o fluxo contínuo do Kanban com marcos pontuais emprestados do Scrum, adequado a um trabalho que mistura planejado e imprevisto. |
| **Ferramentas utilizáveis** | O Program Increment e o PI Planning para coordenar várias equipes (SAFe). Um planejamento e uma retrospectiva em intervalo regular sobre um fluxo Kanban (Scrumban). |
| **Ciladas a evitar** | Adotar o SAFe sem uma necessidade real de coordenar várias equipes dependentes. Aplicar o Scrumban por padrão a um trabalho inteiramente planejável. |
| **Boas práticas** | Reservar o SAFe para os casos de várias equipes com dependências reais. Escolher o Scrumban apenas para um fluxo que realmente mistura planejado e imprevisto. |
