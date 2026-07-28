---
title: Expansion et jokers (globbing)
---

Avant d'exécuter une commande, Bash remplace certains motifs qu'elle contient par leur valeur réelle — variables (`$nom`, cf. chapitre dédié), mais aussi motifs de fichiers (*globbing*) et expansions d'accolades. Comprendre cette étape (invisible mais systématique) explique pourquoi certaines commandes se comportent différemment selon les guillemets utilisés.

## Le globbing : `*`, `?`, `[]`

```bash
ls *.txt        # tous les fichiers se terminant par .txt
ls fichier?.txt  # fichier1.txt, fichierA.txt... ('?' = exactement 1 caractère, n'importe lequel)
ls fichier[123].txt  # fichier1.txt, fichier2.txt ou fichier3.txt uniquement
ls fichier[a-z].txt  # une seule lettre minuscule à cette position
```

| Motif | Signifie |
|---|---|
| `*` | N'importe quelle suite de caractères (y compris vide) |
| `?` | Exactement un caractère, n'importe lequel |
| `[abc]` | Un seul caractère parmi `a`, `b` ou `c` |
| `[a-z]` | Un seul caractère dans cette plage |
| `[^abc]` | Un seul caractère qui n'est ni `a`, `b`, ni `c` |

> **Note :** ce n'est **pas** une regex (cf. chapitre dédié aux expressions régulières) — le globbing est plus simple, propre à l'interprétation des noms de fichiers par le shell lui-même, avant même que la commande ne soit lancée.

## Attention : que se passe-t-il si aucun fichier ne correspond ?

```bash
echo *.xyz
# si aucun fichier .xyz n'existe, Bash affiche littéralement "*.xyz" (le motif n'est pas remplacé)
```

C'est une source classique de bugs : un script qui suppose que `*.xyz` désigne toujours une liste de fichiers réels peut recevoir le texte brut `*.xyz` comme unique "nom de fichier" si le dossier ne contient rien de tel.

## L'expansion d'accolades (*brace expansion*)

Génère plusieurs chaînes à partir d'un seul motif, **avant** toute recherche de fichiers réels sur le disque :

```bash
echo fichier{1,2,3}.txt
# fichier1.txt fichier2.txt fichier3.txt

mkdir -p projet/{src,tests,docs}
# crée les trois dossiers en une seule commande

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Note :** contrairement au globbing, l'expansion d'accolades ne dépend d'aucun fichier existant — `fichier{1,2,3}.txt` génère toujours ces trois chaînes, que les fichiers correspondants existent ou non.

## L'expansion du tilde (`~`)

```bash
cd ~          # équivalent à cd $HOME
cd ~/projets   # équivalent à cd $HOME/projets
```

## Empêcher l'expansion : les guillemets

```bash
echo *.txt      # remplacé par la liste réelle des fichiers .txt
echo "*.txt"     # affiche littéralement *.txt -> les guillemets doubles désactivent le globbing
echo '*.txt'     # même résultat, guillemets simples encore plus stricts (désactivent aussi $variable)
```

Voir aussi le chapitre sur les variables pour la distinction guillemets simples/doubles vis-à-vis de l'interprétation de `$variable`.
