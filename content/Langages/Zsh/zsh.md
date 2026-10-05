---
order: 10
---

# Zsh

Zsh (*Z shell*) est, comme [Bash](/?c=shells&s=bash&p=bash), un shell compatible [POSIX](/?c=shells&s=bash&p=scripts-et-shebang) : la quasi-totalité de ce qui est vu dans la rubrique [Bash](/?c=shells&s=bash&p=bash) (variables, conditions, boucles, fonctions, redirections et pipes, permissions et fichiers, gestion des processus, traitement de texte) fonctionne **à l'identique** en zsh, syntaxe comprise -- à l'exception de quelques divergences ponctuelles, silencieuses, détaillées plus bas. C'est d'ailleurs le shell par défaut sur macOS depuis 2019, et un choix courant sur Linux pour son confort d'utilisation interactive.

> **Ce qui est couvert ici :** uniquement ce qui diffère réellement de [Bash](/?c=shells&s=bash&p=bash) ou qui n'existe pas du tout côté [Bash](/?c=shells&s=bash&p=bash) : les fichiers de démarrage, le système d'options (`setopt`), le globbing étendu, la complétion avancée, la personnalisation du prompt, le framework **Oh My Zsh**, et deux divergences de comportement qui cassent silencieusement un script Bash porté tel quel (voir ci-dessous). Pour tout le reste (variables, conditions, boucles, fonctions, redirections, permissions, processus, traitement de texte), les chapitres du sujet [Bash](/?c=shells&s=bash&p=bash) s'appliquent directement.

## En quoi zsh diffère concrètement de Bash

Zsh ajoute par-dessus la base POSIX (partagée avec [Bash](/?c=shells&s=bash&p=bash)) plusieurs couches de confort orientées vers l'usage **interactif** plutôt que le scripting pur :

- une complétion par tabulation nettement plus riche (menus navigables, complétion contextuelle par commande) ;
- un globbing plus puissant, activable avec `setopt extendedglob` ;
- un système de personnalisation du prompt indépendant de celui de [Bash](/?c=shells&s=bash&p=bash) (`PROMPT` plutôt que `PS1`, avec ses propres codes d'échappement) ;
- un système d'options nommées (`setopt`/`unsetopt`) plus lisible que les options ponctuelles de [Bash](/?c=shells&s=bash&p=bash) (`shopt`, `set -o`) ;
- un écosystème de frameworks de configuration, dont **Oh My Zsh** est le plus répandu.

## Deux divergences qui cassent silencieusement un script Bash porté tel quel

Contrairement aux ajouts de confort ci-dessus (globbing, complétion...), ces deux points changent le **résultat** d'un script identique selon le shell qui l'exécute, sans aucune erreur ni avertissement -- le script tourne, mais pas comme prévu.

### Le découpage de mot sur une variable non quotée

En [Bash](/?c=shells&s=bash&p=bash), une variable scalaire non quotée (`$var`) est découpée sur les espaces (*word splitting*), comme une substitution de commande (`$(cmd)`). En zsh, seule la substitution de commande reste découpée : une variable scalaire non quotée reste une **chaîne unique**, espaces compris.

```bash
etapes="un deux trois"

for e in $etapes; do
    echo "$e"
done
```

| Shell | Résultat de la boucle |
|---|---|
| Bash | 3 tours : `un`, puis `deux`, puis `trois` (`$etapes` découpé sur les espaces) |
| Zsh | 1 seul tour : `un deux trois` (chaîne entière, non découpée) |

> **Bonne pratique :** ne jamais compter sur ce découpage implicite, dans aucun des deux shells. Utiliser un vrai tableau (`etapes=(un deux trois)`, puis `for e in "${etapes[@]}"`) rend le comportement identique et explicite des deux côtés.

### L'arithmétique en virgule flottante

En Bash, l'arithmétique `$(( ))` ne gère que des entiers : une division comme `$((1 / 2))` tronque le résultat (`0`), et une expression avec un nombre décimal littéral échoue. En zsh, `$(( ))` gère nativement les nombres à virgule flottante :

```zsh
echo $((1 / 2))       # 0 en Bash (division entière) -- 0.5 en zsh
echo $((0.53 / 1))    # erreur en Bash -- 0.53 en zsh
```

> **Piège :** un script écrit et testé en zsh peut donc produire un résultat numérique silencieusement différent (ou une erreur) une fois exécuté avec `bash script.sh` ou via un `#!/bin/bash` explicite. Pour un calcul décimal portable, utiliser [`bc`](https://www.gnu.org/software/bc) ou `awk` plutôt que `$(( ))`, quel que soit le shell cible.

## Lire une touche : `read -k` (zsh) et `read -n` (Bash)

`read` attend normalement une ligne entière validée par Entrée. Pour réagir à **une seule touche** (un menu, « appuyez sur une touche »), chaque shell a son option :

| | Zsh | Bash |
|---|---|---|
| Lire un caractère, sans l'afficher | `read -s -k 1 touche` | `read -rsn1 touche` |
| Limiter l'attente | `-t 0.05` (secondes) | `-t 0.05` (secondes) |

Un script zsh qui utilise `-k` échoue dans Bash : `read: -k: invalid option` (code de sortie 2).

**Les touches fléchées envoient plusieurs octets.** La flèche haut transmet d'un coup trois octets : Échap (code 27, noté `033` en octal), `[` puis `A`. Une lecture d'un seul caractère en voit donc trois « touches » successives. Mesuré en zsh, flèche haut tapée puis `x` :

```text
lecture 1 :  033
lecture 2 :  [
lecture 3 :  A
```

La parade : après un Échap, lire les octets suivants avec un **délai très court**. S'ils arrivent, c'est une séquence ; sinon, c'est la touche Échap seule.

```zsh
lire_touche() {
  local k suite
  read -s -k 1 k
  if [[ $k == $'\e' ]]; then    # Échap : début d'une séquence, ou touche Échap seule
    read -s -k 2 -t 0.05 suite  # les deux octets suivants, s'ils arrivent dans les 50 ms
    k+=$suite
  fi
  REPLY=$k
}
```

Mesuré : la flèche haut renvoie `033 [ A` d'un seul appel, la touche Échap seule renvoie `033`, et une touche ordinaire (`x`) reste lue seule. La même fonction s'écrit en Bash avec `read -rsn1` et `read -rsn2 -t 0.05` (résultat identique).

> **Piège :** un délai trop court. Sur une connexion lente (SSH), les trois octets peuvent arriver séparés : la flèche est alors lue comme Échap suivie de caractères parasites.
>
> **Piège :** d'autres touches (Début, Fin, F1…) envoient des séquences plus longues, qu'un `-k 2` ne lit pas en entier.
>
> **Bonne pratique :** tester la fonction avec une flèche **et** avec Échap seule, dans un vrai terminal ; pour un menu complexe, utiliser un outil dédié plutôt que de décoder les séquences à la main.

Un autre écart silencieux entre les deux shells (le `trap … EXIT` qui ne s'exécute pas sur un signal en zsh) est décrit dans [La gestion des processus](/?c=shells&s=bash&p=gestion-des-processus).

Vous retrouverez les différents chapitres ci-dessous :
