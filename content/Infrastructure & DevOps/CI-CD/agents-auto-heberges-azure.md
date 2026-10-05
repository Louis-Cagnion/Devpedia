---
order: 5
---

# Les agents Azure DevOps auto-hébergés

Un pipeline Azure DevOps (voir [la syntaxe YAML des pipelines](/?c=ci-cd&p=yaml-pipelines-azure)) ne s'exécute pas « dans Azure DevOps » : il est exécuté par un petit programme installé sur une machine, l'**agent**. Ce chapitre explique comment installer ce programme sur une machine que vous gérez (un **agent auto-hébergé**), le lancer, et ce que cela change pour la sécurité.

## Agent, pool, job : qui exécute quoi

| Terme | Ce que c'est |
|---|---|
| **Agent** | Programme installé sur une machine, qui attend du travail, l'exécute et renvoie les journaux |
| **Pool** | Liste d'agents portant un nom ; un pipeline demande un pool, pas une machine précise |
| **Job** | Ensemble de steps confié à un seul agent du pool ([hiérarchie d'un pipeline](/?c=ci-cd&p=yaml-pipelines-azure)) |

```text
Azure DevOps (service en ligne)            Votre machine
┌──────────────────────────┐               ┌────────────────────────┐
│ Pipeline lancé           │               │ Agent                  │
│ Pool « Robots » : 1 job  │ <──────────── │ demande : « du travail │
│ en attente               │  connexion    │ pour moi ? »           │
└──────────────────────────┘  sortante     └────────────────────────┘
                              (HTTPS)
```

C'est l'agent qui contacte Azure DevOps, jamais l'inverse : aucun port n'est à ouvrir vers l'extérieur sur votre machine, il suffit qu'elle puisse joindre `dev.azure.com` en HTTPS ([communication de l'agent](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#communication)).

## Agent Microsoft ou auto-hébergé

| | Agent fourni par Microsoft | Agent auto-hébergé |
|---|---|---|
| Machine | Machine virtuelle neuve à chaque job, détruite après | La vôtre, qui reste en place |
| Installation des outils | Déjà faite par Microsoft (liste fixe) | À vous (outils, versions, licences) |
| Accès au réseau interne | Non | Oui (base de données interne, serveur de déploiement) |
| Fenêtre visible, matériel particulier | Non | Oui (écran, carte graphique, périphérique) |
| Entretien et sécurité | Microsoft | Vous |

On choisit un agent auto-hébergé quand le job a besoin de ce que l'agent Microsoft ne peut pas offrir : atteindre un serveur interne, utiliser un outil sous licence, ou piloter une interface graphique (un robot qui contrôle un navigateur avec une vraie fenêtre, par exemple).

## Installer et enregistrer un agent

Étapes, sur la machine cible ([documentation Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent)) :

1. Dans Azure DevOps, ouvrir *Organization settings* > *Agent pools*, choisir le pool, puis *New agent* : le site donne le lien de téléchargement d'une archive.
2. Décompresser l'archive dans un dossier **sans espace** dans son chemin, par exemple `C:\agents\robot-1`.
3. Dans une console PowerShell lancée **en administrateur**, aller dans ce dossier et lancer `.\config.cmd` : le programme pose des questions (adresse de l'organisation, pool, nom de l'agent, mode de démarrage).
4. Pour l'authentification, `config.cmd` demande un **jeton d'accès personnel** (*Personal Access Token*, ou PAT : un mot de passe généré, limité à certaines actions et à une durée, déjà défini dans [GitHub et les plateformes](/?c=git&p=github-et-plateformes)). Son *scope* (périmètre) doit être *Agent Pools (Read & manage)*.

Le PAT ne sert **qu'à l'enregistrement** : une fois l'agent inscrit dans le pool, il utilise ses propres identifiants, stockés dans son dossier. Le compte qui enregistre l'agent doit être administrateur du pool ; le compte qui le fait tourner, non.

> **Piège :** créer un PAT sans date d'expiration, ou avec des droits larges (« Full access »), puis l'oublier : le jeton reste valable alors que l'agent n'en a plus besoin.
>
> **Bonne pratique :** un PAT limité au scope *Agent Pools (Read & manage)* et expirant sous quelques jours, révoqué dès l'agent enregistré.

## Mode service ou mode interactif

L'agent peut démarrer de deux façons, selon ce que ses jobs doivent faire ([interactif ou service](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#interactive-or-service)). Les notions de service et de session Windows sont détaillées dans [Windows : services, sessions et droits](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits).

| | Mode service | Mode interactif |
|---|---|---|
| Démarrage | Par Windows, au démarrage de la machine | Au lancement de `run.cmd` dans une session ouverte |
| Utilisateur connecté nécessaire | Non | Oui (une session doit être ouverte) |
| Session | Session 0, sans écran | Session de l'utilisateur, avec bureau |
| Fenêtres des jobs | Invisibles | Visibles |
| Redémarrage de la machine | L'agent revient seul | L'agent revient seulement si une session s'ouvre toute seule (autologon) |
| Option de `config.cmd` | `--runAsService` | `--runAsAutoLogon` (ou aucune option, puis `run.cmd` à la main) |

> **Règle de choix :** par défaut, mode service (c'est celui que Microsoft recommande). Mode interactif seulement si un job a besoin d'une fenêtre réelle (test d'interface, robot qui pilote un navigateur visible).

Avec `--runAsAutoLogon`, `config.cmd` configure l'ouverture automatique de session (le mécanisme *autologon* et ses risques sont décrits dans [le chapitre Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) et inscrit l'agent pour démarrer à l'ouverture de cette session. Par défaut, la machine redémarre à la fin de la configuration.

> **Piège :** un agent en mode interactif dépend de sa session. Si la session est fermée, ou si quelqu'un s'y connecte à distance et la déplace (voir [l'accès à distance à Windows](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)), les jobs graphiques échouent ou produisent des images noires, et l'agent apparaît « hors ligne » si la console est fermée.
>
> **Bonne pratique :** réserver une machine (ou une machine virtuelle) à l'agent interactif, avec un compte dédié, et ne jamais s'y connecter avec ce même compte.

## Configurer sans intervention

Pour installer plusieurs agents, ou refaire la configuration à l'identique, `config.cmd` accepte toutes ses réponses en options (`--unattended` : aucune question posée) :

```powershell
cd C:\agents\robot-1
.\config.cmd --unattended `
  --url https://dev.azure.com/mon-organisation `
  --auth pat `
  --token $env:AGENT_PAT `
  --pool Robots `
  --agent robot-1 `
  --runAsAutoLogon `
  --windowsLogonAccount robot-1 `
  --overwriteAutoLogon
```

| Option | Rôle |
|---|---|
| `--url` | Adresse de l'organisation Azure DevOps |
| `--auth pat`, `--token` | Type d'authentification et jeton (utilisé uniquement à l'enregistrement) |
| `--pool`, `--agent` | Pool à rejoindre, et nom de l'agent (unique dans le pool) |
| `--runAsService` ou `--runAsAutoLogon` | Mode de démarrage (voir la section précédente) |
| `--windowsLogonAccount`, `--windowsLogonPassword` | Compte Windows qui fait tourner l'agent, et son mot de passe (inutile pour un compte intégré comme `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Remplace un autologon déjà configuré sur la machine |
| `--noRestart` | Évite le redémarrage de la machine après un `--runAsAutoLogon` |
| `--replace` | Remplace un agent de même nom déjà inscrit dans le pool |

Chaque option peut aussi être donnée par une variable d'environnement : son nom en majuscules, précédé de `VSTS_AGENT_INPUT_` (par exemple `VSTS_AGENT_INPUT_TOKEN` pour `--token`) ([configuration sans intervention](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

> **Piège :** écrire `--token` ou `--windowsLogonPassword` en clair dans la commande : la ligne reste dans l'historique de la console (fichier d'historique de PowerShell), dans les scripts d'installation versionnés, et elle est lisible dans la liste des processus pendant son exécution.
>
> **Bonne pratique :** laisser `config.cmd` poser ses questions, ou lire le secret depuis une variable d'environnement renseignée à partir d'un gestionnaire de secrets (voir [la gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)), puis effacer la variable.

## Plusieurs agents sur une même machine

Une machine peut héberger plusieurs agents, à condition que **chacun ait son propre dossier** : chaque dossier contient la configuration de l'agent, ses identifiants et son dossier de travail `_work`, qui ne doit jamais être partagé ([options de configuration](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

```text
C:\agents\
├── robot-1\   (agent « robot-1 », pool Robots, son _work)
├── robot-2\   (agent « robot-2 », pool Robots, son _work)
└── deploy-1\  (agent « deploy-1 », pool Deploiement, son _work)
```

| Besoin | Solution |
|---|---|
| Deux jobs en parallèle | Deux agents dans le même pool |
| Séparer deux usages (robot / déploiement) | Deux pools, chacun avec ses agents |
| Deux agents avec des droits différents | Deux comptes Windows, un par agent |

> **Piège :** copier un dossier d'agent déjà configuré pour en créer un deuxième : les deux partagent les mêmes identifiants et le même nom, et l'un des deux se coupe après quelques minutes de conflit.
>
> **Bonne pratique :** décompresser une archive neuve pour chaque agent, avec un nom unique.

## Choisir son pool depuis le YAML

Le pipeline désigne le pool par son nom (en remplacement de `vmImage`, qui vise les agents Microsoft). Un job peut en plus exiger une **capacité** de l'agent (*demand*) : chaque agent annonce ce qui est installé sur sa machine (système, outils) et Azure DevOps ne lui confie que les jobs compatibles ([capacités](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#capabilities)).

```yaml
jobs:
  - job: Robot
    pool:
      name: Robots
      demands:
        - Agent.OS -equals Windows_NT
    workspace:
      clean: all
    steps:
      - script: python robot.py
```

> **Piège :** installer un outil sur la machine après le démarrage de l'agent : sa liste de capacités ne se met à jour qu'au redémarrage de l'agent, et le job reste en attente avec « no agent found in pool ».
>
> **Bonne pratique :** redémarrer l'agent après toute installation d'outil ; en cas d'attente inexpliquée, comparer les `demands` du job avec l'onglet *Capabilities* de l'agent.

## Sécurité : l'agent exécute le code du dépôt

Un agent exécute les commandes écrites dans le pipeline avec les droits du compte qui le fait tourner. Qui peut modifier le fichier `azure-pipelines.yml` (ou un script qu'il appelle) peut donc exécuter du code sur votre machine ; Microsoft le dit explicitement : l'agent est conçu pour exécuter du code téléchargé, donc une cible possible d'exécution de code à distance.

| Risque | Parade |
|---|---|
| Un job lit les secrets du dossier de l'agent (identifiants, journaux) | Dossier de l'agent accessible seulement aux administrateurs et au compte de l'agent |
| Un compte trop puissant (administrateur, compte du domaine) fait tourner l'agent | Compte local dédié, au minimum de droits (principe de [moindre privilège](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Un pipeline non fiable utilise l'agent d'un autre projet | Un pool distinct par niveau de confiance, avec les droits d'usage du pool restreints |
| Le compte qui enregistre l'agent est aussi celui qui l'exécute | Deux comptes distincts |

> **Piège :** brancher sur un agent auto-hébergé, qui a accès au réseau interne, un dépôt dont n'importe quel contributeur peut proposer une modification de pipeline : une simple demande de fusion suffit alors à exécuter du code dans votre réseau.
>
> **Bonne pratique :** exiger une relecture avant toute modification d'un pipeline qui utilise un agent auto-hébergé, et garder les agents qui ont accès au réseau interne hors de portée des dépôts non maîtrisés.

## Entretien

| Tâche | Comment |
|---|---|
| Mise à jour de l'agent | Automatique : l'agent se met à jour quand un job exige une version plus récente |
| Disque qui se remplit | Dossier `_work` nettoyé à chaque job par `workspace: clean: all` (voir le YAML ci-dessus) |
| Voir l'état d'un agent en mode service | `services.msc`, entrée « Azure Pipelines Agent » (ou « vstsagent.… ») |
| Diagnostiquer un agent | `.\run.cmd --diagnostics` |
| Retirer un agent | `.\config.cmd remove`, puis vérifier qu'il a disparu du pool |

> **Piège :** supprimer le dossier d'un agent sans lancer `config.cmd remove` : l'agent reste listé dans le pool (hors ligne) et brouille la lecture de l'état du pool.
>
> **Bonne pratique :** toujours retirer l'agent proprement avant de supprimer son dossier ou de réinstaller la machine.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipeline est exécuté par un **agent**, programme installé sur une machine et regroupé dans un **pool**. L'agent contacte Azure DevOps (connexion sortante) ; un PAT ne sert qu'à l'enregistrer. Mode service par défaut (démarre avec la machine, sans fenêtre visible) ; mode interactif (autologon) seulement si un job exige une vraie fenêtre. Un agent par dossier, avec un nom unique. |
| **Outils utilisables** | `config.cmd` (configuration, avec `--unattended` pour l'automatiser), `run.cmd` (lancement interactif, `--diagnostics`), `services.msc` (état du service), `demands` du YAML pour cibler une capacité, `workspace: clean: all` pour nettoyer le dossier de travail. |
| **Pièges à éviter** | PAT sans expiration ou aux droits larges. Secret écrit en clair dans la ligne de commande. Agent interactif dont la session est fermée ou déplacée. Dossier d'agent copié tel quel. Compte d'agent trop puissant. Dépôt non maîtrisé branché sur un agent qui voit le réseau interne. |
| **Bonnes pratiques** | PAT limité à *Agent Pools (Read & manage)*, expirant vite, révoqué après l'enregistrement. Compte local dédié au minimum de droits, distinct de celui qui enregistre. Un pool par niveau de confiance. Relecture obligatoire des modifications de pipeline. Retrait propre par `config.cmd remove`. |
