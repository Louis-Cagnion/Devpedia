---
order: 3
---

# CDN et diffusion adaptative : le cas Netflix

Le [répartiteur de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) distribue les requêtes entre plusieurs serveurs, mais tous ces serveurs restent situés au même endroit géographique : une requête envoyée depuis un autre continent doit toujours parcourir toute cette distance. Pour un contenu volumineux et identique pour tout le monde (une vidéo), un gain bien plus important consiste à rapprocher **le contenu lui-même** de chaque utilisateur, plutôt que de rapprocher les serveurs de traitement.

## Le CDN : des copies du contenu, réparties dans le monde entier

Un **CDN** (*Content Delivery Network*, réseau de diffusion de contenu) est un réseau de serveurs répartis géographiquement, chacun gardant en cache une copie du contenu (une vidéo, une image, un fichier statique) au plus près de ses utilisateurs :

```text
Sans CDN :                              Avec CDN :

Utilisateur (Tokyo)                     Utilisateur (Tokyo)
      |                                       |
      | traverse tout le trajet               | sert depuis le nœud CDN le plus proche
      v                                       v
Serveur d'origine (Paris)                Nœud CDN (Tokyo) --- copie synchronisée --- Serveur d'origine (Paris)
```

| | Sans CDN | Avec CDN |
|---|---|---|
| Distance parcourue | Jusqu'au serveur d'origine, quel que soit l'endroit du monde | Jusqu'au nœud CDN le plus proche |
| Charge sur le serveur d'origine | Chaque requête, de partout dans le monde | Seulement pour synchroniser les nœuds CDN, pas chaque requête utilisateur |
| Adapté à | Contenu personnalisé, propre à chaque utilisateur | Contenu identique pour tout le monde (vidéo, image, fichier statique) |

Netflix va plus loin qu'un CDN loué à un tiers : l'entreprise déploie ses propres serveurs ([Open Connect](https://openconnect.netflix.com/)), directement installés à l'intérieur des réseaux des fournisseurs d'accès internet, pour que la vidéo parcoure le moins de trajet réseau possible avant d'arriver chez l'utilisateur.

> **Piège :** attendre d'un CDN qu'il accélère n'importe quel contenu. Un CDN ne peut mettre en cache que du contenu partagé, identique pour tous ; un contenu réellement personnalisé (une recommandation propre à un compte, un solde) n'a rien de commun à mettre en cache, et doit continuer à passer par les serveurs d'origine, derrière le [répartiteur de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge).

## La diffusion adaptative : s'ajuster à la connexion de chacun

Une vidéo n'est pas envoyée comme un fichier unique à qualité fixe. Elle est d'abord encodée à **plusieurs niveaux de qualité** (résolutions et débits différents), puis découpée en petits segments de quelques secondes chacun :

```text
Vidéo source
   ├── Qualité basse   (segments de 480p, débit faible)
   ├── Qualité moyenne (segments de 720p, débit moyen)
   └── Qualité haute   (segments de 1080p, débit élevé)
```

Le lecteur vidéo, sur l'appareil de l'utilisateur, mesure en continu la vitesse réelle de téléchargement et choisit, segment par segment, la meilleure qualité qu'il peut télécharger à temps sans interrompre la lecture :

```text
Connexion mesurée stable et rapide     -> télécharge le prochain segment en haute qualité
Connexion mesurée qui se dégrade       -> bascule sur le prochain segment en qualité plus basse
```

Ce mécanisme (normalisé sous les protocoles [HLS](https://developer.apple.com/streaming/) et [MPEG-DASH](https://www.iso.org/standard/79329.html)) explique pourquoi une vidéo qui tournait en haute définition peut devenir momentanément plus pixellisée si le réseau se dégrade (changement de wifi, embouteillage réseau), sans jamais couper la lecture : chaque segment suivant est simplement demandé dans une qualité différente, de façon transparente pour l'utilisateur.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un CDN rapproche une copie du contenu partagé de chaque utilisateur, réduisant la distance parcourue par la requête ; il ne convient pas au contenu personnalisé. La diffusion adaptative découpe une vidéo en segments encodés à plusieurs qualités, et le lecteur choisit la meilleure qualité soutenable en fonction de la connexion mesurée en direct. |
| **Outils utilisables** | Un CDN loué (généraliste) ou déployé en propre (Netflix Open Connect) ; les protocoles HLS et MPEG-DASH pour la diffusion adaptative. |
| **Pièges à éviter** | Attendre d'un CDN qu'il accélère du contenu réellement personnalisé, qui n'a rien de commun à mettre en cache. |
| **Bonnes pratiques** | Réserver le CDN au contenu partagé et statique ; laisser le contenu personnalisé passer par les serveurs d'origine. |
