---
title: Les branches
---

Une **branche** est simplement un pointeur mobile vers un commit — elle permet de faire évoluer une version du code (une nouvelle fonctionnalité, un correctif) sans toucher à la branche principale, puis de réunir les deux lignes de travail plus tard.

## Créer et changer de branche

```bash
git branch                     # liste les branches existantes, celle courante est marquée d'un *
git branch nouvelle-fonctionnalite   # crée une nouvelle branche, sans y basculer
git checkout nouvelle-fonctionnalite  # bascule sur cette branche
git checkout -b nouvelle-fonctionnalite  # raccourci : crée ET bascule en une seule commande

git switch nouvelle-fonctionnalite      # équivalent moderne de "checkout" pour changer de branche
git switch -c nouvelle-fonctionnalite    # équivalent moderne de "checkout -b"
```

> **Note :** `git switch` (plus récent) et `git checkout` (historique, plus polyvalent mais moins explicite) font ici la même chose — `checkout` sert aussi à d'autres usages (restaurer un fichier, cf. chapitre sur l'annulation), ce qui le rend plus ambigu à lire.

## Ce qui se passe réellement en changeant de branche

Chaque branche est un simple pointeur vers un commit précis. Changer de branche déplace `HEAD` vers ce pointeur, et Git met à jour le dossier de travail pour qu'il corresponde exactement à l'instantané de ce commit :

```
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si on est sur "feature")
```

## Fusionner une branche (`merge`)

```bash
git checkout main
git merge feature
```

Deux cas possibles :

**Fast-forward** : si `main` n'a reçu aucun commit depuis la création de `feature`, Git avance simplement le pointeur `main` jusqu'au dernier commit de `feature` — aucun nouveau commit de fusion n'est créé.

```
Avant :  main: A -- B          feature: A -- B -- C -- D
Après :  main: A -- B -- C -- D
```

**Merge commit** : si `main` a évolué en parallèle, Git crée un commit spécial à **deux parents**, qui réunit les deux historiques :

```
main:     A -- B ------- E (merge commit)
                \        /
feature:         C -- D
```

## Supprimer une branche

```bash
git branch -d feature    # supprime, seulement si la branche a déjà été fusionnée (sécurité)
git branch -D feature    # force la suppression, même si elle n'a jamais été fusionnée
```

Voir aussi le chapitre sur le rebase, une alternative au merge pour intégrer des changements sans commit de fusion, et celui sur la résolution de conflits, pour le cas où les deux branches ont modifié les mêmes lignes.
