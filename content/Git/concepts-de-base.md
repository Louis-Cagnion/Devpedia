---
title: Les concepts de base de Git
---

Git suit l'évolution d'un projet en enregistrant, à chaque instant choisi, un **instantané** (snapshot) complet de l'état des fichiers — contrairement à l'idée reçue, ce n'est pas une simple liste de différences ligne par ligne, même si c'est souvent ainsi qu'on le visualise (`git diff`).

## Les trois zones de travail

```
Dossier de travail  -->  Zone de staging  -->  Dépôt (historique)
(working directory)      (index)               (commits)

git add                  git commit
```

| Zone | Rôle |
|---|---|
| **Dossier de travail** | Les fichiers tels qu'ils existent réellement sur le disque, modifiables librement |
| **Zone de staging** (*index*) | Une zone intermédiaire : les modifications qu'on a explicitement choisi d'inclure dans le **prochain** commit |
| **Dépôt** (*repository*) | L'historique complet, chaque commit étant un instantané permanent |

> **Note :** cette étape intermédiaire de staging est une particularité de Git par rapport à d'autres systèmes plus anciens (comme SVN) : elle permet de choisir précisément **quelles** modifications entrent dans un commit, même si plusieurs fichiers ont été modifiés en même temps.

## Un commit : un instantané, pas une différence

Chaque commit référence :
- Un instantané complet des fichiers suivis à cet instant.
- Un ou plusieurs commits **parents** (le(s) commit(s) précédent(s)).
- Un auteur, une date, et un message décrivant le changement.
- Un identifiant unique : un **hash SHA-1** (ex. `a3f9c1d...`), calculé à partir du contenu — deux commits identiques auraient le même hash, et modifier un commit passé change son hash (et celui de tous ses descendants).

```
commit A <-- commit B <-- commit C (HEAD)
```

Chaque commit pointe vers son parent, formant une chaîne : c'est cette chaîne qui constitue l'historique du projet.

## `HEAD` : où vous êtes actuellement

`HEAD` est un pointeur qui désigne le commit sur lequel vous travaillez actuellement — la plupart du temps, il pointe vers le dernier commit de la branche courante (cf. chapitre sur les branches), et avance automatiquement à chaque nouveau commit.

## Fichiers suivis, non suivis, modifiés

```bash
git status
```

`git status` classe les fichiers du dossier de travail en plusieurs catégories : suivis et inchangés (rien à signaler), suivis et modifiés (pas encore ajoutés au staging), en attente dans le staging (prêts pour le prochain commit), ou non suivis (jamais ajoutés à Git, cf. chapitre sur `.gitignore`).

Voir aussi le chapitre sur les commandes essentielles pour la pratique concrète de ce cycle `add` → `commit`.
