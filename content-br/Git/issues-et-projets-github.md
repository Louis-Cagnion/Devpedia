---
order: 11
---

# Issues e gestão de projeto no GitHub

Uma **issue** é um ticket: um bug relatado, uma funcionalidade solicitada, uma pergunta, discutida em comentários anexados a esse ticket. Ao contrário de uma [pull request](/?c=git&p=pull-requests-github), uma issue não contém nenhum código: é uma discussão estruturada, independente de qualquer commit.

| | Issue | Pull request |
|---|---|---|
| Contém código? | Não: apenas texto e comentários | Sim: uma branch com commits reais |
| Serve para | Relatar, discutir, planejar | Propor e revisar uma mudança concreta |
| Pode estar ligada a | Uma ou várias pull requests que a fecham | Uma ou várias issues que ela fecha |

## Organizar as issues: labels, atribuídos, milestones

Em um projeto ativo, dezenas de issues abertas em paralelo rapidamente se tornam difíceis de acompanhar sem organização explícita:

| Ferramenta | Papel |
|---|---|
| **Label** (etiqueta) | Categoriza uma issue por palavra-chave colorida (`bug`, `documentacao`, `prioridade alta`...), filtrável na lista de issues |
| **Atribuído** (*assignee*) | Designa quem é responsável por tratar essa issue específica |
| **Milestone** (marco) | Agrupa várias issues e pull requests em torno de um objetivo comum (uma versão, uma data de entrega), com uma barra de progresso baseada nas já fechadas |

> **Boa prática:** manter um conjunto de labels restrito e coerente (tipo de problema, prioridade, status) em vez de criar um novo a cada necessidade pontual: um label raramente reutilizado perde sua utilidade de filtragem.

## Os modelos de issue (*issue templates*)

Um modelo de issue pré-preenche o formulário de criação com as seções esperadas (passos para reproduzir um bug, comportamento esperado vs observado, ambiente...), configurado uma vez pelos mantenedores do repositório. Sem modelo, cada pessoa que abre uma issue decide sozinha o que colocar nela, com um risco real de detalhes faltando (versão do software, passos de reprodução) que atrasa o tratamento.

> **Armadilha:** deixar um repositório ativo sem modelo de issue, esperando que cada relatório de bug contenha naturalmente as informações necessárias. Na prática, uma issue sem estrutura imposta frequentemente esquece a informação mais útil para diagnosticá-la.
>
> **Boa prática:** configurar pelo menos um modelo "relatório de bug" e um modelo "solicitação de funcionalidade" assim que um repositório aceita contribuições externas.

## GitHub Projects: uma visão Kanban por cima das issues

O **GitHub Projects** é um quadro (frequentemente estilo [**Kanban**](https://en.wikipedia.org/wiki/Kanban_board): colunas como "A fazer" / "Em andamento" / "Concluído", cada cartão movido de uma coluna para outra conforme seu progresso) que agrupa issues e pull requests de um ou vários repositórios, para uma visão geral do andamento de um projeto em vez de uma simples lista plana:

```text
A fazer              Em andamento          Concluido
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Issue #12    │     │ Issue #9     │     │ Issue #3     │
│ Issue #15    │     │ PR #14       │     │ PR #7        │
└─────────────┘     └─────────────┘     └─────────────┘
```

Mover um cartão de uma coluna para outra não modifica nem a issue nem a pull request em si: é uma organização visual independente, que aliás pode agrupar elementos vindos de vários repositórios diferentes em um único quadro.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma issue acompanha um bug/uma tarefa/uma discussão, sem código. Labels, atribuídos e milestones organizam um grande número de issues. O GitHub Projects oferece uma visão Kanban por cima das issues e pull requests, potencialmente de vários repositórios. |
| **Ferramentas utilizáveis** | Labels, atribuídos, milestones, modelos de issue, GitHub Projects. |
| **Armadilhas a evitar** | Multiplicar labels pontuais em vez de um conjunto restrito e coerente. Deixar um repositório ativo sem modelo de issue. |
| **Boas práticas** | Manter um conjunto de labels restrito. Configurar modelos de issue assim que um repositório aceita contribuições externas. |
