---
order: 1
---

# Écrire et exécuter un script Bash

Un script Bash est un simple fichier texte contenant une suite de commandes, exécutées dans l'ordre comme si elles avaient été tapées une à une dans le terminal.

> **Unix**, c'est quoi ? À l'origine, un système d'exploitation créé dans les années 1970, dont les principes (tout est fichier, de petits outils spécialisés qu'on combine entre eux via des pipes, un shell en ligne de commande pour piloter le tout) ont ensuite été copiés ou réimplémentés par de nombreux systèmes — Linux et macOS en sont aujourd'hui les héritiers les plus courants. Quand un chapitre dit "sous Unix" ou "un système Unix", il parle de cette famille de systèmes et de leurs conventions communes, par opposition à Windows par exemple.

## Le shebang

La première ligne d'un script indique au système quel interpréteur utiliser pour l'exécuter :

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (le "shebang") n'est pas un commentaire ordinaire malgré le `#` : le système d'exploitation le lit spécifiquement pour savoir quel programme lancer afin d'interpréter le reste du fichier.

## `sh` vs `bash`

**POSIX** (*Portable Operating System Interface*) est une norme qui définit, entre autres, un comportement standard minimal pour un shell — un ensemble de fonctionnalités que tout shell "compatible POSIX" doit implémenter, pour qu'un même script s'exécute de façon identique sur n'importe quel système Unix, quel que soit le shell réellement installé derrière `/bin/sh`.

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

## Rendre un script exécutable

```bash
chmod +x script.sh   # ajoute le droit d'exécution (cf. chapitre sur les permissions)
./script.sh            # exécute le script (le "./" est nécessaire si le dossier courant n'est pas dans $PATH)
```

Alternative sans avoir besoin de `chmod +x` : lancer explicitement l'interpréteur sur le fichier :

```bash
bash script.sh
```

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
| `$#` | Nombre d'arguments reçus |
| `$?` | Code de sortie de la dernière commande exécutée (`0` = succès) |
| `$$` | PID du script en cours d'exécution |

`$?` et `$$` sont détaillés plus loin dans ce chapitre et dans celui sur la gestion des processus ; voir aussi le chapitre sur les variables pour leur usage à l'intérieur d'une fonction.

## Codes de sortie (`exit`)

Chaque commande, et donc chaque script, se termine avec un **code de sortie** : `0` signifie succès, toute autre valeur (1 à 255) signifie un échec, dont le sens précis dépend du programme :

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Erreur : fichier de config manquant" >&2   # >&2 : message d'erreur vers stderr
    exit 1
fi

echo "Tout est prêt"
exit 0
```

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

## Arrêter un script à la première erreur : `set -e`

Par défaut, Bash continue d'exécuter les lignes suivantes même si une commande échoue — souvent indésirable dans un script d'automatisation :

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
# -o pipefail : un pipe échoue si N'IMPORTE LAQUELLE de ses commandes échoue (pas seulement la dernière)
```

Voir aussi le chapitre sur la gestion des processus pour ce qui se passe après le lancement d'un script en arrière-plan.
