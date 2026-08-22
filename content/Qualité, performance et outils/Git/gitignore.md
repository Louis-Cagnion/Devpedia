---
order: 3
---

# Le fichier .gitignore

`.gitignore` liste les fichiers et dossiers que Git doit **ignorer** : ne jamais proposer à l'ajout, ne jamais suivre, même avec un `git add .`. Indispensable pour ne pas polluer l'historique avec des fichiers générés, des dépendances, ou des secrets.

## Syntaxe de base

```text
# Commentaire
*.log              # ignore tous les fichiers se terminant par .log, où qu'ils soient
node_modules/       # ignore ce dossier entier, à la racine ou ailleurs
/build              # le '/' en préfixe restreint à la racine du dépôt uniquement
.env                # ignore ce fichier précis
!important.log      # exception : NE PAS ignorer ce fichier précis, malgré la règle *.log au-dessus
```

| Motif | Signification |
|---|---|
| `*.ext` | Tout fichier avec cette extension, à n'importe quel niveau |
| `dossier/` | Ce dossier et tout son contenu |
| `/chemin` | Uniquement à la racine du dépôt (pas dans un sous-dossier du même nom) |
| `!motif` | Exception à une règle précédente |

## Ce qu'il faut typiquement ignorer

- Les dépendances installées (`node_modules/`, `vendor/`), reconstructibles à partir d'un fichier de dépendances (`package.json`, `composer.json`...).
- Les fichiers de configuration contenant des secrets (`.env`, clés d'API...).
- Les fichiers générés par la compilation ou le build (`*.o`, `dist/`, `build/`).
- Les fichiers propres à un éditeur ou un système d'exploitation (`.DS_Store`, `.vscode/`, `*.swp`).

## `.gitignore` n'agit que sur les fichiers **jamais suivis**

```bash
git rm --cached fichier_deja_suivi.txt
```

> **Note :** ajouter un fichier à `.gitignore` n'a **aucun effet** s'il est déjà suivi par Git (déjà commité au moins une fois) : Git continue de suivre ses modifications comme avant. Il faut d'abord le retirer explicitement du suivi avec `git rm --cached` (qui le laisse intact sur le disque, mais arrête de le suivre), avant que la règle `.gitignore` ne prenne effet.

## Portée du `.gitignore`

Un dépôt peut contenir plusieurs fichiers `.gitignore`, chacun s'appliquant au dossier où il se trouve et à ses sous-dossiers, utile pour des règles spécifiques à un sous-projet, en plus des règles globales à la racine.

## Des règles personnelles, hors du dépôt : `~/.gitignore_global`

Un `.gitignore` classique (vu plus haut) est un fichier du projet comme un autre : il est lui-même suivi et commité, donc partagé avec tous les contributeurs. Ça pose un problème pour des fichiers qui ne dépendent que de **votre propre machine** (les fichiers temporaires d'un éditeur que vous seul utilisez, par exemple) : les ajouter au `.gitignore` du projet imposerait cette règle à des collègues qui n'utilisent peut-être pas le même éditeur.

La solution est un second fichier, placé en dehors de tout dépôt, dans votre dossier personnel :

```bash
# 1. Créer le fichier, où vous voulez (ex. le dossier personnel)
echo ".idea/" > ~/.gitignore_global
echo "*.swp" >> ~/.gitignore_global

# 2. Dire à Git, une fois pour toutes, où le trouver
git config --global core.excludesfile ~/.gitignore_global
```

`git config --global` (voir aussi le chapitre [Les remotes](/?c=git&p=remotes) pour d'autres réglages `--global`) écrit ce réglage dans `~/.gitconfig`, un fichier de configuration propre à votre compte utilisateur sur cette machine, en dehors de tout dépôt Git : `core.excludesfile` y indique à Git l'emplacement d'un `.gitignore` supplémentaire à appliquer à **tous vos dépôts locaux**, en plus du `.gitignore` propre à chacun.

| | `.gitignore` (dans le dépôt) | `~/.gitignore_global` |
|---|---|---|
| Suivi par Git, commité | Oui | Non : il n'est jamais placé à l'intérieur d'un dépôt |
| Visible par les autres contributeurs | Oui, dès qu'ils clonent le projet | Non : le réglage vit dans `~/.gitconfig`, propre à votre machine |
| Portée | Un seul projet (et ses sous-dossiers) | Tous les dépôts Git de votre machine |
| Contenu typique | Dépendances, secrets, fichiers de build du projet | Fichiers propres à votre éditeur/OS (`.idea/`, `.DS_Store`, `*.swp`) |

C'est cette différence (fichier suivi et partagé vs réglage local à la machine) qui explique pourquoi une règle placée dans `~/.gitignore_global` n'apparaît jamais pour les autres contributeurs, même après un `git push` : elle n'a jamais été commitée, puisqu'elle ne vit pas dans le dépôt.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `.gitignore` exclut des fichiers du suivi Git : ils ne sont jamais proposés à l'ajout, même avec `git add .`. Les règles s'appliquent par dossier, avec `!motif` pour créer des exceptions. |
| **Outils utilisables** | Motifs `*.ext`, `dossier/`, `/chemin`, `!motif` ; `git rm --cached` pour retirer un fichier déjà suivi du suivi. |
| **Pièges à éviter** | Ajouter un fichier à `.gitignore` n'a **aucun effet** s'il est déjà suivi (déjà commité) : il faut d'abord `git rm --cached` avant que la règle ne prenne effet. |
| **Bonnes pratiques** | Exclure dépendances, secrets et fichiers générés dès la création du dépôt, avant le tout premier commit. |
