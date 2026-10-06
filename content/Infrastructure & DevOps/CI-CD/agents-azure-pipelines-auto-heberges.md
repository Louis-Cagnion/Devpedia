---
order: 5
---

# Les agents Azure Pipelines auto-hébergés

Un [pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) décrit **quoi** faire (compiler, tester, déployer), mais il faut une machine pour le faire. Dans Azure Pipelines, cette machine fait tourner un petit programme, l'**agent** : il demande au serveur s'il y a du travail, l'exécute, puis rend les journaux et le résultat. Ce chapitre explique comment installer et faire tourner **votre propre** agent sur une machine Windows.

| Notion | En une phrase |
|---|---|
| Agent | Le programme qui exécute les étapes d'un pipeline sur une machine |
| Pool d'agents | Un groupe d'agents ; le pipeline désigne un pool (`pool:`), pas un agent précis |
| Job | Un ensemble d'étapes confié à un seul agent du pool |
| Agent auto-hébergé | Un agent installé sur **votre** machine, que vous administrez |
| Jeton d'accès personnel (PAT) | Un mot de passe à portée limitée, ici pour enregistrer l'agent |
| Mode service ou interactif | L'agent tourne comme un service Windows, ou comme un programme dans une session ouverte |

## Agent de Microsoft ou agent auto-hébergé

| | Agent hébergé par Microsoft | Agent auto-hébergé |
|---|---|---|
| Où il tourne | Chez Microsoft, machine recréée pour chaque pipeline | Sur votre machine |
| État entre deux exécutions | Rien ne reste : l'agent est détruit à la fin | Les caches, dossiers et outils restent : les builds incrémentaux sont plus rapides |
| Logiciels installés | Ceux de l'image choisie | Tout ce que vous y installez (et que vous devez maintenir) |
| Accès à un réseau interne | Pas directement | Oui, selon où se trouve la machine |
| Entretien | Aucun | Mises à jour, droits, disque, sécurité : c'est à vous |

Un agent auto-hébergé se justifie quand le travail a besoin d'un logiciel ou d'un accès que l'agent de Microsoft n'a pas (un réseau interne, un navigateur avec une vraie session, du matériel particulier), ou quand les caches persistants comptent. Dans le doute, essayez d'abord l'agent hébergé par Microsoft, plus simple (voir [Azure Pipelines et GitHub Actions](/?c=infrastructure-devops&s=ci-cd&p=azure-pipelines-vs-github-actions) pour le vocabulaire `pool` et `runs-on`).

## Comment l'agent parle au serveur

L'agent **initie toujours** la communication : il interroge le serveur en HTTPS, il ne reçoit jamais d'appel entrant. Il n'y a donc **aucun port à ouvrir** vers l'agent, seulement la sortie vers Internet.

```
   votre machine                               Azure DevOps (serveur)
  +--------------+   1. enregistrement (PAT)  +----------------------+
  |    agent     | -------------------------> |   pool d'agents      |
  |              |   2. « du travail ? »      |                      |
  |              | <------------------------> |   file des jobs      |
  |              |   (requête longue, HTTPS)  |                      |
  |              |   3. job + jeton court     |                      |
  |              | <------------------------- |                      |
  |   exécute    |   4. journaux, résultat    |                      |
  |              | -------------------------> |                      |
  +--------------+                            +----------------------+
```

| Étape | Ce qui se passe |
|---|---|
| Enregistrement | Une personne autorisée ajoute l'agent au pool ; ses droits ne sont **pas** conservés par l'agent |
| Écoute | L'agent télécharge un jeton d'écoute et interroge la file des jobs par une requête HTTP « longue » (la connexion reste ouverte jusqu'à ce qu'il y ait du travail) |
| Job | L'agent reçoit le travail et un **jeton propre à ce job**, de courte durée |
| Fin | Le jeton du job est jeté ; l'agent revient à l'écoute |

## S'enregistrer avec un PAT

Un **jeton d'accès personnel** (*PAT*, *Personal Access Token*) est un mot de passe de remplacement, à portée limitée et à date d'expiration, créé dans les paramètres de votre compte (voir [GitHub et les plateformes](/?c=git&p=github-et-plateformes) pour le même mécanisme côté GitHub). Pour enregistrer un agent :

