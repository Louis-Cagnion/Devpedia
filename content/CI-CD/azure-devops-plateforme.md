---
order: 2
---

# Azure DevOps comme plateforme

**Azure DevOps** est la plateforme de Microsoft qui regroupe, sous un même projet, la planification du travail, l'hébergement du code, l'automatisation CI/CD (voir [Qu'est-ce qu'un pipeline CI/CD ?](/?c=ci-cd&p=pipeline-cicd)) et le stockage de paquets. Elle rassemble en un seul endroit ce que GitHub, familier si vous en venez, répartit sur plusieurs services distincts.

## Les quatre services d'un projet Azure DevOps

| Service | Rôle | Équivalent GitHub |
|---|---|---|
| **Boards** | Planifier et suivre le travail (backlog, sprints, tableau Kanban) | Issues / Projects |
| **Repos** | Héberger le code sur Git | GitHub lui-même |
| **Pipelines** | Exécuter la construction, les tests et le déploiement | GitHub Actions |
| **Artifacts** | Stocker des paquets (npm, NuGet, Maven...) | GitHub Packages |

> **Analogie :** un projet Azure DevOps est un immeuble avec quatre étages dédiés (planification, code, automatisation, paquets), alors que l'écosystème GitHub loge chaque fonction dans un bâtiment séparé, connecté aux autres par des intégrations.

## Ces quatre services sont indépendants

Rien n'oblige à utiliser les quatre ensemble : une équipe peut héberger son code sur GitHub tout en utilisant Azure Pipelines pour l'automatisation, ou l'inverse.

> **Piège :** supposer qu'utiliser Azure Pipelines impose de migrer son code vers Azure Repos. Azure Pipelines peut construire un dépôt hébergé ailleurs (GitHub compris), les deux services n'étant pas liés l'un à l'autre.
>
> **Bonne pratique :** choisir chaque service Azure DevOps indépendamment selon le besoin réel, plutôt que de supposer qu'ils doivent tous venir du même fournisseur.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Azure DevOps regroupe Boards (planification), Repos (hébergement Git), Pipelines (CI/CD) et Artifacts (paquets) dans un même projet, là où GitHub répartit ces rôles entre plusieurs services distincts. |
| **Outils utilisables** | Boards pour le suivi du travail, Repos pour le code, Pipelines pour l'automatisation, Artifacts pour les paquets. |
| **Pièges à éviter** | Supposer que les quatre services doivent obligatoirement venir du même fournisseur. |
| **Bonnes pratiques** | Choisir chaque service indépendamment selon le besoin réel (par exemple, GitHub pour le code et Azure Pipelines pour l'automatisation). |
