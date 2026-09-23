---
order: 3
---

# La syntaxe YAML des pipelines Azure

Un pipeline Azure DevOps se décrit dans un fichier `azure-pipelines.yml`, au format **YAML** (voir la syntaxe de base, déjà couverte dans [Docker Compose](/?c=docker&p=docker-compose)) : ce chapitre ne couvre que ce qui est spécifique à la structure d'un pipeline.

## La hiérarchie d'un pipeline

Un pipeline s'organise en quatre niveaux imbriqués, du plus large au plus précis :

```text
Pipeline
  └─ Stage    (une grande phase, ex. "Build", "Test", "Deploy")
       └─ Job       (un ensemble de tâches exécutées sur une même machine)
            └─ Step      (une tâche précise : lancer une commande, publier un fichier...)
```

Les stages d'un même pipeline peuvent s'enchaîner (l'un après l'autre) ou tourner en parallèle ; les jobs d'un même stage aussi. Les steps d'un même job, eux, s'exécutent toujours dans l'ordre où ils sont écrits.

## Un exemple minimal

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

steps:
  - script: npm install
    displayName: Installer les dépendances
  - script: npm test
    displayName: Lancer les tests
```

- `trigger` : quand le pipeline se lance automatiquement (ici, à chaque push sur `main`).
- `pool` : quelle machine (fournie par Microsoft, ou la vôtre) exécute le pipeline.
- `steps` : la liste des étapes, exécutées dans l'ordre. `script` lance une commande brute ; `displayName` est juste le nom affiché dans les journaux d'exécution.

> **Piège :** oublier `trigger`. Sans lui, le comportement par défaut dépend de la configuration du projet (déclenchement sur toute branche, ou pipeline qui ne se lance jamais tout seul) : autant le préciser explicitement plutôt que de deviner ce que fera l'absence de ce champ.
>
> **Bonne pratique :** déclarer `trigger` explicitement, même pour reproduire un comportement qui serait de toute façon le défaut : le fichier reste compréhensible sans avoir à connaître ce défaut par cœur.

## Les tasks : des steps prêts à l'emploi

Une **task** est une step prédéfinie par Azure DevOps (ou par la marketplace) pour une action courante, plutôt que d'écrire la commande brute soi-même :

```yaml
steps:
  - script: npm run build
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: dist
      ArtifactName: mon-app
```

`PublishBuildArtifacts@1` est une task officielle qui publie un dossier comme résultat du pipeline (récupérable par un autre stage ou en téléchargement manuel) : cela évite de réécrire soi-même la logique d'archivage et d'upload.

## Piège : mettre un secret en clair dans le fichier YAML

```yaml
# à ne jamais faire : le mot de passe apparaît en clair dans l'historique Git
steps:
  - script: deploy.sh --password monMotDePasse123
```

> **Piège :** écrire un mot de passe, une clé d'API ou un jeton d'accès directement dans `azure-pipelines.yml`. Ce fichier est versionné dans le dépôt [Git](/?c=git&p=git) : le secret reste visible dans l'historique même après l'avoir retiré d'une version ultérieure.
>
> **Bonne pratique :** stocker les secrets dans un **groupe de variables** (*variable group*) ou une bibliothèque Azure DevOps dédiée, puis les référencer dans le YAML par leur nom (`$(motDePasse)`) : le fichier versionné ne contient alors jamais la valeur elle-même.

## Autoriser un pipeline à utiliser une ressource pour la première fois : "Permit"

Un pipeline qui référence dans son YAML un groupe de variables ou un Environment jamais encore utilisé par CE pipeline ne démarre pas automatiquement au premier `Run` : Azure DevOps affiche un bandeau *"This pipeline needs permission to access N resource(s)"* avec un bouton **Permit** par ressource concernée.

```text
Run pipeline
  -> "This pipeline needs permission to access 1 resource(s)"
  -> bouton Permit (case a cocher : "pour ce run et les runs futurs")
```

Distinct de la question "qui peut lire/écrire le groupe de variables" (déjà une bonne pratique de sécurité des secrets) : Permit est une liste blanche pipeline <-> ressource, à accorder une fois. Le bouton Permit lui-même n'apparaît que pour un administrateur de la ressource référencée : un autre utilisateur ne voit aucun bouton du tout, sans message d'erreur explicite qui l'indiquerait.

> **Piège :** interpréter l'absence du bouton Permit comme un bug plutôt que comme un manque de droits d'administration sur la ressource référencée (groupe de variables, Environment).
>
> **Bonne pratique :** cocher "pour ce run et les runs futurs" au premier Permit d'un pipeline stable, pour ne pas avoir à ré-autoriser à chaque nouveau run.

## Les Environments Azure DevOps : une ressource distincte, avec checks d'approbation

Un `environment: OnPrem-Prod` déclaré dans un `deployment job` est une ressource de premier ordre, distincte d'un groupe de variables, qui peut porter des **checks** : par exemple un approbateur nommé, avec un délai avant que le stage ne continue.

```yaml
jobs:
  - deployment: DeployProd
    environment: OnPrem-Prod
    strategy:
      runOnce:
        deploy:
          steps:
            - script: ./deploy.sh
```

Un Environment non autorisé bloque le run avec le même bandeau "Permission needed" qu'un groupe de variables non autorisé ; mais un Environment protégé par un check d'approbation bloque différemment : le run attend la validation manuelle de l'approbateur désigné, jusqu'à expiration d'un délai configuré.

> **Piège :** confondre le blocage "Permit" (autorisation d'accès, à accorder une fois) et le blocage par un check d'approbation (validation humaine à chaque déploiement) : les deux affichent un run en attente, mais la résolution est différente.
>
> **Bonne pratique :** réserver un check d'approbation aux Environments à fort enjeu (production), pas à un Environment de test qui n'a besoin que d'un Permit initial.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipeline Azure s'organise en stages, contenant des jobs, contenant des steps exécutés dans l'ordre. `trigger` définit quand il se lance, `pool` sur quelle machine, `steps`/`task` les actions à exécuter. Un groupe de variables ou un Environment jamais utilisé par un pipeline donné exige un Permit explicite (accessible seulement à un administrateur de la ressource) ; un Environment peut en plus porter un check d'approbation humaine. |
| **Outils utilisables** | Les tasks officielles (`PublishBuildArtifacts@1` et bien d'autres) pour des actions courantes, sans réécrire leur logique à la main. Les Environments pour porter des checks d'approbation sur un déploiement sensible. |
| **Pièges à éviter** | Omettre `trigger` et laisser un comportement implicite décider quand le pipeline se lance. Écrire un secret en clair dans le fichier YAML versionné. Confondre un blocage Permit (autorisation d'accès) avec un blocage par check d'approbation (validation humaine à chaque déploiement). |
| **Bonnes pratiques** | Déclarer `trigger` explicitement. Stocker les secrets dans un groupe de variables dédié et les référencer par leur nom, jamais en clair. Cocher "pour ce run et les runs futurs" au premier Permit d'un pipeline stable. Réserver les checks d'approbation aux Environments à fort enjeu. |
