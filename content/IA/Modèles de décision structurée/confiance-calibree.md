---
order: 4
---

# La confiance calibrée : agir, hésiter ou escalader

Les réponses Choice et Score ([chapitre précédent](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)) portent un champ `confidence` distinct de la réponse elle-même. Ce chapitre explique ce que mesure ce chiffre, et comment le code doit s'en servir pour décider d'agir automatiquement ou d'escalader vers un humain.

## Ce que mesure la confiance

La confiance se déduit de la **forme de la distribution de probabilités** renvoyée par une question Choice ou Score : une distribution concentrée sur une seule réponse signale une forte confiance, une distribution étalée sur plusieurs réponses signale une confiance faible.

```text
Distribution concentree (confiance haute)      Distribution etalee (confiance basse)
retours :      0.95  #################          retours :      0.40  ########
livraison :    0.03  #                           livraison :    0.35  #######
facturation :  0.02  #                           facturation :  0.25  #####
```

Pour une question à trois options, la documentation du fournisseur donne une formule approchée :

```python
# confiance approchee pour 3 options, a partir de la plus forte probabilite
plus_forte_probabilite = 0.95
confiance = (3 * plus_forte_probabilite - 1) / 2
# -> (3*0.95 - 1) / 2 = 0.925
```

Une distribution parfaitement plate (chaque option à égalité) donne une confiance proche de 0 ; une distribution qui concentre tout son poids sur une seule option donne une confiance proche de 1.

Pour une question **Noul**, il n'existe pas de champ `confidence` séparé : la probabilité renvoyée joue les deux rôles à la fois (la réponse ET son degré de certitude), comme vu dans le [chapitre sur les primitives](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#noul-verifier-une-affirmation-binaire).

## Trois seuils, trois comportements

En pratique, une confiance se traduit en code par trois zones de décision, chacune associée à un comportement différent :

| Zone | Comportement |
|---|---|
| Confiance élevée | Agir automatiquement, sans intervention humaine |
| Confiance moyenne | Procéder avec prudence (ex : demander confirmation à l'utilisateur avant d'agir) |
| Confiance basse | Escalader vers un humain plutôt que de risquer une décision automatique |

Ces seuils ne sont jamais universels : ils dépendent du **risque associé à l'action**. Une opération destructrice ou irréversible exige un seuil plus élevé qu'une simple lecture.

```python
def decider(reponse_choice, action_a_faible_risque: bool):
    if action_a_faible_risque:
        seuil_action_directe = 0.60
    else:
        seuil_action_directe = 0.85

    if reponse_choice.confidence >= seuil_action_directe:
        return "executer"
    if reponse_choice.confidence >= 0.40:
        return "demander_confirmation"
    return "escalader_humain"
```

## Exemple : une interface bancaire vocale

Une même action (un virement) peut avoir des seuils différents selon son montant ou son statut :

| Action | Enjeu | Seuil de confiance requis |
|---|---|---|
| Consulter un solde | Faible (lecture seule) | 0,60 suffit pour répondre directement |
| Virement déjà approuvé, montant faible | Modéré | 0,85 pour exécuter automatiquement |
| Virement, confiance modérée | Élevé si erreur | Demander confirmation avant d'exécuter |

> **Piège :** fixer un seuil unique pour toutes les actions d'un système, sans distinguer une simple consultation d'une action irréversible.
>
> **Bonne pratique :** calibrer les seuils par action selon son risque réel, en commençant par des seuils conservateurs (plus exigeants) puis en les ajustant à partir des résultats observés en production, plutôt que de deviner une valeur définitive dès le départ.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La confiance dérive de la forme de la distribution de probabilités (concentrée = confiante, étalée = incertaine) pour Choice et Score ; pour Noul, la probabilité seule en tient lieu. Trois zones de décision (agir, confirmer, escalader) s'appliquent selon des seuils qui dépendent du risque de l'action, pas d'une valeur universelle. |
| **Outils utilisables** | Le champ `confidence` des réponses Choice/Score ; des seuils programmés en code, distincts par action. |
| **Pièges à éviter** | Un seuil unique appliqué à toutes les actions, sans tenir compte de leur risque respectif. |
| **Bonnes pratiques** | Seuils plus élevés pour les actions irréversibles ou à fort enjeu. Démarrer avec des seuils conservateurs, puis les ajuster selon les résultats observés en production. |
