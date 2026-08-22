---
order: 10
---

# Les pull requests sur GitHub

La **pull request** (PR) est le mécanisme central de collaboration sur [GitHub](/?c=git&p=github-et-plateformes) : une demande explicite, "voici des commits sur ma branche, merci de les relire et de les intégrer à la vôtre." Elle s'appuie entièrement sur les [branches](/?c=git&p=branches) Git ordinaires, sans rien y ajouter côté Git lui-même.

## Le workflow de base

```text
1. Créer une branche dédiée au changement (voir Les branches)
2. Committer et pousser cette branche vers GitHub
3. Ouvrir une pull request : branche source -> branche cible (souvent main)
4. Une ou plusieurs personnes relisent, commentent, demandent des changements
5. Une fois approuvée : la pull request est fusionnée (merge)
```

```bash
git checkout -b correction-affichage
# ... modifications, commits ...
git push -u origin correction-affichage
# -> l'ouverture de la pull request se fait ensuite sur le site GitHub, pas en ligne de commande
```

> **Note :** une pull request n'est pas un objet Git : elle n'existe que dans la base de données de GitHub (métadonnées, commentaires, historique de relecture). Le seul objet Git impliqué est la branche elle-même ; supprimer la pull request sur GitHub n'efface aucun commit.

## Le fork : contribuer à un dépôt qu'on ne contrôle pas

Ouvrir une pull request suppose de pouvoir pousser une branche vers le dépôt cible. Pour un dépôt appartenant à quelqu'un d'autre, un **fork** crée d'abord une copie complète sur votre propre compte, avec les pleins droits :

```text
Dépôt original (ex. github.com/projet/outil)
       │  bouton "Fork"
       ▼
Votre copie (ex. github.com/vous/outil)  <-- vous avez les pleins droits ici
       │  git clone
       ▼
Copie locale sur votre machine
```

| | `fork` | `clone` |
|---|---|---|
| Où | Sur GitHub (crée un nouveau dépôt distant, sur votre compte) | Sur votre machine (crée une copie locale) |
| Nécessaire pour | Contribuer à un dépôt où vous n'avez pas les droits d'écriture | Travailler localement sur n'importe quel dépôt, y compris le vôtre |
| Lien avec l'original | Conserve un lien (`upstream`) vers le dépôt d'origine | Aucun lien particulier : c'est juste une copie |

Une fois le fork cloné, la pull request se fait depuis une branche du fork vers le dépôt d'origine : GitHub reconnaît le lien entre les deux et propose cette destination automatiquement.

> **Piège :** croire qu'un fork se met à jour automatiquement quand le dépôt d'origine évolue. Un fork est une copie figée au moment où il est créé : sans action explicite, il prend du retard sur l'original.
>
> **Bonne pratique :** ajouter le dépôt d'origine comme second [remote](/?c=git&p=remotes) (conventionnellement nommé `upstream`) et le resynchroniser régulièrement : `git remote add upstream https://github.com/projet/outil.git`, puis `git fetch upstream` et fusionner ses changements, **avant** de créer une nouvelle branche de travail.

## Pull request en brouillon (*draft*)

Une pull request peut être ouverte en mode **brouillon** (*draft*) : visible et discutable, mais explicitement marquée comme pas encore prête à être fusionnée, ni même totalement relue. Utile pour partager un travail en cours (avoir un retour tôt, faire tourner les vérifications automatiques) sans laisser croire qu'il est terminé.

## Demander une relecture

Une pull request peut désigner explicitement une ou plusieurs personnes comme **reviewers**. Chaque relecture aboutit à un statut :

| Statut de relecture | Signification |
|---|---|
| *Approve* | Le changement est validé, prêt à être fusionné (sous réserve des autres règles en place) |
| *Request changes* | Des modifications sont demandées avant fusion ; bloque la fusion si des règles de protection l'exigent (section suivante) |
| *Comment* | Remarques sans validation ni blocage explicite |

## Protéger une branche : n'accepter que des changements relus

Une **règle de protection de branche** (*branch protection rule*) empêche de pousser directement sur une branche sensible (typiquement `main`), et impose des conditions avant qu'une pull request ne puisse être fusionnée :

