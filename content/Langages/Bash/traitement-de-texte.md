---
order: 10
---

# Traitement de texte (grep, sed, awk...)

Une grande partie de la puissance du [terminal Unix](/?c=shells&s=bash&p=scripts-et-shebang) vient d'une poignée d'outils spécialisés dans le traitement de texte, conçus pour être combinés entre eux via des [pipes](/?c=shells&s=bash&p=redirections-et-pipes). Ce chapitre présente les plus utilisés au quotidien.

## `grep` : rechercher du texte

```bash
# affiche les lignes contenant "erreur"
grep "erreur" fichier.log
# insensible à la casse (-i)
grep -i "erreur" fichier.log
# inverse : affiche les lignes qui NE contiennent PAS "erreur"
grep -v "erreur" fichier.log
# recherche récursive dans tous les fichiers d'un dossier
grep -r "TODO" .
# affiche aussi le numéro de ligne
grep -n "erreur" fichier.log
# compte le nombre de lignes correspondantes, sans les afficher
grep -c "erreur" fichier.log
# -E active les regex étendues (cf. chapitre sur les regex)
grep -E "erreur|warning" fichier.log
# affiche seulement les NOMS des fichiers qui contiennent le motif
grep -l "TODO" *.md
# n'affiche rien : sert uniquement à tester la présence (voir plus bas)
grep -q "TODO" *.md
```

Comme beaucoup de commandes Unix, ces drapeaux sont des initiales de mots anglais plutôt que des lettres arbitraires : `-i` = *ignore case*, `-v` = *invert*, `-r` = *recursive*, `-n` = *line number*, `-c` = *count*, `-E` = *extended (regex)*, `-l` = *files with matches (list)*, `-q` = *quiet*. Une fois ces mots connus, retenir le drapeau devient naturel : ce principe revient dans la plupart des commandes de ce chapitre et du suivant.

Les drapeaux se combinent, avec parfois des interactions à connaître : `grep -rln "motif" *.md` cumule récursif + liste de fichiers + numéro de ligne, mais `-l` **l'emporte sur `-n`** (on ne peut pas afficher un numéro de ligne quand on n'affiche que des noms de fichiers). Le drapeau ignoré ne provoque aucun avertissement.

### Chercher plusieurs motifs : `\|` ou `-E`

`grep` utilise par défaut les regex **basiques** (BRE), dans lesquelles l'alternance doit être échappée. Avec `-E` (regex étendues), elle s'écrit naturellement :

```bash
grep "erreur\|warning" fichier.log    # BRE : l'alternance s'ecrit \|
grep -E "erreur|warning" fichier.log  # ERE : plus lisible, a preferer
```

Un `|` non échappé sans `-E` est cherché **littéralement** : `grep "a|b"` cherche la chaîne `a|b`, et ne trouve donc rien la plupart du temps, sans erreur ni avertissement. C'est un piège classique. Voir le chapitre [La regex](/?c=domain-specific-languages-dsl&p=regex) pour la différence BRE/ERE.

### Le code de retour de `grep`

`grep` ne sert pas qu'à afficher : son **code de sortie** répond à la question « as-tu trouvé quelque chose ? ».

| Code | Signification |
|---|---|
| `0` | au moins une correspondance trouvée |
| `1` | aucune correspondance (ce n'est **pas** une erreur) |
| `2` | une vraie erreur (fichier illisible, motif invalide) |

C'est ce qui permet de l'enchaîner avec `&&` ou `||` (voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes)) :

```bash
grep -rl "motif" *.md || echo "absent"  # message de repli si rien n'est trouve
grep -q "motif" f.txt && traiter f.txt  # ne traite le fichier que s'il contient le motif
```

Avec `-q`, `grep` s'arrête dès la première correspondance et n'affiche rien : c'est la forme à privilégier quand seul le résultat du test compte, notamment sur de gros fichiers.

> Ce code de retour `1` explique un comportement déroutant sous `set -e` : un `grep` qui ne trouve rien fait échouer un script entier. La parade habituelle est `grep motif fichier || true`.

