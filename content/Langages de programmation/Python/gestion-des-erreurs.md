---
title: La gestion des erreurs
---

Python signale une erreur en levant une **exception**, qui interrompt l'exécution normale du programme sauf si elle est interceptée par un bloc `try`/`except` — un mécanisme similaire aux exceptions PHP modernes (`throw`/`catch`).

## `try` / `except`

```python
try:
    resultat = 10 / 0
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
```

## Intercepter plusieurs types d'exceptions

```python
try:
    nombre = int(input("Entrez un nombre : "))
    resultat = 10 / nombre
except ValueError:
    print("Ce n'est pas un nombre valide")
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
except Exception as erreur:   # attrape tout le reste -> à placer en DERNIER
    print(f"Erreur inattendue : {erreur}")
```

> **Note :** intercepter `Exception` de façon trop large (ou pire, un `except:` nu, sans type) masque des erreurs de programmation qui devraient plutôt faire planter le programme pour être corrigées — à réserver aux cas où l'échec est vraiment attendu et déjà géré juste après.

## `else` et `finally`

```python
try:
    fichier = open("donnees.txt")
except FileNotFoundError:
    print("Fichier introuvable")
else:
    print("Fichier ouvert avec succès")   # exécuté SEULEMENT si aucune exception n'a eu lieu
    fichier.close()
finally:
    print("Tentative terminée")            # exécuté DANS TOUS LES CAS, exception ou pas
```

`finally` sert typiquement à libérer une ressource (fermer un fichier, une connexion...) qu'il y ait eu erreur ou non.

## Lever ses propres exceptions

```python
def calculer_age(annee_naissance):
    if annee_naissance > 2026:
        raise ValueError("L'année de naissance ne peut pas être dans le futur")
    return 2026 - annee_naissance
```

## Créer une exception personnalisée

```python
class SoldeInsuffisantError(Exception):
    pass

def retirer(solde, montant):
    if montant > solde:
        raise SoldeInsuffisantError(f"Solde de {solde}€ insuffisant pour retirer {montant}€")
    return solde - montant

try:
    retirer(100, 150)
except SoldeInsuffisantError as erreur:
    print(erreur)
```

Une exception personnalisée hérite de `Exception` (ou d'une sous-classe plus précise), ce qui permet de la distinguer des autres dans un `except` ciblé, plutôt que de se reposer sur un message d'erreur générique.

## Le gestionnaire de contexte `with`

`with` garantit qu'une ressource est correctement libérée, **même en cas d'exception** — un fichier ouvert avec `with` se ferme toujours automatiquement à la sortie du bloc :

```python
with open("donnees.txt") as fichier:
    contenu = fichier.read()
# fichier.close() est appelé automatiquement ici, que tout se soit bien passé ou non
```

> **Note :** ceci repose sur les méthodes spéciales `__enter__`/`__exit__` (cf. chapitre sur la programmation orientée objet) — n'importe quelle classe personnalisée peut définir ces deux méthodes pour devenir utilisable avec `with` (ex. gérer l'ouverture/fermeture d'une connexion réseau ou base de données).
