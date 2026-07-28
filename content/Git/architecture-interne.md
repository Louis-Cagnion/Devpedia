---
title: L'architecture interne de Git
---

Les commandes vues dans les autres chapitres (`add`, `commit`, `branch`...) ne sont que la partie visible ("porcelaine") d'un mécanisme de stockage étonnamment simple : une base de données clé-valeur **adressée par contenu**, où la clé de chaque donnée est le hash de son propre contenu. Comprendre ce modèle permet de "voir à travers" n'importe quelle commande Git, et donne les briques nécessaires pour concevoir un système de versionnement similaire.

## Une base de données adressée par contenu

Chaque donnée stockée par Git (le contenu d'un fichier, une structure de dossier, un commit...) est sauvegardée sous forme d'un **objet**, identifié uniquement par le hash SHA-1 de son propre contenu :

```
contenu -> SHA-1(contenu) -> clé de stockage
```

```bash
echo "Bonjour" | git hash-object --stdin
# c6b7f... -> toujours le même hash pour le même contenu, peu importe où/quand
```

> **Note :** une **fonction de hachage** (ici SHA-1) transforme une entrée de taille quelconque en un nombre de taille fixe, de façon déterministe (même entrée → toujours le même résultat) et bien répartie (deux contenus, même très proches, produisent des résultats très différents — c'est ce qui rend une collision accidentelle extrêmement improbable). Voir le chapitre sur les tables de hachage (rubrique C) pour ce mécanisme appliqué à une structure de données concrète.

Concrètement, chaque objet est compressé (zlib, un algorithme de compression sans perte) et stocké dans `.git/objects/`, sous un chemin dérivé de son hash : les 2 premiers caractères hexadécimaux forment un sous-dossier, les 38 restants le nom du fichier (`.git/objects/c6/b7f4a2...`). C'est ni plus ni moins qu'une **table de hachage** (cf. chapitre dédié, rubrique C) stockée directement sur le système de fichiers — le sous-dossier joue le rôle d'une case (*bucket*).

> **Conséquence directe :** deux fichiers avec un contenu strictement identique produisent le **même** hash, et donc le **même** objet stocké une seule fois — une déduplication automatique et gratuite, propriété inhérente au modèle, pas une optimisation ajoutée après coup.

## Les quatre types d'objets

| Type | Contenu |
|---|---|
| **blob** | Le contenu brut d'un fichier — uniquement les octets, aucun nom de fichier ni métadonnée |
| **tree** | Une liste d'entrées (mode, type, nom, hash) — représente un dossier, chaque entrée pointant vers un blob (fichier) ou un autre tree (sous-dossier) |
| **commit** | Un hash de tree (l'instantané racine), un ou plusieurs hash de commit parent(s), auteur, date, message |
| **tag** (annoté) | Un hash d'objet ciblé (généralement un commit), un message — utilisé par `git tag -a` |

```
commit ---> tree (racine du projet)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (parent)
```

> **Note :** un blob ne connaît **pas** son propre nom de fichier — c'est le `tree` qui contient l'association "ce nom de fichier correspond à ce hash de blob". C'est pour ça que renommer un fichier sans en changer le contenu ne crée aucun nouveau blob : seul le `tree` (et donc, en cascade, le commit) change.

## Ce que fait réellement `git add` puis `git commit`

1. `git add fichier.txt` : calcule le SHA-1 du contenu du fichier, le compresse, l'écrit comme objet **blob** dans `.git/objects/`, et enregistre une entrée dans l'**index** (`.git/index`, le vrai nom de fichier de la zone de staging) associant le chemin du fichier à ce hash de blob.
2. `git commit` : construit récursivement les objets **tree** correspondant à l'état actuel de l'index (un tree par dossier), crée un objet **commit** pointant vers le tree racine et vers le commit courant de `HEAD` (qui devient son parent), puis met à jour la référence de la branche courante pour qu'elle pointe vers ce nouveau commit.

## Les refs : de simples fichiers texte

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> juste 40 caractères hexadécimaux, rien de plus
```

Une branche n'est **littéralement rien d'autre** qu'un fichier contenant un hash de commit. `git branch nouvelle` crée simplement un nouveau fichier dans `.git/refs/heads/`, copié depuis le commit courant.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD ne contient pas un hash, mais le CHEMIN vers la ref courante
```

`HEAD` est un pointeur vers un pointeur : changer de branche (`git checkout autre-branche`) ne modifie qu'une seule ligne dans `.git/HEAD`, qui se met à référencer un autre fichier de `refs/heads/`. En mode *detached HEAD* (cf. chapitre sur les tags), `.git/HEAD` contient directement un hash de commit, sans passer par une ref nommée.

## Pourquoi modifier un commit change tous ses descendants

Le hash d'un commit dépend de **tout son contenu**, y compris le hash de son commit parent. Modifier un commit ancien (via un rebase ou un `commit --amend`) change donc son propre hash — et comme chaque commit suivant référence le hash de son parent, leur contenu (et donc leur hash à eux aussi) change en cascade. C'est ce mécanisme exact qui explique pourquoi un rebase (cf. chapitre dédié) produit des commits aux hash différents des originaux, même à contenu de fichier identique.

## Objets isolés vs packfiles

Chaque nouvel objet commence sa vie comme un fichier compressé indépendant ("*loose object*"). Périodiquement (`git gc`, ou automatiquement lors d'un `push`), Git regroupe ces objets dans un **packfile** : un seul gros fichier où les objets similaires sont stockés sous forme de **deltas** (un objet complet de référence, puis une suite de différences plutôt que des copies complètes) — bien plus compact pour un historique volumineux.

## Plomberie vs porcelaine

Les commandes du quotidien (`add`, `commit`, `merge`...) sont la **porcelaine** : une interface conviviale construite entièrement au-dessus de commandes plus bas niveau, la **plomberie**, qui manipulent directement les objets :

```bash
echo "contenu" | git hash-object -w --stdin   # crée un blob, affiche son hash
git cat-file -p a3f9c1d                        # affiche le contenu décompressé d'un objet
git cat-file -t a3f9c1d                        # affiche son type (blob/tree/commit/tag)
git write-tree                                  # construit un objet tree depuis l'index actuel
git commit-tree a3f9c1d -m "message"             # crée manuellement un objet commit
git update-ref refs/heads/main a3f9c1d           # déplace manuellement une branche vers un commit
```

Un `git commit` "normal" n'est, sous le capot, rien de plus qu'un enchaînement de `write-tree`, `commit-tree` et `update-ref`.

## Concevoir son propre système de versionnement

Les briques nécessaires à un système minimal, dans cet ordre logique :

1. **Un stockage clé-valeur adressé par contenu** : une fonction de hash (SHA-1, ou plus simple pour un prototype) + de la compression + un système de fichiers ou une table de hachage pour stocker chaque objet sous sa propre clé.
2. **Une structure d'arbre** pour représenter un instantané complet d'une arborescence de dossiers à un instant donné (le `tree`).
3. **Des objets commit chaînés** par un pointeur vers leur(s) parent(s) — c'est cette chaîne qui constitue l'historique.
4. **Des pointeurs nommés et mutables** (les branches) pointant vers un commit, plus un pointeur spécial (`HEAD`) indiquant "où on en est" actuellement.
5. **Un algorithme de diff** (ex. l'algorithme de Myers) — nécessaire uniquement pour afficher des différences lisibles ou fusionner des branches, mais pas pour le modèle de stockage lui-même, qui n'en a structurellement pas besoin.
