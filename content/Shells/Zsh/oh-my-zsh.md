---
order: 6
---

# Oh My Zsh

Configurer manuellement [le prompt](/?c=shells&s=zsh&p=prompt-et-themes), [la complétion](/?c=shells&s=zsh&p=completion-avancee) et [des dizaines d'options](/?c=shells&s=zsh&p=options-du-shell) demande du temps. **Oh My Zsh** est un framework open source qui fournit tout ça préconfiguré, avec des centaines de thèmes et de plugins prêts à l'emploi : le moyen le plus courant d'avoir un `~/.zshrc` confortable sans tout écrire soi-même.

## Installation

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

L'installateur sauvegarde l'ancien `~/.zshrc` (en `~/.zshrc.pre-oh-my-zsh`), installe Oh My Zsh dans `~/.oh-my-zsh/`, et génère un nouveau `~/.zshrc` qui le charge.

## La structure d'un `.zshrc` avec Oh My Zsh

```bash
export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh
```

- `ZSH_THEME` sélectionne un thème parmi ceux fournis (dans `~/.oh-my-zsh/themes/`), il configure `PROMPT`/`RPROMPT` à votre place (voir [Personnaliser le prompt](/?c=shells&s=zsh&p=prompt-et-themes)), inutile de les redéfinir soi-même en plus.
- `plugins=(...)` active une liste de plugins, chacun ajoutant des alias, fonctions ou complétions spécifiques.
- `source $ZSH/oh-my-zsh.sh` doit rester la **dernière** ligne pertinente : c'est cette ligne qui charge effectivement le thème et les plugins déclarés au-dessus.

## Quelques plugins courants

| Plugin | Apporte |
|---|---|
| `git` | Dizaines d'alias Git (`gst` = `git status`, `gco` = `git checkout`...) et le nom de la branche courante dans le prompt via `vcs_info` |
| `zsh-autosuggestions` | Suggère la fin d'une commande déjà tapée par le passé, en grisé, à valider avec → |
| `zsh-syntax-highlighting` | Colore la ligne de commande en temps réel (vert = commande valide, rouge = invalide) avant même de l'exécuter |
| `docker`, `npm`, `python`... | Complétion et alias spécifiques à l'outil correspondant |

> **Note :** `zsh-autosuggestions` et `zsh-syntax-highlighting` ne sont **pas** inclus par défaut avec Oh My Zsh (contrairement à `git`) : ils s'installent séparément dans `~/.oh-my-zsh/custom/plugins/` avant de pouvoir être ajoutés à la liste `plugins=(...)`.

## Alias fournis par le plugin `git`

```bash
gst    # git status
gco    # git checkout
gaa    # git add --all
gcmsg  # git commit -m
gp     # git push
```

Ces alias (voir [Variables d'environnement](/?c=shells&s=bash&p=variables-denvironnement) en Bash pour le mécanisme `alias` lui-même, identique en zsh) sont définis par le plugin, pas par zsh ni Oh My Zsh eux-mêmes ; leur liste complète dépend de la version du plugin installée.

## Personnaliser sans toucher au cœur d'Oh My Zsh

```bash
# ~/.oh-my-zsh/custom/mes-alias.zsh
alias monalias="ma_commande --avec --options"
```

Tout fichier `.zsh` déposé dans `~/.oh-my-zsh/custom/` est automatiquement chargé, ce qui évite de modifier les fichiers internes du framework (qui seraient écrasés à la prochaine mise à jour) pour ajouter ses propres alias ou fonctions.

## Mettre à jour Oh My Zsh

```bash
omz update
```

Oh My Zsh se mettant à jour via son propre dépôt Git interne (`~/.oh-my-zsh/` est un clone Git), cette commande fait l'équivalent d'un `git pull` dessus, sans avoir à s'en soucier manuellement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Oh My Zsh préconfigure prompt, complétion et options via un framework de thèmes et plugins, plutôt que de tout régler manuellement. |
| **Outils utilisables** | `ZSH_THEME`, `plugins=(...)`, `~/.oh-my-zsh/custom/` pour personnaliser sans toucher au cœur du framework, `omz update`. |
| **Pièges à éviter** | Modifier directement les fichiers internes d'Oh My Zsh : écrasés à la prochaine mise à jour. |
| **Bonnes pratiques** | Déposer ses propres alias/fonctions dans `~/.oh-my-zsh/custom/` ; garder `source $ZSH/oh-my-zsh.sh` comme dernière ligne pertinente du `.zshrc`. |
