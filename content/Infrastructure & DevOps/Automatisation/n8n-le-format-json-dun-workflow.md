---
order: 4
---

# n8n : le format JSON d'un workflow

Sous l'interface visuelle, un workflow n8n n'est rien d'autre qu'un fichier [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) : chaque nœud posé sur le canvas et chaque connexion tracée entre eux s'y retrouvent sous une forme lisible. Comprendre cette structure permet d'exporter, de partager, et de versionner un workflow comme n'importe quel autre fichier de configuration.

## Exporter et importer

Le menu du workflow (trois points, en haut à droite de l'éditeur) propose **"Download"**, qui télécharge le workflow entier sous forme d'un fichier `.json`. À l'inverse, **"Import from File"** recharge un workflow à partir d'un tel fichier. Un raccourci existe aussi pour une partie du canvas : sélectionner des nœuds puis `Ctrl+C`/`Ctrl+V` copie-colle leur JSON, y compris entre deux onglets n8n différents.

## La structure générale

Un workflow exporté s'organise autour de deux clés principales, `nodes` et `connections`, accompagnées d'informations générales sur le workflow lui-même (nom, statut actif ou non, réglages) :

```json
{
  "name": "Notifier une commande",
  "active": false,
  "nodes": [ /* la liste des nœuds, détaillée plus bas */ ],
  "connections": { /* les liens entre nœuds, détaillés plus bas */ },
  "settings": {}
}
```

## Un nœud dans le JSON

Chaque nœud du canvas correspond à un objet dans le tableau `nodes` : son nom (tel qu'affiché sur le canvas), son type (quel connecteur ou quelle fonction), sa position visuelle, et ses **paramètres** (le contenu réellement configuré dans le panneau vu au premier chapitre) :

```json
{
  "name": "Envoyer un message Slack",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 1,
  "position": [900, 300],
  "parameters": {
    "channel": "ventes",
    "text": "Nouvelle commande reçue"
  },
  "credentials": {
    "slackApi": {
      "id": "17",
      "name": "slack_credentials"
    }
  }
}
```

Le champ `credentials` ne contient qu'une **référence** (un identifiant et un nom) vers des identifiants stockés séparément par n8n, jamais le mot de passe ou la clé d'API elle-même : un fichier exporté peut donc être partagé sans révéler de secret, mais reste inutilisable tel quel tant que les identifiants correspondants n'ont pas été reconfigurés sur l'instance de destination.

## Les connexions : qui envoie ses données à qui

L'objet `connections` associe le **nom** d'un nœud source à la liste des nœuds qui reçoivent ses données en sortie :

```json
{
  "connections": {
    "Nouvelle commande": {
      "main": [
        [
          { "node": "Envoyer un message Slack", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

Cette structure imbriquée (un tableau de tableaux) existe pour représenter les nœuds à plusieurs sorties (comme le nœud IF ou Switch vus au chapitre précédent) : chaque sortie du nœud source a son propre tableau de nœuds cibles, dans l'ordre où elles apparaissent sur le canvas.

> **Piège :** modifier le nom d'un nœud directement dans le JSON, en oubliant que ce nom sert de clé dans l'objet `connections`. Un nom désynchronisé casse silencieusement le lien entre les deux nœuds concernés au prochain import.
>
> **Bonne pratique :** renommer un nœud depuis l'éditeur visuel plutôt que dans le JSON brut, n8n se charge alors de mettre à jour toutes les références dans `connections` automatiquement.

## Le format des données qui transitent

En complément du fichier workflow lui-même, il est utile de connaître le format des **données** que chaque nœud manipule en interne (visible dans le panneau d'exécution) : n8n fait toujours circuler un tableau d'objets, chacun contenant une clé `json` (les données classiques) ou `binary` (un fichier) :

```json
[
  {
    "json": {
      "client": "Alice",
      "montant": 149.90
    }
  }
]
```

C'est cette même structure que manipule un Code node (voir le chapitre précédent) via `$input.all()`.

## Versionner un workflow comme du code

Puisqu'un workflow n'est qu'un fichier texte structuré, rien n'empêche de le committer dans un dépôt [Git](/?c=qualite-performance-et-outils&s=git&p=commandes-essentielles) : l'historique de ses versions, les différences entre deux versions (`git diff`), et une revue avant modification deviennent alors possibles, exactement comme pour du code source classique.

> **Piège :** committer un export de workflow sans avoir vérifié qu'il ne contient aucune donnée sensible en dur dans les `parameters` (une URL avec un jeton d'accès en clair, par exemple) : contrairement aux `credentials`, un paramètre saisi directement dans un champ texte est exporté tel quel.
>
> **Bonne pratique :** utiliser les identifiants n8n (`credentials`) ou des variables d'environnement pour toute valeur sensible, jamais un champ texte en dur, afin qu'un export reste sûr à partager ou à versionner.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un workflow exporté est un JSON avec deux clés principales : `nodes` (nom, type, position, paramètres) et `connections` (quel nœud envoie ses données à quel autre, par nom). Les `credentials` ne stockent qu'une référence, jamais le secret lui-même. Les données qui transitent entre nœuds sont toujours un tableau d'objets `{json: ...}` ou `{binary: ...}`. |
| **Outils utilisables** | "Download"/"Import from File" pour exporter/importer ; `Ctrl+C`/`Ctrl+V` pour copier une sélection de nœuds ; Git pour versionner un workflow comme du code. |
| **Pièges à éviter** | Renommer un nœud directement dans le JSON brut, désynchronisant les références dans `connections`. Committer un export contenant une donnée sensible en dur dans un paramètre. |
| **Bonnes pratiques** | Renommer un nœud depuis l'éditeur visuel, jamais dans le JSON brut. Utiliser les credentials n8n ou des variables d'environnement pour toute valeur sensible avant de partager ou versionner un export. |
