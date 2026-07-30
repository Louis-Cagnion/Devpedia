---
order: 1
---

# Les fichiers de démarrage

Bash charge selon le cas `~/.bashrc`, `~/.bash_profile` ou `~/.profile` (cf. chapitre Bash sur les variables d'environnement). Zsh découpe ce même besoin en **quatre fichiers distincts**, chacun avec un rôle précis — comprendre cette distinction évite les surprises classiques ("ma variable n'est pas visible dans mon script alors qu'elle marche dans mon terminal").

## Les quatre fichiers, et quand chacun se charge

| Fichier | Chargé pour... |
|---|---|
| `~/.zshenv` | **Toute** invocation de zsh, y compris les scripts non interactifs et les sous-shells — même chose que le comportement de `~/.bashrc` serait si Bash le chargeait systématiquement, ce qu'il ne fait pas |
| `~/.zprofile` | Uniquement un shell de connexion (*login shell*) — équivalent de `~/.bash_profile` |
| `~/.zshrc` | Uniquement un shell interactif — équivalent de `~/.bashrc`, c'est le fichier le plus modifié en pratique (alias, `PROMPT`, plugins Oh My Zsh, cf. chapitre dédié) |
| `~/.zlogin` | Uniquement un shell de connexion, **après** `~/.zshrc` — rarement utilisé, pour des commandes qui doivent s'exécuter après que l'environnement interactif soit prêt |

> **Note :** contrairement à Bash, où l'ordre de chargement exact selon "login" ou "non-login" est une source récurrente de confusion, zsh charge toujours dans le même ordre fixe : `.zshenv` → `.zprofile` (si login) → `.zshrc` (si interactif) → `.zlogin` (si login). C'est prévisible, indépendamment du contexte d'invocation.

## Où mettre quoi

```bash
# ~/.zshenv : variables nécessaires même dans un script non interactif
export EDITOR="vim"

# ~/.zshrc : tout ce qui n'a de sens qu'en interactif
alias ll="ls -la"
export PROMPT='%n@%m %~ %# '
```

> **Note :** `~/.zshenv` est chargé même par des outils qui invoquent zsh en coulisses (scripts, certains gestionnaires de fenêtres) — y mettre des commandes lentes ou qui affichent quelque chose peut ralentir ou perturber des programmes qui n'attendent pas un shell interactif. Réserver `~/.zshenv` au strict nécessaire (variables d'environnement), et mettre le reste dans `~/.zshrc`.

## Recharger sans ouvrir un nouveau terminal

Comme `source ~/.bashrc` en Bash :

```bash
source ~/.zshrc
# équivalent, plus court :
. ~/.zshrc
```
