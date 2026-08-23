---
order: 2
---

# Azure DevOps as a Platform

**Azure DevOps** is Microsoft's platform that brings together, under a single project, work planning, code hosting, CI/CD automation (see [What Is a CI/CD Pipeline?](/?c=ci-cd&p=pipeline-cicd)), and package storage. It gathers in one place what [GitHub](/?c=git&p=github-et-plateformes) (the most widely used [Git](/?c=git&p=git) hosting platform) splits across several separate services.

## The four services of an Azure DevOps project

| Service | Role | GitHub Equivalent |
|---|---|---|
| **Boards** | Plan and track work ([backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories), sprints, Kanban board) | Issues / Projects |
| **Repos** | Host code on Git | GitHub itself |
| **Pipelines** | Run the build, tests, and deployment | GitHub Actions |
| **Artifacts** | Store packages ([npm](https://www.npmjs.com), [NuGet](https://www.nuget.org), [Maven](https://maven.apache.org)...) | GitHub Packages |

> **Analogy:** an Azure DevOps project is a building with four dedicated floors (planning, code, automation, packages), while the GitHub ecosystem houses each function in a separate building, connected to the others through integrations.

## These four services are independent

Nothing forces you to use all four together: a team can host its code on GitHub while using Azure Pipelines for automation, or the reverse.

> **Pitfall:** assuming that using Azure Pipelines requires migrating your code to Azure Repos. Azure Pipelines can build a repository hosted elsewhere (GitHub included), since the two services aren't tied to each other.
>
> **Best practice:** choose each Azure DevOps service independently based on the actual need, rather than assuming they all have to come from the same provider.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Azure DevOps brings together Boards (planning), Repos (Git hosting), Pipelines (CI/CD), and Artifacts (packages) in a single project, where GitHub splits these roles across several separate services. |
| **Available Tools** | Boards for tracking work, Repos for code, Pipelines for automation, Artifacts for packages. |
| **Pitfalls to Avoid** | Assuming all four services have to come from the same provider. |
| **Best Practices** | Choose each service independently based on the actual need (for example, GitHub for code and Azure Pipelines for automation). |
