---
title: Traitement de texte (grep, sed, awk...)
---

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

## `sed` : rechercher et remplacer

```bash
sed 's/ancien/nouveau/' fichier.txt        # remplace la 1ère occurrence par ligne, affiche le résultat
sed 's/ancien/nouveau/g' fichier.txt        # 'g' (global) : remplace TOUTES les occurrences de chaque ligne
sed -i 's/ancien/nouveau/g' fichier.txt     # -i : modifie le fichier directement (in place)
sed -n '2,4p' fichier.txt                    # affiche uniquement les lignes 2 à 4
```

> **Note :** `sed` traite le texte ligne par ligne et s'appuie sur les regex (cf. chapitre dédié) pour le motif de recherche — `s/motif/remplacement/` est sa commande la plus utilisée ("s" pour *substitute*).

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