| Point | Valeur |
|---|---|
| Où le créer | Azure DevOps > paramètres de l'utilisateur > **Personal access tokens** |
| Portée (*scope*) à cocher | **Agent Pools (read, manage)**, et **rien d'autre** (« Show all scopes » pour voir la liste complète) |
| Qui | Un compte membre du rôle d'**administrateur du pool** (ou propriétaire de l'organisation) |
| Quand il sert | **Uniquement à l'enregistrement** : après, l'agent communique avec ses propres jetons |
| Combien d'agents | Un seul PAT peut enregistrer plusieurs agents |

Conséquences pratiques : un PAT expiré ou supprimé **n'arrête pas** un agent déjà enregistré (il en faut un nouveau seulement pour enregistrer ou retirer un agent). Et le compte Windows qui **exécute** l'agent doit être différent de la personne qui l'a enregistré : la documentation recommande des identités séparées, et le dossier de l'agent contient des secrets (journaux, identifiants de travail) à ne montrer qu'aux administrateurs et au compte qui lance l'agent.

## Installer et configurer à la main

Prérequis : Windows 10 ou 11, ou Windows Server 2012 ou plus récent, et PowerShell 3.0 ou plus (l'agent apporte sa propre version de .NET). À faire une première fois à la main pour voir comment ça marche :

| Étape | Détail |
|---|---|
| 1. Télécharger | Azure DevOps > Organization settings > **Agent pools** > pool **Default** > onglet **Agents** > **New agent** > Windows ; choisir x64 pour un Windows 64 bits |
| 2. Dézipper | Dans un dossier **sans espace** dans le chemin, par exemple `C:\agents` (pas dans le dossier Téléchargements : problèmes de droits) |
| 3. Protéger le dossier | Modifiable par les seuls administrateurs |
| 4. Ouvrir PowerShell **en administrateur** | Obligatoire pour installer un service. Pas PowerShell ISE, pas de terminal mintty comme git-bash |
| 5. Configurer | `config.cmd` pose des questions (URL, type d'authentification, jeton, pool, nom de l'agent, dossier de travail, mode) |

```
cd C:\agents
.\config.cmd
```

| Question de `config.cmd` | Réponse |
|---|---|
| URL du serveur | `https://dev.azure.com/{votre-organisation}` |
| Type d'authentification | `PAT`, puis le jeton créé plus haut |
| Pool | `Default` ou le pool voulu |
| Nom de l'agent | Un nom **unique** dans le pool |
| Dossier de travail | `_work` par défaut, dans le dossier de l'agent |
| Mode | Service ou interactif (section suivante) |

En mode interactif, on lance ensuite l'agent avec `.\run.cmd` (Ctrl+C pour l'arrêter). `.\run.cmd --once` accepte **un seul** job puis s'arrête proprement. L'agent apparaît dans le pool, avec son état (en ligne, hors ligne).

## Service ou interactif

| | Service Windows | Interactif avec ouverture automatique de session |
|---|---|---|
| Démarrage | Automatique au démarrage de la machine, sans session ouverte | Au démarrage, **après** l'ouverture automatique de la session du compte choisi |
| Géré par | Le gestionnaire de services (`services.msc`) | Un programme dans une session visible (`run.cmd`) |
| Mises à jour de l'agent | Meilleure expérience | Possible |
| Cas d'usage | Le défaut : compilations, tests sans fenêtre, déploiements | Quand le travail a besoin d'un **bureau** : tests d'interface, navigateur avec fenêtre réelle |
| Compte | Network Service ou Local Service recommandés (droits réduits, mot de passe sans expiration) ; en mode service, nom d'utilisateur de 20 caractères maximum | Un compte dédié dont le mot de passe est enregistré pour l'autologon |
| Risque | Aucun écran à protéger | Session ouverte en permanence ; économiseur d'écran désactivé |

Pourquoi deux modes ? Un service Windows tourne dans la **Session 0**, isolée du bureau (voir [Windows : services, sessions et droits](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) : il ne peut pas ouvrir de fenêtre visible. Un test qui pilote un navigateur ou une application graphique a besoin d'une vraie session : c'est le rôle du mode interactif. L'agent y est lancé au démarrage par l'**autologon** (le mot de passe est conservé dans les [secrets LSA](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)).

**Comment savoir dans quel mode tourne un agent ?** Azure DevOps > Organization settings > **Agent pools** > le pool > l'agent > onglet **Capabilities** : la capacité système `InteractiveSession` (une information que l'agent publie sur lui-même, voir « Capacités, exigences et diagnostic » plus bas) vaut `True` en mode interactif et `False` en mode service. Constaté sur un agent réel : un robot qui pilote Chrome ne peut pas ouvrir de fenêtre tant que l'agent est en mode service (`InteractiveSession = False`). Il reste alors le mode **sans fenêtre** (*headless*), que certains sites protégés contre les robots détectent et bloquent : passer en mode interactif est une décision d'infrastructure (autologon, compte dédié), pas un réglage du code.

