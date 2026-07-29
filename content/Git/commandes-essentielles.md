---
order: 2
---

# Les commandes essentielles

Ce chapitre couvre le cycle de travail Git le plus courant : initialiser un dépôt (ou en récupérer un existant), suivre des modifications, et les enregistrer sous forme de commits.

## Créer ou récupérer un dépôt

```bash
git init                              # transforme le dossier courant en dépôt Git (vide, aucun historique)
git clone https://exemple.com/projet.git   # récupère un dépôt existant, avec tout son historique
```

## Voir l'état du dossier de travail

```bash
git status
```

Affiche quels fichiers sont modifiés, lesquels sont dans la zone de staging, et lesquels ne sont pas suivis (cf. chapitre sur les concepts de base).

## Ajouter des modifications au staging

```bash
git add fichier.txt        # ajoute un fichier précis
git add dossier/            # ajoute tout un dossier
git add .                   # ajoute tout ce qui a changé dans le dossier courant et ses sous-dossiers
git add -p                  # mode interactif : choisir précisément quels blocs de lignes ajouter
```

> **Note :** `git add .` ajoute aussi les fichiers non suivis — s'assurer que `.gitignore` (cf. chapitre dédié) est à jour avant, pour ne pas ajouter accidentellement des fichiers qui ne devraient jamais entrer dans l'historique (secrets, dépendances, fichiers générés...).

## Créer un commit

```bash
git commit -m "Corrige le calcul de la remise"
git commit -am "Message"   # raccourci : ajoute automatiquement les fichiers déjà suivis ET modifiés, sans "git add" préalable
```

> **Note :** `-a` (dans `-am`) n'ajoute **que** les fichiers déjà suivis par Git — un fichier tout nouveau, jamais ajouté auparavant, doit toujours passer par un `git add` explicite au moins une fois.

Un bon message de commit décrit le **pourquoi** du changement, pas seulement le quoi (le diff montre déjà ce qui a changé) — utile pour comprendre l'historique bien après coup.

## Consulter l'historique

```bash
git log                     # historique complet, du plus récent au plus ancien
git log --oneline            # une ligne par commit, plus lisible pour un survol rapide
git log --oneline --graph --all   # visualise aussi les branches et leurs points de divergence/fusion
git log -p fichier.txt        # historique détaillé (avec diff) d'un fichier précis
```

## Voir les différences

```bash
git diff                     # différences non encore ajoutées au staging
git diff --staged             # différences déjà ajoutées au staging, pas encore commitées
git diff commit1 commit2      # différences entre deux commits précis
```

## Voir le détail d'un commit

```bash
git show a3f9c1d   # affiche le message, l'auteur, la date et le diff complet de ce commit précis
```
