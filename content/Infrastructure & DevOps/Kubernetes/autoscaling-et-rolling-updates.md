---
order: 4
---

# Autoscaling et rolling updates

## Autoscaling : ajuster le nombre de pods à la charge réelle

Un [Deployment](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) déclare un nombre fixe de replicas, mais le trafic réel varie dans le temps. L'**autoscaling** ajuste automatiquement ce nombre selon une métrique surveillée (l'usage CPU, le plus courant) :

```text
CPU moyen des pods monte   -> Kubernetes ajoute des pods
CPU moyen des pods redescend -> Kubernetes retire des pods
```

Le principe reste le même que celui déjà vu pour un [autoscaling générique](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) : ajouter de la capacité seulement quand elle sert réellement, jamais en permanence "au cas où".

## Rolling update : livrer une nouvelle version sans coupure

Remplacer toutes les copies d'une application d'un coup couperait le service le temps du redémarrage. Un **rolling update** remplace les pods progressivement : de nouveaux pods (nouvelle version) démarrent et doivent devenir sains avant qu'un nombre équivalent d'anciens pods ne soit retiré, jamais l'inverse :

```text
Etat initial : [v1] [v1] [v1]
Etape 1       : [v2] [v1] [v1]   (v2 demarre et devient sain)
Etape 2       : [v2] [v2] [v1]   (un ancien v1 est retire)
Etape finale  : [v2] [v2] [v2]
```

À aucun moment le nombre total de pods sains ne descend sous ce qui est nécessaire pour servir le trafic : le service continue de répondre pendant toute la mise à jour.

> **Bonne pratique :** si une nouvelle version s'avère défaillante une fois déployée, un rollback revient à l'ancienne version en suivant exactement le même mécanisme progressif, dans l'autre sens.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'autoscaling ajuste le nombre de pods d'un Deployment à une métrique réelle (l'usage CPU, le plus souvent). Un rolling update remplace les pods progressivement, une nouvelle version ne devenant active qu'une fois saine, sans jamais couper le service. Un rollback suit le même mécanisme, dans l'autre sens. |
| **Outils utilisables** | `kubectl rollout status`/`kubectl rollout undo` pour suivre ou annuler un rolling update en cours. |
| **Pièges à éviter** | Remplacer tous les pods d'un coup plutôt que progressivement, ce qui coupe le service le temps du redémarrage. |
| **Bonnes pratiques** | Laisser Kubernetes vérifier qu'un nouveau pod est sain avant de retirer l'ancien qu'il remplace. Utiliser un rollback plutôt qu'une correction en urgence si une nouvelle version s'avère défaillante. |
