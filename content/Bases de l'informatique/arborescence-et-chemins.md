---
order: 4
---

# Arborescence de fichiers et chemins

Un [fichier](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) ne flotte pas seul sur le disque : il est rangé dans un dossier, lui-même rangé dans un autre dossier. Ce chapitre explique comment cette organisation fonctionne, et comment désigner précisément un fichier dedans.

## Le dossier : ranger des fichiers, et d'autres dossiers

Un **dossier** (ou **répertoire**, *directory*) contient des fichiers — et peut aussi contenir d'autres dossiers. En répétant ça plusieurs niveaux de profondeur, on obtient une structure en arbre : l'**arborescence**.

```text
Documents/
├── photos/
│   ├── vacances.jpg
│   └── famille.jpg
└── travail/
    └── rapport.docx
```

> **Analogie :** comme des dossiers de classement rangés dans des tiroirs, eux-mêmes rangés dans une armoire — retrouver une feuille précise demande de connaître l'armoire, le tiroir, puis le dossier.

> **Piège :** supprimer un dossier supprime **tout** son contenu avec lui, y compris les dossiers qu'il contient — souvent sans demander de confirmation par fichier individuellement.
>
> **Bonne pratique :** avant de supprimer un dossier, vérifier son contenu (lister ce qu'il contient) plutôt que de supposer qu'il est vide ou sans importance.

## Le chemin : l'adresse complète d'un fichier

Un **chemin** (*path*) décrit où trouver un fichier ou un dossier, en listant les dossiers à traverser, séparés par un caractère qui dépend du système :

| Système | Séparateur | Exemple |
|---|---|---|
| Linux / macOS | `/` | `Documents/photos/vacances.jpg` |
| Windows | `\` | `Documents\photos\vacances.jpg` |

> **Piège :** copier un chemin Windows (avec `\`) dans un terminal Linux/macOS. Sur ces systèmes, `\` n'est pas un séparateur : c'est un caractère d'échappement qui change le sens du caractère suivant — le chemin ne sera pas interprété comme prévu.
>
> **Bonne pratique :** toujours utiliser le séparateur du système sur lequel la commande s'exécute réellement, jamais celui de la machine où le chemin a été écrit à l'origine.

## Chemin absolu vs chemin relatif

| | Chemin absolu | Chemin relatif |
|---|---|---|
| Point de départ | La **racine** — toujours le même, peu importe où on se trouve | Le **dossier courant** — là où le terminal "se trouve" actuellement |
| À quoi ça ressemble | `/home/jean/Documents/rapport.docx` (Linux) ou `C:\Users\jean\Documents\rapport.docx` (Windows) | `Documents/rapport.docx`, si on est déjà dans `/home/jean` |
| Avantage | Fonctionne depuis n'importe où | Plus court à écrire, et reste valable si tout le projet est déplacé ensemble |

La **racine** est le tout premier dossier de l'arborescence, celui dont tous les autres découlent : `/` sous Linux/macOS, une lettre de lecteur (`C:\`) sous Windows. Le **dossier courant** (*current working directory*) est l'endroit où vous êtes "positionné" dans cette arborescence à un instant donné — c'est justement ce que le [prompt du terminal](/?c=bases-de-l-informatique&p=le-terminal) affiche parfois, sans qu'on sache encore ce que ça signifiait.

> **Piège :** utiliser un chemin relatif en supposant être dans le bon dossier courant, sans l'avoir vérifié. La même commande, avec le même chemin relatif, peut agir sur un fichier totalement différent selon l'endroit d'où elle est lancée.
>
> **Bonne pratique :** en cas de doute, afficher le dossier courant avant une commande qui modifie ou supprime un fichier via un chemin relatif — un chemin absolu élimine complètement ce risque, au prix d'être plus long à écrire.

## Deux raccourcis universels : `.` et `..`

Quel que soit le shell, deux notations désignent toujours la même chose, de façon relative :

| Notation | Désigne |
|---|---|
| `.` | Le dossier courant lui-même |
| `..` | Le dossier parent, un niveau au-dessus |

```text
Documents/photos/../travail/rapport.docx
                 └─┬─┘
                   └── remonte d'un niveau (sort de "photos"), puis redescend dans "travail"
```

> **Piège :** oublier l'espace entre la commande de déplacement et `..` (taper `cd..` au lieu de `cd ..`). Sans l'espace, le shell lit un seul mot (`cd..`) qu'il ne reconnaît comme aucune commande, plutôt que la commande `cd` suivie de l'argument `..`.
>
> **Bonne pratique :** en cas de message "commande introuvable" inattendu sur une commande par ailleurs correcte, vérifier en premier lieu les espaces avant la ponctuation.

## Se déplacer et lister depuis le terminal

Changer de dossier courant et lister le contenu d'un dossier sont deux actions de base — mais le nom exact des commandes dépend du shell utilisé, déjà vu au [chapitre sur le terminal](/?c=bases-de-l-informatique&p=le-terminal) :

- Sous Bash : voir [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers).
- Sous PowerShell : voir [Commandes de base](/?c=shells&s=powershell&p=commandes-de-base).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les fichiers sont rangés dans des dossiers, organisés en arborescence. Un **chemin** décrit leur emplacement : **absolu** depuis la racine (toujours valable), ou **relatif** depuis le **dossier courant** (plus court). `.` désigne le dossier courant, `..` son parent. |
| **Outils utilisables** | Les commandes de navigation et de listing propres à votre shell — voir les chapitres Bash/PowerShell liés ci-dessus. |
| **Pièges à éviter** | Utiliser un chemin relatif en supposant être dans le bon dossier courant, sans l'avoir vérifié — la même commande peut alors agir sur un fichier totalement différent selon d'où elle est lancée. |
| **Bonnes pratiques** | En cas de doute sur l'endroit où l'on se trouve, vérifier le dossier courant avant de lancer une commande qui modifie ou supprime un fichier via un chemin relatif. |
