---
order: 14
---

# Construire une CLI avec `argparse`

Une **CLI** (*Command-Line Interface*, interface en ligne de commande) est un programme qu'on pilote entièrement par des commandes tapées dans un [terminal](/?c=bases-de-l-informatique&p=le-terminal), plutôt que par des clics dans une interface graphique : `git`, `ls`, ou le script `pdf_parser process rapport.pdf --marque peugeot` de ce chapitre en sont des exemples. Un script Python lancé de cette façon reçoit ses arguments dans `sys.argv` (une simple liste de chaînes), exactement comme `$1`/`$2` en [Bash](/?c=shells&s=bash&p=scripts-et-shebang). Les lire un par un à la main devient vite pénible dès qu'il faut gérer des options, des valeurs par défaut, ou produire un message d'aide correct. **`argparse`** (module de la bibliothèque standard) construit tout cela à partir d'une description déclarative des arguments attendus.

## Arguments positionnels et optionnels

```python
import argparse

parser = argparse.ArgumentParser(prog="convertisseur")
parser.add_argument("fichier", help="Chemin du fichier à convertir")      # positionnel : obligatoire, identifié par sa position
parser.add_argument("--format", default="json", help="Format de sortie")  # optionnel : identifié par son nom, "--" devant

args = parser.parse_args()
print(args.fichier, args.format)
```

```bash
python convertisseur.py rapport.csv               # fichier="rapport.csv", format="json" (valeur par défaut)
python convertisseur.py rapport.csv --format=xml  # fichier="rapport.csv", format="xml"
```

| | Positionnel | Optionnel |
|---|---|---|
| Syntaxe de déclaration | `add_argument("nom")` | `add_argument("--nom")` |
| Identifié par | Sa position dans la commande | Son nom, précédé de `--` |
| Obligatoire par défaut ? | Oui | Non, sauf `required=True` explicite |
| Accès dans `args` | `args.nom` | `args.nom` (le `--` n'apparaît pas dans le nom d'attribut) |

## Types, valeurs par défaut, drapeaux booléens

```python
parser.add_argument("--repetitions", type=int, default=1)  # convertit automatiquement la chaîne reçue en int
parser.add_argument("--verbeux", action="store_true")      # drapeau booléen : présent -> True, absent -> False

args = parser.parse_args(["--repetitions", "3", "--verbeux"])
print(args.repetitions, args.verbeux)   # 3 True
```

> **Piège :** sans `type=int`, `args.repetitions` reste une **chaîne** (`"3"`), même si elle "ressemble" à un nombre : `args.repetitions * 2` donnerait `"33"` (répétition de chaîne), pas `6`.
>
> **Bonne pratique :** toujours préciser `type=` dès qu'un argument attend autre chose qu'une chaîne brute ; `argparse` lève lui-même une erreur claire si la conversion échoue (ex. `--repetitions abc`), plutôt que de laisser une conversion manuelle échouer plus loin dans le programme avec un message confus.

## L'aide générée automatiquement

`argparse` construit `--help` sans rien écrire de plus, à partir des `help=` fournis à chaque argument :

```bash
python convertisseur.py --help
# usage: convertisseur [-h] [--format FORMAT] fichier
#
# positional arguments:
#   fichier          Chemin du fichier à convertir
#
# options:
#   -h, --help       show this help message and exit
#   --format FORMAT  Format de sortie
```

> **Bonne pratique :** toujours fournir `help=` sur chaque argument, y compris ceux qui semblent évidents au moment de l'écrire : c'est ce texte qui apparaîtra pour un utilisateur qui découvre l'outil des mois plus tard, sans le contexte que l'auteur avait en tête.

## Les sous-commandes : plusieurs actions dans un seul programme

Un outil qui propose plusieurs actions distinctes (`git commit`, `git push`, [`docker run`](/?c=docker&p=commandes-essentielles)...) les regroupe en **sous-commandes**, chacune avec ses propres arguments. `add_subparsers` construit ce découpage :

```python
import argparse

parser = argparse.ArgumentParser(prog="pdf_parser")
sous_commandes = parser.add_subparsers(dest="command", required=True)

process_parser = sous_commandes.add_parser("process", help="Traite un PDF")
process_parser.add_argument("pdf_path", help="Chemin vers le PDF à traiter")
process_parser.add_argument("--marque", required=True, help="Identifiant de la marque")

args = parser.parse_args()

if args.command == "process":
    print(f"Traitement de {args.pdf_path} pour la marque {args.marque}")
```

```bash
pdf_parser process rapport.pdf --marque peugeot
# Traitement de rapport.pdf pour la marque peugeot

pdf_parser process rapport.pdf
# error: the following arguments are required: --marque
```

- `dest="command"` nomme l'attribut (`args.command`) qui contiendra le nom de la sous-commande effectivement utilisée (`"process"` ici), pour pouvoir la tester ensuite avec un `if`.
- Chaque sous-commande créée par `add_parser(...)` est un `ArgumentParser` à part entière : elle a ses propres arguments, indépendants de ceux des autres sous-commandes.

> **Piège :** omettre `required=True` sur `add_subparsers()`. Un programme lancé sans aucune sous-commande laisse alors `args.command` à `None`, sans qu'aucune erreur ne soit levée par `argparse` lui-même : le programme continue de s'exécuter, potentiellement jusqu'à un endroit bien plus tard où l'absence de commande finit par causer un échec confus.
>
> **Bonne pratique :** déclarer systématiquement `required=True` sur `add_subparsers()` dès qu'au moins une sous-commande est obligatoire pour que le programme ait un sens ; `argparse` refuse alors de démarrer sans commande précisée, avec un message d'erreur explicite plutôt qu'un échec silencieux plus loin.

## Rendre une CLI testable : ne jamais lire `sys.argv` en dur

`parser.parse_args()` sans argument lit `sys.argv` directement : pratique pour l'usage réel, mais impossible à tester unitairement sans lancer un vrai sous-processus. La parade : accepter les arguments en paramètre, avec `None` par défaut pour retomber sur `sys.argv` uniquement en usage réel :

```python
import sys

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pdf_parser")
    # ... déclaration des arguments ...
    args = parser.parse_args(argv)   # argv=None -> argparse lit sys.argv lui-même ; sinon, utilise la liste fournie
    # ... logique du programme ...
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

Un test peut alors appeler `main(["process", "test.pdf", "--marque", "peugeot"])` directement, sans jamais invoquer un vrai terminal, et vérifier la valeur entière renvoyée (`0` = succès, une autre valeur = échec) exactement comme le [code de sortie](/?c=shells&s=bash&p=scripts-et-shebang) d'un script [Bash](/?c=shells&s=bash&p=bash).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `argparse` construit un analyseur d'arguments (positionnels, optionnels, typés) à partir d'une description déclarative, avec `--help` généré automatiquement. `add_subparsers` regroupe plusieurs actions distinctes dans un seul programme. |
| **Outils utilisables** | `add_argument` (`type=`, `default=`, `action="store_true"`, `required=`), `add_subparsers(dest=..., required=True)`. |
| **Pièges à éviter** | Oublier `type=` sur un argument numérique (reste une chaîne). Omettre `required=True` sur `add_subparsers()` : `args.command` peut rester `None` sans erreur immédiate. |
| **Bonnes pratiques** | Toujours fournir `help=` sur chaque argument. Rendre `main()` testable en acceptant `argv` en paramètre plutôt que de lire `sys.argv` directement. |