| Condition courante | Effet |
|---|---|
| Exiger au moins une relecture approuvée | La fusion est bloquée tant qu'aucun *Approve* n'a été donné |
| Exiger que les vérifications automatiques passent | La fusion est bloquée tant que la [CI/CD](/?c=ci-cd&p=pipeline-cicd) (tests, build) n'a pas réussi sur la dernière version de la branche |
| Interdire le push direct | Tout changement sur cette branche doit obligatoirement passer par une pull request, sans exception |

> **Piège :** compter uniquement sur la discipline de l'équipe ("on ne pousse jamais directement sur `main`") sans règle de protection technique. Rien n'empêche alors un push direct accidentel, ni une fusion prématurée d'une pull request pas encore approuvée.
>
> **Bonne pratique :** activer une règle de protection sur toute branche destinée à rester stable, plutôt que de s'appuyer uniquement sur une convention d'équipe non technique.

## Les trois façons de fusionner une pull request

GitHub propose trois stratégies de fusion, avec un effet différent sur l'historique final :

| Stratégie | Effet sur l'historique |
|---|---|
| **Merge commit** | Un [commit de fusion à deux parents](/?c=git&p=branches), qui conserve tous les commits individuels de la branche, avec leur détail |
| **Squash and merge** | Tous les commits de la branche sont regroupés en **un seul** commit sur la branche cible : historique cible linéaire, mais le détail des commits individuels de la pull request est perdu |
| **Rebase and merge** | Chaque commit de la branche est [rejoué](/?c=git&p=rebase) individuellement au sommet de la branche cible : historique linéaire, sans commit de fusion, mais chaque commit original reste distinct |

> **Piège :** choisir "Squash and merge" pour une pull request qui contient plusieurs changements logiquement indépendants (ex. un correctif de bug **et** une nouvelle fonctionnalité, mélangés sur la même branche) : le squash les fond en un seul commit, rendant impossible de revenir sur l'un sans l'autre par la suite.
>
> **Bonne pratique :** réserver "Squash and merge" à une pull request dont les commits individuels n'ont pas de valeur propre (des corrections successives du même changement, par exemple) ; préférer "Merge commit" ou "Rebase and merge" quand l'historique détaillé de la pull request mérite d'être conservé.

## Lier une pull request à une issue

Inclure `closes #12` (le numéro de l'[issue](/?c=git&p=issues-et-projets-github)) dans la description d'une pull request la ferme automatiquement dès que la pull request est fusionnée, sans action manuelle supplémentaire.

## Le piège du force-push pendant une relecture

Réécrire l'historique d'une branche déjà poussée (`git commit --amend`, [rebase](/?c=git&p=rebase)) nécessite un [`git push --force`](/?c=git&p=remotes) pour la mettre à jour côté GitHub.

> **Piège :** faire un `push --force` sur une branche déjà relue par quelqu'un d'autre. Les commentaires de relecture restent attachés aux anciennes lignes de code, potentiellement disparues ou déplacées : un reviewer qui revient sur la pull request peut se retrouver face à un diff complètement différent de ce qu'il avait déjà approuvé, sans le savoir.
>
> **Bonne pratique :** éviter de réécrire l'historique d'une branche déjà en relecture active ; si c'est nécessaire, prévenir explicitement les reviewers dans un commentaire de la pull request.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une pull request propose une branche pour relecture avant fusion. Un fork permet de contribuer à un dépôt externe. Les règles de protection de branche imposent des conditions (relecture, CI) avant fusion. Trois stratégies de fusion (merge commit, squash, rebase) donnent un historique final différent. |
| **Outils utilisables** | Pull request en brouillon (*draft*), reviewers désignés, règles de protection de branche, `closes #12` pour lier une issue. |
| **Pièges à éviter** | Croire qu'un fork se met à jour seul. Compter sur la discipline plutôt que sur une règle de protection technique. Squasher une pull request aux commits logiquement indépendants. Force-pusher une branche déjà en relecture active. |
| **Bonnes pratiques** | Resynchroniser un fork avec `upstream` avant chaque nouvelle branche. Activer une protection de branche sur toute branche stable. Choisir la stratégie de fusion selon la valeur de l'historique détaillé. Prévenir les reviewers avant un force-push. |
