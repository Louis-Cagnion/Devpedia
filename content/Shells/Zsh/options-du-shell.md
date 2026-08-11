---
order: 2
---

# Le système d'options (`setopt`)

Bash active des comportements optionnels au cas par cas (`shopt -s nom`, `set -o nom`, chacun avec sa propre commande). Zsh centralise ça dans un seul mécanisme cohérent : `setopt`/`unsetopt`, avec des dizaines d'options nommées qui changent le comportement du shell.

## Activer et désactiver une option

```bash
setopt AUTO_CD          # active une option
unsetopt AUTO_CD         # la désactive

setopt                   # liste toutes les options actuellement actives
```

> **Note :** les noms d'options sont insensibles à la casse et aux underscores : `AUTO_CD`, `autocd` et `auto_cd` désignent la même option. La convention `MAJUSCULES_AVEC_UNDERSCORES` est la plus lisible et la plus répandue dans les `.zshrc` qu'on trouve en ligne.

## Quelques options utiles au quotidien

```bash
setopt AUTO_CD           # taper un nom de dossier seul (sans "cd") y déplace directement
setopt EXTENDED_GLOB      # active le globbing étendu (voir Expansion et jokers avancés)
setopt SHARE_HISTORY       # partage l'historique de commandes en temps réel entre tous les terminaux ouverts
setopt HIST_IGNORE_DUPS    # n'enregistre pas une commande identique à la précédente dans l'historique
setopt CORRECT             # propose une correction si une commande tapée n'existe pas ("did you mean...")
```

| Option | Effet |
|---|---|
| `AUTO_CD` | `nom_dossier` seul équivaut à `cd nom_dossier` |
| `EXTENDED_GLOB` | active les motifs de globbing étendus (voir [Expansion et jokers avancés](/?c=shells&s=zsh&p=expansion-et-jokers-avances)) |
| `SHARE_HISTORY` | historique partagé en direct entre terminaux ouverts simultanément |
| `HIST_IGNORE_DUPS` | pas de doublon consécutif dans l'historique |
| `CORRECT` | suggère une correction orthographique de commande |
| `NO_CASE_GLOB` | le globbing (`*.txt`) devient insensible à la casse |

## `setopt` vs `shopt`/`set -o` : pas juste un nom différent

Contrairement à Bash, où les options sont dispersées entre `shopt` (options spécifiques à Bash) et `set -o` (options POSIX partagées), zsh regroupe tout sous `setopt`/`unsetopt`, avec une liste de plusieurs centaines d'options couvrant des aspects que Bash ne rend pas configurables du tout (comportement du globbing, de l'historique, de la complétion...).

> **Note :** ces options sont typiquement placées dans `~/.zshrc` (voir [Les fichiers de démarrage](/?c=shells&s=zsh&p=fichiers-de-demarrage)) pour être actives dans chaque nouveau terminal, exactement comme un `shopt -s` serait placé dans `~/.bashrc`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Zsh regroupe toutes ses options de comportement sous un seul mécanisme (`setopt`/`unsetopt`), là où Bash les disperse entre `shopt` et `set -o`. |
| **Outils utilisables** | `setopt`/`unsetopt`, `AUTO_CD`, `EXTENDED_GLOB`, `SHARE_HISTORY`, `CORRECT`. |
| **Pièges à éviter** | Chercher une option Bash équivalente une par une : zsh couvre souvent des aspects que Bash ne rend pas configurables du tout. |
| **Bonnes pratiques** | Placer les `setopt` dans `~/.zshrc` pour qu'ils soient actifs dans chaque nouveau terminal. |
