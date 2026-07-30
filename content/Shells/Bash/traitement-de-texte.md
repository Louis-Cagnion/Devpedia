---
order: 9
---

# Traitement de texte (grep, sed, awk...)

Une grande partie de la puissance du terminal Unix vient d'une poignée d'outils spécialisés dans le traitement de texte, conçus pour être combinés entre eux via des pipes (cf. chapitre sur les redirections). Ce chapitre présente les plus utilisés au quotidien.

## `grep` : rechercher du texte

```bash
grep "erreur" fichier.log         # affiche les lignes contenant "erreur"
grep -i "erreur" fichier.log      # insensible à la casse (-i)
grep -v "erreur" fichier.log      # inverse : affiche les lignes qui NE contiennent PAS "erreur"
grep -r "TODO" .                  # recherche récursive dans tous les fichiers d'un dossier
grep -n "erreur" fichier.log      # affiche aussi le numéro de ligne
grep -c "erreur" fichier.log      # compte le nombre de lignes correspondantes, sans les afficher
grep -E "erreur|warning" fichier.log  # -E active les regex étendues (cf. chapitre sur les regex)
```

Comme beaucoup de commandes Unix, ces drapeaux sont des initiales de mots anglais plutôt que des lettres arbitraires : `-i` = *ignore case*, `-v` = *invert*, `-r` = *recursive*, `-n` = *line number*, `-c` = *count*, `-E` = *extended (regex)*. Une fois ces mots connus, retenir le drapeau devient naturel — ce principe revient dans la plupart des commandes de ce chapitre et du suivant.

> **`grep` vs `pgrep`** : malgré le nom similaire, ce sont deux commandes indépendantes qui ne cherchent pas dans la même chose. `grep` cherche un motif dans du **texte** (fichier, sortie d'une commande...). `pgrep` (*process grep*, cf. chapitre sur la gestion des processus) cherche un motif dans la **liste des processus en cours** et renvoie des PID, pas des lignes de texte — `ps aux | grep motif` et `pgrep motif` répondent d'ailleurs à peu près à la même question, en passant par deux chemins différents.

## `sed` : rechercher et remplacer

`sed` (*stream editor*) lit le texte **une ligne à la fois** et applique à chacune une ou plusieurs commandes d'édition, sans jamais charger tout le fichier en mémoire. Par défaut, il ne modifie rien sur disque : il affiche le résultat sur la sortie standard, ligne par ligne, au fur et à mesure.

Une commande `sed` se décompose en deux parties : une **adresse** optionnelle (quelles lignes concerner) et une **commande** à leur appliquer.

```bash
sed 's/ancien/nouveau/' fichier.txt         # pas d'adresse -> la commande s'applique à TOUTES les lignes
sed '3s/ancien/nouveau/' fichier.txt        # adresse "3" -> seulement la ligne 3
sed '2,4s/ancien/nouveau/' fichier.txt       # adresse "2,4" -> uniquement les lignes 2 à 4
```

La commande la plus utilisée est `s/motif/remplacement/` (le "s" pour *substitute*) : elle recherche `motif` (une regex, cf. chapitre dédié) et le remplace par `remplacement`. Par défaut, `sed` ne remplace que la **première** occurrence trouvée sur chaque ligne — d'où le drapeau `g` pour traiter aussi les suivantes :

```bash
sed 's/ancien/nouveau/' fichier.txt        # remplace la 1ère occurrence par ligne, affiche le résultat
sed 's/ancien/nouveau/g' fichier.txt        # 'g' (global) : remplace TOUTES les occurrences de chaque ligne
sed -i 's/ancien/nouveau/g' fichier.txt     # -i : modifie le fichier directement (in place), sans rien afficher
```

L'autre commande courante est `p` (*print*), qui affiche explicitement une ligne — combinée à `-n` (qui désactive l'affichage automatique de chaque ligne traitée), elle permet de n'afficher que certaines lignes plutôt que tout le fichier :

```bash
sed -n '2,4p' fichier.txt   # -n : n'affiche RIEN par défaut ; '2,4p' : affiche explicitement les lignes 2 à 4
```

> **Note :** sans `-n`, `sed '2,4p'` afficherait chaque ligne du fichier une fois (comportement par défaut), et les lignes 2 à 4 une seconde fois (à cause du `p`) — `-n` et `p` fonctionnent presque toujours en paire.

## `awk` : traiter du texte en colonnes

`awk` découpe automatiquement chaque ligne en champs (`$1`, `$2`...), séparés par défaut par des espaces/tabulations :

```bash
echo "Jean Dupont 25" | awk '{ print $1 }'        # Jean -> premier champ
echo "Jean Dupont 25" | awk '{ print $3, $1 }'    # 25 Jean

awk -F ',' '{ print $2 }' donnees.csv    # -F ',' : change le séparateur de champ pour une virgule
```

`$0` désigne la ligne entière, `$NF` le **dernier** champ de la ligne (`NF` = *Number of Fields*) :

```bash
awk '{ print $NF }' fichier.txt   # affiche le dernier mot de chaque ligne
```

## `cut` : extraire des colonnes simplement

Plus limité qu'`awk`, mais suffisant pour des cas simples :

```bash
cut -d ',' -f 2 donnees.csv       # -d : séparateur, -f : numéro du champ à extraire
cut -c 1-5 fichier.txt            # extrait les caractères 1 à 5 de chaque ligne
```

## `sort` et `uniq` : trier et dédupliquer

```bash
sort fichier.txt                  # tri alphabétique
sort -n nombres.txt                # tri numérique (indispensable pour des nombres, sinon tri par chaîne)
sort -r fichier.txt                 # tri décroissant
sort fichier.txt | uniq            # supprime les lignes en double CONSÉCUTIVES seulement
sort fichier.txt | uniq -c          # compte les occurrences de chaque ligne
```

> **Note :** `uniq` ne détecte que des doublons **adjacents** — c'est pour ça qu'on le combine presque toujours avec `sort` avant, qui regroupe les lignes identiques ensemble.

## `wc` : compter

```bash
wc -l fichier.txt   # nombre de lignes
wc -w fichier.txt    # nombre de mots
wc -c fichier.txt    # nombre d'octets
```

## Combiner ces outils

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) garde les lignes d'erreur 404
# 2) extrait l'adresse IP (1er champ)
# 3) trie pour regrouper les IP identiques
# 4) compte les occurrences de chaque IP
# 5) trie par nombre d'occurrences décroissant -> les IP les plus fréquentes en premier
```
