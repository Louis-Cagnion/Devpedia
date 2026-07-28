---
title: Écrire et exécuter un script Bash
---

Un script Bash est un simple fichier texte contenant une suite de commandes, exécutées dans l'ordre comme si elles avaient été tapées une à une dans le terminal.

## Le shebang

La première ligne d'un script indique au système quel interpréteur utiliser pour l'exécuter :

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (le "shebang") n'est pas un commentaire ordinaire malgré le `#` : le système d'exploitation le lit spécifiquement pour savoir quel programme lancer afin d'interpréter le reste du fichier. `#!/bin/sh` exécuterait le script avec un shell POSIX plus restreint (sans certaines extensions propres à Bash, comme `[[ ]]` ou les tableaux).

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
