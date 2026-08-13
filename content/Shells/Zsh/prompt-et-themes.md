---
order: 5
---

# Personnaliser le prompt

Bash construit son invite via la variable `PS1`, avec des codes d'échappement commençant par `\` (`\u`, `\h`, `\w`...). Zsh utilise sa propre variable, `PROMPT` (alias historique : `PS1`, toujours accepté), avec des codes d'échappement commençant par `%` : une syntaxe entièrement différente, pas juste un renommage.

## La variable `PROMPT`

```bash
PROMPT='%n@%m %~ %# '
```

| Code | Affiche |
|---|---|
| `%n` | Nom de l'utilisateur courant |
| `%m` | Nom de la machine (court) |
| `%~` | Dossier courant, avec `~` si sous le dossier personnel (équivalent de `\w` en Bash) |
| `%#` | `#` si root, `%` sinon (équivalent de `\$` en Bash) |
| `%*` | Heure courante (HH:MM:SS) |
| `%D` | Date courante |

> **Note :** contrairement au `\w` de Bash qui abrège déjà automatiquement le chemin par `~`, zsh distingue explicitement `%~` (abrégé) de `%/` (chemin complet, jamais abrégé), un choix explicite à faire selon le comportement voulu.

## Coloration du prompt

```bash
PROMPT='%F{green}%n@%m%f %F{blue}%~%f %# '
```

`%F{couleur}` démarre une couleur de texte, `%f` la referme : équivalent des séquences d'échappement ANSI (`\e[32m`, cf. notions de terminal) mais dans une syntaxe propre à zsh, sans avoir à connaître les codes ANSI bruts.

## `RPROMPT` : une invite secondaire à droite de l'écran

Sans équivalent en Bash : zsh peut afficher une seconde invite, alignée sur le bord droit du terminal, qui disparaît automatiquement dès qu'on commence à taper :

```bash
RPROMPT='%D{%H:%M:%S}'
# affiche l'heure courante à droite, tant que la ligne de commande est vide
```

## `vcs_info` : informations Git intégrées au prompt

Zsh fournit nativement une fonction capable d'afficher la branche Git courante dans le prompt, sans dépendance externe :

```bash
autoload -Uz vcs_info
precmd() { vcs_info }
setopt PROMPT_SUBST
PROMPT='%n@%m %~ ${vcs_info_msg_0_} %# '
```

`PROMPT_SUBST` (voir [Le système d'options](/?c=shells&s=zsh&p=options-du-shell)) autorise l'évaluation de variables et substitutions à l'intérieur de `PROMPT` : sans cette option, `${vcs_info_msg_0_}` s'afficherait littéralement plutôt que d'être remplacé par la branche courante.

> **Note :** c'est exactement ce mécanisme (`vcs_info` + un prompt personnalisé) que des thèmes populaires comme *robbyrussell* (le thème par défaut d'[Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)) ou [*powerlevel10k*](https://github.com/romkatv/powerlevel10k) automatisent et enrichissent.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Zsh construit son prompt via `PROMPT` (codes `%`), pas `PS1`/`\` comme Bash. `RPROMPT` affiche une invite secondaire à droite, sans équivalent Bash. |
| **Outils utilisables** | `%n`/`%m`/`%~`/`%#`, `%F{couleur}`/`%f`, `vcs_info` pour la branche Git. |
| **Pièges à éviter** | Oublier `setopt PROMPT_SUBST` : sans lui, une substitution comme `${vcs_info_msg_0_}` s'affiche littéralement au lieu d'être évaluée. |
| **Bonnes pratiques** | Utiliser `vcs_info` pour intégrer nativement la branche Git courante, plutôt qu'un script externe. |
