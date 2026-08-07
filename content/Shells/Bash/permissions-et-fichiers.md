---
order: 11
---

# Permissions et manipulation de fichiers

Sous Linux/Unix, chaque fichier et dossier porte des **permissions** qui déterminent qui peut le lire, le modifier ou l'exécuter. Ce chapitre couvre à la fois ce système de permissions et les commandes de base pour manipuler des fichiers et dossiers en ligne de commande.

## Lire les permissions avec `ls -l`

```bash
ls -l fichier.txt
# -rw-r--r-- 1 utilisateur groupe 1024 28 juil. 10:00 fichier.txt
```

Les 10 premiers caractères se décomposent ainsi :

```
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- droits pour les autres utilisateurs
|   |    +------- droits pour le groupe propriétaire
|   +------------ droits pour le propriétaire
+---------------- type (- = fichier, d = dossier, l = lien symbolique)
```

Chaque groupe de trois caractères représente **lecture** (`r`), **écriture** (`w`) et **exécution** (`x`), dans cet ordre — un `-` signifie que le droit correspondant est absent.

## `chmod` : modifier les permissions

### Notation symbolique

```bash
chmod u+x script.sh    # ajoute le droit d'exécution pour le propriétaire (user)
chmod g-w fichier.txt   # retire le droit d'écriture pour le groupe
chmod o=r fichier.txt   # fixe les droits des autres à lecture seule, rien d'autre
chmod a+r fichier.txt   # ajoute la lecture pour tout le monde (all)
```

### Notation octale

Chaque droit vaut une puissance de 2 : `r=4`, `w=2`, `x=1` — on additionne pour chaque catégorie (propriétaire, groupe, autres) :

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) pour le propriétaire
# 5 = r-x (4+0+1) pour le groupe
# 5 = r-x (4+0+1) pour les autres
```

| Valeur | Droits |
|---|---|
| `7` | `rwx` (lecture + écriture + exécution) |
| `6` | `rw-` (lecture + écriture) |
| `5` | `r-x` (lecture + exécution) |
| `4` | `r--` (lecture seule) |
| `0` | Aucun droit |

> **Note :** `chmod 644 fichier` (lecture/écriture pour le propriétaire, lecture seule pour le reste) est la configuration la plus courante pour un fichier normal ; `755` pour un script ou un dossier destiné à être exécuté/parcouru.

## `chown` : changer le propriétaire

```bash
chown utilisateur fichier.txt           # change le propriétaire
chown utilisateur:groupe fichier.txt    # change propriétaire ET groupe en une fois
```

## Commandes de base sur les fichiers

```bash
mkdir dossier              # crée un dossier
mkdir -p a/b/c              # crée toute l'arborescence en une fois, sans erreur si elle existe déjà
touch fichier.txt           # crée un fichier vide (ou met à jour sa date de modification s'il existe)
cp source.txt destination.txt        # copie un fichier
cp -r dossier_source dossier_dest    # copie récursive, nécessaire pour un dossier
mv ancien.txt nouveau.txt   # déplace OU renomme (les deux sont la même opération pour mv)
rm fichier.txt              # supprime un fichier (définitif, pas de corbeille)
rm -r dossier               # supprime un dossier et tout son contenu
```

> **Note :** `rm -rf` (récursif + `-f` pour ignorer les confirmations/erreurs) est irréversible et ne demande aucune confirmation — une cible mal ciblée (ex. un chemin avec un espace en trop, `rm -rf ~ /dossier` au lieu de `rm -rf ~/dossier`) peut supprimer bien plus que prévu.

## `find` : rechercher des fichiers

```bash
find . -name "*.txt"                 # tous les fichiers .txt, à partir du dossier courant
find /var/log -mtime -7               # fichiers modifiés dans les 7 derniers jours
find . -type d -name "node_modules"   # tous les dossiers nommés "node_modules"
find . -name "*.tmp" -delete          # trouve ET supprime en une seule commande
```

Voir aussi [Traitement de texte](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`) pour aller plus loin dans l'exploitation du contenu de ces fichiers.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque fichier a des permissions lecture/écriture/exécution pour propriétaire/groupe/autres. `chmod` les modifie (notation symbolique ou octale), `chown` change le propriétaire. |
| **Outils utilisables** | `ls -l`, `chmod`/`chown`, `mkdir`/`cp`/`mv`/`rm`, `find`. |
| **Pièges à éviter** | `rm -rf` sans vérifier la cible exacte — irréversible, sans confirmation. |
| **Bonnes pratiques** | `chmod 644` pour un fichier normal, `755` pour un script/dossier exécutable ; toujours vérifier une commande `find ... -delete` en la testant d'abord sans `-delete`. |
