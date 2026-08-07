---
order: 6
---

# Les fonctions

Une fonction Python se déclare avec `def`. Les fonctions sont des **objets de première classe** : elles peuvent être stockées dans une variable, passées en argument à une autre fonction, ou renvoyées par une fonction — exactement comme n'importe quelle autre valeur.

## Déclarer et appeler une fonction

```python
def addition(a, b):
    return a + b

resultat = addition(2, 3)   # 5
```

## Paramètres par défaut

```python
def saluer(nom, message="Bonjour"):
    return f"{message} {nom}"

saluer("Jean")               # "Bonjour Jean"
saluer("Jean", "Salut")       # "Salut Jean"
```

> **Piège classique : ne jamais utiliser un objet mutable (liste, dict) comme valeur par défaut.** La valeur par défaut n'est évaluée **qu'une seule fois**, à la définition de la fonction — pas à chaque appel :

```python
def ajouter_a_liste(element, liste=[]):  # DANGER : cette liste est PARTAGÉE entre tous les appels
    liste.append(element)
    return liste

ajouter_a_liste(1)   # [1]
ajouter_a_liste(2)   # [1, 2] -> pas [2] ! la même liste par défaut a été réutilisée
```

La bonne pratique :

```python
def ajouter_a_liste(element, liste=None):
    if liste is None:
        liste = []   # une NOUVELLE liste, créée à chaque appel
    liste.append(element)
    return liste
```

## `*args` et `**kwargs` : un nombre variable d'arguments

```python
def somme(*nombres):          # *args : regroupe les arguments positionnels en excès dans un tuple
    return sum(nombres)

somme(1, 2, 3, 4)   # 10

def afficher_infos(**options):  # **kwargs : regroupe les arguments nommés en excès dans un dict
    for cle, valeur in options.items():
        print(f"{cle} : {valeur}")

afficher_infos(nom="Jean", age=25)
```

## Arguments uniquement par mot-clé

Un `*` seul dans la signature force tout ce qui suit à être passé par nom, jamais par position :

```python
def creer_utilisateur(nom, *, email, actif=True):
    return {"nom": nom, "email": email, "actif": actif}

creer_utilisateur("Jean", email="jean@exemple.com")   # OK
creer_utilisateur("Jean", "jean@exemple.com")           # TypeError : email doit être nommé
```

## Les fonctions lambda

Une fonction anonyme, limitée à une seule expression (pas de `return` explicite, pas de bloc multi-lignes) :

```python
double = lambda x: x * 2
double(5)   # 10

# usage typique : en argument d'une fonction qui attend un callback
nombres = [5, 2, 8, 1]
nombres_tries = sorted(nombres, key=lambda x: -x)  # tri décroissant
```

## Closures et `nonlocal`

Une fonction imbriquée peut lire les variables de la fonction englobante — pour les **modifier**, `nonlocal` est nécessaire :

```python
def compteur():
    total = 0

    def incrementer():
        nonlocal total   # sans ceci, "total += 1" créerait une nouvelle variable LOCALE à incrementer()
        total += 1
        return total

    return incrementer

compter = compteur()
compter()   # 1
compter()   # 2 -> "total" a bien été conservé entre les appels
```

Voir aussi [Les décorateurs](/?c=langages-de-programmation&s=python&p=decorateurs), qui s'appuie directement sur ce mécanisme de closure.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une fonction Python est un objet de première classe (stockable, passable en argument). `*args`/`**kwargs` gèrent un nombre variable d'arguments ; une closure conserve l'accès aux variables de sa fonction englobante. |
| **Outils utilisables** | Paramètres par défaut, arguments uniquement par mot-clé (`*`), lambdas, `nonlocal`. |
| **Pièges à éviter** | Utiliser un objet mutable (liste, dict) comme valeur par défaut — elle est partagée entre tous les appels, pas recréée à chaque fois. |
| **Bonnes pratiques** | Utiliser `None` comme valeur par défaut pour un paramètre mutable, puis créer l'objet réel à l'intérieur de la fonction. |
