---
order: 2
---

# Écrire et exécuter un script Bash

Un script Bash est un simple fichier texte contenant une suite de commandes, exécutées dans l'ordre comme si elles avaient été tapées une à une dans le terminal.

> **Unix**, c'est quoi ? À l'origine, un système d'exploitation créé dans les années 1970, dont les principes (tout est fichier, de petits outils spécialisés qu'on combine entre eux via des pipes, un shell en ligne de commande pour piloter le tout) ont ensuite été copiés ou réimplémentés par de nombreux systèmes : Linux et macOS en sont aujourd'hui les héritiers les plus courants. Quand un chapitre dit "sous Unix" ou "un système Unix", il parle de cette famille de systèmes et de leurs conventions communes, par opposition à Windows par exemple.

## Le shebang

La première ligne d'un script indique au système quel interpréteur utiliser pour l'exécuter :

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (le "shebang") n'est pas un commentaire ordinaire malgré le `#` : le système d'exploitation le lit spécifiquement pour savoir quel programme lancer afin d'interpréter le reste du fichier (voir [comment le noyau le détecte concrètement](/?c=shells&s=bash&p=architecture-dun-shell) pour ce qui se passe au niveau système).

> **Piège :** le shebang doit être les tout premiers caractères du fichier, sans exception : pas même une ligne vide avant. Le noyau ne vérifie que les deux premiers octets (`#!`) ; une ligne vide au-dessus, et il ne les reconnaît plus comme un shebang du tout.
>
> **Bonne pratique :** toujours faire commencer un script exécutable directement par `#!...`, jamais par un commentaire ou une ligne vide au-dessus.

## `sh` vs `bash`

**POSIX** (*Portable Operating System Interface*) est une norme qui définit, entre autres, un comportement standard minimal pour un shell : un ensemble de fonctionnalités que tout shell "compatible POSIX" doit implémenter, pour qu'un même script s'exécute de façon identique sur n'importe quel système Unix, quel que soit le shell réellement installé derrière `/bin/sh`.

`sh` désigne donc moins un programme précis qu'une **norme** : sur la plupart des systèmes, `/bin/sh` est en réalité un lien vers un autre shell (souvent `dash` sur Debian/Ubuntu, parfois `bash` lui-même sur macOS ou en mode "compatibilité POSIX") qui se comporte de façon plus restreinte lorsqu'il est invoqué sous ce nom. `bash` (*Bourne Again SHell*) est un shell concret, qui respecte POSIX mais y ajoute de nombreuses extensions propres (`[[ ]]`, les tableaux, `{1..5}`, `local`...) qui ne fonctionnent pas si le script est exécuté avec un `sh` strictement POSIX.

```bash
#!/bin/bash
echo "Compatible uniquement Bash"
```

```bash
#!/bin/sh
echo "Portable vers n'importe quel shell POSIX (dash, bash en mode sh, etc.)"
```

