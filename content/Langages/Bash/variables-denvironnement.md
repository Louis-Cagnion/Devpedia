---
order: 4
---

# Variables d'environnement

Une variable d'environnement est une variable transmise automatiquement aux processus qu'un shell lance, contrairement à une variable Bash classique, qui reste locale au script qui la déclare, sauf si elle est explicitement **exportée**.

## Variable locale vs variable exportée

```bash
NOM="Jean"  # variable de shell classique : visible uniquement dans ce script/cette session
# à partir de maintenant, transmise aux processus enfants (autres scripts, commandes...)
export NOM

export EMAIL="jean@exemple.com"  # déclaration et export en une seule ligne
```

```bash
# sous_script.sh
echo "$NOM"    # affiche "Jean" si NOM a été exporté par le script appelant, vide sinon
```

> **Note :** l'export ne fonctionne que dans un sens : du parent vers l'enfant. Un sous-script qui modifie une variable exportée ne peut pas répercuter ce changement vers le script qui l'a lancé : chaque processus a sa propre copie de l'environnement.

## Variables d'environnement courantes

```bash
echo $PATH   # liste des dossiers où le shell cherche les commandes exécutables
echo $HOME   # dossier personnel de l'utilisateur courant
echo $USER   # nom de l'utilisateur courant
echo $PWD    # dossier de travail courant
echo $SHELL  # chemin du shell utilisé
```

## `$PATH` : comment le shell trouve une commande

Quand vous tapez `ls`, le shell cherche un exécutable nommé `ls` dans chacun des dossiers listés dans `$PATH`, séparés par `:` :

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/mon/dossier/scripts"  # ajoute un dossier supplémentaire à la recherche
```

> **Note :** l'ordre compte : le premier dossier du `$PATH` contenant un exécutable de ce nom est utilisé, ce qui permet par exemple de faire passer une version personnalisée d'une commande avant la version système.

## Fichiers de configuration du shell

| Fichier | Chargé quand |
|---|---|
| `~/.bashrc` | À chaque nouveau terminal interactif (non-login) |
| `~/.bash_profile` (ou `~/.profile`) | À la connexion (login shell) |
| `/etc/environment` | Au niveau système, pour tous les utilisateurs |

C'est dans `~/.bashrc` que sont typiquement ajoutés les `export PATH=...`, les `alias`, ou des variables personnalisées destinées à être disponibles dans chaque nouveau terminal.

## `alias` : raccourcir des commandes fréquentes

```bash
alias ll="ls -la"
alias gs="git status"

ll   # équivalent à taper "ls -la"
```

Un `alias` défini directement dans le terminal ne survit pas à la fermeture de la session : pour qu'il soit disponible à chaque nouveau terminal, il doit être ajouté dans `~/.bashrc`.

## `source` : recharger un fichier de configuration

Après une modification de `~/.bashrc`, `source` applique les changements dans la session courante, sans avoir à ouvrir un nouveau terminal :

```bash
source ~/.bashrc
# équivalent, plus court :
. ~/.bashrc
```

## Une variable exportée ne vit que dans son terminal

`export` transmet une variable aux programmes lancés **depuis ce shell** : pas à un autre [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) ouvert à côté, qui est un autre shell avec son propre environnement. Pour le vérifier, ouvrez deux terminaux :

```bash
# Terminal 1 : exporte une variable, puis l'affiche entre crochets
export MA_VAR=bonjour
echo "terminal 1 : [$MA_VAR]"
```

```bash
# Terminal 2 (une autre fenêtre) : la même variable n'existe pas ici
echo "terminal 2 : [$MA_VAR]"
```

```text
terminal 1 : [bonjour]
terminal 2 : []
```

Pour qu'une variable soit présente dans chaque nouveau terminal, il faut l'écrire dans `~/.bashrc` (voir plus haut).

## Une variable vide dans un `rm -rf`

`rm -rf` supprime un dossier et tout son contenu, sans corbeille ni confirmation. Si la variable placée devant le `/` est **vide** (jamais définie, faute de frappe dans son nom, valeur non transmise), le shell la remplace par rien : la commande vise alors la racine du système, `/`. Ne l'exécutez jamais pour le vérifier : `echo` affiche ce que le shell a calculé, sans rien supprimer.

```bash
# VAR est définie mais vide
VAR=""
# echo affiche la commande telle que le shell la construirait, sans l'exécuter
echo rm -rf $VAR/
# les crochets restent visibles même quand la valeur est vide
echo "[$VAR]"
# avec une valeur normale, la commande vise bien le dossier voulu
VAR=/tmp/essai
echo rm -rf $VAR/
echo "[$VAR]"
```

```text
rm -rf /
[]
rm -rf /tmp/essai/
[/tmp/essai]
```

| Écriture | Si `VAR` est vide |
|---|---|
| `rm -rf $VAR/` | Devient `rm -rf /` : la racine est visée |
| `rm -rf "${VAR:?variable vide}/"` | Bash s'arrête avec l'erreur `VAR: variable vide`, rien n'est supprimé |

Avant toute suppression, `echo "[$VAR]"` montre la valeur : `[]` trahit une variable vide, alors qu'un `echo $VAR` seul n'afficherait qu'une ligne blanche, facile à ne pas remarquer.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une variable d'environnement est transmise automatiquement aux processus enfants, contrairement à une variable Bash classique : `export` la fait passer de l'une à l'autre, dans un seul sens (parent vers enfant). |
| **Outils utilisables** | `export`, `$PATH`, `~/.bashrc` (terminal interactif) vs `~/.bash_profile` (login), `alias`, `source`. |
| **Pièges à éviter** | Modifier une variable exportée dans un sous-script en espérant que ça se répercute sur le script appelant : chaque processus a sa propre copie de l'environnement. Attendre d'un autre terminal qu'il voie une variable exportée ailleurs. Écrire `rm -rf $VAR/` : si `VAR` est vide, la commande vise la racine. |
| **Bonnes pratiques** | Placer les `export`/`alias` destinés à chaque nouveau terminal dans `~/.bashrc` ; utiliser `source ~/.bashrc` pour appliquer un changement sans rouvrir de terminal. Afficher `echo "[$VAR]"` avant une suppression (les crochets révèlent une valeur vide) et protéger la variable par `"${VAR:?}"`. |
