---
order: 4
---

# Azure Pipelines vs. GitHub Actions

**GitHub Actions** is, on [GitHub](/?c=git&p=github-et-plateformes), the equivalent of [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme): a YAML file describes automatic steps, triggered by a repository event (a push, a [pull request](/?c=git&p=pull-requests-github)...), and run on a machine provided by GitHub or your own.

## Equivalent vocabulary, different structure

| | Azure Pipelines | GitHub Actions |
|---|---|---|
| Configuration file | `azure-pipelines.yml`, at the root | `.github/workflows/*.yml`, one file per workflow |
| Breakdown | Stage → Job → Step | Workflow → Job → Step |
| Trigger | `trigger` | `on:` |
| Execution machine | `pool` (Microsoft-hosted or self-hosted agent) | `runs-on` (GitHub or self-hosted runner) |
| Ready-made steps | Tasks (Azure DevOps marketplace) | Actions (GitHub marketplace) |

```yaml
# Azure Pipelines
trigger:
  branches:
    include: [main]
steps:
  - script: npm test
```

```yaml
# GitHub Actions, equivalent
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

## Which one to choose

> **Pitfall:** assuming a pipeline can be copy-pasted from one platform to the other. The keywords, the nesting structure (Azure has a *stage* level that GitHub Actions doesn't), and the available tasks/actions all differ: migrating a pipeline means rewriting it, not renaming it.
>
> **Best practice:** choose based on where the code is already hosted and what the organization already uses: GitHub Actions integrates naturally with a repository already on GitHub, with no extra platform needed; Azure Pipelines integrates natively with the rest of Azure DevOps (Boards, Repos, Artifacts) if the organization is already set up there. Both cover the same essential needs; the deciding factor is the existing ecosystem, not a difference in features.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | GitHub Actions and Azure Pipelines automate the same kind of work (build, test, deployment) with different vocabulary: workflow/stage, runner/agent, action/task. |
| **Available Tools** | `.github/workflows/*.yml` for GitHub Actions, `azure-pipelines.yml` for Azure Pipelines. |
| **Pitfalls to Avoid** | Copy-pasting a pipeline from one platform to the other expecting it to work without adaptation. |
| **Best Practices** | Choose the platform based on where the code is hosted and the ecosystem already in place in the organization, not on a difference in features between the two. |
