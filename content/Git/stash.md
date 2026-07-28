---
title: Le stash
---

`git stash` met de côté temporairement des modifications non commitées, pour retrouver un dossier de travail propre — utile quand il faut changer de branche en urgence (ex. corriger un bug critique) sans vouloir ni perdre son travail en cours, ni le commiter dans un état incomplet.

## Mettre de côté ses modifications

```bash
git stash                          # met de côté toutes les modifications suivies, remet le dossier "propre"
git stash push -m "en cours : formulaire de contact"  # avec un message, pour s'y retrouver plus tard
git stash -u                        # inclut aussi les fichiers non suivis (nouveaux, jamais ajoutés)
```

Après un `git stash`, `git status` ne montre plus aucune modification — comme si on venait de commiter, sauf que rien n'apparaît dans l'historique (`git log`) : les modifications sont stockées à part, dans une pile.

## Voir et récupérer ses stash

```bash
git stash list
# stash@{0}: en cours : formulaire de contact
# stash@{1}: WIP on main: a3f9c1d Corrige le calcul de remise

git stash apply          # réapplique le stash le plus récent, SANS le retirer de la pile
git stash apply stash@{1} # réapplique un stash précis
git stash pop             # réapplique le stash le plus récent, ET le retire de la pile
```

> **Note :** `apply` garde le stash dans la pile après l'avoir réappliqué (utile pour l'appliquer sur plusieurs branches successivement), tandis que `pop` le retire — le choix dépend de si on est certain de ne plus en avoir besoin ailleurs.

## Supprimer un stash

```bash
git stash drop stash@{0}   # supprime un stash précis, sans le réappliquer
git stash clear             # supprime TOUS les stash de la pile
```

## Cas d'usage typique

```bash
# en plein travail sur "feature", un bug urgent tombe sur "main"
git stash push -m "travail en cours sur feature"
git checkout main
# ... corriger le bug, commiter, pousser ...
git checkout feature
git stash pop   # reprend exactement là où on s'était arrêté
```
