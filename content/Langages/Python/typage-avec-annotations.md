---
order: 11
---

# Le typage avec les annotations

Python reste **dynamiquement typé** même avec des annotations de type : contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php) (voir [Les fonctions et méthodes les plus utiles](/?c=langages-de-programmation&s=php&p=methodes)), où un type déclaré est vérifié et appliqué **à l'exécution**, les annotations Python ne sont que des indications **facultatives**, jamais vérifiées par l'interpréteur lui-même.

## Annoter des variables et des fonctions

```python
age: int = 25
nom: str = "Jean"

def addition(a: int, b: int) -> int:
    return a + b

# AUCUNE erreur au lancement : Python exécute quand même, sans vérifier les types
addition("deux", "trois")
```

> **Note :** contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php) où `function f(int $x): int` lève un `TypeError` si on passe autre chose qu'un entier, les annotations Python sont de la pure documentation pour un humain (ou un outil externe) : l'interpréteur ne les fait respecter à aucun moment.

## Types composés avec le module `typing`

```python
from typing import Optional, List, Dict, Union

def trouver_utilisateur(id: int) -> Optional[dict]:   # dict OU None
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def traiter_notes(notes: List[int]) -> float:         # liste d'entiers
    return sum(notes) / len(notes)

def config() -> Dict[str, Union[str, int]]:           # dict dont les valeurs sont str OU int
    return {"nom": "app", "version": 2}
```

> **Note :** depuis Python 3.9+, `list[int]`/`dict[str, int]` (les types natifs directement, en minuscules) remplacent `List[int]`/`Dict[str, int]` du module `typing` pour ces cas simples ; `typing` reste nécessaire pour des constructions comme `Optional`/`Union`.

## Syntaxe moderne `X | None` (Python 3.10+)

Depuis Python 3.10 ([PEP 604](https://peps.python.org/pep-0604/)), l'opérateur `|` entre deux types remplace `Optional`/`Union` du module `typing`, directement sur les types eux-mêmes, sans import supplémentaire :

```python
def trouver_utilisateur(id: int) -> dict | None:   # remplace Optional[dict]
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def config() -> dict[str, str | int]:              # remplace Dict[str, Union[str, int]]
    return {"nom": "app", "version": 2}
```

| Ancienne syntaxe (`typing`) | Syntaxe moderne (3.10+) |
|---|---|
| `Optional[dict]` | `dict \| None` |
| `Union[str, int]` | `str \| int` |
| `Optional[Union[str, int]]` | `str \| int \| None` |

> **Note :** cette syntaxe ne remplace pas tout `typing` : des constructions comme `Callable`, `TypeVar` ou `Generic` restent nécessaires. Elle ne couvre que les cas jusqu'ici traités par `Optional`/`Union`.

## Alias de type : nommer une union pour la réutiliser

```python
ConfigValue = str | int | float  # alias de type, au niveau module

def config() -> dict[str, ConfigValue]:
    return {"nom": "app", "version": 2, "ratio": 1.5}

def valider(valeur: ConfigValue) -> bool:
    return valeur is not None
```

Une union longue et répétée dans plusieurs signatures peut être assignée une seule fois, au niveau module, à une variable nommée en PascalCase (ou préfixée `_` si privée au fichier) : cet **alias de type** se réutilise ensuite comme un type ordinaire (`dict[str, ConfigValue]`), sans répéter `str | int | float` à chaque fonction qui le manipule.

## Forward reference et `TYPE_CHECKING`

Une **forward reference** est une annotation de type écrite entre guillemets, qui référence un type pas encore défini à cet endroit du fichier (une classe qui se référence elle-même, ou un import qui créerait une boucle) :

```python
class Noeud:
    def __init__(self, valeur: int, suivant: "Noeud | None" = None):
        self.valeur = valeur
        # "Noeud" n'existe pas encore tant que sa propre définition n'est pas terminée
        self.suivant = suivant
```

> **Piège :** sans les guillemets (`suivant: Noeud | None`), Python lève une `NameError` immédiate à la lecture du fichier : une annotation de fonction est évaluée dès la définition de celle-ci, pas seulement lue par un outil externe comme `mypy`. Les guillemets la transforment en simple texte, résolu seulement quand un outil en a besoin.

Le bloc `if TYPE_CHECKING:` sert le même besoin entre deux fichiers : importer un type uniquement pour l'annotation, sans provoquer d'import circulaire au lancement du programme :

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:   # jamais vrai à l'exécution : lu seulement par mypy et les éditeurs
    from autre_module import AutreClasse

def traiter(objet: "AutreClasse") -> None:
    ...
```

| | `import` classique | `if TYPE_CHECKING:` |
|---|---|---|
| Exécuté au lancement du programme | Oui | Non |
| Lu par `mypy` / l'éditeur | Oui | Oui |
| Risque d'import circulaire | Oui, si les deux fichiers s'importent mutuellement | Non |

## `mypy` : faire respecter les annotations malgré tout

Puisque Python n'applique jamais ses propres annotations, un outil externe comme `mypy` analyse le code **avant** exécution et signale les incohérences de type, un peu comme un compilateur le ferait pour un langage statiquement typé :

```bash
pip install mypy
mypy mon_script.py
# mon_script.py:5: error: Argument 1 to "addition" has incompatible type "str"; expected "int"
```

## Pourquoi annoter malgré tout

- Documentation directement lisible dans le code, sans dépendre de commentaires à jour manuellement.
- Meilleure autocomplétion et détection d'erreurs dans l'éditeur ([VS Code](https://code.visualstudio.com), [PyCharm](https://www.jetbrains.com/pycharm/)...), avant même de lancer `mypy` ou le programme.
- Base indispensable pour des projets Python de grande taille, où l'absence de vérification de type peut rendre les refactorisations risquées sans cette aide.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les annotations de type Python (`x: int`, `-> str`) sont purement documentaires : jamais vérifiées par l'interpréteur, contrairement à un langage à typage statique ou même à [PHP](/?c=langages-de-programmation&s=php&p=php). |
| **Outils utilisables** | Le module `typing` (`Optional`, `Union`, `List`, `TYPE_CHECKING`...), la syntaxe `X \| None` (3.10+), les alias de type pour nommer une union réutilisée, `mypy` pour une vérification externe. |
| **Pièges à éviter** | Croire qu'une annotation empêche réellement de passer une valeur du mauvais type : rien ne l'empêche à l'exécution. Oublier les guillemets d'une forward reference (`NameError` immédiate). |
| **Bonnes pratiques** | Annoter systématiquement un projet de taille significative, et faire tourner `mypy` en complément pour détecter les incohérences avant l'exécution. Utiliser `if TYPE_CHECKING:` pour éviter un import circulaire causé par une seule annotation de type. |
