---
order: 1
---

# Les variables et types de base

Python est **dynamiquement typé** : une variable n'a pas de type déclaré à l'avance, elle prend simplement le type de la valeur qui lui est assignée — et peut changer de type librement au cours du programme (contrairement à PHP ou C où le type d'une propriété/variable typée reste fixe une fois déclaré).

## Déclarer une variable

```python
age = 25            # int
prix = 9.99          # float
nom = "Devpedia"      # str
actif = True          # bool
rien = None           # équivalent de null/NULL

age = "vingt-cinq"    # parfaitement valide : age devient un str, sans rien déclarer
```

> **Note :** contrairement à PHP (`$variable`), Python n'utilise aucun symbole particulier pour désigner une variable — juste un nom, en minuscules avec des underscores par convention (`nom_utilisateur`, pas `nomUtilisateur`).

## Vérifier le type d'une variable

```python
type(age)             # <class 'int'>
isinstance(age, int)   # True -> préféré à type() == int pour les vérifications conditionnelles
```

## Les opérateurs

```python
a, b = 5, 3   # affectation multiple en une seule ligne

a + b    # 8
a - b    # 2
a * b    # 15
a / b     # 1.6666... -> division réelle, toujours un float
a // b    # 1 -> division entière (floor division)
a % b     # 2 -> modulo
a ** b    # 125 -> puissance

a == b    # False
a != b    # True
a and b   # ET logique (pas '&&')
a or b    # OU logique (pas '||')
not a     # NON logique (pas '!')
```

> **Note :** Python utilise les mots-clés `and`/`or`/`not` plutôt que les symboles `&&`/`||`/`!` retrouvés en PHP, JavaScript ou C.

## Les f-strings : insérer des variables dans du texte

```python
nom = "Jean"
age = 25

print(f"{nom} a {age} ans")           # Jean a 25 ans
print(f"Dans 10 ans : {age + 10} ans") # une vraie expression, pas juste une variable
```

Les f-strings (préfixe `f` avant les guillemets) sont la méthode moderne recommandée, remplaçant `"{} a {} ans".format(nom, age)` ou la concaténation avec `+`.

## Immutabilité des chaînes de caractères

Comme en PHP, une chaîne Python est **immuable** : toute "modification" crée en réalité une nouvelle chaîne, elle ne modifie jamais l'originale en mémoire.

```python
texte = "bonjour"
texte.upper()      # renvoie "BONJOUR", NE MODIFIE PAS texte
print(texte)        # toujours "bonjour"

texte = texte.upper()  # il faut réassigner pour "garder" le changement
```

## Résumé des types de base

| Type | Exemple | Équivalent PHP |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texte"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

Voir aussi les chapitres sur les listes/tuples et les dictionnaires/ensembles pour les structures de données composites.
