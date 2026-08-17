---
order: 12
---

# MCP (Model Context Protocol) : standardiser les outils d'un agent

Le [function calling](/?c=ia&s=nlp-llm&p=agents) décrit *comment* un modèle appelle un outil (une description JSON, une décision du modèle, une exécution côté code), mais pas *comment* cet outil arrive jusqu'à l'application qui fait tourner le modèle. Sans convention commune, chaque application qui veut donner accès à un même service (par exemple GitHub) doit réécrire sa propre intégration : son propre code pour lister les dépôts, créer une issue, etc. **MCP** (*Model Context Protocol*) est un protocole standardisé qui règle ce second problème : exposer des outils une seule fois, de façon réutilisable par n'importe quelle application compatible.

> **Analogie :** avant l'USB, chaque périphérique (souris, imprimante, disque dur) avait son propre connecteur et nécessitait un pilote écrit sur mesure pour chaque ordinateur. USB a standardisé le connecteur et le protocole : un périphérique compatible USB fonctionne avec n'importe quel ordinateur compatible USB, sans intégration spécifique. MCP joue le même rôle entre un outil (GitHub, une base de données, un système de fichiers) et une application qui utilise un LLM.

## Client et serveur MCP

MCP reprend le vocabulaire client/serveur déjà vu pour [HTTP](/?c=infrastructure&p=api-et-http), avec des rôles différents :

| Rôle | Qui c'est | Exemple |
|---|---|---|
| **Serveur MCP** | Expose un service précis (outils, données) selon le protocole MCP | Un serveur MCP GitHub, un serveur MCP pour une base de données locale |
| **Client MCP** | L'application qui fait tourner le modèle et se connecte à un ou plusieurs serveurs MCP | Un IDE, un assistant en ligne de commande, une application de chat |

```text
Application (client MCP)  <-- protocole MCP -->  Serveur MCP GitHub
       |                                                |
   fait tourner                                    sait parler a
   le modele                                        l'API GitHub
```

Le même serveur MCP GitHub fonctionne, sans aucune modification, avec n'importe quelle application compatible MCP : c'est le serveur qui porte l'intégration avec GitHub, une seule fois, pas chaque application qui l'utilise.

## Trois types de ressources exposées

Un serveur MCP peut proposer trois choses distinctes, pas seulement des outils :

| Type | Rôle | Exemple |
|---|---|---|
| **Tools** | Des fonctions que le modèle peut décider d'appeler (le [function calling](/?c=ia&s=nlp-llm&p=agents) habituel) | `create_issue`, `list_pull_requests` |
| **Resources** | Des données que le client peut lire et donner en contexte au modèle, sans appel décidé par le modèle lui-même | Le contenu d'un fichier, le schéma d'une base de données |
| **Prompts** | Des modèles de prompt réutilisables, fournis par le serveur plutôt qu'écrits à la main dans chaque application | Un gabarit "résume cette pull request" prêt à l'emploi |

## Transport : local ou distant

Un client MCP communique avec un serveur MCP par l'un de ces deux canaux :

| Transport | Principe | Cas d'usage typique |
|---|---|---|
| `stdio` | Le serveur tourne comme un processus local, communication par entrée/sortie standard | Un outil qui accède au système de fichiers local |
| HTTP / SSE | Le serveur tourne à distance, communication réseau | Un service partagé entre plusieurs utilisateurs ou machines |

> **Piège :** connecter un client à un serveur MCP en lui accordant plus de permissions que nécessaire (un serveur "fichiers" qui peut écrire sur tout le disque plutôt qu'un dossier précis), le même risque que l'accès à un paramètre libre en function calling.
>
> **Bonne pratique :** limiter chaque serveur MCP au périmètre strictement nécessaire (un dossier précis, une base en lecture seule), et exiger une confirmation humaine avant toute action à conséquence réelle, exactement comme pour un [agent](/?c=ia&s=nlp-llm&p=agents) classique.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | MCP standardise la façon dont un outil (tool), une donnée (resource) ou un gabarit de prompt est exposé à une application qui fait tourner un LLM, pour qu'un même serveur MCP soit réutilisable par n'importe quel client compatible, sans intégration réécrite à chaque fois. |
| **Outils utilisables** | Un serveur MCP par service à intégrer (GitHub, base de données, système de fichiers...) ; transport `stdio` en local, HTTP/SSE à distance. |
| **Pièges à éviter** | Accorder à un serveur MCP plus de permissions que le périmètre réellement nécessaire. |
| **Bonnes pratiques** | Limiter chaque serveur MCP au strict périmètre requis ; exiger une confirmation humaine avant toute action à conséquence réelle. |
