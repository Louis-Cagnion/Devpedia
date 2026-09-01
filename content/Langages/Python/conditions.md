---
order: 2
---

# Les conditions

Python utilise `if`/`elif`/`else`, sans aucune accolade : c'est l'**indentation** elle-même qui délimite les blocs de code, contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php), C ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript).

## `if` / `elif` / `else`

```python
age = 20

if age >= 18:
    print("Vous êtes majeur.")
elif age >= 13:
    print("Vous êtes adolescent.")
else:
    print("Vous êtes enfant.")
```

> **Note :** `elif` (contraction de "else if") est le seul mot-clé pour enchaîner des conditions ; `else if` en deux mots n'existe pas en Python. L'indentation cohérente est **obligatoire** : un bloc mal indenté provoque une `IndentationError`, pas juste un avertissement.

## Les valeurs "truthy" et "falsy"

En dehors de `True`/`False`, Python considère automatiquement certaines valeurs comme fausses dans un contexte booléen (`if`, `while`...) :

```python
if []:      # False -> une liste vide est "falsy"
if "":      # False -> une chaîne vide est "falsy"
if 0:       # False -> zéro est "falsy"
if None:    # False
if [1, 2]:  # True -> une liste non vide est "truthy"
```

| Valeur | Truthy / Falsy |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (chaîne vide) | Falsy |
| `[]`, `{}`, `set()` (collections vides) | Falsy |
| `None` | Falsy |
| Tout le reste | Truthy |

```python
utilisateurs = []

if utilisateurs:                # préféré à "if len(utilisateurs) > 0:"
    print("Il y a des utilisateurs")
else:
    print("Aucun utilisateur")
```

## `and`/`or` renvoient une valeur, pas juste un booléen

```python
resume = "actif"
resultat = resume and "trouvé"    # "trouvé" -> resume est truthy, and renvoie SA DEUXIÈME opérande
resultat = "" and "trouvé"        # ""       -> "" est falsy, and s'arrête et renvoie SA PREMIÈRE opérande

surnom = ""
nom_affiche = surnom or "Anonyme"  # "Anonyme" -> or renvoie la première opérande truthy rencontrée
```

`and`/`or` ne recalculent jamais un `True`/`False` : ils renvoient l'une de leurs deux opérandes, sans évaluer l'autre au-delà du nécessaire (**évaluation en court-circuit**). `a and b` renvoie `a` si `a` est falsy (sans même évaluer `b`), sinon `b` ; `a or b` renvoie `a` si `a` est truthy, sinon `b`. Cet idiome permet un appel conditionnel (`connecte and deconnecter()`, n'appelle `deconnecter()` que si `connecte` est vrai) ou une valeur de repli (`nom = surnom or "Anonyme"`).

> **Piège :** ce raccourci reste peu lisible pour un simple test conditionnel classique ; le réserver à une expression (assignation, argument) pour une valeur de repli ou un appel conditionnel court, garder un `if` explicite partout ailleurs.

## L'opérateur ternaire

```python
age = 20
statut = "majeur" if age >= 18 else "mineur"
```

Contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php)/C/JS (`condition ? valeur_si_vrai : valeur_si_faux`), Python place la condition **au milieu** : `valeur_si_vrai if condition else valeur_si_faux`.

## L'opérateur "morse" (`:=`, depuis Python 3.8)

Permet d'assigner une variable **et** de l'utiliser dans une même expression, notamment dans une condition :

```python
# sans l'opérateur morse : la ligne "resultat" est calculée deux fois
if calculer_resultat() > 10:
    print(calculer_resultat())

# avec l'opérateur morse : calculée une seule fois, ET utilisable ensuite
if (resultat := calculer_resultat()) > 10:
    print(resultat)
```

## Pas de `switch` classique (avant Python 3.10)

Python n'a longtemps proposé aucun équivalent direct de `switch` ; une chaîne de `elif` ou un dictionnaire de correspondance faisait office d'alternative :

```python
def jour_semaine(jour):
    correspondance = {
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
    }
    return correspondance.get(jour, "Jour inconnu")
```

Depuis Python 3.10, `match`/`case` propose une syntaxe dédiée, plus proche d'un `switch` :

```python
match jour:
    case 1:
        print("Lundi")
    case 2:
        print("Mardi")
    case _:            # '_' : équivalent du "default" d'un switch
        print("Autre jour")
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `if`/`elif`/`else` structure le contrôle de flux, sans accolades : l'indentation délimite les blocs. Certaines valeurs (`0`, `""`, `[]`, `None`) sont "falsy" sans être `False`. |
| **Outils utilisables** | Opérateur ternaire (`x if cond else y`), opérateur morse (`:=`), `match`/`case` (Python 3.10+). |
| **Pièges à éviter** | Une indentation incohérente : cela provoque une `IndentationError`, pas un simple avertissement. |
| **Bonnes pratiques** | Tester directement `if collection:` plutôt que `if len(collection) > 0:`, en s'appuyant sur le comportement truthy/falsy. |
