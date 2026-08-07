---
order: 3
---

# Expansion et jokers avancés

Le globbing de base (`*`, `?`, `[abc]`) fonctionne à l'identique en zsh (voir [Expansion et jokers](/?c=shells&s=bash&p=expansion-et-jokers) en Bash). Zsh va nettement plus loin une fois le mode étendu activé, avec des motifs que Bash ne comprend simplement pas.

## Activer le globbing étendu

```bash
setopt EXTENDED_GLOB
```

Sans cette option (voir [Le système d'options](/?c=shells&s=zsh&p=options-du-shell)), les motifs de ce chapitre ne sont pas reconnus et sont traités comme du texte littéral.

## `**` : recherche récursive dans les sous-dossiers

```bash
ls **/*.txt
# tous les fichiers .txt, à n'importe quelle profondeur sous le dossier courant
```

> **Note :** en Bash, ce comportement récursif nécessite `shopt -s globstar` (option équivalente, mais absente par défaut et propre à Bash 4+) — en zsh, `**` fonctionne dès que `EXTENDED_GLOB` (ou même sans, `**` seul est actif par défaut dans la plupart des configurations récentes) est actif, sans réglage supplémentaire.

## Négation : exclure un motif

```bash
ls *.^txt
# tous les fichiers, SAUF ceux qui se terminent par .txt (Bash n'a pas d'équivalent direct)
```

## Les qualificatifs de glob : filtrer par type ou métadonnée

Entre parenthèses après un motif, un **qualificatif** filtre les résultats sans passer par une commande séparée comme `find` :

```bash
ls *(.)          # uniquement les fichiers réguliers (pas les dossiers, pas les liens)
ls *(/)           # uniquement les dossiers
ls *(*)           # uniquement les fichiers exécutables
ls *(.om[1])       # le fichier régulier le plus récemment modifié (tri par date, on prend le 1er)
ls *.log(.Lm-7)     # fichiers .log de plus de 7 jours de modification
```

| Qualificatif | Filtre sur... |
|---|---|
| `.` | Fichiers réguliers uniquement |
| `/` | Dossiers uniquement |
| `*` | Fichiers exécutables |
| `@` | Liens symboliques |
| `Lm-N` / `Lm+N` | Modifié il y a moins de / plus de N jours |
| `om[N]` | Trie par date de modification, garde le N-ième résultat |

> **Note :** ces qualificatifs remplacent, pour beaucoup de cas simples, un `find . -type f` ou un `find . -mtime -7` (voir [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers) en Bash) — directement dans le motif du glob, sans lancer de commande externe.

## Combiner globbing étendu et guillemets

Comme en Bash, entourer un motif de guillemets désactive son interprétation (voir [Les variables](/?c=shells&s=bash&p=variables) en Bash pour la logique guillemets simples/doubles) :

```bash
echo *(.)      # liste réelle des fichiers réguliers
echo "*(.)"     # affiche littéralement *(.)
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le globbing de base fonctionne comme en Bash ; `EXTENDED_GLOB` débloque des motifs propres à zsh (`**` récursif, négation `^`, qualificatifs entre parenthèses). |
| **Outils utilisables** | `**/*.ext` (récursif), `*.^txt` (négation), qualificatifs de glob (`.`, `/`, `*`, `Lm-N`). |
| **Pièges à éviter** | Utiliser ces motifs sans avoir activé `EXTENDED_GLOB` — ils sont alors traités comme du texte littéral. |
| **Bonnes pratiques** | Utiliser un qualificatif de glob (`*(.Lm-7)`) plutôt qu'un `find` externe pour un filtre simple. |
