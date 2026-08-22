---
order: 4
---

# Être efficace sur le code grâce aux raccourcis clavier

Une fois [VS Code](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) installé, la souris reste utilisable pour tout, mais chaque aller-retour vers elle coûte un temps qu'un raccourci clavier économise. Ce chapitre couvre les raccourcis de VS Code les plus utiles au quotidien ; sur macOS, `Ctrl` devient `Cmd` pour la plupart d'entre eux.

## Se déplacer dans l'arbre du projet

| Raccourci | Action |
|---|---|
| `Ctrl+Maj+E` | Ouvrir/fermer l'explorateur de fichiers (l'arbre du projet, sur le côté) |
| `Ctrl+P` | Ouvrir un fichier par son nom, sans naviguer dans l'arbre à la souris |
| Flèches haut/bas dans l'explorateur | Se déplacer d'un fichier/dossier au suivant |
| Flèche droite/gauche sur un dossier | Déplier/replier ce dossier |

`Ctrl+P` fait gagner le plus de temps au quotidien : taper quelques lettres du nom d'un fichier l'ouvre directement, sans jamais déplier l'arborescence à la main pour le retrouver.

## Se déplacer rapidement dans un fichier

| Raccourci | Action |
|---|---|
| `Ctrl+G` | Aller directement à un numéro de ligne |
| `Ctrl+Maj+O` | Aller à un symbole du fichier (une fonction, une classe...) par son nom |
| `Ctrl+Flèche gauche/droite` | Sauter d'un mot au suivant/précédent, plutôt qu'un caractère à la fois |
| `Ctrl+Haut/Bas` (ou `Alt+Flèche` selon la disposition) | Sauter d'un bloc de code au suivant/précédent |

`Ctrl+Maj+O` s'appuie sur la même analyse du code que la [détection d'erreur d'un IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) : VS Code sait déjà où commence chaque fonction ou classe du fichier, ce raccourci se contente d'y sauter directement plutôt que de faire défiler le fichier à l'œil.

## Sélection multiple et multi-curseur

Le multi-curseur place plusieurs points d'insertion actifs en même temps : une frappe au clavier s'applique alors à tous les curseurs à la fois, plutôt qu'un seul.

```text
Avant (1 curseur)              Apres Alt+Clic x3 (3 curseurs)

nom = "Alice"                  nom = "Alice"
nom2 = "Bob"                   nom2 = "Bob"
nom3 = "Eve"                   nom3 = "Eve"
                                 ^ chaque | represente un curseur actif
```

| Raccourci | Action |
|---|---|
| `Alt+Clic` | Ajouter un curseur à l'endroit cliqué |
| `Ctrl+D` | Sélectionner l'occurrence suivante du mot déjà sélectionné (répéter pour en sélectionner plusieurs d'un coup) |
| `Ctrl+Maj+L` | Sélectionner **toutes** les occurrences du mot déjà sélectionné dans le fichier |
| `Ctrl+Alt+Haut/Bas` | Ajouter un curseur directement au-dessus/en dessous du curseur actuel |

> **Piège :** utiliser un `Ctrl+D` répété pour renommer une variable partout où elle apparaît dans le fichier. C'est un renommage **textuel**, à l'aveugle : ça touche aussi un nom de variable qui contiendrait le même texte par coïncidence dans un commentaire ou une chaîne de caractères.
>
> **Bonne pratique :** pour renommer une variable partout où elle est réellement utilisée dans le code (sans toucher les commentaires ou coïncidences textuelles), utiliser le renommage de symbole de l'IDE (`F2` dans VS Code) plutôt que le multi-curseur.

## Gérer les onglets de fichiers ouverts

| Raccourci | Action |
|---|---|
| `Ctrl+W` | Fermer l'onglet actif |
| `Ctrl+Maj+T` | Rouvrir le dernier onglet fermé |
| `Ctrl+Tab` | Passer à l'onglet suivant |
| `Ctrl+K` puis `Ctrl+W` | Fermer tous les onglets ouverts |

## Aperçu Markdown

Pour un fichier `.md` (comme celui-ci), `Ctrl+Maj+V` ouvre un aperçu affichant le rendu final (titres, tableaux, liens) à côté du texte source, sans quitter l'éditeur pour vérifier la mise en forme.

## La palette de commandes : au-delà des raccourcis fixes

`Ctrl+Maj+P` ouvre la **palette de commandes** : une recherche textuelle qui donne accès à toute action de VS Code, y compris celles qui n'ont pas de raccourci clavier dédié.

> **Bonne pratique :** face à une action répétée dont le raccourci n'est pas connu par cœur, ouvrir la palette de commandes et taper quelques mots de ce qu'on cherche à faire, plutôt que de chercher à la souris dans les menus. La palette affiche aussi le raccourci associé à côté de chaque commande trouvée, ce qui aide à le mémoriser au fil de l'usage.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `Ctrl+P` ouvre un fichier par son nom, `Ctrl+Maj+O` saute à un symbole du fichier, `Alt+Clic`/`Ctrl+D` posent plusieurs curseurs pour éditer à plusieurs endroits d'un coup, `Ctrl+Maj+P` ouvre la palette de commandes qui donne accès à toute action de l'éditeur. |
| **Outils utilisables** | La palette de commandes (`Ctrl+Maj+P`) pour retrouver une action sans connaître son raccourci. |
| **Pièges à éviter** | Renommer une variable avec le multi-curseur (`Ctrl+D` répété) au lieu du renommage de symbole (`F2`) : ça touche aussi les coïncidences textuelles dans les commentaires et chaînes de caractères. |
| **Bonnes pratiques** | Utiliser `F2` pour un renommage de variable fiable. Consulter la palette de commandes pour découvrir et mémoriser progressivement les raccourcis. |
