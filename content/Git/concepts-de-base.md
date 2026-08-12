---
order: 1
---

# Les concepts de base de Git

**Git** est un logiciel de *gestion de versions* : il garde en mémoire l'historique complet des modifications d'un projet, pour pouvoir revenir à un état antérieur, comprendre qui a changé quoi et pourquoi, ou faire travailler plusieurs personnes sur le même code sans écraser leur travail respectif. Les commandes qui suivent s'exécutent dans un [terminal](/?c=bases-de-l-informatique&p=le-terminal).

Git suit l'évolution d'un projet en enregistrant, à chaque instant choisi, un **instantané** (snapshot) complet de l'état des fichiers : contrairement à l'idée reçue, ce n'est pas une simple liste de différences ligne par ligne, même si c'est souvent ainsi qu'on le visualise (`git diff`).

## Les trois zones de travail

```text
Dossier de travail  -->  Zone de staging  -->  Dépôt (historique)
(working directory)      (index)               (commits)

git add                  git commit
```

| Zone | Rôle |
|---|---|
| **Dossier de travail** | Les fichiers tels qu'ils existent réellement sur le disque, modifiables librement |
| **Zone de staging** (*index*) | Une zone intermédiaire : les modifications qu'on a explicitement choisi d'inclure dans le **prochain** commit |
| **Dépôt** (*repository*) | L'historique complet, chaque commit étant un instantané permanent |

> **Note :** cette étape intermédiaire de staging est une particularité de Git par rapport à d'autres systèmes plus anciens (comme [SVN](https://fr.wikipedia.org/wiki/Apache_Subversion), non traité sur ce site) : elle permet de choisir précisément **quelles** modifications entrent dans un commit, même si plusieurs fichiers ont été modifiés en même temps.

## Un commit : un instantané, pas une différence

Chaque commit référence :
- Un instantané complet des fichiers suivis à cet instant.
- Un ou plusieurs commits **parents** (le(s) commit(s) précédent(s)).
- Un auteur, une date, et un message décrivant le changement.
- Un identifiant unique : un **hash SHA-1** (ex. `a3f9c1d...`), calculé à partir du contenu : deux commits identiques auraient le même hash, et modifier un commit passé change son hash (et celui de tous ses descendants).

> **SHA-1** (*Secure Hash Algorithm 1*) est une fonction de hachage : elle transforme une donnée de taille quelconque en une empreinte de taille fixe (40 caractères hexadécimaux ici). Deux propriétés la rendent utile à Git : la même entrée donne toujours la même empreinte, et le moindre changement dans l'entrée produit une empreinte totalement différente. C'est ce qui permet d'identifier un contenu par son empreinte, et de détecter toute altération de l'historique.

```text
commit A <-- commit B <-- commit C (HEAD)
```

Chaque commit pointe vers son parent, formant une chaîne : c'est cette chaîne qui constitue l'historique du projet.

## `HEAD` : où vous êtes actuellement

`HEAD` est un pointeur qui désigne le commit sur lequel vous travaillez actuellement ; la plupart du temps, il pointe vers le dernier commit de la [branche](/?c=git&p=branches) courante, et avance automatiquement à chaque nouveau commit.

## Fichiers suivis, non suivis, modifiés

```bash
git status
```

`git status` classe les fichiers du dossier de travail en plusieurs catégories : suivis et inchangés (rien à signaler), suivis et modifiés (pas encore ajoutés au staging), en attente dans le staging (prêts pour le prochain commit), ou non suivis, jamais ajoutés à Git (voir le chapitre [Le fichier .gitignore](/?c=git&p=gitignore)) pour exclure volontairement certains fichiers de ce suivi.

Voir aussi [Les commandes essentielles](/?c=git&p=commandes-essentielles) pour la pratique concrète de ce cycle `add` → `commit`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Git enregistre des instantanés complets (pas des différences) dans trois zones successives : dossier de travail → staging (`git add`) → dépôt (`git commit`). Chaque commit a un hash SHA-1 unique et pointe vers son commit parent, formant l'historique. `HEAD` désigne le commit actuellement actif. |
| **Outils utilisables** | `git status` pour voir l'état des fichiers ; `git add`/`git commit` pour faire progresser un changement du dossier de travail vers le dépôt. |
| **Pièges à éviter** | Confondre le staging avec un simple brouillon : tant qu'un fichier modifié n'est pas ajouté (`git add`), il ne fera pas partie du prochain commit, même si le commit est lancé juste après. |
| **Bonnes pratiques** | Vérifier `git status` avant chaque commit pour ne jamais inclure un fichier par erreur (ou en oublier un). |
