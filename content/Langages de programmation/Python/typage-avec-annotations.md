---
title: Le typage avec les annotations
---

Python reste **dynamiquement typé** même avec des annotations de type : contrairement à PHP (cf. chapitre sur les fonctions typées en PHP), où un type déclaré est vérifié et appliqué **à l'exécution**, les annotations Python ne sont que des indications **facultatives**, jamais vérifiées par l'interpréteur lui-même.

## Annoter des variables et des fonctions

```python
age: int = 25
nom: str = "Jean"

def addition(a: int, b: int) -> int:
    return a + b

addition("deux", "trois")   # AUCUNE erreur au lancement : Python exécute quand même, sans vérifier les types
```

> **Note :** contrairement à PHP où `function f(int $x): int` lève un `TypeError` si on passe autre chose qu'un entier, les annotations Python sont de la pure documentation pour un humain (ou un outil externe) — l'interpréteur ne les fait respecter à aucun moment.

## Types composés avec le module `typing`

```python
from typing import Optional, List, Dict, Union

def trouver_utilisateur(id: int) -> Optional[dict]:   # dict OU None
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def traiter_notes(notes: List[int]) -> float:          # liste d'entiers
    return sum(notes) / len(notes)

def config() -> Dict[str, Union[str, int]]:            # dict dont les valeurs sont str OU int
    return {"nom": "app", "version": 2}
```

> **Note :** depuis Python 3.9+, `list[int]`/`dict[str, int]` (les types natifs directement, en minuscules) remplacent `List[int]`/`Dict[str, int]` du module `typing` pour ces cas simples — `typing` reste nécessaire pour des constructions comme `Optional`/`Union`.

## `mypy` : faire respecter les annotations malgré tout

Puisque Python n'applique jamais ses propres annotations, un outil externe comme `mypy` analyse le code **avant** exécution et signale les incohérences de type, un peu comme un compilateur le ferait pour un langage statiquement typé :

```bash
pip install mypy
mypy mon_script.py
# mon_script.py:5: error: Argument 1 to "addition" has incompatible type "str"; expected "int"
```

## Pourquoi annoter malgré tout

- Documentation directement lisible dans le code, sans dépendre de commentaires à jour manuellement.
- Meilleure autocomplétion et détection d'erreurs dans l'éditeur (VS Code, PyCharm...), avant même de lancer `mypy` ou le programme.
- Base indispensable pour des projets Python de grande taille, où l'absence de vérification de type peut rendre les refactorisations risquées sans cette aide.
