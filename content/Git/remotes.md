---
title: Les dépôts distants (remotes)
---

Un **remote** est une référence vers une copie du dépôt hébergée ailleurs (GitHub, GitLab, un serveur d'entreprise...), utilisée pour synchroniser du travail entre plusieurs personnes ou plusieurs machines.

## Voir et ajouter un remote

```bash
git remote -v                                  # liste les remotes configurés (souvent juste "origin")
git remote add origin https://exemple.com/projet.git
```

`origin` est le nom conventionnel donné au remote principal (rien n'oblige à ce nom précis, mais c'est la convention presque universelle).

## `push` : envoyer des commits locaux

```bash
git push origin main               # envoie les commits de la branche locale "main" vers le remote "origin"
git push -u origin main             # -u : mémorise ce lien, pour pouvoir ensuite écrire juste "git push"
git push                             # une fois le lien mémorisé
```

## `fetch` vs `pull`

```bash
git fetch origin    # télécharge les nouveaux commits du remote, SANS toucher au dossier de travail
git pull origin main # équivalent à : git fetch + git merge (fusionne immédiatement)
```

> **Note :** `git fetch` seul est l'opération la plus "sûre" pour inspecter ce qui a changé côté remote (`git log origin/main`) avant de décider comment l'intégrer — `git pull` fait cette fusion automatiquement, ce qui peut surprendre si des conflits apparaissent sans qu'on s'y attende.

## Branches de suivi (*tracking branches*)

Une branche locale peut être liée à une branche distante, ce qui permet à Git de savoir où pousser/tirer sans le préciser à chaque fois :

```bash
git branch -vv                     # montre quelle branche distante chaque branche locale suit
git push -u origin ma-branche       # établit ce lien de suivi dès le premier push
```

## Cloner, un remote déjà configuré

```bash
git clone https://exemple.com/projet.git
```

`git clone` configure automatiquement `origin` pour pointer vers l'adresse clonée — c'est pour ça qu'un simple `git pull`/`git push` fonctionne immédiatement après un clone, sans configuration manuelle.

## Retirer un remote

```bash
git remote remove origin
```

Voir aussi le chapitre sur la résolution de conflits, fréquemment nécessaire après un `pull` quand plusieurs personnes ont modifié les mêmes lignes.
