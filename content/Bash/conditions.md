---
title: Les conditions en Bash
---

Bash n'a pas d'opérateurs de comparaison intégrés au langage comme en PHP ou en C — les tests s'appuient sur des **commandes** (`test`, `[`, `[[`) dont le code de sortie (`$?`) détermine si la condition est vraie (`0`) ou fausse (non nul).

## `if` / `then` / `elif` / `else` / `fi`

```bash
age=18

if [ $age -ge 18 ]; then
    echo "Vous êtes majeur."
else
    echo "Vous êtes mineur."
fi
```

- `if` évalue en réalité le **code de sortie** de la commande qui suit (ici, `[ $age -ge 18 ]`) — `[` est une vraie commande (souvent un lien vers `/usr/bin/test`), pas un symbole du langage.
- `fi` (`if` à l'envers) ferme le bloc, comme `endif` le ferait dans d'autres langages.

## `[ ]` vs `[[ ]]`

```bash
[[ $age -ge 18 && $age -lt 65 ]]  # [[ ]] : syntaxe étendue Bash, && et || directement utilisables
[ $age -ge 18 ] && [ $age -lt 65 ]  # [ ] : POSIX, nécessite de combiner deux tests séparés
```

`[[ ]]` (spécifique à Bash, pas portable vers un `sh` strictement POSIX) accepte `&&`/`||` directement à l'intérieur, gère mieux les variables non définies, et permet le filtrage par motif (`[[ $nom == J* ]]`).

## Comparer des nombres

```bash
if [ $age -eq 18 ]; then echo "Exactement 18"; fi
```

| Opérateur | Signification |
|---|---|
| `-eq` | Égal |
| `-ne` | Différent |
| `-lt` | Inférieur |
| `-le` | Inférieur ou égal |
| `-gt` | Supérieur |
| `-ge` | Supérieur ou égal |

> **Note :** `==` et `!=` fonctionnent aussi dans `[[ ]]`, mais uniquement pour comparer des **chaînes**. Utiliser `==` sur des nombres à l'intérieur de `[ ]` classique compare les valeurs comme du texte, pas numériquement (`"10" < "9"` textuellement, mais `10 -gt 9` numériquement).

## Comparer des chaînes

```bash
nom="Jean"

if [ "$nom" == "Jean" ]; then
    echo "Bonjour Jean"
fi

if [ -z "$nom" ]; then
    echo "nom est vide"
fi
```

| Opérateur | Signification |
|---|---|
| `==` / `=` | Égalité de chaînes |
| `!=` | Différence de chaînes |
| `-z "$str"` | Vrai si la chaîne est vide |
| `-n "$str"` | Vrai si la chaîne n'est pas vide |

## Tester des fichiers

```bash
if [ -f "config.php" ]; then
    echo "Le fichier existe"
fi

if [ -d "/var/www" ]; then
    echo "Le dossier existe"
fi
```

| Opérateur | Vrai si... |
|---|---|
| `-f chemin` | ...c'est un fichier existant |
| `-d chemin` | ...c'est un dossier existant |
| `-e chemin` | ...quelque chose existe à ce chemin (fichier ou dossier) |
| `-x chemin` | ...le fichier est exécutable |
| `-r` / `-w` | ...le fichier est lisible / inscriptible |

## Combiner des conditions

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "Le fichier existe et est lisible"
fi
```

## Le `case` (équivalent de `switch`)

```bash
jour="mer"

case $jour in
    lun|mar|mer|jeu|ven)
        echo "Jour de semaine"
        ;;
    sam|dim)
        echo "Week-end"
        ;;
    *)
        echo "Jour inconnu"
        ;;
esac
```

`|` sépare plusieurs motifs pour un même bloc, `*)` capture tout le reste (équivalent du `default` d'un `switch`), et `;;` marque la fin de chaque bloc.