> **`grep` vs `pgrep`** : malgré le nom similaire, ce sont deux commandes indépendantes qui ne cherchent pas dans la même chose. `grep` cherche un motif dans du **texte** (fichier, sortie d'une commande...). `pgrep` (*process grep*, voir [La gestion des processus](/?c=shells&s=bash&p=gestion-des-processus)) cherche un motif dans la **liste des processus en cours** et renvoie des PID, pas des lignes de texte : `ps aux | grep motif` et `pgrep motif` répondent d'ailleurs à peu près à la même question, en passant par deux chemins différents.

## `sed` : rechercher et remplacer

`sed` (*stream editor*) lit le texte **une ligne à la fois** et applique à chacune une ou plusieurs commandes d'édition, sans jamais charger tout le fichier en mémoire. Par défaut, il ne modifie rien sur disque : il affiche le résultat sur la sortie standard, ligne par ligne, au fur et à mesure.

Une commande `sed` se décompose en deux parties : une **adresse** optionnelle (quelles lignes concerner) et une **commande** à leur appliquer.

```bash
# pas d'adresse -> la commande s'applique à TOUTES les lignes
sed 's/ancien/nouveau/' fichier.txt
# adresse "3" -> seulement la ligne 3
sed '3s/ancien/nouveau/' fichier.txt
# adresse "2,4" -> uniquement les lignes 2 à 4
sed '2,4s/ancien/nouveau/' fichier.txt
```

La commande la plus utilisée est `s/motif/remplacement/` (le "s" pour *substitute*) : elle recherche `motif` (une [regex](/?c=domain-specific-languages-dsl&p=regex)) et le remplace par `remplacement`. Par défaut, `sed` ne remplace que la **première** occurrence trouvée sur chaque ligne, d'où le drapeau `g` pour traiter aussi les suivantes :

```bash
# remplace la 1ère occurrence par ligne, affiche le résultat
sed 's/ancien/nouveau/' fichier.txt
# 'g' (global) : remplace TOUTES les occurrences de chaque ligne
sed 's/ancien/nouveau/g' fichier.txt
# -i : modifie le fichier directement (in place), sans rien afficher
sed -i 's/ancien/nouveau/g' fichier.txt
```

L'autre commande courante est `p` (*print*), qui affiche explicitement une ligne ; combinée à `-n` (qui désactive l'affichage automatique de chaque ligne traitée), elle permet de n'afficher que certaines lignes plutôt que tout le fichier :

```bash
# -n : n'affiche RIEN par défaut ; '2,4p' : affiche explicitement les lignes 2 à 4
sed -n '2,4p' fichier.txt
```

> **Note :** sans `-n`, `sed '2,4p'` afficherait chaque ligne du fichier une fois (comportement par défaut), et les lignes 2 à 4 une seconde fois (à cause du `p`) : `-n` et `p` fonctionnent presque toujours en paire.

## `awk` : traiter du texte en colonnes

`awk` découpe automatiquement chaque ligne en champs (`$1`, `$2`...), séparés par défaut par des espaces/tabulations :

```bash
echo "Jean Dupont 25" | awk '{ print $1 }'      # Jean -> premier champ
echo "Jean Dupont 25" | awk '{ print $3, $1 }'  # 25 Jean

# -F ',' : change le séparateur de champ pour une virgule
awk -F ',' '{ print $2 }' donnees.csv
```

`$0` désigne la ligne entière, `$NF` le **dernier** champ de la ligne (`NF` = *Number of Fields*) :

```bash
awk '{ print $NF }' fichier.txt   # affiche le dernier mot de chaque ligne
```

## `cut` : extraire des colonnes simplement

Plus limité qu'`awk`, mais suffisant pour des cas simples :

```bash
cut -d ',' -f 2 donnees.csv  # -d : séparateur, -f : numéro du champ à extraire
cut -c 1-5 fichier.txt       # extrait les caractères 1 à 5 de chaque ligne
```

## `sort` et `uniq` : trier et dédupliquer

```bash
sort fichier.txt            # tri alphabétique
# tri numérique (indispensable pour des nombres, sinon tri par chaîne)
sort -n nombres.txt
sort -r fichier.txt         # tri décroissant
sort fichier.txt | uniq     # supprime les lignes en double CONSÉCUTIVES seulement
sort fichier.txt | uniq -c  # compte les occurrences de chaque ligne
```

