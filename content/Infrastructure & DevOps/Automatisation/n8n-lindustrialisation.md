---
order: 5
---

# n8n : l'industrialisation

Construire un workflow qui fonctionne est une chose ; le faire tourner de façon fiable en production, avec plusieurs personnes qui y contribuent, en est une autre. Ce chapitre couvre ce qui change entre "ça marche sur mon poste" et un déploiement industrialisé de n8n.

## Self-hosted ou n8n Cloud : reprendre la question avec plus de détail

Le chapitre sur l'[automatisation par workflow visuel](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) posait déjà la distinction SaaS/self-hosted. Pour n8n spécifiquement, chaque option déplace la responsabilité différemment :

| | n8n Cloud | Self-hosted |
|---|---|---|
| **Infrastructure** | Gérée entièrement par n8n | À la charge de l'utilisateur |
| **Mises à jour** | Automatiques, gérées par n8n | À appliquer soi-même |
| **Contrôle** | Limité à ce que propose la plateforme | Total sur la configuration et le déploiement |
| **Coût** | Abonnement payant (essai gratuit limité dans le temps) | Édition Community gratuite pour la majorité des fonctionnalités |

Aucune des deux n'est universellement meilleure : n8n Cloud retire la charge opérationnelle, le self-hosted retire la dépendance à un tiers et les coûts récurrents, au prix de la maintenance.

## Deux notions de « variable » à ne pas confondre

Le mot "variable" désigne deux mécanismes distincts dans n8n, avec des usages différents :

| | Variable d'environnement | Variable n8n (`$vars`) |
|---|---|---|
| **Configure quoi** | L'instance n8n elle-même (base de données, sécurité, ports) | Une valeur réutilisable à l'intérieur des workflows |
| **Définie où** | Au niveau du système d'exploitation/conteneur qui héberge n8n | Dans l'interface n8n (menu Variables) |
| **Utilisée comment** | Lue par n8n au démarrage | Référencée dans un workflow via `$vars.nomDeLaVariable` |
| **Exemple** | `NODES_EXCLUDE`, la configuration de la base de données | Une URL d'API qui change entre environnements |

> **Piège :** confondre les deux et chercher à définir une variable d'environnement système pour une valeur qui n'est en réalité utile qu'à l'intérieur d'un workflow (ou l'inverse). Les deux ont un cycle de vie et un mode de configuration différents.
>
> **Bonne pratique :** réserver les variables d'environnement à la configuration de l'instance elle-même, et les variables n8n (`$vars`) à toute valeur qu'un workflow doit pouvoir lire sans être codée en dur dans ses paramètres.

## Les credentials : propres à chaque instance

