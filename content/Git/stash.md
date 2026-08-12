---
order: 6
---

# Le stash

`git stash` met de côté temporairement des modifications non commitées, pour retrouver un dossier de travail propre, utile quand il faut changer de branche en urgence (ex. corriger un bug critique) sans vouloir ni perdre son travail en cours, ni le commiter dans un état incomplet.

## Mettre de côté ses modifications

```bash
git stash                                             # met de côté toutes les modifications suivies, remet le dossier "propre"
git stash push -m "en cours : formulaire de contact"  # avec un message, pour s'y retrouver plus tard
git stash -u                                          # inclut aussi les fichiers non suivis (nouveaux, jamais ajoutés)
```

Après un `git stash`, `git status` ne montre plus aucune modification, comme si on venait de commiter, sauf que rien n'apparaît dans l'historique (`git log`) : les modifications sont stockées à part, dans une pile.

## Voir et récupérer ses stash

```bash
git stash list
# stash@{0}: en cours : formulaire de contact
# stash@{1}: WIP on main: a3f9c1d Corrige le calcul de remise

git stash apply            # réapplique le stash le plus récent, SANS le retirer de la pile
git stash apply stash@{1}  # réapplique un stash précis
git stash pop              # réapplique le stash le plus récent, ET le retire de la pile
```

> **Note :** `apply` garde le stash dans la pile après l'avoir réappliqué (utile pour l'appliquer sur plusieurs branches successivement), tandis que `pop` le retire : le choix dépend du fait qu'on soit certain de ne plus en avoir besoin ailleurs.

## Supprimer un stash

```bash
git stash drop stash@{0}  # supprime un stash précis, sans le réappliquer
git stash clear           # supprime TOUS les stash de la pile
```

## Sous le capot : un stash est un commit un peu particulier

Un stash n'est ni plus ni moins qu'un commit (voir [L'architecture interne de Git](/?c=git&p=architecture-interne) pour la structure objet sous-jacente), pointé par la ref `refs/stash`. Son premier parent est le commit courant au moment du stash, et un second parent capture l'état de l'index (un troisième si `-u` a été utilisé, pour les fichiers non suivis) : c'est cette structure à plusieurs parents que `git stash apply`/`pop` interprètent pour reconstruire séparément l'index et le dossier de travail.

> **Piège :** un outil qui réécrit l'historique sans connaître cette convention (`git filter-branch`, voir [L'architecture interne de Git](/?c=git&p=architecture-interne)) peut aplatir ce commit à un seul parent : `apply`/`pop` deviennent alors inutilisables (`fatal: ... is not a stash-like commit`). Le contenu reste néanmoins récupérable directement, puisque le tree du commit reflète l'état complet du dossier de travail au moment du stash : `git checkout refs/stash -- fichier.txt`.

## Pourquoi pas simplement changer de branche sans stash ?

Un changement de branche ordinaire (`git checkout`/`switch`, voir [Les branches](/?c=git&p=branches)) ne met **rien** de côté par lui-même : Git compare le fichier modifié à sa version sur la branche cible.

| Situation | Ce qui se passe sans `stash` |
|---|---|
| Le fichier modifié n'existe pas, ou est identique, sur la branche cible | Git **autorise** le changement de branche, et emporte la modification non commitée avec lui : elle se retrouve sur la nouvelle branche, hors de tout commit, sans qu'on l'ait demandé |
| Le fichier modifié diffère aussi sur la branche cible | Git **refuse** le changement de branche (`error: your local changes ... would be overwritten by checkout`), pour ne jamais écraser un travail non commité |

Aucun des deux cas ne correspond à ce qu'on veut réellement dans le scénario ci-dessous : le premier mélange silencieusement un travail en cours avec une autre branche (facile à commiter par erreur au mauvais endroit), le second bloque complètement tant que rien n'est fait. `git stash` retire explicitement la modification de **toutes** les branches (dossier de travail rendu propre), la range à part avec un message, puis la restitue uniquement quand on le demande, sur la branche qu'on choisit : c'est cette mise de côté explicite, et non le simple changement de branche, qui garantit de ne rien mélanger ni perdre.

## Cas d'usage typique

```bash
# en plein travail sur "feature", un bug urgent tombe sur "main"
git stash push -m "travail en cours sur feature"
git checkout main
# ... corriger le bug, commiter, pousser ...
git checkout feature
git stash pop   # reprend exactement là où on s'était arrêté
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `git stash` met de côté des modifications non commitées pour retrouver un dossier propre. C'est en réalité un commit spécial à plusieurs parents, pointé par `refs/stash`. |
| **Outils utilisables** | `git stash push`/`list`/`apply`/`pop`/`drop`/`clear`. |
| **Pièges à éviter** | Un outil qui réécrit l'historique sans connaître la structure d'un stash peut le casser (aplati à un seul parent, `apply`/`pop` deviennent inutilisables). |
| **Bonnes pratiques** | Nommer ses stash avec `-m` pour s'y retrouver ; n'utiliser `pop` que si on est certain de ne plus en avoir besoin ailleurs, `apply` sinon. |