En pratique : utiliser `#!/bin/bash` (et l'exécuter avec `bash`) dès que le script utilise une extension Bash, ce qui est le cas de la plupart des scripts de ce site ; réserver `#!/bin/sh` aux scripts volontairement limités aux fonctionnalités POSIX de base, par exemple pour un script système censé fonctionner même sur une machine où `bash` n'est pas installé.

> **Piège :** écrire `#!/bin/sh` puis utiliser une extension propre à Bash (tableaux, `[[ ]]`, `local`...). Le script fonctionne quand même en test si `/bin/sh` pointe vers `bash` sur la machine de développement, et échoue silencieusement ou bruyamment sur un autre système où `/bin/sh` est un shell plus strict (`dash`, souvent).
>
> **Bonne pratique :** faire correspondre le shebang à ce que le script utilise réellement : `#!/bin/bash` dès qu'une seule extension Bash apparaît, plutôt que de le découvrir en production.

## Rendre un script exécutable

```bash
# ajoute le droit d'exécution (voir Permissions et manipulation de fichiers)
chmod +x script.sh
# exécute le script (le "./" est nécessaire si le dossier courant n'est pas dans $PATH)
./script.sh
```

Alternative sans avoir besoin de `chmod +x` : lancer explicitement l'interpréteur sur le fichier :

```bash
bash script.sh
```

> **Piège :** taper `script.sh` seul, sans `./` devant, même une fois `chmod +x` fait. Bash ne cherche jamais dans le dossier courant par défaut (cf. [chapitre sur les commandes de base](/?c=shells&s=bash&p=commandes-de-base)) : sans préfixe de chemin, il ne trouve le script que si son dossier fait partie de `$PATH`, ce qui n'est presque jamais le cas pour un dossier de projet.
>
> **Bonne pratique :** toujours préfixer l'exécution d'un script local par `./`, plutôt que de chercher pourquoi "la commande n'existe pas".

## Les arguments d'un script

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Tous les arguments : $@"
echo "Nombre d'arguments : $#"
```

```bash
./script.sh alice bob
# Script : ./script.sh
# Premier argument : alice
# Tous les arguments : alice bob
# Nombre d'arguments : 2
```

`$0`, `$1`, `$@` et `$#` font partie d'un ensemble plus large de **variables spéciales**, toutes lues automatiquement par Bash sans jamais être assignées explicitement :

| Variable | Contenu |
|---|---|
| `$0` | Nom du script en cours d'exécution |
| `$1`, `$2`, ... | Arguments positionnels passés au script/à la fonction |
| `$@` | Tous les arguments, chacun comme un mot séparé |
| `$*` | Tous les arguments, réunis en **une seule** chaîne |
| `$#` | Nombre d'arguments reçus |
| `$?` | Code de sortie de la dernière commande exécutée (`0` = succès) |
| `$$` | PID du script en cours d'exécution |

> **Piège fréquent : `$@` et `$*` se comportent différemment une fois quotés.** Non quotés, les deux se comportent pareil. Quotés (`"$@"` vs `"$*"`), ils divergent : `"$@"` développe chaque argument comme un mot **séparé** (`"alice" "bob"`), alors que `"$*"` les fusionne en **un seul** mot (`"alice bob"`). Pour transmettre les arguments tels quels à une autre commande (ex. `commande "$@"`), `"$@"` est presque toujours le bon choix (voir [l'ordre précis des expansions](/?c=shells&s=bash&p=architecture-dun-shell) pour ce qui explique cette différence : découpage en mots, guillemets).

`$?` et `$$` sont détaillés plus loin dans ce chapitre et dans celui sur la gestion des processus ; voir aussi le chapitre sur les variables pour leur usage à l'intérieur d'une fonction.

## Codes de sortie (`exit`)

Chaque commande, et donc chaque script, se termine avec un **code de sortie** : `0` signifie succès, toute autre valeur (1 à 255) signifie un échec, dont le sens précis dépend du programme :

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    # >&2 : envoie ce message vers la sortie d'erreur (stderr)
    echo "Erreur : fichier de config manquant" >&2
    exit 1
fi

echo "Tout est prêt"
exit 0
```

> `>&2` redirige vers la sortie d'erreur (*stderr*) plutôt que la sortie standard (*stdout*) : voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes) pour ce que sont ces flux et comment les rediriger en détail.

Le script (ou la commande) appelant peut vérifier ce code via `$?` :

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "Le script a réussi"
fi

# raccourci équivalent, plus idiomatique :
./script.sh && echo "Le script a réussi"
./script.sh || echo "Le script a échoué"
```

`&&` n'exécute la commande suivante que si la précédente a réussi (code `0`) ; `||` seulement si elle a échoué.

> **Piège :** un script sans `exit` explicite se termine avec le code de sortie de sa **dernière commande** : pas nécessairement `0`, et pas nécessairement ce qui était voulu. Un script qui réussit "globalement" mais dont la toute dernière ligne est un `echo` (qui réussit presque toujours) masque ainsi un échec survenu plus tôt.
>
> **Bonne pratique :** terminer un script par un `exit` explicite (`exit 0` en cas de succès, un code différent sinon) plutôt que de laisser le code de sortie dépendre implicitement de la dernière commande.

## Arrêter un script à la première erreur : `set -e`

Par défaut, Bash continue d'exécuter les lignes suivantes même si une commande échoue : souvent indésirable dans un script d'automatisation :

```bash
#!/bin/bash
set -e   # arrête immédiatement le script si une commande échoue (code de sortie non nul)

cd /dossier/inexistant   # si ce dossier n'existe pas, le script s'arrête ici
echo "Cette ligne ne s'exécute jamais si cd a échoué"
```

D'autres options renforcent la robustesse d'un script, souvent combinées :

```bash
#!/bin/bash
set -euo pipefail
# -e : arrêt à la première erreur
# -u : erreur si une variable non définie est utilisée
# -o pipefail : un pipe échoue si N'IMPORTE LAQUELLE de ses commandes échoue (pas seulement la
# dernière)
```

Un cas concret où `set -e` ne se déclenche pas, malgré un échec réel :

```bash
set -e
# échoue, mais set -e ne s'arrête PAS ici sans pipefail : seul grep compte
commande_qui_echoue | grep "motif"
```

> **Piège :** `set -e` ne couvre pas tout ce qu'on pourrait attendre. Une commande qui échoue **n'arrête rien** si elle est testée par un `if`, combinée avec `&&`/`||`, ou si elle n'est pas la dernière d'un pipeline (sans `pipefail`, comme dans l'exemple ci-dessus) : dans ces trois cas, Bash considère l'échec "attendu et déjà géré", donc `set -e` ne se déclenche pas.
>
> **Bonne pratique :** ne jamais compter sur `set -e` seul pour une commande dans un pipeline, un `if`, ou avant `&&`/`||` : vérifier `$?` explicitement dans ces cas précis si l'échec doit réellement interrompre le script.

Voir aussi le chapitre sur la gestion des processus pour ce qui se passe après le lancement d'un script en arrière-plan.

## Commenter plusieurs lignes : `: <<'COMMENT'`

Bash n'a pas de commentaire sur plusieurs lignes : chaque ligne doit commencer par `#`. Une astuce courante consiste à utiliser `:`, une commande qui **ne fait rien** et réussit toujours, et à lui donner un bloc de texte par un [here-document](/?c=langages&s=bash&p=architecture-dun-shell#le-here-document-delim-rediriger-un-bloc-de-texte-sans-fichier) (`<<'COMMENT'`) : la commande ignore ce texte. Le script suivant (`commentaire.sh`) essaie trois variantes dans un dossier d'essai :

```bash
#!/bin/bash
essai=$(mktemp -d)                  # dossier d'essai : on y regarde ce qui est créé
cd "$essai"

: <<'COMMENT'
Bloc protégé par des apostrophes : rien n'est développé ni exécuté.
$(touch cree-par-bloc-protege) `touch cree-aussi-par-bloc-protege` $HOME
COMMENT

: <<COMMENT
Bloc non protégé : les substitutions sont exécutées.
$(touch cree-par-bloc-non-protege)
COMMENT

echo "fichiers créés : $(ls)"

# Piège : une ligne COMMENT trop tôt ferme le bloc, la suite est exécutée comme du code
: <<'COMMENT'
Début d'une note.
COMMENT
Cette ligne devait faire partie de la note.
COMMENT

cd / && rm -rf "$essai"
```

```
fichiers créés : cree-par-bloc-non-protege
./commentaire.sh: ligne 21: Cette : commande introuvable
./commentaire.sh: ligne 22: COMMENT : commande introuvable
```

| Écriture | Effet |
|---|---|
| `: <<'COMMENT'` (délimiteur entre apostrophes) | Le bloc n'est ni développé ni exécuté : `$(...)`, les accents graves et `$HOME` restent du texte. Aucun fichier n'est créé |
| `: <<COMMENT` (sans apostrophes) | Les substitutions du bloc **sont exécutées** : `touch` a bien créé `cree-par-bloc-non-protege` |
| Une ligne `COMMENT` placée trop tôt | Elle **ferme** le bloc : les lignes suivantes sont exécutées comme du code (les deux messages « commande introuvable ») |

> **Piège :** sans les apostrophes autour du délimiteur, un commentaire qui contient `$(...)` ou des accents graves exécute des commandes. Le délimiteur doit aussi être seul sur sa ligne et ne figurer nulle part ailleurs dans le bloc. Le même script fonctionne en bash et en zsh (vérifié). Pour quelques lignes, un `#` devant chacune reste plus simple et plus sûr ; le bloc sert surtout à documenter un script en tête de fichier.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le shebang indique au système quel interpréteur exécute le script. `chmod +x` + `./script.sh` ou `bash script.sh` le lance. `$1`, `$@`, `$#`... donnent accès à ses arguments. Chaque script se termine avec un code de sortie (`0` = succès), consultable via `$?`. |
| **Outils utilisables** | `set -euo pipefail` en tête de script pour arrêter à la première erreur plutôt que de continuer sur un état incohérent. Un bloc `: <<'COMMENT'` pour commenter plusieurs lignes. |
| **Pièges à éviter** | Confondre `$@` et `$*` une fois quotés (voir plus haut). Écrire `#!/bin/sh` puis utiliser une extension Bash (tableaux, `[[ ]]`...) : le script échoue sur tout système où `/bin/sh` n'est pas `bash`. Un bloc de commentaire dont le délimiteur n'est pas entre apostrophes exécute son contenu. |
| **Bonnes pratiques** | Toujours vérifier `$?` (ou utiliser `&&`/`\|\|`) après une commande dont l'échec doit changer le comportement du script, plutôt que de supposer qu'elle a réussi. |
