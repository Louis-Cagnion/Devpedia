---
order: 12
---

# Les dataclasses

Une classe [ordinaire](/?c=langages-de-programmation&s=python&p=poo) dont le rôle se limite à regrouper quelques valeurs (un point, un enregistrement, le résultat d'un calcul) oblige quand même à écrire `__init__`, souvent `__repr__` et `__eq__`, à la main, pour un résultat purement mécanique : recopier chaque paramètre dans `self`, afficher les valeurs, comparer champ par champ. Le décorateur `@dataclass` (module `dataclasses`, natif depuis Python 3.7) génère ce code automatiquement à partir des [annotations de type](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) des champs.

## Avant/après : le même `Point` que dans le chapitre POO

```python
# Version classique (voir La programmation orientée objet)
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

    def __eq__(self, autre):
        return self.x == autre.x and self.y == autre.y
```

```python
# Version dataclass : équivalente, sans écrire __init__/__repr__/__eq__ à la main
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p1 = Point(1, 2)
p2 = Point(1, 2)

print(p1)        # Point(x=1, y=2)  -> __repr__ généré automatiquement
print(p1 == p2)  # True             -> __eq__ généré automatiquement, comparaison champ par champ
```

Chaque ligne `x: int` déclare à la fois un champ **et** son type : `@dataclass` lit ces annotations pour construire `__init__(self, x, y)` automatiquement, dans l'ordre où les champs sont déclarés.

| Généré automatiquement | Rôle |
|---|---|
| `__init__` | Un paramètre par champ déclaré, dans l'ordre |
| `__repr__` | Affichage lisible : `NomClasse(champ1=valeur1, champ2=valeur2...)` |
| `__eq__` | Compare deux instances champ par champ |

> **Note :** `@dataclass` ne génère **pas** `__lt__`/`__gt__` (comparaison d'ordre, pour trier des instances) par défaut : ajouter `@dataclass(order=True)` si les instances doivent être triables entre elles (l'ordre de comparaison suit alors celui des champs, de gauche à droite).

## `frozen=True` : des instances immuables

Un cas d'usage très courant : représenter le résultat figé d'un calcul ou d'une extraction (un enregistrement lu depuis un fichier, une ligne de résultat), qui n'a aucune raison de changer une fois créé. `frozen=True` interdit toute modification après la construction :

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class TextBlock:
    page: int
    texte: str

bloc = TextBlock(page=1, texte="Bonjour")
bloc.texte = "Modifié"   # FrozenInstanceError : impossible de modifier un champ après création
```

Un dataclass `frozen=True` devient aussi **hachable** (utilisable comme clé de `dict` ou élément d'un `set`) dès que tous ses champs le sont eux-mêmes, contrairement à un dataclass ordinaire (mutable, donc non hachable par défaut) : une conséquence directe du même principe qu'un [tuple hachable mais une liste ne l'est pas](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles).

> **Piège :** `frozen=True` protège les champs eux-mêmes contre une réassignation, mais pas le **contenu** d'un champ mutable. Un champ `frozen` qui contient une liste reste une liste ordinaire : sa référence ne peut pas changer, mais son contenu, si.

```python
@dataclass(frozen=True)
class Groupe:
    membres: list

g = Groupe(membres=["Alice"])
g.membres = ["Bob"]      # FrozenInstanceError : le champ lui-même est protégé
g.membres.append("Bob")  # fonctionne sans erreur : la LISTE, elle, reste mutable
```

> **Bonne pratique :** pour une immutabilité réellement complète, utiliser des types eux-mêmes immuables pour les champs (un [tuple](/?c=langages-de-programmation&s=python&p=listes-et-tuples) plutôt qu'une liste), pas seulement `frozen=True` sur la classe englobante.

## Valeurs par défaut : `field(default_factory=...)`

Une dataclass reste soumise au même [piège des valeurs par défaut mutables](/?c=langages-de-programmation&s=python&p=fonctions) qu'une fonction ordinaire : `@dataclass` le détecte même à la définition de la classe et refuse de démarrer plutôt que de laisser un bug silencieux s'installer :

```python
from dataclasses import dataclass, field

@dataclass
class Panier:
    articles: list = []   # ValueError levée à la définition de la classe : liste mutable interdite comme défaut direct

@dataclass
class Panier:
    articles: list = field(default_factory=list)   # correct : une NOUVELLE liste à chaque instance

p1 = Panier()
p2 = Panier()
p1.articles.append("pomme")
print(p2.articles)   # [] -> bien indépendante de p1, contrairement au piège des fonctions
```

`field(default_factory=fonction)` appelle `fonction()` (ici `list`, donc `list()`) à chaque nouvelle instance plutôt qu'une seule fois à la définition de la classe : c'est ce qui évite le partage involontaire.

## Quand une dataclass suffit, quand une classe classique s'impose

| | Dataclass | Classe classique |
|---|---|---|
| Rôle principal | Regrouper des données, avec peu ou pas de logique propre | Encapsuler un comportement riche, des invariants à faire respecter |
| `__init__`/`__repr__`/`__eq__` | Générés automatiquement | Écrits à la main (ou explicitement personnalisés) |
| Ajouter une méthode | Toujours possible, une dataclass reste une classe ordinaire | Cas d'usage normal |

Une dataclass reste une classe Python à part entière : rien n'empêche d'y ajouter des méthodes, des `@property`, ou de la faire hériter d'une autre classe, exactement comme pour une classe déclarée classiquement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `@dataclass` génère `__init__`/`__repr__`/`__eq__` à partir des champs annotés d'une classe, évitant ce code répétitif pour une classe qui ne fait que regrouper des données. `frozen=True` rend les instances immuables (et hachables). |
| **Outils utilisables** | `@dataclass`, `@dataclass(frozen=True)`, `@dataclass(order=True)` pour le tri, `field(default_factory=...)` pour une valeur par défaut mutable. |
| **Pièges à éviter** | Croire que `frozen=True` protège aussi le contenu d'un champ mutable (une liste reste modifiable). Donner directement une liste/dict comme valeur par défaut d'un champ. |
| **Bonnes pratiques** | Utiliser un type lui-même immuable (tuple) pour un vrai gel complet. Toujours passer par `field(default_factory=...)` pour une valeur par défaut mutable. Réserver la dataclass aux classes majoritairement porteuses de données. |
