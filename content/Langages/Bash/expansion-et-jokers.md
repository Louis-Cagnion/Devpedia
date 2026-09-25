---
order: 8
---

# Expansion et jokers (globbing)

Avant d'exécuter une commande, Bash remplace certains motifs qu'elle contient par leur valeur réelle : [variables](/?c=shells&s=bash&p=variables) (`$nom`), mais aussi motifs de fichiers (*globbing*) et expansions d'accolades. Comprendre cette étape (invisible mais systématique) explique pourquoi certaines commandes se comportent différemment selon les guillemets utilisés.

## Le globbing : `*`, `?`, `[]`

```bash
ls *.txt             # tous les fichiers se terminant par .txt
# fichier1.txt, fichierA.txt... ('?' = exactement 1 caractère, n'importe lequel)
ls fichier?.txt
ls fichier[123].txt  # fichier1.txt, fichier2.txt ou fichier3.txt uniquement
ls fichier[a-z].txt  # une seule lettre minuscule à cette position
```

| Motif | Signifie |
|---|---|
| `*` | N'importe quelle suite de caractères (y compris vide) |
| `?` | Exactement un caractère, n'importe lequel |
| `[abc]` | Un seul caractère parmi `a`, `b` ou `c` |
| `[a-z]` | Un seul caractère dans cette plage |
| `[^abc]` | Un seul caractère qui n'est ni `a`, `b`, ni `c` |

> **Note :** ce n'est **pas** une [regex](/?c=domain-specific-languages-dsl&p=regex) : le globbing est plus simple, propre à l'interprétation des noms de fichiers par le shell lui-même, avant même que la commande ne soit lancée.

## Attention : que se passe-t-il si aucun fichier ne correspond ?

```bash
echo *.xyz
# si aucun fichier .xyz n'existe, Bash affiche littéralement "*.xyz" (le motif n'est pas
# remplacé)
```

C'est une source classique de bugs : un script qui suppose que `*.xyz` désigne toujours une liste de fichiers réels peut recevoir le texte brut `*.xyz` comme unique "nom de fichier" si le dossier ne contient rien de tel.

## L'expansion d'accolades (*brace expansion*)

Génère plusieurs chaînes à partir d'un seul motif, **avant** toute recherche de fichiers réels sur le disque :

```bash
echo fichier{1,2,3}.txt
# fichier1.txt fichier2.txt fichier3.txt

mkdir -p projet/{src,tests,docs}
# crée les trois dossiers en une seule commande

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Note :** contrairement au globbing, l'expansion d'accolades ne dépend d'aucun fichier existant : `fichier{1,2,3}.txt` génère toujours ces trois chaînes, que les fichiers correspondants existent ou non.

## L'expansion du tilde (`~`)

```bash
cd ~          # équivalent à cd $HOME
cd ~/projets  # équivalent à cd $HOME/projets
```

## Empêcher l'expansion : les guillemets

```bash
echo *.txt    # remplacé par la liste réelle des fichiers .txt
echo "*.txt"  # affiche littéralement *.txt -> les guillemets doubles désactivent le globbing
# même résultat, guillemets simples encore plus stricts (désactivent aussi $variable)
echo '*.txt'
```

Voir aussi [Les variables](/?c=shells&s=bash&p=variables) pour la distinction guillemets simples/doubles vis-à-vis de l'interprétation de `$variable`.

## L'antislash `\` : un caractère d'échappement

Hors guillemets, l'antislash `\` retire son sens spécial au caractère qui le suit : `\*` désigne une vraie étoile, `\ ` un vrai espace dans un nom de fichier. Bash consomme alors l'antislash lui-même, qui disparaît de la commande ([Escape Character](https://www.gnu.org/software/bash/manual/html_node/Escape-Character.html)).

C'est un piège courant avec **Git Bash**, le Bash installé sous Windows avec [Git for Windows](https://gitforwindows.org/) : les chemins Windows utilisent justement `\` comme séparateur de dossiers.

```bash
# ouvre dans VS Code un dossier inexistant : Bash a reçu C:Userslouisprojet
code C:\Users\louis\projet
# guillemets doubles : les antislashs devant une lettre sont conservés
code "C:\Users\louis\projet"
# guillemets simples : tout est conservé tel quel
code 'C:\Users\louis\projet'
# barres obliques : acceptées par la plupart des programmes Windows
code C:/Users/louis/projet
```

La commande `code` ouvre l'éditeur VS Code depuis le terminal (voir [l'éditeur de code](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

| Écriture | Ce que reçoit le programme |
|---|---|
| `C:\Users\louis\projet` (sans guillemets) | `C:Userslouisprojet` |
| `"C:\Users\louis\projet"` | `C:\Users\louis\projet` |
| `'C:\Users\louis\projet'` | `C:\Users\louis\projet` |
| `"\\serveur\partage"` (partage réseau) | `\serveur\partage` : un antislash perdu |
| `'\\serveur\partage'` | `\\serveur\partage` |

Entre guillemets doubles, l'antislash garde un sens spécial devant `\`, `$`, `` ` `` et `"` ([Double Quotes](https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html)) : c'est pourquoi le double antislash d'un partage réseau Windows (`\\serveur`) y perd un de ses deux caractères.

> **Piège :** copier-coller un chemin depuis l'explorateur Windows dans Git Bash sans guillemets : l'erreur ne signale pas les antislashs manquants, seulement un dossier introuvable ou, pire, un autre dossier que prévu.
>
> **Bonne pratique :** entourer un chemin Windows de guillemets simples, ou remplacer ses `\` par des `/`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Avant d'exécuter une commande, Bash remplace variables, motifs de fichiers (globbing) et expansions d'accolades : une étape invisible mais systématique. Le globbing dépend des fichiers réellement présents ; l'expansion d'accolades n'en dépend jamais. |
| **Outils utilisables** | `*`/`?`/`[abc]` (globbing), `{1,2,3}`/`{1..5}` (accolades), `~` (tilde). |
| **Pièges à éviter** | Un motif de globbing qui ne correspond à aucun fichier est transmis littéralement à la commande, sans erreur ni avertissement. Un chemin Windows sans guillemets perd tous ses `\`. |
| **Bonnes pratiques** | Entourer de guillemets doubles toute variable susceptible de contenir un espace ou un caractère spécial, pour désactiver le découpage en mots et le globbing non désirés. Entourer un chemin Windows de guillemets simples, ou utiliser des `/`. |
