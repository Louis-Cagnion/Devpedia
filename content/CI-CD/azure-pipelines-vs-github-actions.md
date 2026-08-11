---
order: 4
---

# Azure Pipelines contre GitHub Actions

**GitHub Actions** est l'équivalent GitHub d'[Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme) : un fichier YAML décrit des étapes automatiques, déclenchées par un événement du dépôt (un push, une pull request...), et exécutées sur une machine fournie par GitHub ou la vôtre.

## Vocabulaire équivalent, structure différente

| | Azure Pipelines | GitHub Actions |
|---|---|---|
| Fichier de configuration | `azure-pipelines.yml`, à la racine | `.github/workflows/*.yml`, un fichier par workflow |
| Découpage | Stage → Job → Step | Workflow → Job → Step |
| Déclencheur | `trigger` | `on:` |
| Machine d'exécution | `pool` (agent Microsoft ou auto-hébergé) | `runs-on` (runner GitHub ou auto-hébergé) |
| Étapes prêtes à l'emploi | Tasks (marketplace Azure DevOps) | Actions (marketplace GitHub) |

```yaml
# Azure Pipelines
trigger:
  branches:
    include: [main]
steps:
  - script: npm test
```

```yaml
# GitHub Actions, équivalent
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

## Lequel choisir

> **Piège :** supposer qu'un pipeline se copie-colle d'une plateforme à l'autre. Les mots-clés, la structure d'imbrication (Azure a un niveau *stage* que GitHub Actions n'a pas) et les tasks/actions disponibles diffèrent : migrer un pipeline demande de le réécrire, pas de le renommer.
>
> **Bonne pratique :** choisir selon où le code est déjà hébergé et ce que l'organisation utilise déjà : GitHub Actions s'intègre naturellement à un dépôt déjà sur GitHub sans plateforme supplémentaire ; Azure Pipelines s'intègre nativement au reste d'Azure DevOps (Boards, Repos, Artifacts) si l'organisation y est déjà installée. Les deux couvrent les mêmes besoins essentiels ; le critère de choix est l'écosystème existant, pas une différence de fonctionnalités.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GitHub Actions et Azure Pipelines automatisent le même type de travail (build, test, déploiement) avec un vocabulaire différent : workflow/stage, runner/agent, action/task. |
| **Outils utilisables** | `.github/workflows/*.yml` pour GitHub Actions, `azure-pipelines.yml` pour Azure Pipelines. |
| **Pièges à éviter** | Copier-coller un pipeline d'une plateforme à l'autre en espérant qu'il fonctionne sans adaptation. |
| **Bonnes pratiques** | Choisir la plateforme selon l'hébergement du code et l'écosystème déjà en place dans l'organisation, pas selon une différence de fonctionnalités entre les deux. |
