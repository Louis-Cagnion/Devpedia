---
order: 1
---

# Les concepts de base

## Le problème que Kubernetes résout

Une application dans un conteneur Docker tourne sur un serveur. Le trafic augmente : il en faut cinq copies. L'une plante à 3h du matin : quelqu'un doit la redémarrer à la main. Le serveur tombe en panne : les conteneurs doivent migrer ailleurs. Une nouvelle version doit être livrée sans coupure de service. Chacune de ces opérations, faite à la main, finit par arriver trop tard ou pas du tout.

Kubernetes automatise ce travail : on décrit l'état voulu (« 5 copies de cette application, toujours ») et un contrôleur compare en permanence cet **état désiré** à l'**état réel**, et corrige l'écart dès qu'il apparaît. C'est toute la philosophie de l'outil, déclinée dans chacune de ses briques.

## Cluster, node et control plane

Un **cluster** Kubernetes est un groupe de machines appelées **nodes**. Certains nodes exécutent le **control plane** (le "cerveau" : il décide quoi faire tourner où), les autres exécutent les applications elles-mêmes :

```text
Cluster
├── Control plane (decide quoi faire tourner ou)
└── Nodes (executent les applications)
    ├── Node 1
    ├── Node 2
    └── Node 3
```

Le control plane surveille en continu l'état réel du cluster (quels conteneurs tournent où) et le compare à l'état désiré déclaré par les fichiers de configuration.

## Pod : la plus petite unité déployée

Un **pod** est la plus petite unité que Kubernetes déploie, généralement un seul conteneur à l'intérieur (parfois plusieurs conteneurs étroitement liés qui partagent le même réseau et le même stockage). On ne déploie jamais un conteneur Docker directement : toujours via un pod qui l'enveloppe.

## Deployment : déclarer combien de copies et laisser Kubernetes les maintenir

Un **Deployment** déclare combien de **replicas** (copies) d'un pod doivent tourner. Dire "5 replicas" fait créer 5 pods par Kubernetes. Si l'un plante, le contrôleur constate qu'il n'en reste que 4 et en recrée un immédiatement, sans intervention humaine :

```text
Etat desire   : 5 pods
Etat reel     : 4 pods (un a plante)
-> Kubernetes cree 1 pod pour combler l'ecart
```

> **Bonne pratique :** ne jamais créer un pod directement en production. Passer par un Deployment garantit qu'un pod qui disparaît (crash, migration suite à une panne de node) est automatiquement recréé ailleurs dans le cluster.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Kubernetes compare en continu un état désiré (déclaré) à l'état réel du cluster, et corrige l'écart automatiquement. Un cluster regroupe des nodes (control plane + nodes d'exécution). Un pod est la plus petite unité déployée ; un Deployment déclare combien de replicas d'un pod doivent tourner et les recrée en cas de panne. |
| **Outils utilisables** | `kubectl get pods`/`kubectl get deployments` pour observer l'état réel du cluster. |
| **Pièges à éviter** | Créer un pod directement plutôt que via un Deployment : un pod isolé qui plante n'est jamais recréé automatiquement. |
| **Bonnes pratiques** | Toujours passer par un Deployment pour bénéficier de l'auto-réparation (recréation automatique d'un pod disparu). |
