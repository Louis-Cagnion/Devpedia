---
order: 1
---

# Commandes de base

Ce chapitre suppose déjà acquis ce qu'est un [terminal](/?c=bases-de-l-informatique&p=le-terminal) et un [chemin de fichier](/?c=bases-de-l-informatique&p=arborescence-et-chemins) : il couvre les toutes premières commandes Bash utilisées dans un terminal, avant même d'écrire le moindre script.

## Se déplacer : `cd` et `pwd`

```bash
pwd           # affiche le dossier courant (Print Working Directory)
cd Documents  # se déplace dans le sous-dossier "Documents"
cd ..         # remonte d'un niveau
cd -          # retourne au dossier précédent
```

> **Piège :** `cd` sans argument ne "ne fait rien" : il ramène directement au dossier personnel (`$HOME`), ce qui surprend qui s'attendait à rester sur place.
>
> **Bonne pratique :** vérifier sa position avec `pwd` après un `cd` sans argument, plutôt que de supposer être resté au même endroit.

## Lister un dossier : `ls`

```bash
ls     # liste le contenu du dossier courant
ls -a  # inclut les fichiers cachés (dont le nom commence par un point)
ls -l  # affiche les détails (permissions, taille, date) plutôt que juste les noms
```

| Option | Effet |
|---|---|
| `-a` | Affiche aussi les fichiers/dossiers cachés |
| `-l` | Format détaillé (une ligne par fichier, avec permissions et taille) |
| `-la` | Les deux combinées : l'ordre des lettres n'a pas d'importance |

> **Piège :** un dossier qui semble vide ou incomplet avec un simple `ls` peut en réalité contenir des fichiers cachés (leur nom commence par un point, ex. `.env`, `.gitignore`), invisibles sans `-a`.
>
> **Bonne pratique :** face à un dossier dont le contenu semble incohérent avec ce qui est attendu, refaire le `ls` avec `-a` avant de chercher plus loin.

## Lire le contenu d'un fichier : `cat`

```bash
cat fichier.txt   # affiche tout le contenu du fichier dans le terminal
```

> **Note :** pour un fichier trop long pour tenir sur un écran, voir le chapitre sur le traitement de texte (`less`, `head`, `tail`) ; `cat` affiche tout d'un bloc, sans pagination.

> **Piège :** utiliser `cat` sur un fichier binaire (une image, un exécutable) plutôt qu'un fichier texte. Le terminal tente d'afficher des octets qui ne sont pas du texte valide, ce qui peut le rendre visuellement corrompu (caractères étranges, couleurs qui persistent), sans rien avoir cassé réellement.
>
> **Bonne pratique :** ne réserver `cat` qu'à des fichiers texte connus. Si le terminal reste affiché de façon incohérente après ce genre d'erreur, la commande `reset` (ou fermer/rouvrir le terminal) le remet dans un état propre.

## Créer, copier, déplacer, supprimer

Ces commandes sont couvertes avec le système de permissions, dans le chapitre suivant : [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers).

## Obtenir de l'aide : `man` et `--help`

```bash
man ls     # ouvre le manuel complet de la commande ls (q pour quitter)
ls --help  # résumé plus court, directement dans le terminal
```

### Le manuel est découpé en plusieurs sections

`man` ne couvre pas que les commandes de terminal : c'est le manuel de tout le système, découpé en **sections numérotées**, chacune dédiée à une catégorie différente de sujet.

| Section | Contenu |
|---|---|
| 1 | Commandes utilisateur (celles tapées dans un terminal : `ls`, `cd`, `grep`...) |
| 2 | Appels système (fonctions fournies directement par le noyau Linux) |
| 3 | Fonctions de bibliothèque du langage C (`printf`, `malloc`...) |
| 5 | Formats de fichiers et conventions (ex. la structure de `/etc/passwd`) |
| 7 | Divers : conventions générales, protocoles |
| 8 | Commandes d'administration système (généralement réservées à root) |

Ça devient concret dès qu'un même nom existe dans **plusieurs** sections à la fois : `printf` est à la fois une commande de terminal (section 1) et une fonction du langage C (section 3, cf. [chapitre C dédié](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)), et ce sont deux pages de manuel complètement différentes :

```bash
man printf    # sans précision, ouvre la section la plus basse trouvée : ici, la 1 (commande)
man 3 printf  # force l'ouverture de la section 3 : la fonction C, pas la commande
```

Pour savoir dans quelles sections un nom existe avant de choisir :

```bash
man -f printf  # liste toutes les sections où "printf" a une page de manuel
whatis printf  # équivalent, avec une description d'une ligne pour chacune
```

### Piège : `man cd` ne fonctionne pas comme attendu

```bash
man cd
# No manual entry for cd
```

`cd` n'est pas un programme séparé sur le disque : c'est une **commande interne** (*builtin*), exécutée directement par Bash lui-même plutôt que lancée comme un processus à part (voir [Exécuter une commande : builtin vs externe](/?c=shells&s=bash&p=architecture-dun-shell) pour pourquoi `cd` doit obligatoirement fonctionner ainsi). `man` cherche une page dédiée à un exécutable : il n'y en a pas pour un builtin. La bonne commande dans ce cas est `help` :

```bash
help cd   # documentation du builtin cd, fournie par Bash lui-même
man bash  # alternative : toutes les builtins y sont aussi documentées, dans la section "SHELL BUILTIN COMMANDS"
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `pwd` affiche où on est, `cd` change de dossier, `ls` liste un dossier, `cat` affiche un fichier. Les options (`-l`, `-a`) modifient le comportement d'une commande sans en changer le nom. |
| **Outils utilisables** | `man <commande>` pour la documentation complète, `<commande> --help` pour un résumé rapide, `man -f <nom>`/`whatis <nom>` pour voir dans quelles sections un nom existe, `help <builtin>` pour une commande interne comme `cd`. |
| **Pièges à éviter** | `cd` sans argument ramène au dossier personnel (`$HOME`) plutôt que de ne rien faire. `man <nom>` sans préciser de section ouvre la première trouvée : pas nécessairement celle voulue si le nom existe ailleurs (ex. `printf`, commande **et** fonction C). `man <builtin>` (ex. `man cd`) échoue purement et simplement : un builtin n'a pas de page dédiée, `help` le remplace. |
| **Bonnes pratiques** | Vérifier sa position avec `pwd` avant une commande qui agit sur un chemin relatif, plutôt que de la supposer. |