| Piège du mode interactif | Pourquoi | Parade |
|---|---|---|
| Fermer une session Bureau à distance verrouille la machine | Les tests d'interface en cours échouent | Rendre la session à l'écran physique avec `tscon` (voir [Windows : accès à distance](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)) |
| Compte d'autologon trop puissant | Tout administrateur de la machine peut en extraire le mot de passe | Compte **dédié, local, au minimum de droits** et machine verrouillée physiquement |
| Politique de domaine | Elle peut interdire l'autologon ou l'économiseur d'écran désactivé | Demander une exception, ou utiliser une machine hors domaine |

## Configurer sans répondre aux questions

Pour installer sans personne devant l'écran (script, plusieurs machines), on passe `--unattended` **et** les réponses à toutes les questions. Dans une fenêtre PowerShell administrateur, dans le dossier de l'agent :

```
# agent en mode service, compte intégré Network Service (aucun mot de passe nécessaire)
.\config.cmd --unattended `
    --url https://dev.azure.com/mon-organisation `
    --auth pat --token <jeton> `
    --pool Default --agent agent-build-01 `
    --runAsService --windowsLogonAccount "NT AUTHORITY\NETWORK SERVICE"
```

```
# agent interactif, lancé par l'autologon d'un compte dédié
.\config.cmd --unattended `
    --url https://dev.azure.com/mon-organisation `
    --auth pat --token <jeton> `
    --pool Default --agent agent-ui-01 `
    --runAsAutoLogon --windowsLogonAccount "MACHINE\agent-ui" `
    --windowsLogonPassword <mot-de-passe> --overwriteAutoLogon
```

