---
order: 2
---

# Les commandes essentielles

Ce chapitre couvre le cycle de travail Git le plus courant : initialiser un dépôt (ou en récupérer un existant), suivre des modifications, et les enregistrer sous forme de commits.

## Créer ou récupérer un dépôt

```bash
git init                                  # transforme le dossier courant en dépôt Git (vide, aucun historique)
git clone https://exemple.com/projet.git  # récupère un dépôt existant, avec tout son historique
```

## Voir l'état du dossier de travail

```bash
git status
```

Affiche quels fichiers sont modifiés, lesquels sont dans la zone de staging, et lesquels ne sont pas suivis (voir [Les concepts de base de Git](/?c=git&p=concepts-de-base)).

## Ajouter des modifications au staging

```bash
git add fichier.txt  # ajoute un fichier précis
git add dossier/     # ajoute tout un dossier
git add .            # ajoute tout ce qui a changé dans le dossier courant et ses sous-dossiers
git add -p           # mode interactif : choisir précisément quels blocs de lignes ajouter
```

> **Note :** `git add .` ajoute aussi les fichiers non suivis : s'assurer que [.gitignore](/?c=git&p=gitignore) est à jour avant, pour ne pas ajouter accidentellement des fichiers qui ne devraient jamais entrer dans l'historique (secrets, dépendances, fichiers générés...).

## Créer un commit

```bash
git commit -m "Corrige le calcul de la remise"
git commit -am "Message"   # raccourci : ajoute automatiquement les fichiers déjà suivis ET modifiés, sans "git add" préalable
```

> **Note :** `-a` (dans `-am`) n'ajoute **que** les fichiers déjà suivis par Git : un fichier tout nouveau, jamais ajouté auparavant, doit toujours passer par un `git add` explicite au moins une fois.

Un bon message de commit décrit le **pourquoi** du changement, pas seulement le quoi (le diff montre déjà ce qui a changé), utile pour comprendre l'historique bien après coup.

## Un message de commit à deux niveaux : titre et description

Un message de commit n'est, pour Git, qu'un seul bloc de texte : rien ne le force en "titre" ou "description" distincts. C'est une **convention**, pas une contrainte technique, mais elle est si largement adoptée ([GitHub](/?c=git&p=github-et-plateformes), `git log`, la plupart des outils qui affichent un historique) qu'elle vaut la peine d'être suivie systématiquement :

- La **première ligne** est le titre : un résumé court (traditionnellement sous 50-72 caractères), à l'impératif ("Corrige", "Ajoute", pas "Corrigé" ni "J'ai ajouté").
- Une **ligne vide** sépare le titre du reste.
- Tout ce qui suit est la **description** : le détail, le contexte, le "pourquoi" développé, sur autant de lignes que nécessaire.

```text
Corrige le calcul de la remise pour les commandes multi-articles

Le pourcentage n'était appliqué qu'au premier article de la commande,
au lieu du total : un bug introduit lors du dernier refactor de
`calculerRemise()`, jamais couvert par les tests existants.
```

C'est cette ligne vide, et elle seule, qui indique à un outil comme [GitHub](/?c=git&p=github-et-plateformes) où s'arrête le titre : sur la liste des commits d'un dépôt ou d'une pull request, seule la première ligne s'affiche par défaut (en gras) ; la description ne s'affiche qu'en dépliant le commit. `git log --oneline` fait la même chose : une ligne par commit, uniquement le titre.

## Écrire un message multi-lignes en ligne de commande

`git commit -m "message"` avec un seul `-m` ne produit qu'un titre, sans description. Trois façons d'obtenir les deux :

```bash
# 1. Sans -m : ouvre l'éditeur configuré (vim, nano...), où taper titre, ligne vide, puis description
git commit

# 2. Plusieurs -m : chacun devient un paragraphe séparé par une ligne vide, sans ouvrir d'éditeur
git commit -m "Corrige le calcul de la remise" -m "Le pourcentage n'était appliqué qu'au premier article, pas au total."

# 3. Une chaîne multi-lignes passée à un seul -m (utile pour scripter un commit, ou depuis un outil qui génère le message)
git commit -m "$(cat <<'EOF'
Corrige le calcul de la remise

Le pourcentage n'était appliqué qu'au premier article, pas au total.
EOF
)"
```

> **Note :** l'option 3 (`$(cat <<'EOF' ... EOF)`) n'est pas une fonctionnalité de Git : c'est un **heredoc**, une syntaxe du shell (voir [Écrire et exécuter un script Bash](/?c=shells&s=bash&p=scripts-et-shebang)) qui construit une chaîne multi-lignes, ensuite passée telle quelle à `-m`. `$(...)` capture la sortie de la commande `cat` (ici, tout ce qui se trouve entre les deux `EOF`) pour l'injecter comme un seul argument.

> **Piège :** écrire un titre de commit trop long, ou qui décrit le *comment* plutôt que le *pourquoi* ("Modifie ligne 42 de panier.php"). Un titre doit rester compréhensible seul, isolé dans une liste de dizaines d'autres titres, sans avoir besoin d'ouvrir le commit pour comprendre ce qu'il fait.
>
> **Bonne pratique :** réserver le titre à un résumé bref et actionnable, et détailler tout contexte utile (pourquoi ce changement, quel bug, quelle alternative écartée) dans la description plutôt que d'allonger le titre indéfiniment.

## Consulter l'historique

```bash
git log                          # historique complet, du plus récent au plus ancien
git log --oneline                # une ligne par commit, plus lisible pour un survol rapide
git log --oneline --graph --all  # visualise aussi les branches et leurs points de divergence/fusion
git log -p fichier.txt           # historique détaillé (avec diff) d'un fichier précis
```

## Voir les différences

```bash
git diff                  # différences non encore ajoutées au staging
git diff --staged         # différences déjà ajoutées au staging, pas encore commitées
git diff commit1 commit2  # différences entre deux commits précis
```

## Voir le détail d'un commit

```bash
git show a3f9c1d   # affiche le message, l'auteur, la date et le diff complet de ce commit précis
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `git init`/`clone` créent ou récupèrent un dépôt ; `git add` place des modifications en staging ; `git commit` les enregistre ; `git log`/`diff`/`show` inspectent l'historique. Un message de commit a un titre (première ligne) et une description optionnelle, séparés par une ligne vide : c'est cette ligne vide que GitHub et `git log` utilisent pour n'afficher que le titre par défaut. |
| **Outils utilisables** | `git status`, `git add`, `git commit` (plusieurs `-m`, ou sans `-m` pour l'éditeur), `git log`, `git diff`, `git show`. |
| **Pièges à éviter** | `git add .` ajoute aussi les fichiers non suivis : vérifier `.gitignore` avant ; `-am` n'ajoute pas les fichiers jamais suivis, un `git add` explicite reste nécessaire au moins une fois ; un titre de commit trop long ou qui décrit le *comment* plutôt que le *pourquoi*. |
| **Bonnes pratiques** | Décrire le *pourquoi* du changement dans le message de commit, pas seulement le *quoi* ; vérifier `git status` avant chaque commit ; garder le titre court et actionnable, détailler le contexte dans la description. |
