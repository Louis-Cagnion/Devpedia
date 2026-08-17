---
order: 3
---

# RBAC et ABAC : deux façons de modéliser l'autorisation

Le chapitre [authentification vs autorisation](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) pose la distinction (qui vous êtes contre ce que vous avez le droit de faire) sans dire *comment* cette seconde question se modélise concrètement dans un système. **RBAC** et **ABAC** sont les deux modèles de contrôle d'accès les plus répandus pour y répondre.

## RBAC : des droits attachés à un rôle

**RBAC** (*Role-Based Access Control*) attribue des permissions à des **rôles**, puis assigne un ou plusieurs rôles à chaque utilisateur. L'utilisateur hérite des permissions de ses rôles, jamais de permissions attachées directement à lui :

```text
Utilisateur       Role              Permissions

Alice        -->  comptabilite  --> voir_salaires, modifier_factures
Bob          -->  developpement --> voir_code, deployer_staging
```

> **Analogie :** un badge d'accès avec un niveau de sécurité imprimé dessus ("niveau 2"). Toute porte compatible "niveau 2" s'ouvre, quel que soit le porteur précis du badge ; changer les droits d'un niveau (ajouter une porte) met à jour tous les badges de ce niveau d'un coup, sans réimprimer chaque badge individuellement.

| | |
|---|---|
| Avantage | Simple à administrer : changer le rôle d'un utilisateur suffit à changer tous ses droits d'un coup |
| Limite | Une décision d'accès qui dépend d'un contexte précis (l'heure, la localisation, l'état d'une donnée) ne se modélise pas naturellement : il faudrait créer un rôle pour chaque combinaison de contexte possible |

## ABAC : des règles évaluées sur des attributs

**ABAC** (*Attribute-Based Access Control*) remplace le rôle fixe par une **règle** évaluée à chaque demande d'accès, à partir d'**attributs** : des propriétés de l'utilisateur, de la ressource demandée, et du contexte de la demande :

```text
Regle : autoriser SI utilisateur.departement == ressource.departement
        ET heure_actuelle entre 9h et 18h
        ET utilisateur.appareil == "poste_professionnel"

Alice, comptabilite, 14h, poste pro      -> demande une facture "comptabilite" -> AUTORISE
Alice, comptabilite, 22h, poste pro      -> demande une facture "comptabilite" -> REFUSE (hors horaires)
Alice, comptabilite, 14h, poste pro      -> demande un dossier "juridique"     -> REFUSE (departement different)
```

> **Analogie :** un vigile qui vérifie une liste de conditions à chaque passage, plutôt qu'un badge à niveau fixe : il regarde qui vous êtes, ce que vous demandez, et le contexte du moment, avant de décider, plutôt que de se fier à un simple niveau déjà imprimé.

| | |
|---|---|
| Avantage | Peut exprimer des règles fines et contextuelles, impossibles à représenter par un simple rôle |
| Limite | Plus complexe à écrire, tester et auditer : chaque règle combine potentiellement plusieurs attributs, et prévoir l'effet exact d'un changement de règle devient plus difficile qu'un simple changement de rôle |

## Comparatif

| | RBAC | ABAC |
|---|---|---|
| Base de la décision | Le rôle assigné à l'utilisateur | Des attributs évalués au moment de la demande (utilisateur, ressource, contexte) |
| Granularité | Grossière (par rôle) | Fine (par combinaison de conditions) |
| Simplicité d'administration | Élevée | Plus faible, la complexité des règles peut croître vite |
| Cas d'usage typique | La majorité des applications métier (rôles stables et peu nombreux) | Contrôle d'accès sensible au contexte (horaires, localisation, sensibilité de la donnée) |

Les deux ne s'excluent pas : un système peut utiliser RBAC pour la majorité de ses permissions, et réserver ABAC aux quelques décisions qui dépendent réellement du contexte.

> **Piège :** ajouter un rôle très spécifique à chaque exception rencontrée en RBAC (`comptabilite_matin`, `comptabilite_batiment_A`...), au lieu de reconnaître que le besoin réel est contextuel : le nombre de rôles explose et devient aussi difficile à auditer qu'un jeu de règles ABAC mal conçu, sans en avoir la flexibilité.
>
> **Bonne pratique :** garder RBAC pour les permissions stables et peu nombreuses, et basculer vers ABAC (ou un modèle hybride) dès qu'une règle dépend d'un attribut qui change souvent (l'heure, la localisation, une propriété de la donnée elle-même) plutôt que de multiplier les rôles.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | RBAC attribue des permissions à des rôles assignés à l'utilisateur (décision grossière, simple à administrer). ABAC évalue une règle sur des attributs (utilisateur, ressource, contexte) à chaque demande (décision fine, plus complexe). Les deux modèles se combinent souvent dans un même système. |
| **Outils utilisables** | Un système de rôles pour les permissions stables ; un moteur de règles ABAC pour les décisions contextuelles (horaires, localisation, sensibilité de la donnée). |
| **Pièges à éviter** | Multiplier les rôles RBAC pour représenter chaque exception contextuelle, au lieu de basculer vers ABAC. |
| **Bonnes pratiques** | Garder RBAC pour les cas stables et peu nombreux ; basculer vers ABAC dès qu'une règle dépend d'un attribut qui change souvent. |
