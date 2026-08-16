---
order: 2
---

# Zsh

Zsh (*Z shell*) est, comme [Bash](/?c=shells&s=bash&p=bash), un shell compatible [POSIX](/?c=shells&s=bash&p=scripts-et-shebang) : la quasi-totalité de ce qui est vu dans la rubrique [Bash](/?c=shells&s=bash&p=bash) (variables, conditions, boucles, fonctions, redirections et pipes, permissions et fichiers, gestion des processus, traitement de texte) fonctionne **à l'identique** en zsh, syntaxe comprise. C'est d'ailleurs le shell par défaut sur macOS depuis 2019, et un choix courant sur Linux pour son confort d'utilisation interactive.

> **Ce qui est couvert ici :** uniquement ce qui diffère réellement de [Bash](/?c=shells&s=bash&p=bash) ou qui n'existe pas du tout côté [Bash](/?c=shells&s=bash&p=bash) : les fichiers de démarrage, le système d'options (`setopt`), le globbing étendu, la complétion avancée, la personnalisation du prompt, et le framework **Oh My Zsh**. Pour tout le reste (variables, conditions, boucles, fonctions, redirections, permissions, processus, traitement de texte), les chapitres du sujet [Bash](/?c=shells&s=bash&p=bash) s'appliquent directement.

## En quoi zsh diffère concrètement de Bash

Zsh ajoute par-dessus la base POSIX (partagée avec [Bash](/?c=shells&s=bash&p=bash)) plusieurs couches de confort orientées vers l'usage **interactif** plutôt que le scripting pur :

- une complétion par tabulation nettement plus riche (menus navigables, complétion contextuelle par commande) ;
- un globbing plus puissant, activable avec `setopt extendedglob` ;
- un système de personnalisation du prompt indépendant de celui de [Bash](/?c=shells&s=bash&p=bash) (`PROMPT` plutôt que `PS1`, avec ses propres codes d'échappement) ;
- un système d'options nommées (`setopt`/`unsetopt`) plus lisible que les options ponctuelles de [Bash](/?c=shells&s=bash&p=bash) (`shopt`, `set -o`) ;
- un écosystème de frameworks de configuration, dont **Oh My Zsh** est le plus répandu.

Vous retrouverez les différents chapitres ci-dessous :