Comme vu dans le chapitre sur le [format JSON d'un workflow](/?c=infrastructure-devops&s=automatisation&p=n8n-le-format-json-dun-workflow), un export ne contient qu'une référence vers un credential, jamais le secret lui-même : chaque instance n8n (dev, staging, production) garde donc ses propres credentials, stockés et chiffrés séparément, à reconfigurer manuellement une fois un workflow importé sur une nouvelle instance.

## Environnements dev/prod : des instances séparées

n8n ne propose pas un seul instance avec un sélecteur "dev/prod" intégré : chaque environnement est une **instance n8n distincte**, avec ses propres credentials et son propre historique d'exécutions. Faire passer un workflow d'un environnement à l'autre se fait de deux façons :

| Méthode | Fonctionnement |
|---|---|
| **Export/import manuel** | Télécharger le JSON depuis l'instance source, l'importer sur l'instance cible (vu au chapitre précédent) |
| **Source Control ([Git](/?c=qualite-performance-et-outils&s=git&p=git))** | Une instance n8n se connecte à une branche d'un dépôt Git ; un même workflow versionné peut être poussé d'un environnement à l'autre en suivant le flux Git habituel (dev → staging → production) |

> **Piège :** pousser un changement directement en production sans passer par un environnement intermédiaire, en particulier pour un workflow qui touche des données réelles (une base de données de production, un envoi d'e-mail à de vrais clients).
>
> **Bonne pratique :** faire transiter tout changement par un environnement de dev/staging avant la production, comme pour n'importe quel déploiement de code.

## Supervision des exécutions

L'onglet **Executions** (accessible depuis la page d'accueil ou un workflow précis) liste toutes les exécutions passées, avec leur statut. Pour une exécution en échec, deux options de reprise existent : **"Retry with original workflow"** (rejoue l'exécution exactement telle qu'elle s'est produite, sans tenir compte d'une correction apportée depuis) et **"Retry with currently saved workflow"** (rejoue les mêmes données d'entrée, mais avec la version actuelle du workflow, après correction).

Un réglage complémentaire, **"Retry on Fail"**, disponible sur chaque nœud individuellement, relance automatiquement ce nœud un certain nombre de fois en cas d'échec, utile pour absorber une erreur transitoire (un service externe temporairement indisponible) sans intervention humaine.

Combiné à l'error workflow vu au [chapitre sur le catalogue des fonctionnalités](/?c=infrastructure-devops&s=automatisation&p=n8n-catalogue-des-fonctionnalites), ces mécanismes couvrent l'essentiel de la supervision d'un déploiement en production : être notifié d'un échec, comprendre pourquoi il a eu lieu, et le rejouer sans repartir de zéro.

## Sécurité de l'éditeur : restreindre les nœuds sensibles

Sur une instance self-hosted partagée par plusieurs personnes qui ne sont pas toutes également dignes de confiance, certains nœuds représentent un risque réel : le nœud **Execute Command**, par exemple, exécute une commande shell arbitraire sur le serveur qui héberge n8n. La variable d'environnement `NODES_EXCLUDE` retire un ou plusieurs nœuds de la liste de ceux utilisables sur l'instance :

```text
NODES_EXCLUDE=["n8n-nodes-base.executeCommand", "n8n-nodes-base.readWriteFile"]
```

Le nœud Execute Command est d'ailleurs **bloqué par défaut** sur une installation self-hosted récente, précisément pour cette raison ; il faut l'autoriser explicitement (`NODES_EXCLUDE=[]`) pour le rendre disponible.

> **Piège :** autoriser Execute Command (ou un nœud équivalent aussi puissant) sur une instance partagée sans avoir réfléchi à qui peut réellement y créer des workflows. Un nœud capable d'exécuter des commandes système donne, de fait, un accès équivalent à celui du serveur lui-même.
>
> **Bonne pratique :** garder les nœuds les plus sensibles bloqués par défaut, et ne les autoriser que pour un besoin identifié, sur une instance dont tous les utilisateurs sont de confiance équivalente à celle qu'on accorderait à un accès serveur direct.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | n8n Cloud et self-hosted déplacent la responsabilité de l'infrastructure différemment, sans option universellement meilleure. Les variables d'environnement configurent l'instance, les variables n8n (`$vars`) configurent des valeurs à l'intérieur des workflows. Les credentials restent propres à chaque instance. Les environnements dev/prod sont des instances n8n séparées, synchronisées par export/import ou Source Control Git. |
| **Outils utilisables** | L'onglet Executions et ses options de retry ; le réglage "Retry on Fail" par nœud ; la variable d'environnement `NODES_EXCLUDE` pour bloquer des nœuds sensibles comme Execute Command. |
| **Pièges à éviter** | Confondre variables d'environnement et variables n8n. Pousser un changement directement en production sans passer par un environnement intermédiaire. Autoriser un nœud puissant (Execute Command) sur une instance partagée sans réflexion sur la confiance accordée aux utilisateurs. |
| **Bonnes pratiques** | Réserver chaque type de variable à son usage propre. Faire transiter tout changement par dev/staging avant la production. Garder les nœuds sensibles bloqués par défaut, à n'autoriser que pour un besoin identifié. |