> **Note :** `uniq` ne détecte que des doublons **adjacents** : c'est pour ça qu'on le combine presque toujours avec `sort` avant, qui regroupe les lignes identiques ensemble.

## `wc` : compter

```bash
wc -l fichier.txt  # nombre de lignes
wc -w fichier.txt  # nombre de mots
wc -c fichier.txt  # nombre d'octets
```

## Nombres décimaux et locale : le piège de la virgule

La **locale** (*locale*) est le réglage de langue et de région de la session : la variable `LC_ALL` la fixe pour tout, `LC_NUMERIC` pour les seuls nombres (`LC_ALL`, si elle est définie, l'emporte sur `LC_NUMERIC`). Avec une locale française (`fr_FR.UTF-8`), le séparateur décimal est la **virgule**. Les outils qui respectent la locale écrivent alors `3,14` et n'acceptent plus `3.14` ; le même script donne un autre résultat selon la machine.

| Commande | `LC_ALL=C` | `LC_ALL=fr_FR.UTF-8` |
|---|---|---|
| `printf '%.2f\n' 3.14159` (`printf` de Bash) | `3.14` | erreur `invalid number`, puis affiche `3,00` |
| `printf '%.2f\n' 3,14159` | erreur `invalid number`, puis `3.00` | `3,14` |
| `awk --use-lc-numeric 'BEGIN{printf "%.2f\n", 3.14159}'` (`gawk`) | `3.14` | `3,14` |
| `awk --use-lc-numeric '{print $2 + 1}' <<< 'a 3.5'` | `4.5` | `4` (lit `3`, ignore `.5`, sans erreur) |

Mesuré avec Bash 5 et `gawk` 5.4. `gawk` ignore la locale par défaut (il écrit `3.14` même en `fr_FR`) : l'option `--use-lc-numeric` la lui fait respecter. D'autres versions d'`awk` la respectent sans option : à vérifier sur la vôtre.

Conséquence : une valeur écrite avec une virgule dans un fichier (`0,500`) est refusée ou tronquée par tout lecteur qui attend un point (JSON, CSV anglo-saxon, `strtod` dans la locale `C`), et un calcul sur un nombre à point peut s'arrêter au point sans message.

```bash
# fixe la locale pour cette seule commande : nombres écrits et lus avec un point
LC_ALL=C awk '{ s += $2 } END { printf "%.2f\n", s }' mesures.txt
```

> **Piège :** exporter `LC_NUMERIC=C` ne sert à rien si `LC_ALL` est défini plus haut (mesuré : `LC_NUMERIC=C LC_ALL=fr_FR.UTF-8 printf '%.2f\n' 3.14159` échoue encore). **Bonne pratique :** dans tout script qui produit ou lit des nombres pour un autre programme, fixer `LC_ALL=C` devant la commande concernée plutôt que de dépendre de la locale de la machine.

## Combiner ces outils

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) garde les lignes d'erreur 404
# 2) extrait l'adresse IP (1er champ)
# 3) trie pour regrouper les IP identiques
# 4) compte les occurrences de chaque IP
# 5) trie par nombre d'occurrences décroissant -> les IP les plus fréquentes en premier
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `grep` recherche, `sed` remplace, `awk` traite par colonnes : conçus pour se combiner via des pipes plutôt que d'être utilisés isolément. |
| **Outils utilisables** | `grep -i`/`-v`/`-r`/`-E`, `sed 's/.../.../'`, `awk '{ print $1 }'`, `cut`, `sort`/`uniq`, `wc`. |
| **Pièges à éviter** | Un `\|` non échappé sans `-E` dans `grep` est cherché littéralement, sans erreur ni avertissement ; `uniq` sans `sort` préalable ne détecte que les doublons adjacents. |
| **Bonnes pratiques** | Combiner `sort` avant `uniq` pour dédupliquer correctement ; utiliser `grep -q` plutôt que `grep` simple quand seul le résultat du test (trouvé/pas trouvé) compte. |
