---
title: Les décorateurs
---

Un **décorateur** enveloppe une fonction dans une autre, pour lui ajouter un comportement (chronométrage, journalisation, vérification de droits...) sans modifier son code — ce mécanisme s'appuie directement sur les fonctions de première classe et les closures (cf. chapitre sur les fonctions).

## Le principe, sans le sucre syntaxique

```python
def mon_decorateur(fonction):
    def enveloppe(*args, **kwargs):
        print("Avant l'appel")
        resultat = fonction(*args, **kwargs)
        print("Après l'appel")
        return resultat
    return enveloppe

def dire_bonjour(nom):
    print(f"Bonjour {nom}")

dire_bonjour = mon_decorateur(dire_bonjour)   # remplace la fonction par sa version enveloppée
dire_bonjour("Jean")
# Avant l'appel
# Bonjour Jean
# Après l'appel
```

## La syntaxe `@`

`@mon_decorateur` au-dessus d'une fonction est un simple raccourci pour `fonction = mon_decorateur(fonction)` :

```python
@mon_decorateur
def dire_bonjour(nom):
    print(f"Bonjour {nom}")

dire_bonjour("Jean")   # exactement le même résultat que l'exemple précédent
```

## Exemple pratique : chronométrer une fonction

```python
import time

def chronometrer(fonction):
    def enveloppe(*args, **kwargs):
        debut = time.time()
        resultat = fonction(*args, **kwargs)
        duree = time.time() - debut
        print(f"{fonction.__name__} a pris {duree:.4f}s")
        return resultat
    return enveloppe

@chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

calcul_long()   # calcul_long a pris 0.0834s
```

## Préserver les métadonnées avec `functools.wraps`

Sans précaution, la fonction décorée "perd" son nom et sa documentation d'origine, remplacés par ceux de la fonction d'enveloppe :

```python
print(calcul_long.__name__)   # "enveloppe" -> pas très utile pour déboguer
```

```python
from functools import wraps

def chronometrer(fonction):
    @wraps(fonction)   # préserve __name__, __doc__... de la fonction originale
    def enveloppe(*args, **kwargs):
        # ... même logique qu'avant ...
        return fonction(*args, **kwargs)
    return enveloppe

print(calcul_long.__name__)   # "calcul_long" -> corrigé
```

## Un décorateur avec ses propres arguments

Pour paramétrer un décorateur (ex. `@repeter(3)` plutôt que `@repeter`), un niveau d'imbrication supplémentaire est nécessaire :

```python
def repeter(nombre_de_fois):
    def decorateur(fonction):
        def enveloppe(*args, **kwargs):
            for _ in range(nombre_de_fois):
                resultat = fonction(*args, **kwargs)
            return resultat
        return enveloppe
    return decorateur

@repeter(3)
def saluer():
    print("Bonjour !")

saluer()   # affiche "Bonjour !" trois fois
```

`repeter(3)` renvoie d'abord `decorateur` (une fonction qui prend une fonction), qui est ensuite appliqué à `saluer` — d'où les trois niveaux de fonctions imbriquées.

## Décorateurs courants de la bibliothèque standard

| Décorateur | Rôle |
|---|---|
| `@property` | Transforme une méthode en attribut calculé (cf. chapitre sur la POO) |
| `@staticmethod` | Méthode qui n'a besoin ni de `self`, ni de la classe |
| `@classmethod` | Méthode qui reçoit la classe elle-même (`cls`) plutôt qu'une instance |
| `@functools.lru_cache` | Met en cache automatiquement le résultat d'une fonction pour des arguments déjà vus |
