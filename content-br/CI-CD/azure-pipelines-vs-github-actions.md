---
order: 4
---

# Azure Pipelines contra GitHub Actions

O **GitHub Actions** é o equivalente, no [GitHub](/?c=git&p=github-et-plateformes), ao [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme): um arquivo YAML descreve etapas automáticas, disparadas por um evento do repositório (um push, um [pull request](/?c=git&p=pull-requests-github)...), e executadas em uma máquina fornecida pelo GitHub ou pela sua própria.

## Vocabulário equivalente, estrutura diferente

| | Azure Pipelines | GitHub Actions |
|---|---|---|
| Arquivo de configuração | `azure-pipelines.yml`, na raiz | `.github/workflows/*.yml`, um arquivo por workflow |
| Divisão | Stage → Job → Step | Workflow → Job → Step |
| Gatilho | `trigger` | `on:` |
| Máquina de execução | `pool` (agente Microsoft ou auto-hospedado) | `runs-on` (runner do GitHub ou auto-hospedado) |
| Etapas prontas para uso | Tasks (marketplace do Azure DevOps) | Actions (marketplace do GitHub) |

```yaml
# Azure Pipelines
trigger:
  branches:
    include: [main]
steps:
  - script: npm test
```

```yaml
# GitHub Actions, equivalente
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

## Qual escolher

> **Armadilha:** supor que um pipeline se copia e cola de uma plataforma para outra. As palavras-chave, a estrutura de aninhamento (o Azure tem um nível *stage* que o GitHub Actions não tem) e as tasks/actions disponíveis são diferentes: migrar um pipeline exige reescrevê-lo, não apenas renomeá-lo.
>
> **Boa prática:** escolher de acordo com onde o código já está hospedado e o que a organização já usa: o GitHub Actions se integra naturalmente a um repositório já no GitHub, sem plataforma adicional; o Azure Pipelines se integra nativamente ao resto do Azure DevOps (Boards, Repos, Artifacts) se a organização já estiver instalada nele. Os dois cobrem as mesmas necessidades essenciais; o critério de escolha é o ecossistema existente, não uma diferença de funcionalidades.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | GitHub Actions e Azure Pipelines automatizam o mesmo tipo de trabalho (build, test, implantação) com um vocabulário diferente: workflow/stage, runner/agente, action/task. |
| **Ferramentas utilizáveis** | `.github/workflows/*.yml` para o GitHub Actions, `azure-pipelines.yml` para o Azure Pipelines. |
| **Armadilhas a evitar** | Copiar e colar um pipeline de uma plataforma para outra esperando que funcione sem adaptação. |
| **Boas práticas** | Escolher a plataforma de acordo com a hospedagem do código e o ecossistema já presente na organização, não uma diferença de funcionalidades entre as duas. |
