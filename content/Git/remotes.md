---
order: 8
---

# Les dépôts distants (remotes)

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

## Forcer un push après une réécriture d'historique

Après un `rebase`, un `commit --amend`, ou une réécriture d'historique (voir [L'architecture interne de Git](/?c=git&p=architecture-interne)), les commits locaux n'ont plus les mêmes hash que ceux déjà poussés : un `push` normal est alors rejeté (*non fast-forward*), le remote ne retrouvant pas ses anciens commits comme ancêtres des nouveaux.

```bash
git push --force origin main             # écrase l'historique distant sans condition, dangereux si quelqu'un d'autre a poussé entre-temps
git push --force-with-lease origin main   # écrase seulement si le remote est encore dans l'état vu lors du dernier fetch
```

> **Note :** `--force-with-lease` compare l'état réel du remote à ce que la branche de suivi locale (`origin/main`) connaissait lors du dernier `fetch` : s'ils diffèrent (quelqu'un d'autre a poussé entre-temps, ou cette branche de suivi a elle-même été modifiée par une opération locale), le push est rejeté (`stale info`) plutôt que d'écraser un travail qu'on n'a pas vu. Toujours préférer `--force-with-lease` à `--force`, sauf certitude absolue d'être seul sur la branche.

## `fetch` vs `pull`

```bash
git fetch origin    # télécharge les nouveaux commits du remote, SANS toucher au dossier de travail
git pull origin main # équivalent à : git fetch + git merge (fusionne immédiatement)
```

> **Note :** `git fetch` seul est l'opération la plus "sûre" pour inspecter ce qui a changé côté remote (`git log origin/main`) avant de décider comment l'intégrer ; `git pull` fait cette fusion automatiquement, ce qui peut surprendre si des conflits apparaissent sans qu'on s'y attende.

## Branches de suivi (*tracking branches*)

Une branche locale peut être liée à une branche distante, ce qui permet à Git de savoir où pousser/tirer sans le préciser à chaque fois :

```bash
git branch -vv                     # montre quelle branche distante chaque branche locale suit
git push -u origin ma-branche       # établit ce lien de suivi dès le premier push
```

## Cloner un remote déjà configuré

```bash
git clone https://exemple.com/projet.git
```

`git clone` configure automatiquement `origin` pour pointer vers l'adresse clonée : c'est pour ça qu'un simple `git pull`/`git push` fonctionne immédiatement après un clone, sans configuration manuelle.

## Sauvegarder ou transférer un dépôt sans serveur : `git bundle`

`git bundle` empaquette tout ou partie d'un dépôt (commits, branches, tags) dans un unique fichier binaire, sans avoir besoin d'un serveur remote :

```bash
git bundle create sauvegarde.bundle --all   # capture toutes les refs (branches, tags, HEAD) dans un seul fichier
git bundle verify sauvegarde.bundle          # vérifie que le bundle est complet et exploitable
git clone sauvegarde.bundle nouveau-dossier   # un bundle se clone comme un remote classique
```

> **Note :** un bundle est un instantané figé : il ne se met pas à jour tout seul. C'est l'outil naturel pour une sauvegarde ponctuelle avant une opération risquée (réécriture d'historique, par exemple), ou pour transférer un dépôt vers une machine sans réseau (clé USB).

## Retirer un remote

```bash
git remote remove origin
```

Voir aussi [Résoudre un conflit de fusion](/?c=git&p=resoudre-conflits), fréquemment nécessaire après un `pull` quand plusieurs personnes ont modifié les mêmes lignes.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un remote référence une copie du dépôt hébergée ailleurs. `push`/`pull`/`fetch` synchronisent le travail entre le dépôt local et ce remote. |
| **Outils utilisables** | `git remote`, `git push`/`pull`/`fetch`, `git bundle` (sauvegarde ou transfert sans serveur). |
| **Pièges à éviter** | `git push --force` peut écraser le travail de quelqu'un d'autre sans prévenir. |
| **Bonnes pratiques** | Préférer `--force-with-lease` à `--force` ; utiliser `fetch` pour inspecter les changements distants avant de décider comment les intégrer, plutôt qu'un `pull` direct en cas de doute. |
