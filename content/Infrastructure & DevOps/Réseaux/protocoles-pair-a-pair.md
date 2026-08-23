---
order: 3
---

# Les protocoles pair-à-pair (P2P)

Un site web classique suit un modèle **client-serveur** : un serveur central héberge la ressource, chaque client s'y connecte pour la récupérer (voir [Fondamentaux réseau](/?c=reseaux&p=fondamentaux-reseau)). Un réseau **pair-à-pair** (*peer-to-peer*, P2P) fonctionne différemment : chaque participant, appelé **pair** (*peer*), est à la fois client et serveur, sans qu'un point central soit obligatoire pour échanger la ressource elle-même.

```text
Client-serveur :        Client A -->\
                         Client B --> Serveur (seule source) --> chaque client
                         Client C -->/

Pair-a-pair :            Pair A <---> Pair B
                            ^            ^
                            |            |
                            v            v
                          Pair C <---> Pair D
                          (chaque pair peut envoyer ET recevoir, vers/depuis n'importe quel autre)
```

## Le swarm, seeders et leechers

L'ensemble des pairs qui échangent actuellement une même ressource forme un **swarm** (littéralement « essaim »). Deux rôles cohabitent dans un swarm :

| Rôle | Situation |
|---|---|
| **Seeder** | Possède déjà la ressource complète, ne fait plus que l'envoyer aux autres |
| **Leecher** | Ne possède qu'une partie de la ressource, en télécharge le reste tout en pouvant déjà renvoyer les morceaux qu'il détient |

## Le découpage en morceaux

La ressource (souvent un fichier) n'est jamais échangée d'un bloc : elle est découpée en **morceaux** (*pieces*) de taille fixe, chacun accompagné d'un hash (voir la notion de hachage dans [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage) pour le principe général) qui permet de vérifier son intégrité dès sa réception.

```text
Fichier complet :  [ morceau 1 | morceau 2 | morceau 3 | morceau 4 | ... ]

Un pair peut telecharger le morceau 3 depuis le pair A,
le morceau 1 depuis le pair B, en parallele,
puis reenvoyer immediatement le morceau 3 a un pair C qui ne l'a pas encore.
```

Ce découpage permet deux choses à la fois : télécharger plusieurs morceaux en parallèle depuis des pairs différents (plus rapide qu'une seule source), et détecter immédiatement un morceau corrompu ou modifié grâce à son hash, sans attendre la fin du téléchargement complet.

## Trouver des pairs : tracker et DHT

Un pair qui rejoint un swarm doit d'abord savoir quels autres pairs le composent :

| Mécanisme | Principe |
|---|---|
| **Tracker** | Un serveur central que chaque pair contacte pour obtenir la liste des pairs actifs du swarm ; reste un point de passage obligé, même s'il n'héberge jamais la ressource elle-même |
| **DHT** (*Distributed Hash Table*) | Une table de correspondance répartie entre les pairs eux-mêmes, qui permet de retrouver les pairs d'un swarm sans dépendre d'un tracker central |

Un **magnet link** est une simple référence (un identifiant unique de la ressource) qui permet de rejoindre un swarm directement via le DHT, sans avoir à télécharger au préalable un fichier décrivant la ressource.

## L'incitation à redonner : choke/unchoke

Rien n'oblige un pair à renvoyer ce qu'il télécharge. Pour éviter que tout le monde ne se contente de recevoir sans jamais redonner, chaque pair limite le nombre de pairs auxquels il envoie des données à un instant donné (*choke* = bloqué, *unchoke* = autorisé), en priorisant ceux qui lui renvoient déjà le plus. Un pair qui ne renvoie jamais rien finit ainsi par être *choke* par la plupart des autres.

## Au-delà du partage de fichiers entre particuliers

Le principe P2P sert aussi à des besoins de diffusion à grande échelle : distribuer une mise à jour volumineuse (ex : un jeu vidéo) à des millions de joueurs en même temps sans saturer un seul serveur, chaque joueur qui a déjà téléchargé une partie de la mise à jour la redistribuant aux autres. C'est une alternative décentralisée à un [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), qui répartit lui la charge sur des serveurs dédiés plutôt que sur les utilisateurs eux-mêmes.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un réseau pair-à-pair fait de chaque participant à la fois un client et un serveur. Le swarm regroupe les pairs qui échangent une ressource découpée en morceaux vérifiés par hash ; un tracker ou un DHT permet de trouver ces pairs. |
| **Outils utilisables** | Un tracker pour un swarm simple à administrer ; un DHT pour ne dépendre d'aucun serveur central. |
| **Pièges à éviter** | Confondre le rôle de tracker (qui ne fait que mettre en relation) avec celui d'un hébergeur classique (qui sert lui-même la ressource). |
| **Bonnes pratiques** | Vérifier le hash de chaque morceau reçu avant de le redistribuer, pour ne jamais propager une donnée corrompue. |
