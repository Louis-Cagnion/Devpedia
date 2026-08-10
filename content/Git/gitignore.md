---
order: 3
---

# Le fichier .gitignore

`.gitignore` liste les fichiers et dossiers que Git doit **ignorer** — ne jamais proposer à l'ajout, ne jamais suivre, même avec un `git add .`. Indispensable pour ne pas polluer l'historique avec des fichiers générés, des dépendances, ou des secrets.

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

> **Note :** ajouter un fichier à `.gitignore` n'a **aucun effet** s'il est déjà suivi par Git (déjà commité au moins une fois) — Git continue de suivre ses modifications comme avant. Il faut d'abord le retirer explicitement du suivi avec `git rm --cached` (qui le laisse intact sur le disque, mais arrête de le suivre), avant que la règle `.gitignore` ne prenne effet.

## Portée du `.gitignore`

Un dépôt peut contenir plusieurs fichiers `.gitignore`, chacun s'appliquant au dossier où il se trouve et à ses sous-dossiers — utile pour des règles spécifiques à un sous-projet, en plus des règles globales à la racine.

Un fichier `~/.gitignore_global` (configuré via `git config --global core.excludesfile ~/.gitignore_global`) permet aussi de définir des règles personnelles (ex. fichiers propres à son propre éditeur), sans les imposer aux autres contributeurs d'un projet partagé.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `.gitignore` exclut des fichiers du suivi Git — ils ne sont jamais proposés à l'ajout, même avec `git add .`. Les règles s'appliquent par dossier, avec `!motif` pour créer des exceptions. |
| **Outils utilisables** | Motifs `*.ext`, `dossier/`, `/chemin`, `!motif` ; `git rm --cached` pour retirer un fichier déjà suivi du suivi. |
| **Pièges à éviter** | Ajouter un fichier à `.gitignore` n'a **aucun effet** s'il est déjà suivi (déjà commité) — il faut d'abord `git rm --cached` avant que la règle ne prenne effet. |
| **Bonnes pratiques** | Exclure dépendances, secrets et fichiers générés dès la création du dépôt, avant le tout premier commit. |