(L'accent grave `` ` `` en fin de ligne est le caractère de continuation de PowerShell : la commande continue sur la ligne suivante.)

| Option | Rôle |
|---|---|
| `--unattended` | Aucune question : tout doit être donné en options |
| `--url` | L'adresse de l'organisation |
| `--auth pat` / `--token` | Authentification par jeton (aussi `SP`, `negotiate`, `alt`, `integrated`) |
| `--pool`, `--agent` | Le pool à rejoindre et le nom de l'agent |
| `--replace` | Remplacer un agent du pool qui porte le même nom |
| `--work` | Dossier de travail (propre à **cet** agent) |
| `--runAsService` | Installer l'agent comme service Windows (droits administrateur requis) |
| `--runAsAutoLogon` | Configurer l'autologon et lancer l'agent au démarrage (droits administrateur requis) |
| `--windowsLogonAccount` | Compte qui exécute l'agent (`domaine\utilisateur`), avec `--runAsService` ou `--runAsAutoLogon` |
| `--windowsLogonPassword` | Son mot de passe (inutile pour les comptes intégrés comme `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Remplacer l'autologon déjà configuré sur la machine |
| `--noRestart` | Ne pas redémarrer la machine à la fin de la configuration d'un autologon |

Toute option peut aussi être donnée par une **variable d'environnement** : son nom en majuscules précédé de `VSTS_AGENT_INPUT_` (par exemple `VSTS_AGENT_INPUT_PASSWORD` pour `--password`). C'est préférable pour un secret : un jeton ou un mot de passe écrit dans la ligne de commande reste dans l'historique du terminal et peut être lu par d'autres programmes pendant son exécution. `.\config.cmd --help` liste toujours les options de **votre** version.

## Plusieurs agents sur une même machine

C'est possible, mais la documentation recommande **un seul agent par machine** : deux agents partagent le processeur, le disque et les outils installés, ce qui peut dégrader les performances et les résultats.

| Règle | Pourquoi |
|---|---|
| Un **dossier par agent** (`C:\agents\a1`, `C:\agents\a2`), `config.cmd` lancé depuis chacun | Chaque agent a sa propre configuration |
| Un **nom unique** par agent (`--agent`) | Deux agents de même nom se disputent la place dans le pool : l'un finit par s'arrêter |
| Un **dossier de travail par agent** (`--work`) | Le dossier de travail appartient à un agent et ne se partage pas |
| Éviter si les jobs sont lourds en disque ou en entrées-sorties | Aucun gain d'efficacité |
| Attention aux outils « uniques » (par exemple des paquets npm partagés) | Un job peut mettre à jour une dépendance pendant qu'un autre l'utilise : résultats instables |
| L'autologon est un réglage de **la machine** | Un seul compte s'ouvre automatiquement ; `--overwriteAutoLogon` remplace celui qui existe |
| **Plusieurs jobs en parallèle** : deux agents dans le même pool | Chaque agent exécute un seul job à la fois |
| **Deux usages séparés** (robot, déploiement) : un pool par usage | Le pipeline désigne un pool ; chaque pool a ses propres agents |
| Ne jamais copier le dossier d'un agent déjà configuré | Les deux partageraient identifiants et nom : l'un se coupe après quelques minutes de conflit. Décompresser une archive neuve pour chaque agent |

## Entretien : retirer, remplacer, reconfigurer

| Besoin | Commande |
|---|---|
| Retirer l'agent | `.\config.cmd remove` (avec `--auth PAT --token <jeton>` en mode sans question) |
| Remplacer un agent de même nom | Reconfigurer avec le même nom et répondre `Y` (ou `--replace`), **puis** retirer l'ancien : sinon, au bout de quelques minutes de conflit, l'un des deux s'arrête |
| Changer le compte d'un service | Reconfigurer l'agent ; **pas** depuis la console des services |
| Un autologon qui ne démarre plus l'agent | Retirer l'agent, vérifier qu'il a disparu du pool, reconfigurer dans un dossier fraîchement dézippé |
| Supprimer le dossier d'un agent | Seulement **après** `config.cmd remove` : sinon l'agent reste listé (hors ligne) dans le pool |
| Mise à jour de l'agent | Automatique : l'agent se met à jour quand un job exige une version plus récente |
| Disque qui se remplit | Nettoyer `_work` à chaque job avec `workspace: clean: all` dans le YAML du job |
| État d'un agent en mode service | `services.msc`, entrée « Azure Pipelines Agent » (ou `vstsagent.…`) |

## Capacités, exigences et diagnostic

Chaque agent annonce ses **capacités** (*capabilities*) : nom de la machine, système, versions de certains logiciels, variables d'environnement. Un pipeline déclare ses **exigences** (*demands*) et le serveur n'envoie le job qu'aux agents compatibles.

```yaml
pool:
  name: Default          # le pool, pas un agent précis
  demands:
  - npm                  # seuls les agents où npm est installé sont candidats
```

| Point | À savoir |
|---|---|
| Après avoir installé un logiciel | **Redémarrer l'agent** pour que la nouvelle capacité apparaisse |
| Variables d'environnement | Elles deviennent des capacités ; `VSO_AGENT_IGNORE` (liste de noms séparés par des virgules) permet d'en exclure. **Leur valeur s'affiche en clair** dans l'onglet Capabilities, lisible par quiconque a accès en lecture au pool : jamais de secret dans une variable d'environnement de la machine de l'agent |
| Variables propres à un agent | Un fichier `.env` à la racine de l'agent, une ligne `NOM=valeur` par variable, puis redémarrer |
| Un agent qui ne démarre pas | `.\run --diagnostics` lance une série de contrôles |
| Pare-feu | Autoriser la **sortie** vers `dev.azure.com`, `*.dev.azure.com`, `login.microsoftonline.com` et `download.agent.dev.azure.com` (liste complète dans la documentation) |

> **Limite de vérification :** ces commandes Windows n'ont pas pu être exécutées ici. Leur syntaxe et leurs options ont été vérifiées dans la documentation Microsoft : [agent Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent), [agents](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents) et [enregistrement par PAT](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/personal-access-token-agent-registration).

## Sécurité : l'agent exécute le code du dépôt

Un agent exécute les commandes du pipeline avec les droits du compte qui le fait tourner. Qui peut modifier `azure-pipelines.yml` (ou un script qu'il appelle) peut donc exécuter du code sur votre machine : Microsoft le dit explicitement, l'agent est conçu pour exécuter du code téléchargé, donc c'est une cible possible d'exécution de code à distance.

| Risque | Parade |
|---|---|
| Un job lit les secrets du dossier de l'agent (identifiants, journaux) | Dossier accessible seulement aux administrateurs et au compte de l'agent |
| Un compte trop puissant (administrateur, compte du domaine) fait tourner l'agent | Compte local dédié, au minimum de droits (principe de [moindre privilège](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Un pipeline non fiable utilise l'agent d'un autre projet | Un pool distinct par niveau de confiance, droits d'usage du pool restreints |
| Un dépôt dont n'importe quel contributeur peut proposer une modification de pipeline est branché sur un agent qui voit le réseau interne | Relecture obligatoire avant toute modification d'un pipeline qui utilise un agent auto-hébergé ; agents du réseau interne hors de portée des dépôts non maîtrisés |

## Les pièges

| Piège | Ce qui arrive | Parade |
|---|---|---|
| PAT avec trop de portées | Un jeton volé donne bien plus que l'enregistrement d'un agent | Cocher **Agent Pools (read, manage)** seulement |
| Jeton ou mot de passe dans la ligne de commande | Il reste dans l'historique du terminal | Variables `VSTS_AGENT_INPUT_...`, jamais dans un fichier versionné |
| Dossier de l'agent lisible par tous | Journaux et secrets de travail exposés | Dossier réservé aux administrateurs et au compte de l'agent |
| Dossier avec des espaces | Des outils et scripts échappent mal les espaces | Un chemin comme `C:\agents` |
| Configurer depuis PowerShell ISE, git-bash ou sans élévation | Installation du service impossible ou configuration incorrecte | PowerShell **administrateur** |
| Compte d'autologon personnel | Quiconque a accès à la machine l'utilise | Compte dédié, local, minimal |
| Deux agents du même nom | Conflit, l'un s'arrête | Un nom unique par agent, `--replace` puis retrait de l'ancien |
| Logiciel installé sans redémarrer l'agent | Le job reste « en attente d'un agent compatible » | Redémarrer l'agent |
| PAT sans date d'expiration | Le jeton reste valable alors que l'agent n'en a plus besoin | Expiration courte, révocation une fois l'agent enregistré |
| Dossier d'agent copié | Mêmes identifiants et même nom : l'un des deux se coupe | Une archive neuve par agent |
| Dossier supprimé sans `config.cmd remove` | L'agent reste listé (hors ligne) dans le pool | Le retirer proprement d'abord |
| Un agent qui exécute du code venu de dépôts | C'est un programme fait pour exécuter du code téléchargé : cible d'exécution à distance | Droits minimaux, machine isolée, contrôle de qui écrit dans le pipeline |
| Un secret dans une variable d'environnement de la machine (par exemple `SFTP_PASSWORD`) | Elle devient une capacité de l'agent, affichée en clair à tous les lecteurs du pool, même si le pipeline concerné ne s'en sert pas : un agent partagé entre plusieurs flux expose les secrets de chacun | Secret dans un groupe de variables secret du pipeline (ou un coffre-fort), variable de machine supprimée, mot de passe changé s'il a été exposé |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un agent exécute les jobs d'un pipeline sur une machine ; il interroge le serveur en HTTPS (aucun port entrant). Un PAT à la portée **Agent Pools (read, manage)** ne sert qu'à l'enregistrement. Mode **service** par défaut ; mode **interactif avec autologon** seulement si le job a besoin d'un bureau. `config.cmd --unattended` automatise tout ; un agent par dossier, un nom unique, un dossier de travail propre. |
| **Outils utilisables** | `config.cmd` (avec `--unattended`, `--runAsService`, `--runAsAutoLogon`, `--replace`, `--overwriteAutoLogon`, `--noRestart`), `run.cmd` et `run.cmd --once`, `config.cmd remove`, `services.msc`, `.\run --diagnostics`, les `demands` du pipeline, `tscon` pour rendre une session distante à l'écran, `workspace: clean: all` pour nettoyer le dossier de travail. |
| **Pièges à éviter** | PAT trop large, secret dans la ligne de commande, dossier de l'agent lisible par tous, chemin avec espaces, PowerShell sans élévation, compte d'autologon personnel, deux agents au même nom, outil installé sans redémarrer l'agent, PAT sans expiration, dossier d'agent copié, dossier supprimé sans `config.cmd remove`, secret dans une variable d'environnement de la machine (affichée en clair dans les capacités). |
| **Bonnes pratiques** | Essayer d'abord un agent hébergé par Microsoft ; un compte d'exécution dédié et différent de celui qui enregistre ; secrets par variables d'environnement ; un agent par machine sauf besoin précis ; vérifier `.\config.cmd --help` pour la version installée; PAT à expiration courte, révoqué après l'enregistrement ; relecture obligatoire des modifications de pipeline ; un pool par niveau de confiance. |
