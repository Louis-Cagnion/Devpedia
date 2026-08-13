---
order: 3
---

# Parsing incrémental par machine à états

[La regex](/?c=domain-specific-languages-dsl&p=regex) trouve des motifs dans du texte, mais reste aveugle à une **structure imbriquée** (une balise ouverte quelque part, refermée bien plus loin, avec d'autres balises entre les deux) : ce n'est pas ce pour quoi elle est faite. La solution la plus connue pour un format balisé comme [HTML](/?c=langages-de-balisage&s=html&p=html) (ou son cousin plus générique [**XML**](https://www.w3.org/XML/), *Extensible Markup Language*, qui suit les mêmes règles de balises imbriquées mais sans vocabulaire de balises prédéfini) est de construire un **arbre** complet en mémoire, le [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements), puis de le parcourir. Il existe une troisième voie, plus légère : le **parsing incrémental**, qui traite le texte au fil de l'eau, un événement à la fois, sans jamais construire de structure complète.

## Trois façons de lire un format balisé

| | Regex | Arbre (DOM) | Parsing incrémental |
|---|---|---|---|
| Principe | Chercher un motif de texte | Construire toute la structure en mémoire, puis la parcourir | Recevoir un événement par balise rencontrée (ouverture, texte, fermeture), au fil de la lecture |
| Mémoire utilisée | Minimale | Proportionnelle à la taille du document entier | Minimale : rien n'est jamais stocké au-delà de ce que le code choisit de garder |
| Comprend l'imbrication ? | Non | Oui, nativement (c'est un arbre) | Non nativement : c'est au code appelant de la reconstruire lui-même |
| Adapté à | Une recherche/un remplacement ponctuel | Un document qui tient confortablement en mémoire, à interroger dans plusieurs sens | Un très gros document, ou une structure simple qu'il est inutile de charger en entier |

Un parseur incrémental ne connaît jamais "tout le document" : il ne sait que ce qui se passe **maintenant**, plus ce que le code a explicitement choisi de mémoriser depuis le début. C'est cette contrainte qui lui donne son nom de **machine à états** : le programme doit maintenir lui-même un état ("suis-je actuellement à l'intérieur d'une ligne de tableau ? d'une cellule ?"), mis à jour à chaque événement reçu.

## `HTMLParser` : un exemple concret en Python

Le module standard `html.parser` fournit `HTMLParser`, une classe à hériter : trois méthodes, appelées automatiquement à chaque balise ou fragment de texte rencontré pendant la lecture.

```python
from html.parser import HTMLParser

class MonParseur(HTMLParser):
    def handle_starttag(self, tag, attrs):
        print(f"Ouverture : <{tag}> avec attributs {attrs}")

    def handle_endtag(self, tag):
        print(f"Fermeture : </{tag}>")

    def handle_data(self, data):
        if data.strip():
            print(f"Texte : {data.strip()!r}")

parseur = MonParseur()
parseur.feed("<p>Bonjour <b>tout le monde</b></p>")
```

```text
Ouverture : <p> avec attributs []
Texte : 'Bonjour'
Ouverture : <b> avec attributs [('class', None)]
Texte : 'tout le monde'
Fermeture : </b>
Fermeture : </p>
```

`feed()` peut être appelé plusieurs fois avec des morceaux successifs du document (utile pour un flux reçu petit à petit, par exemple depuis le réseau) : le parseur n'a besoin de rien connaître à l'avance de ce qui suit.

> **Note :** `HTMLParser` ne vérifie **aucune** cohérence de structure. Un `</p>` sans `<p>` correspondant, ou un tag jamais refermé, ne provoque aucune erreur : chaque `handle_*` est simplement appelé quand la balise correspondante est rencontrée, sans jugement sur la validité du document. C'est au code appelant de décider quoi faire d'un événement inattendu.

## Reconstruire une structure : maintenir l'état soi-même

`HTMLParser` transmet des événements, mais ne restitue jamais "la ligne d'un tableau" ou "la cellule courante" : ces notions n'existent qu'en construisant des variables d'instance mises à jour à chaque événement, exactement comme le fait un projet réel qui reconstruit un tableau HTML (`<table>`/`<tr>`/`<td>`) en une grille de cellules :

```python
class ParseurTableau(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lignes = []             # toutes les lignes complètes, une fois fermées
        self._ligne_courante = None  # None = "pas actuellement dans un <tr>"
        self._cellule_courante = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._ligne_courante = []
        elif tag in ("td", "th"):
            self._cellule_courante = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cellule_courante is not None:
            texte = "".join(self._cellule_courante).strip()
            self._ligne_courante.append(texte)
            self._cellule_courante = None
        elif tag == "tr" and self._ligne_courante is not None:
            self.lignes.append(self._ligne_courante)
            self._ligne_courante = None

    def handle_data(self, data):
        if self._cellule_courante is not None:
            self._cellule_courante.append(data)
```

- `self._ligne_courante` et `self._cellule_courante` sont l'**état** de cette machine à états : leur valeur (`None` ou une liste en cours de remplissage) détermine comment interpréter le prochain événement reçu.
- `handle_data` peut être appelé **plusieurs fois** pour un même texte (le module HTML sous-jacent découpe parfois le texte en plusieurs fragments, par exemple autour d'une entité comme `&amp;`) : c'est pour ça que `_cellule_courante` accumule dans une **liste** (`.append`), plutôt que d'écraser une simple variable à chaque appel.

> **Piège :** écraser l'état accumulé plutôt que l'étendre (`self._cellule_courante = data` au lieu de `self._cellule_courante.append(data)`). Si le texte d'une cellule arrive en plusieurs fragments, seul le dernier fragment survivrait, sans erreur visible : juste une cellule tronquée dans le résultat final.
>
> **Bonne pratique :** toujours accumuler (`append`/concaténation) le texte reçu par `handle_data`, jamais le remplacer, tant que la balise de fermeture correspondante n'est pas atteinte.

## Le cas difficile : les fusions (`rowspan`) qui traversent plusieurs lignes

Reconstruire la position exacte (ligne, colonne) de chaque cellule devient nettement plus délicat dès qu'une cellule a un `rowspan` : elle "occupe" sa colonne sur les lignes **suivantes**, qui n'ont pas encore été lues au moment où cette information est connue.

```text
Evenements recus dans l'ordre :         Grille reconstruite :
<tr><td rowspan="2">A</td><td>B</td></tr>   Ligne 0 : [A (col 0), B (col 1)]
<tr><td>C</td></tr>                          Ligne 1 : [A occupe encore col 0, C (col 1)]
```

Sur la ligne 1, le seul événement reçu est `<td>C</td>` : rien, dans cet événement isolé, ne dit à quelle colonne `C` doit atterrir. Il faut que le code se souvienne, depuis la ligne précédente, que la colonne 0 est encore "prise" par la cellule `A` pour un tour de plus :

```python
colonnes_occupees = {}  # {index de colonne: nombre de lignes restantes occupées par une fusion}

def placer_cellule(colonne_de_depart, rowspan, colonnes_occupees):
    colonne = colonne_de_depart
    while colonnes_occupees.get(colonne, 0) > 0:  # cette colonne est encore prise par une fusion précédente
        colonne += 1                              # -> décaler vers la première colonne réellement libre
    if rowspan > 1:
        colonnes_occupees[colonne] = rowspan
    return colonne
```

Avant de traiter chaque nouvelle ligne, chaque compteur de `colonnes_occupees` encore actif doit être décrémenté d'un cran (une ligne de plus vient d'être "consommée" par la fusion), et retiré une fois tombé à zéro.

> **Piège :** placer une cellule à sa position brute (0, 1, 2...) sans consulter les fusions encore actives héritées des lignes précédentes. La cellule suivante se retrouve alors sur la mauvaise colonne, un décalage qui se propage silencieusement à toute la fin de la ligne, sans qu'aucune erreur ne le signale.
>
> **Bonne pratique :** maintenir explicitement, colonne par colonne, le nombre de lignes restantes qu'une fusion verticale doit encore occuper, et faire "sauter" ces colonnes avant de placer chaque nouvelle cellule d'une ligne.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un parseur incrémental (`HTMLParser`) livre un événement par balise/texte rencontré, sans jamais construire de structure complète : c'est au code de maintenir son propre état (une machine à états) pour reconstruire du sens, ligne par ligne, cellule par cellule. |
| **Outils utilisables** | `html.parser.HTMLParser` (`handle_starttag`/`handle_endtag`/`handle_data`), un dictionnaire de colonnes occupées pour suivre les fusions (`rowspan`) qui traversent plusieurs lignes. |
| **Pièges à éviter** | Écraser un texte accumulé au lieu de l'étendre entre plusieurs appels à `handle_data`. Placer une cellule sans tenir compte des fusions actives héritées des lignes précédentes. |
| **Bonnes pratiques** | Toujours accumuler le texte reçu jusqu'à la balise de fermeture. Suivre explicitement, colonne par colonne, les fusions verticales encore actives avant de placer une nouvelle cellule. |
