---
order: 2
---

# Azure DevOps como plataforma

**Azure DevOps** es la plataforma de Microsoft que agrupa, bajo un mismo proyecto, la planificación del trabajo, el alojamiento del código, la automatización CI/CD (ver [¿Qué es un pipeline CI/CD?](/?c=ci-cd&p=pipeline-cicd)) y el almacenamiento de paquetes. Reúne en un solo lugar lo que [GitHub](/?c=git&p=github-et-plateformes) (la plataforma de alojamiento Git más extendida) reparte entre varios servicios distintos.

## Los cuatro servicios de un proyecto Azure DevOps

| Servicio | Papel | Equivalente en GitHub |
|---|---|---|
| **Boards** | Planificar y seguir el trabajo (backlog, sprints, tablero Kanban) | Issues / Projects |
| **Repos** | Alojar el código en Git | GitHub mismo |
| **Pipelines** | Ejecutar la construcción, los tests y el despliegue | GitHub Actions |
| **Artifacts** | Almacenar paquetes ([npm](https://www.npmjs.com), [NuGet](https://www.nuget.org), [Maven](https://maven.apache.org)...) | GitHub Packages |

> **Analogía:** un proyecto Azure DevOps es un edificio con cuatro plantas dedicadas (planificación, código, automatización, paquetes), mientras que el ecosistema GitHub aloja cada función en un edificio separado, conectado a los demás mediante integraciones.

## Estos cuatro servicios son independientes

Nada obliga a usar los cuatro juntos: un equipo puede alojar su código en GitHub mientras usa Azure Pipelines para la automatización, o al revés.

> **Trampa:** suponer que usar Azure Pipelines obliga a migrar el código a Azure Repos. Azure Pipelines puede construir un repositorio alojado en otro sitio (GitHub incluido), ya que los dos servicios no están vinculados entre sí.
>
> **Buena práctica:** elegir cada servicio de Azure DevOps de forma independiente según la necesidad real, en lugar de suponer que todos deben venir del mismo proveedor.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Azure DevOps agrupa Boards (planificación), Repos (alojamiento Git), Pipelines (CI/CD) y Artifacts (paquetes) en un mismo proyecto, donde GitHub reparte estos papeles entre varios servicios distintos. |
| **Herramientas utilizables** | Boards para el seguimiento del trabajo, Repos para el código, Pipelines para la automatización, Artifacts para los paquetes. |
| **Trampas a evitar** | Suponer que los cuatro servicios deben venir obligatoriamente del mismo proveedor. |
| **Buenas prácticas** | Elegir cada servicio de forma independiente según la necesidad real (por ejemplo, GitHub para el código y Azure Pipelines para la automatización). |
