---
order: 2
---

# Service et Ingress : router le trafic vers les pods

## Le problème : les pods ne sont pas des cibles stables

Un [pod](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) peut être détruit et recréé à tout moment (crash, mise à jour, migration), et reçoit alors une nouvelle adresse IP. Un client qui contacterait directement l'IP d'un pod perdrait la connexion dès que ce pod disparaît.

## Service : un point d'entrée stable

Un **Service** est un point d'entrée réseau stable (une IP et un nom qui ne changent jamais) placé devant un groupe de pods. Il répartit le trafic reçu entre les pods actuellement en bonne santé, quels que soient leurs allées et venues :

```text
Client --> Service (adresse stable) --> Pod 1 (sain)
                                     --> Pod 2 (sain)
                                     --> Pod 3 (en train de redemarrer, ecarte)
```

Le Service détecte automatiquement quels pods sont sains et exclut ceux qui ne le sont pas, sans jamais changer sa propre adresse.

## Ingress : router par nom de domaine

Un cluster héberge souvent plusieurs applications derrière des Services différents. L'**Ingress** route le trafic entrant vers le bon Service selon le nom de domaine demandé :

| Domaine demandé | Service ciblé |
|---|---|
| `app.exemple.com` | Service du frontend |
| `api.exemple.com` | Service du backend |

Sans Ingress, chaque Service devrait exposer sa propre adresse publique séparée ; l'Ingress centralise ce routage en un seul point d'entrée pour tout le cluster.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les pods changent d'adresse IP en permanence (crash, mise à jour, migration) : un Service leur donne une adresse stable et répartit le trafic sur les pods sains. Un Ingress route ensuite le trafic entrant vers le bon Service selon le nom de domaine demandé. |
| **Outils utilisables** | `kubectl get services`/`kubectl get ingress` pour lister les points d'entrée d'un cluster. |
| **Pièges à éviter** | Faire dépendre un client de l'adresse IP directe d'un pod plutôt que de celle, stable, du Service. |
| **Bonnes pratiques** | Toujours passer par un Service pour joindre un groupe de pods ; utiliser un Ingress dès que plusieurs applications partagent le même cluster. |
