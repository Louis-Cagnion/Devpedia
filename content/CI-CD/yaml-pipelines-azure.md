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

> **Piège :** écrire un mot de passe, une clé d'API ou un jeton d'accès directement dans `azure-pipelines.yml`. Ce fichier est versionné dans le dépôt Git : le secret reste visible dans l'historique même après l'avoir retiré d'une version ultérieure.
>
> **Bonne pratique :** stocker les secrets dans un **groupe de variables** (*variable group*) ou une bibliothèque Azure DevOps dédiée, puis les référencer dans le YAML par leur nom (`$(motDePasse)`) : le fichier versionné ne contient alors jamais la valeur elle-même.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipeline Azure s'organise en stages, contenant des jobs, contenant des steps exécutés dans l'ordre. `trigger` définit quand il se lance, `pool` sur quelle machine, `steps`/`task` les actions à exécuter. |
| **Outils utilisables** | Les tasks officielles (`PublishBuildArtifacts@1` et bien d'autres) pour des actions courantes, sans réécrire leur logique à la main. |
| **Pièges à éviter** | Omettre `trigger` et laisser un comportement implicite décider quand le pipeline se lance. Écrire un secret en clair dans le fichier YAML versionné. |
| **Bonnes pratiques** | Déclarer `trigger` explicitement. Stocker les secrets dans un groupe de variables dédié et les référencer par leur nom, jamais en clair. |
