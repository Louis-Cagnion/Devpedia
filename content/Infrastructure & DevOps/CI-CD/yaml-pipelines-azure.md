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
- `pool` : dans quel groupe d'agents (les programmes qui exécutent les jobs, sur une machine fournie par Microsoft ou la vôtre) le pipeline s'exécute ; un pool est une liste d'agents, pas une machine : il peut regrouper des agents de plusieurs machines, et une machine peut héberger des agents de plusieurs pools.
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

## Les paramètres de pipeline : choisir au lancement

Un pipeline lancé à la main peut demander des choix à la personne qui le lance : c'est le rôle du bloc `parameters`, placé en tête du fichier ([Runtime parameters](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters)). Azure DevOps affiche alors un formulaire avant le lancement.

```yaml
parameters:
  - name: mode                    # nom utilisé dans le fichier
    displayName: Mode d'exécution # libellé affiché dans le formulaire
    type: string
    default: normal               # valeur si personne ne change rien
    values:                       # choix proposés (liste déroulante)
      - normal
      - deblocage

steps:
  - script: python robot.py
    displayName: Lancer le robot
  - ${{ if eq(parameters.mode, 'deblocage') }}:
      - script: python robot.py --fenetre-visible
        displayName: Relancer avec fenêtre visible
```

La ligne `${{ if eq(parameters.mode, 'deblocage') }}:` est une **expression de modèle** ([Template expressions](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/template-expressions)) : elle est évaluée à la **compilation** du fichier, c'est-à-dire au moment où Azure DevOps transforme le YAML en liste de jobs, avant que le moindre step ne s'exécute. Si la condition est fausse, le step n'existe tout simplement pas dans le run.

| Syntaxe | Évaluée | Connaît |
|---|---|---|
| `${{ parameters.mode }}` | À la compilation, avant l'exécution | Les paramètres et les valeurs fixées dans le fichier |
| `$(nomVariable)` | Au moment où le step s'exécute | Aussi les variables calculées pendant le run |

> **Piège :** utiliser `${{ }}` avec une variable calculée pendant le run : à la compilation, elle n'existe pas encore, et l'expression vaut une chaîne vide.
>
> **Bonne pratique :** restreindre un paramètre texte à une liste `values`, pour qu'une faute de frappe au lancement soit impossible plutôt que de passer silencieusement dans la condition.

## Contrôle bloquant ou alerte non bloquante

Un step qui se termine avec un [code de sortie](/?c=langages&s=c&p=exit-et-codes-de-retour) différent de `0` fait échouer son job : le run devient rouge et les stages suivants ne s'exécutent pas. C'est le bon comportement pour un **contrôle bloquant** (tests qui échouent, déploiement impossible).

Pour signaler un problème sans tout arrêter, un script peut écrire des **commandes de journalisation** (*logging commands*), des lignes spéciales qu'Azure DevOps interprète au lieu de simplement les afficher ([Logging commands](https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands)) :

```powershell
# affiche un avertissement jaune dans le résumé du run, sans échec
Write-Host "##vso[task.logissue type=warning]3 pages n'ont pas pu être lues"
# termine le step en "réussi avec des problèmes" : le run devient orange
Write-Host "##vso[task.complete result=SucceededWithIssues;]"
```

| Situation | Mécanisme | Résultat du run |
|---|---|---|
| Problème qui doit tout arrêter | Code de sortie non nul | Rouge, stages suivants annulés |
| Problème à signaler, sans gravité | `task.logissue type=warning` | Vert, avec un avertissement visible |
| Résultat partiel à surveiller | `task.complete result=SucceededWithIssues` | Orange (« partiellement réussi ») |

> **Piège :** faire échouer tout le pipeline pour un incident mineur (quelques pages illisibles) : les vraies alertes critiques se noient alors dans des échecs habituels que plus personne ne regarde.
>
> **Bonne pratique :** réserver l'échec aux situations qui exigent une action immédiate, et distinguer dans les messages « résultat vide légitime » et « échec de lecture ».

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipeline Azure s'organise en stages, contenant des jobs, contenant des steps exécutés dans l'ordre. `trigger` définit quand il se lance, `pool` dans quel groupe d'agents, `steps`/`task` les actions à exécuter. `parameters` propose des choix au lancement, évalués à la compilation par `${{ }}`. Un groupe de variables ou un Environment jamais utilisé par un pipeline donné exige un Permit explicite (accessible seulement à un administrateur de la ressource) ; un Environment peut en plus porter un check d'approbation humaine. |
| **Outils utilisables** | Les tasks officielles (`PublishBuildArtifacts@1` et bien d'autres) pour des actions courantes, sans réécrire leur logique à la main. Les Environments pour porter des checks d'approbation sur un déploiement sensible. Les commandes de journalisation (`##vso[task.logissue]`, `##vso[task.complete]`) pour une alerte non bloquante. |
| **Pièges à éviter** | Omettre `trigger` et laisser un comportement implicite décider quand le pipeline se lance. Écrire un secret en clair dans le fichier YAML versionné. Confondre un blocage Permit (autorisation d'accès) avec un blocage par check d'approbation (validation humaine à chaque déploiement). Utiliser `${{ }}` avec une variable calculée pendant le run. Faire échouer tout le pipeline pour un incident mineur. |
| **Bonnes pratiques** | Déclarer `trigger` explicitement. Stocker les secrets dans un groupe de variables dédié et les référencer par leur nom, jamais en clair. Cocher "pour ce run et les runs futurs" au premier Permit d'un pipeline stable. Réserver les checks d'approbation aux Environments à fort enjeu. Restreindre un paramètre texte à une liste `values`. Réserver l'échec du pipeline aux situations qui exigent une action immédiate. |
