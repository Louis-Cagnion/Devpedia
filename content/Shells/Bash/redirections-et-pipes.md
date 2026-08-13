---
order: 9
---

# Redirections et pipes

Chaque commande Unix communique par défaut via trois flux : l'**entrée standard** (`stdin`, ce qu'elle lit), la **sortie standard** (`stdout`, ce qu'elle affiche normalement) et la **sortie d'erreur** (`stderr`, où vont les messages d'erreur). Les redirections et les pipes permettent de rediriger ces flux vers un fichier ou vers une autre commande, plutôt que vers le terminal.

> **Note :** ces "flux" sont en réalité des **descripteurs de fichiers** numérotés (`0`, `1`, `2`) : voir [le chapitre sur les appels système et les descripteurs de fichiers](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) (rubrique C) pour ce qui se passe réellement au niveau du système d'exploitation quand on les redirige.

## Rediriger la sortie vers un fichier

```bash
echo "Bonjour" > fichier.txt  # écrase fichier.txt (ou le crée) avec ce contenu
echo "Encore" >> fichier.txt  # ajoute à la fin de fichier.txt, sans écraser
```

> **Note :** `>` écrase silencieusement le contenu existant du fichier cible : une erreur classique est d'utiliser `>` là où `>>` était voulu, perdant le contenu précédent sans avertissement.

## Rediriger l'entrée depuis un fichier

```bash
sort < liste.txt   # lit liste.txt comme entrée standard de "sort", plutôt que d'attendre une saisie clavier
```

## Rediriger la sortie d'erreur

Les flux sont numérotés : `0` = entrée standard, `1` = sortie standard, `2` = sortie d'erreur.

```bash
commande_qui_echoue 2> erreurs.log     # seule la sortie d'erreur va dans erreurs.log
commande 1> sortie.log 2> erreurs.log  # sépare sortie normale et erreurs dans deux fichiers
commande > tout.log 2>&1               # redirige stdout dans tout.log, PUIS stderr vers là où va stdout
commande &> tout.log                   # raccourci Bash équivalent à "> tout.log 2>&1"
```

> **Note :** l'ordre compte pour `2>&1`. `2>&1 > fichier` ne fonctionne **pas** comme attendu : à ce moment-là, `2` est encore redirigé vers le terminal (la sortie standard d'alors), et seul `1` part ensuite vers `fichier`. Il faut écrire `> fichier 2>&1` : d'abord rediriger `1` vers `fichier`, puis faire pointer `2` vers la même cible que `1` **à cet instant précis**.

## `/dev/null` : ignorer une sortie

Un fichier spécial qui "avale" tout ce qu'on y écrit, sans jamais rien stocker : utile pour supprimer un flux dont on n'a pas besoin :

```bash
commande_bruyante > /dev/null 2>&1   # ignore toute sortie normale ET toute erreur
```

## Les pipes (`|`) : chaîner des commandes

Un pipe connecte la sortie standard d'une commande à l'entrée standard de la suivante :

```bash
ls -l | grep ".txt"               # ne garde que les lignes contenant ".txt"
grep "404" access.log | wc -l     # compte les lignes contenant "404" dans le fichier
ps aux | sort -k 3 -nr | head -5  # les 5 processus qui consomment le plus de CPU
```

Chaque commande d'un pipe s'exécute simultanément, la sortie de l'une alimentant l'entrée de la suivante au fur et à mesure : ce n'est pas une exécution séquentielle avec stockage intermédiaire.

## Enchaîner des commandes selon leur résultat : `;`, `&&`, `||`

Un pipe fait circuler des **données**. Ces trois opérateurs, eux, contrôlent l'**exécution** : ils décident si la commande suivante est lancée, en fonction du code de sortie de la précédente (`0` = succès, voir [Écrire et exécuter un script Bash](/?c=shells&s=bash&p=scripts-et-shebang)).

```bash
commande1 ; commande2   # lance commande2 dans tous les cas
commande1 && commande2  # lance commande2 SEULEMENT si commande1 a reussi
commande1 || commande2  # lance commande2 SEULEMENT si commande1 a echoue
```

En pratique :

```bash
mkdir -p build && cd build                # n'entre dans le dossier que s'il a bien ete cree
./configure && make && make install       # la chaine s'arrete des qu'une etape echoue
grep -q "TODO" *.md || echo "aucun TODO"  # message de repli si grep ne trouve rien
```

On parle d'évaluation **court-circuit** (*short-circuit*) : `&&` n'exécute la suite que si nécessaire, exactement comme les opérateurs logiques d'autres langages.

> Ne confondez pas ces `&&`/`||` avec ceux vus dans le chapitre sur les conditions. À l'intérieur de `[[ ... ]]`, ce sont des opérateurs **logiques** qui combinent deux tests. Entre deux commandes, ce sont des opérateurs de **contrôle de flux** basés sur les codes de sortie. La graphie est identique, le rôle est différent.

### Le piège du `&& ... || ...`

Écrire un « si/sinon » en une ligne est tentant, mais ne se comporte pas comme un `if/else` :

```bash
commande && echo "OK" || echo "ECHEC"
```

Si `commande` réussit mais que `echo "OK"` échoue (cas rare mais possible, par exemple si la sortie est fermée), alors le `||` se déclenche et `ECHEC` s'affiche **aussi**. Pour une logique conditionnelle réelle, un `if` explicite est plus sûr :

```bash
if commande; then echo "OK"; else echo "ECHEC"; fi
```

### Attention avec `set -e`

Une commande placée à gauche d'un `&&` ou d'un `||` est considérée comme « testée » : son échec **n'interrompt pas** le script même sous `set -e`. C'est ce qui permet d'écrire `grep motif fichier || true` pour neutraliser volontairement un échec attendu, mais c'est aussi une source de surprise si on croyait que `set -e` protégeait toute la ligne.

## `tee` : rediriger tout en gardant un affichage

`tee` écrit sa sortie à la fois dans un fichier **et** vers la sortie standard (utile pour voir un résultat tout en le sauvegardant) :

```bash
ls -l | tee resultats.txt   # affiche le résultat à l'écran ET l'enregistre dans resultats.txt
```

## Résumé des symboles

| Symbole | Effet |
|---|---|
| `>` | Redirige la sortie standard, écrase le fichier |
| `>>` | Redirige la sortie standard, ajoute à la fin |
| `<` | Redirige l'entrée standard depuis un fichier |
| `2>` | Redirige la sortie d'erreur |
| `&>` | Redirige sortie standard ET erreur vers la même cible |
| `\|` | Connecte la sortie d'une commande à l'entrée de la suivante |
| `;` | Enchaîne deux commandes, sans condition |
| `&&` | Exécute la suivante seulement si la précédente a réussi |
| `\|\|` | Exécute la suivante seulement si la précédente a échoué |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `>`/`>>`/`<` redirigent les flux stdin/stdout/stderr vers ou depuis un fichier ; `\|` connecte la sortie d'une commande à l'entrée de la suivante. `&&`/`\|\|`/`;` enchaînent des commandes selon leur code de sortie. |
| **Outils utilisables** | `2>&1` (fusionner stderr dans stdout), `/dev/null` (ignorer une sortie), `tee` (afficher et sauvegarder à la fois). |
| **Pièges à éviter** | `>` qui écrase silencieusement un fichier existant ; l'ordre de `2>&1` par rapport à `>` (`2>&1 > fichier` ne fait pas ce qu'on attend). |
| **Bonnes pratiques** | Écrire `> fichier 2>&1` (jamais l'inverse) ; préférer un `if` explicite à un `&& ... \|\| ...` dès que la logique conditionnelle est réellement importante. |
