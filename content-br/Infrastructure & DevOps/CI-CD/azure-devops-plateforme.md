---
order: 2
---

# Azure DevOps como plataforma

O **Azure DevOps** é a plataforma da Microsoft que reúne, sob um mesmo projeto, o planejamento do trabalho, a hospedagem do código, a automação CI/CD (veja [O que é um pipeline CI/CD?](/?c=ci-cd&p=pipeline-cicd)) e o armazenamento de pacotes. Ele concentra em um único lugar o que o [GitHub](/?c=git&p=github-et-plateformes) (a plataforma de hospedagem Git mais usada) distribui entre vários serviços separados.

## Os quatro serviços de um projeto Azure DevOps

| Serviço | Papel | Equivalente no GitHub |
|---|---|---|
| **Boards** | Planejar e acompanhar o trabalho (backlog, sprints, quadro Kanban) | Issues / Projects |
| **Repos** | Hospedar o código no Git | O próprio GitHub |
| **Pipelines** | Executar a construção, os testes e a implantação | GitHub Actions |
| **Artifacts** | Armazenar pacotes ([npm](https://www.npmjs.com), [NuGet](https://www.nuget.org), [Maven](https://maven.apache.org)...) | GitHub Packages |

> **Analogia:** um projeto Azure DevOps é um prédio com quatro andares dedicados (planejamento, código, automação, pacotes), enquanto o ecossistema GitHub aloja cada função em um edifício separado, conectado aos outros por integrações.

## Esses quatro serviços são independentes

Nada obriga a usar os quatro juntos: uma equipe pode hospedar seu código no GitHub e ao mesmo tempo usar o Azure Pipelines para a automação, ou o inverso.

> **Armadilha:** supor que usar o Azure Pipelines obriga a migrar o código para o Azure Repos. O Azure Pipelines pode construir um repositório hospedado em outro lugar (inclusive no GitHub), já que os dois serviços não estão amarrados um ao outro.
>
> **Boa prática:** escolher cada serviço do Azure DevOps de forma independente, de acordo com a necessidade real, em vez de supor que todos devem vir do mesmo fornecedor.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Azure DevOps reúne Boards (planejamento), Repos (hospedagem Git), Pipelines (CI/CD) e Artifacts (pacotes) em um mesmo projeto, onde o GitHub distribui esses papéis entre vários serviços separados. |
| **Ferramentas utilizáveis** | Boards para o acompanhamento do trabalho, Repos para o código, Pipelines para a automação, Artifacts para os pacotes. |
| **Armadilhas a evitar** | Supor que os quatro serviços devem obrigatoriamente vir do mesmo fornecedor. |
| **Boas práticas** | Escolher cada serviço de forma independente conforme a necessidade real (por exemplo, GitHub para o código e Azure Pipelines para a automação). |
