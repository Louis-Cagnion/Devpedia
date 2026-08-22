---
order: 4
---

# Azure Pipelines contra GitHub Actions

**GitHub Actions** es el equivalente, en [GitHub](/?c=git&p=github-et-plateformes), de [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme): un archivo YAML describe pasos automáticos, disparados por un evento del repositorio (un push, una [pull request](/?c=git&p=pull-requests-github)...), y ejecutados en una máquina proporcionada por GitHub o la tuya.

## Vocabulario equivalente, estructura diferente

| | Azure Pipelines | GitHub Actions |
|---|---|---|
| Archivo de configuración | `azure-pipelines.yml`, en la raíz | `.github/workflows/*.yml`, un archivo por workflow |
| División | Stage → Job → Step | Workflow → Job → Step |
| Disparador | `trigger` | `on:` |
| Máquina de ejecución | `pool` (agente Microsoft o autoalojado) | `runs-on` (runner GitHub o autoalojado) |
| Pasos listos para usar | Tasks (marketplace de Azure DevOps) | Actions (marketplace de GitHub) |

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

## Cuál elegir

> **Trampa:** suponer que un pipeline se copia y pega de una plataforma a otra. Las palabras clave, la estructura de anidamiento (Azure tiene un nivel *stage* que GitHub Actions no tiene) y las tasks/actions disponibles difieren: migrar un pipeline exige reescribirlo, no renombrarlo.
>
> **Buena práctica:** elegir según dónde está ya alojado el código y qué usa ya la organización: GitHub Actions se integra naturalmente en un repositorio ya en GitHub sin plataforma adicional; Azure Pipelines se integra nativamente con el resto de Azure DevOps (Boards, Repos, Artifacts) si la organización ya está instalada ahí. Ambos cubren las mismas necesidades esenciales; el criterio de elección es el ecosistema existente, no una diferencia de funcionalidades.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GitHub Actions y Azure Pipelines automatizan el mismo tipo de trabajo (build, test, despliegue) con un vocabulario diferente: workflow/stage, runner/agente, action/task. |
| **Herramientas utilizables** | `.github/workflows/*.yml` para GitHub Actions, `azure-pipelines.yml` para Azure Pipelines. |
| **Trampas a evitar** | Copiar y pegar un pipeline de una plataforma a otra esperando que funcione sin adaptación. |
| **Buenas prácticas** | Elegir la plataforma según el alojamiento del código y el ecosistema ya presente en la organización, no según una diferencia de funcionalidades entre ambas. |
