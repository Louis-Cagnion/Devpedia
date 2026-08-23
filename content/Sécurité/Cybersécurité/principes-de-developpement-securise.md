---
order: 3
---

# Principes de développement sécurisé

Le chapitre [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) montre que la plupart des vulnérabilités partagent une racine commune : une donnée ou une situation traitée à tort comme fiable. Ce chapitre détaille quatre principes qui, appliqués systématiquement, éliminent une grande partie de ce risque avant même d'écrire la logique métier.

## Secure by design : penser la sécurité dès la conception

Ajouter la sécurité *après coup*, une fois une fonctionnalité déjà écrite, revient presque toujours à colmater des trous un par un, sans garantie d'en avoir trouvé la totalité. **Secure by design** consiste à intégrer les questions de sécurité dès la conception d'une fonctionnalité, au même titre que ses exigences fonctionnelles : *qui peut faire quoi ? que se passe-t-il si cette donnée est falsifiée ? que se passe-t-il si ce service tombe en panne ?*

```text
Approche "rustine"                       Approche secure by design

Fonctionnalite ecrite                    Fonctionnalite concue
        |                                        |
        v                                        v
  Mise en production                    Qui y accede ? Quelles
        |                                donnees sont sensibles ?
        v                                Que faire en cas d'echec ?
  Faille decouverte                              |
        |                                        v
        v                                Fonctionnalite ecrite,
     Correctif                           failles evidentes deja evitees
  (le cycle recommence
   a chaque faille)
```

## Valider les entrées : ne jamais faire confiance par défaut

Toute donnée qui entre dans un système depuis l'extérieur (champ de formulaire, paramètre d'URL, en-tête HTTP, fichier importé, réponse d'une API tierce) doit être validée avant d'être utilisée. Deux stratégies existent :

| Stratégie | Principe | Fiabilité |
|---|---|---|
| **Liste blanche** (*allowlist*) | N'autoriser explicitement que les valeurs/formats connus comme valides | Élevée : tout ce qui n'est pas explicitement permis est refusé |
| **Liste noire** (*denylist*) | Refuser explicitement les valeurs/formats connus comme dangereux | Faible : oublie forcément un cas non anticipé |

```text
// Liste noire (fragile) : bloque ce qu'on connait deja
si entree contient "<script>" alors refuser
// Un attaquant contourne avec une variante non prevue : "<ScRiPt>", "<img onerror=...>"...

// Liste blanche (robuste) : n'autorise que ce qui est attendu
si entree correspond exactement au format "email valide" alors accepter
// Tout le reste est refuse, y compris une variante non anticipee
```

La liste blanche est donc la stratégie par défaut à privilégier. Un exemple concret de validation par liste blanche, avec `filter_input()`, est déjà détaillé dans [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite).

> **Piège :** valider une donnée une seule fois côté client (dans le navigateur), puis lui faire confiance côté serveur. Une validation côté client n'est qu'un confort d'utilisation (retour immédiat) : rien n'empêche un attaquant d'envoyer une requête directement au serveur, en contournant totalement le navigateur.
>
> **Bonne pratique :** revalider systématiquement côté serveur, quelle que soit la validation déjà faite côté client.

## Le principe de moindre privilège

Un composant (utilisateur, service, processus) ne doit disposer que des droits strictement nécessaires à sa tâche, jamais plus « pour être tranquille » :

| Contexte | Excès de privilège | Application du principe |
|---|---|---|
| Base de données | Un compte applicatif avec les droits `DROP TABLE`/`ALTER` | Un compte limité à `SELECT`/`INSERT`/`UPDATE` sur les seules tables nécessaires |
| Système de fichiers | Un processus web tournant en administrateur | Un utilisateur dédié, sans droit d'écriture hors de son propre dossier |
| API tierce | Une clé API donnant accès à toutes les opérations du compte | Une clé restreinte aux seules opérations utilisées (lecture seule si aucune écriture n'est requise) |
| Équipe humaine | Tout le monde a accès à la production | Seules les personnes qui en ont réellement besoin, avec une revue régulière des accès |

L'intérêt dépasse la seule prévention : si un composant est malgré tout compromis, ses dégâts restent bornés à ce que ses droits limités permettent, plutôt que de s'étendre à tout le système.

## La défense en profondeur (*defense in depth*)

Aucune protection n'est infaillible : la défense en profondeur consiste à empiler plusieurs couches de protection indépendantes, pour qu'une seule défaillance ne suffise jamais à compromettre tout le système.

```text
Attaquant
   |
   v
[ Pare-feu / infrastructure reseau ]   <- 1ere couche
   |
   v
[ Validation des entrees ]             <- 2eme couche
   |
   v
[ Requetes preparees (anti-injection) ]<- 3eme couche
   |
   v
[ Moindre privilege du compte BDD ]    <- 4eme couche
   |
   v
Donnee proteges, meme si UNE couche cede
```

Si une couche est contournée (une faille non encore corrigée, par exemple), les couches suivantes limitent quand même l'impact, au lieu de laisser un accès total dès la première brèche.

## Échouer de façon sûre (*fail securely*)

Quand une vérification de sécurité échoue ou plante de façon inattendue (erreur réseau, exception non prévue), le comportement par défaut doit être de **refuser** l'accès, jamais de l'accorder par défaut :

```text
// Dangereux : une erreur inattendue autorise l'acces (fail open)
essayer:
    si utilisateurEstAutorise(utilisateur) alors accorder l'acces
attraper erreur:
    accorder l'acces   // "au cas ou, on laisse passer"

// Sur : une erreur inattendue refuse l'acces (fail closed)
essayer:
    si utilisateurEstAutorise(utilisateur) alors accorder l'acces
    sinon refuser l'acces
attraper erreur:
    refuser l'acces   // par defaut, sans acces confirme, pas d'acces du tout
```

Ce réflexe rejoint la robustesse générale attendue de tout code : une erreur doit échouer de façon explicite, jamais être masquée silencieusement par un comportement permissif par défaut.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Quatre principes réduisent la majorité des failles : penser la sécurité dès la conception, valider toute entrée externe par liste blanche, appliquer le moindre privilège, empiler plusieurs couches de défense indépendantes. |
| **Outils utilisables** | `filter_input()` ([PHP](/?c=langages&s=php&p=php)) et équivalents dans d'autres langages pour la validation par liste blanche ; comptes applicatifs dédiés à droits restreints pour la base de données. |
| **Pièges à éviter** | Valider une donnée uniquement côté client ; utiliser une liste noire plutôt qu'une liste blanche ; autoriser un accès par défaut en cas d'erreur inattendue (*fail open*). |
| **Bonnes pratiques** | Revalider systématiquement côté serveur ; restreindre chaque composant au strict nécessaire ; refuser l'accès par défaut en cas de doute (*fail closed*). |
